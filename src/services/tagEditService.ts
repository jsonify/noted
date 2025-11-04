import * as vscode from 'vscode';
import { TagService } from './tagService';
import { isValidTag, getChildTags, getParentTag } from '../utils/tagHelpers';

/**
 * Service for advanced tag editing operations
 * Handles hierarchical rename and workspace search for tags
 */
export class TagEditService {
    constructor(private tagService: TagService) {}

    /**
     * Validate if a tag rename is valid
     * @param oldTag Current tag name
     * @param newTag New tag name
     * @returns Error message if invalid, null if valid
     */
    validateTagRename(oldTag: string, newTag: string): string | null {
        if (!newTag || newTag.trim() === '') {
            return 'Tag name cannot be empty';
        }

        const normalizedNewTag = newTag.trim().toLowerCase();

        if (!isValidTag(normalizedNewTag)) {
            return 'Invalid tag name. Tags must start with a letter and contain only lowercase letters, numbers, hyphens, and forward slashes.';
        }

        if (oldTag.toLowerCase() === normalizedNewTag) {
            return 'New tag name is the same as the old tag name';
        }

        return null;
    }

    /**
     * Create rename edits for a single tag
     * @param oldTag Current tag name
     * @param newTag New tag name
     * @returns Workspace edit with all rename operations
     */
    createRenameEdits(oldTag: string, newTag: string): vscode.WorkspaceEdit {
        const workspaceEdit = new vscode.WorkspaceEdit();
        const locations = this.tagService.getLocationsForTag(oldTag);

        // Group locations by file
        const locationsByFile = new Map<string, typeof locations>();
        for (const location of locations) {
            if (!locationsByFile.has(location.uri)) {
                locationsByFile.set(location.uri, []);
            }
            locationsByFile.get(location.uri)!.push(location);
        }

        // Process each file
        for (const [fileUri, fileLocations] of locationsByFile.entries()) {
            const uri = vscode.Uri.file(fileUri);

            // Sort locations in reverse order to avoid offset issues
            const sortedLocations = fileLocations.sort((a, b) => {
                if (a.range.start.line !== b.range.start.line) {
                    return b.range.start.line - a.range.start.line;
                }
                return b.range.start.character - a.range.start.character;
            });

            // Create text edits for each location
            for (const location of sortedLocations) {
                const range = new vscode.Range(
                    new vscode.Position(location.range.start.line, location.range.start.character),
                    new vscode.Position(location.range.end.line, location.range.end.character)
                );

                workspaceEdit.replace(uri, range, `#${newTag}`);
            }
        }

        return workspaceEdit;
    }

    /**
     * Create hierarchical rename edits (rename parent and all children)
     * @param oldTag Current parent tag name (e.g., "project")
     * @param newTag New parent tag name (e.g., "work")
     * @returns Workspace edit with all rename operations for parent and children
     */
    createHierarchicalRenameEdits(oldTag: string, newTag: string): vscode.WorkspaceEdit {
        const workspaceEdit = new vscode.WorkspaceEdit();
        const allTags = this.tagService.getAllTagLabels();

        // Find all child tags
        const childTags = getChildTags(allTags, oldTag);

        // Create edits for parent tag
        const parentEdit = this.createRenameEdits(oldTag, newTag);
        this.mergeWorkspaceEdits(workspaceEdit, parentEdit);

        // Create edits for each child tag
        for (const childTag of childTags) {
            // Replace old parent with new parent in child tag name
            // e.g., "project/frontend" -> "work/frontend"
            const newChildTag = childTag.replace(new RegExp(`^${oldTag}/`), `${newTag}/`);

            const childEdit = this.createRenameEdits(childTag, newChildTag);
            this.mergeWorkspaceEdits(workspaceEdit, childEdit);
        }

        return workspaceEdit;
    }

    /**
     * Open workspace search for a tag
     * Searches for all occurrences of the tag in the workspace
     * @param tag Tag name to search for
     */
    async openWorkspaceSearch(tag: string): Promise<void> {
        // Build regex pattern to match tag in various formats:
        // 1. Inline hashtag: #tag
        // 2. YAML array: tags: [tag, ...]
        // 3. YAML list: - tag
        const tagPattern = `(#${tag}\\b|tags:.*?\\b${tag}\\b|^\\s*-\\s+${tag}\\b)`;

        try {
            await vscode.commands.executeCommand('workbench.action.findInFiles', {
                query: tagPattern,
                isRegex: true,
                isCaseSensitive: false,
                matchWholeWord: false,
                triggerSearch: true,
                filesToInclude: '**/*.{txt,md}', // Search in note files
                filesToExclude: '**/node_modules/**,**/.git/**'
            });
        } catch (error) {
            vscode.window.showErrorMessage(
                `Failed to open workspace search: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Merge two workspace edits
     * @param target Target workspace edit to merge into
     * @param source Source workspace edit to merge from
     */
    private mergeWorkspaceEdits(target: vscode.WorkspaceEdit, source: vscode.WorkspaceEdit): void {
        // Get all entries from source edit
        for (const entry of source.entries()) {
            const [uri, edits] = entry;

            // Add each edit to target
            for (const edit of edits) {
                if (edit instanceof vscode.TextEdit) {
                    target.replace(uri, edit.range, edit.newText);
                }
            }
        }
    }

    /**
     * Check if a tag has children (is a parent in hierarchy)
     * @param tag Tag name to check
     * @returns True if tag has children
     */
    hasChildren(tag: string): boolean {
        const allTags = this.tagService.getAllTagLabels();
        const childTags = getChildTags(allTags, tag);
        return childTags.length > 0;
    }

    /**
     * Get count of child tags
     * @param tag Tag name to check
     * @returns Number of child tags
     */
    getChildCount(tag: string): number {
        const allTags = this.tagService.getAllTagLabels();
        const childTags = getChildTags(allTags, tag);
        return childTags.length;
    }
}
