/**
 * Bulk operation command handlers for the Noted extension
 * Handles multi-select operations on notes
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { BulkOperationsService } from '../services/bulkOperationsService';
import { NotesTreeProvider } from '../providers/notesTreeProvider';
import { NoteItem } from '../providers/treeItems';
import { deleteFile } from '../services/fileSystemService';
import { ArchiveService } from '../services/archiveService';
import { getAllFolders } from '../utils/folderHelpers';
import { getNotesPath } from '../services/configService';

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
    bulkService: BulkOperationsService
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
        vscode.window.showInformationMessage(`Deleted ${successCount} note${successCount > 1 ? 's' : ''}`);
    } else {
        vscode.window.showWarningMessage(`Deleted ${successCount} note${successCount > 1 ? 's' : ''}, ${errorCount} failed`);
    }
}

/**
 * Move all selected notes to a folder
 */
export async function handleBulkMove(
    bulkService: BulkOperationsService
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

    // Move each note
    let successCount = 0;
    let errorCount = 0;
    const fs = require('fs').promises;

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
        vscode.window.showInformationMessage(`Moved ${successCount} note${successCount > 1 ? 's' : ''} to ${selected.label}`);
    } else {
        vscode.window.showWarningMessage(`Moved ${successCount} note${successCount > 1 ? 's' : ''}, ${errorCount} failed`);
    }
}

/**
 * Archive all selected notes
 */
export async function handleBulkArchive(
    bulkService: BulkOperationsService,
    archiveService: ArchiveService
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

    // Archive each note
    let successCount = 0;
    let errorCount = 0;

    for (const notePath of selectedNotes) {
        try {
            await archiveService.archiveNote(notePath);
            successCount++;
        } catch (error) {
            console.error('[NOTED] Error archiving note:', notePath, error);
            errorCount++;
        }
    }

    // Clear selection and show result
    bulkService.clearSelection();
    bulkService.exitSelectMode();

    if (errorCount === 0) {
        vscode.window.showInformationMessage(`Archived ${successCount} note${successCount > 1 ? 's' : ''}`);
    } else {
        vscode.window.showWarningMessage(`Archived ${successCount} note${successCount > 1 ? 's' : ''}, ${errorCount} failed`);
    }
}
