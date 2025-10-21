import * as path from 'path';
import { LinkService } from './linkService';
import { readFile } from './fileSystemService';

/**
 * Represents a node in the graph
 */
export interface GraphNode {
    id: string; // file path
    label: string; // display name
    title: string; // tooltip
    size: number; // visual size based on connections
    color?: string; // node color
    group?: string; // for grouping/coloring
    isOrphan: boolean; // has no connections
    linkCount: number; // total links (in + out)
}

/**
 * Represents an edge in the graph
 */
export interface GraphEdge {
    from: string; // source file path
    to: string; // target file path
    arrows: string; // 'to' for directional
    title?: string; // tooltip
    width?: number; // visual width
}

/**
 * Graph data structure for visualization
 */
export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
    orphanCount: number;
    totalNotes: number;
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

    constructor(linkService: LinkService) {
        this.linkService = linkService;
    }

    /**
     * Build the complete graph data structure
     */
    async buildGraph(): Promise<GraphData> {
        // Ensure backlinks index is built
        await this.linkService.buildBacklinksIndex();

        const nodes: GraphNode[] = [];
        const edges: GraphEdge[] = [];
        const orphanNotes = await this.linkService.getOrphanNotes();
        const orphanSet = new Set(orphanNotes);

        // Get all notes and build node/edge data
        const allNotes = await this.getAllNotes();

        for (const notePath of allNotes) {
            const outgoingLinks = this.linkService.getOutgoingLinks(notePath);
            const backlinks = this.linkService.getBacklinks(notePath);
            const linkCount = outgoingLinks.length + backlinks.length;
            const isOrphan = orphanSet.has(notePath) && linkCount === 0;

            // Create node
            const basename = path.basename(notePath, path.extname(notePath));
            const node: GraphNode = {
                id: notePath,
                label: basename,
                title: this.createNodeTooltip(basename, outgoingLinks.length, backlinks.length),
                size: this.calculateNodeSize(linkCount),
                isOrphan,
                linkCount,
                color: this.getNodeColor(isOrphan, linkCount),
                group: isOrphan ? 'orphan' : 'connected'
            };
            nodes.push(node);

            // Create edges for outgoing links
            for (const link of outgoingLinks) {
                if (link.targetPath) {
                    // Check if reverse edge exists (bidirectional link)
                    const reverseLinks = this.linkService.getOutgoingLinks(link.targetPath);
                    const isBidirectional = reverseLinks.some(l => l.targetPath === notePath);

                    edges.push({
                        from: notePath,
                        to: link.targetPath,
                        arrows: 'to',
                        title: `Links to ${path.basename(link.targetPath)}`,
                        width: isBidirectional ? 3 : 1
                    });
                }
            }
        }

        return {
            nodes,
            edges,
            orphanCount: orphanNotes.length,
            totalNotes: allNotes.length
        };
    }

    /**
     * Get statistics about the graph
     */
    async getGraphStats(): Promise<GraphStats> {
        const graphData = await this.buildGraph();

        let mostConnected: { path: string; connections: number } | null = null;
        let totalConnections = 0;

        for (const node of graphData.nodes) {
            totalConnections += node.linkCount;
            if (!mostConnected || node.linkCount > mostConnected.connections) {
                mostConnected = { path: node.id, connections: node.linkCount };
            }
        }

        return {
            totalNotes: graphData.totalNotes,
            totalLinks: graphData.edges.length,
            orphanNotes: graphData.orphanCount,
            mostConnectedNote: mostConnected,
            averageConnections: graphData.totalNotes > 0 ? totalConnections / graphData.totalNotes : 0
        };
    }

    /**
     * Search nodes by name
     */
    async searchNodes(query: string): Promise<string[]> {
        const graphData = await this.buildGraph();
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
        const baseSize = 20;
        const maxSize = 50;
        // Logarithmic scaling for better visual distribution
        return Math.min(baseSize + Math.log(linkCount + 1) * 10, maxSize);
    }

    /**
     * Get node color based on properties
     */
    private getNodeColor(isOrphan: boolean, linkCount: number): string {
        if (isOrphan) {
            return '#cccccc'; // Gray for orphans
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
