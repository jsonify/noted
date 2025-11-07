/**
 * Auto-tagging command handlers (Phase 4)
 * Commands for automatically tagging notes based on AI summary analysis
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { SummarizationService } from '../services/summarizationService';
import { AutoTagService } from '../services/autoTagService';
import { NoteItem } from '../providers/treeItems';
import { getNotesPath } from '../services/configService';
import { readDirectoryWithTypes } from '../services/fileSystemService';
import { formatTagForDisplay } from '../utils/tagHelpers';

/**
 * Get all notes modified since a given date
 */
async function getRecentNotes(notesPath: string, since: Date): Promise<string[]> {
    const notes: { path: string; mtime: number }[] = [];

    async function scanDirectory(dir: string): Promise<void> {
        try {
            const entries = await readDirectoryWithTypes(dir);

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    // Skip special folders
                    if (entry.name === '.noted-templates' || entry.name === '.archive') {
                        continue;
                    }
                    await scanDirectory(fullPath);
                } else if (entry.name.endsWith('.txt') || entry.name.endsWith('.md')) {
                    try {
                        const stat = await vscode.workspace.fs.stat(vscode.Uri.file(fullPath));
                        if (stat.mtime >= since.getTime()) {
                            notes.push({ path: fullPath, mtime: stat.mtime });
                        }
                    } catch (error) {
                        // Error stating file, skip it
                    }
                }
            }
        } catch (error) {
            // Error reading directory, skip it
        }
    }

    await scanDirectory(notesPath);

    // Sort by modification time (most recent first)
    notes.sort((a, b) => b.mtime - a.mtime);

    return notes.map(note => note.path);
}

/**
 * Prompt user to apply auto-generated tags from summary
 */
export async function promptForAutoTagging(
    autoTagService: AutoTagService,
    filePath: string,
    summary: string
): Promise<void> {
    try {
        const suggestion = await autoTagService.suggestTags(filePath, summary);

        if (suggestion.suggestedTags.length === 0) {
            vscode.window.showInformationMessage('No tags found in summary');
            return;
        }

        const newTags = suggestion.suggestedTags.filter(
            tag => !suggestion.currentTags.includes(tag)
        );

        if (newTags.length === 0) {
            vscode.window.showInformationMessage('All suggested tags are already in the note');
            return;
        }

        const message = `Apply ${newTags.length} suggested tag${newTags.length > 1 ? 's' : ''}: ${newTags.map(formatTagForDisplay).join(', ')}?`;

        const answer = await vscode.window.showInformationMessage(
            message,
            { modal: false },
            'Apply Tags',
            'Show Details'
        );

        if (answer === 'Apply Tags') {
            const result = await autoTagService.applyTags(filePath, suggestion.suggestedTags, 'append');
            if (result.success) {
                vscode.window.showInformationMessage(
                    `Added ${result.addedTags.length} tag${result.addedTags.length > 1 ? 's' : ''} to ${path.basename(filePath)}`
                );
            } else {
                vscode.window.showErrorMessage(`Failed to apply tags: ${result.error}`);
            }
        } else if (answer === 'Show Details') {
            const details = autoTagService.formatSuggestionForDisplay(suggestion);
            const detailAnswer = await vscode.window.showInformationMessage(
                details,
                { modal: true },
                'Apply Tags',
                'Cancel'
            );

            if (detailAnswer === 'Apply Tags') {
                const result = await autoTagService.applyTags(filePath, suggestion.suggestedTags, 'append');
                if (result.success) {
                    vscode.window.showInformationMessage(
                        `Added ${result.addedTags.length} tag${result.addedTags.length > 1 ? 's' : ''} to ${path.basename(filePath)}`
                    );
                } else {
                    vscode.window.showErrorMessage(`Failed to apply tags: ${result.error}`);
                }
            }
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to suggest tags: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handle auto-tagging a single note from its summary
 */
export async function handleAutoTagNote(
    summarizationService: SummarizationService,
    autoTagService: AutoTagService,
    noteItem: NoteItem
): Promise<void> {
    if (noteItem.type !== 'note') {
        vscode.window.showErrorMessage('Please select a note to auto-tag');
        return;
    }

    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Auto-tagging note...',
                cancellable: false
            },
            async (progress) => {
                progress.report({ message: 'Generating summary...' });

                // Generate summary with keywords
                const summary = await summarizationService.summarizeNote(noteItem.filePath, {
                    includeKeywords: true
                });

                progress.report({ message: 'Extracting tags...' });

                // Suggest tags
                const suggestion = await autoTagService.suggestTags(noteItem.filePath, summary);

                if (suggestion.suggestedTags.length === 0) {
                    vscode.window.showInformationMessage('No tags found in summary');
                    return;
                }

                const newTags = suggestion.suggestedTags.filter(
                    tag => !suggestion.currentTags.includes(tag)
                );

                if (newTags.length === 0) {
                    vscode.window.showInformationMessage('All suggested tags are already in the note');
                    return;
                }

                progress.report({ message: 'Applying tags...' });

                // Show preview and ask for confirmation
                const details = autoTagService.formatSuggestionForDisplay(suggestion);
                const answer = await vscode.window.showInformationMessage(
                    details,
                    { modal: true },
                    'Apply Tags',
                    'Cancel'
                );

                if (answer === 'Apply Tags') {
                    const result = await autoTagService.applyTags(
                        noteItem.filePath,
                        suggestion.suggestedTags,
                        'append'
                    );

                    if (result.success) {
                        vscode.window.showInformationMessage(
                            `Added ${result.addedTags.length} tag${result.addedTags.length > 1 ? 's' : ''}: ${result.addedTags.map(formatTagForDisplay).join(', ')}`
                        );
                    } else {
                        vscode.window.showErrorMessage(`Failed to apply tags: ${result.error}`);
                    }
                }
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to auto-tag note: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handle auto-tagging current note
 */
export async function handleAutoTagCurrentNote(
    summarizationService: SummarizationService,
    autoTagService: AutoTagService
): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No note is currently open');
        return;
    }

    const filePath = editor.document.uri.fsPath;
    const notesPath = getNotesPath();

    if (!notesPath || !filePath.startsWith(notesPath)) {
        vscode.window.showErrorMessage('Current file is not in the Notes folder');
        return;
    }

    if (!filePath.endsWith('.txt') && !filePath.endsWith('.md')) {
        vscode.window.showErrorMessage('Current file is not a note file');
        return;
    }

    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Auto-tagging note...',
                cancellable: false
            },
            async (progress) => {
                progress.report({ message: 'Generating summary...' });

                const summary = await summarizationService.summarizeNote(filePath, {
                    includeKeywords: true
                });

                progress.report({ message: 'Extracting tags...' });

                const suggestion = await autoTagService.suggestTags(filePath, summary);

                if (suggestion.suggestedTags.length === 0) {
                    vscode.window.showInformationMessage('No tags found in summary');
                    return;
                }

                const newTags = suggestion.suggestedTags.filter(
                    tag => !suggestion.currentTags.includes(tag)
                );

                if (newTags.length === 0) {
                    vscode.window.showInformationMessage('All suggested tags are already in the note');
                    return;
                }

                progress.report({ message: 'Applying tags...' });

                const details = autoTagService.formatSuggestionForDisplay(suggestion);
                const answer = await vscode.window.showInformationMessage(
                    details,
                    { modal: true },
                    'Apply Tags',
                    'Cancel'
                );

                if (answer === 'Apply Tags') {
                    const result = await autoTagService.applyTags(filePath, suggestion.suggestedTags, 'append');

                    if (result.success) {
                        vscode.window.showInformationMessage(
                            `Added ${result.addedTags.length} tag${result.addedTags.length > 1 ? 's' : ''}: ${result.addedTags.map(formatTagForDisplay).join(', ')}`
                        );
                    } else {
                        vscode.window.showErrorMessage(`Failed to apply tags: ${result.error}`);
                    }
                }
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to auto-tag note: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handle batch auto-tagging for recent notes
 */
export async function handleAutoTagBatch(
    summarizationService: SummarizationService,
    autoTagService: AutoTagService
): Promise<void> {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Notes folder not configured');
        return;
    }

    // Prompt for time period
    const period = await vscode.window.showQuickPick(
        [
            { label: 'This Week', value: 'week' },
            { label: 'This Month', value: 'month' },
            { label: 'Last 7 Days', value: '7days' },
            { label: 'All Untagged Notes', value: 'all' }
        ],
        {
            placeHolder: 'Select time period for batch auto-tagging'
        }
    );

    if (!period) {
        return;
    }

    try {
        let notePaths: string[] = [];

        switch (period.value) {
            case 'week': {
                const now = new Date();
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                notePaths = await getRecentNotes(notesPath, startOfWeek);
                break;
            }
            case 'month': {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                notePaths = await getRecentNotes(notesPath, startOfMonth);
                break;
            }
            case '7days': {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                notePaths = await getRecentNotes(notesPath, sevenDaysAgo);
                break;
            }
            case 'all': {
                // Get all notes (we'll filter untagged ones later)
                notePaths = await getRecentNotes(notesPath, new Date(0));
                break;
            }
        }

        if (notePaths.length === 0) {
            vscode.window.showInformationMessage('No notes found for the selected period');
            return;
        }

        // Filter to untagged or lightly-tagged notes
        const notesToTag: string[] = [];
        for (const notePath of notePaths) {
            const currentTags = await autoTagService.getCurrentTags(notePath);
            if (currentTags.length < 3) {
                notesToTag.push(notePath);
            }
        }

        if (notesToTag.length === 0) {
            vscode.window.showInformationMessage('All notes already have sufficient tags');
            return;
        }

        const answer = await vscode.window.showWarningMessage(
            `Auto-tag ${notesToTag.length} note${notesToTag.length > 1 ? 's' : ''}?`,
            { modal: true },
            'Continue',
            'Cancel'
        );

        if (answer !== 'Continue') {
            return;
        }

        let successCount = 0;
        let errorCount = 0;

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Batch auto-tagging notes...',
                cancellable: true
            },
            async (progress, token) => {
                const increment = 100 / notesToTag.length;

                for (let i = 0; i < notesToTag.length; i++) {
                    if (token.isCancellationRequested) {
                        vscode.window.showInformationMessage(
                            `Batch auto-tagging cancelled. Tagged ${successCount} of ${notesToTag.length} notes.`
                        );
                        return;
                    }

                    const notePath = notesToTag[i];
                    const noteBasename = path.basename(notePath);

                    progress.report({
                        increment,
                        message: `Processing ${i + 1} of ${notesToTag.length}: ${noteBasename}`
                    });

                    try {
                        const summary = await summarizationService.summarizeNote(notePath, {
                            includeKeywords: true
                        });

                        const suggestion = await autoTagService.suggestTags(notePath, summary);

                        if (suggestion.suggestedTags.length > 0) {
                            const result = await autoTagService.applyTags(
                                notePath,
                                suggestion.suggestedTags,
                                'append'
                            );

                            if (result.success && result.addedTags.length > 0) {
                                successCount++;
                            }
                        }
                    } catch (error) {
                        errorCount++;
                        console.error(`[NOTED] Error auto-tagging ${notePath}:`, error);
                    }
                }

                const message = `Batch auto-tagging complete. Successfully tagged ${successCount} notes${errorCount > 0 ? `, ${errorCount} errors` : ''}.`;
                vscode.window.showInformationMessage(message);
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to batch auto-tag: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handle showing tag suggestions for current note without applying
 */
export async function handleSuggestTags(
    summarizationService: SummarizationService,
    autoTagService: AutoTagService
): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No note is currently open');
        return;
    }

    const filePath = editor.document.uri.fsPath;
    const notesPath = getNotesPath();

    if (!notesPath || !filePath.startsWith(notesPath)) {
        vscode.window.showErrorMessage('Current file is not in the Notes folder');
        return;
    }

    if (!filePath.endsWith('.txt') && !filePath.endsWith('.md')) {
        vscode.window.showErrorMessage('Current file is not a note file');
        return;
    }

    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Generating tag suggestions...',
                cancellable: false
            },
            async (progress) => {
                progress.report({ message: 'Analyzing note...' });

                const summary = await summarizationService.summarizeNote(filePath, {
                    includeKeywords: true
                });

                progress.report({ message: 'Extracting tags...' });

                const suggestion = await autoTagService.suggestTags(filePath, summary);

                if (suggestion.suggestedTags.length === 0) {
                    vscode.window.showInformationMessage('No tag suggestions found');
                    return;
                }

                const details = autoTagService.formatSuggestionForDisplay(suggestion);
                vscode.window.showInformationMessage(details, { modal: true });
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to suggest tags: ${error instanceof Error ? error.message : String(error)}`);
    }
}
