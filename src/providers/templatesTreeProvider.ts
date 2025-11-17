import * as vscode from 'vscode';
import * as path from 'path';
import { TreeItem, TemplateActionItem, ActionButtonItem, SectionItem, NoteItem } from './treeItems';
import { getCustomTemplates } from '../services/templateService';
import { getNotesPath } from '../services/configService';
import { readDirectoryWithTypes, getFileStats } from '../services/fileSystemService';
import { DEFAULTS, SUPPORTED_EXTENSIONS } from '../constants';
import { PinnedNotesService } from '../services/pinnedNotesService';
import { BulkOperationsService } from '../services/bulkOperationsService';

/**
 * Tree data provider for templates view
 * Features:
 * - Template Browser: Primary interface for browsing, searching, and managing templates
 * - Standard Templates: Built-in templates (Problem/Solution, Meeting, Research, Quick Note)
 * - Custom Templates: User/AI-created templates
 * - Manage: AI features and utilities (CRUD operations moved to Template Browser)
 */
export class TemplatesTreeProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    // Standard built-in templates (constant data)
    private static readonly STANDARD_TEMPLATES = [
        { type: 'problem-solution', label: 'Problem/Solution' },
        { type: 'meeting', label: 'Meeting' },
        { type: 'research', label: 'Research' },
        { type: 'user-story', label: 'User Story' },
        { type: 'quick', label: 'Quick Note' }
    ];

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

    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: TreeItem): Promise<TreeItem[]> {
        if (!element) {
            // Root level - show primary actions, 3 template folders, and recent notes
            const items: TreeItem[] = [];

            // Template Browser - primary interface for browsing and managing templates
            items.push(
                new ActionButtonItem(
                    '📖 Template Browser',
                    'noted.showTemplateBrowser',
                    'library',
                    'Browse, search, and manage all templates with advanced features'
                )
            );

            // Quick create action
            items.push(
                new ActionButtonItem(
                    '+ New Note...',
                    'noted.openWithTemplate',
                    'add',
                    'Quick create a new note from template picker'
                )
            );

            // Standard Templates folder
            items.push(
                new SectionItem('Standard Templates', 'standard')
            );

            // Custom Templates folder
            items.push(
                new SectionItem('Custom Templates', 'custom')
            );

            // Management section
            items.push(
                new SectionItem('Manage', 'manage')
            );

            // Recent notes section at bottom
            items.push(new SectionItem('Recent Notes', 'recent'));

            return items;
        } else if (element instanceof SectionItem) {
            if (element.sectionType === 'recent') {
                return this.getRecentNotes();
            } else if (element.sectionType === 'standard') {
                return this.getStandardTemplates();
            } else if (element.sectionType === 'custom') {
                return this.getCustomTemplateItems();
            } else if (element.sectionType === 'manage') {
                return this.getManagementActions();
            }
        }

        return [];
    }

    /**
     * Get built-in standard templates
     */
    private async getStandardTemplates(): Promise<TreeItem[]> {
        const items: TreeItem[] = TemplatesTreeProvider.STANDARD_TEMPLATES.map(template =>
            new TemplateActionItem(
                template.label,
                template.type,
                'noted.createCategoryNote',
                `Create a new ${template.label.toLowerCase()}`
            )
        );

        // Add AI-enhanced User Story option at index after User Story
        const userStoryIndex = items.findIndex(item => item.label === 'User Story');
        if (userStoryIndex !== -1) {
            items.splice(userStoryIndex + 1, 0,
                new ActionButtonItem(
                    '✨ User Story with AI',
                    'noted.createUserStoryWithAI',
                    'sparkle',
                    'AI-powered user story from brief description'
                )
            );
        }

        return items;
    }

    /**
     * Get custom user/AI-created templates
     */
    private async getCustomTemplateItems(): Promise<TreeItem[]> {
        const customTemplates = await getCustomTemplates();

        if (customTemplates.length === 0) {
            return [];
        }

        return customTemplates.map(templateName =>
            new TemplateActionItem(
                templateName,
                templateName,
                'noted.createCategoryNote',
                `Create a new note from ${templateName} template`
            )
        );
    }

    /**
     * Get management action items
     * Note: CRUD operations (Create/Edit/Delete/Duplicate) are available in Template Browser
     */
    private async getManagementActions(): Promise<TreeItem[]> {
        return [
            new ActionButtonItem(
                '✨ Create with AI',
                'noted.createTemplateWithAI',
                'sparkle',
                'Generate a template using AI from your description'
            ),
            new ActionButtonItem(
                '✨ Enhance with AI',
                'noted.enhanceTemplate',
                'sparkle',
                'Improve an existing template with AI suggestions'
            ),
            new ActionButtonItem(
                '⚙️ Select AI Model',
                'noted.selectAIModel',
                'settings-gear',
                'Choose AI model for all features (templates, tagging, summarization, search)'
            ),
            new ActionButtonItem(
                'Template Variables',
                'noted.previewTemplateVariables',
                'symbol-variable',
                'View all available template variables and their usage'
            ),
            new ActionButtonItem(
                'Open Templates Folder',
                'noted.openTemplatesFolder',
                'folder-opened',
                'Open the templates folder in system file explorer'
            )
        ];
    }

    /**
     * Get recent notes
     */
    private async getRecentNotes(): Promise<TreeItem[]> {
        const notesPath = getNotesPath();
        if (!notesPath) {
            return [];
        }

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
                if (this.bulkOperationsService && item.type === 'note') {
                    const isSelected = this.bulkOperationsService.isSelected(item.filePath);
                    item.setSelected(isSelected);
                }

                return item;
            });
    }
}
