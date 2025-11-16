import * as vscode from 'vscode';
import * as path from 'path';
import { getTemplatesPath } from '../../services/configService';
import { pathExists, readFile, readDirectory, writeFile } from '../../services/fileSystemService';
import { Template } from '../TemplateTypes';
import { BUILT_IN_TEMPLATES, BUILT_IN_TEMPLATE_INFO } from '../../constants';
import { TemplateDisplayInfo } from './types';

/**
 * Helper function to find a template file (JSON or legacy)
 * Returns { path: string, type: 'json' | 'txt' | 'md' } or null if not found
 */
export async function findTemplateFile(
    templatesPath: string,
    templateId: string
): Promise<{ path: string; type: 'json' | 'txt' | 'md' } | null> {
    // Try JSON first
    const jsonPath = path.join(templatesPath, `${templateId}.json`);
    if (await pathExists(jsonPath)) {
        return { path: jsonPath, type: 'json' };
    }

    // Try both .md and .txt
    for (const ext of ['md', 'txt'] as const) {
        const legacyPath = path.join(templatesPath, `${templateId}.${ext}`);
        if (await pathExists(legacyPath)) {
            return { path: legacyPath, type: ext };
        }
    }

    return null;
}

/**
 * Load all templates (built-in, JSON, and legacy)
 */
export async function loadAllTemplates(): Promise<TemplateDisplayInfo[]> {
    const templates: TemplateDisplayInfo[] = [];

    // Add built-in templates with guidance metadata
    const builtInNames = Object.keys(BUILT_IN_TEMPLATES);
    for (const name of builtInNames) {
        // Find matching template info with guidance fields
        const templateInfo = BUILT_IN_TEMPLATE_INFO.find(t => t.value === name);

        if (!templateInfo) {
            console.warn(`[Template Browser] No metadata found in BUILT_IN_TEMPLATE_INFO for built-in template: ${name}`);
        }

        templates.push({
            id: name,
            name: templateInfo?.label || (name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ')),
            description: templateInfo?.description || `Built-in ${name} template`,
            category: 'Built-in',
            tags: ['built-in'],
            version: '1.0.0',
            isBuiltIn: true,
            fileType: 'builtin',
            // Include Phase 3 guidance fields
            when_to_use: templateInfo?.when_to_use,
            use_cases: templateInfo?.use_cases,
            prerequisites: templateInfo?.prerequisites,
            related_templates: templateInfo?.related_templates,
            estimated_time: templateInfo?.estimated_time
        });
    }

    // Load custom templates
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        return templates;
    }

    try {
        if (await pathExists(templatesPath)) {
            const files = await readDirectory(templatesPath);

            // Create a set of JSON template basenames for efficient lookup
            const jsonFileBasenames = new Set(
                files.filter(f => f.endsWith('.json') && !f.endsWith('.bundle.json')).map(f => path.basename(f, '.json'))
            );

            for (const file of files) {
                const ext = path.extname(file);
                const baseName = path.basename(file, ext);

                // Skip bundle files
                if (file.endsWith('.bundle.json')) {
                    continue;
                }

                if (ext === '.json') {
                    // Load JSON template
                    try {
                        const content = await readFile(path.join(templatesPath, file));
                        const template: Template = JSON.parse(content);

                        templates.push({
                            id: template.id || baseName,
                            name: template.name,
                            description: template.description,
                            category: template.category,
                            tags: template.tags,
                            version: template.version,
                            author: template.author,
                            usage_count: template.usage_count,
                            created: template.created,
                            modified: template.modified,
                            last_used: template.last_used,
                            isBuiltIn: false,
                            fileType: 'json',
                            difficulty: template.difficulty,
                            // Include Phase 3 guidance fields from template JSON
                            when_to_use: template.when_to_use,
                            use_cases: template.use_cases,
                            prerequisites: template.prerequisites,
                            related_templates: template.related_templates,
                            estimated_time: template.estimated_time
                        });
                    } catch (error) {
                        vscode.window.showWarningMessage(`Failed to parse template file: ${file}`);
                        console.error(`Failed to parse JSON template ${file}:`, error);
                    }
                } else if (ext === '.txt' || ext === '.md') {
                    // Load legacy template, but only if a JSON version doesn't exist
                    if (jsonFileBasenames.has(baseName)) {
                        continue; // JSON version takes precedence
                    }

                    templates.push({
                        id: baseName,
                        name: baseName.charAt(0).toUpperCase() + baseName.slice(1).replace(/-/g, ' '),
                        description: `Legacy ${ext} template`,
                        category: 'Custom',
                        tags: ['custom', 'legacy'],
                        version: '1.0.0',
                        isBuiltIn: false,
                        fileType: ext === '.txt' ? 'txt' : 'md'
                    });
                }
            }
        }
    } catch (error) {
        vscode.window.showWarningMessage('Failed to load custom templates. Check the developer console for details.');
        console.error('Failed to load custom templates:', error);
    }

    return templates;
}

/**
 * Update template usage tracking
 */
export async function updateTemplateUsage(templateId: string): Promise<void> {
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        return;
    }

    // Find and update the template file (only for JSON templates)
    const jsonPath = path.join(templatesPath, `${templateId}.json`);

    try {
        if (await pathExists(jsonPath)) {
            const content = await readFile(jsonPath);
            const template: Template = JSON.parse(content);

            // Update usage metadata
            template.usage_count = (template.usage_count || 0) + 1;
            template.last_used = new Date().toISOString();

            // Write back to file
            await writeFile(jsonPath, JSON.stringify(template, null, 2));

            console.log(`[Template Browser] Updated usage for template: ${templateId} (count: ${template.usage_count})`);
        }
    } catch (error) {
        console.error(`[Template Browser] Failed to update usage for template ${templateId}:`, error);
    }
}
