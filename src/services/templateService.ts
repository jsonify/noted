import * as path from 'path';
import * as vscode from 'vscode';
import { BUILT_IN_TEMPLATES, TEMPLATE_PLACEHOLDERS, DEFAULTS, DAY_NAMES, MONTH_NAMES } from '../constants';
import { getTemplatesPath, getFileFormat } from './configService';
import { pathExists, readFile, readDirectory } from './fileSystemService';
import { formatDateForNote, formatTimeForNote } from '../utils/dateHelpers';
import { Template } from '../templates/TemplateMetadata';
import * as os from 'os';

/**
 * Replace all template placeholders with their values
 */
function replacePlaceholders(content: string, date: Date, filename?: string): string {
    const dateStr = formatDateForNote(date);
    const timeStr = formatTimeForNote(date);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const weekday = DAY_NAMES[date.getDay()];
    const monthName = MONTH_NAMES[date.getMonth()];
    const user = os.userInfo().username;
    const workspace = vscode.workspace.workspaceFolders?.[0]?.name || 'workspace';

    let result = content;
    result = result.replace(TEMPLATE_PLACEHOLDERS.FILENAME, filename || '');
    result = result.replace(TEMPLATE_PLACEHOLDERS.DATE, dateStr);
    result = result.replace(TEMPLATE_PLACEHOLDERS.TIME, timeStr);
    result = result.replace(TEMPLATE_PLACEHOLDERS.YEAR, year);
    result = result.replace(TEMPLATE_PLACEHOLDERS.MONTH, month);
    result = result.replace(TEMPLATE_PLACEHOLDERS.DAY, day);
    result = result.replace(TEMPLATE_PLACEHOLDERS.WEEKDAY, weekday);
    result = result.replace(TEMPLATE_PLACEHOLDERS.MONTH_NAME, monthName);
    result = result.replace(TEMPLATE_PLACEHOLDERS.USER, user);
    result = result.replace(TEMPLATE_PLACEHOLDERS.WORKSPACE, workspace);

    return result;
}

/**
 * Generate YAML frontmatter for a note
 */
function generateFrontmatter(date: Date, filename?: string): string {
      const dateStr = formatDateForNote(date);
    const lines = [
        '---',
        'tags: []',
        `created: ${date.toISOString()}`,
        `date: ${dateStr}`,
    ];

    if (filename) {
        lines.push(`file: ${filename}`);
    }

    lines.push('---');
    return lines.join('\n') + '\n\n';
}

/**
 * Generate template content for a note
 */
export async function generateTemplate(templateType: string | undefined, date: Date, filename?: string): Promise<string> {
    const dateStr = formatDateForNote(date);
    const yamlFrontmatter = generateFrontmatter(date, filename);

    // Special handling for "quick" template - no frontmatter, just note title
    if (templateType === 'quick') {
        const noteName = filename ? filename.replace(/\.(txt|md)$/i, '') : 'Note';
        return `# ${noteName}\n\n`;
    }

    // Check if it's a custom template
    const templatesPath = getTemplatesPath();
    if (templatesPath && templateType) {
        try {
            if (await pathExists(templatesPath)) {
                // Try JSON template first (new AI-generated format)
                const jsonPath = path.join(templatesPath, `${templateType}.json`);
                try {
                    const jsonContent = await readFile(jsonPath);
                    const template: Template = JSON.parse(jsonContent);

                    // Replace placeholders in template content
                    const processedContent = replacePlaceholders(template.content, date, filename);

                    // JSON templates include their own frontmatter
                    return processedContent;
                } catch {
                    // JSON template doesn't exist, try legacy format
                }

                // Try legacy .txt/.md template
                const fileFormat = getFileFormat();
                const customTemplatePath = path.join(templatesPath, `${templateType}.${fileFormat}`);

                try {
                    const content = await readFile(customTemplatePath);

                    // Replace placeholders
                    const processedContent = replacePlaceholders(content, date, filename);

                    // If custom template already has frontmatter, return as-is
                    // Otherwise, prepend YAML frontmatter
                    if (processedContent.trimStart().startsWith('---')) {
                        return processedContent;
                    } else {
                        return yamlFrontmatter + processedContent;
                    }
                } catch {
                    // Custom template doesn't exist, fall through to built-in templates
                }
            }
        } catch {
            // Templates folder doesn't exist, fall through to built-in templates
        }
    }

    // Built-in templates
    const templateFn = BUILT_IN_TEMPLATES[templateType as keyof typeof BUILT_IN_TEMPLATES];
    if (templateFn) {
        // Built-in templates no longer receive frontmatter parameter
        return yamlFrontmatter + templateFn();
    }

    // Default fallback (consistent with quick template - frontmatter only)
    return yamlFrontmatter;
}

/**
 * Get list of custom template names
 */
export async function getCustomTemplates(): Promise<string[]> {
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        return [];
    }

    try {
        if (await pathExists(templatesPath)) {
            const files = await readDirectory(templatesPath);
            const templates = files
                .filter(f => f.endsWith('.txt') || f.endsWith('.md') || f.endsWith('.json'))
                .map(f => path.basename(f, path.extname(f)));

            // Remove duplicates (in case both .json and .md/.txt exist with same name)
            return [...new Set(templates)];
        }
    } catch {
        return [];
    }

    return [];
}

/**
 * Get the full path to a custom template file
 */
export function getCustomTemplatePath(templateName: string): string | null {
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        return null;
    }

    const fileFormat = getFileFormat();
    return path.join(templatesPath, `${templateName}.${fileFormat}`);
}

/**
 * Get a preview of template content with placeholders filled
 */
export function getTemplatePreview(content: string): string {
    const previewDate = new Date();
    return replacePlaceholders(content, previewDate, 'example-note');
}

/**
 * Get list of available template variables
 */
export function getTemplateVariables(): Array<{ name: string; description: string }> {
    return [
        { name: '{filename}', description: 'The name of the note file' },
        { name: '{date}', description: 'Current date (YYYY-MM-DD)' },
        { name: '{time}', description: 'Current time (HH:MM AM/PM)' },
        { name: '{year}', description: 'Current year (YYYY)' },
        { name: '{month}', description: 'Current month (MM)' },
        { name: '{day}', description: 'Current day (DD)' },
        { name: '{weekday}', description: 'Day of week (Sun, Mon, etc.)' },
        { name: '{month_name}', description: 'Month name (January, February, etc.)' },
        { name: '{user}', description: 'System username' },
        { name: '{workspace}', description: 'Workspace name' }
    ];
}
