import * as path from 'path';
import { readFile, readDirectoryWithTypes, pathExists } from './fileSystemService';
import { extractTagsFromContent, extractAllTagsWithPositions } from '../utils/tagHelpers';
import { SUPPORTED_EXTENSIONS } from '../constants';
import { Tag, Location, RangeUtils } from '../types/tags';

/**
 * Represents a tag with metadata
 */
export interface TagInfo {
  name: string;
  count: number;
  notes: string[];
}

/**
 * Type for tag sort order
 */
export type TagSortOrder = 'frequency' | 'alphabetical';

/**
 * Service for managing tag indexing and retrieval
 * Now supports location-based tag storage with precise positioning
 */
export class TagService {
  // NEW: Location-based storage instead of just file paths
  private tagIndex: Map<string, Location<Tag>[]> = new Map();
  private notesPath: string;

  constructor(notesPath: string) {
    this.notesPath = notesPath;
  }

  /**
   * Build the tag index by scanning all notes in the notes directory
   */
  async buildTagIndex(): Promise<void> {
    this.clearCache();

    if (!(await pathExists(this.notesPath))) {
      return;
    }

    await this.scanDirectory(this.notesPath);
  }

  /**
   * Recursively scan a directory and extract tags from note files
   */
  private async scanDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await readDirectoryWithTypes(dirPath);

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (SUPPORTED_EXTENSIONS.includes(ext)) {
            await this.extractTagsFromFile(fullPath);
          }
        }
      }
    } catch (error) {
      // Silently ignore directory read errors (e.g., permissions, non-existent)
      console.error(`[NOTED] Error scanning directory: ${dirPath}`, error);
    }
  }

  /**
   * Extract tags from a single file and add to index
   * NEW: Now extracts tags with their exact positions
   */
  private async extractTagsFromFile(filePath: string): Promise<void> {
    try {
      const content = await readFile(filePath);
      const tags = extractAllTagsWithPositions(content);

      for (const tag of tags) {
        const location: Location<Tag> = {
          uri: filePath,
          range: tag.range,
          data: tag
        };

        if (!this.tagIndex.has(tag.label)) {
          this.tagIndex.set(tag.label, []);
        }
        this.tagIndex.get(tag.label)!.push(location);
      }
    } catch (error) {
      // Silently ignore file read errors
      console.error(`[NOTED] Error reading file for tags: ${filePath}`, error);
    }
  }

  /**
   * Get all tags for a specific note file
   */
  getTagsForNote(notePath: string): string[] {
    const tags: string[] = [];

    for (const [tag, locations] of this.tagIndex.entries()) {
      // Check if any location is for this note
      if (locations.some(loc => loc.uri === notePath)) {
        tags.push(tag);
      }
    }

    return tags;
  }

  /**
   * Get all note file paths that contain a specific tag
   */
  getNotesWithTag(tag: string): string[] {
    const normalizedTag = tag.toLowerCase();
    const locations = this.tagIndex.get(normalizedTag);

    if (!locations) {
      return [];
    }

    // Extract unique file paths from locations
    const uniqueNotes = new Set<string>();
    for (const location of locations) {
      uniqueNotes.add(location.uri);
    }

    return Array.from(uniqueNotes);
  }

  /**
   * Get all note file paths that contain ALL specified tags (AND logic)
   */
  getNotesWithTags(tags: string[]): string[] {
    if (tags.length === 0) {
      return [];
    }

    // Get notes for first tag
    const normalizedTags = tags.map(t => t.toLowerCase());
    let result = new Set(this.getNotesWithTag(normalizedTags[0]));

    // Intersect with notes for remaining tags
    for (let i = 1; i < normalizedTags.length; i++) {
      const notesWithTag = new Set(this.getNotesWithTag(normalizedTags[i]));
      result = new Set([...result].filter(note => notesWithTag.has(note)));
    }

    return Array.from(result);
  }

  /**
   * Get all tags with metadata, sorted by specified order
   */
  getAllTags(sortOrder: TagSortOrder = 'frequency'): TagInfo[] {
    const tags: TagInfo[] = [];

    for (const [tag, locations] of this.tagIndex.entries()) {
      // Extract unique file paths
      const uniqueNotes = new Set<string>();
      for (const location of locations) {
        uniqueNotes.add(location.uri);
      }

      tags.push({
        name: tag,
        count: uniqueNotes.size,
        notes: Array.from(uniqueNotes)
      });
    }

    // Sort based on specified order
    if (sortOrder === 'frequency') {
      tags.sort((a, b) => {
        // Sort by count descending, then by name ascending
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.name.localeCompare(b.name);
      });
    } else {
      tags.sort((a, b) => a.name.localeCompare(b.name));
    }

    return tags;
  }

  /**
   * Clear the tag index cache
   */
  clearCache(): void {
    this.tagIndex.clear();
  }

  /**
   * Get the total number of unique tags
   */
  getTagCount(): number {
    return this.tagIndex.size;
  }

  /**
   * Check if a tag exists in the index
   */
  hasTag(tag: string): boolean {
    return this.tagIndex.has(tag.toLowerCase());
  }

  /**
   * Update the tag index for a specific file (incremental update)
   * Removes old tags for this file and re-indexes it
   */
  async updateIndexForFile(filePath: string): Promise<void> {
    // First, remove all locations associated with this file
    for (const [tag, locations] of this.tagIndex.entries()) {
      const filteredLocations = locations.filter(loc => loc.uri !== filePath);

      if (filteredLocations.length === 0) {
        // Remove tag from index if it has no more locations
        this.tagIndex.delete(tag);
      } else {
        // Update the locations array
        this.tagIndex.set(tag, filteredLocations);
      }
    }

    // Now re-index the file with its current tags
    await this.extractTagsFromFile(filePath);
  }

  /**
   * Update the notes path and rebuild the tag index
   * Used when the notes folder location changes
   */
  async updateNotesPath(newPath: string): Promise<void> {
    this.notesPath = newPath;
    await this.buildTagIndex();
  }

  // ============================================================================
  // NEW: Location-based query methods for hierarchical tag panel
  // ============================================================================

  /**
   * Get all locations for a specific tag
   * NEW: Returns Location<Tag>[] with exact positions
   */
  getLocationsForTag(tag: string): Location<Tag>[] {
    const normalizedTag = tag.toLowerCase();
    return this.tagIndex.get(normalizedTag) || [];
  }

  /**
   * Get all locations for a specific tag in a specific file
   * NEW: For showing line references in the tree
   */
  getLocationsForTagInFile(tag: string, filePath: string): Location<Tag>[] {
    const locations = this.getLocationsForTag(tag);
    return locations.filter(loc => loc.uri === filePath);
  }

  /**
   * Get tag at a specific position in a file
   * NEW: For F2 rename support - detect if cursor is on a tag
   */
  getTagAtPosition(filePath: string, line: number, character: number): { tag: string; location: Location<Tag> } | null {
    for (const [tagLabel, locations] of this.tagIndex.entries()) {
      for (const location of locations) {
        if (location.uri === filePath && RangeUtils.containsPosition(location.range, { line, character })) {
          return { tag: tagLabel, location };
        }
      }
    }
    return null;
  }

  /**
   * Get total number of references for a tag (counting all occurrences, not just unique files)
   * NEW: For showing reference counts in tree
   */
  getTagReferenceCount(tag: string): number {
    const normalizedTag = tag.toLowerCase();
    const locations = this.tagIndex.get(normalizedTag);
    return locations ? locations.length : 0;
  }

  /**
   * Get all unique tags (for root level of tree)
   */
  getAllTagLabels(): string[] {
    return Array.from(this.tagIndex.keys());
  }

  /**
   * Get the raw tag index (for debugging or advanced use)
   */
  getTagIndex(): Map<string, Location<Tag>[]> {
    return this.tagIndex;
  }
}
