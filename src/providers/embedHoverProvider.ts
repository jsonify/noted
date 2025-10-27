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
        const targetPath = await this.embedService.resolveEmbed(embed, document.uri.fsPath);
        if (!targetPath) {
            // Embed doesn't resolve to a file
            return this.createNotFoundHover(embed);
        }

        // Handle image embeds
        if (embed.type === 'image') {
            return this.createImagePreviewHover(embed, targetPath);
        }

        // Handle diagram embeds
        if (embed.type === 'diagram') {
            return this.createDiagramPreviewHover(embed, targetPath);
        }

        // Handle note embeds
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
     * Create a hover with image preview
     */
    private async createImagePreviewHover(
        embed: { noteName: string; section?: string; displayText?: string; range: vscode.Range },
        targetPath: string
    ): Promise<vscode.Hover> {
        const markdownContent = new vscode.MarkdownString();
        markdownContent.isTrusted = true;
        markdownContent.supportHtml = true;

        // Show the image name as header
        const filename = path.basename(targetPath);
        markdownContent.appendMarkdown(`**🖼️ Image: ${filename}**\n\n`);

        // Get image metadata
        const metadata = await this.embedService.getImageMetadata(targetPath);

        // Display the image using file:// protocol
        // VS Code will render the image inline in the hover
        const imageUri = vscode.Uri.file(targetPath);
        markdownContent.appendMarkdown(`![${filename}](${imageUri.toString()})\n\n`);

        // Show metadata
        if (metadata) {
            markdownContent.appendMarkdown('---\n\n');
            markdownContent.appendMarkdown('**File info:**\n');
            markdownContent.appendMarkdown(`- Path: \`${targetPath}\`\n`);
            const sizeKB = (metadata.size / 1024).toFixed(2);
            markdownContent.appendMarkdown(`- Size: ${sizeKB} KB\n`);
            if (metadata.width && metadata.height) {
                markdownContent.appendMarkdown(`- Dimensions: ${metadata.width} × ${metadata.height}\n`);
            }
        }

        return new vscode.Hover(markdownContent, embed.range);
    }

    /**
     * Create a hover with diagram preview
     */
    private async createDiagramPreviewHover(
        embed: { noteName: string; section?: string; displayText?: string; range: vscode.Range },
        targetPath: string
    ): Promise<vscode.Hover> {
        const markdownContent = new vscode.MarkdownString();
        markdownContent.isTrusted = true;
        markdownContent.supportHtml = true;

        // Show the diagram name as header
        const filename = path.basename(targetPath);
        const lowerPath = targetPath.toLowerCase();

        // Determine diagram type
        let diagramType = '📊 Diagram';
        if (lowerPath.endsWith('.drawio')) {
            diagramType = '📊 Draw.io Diagram';
        } else if (lowerPath.includes('.excalidraw')) {
            diagramType = '📊 Excalidraw Diagram';
        }

        markdownContent.appendMarkdown(`**${diagramType}: ${filename}**\n\n`);

        // Check if it's an exported image format (.svg, .png)
        const isImageFormat = lowerPath.endsWith('.svg') || lowerPath.endsWith('.png');

        if (isImageFormat) {
            // Display the diagram image using file:// protocol
            const imageUri = vscode.Uri.file(targetPath);
            markdownContent.appendMarkdown(`![${filename}](${imageUri.toString()})\n\n`);
        } else {
            // Raw diagram file - show instructions
            markdownContent.appendMarkdown('_This diagram file can be opened in its editor._\n\n');
        }

        // Get file metadata
        const metadata = await this.embedService.getImageMetadata(targetPath);

        // Show metadata
        markdownContent.appendMarkdown('---\n\n');
        markdownContent.appendMarkdown('**File info:**\n');
        markdownContent.appendMarkdown(`- Path: \`${targetPath}\`\n`);
        if (metadata) {
            const sizeKB = (metadata.size / 1024).toFixed(2);
            markdownContent.appendMarkdown(`- Size: ${sizeKB} KB\n`);
        }

        if (!isImageFormat) {
            const editorExtension = lowerPath.endsWith('.drawio')
                ? 'Draw.io Integration (hediet.vscode-drawio)'
                : 'Excalidraw (pomdtr.excalidraw-editor)';
            markdownContent.appendMarkdown(`- Editor: ${editorExtension}\n`);
        }

        // Add a clickable link to open the diagram
        const openCommand = `command:vscode.open?${encodeURIComponent(JSON.stringify(vscode.Uri.file(targetPath)))}`;
        markdownContent.appendMarkdown(`\n\n[Open diagram →](${openCommand})`);

        return new vscode.Hover(markdownContent, embed.range);
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
