import * as vscode from 'vscode';
import { readFile } from './fileSystemService';
import * as crypto from 'crypto';

/**
 * Options for note summarization
 */
export interface SummaryOptions {
    maxLength?: 'short' | 'medium' | 'long';
    format?: 'paragraph' | 'bullets' | 'structured';
    includeActionItems?: boolean;
    includeKeywords?: boolean;
}

/**
 * Cached summary data structure
 */
interface CachedSummary {
    filePath: string;
    summary: string;
    generatedAt: Date;
    fileModifiedAt: Date;
    options: SummaryOptions;
}

/**
 * Service for AI-powered note summarization using VS Code Language Model API
 */
export class SummarizationService {
    private context: vscode.ExtensionContext;
    private cache: Map<string, CachedSummary> = new Map();
    private static readonly CACHE_KEY = 'noted.summaryCache';
    private static readonly MAX_CACHE_SIZE = 100;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadCache();
    }

    /**
     * Check if Language Model API is available (Copilot)
     */
    private async isLanguageModelAvailable(): Promise<boolean> {
        try {
            const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
            return models && models.length > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get word count target based on length setting
     */
    private getWordCount(length: 'short' | 'medium' | 'long'): number {
        switch (length) {
            case 'short': return 50;
            case 'medium': return 150;
            case 'long': return 300;
            default: return 150;
        }
    }

    /**
     * Build prompt for single note summarization
     */
    private buildSingleNotePrompt(content: string, options: SummaryOptions): string {
        const wordCount = this.getWordCount(options.maxLength || 'medium');
        const format = options.format || 'structured';

        let prompt = `You are analyzing a note from a developer's workspace note-taking system.
Provide a concise summary of the following note.

Note content:
---
${content}
---

Summary requirements:
- Length: ${options.maxLength || 'medium'} (approximately ${wordCount} words)
- Format: ${format}
- Focus on: main topics, key decisions, action items, and outcomes`;

        if (options.includeActionItems) {
            prompt += '\n- Extract action items as a bulleted list';
        }

        if (options.includeKeywords) {
            prompt += '\n- Include 3-5 relevant keywords/tags';
        }

        prompt += '\n\nProvide only the summary without preamble.';

        return prompt;
    }

    /**
     * Build prompt for multiple notes summarization
     */
    private buildMultiNotePrompt(notes: { path: string; date: string; content: string }[], options: SummaryOptions): string {
        const format = options.format || 'structured';
        const dateRange = this.getDateRange(notes);

        let notesText = notes.map(note => `
### ${note.date} - ${note.path}
${note.content}
`).join('\n');

        let prompt = `You are analyzing multiple notes from a developer's workspace spanning ${dateRange}.
Provide a cohesive summary that synthesizes the content across all notes.

Notes:
${notesText}

Summary requirements:
- Identify common themes and patterns
- Highlight key accomplishments and decisions
- Note any open questions or unresolved issues
- Organize chronologically when relevant
- Format: ${format}`;

        if (options.includeActionItems) {
            prompt += '\n- Extract all action items across notes';
        }

        prompt += '\n\nProvide only the summary without preamble.';

        return prompt;
    }

    /**
     * Get date range description for multi-note summary
     */
    private getDateRange(notes: { path: string; date: string; content: string }[]): string {
        if (notes.length === 0) return 'no dates';

        const validDates = notes
            .map(n => new Date(n.date))
            .filter(d => !isNaN(d.getTime()))
            .sort((a, b) => a.getTime() - b.getTime());

        if (validDates.length === 0) return 'an unknown date range';
        if (validDates.length === 1) return validDates[0].toLocaleDateString();

        const start = validDates[0].toLocaleDateString();
        const end = validDates[validDates.length - 1].toLocaleDateString();

        return start === end ? start : `${start} to ${end}`;
    }

    /**
     * Generate cache key from file path and modification time
     */
    private async getCacheKey(filePath: string, options: SummaryOptions): Promise<string> {
        const stat = await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
        const optionsStr = JSON.stringify(options);
        return crypto.createHash('md5').update(`${filePath}:${stat.mtime}:${optionsStr}`).digest('hex');
    }

    /**
     * Load cache from extension global state
     */
    private loadCache(): void {
        try {
            const cached = this.context.globalState.get<Record<string, any>>(SummarizationService.CACHE_KEY);
            if (cached) {
                const hydratedCache = new Map<string, CachedSummary>();
                for (const [key, value] of Object.entries(cached)) {
                    hydratedCache.set(key, {
                        ...value,
                        generatedAt: new Date(value.generatedAt),
                        fileModifiedAt: new Date(value.fileModifiedAt),
                    });
                }
                this.cache = hydratedCache;
            }
        } catch (error) {
            console.error('Failed to load summary cache:', error);
        }
    }

    /**
     * Save cache to extension global state
     */
    private async saveCache(): Promise<void> {
        try {
            const cacheObj = Object.fromEntries(this.cache.entries());
            await this.context.globalState.update(SummarizationService.CACHE_KEY, cacheObj);
        } catch (error) {
            console.error('Failed to save summary cache:', error);
        }
    }

    /**
     * Evict oldest entries if cache exceeds max size (LRU)
     */
    private evictOldestIfNeeded(): void {
        if (this.cache.size > SummarizationService.MAX_CACHE_SIZE) {
            const entries = Array.from(this.cache.entries());
            entries.sort((a, b) => a[1].generatedAt.getTime() - b[1].generatedAt.getTime());
            const toRemove = entries.slice(0, this.cache.size - SummarizationService.MAX_CACHE_SIZE);
            toRemove.forEach(([key]) => this.cache.delete(key));
        }
    }

    /**
     * Get configuration for summarization
     */
    private getConfig(): SummaryOptions {
        const config = vscode.workspace.getConfiguration('noted.ai');
        return {
            maxLength: config.get<'short' | 'medium' | 'long'>('summaryLength', 'medium'),
            format: config.get<'paragraph' | 'bullets' | 'structured'>('summaryFormat', 'structured'),
            includeActionItems: config.get<boolean>('includeActionItems', true),
            includeKeywords: false // Not yet in config
        };
    }

    /**
     * Check if AI features are enabled
     */
    private isAIEnabled(): boolean {
        const config = vscode.workspace.getConfiguration('noted.ai');
        return config.get<boolean>('enabled', true);
    }

    /**
     * Summarize a single note
     */
    async summarizeNote(filePath: string, options?: SummaryOptions): Promise<string> {
        // Check if AI is enabled
        if (!this.isAIEnabled()) {
            throw new Error('AI summarization is disabled. Enable it in settings: noted.ai.enabled');
        }

        // Check if Language Model API is available
        if (!(await this.isLanguageModelAvailable())) {
            throw new Error('GitHub Copilot is not available. Please install and enable GitHub Copilot to use AI summarization features.');
        }

        // Merge options with defaults
        const finalOptions: SummaryOptions = {
            ...this.getConfig(),
            ...options
        };

        // Check cache first if enabled
        const config = vscode.workspace.getConfiguration('noted.ai');
        const cacheEnabled = config.get<boolean>('cacheEnabled', true);

        if (cacheEnabled) {
            const cacheKey = await this.getCacheKey(filePath, finalOptions);
            const cached = this.cache.get(cacheKey);

            if (cached) {
                return cached.summary;
            }
        }

        // Read file content
        const content = await readFile(filePath);

        // Truncate if too large (rough estimate: 4 chars per token, max 4000 tokens for input)
        const maxChars = 16000;
        const truncatedContent = content.length > maxChars
            ? content.substring(0, maxChars) + '\n\n[Note truncated for summarization]'
            : content;

        // Build prompt
        const prompt = this.buildSingleNotePrompt(truncatedContent, finalOptions);

        // Call Language Model API
        try {
            const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
            if (!models || models.length === 0) {
                throw new Error('No Copilot models available');
            }

            const model = models[0];
            const messages = [vscode.LanguageModelChatMessage.User(prompt)];

            const response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);

            let summary = '';
            for await (const chunk of response.text) {
                summary += chunk;
            }

            // Cache the result
            if (cacheEnabled) {
                const stat = await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
                const cacheKey = await this.getCacheKey(filePath, finalOptions);

                this.cache.set(cacheKey, {
                    filePath,
                    summary,
                    generatedAt: new Date(),
                    fileModifiedAt: new Date(stat.mtime),
                    options: finalOptions
                });

                this.evictOldestIfNeeded();
                await this.saveCache();
            }

            return summary;

        } catch (error) {
            throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Summarize multiple notes
     */
    async summarizeNotes(filePaths: string[], options?: SummaryOptions): Promise<string> {
        // Check if AI is enabled
        if (!this.isAIEnabled()) {
            throw new Error('AI summarization is disabled. Enable it in settings: noted.ai.enabled');
        }

        // Check if Language Model API is available
        if (!(await this.isLanguageModelAvailable())) {
            throw new Error('GitHub Copilot is not available. Please install and enable GitHub Copilot to use AI summarization features.');
        }

        // Merge options with defaults
        const finalOptions: SummaryOptions = {
            ...this.getConfig(),
            ...options
        };

        // Read all notes
        const notes = await Promise.all(
            filePaths.map(async (filePath) => {
                const content = await readFile(filePath);
                const basename = filePath.split(/[\\/]/).pop() || filePath;
                const dateMatch = basename.match(/(\d{4}-\d{2}-\d{2})/);
                const date = dateMatch ? dateMatch[1] : 'Unknown date';

                return { path: basename, date, content };
            })
        );

        // Build prompt
        const prompt = this.buildMultiNotePrompt(notes, finalOptions);

        // Call Language Model API
        try {
            const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
            if (!models || models.length === 0) {
                throw new Error('No Copilot models available');
            }

            const model = models[0];
            const messages = [vscode.LanguageModelChatMessage.User(prompt)];

            const response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);

            let summary = '';
            for await (const chunk of response.text) {
                summary += chunk;
            }

            return summary;

        } catch (error) {
            throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get cached summary for a file
     */
    async getCachedSummary(filePath: string): Promise<string | null> {
        const config = this.getConfig();
        const cacheKey = await this.getCacheKey(filePath, config);
        const cached = this.cache.get(cacheKey);

        if (cached) {
            return cached.summary;
        }

        return null;
    }

    /**
     * Clear cache for specific file or all files
     */
    async clearCache(filePath?: string): Promise<void> {
        if (filePath) {
            // Clear cache for specific file (all option variants)
            const keysToDelete: string[] = [];
            for (const [key, cached] of this.cache.entries()) {
                if (cached.filePath === filePath) {
                    keysToDelete.push(key);
                }
            }
            keysToDelete.forEach(key => this.cache.delete(key));
        } else {
            // Clear all cache
            this.cache.clear();
        }

        await this.saveCache();
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; maxSize: number } {
        return {
            size: this.cache.size,
            maxSize: SummarizationService.MAX_CACHE_SIZE
        };
    }
}
