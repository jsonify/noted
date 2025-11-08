/**
 * QueryAnalyzer
 * Analyzes search queries to determine intent and extract filters
 */

import * as chrono from 'chrono-node';
import { SearchQuery, SearchIntent, SearchFilters, SearchOptions } from './types';

/**
 * Query patterns that suggest semantic search is needed
 */
const QUESTION_WORDS = ['what', 'when', 'where', 'who', 'why', 'how', 'which'];
const SEMANTIC_INDICATORS = [
    'about',
    'related to',
    'similar to',
    'like',
    'regarding',
    'concerning',
    'issues with',
    'problems with',
    'notes on',
    'discussion about',
];

export class QueryAnalyzer {
    /**
     * Analyze a search query and determine the search strategy
     */
    static analyzeQuery(query: string, options?: Partial<SearchOptions>): SearchQuery {
        const filters = this.extractFilters(query);
        const cleanedQuery = this.cleanQuery(query);
        const intent = this.determineIntent(cleanedQuery);
        const semanticQuery = intent !== 'keyword' ? this.cleanForSemantic(cleanedQuery) : undefined;

        return {
            rawQuery: query,
            intent,
            semanticQuery,
            filters,
            options: {
                maxResults: options?.maxResults ?? 20,
                minRelevanceScore: options?.minRelevanceScore ?? 0.5,
                includeContext: options?.includeContext ?? true,
                searchStrategy: options?.searchStrategy ?? 'fast',
            },
        };
    }

    /**
     * Extract all filters from the query
     */
    private static extractFilters(query: string): SearchFilters {
        return {
            dateRange: this.extractDateFilter(query),
            tags: this.extractTags(query),
            templates: this.extractTemplates(query),
            fileFormat: this.extractFileFormat(query),
        };
    }

    /**
     * Extract date range from natural language
     * Supports:
     * - "yesterday", "last week", "last month"
     * - "from:YYYY-MM-DD", "to:YYYY-MM-DD"
     * - "October 15", "last Tuesday"
     */
    private static extractDateFilter(query: string): SearchFilters['dateRange'] {
        const dateRange: { start?: Date; end?: Date } = {};

        // Check for explicit from: and to: filters
        const fromMatch = query.match(/from:(\S+)/i);
        const toMatch = query.match(/to:(\S+)/i);

        if (fromMatch) {
            const parsed = chrono.parseDate(fromMatch[1]);
            if (parsed) {
                dateRange.start = parsed;
            }
        }

        if (toMatch) {
            const parsed = chrono.parseDate(toMatch[1]);
            if (parsed) {
                dateRange.end = parsed;
            }
        }

        // If no explicit filters, look for natural language dates
        if (!fromMatch && !toMatch) {
            // Look for phrases like "last week", "yesterday", etc.
            const relativePatterns = [
                /\b(yesterday|today)\b/i,
                /\blast\s+(week|month|year|7\s+days?|30\s+days?)\b/i,
                /\bthis\s+(week|month|year)\b/i,
            ];

            for (const pattern of relativePatterns) {
                const match = query.match(pattern);
                if (match) {
                    const parsed = chrono.parse(match[0]);
                    if (parsed.length > 0) {
                        const result = parsed[0];
                        if (result.start) {
                            dateRange.start = result.start.date();
                        }
                        if (result.end) {
                            dateRange.end = result.end.date();
                        } else {
                            // If no end date, use today
                            dateRange.end = new Date();
                        }
                        break;
                    }
                }
            }
        }

        return Object.keys(dateRange).length > 0 ? dateRange : undefined;
    }

    /**
     * Extract tag references from query
     * Supports: #tag or tag:tagname
     */
    private static extractTags(query: string): string[] {
        const tags: string[] = [];

        // Extract #hashtags
        const hashtagMatches = query.match(/#(\w+)/g);
        if (hashtagMatches) {
            tags.push(...hashtagMatches.map(t => t.substring(1).toLowerCase()));
        }

        // Extract tag:tagname format
        const tagFilterMatches = query.match(/tag:(\S+)/gi);
        if (tagFilterMatches) {
            tags.push(...tagFilterMatches.map(t => t.substring(4).toLowerCase()));
        }

        return tags.length > 0 ? Array.from(new Set(tags)) : [];
    }

    /**
     * Extract template type filters
     * Supports: template:problem-solution, template:meeting, etc.
     */
    private static extractTemplates(query: string): string[] | undefined {
        const templateMatches = query.match(/template:(\S+)/gi);
        if (!templateMatches) {
            return undefined;
        }

        return templateMatches.map(t => t.substring(9).toLowerCase());
    }

    /**
     * Extract file format filter
     * Supports: format:txt, format:md
     */
    private static extractFileFormat(query: string): 'txt' | 'md' | 'both' | undefined {
        const formatMatch = query.match(/format:(txt|md|both)/i);
        if (!formatMatch) {
            return undefined;
        }

        return formatMatch[1].toLowerCase() as 'txt' | 'md' | 'both';
    }

    /**
     * Determine if query needs semantic search
     */
    private static determineIntent(query: string): SearchIntent {
        const lowerQuery = query.toLowerCase().trim();

        // Empty or very short queries - keyword only
        if (lowerQuery.length < 3) {
            return 'keyword';
        }

        // Check for question words at the start
        const startsWithQuestion = QUESTION_WORDS.some(word =>
            lowerQuery.startsWith(word + ' ')
        );

        // Check for semantic indicators
        const hasSemanticIndicator = SEMANTIC_INDICATORS.some(indicator =>
            lowerQuery.includes(indicator)
        );

        // Check if it's a question (ends with ?)
        const isQuestion = lowerQuery.endsWith('?');

        // Check if query has multiple words (suggests conceptual search)
        const wordCount = lowerQuery.split(/\s+/).filter(w => w.length > 0).length;
        const isMultiWord = wordCount >= 3;

        // Decide on intent
        if (startsWithQuestion || isQuestion) {
            return 'semantic'; // Questions always use semantic
        }

        if (hasSemanticIndicator) {
            return 'semantic';
        }

        if (isMultiWord && wordCount >= 4) {
            return 'hybrid'; // Longer phrases use hybrid
        }

        // Default to keyword for short, specific queries
        return 'keyword';
    }

    /**
     * Remove filter syntax from query
     */
    private static cleanQuery(query: string): string {
        return query
            .replace(/from:\S+/gi, '')
            .replace(/to:\S+/gi, '')
            .replace(/tag:\S+/gi, '')
            .replace(/template:\S+/gi, '')
            .replace(/format:\S+/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Clean query for semantic processing
     * Removes hashtags and other non-semantic elements
     */
    private static cleanForSemantic(query: string): string {
        return query
            .replace(/#\w+/g, '') // Remove hashtags
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Check if a query needs semantic search
     */
    static needsSemanticSearch(query: string): boolean {
        const analyzed = this.analyzeQuery(query);
        return analyzed.intent === 'semantic' || analyzed.intent === 'hybrid';
    }
}
