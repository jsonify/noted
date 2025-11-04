/**
 * Tag utility functions for parsing, validating, and formatting note tags
 * Now supports hierarchical tags with '/' separator (e.g., project/frontend)
 * and position tracking for inline navigation
 */

import { Tag, Position, Range, RangeUtils } from '../types/tags';

/**
 * Regular expression for matching valid tags
 * - Must start with a letter
 * - Can contain lowercase letters, numbers, hyphens, and forward slashes
 * - Cannot have consecutive hyphens
 * - Cannot start or end with a hyphen
 * - Supports hierarchical tags with '/' separator (e.g., project/frontend)
 */
const TAG_PATTERN = /^[a-z](?:[a-z0-9]|-(?=[a-z0-9]))*(?:\/[a-z](?:[a-z0-9]|-(?=[a-z0-9]))*)*$/;

/**
 * Regular expression for extracting tags from content
 * Matches hash-prefixed tags in the format #tag-name or #parent/child
 * Ensures tags are followed by whitespace or end of string
 */
const TAG_EXTRACT_PATTERN = /#([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*(?=\s|$)/gi;

/**
 * Regular expression for extracting frontmatter section
 * Matches YAML frontmatter between --- delimiters at the start of the file
 */
const FRONTMATTER_PATTERN = /^---\s*\n([\s\S]*?)\n---/;

/**
 * Regular expression for extracting tags from frontmatter
 * Matches both array format: tags: [tag1, tag2] and list format with #: tags: #tag1 #tag2
 */
const FRONTMATTER_TAGS_PATTERN = /^tags:\s*\[([^\]]+)\]/im;

/**
 * Extract tags from YAML frontmatter
 * @param content The note content to parse
 * @returns Array of tag names from frontmatter
 */
function extractTagsFromFrontmatter(content: string): string[] {
  const tags: string[] = [];

  // Check if content has frontmatter
  const frontmatterMatch = FRONTMATTER_PATTERN.exec(content);
  if (!frontmatterMatch) {
    return tags;
  }

  const frontmatter = frontmatterMatch[1];

  // Extract tags from array format: tags: [tag1, tag2, tag3]
  const arrayMatch = FRONTMATTER_TAGS_PATTERN.exec(frontmatter);
  if (arrayMatch) {
    const tagsList = arrayMatch[1];
    // Split by comma and clean up each tag
    const tagItems = tagsList.split(',').map(t => t.trim());

    for (const tag of tagItems) {
      // Remove quotes if present and normalize
      const cleanTag = tag.replace(/^['"]|['"]$/g, '').trim();
      const normalized = normalizeTag(cleanTag);
      if (normalized && isValidTag(normalized)) {
        tags.push(normalized);
      }
    }
  }

  return tags;
}

/**
 * Extract tags from note content (searches entire content for inline tags)
 * @param content The note content to parse
 * @returns Array of unique, normalized tag names (without # prefix)
 */
export function extractTagsFromContent(content: string): string[] {
  if (!content || content.trim().length === 0) {
    return [];
  }

  // Extract all tags from the entire content
  const tags = new Set<string>();

  // First, extract tags from frontmatter (YAML array format)
  const frontmatterTags = extractTagsFromFrontmatter(content);
  frontmatterTags.forEach(tag => tags.add(tag));

  // Then extract inline hashtag-style tags from the entire content
  let match;
  TAG_EXTRACT_PATTERN.lastIndex = 0; // Reset regex state
  while ((match = TAG_EXTRACT_PATTERN.exec(content)) !== null) {
    const tag = match[1].toLowerCase();
    if (isValidTag(tag)) {
      tags.add(tag);
    }
  }

  return Array.from(tags);
}

/**
 * Validate if a string is a valid tag name
 * @param tag The tag to validate (without # prefix)
 * @returns true if valid, false otherwise
 */
export function isValidTag(tag: string): boolean {
  if (!tag || tag.length === 0) {
    return false;
  }

  return TAG_PATTERN.test(tag);
}

/**
 * Format a tag for display with hash prefix
 * @param tag The tag to format
 * @returns Tag with # prefix
 */
export function formatTagForDisplay(tag: string): string {
  if (tag.startsWith('#')) {
    return tag;
  }
  return `#${tag}`;
}

/**
 * Format a tag for storage (normalized, lowercase, no prefix)
 * @param tag The tag to format (may include # prefix)
 * @returns Normalized tag without # prefix
 */
export function formatTagForStorage(tag: string): string {
  return normalizeTag(tag);
}

/**
 * Normalize a tag to lowercase, remove prefix, and trim whitespace
 * @param tag The tag to normalize
 * @returns Normalized tag
 */
export function normalizeTag(tag: string): string {
  let normalized = tag.trim();

  // Remove hash prefix if present
  if (normalized.startsWith('#')) {
    normalized = normalized.substring(1);
  }

  // Convert to lowercase
  normalized = normalized.toLowerCase();

  return normalized;
}

// ============================================================================
// NEW: Position-based tag extraction functions
// ============================================================================

/**
 * Extract inline #hashtags with their exact positions
 * @param content The note content to parse
 * @returns Array of Tag objects with labels and ranges
 */
export function extractInlineHashtagsWithPositions(content: string): Tag[] {
  const tags: Tag[] = [];

  if (!content || content.trim().length === 0) {
    return tags;
  }

  // Split content into lines for position tracking
  const lines = content.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];

    // Reset regex state for each line
    TAG_EXTRACT_PATTERN.lastIndex = 0;
    let match;

    while ((match = TAG_EXTRACT_PATTERN.exec(line)) !== null) {
      const tagLabel = match[1].toLowerCase();

      if (isValidTag(tagLabel)) {
        // match.index points to the '#' character
        const startChar = match.index;
        const endChar = startChar + match[0].length; // Full match length including '#'

        const range = RangeUtils.createRangeFromCoords(
          lineIndex,
          startChar,
          lineIndex,
          endChar
        );

        tags.push({
          label: tagLabel,
          range: range
        });
      }
    }
  }

  return tags;
}

/**
 * Extract tags from YAML frontmatter with their exact positions
 * Supports both inline array format and block list format:
 * - Inline: tags: [tag1, tag2, tag3]
 * - Block list:
 *   tags:
 *     - tag1
 *     - tag2
 * @param content The note content to parse
 * @returns Array of Tag objects with labels and ranges
 */
export function extractFrontmatterTagsWithPositions(content: string): Tag[] {
  const tags: Tag[] = [];

  // Check if content has frontmatter
  const frontmatterMatch = FRONTMATTER_PATTERN.exec(content);
  if (!frontmatterMatch) {
    return tags;
  }

  const frontmatter = frontmatterMatch[1];
  const frontmatterStartLine = 1; // Line after first "---"
  const frontmatterLines = frontmatter.split('\n');

  // Try to extract tags from inline array format: tags: [tag1, tag2, tag3]
  const arrayMatch = FRONTMATTER_TAGS_PATTERN.exec(frontmatter);

  if (arrayMatch) {
    // Inline array format found
    let tagsLineIndex = -1;
    let tagsLineContent = '';

    for (let i = 0; i < frontmatterLines.length; i++) {
      if (frontmatterLines[i].includes('tags:')) {
        tagsLineIndex = i;
        tagsLineContent = frontmatterLines[i];
        break;
      }
    }

    if (tagsLineIndex !== -1) {
      const absoluteLineNumber = frontmatterStartLine + tagsLineIndex;
      const tagsList = arrayMatch[1];
      const tagItems = tagsList.split(',').map(t => t.trim());

      // Find each tag's position within the line
      let searchStart = tagsLineContent.indexOf('[') + 1;

      for (const tag of tagItems) {
        // Remove quotes if present
        const cleanTag = tag.replace(/^['"]|['"]$/g, '').trim();
        const normalized = normalizeTag(cleanTag);

        if (normalized && isValidTag(normalized)) {
          // Find the tag's position in the line
          const tagStart = tagsLineContent.indexOf(cleanTag, searchStart);

          if (tagStart !== -1) {
            const range = RangeUtils.createRangeFromCoords(
              absoluteLineNumber,
              tagStart,
              absoluteLineNumber,
              tagStart + cleanTag.length
            );

            tags.push({
              label: normalized,
              range: range
            });

            searchStart = tagStart + cleanTag.length;
          }
        }
      }
    }
  } else {
    // Try block list format:
    // tags:
    //   - tag1
    //   - tag2
    let inTagsBlock = false;
    let tagsLineFound = false;

    for (let i = 0; i < frontmatterLines.length; i++) {
      const line = frontmatterLines[i];
      const trimmedLine = line.trim();

      // Check if this is the "tags:" line
      if (/^tags:\s*$/.test(trimmedLine)) {
        inTagsBlock = true;
        tagsLineFound = true;
        continue;
      }

      // If we're in the tags block, look for list items
      if (inTagsBlock) {
        // Check if this is a list item: "  - tag" or "- tag"
        const listItemMatch = /^\s*-\s+(.+)$/.exec(line);

        if (listItemMatch) {
          const tagText = listItemMatch[1].trim();
          // Remove quotes if present
          const cleanTag = tagText.replace(/^['"]|['"]$/g, '');
          const normalized = normalizeTag(cleanTag);

          if (normalized && isValidTag(normalized)) {
            // Find the tag's position in the line
            const dashIndex = line.indexOf('-');
            const tagStart = line.indexOf(cleanTag, dashIndex + 1);

            if (tagStart !== -1) {
              const absoluteLineNumber = frontmatterStartLine + i;
              const range = RangeUtils.createRangeFromCoords(
                absoluteLineNumber,
                tagStart,
                absoluteLineNumber,
                tagStart + cleanTag.length
              );

              tags.push({
                label: normalized,
                range: range
              });
            }
          }
        } else if (trimmedLine && !trimmedLine.startsWith('-')) {
          // Non-list-item, non-empty line - we've left the tags block
          break;
        }
      }
    }
  }

  return tags;
}

/**
 * Extract all tags (frontmatter + inline hashtags) with their exact positions
 * This is the main function to use for tag extraction with positions
 * @param content The note content to parse
 * @returns Array of Tag objects with labels and ranges
 */
export function extractAllTagsWithPositions(content: string): Tag[] {
  const allTags: Tag[] = [];

  // Extract frontmatter tags
  const frontmatterTags = extractFrontmatterTagsWithPositions(content);
  allTags.push(...frontmatterTags);

  // Extract inline hashtags
  const inlineTags = extractInlineHashtagsWithPositions(content);
  allTags.push(...inlineTags);

  return allTags;
}

// ============================================================================
// Hierarchical tag utility functions
// ============================================================================

/**
 * Split a hierarchical tag into its path components
 * @param tag Tag to split (e.g., "project/frontend/react")
 * @returns Array of path segments ["project", "frontend", "react"]
 */
export function splitTagPath(tag: string): string[] {
  if (!tag || tag.length === 0) {
    return [];
  }

  return tag.split('/').filter(segment => segment.length > 0);
}

/**
 * Get all parent tags in the hierarchy
 * @param tag Tag to get parents for (e.g., "project/frontend/react")
 * @returns Array of parent tags ["project", "project/frontend", "project/frontend/react"]
 */
export function getTagHierarchy(tag: string): string[] {
  const segments = splitTagPath(tag);
  const hierarchy: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const parentTag = segments.slice(0, i + 1).join('/');
    hierarchy.push(parentTag);
  }

  return hierarchy;
}

/**
 * Check if a tag is a child of another tag
 * @param tag Tag to check
 * @param parent Potential parent tag
 * @returns true if tag is a child of parent
 */
export function isChildTag(tag: string, parent: string): boolean {
  if (!tag || !parent) {
    return false;
  }

  // A tag is a child if it starts with "parent/"
  return tag.startsWith(parent + '/') && tag.length > parent.length + 1;
}

/**
 * Get the immediate parent of a tag
 * @param tag Tag to get parent for (e.g., "project/frontend/react")
 * @returns Parent tag or null if no parent (e.g., "project/frontend")
 */
export function getParentTag(tag: string): string | null {
  const segments = splitTagPath(tag);

  if (segments.length <= 1) {
    return null;
  }

  return segments.slice(0, -1).join('/');
}

/**
 * Get all child tags from a list of tags
 * @param tags Array of all tags
 * @param parent Parent tag to find children for
 * @returns Array of child tags
 */
export function getChildTags(tags: string[], parent: string): string[] {
  return tags.filter(tag => isChildTag(tag, parent));
}
