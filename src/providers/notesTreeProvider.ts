import * as vscode from 'vscode';
import * as path from 'path';
import { TreeItem, NoteItem, SectionItem } from './treeItems';
import { getNotesPath } from '../services/configService';
import { pathExists, createDirectory, readDirectoryWithTypes, getFileStats, renameFile } from '../services/fileSystemService';
import { isYearFolder, isMonthFolder, isDailyNote } from '../utils/validators';
import { DEFAULTS, SUPPORTED_EXTENSIONS, SPECIAL_FOLDERS } from '../constants';
import { TagService } from '../services/tagService';
import { formatTagForDisplay } from '../utils/tagHelpers';
import { PinnedNotesService } from '../services/pinnedNotesService';
import { ArchiveService } from '../services/archiveService';
import { BulkOperationsService } from '../services/bulkOperationsService';

/**
 * Tree data provider for the main notes view
 * Implements drag-and-drop for moving notes between folders
 */
export class NotesTreeProvider implements vscode.TreeDataProvider<TreeItem>, vscode.TreeDragAndDropController<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    // Drag and drop support
    dropMimeTypes = ['application/vnd.code.tree.notedView'];
    dragMimeTypes = ['text/uri-list'];

    // Tag filtering state
    private activeFilters: Set<string> = new Set();
    private filteredNotePaths: Set<string> = new Set();

    // Optional services for pinned notes and archive
    private pinnedNotesService?: PinnedNotesService;
    private archiveService?: ArchiveService;
    private bulkOperationsService?: BulkOperationsService;

    /**
     * Set the pinned notes service
     */
    setPinnedNotesService(service: PinnedNotesService): void {
        this.pinnedNotesService = service;
        // Listen for changes and refresh tree
        service.onDidChangePinnedNotes(() => this.refresh());
    }

    /**
     * Set the archive service
     */
    setArchiveService(service: ArchiveService): void {
        this.archiveService = service;
    }

    /**
     * Set the bulk operations service
     */
    setBulkOperationsService(service: BulkOperationsService): void {
        this.bulkOperationsService = service;
        // Listen for selection changes and refresh tree
        service.onDidChangeSelection(() => this.refresh());
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Get the currently active tag filters
     */
    getActiveFilters(): string[] {
        return Array.from(this.activeFilters);
    }

    /**
     * Set tag filters for the tree view
     * @param tags Array of tag names to filter by (AND logic)
     */
    setTagFilters(tags: string[]): void {
        this.activeFilters.clear();

        // Normalize and deduplicate tags
        const normalizedTags = tags.map(tag => tag.toLowerCase().trim());
        const uniqueTags = [...new Set(normalizedTags)];

        uniqueTags.forEach(tag => {
            if (tag) {
                this.activeFilters.add(tag);
            }
        });

        // Update context variable for conditional UI elements
        vscode.commands.executeCommand('setContext', 'noted.hasActiveTagFilters', this.activeFilters.size > 0);

        this.refresh();
    }

    /**
     * Clear all active tag filters
     */
    clearTagFilters(): void {
        this.activeFilters.clear();
        this.filteredNotePaths.clear();

        // Update context variable for conditional UI elements
        vscode.commands.executeCommand('setContext', 'noted.hasActiveTagFilters', this.activeFilters.size > 0);

        this.refresh();
    }

    /**
     * Filter notes by tag(s) using TagService
     * @param tags Single tag or array of tags to filter by
     * @param tagService TagService instance for querying notes
     */
    filterByTag(tags: string | string[], tagService: TagService): void {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        this.setTagFilters(tagArray);

        // Get notes that match all active filters
        if (this.activeFilters.size > 0) {
            const notePaths = tagService.getNotesWithTags(Array.from(this.activeFilters));
            this.filteredNotePaths = new Set(notePaths);
        } else {
            this.filteredNotePaths.clear();
        }

        this.refresh();
    }

    /**
     * Get the set of filtered note paths
     */
    getFilteredNotePaths(): string[] {
        return Array.from(this.filteredNotePaths);
    }

    /**
     * Check if a note should be displayed based on active filters
     * @param notePath Path to the note file
     * @returns true if note should be shown, false otherwise
     */
    isNoteFiltered(notePath: string): boolean {
        // If no filters active, show all notes
        if (this.activeFilters.size === 0) {
            return true;
        }

        // Check if note is in filtered set
        return this.filteredNotePaths.has(notePath);
    }

    /**
     * Get description text for active filters
     */
    getFilterDescription(): string {
        if (this.activeFilters.size === 0) {
            return '';
        }

        const tagStrings = Array.from(this.activeFilters).map(tag => formatTagForDisplay(tag));
        return `Filtered by: ${tagStrings.join(', ')}`;
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
            if (await pathExists(destinationPath)) {
                vscode.window.showErrorMessage(`A file named "${fileName}" already exists in the destination folder`);
                continue;
            }

            try {
                await renameFile(sourceFilePath, destinationPath);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to move note: ${error instanceof Error ? error.message : String(error)}`);
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

        if (!notesPath) {
            return [];
        }

        // Auto-create the notes folder if it's configured but doesn't exist
        if (!(await pathExists(notesPath))) {
            const config = vscode.workspace.getConfiguration('noted');
            const notesFolder = config.get<string>('notesFolder', 'Notes');

            // Auto-create if it's an absolute path (user has configured it)
            if (path.isAbsolute(notesFolder)) {
                try {
                    await createDirectory(notesPath);
                } catch (error) {
                    console.error('[NOTED] Failed to create notes folder:', error);
                    vscode.window.showErrorMessage(`Failed to create notes folder: ${error instanceof Error ? error.message : String(error)}`);
                    return [];
                }
            } else {
                // Not properly configured yet, show welcome screen
                return [];
            }
        }

        if (!element) {
            // Root level - show pinned notes, archive, and custom folders only (no years, no recent notes)
            const items: TreeItem[] = [];

            // Pinned notes section (if service is available and has pinned notes)
            if (this.pinnedNotesService) {
                const pinnedNotes = await this.pinnedNotesService.getPinnedNotes();
                if (pinnedNotes.length > 0) {
                    items.push(new SectionItem('Pinned Notes', 'pinned'));
                }
            }

            // Archive section (if service is available)
            if (this.archiveService) {
                const archivedNotes = await this.archiveService.getArchivedNotes();
                if (archivedNotes.length > 0) {
                    items.push(new SectionItem('Archive', 'archive'));
                }
            }

            // Inbox section - always show if folder exists and has notes
            try {
                const inboxPath = path.join(notesPath, SPECIAL_FOLDERS.INBOX);
                if (await pathExists(inboxPath)) {
                    const entries = await readDirectoryWithTypes(inboxPath);
                    const hasNotes = entries.some(e => !e.isDirectory() &&
                        SUPPORTED_EXTENSIONS.some(ext => e.name.endsWith(ext)));
                    if (hasNotes) {
                        items.push(new SectionItem('Inbox', 'inbox'));
                    }
                }
            } catch (error) {
                console.error('[NOTED] Error checking Inbox folder:', error);
            }

            try {
                // Get all directories in notes path
                const allEntries = await readDirectoryWithTypes(notesPath);
                const customFolders: string[] = [];

                for (const entry of allEntries) {
                    // Only include custom folders (not year folders, not archive, not inbox, not templates)
                    if (entry.isDirectory() &&
                        entry.name !== SPECIAL_FOLDERS.ARCHIVE &&
                        entry.name !== SPECIAL_FOLDERS.INBOX &&
                        entry.name !== SPECIAL_FOLDERS.TEMPLATES &&
                        !isYearFolder(entry.name)) {
                        customFolders.push(entry.name);
                    }
                }

                // Add custom folders (sorted alphabetically)
                customFolders.sort();
                items.push(...customFolders.map(folder =>
                    new NoteItem(folder, path.join(notesPath, folder), vscode.TreeItemCollapsibleState.Collapsed, 'custom-folder')
                ));
            } catch (error) {
                console.error('[NOTED] Error reading notes directory:', error);
            }

            return items;
        } else if (element instanceof SectionItem) {
            if (element.sectionType === 'pinned') {
                return this.getPinnedNotes();
            } else if (element.sectionType === 'archive') {
                return this.getArchivedNotes();
            } else if (element.sectionType === 'inbox') {
                return this.getInboxNotes();
            }
        } else if (element instanceof NoteItem) {
            if (element.type === 'custom-folder') {
                // Both month and custom folders can contain notes and subfolders
                try {
                    const entries = await readDirectoryWithTypes(element.filePath);
                    const items: NoteItem[] = [];

                    // Get subdirectories (custom folders only, no date folders allowed inside)
                    const subfolders = entries
                        .filter(e => e.isDirectory())
                        .map(e => e.name)
                        .sort();

                    items.push(...subfolders.map(folder =>
                        new NoteItem(folder, path.join(element.filePath, folder), vscode.TreeItemCollapsibleState.Collapsed, 'custom-folder')
                    ));

                    // Get notes (exclude daily notes)
                    const notes = entries
                        .filter(e => !e.isDirectory() &&
                               SUPPORTED_EXTENSIONS.some(ext => e.name.endsWith(ext)) &&
                               !isDailyNote(e.name))
                        .map(e => e.name)
                        .sort()
                        .reverse();

                    items.push(...notes
                        .map(note => {
                            const filePath = path.join(element.filePath, note);
                            const item = new NoteItem(note, filePath, vscode.TreeItemCollapsibleState.None, 'note');

                            // Set command based on whether select mode is active
                            if (this.bulkOperationsService?.isSelectModeActive()) {
                                item.command = {
                                    command: 'noted.toggleNoteSelection',
                                    title: 'Toggle Selection',
                                    arguments: [item]
                                };
                            } else {
                                item.command = {
                                    command: 'noted.openNote',
                                    title: 'Open Note',
                                    arguments: [filePath]
                                };
                            }

                            // Apply selection state if bulk operations is active
                            this.applySelectionState(item);

                            return item;
                        })
                        .filter(item => this.isNoteFiltered(item.filePath)));

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
                const entries = await readDirectoryWithTypes(dir);
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        await findNotes(fullPath);
                    } else if (SUPPORTED_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
                        try {
                            const stat = await getFileStats(fullPath);
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

        return allNotes
            .slice(0, DEFAULTS.RECENT_NOTES_LIMIT)
            .filter(note => this.isNoteFiltered(note.path))
            .map(note => {
                const item = new NoteItem(note.name, note.path, vscode.TreeItemCollapsibleState.None, 'note');

                // Set command based on whether select mode is active
                if (this.bulkOperationsService?.isSelectModeActive()) {
                    item.command = {
                        command: 'noted.toggleNoteSelection',
                        title: 'Toggle Selection',
                        arguments: [item]
                    };
                } else {
                    item.command = {
                        command: 'noted.openNote',
                        title: 'Open Note',
                        arguments: [note.path]
                    };
                }

                item.contextValue = 'note';

                // Mark as pinned if applicable
                if (this.pinnedNotesService && this.pinnedNotesService.isPinned(note.path)) {
                    item.setPinned(true);
                }

                // Apply selection state if bulk operations is active
                this.applySelectionState(item);

                return item;
            });
    }

    /**
     * Get pinned notes
     */
    private async getPinnedNotes(): Promise<TreeItem[]> {
        if (!this.pinnedNotesService) {
            return [];
        }

        const pinnedPaths = await this.pinnedNotesService.getPinnedNotes();

        return pinnedPaths
            .filter(note => this.isNoteFiltered(note))
            .map(notePath => this.createNoteItemForSection(notePath, { isPinned: true }));
    }

    /**
     * Get archived notes
     */
    private async getArchivedNotes(): Promise<TreeItem[]> {
        if (!this.archiveService) {
            return [];
        }

        const archivedPaths = await this.archiveService.getArchivedNotes();

        return archivedPaths
            .filter(note => this.isNoteFiltered(note))
            .map(notePath => this.createNoteItemForSection(notePath, { description: '📦' }));
    }

    /**
     * Get inbox notes
     */
    private async getInboxNotes(): Promise<TreeItem[]> {
        const notesPath = getNotesPath();
        if (!notesPath) {
            return [];
        }

        const inboxPath = path.join(notesPath, SPECIAL_FOLDERS.INBOX);

        // Check if inbox folder exists
        if (!(await pathExists(inboxPath))) {
            return [];
        }

        try {
            const entries = await readDirectoryWithTypes(inboxPath);

            // Get all note files in Inbox (including invalid date-formatted names)
            const noteFiles = entries
                .filter(e => !e.isDirectory() &&
                       SUPPORTED_EXTENSIONS.some(ext => e.name.endsWith(ext)))
                .map(e => e.name);

            // Get file stats for sorting by modification time
            const notesWithStats = await Promise.all(
                noteFiles.map(async (fileName) => {
                    const filePath = path.join(inboxPath, fileName);
                    const stats = await getFileStats(filePath);
                    return { fileName, filePath, mtime: stats?.mtime || new Date(0) };
                })
            );

            // Sort by modification time (most recent first)
            notesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

            return notesWithStats
                .filter(note => this.isNoteFiltered(note.filePath))
                .map(note => this.createNoteItemForSection(note.filePath, { description: '📥' }));
        } catch (error) {
            console.error('[NOTED] Error reading Inbox folder:', error);
            return [];
        }
    }

    /**
     * Create a NoteItem with common configuration for special sections
     * @param notePath Full path to the note file
     * @param options Optional customization (description, isPinned)
     */
    private createNoteItemForSection(
        notePath: string,
        options?: { description?: string; isPinned?: boolean }
    ): NoteItem {
        const item = new NoteItem(
            path.basename(notePath),
            notePath,
            vscode.TreeItemCollapsibleState.None,
            'note'
        );

        // Set command based on whether select mode is active
        if (this.bulkOperationsService?.isSelectModeActive()) {
            item.command = {
                command: 'noted.toggleNoteSelection',
                title: 'Toggle Selection',
                arguments: [item]
            };
        } else {
            item.command = {
                command: 'noted.openNote',
                title: 'Open Note',
                arguments: [notePath]
            };
        }

        item.contextValue = 'note';

        // Apply optional customizations
        if (options?.description) {
            item.description = options.description;
        }
        if (options?.isPinned) {
            item.setPinned(true);
        }

        // Apply selection state if bulk operations is active
        this.applySelectionState(item);

        return item;
    }

    /**
     * Get inbox notes
     */
    private async getInboxNotes(): Promise<TreeItem[]> {
        const notesPath = getNotesPath();
        if (!notesPath) {
            return [];
        }

        const inboxPath = path.join(notesPath, SPECIAL_FOLDERS.INBOX);

        // Check if inbox folder exists
        if (!(await pathExists(inboxPath))) {
            return [];
        }

        try {
            const entries = await readDirectoryWithTypes(inboxPath);

            // Get all note files (not daily notes)
            const noteFiles = entries
                .filter(e => !e.isDirectory() &&
                       SUPPORTED_EXTENSIONS.some(ext => e.name.endsWith(ext)) &&
                       !isDailyNote(e.name))
                .map(e => e.name);

            // Get file stats for sorting by modification time
            const notesWithStats = await Promise.all(
                noteFiles.map(async (fileName) => {
                    const filePath = path.join(inboxPath, fileName);
                    const stats = await getFileStats(filePath);
                    return { fileName, filePath, mtime: stats?.mtime || new Date(0) };
                })
            );

            // Sort by modification time (most recent first)
            notesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

            return notesWithStats
                .filter(note => this.isNoteFiltered(note.filePath))
                .map(note => {
                    const item = new NoteItem(
                        note.fileName,
                        note.filePath,
                        vscode.TreeItemCollapsibleState.None,
                        'note'
                    );

                    // Set command based on whether select mode is active
                    if (this.bulkOperationsService?.isSelectModeActive()) {
                        item.command = {
                            command: 'noted.toggleNoteSelection',
                            title: 'Toggle Selection',
                            arguments: [item]
                        };
                    } else {
                        item.command = {
                            command: 'noted.openNote',
                            title: 'Open Note',
                            arguments: [note.filePath]
                        };
                    }

                    item.contextValue = 'note';
                    item.description = '📥'; // Inbox icon

                    // Apply selection state if bulk operations is active
                    this.applySelectionState(item);

                    return item;
                });
        } catch (error) {
            console.error('[NOTED] Error reading Inbox folder:', error);
            return [];
        }
    }

    /**
     * Apply selection state to a note item
     */
    private applySelectionState(item: NoteItem): void {
        if (this.bulkOperationsService && item.type === 'note') {
            const isSelected = this.bulkOperationsService.isSelected(item.filePath);
            item.setSelected(isSelected);
        }
    }

    /**
     * Get the bulk operations service (for commands)
     */
    getBulkOperationsService(): BulkOperationsService | undefined {
        return this.bulkOperationsService;
    }
}
