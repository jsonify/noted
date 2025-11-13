import * as vscode from 'vscode';
import * as path from 'path';
import { templateGenerator } from '../templates/TemplateGenerator';
import { Template } from '../templates/TemplateTypes';
import { getTemplatesPath, getFileFormat } from '../services/configService';
import { writeFile, readFile, pathExists, createDirectory } from '../services/fileSystemService';
import { getCustomTemplates } from '../services/templateService';
import { BUILT_IN_PLACEHOLDER_NAMES, TEMPLATE_CATEGORY_KEYWORDS } from '../constants';

/**
 * Command: Create a new template using AI generation
 */
export async function handleCreateTemplateWithAI(): Promise<void> {
    try {
        // Prompt user for description
        const description = await vscode.window.showInputBox({
            prompt: 'Describe the template you want to create',
            placeHolder: 'e.g., "video tutorial script with sections for outline, key points, and resources"',
            validateInput: (value) => {
                if (!value || value.trim().length < 10) {
                    return 'Please provide a detailed description (at least 10 characters)';
                }
                return null;
            }
        });

        if (!description) {
            return;
        }

        // Show progress indicator
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Generating template with AI...',
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: 'Analyzing description...' });

            // Generate template using AI
            const template = await templateGenerator.generateFromDescription(description);

            progress.report({ increment: 50, message: 'Template generated. Opening preview...' });

            // Show preview webview
            const accepted = await showTemplatePreview(template);

            if (!accepted) {
                vscode.window.showInformationMessage('Template creation cancelled');
                return;
            }

            progress.report({ increment: 75, message: 'Saving template...' });

            // Save template as JSON
            await saveTemplateAsJSON(template);

            progress.report({ increment: 100, message: 'Done!' });

            // Show success message with location info
            const templatesPath = getTemplatesPath();
            const templateFile = `${template.id}.json`;

            const action = await vscode.window.showInformationMessage(
                `✅ Template "${template.name}" created successfully!`,
                'Open Template File',
                'Open Templates Folder',
                'Create Note from Template'
            );

            if (action === 'Open Template File') {
                await openTemplate(template.id);
            } else if (action === 'Open Templates Folder') {
                await vscode.commands.executeCommand('noted.openTemplatesFolder');
            } else if (action === 'Create Note from Template') {
                await vscode.commands.executeCommand('noted.openWithTemplate', template.id);
            }
        });
    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(`Failed to create template: ${error.message}`);
        } else {
            vscode.window.showErrorMessage('Failed to create template: Unknown error');
        }
    }
}

/**
 * Command: Enhance an existing template with AI suggestions
 */
export async function handleEnhanceTemplate(): Promise<void> {
    try {
        // Get list of custom templates
        const templates = await getCustomTemplates();

        if (templates.length === 0) {
            vscode.window.showInformationMessage('No custom templates found. Create one first!');
            return;
        }

        // Prompt user to select a template
        const selectedTemplate = await vscode.window.showQuickPick(
            templates.map(t => ({ label: t, description: 'Custom template' })),
            { placeHolder: 'Select a template to enhance' }
        );

        if (!selectedTemplate) {
            return;
        }

        // Load the existing template
        const templatesPath = getTemplatesPath();
        if (!templatesPath) {
            vscode.window.showErrorMessage('Templates folder is not configured');
            return;
        }

        // Try to load as JSON first, fall back to plain text
        const jsonPath = path.join(templatesPath, `${selectedTemplate.label}.json`);
        let existingTemplate: Template;

        if (await pathExists(jsonPath)) {
            const jsonContent = await readFile(jsonPath);
            existingTemplate = JSON.parse(jsonContent);
        } else {
            // Convert plain text template to Template object
            const fileFormat = getFileFormat();
            const textPath = path.join(templatesPath, `${selectedTemplate.label}.${fileFormat}`);
            const content = await readFile(textPath);

            existingTemplate = {
                id: selectedTemplate.label,
                name: selectedTemplate.label,
                description: 'Custom template',
                category: 'Custom',
                tags: [],
                version: '1.0.0',
                variables: [],
                content
            };
        }

        // Show progress indicator
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Enhancing template "${existingTemplate.name}"...`,
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: 'Analyzing template...' });

            // Enhance template using AI
            const enhancedTemplate = await templateGenerator.enhanceTemplate(existingTemplate);

            progress.report({ increment: 50, message: 'Enhancement complete. Opening preview...' });

            // Show preview with before/after comparison
            const accepted = await showTemplateEnhancementPreview(existingTemplate, enhancedTemplate);

            if (!accepted) {
                vscode.window.showInformationMessage('Template enhancement cancelled');
                return;
            }

            progress.report({ increment: 75, message: 'Saving enhanced template...' });

            // Save enhanced template as JSON
            await saveTemplateAsJSON(enhancedTemplate);

            progress.report({ increment: 100, message: 'Done!' });

            // Show success message with more options
            const action = await vscode.window.showInformationMessage(
                `✅ Template "${enhancedTemplate.name}" enhanced successfully!`,
                'Open Template File',
                'Open Templates Folder',
                'Create Note from Template'
            );

            if (action === 'Open Template File') {
                await openTemplate(enhancedTemplate.id);
            } else if (action === 'Open Templates Folder') {
                await vscode.commands.executeCommand('noted.openTemplatesFolder');
            } else if (action === 'Create Note from Template') {
                await vscode.commands.executeCommand('noted.openWithTemplate', enhancedTemplate.id);
            }
        });
    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(`Failed to enhance template: ${error.message}`);
        } else {
            vscode.window.showErrorMessage('Failed to enhance template: Unknown error');
        }
    }
}

/**
 * Show a preview for a generated template using a text editor
 */
async function showTemplatePreview(template: Template): Promise<boolean> {
    // Create a temporary document with the template preview
    const previewContent = generatePreviewText(template);

    const doc = await vscode.workspace.openTextDocument({
        content: previewContent,
        language: 'markdown'
    });

    const editor = await vscode.window.showTextDocument(doc, {
        preview: true, // Use preview mode to avoid save prompts
        viewColumn: vscode.ViewColumn.Beside
    });

    // Show persistent bottom-right notification - keep re-prompting until user makes a choice
    // NOTE: This while loop is intentional UX design. Modal dialogs block the entire UI,
    // preventing users from reading the preview. Non-modal notifications auto-dismiss when
    // users click to read the preview. This approach ensures the notification stays visible
    // while allowing users to freely interact with the preview panel.
    let result: string | undefined;
    while (!result) {
        result = await vscode.window.showInformationMessage(
            `📄 Review "${template.name}" in the preview on the right, then choose:`,
            'Accept & Save',
            'Decline'
        );

        // If dismissed (undefined), show it again after a short delay
        if (!result) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // Close the preview document without save prompt - use revertAndCloseActiveEditor to avoid save dialog
    await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');

    return result === 'Accept & Save';
}

/**
 * Show a before/after comparison for template enhancement
 */
async function showTemplateEnhancementPreview(
    original: Template,
    enhanced: Template
): Promise<boolean> {
    // Create comparison content
    const previewContent = generateComparisonText(original, enhanced);

    const doc = await vscode.workspace.openTextDocument({
        content: previewContent,
        language: 'markdown'
    });

    const editor = await vscode.window.showTextDocument(doc, {
        preview: true, // Use preview mode to avoid save prompts
        viewColumn: vscode.ViewColumn.Beside
    });

    // Show persistent bottom-right notification - keep re-prompting until user makes a choice
    // NOTE: This while loop is intentional UX design. Modal dialogs block the entire UI,
    // preventing users from reading the preview. Non-modal notifications auto-dismiss when
    // users click to read the preview. This approach ensures the notification stays visible
    // while allowing users to freely interact with the preview panel.
    let result: string | undefined;
    while (!result) {
        result = await vscode.window.showInformationMessage(
            `📄 Review enhancements to "${enhanced.name}" in the preview on the right, then choose:`,
            'Accept & Save',
            'Keep Original'
        );

        // If dismissed (undefined), show it again after a short delay
        if (!result) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // Close the preview document without save prompt - use revertAndCloseActiveEditor to avoid save dialog
    await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');

    return result === 'Accept & Save';
}

/**
 * Generate preview text for a template
 */
function generatePreviewText(template: Template): string {
    const lines = [
        `# 📄 Template Preview: ${template.name}`,
        '',
        '> **Scroll through this preview and review the template. When ready, click your choice in the dialog.**',
        '',
        '---',
        '',
        `**Description:** ${template.description}`,
        `**Category:** ${template.category}`,
        `**Tags:** ${template.tags.join(', ') || 'none'}`,
        '',
    ];

    if (template.variables.length > 0) {
        lines.push('---');
        lines.push('');
        lines.push('## Template Variables');
        lines.push('');
        lines.push('These placeholders will be filled in when you create a note:');
        lines.push('');
        for (const v of template.variables) {
            lines.push(`- **${v.name}** (${v.type})${v.required ? ' *required*' : ''}`);
            if (v.prompt) {
                lines.push(`  - ${v.prompt}`);
            }
        }
        lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push('## Template Content');
    lines.push('');
    lines.push('This is what your notes will look like when using this template:');
    lines.push('');
    lines.push('```markdown');
    lines.push(template.content);
    lines.push('```');

    return lines.join('\n');
}

/**
 * Generate comparison text for before/after enhancement
 */
function generateComparisonText(original: Template, enhanced: Template): string {
    const lines = [
        `# ✨ Template Enhancement: ${enhanced.name}`,
        '',
        '> **Scroll through this preview to see what changed. When ready, click your choice in the dialog.**',
        '',
        '---',
        '',
        '## Changes Overview',
        ''
    ];

    // Compare variables
    const newVariables = enhanced.variables.filter(
        v => !original.variables.find(ov => ov.name === v.name)
    );

    if (newVariables.length > 0) {
        lines.push('### ✅ New Variables Added:');
        lines.push('');
        for (const v of newVariables) {
            lines.push(`- **${v.name}** (${v.type}): ${v.prompt || ''}`);
        }
        lines.push('');
    } else {
        lines.push('_No new variables added_');
        lines.push('');
    }

    // Compare tags
    const newTags = enhanced.tags.filter(t => !original.tags.includes(t));
    if (newTags.length > 0) {
        lines.push(`### ✅ New Tags: ${newTags.join(', ')}`);
        lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push('## Enhanced Template Content');
    lines.push('');
    lines.push('This is what your enhanced template will contain:');
    lines.push('');
    lines.push('```markdown');
    lines.push(enhanced.content);
    lines.push('```');

    return lines.join('\n');
}

/**
 * Save a template as JSON file
 */
async function saveTemplateAsJSON(template: Template): Promise<void> {
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        throw new Error('Templates folder is not configured');
    }

    // Ensure templates directory exists
    await createDirectory(templatesPath);

    // Save as JSON with pretty formatting
    const jsonPath = path.join(templatesPath, `${template.id}.json`);
    const jsonContent = JSON.stringify(template, null, 2);

    await writeFile(jsonPath, jsonContent);
}

/**
 * Open a template file in the editor
 */
async function openTemplate(templateId: string): Promise<void> {
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        return;
    }

    const jsonPath = path.join(templatesPath, `${templateId}.json`);
    if (await pathExists(jsonPath)) {
        const doc = await vscode.workspace.openTextDocument(jsonPath);
        await vscode.window.showTextDocument(doc);
    }
}

/**
 * Command: Select preferred AI model for template generation
 */
export async function handleSelectAIModel(): Promise<void> {
    try {
        // Get all available models
        const models = await templateGenerator.getAvailableModels();

        if (models.length === 0) {
            vscode.window.showErrorMessage(
                'No AI models available. Please install GitHub Copilot, Claude, or another LLM extension.'
            );
            return;
        }

        // Get current preference
        const config = vscode.workspace.getConfiguration('noted');
        const currentModelId = config.get<string>('templates.preferredModel');

        // Build quick pick items
        interface ModelQuickPickItem extends vscode.QuickPickItem {
            modelId: string;
        }

        const items: ModelQuickPickItem[] = models.map(model => {
            const isSelected = model.id === currentModelId;
            const icon = isSelected ? '$(check)' : '$(circle-outline)';

            return {
                modelId: model.id,
                label: `${icon} ${model.name}`,
                description: `${model.vendor}`,
                detail: model.description,
                picked: isSelected
            };
        });

        // Add "Automatic" option at the top
        items.unshift({
            modelId: '',
            label: `${currentModelId === '' ? '$(check)' : '$(circle-outline)'} Automatic (Recommended)`,
            description: 'Smart selection based on availability',
            detail: 'Uses Claude > GPT > Gemini > any available model',
            picked: currentModelId === ''
        });

        // Show picker
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select AI model for template generation',
            title: 'AI Model Selection',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (!selected) {
            return;
        }

        // Save preference
        await config.update('templates.preferredModel', selected.modelId, vscode.ConfigurationTarget.Global);

        const modelName = selected.modelId === '' ? 'Automatic selection' : selected.label.replace(/\$\(.*?\)\s/, '');
        vscode.window.showInformationMessage(`AI model set to: ${modelName}`);
    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(`Failed to select AI model: ${error.message}`);
        } else {
            vscode.window.showErrorMessage('Failed to select AI model: Unknown error');
        }
    }
}

/**
 * Command: Migrate legacy templates to JSON format
 */
export async function handleMigrateTemplates(): Promise<void> {
    try {
        const legacyTemplates = await findLegacyTemplates();

        if (legacyTemplates.length === 0) {
            vscode.window.showInformationMessage('No legacy templates to migrate. All templates are up to date!');
            return;
        }

        // Show confirmation dialog
        const templateList = legacyTemplates.slice(0, 10).map(t => `  • ${t.name}`).join('\n');
        const moreText = legacyTemplates.length > 10 ? `\n  ... and ${legacyTemplates.length - 10} more` : '';

        const answer = await vscode.window.showInformationMessage(
            `Found ${legacyTemplates.length} legacy template(s) to migrate:\n\n${templateList}${moreText}\n\nMigrate to new JSON format?`,
            { modal: true, detail: 'Legacy templates will be converted to JSON with enhanced metadata. Original files will be kept as backups.' },
            'Migrate',
            'Cancel'
        );

        if (answer !== 'Migrate') {
            return;
        }

        // Migrate templates with progress
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Migrating templates...',
            cancellable: false
        }, async (progress) => {
            const total = legacyTemplates.length;
            let migrated = 0;
            const errors: string[] = [];

            for (const legacyTemplate of legacyTemplates) {
                try {
                    progress.report({
                        increment: (1 / total) * 100,
                        message: `Migrating ${legacyTemplate.name}... (${migrated + 1}/${total})`
                    });

                    await migrateTemplate(legacyTemplate);
                    migrated++;
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                    errors.push(`${legacyTemplate.name}: ${errorMsg}`);
                }
            }

            // Show results
            if (errors.length === 0) {
                vscode.window.showInformationMessage(
                    `✅ Successfully migrated ${migrated} template(s) to JSON format!`,
                    'Open Templates Folder'
                ).then(action => {
                    if (action === 'Open Templates Folder') {
                        vscode.commands.executeCommand('noted.openTemplatesFolder');
                    }
                });
            } else {
                vscode.window.showWarningMessage(
                    `Migrated ${migrated}/${total} templates. ${errors.length} failed:\n\n${errors.join('\n')}`,
                    'Show Details'
                ).then(action => {
                    if (action === 'Show Details') {
                        vscode.window.showErrorMessage(errors.join('\n\n'));
                    }
                });
            }
        });
    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(`Failed to migrate templates: ${error.message}`);
        } else {
            vscode.window.showErrorMessage('Failed to migrate templates: Unknown error');
        }
    }
}

/**
 * Find all legacy templates (.txt/.md) that need migration
 * Exported for testing
 */
export async function findLegacyTemplates(): Promise<Array<{ name: string; path: string; format: string }>> {
    const templatesPath = getTemplatesPath();
    if (!templatesPath || !(await pathExists(templatesPath))) {
        return [];
    }

    const legacyTemplates: Array<{ name: string; path: string; format: string }> = [];

    try {
        const files = await vscode.workspace.fs.readDirectory(vscode.Uri.file(templatesPath));

        for (const [fileName, fileType] of files) {
            // Skip if not a file
            if (fileType !== vscode.FileType.File) {
                continue;
            }

            // Check if it's a legacy template (.txt or .md)
            const ext = path.extname(fileName);
            if (ext !== '.txt' && ext !== '.md') {
                continue;
            }

            const baseName = path.basename(fileName, ext);

            // Check if JSON version already exists
            const jsonPath = path.join(templatesPath, `${baseName}.json`);
            if (await pathExists(jsonPath)) {
                continue; // Already migrated
            }

            legacyTemplates.push({
                name: baseName,
                path: path.join(templatesPath, fileName),
                format: ext.slice(1) // Remove the leading dot
            });
        }
    } catch (error) {
        console.error('Error finding legacy templates:', error);
        throw error;
    }

    return legacyTemplates;
}

/**
 * Determine template category based on name keywords
 * Exported for testing
 */
export function determineTemplateCategory(templateName: string): string {
    const nameLower = templateName.toLowerCase();

    for (const [keyword, category] of Object.entries(TEMPLATE_CATEGORY_KEYWORDS)) {
        if (nameLower.includes(keyword)) {
            return category;
        }
    }

    return 'Custom';
}

/**
 * Convert kebab-case name to Title Case
 * Exported for testing
 */
export function convertToTitleCase(name: string): string {
    return name
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Migrate a single legacy template to JSON format
 */
async function migrateTemplate(legacyTemplate: { name: string; path: string; format: string }): Promise<void> {
    // Read the legacy template content
    const content = await readFile(legacyTemplate.path);

    // Extract variables from content
    const variables = extractVariablesFromContent(content);

    // Determine category from name (heuristic)
    const category = determineTemplateCategory(legacyTemplate.name);

    // Create Template object
    const template: Template = {
        id: legacyTemplate.name,
        name: convertToTitleCase(legacyTemplate.name),
        description: `Migrated from legacy ${legacyTemplate.format} template`,
        category,
        tags: [],
        version: '1.0.0',
        variables,
        content,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        usage_count: 0
    };

    // Save as JSON
    await saveTemplateAsJSON(template);

    // Rename legacy file to .bak (backup) instead of deleting
    const backupPath = `${legacyTemplate.path}.bak`;
    try {
        await vscode.workspace.fs.rename(
            vscode.Uri.file(legacyTemplate.path),
            vscode.Uri.file(backupPath),
            { overwrite: true }
        );
    } catch (error) {
        // If backup fails, just log it but don't fail the migration
        console.warn(`Could not backup legacy template ${legacyTemplate.name}:`, error);
    }
}

/**
 * Extract variable definitions from template content
 * Exported for testing
 */
export function extractVariablesFromContent(content: string): Template['variables'] {
    const variables: Template['variables'] = [];
    const variablePattern = /\{([a-z_][a-z0-9_]*)\}/gi;
    const matches = content.matchAll(variablePattern);

    const seen = new Set<string>();

    for (const match of matches) {
        const varName = match[1].toLowerCase();

        // Skip built-in placeholders (using constant from single source of truth)
        if (BUILT_IN_PLACEHOLDER_NAMES.includes(varName as any)) {
            continue;
        }

        // Skip duplicates
        if (seen.has(varName)) {
            continue;
        }

        seen.add(varName);

        // Create variable definition with sensible defaults
        variables.push({
            name: varName,
            type: 'string',
            required: true,
            prompt: `Enter value for ${varName}`,
            description: `Custom variable: ${varName}`
        });
    }

    return variables;
}
