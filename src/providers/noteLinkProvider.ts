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
                documentLink.tooltip = `Open ${linkText}`;
                links.push(documentLink);
            } else {
                // Create a link that will show an error when clicked
                const documentLink = new vscode.DocumentLink(range, undefined);
                documentLink.tooltip = `Note not found: ${linkText}`;
                links.push(documentLink);
            }
        }

        return links;
    }
}
