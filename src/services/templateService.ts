import * as path from 'path';
import * as vscode from 'vscode';
import { BUILT_IN_TEMPLATES, TEMPLATE_PLACEHOLDERS, DEFAULTS, DAY_NAMES, MONTH_NAMES, JS_TEMPLATE_EXTENSION, TEMPLATE_EXTENSIONS } from '../constants';
import { getTemplatesPath, getFileFormat, getAllowJavaScriptTemplates, getJSTemplateMaxExecutionTime, getJSTemplateMaxMemory } from './configService';
import { pathExists, readFile, readDirectory } from './fileSystemService';
import { formatDateForNote, formatTimeForNote } from '../utils/dateHelpers';
import * as os from 'os';
import { executeTemplate } from './jsTemplateExecutor';

// Global state key for JS template consent
const JS_TEMPLATE_CONSENT_KEY = 'noted.jsTemplateConsent';

/**
 * Check if user has consented to JavaScript template execution
 */
async function hasJSTemplateConsent(context: vscode.ExtensionContext): Promise<boolean> {
    return context.globalState.get<boolean>(JS_TEMPLATE_CONSENT_KEY, false);
}

/**
 * Request user consent for JavaScript template execution
 */
async function requestJSTemplateConsent(context: vscode.ExtensionContext): Promise<boolean> {
    const message = 'JavaScript templates can execute custom code. Only enable this if you trust the template source. Allow JavaScript templates?';
    const options = ['Allow Once', 'Allow Always', 'Deny'];

    const choice = await vscode.window.showWarningMessage(message, { modal: true }, ...options);

    if (choice === 'Allow Always') {
        await context.globalState.update(JS_TEMPLATE_CONSENT_KEY, true);
        return true;
    } else if (choice === 'Allow Once') {
        return true;
    }

    return false;
}

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
    const timeStr = formatTimeForNote(date);

    const lines = [
        '---',
        'tags: []',
        `created: ${dateStr} at ${timeStr}`,
    ];

    if (filename) {
        lines.push(`file: ${filename}`);
    }

    lines.push('---');
    return lines.join('\n') + '\n\n';
}

/**
 * Generate template content for a note
 * @param templateType The template type/name
 * @param date The date context for the template
 * @param filename The filename context for the template
 * @param context VS Code extension context (required for JS template consent)
 */
export async function generateTemplate(templateType: string | undefined, date: Date, filename?: string, context?: vscode.ExtensionContext): Promise<string> {
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
                // Try to find template in priority order: .js.template > .md > .txt
                const fileFormat = getFileFormat();
                const possiblePaths = [
                    path.join(templatesPath, `${templateType}${JS_TEMPLATE_EXTENSION}`),
                    path.join(templatesPath, `${templateType}.md`),
                    path.join(templatesPath, `${templateType}.txt`)
                ];

                // Find first existing template
                for (const templatePath of possiblePaths) {
                    try {
                        if (await pathExists(templatePath)) {
                            // Check if it's a JavaScript template
                            if (templatePath.endsWith(JS_TEMPLATE_EXTENSION)) {
                                return await executeJSTemplate(templatePath, date, filename, context);
                            }

                            // Regular static template
                            const content = await readFile(templatePath);
                            const processedContent = replacePlaceholders(content, date, filename);

                            // If custom template already has frontmatter, return as-is
                            // Otherwise, prepend YAML frontmatter
                            if (processedContent.trimStart().startsWith('---')) {
                                return processedContent;
                            } else {
                                return yamlFrontmatter + processedContent;
                            }
                        }
                    } catch (error) {
                        // Template doesn't exist or error reading, try next
                        continue;
                    }
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
 * Execute a JavaScript template
 */
async function executeJSTemplate(templatePath: string, date: Date, filename?: string, context?: vscode.ExtensionContext): Promise<string> {
    // Check if JS templates are enabled in settings
    const jsTemplatesEnabled = getAllowJavaScriptTemplates();

    if (!jsTemplatesEnabled) {
        throw new Error('JavaScript templates are disabled. Enable them in settings (noted.allowJavaScriptTemplates) to use this template.');
    }

    // Check user consent (if context is provided)
    if (context) {
        const hasConsent = await hasJSTemplateConsent(context);
        if (!hasConsent) {
            const granted = await requestJSTemplateConsent(context);
            if (!granted) {
                throw new Error('JavaScript template execution denied by user.');
            }
        }
    }

    // Read the template source code
    const templateSource = await readFile(templatePath);

    // Execute the template with configured options
    const maxExecutionTime = getJSTemplateMaxExecutionTime();
    const maxMemory = getJSTemplateMaxMemory();

    // Note: executeTemplate uses QuickJS executor which handles its own options
    // The filename parameter should be the note name without extension
    const noteFilename = filename ? filename.replace(/\.(txt|md)$/i, '') : 'note';

    const result = await executeTemplate(templateSource, noteFilename, date);

    if (result.error) {
        throw new Error(`JavaScript template execution failed: ${result.error}`);
    }

    const content = result.output || '';

    // If JS template already includes frontmatter, return as-is
    // Otherwise, prepend YAML frontmatter
    if (content.trimStart().startsWith('---')) {
        return content;
    } else {
        const yamlFrontmatter = generateFrontmatter(date, filename);
        return yamlFrontmatter + content;
    }
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
            const templateNames = new Set<string>();

            for (const file of files) {
                // Support .txt, .md, and .js.template files
                if (file.endsWith(JS_TEMPLATE_EXTENSION)) {
                    // Remove .js.template extension
                    const baseName = file.replace(JS_TEMPLATE_EXTENSION, '');
                    templateNames.add(baseName);
                } else if (file.endsWith('.txt') || file.endsWith('.md')) {
                    const baseName = path.basename(file, path.extname(file));
                    templateNames.add(baseName);
                }
            }

            return Array.from(templateNames).sort();
        }
    } catch {
        return [];
    }

    return [];
}

/**
 * Check if a template is a JavaScript template
 */
export async function isJSTemplate(templateName: string): Promise<boolean> {
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        return false;
    }

    const jsTemplatePath = path.join(templatesPath, `${templateName}${JS_TEMPLATE_EXTENSION}`);
    return await pathExists(jsTemplatePath);
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
