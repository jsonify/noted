import * as vscode from 'vscode';
import { TagItem } from './treeItems';
import { TagService, TagSortOrder } from '../services/tagService';

/**
 * Tree data provider for tags view
 * Displays all tags with usage counts
 */
export class TagsTreeProvider implements vscode.TreeDataProvider<TagItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TagItem | undefined | null | void> = new vscode.EventEmitter<TagItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TagItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private sortOrder: TagSortOrder = 'frequency';

    constructor(private tagService: TagService) {}

    /**
     * Refresh the tree view and rebuild tag index
     */
    async refresh(): Promise<void> {
        await this.tagService.buildTagIndex();
        this._onDidChangeTreeData.fire();
    }

    /**
     * Refresh the tree view without rebuilding the index (soft refresh)
     * Use this when the index has already been updated incrementally
     */
    softRefresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Get tree item representation
     */
    getTreeItem(element: TagItem): vscode.TreeItem {
        return element;
    }

    /**
     * Get children for tree view
     * Returns all tags at root level, undefined for tag items (no children)
     */
    async getChildren(element?: TagItem): Promise<TagItem[] | undefined> {
        // Tag items don't have children
        if (element) {
            return undefined;
        }

        // Get all tags from service
        const tags = this.tagService.getAllTags(this.sortOrder);

        // Convert to TagItem instances
        return tags.map(tag => new TagItem(tag.name, tag.count, tag.notes));
    }

    /**
     * Set the sort order for tags
     */
    setSortOrder(order: TagSortOrder): void {
        this.sortOrder = order;
        this._onDidChangeTreeData.fire();
    }

    /**
     * Get current sort order
     */
    getSortOrder(): TagSortOrder {
        return this.sortOrder;
    }

    /**
     * Get total number of tags
     */
    getTagCount(): number {
        return this.tagService.getTagCount();
    }
}
