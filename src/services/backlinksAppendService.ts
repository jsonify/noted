import * as path from 'path';
import { LinkService, Backlink, NoteLink } from './linkService';
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

        // Get unique source files to prevent duplicate entries for multiple links from the same file
        const sourceFiles = new Set(backlinks.map(b => b.sourceFile));

        // Build backlinks section
        let section = this.backlinksMarker;
        const sortedFiles = Array.from(sourceFiles).sort();

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
     * @param oldOutgoingLinks Previous outgoing links before the file was saved (optional)
     */
    async updateBacklinksForLinkedNotes(sourceFile: string, oldOutgoingLinks?: NoteLink[]): Promise<void> {
        // Get all currently linked notes
        const currentOutgoingLinks = this.linkService.getOutgoingLinks(sourceFile);
        const currentTargets = new Set<string>(
            currentOutgoingLinks.map(link => link.targetPath).filter((p): p is string => !!p)
        );

        // Get previously linked notes (if provided)
        const oldTargets = new Set<string>(
            oldOutgoingLinks?.map(link => link.targetPath).filter((p): p is string => !!p) || []
        );

        // Combine all affected notes: current targets + old targets
        // We need to update both sets:
        // - Current targets: to add/update backlinks
        // - Old targets: to remove backlinks if they're no longer linked
        const allAffectedNotes = new Set([...currentTargets, ...oldTargets]);

        // Update backlinks section for all affected notes
        for (const targetPath of allAffectedNotes) {
            await this.updateBacklinksSection(targetPath);
        }
    }

    /**
     * Rebuild backlinks sections for all notes in the workspace
     * This is useful for initial setup or manual refresh
     * Processes notes in parallel for better performance
     */
    async rebuildAllBacklinks(notesPath: string): Promise<number> {
        const allNotes = await this.linkService.getAllNotes();

        const updatePromises = allNotes.map(async (notePath) => {
            try {
                const backlinks = this.linkService.getBacklinks(notePath);
                const content = await readFile(notePath);
                const hasBacklinksSection = content.includes(this.backlinksMarker);

                if (backlinks.length > 0 || hasBacklinksSection) {
                    await this.updateBacklinksSection(notePath);
                    return true;
                }
            } catch (error) {
                console.error(`[NOTED] Error rebuilding backlinks for note:`, notePath, error);
            }
            return false;
        });

        const results = await Promise.all(updatePromises);
        return results.filter(r => r).length;
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
     * Processes notes in parallel for better performance
     */
    async clearAllBacklinks(notesPath: string): Promise<number> {
        const allNotes = await this.linkService.getAllNotes();

        const clearPromises = allNotes.map(async (notePath) => {
            try {
                const content = await readFile(notePath);

                if (content.includes(this.backlinksMarker)) {
                    const contentWithoutBacklinks = this.removeBacklinksSection(content);
                    if (contentWithoutBacklinks !== content) {
                        await writeFile(notePath, contentWithoutBacklinks);
                        return true;
                    }
                }
            } catch (error) {
                console.error('[NOTED] Error clearing backlinks from note:', notePath, error);
            }
            return false;
        });

        const results = await Promise.all(clearPromises);
        return results.filter(r => r).length;
    }
}
