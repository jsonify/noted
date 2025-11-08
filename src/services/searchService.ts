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
 * Parse dynamic date keywords into actual dates
 * Supports:
 * - TODAY - Current date
 * - YESTERDAY - One day ago
 * - LAST N DAYS - N days ago to today
 * - THIS WEEK - Start of current week (Sunday) to today
 * - THIS MONTH - Start of current month to today
 * - THIS YEAR - Start of current year to today
 */
function parseDateKeyword(keyword: string): Date | null {
    const upperKeyword = keyword.trim().toUpperCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day

    // TODAY
    if (upperKeyword === 'TODAY') {
        return new Date(today);
    }

    // YESTERDAY
    if (upperKeyword === 'YESTERDAY') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday;
    }

    // LAST N DAYS
    // Note: "LAST 7 DAYS" means today + 6 previous days (7 days total)
    // So we subtract (days - 1) to get the start date
    const lastDaysMatch = upperKeyword.match(/^LAST\s+(\d+)\s+DAYS?$/);
    if (lastDaysMatch) {
        const days = parseInt(lastDaysMatch[1], 10);
        const date = new Date(today);
        date.setDate(date.getDate() - (days - 1));
        return date;
    }

    // THIS WEEK (Sunday to today)
    if (upperKeyword === 'THIS WEEK') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        return startOfWeek;
    }

    // THIS MONTH
    if (upperKeyword === 'THIS MONTH') {
        return new Date(today.getFullYear(), today.getMonth(), 1);
    }

    // THIS YEAR
    if (upperKeyword === 'THIS YEAR') {
        return new Date(today.getFullYear(), 0, 1);
    }

    return null;
}

/**
 * Parse search query for special filters
 * Supports:
 * - tag:tagname - Filter by tag
 * - from:YYYY-MM-DD or from:TODAY or from:LAST 30 DAYS - Filter by date from
 * - to:YYYY-MM-DD or to:TODAY - Filter by date to
 * - regex: - Use regex mode
 * - case: - Case sensitive mode
 *
 * Dynamic date keywords:
 * - TODAY, YESTERDAY
 * - LAST N DAYS (e.g., LAST 7 DAYS, LAST 30 DAYS)
 * - THIS WEEK, THIS MONTH, THIS YEAR
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

    // Extract date filters - support both YYYY-MM-DD and dynamic keywords
    // Use specific regex patterns to match only valid date keywords
    const fromDynamicMatch = /from:(TODAY|YESTERDAY|THIS\s+WEEK|THIS\s+MONTH|THIS\s+YEAR|LAST\s+\d+\s+DAYS?)\b/i.exec(query);
    const fromStaticMatch = /from:(\d{4}-\d{2}-\d{2})/i.exec(query);

    if (fromDynamicMatch) {
        const dynamicDate = parseDateKeyword(fromDynamicMatch[1]);
        if (dynamicDate) {
            options.dateFrom = dynamicDate;
        }
    } else if (fromStaticMatch) {
        options.dateFrom = new Date(fromStaticMatch[1]);
    }

    const toDynamicMatch = /to:(TODAY|YESTERDAY|THIS\s+WEEK|THIS\s+MONTH|THIS\s+YEAR|LAST\s+\d+\s+DAYS?)\b/i.exec(query);
    const toStaticMatch = /to:(\d{4}-\d{2}-\d{2})/i.exec(query);

    if (toDynamicMatch) {
        const dynamicDate = parseDateKeyword(toDynamicMatch[1]);
        if (dynamicDate) {
            options.dateTo = dynamicDate;
        }
    } else if (toStaticMatch) {
        options.dateTo = new Date(toStaticMatch[1]);
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
        .replace(/from:(?:TODAY|YESTERDAY|THIS\s+WEEK|THIS\s+MONTH|THIS\s+YEAR|LAST\s+\d+\s+DAYS?)\b/gi, '') // Dynamic keywords
        .replace(/from:\d{4}-\d{2}-\d{2}/gi, '') // Static dates
        .replace(/to:(?:TODAY|YESTERDAY|THIS\s+WEEK|THIS\s+MONTH|THIS\s+YEAR|LAST\s+\d+\s+DAYS?)\b/gi, '') // Dynamic keywords
        .replace(/to:\d{4}-\d{2}-\d{2}/gi, '') // Static dates
        .replace(/regex:/gi, '')
        .replace(/case:/gi, '')
        .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
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
    console.log('[NOTED DEBUG advancedSearch] Called with options:', options);

    const notesPath = customNotesPath || getNotesPath();
    console.log('[NOTED DEBUG advancedSearch] Notes path:', notesPath);

    if (!notesPath || !(await pathExists(notesPath))) {
        console.log('[NOTED DEBUG advancedSearch] Notes path does not exist');
        return [];
    }

    // Filter by tags first if provided
    let tagFilteredFiles: Set<string> | null = null;
    if (options.tags && options.tags.length > 0 && tagService) {
        const notesWithTags = tagService.getNotesWithTags(options.tags);
        tagFilteredFiles = new Set(notesWithTags);
        if (tagFilteredFiles.size === 0) {
            console.log('[NOTED DEBUG advancedSearch] No files match tag filter');
            return [];
        }
    }

    const results: SearchResult[] = [];
    const hasTextSearch = options.query.length > 0;
    console.log('[NOTED DEBUG advancedSearch] hasTextSearch:', hasTextSearch, 'query:', options.query);

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
            // Split multi-word queries and search for any keyword
            // "authentication issues" becomes /(authentication|issues)/gi
            const keywords = options.query.trim().split(/\s+/).filter(k => k.length > 0);
            if (keywords.length === 0) {
                return [];
            }

            // Escape special regex characters for each keyword
            const escapedKeywords = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            const pattern = escapedKeywords.length === 1
                ? escapedKeywords[0]
                : `(${escapedKeywords.join('|')})`;
            const flags = options.caseSensitive ? 'g' : 'gi';
            searchPattern = new RegExp(pattern, flags);

            console.log('[NOTED DEBUG advancedSearch] Split query into keywords:', keywords);
            console.log('[NOTED DEBUG advancedSearch] Final search pattern:', searchPattern);
        }
    }

    let filesProcessed = 0;
    let filesWithMatches = 0;

    async function searchDir(dir: string): Promise<void> {
        try {
            const entries = await readDirectoryWithTypes(dir);

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    await searchDir(fullPath);
                } else if (SUPPORTED_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
                    filesProcessed++;

                    // Skip if not in tag filter
                    if (tagFilteredFiles && !tagFilteredFiles.has(fullPath)) {
                        continue;
                    }

                    try {
                        const stat = await getFileStats(fullPath);

                        // Extract date from filename if it matches YYYY-MM-DD pattern
                        // This ensures date filtering works based on the note's date, not file modification time
                        const basename = path.basename(entry.name, path.extname(entry.name));
                        const dateMatch = basename.match(/^(\d{4}-\d{2}-\d{2})/);
                        const noteDate = dateMatch ? new Date(dateMatch[1]) : stat.mtime;

                        // Apply date filters using note date
                        if (options.dateFrom && noteDate < options.dateFrom) {
                            continue;
                        }
                        if (options.dateTo) {
                            // Set dateTo to end of day to include notes on the "to" date
                            const dateToEndOfDay = new Date(options.dateTo);
                            dateToEndOfDay.setHours(23, 59, 59, 999);
                            if (noteDate > dateToEndOfDay) {
                                continue;
                            }
                        }

                        const content = await readFile(fullPath);

                        // Apply text search if specified
                        if (hasTextSearch && searchPattern) {
                            const matches = content.match(searchPattern);

                            if (filesProcessed <= 2) {
                                // Log first 2 files for debugging
                                console.log(`[NOTED DEBUG advancedSearch] File ${filesProcessed}: ${entry.name}`);
                                console.log(`[NOTED DEBUG advancedSearch]   Content length: ${content.length}`);
                                console.log(`[NOTED DEBUG advancedSearch]   Search pattern: ${searchPattern}`);
                                console.log(`[NOTED DEBUG advancedSearch]   Matches: ${matches ? matches.length : 0}`);
                                if (content.length > 0) {
                                    console.log(`[NOTED DEBUG advancedSearch]   First 200 chars: ${content.substring(0, 200)}`);
                                }
                            }

                            if (!matches || matches.length === 0) {
                                continue;
                            }

                            filesWithMatches++;

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

    console.log('[NOTED DEBUG advancedSearch] Search complete. Processed', filesProcessed, 'files');
    console.log('[NOTED DEBUG advancedSearch] Files with matches:', filesWithMatches);
    console.log('[NOTED DEBUG advancedSearch] Results collected:', results.length);

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
