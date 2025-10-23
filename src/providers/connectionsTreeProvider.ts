import * as vscode from 'vscode';
import * as path from 'path';
import { TreeItem, ConnectionSectionItem, ConnectionItem } from './treeItems';
import { ConnectionsService, Connection } from '../services/connectionsService';
import { SUPPORTED_EXTENSIONS } from '../constants';

/**
 * Tree data provider for the connections panel
 * Shows incoming (backlinks) and outgoing links for the active note
 */
export class ConnectionsTreeProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private connectionsService: ConnectionsService;
    private currentNotePath: string | null = null;
    // Cache connection data to avoid fetching multiple times
    private connectionDataCache: Map<string, { outgoing: Connection[]; incoming: Connection[] }> = new Map();

    constructor(connectionsService: ConnectionsService) {
        this.connectionsService = connectionsService;
    }

    /**
     * Update the connections panel for a specific note
     * @param notePath Path to the note to show connections for
     */
    async updateForNote(notePath: string | null): Promise<void> {
        this.currentNotePath = notePath;
        // Clear cache when switching notes
        this.connectionDataCache.clear();
        this.refresh();
    }

    /**
     * Get the currently displayed note path
     */
    getCurrentNotePath(): string | null {
        return this.currentNotePath;
    }

    /**
     * Refresh the tree view
     */
    refresh(): void {
        // Clear cache on manual refresh
        this.connectionDataCache.clear();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: TreeItem): Promise<TreeItem[]> {
        // If no note is active, show empty state
        if (!this.currentNotePath) {
            return this.getEmptyStateItems();
        }

        // If not a supported note file, show empty state
        if (!this.isSupportedNote(this.currentNotePath)) {
            return this.getEmptyStateItems();
        }

        // Fetch connection data once and cache it
        let connectionData = this.connectionDataCache.get(this.currentNotePath);
        if (!connectionData) {
            try {
                const fullData = await this.connectionsService.getConnectionsForNote(this.currentNotePath);
                connectionData = {
                    outgoing: fullData.outgoing,
                    incoming: fullData.incoming
                };
                this.connectionDataCache.set(this.currentNotePath, connectionData);
            } catch (error) {
                console.error('[NOTED] Error fetching connections:', error);
                return [];
            }
        }

        // Root level - show sections
        if (!element) {
            return this.getRootItems(connectionData);
        }

        // Section level - show connections
        if (element instanceof ConnectionSectionItem) {
            return this.getConnectionItems(element.sectionType, connectionData);
        }

        return [];
    }

    /**
     * Get root-level items (sections for outgoing and incoming connections)
     */
    private getRootItems(connectionData: { outgoing: Connection[]; incoming: Connection[] }): TreeItem[] {
        const items: TreeItem[] = [];

        // Outgoing links section
        items.push(new ConnectionSectionItem(
            'Outgoing Links',
            'outgoing',
            connectionData.outgoing.length
        ));

        // Backlinks (incoming) section
        items.push(new ConnectionSectionItem(
            'Backlinks',
            'incoming',
            connectionData.incoming.length
        ));

        return items;
    }

    /**
     * Get connection items for a specific section
     */
    private getConnectionItems(
        sectionType: 'outgoing' | 'incoming',
        connectionData: { outgoing: Connection[]; incoming: Connection[] }
    ): TreeItem[] {
        const items: TreeItem[] = [];
        const connections = sectionType === 'outgoing' ? connectionData.outgoing : connectionData.incoming;

        // Simply show all connections as flat list
        // For better UX with many connections, users can see line numbers to distinguish
        for (const conn of connections) {
            items.push(this.createConnectionItem(conn));
        }

        return items;
    }

    /**
     * Create a ConnectionItem from a Connection object
     */
    private createConnectionItem(connection: Connection): ConnectionItem {
        return new ConnectionItem(
            connection.targetPath,
            connection.sourcePath,
            connection.lineNumber,
            connection.context,
            connection.type,
            connection.displayText
        );
    }

    /**
     * Get empty state items when no note is active
     */
    private getEmptyStateItems(): TreeItem[] {
        const item = new vscode.TreeItem('No active note', vscode.TreeItemCollapsibleState.None);
        item.iconPath = new vscode.ThemeIcon('info');
        item.tooltip = 'Open a note to see its connections';
        item.contextValue = 'empty-state';
        return [item];
    }

    /**
     * Check if a file is a supported note file
     */
    private isSupportedNote(filePath: string): boolean {
        return SUPPORTED_EXTENSIONS.some(ext => filePath.endsWith(ext));
    }

    /**
     * Get connection statistics for the current note
     */
    async getCurrentNoteStats(): Promise<{
        incomingCount: number;
        outgoingCount: number;
        totalCount: number;
    } | null> {
        if (!this.currentNotePath) {
            return null;
        }

        try {
            const stats = await this.connectionsService.getConnectionStats(this.currentNotePath);
            return {
                incomingCount: stats.incomingCount,
                outgoingCount: stats.outgoingCount,
                totalCount: stats.totalCount
            };
        } catch (error) {
            console.error('[NOTED] Error getting connection stats:', error);
            return null;
        }
    }
}
