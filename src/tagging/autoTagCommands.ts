import * as vscode from 'vscode';
import * as path from 'path';
import { tagGenerator } from './TagGenerator';
import { tagManager } from './TagManager';
import { NoteTag } from './TagParser';
import { getNotesPath, getFileFormat } from '../services/configService';

/**
 * Auto-tagging command handlers
 */

/**
 * Generate tags for the currently active note
 */
export async function generateTagsForActiveNote(): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showInformationMessage('No note is currently open.');
        return;
    }

    const filePath = editor.document.uri.fsPath;
    const notesPath = getNotesPath();

    if (!notesPath || !filePath.startsWith(notesPath)) {
        vscode.window.showInformationMessage('Please open a note file from your notes folder.');
        return;
    }

    await generateTagsForFile(filePath);
}

/**
 * Generate tags for a specific note (used from context menu)
 */
export async function generateTagsForNote(noteUri?: vscode.Uri): Promise<void> {
    if (!noteUri) {
        await generateTagsForActiveNote();
        return;
    }

    await generateTagsForFile(noteUri.fsPath);
}

/**
 * Core function to generate tags for a file
 */
async function generateTagsForFile(filePath: string): Promise<void> {
    try {
        // Check if tagging is enabled
        const config = vscode.workspace.getConfiguration('noted');
        const taggingEnabled = config.get<boolean>('tagging.enabled', true);

        if (!taggingEnabled) {
            vscode.window.showInformationMessage('Auto-tagging is disabled. Enable it in settings.');
            return;
        }

        // Show progress
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Generating tags...',
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0 });

            // Read file content
            const document = await vscode.workspace.openTextDocument(filePath);
            const content = document.getText();

            progress.report({ increment: 30, message: 'Analyzing content with AI...' });

            // Generate tags using AI
            const suggestedTags = await tagGenerator.generateTags(content, filePath);

            if (suggestedTags.length === 0) {
                vscode.window.showInformationMessage('No tags could be generated for this note.');
                return;
            }

            progress.report({ increment: 60, message: 'Tags generated' });

            // Show quick pick for user to review and select tags
            const selectedTags = await showTagSelectionQuickPick(suggestedTags);

            if (!selectedTags || selectedTags.length === 0) {
                vscode.window.showInformationMessage('No tags selected.');
                return;
            }

            progress.report({ increment: 80, message: 'Applying tags...' });

            // Apply selected tags
            await tagManager.tagNote(filePath, selectedTags, true);

            progress.report({ increment: 100 });

            vscode.window.showInformationMessage(
                `Successfully tagged with: ${selectedTags.map(t => t.name).join(', ')}`
            );

            // Refresh tags panel to show new tags
            await vscode.commands.executeCommand('noted.refreshTags');
        });

    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('Copilot')) {
                vscode.window.showErrorMessage(
                    'GitHub Copilot is required for auto-tagging. Please sign in to use this feature.',
                    'Learn More'
                ).then(selection => {
                    if (selection === 'Learn More') {
                        vscode.env.openExternal(vscode.Uri.parse('https://copilot.github.com/'));
                    }
                });
            } else {
                vscode.window.showErrorMessage(`Failed to generate tags: ${error.message}`);
            }
        }
    }
}

/**
 * Show quick pick for tag selection with confidence scores
 */
async function showTagSelectionQuickPick(tags: NoteTag[]): Promise<NoteTag[] | undefined> {
    interface TagQuickPickItem extends vscode.QuickPickItem {
        tag: NoteTag;
    }

    const items: TagQuickPickItem[] = tags.map(tag => ({
        label: `#${tag.name}`,
        description: `${Math.round(tag.confidence * 100)}% confidence`,
        detail: tag.source === 'ai' ? 'AI suggested' : 'Manual',
        picked: tag.confidence > 0.8, // Auto-select high confidence tags
        tag
    }));

    const selected = await vscode.window.showQuickPick(items, {
        canPickMany: true,
        title: 'Select tags to add',
        placeHolder: 'Choose which tags to apply to this note'
    });

    return selected?.map(item => item.tag);
}

/**
 * Batch generate tags for all notes
 */
export async function tagAllNotes(): Promise<void> {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Notes folder not configured.');
        return;
    }

    // Check if tagging is enabled
    const config = vscode.workspace.getConfiguration('noted');
    const taggingEnabled = config.get<boolean>('tagging.enabled', true);

    if (!taggingEnabled) {
        vscode.window.showInformationMessage('Auto-tagging is disabled. Enable it in settings.');
        return;
    }

    // Get all note files
    const noteFiles = await getAllNoteFiles();

    if (noteFiles.length === 0) {
        vscode.window.showInformationMessage('No notes found to tag.');
        return;
    }

    // Show options
    const option = await vscode.window.showQuickPick([
        {
            label: 'Tag only untagged notes',
            description: 'Only add tags to notes that don\'t have any tags yet',
            value: 'untagged'
        },
        {
            label: 'Re-tag all notes',
            description: 'Generate and add tags to all notes, merging with existing tags',
            value: 'all'
        }
    ], {
        title: 'Batch Tagging Options',
        placeHolder: 'Choose how to tag notes'
    });

    if (!option) {
        return;
    }

    // Confirm
    const confirm = await vscode.window.showWarningMessage(
        `Tag ${noteFiles.length} notes? This may take several minutes.`,
        { modal: true },
        'Tag Notes'
    );

    if (confirm !== 'Tag Notes') {
        return;
    }

    // Process notes
    let tagged = 0;
    let skipped = 0;
    let failed = 0;

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Tagging notes...',
        cancellable: true
    }, async (progress, token) => {
        for (let i = 0; i < noteFiles.length; i++) {
            if (token.isCancellationRequested) {
                vscode.window.showInformationMessage('Batch tagging cancelled.');
                return;
            }

            const filePath = noteFiles[i];
            const fileName = path.basename(filePath);

            progress.report({
                increment: (100 / noteFiles.length),
                message: `${i + 1}/${noteFiles.length}: ${fileName}`
            });

            try {
                // Check if note already has tags
                if (option.value === 'untagged') {
                    const existingTags = await tagManager.getNoteTags(filePath);
                    if (existingTags.length > 0) {
                        skipped++;
                        continue;
                    }
                }

                // Read content
                const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
                const textContent = Buffer.from(content).toString('utf8');

                // Generate tags
                const suggestedTags = await tagGenerator.generateTags(textContent, filePath);

                if (suggestedTags.length > 0) {
                    // Auto-apply tags with confidence > 0.7
                    const highConfidenceTags = suggestedTags.filter(t => t.confidence > 0.7);

                    if (highConfidenceTags.length > 0) {
                        await tagManager.tagNote(filePath, highConfidenceTags, true);
                        tagged++;
                    } else {
                        skipped++;
                    }
                } else {
                    skipped++;
                }

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                console.error(`Error tagging ${filePath}:`, error);
                failed++;
            }
        }
    });

    // Show summary
    vscode.window.showInformationMessage(
        `Batch tagging complete: ${tagged} tagged, ${skipped} skipped, ${failed} failed`
    );

    // Refresh tags panel to show new tags
    await vscode.commands.executeCommand('noted.refreshTags');
}

/**
 * Manage tags for the current note (manual editing)
 */
export async function manageNoteTags(): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showInformationMessage('No note is currently open.');
        return;
    }

    const filePath = editor.document.uri.fsPath;
    const notesPath = getNotesPath();

    if (!notesPath || !filePath.startsWith(notesPath)) {
        vscode.window.showInformationMessage('Please open a note file from your notes folder.');
        return;
    }

    try {
        // Get existing tags
        const existingTags = await tagManager.getNoteTags(filePath);
        const existingTagNames = new Set(existingTags.map(t => t.name));

        // Get AI suggestions
        const content = editor.document.getText();
        let suggestedTags: NoteTag[] = [];

        try {
            suggestedTags = await tagGenerator.generateTags(content, filePath);
            // Filter out tags that already exist
            suggestedTags = suggestedTags.filter(t => !existingTagNames.has(t.name));
        } catch (error) {
            // Continue without suggestions if AI fails
            console.error('Failed to get AI suggestions:', error);
        }

        // Build quick pick items
        interface TagQuickPickItem extends vscode.QuickPickItem {
            tag: NoteTag;
            isExisting: boolean;
        }

        const items: TagQuickPickItem[] = [
            // Existing tags (pre-selected)
            ...existingTags.map(tag => ({
                label: `#${tag.name}`,
                description: 'Current tag',
                detail: `Added ${tag.addedAt.toLocaleDateString()}`,
                picked: true,
                tag,
                isExisting: true
            })),
            // Suggested tags (not selected)
            ...suggestedTags.map(tag => ({
                label: `#${tag.name}`,
                description: `${Math.round(tag.confidence * 100)}% confidence`,
                detail: 'AI suggested',
                picked: false,
                tag,
                isExisting: false
            }))
        ];

        // Add option to create custom tag
        const selected = await vscode.window.showQuickPick(items, {
            canPickMany: true,
            title: 'Manage Note Tags',
            placeHolder: 'Select tags (existing tags are pre-selected)'
        });

        if (selected === undefined) {
            return; // User cancelled
        }

        // Build final tag list
        const finalTags = selected.map(item => item.tag);

        // Apply tags (replace mode)
        await tagManager.tagNote(filePath, finalTags, false);

        vscode.window.showInformationMessage(
            `Tags updated: ${finalTags.map(t => t.name).join(', ') || 'none'}`
        );

        // Refresh tags panel to show updated tags
        await vscode.commands.executeCommand('noted.refreshTags');

    } catch (error) {
        vscode.window.showErrorMessage(
            `Failed to manage tags: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Add a custom tag manually
 */
export async function addCustomTag(): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showInformationMessage('No note is currently open.');
        return;
    }

    const filePath = editor.document.uri.fsPath;
    const notesPath = getNotesPath();

    if (!notesPath || !filePath.startsWith(notesPath)) {
        vscode.window.showInformationMessage('Please open a note file from your notes folder.');
        return;
    }

    const tagName = await vscode.window.showInputBox({
        prompt: 'Enter tag name',
        placeHolder: 'my-custom-tag',
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Tag name cannot be empty';
            }
            if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
                return 'Tag must be lowercase letters, numbers, and hyphens only';
            }
            return null;
        }
    });

    if (!tagName) {
        return;
    }

    try {
        const customTag: NoteTag = {
            name: tagName.toLowerCase(),
            confidence: 1.0,
            source: 'manual',
            addedAt: new Date()
        };

        await tagManager.tagNote(filePath, [customTag], true);
        vscode.window.showInformationMessage(`Added tag: #${tagName}`);

        // Refresh tags panel to show new tag
        await vscode.commands.executeCommand('noted.refreshTags');

    } catch (error) {
        vscode.window.showErrorMessage(
            `Failed to add tag: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Get all note files from the notes folder
 */
async function getAllNoteFiles(): Promise<string[]> {
    const notesPath = getNotesPath();
    if (!notesPath) {
        return [];
    }

    const fileFormat = getFileFormat();
    const pattern = new vscode.RelativePattern(notesPath, `**/*.${fileFormat}`);

    // Exclude templates folder
    const files = await vscode.workspace.findFiles(pattern, '**/.noted-templates/**');

    return files.map(uri => uri.fsPath);
}
