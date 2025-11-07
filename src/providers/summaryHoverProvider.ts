import * as vscode from 'vscode';
import * as path from 'path';
import { LinkService, LINK_PATTERN } from '../services/linkService';
import { SummarizationService } from '../services/summarizationService';

/**
 * Provides hover previews showing AI-generated summary when hovering over wiki-style links
 * Only shows cached summaries - does not generate summaries on hover (too slow)
 */
export class SummaryHoverProvider implements vscode.HoverProvider {
    private linkService: LinkService;
    private summarizationService: SummarizationService;
    private maxSummaryWords: number = 100;

    constructor(linkService: LinkService, summarizationService: SummarizationService) {
        this.linkService = linkService;
        this.summarizationService = summarizationService;
    }

    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | undefined> {
        // Check if cursor is over a wiki-style link
        const linkInfo = this.getLinkAtPosition(document, position);
        if (!linkInfo) {
            return undefined;
        }

        // Resolve the link to get the target file path
        const targetPath = await this.linkService.resolveLink(linkInfo.linkText);
        if (!targetPath) {
            // Link doesn't resolve to a file - don't show summary hover
            return undefined;
        }

        // Check if we have a cached summary for this note
        try {
            const cachedSummary = await this.summarizationService.getCachedSummary(targetPath);

            if (cachedSummary) {
                // We have a cached summary - show it
                return this.createSummaryHover(cachedSummary, targetPath, linkInfo.range);
            } else {
                // No cached summary - show placeholder message
                return this.createNoCacheHover(targetPath, linkInfo.range);
            }
        } catch (error) {
            // Error checking cache - silently fail
            console.error('[NOTED] Error checking summary cache:', error);
            return undefined;
        }
    }

    /**
     * Check if the position is within a wiki-style link and return link info
     */
    private getLinkAtPosition(
        document: vscode.TextDocument,
        position: vscode.Position
    ): { linkText: string; displayText?: string; range: vscode.Range } | undefined {
        const line = document.lineAt(position.line);
        const text = line.text;

        // Reset regex state
        LINK_PATTERN.lastIndex = 0;
        let match;

        while ((match = LINK_PATTERN.exec(text)) !== null) {
            const startCol = match.index;
            const endCol = match.index + match[0].length;

            // Check if cursor is within this link
            if (position.character >= startCol && position.character <= endCol) {
                const linkText = match[1].trim();
                const displayText = match[2] ? match[2].trim() : undefined;
                const range = new vscode.Range(
                    position.line,
                    startCol,
                    position.line,
                    endCol
                );
                return { linkText, displayText, range };
            }
        }

        return undefined;
    }

    /**
     * Create a hover with AI summary preview
     */
    private createSummaryHover(
        summary: string,
        targetPath: string,
        range: vscode.Range
    ): vscode.Hover {
        const markdownContent = new vscode.MarkdownString();
        markdownContent.isTrusted = true;

        // Show the note name as header with sparkle emoji
        const filename = path.basename(targetPath, path.extname(targetPath));
        markdownContent.appendMarkdown(`### ✨ AI Summary: ${filename}\n\n`);

        // Truncate summary to first N words
        const truncatedSummary = this.truncateToWords(summary, this.maxSummaryWords);

        // Show the summary in a quote block for visual distinction
        markdownContent.appendMarkdown(`> ${truncatedSummary}\n\n`);

        // Show cache status and action links
        markdownContent.appendMarkdown('---\n\n');
        markdownContent.appendMarkdown('_Summary cached • ');

        // Add clickable link to view full summary
        const viewCommand = `command:noted.summarizeNote?${encodeURIComponent(JSON.stringify([targetPath]))}`;
        markdownContent.appendMarkdown(`[View full summary](${viewCommand})_`);

        return new vscode.Hover(markdownContent, range);
    }

    /**
     * Create a hover when no cached summary exists
     */
    private createNoCacheHover(
        targetPath: string,
        range: vscode.Range
    ): vscode.Hover {
        const markdownContent = new vscode.MarkdownString();
        markdownContent.isTrusted = true;

        const filename = path.basename(targetPath, path.extname(targetPath));
        markdownContent.appendMarkdown(`### ✨ AI Summary: ${filename}\n\n`);

        markdownContent.appendMarkdown('_No summary cached for this note._\n\n');

        // Add clickable link to generate summary
        const generateCommand = `command:noted.summarizeNote?${encodeURIComponent(JSON.stringify([targetPath]))}`;
        markdownContent.appendMarkdown(`[Generate summary →](${generateCommand})`);

        return new vscode.Hover(markdownContent, range);
    }

    /**
     * Truncate text to specified number of words
     * Adds ellipsis if text was truncated
     */
    private truncateToWords(text: string, maxWords: number): string {
        const words = text.split(/\s+/);

        if (words.length <= maxWords) {
            return text;
        }

        const truncated = words.slice(0, maxWords).join(' ');
        return truncated + '…';
    }

    /**
     * Update the maximum number of words to show in preview
     */
    setMaxSummaryWords(words: number): void {
        this.maxSummaryWords = words;
    }
}
