import * as vscode from 'vscode';

/**
 * Base tree item class
 */
export class TreeItem extends vscode.TreeItem {}

/**
 * Section item for organizing tree view (e.g., "Recent Notes")
 */
export class SectionItem extends TreeItem {
    constructor(
        public readonly label: string,
        public readonly sectionType: string
    ) {
        super(label, vscode.TreeItemCollapsibleState.Collapsed);
        this.iconPath = new vscode.ThemeIcon('history');
    }
}

/**
 * Note item representing files, folders, and year/month containers
 */
export class NoteItem extends TreeItem {
    public filePath: string;

    constructor(
        public readonly label: string,
        filePath: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly type: 'year' | 'month' | 'note' | 'custom-folder'
    ) {
        super(label, collapsibleState);

        this.filePath = filePath;
        this.resourceUri = vscode.Uri.file(filePath);

        if (type === 'note') {
            this.iconPath = new vscode.ThemeIcon('note');
            this.contextValue = 'note';
        } else if (type === 'month') {
            this.iconPath = new vscode.ThemeIcon('calendar');
            this.contextValue = 'month';
        } else if (type === 'year') {
            this.iconPath = new vscode.ThemeIcon('folder');
            this.contextValue = 'year';
        } else if (type === 'custom-folder') {
            this.iconPath = new vscode.ThemeIcon('folder-opened');
            this.contextValue = 'custom-folder';
        }
    }
}
