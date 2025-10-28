import * as path from 'path';
import * as fs from 'fs';
import { LinkService } from './linkService';
import { readFile } from './fileSystemService';
import { extractTagsFromContent } from '../utils/tagHelpers';

/**
 * Node type in the graph
 */
export type NodeType = 'note' | 'tag' | 'placeholder';

/**
 * Represents a node in the graph
 */
export interface GraphNode {
    id: string; // file path or tag name
    label: string; // display name
    title: string; // tooltip
    type: NodeType; // node type
    val: number; // node size (force-graph uses 'val' instead of 'size')
    color?: string; // node color
    group?: string; // for grouping/coloring
    isOrphan?: boolean; // has no connections (notes only)
    linkCount?: number; // total links (notes only)
    createdTime?: number; // file creation timestamp (notes only)
    modifiedTime?: number; // file modification timestamp (notes only)
    tagCount?: number; // number of notes with this tag (tags only)
}

/**
 * Represents an edge in the graph
 */
export interface GraphEdge {
    source: string; // source node id (force-graph uses 'source' instead of 'from')
    target: string; // target node id (force-graph uses 'target' instead of 'to')
    title?: string; // tooltip
    value?: number; // edge strength/width
    type?: string; // edge type ('note-link', 'tag-link')
}

/**
 * Graph data structure for visualization
 */
export interface GraphData {
    nodes: GraphNode[];
    links: GraphEdge[]; // force-graph uses 'links' instead of 'edges'
    orphanCount: number;
    totalNotes: number;
    totalTags: number;
}

/**
 * Statistics about the graph
 */
export interface GraphStats {
    totalNotes: number;
    totalLinks: number;
    orphanNotes: number;
    mostConnectedNote: { path: string; connections: number } | null;
    averageConnections: number;
}

/**
 * Service for building and analyzing note graphs
 */
export class GraphService {
    private linkService: LinkService;
    private graphData: GraphData | null = null;

    constructor(linkService: LinkService) {
        this.linkService = linkService;
    }

    /**
     * Invalidate the cached graph data
     */
    invalidateCache(): void {
        this.graphData = null;
    }

    /**
     * Build the complete graph data structure with note and tag nodes
     */
    async buildGraph(): Promise<GraphData> {
        // Ensure backlinks index is built
        await this.linkService.buildBacklinksIndex();

        const nodes: GraphNode[] = [];
        const links: GraphEdge[] = [];
        const orphanNotes = await this.linkService.getOrphanNotes();
        const orphanSet = new Set(orphanNotes);
        const tagToNotes = new Map<string, Set<string>>(); // tag -> note paths
        const placeholderSet = new Set<string>(); // unresolved links

        // Get all notes and build note nodes
        const allNotes = await this.getAllNotes();

        for (const notePath of allNotes) {
            const outgoingLinks = this.linkService.getOutgoingLinks(notePath);
            const backlinks = this.linkService.getBacklinks(notePath);
            const linkCount = outgoingLinks.length + backlinks.length;
            const isOrphan = orphanSet.has(notePath) && linkCount === 0;

            // Get file timestamps
            let createdTime: number | undefined;
            let modifiedTime: number | undefined;
            try {
                const stats = await fs.promises.stat(notePath);
                createdTime = stats.birthtimeMs;
                modifiedTime = stats.mtimeMs;
            } catch (error) {
                // If we can't get stats, just continue without timestamps
                console.warn(`Could not get file stats for ${notePath}:`, error);
            }

            // Extract tags from note
            try {
                const content = await readFile(notePath);
                const tags = extractTagsFromContent(content);

                // Build tag->notes map
                for (const tag of tags) {
                    if (!tagToNotes.has(tag)) {
                        tagToNotes.set(tag, new Set());
                    }
                    tagToNotes.get(tag)!.add(notePath);
                }
            } catch (error) {
                console.warn(`Could not extract tags from ${notePath}:`, error);
            }

            // Create note node
            const basename = path.basename(notePath, path.extname(notePath));
            const node: GraphNode = {
                id: notePath,
                label: basename,
                title: this.createNodeTooltip(basename, outgoingLinks.length, backlinks.length),
                type: 'note',
                val: this.calculateNodeSize(linkCount),
                isOrphan,
                linkCount,
                color: this.getNodeColor('note', isOrphan, linkCount),
                group: isOrphan ? 'orphan' : 'connected',
                createdTime,
                modifiedTime
            };
            nodes.push(node);

            // Create links for outgoing note-to-note connections
            for (const link of outgoingLinks) {
                if (link.targetPath) {
                    // Check if reverse link exists (bidirectional link)
                    const reverseLinks = this.linkService.getOutgoingLinks(link.targetPath);
                    const isBidirectional = reverseLinks.some(l => l.targetPath === notePath);

                    // Build tooltip showing display text if available
                    const targetBasename = path.basename(link.targetPath);
                    const tooltip = link.displayText
                        ? `Links to ${targetBasename}\n(displayed as: "${link.displayText}")`
                        : `Links to ${targetBasename}`;

                    links.push({
                        source: notePath,
                        target: link.targetPath,
                        title: tooltip,
                        value: isBidirectional ? 3 : 1,
                        type: 'note-link'
                    });
                } else {
                    // Track placeholders (unresolved links)
                    const placeholderId = `placeholder:${link.linkText}`;
                    placeholderSet.add(placeholderId);

                    links.push({
                        source: notePath,
                        target: placeholderId,
                        title: `Unresolved link to "${link.linkText}"`,
                        value: 1,
                        type: 'placeholder-link'
                    });
                }
            }
        }

        // Create tag nodes and tag-to-note links
        for (const [tag, noteSet] of tagToNotes.entries()) {
            const tagCount = noteSet.size;

            const nodeSizeFactor = 1.5;  // Reduced from 2 to 1.5
            // Create tag node
            const tagNode: GraphNode = {
                id: `tag:${tag}`,
                label: `#${tag}`,
                title: `Tag: #${tag}\n${tagCount} note${tagCount !== 1 ? 's' : ''}`,
                type: 'tag',
                val: this.calculateNodeSize(tagCount * nodeSizeFactor), // Tags are slightly larger
                tagCount,
                color: this.getNodeColor('tag'),
                group: 'tag'
            };
            nodes.push(tagNode);

            // Create links from tag to each note
            for (const notePath of noteSet) {
                links.push({
                    source: `tag:${tag}`,
                    target: notePath,
                    title: `Tagged with #${tag}`,
                    value: 1,
                    type: 'tag-link'
                });
            }
        }

        // Create placeholder nodes for unresolved links
        for (const placeholderId of placeholderSet) {
            const linkText = placeholderId.replace('placeholder:', '');
            const fixedSizeValue = 8;  // Reduced from 15 to 8
            const placeholderNode: GraphNode = {
                id: placeholderId,
                label: linkText,
                title: `Placeholder: "${linkText}"\n(note does not exist)`,
                type: 'placeholder',
                val: fixedSizeValue, // Small fixed size
                color: this.getNodeColor('placeholder'),
                group: 'placeholder'
            };
            nodes.push(placeholderNode);
        }

        // Cache the built graph data
        this.graphData = {
            nodes,
            links,
            orphanCount: orphanNotes.length,
            totalNotes: allNotes.length,
            totalTags: tagToNotes.size
        };

        return this.graphData;
    }

    /**
     * Get statistics about the graph
     */
    async getGraphStats(): Promise<GraphStats> {
        // Use cached data if available, otherwise build the graph
        const graphData = this.graphData ?? await this.buildGraph();

        let mostConnected: { path: string; connections: number } | null = null;
        let totalConnections = 0;

        // Only count note nodes for stats
        const noteNodes = graphData.nodes.filter(n => n.type === 'note');

        for (const node of noteNodes) {
            const linkCount = node.linkCount ?? 0;
            totalConnections += linkCount;
            if (!mostConnected || linkCount > mostConnected.connections) {
                mostConnected = { path: node.id, connections: linkCount };
            }
        }

        // Count only note-to-note links
        const noteLinks = graphData.links.filter(l => l.type === 'note-link');

        return {
            totalNotes: graphData.totalNotes,
            totalLinks: noteLinks.length,
            orphanNotes: graphData.orphanCount,
            mostConnectedNote: mostConnected,
            averageConnections: graphData.totalNotes > 0 ? totalConnections / graphData.totalNotes : 0
        };
    }

    /**
     * Search nodes by name
     */
    async searchNodes(query: string): Promise<string[]> {
        // Use cached data if available, otherwise build the graph
        const graphData = this.graphData ?? await this.buildGraph();
        const normalizedQuery = query.toLowerCase().trim();

        return graphData.nodes
            .filter(node => node.label.toLowerCase().includes(normalizedQuery))
            .map(node => node.id);
    }

    /**
     * Get nodes connected to a specific note (1-hop neighbors)
     */
    async getConnectedNodes(notePath: string): Promise<string[]> {
        const connected = new Set<string>();

        // Add outgoing links
        const outgoing = this.linkService.getOutgoingLinks(notePath);
        outgoing.forEach(link => {
            if (link.targetPath) {
                connected.add(link.targetPath);
            }
        });

        // Add backlinks
        const backlinks = this.linkService.getBacklinks(notePath);
        backlinks.forEach(backlink => {
            connected.add(backlink.sourceFile);
        });

        return Array.from(connected);
    }

    /**
     * Calculate node size based on connection count
     */
    private calculateNodeSize(linkCount: number): number {
        const baseSize = 10;  // Reduced from 20 to 10
        const maxSize = 30;   // Reduced from 50 to 30
        // Logarithmic scaling for better visual distribution
        return Math.min(baseSize + Math.log(linkCount + 1) * 8, maxSize);  // Reduced multiplier from 10 to 8
    }

    /**
     * Get node color based on type and properties
     */
    private getNodeColor(type: NodeType, isOrphan: boolean = false, linkCount: number = 0): string {
        if (type === 'tag') {
            return '#ff922b'; // Orange for tags
        } else if (type === 'placeholder') {
            return '#e599f7'; // Purple for placeholders
        } else {
            // Note nodes
            if (isOrphan) {
                return '#adb5bd'; // Gray for orphans
            } else if (linkCount > 10) {
                return '#ff6b6b'; // Red for highly connected
            } else if (linkCount > 5) {
                return '#ffa500'; // Orange for moderately connected
            } else if (linkCount > 2) {
                return '#4dabf7'; // Blue for somewhat connected
            } else {
                return '#69db7c'; // Green for lightly connected
            }
        }
    }

    /**
     * Create tooltip for a node
     */
    private createNodeTooltip(basename: string, outgoingCount: number, backlinksCount: number): string {
        return `${basename}\n${outgoingCount} outgoing link${outgoingCount !== 1 ? 's' : ''}\n${backlinksCount} backlink${backlinksCount !== 1 ? 's' : ''}`;
    }

    /**
     * Get all notes from the link service
     */
    private async getAllNotes(): Promise<string[]> {
        return await this.linkService.getAllNotes();
    }
}
