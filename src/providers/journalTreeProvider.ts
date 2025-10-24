import * as vscode from 'vscode';
import * as path from 'path';
import { TreeItem, NoteItem } from './treeItems';
import { getNotesPath } from '../services/configService';
import { pathExists, createDirectory, readDirectoryWithTypes } from '../services/fileSystemService';
import { isYearFolder, isMonthFolder, isDailyNote } from '../utils/validators';
import { SUPPORTED_EXTENSIONS } from '../constants';
import { TagService } from '../services/tagService';
import { PinnedNotesService } from '../services/pinnedNotesService';
import { BulkOperationsService } from '../services/bulkOperationsService';

/**
 * Tree data provider for the journal view
 * Shows only daily notes organized by year/month folders
 */
export class JournalTreeProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    // Tag filtering state
    private activeFilters: Set<string> = new Set();
    private filteredNotePaths: Set<string> = new Set();

    // Optional services
    private pinnedNotesService?: PinnedNotesService;
    private bulkOperationsService?: BulkOperationsService;

    /**
     * Set the pinned notes service
     */
    setPinnedNotesService(service: PinnedNotesService): void {
        this.pinnedNotesService = service;
        service.onDidChangePinnedNotes(() => this.refresh());
    }

    /**
     * Set the bulk operations service
     */
    setBulkOperationsService(service: BulkOperationsService): void {
        this.bulkOperationsService = service;
        service.onDidChangeSelection(() => this.refresh());
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Set tag filters for the tree view
     */
    setTagFilters(tags: string[]): void {
        this.activeFilters.clear();
        const normalizedTags = tags.map(tag => tag.toLowerCase().trim());
        const uniqueTags = [...new Set(normalizedTags)];
        uniqueTags.forEach(tag => {
            if (tag) {
                this.activeFilters.add(tag);
            }
        });
        this.refresh();
    }

    /**
     * Filter notes by tag(s)
     */
    filterByTag(tags: string | string[], tagService: TagService): void {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        this.setTagFilters(tagArray);
        if (this.activeFilters.size > 0) {
            const notePaths = tagService.getNotesWithTags(Array.from(this.activeFilters));
            this.filteredNotePaths = new Set(notePaths);
        } else {
            this.filteredNotePaths.clear();
        }
        this.refresh();
    }

    /**
     * Check if a note should be displayed based on active filters
     */
    isNoteFiltered(notePath: string): boolean {
        if (this.activeFilters.size === 0) {
            return true;
        }
        return this.filteredNotePaths.has(notePath);
    }

    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: TreeItem): Promise<TreeItem[]> {
        const notesPath = getNotesPath();

        if (!notesPath) {
            return [];
        }

        // Auto-create the notes folder if it doesn't exist
        if (!(await pathExists(notesPath))) {
            const config = vscode.workspace.getConfiguration('noted');
            const notesFolder = config.get<string>('notesFolder', 'Notes');
            if (path.isAbsolute(notesFolder)) {
                try {
                    await createDirectory(notesPath);
                } catch (error) {
                    console.error('[NOTED] Failed to create notes folder:', error);
                    return [];
                }
            } else {
                return [];
            }
        }

        if (!element) {
            // Root level - show only year folders
            try {
                const allEntries = await readDirectoryWithTypes(notesPath);
                const years: string[] = [];

                for (const entry of allEntries) {
                    if (entry.isDirectory() && isYearFolder(entry.name)) {
                        years.push(entry.name);
                    }
                }

                years.sort().reverse();

                return years.map(year =>
                    new NoteItem(year, path.join(notesPath, year), vscode.TreeItemCollapsibleState.Collapsed, 'year')
                );
            } catch (error) {
                console.error('[NOTED] Error reading notes directory:', error);
                return [];
            }
        } else if (element instanceof NoteItem) {
            if (element.type === 'year') {
                // Show only month folders inside years
                try {
                    const allEntries = await readDirectoryWithTypes(element.filePath);
                    const months: string[] = [];

                    for (const entry of allEntries) {
                        if (entry.isDirectory() && isMonthFolder(entry.name)) {
                            months.push(entry.name);
                        }
                    }

                    months.sort().reverse();

                    return months.map(month =>
                        new NoteItem(month, path.join(element.filePath, month), vscode.TreeItemCollapsibleState.Collapsed, 'month')
                    );
                } catch (error) {
                    console.error('[NOTED] Error reading year folder:', element.filePath, error);
                    return [];
                }
            } else if (element.type === 'month') {
                // Show only daily notes inside month folders
                try {
                    const entries = await readDirectoryWithTypes(element.filePath);
                    const items: NoteItem[] = [];

                    // Get only daily notes
                    const notes = entries
                        .filter(e => !e.isDirectory() &&
                               SUPPORTED_EXTENSIONS.some(ext => e.name.endsWith(ext)) &&
                               isDailyNote(e.name))
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
                    console.error('[NOTED] Error reading month folder:', element.filePath, error);
                    return [];
                }
            }
        }

        return [];
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
