import * as vscode from 'vscode';
import { TagService } from './tagService';
import { TagEditService } from './tagEditService';

/**
 * Rename provider for tags
 * Enables F2 (rename) support when cursor is on a tag
 */
export class TagRenameProvider implements vscode.RenameProvider {
    constructor(
        private tagService: TagService,
        private tagEditService: TagEditService
    ) {}

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

        // Validate new tag name using TagEditService
        const validationError = this.tagEditService.validateTagRename(oldTag, normalizedNewName);
        if (validationError) {
            vscode.window.showErrorMessage(validationError);
            return null;
        }

        // Check if tag already exists (merge detection)
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

        // Use TagEditService to create rename edits (DRY principle)
        return this.tagEditService.createRenameEdits(oldTag, normalizedNewName);
    }
}
