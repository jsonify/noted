/**
 * Frontmatter parser utility for extracting metadata from notes
 * Supports YAML frontmatter delimited by --- markers
 */

export interface Frontmatter {
    tags?: string[];
    [key: string]: any;
}

/**
 * Parse YAML frontmatter from note content
 * Supports both inline and list formats:
 * - tags: tag1, tag2, tag3
 * - tags: [tag1, tag2, tag3]
 * - tags:
 *     - tag1
 *     - tag2
 */
export function parseFrontmatter(content: string): Frontmatter {
    const frontmatter: Frontmatter = {};

    // Check if content starts with frontmatter delimiter
    if (!content.trimStart().startsWith('---')) {
        return frontmatter;
    }

    // Find the frontmatter section
    const lines = content.split('\n');
    let inFrontmatter = false;
    let frontmatterEnd = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line === '---') {
            if (!inFrontmatter) {
                inFrontmatter = true;
            } else {
                frontmatterEnd = i;
                break;
            }
        }
    }

    if (frontmatterEnd === -1) {
        // No closing delimiter found
        return frontmatter;
    }

    // Extract frontmatter lines (between the two --- delimiters)
    const frontmatterLines = lines.slice(1, frontmatterEnd);

    // Simple YAML parser for tags
    let currentKey: string | null = null;
    let inListMode = false;

    for (const line of frontmatterLines) {
        const trimmedLine = line.trim();

        if (!trimmedLine || trimmedLine.startsWith('#')) {
            continue; // Skip empty lines and comments
        }

        // Check for key-value pairs
        const keyValueMatch = trimmedLine.match(/^(\w+):\s*(.*)$/);

        if (keyValueMatch) {
            const key = keyValueMatch[1];
            const value = keyValueMatch[2].trim();
            currentKey = key;
            inListMode = false;

            if (key === 'tags') {
                if (!value) {
                    // List mode: tags are on following lines with - prefix
                    inListMode = true;
                    frontmatter.tags = [];
                } else {
                    // Inline mode: parse tags from the value
                    frontmatter.tags = parseTagsValue(value);
                }
            } else {
                frontmatter[key] = value;
            }
        } else if (trimmedLine.startsWith('-') && inListMode && currentKey === 'tags') {
            // List item for tags
            const tagValue = trimmedLine.substring(1).trim();
            if (tagValue) {
                if (!frontmatter.tags) {
                    frontmatter.tags = [];
                }
                // Remove quotes and hash symbols if present
                const cleanTag = tagValue.replace(/^['"]|['"]$/g, '').replace(/^#/, '');
                frontmatter.tags.push(cleanTag);
            }
        }
    }

    return frontmatter;
}

/**
 * Parse tags from a value string
 * Supports formats:
 * - "tag1, tag2, tag3"
 * - "[tag1, tag2, tag3]"
 * - "tag1 tag2 tag3"
 * - "#tag1 #tag2 #tag3"
 */
function parseTagsValue(value: string): string[] {
    // Remove brackets if present
    value = value.replace(/^\[|\]$/g, '').trim();

    // Split by comma or space
    const tags = value.split(/[,\s]+/)
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .map(tag => {
            // Remove quotes and leading # if present
            return tag.replace(/^['"]|['"]$/g, '').replace(/^#/, '');
        });

    return tags;
}

/**
 * Extract tags from note content (either from frontmatter or inline #tags)
 * This function combines frontmatter tags with inline hashtags found in the content
 */
export function extractAllTags(content: string): string[] {
    const tags = new Set<string>();

    // Get frontmatter tags
    const frontmatter = parseFrontmatter(content);
    if (frontmatter.tags) {
        frontmatter.tags.forEach(tag => tags.add(tag));
    }

    // Also extract inline #tags from content
    const tagPattern = /#([a-zA-Z0-9_-]+)/g;
    let match;
    while ((match = tagPattern.exec(content)) !== null) {
        tags.add(match[1]);
    }

    return Array.from(tags);
}

/**
 * Check if content has frontmatter
 */
export function hasFrontmatter(content: string): boolean {
    return content.trimStart().startsWith('---');
}

/**
 * Get the content without frontmatter
 */
export function getContentWithoutFrontmatter(content: string): string {
    if (!hasFrontmatter(content)) {
        return content;
    }

    const lines = content.split('\n');
    let frontmatterEnd = -1;
    let foundFirst = false;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
            if (!foundFirst) {
                foundFirst = true;
            } else {
                frontmatterEnd = i;
                break;
            }
        }
    }

    if (frontmatterEnd === -1) {
        return content;
    }

    // Return content after frontmatter
    return lines.slice(frontmatterEnd + 1).join('\n');
}
