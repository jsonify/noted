import * as path from 'path';
import { LinkService, Backlink, NoteLink } from './linkService';
import { readFile } from './fileSystemService';

/**
 * Represents a single connection between notes
 */
export interface Connection {
    /** Type of connection */
    type: 'incoming' | 'outgoing';
    /** Path to the note being connected */
    targetPath: string;
    /** Path to the note containing the link (for incoming, this is the source; for outgoing, this is current note) */
    sourcePath: string;
    /** Line number where the connection appears */
    lineNumber: number;
    /** Context around the connection (the line containing the link) */
    context: string;
    /** Optional display text from [[link|Display Text]] syntax */
    displayText?: string;
    /** The actual link text from [[linkText]] */
    linkText: string;
    /** Extended context (lines before and after) */
    extendedContext?: string[];
}

/**
 * Connection data for a specific note
 */
export interface ConnectionData {
    /** Path to the note being analyzed */
    notePath: string;
    /** Incoming connections (backlinks - notes linking to this note) */
    incoming: Connection[];
    /** Outgoing connections (links from this note to others) */
    outgoing: Connection[];
    /** Total connection count */
    totalCount: number;
    /** Connection strength (how many unique notes are connected) */
    uniqueConnections: number;
}

/**
 * Service for managing note connections for the connections panel
 * Builds on LinkService to provide richer connection data
 */
export class ConnectionsService {
    private linkService: LinkService;
    private contextLinesBefore: number = 1;
    private contextLinesAfter: number = 1;

    constructor(linkService: LinkService) {
        this.linkService = linkService;
    }

    /**
     * Get all connections for a specific note
     * @param filePath Path to the note file
     * @returns Complete connection data for the note
     */
    async getConnectionsForNote(filePath: string): Promise<ConnectionData> {
        // Get backlinks (incoming connections)
        const backlinks = this.linkService.getBacklinks(filePath);
        const incoming = await this.processBacklinks(backlinks, filePath);

        // Get outgoing links
        const outgoingLinks = this.linkService.getOutgoingLinks(filePath);
        const outgoing = await this.processOutgoingLinks(outgoingLinks, filePath);

        // Calculate unique connections
        const uniqueNotes = new Set<string>();
        incoming.forEach(conn => uniqueNotes.add(conn.sourcePath));
        outgoing.forEach(conn => {
            if (conn.targetPath) {
                uniqueNotes.add(conn.targetPath);
            }
        });

        return {
            notePath: filePath,
            incoming,
            outgoing,
            totalCount: incoming.length + outgoing.length,
            uniqueConnections: uniqueNotes.size
        };
    }

    /**
     * Process backlinks into Connection objects
     * Optimized to read each source file only once
     */
    private async processBacklinks(backlinks: Backlink[], targetPath: string): Promise<Connection[]> {
        const connections: Connection[] = [];

        // Group backlinks by source file to minimize file reads
        const backlinksByFile = new Map<string, Backlink[]>();
        for (const backlink of backlinks) {
            if (!backlinksByFile.has(backlink.sourceFile)) {
                backlinksByFile.set(backlink.sourceFile, []);
            }
            backlinksByFile.get(backlink.sourceFile)!.push(backlink);
        }

        // Extract link text from target path (same for all backlinks)
        const linkText = path.basename(targetPath, path.extname(targetPath));

        // Process each source file once
        for (const [sourceFile, fileBacklinks] of backlinksByFile.entries()) {
            try {
                // Read the source file once
                const content = await readFile(sourceFile);
                const lines = content.split('\n');

                // Process all backlinks from this file
                for (const backlink of fileBacklinks) {
                    const extendedContext = this.extractContextFromLines(
                        lines,
                        backlink.line,
                        this.contextLinesBefore,
                        this.contextLinesAfter
                    );

                    connections.push({
                        type: 'incoming',
                        targetPath: targetPath,
                        sourcePath: backlink.sourceFile,
                        lineNumber: backlink.line,
                        context: backlink.context,
                        displayText: backlink.displayText,
                        linkText: linkText,
                        extendedContext
                    });
                }
            } catch (error) {
                console.error('[NOTED] Error processing backlinks from file:', sourceFile, error);
                // Add backlinks without extended context
                for (const backlink of fileBacklinks) {
                    connections.push({
                        type: 'incoming',
                        targetPath: targetPath,
                        sourcePath: backlink.sourceFile,
                        lineNumber: backlink.line,
                        context: backlink.context,
                        displayText: backlink.displayText,
                        linkText: linkText,
                        extendedContext: []
                    });
                }
            }
        }

        // Sort by source file name
        connections.sort((a, b) => {
            const aName = path.basename(a.sourcePath);
            const bName = path.basename(b.sourcePath);
            return aName.localeCompare(bName);
        });

        return connections;
    }

    /**
     * Process outgoing links into Connection objects
     * Optimized to read the source file only once
     */
    private async processOutgoingLinks(links: NoteLink[], sourcePath: string): Promise<Connection[]> {
        const connections: Connection[] = [];

        // Filter out links without target paths
        const validLinks = links.filter(link => link.targetPath);
        if (validLinks.length === 0) {
            return connections;
        }

        try {
            // Read the source file once for all outgoing links
            const content = await readFile(sourcePath);
            const lines = content.split('\n');

            // Process all links using the in-memory content
            for (const link of validLinks) {
                const lineNumber = link.range.start.line;
                const context = lines[lineNumber]?.trim() || link.linkText;
                const extendedContext = this.extractContextFromLines(
                    lines,
                    lineNumber,
                    this.contextLinesBefore,
                    this.contextLinesAfter
                );

                connections.push({
                    type: 'outgoing',
                    targetPath: link.targetPath!,
                    sourcePath: sourcePath,
                    lineNumber: lineNumber,
                    context: context,
                    displayText: link.displayText,
                    linkText: link.linkText,
                    extendedContext
                });
            }
        } catch (error) {
            console.error('[NOTED] Error processing outgoing links from file:', sourcePath, error);
            // Add links without extended context
            for (const link of validLinks) {
                connections.push({
                    type: 'outgoing',
                    targetPath: link.targetPath!,
                    sourcePath: sourcePath,
                    lineNumber: link.range.start.line,
                    context: link.linkText,
                    displayText: link.displayText,
                    linkText: link.linkText,
                    extendedContext: []
                });
            }
        }

        // Sort by target file name
        connections.sort((a, b) => {
            const aName = path.basename(a.targetPath);
            const bName = path.basename(b.targetPath);
            return aName.localeCompare(bName);
        });

        return connections;
    }

    /**
     * Extract context lines from already-loaded file content
     * This helper avoids reading the same file multiple times
     */
    private extractContextFromLines(
        lines: string[],
        lineNumber: number,
        linesBefore: number,
        linesAfter: number
    ): string[] {
        const startLine = Math.max(0, lineNumber - linesBefore);
        const endLine = Math.min(lines.length - 1, lineNumber + linesAfter);

        const contextLines: string[] = [];
        for (let i = startLine; i <= endLine; i++) {
            contextLines.push(lines[i]);
        }

        return contextLines;
    }

    /**
     * Get connection statistics for a note
     */
    async getConnectionStats(filePath: string): Promise<{
        incomingCount: number;
        outgoingCount: number;
        totalCount: number;
        uniqueConnections: number;
    }> {
        const data = await this.getConnectionsForNote(filePath);
        return {
            incomingCount: data.incoming.length,
            outgoingCount: data.outgoing.length,
            totalCount: data.totalCount,
            uniqueConnections: data.uniqueConnections
        };
    }

    /**
     * Check if a note has any connections
     */
    async hasConnections(filePath: string): Promise<boolean> {
        const backlinks = this.linkService.getBacklinks(filePath);
        const outgoingLinks = this.linkService.getOutgoingLinks(filePath);
        return backlinks.length > 0 || outgoingLinks.length > 0;
    }

    /**
     * Group connections by source/target note
     * Useful for showing "Note A links to current note 3 times"
     */
    groupConnectionsByNote(connections: Connection[]): Map<string, Connection[]> {
        const grouped = new Map<string, Connection[]>();

        for (const conn of connections) {
            // For incoming, group by source; for outgoing, group by target
            const key = conn.type === 'incoming' ? conn.sourcePath : conn.targetPath;

            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key)!.push(conn);
        }

        return grouped;
    }

    /**
     * Set the number of context lines to show before/after each connection
     */
    setContextLines(before: number, after: number): void {
        this.contextLinesBefore = before;
        this.contextLinesAfter = after;
    }
}
