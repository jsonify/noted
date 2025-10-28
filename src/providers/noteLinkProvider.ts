import * as vscode from 'vscode';
import * as path from 'path';
import { LinkService, LINK_PATTERN } from '../services/linkService';
import { IMAGE_EXTENSIONS, DIAGRAM_EXTENSIONS } from '../constants';

/**
 * Provides clickable document links for wiki-style [[note-name]] syntax
 */
export class NoteLinkProvider implements vscode.DocumentLinkProvider {
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

    async provideDocumentLinks(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): Promise<vscode.DocumentLink[]> {
        const links: vscode.DocumentLink[] = [];
        const text = document.getText();

        // Reset regex state
        LINK_PATTERN.lastIndex = 0;
        let match;

        while ((match = LINK_PATTERN.exec(text)) !== null) {
            const linkText = match[1].trim();
            const displayText = match[2] ? match[2].trim() : undefined;
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);

            // Skip image and diagram links (handled by embed system)
            if (this.isImageOrDiagramLink(linkText)) {
                continue;
            }

            // Try to resolve the link
            const targetPath = await this.linkService.resolveLink(linkText);
            if (targetPath) {
                const documentLink = new vscode.DocumentLink(
                    range,
                    vscode.Uri.file(targetPath)
                );
                // Show the target if display text is used, otherwise just show the link text
                documentLink.tooltip = displayText
                    ? `Open ${linkText} (displayed as: "${displayText}")`
                    : `Open ${linkText}`;
                links.push(documentLink);
            } else {
                // Create a link with custom URI that will prompt to create the note
                const createUri = vscode.Uri.parse(`command:noted.createNoteFromLink?${encodeURIComponent(JSON.stringify([linkText]))}`);
                const documentLink = new vscode.DocumentLink(range, createUri);
                documentLink.tooltip = `Note not found: ${linkText} (click to create)`;
                links.push(documentLink);
            }
        }

        return links;
    }
}
