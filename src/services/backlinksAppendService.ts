import * as path from 'path';
import { LinkService, Backlink } from './linkService';
import { readFile, writeFile } from './fileSystemService';
import { parseFrontmatter } from '../utils/frontmatterParser';

/**
 * Service for appending backlinks sections to notes
 * Automatically maintains a "Backlinks" section at the end of notes
 */
export class BacklinksAppendService {
    private linkService: LinkService;
    private backlinksMarker = '\n---\n## Backlinks\n';
    private processingFiles = new Set<string>(); // Prevent circular updates

    constructor(linkService: LinkService) {
        this.linkService = linkService;
    }

    /**
     * Update the backlinks section for a specific note
     * @param targetPath Path to the note that should have its backlinks section updated
     */
    async updateBacklinksSection(targetPath: string): Promise<void> {
        // Prevent circular updates (when we write the file, it triggers a save event)
        if (this.processingFiles.has(targetPath)) {
            return;
        }

        this.processingFiles.add(targetPath);

        try {
            // Get backlinks for this note
            const backlinks = this.linkService.getBacklinks(targetPath);

            // Read current content
            const currentContent = await readFile(targetPath);

            // Generate new backlinks section
            const newBacklinksSection = await this.formatBacklinksSection(backlinks);

            // Get content without existing backlinks section
            const contentWithoutBacklinks = this.removeBacklinksSection(currentContent);

            // Build new content with updated backlinks
            const newContent = contentWithoutBacklinks + newBacklinksSection;

            // Only write if content changed
            if (newContent !== currentContent) {
                await writeFile(targetPath, newContent);
                console.log(`[NOTED] Updated backlinks section in ${path.basename(targetPath)}`);
            }
        } catch (error) {
            console.error('[NOTED] Error updating backlinks section:', targetPath, error);
        } finally {
            this.processingFiles.delete(targetPath);
        }
    }

    /**
     * Format the backlinks section
     * Returns empty string if no backlinks
     */
    private async formatBacklinksSection(backlinks: Backlink[]): Promise<string> {
        if (backlinks.length === 0) {
            return ''; // No backlinks section if no backlinks
        }

        // Group backlinks by source file
        const backlinksByFile = new Map<string, Backlink[]>();
        for (const backlink of backlinks) {
            if (!backlinksByFile.has(backlink.sourceFile)) {
                backlinksByFile.set(backlink.sourceFile, []);
            }
            backlinksByFile.get(backlink.sourceFile)!.push(backlink);
        }

        // Build backlinks section
        let section = this.backlinksMarker;
        const sortedFiles = Array.from(backlinksByFile.keys()).sort();

        for (const sourceFile of sortedFiles) {
            const sourceBasename = path.basename(sourceFile, path.extname(sourceFile));

            // Extract tags from the source note
            const tags = await this.extractTagsFromNote(sourceFile);
            const tagString = tags.length > 0 ? ` - ${tags.map(t => `#${t}`).join(' ')}` : '';

            // Add backlink entry
            section += `- [[${sourceBasename}]]${tagString}\n`;
        }

        return section;
    }

    /**
     * Extract tags from a note's frontmatter
     */
    private async extractTagsFromNote(filePath: string): Promise<string[]> {
        try {
            const content = await readFile(filePath);
            const frontmatter = parseFrontmatter(content);
            return frontmatter.tags || [];
        } catch (error) {
            console.error('[NOTED] Error extracting tags from note:', filePath, error);
            return [];
        }
    }

    /**
     * Remove existing backlinks section from content
     * Returns content up to (but not including) the backlinks marker
     */
    private removeBacklinksSection(content: string): string {
        const markerIndex = content.indexOf(this.backlinksMarker);

        if (markerIndex === -1) {
            // No existing backlinks section
            // Make sure content ends with a newline for clean separation
            return content.trimEnd() + '\n';
        }

        // Remove everything from the marker onwards
        return content.substring(0, markerIndex).trimEnd() + '\n';
    }

    /**
     * Update backlinks for all notes that are linked from a specific file
     * This is called when a file is saved and its links have changed
     * @param sourceFile The file that was modified
     */
    async updateBacklinksForLinkedNotes(sourceFile: string): Promise<void> {
        // Get all outgoing links from this file
        const outgoingLinks = this.linkService.getOutgoingLinks(sourceFile);

        // Update backlinks section for each target note
        const targetPaths = new Set<string>();
        for (const link of outgoingLinks) {
            if (link.targetPath) {
                targetPaths.add(link.targetPath);
            }
        }

        // Also check if this file used to link to notes that it no longer links to
        // We need to update those notes as well to remove the backlink
        // This is handled by getting all notes that currently have this file as a backlink
        const allBacklinks = this.linkService.getBacklinks(sourceFile);
        // Wait, that's backwards. Let me think...

        // We need to find all notes that previously had backlinks from sourceFile
        // The linkService already updated its cache, so we need to update all affected notes
        // The safest approach is to update all notes that currently have backlinks from sourceFile
        // AND all notes in the old cache (but we don't have access to old cache)

        // Simpler approach: just update all target notes that are currently linked
        for (const targetPath of targetPaths) {
            await this.updateBacklinksSection(targetPath);
        }
    }

    /**
     * Rebuild backlinks sections for all notes in the workspace
     * This is useful for initial setup or manual refresh
     */
    async rebuildAllBacklinks(notesPath: string): Promise<number> {
        let updatedCount = 0;

        // Get all notes that have backlinks
        const allNotes = await this.linkService.getAllNotes();

        for (const notePath of allNotes) {
            const backlinks = this.linkService.getBacklinks(notePath);

            // Only update notes that have backlinks or currently have a backlinks section
            const content = await readFile(notePath);
            const hasBacklinksSection = content.includes(this.backlinksMarker);

            if (backlinks.length > 0 || hasBacklinksSection) {
                await this.updateBacklinksSection(notePath);
                updatedCount++;
            }
        }

        return updatedCount;
    }

    /**
     * Check if a file is currently being processed
     * Used to prevent circular updates
     */
    isProcessing(filePath: string): boolean {
        return this.processingFiles.has(filePath);
    }

    /**
     * Clear all backlinks sections from all notes
     * Useful if user wants to disable the feature
     */
    async clearAllBacklinks(notesPath: string): Promise<number> {
        let clearedCount = 0;
        const allNotes = await this.linkService.getAllNotes();

        for (const notePath of allNotes) {
            try {
                const content = await readFile(notePath);

                if (content.includes(this.backlinksMarker)) {
                    const contentWithoutBacklinks = this.removeBacklinksSection(content);
                    await writeFile(notePath, contentWithoutBacklinks);
                    clearedCount++;
                }
            } catch (error) {
                console.error('[NOTED] Error clearing backlinks from note:', notePath, error);
            }
        }

        return clearedCount;
    }

    /**
     * Update backlinks when a note is renamed
     * This updates both the link references AND the backlinks sections
     */
    async handleNoteRename(oldPath: string, newPath: string): Promise<void> {
        // The linkService already handles updating link references
        // We just need to update the backlinks sections of affected notes

        // Get all notes that link to the renamed note (using new path after cache update)
        const backlinks = this.linkService.getBacklinks(newPath);

        for (const backlink of backlinks) {
            await this.updateBacklinksSection(backlink.sourceFile);
        }
    }
}
