import * as vscode from 'vscode';
import { OrphansService } from '../services/orphansService';
import { OrphanSectionItem, OrphanNoteItem, TreeItem } from './treeItems';

/**
 * Tree data provider for the orphans explorer panel
 * Shows notes with no connections, organized by category
 */
export class OrphansTreeProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private orphansService: OrphansService;

    constructor(orphansService: OrphansService) {
        this.orphansService = orphansService;
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
            // Root level: show section headers
            return this.getRootSections();
        }

        if (element instanceof OrphanSectionItem) {
            // Show orphan notes for this section
            return this.getOrphanNotes(element.sectionType);
        }

        return [];
    }

    /**
     * Get root-level sections
     */
    private async getRootSections(): Promise<OrphanSectionItem[]> {
        const categories = await this.orphansService.getAllOrphanCategories();

        const sections: OrphanSectionItem[] = [];

        // True orphans (no connections at all)
        if (categories.trueOrphans.length > 0) {
            sections.push(new OrphanSectionItem(
                'Isolated Notes',
                'true-orphans',
                categories.trueOrphans.length
            ));
        }

        // Source-only notes (no backlinks)
        if (categories.sourceOnly.length > 0) {
            sections.push(new OrphanSectionItem(
                'No Backlinks',
                'source-only',
                categories.sourceOnly.length
            ));
        }

        // Sink-only notes (no outgoing links)
        if (categories.sinkOnly.length > 0) {
            sections.push(new OrphanSectionItem(
                'No Outgoing Links',
                'sink-only',
                categories.sinkOnly.length
            ));
        }

        return sections;
    }

    /**
     * Get orphan notes for a specific section
     */
    private async getOrphanNotes(sectionType: 'true-orphans' | 'source-only' | 'sink-only'): Promise<OrphanNoteItem[]> {
        const categories = await this.orphansService.getAllOrphanCategories();
        let orphans;

        switch (sectionType) {
            case 'true-orphans':
                orphans = categories.trueOrphans;
                break;
            case 'source-only':
                orphans = categories.sourceOnly;
                break;
            case 'sink-only':
                orphans = categories.sinkOnly;
                break;
        }

        return orphans.map(orphan => new OrphanNoteItem(
            orphan.filePath,
            orphan.hasIncomingLinks,
            orphan.hasOutgoingLinks
        ));
    }
}
