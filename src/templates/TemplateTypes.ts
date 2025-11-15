/**
 * Template metadata and type definitions for the enhanced template system
 */

/**
 * Variable types supported in templates
 */
export type TemplateVariableType = 'string' | 'number' | 'enum' | 'date' | 'boolean';

/**
 * Template variable definition
 */
export interface TemplateVariable {
    name: string;
    type: TemplateVariableType;
    required?: boolean;
    default?: any;
    prompt?: string;
    values?: string[];  // For enum type
    description?: string;
}

/**
 * AI generation configuration for templates
 */
export interface AIGenerationConfig {
    enabled: boolean;
    sections?: string[];  // Which sections to generate
    hints?: string[];     // Hints for AI
}

/**
 * Template difficulty levels
 */
export type TemplateDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * Complete template definition
 */
export interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
    tags: string[];
    version: string;
    author?: string;
    difficulty?: TemplateDifficulty;

    variables: TemplateVariable[];

    ai_generation?: AIGenerationConfig;

    content: string;  // Actual template content

    // Metadata
    created?: string;
    modified?: string;
    usage_count?: number;

    // Usage guidance (Phase 3)
    when_to_use?: string;           // Brief 1-2 sentence description of ideal usage scenarios
    use_cases?: string[];           // Array of 2-4 specific scenarios
    prerequisites?: string[];       // Knowledge or setup requirements
    related_templates?: string[];   // Template IDs for discovery and cross-linking
    estimated_time?: string;        // Time to complete (e.g., "2-3 minutes")
}

/**
 * Bundle note definition for multi-note workflows
 */
export interface BundleNote {
    name: string;           // Can include {variables}
    template: string;       // Template ID to use
    folder: string;         // Target folder (can include {variables})
    description?: string;
    links?: string[];       // Other note names to link to
}

/**
 * Post-creation actions for bundles
 */
export interface PostCreateActions {
    open_notes?: string[];  // Note names to open after creation
    message?: string;        // Success message to show
}

/**
 * Template bundle definition for multi-note workflows
 */
export interface TemplateBundle {
    id: string;
    name: string;
    description: string;
    version: string;
    author?: string;

    variables: TemplateVariable[];

    notes: BundleNote[];

    post_create?: PostCreateActions;
}

/**
 * Template generation result from AI
 */
export interface TemplateGenerationResult {
    template: Template;
    confidence: number;
    suggestions?: string[];
}
