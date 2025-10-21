import * as vscode from 'vscode';
import * as path from 'path';
import { readFile, pathExists, readDirectoryWithTypes } from './fileSystemService';
import { SUPPORTED_EXTENSIONS } from '../constants';

/**
 * Regular expression to match wiki-style links: [[note-name]]
 */
export const LINK_PATTERN = /\[\[([^\]]+)\]\]/g;

/**
 * Represents a link found in a note
 */
export interface NoteLink {
    /** The text between [[ and ]] */
    linkText: string;
    /** The range in the document where the link appears */
    range: vscode.Range;
    /** The resolved file path if found */
    targetPath?: string;
}

/**
 * Represents a backlink (a note that links to another note)
 */
export interface Backlink {
    /** The file path of the note containing the link */
    sourceFile: string;
    /** The line number where the link appears */
    line: number;
    /** Context around the link */
    context: string;
}

/**
 * Service for managing wiki-style note links and backlinks
 */
export class LinkService {
    private notesPath: string;
    /** Cache: target file path -> array of backlinks */
    private backlinksCache: Map<string, Backlink[]> = new Map();
    /** Cache: source file path -> array of outgoing links */
    private linksCache: Map<string, NoteLink[]> = new Map();

    constructor(notesPath: string) {
        this.notesPath = notesPath;
    }

    /**
     * Extract all wiki-style links from a document
     */
    extractLinks(document: vscode.TextDocument): NoteLink[] {
        const links: NoteLink[] = [];
        const text = document.getText();

        // Reset regex state
        LINK_PATTERN.lastIndex = 0;
        let match;

        while ((match = LINK_PATTERN.exec(text)) !== null) {
            const linkText = match[1].trim();
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);

            links.push({
                linkText,
                range
            });
        }

        return links;
    }

    /**
     * Extract links from a file path
     */
    async extractLinksFromFile(filePath: string): Promise<NoteLink[]> {
        try {
            const content = await readFile(filePath);
            const lines = content.split('\n');
            const links: NoteLink[] = [];

            lines.forEach((line, lineIndex) => {
                LINK_PATTERN.lastIndex = 0;
                let match;

                while ((match = LINK_PATTERN.exec(line)) !== null) {
                    const linkText = match[1].trim();
                    const startCol = match.index;
                    const endCol = match.index + match[0].length;

                    links.push({
                        linkText,
                        range: new vscode.Range(
                            new vscode.Position(lineIndex, startCol),
                            new vscode.Position(lineIndex, endCol)
                        )
                    });
                }
            });

            return links;
        } catch (error) {
            console.error('[NOTED] Error extracting links from file:', filePath, error);
            return [];
        }
    }

    /**
     * Resolve a link text to a file path
     * Searches for files matching the link text in the notes directory
     */
    async resolveLink(linkText: string): Promise<string | undefined> {
        const normalizedLinkText = linkText.toLowerCase().trim();

        // Try exact filename match first (with extensions)
        for (const ext of SUPPORTED_EXTENSIONS) {
            const exactPath = await this.findNoteByName(`${linkText}${ext}`);
            if (exactPath) {
                return exactPath;
            }
        }

        // Search for partial matches
        const allNotes = await this.getAllNotes();

        // Find by filename without extension
        for (const notePath of allNotes) {
            const basename = path.basename(notePath, path.extname(notePath));
            if (basename.toLowerCase() === normalizedLinkText) {
                return notePath;
            }
        }

        // Find by fuzzy match (contains the link text)
        for (const notePath of allNotes) {
            const basename = path.basename(notePath, path.extname(notePath));
            if (basename.toLowerCase().includes(normalizedLinkText)) {
                return notePath;
            }
        }

        return undefined;
    }

    /**
     * Find a note by its exact filename
     */
    private async findNoteByName(filename: string): Promise<string | undefined> {
        const allNotes = await this.getAllNotes();
        return allNotes.find(notePath => path.basename(notePath) === filename);
    }

    /**
     * Get all note files in the notes directory
     */
    async getAllNotes(): Promise<string[]> {
        const notes: string[] = [];

        async function findNotes(dir: string) {
            try {
                if (!(await pathExists(dir))) {
                    return;
                }

                const entries = await readDirectoryWithTypes(dir);
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        await findNotes(fullPath);
                    } else if (SUPPORTED_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
                        notes.push(fullPath);
                    }
                }
            } catch (error) {
                console.error('[NOTED] Error reading directory:', dir, error);
            }
        }

        await findNotes(this.notesPath);
        return notes;
    }

    /**
     * Build an index of all backlinks in the notes directory
     */
    async buildBacklinksIndex(): Promise<void> {
        this.backlinksCache.clear();
        this.linksCache.clear();

        const allNotes = await this.getAllNotes();

        for (const sourceFile of allNotes) {
            const links = await this.extractLinksFromFile(sourceFile);
            this.linksCache.set(sourceFile, links);

            for (const link of links) {
                const targetPath = await this.resolveLink(link.linkText);
                if (targetPath) {
                    link.targetPath = targetPath;

                    // Add to backlinks cache
                    if (!this.backlinksCache.has(targetPath)) {
                        this.backlinksCache.set(targetPath, []);
                    }

                    const content = await readFile(sourceFile);
                    const lines = content.split('\n');
                    const lineNumber = link.range.start.line;
                    const context = lines[lineNumber]?.trim() || '';

                    this.backlinksCache.get(targetPath)!.push({
                        sourceFile,
                        line: lineNumber,
                        context
                    });
                }
            }
        }

        console.log('[NOTED] Backlinks index built:', this.backlinksCache.size, 'target notes with backlinks');
    }

    /**
     * Get all backlinks for a specific note
     */
    getBacklinks(filePath: string): Backlink[] {
        return this.backlinksCache.get(filePath) || [];
    }

    /**
     * Get all outgoing links from a note
     */
    getOutgoingLinks(filePath: string): NoteLink[] {
        return this.linksCache.get(filePath) || [];
    }

    /**
     * Get notes that are not linked from anywhere (orphan notes)
     */
    async getOrphanNotes(): Promise<string[]> {
        const allNotes = await this.getAllNotes();
        const linkedNotes = new Set<string>();

        // Collect all linked notes
        for (const links of this.linksCache.values()) {
            for (const link of links) {
                if (link.targetPath) {
                    linkedNotes.add(link.targetPath);
                }
            }
        }

        // Find notes without incoming links
        return allNotes.filter(note => !linkedNotes.has(note));
    }
}
