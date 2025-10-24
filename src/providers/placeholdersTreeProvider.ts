import * as vscode from 'vscode';
import { PlaceholdersService } from '../services/placeholdersService';
import { PlaceholderGroupItem, PlaceholderSourceItem, TreeItem } from './treeItems';

/**
 * Tree data provider for the placeholders explorer panel
 * Shows broken/dangling links grouped by target with source context
 */
export class PlaceholdersTreeProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private placeholdersService: PlaceholdersService;

    constructor(placeholdersService: PlaceholdersService) {
        this.placeholdersService = placeholdersService;
    }

    /**
     * Refresh the tree view
     */
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Get tree item representation
     */
    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    /**
     * Get children for tree view
     */
    async getChildren(element?: TreeItem): Promise<TreeItem[]> {
        if (!element) {
            // Root level: show placeholder groups
            return this.getPlaceholderGroups();
        }

        if (element instanceof PlaceholderGroupItem) {
            // Show all sources that reference this placeholder
            return this.getPlaceholderSources(element.sources);
        }

        return [];
    }

    /**
     * Get placeholder groups (one per unique placeholder target)
     */
    private async getPlaceholderGroups(): Promise<PlaceholderGroupItem[]> {
        const placeholders = await this.placeholdersService.getAllPlaceholders();

        if (placeholders.size === 0) {
            return [];
        }

        const groups: PlaceholderGroupItem[] = [];

        for (const [linkText, placeholder] of placeholders) {
            groups.push(new PlaceholderGroupItem(
                linkText,
                placeholder.sources.length,
                placeholder.sources
            ));
        }

        // Sort by number of references (descending)
        groups.sort((a, b) => b.sourceCount - a.sourceCount);

        return groups;
    }

    /**
     * Get placeholder sources (locations where the placeholder is referenced)
     */
    private getPlaceholderSources(sources: Array<{ file: string; line: number; context: string; displayText?: string }>): PlaceholderSourceItem[] {
        return sources.map(source => new PlaceholderSourceItem(
            source.file,
            source.line,
            source.context,
            source.displayText
        ));
    }
}
