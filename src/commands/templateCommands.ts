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
        preview: false, // Don't use preview mode to avoid save prompts
        viewColumn: vscode.ViewColumn.Beside
    });

    // Show non-modal message so user can review the preview
    const result = await vscode.window.showInformationMessage(
        `📄 Review the template preview on the right, then choose an action:`,
        'Accept & Save Template',
        'Cancel'
    );

    // Close the preview document without save prompt
    const uri = editor.document.uri;
    await vscode.window.showTextDocument(editor.document, { preview: true }); // Switch to preview mode
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

    // Delete from workspace if it's an untitled document
    try {
        await vscode.workspace.fs.delete(uri, { useTrash: false });
    } catch {
        // Ignore errors - untitled documents don't need deletion
    }

    return result === 'Accept & Save Template';
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
        preview: false, // Don't use preview mode to avoid save prompts
        viewColumn: vscode.ViewColumn.Beside
    });

    // Show non-modal message so user can review the enhancements
    const result = await vscode.window.showInformationMessage(
        `📄 Review the enhancements on the right, then choose an action:`,
        'Accept & Save Changes',
        'Cancel'
    );

    // Close the preview document without save prompt
    const uri = editor.document.uri;
    await vscode.window.showTextDocument(editor.document, { preview: true }); // Switch to preview mode
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

    // Delete from workspace if it's an untitled document
    try {
        await vscode.workspace.fs.delete(uri, { useTrash: false });
    } catch {
        // Ignore errors - untitled documents don't need deletion
    }

    return result === 'Accept & Save Changes';
}

/**
 * Generate preview text for a template
 */
function generatePreviewText(template: Template): string {
    const lines = [
        `# 📄 Template Preview: ${template.name}`,
        '',
        '> **Review this template preview, then click "Accept & Save Template" in the notification below.**',
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
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('💡 **Next Steps:**');
    lines.push('- Click **"Accept & Save Template"** to save this template');
    lines.push('- Click **"Cancel"** to discard and start over');
    lines.push('- After saving, find it in the Templates panel under any category');

    return lines.join('\n');
}

/**
 * Generate comparison text for before/after enhancement
 */
function generateComparisonText(original: Template, enhanced: Template): string {
    const lines = [
        `# ✨ Template Enhancement: ${enhanced.name}`,
        '',
        '> **Review the AI improvements below, then click "Accept & Save Changes" in the notification.**',
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
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('💡 **Next Steps:**');
    lines.push('- Click **"Accept & Save Changes"** to save the enhanced template');
    lines.push('- Click **"Cancel"** to keep the original version');

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
