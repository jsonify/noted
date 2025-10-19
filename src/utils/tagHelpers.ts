/**
 * Tag utility functions for parsing, validating, and formatting note tags
 */

/**
 * Regular expression for matching valid tags
 * - Must start with a letter
 * - Can contain lowercase letters, numbers, and hyphens
 * - Cannot have consecutive hyphens
 * - Cannot start or end with a hyphen
 */
const TAG_PATTERN = /^[a-z](?:[a-z0-9]|-(?=[a-z0-9]))*$/;

/**
 * Regular expression for extracting tags from content
 * Matches hash-prefixed tags in the format #tag-name
 * Ensures tags are followed by whitespace or end of string
 */
const TAG_EXTRACT_PATTERN = /#([a-z0-9]+(?:-[a-z0-9]+)*)(?=\s|$)/gi;

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
