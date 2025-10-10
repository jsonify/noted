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

    // Create tree data provider
    const notesProvider = new NotesTreeProvider();
    vscode.window.registerTreeDataProvider('notedView', notesProvider);

    // Command to open today's note
    let openTodayNote = vscode.commands.registerCommand('noted.openToday', async () => {
        await openDailyNote();
        notesProvider.refresh();
    });

    // Command to open with template
    let openWithTemplate = vscode.commands.registerCommand('noted.openWithTemplate', async (templateType: string) => {
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
        refreshNotes, openNote, deleteNote, renameNote, copyPath,
        searchNotes, showStats, exportNotes, duplicateNote, moveNotesFolder,
        setupDefaultFolder, setupCustomFolder, showNotesConfig
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
    
    const noteFolder = path.join(notesPath, year, folderName);
    const fileName = `${sanitizedName}.${fileFormat}`;
    const filePath = path.join(noteFolder, fileName);

    if (!fs.existsSync(noteFolder)) {
        fs.mkdirSync(noteFolder, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
        vscode.window.showErrorMessage('Note already exists');
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

    const frontmatter = filename ? `File: ${filename}\nCreated: ${dateStr} at ${timeStr}\n${'='.repeat(50)}\n\n` : `${dateStr}\n${'='.repeat(50)}\n\n`;

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
            // Root level - show templates, recent, and years
            const items: TreeItem[] = [];
            
            // Template section
            items.push(new SectionItem('Templates', 'templates'));
            
            // Recent notes section
            items.push(new SectionItem('Recent Notes', 'recent'));
            
            // Years
            const years = fs.readdirSync(notesPath)
                .filter(f => fs.statSync(path.join(notesPath, f)).isDirectory())
                .sort()
                .reverse();
            
            items.push(...years.map(year => 
                new NoteItem(year, path.join(notesPath, year), vscode.TreeItemCollapsibleState.Collapsed, 'year')
            ));
            
            return Promise.resolve(items);
        } else if (element instanceof SectionItem) {
            if (element.sectionType === 'templates') {
                return Promise.resolve([
                    new TemplateItem('Problem/Solution', 'problem-solution'),
                    new TemplateItem('Meeting Notes', 'meeting'),
                    new TemplateItem('Research', 'research'),
                    new TemplateItem('Quick Note', 'quick')
                ]);
            } else if (element.sectionType === 'recent') {
                return this.getRecentNotes(notesPath);
            }
        } else if (element instanceof NoteItem) {
            if (element.type === 'year') {
                const months = fs.readdirSync(element.filePath)
                    .filter(f => fs.statSync(path.join(element.filePath, f)).isDirectory())
                    .sort()
                    .reverse();
                
                return Promise.resolve(months.map(month => 
                    new NoteItem(month, path.join(element.filePath, month), vscode.TreeItemCollapsibleState.Collapsed, 'month')
                ));
            } else if (element.type === 'month') {
                const notes = fs.readdirSync(element.filePath)
                    .filter(f => f.endsWith('.txt') || f.endsWith('.md'))
                    .sort()
                    .reverse();
                
                return Promise.resolve(notes.map(note => {
                    const filePath = path.join(element.filePath, note);
                    const item = new NoteItem(note, filePath, vscode.TreeItemCollapsibleState.None, 'note');
                    item.command = {
                        command: 'noted.openNote',
                        title: 'Open Note',
                        arguments: [filePath]
                    };
                    item.contextValue = 'note';
                    return item;
                }));
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

class WelcomeItem extends TreeItem {
    constructor(message: string, icon: string, contextValue: string) {
        super(message, vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon(icon);
        this.contextValue = contextValue;
    }
}

class ActionItem extends TreeItem {
    constructor(label: string, icon: string, command: string) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon(icon);
        this.command = {
            command: command,
            title: label
        };
    }
}

class SectionItem extends TreeItem {
    constructor(
        public readonly label: string,
        public readonly sectionType: string
    ) {
        super(label, vscode.TreeItemCollapsibleState.Collapsed);
        this.iconPath = new vscode.ThemeIcon(sectionType === 'templates' ? 'file-code' : 'history');
    }
}

class TemplateItem extends TreeItem {
    constructor(
        public readonly label: string,
        public readonly templateType: string
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon('new-file');
        this.command = {
            command: 'noted.openWithTemplate',
            title: 'Open with Template',
            arguments: [templateType]
        };
    }
}

class NoteItem extends TreeItem {
    public filePath: string;
    
    constructor(
        public readonly label: string,
        filePath: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly type: 'year' | 'month' | 'note'
    ) {
        super(label, collapsibleState);
        
        this.filePath = filePath;
        this.resourceUri = vscode.Uri.file(filePath);
        
        if (type === 'note') {
            this.iconPath = new vscode.ThemeIcon('note');
        } else if (type === 'month') {
            this.iconPath = new vscode.ThemeIcon('calendar');
        } else {
            this.iconPath = new vscode.ThemeIcon('folder');
        }
    }
}

export function deactivate() {}