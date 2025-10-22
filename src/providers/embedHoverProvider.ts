import * as vscode from 'vscode';
import * as path from 'path';
import { EmbedService } from '../services/embedService';

/**
 * Provides hover previews for embedded notes
 * Shows the content that will be embedded when hovering over ![[note]] or ![[note#section]]
 */
export class EmbedHoverProvider implements vscode.HoverProvider {
    private embedService: EmbedService;
    private maxPreviewLines: number = 15;
    private maxLineLength: number = 100;

    constructor(embedService: EmbedService) {
        this.embedService = embedService;
    }

    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | undefined> {
        // Check if cursor is over an embed
        const embed = this.embedService.getEmbedAtPosition(document, position);
        if (!embed) {
            return undefined;
        }

        // Resolve the embed to get the target file path
        const targetPath = await this.embedService.resolveEmbed(embed);
        if (!targetPath) {
            // Embed doesn't resolve to a file
            return this.createNotFoundHover(embed);
        }

        // Get the content to embed
        try {
            const content = await this.embedService.getEmbedContent(targetPath, embed.section);

            if (!content) {
                // Section not found
                return this.createSectionNotFoundHover(embed, targetPath);
            }

            // If section was requested, also show available sections
            const sections = embed.section
                ? await this.embedService.getSectionsFromNote(targetPath)
                : [];

            return this.createPreviewHover(embed, content, targetPath, sections);
        } catch (error) {
            console.error('[NOTED] Error reading file for embed preview:', targetPath, error);
            return this.createErrorHover(embed);
        }
    }

    /**
     * Create a hover with embed preview
     */
    private createPreviewHover(
        embed: { noteName: string; section?: string; range: vscode.Range },
        content: string,
        targetPath: string,
        availableSections: string[]
    ): vscode.Hover {
        const markdownContent = new vscode.MarkdownString();
        markdownContent.isTrusted = true;

        // Show the note name and section as header
        const filename = path.basename(targetPath, path.extname(targetPath));
        const sectionText = embed.section ? ` → #${embed.section}` : '';
        markdownContent.appendMarkdown(`**📄 Embedding: ${filename}${sectionText}**\n\n`);

        // Show the preview content
        const preview = this.extractPreview(content);
        markdownContent.appendMarkdown('---\n\n');
        markdownContent.appendMarkdown(preview);
        markdownContent.appendMarkdown('\n\n---\n');

        // If section was specified, show available sections
        if (embed.section && availableSections.length > 0) {
            markdownContent.appendMarkdown('\n\n**Available sections:**\n');
            const sectionList = availableSections.slice(0, 10).map(s => `- ${s}`).join('\n');
            markdownContent.appendMarkdown(sectionList);
            if (availableSections.length > 10) {
                markdownContent.appendMarkdown(`\n- ... and ${availableSections.length - 10} more`);
            }
        }

        // Add a clickable link to open the note
        const openCommand = `command:noted.openNote?${encodeURIComponent(JSON.stringify([targetPath]))}`;
        markdownContent.appendMarkdown(`\n\n[Open note →](${openCommand})`);

        return new vscode.Hover(markdownContent, embed.range);
    }

    /**
     * Extract a preview from embed content
     */
    private extractPreview(content: string): string {
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
                previewLines.push('_..._');
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
            return '_Empty content_';
        }

        return previewLines.join('\n');
    }

    /**
     * Create a hover when the embed target is not found
     */
    private createNotFoundHover(embed: { noteName: string; section?: string; range: vscode.Range }): vscode.Hover {
        const markdownContent = new vscode.MarkdownString();
        markdownContent.isTrusted = true;

        markdownContent.appendMarkdown(`**⚠️ Note not found**\n\n`);
        markdownContent.appendMarkdown(`The note \`${embed.noteName}\` doesn't exist yet.\n\n`);

        // Add a command to create the note
        const createCommand = `command:noted.createNoteFromLink?${encodeURIComponent(JSON.stringify([embed.noteName]))}`;
        markdownContent.appendMarkdown(`[Create note →](${createCommand})`);

        return new vscode.Hover(markdownContent, embed.range);
    }

    /**
     * Create a hover when the section is not found
     */
    private createSectionNotFoundHover(
        embed: { noteName: string; section?: string; range: vscode.Range },
        targetPath: string
    ): vscode.Hover {
        const markdownContent = new vscode.MarkdownString();
        markdownContent.isTrusted = true;

        const filename = path.basename(targetPath, path.extname(targetPath));
        markdownContent.appendMarkdown(`**⚠️ Section not found**\n\n`);
        markdownContent.appendMarkdown(
            `The section \`#${embed.section}\` was not found in \`${filename}\`.\n\n`
        );

        // Show available sections as a hint
        this.embedService.getSectionsFromNote(targetPath).then(sections => {
            if (sections.length > 0) {
                markdownContent.appendMarkdown('**Available sections:**\n');
                const sectionList = sections.slice(0, 10).map(s => `- ${s}`).join('\n');
                markdownContent.appendMarkdown(sectionList);
            }
        });

        // Add a clickable link to open the note
        const openCommand = `command:noted.openNote?${encodeURIComponent(JSON.stringify([targetPath]))}`;
        markdownContent.appendMarkdown(`\n\n[Open note →](${openCommand})`);

        return new vscode.Hover(markdownContent, embed.range);
    }

    /**
     * Create a hover when there's an error reading the file
     */
    private createErrorHover(embed: { noteName: string; section?: string; range: vscode.Range }): vscode.Hover {
        const markdownContent = new vscode.MarkdownString();
        markdownContent.isTrusted = true;

        markdownContent.appendMarkdown(`**❌ Error**\n\n`);
        markdownContent.appendMarkdown(`Could not preview embed for \`${embed.noteName}\`.\n`);

        return new vscode.Hover(markdownContent, embed.range);
    }
}
