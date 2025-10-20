/**
 * Command handlers for the Noted extension
 * All commands are registered in extension.ts
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { NoteItem } from '../providers/treeItems';
import { getNotesPath, getTemplatesPath, getFileFormat } from '../services/configService';
import { openDailyNote, createNoteFromTemplate, searchInNotes, getNoteStats, exportNotesToFile } from '../services/noteService';
import { advancedSearch, parseSearchQuery, getRecentNotes } from '../services/searchService';
import { getCustomTemplates } from '../services/templateService';
import { pathExists, createDirectory, deleteFile, renameFile, copyFile, deleteDirectory, readFile, writeFile, copyDirectoryRecursive } from '../services/fileSystemService';
import { isValidCustomFolderName, isYearFolder, isMonthFolder } from '../utils/validators';
import { formatTimestamp } from '../utils/dateHelpers';
import { getAllFolders } from '../utils/folderHelpers';
import { BUILT_IN_TEMPLATE_INFO, DEFAULTS } from '../constants';

/**
 * Register a function to refresh the tree view
 */
let refreshTreeView: (() => void) | null = null;

export function setRefreshCallback(callback: () => void) {
    refreshTreeView = callback;
}

function refresh() {
    if (refreshTreeView) {
        refreshTreeView();
    }
}

// ============================================================================
// Note Commands
// ============================================================================

export async function handleOpenToday() {
    await openDailyNote();
    refresh();
}

export async function handleOpenWithTemplate(templateType?: string) {
    // If no template type provided, show picker
    if (!templateType) {
        const customTemplates = await getCustomTemplates();

        const items = [
            ...BUILT_IN_TEMPLATE_INFO.map(t => ({
                label: t.label,
                description: t.description,
                detail: 'Built-in',
                value: t.value
            })),
            ...customTemplates.map(t => ({
                label: t,
                description: 'Custom template',
                detail: 'Custom',
                value: t
            }))
        ];

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a template'
        });

        if (!selected) {
            return;
        }

        templateType = selected.value;
    }

    await createNoteFromTemplate(templateType);
    refresh();
}

export async function handleOpenNote(filePath: string) {
    const document = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(document);
}

export async function handleDeleteNote(item: NoteItem) {
    const answer = await vscode.window.showWarningMessage(
        `Delete ${item.label}?`,
        'Delete',
        'Cancel'
    );
    if (answer === 'Delete') {
        try {
            await deleteFile(item.filePath);
            refresh();
            vscode.window.showInformationMessage(`Deleted ${item.label}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to delete note: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

export async function handleRenameNote(item: NoteItem) {
    const newName = await vscode.window.showInputBox({
        prompt: 'Enter new name',
        value: item.label
    });
    if (newName && newName !== item.label) {
        try {
            const dir = path.dirname(item.filePath);
            const newPath = path.join(dir, newName);
            await renameFile(item.filePath, newPath);
            refresh();
            vscode.window.showInformationMessage(`Renamed to ${newName}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to rename note: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

export async function handleDuplicateNote(item: NoteItem) {
    try {
        const content = await readFile(item.filePath);
        const dir = path.dirname(item.filePath);
        const ext = path.extname(item.label);
        const base = path.basename(item.label, ext);
        const newName = `${base}-copy${ext}`;
        const newPath = path.join(dir, newName);

        await writeFile(newPath, content);
        refresh();
        vscode.window.showInformationMessage(`Duplicated as ${newName}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to duplicate note: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function handleMoveNote(item: NoteItem) {
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

        await renameFile(item.filePath, newPath);
        refresh();
        vscode.window.showInformationMessage(`Moved to ${selected.folder.name}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to move note: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function handleCopyPath(item: NoteItem) {
    await vscode.env.clipboard.writeText(item.filePath);
    vscode.window.showInformationMessage('Path copied to clipboard');
}

export async function handleRevealInExplorer(item: NoteItem) {
    await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(item.filePath));
}

// ============================================================================
// Folder Commands
// ============================================================================

export async function handleCreateFolder() {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Please configure a notes folder first');
        return;
    }

    const folderName = await vscode.window.showInputBox({
        prompt: 'Enter folder name (will be created at root level)',
        placeHolder: 'my-folder',
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

    if (!folderName) {
        return;
    }

    // Always create custom folders at root level
    const newFolderPath = path.join(notesPath, folderName);

    if (await pathExists(newFolderPath)) {
        vscode.window.showErrorMessage('Folder already exists');
        return;
    }

    try {
        await createDirectory(newFolderPath);
        refresh();
        vscode.window.showInformationMessage(`Created folder: ${folderName}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create folder: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function handleRenameFolder(item: NoteItem) {
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
        await renameFile(item.filePath, newPath);
        refresh();
        vscode.window.showInformationMessage(`Renamed to ${newName}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to rename folder: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function handleDeleteFolder(item: NoteItem) {
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
        await deleteDirectory(item.filePath);
        refresh();
        vscode.window.showInformationMessage(`Deleted folder: ${item.label}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to delete folder: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function handleMoveNotesFolder() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('Please open a workspace folder first');
        return;
    }

    try {
        const config = vscode.workspace.getConfiguration('noted');
        const currentFolder = config.get<string>('notesFolder', 'notes');

        // Handle both relative and absolute paths
        const rootPath = workspaceFolders[0].uri.fsPath;
        const currentPath = path.isAbsolute(currentFolder)
            ? currentFolder
            : path.join(rootPath, currentFolder);

        if (!(await pathExists(currentPath))) {
            vscode.window.showErrorMessage('Current notes folder does not exist');
            return;
        }

        const selectedUri = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select New Notes Location',
            defaultUri: vscode.Uri.file(path.dirname(currentPath)),
            title: 'Choose new location for your notes'
        });

        if (!selectedUri || !selectedUri[0]) {
            return;
        }

        const newPath = selectedUri[0].fsPath;

        if (await pathExists(newPath)) {
            const { readDirectory } = await import('../services/fileSystemService');
            const entries = await readDirectory(newPath);
            if (entries.length > 0) {
                vscode.window.showErrorMessage('Destination folder must be empty');
                return;
            }
        } else {
            await createDirectory(newPath);
        }

        // Copy all files recursively
        await copyDirectoryRecursive(currentPath, newPath);

        // Delete old folder
        await deleteDirectory(currentPath);

        // Save to global configuration
        await config.update('notesFolder', newPath, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Notes moved to: ${newPath}`);
        refresh();
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to move notes: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function handleSetupDefaultFolder() {
    try {
        // Create a default path in user's home directory if no workspace is available
        let defaultNotesPath: string;
        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (workspaceFolders) {
            // If workspace exists, use workspace/Notes
            const rootPath = workspaceFolders[0].uri.fsPath;
            defaultNotesPath = path.join(rootPath, DEFAULTS.NOTES_FOLDER);
        } else {
            // No workspace, use ~/Notes as a sensible default
            const homeDir = require('os').homedir();
            defaultNotesPath = path.join(homeDir, DEFAULTS.NOTES_FOLDER);
        }

        // Check if the path already exists or create it
        if (!(await pathExists(defaultNotesPath))) {
            await createDirectory(defaultNotesPath);
        }

        const config = vscode.workspace.getConfiguration('noted');

        // Always save absolute path to global configuration so it works across all windows
        await config.update('notesFolder', defaultNotesPath, vscode.ConfigurationTarget.Global);

        console.log('[NOTED DEBUG] Setup default folder:', defaultNotesPath);
        vscode.window.showInformationMessage(`Notes folder created at: ${defaultNotesPath}`);
        refresh();
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create default notes folder: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function handleSetupCustomFolder() {
    try {
        // Start from user's home directory as a sensible default
        const homeDir = require('os').homedir();
        const defaultUri = vscode.Uri.file(homeDir);

        const selectedUri = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Notes Folder',
            defaultUri: defaultUri,
            title: 'Choose where to store your notes'
        });

        if (selectedUri && selectedUri[0]) {
            const selectedPath = selectedUri[0].fsPath;

            // Check if selected path is .vscode or inside it
            if (selectedPath.includes('.vscode')) {
                vscode.window.showErrorMessage('Cannot use .vscode directory for notes');
                return;
            }

            if (!(await pathExists(selectedPath))) {
                await createDirectory(selectedPath);
            }

            const config = vscode.workspace.getConfiguration('noted');
            // Always save absolute path to global configuration
            await config.update('notesFolder', selectedPath, vscode.ConfigurationTarget.Global);

            console.log('[NOTED DEBUG] Setup custom folder:', selectedPath);
            vscode.window.showInformationMessage(`Notes folder set to: ${selectedPath}`);
            refresh();
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create notes folder: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// ============================================================================
// Template Commands
// ============================================================================

export async function handleCreateCustomTemplate() {
    const templateName = await vscode.window.showInputBox({
        prompt: 'Enter template name',
        placeHolder: 'my-template'
    });

    if (!templateName) {
        return;
    }

    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        vscode.window.showErrorMessage('Please configure notes folder first');
        return;
    }

    try {
        // Create templates folder if it doesn't exist
        if (!(await pathExists(templatesPath))) {
            await createDirectory(templatesPath);
        }

        const fileFormat = getFileFormat();
        const templateFile = path.join(templatesPath, `${templateName}.${fileFormat}`);

        if (await pathExists(templateFile)) {
            vscode.window.showErrorMessage('Template already exists');
            return;
        }

        // Create a starter template
        const starterContent = `File: {filename}
Created: {date} at {time}
${'='.repeat(DEFAULTS.SEPARATOR_LENGTH)}

[Your template content here]

Available placeholders:
- {filename}: The name of the note file
- {date}: The current date
- {time}: The current time
`;

        await writeFile(templateFile, starterContent);

        const document = await vscode.workspace.openTextDocument(templateFile);
        await vscode.window.showTextDocument(document);
        vscode.window.showInformationMessage(`Template created: ${templateName}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create template: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function handleOpenTemplatesFolder() {
    const templatesPath = getTemplatesPath();
    if (templatesPath) {
        if (await pathExists(templatesPath)) {
            await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(templatesPath));
        } else {
            vscode.window.showErrorMessage('Templates folder does not exist');
        }
    } else {
        vscode.window.showErrorMessage('Templates folder does not exist');
    }
}

// ============================================================================
// Utility Commands
// ============================================================================

export async function handleInsertTimestamp() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const timestamp = formatTimestamp();
        editor.edit(editBuilder => {
            editBuilder.insert(editor.selection.active, `[${timestamp}] `);
        });
    }
}

export async function handleChangeFormat() {
    const config = vscode.workspace.getConfiguration('noted');
    const currentFormat = config.get<string>('fileFormat', 'txt');
    const newFormat = currentFormat === 'txt' ? 'md' : 'txt';

    await config.update('fileFormat', newFormat, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`Notes format changed to .${newFormat}`);
}

export function handleRefresh() {
    refresh();
}

export async function handleSearchNotes() {
    const query = await vscode.window.showInputBox({
        prompt: 'Search notes (supports: regex:, case:, tag:tagname, from:YYYY-MM-DD, to:YYYY-MM-DD)',
        placeHolder: 'Enter search term with optional filters...'
    });

    if (query) {
        try {
            const options = parseSearchQuery(query);
            const results = await advancedSearch(options);

            if (results.length === 0) {
                vscode.window.showInformationMessage('No results found');
            } else {
                const items = results.map(r => {
                    const fileName = path.basename(r.file);
                    const matchInfo = r.matches > 0 ? ` (${r.matches} match${r.matches > 1 ? 'es' : ''})` : '';
                    const tagInfo = r.tags.length > 0 ? ` [${r.tags.join(', ')}]` : '';

                    return {
                        label: `${fileName}${matchInfo}`,
                        description: r.preview,
                        detail: `${r.file}${tagInfo}`,
                        filePath: r.file
                    };
                });

                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: `Found ${results.length} result(s) - Use filters: regex:, case:, tag:, from:, to:`
                });

                if (selected && selected.filePath) {
                    const document = await vscode.workspace.openTextDocument(selected.filePath);
                    await vscode.window.showTextDocument(document);
                }
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Search error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

export async function handleQuickSwitcher() {
    try {
        const results = await getRecentNotes(20);

        if (results.length === 0) {
            vscode.window.showInformationMessage('No recent notes found');
            return;
        }

        const items = results.map(r => {
            const fileName = path.basename(r.file);
            const tagInfo = r.tags.length > 0 ? ` [${r.tags.join(', ')}]` : '';
            const dateInfo = r.modified.toLocaleDateString();

            return {
                label: fileName,
                description: `${dateInfo}${tagInfo}`,
                detail: r.preview,
                filePath: r.file
            };
        });

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a recent note to open',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (selected && selected.filePath) {
            const document = await vscode.workspace.openTextDocument(selected.filePath);
            await vscode.window.showTextDocument(document);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Quick switcher error: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function handleShowStats() {
    const stats = await getNoteStats();
    const message = `Total Notes: ${stats.total}\nThis Week: ${stats.thisWeek}\nThis Month: ${stats.thisMonth}`;
    vscode.window.showInformationMessage(message);
}

export async function handleExportNotes() {
    const options = await vscode.window.showQuickPick(
        ['This Week', 'This Month', 'All Notes'],
        { placeHolder: 'Select export range' }
    );

    if (options) {
        await exportNotesToFile(options);
    }
}

export async function handleShowConfig() {
    const config = vscode.workspace.getConfiguration('noted');
    const notesFolder = config.get<string>('notesFolder', DEFAULTS.NOTES_FOLDER);
    const notesPath = getNotesPath();
    const isAbsolute = path.isAbsolute(notesFolder);

    let exists = false;
    if (notesPath) {
        exists = await pathExists(notesPath);
    }

    const message = `Notes Configuration:\n\n` +
        `Config value: ${notesFolder}\n` +
        `Is absolute: ${isAbsolute}\n` +
        `Resolved path: ${notesPath}\n` +
        `Exists: ${exists}`;

    vscode.window.showInformationMessage(message, { modal: true });
}
