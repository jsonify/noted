import * as vscode from 'vscode';
import * as path from 'path';
import { getNotesPath } from './configService';
import { readFile, writeFile, readDirectoryWithTypes } from './fileSystemService';

/**
 * Prompt template data structure
 */
export interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    prompt: string;
    variables: string[];
    builtIn?: boolean;
}

/**
 * Variables available for replacement in prompt templates
 */
export interface PromptVariables {
    content: string;
    length: string;
    format: string;
    filename: string;
    date?: string;
    noteCount?: number;
}

/**
 * Service for managing custom prompt templates
 */
export class PromptTemplateService {
    private context: vscode.ExtensionContext;
    private static readonly PROMPTS_FOLDER = '.noted-templates/prompts';
    private static readonly LAST_USED_KEY = 'noted.lastUsedPromptTemplate';

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * Get the path to the prompts folder
     */
    private getPromptsPath(): string | null {
        const notesPath = getNotesPath();
        if (!notesPath) {
            return null;
        }
        return path.join(notesPath, PromptTemplateService.PROMPTS_FOLDER);
    }

    /**
     * Ensure the prompts folder exists
     */
    private async ensurePromptsFolder(): Promise<string> {
        const promptsPath = this.getPromptsPath();
        if (!promptsPath) {
            throw new Error('Notes folder not configured');
        }

        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(promptsPath));
        } catch {
            // Folder doesn't exist, create it
            await vscode.workspace.fs.createDirectory(vscode.Uri.file(promptsPath));
        }

        return promptsPath;
    }

    /**
     * Get built-in example templates
     */
    getBuiltInTemplates(): PromptTemplate[] {
        return [
            {
                id: 'default',
                name: 'Default',
                description: 'Standard balanced summary with key points and action items',
                prompt: `You are analyzing a note from a developer's workspace note-taking system.
Provide a concise summary of the following note.

Note content:
---
{content}
---

Summary requirements:
- Length: {length} (approximately {wordCount} words)
- Format: {format}
- Focus on: main topics, key decisions, action items, and outcomes

{actionItemsPrompt}

{keywordsPrompt}

Provide only the summary without preamble.`,
                variables: ['content', 'length', 'format', 'wordCount', 'actionItemsPrompt', 'keywordsPrompt'],
                builtIn: true
            },
            {
                id: 'technical-deep-dive',
                name: 'Technical Deep Dive',
                description: 'Focus on technical details, architecture, and implementation',
                prompt: `You are analyzing a technical note from a developer's workspace.
Provide a technical deep dive summary that focuses on implementation details and architecture.

Note content:
---
{content}
---

Analysis requirements:
- Length: {length}
- Format: {format}
- Focus on:
  - Technical decisions and architectural choices
  - Implementation details and code patterns
  - Technologies, frameworks, and tools mentioned
  - System design and data flow
  - Performance considerations
  - Technical challenges and solutions

{actionItemsPrompt}

{keywordsPrompt}

Provide only the summary without preamble. Use technical terminology and be specific.`,
                variables: ['content', 'length', 'format', 'actionItemsPrompt', 'keywordsPrompt'],
                builtIn: true
            },
            {
                id: 'meeting-summary',
                name: 'Meeting Summary',
                description: 'Focus on decisions, action items, and attendees',
                prompt: `You are analyzing meeting notes from a developer's workspace.
Provide a structured meeting summary focusing on outcomes and follow-ups.

Meeting notes:
---
{content}
---

Summary requirements:
- Length: {length}
- Format: {format}
- Structure:
  1. Meeting Overview: Date, attendees, purpose
  2. Key Decisions: Important choices made
  3. Discussion Points: Main topics covered
  4. Action Items: Tasks assigned with owners and deadlines
  5. Follow-up: Next steps and future meetings

{actionItemsPrompt}

{keywordsPrompt}

Provide only the summary without preamble. Be concise and action-oriented.`,
                variables: ['content', 'length', 'format', 'actionItemsPrompt', 'keywordsPrompt'],
                builtIn: true
            },
            {
                id: 'code-review',
                name: 'Code Review',
                description: 'Focus on code changes, issues, and improvements',
                prompt: `You are analyzing code review notes from a developer's workspace.
Provide a structured code review summary focusing on changes and feedback.

Code review notes:
---
{content}
---

Summary requirements:
- Length: {length}
- Format: {format}
- Structure:
  1. Changes Overview: What was changed and why
  2. Code Quality: Code structure, patterns, and best practices
  3. Issues Found: Bugs, security concerns, performance problems
  4. Suggestions: Improvements and recommendations
  5. Approval Status: Ready to merge, needs changes, or blocked

{actionItemsPrompt}

{keywordsPrompt}

Provide only the summary without preamble. Be specific about code issues and improvements.`,
                variables: ['content', 'length', 'format', 'actionItemsPrompt', 'keywordsPrompt'],
                builtIn: true
            },
            {
                id: 'brainstorm',
                name: 'Brainstorm Session',
                description: 'Focus on ideas, possibilities, and creative solutions',
                prompt: `You are analyzing brainstorming notes from a developer's workspace.
Provide a creative summary that captures ideas and possibilities.

Brainstorming notes:
---
{content}
---

Summary requirements:
- Length: {length}
- Format: {format}
- Structure:
  1. Problem Statement: What challenge is being addressed
  2. Ideas Generated: All ideas mentioned, grouped by theme
  3. Promising Solutions: Most viable or innovative approaches
  4. Trade-offs: Pros and cons of different approaches
  5. Next Steps: How to evaluate or prototype ideas

{actionItemsPrompt}

{keywordsPrompt}

Provide only the summary without preamble. Be open-minded and capture the creative spirit.`,
                variables: ['content', 'length', 'format', 'actionItemsPrompt', 'keywordsPrompt'],
                builtIn: true
            },
            {
                id: 'video-transcript',
                name: 'Video Transcript',
                description: 'Focus on step-by-step tutorials and UI walkthroughs from video content',
                prompt: `You are analyzing a video transcript from a tutorial or walkthrough session.
Provide a structured summary that captures the step-by-step process and UI navigation.

Video transcript:
---
{content}
---

Summary requirements:
- Length: {length}
- Format: {format}
- Structure:
  1. Tutorial Overview: What application/website/feature is being demonstrated
  2. Prerequisites: Any setup or requirements mentioned
  3. Step-by-Step Instructions:
     - Number each step clearly
     - Include specific UI elements (buttons, menus, fields)
     - Note exact navigation paths (e.g., "Settings > Privacy > Data")
     - Capture keyboard shortcuts or special commands
     - Include any warnings or important notes mentioned
  4. Expected Results: What should happen at each step or final outcome
  5. Tips & Tricks: Any additional insights or best practices mentioned
  6. Troubleshooting: Common issues or alternative approaches discussed

{actionItemsPrompt}

{keywordsPrompt}

Provide only the summary without preamble. Be precise with UI element names and navigation paths. Use numbered lists for sequential steps.`,
                variables: ['content', 'length', 'format', 'actionItemsPrompt', 'keywordsPrompt'],
                builtIn: true
            }
        ];
    }

    /**
     * Get all custom templates from the prompts folder
     */
    async getCustomTemplates(): Promise<PromptTemplate[]> {
        const promptsPath = this.getPromptsPath();
        if (!promptsPath) {
            return [];
        }

        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(promptsPath));
        } catch {
            // Folder doesn't exist yet
            return [];
        }

        const templates: PromptTemplate[] = [];

        try {
            const entries = await readDirectoryWithTypes(promptsPath);

            for (const entry of entries) {
                if (entry.name.endsWith('.json') && !entry.isDirectory()) {
                    const templatePath = path.join(promptsPath, entry.name);
                    try {
                        const content = await readFile(templatePath);
                        const template = JSON.parse(content) as PromptTemplate;

                        // Validate template structure
                        if (template.id && template.name && template.prompt) {
                            templates.push({
                                ...template,
                                builtIn: false
                            });
                        }
                    } catch (error) {
                        console.error(`Failed to load template ${entry.name}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to read prompts folder:', error);
        }

        return templates;
    }

    /**
     * Get all templates (built-in + custom)
     */
    async getAllTemplates(): Promise<PromptTemplate[]> {
        const builtIn = this.getBuiltInTemplates();
        const custom = await this.getCustomTemplates();
        return [...builtIn, ...custom];
    }

    /**
     * Get a specific template by ID
     */
    async getTemplate(id: string): Promise<PromptTemplate | null> {
        const templates = await this.getAllTemplates();
        return templates.find(t => t.id === id) || null;
    }

    /**
     * Create a new custom template
     */
    async createTemplate(name: string, description: string, prompt: string): Promise<PromptTemplate> {
        await this.ensurePromptsFolder();

        // Generate ID from name
        const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');

        // Check if template already exists
        const existing = await this.getTemplate(id);
        if (existing) {
            throw new Error(`A template with ID "${id}" already exists`);
        }

        // Extract variables from prompt
        const variables = this.extractVariables(prompt);

        const template: PromptTemplate = {
            id,
            name,
            description,
            prompt,
            variables,
            builtIn: false
        };

        // Save to file
        const promptsPath = this.getPromptsPath();
        if (!promptsPath) {
            throw new Error('Notes folder not configured');
        }

        const templatePath = path.join(promptsPath, `${id}.json`);
        await writeFile(templatePath, JSON.stringify(template, null, 2));

        return template;
    }

    /**
     * Update an existing custom template
     */
    async updateTemplate(id: string, updates: Partial<PromptTemplate>): Promise<void> {
        const template = await this.getTemplate(id);

        if (!template) {
            throw new Error(`Template "${id}" not found`);
        }

        if (template.builtIn) {
            throw new Error('Cannot edit built-in templates');
        }

        // Apply updates
        const updatedTemplate: PromptTemplate = {
            ...template,
            ...updates,
            id: template.id, // ID cannot be changed
            builtIn: false
        };

        // Re-extract variables if prompt changed
        if (updates.prompt) {
            updatedTemplate.variables = this.extractVariables(updates.prompt);
        }

        // Save to file
        const promptsPath = this.getPromptsPath();
        if (!promptsPath) {
            throw new Error('Notes folder not configured');
        }

        const templatePath = path.join(promptsPath, `${id}.json`);
        await writeFile(templatePath, JSON.stringify(updatedTemplate, null, 2));
    }

    /**
     * Delete a custom template
     */
    async deleteTemplate(id: string): Promise<void> {
        const template = await this.getTemplate(id);

        if (!template) {
            throw new Error(`Template "${id}" not found`);
        }

        if (template.builtIn) {
            throw new Error('Cannot delete built-in templates');
        }

        const promptsPath = this.getPromptsPath();
        if (!promptsPath) {
            throw new Error('Notes folder not configured');
        }

        const templatePath = path.join(promptsPath, `${id}.json`);
        await vscode.workspace.fs.delete(vscode.Uri.file(templatePath));
    }

    /**
     * Duplicate a template as starting point for new one
     */
    async duplicateTemplate(sourceId: string, newName: string): Promise<PromptTemplate> {
        const source = await this.getTemplate(sourceId);

        if (!source) {
            throw new Error(`Template "${sourceId}" not found`);
        }

        return await this.createTemplate(
            newName,
            `Copy of ${source.description}`,
            source.prompt
        );
    }

    /**
     * Extract variables from prompt text
     */
    private extractVariables(prompt: string): string[] {
        const variablePattern = /\{(\w+)\}/g;
        const matches = prompt.matchAll(variablePattern);
        const variables = new Set<string>();

        for (const match of matches) {
            variables.add(match[1]);
        }

        return Array.from(variables);
    }

    /**
     * Replace variables in prompt template
     */
    replaceVariables(template: PromptTemplate, variables: PromptVariables): string {
        let prompt = template.prompt;

        // Calculate word count based on length
        const wordCount = this.getWordCount(variables.length as 'short' | 'medium' | 'long');

        // Build action items prompt section
        const actionItemsPrompt = this.buildActionItemsPrompt();

        // Build keywords prompt section
        const keywordsPrompt = this.buildKeywordsPrompt();

        // Replace all variables
        const replacements: Record<string, string> = {
            content: variables.content,
            length: variables.length,
            format: variables.format,
            filename: variables.filename,
            date: variables.date || new Date().toLocaleDateString(),
            noteCount: String(variables.noteCount || 1),
            wordCount: String(wordCount),
            actionItemsPrompt,
            keywordsPrompt
        };

        for (const [key, value] of Object.entries(replacements)) {
            prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        }

        return prompt;
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
     * Build action items prompt section
     */
    private buildActionItemsPrompt(): string {
        const config = vscode.workspace.getConfiguration('noted.ai');
        const includeActionItems = config.get<boolean>('includeActionItems', true);

        if (!includeActionItems) {
            return '';
        }

        return `- Extract action items in a dedicated section with:
  - Each item as a checkbox: - [ ] Task description
  - Include assignees if mentioned (e.g., "- [ ] Review PR (John)")
  - Include deadlines if mentioned (e.g., "- [ ] Deploy by Friday")
  - Mark priority if critical/urgent (e.g., "- [ ] [URGENT] Fix bug")
  - Group related items together`;
    }

    /**
     * Build keywords prompt section
     */
    private buildKeywordsPrompt(): string {
        const config = vscode.workspace.getConfiguration('noted.ai');
        const includeKeywords = config.get<boolean>('includeKeywords', false);

        if (!includeKeywords) {
            return '';
        }

        return `- Generate 3-5 highly relevant keywords/tags in a dedicated section:
  - Choose specific, searchable terms (not generic words)
  - Include technical terms, project names, or domain concepts
  - Use hashtag format: #keyword
  - Prefer hierarchical tags when applicable: #project/frontend
  - Focus on topics that would help find this note later`;
    }

    /**
     * Get last used template ID
     */
    getLastUsedTemplate(): string | undefined {
        return this.context.globalState.get<string>(PromptTemplateService.LAST_USED_KEY);
    }

    /**
     * Set last used template ID
     */
    async setLastUsedTemplate(templateId: string): Promise<void> {
        await this.context.globalState.update(PromptTemplateService.LAST_USED_KEY, templateId);
    }

    /**
     * Show template picker and return selected template
     */
    async pickTemplate(): Promise<PromptTemplate | null> {
        const templates = await this.getAllTemplates();

        if (templates.length === 0) {
            vscode.window.showWarningMessage('No prompt templates available');
            return null;
        }

        const lastUsedId = this.getLastUsedTemplate();

        const items = templates.map(t => ({
            label: t.name,
            description: t.builtIn ? '$(symbol-misc) Built-in' : '$(symbol-file) Custom',
            detail: t.description,
            template: t,
            picked: t.id === lastUsedId
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a prompt template for summarization',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (!selected) {
            return null;
        }

        // Save as last used
        await this.setLastUsedTemplate(selected.template.id);

        return selected.template;
    }
}
