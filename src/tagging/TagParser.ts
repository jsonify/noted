import * as yaml from 'js-yaml';

/**
 * Represents a single tag with metadata
 */
export interface NoteTag {
    name: string;           // e.g., "bug", "feature", "react"
    confidence: number;     // 0.0 - 1.0 (AI confidence score)
    source: 'ai' | 'manual'; // How tag was added
    addedAt: Date;
}

/**
 * Metadata stored in note frontmatter
 */
export interface NoteMetadata {
    tags: NoteTag[];
    lastTagged?: Date;
    tagVersion?: string;  // For future tag schema changes
}

/**
 * Simple frontmatter structure for storage
 */
interface SimpleFrontmatter {
    tags?: string;
    'tagged-at'?: string;
    [key: string]: any;
}

/**
 * TagParser handles reading and writing tag metadata from note frontmatter
 */
export class TagParser {

    /**
     * Extract tags from note file content
     * @param fileContent - The full content of the note file
     * @returns NoteMetadata object with tags and metadata
     */
    static parseTags(fileContent: string): NoteMetadata {
        const defaultMetadata: NoteMetadata = {
            tags: [],
            lastTagged: undefined,
            tagVersion: '1.0'
        };

        if (!this.hasFrontmatter(fileContent)) {
            return defaultMetadata;
        }

        try {
            const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---/);
            if (!frontmatterMatch) {
                return defaultMetadata;
            }

            const frontmatterContent = frontmatterMatch[1];
            const parsed = yaml.load(frontmatterContent) as SimpleFrontmatter;

            if (!parsed || typeof parsed !== 'object') {
                return defaultMetadata;
            }

            const metadata: NoteMetadata = {
                tags: [],
                lastTagged: parsed['tagged-at'] ? new Date(parsed['tagged-at']) : undefined,
                tagVersion: '1.0'
            };

            // Parse tags from comma-separated string
            if (parsed.tags && typeof parsed.tags === 'string') {
                const tagNames = parsed.tags
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t.length > 0);

                // For now, tags from frontmatter are assumed to be manual
                // We don't store full NoteTag metadata in frontmatter yet
                metadata.tags = tagNames.map(name => ({
                    name,
                    confidence: 1.0,
                    source: 'manual' as const,
                    addedAt: metadata.lastTagged || new Date()
                }));
            }

            return metadata;
        } catch (error) {
            console.error('Error parsing frontmatter:', error);
            return defaultMetadata;
        }
    }

    /**
     * Insert or update frontmatter with tags
     * @param fileContent - The full content of the note file
     * @param metadata - The metadata to write
     * @returns Updated file content with frontmatter
     */
    static writeTags(fileContent: string, metadata: NoteMetadata): string {
        const hasFrontmatter = this.hasFrontmatter(fileContent);

        // Build frontmatter object
        const frontmatter: SimpleFrontmatter = {};

        // Convert tags to array format to match existing tag system
        // Format: tags: [tag1, tag2, tag3]
        if (metadata.tags.length > 0) {
            const tagNames = metadata.tags.map(t => t.name);
            frontmatter.tags = `[${tagNames.join(', ')}]`;
            frontmatter['tagged-at'] = new Date().toISOString();
        }

        if (hasFrontmatter) {
            // Update existing frontmatter
            return this.updateFrontmatter(fileContent, frontmatter);
        } else {
            // Add new frontmatter
            return this.addFrontmatter(fileContent, frontmatter);
        }
    }

    /**
     * Check if file has YAML frontmatter
     * @param fileContent - The full content of the note file
     * @returns true if frontmatter exists
     */
    static hasFrontmatter(fileContent: string): boolean {
        return /^---\n[\s\S]*?\n---/.test(fileContent);
    }

    /**
     * Add frontmatter to file content
     */
    private static addFrontmatter(fileContent: string, frontmatter: SimpleFrontmatter): string {
        const yamlContent = yaml.dump(frontmatter, {
            lineWidth: -1, // Don't wrap lines
            noRefs: true
        });

        return `---\n${yamlContent}---\n\n${fileContent}`;
    }

    /**
     * Update existing frontmatter in file content
     */
    private static updateFrontmatter(fileContent: string, newData: SimpleFrontmatter): string {
        const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---/);
        if (!frontmatterMatch) {
            return this.addFrontmatter(fileContent, newData);
        }

        try {
            const existingContent = frontmatterMatch[1];
            const existing = (yaml.load(existingContent) as SimpleFrontmatter) || {};

            // Merge new data with existing, preserving other fields
            const merged = { ...existing, ...newData };

            // Remove tags field if empty
            if (merged.tags === '') {
                delete merged.tags;
                delete merged['tagged-at'];
            }

            const yamlContent = yaml.dump(merged, {
                lineWidth: -1,
                noRefs: true
            });

            // Replace frontmatter
            const contentAfterFrontmatter = fileContent.substring(frontmatterMatch[0].length);
            return `---\n${yamlContent}---${contentAfterFrontmatter}`;
        } catch (error) {
            console.error('Error updating frontmatter:', error);
            return fileContent;
        }
    }

    /**
     * Remove all tags from a note
     * @param fileContent - The full content of the note file
     * @returns Updated file content with tags removed
     */
    static removeTags(fileContent: string): string {
        if (!this.hasFrontmatter(fileContent)) {
            return fileContent;
        }

        const emptyMetadata: NoteMetadata = {
            tags: [],
            lastTagged: undefined
        };

        return this.writeTags(fileContent, emptyMetadata);
    }
}
