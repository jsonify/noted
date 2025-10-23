import * as vscode from 'vscode';
import * as path from 'path';

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

/**
 * Section item for connections panel (e.g., "Outgoing Links", "Backlinks")
 */
export class ConnectionSectionItem extends TreeItem {
    constructor(
        public readonly label: string,
        public readonly sectionType: 'outgoing' | 'incoming',
        public readonly count: number
    ) {
        super(`${label} (${count})`, vscode.TreeItemCollapsibleState.Expanded);

        // Set appropriate icon based on section type
        if (sectionType === 'outgoing') {
            this.iconPath = new vscode.ThemeIcon('arrow-right');
        } else if (sectionType === 'incoming') {
            this.iconPath = new vscode.ThemeIcon('arrow-left');
        }

        this.contextValue = 'connection-section';
        this.tooltip = `${count} ${label.toLowerCase()}`;
    }
}

/**
 * Connection item representing a single link between notes
 */
export class ConnectionItem extends TreeItem {
    constructor(
        public readonly targetPath: string,
        public readonly sourcePath: string,
        public readonly lineNumber: number,
        public readonly context: string,
        public readonly connectionType: 'outgoing' | 'incoming',
        public readonly displayText?: string
    ) {
        const filename = path.basename(targetPath, path.extname(targetPath));
        super(filename, vscode.TreeItemCollapsibleState.None);

        this.iconPath = new vscode.ThemeIcon('note');
        this.contextValue = 'connection';

        // Show display text if available, otherwise show line number (1-indexed)
        const preview = displayText
            ? `"${displayText}" (line ${lineNumber + 1})`
            : `line ${lineNumber + 1}`;
        this.description = preview;

        // Tooltip shows full context with rich formatting
        this.tooltip = this.buildTooltip();

        // Make clickable to open the connected note
        this.command = {
            command: 'noted.openConnection',
            title: 'Open Connection',
            arguments: [this]
        };

        this.resourceUri = vscode.Uri.file(targetPath);
    }

    private buildTooltip(): vscode.MarkdownString {
        const filename = path.basename(this.targetPath);
        const sourceFilename = path.basename(this.sourcePath);

        const tooltip = new vscode.MarkdownString('', true);
        tooltip.appendMarkdown(`**File:** \`${filename}\`\n\n`);
        tooltip.appendMarkdown(`**Line:** ${this.lineNumber + 1}\n\n`);

        if (this.displayText) {
            tooltip.appendMarkdown(`**Display Text:** "${this.displayText}"\n\n`);
        }

        tooltip.appendMarkdown(`**Context:**\n`);
        tooltip.appendCodeblock(this.context, 'markdown');
        tooltip.appendMarkdown(`\n\n**Source:** \`${sourceFilename}\``);

        return tooltip;
    }
}

/**
 * Category item for organizing templates by type
 */
export class CategoryItem extends TreeItem {
    constructor(
        public readonly categoryName: string,
        public readonly icon: string,
        public readonly description: string
    ) {
        super(`${icon} ${categoryName}`, vscode.TreeItemCollapsibleState.Collapsed);

        this.iconPath = new vscode.ThemeIcon('folder');
        this.contextValue = 'category';
        this.tooltip = description;
    }
}

/**
 * Template action item - a clickable button to create a note
 */
export class TemplateActionItem extends TreeItem {
    constructor(
        public readonly label: string,
        public readonly templateType: string,
        public readonly commandId: string,
        public readonly description?: string
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);

        this.iconPath = new vscode.ThemeIcon('add');
        this.contextValue = 'template-action';
        this.tooltip = description || `Create a new ${label}`;

        // Make clickable
        this.command = {
            command: commandId,
            title: `Create ${label}`,
            arguments: [templateType]
        };
    }
}

/**
 * Action button item - generic clickable action in the tree
 */
export class ActionButtonItem extends TreeItem {
    constructor(
        public readonly label: string,
        public readonly commandId: string,
        public readonly icon: string,
        public readonly description?: string
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);

        this.iconPath = new vscode.ThemeIcon(icon);
        this.contextValue = 'action-button';
        this.tooltip = description || label;

        // Make clickable
        this.command = {
            command: commandId,
            title: label,
            arguments: []
        };
    }
}
