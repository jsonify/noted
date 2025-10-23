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
     */
    private async processBacklinks(backlinks: Backlink[], targetPath: string): Promise<Connection[]> {
        const connections: Connection[] = [];

        for (const backlink of backlinks) {
            // Extract link text from target path
            const linkText = path.basename(targetPath, path.extname(targetPath));

            // Get extended context if needed
            const extendedContext = await this.getExtendedContext(
                backlink.sourceFile,
                backlink.line
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
     */
    private async processOutgoingLinks(links: NoteLink[], sourcePath: string): Promise<Connection[]> {
        const connections: Connection[] = [];

        for (const link of links) {
            // Only include links that resolved to a target
            if (!link.targetPath) {
                continue;
            }

            // Get the line content for context
            const lineNumber = link.range.start.line;
            const context = await this.getLineContent(sourcePath, lineNumber);

            // Get extended context
            const extendedContext = await this.getExtendedContext(sourcePath, lineNumber);

            connections.push({
                type: 'outgoing',
                targetPath: link.targetPath,
                sourcePath: sourcePath,
                lineNumber: lineNumber,
                context: context || link.linkText,
                displayText: link.displayText,
                linkText: link.linkText,
                extendedContext
            });
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
     * Get the content of a specific line from a file
     */
    private async getLineContent(filePath: string, lineNumber: number): Promise<string> {
        try {
            const content = await readFile(filePath);
            const lines = content.split('\n');
            return lines[lineNumber]?.trim() || '';
        } catch (error) {
            console.error('[NOTED] Error reading line content:', filePath, error);
            return '';
        }
    }

    /**
     * Get extended context (lines before and after) for better preview
     */
    private async getExtendedContext(filePath: string, lineNumber: number): Promise<string[]> {
        try {
            const content = await readFile(filePath);
            const lines = content.split('\n');

            const startLine = Math.max(0, lineNumber - this.contextLinesBefore);
            const endLine = Math.min(lines.length - 1, lineNumber + this.contextLinesAfter);

            const contextLines: string[] = [];
            for (let i = startLine; i <= endLine; i++) {
                contextLines.push(lines[i]);
            }

            return contextLines;
        } catch (error) {
            console.error('[NOTED] Error getting extended context:', filePath, error);
            return [];
        }
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
