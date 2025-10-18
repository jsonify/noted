import * as path from 'path';
import { BUILT_IN_TEMPLATES, TEMPLATE_PLACEHOLDERS, DEFAULTS } from '../constants';
import { getTemplatesPath, getFileFormat } from './configService';
import { pathExists, readFile, readDirectory } from './fileSystemService';
import { formatDateForNote, formatTimeForNote } from '../utils/dateHelpers';

/**
 * Generate template content for a note
 */
export async function generateTemplate(templateType: string | undefined, date: Date, filename?: string): Promise<string> {
    const dateStr = formatDateForNote(date);
    const timeStr = formatTimeForNote(date);

    // Always include timestamp in frontmatter
    const frontmatter = filename
        ? `File: ${filename}\nCreated: ${dateStr} at ${timeStr}\n${'='.repeat(DEFAULTS.SEPARATOR_LENGTH)}\n\n`
        : `Created: ${dateStr} at ${timeStr}\n${'='.repeat(DEFAULTS.SEPARATOR_LENGTH)}\n\n`;

    // Check if it's a custom template
    const templatesPath = getTemplatesPath();
    if (templatesPath && templateType) {
        try {
            if (await pathExists(templatesPath)) {
                const fileFormat = getFileFormat();
                const customTemplatePath = path.join(templatesPath, `${templateType}.${fileFormat}`);

                try {
                    const content = await readFile(customTemplatePath);

                    // Replace placeholders
                    let processedContent = content.replace(TEMPLATE_PLACEHOLDERS.FILENAME, filename || '');
                    processedContent = processedContent.replace(TEMPLATE_PLACEHOLDERS.DATE, dateStr);
                    processedContent = processedContent.replace(TEMPLATE_PLACEHOLDERS.TIME, timeStr);

                    return processedContent;
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
        return templateFn(frontmatter);
    }

    // Default fallback
    return `${dateStr}\n${'='.repeat(DEFAULTS.SEPARATOR_LENGTH)}\n\n`;
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
            return files
                .filter(f => f.endsWith('.txt') || f.endsWith('.md'))
                .map(f => path.basename(f, path.extname(f)));
        }
    } catch {
        return [];
    }

    return [];
}
