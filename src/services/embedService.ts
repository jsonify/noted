import * as vscode from 'vscode';
import * as path from 'path';
import { readFile } from './fileSystemService';
import { LinkService } from './linkService';

/**
 * Regular expression to match embed syntax: ![[note-name]] or ![[note-name#section]]
 * Captures: [1] = note name, [2] = optional section (after #)
 */
export const EMBED_PATTERN = /!\[\[([^\]#|]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

/**
 * Represents an embed found in a note
 */
export interface NoteEmbed {
    /** The note name to embed */
    noteName: string;
    /** Optional section/heading to embed (text after #) */
    section?: string;
    /** Optional display text (when using ![[note#section|display]] syntax) */
    displayText?: string;
    /** The range in the document where the embed appears */
    range: vscode.Range;
    /** The resolved file path if found */
    targetPath?: string;
}

/**
 * Service for managing note embeds and section extraction
 */
export class EmbedService {
    private linkService: LinkService;

    constructor(linkService: LinkService) {
        this.linkService = linkService;
    }

    /**
     * Extract all embeds from a document
     */
    extractEmbeds(document: vscode.TextDocument): NoteEmbed[] {
        const embeds: NoteEmbed[] = [];
        const text = document.getText();

        // Reset regex state
        EMBED_PATTERN.lastIndex = 0;
        let match;

        while ((match = EMBED_PATTERN.exec(text)) !== null) {
            const noteName = match[1].trim();
            const section = match[2] ? match[2].trim() : undefined;
            const displayText = match[3] ? match[3].trim() : undefined;
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);

            embeds.push({
                noteName,
                section,
                displayText,
                range
            });
        }

        return embeds;
    }

    /**
     * Extract embeds from a file path
     */
    async extractEmbedsFromFile(filePath: string): Promise<NoteEmbed[]> {
        try {
            const content = await readFile(filePath);
            const lines = content.split('\n');
            const embeds: NoteEmbed[] = [];

            lines.forEach((line, lineIndex) => {
                EMBED_PATTERN.lastIndex = 0;
                let match;

                while ((match = EMBED_PATTERN.exec(line)) !== null) {
                    const noteName = match[1].trim();
                    const section = match[2] ? match[2].trim() : undefined;
                    const displayText = match[3] ? match[3].trim() : undefined;
                    const startCol = match.index;
                    const endCol = match.index + match[0].length;

                    embeds.push({
                        noteName,
                        section,
                        displayText,
                        range: new vscode.Range(
                            new vscode.Position(lineIndex, startCol),
                            new vscode.Position(lineIndex, endCol)
                        )
                    });
                }
            });

            return embeds;
        } catch (error) {
            console.error('[NOTED] Error extracting embeds from file:', filePath, error);
            return [];
        }
    }

    /**
     * Resolve an embed to get the target file path
     */
    async resolveEmbed(embed: NoteEmbed): Promise<string | undefined> {
        return await this.linkService.resolveLink(embed.noteName);
    }

    /**
     * Get the content to embed from a note
     * If section is specified, extracts only that section
     * If no section, returns the entire note content
     */
    async getEmbedContent(filePath: string, section?: string): Promise<string | undefined> {
        try {
            const content = await readFile(filePath);

            if (!section) {
                // Return entire note content
                return content;
            }

            // Extract specific section
            return this.extractSection(content, section);
        } catch (error) {
            console.error('[NOTED] Error reading embed content:', filePath, error);
            return undefined;
        }
    }

    /**
     * Extract content from a specific section/heading
     * Supports both markdown (# heading) and text file (HEADING:) formats
     */
    private extractSection(content: string, sectionName: string): string | undefined {
        const lines = content.split('\n');
        const normalizedSection = sectionName.toLowerCase().trim();

        let sectionStartIndex = -1;
        let sectionLevel = 0;
        let inSection = false;
        const sectionLines: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();

            // Check for markdown heading: # Heading, ## Heading, etc.
            const mdHeadingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
            if (mdHeadingMatch) {
                const level = mdHeadingMatch[1].length;
                const headingText = mdHeadingMatch[2].trim().toLowerCase();

                if (!inSection && headingText === normalizedSection) {
                    // Found the target section
                    inSection = true;
                    sectionStartIndex = i;
                    sectionLevel = level;
                    // Include the heading itself
                    sectionLines.push(line);
                    continue;
                } else if (inSection && level <= sectionLevel) {
                    // Found a heading at the same or higher level - end of section
                    break;
                }
            }

            // Check for text-style heading: HEADING: or Heading:
            const textHeadingMatch = trimmedLine.match(/^([A-Za-z0-9\s]+):$/);
            if (textHeadingMatch) {
                const headingText = textHeadingMatch[1].trim().toLowerCase();

                if (!inSection && headingText === normalizedSection) {
                    // Found the target section
                    inSection = true;
                    sectionStartIndex = i;
                    sectionLines.push(line);
                    continue;
                } else if (inSection && textHeadingMatch) {
                    // Found another text-style heading - end of section
                    break;
                }
            }

            // If we're in the target section, add the line
            if (inSection) {
                sectionLines.push(line);
            }
        }

        if (sectionLines.length > 0) {
            return sectionLines.join('\n');
        }

        return undefined;
    }

    /**
     * Get all sections/headings from a note
     * Useful for autocomplete or section selection
     */
    async getSectionsFromNote(filePath: string): Promise<string[]> {
        try {
            const content = await readFile(filePath);
            const sections: string[] = [];
            const lines = content.split('\n');

            for (const line of lines) {
                const trimmedLine = line.trim();

                // Check for markdown heading
                const mdHeadingMatch = trimmedLine.match(/^#{1,6}\s+(.+)$/);
                if (mdHeadingMatch) {
                    sections.push(mdHeadingMatch[1].trim());
                    continue;
                }

                // Check for text-style heading
                const textHeadingMatch = trimmedLine.match(/^([A-Za-z0-9\s]+):$/);
                if (textHeadingMatch) {
                    sections.push(textHeadingMatch[1].trim());
                }
            }

            return sections;
        } catch (error) {
            console.error('[NOTED] Error getting sections from note:', filePath, error);
            return [];
        }
    }

    /**
     * Check if an embed at a position exists in the document
     */
    getEmbedAtPosition(
        document: vscode.TextDocument,
        position: vscode.Position
    ): NoteEmbed | undefined {
        const line = document.lineAt(position.line);
        const text = line.text;

        // Reset regex state
        EMBED_PATTERN.lastIndex = 0;
        let match;

        while ((match = EMBED_PATTERN.exec(text)) !== null) {
            const startCol = match.index;
            const endCol = match.index + match[0].length;

            // Check if cursor is within this embed
            if (position.character >= startCol && position.character <= endCol) {
                const noteName = match[1].trim();
                const section = match[2] ? match[2].trim() : undefined;
                const displayText = match[3] ? match[3].trim() : undefined;
                const range = new vscode.Range(
                    position.line,
                    startCol,
                    position.line,
                    endCol
                );
                return { noteName, section, displayText, range };
            }
        }

        return undefined;
    }
}
