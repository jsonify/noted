import * as vscode from 'vscode';
import { LinkService, LINK_PATTERN } from '../services/linkService';

/**
 * Provides clickable document links for wiki-style [[note-name]] syntax
 */
export class NoteLinkProvider implements vscode.DocumentLinkProvider {
    private linkService: LinkService;

    constructor(linkService: LinkService) {
        this.linkService = linkService;
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
