import * as vscode from 'vscode';
import * as path from 'path';
import { EmbedService, NoteEmbed } from '../services/embedService';

/**
 * Provides inline decorations for embedded notes
 * Renders the content of ![[note]] and ![[note#section]] embeds
 */
export class EmbedDecoratorProvider {
    private embedService: EmbedService;
    private decorationType: vscode.TextEditorDecorationType;
    private maxEmbedLines: number = 20;
    private maxLineLength: number = 120;

    constructor(embedService: EmbedService) {
        this.embedService = embedService;

        // Create decoration type for embedded content
        this.decorationType = vscode.window.createTextEditorDecorationType({
            before: {
                margin: '0 0 0.5em 0',
            },
            isWholeLine: false,
        });
    }

    /**
     * Update decorations for the active editor
     */
    async updateDecorations(editor: vscode.TextEditor | undefined): Promise<void> {
        if (!editor) {
            return;
        }

        const document = editor.document;

        // Only process text and markdown files
        if (document.languageId !== 'plaintext' && document.languageId !== 'markdown') {
            return;
        }

        // Extract all embeds from the document
        const embeds = this.embedService.extractEmbeds(document);

        if (embeds.length === 0) {
            editor.setDecorations(this.decorationType, []);
            // Clear embed sources cache for this document
            this.embedService.clearEmbedSourcesCache(document.uri.toString());
            return;
        }

        // Update embed sources cache for transclusion tracking
        await this.embedService.updateEmbedSourcesCache(document.uri.toString(), embeds);

        // Create decorations for each embed
        const decorations: vscode.DecorationOptions[] = [];

        for (const embed of embeds) {
            const decoration = await this.createEmbedDecoration(embed, document.uri.fsPath);
            if (decoration) {
                decorations.push(decoration);
            }
        }

        editor.setDecorations(this.decorationType, decorations);
    }

    /**
     * Refresh decorations for a specific document (by URI)
     * Used when a source file changes and we need to update all documents that embed it
     */
    async refreshDecorationsForDocument(documentUri: vscode.Uri): Promise<void> {
        // Find the editor for this document
        const editor = vscode.window.visibleTextEditors.find(
            e => e.document.uri.toString() === documentUri.toString()
        );

        if (editor) {
            await this.updateDecorations(editor);
        }
    }

    /**
     * Create a decoration for a single embed
     */
    private async createEmbedDecoration(
        embed: NoteEmbed,
        documentPath?: string
    ): Promise<vscode.DecorationOptions | undefined> {
        try {
            // Resolve the embed to get the target file path
            const targetPath = await this.embedService.resolveEmbed(embed, documentPath);

            if (!targetPath) {
                // File not found - show error decoration
                return this.createNotFoundDecoration(embed);
            }

            // Handle image embeds
            if (embed.type === 'image') {
                return this.createImageDecoration(embed, targetPath);
            }

            // Handle note embeds
            // Get the content to embed
            const content = await this.embedService.getEmbedContent(targetPath, embed.section);

            if (!content) {
                // Section not found or empty content
                return this.createSectionNotFoundDecoration(embed);
            }

            // Create the decoration with embedded content
            return this.createContentDecoration(embed, content, targetPath);
        } catch (error) {
            console.error('[NOTED] Error creating embed decoration:', error);
            return this.createErrorDecoration(embed);
        }
    }

    /**
     * Create a decoration for an image embed
     */
    private async createImageDecoration(
        embed: NoteEmbed,
        targetPath: string
    ): Promise<vscode.DecorationOptions> {
        const filename = path.basename(targetPath);
        const metadata = await this.embedService.getImageMetadata(targetPath);

        // Create a markdown string for the decoration hover
        const markdownContent = new vscode.MarkdownString();
        markdownContent.isTrusted = true;
        markdownContent.supportHtml = true;

        // Show image in hover
        const imageUri = vscode.Uri.file(targetPath);
        markdownContent.appendMarkdown(`**🖼️ Image: ${filename}**\n\n`);
        markdownContent.appendMarkdown(`![${filename}](${imageUri.toString()})\n\n`);

        // Show metadata
        if (metadata) {
            markdownContent.appendMarkdown(`---\n\n`);
            const sizeKB = (metadata.size / 1024).toFixed(2);
            markdownContent.appendMarkdown(`Size: ${sizeKB} KB`);
            if (metadata.width && metadata.height) {
                markdownContent.appendMarkdown(` | ${metadata.width} × ${metadata.height}`);
            }
        }

        return {
            range: embed.range,
            hoverMessage: markdownContent,
            renderOptions: {
                after: {
                    contentText: ` 🖼️`,
                    color: new vscode.ThemeColor('textLink.foreground'),
                    margin: '0 0 0 0.5em',
                }
            }
        };
    }

    /**
     * Create a decoration showing embedded content
     */
    private createContentDecoration(
        embed: NoteEmbed,
        content: string,
        targetPath: string
    ): vscode.DecorationOptions {
        const preview = this.formatEmbedContent(content);
        const filename = path.basename(targetPath, path.extname(targetPath));
        const sectionText = embed.section ? ` #${embed.section}` : '';

        // Create a markdown string for the decoration
        const markdownContent = new vscode.MarkdownString();
        markdownContent.isTrusted = true;
        markdownContent.supportHtml = true;

        // Add header
        markdownContent.appendMarkdown(`\n\n---\n\n`);
        markdownContent.appendMarkdown(`**📄 Embedded: ${filename}${sectionText}**\n\n`);

        // Add content preview
        markdownContent.appendCodeblock(preview, 'markdown');

        markdownContent.appendMarkdown(`\n---\n\n`);

        return {
            range: embed.range,
            hoverMessage: markdownContent,
            renderOptions: {
                after: {
                    contentText: ` 📄`,
                    color: new vscode.ThemeColor('textLink.foreground'),
                    margin: '0 0 0 0.5em',
                }
            }
        };
    }

    /**
     * Format embedded content for display
     * Limits lines and truncates long lines
     */
    private formatEmbedContent(content: string): string {
        const lines = content.split('\n');
        const previewLines: string[] = [];
        let linesAdded = 0;

        for (const line of lines) {
            // Skip empty lines at the start
            if (linesAdded === 0 && line.trim() === '') {
                continue;
            }

            // Stop if we've reached the max embed lines
            if (linesAdded >= this.maxEmbedLines) {
                previewLines.push('...');
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
            return '_Empty_';
        }

        return previewLines.join('\n');
    }

    /**
     * Create a decoration for a not-found embed
     */
    private createNotFoundDecoration(embed: NoteEmbed): vscode.DecorationOptions {
        const markdownContent = new vscode.MarkdownString();
        markdownContent.isTrusted = true;

        markdownContent.appendMarkdown(`**⚠️ Note not found**\n\n`);
        markdownContent.appendMarkdown(`The note \`${embed.noteName}\` doesn't exist.\n`);

        return {
            range: embed.range,
            hoverMessage: markdownContent,
            renderOptions: {
                after: {
                    contentText: ` ⚠️`,
                    color: new vscode.ThemeColor('errorForeground'),
                    margin: '0 0 0 0.5em',
                }
            }
        };
    }

    /**
     * Create a decoration for a section not found
     */
    private createSectionNotFoundDecoration(embed: NoteEmbed): vscode.DecorationOptions {
        const markdownContent = new vscode.MarkdownString();
        markdownContent.isTrusted = true;

        markdownContent.appendMarkdown(`**⚠️ Section not found**\n\n`);
        markdownContent.appendMarkdown(
            `The section \`#${embed.section}\` was not found in \`${embed.noteName}\`.\n`
        );

        return {
            range: embed.range,
            hoverMessage: markdownContent,
            renderOptions: {
                after: {
                    contentText: ` ⚠️`,
                    color: new vscode.ThemeColor('errorForeground'),
                    margin: '0 0 0 0.5em',
                }
            }
        };
    }

    /**
     * Create a decoration for an error
     */
    private createErrorDecoration(embed: NoteEmbed): vscode.DecorationOptions {
        const markdownContent = new vscode.MarkdownString();
        markdownContent.isTrusted = true;

        markdownContent.appendMarkdown(`**❌ Error**\n\n`);
        markdownContent.appendMarkdown(`Could not load embed for \`${embed.noteName}\`.\n`);

        return {
            range: embed.range,
            hoverMessage: markdownContent,
            renderOptions: {
                after: {
                    contentText: ` ❌`,
                    color: new vscode.ThemeColor('errorForeground'),
                    margin: '0 0 0 0.5em',
                }
            }
        };
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this.decorationType.dispose();
    }
}
