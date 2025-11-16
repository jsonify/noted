import { TemplateDifficulty } from '../TemplateTypes';

/**
 * Template display info for the browser
 */
export interface TemplateDisplayInfo {
    id: string;
    name: string;
    description: string;
    category: string;
    tags: string[];
    version: string;
    author?: string;
    usage_count?: number;
    created?: string;
    modified?: string;
    last_used?: string;
    isBuiltIn: boolean;
    fileType: 'json' | 'txt' | 'md' | 'builtin';
    difficulty?: TemplateDifficulty;
    // Usage guidance (Phase 3)
    when_to_use?: string;
    use_cases?: string[];
    prerequisites?: string[];
    related_templates?: string[];
    estimated_time?: string;
}
