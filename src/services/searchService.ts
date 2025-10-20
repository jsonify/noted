import * as vscode from 'vscode';
import * as path from 'path';
import { SUPPORTED_EXTENSIONS } from '../constants';
import { getNotesPath } from './configService';
import { pathExists, readFile, readDirectoryWithTypes, getFileStats } from './fileSystemService';
import { TagService } from './tagService';

/**
 * Search options for advanced filtering
 */
export interface SearchOptions {
    query: string;
    useRegex?: boolean;
    caseSensitive?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
    tags?: string[];
    maxResults?: number;
}

/**
 * Search result with metadata
 */
export interface SearchResult {
    file: string;
    preview: string;
    matches: number;
    modified: Date;
    tags: string[];
}

/**
 * Parse search query for special filters
 * Supports:
 * - tag:tagname - Filter by tag
 * - from:YYYY-MM-DD - Filter by date from
 * - to:YYYY-MM-DD - Filter by date to
 * - regex: - Use regex mode
 * - case: - Case sensitive mode
 */
export function parseSearchQuery(query: string): SearchOptions {
    const options: SearchOptions = {
        query: query,
        tags: []
    };

    // Extract tag filters
    const tagPattern = /tag:(\S+)/gi;
    let match;
    while ((match = tagPattern.exec(query)) !== null) {
        options.tags!.push(match[1].toLowerCase().trim());
    }

    // Extract date filters
    const fromMatch = /from:(\d{4}-\d{2}-\d{2})/i.exec(query);
    if (fromMatch) {
        options.dateFrom = new Date(fromMatch[1]);
    }

    const toMatch = /to:(\d{4}-\d{2}-\d{2})/i.exec(query);
    if (toMatch) {
        options.dateTo = new Date(toMatch[1]);
    }

    // Check for regex mode
    if (/regex:/i.test(query)) {
        options.useRegex = true;
    }

    // Check for case sensitive mode
    if (/case:/i.test(query)) {
        options.caseSensitive = true;
    }

    // Remove all filter keywords from query
    options.query = query
        .replace(/tag:\S+/gi, '')
        .replace(/from:\d{4}-\d{2}-\d{2}/gi, '')
        .replace(/to:\d{4}-\d{2}-\d{2}/gi, '')
        .replace(/regex:/gi, '')
        .replace(/case:/gi, '')
        .trim();

    return options;
}

/**
 * Advanced search with regex support, date filtering, and tag filtering
 */
export async function advancedSearch(
    options: SearchOptions,
    tagService?: TagService,
    customNotesPath?: string
): Promise<SearchResult[]> {
    const notesPath = customNotesPath || getNotesPath();
    if (!notesPath || !(await pathExists(notesPath))) {
        return [];
    }

    // Filter by tags first if provided
    let tagFilteredFiles: Set<string> | null = null;
    if (options.tags && options.tags.length > 0 && tagService) {
        const notesWithTags = tagService.getNotesWithTags(options.tags);
        tagFilteredFiles = new Set(notesWithTags);
        if (tagFilteredFiles.size === 0) {
            return [];
        }
    }

    const results: SearchResult[] = [];
    const hasTextSearch = options.query.length > 0;

    // Prepare regex pattern if needed
    let searchPattern: RegExp | null = null;
    if (hasTextSearch) {
        if (options.useRegex) {
            try {
                const flags = options.caseSensitive ? 'g' : 'gi';
                searchPattern = new RegExp(options.query, flags);
            } catch (error) {
                throw new Error(`Invalid regex pattern: ${error instanceof Error ? error.message : String(error)}`);
            }
        } else {
            // Escape special regex characters for literal search
            const escaped = options.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const flags = options.caseSensitive ? 'g' : 'gi';
            searchPattern = new RegExp(escaped, flags);
        }
    }

    async function searchDir(dir: string): Promise<void> {
        try {
            const entries = await readDirectoryWithTypes(dir);

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    await searchDir(fullPath);
                } else if (SUPPORTED_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
                    // Skip if not in tag filter
                    if (tagFilteredFiles && !tagFilteredFiles.has(fullPath)) {
                        continue;
                    }

                    try {
                        const stat = await getFileStats(fullPath);

                        // Apply date filters
                        if (options.dateFrom && stat.mtime < options.dateFrom) {
                            continue;
                        }
                        if (options.dateTo && stat.mtime > options.dateTo) {
                            continue;
                        }

                        const content = await readFile(fullPath);

                        // Apply text search if specified
                        if (hasTextSearch && searchPattern) {
                            const matches = content.match(searchPattern);
                            if (!matches || matches.length === 0) {
                                continue;
                            }

                            // Generate preview showing first match
                            const lines = content.split('\n');
                            const matchLine = lines.find(l => searchPattern!.test(l));
                            const preview = matchLine?.trim().substring(0, 100) || '';

                            // Extract tags from content
                            const tagsLine = lines.find(l => l.toLowerCase().trim().startsWith('tags:'));
                            const fileTags = tagsLine
                                ? tagsLine.substring(5).split(',').map(t => t.trim()).filter(t => t)
                                : [];

                            results.push({
                                file: fullPath,
                                preview: preview,
                                matches: matches.length,
                                modified: stat.mtime,
                                tags: fileTags
                            });
                        } else if (!hasTextSearch) {
                            // No text search, just collect files matching other filters
                            const lines = content.split('\n');
                            const tagsLine = lines.find(l => l.toLowerCase().trim().startsWith('tags:'));
                            const preview = tagsLine?.trim().substring(0, 100) || '';
                            const fileTags = tagsLine
                                ? tagsLine.substring(5).split(',').map(t => t.trim()).filter(t => t)
                                : [];

                            results.push({
                                file: fullPath,
                                preview: preview,
                                matches: 0,
                                modified: stat.mtime,
                                tags: fileTags
                            });
                        }

                        // Stop if max results reached
                        if (options.maxResults && results.length >= options.maxResults) {
                            return;
                        }
                    } catch (error) {
                        console.error('[NOTED] Error processing file:', fullPath, error);
                    }
                }
            }
        } catch (error) {
            console.error('[NOTED] Error reading directory:', dir, error);
        }
    }

    await searchDir(notesPath);

    // Sort by modification date (newest first)
    results.sort((a, b) => b.modified.getTime() - a.modified.getTime());

    return results;
}

/**
 * Get recent notes for quick switcher
 */
export async function getRecentNotes(limit: number = 10, customNotesPath?: string): Promise<SearchResult[]> {
    const notesPath = customNotesPath || getNotesPath();
    if (!notesPath || !(await pathExists(notesPath))) {
        return [];
    }

    const results: SearchResult[] = [];

    async function collectFiles(dir: string): Promise<void> {
        try {
            const entries = await readDirectoryWithTypes(dir);

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    await collectFiles(fullPath);
                } else if (SUPPORTED_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
                    try {
                        const stat = await getFileStats(fullPath);
                        const content = await readFile(fullPath);

                        // Get first non-empty line as preview
                        const lines = content.split('\n');
                        const previewLine = lines.find(l => l.trim().length > 0);
                        const preview = previewLine?.trim().substring(0, 100) || '';

                        // Extract tags
                        const tagsLine = lines.find(l => l.toLowerCase().trim().startsWith('tags:'));
                        const fileTags = tagsLine
                            ? tagsLine.substring(5).split(',').map(t => t.trim()).filter(t => t)
                            : [];

                        results.push({
                            file: fullPath,
                            preview: preview,
                            matches: 0,
                            modified: stat.mtime,
                            tags: fileTags
                        });
                    } catch (error) {
                        console.error('[NOTED] Error processing file:', fullPath, error);
                    }
                }
            }
        } catch (error) {
            console.error('[NOTED] Error reading directory:', dir, error);
        }
    }

    await collectFiles(notesPath);

    // Sort by modification date (newest first) and limit
    results.sort((a, b) => b.modified.getTime() - a.modified.getTime());
    return results.slice(0, limit);
}
