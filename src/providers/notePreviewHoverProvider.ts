import * as vscode from 'vscode';
import * as path from 'path';
import { LinkService, LINK_PATTERN } from '../services/linkService';
import { readFile, getFileStats } from '../services/fileSystemService';
import { parseFrontmatter, extractAllTags } from '../utils/frontmatterParser';

/**
 * Provides hover previews showing note content when hovering over wiki-style links
 */
export class NotePreviewHoverProvider implements vscode.HoverProvider {
    private linkService: LinkService;
    private maxPreviewLines: number = 10;
    private maxLineLength: number = 100;

    constructor(linkService: LinkService) {
        this.linkService = linkService;
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
            // Link doesn't resolve to a file
            return this.createNotFoundHover(linkInfo.linkText, linkInfo.range);
        }

        // Read and preview the target note
        try {
            const content = await readFile(targetPath);
            const fileStats = await getFileStats(targetPath);
            const metadata = await this.extractMetadata(content, targetPath, fileStats);
            const preview = this.extractPreview(content, targetPath);
            return this.createPreviewHover(preview, targetPath, metadata, linkInfo.range);
        } catch (error) {
            console.error('[NOTED] Error reading file for preview:', targetPath, error);
            return this.createErrorHover(linkInfo.linkText, linkInfo.range);
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
     * Extract a preview from note content
     * - Shows the first few lines (up to maxPreviewLines)
     * - Skips empty lines at the start
     * - Truncates very long lines
     */
    private extractPreview(content: string, filePath: string): string {
        const lines = content.split('\n');
        const previewLines: string[] = [];
        let linesAdded = 0;

        for (const line of lines) {
            // Skip empty lines at the start
            if (linesAdded === 0 && line.trim() === '') {
                continue;
            }

            // Stop if we've reached the max preview lines
            if (linesAdded >= this.maxPreviewLines) {
                break;
            }

            // Truncate long lines
            let displayLine = line;
            if (line.length > this.maxLineLength) {
                displayLine = line.substring(0, this.maxLineLength) + '…';
            }

            previewLines.push(displayLine);
            linesAdded++;
        }

        // If no content was found, show a message
        if (previewLines.length === 0) {
            return '_Empty note_';
        }

        return previewLines.join('\n');
    }

    /**
     * Extract metadata from note content and file stats
     */
    private async extractMetadata(
        content: string,
        filePath: string,
        fileStats: any
    ): Promise<{
        tags: string[];
        created: Date;
        modified: Date;
        size: number;
        frontmatter: any;
    }> {
        // Extract tags from frontmatter and inline
        const tags = extractAllTags(content);

        // Parse frontmatter for additional metadata
        const frontmatter = parseFrontmatter(content);

        return {
            tags,
            created: fileStats.birthtime,
            modified: fileStats.mtime,
            size: fileStats.size,
            frontmatter
        };
    }

    /**
     * Create a hover with note preview
     */
    private createPreviewHover(
        preview: string,
        targetPath: string,
        metadata: {
            tags: string[];
            created: Date;
            modified: Date;
            size: number;
            frontmatter: any;
        },
        range: vscode.Range
    ): vscode.Hover {
        const markdownContent = new vscode.MarkdownString();
        markdownContent.isTrusted = true;

        // Show the note name as header (clickable to open)
        const filename = path.basename(targetPath, path.extname(targetPath));
        const openCommand = `command:noted.openNote?${encodeURIComponent(JSON.stringify([targetPath]))}`;
        markdownContent.appendMarkdown(`### [📄 ${filename}](${openCommand})\n\n`);

        // Show metadata section
        markdownContent.appendMarkdown('**Metadata:**\n\n');

        // Tags
        if (metadata.tags.length > 0) {
            const tagBadges = metadata.tags.map(tag => `\`#${tag}\``).join(' ');
            markdownContent.appendMarkdown(`🏷️ **Tags:** ${tagBadges}\n\n`);
        }

        // Dates
        const createdDate = this.formatDate(metadata.created);
        const modifiedDate = this.formatDate(metadata.modified);
        markdownContent.appendMarkdown(`📅 **Created:** ${createdDate}\n\n`);
        markdownContent.appendMarkdown(`✏️ **Modified:** ${modifiedDate}\n\n`);

        // File size
        const sizeKB = (metadata.size / 1024).toFixed(1);
        markdownContent.appendMarkdown(`📊 **Size:** ${sizeKB} KB\n\n`);

        // Additional frontmatter metadata (excluding tags)
        const extraMetadata = Object.entries(metadata.frontmatter)
            .filter(([key, _]) => key !== 'tags')
            .slice(0, 3); // Limit to 3 extra fields to keep preview clean

        if (extraMetadata.length > 0) {
            extraMetadata.forEach(([key, value]) => {
                markdownContent.appendMarkdown(`📌 **${this.capitalizeFirstLetter(key)}:** ${value}\n\n`);
            });
        }

        // Show the preview content
        markdownContent.appendMarkdown('---\n\n');
        markdownContent.appendMarkdown('**Preview:**\n\n');
        markdownContent.appendMarkdown(preview);

        return new vscode.Hover(markdownContent, range);
    }

    /**
     * Create a hover when the link target is not found
     */
    private createNotFoundHover(linkText: string, range: vscode.Range): vscode.Hover {
        const markdownContent = new vscode.MarkdownString();
        markdownContent.isTrusted = true;

        markdownContent.appendMarkdown(`**Note not found**\n\n`);
        markdownContent.appendMarkdown(`The note \`${linkText}\` doesn't exist yet.\n\n`);

        // Add a command to create the note
        const createCommand = `command:noted.createNoteFromLink?${encodeURIComponent(JSON.stringify([linkText]))}`;
        markdownContent.appendMarkdown(`[Create note →](${createCommand})`);

        return new vscode.Hover(markdownContent, range);
    }

    /**
     * Create a hover when there's an error reading the file
     */
    private createErrorHover(linkText: string, range: vscode.Range): vscode.Hover {
        const markdownContent = new vscode.MarkdownString();
        markdownContent.isTrusted = true;

        markdownContent.appendMarkdown(`**Error**\n\n`);
        markdownContent.appendMarkdown(`Could not preview \`${linkText}\`.\n`);

        return new vscode.Hover(markdownContent, range);
    }

    /**
     * Format a date for display
     */
    private formatDate(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // Show relative time for recent dates
        if (diffDays === 0) {
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
            }
            return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        }

        // Show absolute date for older dates
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Capitalize the first letter of a string
     */
    private capitalizeFirstLetter(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
