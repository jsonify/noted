/**
 * Smart Search Types
 * Type definitions for the enhanced search system
 */

/**
 * Search intent type
 */
export type SearchIntent = 'keyword' | 'semantic' | 'hybrid';

/**
 * Match type for search results
 */
export type MatchType = 'keyword' | 'semantic' | 'both';

/**
 * Search filters for date, tags, and templates
 */
export interface SearchFilters {
    dateRange?: {
        start?: Date;
        end?: Date;
    };
    tags?: string[];
    templates?: ('problem-solution' | 'meeting' | 'research' | 'quick' | string)[];
    fileFormat?: 'txt' | 'md' | 'both';
}

/**
 * Search options for behavior control
 */
export interface SearchOptions {
    maxResults?: number;           // Default: 20
    minRelevanceScore?: number;    // Default: 0.5 (0.0-1.0)
    includeContext?: boolean;      // Show snippets (default: true)
    searchStrategy?: 'fast' | 'thorough'; // Default: 'fast'
}

/**
 * Analyzed search query with extracted intent and filters
 */
export interface SearchQuery {
    rawQuery: string;              // Original user input
    intent: SearchIntent;          // Determined search strategy
    semanticQuery?: string;        // Processed for semantic search
    filters: SearchFilters;
    options: SearchOptions;
}

/**
 * Information about a specific match
 */
export interface MatchInfo {
    type: 'title' | 'content' | 'tag' | 'semantic';
    text: string;                  // Matched text
    lineNumber?: number;
    confidence: number;            // How strong the match (0.0-1.0)
}

/**
 * Enhanced search result with scoring and metadata
 */
export interface SmartSearchResult {
    filePath: string;
    fileName: string;
    score: number;                 // 0.0-1.0 relevance score
    matchType: MatchType;
    matches: MatchInfo[];
    preview: string;               // Context snippet
    metadata: {
        created: Date;
        modified: Date;
        tags?: string[];
        template?: string;
    };
}

/**
 * Configuration for semantic search
 */
export interface SemanticSearchConfig {
    enabled: boolean;
    maxCandidates: number;         // Max notes to score with LLM
    truncateContent: number;       // Max chars per note for LLM
    minConfidence: number;         // Minimum score to include
}
