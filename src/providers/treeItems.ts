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
        const iconMap: Record<string, string> = {
            recent: 'history',
            pinned: 'pin',
            archive: 'archive',
            standard: 'book',
            custom: 'file-code',
            manage: 'settings-gear',
            hierarchical: 'symbol-namespace',
            inbox: 'inbox',
        };
        const iconName = iconMap[this.sectionType] || 'folder';
        this.iconPath = new vscode.ThemeIcon(iconName);
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
 * Hierarchy item representing a virtual hierarchy node in hierarchical notes view
 * These nodes don't represent actual folders, but rather hierarchy levels in dot-delimited note names
 * Example: 'project.design.frontend.md' creates hierarchy nodes for 'project' and 'design'
 */
export class HierarchyItem extends TreeItem {
    constructor(
        public readonly segment: string,
        public readonly hierarchyPath: string,
        public readonly noteCount: number
    ) {
        super(segment, vscode.TreeItemCollapsibleState.Collapsed);

        this.iconPath = new vscode.ThemeIcon('symbol-namespace');
        this.contextValue = 'hierarchy';
        this.description = `${noteCount} note${noteCount !== 1 ? 's' : ''}`;
        this.tooltip = this.buildTooltip();
    }

    private buildTooltip(): vscode.MarkdownString {
        const tooltip = new vscode.MarkdownString('', true);
        tooltip.appendMarkdown(`**Hierarchy:** \`${this.hierarchyPath}\`\n\n`);
        tooltip.appendMarkdown(`**Notes:** ${this.noteCount}\n\n`);
        tooltip.appendMarkdown('Expand to see child hierarchies and notes');
        return tooltip;
    }
}

/**
 * Tag item representing a tag node in hierarchical tag view
 * Shows tag label with reference count and can have child tags or files
 */
export class TagItem extends TreeItem {
    constructor(
        public readonly tagName: string,
        public readonly referenceCount: number,
        public readonly hasChildren: boolean = false
    ) {
        // Collapsible if has children (child tags or files), otherwise collapsed by default
        const collapsibleState = hasChildren
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.Collapsed;

        super(`#${tagName}`, collapsibleState);

        this.iconPath = new vscode.ThemeIcon('symbol-number');
        this.contextValue = 'tag';
        this.description = `${referenceCount} reference${referenceCount !== 1 ? 's' : ''}`;
        this.tooltip = this.buildTooltip();
    }

    private buildTooltip(): vscode.MarkdownString {
        const tooltip = new vscode.MarkdownString('', true);
        tooltip.appendMarkdown(`**Tag:** \`#${this.tagName}\`\n\n`);
        tooltip.appendMarkdown(`**References:** ${this.referenceCount}\n\n`);
        tooltip.appendMarkdown('Expand to see files and line references');
        return tooltip;
    }
}

/**
 * Tag file item representing a file that contains a specific tag
 * Shows file name with count of tag occurrences in that file
 */
export class TagFileItem extends TreeItem {
    constructor(
        public readonly filePath: string,
        public readonly tagName: string,
        public readonly tagCountInFile: number
    ) {
        const filename = path.basename(filePath, path.extname(filePath));
        super(filename, vscode.TreeItemCollapsibleState.Collapsed);

        this.iconPath = new vscode.ThemeIcon('file');
        this.contextValue = 'tag-file';
        this.resourceUri = vscode.Uri.file(filePath);
        this.description = `${tagCountInFile} occurrence${tagCountInFile !== 1 ? 's' : ''}`;
        this.tooltip = this.buildTooltip();

        // Make clickable to open the file
        this.command = {
            command: 'vscode.open',
            title: 'Open File',
            arguments: [vscode.Uri.file(filePath)]
        };
    }

    private buildTooltip(): vscode.MarkdownString {
        const filename = path.basename(this.filePath);
        const relativePath = vscode.workspace.asRelativePath(this.filePath);

        const tooltip = new vscode.MarkdownString('', true);
        tooltip.appendMarkdown(`**File:** \`${filename}\`\n\n`);
        tooltip.appendMarkdown(`**Path:** \`${relativePath}\`\n\n`);
        tooltip.appendMarkdown(`**Tag:** \`#${this.tagName}\`\n\n`);
        tooltip.appendMarkdown(`**Occurrences:** ${this.tagCountInFile}\n\n`);
        tooltip.appendMarkdown('Click to open file, or expand to see line references');

        return tooltip;
    }
}

/**
 * Tag reference item representing a specific line where a tag appears
 * Shows line number and context snippet
 */
export class TagReferenceItem extends TreeItem {
    constructor(
        public readonly filePath: string,
        public readonly lineNumber: number,
        public readonly character: number,
        public readonly context: string,
        public readonly tagName: string
    ) {
        // Extract context snippet (60 chars around tag)
        const contextSnippet = TagReferenceItem.extractContextSnippet(context, 60);

        // Label format: "line: context snippet"
        super(`${lineNumber + 1}: ${contextSnippet}`, vscode.TreeItemCollapsibleState.None);

        this.iconPath = new vscode.ThemeIcon('symbol-number');
        this.contextValue = 'tag-reference';
        this.resourceUri = vscode.Uri.file(filePath);
        this.tooltip = this.buildTooltip();

        // Make clickable to open file at specific line with selection
        this.command = {
            command: 'noted.openTagReference',
            title: 'Go to Reference',
            arguments: [filePath, lineNumber, character, tagName.length + 1] // +1 for the # symbol
        };
    }

    private buildTooltip(): vscode.MarkdownString {
        const filename = path.basename(this.filePath);
        const relativePath = vscode.workspace.asRelativePath(this.filePath);

        const tooltip = new vscode.MarkdownString('', true);
        tooltip.appendMarkdown(`**File:** \`${filename}\`\n\n`);
        tooltip.appendMarkdown(`**Path:** \`${relativePath}\`\n\n`);
        tooltip.appendMarkdown(`**Line:** ${this.lineNumber + 1}\n\n`);
        tooltip.appendMarkdown(`**Tag:** \`#${this.tagName}\`\n\n`);
        tooltip.appendMarkdown(`**Context:**\n`);
        tooltip.appendCodeblock(this.context.trim(), 'markdown');

        return tooltip;
    }

    /**
     * Extract a snippet of context around the tag (max length)
     */
    private static extractContextSnippet(context: string, maxLength: number): string {
        const trimmed = context.trim();
        if (trimmed.length <= maxLength) {
            return trimmed;
        }

        // Truncate and add ellipsis
        return trimmed.substring(0, maxLength - 3) + '...';
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

/**
 * Section item for orphans panel
 */
export class OrphanSectionItem extends TreeItem {
    constructor(
        public readonly label: string,
        public readonly sectionType: 'true-orphans' | 'source-only' | 'sink-only',
        public readonly count: number
    ) {
        super(`${label} (${count})`, vscode.TreeItemCollapsibleState.Expanded);

        // Set appropriate icon based on section type
        if (sectionType === 'true-orphans') {
            this.iconPath = new vscode.ThemeIcon('circle-slash');
        } else if (sectionType === 'source-only') {
            this.iconPath = new vscode.ThemeIcon('arrow-right');
        } else if (sectionType === 'sink-only') {
            this.iconPath = new vscode.ThemeIcon('arrow-left');
        }

        this.contextValue = 'orphan-section';
        this.tooltip = `${count} ${label.toLowerCase()}`;
    }
}

/**
 * Orphan note item
 */
export class OrphanNoteItem extends TreeItem {
    constructor(
        public readonly filePath: string,
        public readonly hasIncomingLinks: boolean,
        public readonly hasOutgoingLinks: boolean
    ) {
        const filename = path.basename(filePath, path.extname(filePath));
        super(filename, vscode.TreeItemCollapsibleState.None);

        this.iconPath = new vscode.ThemeIcon('note');
        this.contextValue = 'orphan-note';
        this.resourceUri = vscode.Uri.file(filePath);

        // Build description based on link status
        if (!hasIncomingLinks && !hasOutgoingLinks) {
            this.description = 'no connections';
        } else if (!hasIncomingLinks) {
            this.description = 'no backlinks';
        } else if (!hasOutgoingLinks) {
            this.description = 'no outgoing links';
        }

        // Build tooltip
        this.tooltip = this.buildTooltip();

        // Make clickable to open the note
        this.command = {
            command: 'vscode.open',
            title: 'Open Note',
            arguments: [vscode.Uri.file(filePath)]
        };
    }

    private buildTooltip(): vscode.MarkdownString {
        const filename = path.basename(this.filePath);
        const relativePath = vscode.workspace.asRelativePath(this.filePath);

        const tooltip = new vscode.MarkdownString('', true);
        tooltip.appendMarkdown(`**File:** \`${filename}\`\n\n`);
        tooltip.appendMarkdown(`**Path:** \`${relativePath}\`\n\n`);

        if (!this.hasIncomingLinks && !this.hasOutgoingLinks) {
            tooltip.appendMarkdown('🔗 **No connections** to other notes\n\n');
            tooltip.appendMarkdown('This note has no incoming or outgoing links.');
        } else if (!this.hasIncomingLinks) {
            tooltip.appendMarkdown('⬅️ **No backlinks**\n\n');
            tooltip.appendMarkdown('No other notes link to this note.');
        } else if (!this.hasOutgoingLinks) {
            tooltip.appendMarkdown('➡️ **No outgoing links**\n\n');
            tooltip.appendMarkdown('This note doesn\'t link to any other notes.');
        }

        return tooltip;
    }
}

/**
 * Placeholder link item grouped by target
 */
export class PlaceholderGroupItem extends TreeItem {
    constructor(
        public readonly linkText: string,
        public readonly sourceCount: number,
        public readonly sources: Array<{ file: string; line: number; context: string; displayText?: string }>
    ) {
        super(linkText, vscode.TreeItemCollapsibleState.Expanded);

        this.iconPath = new vscode.ThemeIcon('link');
        this.contextValue = 'placeholder-group';
        this.description = `${sourceCount} reference${sourceCount !== 1 ? 's' : ''}`;

        // Tooltip shows summary
        const tooltip = new vscode.MarkdownString('', true);
        tooltip.appendMarkdown(`**Placeholder:** \`[[${linkText}]]\`\n\n`);
        tooltip.appendMarkdown(`Referenced in **${sourceCount}** location${sourceCount !== 1 ? 's' : ''}\n\n`);
        tooltip.appendMarkdown('Click to create this note');

        this.tooltip = tooltip;

        // Make clickable to create the note
        this.command = {
            command: 'noted.createNoteFromPlaceholder',
            title: 'Create Note',
            arguments: [linkText]
        };
    }
}

/**
 * Placeholder source item (where the placeholder is referenced)
 */
export class PlaceholderSourceItem extends TreeItem {
    constructor(
        public readonly filePath: string,
        public readonly lineNumber: number,
        public readonly context: string,
        public readonly displayText?: string
    ) {
        const filename = path.basename(filePath, path.extname(filePath));
        super(filename, vscode.TreeItemCollapsibleState.None);

        this.iconPath = new vscode.ThemeIcon('note');
        this.contextValue = 'placeholder-source';
        this.resourceUri = vscode.Uri.file(filePath);

        // Show line number or display text
        const preview = displayText
            ? `"${displayText}" (line ${lineNumber + 1})`
            : `line ${lineNumber + 1}`;
        this.description = preview;

        // Build tooltip
        this.tooltip = this.buildTooltip();

        // Make clickable to navigate to the source location
        this.command = {
            command: 'noted.openPlaceholderSource',
            title: 'Open Source',
            arguments: [filePath, lineNumber]
        };
    }

    private buildTooltip(): vscode.MarkdownString {
        const filename = path.basename(this.filePath);
        const relativePath = vscode.workspace.asRelativePath(this.filePath);

        const tooltip = new vscode.MarkdownString('', true);
        tooltip.appendMarkdown(`**File:** \`${filename}\`\n\n`);
        tooltip.appendMarkdown(`**Path:** \`${relativePath}\`\n\n`);
        tooltip.appendMarkdown(`**Line:** ${this.lineNumber + 1}\n\n`);

        if (this.displayText) {
            tooltip.appendMarkdown(`**Display Text:** "${this.displayText}"\n\n`);
        }

        tooltip.appendMarkdown(`**Context:**\n`);
        tooltip.appendCodeblock(this.context, 'markdown');

        return tooltip;
    }
}

/**
 * Collection section item (e.g., "Pinned Collections", "All Collections")
 */
export class CollectionSectionItem extends TreeItem {
    constructor(
        public readonly label: string,
        public readonly sectionType: 'pinned' | 'all',
        public readonly count: number
    ) {
        super(`${label} (${count})`, vscode.TreeItemCollapsibleState.Expanded);

        // Set appropriate icon based on section type
        if (sectionType === 'pinned') {
            this.iconPath = new vscode.ThemeIcon('pinned');
        } else {
            this.iconPath = new vscode.ThemeIcon('library');
        }

        this.contextValue = 'collection-section';
        this.tooltip = `${count} ${label.toLowerCase()}`;
    }
}

/**
 * Smart collection item
 */
export class CollectionItem extends TreeItem {
    constructor(
        public readonly collectionId: string,
        public readonly collectionName: string,
        public readonly query: string,
        public readonly description?: string,
        public readonly icon?: string,
        public readonly color?: string,
        public readonly pinned?: boolean,
        public readonly resultCount?: number
    ) {
        // Show result count if available
        const label = resultCount !== undefined
            ? `${collectionName} (${resultCount})`
            : collectionName;

        super(label, vscode.TreeItemCollapsibleState.None);

        // Use custom icon if provided, otherwise use default
        this.iconPath = new vscode.ThemeIcon(icon || 'search');
        this.contextValue = pinned ? 'collection-pinned' : 'collection';

        // Build tooltip
        this.tooltip = this.buildTooltip();

        // Make clickable to run the collection
        this.command = {
            command: 'noted.runCollection',
            title: 'Run Collection',
            arguments: [collectionId]
        };
    }

    private buildTooltip(): vscode.MarkdownString {
        const tooltip = new vscode.MarkdownString('', true);
        tooltip.appendMarkdown(`**Collection:** ${this.collectionName}\n\n`);

        if (this.description) {
            tooltip.appendMarkdown(`${this.description}\n\n`);
        }

        tooltip.appendMarkdown(`**Query:** \`${this.query}\`\n\n`);

        if (this.resultCount !== undefined) {
            tooltip.appendMarkdown(`**Results:** ${this.resultCount} note${this.resultCount !== 1 ? 's' : ''}\n\n`);
        }

        tooltip.appendMarkdown('Click to run this collection');

        return tooltip;
    }
}

/**
 * Version badge item - displays current extension version
 */
export class VersionItem extends TreeItem {
    constructor(
        public readonly version: string
    ) {
        super(`v${version}`, vscode.TreeItemCollapsibleState.None);

        this.iconPath = new vscode.ThemeIcon('info');
        this.contextValue = 'version';
        this.tooltip = 'Click to view recent changes';

        // Make clickable to show changelog
        this.command = {
            command: 'noted.showVersionChangelog',
            title: 'View Changelog',
            arguments: []
        };
    }
}
