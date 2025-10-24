import * as path from 'path';
import { LinkService } from './linkService';

/**
 * Represents an orphaned note (no incoming or outgoing links)
 */
export interface OrphanNote {
    /** Full path to the orphaned note */
    filePath: string;
    /** Note filename without extension */
    basename: string;
    /** Whether this note has any outgoing links */
    hasOutgoingLinks: boolean;
    /** Whether this note has any incoming links (backlinks) */
    hasIncomingLinks: boolean;
}

/**
 * Service for detecting and managing orphaned notes
 * An orphan is a note that has NO connections to other notes
 */
export class OrphansService {
    private linkService: LinkService;

    constructor(linkService: LinkService) {
        this.linkService = linkService;
    }

    /**
     * Get all truly orphaned notes (no incoming AND no outgoing links)
     */
    async getTrueOrphans(): Promise<OrphanNote[]> {
        const allNotes = await this.linkService.getAllNotes();
        const orphans: OrphanNote[] = [];

        for (const notePath of allNotes) {
            const backlinks = this.linkService.getBacklinks(notePath);
            const outgoingLinks = this.linkService.getOutgoingLinks(notePath);

            // A true orphan has no connections at all
            if (backlinks.length === 0 && outgoingLinks.length === 0) {
                orphans.push({
                    filePath: notePath,
                    basename: path.basename(notePath, path.extname(notePath)),
                    hasOutgoingLinks: false,
                    hasIncomingLinks: false
                });
            }
        }

        return orphans;
    }

    /**
     * Get notes that only have incoming links but no outgoing links
     * These are "sink" notes that are referenced but don't reference anything
     */
    async getSinkNotes(): Promise<OrphanNote[]> {
        const allNotes = await this.linkService.getAllNotes();
        const sinks: OrphanNote[] = [];

        for (const notePath of allNotes) {
            const backlinks = this.linkService.getBacklinks(notePath);
            const outgoingLinks = this.linkService.getOutgoingLinks(notePath);

            if (backlinks.length > 0 && outgoingLinks.length === 0) {
                sinks.push({
                    filePath: notePath,
                    basename: path.basename(notePath, path.extname(notePath)),
                    hasOutgoingLinks: false,
                    hasIncomingLinks: true
                });
            }
        }

        return sinks;
    }

    /**
     * Get notes that only have outgoing links but no incoming links
     * These are "source" notes that reference others but aren't referenced
     */
    async getSourceNotes(): Promise<OrphanNote[]> {
        const allNotes = await this.linkService.getAllNotes();
        const sources: OrphanNote[] = [];

        for (const notePath of allNotes) {
            const backlinks = this.linkService.getBacklinks(notePath);
            const outgoingLinks = this.linkService.getOutgoingLinks(notePath);

            if (backlinks.length === 0 && outgoingLinks.length > 0) {
                sources.push({
                    filePath: notePath,
                    basename: path.basename(notePath, path.extname(notePath)),
                    hasOutgoingLinks: true,
                    hasIncomingLinks: false
                });
            }
        }

        return sources;
    }

    /**
     * Get all orphan categories for comprehensive view
     */
    async getAllOrphanCategories(): Promise<{
        trueOrphans: OrphanNote[];
        sourceOnly: OrphanNote[];
        sinkOnly: OrphanNote[];
    }> {
        const allNotes = await this.linkService.getAllNotes();
        const trueOrphans: OrphanNote[] = [];
        const sourceOnly: OrphanNote[] = [];
        const sinkOnly: OrphanNote[] = [];

        for (const notePath of allNotes) {
            const backlinks = this.linkService.getBacklinks(notePath);
            const outgoingLinks = this.linkService.getOutgoingLinks(notePath);
            const hasIncoming = backlinks.length > 0;
            const hasOutgoing = outgoingLinks.length > 0;

            const orphanNote: OrphanNote = {
                filePath: notePath,
                basename: path.basename(notePath, path.extname(notePath)),
                hasOutgoingLinks: hasOutgoing,
                hasIncomingLinks: hasIncoming
            };

            if (!hasIncoming && !hasOutgoing) {
                trueOrphans.push(orphanNote);
            } else if (!hasIncoming && hasOutgoing) {
                sourceOnly.push(orphanNote);
            } else if (hasIncoming && !hasOutgoing) {
                sinkOnly.push(orphanNote);
            }
        }

        return { trueOrphans, sourceOnly, sinkOnly };
    }

    /**
     * Check if a specific note is an orphan
     */
    async isOrphan(filePath: string): Promise<boolean> {
        const backlinks = this.linkService.getBacklinks(filePath);
        const outgoingLinks = this.linkService.getOutgoingLinks(filePath);
        return backlinks.length === 0 && outgoingLinks.length === 0;
    }
}
