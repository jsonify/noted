/**
 * SemanticSearchEngine
 * AI-powered semantic search using VS Code LLM API
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { SmartSearchResult, MatchInfo, SemanticSearchConfig } from './types';
import { readFile, getFileStats } from '../services/fileSystemService';

export class SemanticSearchEngine {
    private config: SemanticSearchConfig;

    constructor(config?: Partial<SemanticSearchConfig>) {
        this.config = {
            enabled: config?.enabled ?? true,
            maxCandidates: config?.maxCandidates ?? 20,
            truncateContent: config?.truncateContent ?? 3000,
            minConfidence: config?.minConfidence ?? 0.5,
        };
    }

    /**
     * Check if Copilot/LLM is available
     */
    async isAvailable(): Promise<boolean> {
        try {
            const models = await vscode.lm.selectChatModels({
                vendor: 'copilot',
                family: 'gpt-4o',
            });
            return models.length > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Perform semantic search on a list of note files
     */
    async search(
        query: string,
        noteFiles: string[],
        options: {
            maxResults?: number;
            progressCallback?: (current: number, total: number) => void;
        } = {}
    ): Promise<SmartSearchResult[]> {
        if (!this.config.enabled) {
            return [];
        }

        // Select model once at the beginning
        const models = await vscode.lm.selectChatModels({
            vendor: 'copilot',
            family: 'gpt-4o',
        });

        if (models.length === 0) {
            throw new Error('Copilot LLM is not available. Please sign in to GitHub Copilot.');
        }

        const model = models[0];
        const results: SmartSearchResult[] = [];
        const maxResults = options.maxResults || this.config.maxCandidates;
        const filesToProcess = noteFiles.slice(0, maxResults);
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 3;

        for (let i = 0; i < filesToProcess.length; i++) {
            const filePath = filesToProcess[i];

            try {
                const content = await readFile(filePath);
                const score = await this.scoreRelevance(query, content, filePath, model);

                // Reset error counter on success
                if (score > 0) {
                    consecutiveErrors = 0;
                }

                if (score >= this.config.minConfidence) {
                    const preview = await this.generatePreview(query, content, model);
                    const stats = await getFileStats(filePath);
                    const fileName = path.basename(filePath);

                    results.push({
                        filePath,
                        fileName,
                        score,
                        matchType: 'semantic',
                        matches: [
                            {
                                type: 'semantic',
                                text: preview,
                                confidence: score,
                            },
                        ],
                        preview,
                        metadata: {
                            created: stats.birthtime,
                            modified: stats.mtime,
                            tags: [],
                        },
                    });
                }

                if (options.progressCallback) {
                    options.progressCallback(i + 1, filesToProcess.length);
                }
            } catch (error) {
                consecutiveErrors++;
                console.error(`[NOTED] Error processing file ${filePath}:`, error);

                // If we hit too many consecutive errors, LLM might be rate-limited or unavailable
                if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    throw new Error(
                        `Semantic search failed after ${consecutiveErrors} consecutive errors. ` +
                        `This might be due to rate limiting or API issues. Last error: ${errorMsg}`
                    );
                }
            }
        }

        // Sort by score (highest first)
        results.sort((a, b) => b.score - a.score);

        return results;
    }

    /**
     * Score how relevant a note is to the search query using LLM
     */
    private async scoreRelevance(
        query: string,
        content: string,
        filePath: string,
        model: vscode.LanguageModelChat
    ): Promise<number> {
        try {
            // Truncate content if too long
            const truncated = content.substring(0, this.config.truncateContent);

            const prompt = `Rate how relevant this note is to the search query on a scale of 0.0 to 1.0.

Query: "${query}"

Note content:
${truncated}

Return ONLY a number between 0.0 and 1.0. Return 0.0 if not relevant at all, 1.0 if highly relevant.
Consider semantic meaning, not just keyword matches.
Examples: 0.95, 0.67, 0.12, 0.0`;

            const messages = [vscode.LanguageModelChatMessage.User(prompt)];
            const response = await model.sendRequest(
                messages,
                {},
                new vscode.CancellationTokenSource().token
            );

            let fullResponse = '';
            for await (const fragment of response.text) {
                fullResponse += fragment;
            }

            // Parse the score
            const scoreText = fullResponse.trim();
            const score = parseFloat(scoreText);

            if (isNaN(score)) {
                console.warn(`[NOTED] Invalid score from LLM: "${scoreText}" for ${path.basename(filePath)}`);
                return 0;
            }

            return Math.min(Math.max(score, 0), 1);
        } catch (error) {
            console.error('[NOTED] Error scoring relevance:', error);
            return 0;
        }
    }

    /**
     * Generate a preview/excerpt from the note that's relevant to the query
     */
    private async generatePreview(
        query: string,
        content: string,
        model: vscode.LanguageModelChat
    ): Promise<string> {
        try {
            const truncated = content.substring(0, this.config.truncateContent);

            const prompt = `Extract the most relevant 1-2 sentence excerpt from this note that matches the query.

Query: "${query}"

Note:
${truncated}

Return ONLY the excerpt, no explanation. Maximum 150 characters.
If nothing is relevant, return the first sentence of the note.`;

            const messages = [vscode.LanguageModelChatMessage.User(prompt)];
            const response = await model.sendRequest(
                messages,
                {},
                new vscode.CancellationTokenSource().token
            );

            let fullResponse = '';
            for await (const fragment of response.text) {
                fullResponse += fragment;
            }

            const preview = fullResponse.trim().substring(0, 150);
            return preview || this.fallbackPreview(content);
        } catch (error) {
            console.error('[NOTED] Error generating preview:', error);
            return this.fallbackPreview(content);
        }
    }

    /**
     * Fallback preview when LLM is unavailable
     */
    private fallbackPreview(content: string, maxLength: number = 150): string {
        const lines = content.split('\n');
        const firstNonEmpty = lines.find(l => l.trim().length > 0);
        return firstNonEmpty?.substring(0, maxLength).trim() + '...' || '';
    }

    /**
     * Explain why a note matched the query (for debugging/UI)
     */
    async explainMatch(query: string, content: string): Promise<string> {
        try {
            const models = await vscode.lm.selectChatModels({
                vendor: 'copilot',
                family: 'gpt-4o',
            });

            if (models.length === 0) {
                return 'LLM not available';
            }

            const truncated = content.substring(0, this.config.truncateContent);

            const prompt = `Explain in 1-2 sentences why this note is relevant to the search query.

Query: "${query}"

Note:
${truncated}

Provide a brief explanation focusing on conceptual relevance.`;

            const messages = [vscode.LanguageModelChatMessage.User(prompt)];
            const response = await models[0].sendRequest(
                messages,
                {},
                new vscode.CancellationTokenSource().token
            );

            let fullResponse = '';
            for await (const fragment of response.text) {
                fullResponse += fragment;
            }

            return fullResponse.trim();
        } catch (error) {
            console.error('[NOTED] Error explaining match:', error);
            return 'Error generating explanation';
        }
    }
}
