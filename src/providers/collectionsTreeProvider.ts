/**
 * Tree provider for Smart Collections view
 */

import * as vscode from 'vscode';
import { CollectionItem, CollectionSectionItem } from './treeItems';
import { SmartCollectionsService, SmartCollection } from '../services/smartCollectionsService';
import { TagService } from '../services/tagService';

export class CollectionsTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(
        private collectionsService: SmartCollectionsService,
        private tagService?: TagService
    ) {
        // Listen to collection changes
        collectionsService.onDidChangeCollections(() => {
            this.refresh();
        });
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
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    /**
     * Get children for tree view
     */
    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        if (!element) {
            // Root level: Show Pinned and All Collections sections
            return this.getRootChildren();
        }

        if (element instanceof CollectionSectionItem) {
            // Show collections for this section
            if (element.sectionType === 'pinned') {
                return this.getPinnedCollectionItems();
            } else {
                return this.getUnpinnedCollectionItems();
            }
        }

        return [];
    }

    /**
     * Get root level items (sections)
     */
    private async getRootChildren(): Promise<vscode.TreeItem[]> {
        const pinnedCollections = this.collectionsService.getPinnedCollections();
        const unpinnedCollections = this.collectionsService.getUnpinnedCollections();

        const items: vscode.TreeItem[] = [];

        // Show pinned section if there are pinned collections
        if (pinnedCollections.length > 0) {
            items.push(
                new CollectionSectionItem('Pinned Collections', 'pinned', pinnedCollections.length)
            );
        }

        // Always show all collections section
        items.push(
            new CollectionSectionItem('All Collections', 'all', unpinnedCollections.length)
        );

        return items;
    }

    /**
     * Get pinned collection items
     */
    private async getPinnedCollectionItems(): Promise<CollectionItem[]> {
        const collections = this.collectionsService.getPinnedCollections();
        return Promise.all(collections.map(c => this.createCollectionItem(c)));
    }

    /**
     * Get unpinned collection items
     */
    private async getUnpinnedCollectionItems(): Promise<CollectionItem[]> {
        const collections = this.collectionsService.getUnpinnedCollections();
        return Promise.all(collections.map(c => this.createCollectionItem(c)));
    }

    /**
     * Create a collection tree item with result count
     */
    private async createCollectionItem(collection: SmartCollection): Promise<CollectionItem> {
        // Optionally fetch result count (can be slow for large workspaces)
        // For now, we'll skip this and only show count when running the collection
        const resultCount = undefined;

        return new CollectionItem(
            collection.id,
            collection.name,
            collection.query,
            collection.description,
            collection.icon,
            collection.color,
            collection.pinned,
            resultCount
        );
    }
}
