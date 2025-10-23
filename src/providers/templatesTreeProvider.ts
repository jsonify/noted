import * as vscode from 'vscode';
import { TreeItem, CategoryItem, TemplateActionItem, ActionButtonItem } from './treeItems';
import { getAllCategories, getCategoryConfig } from '../services/categoryService';
import { getCustomTemplates } from '../services/templateService';

/**
 * Tree data provider for templates view
 * Shows category-based template organization with action buttons
 */
export class TemplatesTreeProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: TreeItem): Promise<TreeItem[]> {
        if (!element) {
            // Root level - show primary actions and categories
            const items: TreeItem[] = [];

            // Primary action buttons at top
            items.push(
                new ActionButtonItem(
                    '📅 Today\'s Note',
                    'noted.openToday',
                    'calendar',
                    'Open or create today\'s daily note'
                )
            );

            items.push(
                new ActionButtonItem(
                    '+ New Note...',
                    'noted.openWithTemplate',
                    'add',
                    'Create a new note from template picker'
                )
            );

            // Get all categories (excluding Daily since it's handled by Today button)
            const categories = getAllCategories();
            for (const [categoryName, config] of Object.entries(categories)) {
                if (categoryName === 'Daily') {
                    continue; // Skip Daily - it's handled by Today button
                }

                items.push(
                    new CategoryItem(
                        categoryName,
                        config.icon,
                        config.description || ''
                    )
                );
            }

            // Management section
            items.push(
                new CategoryItem(
                    'Manage',
                    '⚙️',
                    'Manage templates and settings'
                )
            );

            return items;
        } else if (element instanceof CategoryItem) {
            // Show template actions for this category
            if (element.categoryName === 'Manage') {
                return this.getManagementActions();
            }

            const config = getCategoryConfig(element.categoryName);
            if (!config) {
                return [];
            }

            const items: TreeItem[] = [];

            // Add built-in templates for this category
            for (const templateType of config.templates) {
                const label = this.getTemplateFriendlyName(templateType);
                items.push(
                    new TemplateActionItem(
                        `+ ${label}`,
                        templateType,
                        'noted.createCategoryNote',
                        `Create a new ${label.toLowerCase()} in ${config.folder}`
                    )
                );
            }

            // Check for custom templates
            const customTemplates = await getCustomTemplates();
            if (customTemplates.length > 0) {
                // Add custom templates that might belong to this category
                // For now, we'll show all custom templates under each category
                // You could enhance this with metadata in custom templates
                for (const customTemplate of customTemplates) {
                    items.push(
                        new TemplateActionItem(
                            `+ ${customTemplate}`,
                            customTemplate,
                            'noted.createCategoryNote',
                            `Create a new note from ${customTemplate} template`
                        )
                    );
                }
            }

            return items;
        }

        return [];
    }

    /**
     * Get management action items
     */
    private async getManagementActions(): Promise<TreeItem[]> {
        return [
            new ActionButtonItem(
                'Create Template',
                'noted.createCustomTemplate',
                'add',
                'Create a new custom template'
            ),
            new ActionButtonItem(
                'Edit Template',
                'noted.editCustomTemplate',
                'edit',
                'Edit an existing template'
            ),
            new ActionButtonItem(
                'Delete Template',
                'noted.deleteCustomTemplate',
                'trash',
                'Delete a custom template'
            ),
            new ActionButtonItem(
                'Duplicate Template',
                'noted.duplicateCustomTemplate',
                'copy',
                'Duplicate an existing template'
            ),
            new ActionButtonItem(
                'Template Variables',
                'noted.previewTemplateVariables',
                'question',
                'View available template variables'
            ),
            new ActionButtonItem(
                'Open Templates Folder',
                'noted.openTemplatesFolder',
                'folder-opened',
                'Open the templates folder in system explorer'
            )
        ];
    }

    /**
     * Convert template type to friendly display name
     */
    private getTemplateFriendlyName(templateType: string): string {
        const nameMap: Record<string, string> = {
            'problem-solution': 'Problem/Solution',
            'meeting': 'Meeting',
            'research': 'Research',
            'quick': 'Quick Note'
        };

        return nameMap[templateType] || templateType;
    }
}
