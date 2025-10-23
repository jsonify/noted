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

    constructor(connectionsService: ConnectionsService) {
        this.connectionsService = connectionsService;
    }

    /**
     * Update the connections panel for a specific note
     * @param notePath Path to the note to show connections for
     */
    async updateForNote(notePath: string | null): Promise<void> {
        this.currentNotePath = notePath;
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

        // Root level - show sections
        if (!element) {
            return this.getRootItems();
        }

        // Section level - show connections
        if (element instanceof ConnectionSectionItem) {
            return this.getConnectionItems(element.sectionType);
        }

        return [];
    }

    /**
     * Get root-level items (sections for outgoing and incoming connections)
     */
    private async getRootItems(): Promise<TreeItem[]> {
        if (!this.currentNotePath) {
            return [];
        }

        const items: TreeItem[] = [];

        try {
            const connectionData = await this.connectionsService.getConnectionsForNote(this.currentNotePath);

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

        } catch (error) {
            console.error('[NOTED] Error getting connections:', error);
        }

        return items;
    }

    /**
     * Get connection items for a specific section
     */
    private async getConnectionItems(sectionType: 'outgoing' | 'incoming'): Promise<TreeItem[]> {
        if (!this.currentNotePath) {
            return [];
        }

        const items: TreeItem[] = [];

        try {
            const connectionData = await this.connectionsService.getConnectionsForNote(this.currentNotePath);
            const connections = sectionType === 'outgoing' ? connectionData.outgoing : connectionData.incoming;

            // Group connections by target/source note
            const grouped = this.connectionsService.groupConnectionsByNote(connections);

            // Create items for each unique note
            for (const [notePath, noteConnections] of grouped.entries()) {
                // If multiple connections to the same note, show count
                if (noteConnections.length > 1) {
                    // Create a parent item for the note
                    const filename = path.basename(notePath, path.extname(notePath));
                    const parentItem = new vscode.TreeItem(
                        filename,
                        vscode.TreeItemCollapsibleState.Expanded
                    );
                    parentItem.iconPath = new vscode.ThemeIcon('note');
                    parentItem.description = `${noteConnections.length} connection${noteConnections.length !== 1 ? 's' : ''}`;
                    parentItem.contextValue = 'connection-group';
                    parentItem.resourceUri = vscode.Uri.file(notePath);

                    // Add as connection item for now (will need custom handling)
                    // For simplicity, we'll just add individual connections
                    for (const conn of noteConnections) {
                        items.push(this.createConnectionItem(conn));
                    }
                } else {
                    // Single connection
                    items.push(this.createConnectionItem(noteConnections[0]));
                }
            }

        } catch (error) {
            console.error('[NOTED] Error getting connection items:', error);
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
