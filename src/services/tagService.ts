import * as path from 'path';
import { readFile, readDirectoryWithTypes, pathExists } from './fileSystemService';
import { extractTagsFromContent } from '../utils/tagHelpers';
import { SUPPORTED_EXTENSIONS } from '../constants';

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
 */
export class TagService {
  private tagIndex: Map<string, Set<string>> = new Map();
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
   */
  private async extractTagsFromFile(filePath: string): Promise<void> {
    try {
      const content = await readFile(filePath);
      const tags = extractTagsFromContent(content);

      for (const tag of tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(filePath);
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

    for (const [tag, notes] of this.tagIndex.entries()) {
      if (notes.has(notePath)) {
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
    const notes = this.tagIndex.get(normalizedTag);
    return notes ? Array.from(notes) : [];
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

    for (const [tag, notes] of this.tagIndex.entries()) {
      tags.push({
        name: tag,
        count: notes.size,
        notes: Array.from(notes)
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
    // First, remove all tags associated with this file
    for (const [tag, notes] of this.tagIndex.entries()) {
      if (notes.has(filePath)) {
        notes.delete(filePath);
        // Remove tag from index if it has no more notes
        if (notes.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    }

    // Now re-index the file with its current tags
    await this.extractTagsFromFile(filePath);
  }
}
