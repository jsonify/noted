/**
 * Bulk operation command handlers for the Noted extension
 * Handles multi-select operations on notes
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { BulkOperationsService } from '../services/bulkOperationsService';
import { NotesTreeProvider } from '../providers/notesTreeProvider';
import { NoteItem } from '../providers/treeItems';
import { deleteFile, readFile, writeFile } from '../services/fileSystemService';
import { ArchiveService } from '../services/archiveService';
import { LinkService } from '../services/linkService';
import { getAllFolders } from '../utils/folderHelpers';
import { getNotesPath } from '../services/configService';
import { UndoService, OperationType } from '../services/undoService';
import {
    trackBulkDelete,
    trackBulkMove,
    trackBulkArchive
} from '../services/undoHelpers';

/**
 * Toggle select mode on/off
 */
export async function handleToggleSelectMode(
    bulkService: BulkOperationsService
) {
    bulkService.toggleSelectMode();

    const isActive = bulkService.isSelectModeActive();
    if (isActive) {
        vscode.window.showInformationMessage('Select mode enabled. Click notes to select them.');
    } else {
        vscode.window.showInformationMessage('Select mode disabled.');
    }
}

/**
 * Toggle selection for a specific note
 */
export async function handleToggleNoteSelection(
    item: NoteItem,
    bulkService: BulkOperationsService
) {
    if (item.type !== 'note') {
        return;
    }

    // Enter select mode if not already active
    if (!bulkService.isSelectModeActive()) {
        bulkService.enterSelectMode();
    }

    bulkService.toggleSelection(item.filePath);
}

/**
 * Select all visible notes
 */
export async function handleSelectAllNotes(
    treeProvider: NotesTreeProvider,
    bulkService: BulkOperationsService
) {
    // Enter select mode if not already active
    if (!bulkService.isSelectModeActive()) {
        bulkService.enterSelectMode();
    }

    // Get all note paths from the tree (this is a simplified approach)
    // In a real implementation, you'd traverse the tree to get all visible notes
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Notes folder not configured');
        return;
    }

    // For now, we'll show a message. Full implementation would require tree traversal
    vscode.window.showInformationMessage('Select All functionality - use Ctrl/Cmd+Click to select multiple notes');
}

/**
 * Clear all selected notes
 */
export async function handleClearSelection(
    bulkService: BulkOperationsService
) {
    bulkService.clearSelection();
    vscode.window.showInformationMessage('Selection cleared');
}

/**
 * Delete all selected notes with confirmation
 */
export async function handleBulkDelete(
    bulkService: BulkOperationsService,
    undoService?: UndoService
) {
    const selectedNotes = bulkService.getSelectedNotes();

    if (selectedNotes.length === 0) {
        vscode.window.showWarningMessage('No notes selected');
        return;
    }

    // Show confirmation dialog with list of notes
    const noteNames = selectedNotes.map(p => path.basename(p));
    const message = `Delete ${selectedNotes.length} note${selectedNotes.length > 1 ? 's' : ''}?`;
    const detail = `The following notes will be permanently deleted:\n\n${noteNames.slice(0, 10).join('\n')}${selectedNotes.length > 10 ? `\n...and ${selectedNotes.length - 10} more` : ''}`;

    const choice = await vscode.window.showWarningMessage(
        message,
        { modal: true, detail },
        'Delete',
        'Cancel'
    );

    if (choice !== 'Delete') {
        return;
    }

    // Track operation for undo BEFORE deleting
    if (undoService) {
        await trackBulkDelete(undoService, selectedNotes);
    }

    // Delete each note
    let successCount = 0;
    let errorCount = 0;

    for (const notePath of selectedNotes) {
        try {
            await deleteFile(notePath);
            successCount++;
        } catch (error) {
            console.error('[NOTED] Error deleting note:', notePath, error);
            errorCount++;
        }
    }

    // Clear selection and show result
    bulkService.clearSelection();
    bulkService.exitSelectMode();

    if (errorCount === 0) {
        const undoMsg = undoService ? ' (Undo available)' : '';
        vscode.window.showInformationMessage(`Deleted ${successCount} note${successCount > 1 ? 's' : ''}${undoMsg}`);
    } else {
        vscode.window.showWarningMessage(`Deleted ${successCount} note${successCount > 1 ? 's' : ''}, ${errorCount} failed`);
    }
}

/**
 * Move all selected notes to a folder
 */
export async function handleBulkMove(
    bulkService: BulkOperationsService,
    linkService?: LinkService,
    undoService?: UndoService
) {
    const selectedNotes = bulkService.getSelectedNotes();

    if (selectedNotes.length === 0) {
        vscode.window.showWarningMessage('No notes selected');
        return;
    }

    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Notes folder not configured');
        return;
    }

    // Get all folders
    const folders = await getAllFolders(notesPath);

    if (folders.length === 0) {
        vscode.window.showErrorMessage('No folders found. Create a folder first.');
        return;
    }

    // Show folder picker
    const folderItems = folders.map(folder => ({
        label: folder.name,
        description: folder.path,
        folder: folder
    }));

    const selected = await vscode.window.showQuickPick(folderItems, {
        placeHolder: `Move ${selectedNotes.length} note${selectedNotes.length > 1 ? 's' : ''} to folder...`
    });

    if (!selected) {
        return;
    }

    const targetFolder = selected.folder.path;

    // Show confirmation
    const noteNames = selectedNotes.map(p => path.basename(p));
    const message = `Move ${selectedNotes.length} note${selectedNotes.length > 1 ? 's' : ''} to ${selected.label}?`;
    const detail = `Notes to move:\n\n${noteNames.slice(0, 10).join('\n')}${selectedNotes.length > 10 ? `\n...and ${selectedNotes.length - 10} more` : ''}`;

    const choice = await vscode.window.showInformationMessage(
        message,
        { modal: true, detail },
        'Move',
        'Cancel'
    );

    if (choice !== 'Move') {
        return;
    }

    // Collect moves that will succeed for undo tracking
    const moves: Array<{ oldPath: string; newPath: string }> = [];
    const fs = require('fs').promises;

    // Pre-check which files can be moved
    for (const notePath of selectedNotes) {
        const fileName = path.basename(notePath);
        const targetPath = path.join(targetFolder, fileName);

        try {
            await fs.access(targetPath);
            // File exists, will skip
        } catch (err){
            // File doesn't exist, can proceed
            moves.push({ oldPath: notePath, newPath: targetPath });
        }
    }

    // Track operation for undo BEFORE moving
    if (undoService && moves.length > 0) {
        await trackBulkMove(undoService, moves);
    }

    // Move each note
    let successCount = 0;
    let errorCount = 0;
    let totalLinksUpdated = 0;
    let totalFilesWithUpdatedLinks = 0;

    for (const notePath of selectedNotes) {
        try {
            const fileName = path.basename(notePath);
            const targetPath = path.join(targetFolder, fileName);

            // Check if file already exists
            try {
                await fs.access(targetPath);
                vscode.window.showWarningMessage(`Skipping ${fileName} - already exists in target folder`);
                errorCount++;
                continue;
            } catch {
                // File doesn't exist, proceed with move
            }

            // Update all links to this note before moving (if linkService is available)
            if (linkService) {
                const linkUpdateResult = await linkService.updateLinksOnRename(notePath, targetPath);
                totalLinksUpdated += linkUpdateResult.linksUpdated;
                if (linkUpdateResult.filesUpdated > 0) {
                    totalFilesWithUpdatedLinks += linkUpdateResult.filesUpdated;
                }
            }

            await fs.rename(notePath, targetPath);
            successCount++;
        } catch (error) {
            console.error('[NOTED] Error moving note:', notePath, error);
            errorCount++;
        }
    }

    // Clear selection and show result
    bulkService.clearSelection();
    bulkService.exitSelectMode();

    if (errorCount === 0) {
        const undoMsg = undoService ? ' (Undo available)' : '';
        let message = `Moved ${successCount} note${successCount > 1 ? 's' : ''}${undoMsg} to ${selected.label}`;
        if (totalLinksUpdated > 0) {
            message += ` - Updated ${totalLinksUpdated} link(s) in ${totalFilesWithUpdatedLinks} file(s)`;
        }
        vscode.window.showInformationMessage(message);
    } else {
        vscode.window.showWarningMessage(`Moved ${successCount} note${successCount > 1 ? 's' : ''}, ${errorCount} failed`);
    }
}

/**
 * Archive all selected notes
 */
export async function handleBulkArchive(
    bulkService: BulkOperationsService,
    archiveService: ArchiveService,
    undoService?: UndoService
) {
    const selectedNotes = bulkService.getSelectedNotes();

    if (selectedNotes.length === 0) {
        vscode.window.showWarningMessage('No notes selected');
        return;
    }

    // Show confirmation
    const noteNames = selectedNotes.map(p => path.basename(p));
    const message = `Archive ${selectedNotes.length} note${selectedNotes.length > 1 ? 's' : ''}?`;
    const detail = `The following notes will be moved to the archive:\n\n${noteNames.slice(0, 10).join('\n')}${selectedNotes.length > 10 ? `\n...and ${selectedNotes.length - 10} more` : ''}`;

    const choice = await vscode.window.showInformationMessage(
        message,
        { modal: true, detail },
        'Archive',
        'Cancel'
    );

    if (choice !== 'Archive') {
        return;
    }

    // Archive each note and collect for undo tracking
    let successCount = 0;
    let errorCount = 0;
    const archives: Array<{ oldPath: string; newPath: string }> = [];

    for (const notePath of selectedNotes) {
        try {
            const destinationPath = await archiveService.archiveNote(notePath);
            archives.push({ oldPath: notePath, newPath: destinationPath });
            successCount++;
        } catch (error) {
            console.error('[NOTED] Error archiving note:', notePath, error);
            errorCount++;
        }
    }

    // Track operation for undo AFTER archiving (since we need destination paths)
    if (undoService && archives.length > 0) {
        await trackBulkArchive(undoService, archives);
    }

    // Clear selection and show result
    bulkService.clearSelection();
    bulkService.exitSelectMode();

    if (errorCount === 0) {
        const undoMsg = undoService ? ' (Undo available)' : '';
        vscode.window.showInformationMessage(`Archived ${successCount} note${successCount > 1 ? 's' : ''}${undoMsg}`);
    } else {
        vscode.window.showWarningMessage(`Archived ${successCount} note${successCount > 1 ? 's' : ''}, ${errorCount} failed`);
    }
}

/**
 * Merge all selected notes into a single note
 */
export async function handleBulkMerge(
    bulkService: BulkOperationsService,
    linkService?: LinkService,
    undoService?: UndoService
) {
    const selectedNotes = bulkService.getSelectedNotes();

    if (selectedNotes.length < 2) {
        vscode.window.showWarningMessage('Select at least 2 notes to merge');
        return;
    }

    // Sort notes by file path for consistent ordering
    selectedNotes.sort();

    // Show confirmation with list of notes
    const noteNames = selectedNotes.map(p => path.basename(p));
    const message = `Merge ${selectedNotes.length} notes?`;
    const detail = `The following notes will be merged:\n\n${noteNames.slice(0, 10).join('\n')}${selectedNotes.length > 10 ? `\n...and ${selectedNotes.length - 10} more` : ''}`;

    const choice = await vscode.window.showWarningMessage(
        message,
        { modal: true, detail },
        'Merge',
        'Cancel'
    );

    if (choice !== 'Merge') {
        return;
    }

    // Prompt for target note - can choose one of the selected notes or create new one
    const targetOptions = [
        { label: '$(file) Create New Note', value: 'new' },
        ...selectedNotes.map(notePath => ({
            label: path.basename(notePath),
            description: path.dirname(notePath),
            value: notePath
        }))
    ];

    const targetSelection = await vscode.window.showQuickPick(targetOptions, {
        placeHolder: 'Choose target note (all notes will be merged into this)',
        title: 'Merge Notes'
    });

    if (!targetSelection) {
        return;
    }

    let targetNotePath: string;
    let targetIsNew = false;

    if (targetSelection.value === 'new') {
        // Prompt for new note name
        const newNoteName = await vscode.window.showInputBox({
            prompt: 'Enter name for merged note',
            placeHolder: 'merged-notes',
            validateInput: (value) => {
                if (!value || value.trim() === '') {
                    return 'Note name cannot be empty';
                }
                // Sanitize filename
                if (!/^[a-zA-Z0-9-_\s]+$/.test(value)) {
                    return 'Note name can only contain letters, numbers, hyphens, underscores, and spaces';
                }
                return null;
            }
        });

        if (!newNoteName) {
            return;
        }

        // Create target path in the same folder as the first selected note
        const firstNoteDir = path.dirname(selectedNotes[0]);
        const config = vscode.workspace.getConfiguration('noted');
        const fileFormat = config.get<string>('fileFormat', 'txt');
        const sanitizedName = newNoteName.trim().toLowerCase().replace(/\s+/g, '-');
        targetNotePath = path.join(firstNoteDir, `${sanitizedName}.${fileFormat}`);
        targetIsNew = true;

        // Check if file already exists
        const fs = require('fs').promises;
        try {
            await fs.access(targetNotePath);
            vscode.window.showErrorMessage(`Note "${sanitizedName}.${fileFormat}" already exists`);
            return;
        } catch {
            // File doesn't exist, proceed
        }
    } else {
        targetNotePath = targetSelection.value;
    }

    // Get source notes (all selected notes except target)
    const sourceNotes = selectedNotes.filter(p => p !== targetNotePath);

    // Read all note contents
    const noteContents: Array<{ path: string; content: string; name: string }> = [];

    try {
        // Read target note if it exists
        let targetContent = '';
        if (!targetIsNew) {
            targetContent = await readFile(targetNotePath);
        }

        // Read all source notes
        for (const notePath of sourceNotes) {
            const content = await readFile(notePath);
            const name = path.basename(notePath, path.extname(notePath));
            noteContents.push({ path: notePath, content, name });
        }

        // Build merged content
        let mergedContent = targetContent;

        // Add separator if target had content
        if (targetContent.trim() !== '') {
            mergedContent += '\n\n---\n\n';
        }

        // Add merged from header
        const mergedFromLinks = noteContents.map(nc => `[[${nc.name}]]`).join(', ');
        mergedContent += `## Merged Notes\n\nMerged from: ${mergedFromLinks}\n\n---\n\n`;

        // Append all source note contents with separators
        for (let i = 0; i < noteContents.length; i++) {
            const nc = noteContents[i];
            mergedContent += `## From: [[${nc.name}]]\n\n`;
            mergedContent += nc.content;

            // Add separator between notes (but not after the last one)
            if (i < noteContents.length - 1) {
                mergedContent += '\n\n---\n\n';
            }
        }

        // Write merged content to target
        await writeFile(targetNotePath, mergedContent);

        // Update all incoming links to source notes to point to target
        let totalLinksUpdated = 0;
        let totalFilesWithUpdatedLinks = 0;

        if (linkService) {
            for (const sourcePath of sourceNotes) {
                const linkUpdateResult = await linkService.updateLinksOnRename(sourcePath, targetNotePath);
                totalLinksUpdated += linkUpdateResult.linksUpdated;
                if (linkUpdateResult.filesUpdated > 0) {
                    totalFilesWithUpdatedLinks += linkUpdateResult.filesUpdated;
                }
            }
        }

        // Track operation for undo BEFORE deleting source notes
        if (undoService) {
            undoService.pushOperation({
                type: OperationType.BULK_MERGE,
                timestamp: Date.now(),
                description: `Merge ${sourceNotes.length} notes into ${path.basename(targetNotePath)}`,
                targetPath: targetNotePath,
                targetWasNew: targetIsNew,
                targetOriginalContent: targetIsNew ? '' : targetContent,
                mergedContent: mergedContent,
                sourceNotes: noteContents.map(nc => ({
                    path: nc.path,
                    content: nc.content
                }))
            });
        }

        // Delete source notes
        let deletedCount = 0;
        for (const sourcePath of sourceNotes) {
            try {
                await deleteFile(sourcePath);
                deletedCount++;
            } catch (error) {
                console.error('[NOTED] Error deleting source note after merge:', sourcePath, error);
            }
        }

        // Clear selection and exit select mode
        bulkService.clearSelection();
        bulkService.exitSelectMode();

        // Open the merged note
        const doc = await vscode.workspace.openTextDocument(targetNotePath);
        await vscode.window.showTextDocument(doc);

        // Show success message
        const undoMsg = undoService ? ' (Undo available)' : '';
        let message = `Merged ${deletedCount} note${deletedCount > 1 ? 's' : ''} into ${path.basename(targetNotePath)}${undoMsg}`;
        if (totalLinksUpdated > 0) {
            message += ` - Updated ${totalLinksUpdated} link(s) in ${totalFilesWithUpdatedLinks} file(s)`;
        }
        vscode.window.showInformationMessage(message);

    } catch (error) {
        console.error('[NOTED] Error during merge operation:', error);
        vscode.window.showErrorMessage(`Failed to merge notes: ${error}`);
    }
}
