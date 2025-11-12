import * as vscode from 'vscode';
import * as path from 'path';
import { templateGenerator } from '../templates/TemplateGenerator';
import { Template } from '../templates/TemplateMetadata';
import { getTemplatesPath, getFileFormat } from '../services/configService';
import { writeFile, readFile, pathExists } from '../services/fileSystemService';
import { getCustomTemplates } from '../services/templateService';

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

            vscode.window.showInformationMessage(
                `Template "${template.name}" created successfully!`,
                'Open Template'
            ).then((selection) => {
                if (selection === 'Open Template') {
                    openTemplate(template.id);
                }
            });
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

            vscode.window.showInformationMessage(
                `Template "${enhancedTemplate.name}" enhanced successfully!`,
                'Open Template'
            ).then((selection) => {
                if (selection === 'Open Template') {
                    openTemplate(enhancedTemplate.id);
                }
            });
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
 * Show a preview webview for a generated template
 */
async function showTemplatePreview(template: Template): Promise<boolean> {
    // For now, use a simple modal dialog with preview
    // TODO: Implement full webview in future enhancement
    const previewContent = generatePreviewText(template);

    const result = await vscode.window.showInformationMessage(
        'Template Preview',
        { modal: true, detail: previewContent },
        'Accept',
        'Cancel'
    );

    return result === 'Accept';
}

/**
 * Show a before/after comparison for template enhancement
 */
async function showTemplateEnhancementPreview(
    original: Template,
    enhanced: Template
): Promise<boolean> {
    // For now, use a simple modal dialog
    // TODO: Implement side-by-side diff webview in future enhancement
    const previewContent = `ENHANCEMENTS:\n\n${generateComparisonText(original, enhanced)}`;

    const result = await vscode.window.showInformationMessage(
        'Template Enhancement Preview',
        { modal: true, detail: previewContent },
        'Accept',
        'Cancel'
    );

    return result === 'Accept';
}

/**
 * Generate preview text for a template
 */
function generatePreviewText(template: Template): string {
    const lines = [
        `Name: ${template.name}`,
        `Description: ${template.description}`,
        `Category: ${template.category}`,
        `Tags: ${template.tags.join(', ')}`,
        '',
        'Variables:'
    ];

    if (template.variables.length === 0) {
        lines.push('  (none)');
    } else {
        for (const v of template.variables) {
            lines.push(`  - ${v.name} (${v.type})${v.required ? ' *required*' : ''}: ${v.prompt || ''}`);
        }
    }

    lines.push('', 'Content:', '---', template.content, '---');

    return lines.join('\n');
}

/**
 * Generate comparison text for before/after enhancement
 */
function generateComparisonText(original: Template, enhanced: Template): string {
    const lines = ['Changes:'];

    // Compare variables
    const newVariables = enhanced.variables.filter(
        v => !original.variables.find(ov => ov.name === v.name)
    );

    if (newVariables.length > 0) {
        lines.push('', 'New Variables:');
        for (const v of newVariables) {
            lines.push(`  + ${v.name} (${v.type}): ${v.prompt || ''}`);
        }
    }

    // Compare tags
    const newTags = enhanced.tags.filter(t => !original.tags.includes(t));
    if (newTags.length > 0) {
        lines.push('', `New Tags: ${newTags.join(', ')}`);
    }

    lines.push('', 'Enhanced Content:', '---', enhanced.content, '---');

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
    const fs = require('fs').promises;
    await fs.mkdir(templatesPath, { recursive: true });

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
