import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsp } from 'fs';

export function activate(context: vscode.ExtensionContext) {
    console.log('Noted extension is now active');
    
    const config = vscode.workspace.getConfiguration('noted');
    const notesFolder = config.get<string>('notesFolder', 'Notes');
    const workspaceFolders = vscode.workspace.workspaceFolders;
    console.log('[NOTED DEBUG] Extension activated with:');
    console.log('[NOTED DEBUG] - notesFolder config:', notesFolder);
    console.log('[NOTED DEBUG] - is absolute path:', path.isAbsolute(notesFolder));
    console.log('[NOTED DEBUG] - workspace folders:', workspaceFolders?.length || 0);
    console.log('[NOTED DEBUG] - resolved notes path:', getNotesPath());

    // Check if notes folder is configured
    initializeNotesFolder();

    // Create tree data provider for main notes view
    const notesProvider = new NotesTreeProvider();
    const treeView = vscode.window.createTreeView('notedView', {
        treeDataProvider: notesProvider,
        dragAndDropController: notesProvider
    });

    // Create tree data provider for templates view (empty, uses viewsWelcome)
    const templatesProvider = new TemplatesTreeProvider();
    vscode.window.registerTreeDataProvider('notedTemplatesView', templatesProvider);

    // Command to open today's note
    let openTodayNote = vscode.commands.registerCommand('noted.openToday', async () => {
        await openDailyNote();
        notesProvider.refresh();
    });

    // Command to open with template
    let openWithTemplate = vscode.commands.registerCommand('noted.openWithTemplate', async (templateType?: string) => {
        // If no template type provided, show picker
        if (!templateType) {
            const customTemplates = await getCustomTemplates();
            const builtInTemplates = [
                { label: 'Problem/Solution', value: 'problem-solution', description: 'Document bugs and troubleshooting' },
                { label: 'Meeting', value: 'meeting', description: 'Organize meeting notes and action items' },
                { label: 'Research', value: 'research', description: 'Structure your research and findings' },
                { label: 'Quick', value: 'quick', description: 'Simple dated note' }
            ];

            const items = [
                ...builtInTemplates.map(t => ({
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
        notesProvider.refresh();
    });

    // Command to insert timestamp
    let insertTimestamp = vscode.commands.registerCommand('noted.insertTimestamp', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const timestamp = new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
            editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, `[${timestamp}] `);
            });
        }
    });

    // Command to change file format
    let changeFormat = vscode.commands.registerCommand('noted.changeFormat', async () => {
        const config = vscode.workspace.getConfiguration('noted');
        const currentFormat = config.get<string>('fileFormat', 'txt');
        const newFormat = currentFormat === 'txt' ? 'md' : 'txt';

        await config.update('fileFormat', newFormat, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Notes format changed to .${newFormat}`);
    });

    // Command to refresh notes view
    let refreshNotes = vscode.commands.registerCommand('noted.refresh', () => {
        notesProvider.refresh();
    });

    // Command to open note from tree
    let openNote = vscode.commands.registerCommand('noted.openNote', async (filePath: string) => {
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
    });

    // Command to delete note
    let deleteNote = vscode.commands.registerCommand('noted.deleteNote', async (item: NoteItem) => {
        const answer = await vscode.window.showWarningMessage(
            `Delete ${item.label}?`,
            'Delete',
            'Cancel'
        );
        if (answer === 'Delete') {
            try {
                await fsp.unlink(item.filePath);
                notesProvider.refresh();
                vscode.window.showInformationMessage(`Deleted ${item.label}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to delete note: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    });

    // Command to rename note
    let renameNote = vscode.commands.registerCommand('noted.renameNote', async (item: NoteItem) => {
        const newName = await vscode.window.showInputBox({
            prompt: 'Enter new name',
            value: item.label
        });
        if (newName && newName !== item.label) {
            try {
                const dir = path.dirname(item.filePath);
                const newPath = path.join(dir, newName);
                await fsp.rename(item.filePath, newPath);
                notesProvider.refresh();
                vscode.window.showInformationMessage(`Renamed to ${newName}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to rename note: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    });

    // Command to copy note path
    let copyPath = vscode.commands.registerCommand('noted.copyPath', async (item: NoteItem) => {
        await vscode.env.clipboard.writeText(item.filePath);
        vscode.window.showInformationMessage('Path copied to clipboard');
    });

    // Command to reveal in file explorer
    let revealInExplorer = vscode.commands.registerCommand('noted.revealInExplorer', async (item: NoteItem) => {
        await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(item.filePath));
    });

    // Command to search notes
    let searchNotes = vscode.commands.registerCommand('noted.searchNotes', async () => {
        const query = await vscode.window.showInputBox({
            prompt: 'Search notes',
            placeHolder: 'Enter search term...'
        });
        
        if (query) {
            const results = await searchInNotes(query);
            if (results.length === 0) {
                vscode.window.showInformationMessage('No results found');
            } else {
                const items = results.map(r => ({
                    label: path.basename(r.file),
                    description: r.preview,
                    detail: r.file
                }));
                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: `Found ${results.length} result(s)`
                });
                if (selected && selected.detail) {
                    const document = await vscode.workspace.openTextDocument(selected.detail);
                    await vscode.window.showTextDocument(document);
                }
            }
        }
    });

    // Command to show stats
    let showStats = vscode.commands.registerCommand('noted.showStats', async () => {
        const stats = await getNoteStats();
        const message = `Total Notes: ${stats.total}\nThis Week: ${stats.thisWeek}\nThis Month: ${stats.thisMonth}`;
        vscode.window.showInformationMessage(message);
    });

    // Command to export notes
    let exportNotes = vscode.commands.registerCommand('noted.exportNotes', async () => {
        const options = await vscode.window.showQuickPick(
            ['This Week', 'This Month', 'All Notes'],
            { placeHolder: 'Select export range' }
        );

        if (options) {
            await exportNotesToFile(options);
        }
    });

    // Command to move notes folder
    let moveNotesFolder = vscode.commands.registerCommand('noted.moveNotesFolder', async () => {
        await moveNotesFolderLocation();
        notesProvider.refresh();
    });

    // Command to duplicate note
    let duplicateNote = vscode.commands.registerCommand('noted.duplicateNote', async (item: NoteItem) => {
        try {
            const content = await fsp.readFile(item.filePath, 'utf8');
            const dir = path.dirname(item.filePath);
            const ext = path.extname(item.label);
            const base = path.basename(item.label, ext);
            const newName = `${base}-copy${ext}`;
            const newPath = path.join(dir, newName);

            await fsp.writeFile(newPath, content);
            notesProvider.refresh();
            vscode.window.showInformationMessage(`Duplicated as ${newName}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to duplicate note: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // Command to create custom folder
    let createFolder = vscode.commands.registerCommand('noted.createFolder', async () => {
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

        try {
            // Check if exists
            await fsp.access(newFolderPath);
            vscode.window.showErrorMessage('Folder already exists');
            return;
        } catch {
            // Folder doesn't exist, create it
            try {
                await fsp.mkdir(newFolderPath, { recursive: true });
                notesProvider.refresh();
                vscode.window.showInformationMessage(`Created folder: ${folderName}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to create folder: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    });

    // Command to move note
    let moveNote = vscode.commands.registerCommand('noted.moveNote', async (item: NoteItem) => {
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

            try {
                await fsp.access(newPath);
                vscode.window.showErrorMessage('A file with this name already exists in the destination folder');
                return;
            } catch {
                // File doesn't exist, proceed with move
                await fsp.rename(item.filePath, newPath);
                notesProvider.refresh();
                vscode.window.showInformationMessage(`Moved to ${selected.folder.name}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to move note: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // Command to rename folder
    let renameFolder = vscode.commands.registerCommand('noted.renameFolder', async (item: NoteItem) => {
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

        try {
            await fsp.access(newPath);
            vscode.window.showErrorMessage('A folder with this name already exists');
            return;
        } catch {
            // Folder doesn't exist, proceed with rename
            try {
                await fsp.rename(item.filePath, newPath);
                notesProvider.refresh();
                vscode.window.showInformationMessage(`Renamed to ${newName}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to rename folder: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    });

    // Command to delete folder
    let deleteFolder = vscode.commands.registerCommand('noted.deleteFolder', async (item: NoteItem) => {
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
            await fsp.rm(item.filePath, { recursive: true, force: true });
            notesProvider.refresh();
            vscode.window.showInformationMessage(`Deleted folder: ${item.label}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to delete folder: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // Command to show calendar view
    let showCalendar = vscode.commands.registerCommand('noted.showCalendar', async () => {
        await showCalendarView(context);
    });

    // Command to show current notes folder configuration (for debugging)
    let showNotesConfig = vscode.commands.registerCommand('noted.showConfig', async () => {
        const config = vscode.workspace.getConfiguration('noted');
        const notesFolder = config.get<string>('notesFolder', 'Notes');
        const notesPath = getNotesPath();
        const isAbsolute = path.isAbsolute(notesFolder);

        let exists = false;
        if (notesPath) {
            try {
                await fsp.access(notesPath);
                exists = true;
            } catch {
                exists = false;
            }
        }

        const message = `Notes Configuration:\n\n` +
            `Config value: ${notesFolder}\n` +
            `Is absolute: ${isAbsolute}\n` +
            `Resolved path: ${notesPath}\n` +
            `Exists: ${exists}`;

        vscode.window.showInformationMessage(message, { modal: true });
    });

    // Command to setup default folder
    let setupDefaultFolder = vscode.commands.registerCommand('noted.setupDefaultFolder', async () => {
        try {
            // Create a default path in user's home directory if no workspace is available
            let defaultNotesPath: string;
            const workspaceFolders = vscode.workspace.workspaceFolders;

            if (workspaceFolders) {
                // If workspace exists, use workspace/Notes
                const rootPath = workspaceFolders[0].uri.fsPath;
                defaultNotesPath = path.join(rootPath, 'Notes');
            } else {
                // No workspace, use ~/Notes as a sensible default
                const homeDir = require('os').homedir();
                defaultNotesPath = path.join(homeDir, 'Notes');
            }

            // Check if the path already exists or create it
            try {
                await fsp.access(defaultNotesPath);
            } catch {
                // Folder doesn't exist, create it
                await fsp.mkdir(defaultNotesPath, { recursive: true });
            }

            const config = vscode.workspace.getConfiguration('noted');

            // Always save absolute path to global configuration so it works across all windows
            await config.update('notesFolder', defaultNotesPath, vscode.ConfigurationTarget.Global);

            console.log('[NOTED DEBUG] Setup default folder:', defaultNotesPath);
            vscode.window.showInformationMessage(`Notes folder created at: ${defaultNotesPath}`);
            notesProvider.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create default notes folder: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // Command to create custom template
    let createCustomTemplate = vscode.commands.registerCommand('noted.createCustomTemplate', async () => {
        await createNewCustomTemplate();
        templatesProvider.refresh();
    });

    // Command to open templates folder
    let openTemplatesFolder = vscode.commands.registerCommand('noted.openTemplatesFolder', async () => {
        const templatesPath = getTemplatesPath();
        if (templatesPath) {
            try {
                await fsp.access(templatesPath);
                await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(templatesPath));
            } catch {
                vscode.window.showErrorMessage('Templates folder does not exist');
            }
        } else {
            vscode.window.showErrorMessage('Templates folder does not exist');
        }
    });

    // Command to setup custom folder
    let setupCustomFolder = vscode.commands.registerCommand('noted.setupCustomFolder', async () => {
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

                try {
                    await fsp.access(selectedPath);
                } catch {
                    // Folder doesn't exist, create it
                    await fsp.mkdir(selectedPath, { recursive: true });
                }

                const config = vscode.workspace.getConfiguration('noted');
                // Always save absolute path to global configuration
                await config.update('notesFolder', selectedPath, vscode.ConfigurationTarget.Global);

                console.log('[NOTED DEBUG] Setup custom folder:', selectedPath);
                vscode.window.showInformationMessage(`Notes folder set to: ${selectedPath}`);
                notesProvider.refresh();
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create notes folder: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    context.subscriptions.push(
        openTodayNote, openWithTemplate, insertTimestamp, changeFormat,
        refreshNotes, openNote, deleteNote, renameNote, copyPath, revealInExplorer,
        searchNotes, showStats, exportNotes, duplicateNote, moveNotesFolder,
        setupDefaultFolder, setupCustomFolder, showNotesConfig,
        createCustomTemplate, openTemplatesFolder,
        createFolder, moveNote, renameFolder, deleteFolder, showCalendar
    );
}

async function showCalendarView(context: vscode.ExtensionContext) {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Please configure a notes folder first');
        return;
    }

    const panel = vscode.window.createWebviewPanel(
        'notedCalendar',
        'Calendar View',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    // Get current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Set the initial HTML
    panel.webview.html = await getCalendarHtml(currentYear, currentMonth, notesPath);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'dateClicked':
                    const notes = await getNotesForDate(notesPath, message.year, message.month, message.day);
                    panel.webview.postMessage({ command: 'showNotes', notes: notes, year: message.year, month: message.month, day: message.day });
                    break;
                case 'openNote':
                    const document = await vscode.workspace.openTextDocument(message.filePath);
                    await vscode.window.showTextDocument(document);
                    break;
                case 'createNote':
                    await openNoteForDate(message.year, message.month, message.day);
                    // Refresh the notes list after creating
                    const updatedNotes = await getNotesForDate(notesPath, message.year, message.month, message.day);
                    panel.webview.postMessage({ command: 'showNotes', notes: updatedNotes, year: message.year, month: message.month, day: message.day });
                    break;
                case 'changeMonth':
                    panel.webview.html = await getCalendarHtml(message.year, message.month, notesPath);
                    break;
            }
        },
        undefined,
        context.subscriptions
    );
}

async function getNotesForDate(notesPath: string, year: number, month: number, day: number): Promise<Array<{name: string, path: string}>> {
    const monthStr = (month + 1).toString().padStart(2, '0');
    const monthName = new Date(year, month).toLocaleString('en-US', { month: 'long' });
    const dayStr = day.toString().padStart(2, '0');
    const folderName = `${monthStr}-${monthName}`;
    const datePrefix = `${year}-${monthStr}-${dayStr}`;

    const noteFolder = path.join(notesPath, year.toString(), folderName);

    try {
        await fsp.access(noteFolder);
    } catch {
        return [];
    }

    const notes: Array<{name: string, path: string}> = [];

    try {
        const entries = await fsp.readdir(noteFolder, { withFileTypes: true });

        for (const entry of entries) {
            if (!entry.isDirectory() && (entry.name.endsWith('.txt') || entry.name.endsWith('.md'))) {
                // Check if the file starts with the date prefix (YYYY-MM-DD)
                if (entry.name.startsWith(datePrefix)) {
                    notes.push({
                        name: entry.name,
                        path: path.join(noteFolder, entry.name)
                    });
                }
            }
        }
    } catch (error) {
        console.error('[NOTED] Error reading notes for date:', error);
        return [];
    }

    return notes.sort((a, b) => a.name.localeCompare(b.name));
}

async function openNoteForDate(year: number, month: number, day: number) {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Please configure a notes folder first');
        return;
    }

    try {
        const config = vscode.workspace.getConfiguration('noted');
        const fileFormat = config.get<string>('fileFormat', 'txt');

        // Format month and day with leading zeros
        const monthStr = (month + 1).toString().padStart(2, '0');
        const monthName = new Date(year, month).toLocaleString('en-US', { month: 'long' });
        const dayStr = day.toString().padStart(2, '0');
        const folderName = `${monthStr}-${monthName}`;
        const fileName = `${year}-${monthStr}-${dayStr}.${fileFormat}`;

        const noteFolder = path.join(notesPath, year.toString(), folderName);
        const filePath = path.join(noteFolder, fileName);

        // Create folder if it doesn't exist
        try {
            await fsp.access(noteFolder);
        } catch {
            await fsp.mkdir(noteFolder, { recursive: true });
        }

        // Create note if it doesn't exist
        try {
            await fsp.access(filePath);
        } catch {
            const noteDate = new Date(year, month, day);
            const content = await generateTemplate(undefined, noteDate);
            await fsp.writeFile(filePath, content);
        }

        // Open the note
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open note: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function getCalendarHtml(year: number, month: number, notesPath: string): Promise<string> {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const config = vscode.workspace.getConfiguration('noted');
    const fileFormat = config.get<string>('fileFormat', 'txt');

    // Get days in month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Build calendar grid
    let calendarHtml = '';
    let dayCounter = 1;

    // Generate 6 weeks to accommodate all possible month layouts
    for (let week = 0; week < 6; week++) {
        calendarHtml += '<tr>';
        for (let day = 0; day < 7; day++) {
            const cellIndex = week * 7 + day;
            if (cellIndex < startingDayOfWeek || dayCounter > daysInMonth) {
                calendarHtml += '<td class="empty"></td>';
            } else {
                const hasNote = await checkNoteExists(notesPath, year, month, dayCounter, fileFormat);
                const isToday = isTodayDate(year, month, dayCounter);
                const classes = [];
                if (hasNote) {classes.push('has-note');}
                if (isToday) {classes.push('today');}

                calendarHtml += `<td class="${classes.join(' ')}" data-day="${dayCounter}">
                    <div class="day-number">${dayCounter}</div>
                </td>`;
                dayCounter++;
            }
        }
        calendarHtml += '</tr>';
        if (dayCounter > daysInMonth) {break;}
    }

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Calendar View</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                padding: 20px;
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            .header h2 {
                margin: 0;
                font-size: 24px;
            }
            .nav-buttons button {
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 16px;
                margin: 0 5px;
                cursor: pointer;
                border-radius: 3px;
                font-size: 14px;
            }
            .nav-buttons button:hover {
                background: var(--vscode-button-hoverBackground);
            }
            .calendar {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
            .calendar th {
                padding: 12px;
                text-align: center;
                font-weight: 600;
                color: var(--vscode-foreground);
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            .calendar td {
                padding: 0;
                text-align: center;
                border: 1px solid var(--vscode-panel-border);
                height: 80px;
                width: 14.28%;
                position: relative;
                cursor: pointer;
                vertical-align: top;
            }
            .calendar td.empty {
                background-color: var(--vscode-editor-background);
                cursor: default;
            }
            .calendar td:not(.empty):hover {
                background-color: var(--vscode-list-hoverBackground);
            }
            .day-number {
                padding: 8px;
                font-size: 16px;
            }
            .calendar td.has-note {
                background-color: var(--vscode-textCodeBlock-background);
                font-weight: 600;
            }
            .calendar td.has-note .day-number {
                color: var(--vscode-textLink-foreground);
            }
            .calendar td.today {
                border: 2px solid var(--vscode-focusBorder);
            }
            .legend {
                margin-top: 20px;
                display: flex;
                gap: 20px;
                font-size: 12px;
            }
            .legend-item {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .legend-box {
                width: 20px;
                height: 20px;
                border: 1px solid var(--vscode-panel-border);
            }
            .legend-box.has-note {
                background-color: var(--vscode-textCodeBlock-background);
            }
            .legend-box.today {
                border: 2px solid var(--vscode-focusBorder);
            }
            #notesSection {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid var(--vscode-panel-border);
            }
            .notes-header h3 {
                margin: 0 0 15px 0;
                font-size: 18px;
                color: var(--vscode-foreground);
            }
            #notesList {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .note-item {
                padding: 12px 16px;
                background: var(--vscode-editor-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .note-item:hover {
                background: var(--vscode-list-hoverBackground);
                border-color: var(--vscode-focusBorder);
            }
            .note-item-icon {
                color: var(--vscode-textLink-foreground);
                font-size: 16px;
            }
            .note-item-name {
                flex: 1;
                font-family: var(--vscode-font-family);
                font-size: 14px;
            }
            .create-note-btn {
                padding: 12px 16px;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                width: 100%;
                text-align: left;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .create-note-btn:hover {
                background: var(--vscode-button-hoverBackground);
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h2>${monthNames[month]} ${year}</h2>
            <div class="nav-buttons">
                <button id="prevMonth">← Previous</button>
                <button id="today">Today</button>
                <button id="nextMonth">Next →</button>
            </div>
        </div>
        <table class="calendar">
            <thead>
                <tr>
                    <th>Sun</th>
                    <th>Mon</th>
                    <th>Tue</th>
                    <th>Wed</th>
                    <th>Thu</th>
                    <th>Fri</th>
                    <th>Sat</th>
                </tr>
            </thead>
            <tbody>
                ${calendarHtml}
            </tbody>
        </table>
        <div class="legend">
            <div class="legend-item">
                <div class="legend-box today"></div>
                <span>Today</span>
            </div>
            <div class="legend-item">
                <div class="legend-box has-note"></div>
                <span>Has Note</span>
            </div>
        </div>
        <div id="notesSection" style="display: none;">
            <div class="notes-header">
                <h3 id="notesSectionTitle"></h3>
            </div>
            <div id="notesList"></div>
        </div>
        <script>
            const vscode = acquireVsCodeApi();
            let currentYear = ${year};
            let currentMonth = ${month};

            // Handle day clicks
            document.querySelectorAll('td[data-day]').forEach(cell => {
                cell.addEventListener('click', () => {
                    const day = parseInt(cell.dataset.day);
                    vscode.postMessage({
                        command: 'dateClicked',
                        year: currentYear,
                        month: currentMonth,
                        day: day
                    });
                });
            });

            // Listen for messages from extension
            window.addEventListener('message', event => {
                const message = event.data;
                if (message.command === 'showNotes') {
                    showNotesForDate(message.notes, message.year, message.month, message.day);
                }
            });

            function showNotesForDate(notes, year, month, day) {
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
                const date = new Date(year, month, day);
                const dateStr = monthNames[month] + ' ' + day + ', ' + year;

                const notesSection = document.getElementById('notesSection');
                const notesSectionTitle = document.getElementById('notesSectionTitle');
                const notesList = document.getElementById('notesList');

                notesSectionTitle.textContent = 'Notes for ' + dateStr;
                notesList.innerHTML = '';

                if (notes.length === 0) {
                    notesList.innerHTML = \`
                        <p style="color: var(--vscode-descriptionForeground); margin-bottom: 12px;">No notes found for this date.</p>
                        <button class="create-note-btn" onclick="createNewNote(\${year}, \${month}, \${day})">
                            <span>➕</span>
                            <span>Create New Note</span>
                        </button>
                    \`;
                } else {
                    notes.forEach(note => {
                        const noteItem = document.createElement('div');
                        noteItem.className = 'note-item';
                        noteItem.innerHTML = \`
                            <span class="note-item-icon">📄</span>
                            <span class="note-item-name">\${note.name}</span>
                        \`;
                        noteItem.addEventListener('click', () => {
                            vscode.postMessage({
                                command: 'openNote',
                                filePath: note.path
                            });
                        });
                        notesList.appendChild(noteItem);
                    });

                    // Add create button at the end
                    const createBtn = document.createElement('button');
                    createBtn.className = 'create-note-btn';
                    createBtn.style.marginTop = '8px';
                    createBtn.innerHTML = \`
                        <span>➕</span>
                        <span>Create Another Note</span>
                    \`;
                    createBtn.addEventListener('click', () => {
                        vscode.postMessage({
                            command: 'createNote',
                            year: year,
                            month: month,
                            day: day
                        });
                    });
                    notesList.appendChild(createBtn);
                }

                notesSection.style.display = 'block';
                notesSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            function createNewNote(year, month, day) {
                vscode.postMessage({
                    command: 'createNote',
                    year: year,
                    month: month,
                    day: day
                });
            }

            // Navigation buttons
            document.getElementById('prevMonth').addEventListener('click', () => {
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
                vscode.postMessage({
                    command: 'changeMonth',
                    year: currentYear,
                    month: currentMonth
                });
            });

            document.getElementById('nextMonth').addEventListener('click', () => {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
                vscode.postMessage({
                    command: 'changeMonth',
                    year: currentYear,
                    month: currentMonth
                });
            });

            document.getElementById('today').addEventListener('click', () => {
                const now = new Date();
                currentYear = now.getFullYear();
                currentMonth = now.getMonth();
                vscode.postMessage({
                    command: 'changeMonth',
                    year: currentYear,
                    month: currentMonth
                });
            });
        </script>
    </body>
    </html>`;
}

async function checkNoteExists(notesPath: string, year: number, month: number, day: number, fileFormat: string): Promise<boolean> {
    const monthStr = (month + 1).toString().padStart(2, '0');
    const monthName = new Date(year, month).toLocaleString('en-US', { month: 'long' });
    const dayStr = day.toString().padStart(2, '0');
    const folderName = `${monthStr}-${monthName}`;

    // Check for both .txt and .md files, not just the current format
    const fileName1 = `${year}-${monthStr}-${dayStr}.txt`;
    const fileName2 = `${year}-${monthStr}-${dayStr}.md`;
    const filePath1 = path.join(notesPath, year.toString(), folderName, fileName1);
    const filePath2 = path.join(notesPath, year.toString(), folderName, fileName2);

    try {
        await fsp.access(filePath1);
        return true;
    } catch {
        try {
            await fsp.access(filePath2);
            return true;
        } catch {
            return false;
        }
    }
}

function isTodayDate(year: number, month: number, day: number): boolean {
    const today = new Date();
    return today.getFullYear() === year &&
           today.getMonth() === month &&
           today.getDate() === day;
}

async function initializeNotesFolder() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }

    // Check if notes folder exists - if not, tree view will show welcome actions
    // User can click buttons in the tree view to set up
}

// Helper function to check if a folder name matches year pattern (YYYY)
function isYearFolder(name: string): boolean {
    return /^\d{4}$/.test(name);
}

// Helper function to check if a folder name matches month pattern (MM-MonthName)
function isMonthFolder(name: string): boolean {
    return /^\d{2}-[A-Za-z]+$/.test(name);
}

// Helper function to validate custom folder name
function isValidCustomFolderName(name: string): boolean {
    // Don't allow empty names
    if (!name || name.trim().length === 0) {
        return false;
    }

    // Don't allow names that match date patterns
    if (isYearFolder(name) || isMonthFolder(name)) {
        return false;
    }

    // Don't allow invalid filesystem characters
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(name)) {
        return false;
    }

    return true;
}

// Helper function to get all folders recursively
async function getAllFolders(rootPath: string): Promise<Array<{name: string, path: string}>> {
    const folders: Array<{name: string, path: string}> = [];

    async function scanDir(dir: string, relativePath: string = '') {
        try {
            const entries = await fsp.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const fullPath = path.join(dir, entry.name);
                    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
                    folders.push({
                        name: relPath,
                        path: fullPath
                    });
                    await scanDir(fullPath, relPath);
                }
            }
        } catch (error) {
            console.error('[NOTED] Error scanning directory:', dir, error);
        }
    }

    await scanDir(rootPath);
    return folders;
}

function getNotesPath(): string | null {
    const config = vscode.workspace.getConfiguration('noted');
    const notesFolder = config.get<string>('notesFolder', 'Notes');

    console.log('[NOTED DEBUG] getNotesPath() called:');
    console.log('[NOTED DEBUG] - notesFolder config:', notesFolder);
    console.log('[NOTED DEBUG] - is absolute:', path.isAbsolute(notesFolder));

    // If absolute path, use it directly (this is the preferred approach for global configuration)
    if (path.isAbsolute(notesFolder)) {
        console.log('[NOTED DEBUG] - returning absolute path:', notesFolder);
        return notesFolder;
    }

    // For relative paths, try to resolve against workspace first, then fall back to current folder
    const workspaceFolders = vscode.workspace.workspaceFolders;
    console.log('[NOTED DEBUG] - workspaceFolders exist:', !!workspaceFolders);

    if (workspaceFolders) {
        const rootPath = workspaceFolders[0].uri.fsPath;
        const resolvedPath = path.join(rootPath, notesFolder);
        console.log('[NOTED DEBUG] - returning workspace-relative path:', resolvedPath);
        return resolvedPath;
    }

    // No workspace and relative path - this means user hasn't configured a default location yet
    console.log('[NOTED DEBUG] - no workspace and relative path, returning null');
    return null;
}

function getTemplatesPath(): string | null {
    const notesPath = getNotesPath();
    if (!notesPath) {
        return null;
    }
    return path.join(notesPath, '.noted-templates');
}

async function getCustomTemplates(): Promise<string[]> {
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        return [];
    }

    try {
        await fsp.access(templatesPath);
        const files = await fsp.readdir(templatesPath);
        return files
            .filter(f => f.endsWith('.txt') || f.endsWith('.md'))
            .map(f => path.basename(f, path.extname(f)));
    } catch {
        return [];
    }
}

async function createNewCustomTemplate() {
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
        try {
            await fsp.access(templatesPath);
        } catch {
            await fsp.mkdir(templatesPath, { recursive: true });
        }

        const config = vscode.workspace.getConfiguration('noted');
        const fileFormat = config.get<string>('fileFormat', 'txt');
        const templateFile = path.join(templatesPath, `${templateName}.${fileFormat}`);

        try {
            await fsp.access(templateFile);
            vscode.window.showErrorMessage('Template already exists');
            return;
        } catch {
            // Template doesn't exist, create it
            // Create a starter template
            const starterContent = `File: {filename}
Created: {date} at {time}
==================================================

[Your template content here]

Available placeholders:
- {filename}: The name of the note file
- {date}: The current date
- {time}: The current time
`;

            await fsp.writeFile(templateFile, starterContent);

            const document = await vscode.workspace.openTextDocument(templateFile);
            await vscode.window.showTextDocument(document);
            vscode.window.showInformationMessage(`Template created: ${templateName}`);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create template: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function moveNotesFolderLocation() {
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

        try {
            await fsp.access(currentPath);
        } catch {
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

        try {
            await fsp.access(newPath);
            const entries = await fsp.readdir(newPath);
            if (entries.length > 0) {
                vscode.window.showErrorMessage('Destination folder must be empty');
                return;
            }
        } catch {
            // Folder doesn't exist, create it
            await fsp.mkdir(newPath, { recursive: true });
        }

        // Copy all files recursively
        const copyRecursive = async (src: string, dest: string) => {
            const entries = await fsp.readdir(src, { withFileTypes: true });
            for (const entry of entries) {
                const srcPath = path.join(src, entry.name);
                const destPath = path.join(dest, entry.name);
                if (entry.isDirectory()) {
                    await fsp.mkdir(destPath, { recursive: true });
                    await copyRecursive(srcPath, destPath);
                } else {
                    await fsp.copyFile(srcPath, destPath);
                }
            }
        };

        await copyRecursive(currentPath, newPath);

        // Delete old folder
        await fsp.rm(currentPath, { recursive: true });

        // Save to global configuration
        await config.update('notesFolder', newPath, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Notes moved to: ${newPath}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to move notes: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function openDailyNote(templateType?: string) {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Please open a workspace folder first');
        return;
    }

    try {
        const config = vscode.workspace.getConfiguration('noted');
        const fileFormat = config.get<string>('fileFormat', 'txt');

        const now = new Date();

        const year = now.getFullYear().toString();
        const month = now.toLocaleString('en-US', { month: '2-digit' });
        const monthName = now.toLocaleString('en-US', { month: 'long' });
        const folderName = `${month}-${monthName}`;
        const day = now.toLocaleString('en-US', { day: '2-digit' });
        const fileName = `${year}-${month}-${day}.${fileFormat}`;

        const noteFolder = path.join(notesPath, year, folderName);
        const filePath = path.join(noteFolder, fileName);

        try {
            await fsp.access(noteFolder);
        } catch {
            await fsp.mkdir(noteFolder, { recursive: true });
        }

        try {
            await fsp.access(filePath);
        } catch {
            const content = await generateTemplate(templateType, now);
            await fsp.writeFile(filePath, content);
        }

        const document = await vscode.workspace.openTextDocument(filePath);
        const editor = await vscode.window.showTextDocument(document);

        const lastLine = document.lineCount - 1;
        const lastCharacter = document.lineAt(lastLine).text.length;
        editor.selection = new vscode.Selection(lastLine, lastCharacter, lastLine, lastCharacter);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open daily note: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function createNoteFromTemplate(templateType: string) {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Please open a workspace folder first');
        return;
    }

    try {
        // Ask for note name
        const noteName = await vscode.window.showInputBox({
            prompt: 'Enter note name',
            placeHolder: 'my-note'
        });

        if (!noteName) {
            return;
        }

        // Sanitize filename: replace spaces with dashes, remove special chars
        const sanitizedName = noteName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-_]/g, '');

        const config = vscode.workspace.getConfiguration('noted');
        const fileFormat = config.get<string>('fileFormat', 'txt');

        const now = new Date();

        const year = now.getFullYear().toString();
        const month = now.toLocaleString('en-US', { month: '2-digit' });
        const monthName = now.toLocaleString('en-US', { month: 'long' });
        const folderName = `${month}-${monthName}`;
        const day = now.toLocaleString('en-US', { day: '2-digit' });
        const time = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(':', '');

        const noteFolder = path.join(notesPath, year, folderName);
        const fileName = `${year}-${month}-${day}-${time}-${sanitizedName}.${fileFormat}`;
        const filePath = path.join(noteFolder, fileName);

        try {
            await fsp.access(noteFolder);
        } catch {
            await fsp.mkdir(noteFolder, { recursive: true });
        }

        try {
            await fsp.access(filePath);
            vscode.window.showWarningMessage('A note with this name already exists');
            return;
        } catch {
            // File doesn't exist, create it
            const content = await generateTemplate(templateType, now, fileName);
            await fsp.writeFile(filePath, content);

            const document = await vscode.workspace.openTextDocument(filePath);
            const editor = await vscode.window.showTextDocument(document);

            const lastLine = document.lineCount - 1;
            const lastCharacter = document.lineAt(lastLine).text.length;
            editor.selection = new vscode.Selection(lastLine, lastCharacter, lastLine, lastCharacter);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create note: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function generateTemplate(templateType: string | undefined, date: Date, filename?: string): Promise<string> {
    const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    // Always include timestamp in frontmatter
    const frontmatter = filename
        ? `File: ${filename}\nCreated: ${dateStr} at ${timeStr}\n${'='.repeat(50)}\n\n`
        : `Created: ${dateStr} at ${timeStr}\n${'='.repeat(50)}\n\n`;

    // Check if it's a custom template
    const templatesPath = getTemplatesPath();
    if (templatesPath && templateType) {
        try {
            await fsp.access(templatesPath);
            const config = vscode.workspace.getConfiguration('noted');
            const fileFormat = config.get<string>('fileFormat', 'txt');
            const customTemplatePath = path.join(templatesPath, `${templateType}.${fileFormat}`);

            try {
                const content = await fsp.readFile(customTemplatePath, 'utf8');

                // Replace placeholders
                let processedContent = content.replace(/{filename}/g, filename || '');
                processedContent = processedContent.replace(/{date}/g, dateStr);
                processedContent = processedContent.replace(/{time}/g, timeStr);

                return processedContent;
            } catch {
                // Custom template doesn't exist, fall through to built-in templates
            }
        } catch {
            // Templates folder doesn't exist, fall through to built-in templates
        }
    }

    // Built-in templates
    const templates: Record<string, string> = {
        'problem-solution': `${frontmatter}PROBLEM:


STEPS TAKEN:
1.

SOLUTION:


NOTES:

`,
        'meeting': `${frontmatter}MEETING:
ATTENDEES:

AGENDA:
-

NOTES:


ACTION ITEMS:
-

`,
        'research': `${frontmatter}TOPIC:

QUESTIONS:
-

FINDINGS:


SOURCES:
-

NEXT STEPS:


`,
        'quick': `${frontmatter}`
    };

    return templates[templateType || 'quick'] || `${dateStr}\n${'='.repeat(50)}\n\n`;
}

async function searchInNotes(query: string): Promise<Array<{file: string, preview: string}>> {
    const notesPath = getNotesPath();
    if (!notesPath) {
        return [];
    }

    try {
        await fsp.access(notesPath);
    } catch {
        return [];
    }

    const results: Array<{file: string, preview: string}> = [];
    const searchLower = query.toLowerCase();

    async function searchDir(dir: string) {
        try {
            const entries = await fsp.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await searchDir(fullPath);
                } else if (entry.name.endsWith('.txt') || entry.name.endsWith('.md')) {
                    try {
                        const content = await fsp.readFile(fullPath, 'utf8');
                        if (content.toLowerCase().includes(searchLower)) {
                            const lines = content.split('\n');
                            const matchLine = lines.find(l => l.toLowerCase().includes(searchLower));
                            results.push({
                                file: fullPath,
                                preview: matchLine?.trim().substring(0, 80) || ''
                            });
                        }
                    } catch (error) {
                        console.error('[NOTED] Error reading file:', fullPath, error);
                    }
                }
            }
        } catch (error) {
            console.error('[NOTED] Error reading directory:', dir, error);
        }
    }

    await searchDir(notesPath);
    return results;
}

async function getNoteStats(): Promise<{total: number, thisWeek: number, thisMonth: number}> {
    const notesPath = getNotesPath();
    if (!notesPath) {
        return { total: 0, thisWeek: 0, thisMonth: 0 };
    }

    try {
        await fsp.access(notesPath);
    } catch {
        return { total: 0, thisWeek: 0, thisMonth: 0 };
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let total = 0;
    let thisWeek = 0;
    let thisMonth = 0;

    async function countFiles(dir: string) {
        try {
            const entries = await fsp.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await countFiles(fullPath);
                } else if (entry.name.endsWith('.txt') || entry.name.endsWith('.md')) {
                    total++;
                    try {
                        const stat = await fsp.stat(fullPath);
                        if (stat.mtime >= weekAgo) {thisWeek++;}
                        if (stat.mtime >= monthStart) {thisMonth++;}
                    } catch (error) {
                        console.error('[NOTED] Error stating file:', fullPath, error);
                    }
                }
            }
        } catch (error) {
            console.error('[NOTED] Error reading directory:', dir, error);
        }
    }

    await countFiles(notesPath);
    return { total, thisWeek, thisMonth };
}

async function exportNotesToFile(range: string) {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Please open a workspace folder first');
        return;
    }

    try {
        await fsp.access(notesPath);
    } catch {
        vscode.window.showErrorMessage('No notes found');
        return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;

    const now = new Date();
    let filterDate: Date;

    if (range === 'This Week') {
        filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === 'This Month') {
        filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
        filterDate = new Date(0);
    }

    let combinedContent = `Exported Notes - ${range}\n${'='.repeat(50)}\n\n`;

    async function collectNotes(dir: string) {
        try {
            const entries = await fsp.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await collectNotes(fullPath);
                } else if (entry.name.endsWith('.txt') || entry.name.endsWith('.md')) {
                    try {
                        const stat = await fsp.stat(fullPath);
                        if (stat.mtime >= filterDate) {
                            const content = await fsp.readFile(fullPath, 'utf8');
                            combinedContent += `\n\n--- ${entry.name} ---\n\n${content}`;
                        }
                    } catch (error) {
                        console.error('[NOTED] Error processing file:', fullPath, error);
                    }
                }
            }
        } catch (error) {
            console.error('[NOTED] Error reading directory:', dir, error);
        }
    }

    try {
        await collectNotes(notesPath);

        const exportPath = path.join(rootPath, `notes-export-${Date.now()}.txt`);
        await fsp.writeFile(exportPath, combinedContent);

        const document = await vscode.workspace.openTextDocument(exportPath);
        await vscode.window.showTextDocument(document);
        vscode.window.showInformationMessage(`Exported to ${path.basename(exportPath)}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to export notes: ${error instanceof Error ? error.message : String(error)}`);
    }
}

class TemplatesTreeProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    // Return empty array - templates are shown via viewsWelcome
    getChildren(_element?: TreeItem): Thenable<TreeItem[]> {
        return Promise.resolve([]);
    }
}

class NotesTreeProvider implements vscode.TreeDataProvider<TreeItem>, vscode.TreeDragAndDropController<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    // Drag and drop support
    dropMimeTypes = ['application/vnd.code.tree.notedView'];
    dragMimeTypes = ['text/uri-list'];

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    async handleDrag(source: readonly TreeItem[], dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        // Only allow dragging notes, not folders or sections
        const notes = source.filter(item => item instanceof NoteItem && item.type === 'note');
        if (notes.length > 0) {
            dataTransfer.set('application/vnd.code.tree.notedView', new vscode.DataTransferItem(notes));
        }
    }

    async handleDrop(target: TreeItem | undefined, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        const transferItem = dataTransfer.get('application/vnd.code.tree.notedView');
        if (!transferItem) {
            return;
        }

        const draggedItems = transferItem.value as NoteItem[];
        if (!draggedItems || draggedItems.length === 0) {
            return;
        }

        // Determine the target folder
        let targetFolderPath: string | null = null;

        if (!target) {
            // Dropped on root - not allowed
            vscode.window.showErrorMessage('Cannot move notes to root level');
            return;
        }

        if (target instanceof NoteItem) {
            if (target.type === 'note') {
                // Dropped on another note - move to its parent folder
                targetFolderPath = path.dirname(target.filePath);
            } else if (target.type === 'month' || target.type === 'custom-folder') {
                // Dropped on a folder - use that folder
                targetFolderPath = target.filePath;
            } else if (target.type === 'year') {
                // Dropped on a year - not allowed (no direct notes in year folders)
                vscode.window.showErrorMessage('Cannot move notes directly into year folders. Please drop into a month folder.');
                return;
            }
        } else if (target instanceof SectionItem) {
            // Dropped on section - not allowed
            vscode.window.showErrorMessage('Cannot move notes into sections');
            return;
        }

        if (!targetFolderPath) {
            return;
        }

        // Move each dragged note
        for (const draggedItem of draggedItems) {
            if (!(draggedItem instanceof NoteItem) || draggedItem.type !== 'note') {
                continue;
            }

            const sourceFilePath = draggedItem.filePath;
            const fileName = path.basename(sourceFilePath);
            const destinationPath = path.join(targetFolderPath, fileName);

            // Check if source and destination are the same
            if (sourceFilePath === destinationPath) {
                continue;
            }

            // Check if file already exists at destination
            try {
                await fsp.access(destinationPath);
                vscode.window.showErrorMessage(`A file named "${fileName}" already exists in the destination folder`);
                continue;
            } catch {
                // File doesn't exist, proceed with move
                try {
                    await fsp.rename(sourceFilePath, destinationPath);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to move note: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        }

        // Refresh the tree view
        this.refresh();

        if (draggedItems.length === 1) {
            vscode.window.showInformationMessage(`Moved note to ${path.basename(targetFolderPath)}`);
        } else {
            vscode.window.showInformationMessage(`Moved ${draggedItems.length} notes to ${path.basename(targetFolderPath)}`);
        }
    }

    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: TreeItem): Promise<TreeItem[]> {
        const notesPath = getNotesPath();
        console.log('[NOTED DEBUG] TreeProvider.getChildren() called:');
        console.log('[NOTED DEBUG] - notesPath:', notesPath);
        
        if (!notesPath) {
            console.log('[NOTED DEBUG] - showing welcome screen (no notesPath)');
            return [];
        }

        // Auto-create the notes folder if it's configured but doesn't exist
        try {
            await fsp.access(notesPath);
        } catch {
            const config = vscode.workspace.getConfiguration('noted');
            const notesFolder = config.get<string>('notesFolder', 'Notes');
            console.log('[NOTED DEBUG] - notes folder does not exist, checking if should auto-create');
            console.log('[NOTED DEBUG] - notesFolder config:', notesFolder);
            console.log('[NOTED DEBUG] - is absolute:', path.isAbsolute(notesFolder));

            // Auto-create if it's an absolute path (user has configured it)
            if (path.isAbsolute(notesFolder)) {
                console.log('[NOTED DEBUG] - auto-creating configured absolute path folder');
                try {
                    await fsp.mkdir(notesPath, { recursive: true });
                    console.log('[NOTED DEBUG] - successfully created notes folder');
                } catch (error) {
                    console.error('[NOTED DEBUG] Failed to create notes folder:', error);
                    vscode.window.showErrorMessage(`Failed to create notes folder: ${error instanceof Error ? error.message : String(error)}`);
                    return [];
                }
            } else {
                console.log('[NOTED DEBUG] - relative path without workspace, showing welcome screen');
                // Not properly configured yet, show welcome screen
                return [];
            }
        }

        if (!element) {
            // Root level - show recent notes, years, and custom folders
            const items: TreeItem[] = [];

            // Recent notes section
            items.push(new SectionItem('Recent Notes', 'recent'));

            try {
                // Get all directories in notes path
                const allEntries = await fsp.readdir(notesPath, { withFileTypes: true });
                const entries = [];

                for (const entry of allEntries) {
                    if (entry.isDirectory()) {
                        entries.push(entry.name);
                    }
                }

                entries.sort().reverse();

                // Separate years and custom folders
                const years: string[] = [];
                const customFolders: string[] = [];

                entries.forEach(entry => {
                    if (isYearFolder(entry)) {
                        years.push(entry);
                    } else {
                        customFolders.push(entry);
                    }
                });

                // Add custom folders first (sorted alphabetically)
                customFolders.sort();
                items.push(...customFolders.map(folder =>
                    new NoteItem(folder, path.join(notesPath, folder), vscode.TreeItemCollapsibleState.Collapsed, 'custom-folder')
                ));

                // Then add years (already sorted in reverse)
                items.push(...years.map(year =>
                    new NoteItem(year, path.join(notesPath, year), vscode.TreeItemCollapsibleState.Collapsed, 'year')
                ));
            } catch (error) {
                console.error('[NOTED] Error reading notes directory:', error);
            }

            return items;
        } else if (element instanceof SectionItem) {
            if (element.sectionType === 'recent') {
                return this.getRecentNotes(notesPath);
            }
        } else if (element instanceof NoteItem) {
            if (element.type === 'year') {
                try {
                    const allEntries = await fsp.readdir(element.filePath, { withFileTypes: true });
                    const entries = [];

                    for (const entry of allEntries) {
                        if (entry.isDirectory()) {
                            entries.push(entry.name);
                        }
                    }

                    entries.sort().reverse();

                    // In year folders, show months and custom folders
                    const months: string[] = [];
                    const customFolders: string[] = [];

                    entries.forEach(entry => {
                        if (isMonthFolder(entry)) {
                            months.push(entry);
                        } else {
                            customFolders.push(entry);
                        }
                    });

                    const items: NoteItem[] = [];

                    // Add custom folders first
                    customFolders.sort();
                    items.push(...customFolders.map(folder =>
                        new NoteItem(folder, path.join(element.filePath, folder), vscode.TreeItemCollapsibleState.Collapsed, 'custom-folder')
                    ));

                    // Then add months
                    items.push(...months.map(month =>
                        new NoteItem(month, path.join(element.filePath, month), vscode.TreeItemCollapsibleState.Collapsed, 'month')
                    ));

                    return items;
                } catch (error) {
                    console.error('[NOTED] Error reading year folder:', element.filePath, error);
                    return [];
                }
            } else if (element.type === 'month' || element.type === 'custom-folder') {
                // Both month and custom folders can contain notes and subfolders
                try {
                    const entries = await fsp.readdir(element.filePath, { withFileTypes: true });
                    const items: NoteItem[] = [];

                    // Get subdirectories (custom folders only, no date folders allowed inside)
                    const subfolders = entries
                        .filter(e => e.isDirectory())
                        .map(e => e.name)
                        .sort();

                    items.push(...subfolders.map(folder =>
                        new NoteItem(folder, path.join(element.filePath, folder), vscode.TreeItemCollapsibleState.Collapsed, 'custom-folder')
                    ));

                    // Get notes
                    const notes = entries
                        .filter(e => !e.isDirectory() && (e.name.endsWith('.txt') || e.name.endsWith('.md')))
                        .map(e => e.name)
                        .sort()
                        .reverse();

                    items.push(...notes.map(note => {
                        const filePath = path.join(element.filePath, note);
                        const item = new NoteItem(note, filePath, vscode.TreeItemCollapsibleState.None, 'note');
                        item.command = {
                            command: 'noted.openNote',
                            title: 'Open Note',
                            arguments: [filePath]
                        };
                        return item;
                    }));

                    return items;
                } catch (error) {
                    console.error('[NOTED] Error reading folder:', element.filePath, error);
                    return [];
                }
            }
        }

        return [];
    }

    private async getRecentNotes(notesPath: string): Promise<TreeItem[]> {
        const allNotes: Array<{path: string, mtime: Date, name: string}> = [];

        async function findNotes(dir: string) {
            try {
                const entries = await fsp.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        await findNotes(fullPath);
                    } else if (entry.name.endsWith('.txt') || entry.name.endsWith('.md')) {
                        try {
                            const stat = await fsp.stat(fullPath);
                            allNotes.push({ path: fullPath, mtime: stat.mtime, name: entry.name });
                        } catch (error) {
                            console.error('[NOTED] Error stating file:', fullPath, error);
                        }
                    }
                }
            } catch (error) {
                console.error('[NOTED] Error reading directory:', dir, error);
            }
        }

        await findNotes(notesPath);
        allNotes.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

        return allNotes.slice(0, 10).map(note => {
            const item = new NoteItem(note.name, note.path, vscode.TreeItemCollapsibleState.None, 'note');
            item.command = {
                command: 'noted.openNote',
                title: 'Open Note',
                arguments: [note.path]
            };
            item.contextValue = 'note';
            return item;
        });
    }
}

class TreeItem extends vscode.TreeItem {}


class SectionItem extends TreeItem {
    constructor(
        public readonly label: string,
        public readonly sectionType: string
    ) {
        super(label, vscode.TreeItemCollapsibleState.Collapsed);
        this.iconPath = new vscode.ThemeIcon('history');
    }
}

class NoteItem extends TreeItem {
    public filePath: string;

    constructor(
        public readonly label: string,
        filePath: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly type: 'year' | 'month' | 'note' | 'custom-folder'
    ) {
        super(label, collapsibleState);

        this.filePath = filePath;
        this.resourceUri = vscode.Uri.file(filePath);

        if (type === 'note') {
            this.iconPath = new vscode.ThemeIcon('note');
            this.contextValue = 'note';
        } else if (type === 'month') {
            this.iconPath = new vscode.ThemeIcon('calendar');
            this.contextValue = 'month';
        } else if (type === 'year') {
            this.iconPath = new vscode.ThemeIcon('folder');
            this.contextValue = 'year';
        } else if (type === 'custom-folder') {
            this.iconPath = new vscode.ThemeIcon('folder-opened');
            this.contextValue = 'custom-folder';
        }
    }
}

export function deactivate() {}