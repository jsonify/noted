import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as os from 'os';
import { Template, TemplateVariable, AIGenerationConfig } from './TemplateTypes';
import { selectAIModel } from '../services/aiModelService';
import { BUILT_IN_TEMPLATE_VARIABLES } from '../constants';

/**
 * Cache entry for template generation results
 */
interface TemplateCacheEntry {
    description: string;
    descriptionHash: string;
    template: Template;
    generatedAt: Date;
}

/**
 * TemplateGenerator uses VS Code's LLM API to generate intelligent template suggestions
 * Following the pattern from TagGenerator.ts
 */
export class TemplateGenerator {
    private cache: Map<string, TemplateCacheEntry> = new Map();
    private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds

    /**
     * Generate a template from a natural language description using AI
     * @param description - Natural language description of what the template should contain
     * @param category - Optional category for the template (default: "Custom")
     * @returns Generated template with structure and metadata
     */
    async generateFromDescription(description: string, category?: string): Promise<Template> {
        // Check cache
        const descriptionHash = this.hashContent(description);
        if (this.cache.has(descriptionHash)) {
            const cached = this.cache.get(descriptionHash)!;

            // Return cached template if cache is fresh
            if ((Date.now() - cached.generatedAt.getTime()) < this.CACHE_TTL) {
                return cached.template;
            }
        }

        try {
            // Check if AI templates are enabled
            const config = vscode.workspace.getConfiguration('noted');
            const useAI = config.get<boolean>('templates.useAI', true);

            if (!useAI) {
                throw new Error('AI template generation is disabled in settings');
            }

            // Select the appropriate language model
            const model = await selectAIModel();

            // Build the prompt
            const prompt = this.buildTemplateGenerationPrompt(description);

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

            // Parse the response into a template
            const template = this.parseTemplateResponse(fullResponse, description, category);

            // Cache the results
            this.cache.set(descriptionHash, {
                description,
                descriptionHash,
                template,
                generatedAt: new Date()
            });

            return template;
        } catch (error) {
            if (error instanceof Error) {
                console.error('Error generating template:', error);
                throw error;
            }
            throw new Error('Unknown error occurred while generating template');
        }
    }

    /**
     * Enhance an existing template with AI suggestions
     * @param existingTemplate - The template to enhance
     * @returns Enhanced template with improvements
     */
    async enhanceTemplate(existingTemplate: Template): Promise<Template> {
        try {
            // Check if AI templates are enabled
            const config = vscode.workspace.getConfiguration('noted');
            const useAI = config.get<boolean>('templates.useAI', true);

            if (!useAI) {
                throw new Error('AI template enhancement is disabled in settings');
            }

            // Select the appropriate language model
            const model = await selectAIModel();

            // Build the enhancement prompt
            const prompt = this.buildTemplateEnhancementPrompt(existingTemplate);

            // Create messages for the LLM
            const messages = [
                vscode.LanguageModelChatMessage.User(prompt)
            ];

            // Send request
            const cancellationToken = new vscode.CancellationTokenSource().token;
            const response = await model.sendRequest(messages, {}, cancellationToken);

            // Collect the full response
            let fullResponse = '';
            for await (const fragment of response.text) {
                fullResponse += fragment;
            }

            // Parse the enhanced template
            const enhancedTemplate = this.parseTemplateResponse(
                fullResponse,
                existingTemplate.description,
                existingTemplate.category
            );

            // Preserve original metadata
            enhancedTemplate.id = existingTemplate.id;
            enhancedTemplate.version = this.incrementVersion(existingTemplate.version);
            enhancedTemplate.created = existingTemplate.created;
            enhancedTemplate.usage_count = existingTemplate.usage_count;

            return enhancedTemplate;
        } catch (error) {
            if (error instanceof Error) {
                console.error('Error enhancing template:', error);
                throw error;
            }
            throw new Error('Unknown error occurred while enhancing template');
        }
    }

    /**
     * Build the prompt for template generation
     * @param description - User's description of desired template
     * @returns Formatted prompt string
     */
    private buildTemplateGenerationPrompt(description: string): string {
        const existingVariables = [
            '{filename}', '{date}', '{time}', '{year}', '{month}', '{day}',
            '{weekday}', '{month_name}', '{user}', '{workspace}'
        ];

        return `You are a template generation assistant for a note-taking VS Code extension.

User wants: "${description}"

Generate a structured note template with:
1. Appropriate YAML frontmatter (tags, status, created date, etc.)
2. Logical sections with markdown headers
3. Placeholders for content (using {variable} syntax from the list below)
4. Helpful prompts and examples inline
5. Comments or suggestions for the user

AVAILABLE VARIABLES:
${existingVariables.join(', ')}

You can also define NEW custom variables in the JSON response (see format below).

Output format (JSON):
{
  "name": "template-name",
  "description": "brief description of template purpose",
  "category": "category (e.g., Documentation, Planning, Development)",
  "tags": ["tag1", "tag2"],
  "variables": [
    {
      "name": "custom_var",
      "type": "string|number|enum|date|boolean",
      "required": true,
      "prompt": "What should the user enter for this variable?",
      "default": "optional default value"
    }
  ],
  "content": "full template content with YAML frontmatter and {variables}"
}

RULES:
- Use lowercase-hyphenated names for template IDs (e.g., "video-tutorial-script")
- Include comprehensive YAML frontmatter (tags, created, status, etc.)
- Use markdown headers (##, ###) for structure
- Add helpful inline comments prefixed with "<!-- -->" or bullet points
- Make it practical and ready to use
- Focus on common developer/content creator workflows

Return ONLY valid JSON, no other text.`;
    }

    /**
     * Build the prompt for template enhancement
     * @param template - Existing template to enhance
     * @returns Formatted prompt string
     */
    private buildTemplateEnhancementPrompt(template: Template): string {
        return `You are a template enhancement assistant for a note-taking VS Code extension.

Analyze this existing template and suggest improvements:

CURRENT TEMPLATE:
Name: ${template.name}
Description: ${template.description}
Category: ${template.category}
Tags: ${template.tags.join(', ')}

Content:
${template.content}

Suggest enhancements:
1. Missing sections that would be useful
2. Better structure or organization
3. Additional variables to make it more flexible
4. Improved prompts and examples
5. More comprehensive frontmatter fields

Output format (JSON):
{
  "name": "enhanced-template-name",
  "description": "improved description",
  "category": "category",
  "tags": ["tag1", "tag2"],
  "variables": [
    {
      "name": "var_name",
      "type": "string|number|enum|date|boolean",
      "required": true,
      "prompt": "What should the user enter?",
      "default": "optional"
    }
  ],
  "content": "enhanced template content with improvements"
}

RULES:
- Preserve the core purpose and structure
- Add value without overcomplicating
- Maintain backward compatibility where possible
- Focus on practical improvements
- Keep existing variables unless they need refinement

Return ONLY valid JSON, no other text.`;
    }

    /**
     * Parse LLM response into Template object
     * @param response - Raw LLM response
     * @param description - Original user description
     * @param category - Optional category override
     * @returns Parsed Template object
     */
    private parseTemplateResponse(response: string, description: string, category?: string): Template {
        try {
            // Remove markdown code blocks if present
            const cleaned = response
                .replace(/```json\n?/gi, '')
                .replace(/```\n?/g, '')
                .trim();

            // Parse JSON
            const parsed = JSON.parse(cleaned);

            // Validate required fields
            if (!parsed.name || !parsed.content) {
                throw new Error('Template response missing required fields (name, content)');
            }

            // Generate template ID from name
            const id = parsed.name
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-_]/g, '');

            // Build Template object
            const template: Template = {
                id,
                name: parsed.name,
                description: parsed.description || description,
                category: category || parsed.category || 'Custom',
                tags: Array.isArray(parsed.tags) ? parsed.tags : [],
                version: '1.0.0',
                author: vscode.workspace.getConfiguration('noted').get<string>('templates.defaultAuthor') || os.userInfo().username,
                variables: this.parseVariables(parsed.variables || []),
                content: parsed.content,
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                usage_count: 0
            };

            // Add AI generation config if specified
            if (parsed.ai_generation) {
                template.ai_generation = {
                    enabled: parsed.ai_generation.enabled !== false,
                    sections: parsed.ai_generation.sections || [],
                    hints: parsed.ai_generation.hints || []
                };
            }

            return template;
        } catch (error) {
            console.error('Failed to parse template response:', error);
            console.error('Response was:', response);
            throw new Error('Failed to parse AI response. Please try again.');
        }
    }

    /**
     * Parse and validate template variables
     * @param variables - Raw variable definitions from LLM
     * @returns Validated TemplateVariable array
     */
    private parseVariables(variables: any[]): TemplateVariable[] {
        if (!Array.isArray(variables)) {
            return [];
        }

        const result: TemplateVariable[] = [];

        for (const v of variables) {
            if (!v.name || !v.type) {
                continue;
            }

            // Validate variable type
            const validTypes: TemplateVariable['type'][] = ['string', 'number', 'enum', 'date', 'boolean'];
            if (!validTypes.includes(v.type)) {
                continue;
            }

            result.push({
                name: v.name,
                type: v.type,
                required: v.required === true,
                default: v.default,
                prompt: v.prompt || `Enter value for ${v.name}`,
                values: Array.isArray(v.values) ? v.values : undefined,
                description: v.description
            });
        }

        return result;
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
     * Get all available AI models for user selection
     * @returns Array of available models with metadata
     */
    async getAvailableModels(): Promise<Array<{
        id: string;
        vendor: string;
        family: string;
        name: string;
        description: string;
    }>> {
        const allModels = await vscode.lm.selectChatModels({});

        return allModels.map(model => {
            // Generate user-friendly name
            let name = model.name || model.family;
            let description = this.getModelDescription(model.vendor, model.family);

            return {
                id: model.id,
                vendor: model.vendor,
                family: model.family,
                name,
                description
            };
        });
    }

    /**
     * Get user-friendly description for a model
     * @param vendor - Model vendor
     * @param family - Model family
     * @returns Description string
     */
    private getModelDescription(vendor: string, family: string): string {
        // Anthropic/Claude models
        if (vendor === 'anthropic' || family.includes('claude')) {
            if (family.includes('sonnet')) {
                return 'Best for structured output and complex reasoning';
            }
            if (family.includes('opus')) {
                return 'Most capable, best for complex tasks';
            }
            if (family.includes('haiku')) {
                return 'Fast and efficient';
            }
            return 'Claude AI model';
        }

        // OpenAI models (via Copilot)
        if (family.includes('gpt')) {
            if (family.includes('4o') || family.includes('4')) {
                return 'Advanced reasoning and generation';
            }
            if (family.includes('3.5')) {
                return 'Fast and cost-effective';
            }
            return 'OpenAI GPT model';
        }

        // Google models
        if (family.includes('gemini')) {
            if (family.includes('pro')) {
                return 'Long context window, multimodal';
            }
            return 'Google Gemini model';
        }

        return `${vendor} - ${family}`;
    }

    /**
     * Increment semantic version
     * @param version - Current version (e.g., "1.0.0")
     * @returns Incremented version (e.g., "1.1.0")
     */
    private incrementVersion(version: string): string {
        const parts = version.split('.');
        if (parts.length !== 3) {
            return '1.0.0';
        }

        const [major, minor, patch] = parts.map(p => parseInt(p, 10));

        // Validate that all parts are valid numbers
        if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
            return '1.0.0';
        }

        return `${major}.${minor + 1}.${patch}`;
    }

    /**
     * Clear the entire cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Clear cache for a specific description
     */
    clearDescriptionCache(description: string): void {
        const hash = this.hashContent(description);
        this.cache.delete(hash);
    }

    /**
     * Get list of built-in template variables that cannot be used as custom variable names
     * @returns Array of built-in variable names
     */
    getBuiltInVariables(): readonly string[] {
        return BUILT_IN_TEMPLATE_VARIABLES;
    }

    /**
     * Validate a variable name
     * @param name - Variable name to validate
     * @returns Object with isValid boolean and optional error message
     */
    validateVariableName(name: string): { isValid: boolean; error?: string } {
        // Check if empty
        if (!name || name.trim().length === 0) {
            return { isValid: false, error: 'Variable name cannot be empty' };
        }

        // Check format: lowercase letters, numbers, and underscores only
        const validFormat = /^[a-z][a-z0-9_]*$/;
        if (!validFormat.test(name)) {
            return {
                isValid: false,
                error: 'Variable name must start with a letter and contain only lowercase letters, numbers, and underscores'
            };
        }

        // Check against built-in variables
        const builtIns = this.getBuiltInVariables();
        if (builtIns.includes(name)) {
            return {
                isValid: false,
                error: `'${name}' is a built-in variable and cannot be used as a custom variable name`
            };
        }

        return { isValid: true };
    }

    /**
     * Validate a complete variable definition
     * @param variable - Variable to validate
     * @param existingVariables - Array of existing variables to check for duplicates
     * @param originalName - Optional original name if updating an existing variable (to exclude it from duplicate check)
     * @returns Object with isValid boolean and optional error message
     */
    validateVariable(
        variable: TemplateVariable,
        existingVariables: TemplateVariable[] = [],
        originalName?: string
    ): { isValid: boolean; error?: string } {
        // Validate name
        const nameValidation = this.validateVariableName(variable.name);
        if (!nameValidation.isValid) {
            return nameValidation;
        }

        // Check for duplicates (excluding self if updating)
        const duplicate = existingVariables.find(v =>
            v.name === variable.name && v.name !== originalName
        );
        if (duplicate) {
            return {
                isValid: false,
                error: `Variable '${variable.name}' already exists`
            };
        }

        // Validate enum values
        if (variable.type === 'enum') {
            if (!variable.values || variable.values.length === 0) {
                return {
                    isValid: false,
                    error: 'Enum variables must have at least one possible value'
                };
            }
        }

        // Validate default value type
        if (variable.default !== undefined && variable.default !== null) {
            const defaultValue = variable.default;

            switch (variable.type) {
                case 'number':
                    if (isNaN(Number(defaultValue))) {
                        return {
                            isValid: false,
                            error: 'Default value must be a valid number'
                        };
                    }
                    break;
                case 'boolean':
                    if (typeof defaultValue !== 'boolean' && defaultValue !== 'true' && defaultValue !== 'false') {
                        return {
                            isValid: false,
                            error: 'Default value must be true or false'
                        };
                    }
                    break;
                case 'enum':
                    if (variable.values && !variable.values.includes(String(defaultValue))) {
                        return {
                            isValid: false,
                            error: 'Default value must be one of the enum values'
                        };
                    }
                    break;
            }
        }

        return { isValid: true };
    }
}

// Export singleton instance
export const templateGenerator = new TemplateGenerator();
