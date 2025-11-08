import * as path from 'path';
import { TagParser, NoteTag, NoteMetadata } from './TagParser';
import * as fileSystemService from '../services/fileSystemService';
import { getNotesPath, getFileFormat, getTemplatesPath } from '../services/configService';

/**
 * TagManager handles all tag-related business logic and file operations
 */
export class TagManager {
    private tagCache: Map<string, NoteTag[]> = new Map();
    private allTagsCache: Map<string, number> | null = null;
    private cacheTimestamp: number = 0;
    private readonly CACHE_TTL = 5000; // 5 seconds

    /**
     * Apply tags to a note file
     * @param filePath - Absolute path to the note file
     * @param tags - Array of tags to add
     * @param merge - If true, merge with existing tags. If false, replace all tags.
     */
    async tagNote(filePath: string, tags: NoteTag[], merge: boolean = true): Promise<void> {
        try {
            // Read current file content
            const content = await fileSystemService.readFile(filePath);

            // Parse existing tags if merging
            let finalTags = tags;
            if (merge) {
                const existingMetadata = TagParser.parseTags(content);
                const existingTagNames = new Set(existingMetadata.tags.map(t => t.name));

                // Merge: keep existing tags, add new ones that don't exist
                finalTags = [
                    ...existingMetadata.tags,
                    ...tags.filter(t => !existingTagNames.has(t.name))
                ];
            }

            // Remove duplicates based on tag name
            const uniqueTags = Array.from(
                new Map(finalTags.map(tag => [tag.name, tag])).values()
            );

            // Create metadata
            const metadata: NoteMetadata = {
                tags: uniqueTags,
                lastTagged: new Date(),
                tagVersion: '1.0'
            };

            // Write back to file
            const updatedContent = TagParser.writeTags(content, metadata);
            await fileSystemService.writeFile(filePath, updatedContent);

            // Update cache
            this.tagCache.set(filePath, uniqueTags);
            this.invalidateAllTagsCache();
        } catch (error) {
            console.error(`Error tagging note ${filePath}:`, error);
            throw new Error(`Failed to tag note: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get all tags from a specific note
     * @param filePath - Absolute path to the note file
     * @returns Array of tags
     */
    async getNoteTags(filePath: string): Promise<NoteTag[]> {
        // Check cache first
        if (this.tagCache.has(filePath)) {
            return this.tagCache.get(filePath)!;
        }

        try {
            const content = await fileSystemService.readFile(filePath);
            const metadata = TagParser.parseTags(content);

            // Update cache
            this.tagCache.set(filePath, metadata.tags);

            return metadata.tags;
        } catch (error) {
            console.error(`Error reading tags from ${filePath}:`, error);
            return [];
        }
    }

    /**
     * Find all notes that have a specific tag
     * @param tag - Tag name to search for
     * @returns Array of absolute file paths
     */
    async findNotesByTag(tag: string): Promise<string[]> {
        const notesPath = getNotesPath();
        if (!notesPath) {
            return [];
        }

        const matchingNotes: string[] = [];
        const noteFiles = await this.getAllNoteFiles();

        for (const filePath of noteFiles) {
            const tags = await this.getNoteTags(filePath);
            if (tags.some(t => t.name === tag)) {
                matchingNotes.push(filePath);
            }
        }

        return matchingNotes;
    }

    /**
     * Get all unique tags across all notes with their occurrence counts
     * @returns Map of tag name to count
     */
    async getAllTags(): Promise<Map<string, number>> {
        // Check cache
        const now = Date.now();
        if (this.allTagsCache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
            return this.allTagsCache;
        }

        const tagCounts = new Map<string, number>();
        const noteFiles = await this.getAllNoteFiles();

        for (const filePath of noteFiles) {
            const tags = await this.getNoteTags(filePath);
            for (const tag of tags) {
                tagCounts.set(tag.name, (tagCounts.get(tag.name) || 0) + 1);
            }
        }

        // Update cache
        this.allTagsCache = tagCounts;
        this.cacheTimestamp = now;

        return tagCounts;
    }

    /**
     * Remove a specific tag from a note
     * @param filePath - Absolute path to the note file
     * @param tagName - Name of tag to remove
     */
    async removeTag(filePath: string, tagName: string): Promise<void> {
        try {
            const content = await fileSystemService.readFile(filePath);
            const metadata = TagParser.parseTags(content);

            // Filter out the tag
            metadata.tags = metadata.tags.filter(t => t.name !== tagName);

            // Write back
            const updatedContent = TagParser.writeTags(content, metadata);
            await fileSystemService.writeFile(filePath, updatedContent);

            // Update cache
            this.tagCache.set(filePath, metadata.tags);
            this.invalidateAllTagsCache();
        } catch (error) {
            console.error(`Error removing tag from ${filePath}:`, error);
            throw new Error(`Failed to remove tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Remove all tags from a note
     * @param filePath - Absolute path to the note file
     */
    async removeAllTags(filePath: string): Promise<void> {
        try {
            const content = await fileSystemService.readFile(filePath);
            const updatedContent = TagParser.removeTags(content);
            await fileSystemService.writeFile(filePath, updatedContent);

            // Update cache
            this.tagCache.delete(filePath);
            this.invalidateAllTagsCache();
        } catch (error) {
            console.error(`Error removing all tags from ${filePath}:`, error);
            throw new Error(`Failed to remove all tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Rename a tag across all notes
     * @param oldTag - Current tag name
     * @param newTag - New tag name
     * @returns Number of notes updated
     */
    async renameTag(oldTag: string, newTag: string): Promise<number> {
        const noteFiles = await this.findNotesByTag(oldTag);
        let updateCount = 0;

        for (const filePath of noteFiles) {
            try {
                const content = await fileSystemService.readFile(filePath);
                const metadata = TagParser.parseTags(content);

                // Update tag name
                metadata.tags = metadata.tags.map(t =>
                    t.name === oldTag ? { ...t, name: newTag } : t
                );

                // Write back
                const updatedContent = TagParser.writeTags(content, metadata);
                await fileSystemService.writeFile(filePath, updatedContent);

                // Update cache
                this.tagCache.set(filePath, metadata.tags);
                updateCount++;
            } catch (error) {
                console.error(`Error renaming tag in ${filePath}:`, error);
            }
        }

        this.invalidateAllTagsCache();
        return updateCount;
    }

    /**
     * Merge two or more tags into a single tag
     * @param sourceTags - Array of tag names to merge from
     * @param targetTag - Tag name to merge into
     * @returns Number of notes updated
     */
    async mergeTags(sourceTags: string[], targetTag: string): Promise<number> {
        const noteFiles = await this.getAllNoteFiles();
        let updateCount = 0;

        for (const filePath of noteFiles) {
            try {
                const content = await fileSystemService.readFile(filePath);
                const metadata = TagParser.parseTags(content);

                // Check if this note has any of the source tags
                const hasSourceTag = metadata.tags.some(t => sourceTags.includes(t.name));
                if (!hasSourceTag) {
                    continue;
                }

                // Replace all source tags with target tag
                const updatedTags: NoteTag[] = [];
                let hasTargetTag = false;

                for (const tag of metadata.tags) {
                    if (sourceTags.includes(tag.name)) {
                        // Replace with target tag (but only add once)
                        if (!hasTargetTag) {
                            updatedTags.push({ ...tag, name: targetTag });
                            hasTargetTag = true;
                        }
                    } else if (tag.name === targetTag) {
                        updatedTags.push(tag);
                        hasTargetTag = true;
                    } else {
                        updatedTags.push(tag);
                    }
                }

                metadata.tags = updatedTags;

                // Write back
                const updatedContent = TagParser.writeTags(content, metadata);
                await fileSystemService.writeFile(filePath, updatedContent);

                // Update cache
                this.tagCache.set(filePath, metadata.tags);
                updateCount++;
            } catch (error) {
                console.error(`Error merging tags in ${filePath}:`, error);
            }
        }

        this.invalidateAllTagsCache();
        return updateCount;
    }

    /**
     * Delete a tag from all notes
     * @param tagName - Tag name to delete
     * @returns Number of notes updated
     */
    async deleteTag(tagName: string): Promise<number> {
        const noteFiles = await this.findNotesByTag(tagName);
        let updateCount = 0;

        for (const filePath of noteFiles) {
            try {
                await this.removeTag(filePath, tagName);
                updateCount++;
            } catch (error) {
                console.error(`Error deleting tag from ${filePath}:`, error);
            }
        }

        this.invalidateAllTagsCache();
        return updateCount;
    }

    /**
     * Get all note files recursively from the notes folder
     * Excludes template files
     */
    private async getAllNoteFiles(): Promise<string[]> {
        const notesPath = getNotesPath();
        if (!notesPath) {
            return [];
        }

        const fileFormat = getFileFormat();
        const pattern = new vscode.RelativePattern(notesPath, `**/*.${fileFormat}`);

        // Exclude templates folder. The `getTemplatesPath` helper could be used to get the exact folder name if needed.
        const files = await vscode.workspace.findFiles(pattern, '**/.noted-templates/**');

        return files.map(uri => uri.fsPath);
    }

    /**
     * Recursively scan a directory for note files
     */
    private async scanDirectory(
        dirPath: string,
        noteFiles: string[],
        fileFormat: string,
        excludePath: string | null
    ): Promise<void> {
        try {
            const exists = await fileSystemService.pathExists(dirPath);
            if (!exists) {
                return;
            }

            const entries = await fileSystemService.readDirectoryWithTypes(dirPath);

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                // Skip templates folder
                if (excludePath && fullPath === excludePath) {
                    continue;
                }

                if (entry.isDirectory()) {
                    await this.scanDirectory(fullPath, noteFiles, fileFormat, excludePath);
                } else if (entry.isFile()) {
                    // Check if it's a note file
                    if (entry.name.endsWith(`.${fileFormat}`)) {
                        noteFiles.push(fullPath);
                    }
                }
            }
        } catch (error) {
            console.error(`Error scanning directory ${dirPath}:`, error);
        }
    }

    /**
     * Clear all caches
     */
    clearCache(): void {
        this.tagCache.clear();
        this.invalidateAllTagsCache();
    }

    /**
     * Invalidate only the all tags cache
     */
    private invalidateAllTagsCache(): void {
        this.allTagsCache = null;
        this.cacheTimestamp = 0;
    }

    /**
     * Invalidate cache for a specific file
     */
    invalidateFileCache(filePath: string): void {
        this.tagCache.delete(filePath);
        this.invalidateAllTagsCache();
    }
}

// Export singleton instance
export const tagManager = new TagManager();
