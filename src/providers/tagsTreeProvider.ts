import * as vscode from 'vscode';
import * as fs from 'fs';
import { TagItem, TagFileItem, TagReferenceItem } from './treeItems';
import { TagService } from '../services/tagService';

// Union type for all possible tree items in tags view
type TagTreeItem = TagItem | TagFileItem | TagReferenceItem;

/**
 * Tree data provider for tags view
 * Displays hierarchical view: tags → files → line references
 */
export class TagsTreeProvider implements vscode.TreeDataProvider<TagTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TagTreeItem | undefined | null | void> = new vscode.EventEmitter<TagTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TagTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

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
    getTreeItem(element: TagTreeItem): vscode.TreeItem {
        return element;
    }

    /**
     * Get children for tree view
     * Hierarchical structure:
     * - Root level: All tags
     * - Tag level: Files containing the tag
     * - File level: Line references within that file
     */
    async getChildren(element?: TagTreeItem): Promise<TagTreeItem[] | undefined> {
        if (!element) {
            // Root level: Return all tags
            return this.getTagNodes();
        } else if (element instanceof TagItem) {
            // Tag level: Return files containing this tag
            return this.getFileNodesForTag(element.tagName);
        } else if (element instanceof TagFileItem) {
            // File level: Return line references in this file
            return this.getReferenceNodesForFile(element.tagName, element.filePath);
        } else {
            // TagReferenceItem has no children
            return undefined;
        }
    }

    /**
     * Get all tag nodes for root level
     */
    private getTagNodes(): TagItem[] {
        const allTagLabels = this.tagService.getAllTagLabels();

        // Sort tags alphabetically
        const sortedTags = allTagLabels.sort((a, b) => a.localeCompare(b));

        // Create TagItem for each tag
        return sortedTags.map(tag => {
            const referenceCount = this.tagService.getTagReferenceCount(tag);
            const hasChildren = referenceCount > 0;
            return new TagItem(tag, referenceCount, hasChildren);
        });
    }

    /**
     * Get file nodes for a specific tag
     * Groups locations by file and returns TagFileItem for each file
     */
    private getFileNodesForTag(tagName: string): TagFileItem[] {
        const locations = this.tagService.getLocationsForTag(tagName);

        // Group locations by file
        const fileGroups = new Map<string, number>();
        for (const location of locations) {
            const count = fileGroups.get(location.uri) || 0;
            fileGroups.set(location.uri, count + 1);
        }

        // Create TagFileItem for each file
        const fileItems: TagFileItem[] = [];
        for (const [filePath, count] of fileGroups.entries()) {
            fileItems.push(new TagFileItem(filePath, tagName, count));
        }

        // Sort files alphabetically by file name
        fileItems.sort((a, b) => {
            const nameA = a.label?.toString() || '';
            const nameB = b.label?.toString() || '';
            return nameA.localeCompare(nameB);
        });

        return fileItems;
    }

    /**
     * Get reference nodes for a specific tag in a specific file
     * Returns TagReferenceItem for each line reference
     */
    private getReferenceNodesForFile(tagName: string, filePath: string): TagReferenceItem[] {
        const locations = this.tagService.getLocationsForTagInFile(tagName, filePath);

        // Read file content to extract context
        let fileContent = '';
        try {
            fileContent = fs.readFileSync(filePath, 'utf-8');
        } catch (error) {
            console.error(`[NOTED] Failed to read file for tag references: ${filePath}`, error);
            return [];
        }

        const lines = fileContent.split('\n');

        // Create TagReferenceItem for each location
        const referenceItems: TagReferenceItem[] = [];
        for (const location of locations) {
            const lineNumber = location.range.start.line;
            const character = location.range.start.character;

            // Extract context (current line with surrounding context)
            const context = this.extractContext(lines, lineNumber, 0, 0); // Just current line for now

            referenceItems.push(new TagReferenceItem(
                filePath,
                lineNumber,
                character,
                context,
                tagName
            ));
        }

        // Sort by line number
        referenceItems.sort((a, b) => a.lineNumber - b.lineNumber);

        return referenceItems;
    }

    /**
     * Extract context lines around a specific line number
     * @param lines - Array of all lines in the file
     * @param lineNumber - Target line number (0-indexed)
     * @param linesBefore - Number of lines to include before
     * @param linesAfter - Number of lines to include after
     */
    private extractContext(
        lines: string[],
        lineNumber: number,
        linesBefore: number,
        linesAfter: number
    ): string {
        const startLine = Math.max(0, lineNumber - linesBefore);
        const endLine = Math.min(lines.length - 1, lineNumber + linesAfter);

        const contextLines: string[] = [];
        for (let i = startLine; i <= endLine; i++) {
            contextLines.push(lines[i]);
        }

        return contextLines.join('\n');
    }

    /**
     * Get total number of tags
     */
    getTagCount(): number {
        return this.tagService.getTagCount();
    }
}
