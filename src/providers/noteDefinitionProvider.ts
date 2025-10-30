import * as vscode from 'vscode';
import { LinkService, LINK_PATTERN } from '../services/linkService';
import { IMAGE_EXTENSIONS, DIAGRAM_EXTENSIONS } from '../constants';
import * as path from 'path';

/**
 * Provides "Go to Definition" for wiki-style [[note-name]] links
 * This takes precedence over VS Code's built-in markdown link handling
 */
export class NoteDefinitionProvider implements vscode.DefinitionProvider {
    private linkService: LinkService;

    constructor(linkService: LinkService) {
        this.linkService = linkService;
    }

    /**
     * Check if a link is to an image or diagram file based on extension
     */
    private isImageOrDiagramLink(linkText: string): boolean {
        const lowerLink = linkText.toLowerCase();

        // Check for composite extensions first (.excalidraw.svg, .excalidraw.png)
        if (lowerLink.endsWith('.excalidraw.svg') || lowerLink.endsWith('.excalidraw.png')) {
            return true;
        }

        // Check single extensions
        const ext = path.extname(linkText).toLowerCase();
        return IMAGE_EXTENSIONS.includes(ext) || DIAGRAM_EXTENSIONS.includes(ext);
    }

    async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Definition | undefined> {
        const line = document.lineAt(position.line);
        const text = line.text;

        // Find if cursor is within a [[link]]
        LINK_PATTERN.lastIndex = 0;
        let match;
        while ((match = LINK_PATTERN.exec(text)) !== null) {
            const linkStart = match.index;
            const linkEnd = match.index + match[0].length;

            // Check if cursor is within this link
            if (position.character >= linkStart && position.character <= linkEnd) {
                const linkText = match[1].trim();

                // Skip image and diagram links
                if (this.isImageOrDiagramLink(linkText)) {
                    return undefined;
                }

                // Resolve the link
                const targetPath = await this.linkService.resolveLink(linkText);

                if (targetPath) {
                    const targetUri = vscode.Uri.file(targetPath);
                    return new vscode.Location(targetUri, new vscode.Position(0, 0));
                } else {
                    // Link not found - trigger createNoteFromLink command
                    await vscode.commands.executeCommand('noted.createNoteFromLink', linkText);
                    return undefined;
                }
            }
        }

        return undefined;
    }
}
