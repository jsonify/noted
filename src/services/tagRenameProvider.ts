import * as vscode from 'vscode';
import { TagService } from './tagService';
import { isValidTag } from '../utils/tagHelpers';

/**
 * Rename provider for tags
 * Enables F2 (rename) support when cursor is on a tag
 */
export class TagRenameProvider implements vscode.RenameProvider {
    constructor(private tagService: TagService) {}

    /**
     * Prepare rename: Check if cursor is on a tag and return range + placeholder
     * @param document Document being edited
     * @param position Cursor position
     * @param token Cancellation token
     * @returns Range and placeholder text for rename, or null if not on a tag
     */
    prepareRename(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Range | { range: vscode.Range; placeholder: string }> {
        const filePath = document.fileName;
        const line = position.line;
        const character = position.character;

        // Check if cursor is on a tag
        const tagAtPosition = this.tagService.getTagAtPosition(filePath, line, character);

        if (!tagAtPosition) {
            // Not on a tag
            throw new Error('No tag found at cursor position');
        }

        const { tag, location } = tagAtPosition;

        // Return range and placeholder for the rename
        return {
            range: new vscode.Range(
                new vscode.Position(location.range.start.line, location.range.start.character),
                new vscode.Position(location.range.end.line, location.range.end.character)
            ),
            placeholder: tag
        };
    }

    /**
     * Provide rename edits: Generate workspace edits to rename all occurrences of the tag
     * @param document Document being edited
     * @param position Cursor position
     * @param newName New tag name
     * @param token Cancellation token
     * @returns Workspace edit with all rename operations
     */
    async provideRenameEdits(
        document: vscode.TextDocument,
        position: vscode.Position,
        newName: string,
        token: vscode.CancellationToken
    ): Promise<vscode.WorkspaceEdit | null> {
        const filePath = document.fileName;
        const line = position.line;
        const character = position.character;

        // Check if cursor is on a tag
        const tagAtPosition = this.tagService.getTagAtPosition(filePath, line, character);

        if (!tagAtPosition) {
            vscode.window.showErrorMessage('No tag found at cursor position');
            return null;
        }

        const { tag: oldTag } = tagAtPosition;

        // Normalize new tag name (remove # prefix if present)
        let normalizedNewName = newName.trim();
        if (normalizedNewName.startsWith('#')) {
            normalizedNewName = normalizedNewName.substring(1);
        }

        // Validate new tag name
        if (!isValidTag(normalizedNewName)) {
            vscode.window.showErrorMessage(
                `Invalid tag name: "${normalizedNewName}". ` +
                'Tags must start with a letter, contain only lowercase letters, numbers, ' +
                'hyphens, and forward slashes for hierarchy.'
            );
            return null;
        }

        // Check if tag already exists (case-insensitive)
        const existingTags = this.tagService.getAllTagLabels();
        const normalizedExistingTags = existingTags.map(t => t.toLowerCase());

        if (normalizedExistingTags.includes(normalizedNewName.toLowerCase()) &&
            oldTag.toLowerCase() !== normalizedNewName.toLowerCase()) {
            const response = await vscode.window.showWarningMessage(
                `Tag "#${normalizedNewName}" already exists. ` +
                'Renaming will merge these tags. Continue?',
                'Yes', 'No'
            );

            if (response !== 'Yes') {
                return null;
            }
        }

        // Get all locations for this tag
        const locations = this.tagService.getLocationsForTag(oldTag);

        if (locations.length === 0) {
            vscode.window.showErrorMessage(`No occurrences of tag "#${oldTag}" found`);
            return null;
        }

        // Create workspace edit
        const workspaceEdit = new vscode.WorkspaceEdit();

        // Group locations by file for efficient processing
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

            // Sort locations by position (reverse order to avoid offset issues)
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

                // Replace with new tag name (keep # prefix for inline hashtags)
                workspaceEdit.replace(uri, range, `#${normalizedNewName}`);
            }
        }

        return workspaceEdit;
    }
}
