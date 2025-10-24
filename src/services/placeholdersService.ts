import * as path from 'path';
import { LinkService, NoteLink } from './linkService';
import { readFile } from './fileSystemService';

/**
 * Represents a placeholder link (link to a note that doesn't exist)
 */
export interface PlaceholderLink {
    /** The link text (target note name) */
    linkText: string;
    /** Display text if using [[target|display]] syntax */
    displayText?: string;
    /** File path where this placeholder appears */
    sourceFile: string;
    /** Line number where the link appears */
    line: number;
    /** Context snippet showing the line with the link */
    context: string;
    /** All source files that reference this placeholder */
    sources: Array<{
        file: string;
        line: number;
        context: string;
        displayText?: string;
    }>;
}

/**
 * Service for detecting and managing placeholder links (broken/dangling references)
 */
export class PlaceholdersService {
    private linkService: LinkService;

    constructor(linkService: LinkService) {
        this.linkService = linkService;
    }

    /**
     * Get all placeholder links grouped by target
     * Returns a map of linkText -> PlaceholderLink with all sources
     */
    async getAllPlaceholders(): Promise<Map<string, PlaceholderLink>> {
        const allNotes = await this.linkService.getAllNotes();
        const placeholders = new Map<string, PlaceholderLink>();

        for (const sourceFile of allNotes) {
            const links = await this.linkService.extractLinksFromFile(sourceFile);

            for (const link of links) {
                // Check if this link can be resolved
                const targetPath = await this.linkService.resolveLink(link.linkText);

                if (!targetPath) {
                    // This is a placeholder (broken link)
                    const content = await readFile(sourceFile);
                    const lines = content.split('\n');
                    const lineNumber = link.range.start.line;
                    const context = lines[lineNumber]?.trim() || '';

                    // Group by link text
                    if (!placeholders.has(link.linkText)) {
                        placeholders.set(link.linkText, {
                            linkText: link.linkText,
                            displayText: link.displayText,
                            sourceFile,
                            line: lineNumber,
                            context,
                            sources: []
                        });
                    }

                    // Add this source to the placeholder
                    const placeholder = placeholders.get(link.linkText)!;
                    placeholder.sources.push({
                        file: sourceFile,
                        line: lineNumber,
                        context,
                        displayText: link.displayText
                    });
                }
            }
        }

        return placeholders;
    }

    /**
     * Get all placeholders as a flat array (one entry per source)
     */
    async getAllPlaceholdersFlat(): Promise<PlaceholderLink[]> {
        const allNotes = await this.linkService.getAllNotes();
        const placeholders: PlaceholderLink[] = [];

        for (const sourceFile of allNotes) {
            const links = await this.linkService.extractLinksFromFile(sourceFile);

            for (const link of links) {
                // Check if this link can be resolved
                const targetPath = await this.linkService.resolveLink(link.linkText);

                if (!targetPath) {
                    // This is a placeholder (broken link)
                    const content = await readFile(sourceFile);
                    const lines = content.split('\n');
                    const lineNumber = link.range.start.line;
                    const context = lines[lineNumber]?.trim() || '';

                    placeholders.push({
                        linkText: link.linkText,
                        displayText: link.displayText,
                        sourceFile,
                        line: lineNumber,
                        context,
                        sources: [{
                            file: sourceFile,
                            line: lineNumber,
                            context,
                            displayText: link.displayText
                        }]
                    });
                }
            }
        }

        return placeholders;
    }

    /**
     * Get placeholders from a specific file
     */
    async getPlaceholdersInFile(filePath: string): Promise<PlaceholderLink[]> {
        const links = await this.linkService.extractLinksFromFile(filePath);
        const placeholders: PlaceholderLink[] = [];

        const content = await readFile(filePath);
        const lines = content.split('\n');

        for (const link of links) {
            const targetPath = await this.linkService.resolveLink(link.linkText);

            if (!targetPath) {
                const lineNumber = link.range.start.line;
                const context = lines[lineNumber]?.trim() || '';

                placeholders.push({
                    linkText: link.linkText,
                    displayText: link.displayText,
                    sourceFile: filePath,
                    line: lineNumber,
                    context,
                    sources: [{
                        file: filePath,
                        line: lineNumber,
                        context,
                        displayText: link.displayText
                    }]
                });
            }
        }

        return placeholders;
    }

    /**
     * Get all unique placeholder targets (note names that don't exist)
     */
    async getPlaceholderTargets(): Promise<string[]> {
        const placeholders = await this.getAllPlaceholders();
        return Array.from(placeholders.keys());
    }

    /**
     * Get count of placeholders by target
     */
    async getPlaceholderCounts(): Promise<Map<string, number>> {
        const placeholders = await this.getAllPlaceholders();
        const counts = new Map<string, number>();

        for (const [linkText, placeholder] of placeholders) {
            counts.set(linkText, placeholder.sources.length);
        }

        return counts;
    }

    /**
     * Check if a specific link text is a placeholder
     */
    async isPlaceholder(linkText: string): Promise<boolean> {
        const targetPath = await this.linkService.resolveLink(linkText);
        return !targetPath;
    }
}
