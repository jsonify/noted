import * as vscode from 'vscode';
import { NoteTag } from './TagParser';
import * as crypto from 'crypto';
import { selectAIModel } from '../services/aiModelService';

/**
 * Cache entry for tag generation results
 */
interface TagCacheEntry {
    filePath: string;
    contentHash: string;
    tags: NoteTag[];
    generatedAt: Date;
}

/**
 * TagGenerator uses VS Code's LLM API to generate intelligent tag suggestions
 */
export class TagGenerator {
    private cache: Map<string, TagCacheEntry> = new Map();
    private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds

    /**
     * Generate tags for note content using AI
     * @param content - The note content to analyze
     * @param filePath - Optional file path for caching
     * @param maxTags - Maximum number of tags to generate
     * @returns Array of suggested tags with confidence scores
     */
    async generateTags(content: string, filePath?: string, maxTags?: number): Promise<NoteTag[]> {
        // Get maxTags from config if not provided
        if (maxTags === undefined) {
            const config = vscode.workspace.getConfiguration('noted');
            maxTags = config.get<number>('tagging.maxTags', 5);
        }

        // Check cache if filePath provided
        if (filePath && this.cache.has(filePath)) {
            const cached = this.cache.get(filePath)!;
            const contentHash = this.hashContent(content);

            // Return cached tags if content hasn't changed and cache is fresh
            if (cached.contentHash === contentHash &&
                (Date.now() - cached.generatedAt.getTime()) < this.CACHE_TTL) {
                return cached.tags;
            }
        }

        try {
            // Check if tagging is enabled
            const config = vscode.workspace.getConfiguration('noted');
            const taggingEnabled = config.get<boolean>('tagging.enabled', true);

            if (!taggingEnabled) {
                return [];
            }

            // Select the appropriate language model using shared service
            const model = await selectAIModel();

            // Build the prompt
            const prompt = this.buildTagPrompt(content, maxTags);

            // Create messages for the LLM
            const messages = [
                vscode.LanguageModelChatMessage.User(prompt)
            ];

            // Send request with cancellation support
            const cancellationToken = new vscode.CancellationTokenSource().token;
            const response = await model.sendRequest(messages, {}, cancellationToken);

            // Collect the full response
            let fullResponse = '';
            for await (const fragment of response.text) {
                fullResponse += fragment;
            }

            // Parse the response into tags
            const tags = this.parseTagResponse(fullResponse);

            // Cache the results if filePath provided
            if (filePath && tags.length > 0) {
                this.cache.set(filePath, {
                    filePath,
                    contentHash: this.hashContent(content),
                    tags,
                    generatedAt: new Date()
                });
            }

            return tags;
        } catch (error) {
            if (error instanceof Error) {
                console.error('Error generating tags:', error);
                throw error;
            }
            throw new Error('Unknown error occurred while generating tags');
        }
    }

    /**
     * Build the prompt for the LLM
     * @param content - Note content
     * @param maxTags - Maximum number of tags
     * @returns Formatted prompt string
     */
    private buildTagPrompt(content: string, maxTags: number): string {
        const categories = this.getCategories();

        // Limit content length to avoid token limits (approx 4000 characters = 1000 tokens)
        const truncatedContent = content.length > 4000
            ? content.substring(0, 4000) + '...'
            : content;

        return `Analyze the following developer note and suggest up to ${maxTags} relevant tags.

AVAILABLE TAG CATEGORIES:
${categories.join(', ')}

NOTE CONTENT:
${truncatedContent}

Return ONLY a JSON array of tags with confidence scores. Format:
[
  {"tag": "bug", "confidence": 0.95},
  {"tag": "authentication", "confidence": 0.87}
]

Rules:
- Use lowercase, hyphenated tags (e.g., "code-review" not "Code Review")
- Focus on technical topics, technologies, and note types
- Confidence: 0.0-1.0 (only suggest tags with >0.6 confidence)
- Prefer specific tags over generic ones
- Consider the note structure (problem/solution, meeting, research, etc.)
- Avoid suggesting excluded patterns: ${this.getExcludePatterns().join(', ')}

Return ONLY the JSON array, no other text.`;
    }

    /**
     * Get tag categories from configuration
     * @returns Array of tag categories
     */
    private getCategories(): string[] {
        const config = vscode.workspace.getConfiguration('noted');
        const custom = config.get<string[]>('tagging.customCategories', []);

        const defaults = [
            // Note Types
            'bug', 'feature', 'idea', 'meeting', 'research', 'learning',
            'problem-solving', 'code-review', 'documentation', 'retrospective',

            // Technologies
            'typescript', 'javascript', 'react', 'node', 'python', 'java',
            'vscode', 'api', 'database', 'testing', 'docker', 'kubernetes',

            // Topics
            'performance', 'security', 'ui-ux', 'architecture',
            'deployment', 'debugging', 'refactoring', 'optimization',

            // Status
            'todo', 'in-progress', 'resolved', 'blocked', 'on-hold'
        ];

        return [...defaults, ...custom];
    }

    /**
     * Get exclude patterns from configuration
     * @returns Array of patterns to exclude
     */
    private getExcludePatterns(): string[] {
        const config = vscode.workspace.getConfiguration('noted');
        return config.get<string[]>('tagging.excludePatterns', ['draft', 'temp']);
    }

    /**
     * Parse LLM response into NoteTag objects
     * @param response - Raw LLM response
     * @returns Array of NoteTag objects
     */
    private parseTagResponse(response: string): NoteTag[] {
        try {
            // Remove markdown code blocks if present
            const cleaned = response
                .replace(/```json\n?/gi, '')
                .replace(/```\n?/g, '')
                .trim();

            // Parse JSON
            const parsed = JSON.parse(cleaned);

            if (!Array.isArray(parsed)) {
                console.error('LLM response is not an array:', response);
                return [];
            }

            // Convert to NoteTag objects
            const excludePatterns = this.getExcludePatterns();
            const tags: NoteTag[] = [];

            for (const item of parsed) {
                if (!item.tag || typeof item.tag !== 'string') {
                    continue;
                }

                const tagName = item.tag.toLowerCase().trim();
                const confidence = typeof item.confidence === 'number' ? item.confidence : 0.7;

                // Skip tags with low confidence
                if (confidence <= 0.6) {
                    continue;
                }

                // Skip excluded patterns
                if (excludePatterns.some(pattern => tagName.includes(pattern))) {
                    continue;
                }

                tags.push({
                    name: tagName,
                    confidence,
                    source: 'ai',
                    addedAt: new Date()
                });
            }

            return tags;
        } catch (error) {
            console.error('Failed to parse tag response:', error);
            console.error('Response was:', response);
            return [];
        }
    }

    /**
     * Hash content for cache invalidation
     * @param content - Content to hash
     * @returns SHA-256 hash
     */
    private hashContent(content: string): string {
        return crypto
            .createHash('sha256')
            .update(content)
            .digest('hex');
    }

    /**
     * Check if content needs retagging
     * @param filePath - File path
     * @param content - Current content
     * @returns true if retagging is needed
     */
    needsRetagging(filePath: string, content: string): boolean {
        const cached = this.cache.get(filePath);
        if (!cached) {
            return true;
        }

        const currentHash = this.hashContent(content);
        if (cached.contentHash !== currentHash) {
            return true;
        }

        // Check if cache is stale
        const age = Date.now() - cached.generatedAt.getTime();
        return age >= this.CACHE_TTL;
    }

    /**
     * Clear the entire cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Clear cache for a specific file
     */
    clearFileCache(filePath: string): void {
        this.cache.delete(filePath);
    }

    /**
     * Get default tag categories (for documentation/help)
     * @returns Object with categorized default tags
     */
    static getDefaultCategories(): { [category: string]: string[] } {
        return {
            'Note Types': [
                'bug', 'feature', 'idea', 'meeting', 'research', 'learning',
                'problem-solving', 'code-review', 'documentation', 'retrospective'
            ],
            'Technologies': [
                'typescript', 'javascript', 'react', 'node', 'python', 'java',
                'vscode', 'api', 'database', 'testing', 'docker', 'kubernetes'
            ],
            'Topics': [
                'performance', 'security', 'ui-ux', 'architecture',
                'deployment', 'debugging', 'refactoring', 'optimization'
            ],
            'Status': [
                'todo', 'in-progress', 'resolved', 'blocked', 'on-hold'
            ]
        };
    }
}

// Export singleton instance
export const tagGenerator = new TagGenerator();
