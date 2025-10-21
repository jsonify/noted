import * as vscode from 'vscode';

/**
 * Base tree item class
 */
export class TreeItem extends vscode.TreeItem {}

/**
 * Section item for organizing tree view (e.g., "Recent Notes", "Pinned Notes", "Archive")
 */
export class SectionItem extends TreeItem {
    constructor(
        public readonly label: string,
        public readonly sectionType: string
    ) {
        super(label, vscode.TreeItemCollapsibleState.Collapsed);

        // Set appropriate icon based on section type
        if (sectionType === 'recent') {
            this.iconPath = new vscode.ThemeIcon('history');
        } else if (sectionType === 'pinned') {
            this.iconPath = new vscode.ThemeIcon('pin');
        } else if (sectionType === 'archive') {
            this.iconPath = new vscode.ThemeIcon('archive');
        } else {
            this.iconPath = new vscode.ThemeIcon('folder');
        }
    }
}

/**
 * Note item representing files, folders, and year/month containers
 */
export class NoteItem extends TreeItem {
    public filePath: string;
    public isPinned: boolean = false;
    public isSelected: boolean = false;

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

    /**
     * Mark this note as pinned and update its visual appearance
     */
    setPinned(pinned: boolean): void {
        this.isPinned = pinned;
        if (this.type === 'note' && pinned) {
            this.iconPath = new vscode.ThemeIcon('pinned');
            this.description = '📌';
        }
    }

    /**
     * Mark this note as selected and update its visual appearance
     */
    setSelected(selected: boolean): void {
        this.isSelected = selected;
        if (this.type === 'note') {
            if (selected) {
                // Add checkmark indicator for selected notes
                this.iconPath = new vscode.ThemeIcon('check');
                // Update context value to show selection-specific menu items
                this.contextValue = 'note-selected';
            } else {
                // Restore original icon (unless pinned)
                if (this.isPinned) {
                    this.iconPath = new vscode.ThemeIcon('pinned');
                } else {
                    this.iconPath = new vscode.ThemeIcon('note');
                }
                this.contextValue = 'note';
            }
        }
    }
}

/**
 * Tag item representing a tag with usage count
 */
export class TagItem extends TreeItem {
    constructor(
        public readonly tagName: string,
        public readonly count: number,
        public readonly notePaths: string[]
    ) {
        super(`#${tagName} (${count})`, vscode.TreeItemCollapsibleState.None);

        this.iconPath = new vscode.ThemeIcon('tag');
        this.contextValue = 'tag';
        this.tooltip = `Tag: #${tagName}\nUsed in ${count} note${count !== 1 ? 's' : ''}`;
        this.description = `${count}`;

        // Make tag clickable to filter notes
        this.command = {
            command: 'noted.filterByTag',
            title: 'Filter by Tag',
            arguments: [tagName]
        };
    }
}
