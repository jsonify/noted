/**
 * Note management commands with undo support
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { promises as fsp } from 'fs';
import { NoteItem } from '../providers/treeItems';
import { getNotesPath } from '../services/configService';
import { UndoService } from '../services/undoService';
import {
    trackDeleteNote,
    trackDeleteFolder,
    trackRenameNote,
    trackRenameFolder,
    trackMoveNote
} from '../services/undoHelpers';
import { pathExists } from '../services/fileSystemService';

/**
 * Delete a note with undo tracking
 */
export async function handleDeleteNoteWithUndo(
    item: NoteItem | undefined,
    undoService: UndoService,
    treeViews: vscode.TreeView<any>[],
    refresh: () => void
) {
    // If no item provided (keyboard shortcut), get from tree view selection
    if (!item) {
        for (const treeView of treeViews) {
            const selection = treeView.selection;
            if (selection && selection.length > 0 && selection[0] instanceof NoteItem) {
                item = selection[0] as NoteItem;
                break;
            }
        }

        if (!item) {
            vscode.window.showInformationMessage('Please select a note to delete');
            return;
        }
    }

    const answer = await vscode.window.showWarningMessage(
        `Delete ${item.label}?`,
        'Delete',
        'Cancel'
    );

    if (answer === 'Delete') {
        try {
            // Track operation for undo BEFORE deleting
            await trackDeleteNote(undoService, item.filePath);

            await fsp.unlink(item.filePath);
            refresh();
            vscode.window.showInformationMessage(`Deleted ${item.label} (Undo available)`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to delete note: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

/**
 * Delete currently open note in editor
 */
export async function handleDeleteCurrentNote(
    undoService: UndoService,
    refresh: () => void
) {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        vscode.window.showInformationMessage('No note is currently open');
        return;
    }

    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Notes folder not configured');
        return;
    }

    const currentFilePath = activeEditor.document.uri.fsPath;

    // Check if the current file is within the notes folder
    if (!currentFilePath.startsWith(notesPath)) {
        vscode.window.showInformationMessage('Current file is not a note');
        return;
    }

    const fileName = path.basename(currentFilePath);
    const answer = await vscode.window.showWarningMessage(
        `Delete ${fileName}?`,
        'Delete',
        'Cancel'
    );

    if (answer === 'Delete') {
        try {
            // Close the editor first
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

            // Track operation for undo BEFORE deleting
            await trackDeleteNote(undoService, currentFilePath);

            await fsp.unlink(currentFilePath);
            refresh();
            vscode.window.showInformationMessage(`Deleted ${fileName} (Undo available)`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to delete note: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

/**
 * Rename a note with undo tracking
 */
export async function handleRenameNoteWithUndo(
    item: NoteItem,
    undoService: UndoService,
    refresh: () => void
) {
    const newName = await vscode.window.showInputBox({
        prompt: 'Enter new name',
        value: item.label
    });

    if (newName && newName !== item.label) {
        try {
            const dir = path.dirname(item.filePath);
            const newPath = path.join(dir, newName);

            // Track operation for undo BEFORE renaming
            await trackRenameNote(undoService, item.filePath, newPath);

            await fsp.rename(item.filePath, newPath);
            refresh();
            vscode.window.showInformationMessage(`Renamed to ${newName} (Undo available)`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to rename note: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

/**
 * Duplicate a note
 */
export async function handleDuplicateNote(
    item: NoteItem,
    refresh: () => void
) {
    try {
        const content = await fsp.readFile(item.filePath, 'utf8');
        const dir = path.dirname(item.filePath);
        const ext = path.extname(item.label);
        const base = path.basename(item.label, ext);
        const newName = `${base}-copy${ext}`;
        const newPath = path.join(dir, newName);

        await fsp.writeFile(newPath, content, 'utf8');
        refresh();
        vscode.window.showInformationMessage(`Duplicated as ${newName}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to duplicate note: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Move a note to another folder with undo tracking
 */
export async function handleMoveNoteWithUndo(
    item: NoteItem,
    undoService: UndoService,
    getAllFolders: (rootPath: string) => Promise<Array<{name: string, path: string}>>,
    refresh: () => void
) {
    const notesPath = getNotesPath();
    if (!notesPath || item.type !== 'note') {
        return;
    }

    try {
        // Get all available folders
        const folders = await getAllFolders(notesPath);

        if (folders.length === 0) {
            vscode.window.showInformationMessage('No folders available');
            return;
        }

        const items = folders.map(f => ({
            label: f.name,
            description: f.path,
            folder: f
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select destination folder'
        });

        if (!selected) {
            return;
        }

        const newPath = path.join(selected.folder.path, path.basename(item.filePath));

        if (await pathExists(newPath)) {
            vscode.window.showErrorMessage('A file with this name already exists in the destination folder');
            return;
        }

        // Track operation for undo BEFORE moving
        await trackMoveNote(undoService, item.filePath, newPath);

        await fsp.rename(item.filePath, newPath);
        refresh();
        vscode.window.showInformationMessage(`Moved to ${selected.folder.name} (Undo available)`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to move note: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Rename a folder with undo tracking
 */
export async function handleRenameFolderWithUndo(
    item: NoteItem,
    undoService: UndoService,
    isValidCustomFolderName: (name: string) => boolean,
    isYearFolder: (name: string) => boolean,
    isMonthFolder: (name: string) => boolean,
    refresh: () => void
) {
    if (item.type !== 'custom-folder') {
        vscode.window.showErrorMessage('Only custom folders can be renamed');
        return;
    }

    const newName = await vscode.window.showInputBox({
        prompt: 'Enter new folder name',
        value: item.label,
        validateInput: (value) => {
            if (!isValidCustomFolderName(value)) {
                if (!value || value.trim().length === 0) {
                    return 'Folder name cannot be empty';
                }
                if (isYearFolder(value) || isMonthFolder(value)) {
                    return 'Cannot use date patterns (YYYY or MM-MonthName) for custom folders';
                }
                return 'Invalid folder name (check for invalid characters)';
            }
            return null;
        }
    });

    if (!newName || newName === item.label) {
        return;
    }

    const parentDir = path.dirname(item.filePath);
    const newPath = path.join(parentDir, newName);

    if (await pathExists(newPath)) {
        vscode.window.showErrorMessage('A folder with this name already exists');
        return;
    }

    try {
        // Track operation for undo BEFORE renaming
        await trackRenameFolder(undoService, item.filePath, newPath);

        await fsp.rename(item.filePath, newPath);
        refresh();
        vscode.window.showInformationMessage(`Renamed to ${newName} (Undo available)`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to rename folder: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Delete a folder with undo tracking
 */
export async function handleDeleteFolderWithUndo(
    item: NoteItem,
    undoService: UndoService,
    refresh: () => void
) {
    if (item.type !== 'custom-folder') {
        vscode.window.showErrorMessage('Only custom folders can be deleted');
        return;
    }

    const answer = await vscode.window.showWarningMessage(
        `Delete folder "${item.label}" and all its contents?`,
        { modal: true },
        'Delete',
        'Cancel'
    );

    if (answer !== 'Delete') {
        return;
    }

    try {
        // Track operation for undo BEFORE deleting
        await trackDeleteFolder(undoService, item.filePath);

        await fsp.rm(item.filePath, { recursive: true, force: true });
        refresh();
        vscode.window.showInformationMessage(`Deleted folder: ${item.label} (Undo available)`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to delete folder: ${error instanceof Error ? error.message : String(error)}`);
    }
}
