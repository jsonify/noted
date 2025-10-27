import * as vscode from 'vscode';
import { DiagramService, DiagramFile } from '../services/diagramService';

/**
 * Tree item types for diagrams view
 */
type DiagramTreeItem = DiagramSectionItem | DiagramItem;

/**
 * Section item for grouping diagrams by type
 */
class DiagramSectionItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly type: 'drawio' | 'excalidraw',
        public readonly count: number
    ) {
        super(label, vscode.TreeItemCollapsibleState.Expanded);
        this.contextValue = 'diagram-section';
        this.description = `${count} diagram${count !== 1 ? 's' : ''}`;

        // Set icon based on type
        this.iconPath = new vscode.ThemeIcon(
            type === 'drawio' ? 'graph' : 'paintcan'
        );
    }
}

/**
 * Individual diagram file item
 */
class DiagramItem extends vscode.TreeItem {
    constructor(public readonly diagramFile: DiagramFile) {
        super(diagramFile.name, vscode.TreeItemCollapsibleState.None);
        this.contextValue = 'diagram';
        this.tooltip = this.createTooltip();

        // Set description
        if (diagramFile.usageCount !== undefined && diagramFile.usageCount > 0) {
            this.description = `Used in ${diagramFile.usageCount} note${diagramFile.usageCount !== 1 ? 's' : ''}`;
        } else if (diagramFile.isExported) {
            this.description = 'Exported';
        }

        // Set icon
        this.iconPath = new vscode.ThemeIcon(
            diagramFile.isExported ? 'file-media' : 'edit'
        );

        // Make clickable to open
        this.command = {
            command: 'noted.openDiagram',
            title: 'Open Diagram',
            arguments: [diagramFile]
        };
    }

    private createTooltip(): string {
        const lines: string[] = [];
        lines.push(`**${this.diagramFile.name}**`);
        lines.push('');
        lines.push(`Type: ${this.diagramFile.type === 'drawio' ? 'Draw.io' : 'Excalidraw'}`);
        lines.push(`Format: ${this.diagramFile.isExported ? 'Exported' : 'Editable'}`);

        if (this.diagramFile.size !== undefined) {
            const sizeKB = (this.diagramFile.size / 1024).toFixed(2);
            lines.push(`Size: ${sizeKB} KB`);
        }

        if (this.diagramFile.modified) {
            const modifiedStr = this.diagramFile.modified.toLocaleString();
            lines.push(`Modified: ${modifiedStr}`);
        }

        if (this.diagramFile.usageCount !== undefined && this.diagramFile.usageCount > 0) {
            lines.push(`Referenced in ${this.diagramFile.usageCount} note(s)`);
        }

        lines.push('');
        lines.push('_Click to open_');

        return lines.join('\n');
    }
}

/**
 * Tree provider for diagrams view
 */
export class DiagramsTreeProvider implements vscode.TreeDataProvider<DiagramTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<DiagramTreeItem | undefined | null | void> =
        new vscode.EventEmitter<DiagramTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<DiagramTreeItem | undefined | null | void> =
        this._onDidChangeTreeData.event;

    private diagramService: DiagramService;

    constructor(diagramService: DiagramService) {
        this.diagramService = diagramService;
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
    getTreeItem(element: DiagramTreeItem): vscode.TreeItem {
        return element;
    }

    /**
     * Get children of a tree item
     */
    async getChildren(element?: DiagramTreeItem): Promise<DiagramTreeItem[]> {
        if (!element) {
            // Root level - return section items
            return this.getSections();
        }

        if (element instanceof DiagramSectionItem) {
            // Return diagrams for this section
            return this.getDiagramsForSection(element.type);
        }

        return [];
    }

    /**
     * Get section items (Draw.io and Excalidraw)
     */
    private async getSections(): Promise<DiagramSectionItem[]> {
        const grouped = await this.diagramService.getDiagramsGroupedByType();

        const sections: DiagramSectionItem[] = [];

        // Draw.io section
        if (grouped.drawio.length > 0) {
            sections.push(new DiagramSectionItem(
                '📐 Draw.io',
                'drawio',
                grouped.drawio.length
            ));
        }

        // Excalidraw section
        if (grouped.excalidraw.length > 0) {
            sections.push(new DiagramSectionItem(
                '🎨 Excalidraw',
                'excalidraw',
                grouped.excalidraw.length
            ));
        }

        // If no diagrams, show placeholder
        if (sections.length === 0) {
            // Return empty array - viewsWelcome will handle empty state
            return [];
        }

        return sections;
    }

    /**
     * Get diagram items for a section
     */
    private async getDiagramsForSection(type: 'drawio' | 'excalidraw'): Promise<DiagramItem[]> {
        const grouped = await this.diagramService.getDiagramsGroupedByType();
        const diagrams = type === 'drawio' ? grouped.drawio : grouped.excalidraw;

        return diagrams.map(diagram => new DiagramItem(diagram));
    }
}
