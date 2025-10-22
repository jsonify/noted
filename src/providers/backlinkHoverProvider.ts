import * as vscode from 'vscode';
import * as path from 'path';
import { LinkService } from '../services/linkService';

/**
 * Provides hover information showing backlinks for the current note
 */
export class BacklinkHoverProvider implements vscode.HoverProvider {
    private linkService: LinkService;

    constructor(linkService: LinkService) {
        this.linkService = linkService;
    }

    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | undefined> {
        // Only show backlinks in the first line (near title/header)
        if (position.line > 5) {
            return undefined;
        }

        const backlinks = this.linkService.getBacklinks(document.uri.fsPath);
        if (backlinks.length === 0) {
            return undefined;
        }

        const markdownContent = new vscode.MarkdownString();
        markdownContent.isTrusted = true;

        markdownContent.appendMarkdown(`**${backlinks.length} Backlink${backlinks.length > 1 ? 's' : ''}**\n\n`);

        for (const backlink of backlinks) {
            const filename = path.basename(backlink.sourceFile);
            const uri = vscode.Uri.file(backlink.sourceFile);
            const command = `command:noted.openNote?${encodeURIComponent(JSON.stringify([backlink.sourceFile]))}`;

            // Show display text if available
            const linkLabel = backlink.displayText
                ? `${filename} (as "${backlink.displayText}")`
                : filename;

            markdownContent.appendMarkdown(`- [${linkLabel}](${command})\n`);
            if (backlink.context) {
                markdownContent.appendMarkdown(`  _${backlink.context}_\n`);
            }
        }

        return new vscode.Hover(markdownContent);
    }
}
