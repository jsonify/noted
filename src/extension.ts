import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

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
    vscode.window.registerTreeDataProvider('notedView', notesProvider);

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
            const customTemplates = getCustomTemplates();
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
            fs.unlinkSync(item.filePath);
            notesProvider.refresh();
            vscode.window.showInformationMessage(`Deleted ${item.label}`);
        }
    });

    // Command to rename note
    let renameNote = vscode.commands.registerCommand('noted.renameNote', async (item: NoteItem) => {
        const newName = await vscode.window.showInputBox({
            prompt: 'Enter new name',
            value: item.label
        });
        if (newName && newName !== item.label) {
            const dir = path.dirname(item.filePath);
            const newPath = path.join(dir, newName);
            fs.renameSync(item.filePath, newPath);
            notesProvider.refresh();
            vscode.window.showInformationMessage(`Renamed to ${newName}`);
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
        const content = fs.readFileSync(item.filePath, 'utf8');
        const dir = path.dirname(item.filePath);
        const ext = path.extname(item.label);
        const base = path.basename(item.label, ext);
        const newName = `${base}-copy${ext}`;
        const newPath = path.join(dir, newName);

        fs.writeFileSync(newPath, content);
        notesProvider.refresh();
        vscode.window.showInformationMessage(`Duplicated as ${newName}`);
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

        if (fs.existsSync(newFolderPath)) {
            vscode.window.showErrorMessage('Folder already exists');
            return;
        }

        try {
            fs.mkdirSync(newFolderPath, { recursive: true });
            notesProvider.refresh();
            vscode.window.showInformationMessage(`Created folder: ${folderName}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create folder: ${error}`);
        }
    });

    // Command to move note
    let moveNote = vscode.commands.registerCommand('noted.moveNote', async (item: NoteItem) => {
        const notesPath = getNotesPath();
        if (!notesPath || item.type !== 'note') {
            return;
        }

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

        if (fs.existsSync(newPath)) {
            vscode.window.showErrorMessage('A file with this name already exists in the destination folder');
            return;
        }

        try {
            fs.renameSync(item.filePath, newPath);
            notesProvider.refresh();
            vscode.window.showInformationMessage(`Moved to ${selected.folder.name}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to move note: ${error}`);
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

        if (fs.existsSync(newPath)) {
            vscode.window.showErrorMessage('A folder with this name already exists');
            return;
        }

        try {
            fs.renameSync(item.filePath, newPath);
            notesProvider.refresh();
            vscode.window.showInformationMessage(`Renamed to ${newName}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to rename folder: ${error}`);
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
            fs.rmSync(item.filePath, { recursive: true, force: true });
            notesProvider.refresh();
            vscode.window.showInformationMessage(`Deleted folder: ${item.label}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to delete folder: ${error}`);
        }
    });

    // Command to show current notes folder configuration (for debugging)
    let showNotesConfig = vscode.commands.registerCommand('noted.showConfig', async () => {
        const config = vscode.workspace.getConfiguration('noted');
        const notesFolder = config.get<string>('notesFolder', 'Notes');
        const notesPath = getNotesPath();
        const isAbsolute = path.isAbsolute(notesFolder);

        const message = `Notes Configuration:\n\n` +
            `Config value: ${notesFolder}\n` +
            `Is absolute: ${isAbsolute}\n` +
            `Resolved path: ${notesPath}\n` +
            `Exists: ${notesPath && fs.existsSync(notesPath)}`;

        vscode.window.showInformationMessage(message, { modal: true });
    });

    // Command to setup default folder
    let setupDefaultFolder = vscode.commands.registerCommand('noted.setupDefaultFolder', async () => {
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
        if (!fs.existsSync(defaultNotesPath)) {
            try {
                fs.mkdirSync(defaultNotesPath, { recursive: true });
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to create default notes folder: ${error}`);
                return;
            }
        }

        const config = vscode.workspace.getConfiguration('noted');
        
        // Always save absolute path to global configuration so it works across all windows
        await config.update('notesFolder', defaultNotesPath, vscode.ConfigurationTarget.Global);
        
        console.log('[NOTED DEBUG] Setup default folder:', defaultNotesPath);
        vscode.window.showInformationMessage(`Notes folder created at: ${defaultNotesPath}`);
        notesProvider.refresh();
    });

    // Command to create custom template
    let createCustomTemplate = vscode.commands.registerCommand('noted.createCustomTemplate', async () => {
        await createNewCustomTemplate();
        templatesProvider.refresh();
    });

    // Command to open templates folder
    let openTemplatesFolder = vscode.commands.registerCommand('noted.openTemplatesFolder', async () => {
        const templatesPath = getTemplatesPath();
        if (templatesPath && fs.existsSync(templatesPath)) {
            await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(templatesPath));
        } else {
            vscode.window.showErrorMessage('Templates folder does not exist');
        }
    });

    // Command to setup custom folder
    let setupCustomFolder = vscode.commands.registerCommand('noted.setupCustomFolder', async () => {
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

            if (!fs.existsSync(selectedPath)) {
                try {
                    fs.mkdirSync(selectedPath, { recursive: true });
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to create notes folder: ${error}`);
                    return;
                }
            }

            const config = vscode.workspace.getConfiguration('noted');
            // Always save absolute path to global configuration
            await config.update('notesFolder', selectedPath, vscode.ConfigurationTarget.Global);
            
            console.log('[NOTED DEBUG] Setup custom folder:', selectedPath);
            vscode.window.showInformationMessage(`Notes folder set to: ${selectedPath}`);
            notesProvider.refresh();
        }
    });

    context.subscriptions.push(
        openTodayNote, openWithTemplate, insertTimestamp, changeFormat,
        refreshNotes, openNote, deleteNote, renameNote, copyPath, revealInExplorer,
        searchNotes, showStats, exportNotes, duplicateNote, moveNotesFolder,
        setupDefaultFolder, setupCustomFolder, showNotesConfig,
        createCustomTemplate, openTemplatesFolder,
        createFolder, moveNote, renameFolder, deleteFolder
    );
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

    function scanDir(dir: string, relativePath: string = '') {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const fullPath = path.join(dir, entry.name);
                const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
                folders.push({
                    name: relPath,
                    path: fullPath
                });
                scanDir(fullPath, relPath);
            }
        }
    }

    scanDir(rootPath);
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

function getCustomTemplates(): string[] {
    const templatesPath = getTemplatesPath();
    if (!templatesPath || !fs.existsSync(templatesPath)) {
        return [];
    }

    return fs.readdirSync(templatesPath)
        .filter(f => f.endsWith('.txt') || f.endsWith('.md'))
        .map(f => path.basename(f, path.extname(f)));
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

    // Create templates folder if it doesn't exist
    if (!fs.existsSync(templatesPath)) {
        fs.mkdirSync(templatesPath, { recursive: true });
    }

    const config = vscode.workspace.getConfiguration('noted');
    const fileFormat = config.get<string>('fileFormat', 'txt');
    const templateFile = path.join(templatesPath, `${templateName}.${fileFormat}`);

    if (fs.existsSync(templateFile)) {
        vscode.window.showErrorMessage('Template already exists');
        return;
    }

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

    fs.writeFileSync(templateFile, starterContent);

    const document = await vscode.workspace.openTextDocument(templateFile);
    await vscode.window.showTextDocument(document);
    vscode.window.showInformationMessage(`Template created: ${templateName}`);
}

async function moveNotesFolderLocation() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('Please open a workspace folder first');
        return;
    }

    const config = vscode.workspace.getConfiguration('noted');
    const currentFolder = config.get<string>('notesFolder', 'notes');
    
    // Handle both relative and absolute paths
    const rootPath = workspaceFolders[0].uri.fsPath;
    const currentPath = path.isAbsolute(currentFolder) 
        ? currentFolder 
        : path.join(rootPath, currentFolder);

    if (!fs.existsSync(currentPath)) {
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

    if (fs.existsSync(newPath) && fs.readdirSync(newPath).length > 0) {
        vscode.window.showErrorMessage('Destination folder must be empty');
        return;
    }

    try {
        if (!fs.existsSync(newPath)) {
            fs.mkdirSync(newPath, { recursive: true });
        }
        
        // Copy all files recursively
        const copyRecursive = (src: string, dest: string) => {
            const entries = fs.readdirSync(src, { withFileTypes: true });
            for (const entry of entries) {
                const srcPath = path.join(src, entry.name);
                const destPath = path.join(dest, entry.name);
                if (entry.isDirectory()) {
                    fs.mkdirSync(destPath, { recursive: true });
                    copyRecursive(srcPath, destPath);
                } else {
                    fs.copyFileSync(srcPath, destPath);
                }
            }
        };
        
        copyRecursive(currentPath, newPath);
        
        // Delete old folder
        fs.rmSync(currentPath, { recursive: true });
        
        // Save to global configuration
        await config.update('notesFolder', newPath, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Notes moved to: ${newPath}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to move notes: ${error}`);
    }
}

async function openDailyNote(templateType?: string) {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Please open a workspace folder first');
        return;
    }

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

    if (!fs.existsSync(noteFolder)) {
        fs.mkdirSync(noteFolder, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
        const content = generateTemplate(templateType, now);
        fs.writeFileSync(filePath, content);
    }

    const document = await vscode.workspace.openTextDocument(filePath);
    const editor = await vscode.window.showTextDocument(document);
    
    const lastLine = document.lineCount - 1;
    const lastCharacter = document.lineAt(lastLine).text.length;
    editor.selection = new vscode.Selection(lastLine, lastCharacter, lastLine, lastCharacter);
}

async function createNoteFromTemplate(templateType: string) {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Please open a workspace folder first');
        return;
    }

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

    if (!fs.existsSync(noteFolder)) {
        fs.mkdirSync(noteFolder, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
        vscode.window.showWarningMessage('A note with this name already exists');
        return;
    }

    const content = generateTemplate(templateType, now, fileName);
    fs.writeFileSync(filePath, content);

    const document = await vscode.workspace.openTextDocument(filePath);
    const editor = await vscode.window.showTextDocument(document);
    
    const lastLine = document.lineCount - 1;
    const lastCharacter = document.lineAt(lastLine).text.length;
    editor.selection = new vscode.Selection(lastLine, lastCharacter, lastLine, lastCharacter);
}

function generateTemplate(templateType: string | undefined, date: Date, filename?: string): string {
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
    if (templatesPath && templateType && fs.existsSync(templatesPath)) {
        const config = vscode.workspace.getConfiguration('noted');
        const fileFormat = config.get<string>('fileFormat', 'txt');
        const customTemplatePath = path.join(templatesPath, `${templateType}.${fileFormat}`);

        if (fs.existsSync(customTemplatePath)) {
            let content = fs.readFileSync(customTemplatePath, 'utf8');

            // Replace placeholders
            content = content.replace(/{filename}/g, filename || '');
            content = content.replace(/{date}/g, dateStr);
            content = content.replace(/{time}/g, timeStr);

            return content;
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

    if (!fs.existsSync(notesPath)) {
        return [];
    }

    const results: Array<{file: string, preview: string}> = [];
    const searchLower = query.toLowerCase();

    function searchDir(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                searchDir(fullPath);
            } else if (entry.name.endsWith('.txt') || entry.name.endsWith('.md')) {
                const content = fs.readFileSync(fullPath, 'utf8');
                if (content.toLowerCase().includes(searchLower)) {
                    const lines = content.split('\n');
                    const matchLine = lines.find(l => l.toLowerCase().includes(searchLower));
                    results.push({
                        file: fullPath,
                        preview: matchLine?.trim().substring(0, 80) || ''
                    });
                }
            }
        }
    }

    searchDir(notesPath);
    return results;
}

async function getNoteStats(): Promise<{total: number, thisWeek: number, thisMonth: number}> {
    const notesPath = getNotesPath();
    if (!notesPath) {
        return { total: 0, thisWeek: 0, thisMonth: 0 };
    }

    if (!fs.existsSync(notesPath)) {
        return { total: 0, thisWeek: 0, thisMonth: 0 };
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let total = 0;
    let thisWeek = 0;
    let thisMonth = 0;

    function countFiles(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                countFiles(fullPath);
            } else if (entry.name.endsWith('.txt') || entry.name.endsWith('.md')) {
                total++;
                const stat = fs.statSync(fullPath);
                if (stat.mtime >= weekAgo) thisWeek++;
                if (stat.mtime >= monthStart) thisMonth++;
            }
        }
    }

    countFiles(notesPath);
    return { total, thisWeek, thisMonth };
}

async function exportNotesToFile(range: string) {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Please open a workspace folder first');
        return;
    }

    if (!fs.existsSync(notesPath)) {
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

    function collectNotes(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                collectNotes(fullPath);
            } else if (entry.name.endsWith('.txt') || entry.name.endsWith('.md')) {
                const stat = fs.statSync(fullPath);
                if (stat.mtime >= filterDate) {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    combinedContent += `\n\n--- ${entry.name} ---\n\n${content}`;
                }
            }
        }
    }

    collectNotes(notesPath);

    const exportPath = path.join(rootPath, `notes-export-${Date.now()}.txt`);
    fs.writeFileSync(exportPath, combinedContent);
    
    const document = await vscode.workspace.openTextDocument(exportPath);
    await vscode.window.showTextDocument(document);
    vscode.window.showInformationMessage(`Exported to ${path.basename(exportPath)}`);
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

class NotesTreeProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TreeItem): Thenable<TreeItem[]> {
        const notesPath = getNotesPath();
        console.log('[NOTED DEBUG] TreeProvider.getChildren() called:');
        console.log('[NOTED DEBUG] - notesPath:', notesPath);
        
        if (!notesPath) {
            console.log('[NOTED DEBUG] - showing welcome screen (no notesPath)');
            return Promise.resolve([]);
        }

        // Auto-create the notes folder if it's configured but doesn't exist
        if (!fs.existsSync(notesPath)) {
            const config = vscode.workspace.getConfiguration('noted');
            const notesFolder = config.get<string>('notesFolder', 'Notes');
            console.log('[NOTED DEBUG] - notes folder does not exist, checking if should auto-create');
            console.log('[NOTED DEBUG] - notesFolder config:', notesFolder);
            console.log('[NOTED DEBUG] - is absolute:', path.isAbsolute(notesFolder));

            // Auto-create if it's an absolute path (user has configured it)
            if (path.isAbsolute(notesFolder)) {
                console.log('[NOTED DEBUG] - auto-creating configured absolute path folder');
                try {
                    fs.mkdirSync(notesPath, { recursive: true });
                    console.log('[NOTED DEBUG] - successfully created notes folder');
                } catch (error) {
                    console.error('[NOTED DEBUG] Failed to create notes folder:', error);
                    vscode.window.showErrorMessage(`Failed to create notes folder: ${error}`);
                    return Promise.resolve([]);
                }
            } else {
                console.log('[NOTED DEBUG] - relative path without workspace, showing welcome screen');
                // Not properly configured yet, show welcome screen
                return Promise.resolve([]);
            }
        }

        if (!element) {
            // Root level - show recent notes, years, and custom folders
            const items: TreeItem[] = [];

            // Recent notes section
            items.push(new SectionItem('Recent Notes', 'recent'));

            // Get all directories in notes path
            const entries = fs.readdirSync(notesPath)
                .filter(f => fs.statSync(path.join(notesPath, f)).isDirectory())
                .sort()
                .reverse();

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

            return Promise.resolve(items);
        } else if (element instanceof SectionItem) {
            if (element.sectionType === 'recent') {
                return this.getRecentNotes(notesPath);
            }
        } else if (element instanceof NoteItem) {
            if (element.type === 'year') {
                const entries = fs.readdirSync(element.filePath)
                    .filter(f => fs.statSync(path.join(element.filePath, f)).isDirectory())
                    .sort()
                    .reverse();

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

                return Promise.resolve(items);
            } else if (element.type === 'month' || element.type === 'custom-folder') {
                // Both month and custom folders can contain notes and subfolders
                const entries = fs.readdirSync(element.filePath, { withFileTypes: true });
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

                return Promise.resolve(items);
            }
        }

        return Promise.resolve([]);
    }

    private getRecentNotes(notesPath: string): Thenable<TreeItem[]> {
        const allNotes: Array<{path: string, mtime: Date, name: string}> = [];

        function findNotes(dir: string) {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    findNotes(fullPath);
                } else if (entry.name.endsWith('.txt') || entry.name.endsWith('.md')) {
                    const stat = fs.statSync(fullPath);
                    allNotes.push({ path: fullPath, mtime: stat.mtime, name: entry.name });
                }
            }
        }

        findNotes(notesPath);
        allNotes.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
        
        return Promise.resolve(allNotes.slice(0, 10).map(note => {
            const item = new NoteItem(note.name, note.path, vscode.TreeItemCollapsibleState.None, 'note');
            item.command = {
                command: 'noted.openNote',
                title: 'Open Note',
                arguments: [note.path]
            };
            item.contextValue = 'note';
            return item;
        }));
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