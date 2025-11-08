/**
 * SearchOrchestrator
 * Coordinates keyword and semantic search for optimal results
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { QueryAnalyzer } from './QueryAnalyzer';
import { KeywordSearch } from './KeywordSearch';
import { SemanticSearchEngine } from './SemanticSearchEngine';
import { SmartSearchResult, SearchQuery } from './types';
import { TagService } from '../services/tagService';
import { getNotesPath } from '../services/configService';
import { pathExists, readDirectoryWithTypes } from '../services/fileSystemService';
import { SUPPORTED_EXTENSIONS } from '../constants';

export class SearchOrchestrator {
    private keywordSearch: KeywordSearch;
    private semanticSearch: SemanticSearchEngine;
    private tagService?: TagService;

    constructor(tagService?: TagService) {
        this.tagService = tagService;
        this.keywordSearch = new KeywordSearch(tagService);
        this.semanticSearch = new SemanticSearchEngine({
            enabled: this.getConfig<boolean>('noted.search.enableSemantic', true),
            maxCandidates: this.getConfig<number>('noted.search.maxCandidates', 20),
            truncateContent: this.getConfig<number>('noted.search.chunkSize', 3000),
            minConfidence: this.getConfig<number>('noted.search.minRelevanceScore', 0.5),
        });
    }

    /**
     * Main search entry point
     * Analyzes query and routes to appropriate search strategy
     */
    async search(
        rawQuery: string,
        options?: {
            progressCallback?: (message: string, increment?: number) => void;
            cancellationToken?: vscode.CancellationToken;
        }
    ): Promise<SmartSearchResult[]> {
        if (!rawQuery || rawQuery.trim().length === 0) {
            return [];
        }

        // Analyze query
        const analyzedQuery = QueryAnalyzer.analyzeQuery(rawQuery, {
            maxResults: this.getConfig<number>('noted.search.maxResults', 20),
            minRelevanceScore: this.getConfig<number>('noted.search.minRelevanceScore', 0.5),
        });

        options?.progressCallback?.('Analyzing query...');

        // Route to appropriate search strategy
        switch (analyzedQuery.intent) {
            case 'keyword':
                return this.keywordOnlySearch(analyzedQuery, options);

            case 'semantic':
                return this.semanticOnlySearch(analyzedQuery, options);

            case 'hybrid':
                return this.hybridSearch(analyzedQuery, options);

            default:
                return this.keywordOnlySearch(analyzedQuery, options);
        }
    }

    /**
     * Keyword-only search (fast path)
     */
    private async keywordOnlySearch(
        query: SearchQuery,
        options?: {
            progressCallback?: (message: string, increment?: number) => void;
            cancellationToken?: vscode.CancellationToken;
        }
    ): Promise<SmartSearchResult[]> {
        options?.progressCallback?.('Collecting notes...', 20);

        // Get all note files and apply comprehensive filtering
        const allFiles = await this.getAllNoteFiles();
        const filteredFiles = await this.applyFilters(allFiles, query.filters);

        options?.progressCallback?.('Searching with keywords...', 50);

        const cleanedQuery = query.semanticQuery || query.rawQuery;

        // Use filtered files for keyword search
        // Pass empty filters to keywordSearch since we already filtered
        const results = await this.keywordSearch.search(cleanedQuery, {
            dateRange: query.filters.dateRange,
            tags: query.filters.tags,
        }, {
            maxResults: query.options.maxResults,
            useFuzzy: this.getConfig<boolean>('noted.search.enableFuzzyMatch', false),
        });

        // Additional filtering by format and template
        let finalResults = results;
        if (query.filters.fileFormat && query.filters.fileFormat !== 'both') {
            const ext = `.${query.filters.fileFormat}`;
            finalResults = finalResults.filter(r => r.filePath.endsWith(ext));
        }

        // Filter by min score
        finalResults = finalResults.filter(r => r.score >= (query.options.minRelevanceScore || 0));

        options?.progressCallback?.('Search complete', 100);
        return finalResults;
    }

    /**
     * Semantic-only search (uses LLM)
     */
    private async semanticOnlySearch(
        query: SearchQuery,
        options?: {
            progressCallback?: (message: string, increment?: number) => void;
            cancellationToken?: vscode.CancellationToken;
        }
    ): Promise<SmartSearchResult[]> {
        // Check if semantic search is available
        const available = await this.semanticSearch.isAvailable();
        if (!available) {
            vscode.window.showWarningMessage(
                'Semantic search requires GitHub Copilot. Falling back to keyword search.'
            );
            return this.keywordOnlySearch(query, options);
        }

        options?.progressCallback?.('Collecting notes...');

        // Get all note files
        const noteFiles = await this.getAllNoteFiles();

        // Apply filters first
        const filtered = await this.applyFilters(noteFiles, query.filters);

        options?.progressCallback?.(`Analyzing ${filtered.length} notes with AI...`, 20);

        // Perform semantic search
        const results = await this.semanticSearch.search(
            query.semanticQuery || query.rawQuery,
            filtered,
            {
                maxResults: query.options.maxResults,
                progressCallback: (current, total) => {
                    const percent = Math.round((current / total) * 80) + 20; // 20-100%
                    options?.progressCallback?.(
                        `Analyzing ${current}/${total} notes...`,
                        percent
                    );
                },
            }
        );

        options?.progressCallback?.('Search complete', 100);
        return results;
    }

    /**
     * Hybrid search (combines keyword pre-filtering with semantic re-ranking)
     * This is the recommended approach for best performance and accuracy
     */
    private async hybridSearch(
        query: SearchQuery,
        options?: {
            progressCallback?: (message: string, increment?: number) => void;
            cancellationToken?: vscode.CancellationToken;
        }
    ): Promise<SmartSearchResult[]> {
        options?.progressCallback?.('Starting hybrid search...', 10);

        // Step 1: Fast keyword pre-filter to get candidates
        const cleanedQuery = query.semanticQuery || query.rawQuery;

        // Use the same comprehensive filtering approach
        const keywordResults = await this.keywordSearch.search(cleanedQuery, {
            dateRange: query.filters.dateRange,
            tags: query.filters.tags,
        }, {
            maxResults: 50, // Get more candidates for semantic re-ranking
        });

        // Apply format and template filtering
        let filteredResults = keywordResults;
        if (query.filters.fileFormat && query.filters.fileFormat !== 'both') {
            const ext = `.${query.filters.fileFormat}`;
            filteredResults = filteredResults.filter(r => r.filePath.endsWith(ext));
        }

        options?.progressCallback?.(`Found ${filteredResults.length} keyword matches`, 30);

        if (filteredResults.length === 0) {
            return [];
        }

        // Step 2: Check if semantic search is available
        const available = await this.semanticSearch.isAvailable();
        if (!available) {
            vscode.window.showInformationMessage(
                'Semantic search unavailable. Showing keyword results only.'
            );
            return filteredResults.slice(0, query.options.maxResults);
        }

        // Step 3: Semantic re-ranking on top candidates
        const maxCandidates = this.getConfig<number>('noted.search.hybridCandidates', 20);
        const topCandidates = filteredResults.slice(0, maxCandidates);

        options?.progressCallback?.(`Re-ranking top ${topCandidates.length} with AI...`, 40);

        const candidateFiles = topCandidates.map(r => r.filePath);
        const semanticResults = await this.semanticSearch.search(
            query.semanticQuery || query.rawQuery,
            candidateFiles,
            {
                maxResults: query.options.maxResults,
                progressCallback: (current, total) => {
                    const percent = Math.round((current / total) * 50) + 40; // 40-90%
                    options?.progressCallback?.(
                        `AI analyzing ${current}/${total} notes...`,
                        percent
                    );
                },
            }
        );

        // Step 4: Merge results
        options?.progressCallback?.('Merging results...', 95);
        const merged = this.mergeResults(filteredResults, semanticResults);

        options?.progressCallback?.('Search complete', 100);
        return merged.slice(0, query.options.maxResults);
    }

    /**
     * Merge and de-duplicate results from keyword and semantic search
     * Combines scores when same file appears in both
     */
    private mergeResults(
        keywordResults: SmartSearchResult[],
        semanticResults: SmartSearchResult[]
    ): SmartSearchResult[] {
        const merged = new Map<string, SmartSearchResult>();

        // Add keyword results
        for (const result of keywordResults) {
            merged.set(result.filePath, result);
        }

        // Merge semantic results
        for (const result of semanticResults) {
            const existing = merged.get(result.filePath);
            if (existing) {
                // Combine scores (weighted average: 40% keyword, 60% semantic)
                const combinedScore = existing.score * 0.4 + result.score * 0.6;
                merged.set(result.filePath, {
                    ...result,
                    score: combinedScore,
                    matchType: 'both',
                    matches: [...existing.matches, ...result.matches],
                });
            } else {
                merged.set(result.filePath, result);
            }
        }

        // Sort by final score
        const results = Array.from(merged.values());
        results.sort((a, b) => b.score - a.score);

        return results;
    }

    /**
     * Apply comprehensive filters to list of note files
     * Handles: date range, file format, tags, and templates
     */
    private async applyFilters(files: string[], filters: any): Promise<string[]> {
        let filtered = files;

        // Filter by date range (extract from filename)
        if (filters.dateRange) {
            filtered = filtered.filter(file => {
                const basename = path.basename(file, path.extname(file));
                const dateMatch = basename.match(/^(\d{4}-\d{2}-\d{2})/);
                if (!dateMatch) return true; // Include files without dates

                const noteDate = new Date(dateMatch[1]);

                if (filters.dateRange.start && noteDate < filters.dateRange.start) {
                    return false;
                }
                if (filters.dateRange.end && noteDate > filters.dateRange.end) {
                    return false;
                }
                return true;
            });
        }

        // Filter by file format
        if (filters.fileFormat && filters.fileFormat !== 'both') {
            const ext = `.${filters.fileFormat}`;
            filtered = filtered.filter(file => file.endsWith(ext));
        }

        // Filter by tags (if tagService is available and tags are specified)
        if (filters.tags && filters.tags.length > 0 && this.tagService) {
            const notesWithTags = this.tagService.getNotesWithTags(filters.tags);
            const taggedSet = new Set(notesWithTags);
            filtered = filtered.filter(file => taggedSet.has(file));
        }

        // Filter by template type (check file content for template patterns)
        if (filters.templates && filters.templates.length > 0) {
            const { readFile } = await import('../services/fileSystemService');
            const templateFiltered: string[] = [];

            for (const file of filtered) {
                try {
                    const content = await readFile(file);
                    const hasTemplate = filters.templates.some((template: string) => {
                        return this.detectTemplate(content, template);
                    });

                    if (hasTemplate) {
                        templateFiltered.push(file);
                    }
                } catch (error) {
                    // If we can't read the file, skip it
                    console.error(`[NOTED] Error reading file for template filter: ${file}`, error);
                }
            }

            filtered = templateFiltered;
        }

        return filtered;
    }

    /**
     * Detect if content matches a specific template type
     */
    private detectTemplate(content: string, templateType: string): boolean {
        const lowerContent = content.toLowerCase();

        switch (templateType.toLowerCase()) {
            case 'problem-solution':
                return lowerContent.includes('problem:') && lowerContent.includes('solution:');

            case 'meeting':
                return lowerContent.includes('attendees:') ||
                       (lowerContent.includes('meeting') && lowerContent.includes('agenda'));

            case 'research':
                return lowerContent.includes('research') &&
                       (lowerContent.includes('questions:') || lowerContent.includes('findings:'));

            case 'quick':
                // Quick notes are harder to detect - just check for basic date header
                return /^\d{4}-\d{2}-\d{2}/.test(content);

            default:
                // For custom templates, just check if the template name appears
                return lowerContent.includes(templateType.toLowerCase());
        }
    }

    /**
     * Get all note files recursively
     */
    private async getAllNoteFiles(): Promise<string[]> {
        const notesPath = getNotesPath();
        if (!notesPath || !(await pathExists(notesPath))) {
            return [];
        }

        const files: string[] = [];

        async function collectFiles(dir: string): Promise<void> {
            try {
                const entries = await readDirectoryWithTypes(dir);

                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);

                    if (entry.isDirectory()) {
                        // Skip .templates folder
                        if (entry.name !== '.templates') {
                            await collectFiles(fullPath);
                        }
                    } else if (SUPPORTED_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
                        files.push(fullPath);
                    }
                }
            } catch (error) {
                console.error('[NOTED] Error reading directory:', dir, error);
            }
        }

        await collectFiles(notesPath);
        return files;
    }

    /**
     * Get configuration value
     */
    private getConfig<T>(key: string, defaultValue: T): T {
        return vscode.workspace.getConfiguration().get<T>(key, defaultValue);
    }
}
