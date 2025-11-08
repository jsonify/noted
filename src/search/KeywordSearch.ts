/**
 * KeywordSearch
 * Enhanced keyword-based search with relevance scoring
 */

import * as path from 'path';
import Fuse from 'fuse.js';
import { SmartSearchResult, SearchFilters, MatchInfo } from './types';
import { advancedSearch, parseSearchQuery, SearchOptions as LegacySearchOptions } from '../services/searchService';
import { TagService } from '../services/tagService';
import { getFileStats } from '../services/fileSystemService';

export class KeywordSearch {
    private tagService?: TagService;

    constructor(tagService?: TagService) {
        this.tagService = tagService;
    }

    /**
     * Perform keyword search with enhanced scoring
     */
    async search(
        query: string,
        filters: SearchFilters,
        options: {
            maxResults?: number;
            caseSensitive?: boolean;
            useRegex?: boolean;
            useFuzzy?: boolean;
        } = {}
    ): Promise<SmartSearchResult[]> {
        console.log('[NOTED DEBUG KeywordSearch] Called with query:', query);
        console.log('[NOTED DEBUG KeywordSearch] Filters:', filters);
        console.log('[NOTED DEBUG KeywordSearch] Options:', options);

        // Build search options for legacy search
        const legacyOptions: LegacySearchOptions = {
            query,
            useRegex: options.useRegex,
            caseSensitive: options.caseSensitive,
            dateFrom: filters.dateRange?.start,
            dateTo: filters.dateRange?.end,
            tags: filters.tags,
            maxResults: options.maxResults || 50,
        };

        console.log('[NOTED DEBUG KeywordSearch] Legacy options:', legacyOptions);

        // Perform legacy search
        const legacyResults = await advancedSearch(legacyOptions, this.tagService);
        console.log('[NOTED DEBUG KeywordSearch] Legacy search returned:', legacyResults.length, 'results');

        // Convert to SmartSearchResult with scoring
        const results: SmartSearchResult[] = [];

        for (const result of legacyResults) {
            const score = await this.calculateScore(query, result.file, result.preview, result.matches);
            const matches = this.extractMatches(query, result.preview, result.matches);

            // Get file stats for metadata
            const stats = await getFileStats(result.file);
            const fileName = path.basename(result.file);

            results.push({
                filePath: result.file,
                fileName,
                score,
                matchType: 'keyword',
                matches,
                preview: result.preview,
                metadata: {
                    created: stats.birthtime,
                    modified: stats.mtime,
                    tags: result.tags,
                },
            });
        }

        // Sort by score (highest first)
        results.sort((a, b) => b.score - a.score);

        // Apply max results limit
        if (options.maxResults) {
            return results.slice(0, options.maxResults);
        }

        return results;
    }

    /**
     * Perform fuzzy search using Fuse.js
     */
    async fuzzySearch(
        query: string,
        candidates: Array<{ path: string; content: string; fileName: string }>,
        options: { maxResults?: number } = {}
    ): Promise<SmartSearchResult[]> {
        const fuse = new Fuse(candidates, {
            keys: [
                { name: 'fileName', weight: 0.4 },
                { name: 'content', weight: 0.6 },
            ],
            threshold: 0.4, // 0 = perfect match, 1 = match anything
            includeScore: true,
            includeMatches: true,
            minMatchCharLength: 2,
        });

        const fuseResults = fuse.search(query);
        const results: SmartSearchResult[] = [];

        for (const fuseResult of fuseResults.slice(0, options.maxResults || 20)) {
            const item = fuseResult.item;
            const score = 1 - (fuseResult.score || 0); // Invert Fuse score (lower is better)

            const stats = await getFileStats(item.path);

            // Extract preview from content
            const preview = this.generatePreview(item.content, query);

            // Convert Fuse matches to MatchInfo
            const matches: MatchInfo[] = [];
            if (fuseResult.matches) {
                for (const match of fuseResult.matches) {
                    if (match.value) {
                        matches.push({
                            type: match.key === 'fileName' ? 'title' : 'content',
                            text: match.value.substring(0, 100),
                            confidence: score,
                        });
                    }
                }
            }

            results.push({
                filePath: item.path,
                fileName: item.fileName,
                score,
                matchType: 'keyword',
                matches,
                preview,
                metadata: {
                    created: stats.birthtime,
                    modified: stats.mtime,
                    tags: [],
                },
            });
        }

        return results;
    }

    /**
     * Calculate relevance score for a keyword match
     * Factors:
     * - Number of matches
     * - Title matches (boost)
     * - Match density
     * - Recency (slight boost)
     */
    private async calculateScore(
        query: string,
        filePath: string,
        preview: string,
        matchCount: number
    ): Promise<number> {
        let score = 0;

        const fileName = path.basename(filePath, path.extname(filePath));
        const queryLower = query.toLowerCase();

        // Split multi-word queries into keywords for better scoring
        const keywords = queryLower.trim().split(/\s+/).filter(k => k.length > 0);

        // Factor 1: Match count (normalized to 0-0.4)
        // Increased weight for match count since it's the primary signal
        const matchScore = Math.min(matchCount / 10, 0.4);
        score += matchScore;

        // Factor 2: Title match (0.3 boost per keyword)
        const fileNameLower = fileName.toLowerCase();
        let titleMatchCount = 0;
        for (const keyword of keywords) {
            if (fileNameLower.includes(keyword)) {
                titleMatchCount++;
            }
        }
        if (titleMatchCount > 0) {
            // Boost based on proportion of keywords matched in title
            score += 0.3 * (titleMatchCount / keywords.length);
        }

        // Factor 3: Exact match in title (0.2 additional boost)
        if (fileNameLower === queryLower) {
            score += 0.2;
        }

        // Factor 4: Preview relevance (0-0.3)
        // Count how many keywords appear in preview
        const previewLower = preview.toLowerCase();
        let previewMatchCount = 0;
        for (const keyword of keywords) {
            const matches = (previewLower.match(new RegExp(keyword, 'gi')) || []).length;
            previewMatchCount += matches;
        }
        score += Math.min(previewMatchCount / 5, 0.3);

        // Ensure score is between 0 and 1
        return Math.min(Math.max(score, 0), 1);
    }

    /**
     * Extract match information from search results
     */
    private extractMatches(query: string, preview: string, matchCount: number): MatchInfo[] {
        const matches: MatchInfo[] = [];

        if (matchCount > 0) {
            matches.push({
                type: 'content',
                text: preview,
                confidence: Math.min(matchCount / 10, 1),
            });
        }

        return matches;
    }

    /**
     * Generate a preview snippet around the match
     */
    private generatePreview(content: string, query: string, maxLength: number = 150): string {
        const lowerContent = content.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerContent.indexOf(lowerQuery);

        if (index === -1) {
            // No match found, return first N characters
            return content.substring(0, maxLength).trim() + '...';
        }

        // Find a good start position (beginning of sentence or line)
        let start = Math.max(0, index - 50);
        const beforeMatch = content.substring(start, index);
        const sentenceStart = beforeMatch.lastIndexOf('. ');
        const lineStart = beforeMatch.lastIndexOf('\n');

        if (sentenceStart !== -1) {
            start = start + sentenceStart + 2;
        } else if (lineStart !== -1) {
            start = start + lineStart + 1;
        }

        // Extract preview
        const preview = content.substring(start, start + maxLength).trim();

        // Add ellipsis if needed
        const needsStartEllipsis = start > 0;
        const needsEndEllipsis = start + maxLength < content.length;

        return (
            (needsStartEllipsis ? '...' : '') +
            preview +
            (needsEndEllipsis ? '...' : '')
        );
    }
}
