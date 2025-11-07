/**
 * Prompt Template command handlers
 * All commands are designed to be registered in extension.ts
 */

import * as vscode from 'vscode';
import { PromptTemplateService, PromptTemplate } from '../services/promptTemplateService';

/**
 * Handle creating a new prompt template
 */
export async function handleCreatePromptTemplate(
    promptTemplateService: PromptTemplateService
): Promise<void> {
    try {
        // Prompt for template name
        const name = await vscode.window.showInputBox({
            prompt: 'Enter template name',
            placeHolder: 'My Custom Template',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Template name is required';
                }
                return undefined;
            }
        });

        if (!name) {
            return; // User cancelled
        }

        // Prompt for description
        const description = await vscode.window.showInputBox({
            prompt: 'Enter template description',
            placeHolder: 'Focus on specific aspects of the note...',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Description is required';
                }
                return undefined;
            }
        });

        if (!description) {
            return; // User cancelled
        }

        // Provide starter template prompt
        const starterPrompt = `You are analyzing a note from a developer's workspace note-taking system.
Provide a concise summary of the following note.

Note content:
---
{content}
---

Summary requirements:
- Length: {length}
- Format: {format}
- Focus on: [CUSTOMIZE THIS - what should the summary focus on?]

{actionItemsPrompt}

{keywordsPrompt}

Provide only the summary without preamble.`;

        // Create template
        const template = await promptTemplateService.createTemplate(name, description, starterPrompt);

        // Ask if user wants to edit it now
        const edit = await vscode.window.showInformationMessage(
            `Template "${template.name}" created successfully!`,
            'Edit Now',
            'Done'
        );

        if (edit === 'Edit Now') {
            await handleEditPromptTemplate(promptTemplateService, template.id);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create template: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handle editing an existing prompt template
 */
export async function handleEditPromptTemplate(
    promptTemplateService: PromptTemplateService,
    templateId?: string
): Promise<void> {
    try {
        // If no template ID provided, let user pick one
        let template: PromptTemplate | null = null;

        if (templateId) {
            template = await promptTemplateService.getTemplate(templateId);
        } else {
            // Show picker for custom templates only
            const customTemplates = await promptTemplateService.getCustomTemplates();

            if (customTemplates.length === 0) {
                vscode.window.showInformationMessage('No custom templates to edit. Create one first!');
                return;
            }

            const items = customTemplates.map(t => ({
                label: t.name,
                description: t.description,
                template: t
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a template to edit'
            });

            if (!selected) {
                return; // User cancelled
            }

            template = selected.template;
        }

        if (!template) {
            vscode.window.showErrorMessage('Template not found');
            return;
        }

        if (template.builtIn) {
            vscode.window.showErrorMessage('Cannot edit built-in templates. Duplicate it first to customize.');
            return;
        }

        // Create a temporary document with the template for editing
        const doc = await vscode.workspace.openTextDocument({
            content: template.prompt,
            language: 'markdown'
        });

        const editor = await vscode.window.showTextDocument(doc, { preview: false });

        // Show instructions
        vscode.window.showInformationMessage(
            'Edit the prompt template. Available variables: {content}, {length}, {format}, {filename}, {actionItemsPrompt}, {keywordsPrompt}',
            'Save Changes'
        ).then(async (action) => {
            if (action === 'Save Changes') {
                const updatedPrompt = editor.document.getText();

                // Update template
                await promptTemplateService.updateTemplate(template.id, {
                    prompt: updatedPrompt
                });

                vscode.window.showInformationMessage(`Template "${template.name}" updated successfully!`);

                // Close the temporary editor
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            }
        });
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to edit template: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handle deleting a prompt template
 */
export async function handleDeletePromptTemplate(
    promptTemplateService: PromptTemplateService
): Promise<void> {
    try {
        // Show picker for custom templates only
        const customTemplates = await promptTemplateService.getCustomTemplates();

        if (customTemplates.length === 0) {
            vscode.window.showInformationMessage('No custom templates to delete.');
            return;
        }

        const items = customTemplates.map(t => ({
            label: t.name,
            description: t.description,
            template: t
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a template to delete'
        });

        if (!selected) {
            return; // User cancelled
        }

        // Confirm deletion
        const confirm = await vscode.window.showWarningMessage(
            `Delete template "${selected.template.name}"?`,
            { modal: true },
            'Delete',
            'Cancel'
        );

        if (confirm !== 'Delete') {
            return;
        }

        // Delete template
        await promptTemplateService.deleteTemplate(selected.template.id);

        vscode.window.showInformationMessage(`Template "${selected.template.name}" deleted successfully!`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to delete template: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handle duplicating a prompt template
 */
export async function handleDuplicatePromptTemplate(
    promptTemplateService: PromptTemplateService
): Promise<void> {
    try {
        // Show picker for all templates
        const allTemplates = await promptTemplateService.getAllTemplates();

        if (allTemplates.length === 0) {
            vscode.window.showInformationMessage('No templates available to duplicate.');
            return;
        }

        const items = allTemplates.map(t => ({
            label: t.name,
            description: t.builtIn ? '$(symbol-misc) Built-in' : '$(symbol-file) Custom',
            detail: t.description,
            template: t
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a template to duplicate'
        });

        if (!selected) {
            return; // User cancelled
        }

        // Prompt for new name
        const newName = await vscode.window.showInputBox({
            prompt: 'Enter name for duplicated template',
            placeHolder: `Copy of ${selected.template.name}`,
            value: `Copy of ${selected.template.name}`,
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Template name is required';
                }
                return undefined;
            }
        });

        if (!newName) {
            return; // User cancelled
        }

        // Duplicate template
        const newTemplate = await promptTemplateService.duplicateTemplate(selected.template.id, newName);

        vscode.window.showInformationMessage(`Template duplicated as "${newTemplate.name}"!`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to duplicate template: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handle listing all prompt templates
 */
export async function handleListPromptTemplates(
    promptTemplateService: PromptTemplateService
): Promise<void> {
    try {
        const templates = await promptTemplateService.getAllTemplates();

        if (templates.length === 0) {
            vscode.window.showInformationMessage('No prompt templates available.');
            return;
        }

        // Create markdown content for display
        let content = '# Prompt Templates\n\n';
        content += `Total templates: ${templates.length}\n\n`;

        // Group by built-in and custom
        const builtIn = templates.filter(t => t.builtIn);
        const custom = templates.filter(t => !t.builtIn);

        if (builtIn.length > 0) {
            content += '## Built-in Templates\n\n';
            for (const template of builtIn) {
                content += `### ${template.name}\n\n`;
                content += `**Description:** ${template.description}\n\n`;
                content += `**Variables:** ${template.variables.join(', ')}\n\n`;
                content += '---\n\n';
            }
        }

        if (custom.length > 0) {
            content += '## Custom Templates\n\n';
            for (const template of custom) {
                content += `### ${template.name}\n\n`;
                content += `**Description:** ${template.description}\n\n`;
                content += `**Variables:** ${template.variables.join(', ')}\n\n`;
                content += `**ID:** ${template.id}\n\n`;
                content += '---\n\n';
            }
        }

        // Open in new editor
        const doc = await vscode.workspace.openTextDocument({
            content,
            language: 'markdown'
        });

        await vscode.window.showTextDocument(doc, { preview: false });
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to list templates: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handle viewing template variables reference
 */
export async function handleViewTemplateVariables(): Promise<void> {
    const content = `# Prompt Template Variables

When creating custom prompt templates, you can use these variables:

## Basic Variables

- **{content}** - The note content being summarized
- **{length}** - Summary length setting (short/medium/long)
- **{format}** - Output format setting (paragraph/bullets/structured)
- **{filename}** - The name of the note file
- **{date}** - Current date
- **{noteCount}** - Number of notes being summarized (for multi-note summaries)

## Computed Variables

- **{wordCount}** - Target word count based on {length} setting
  - short: 50 words
  - medium: 150 words
  - long: 300 words

## Dynamic Prompt Sections

These are automatically populated based on user settings:

- **{actionItemsPrompt}** - Prompt section for action items extraction (if enabled)
- **{keywordsPrompt}** - Prompt section for keyword/tag extraction (if enabled)

## Example Template

\`\`\`
You are analyzing a note from a developer's workspace.
Provide a concise summary of the following note.

Note content:
---
{content}
---

Summary requirements:
- Length: {length} (approximately {wordCount} words)
- Format: {format}
- Filename: {filename}

{actionItemsPrompt}

{keywordsPrompt}

Provide only the summary without preamble.
\`\`\`

## Tips

1. Use {content} to insert the note content
2. Use {actionItemsPrompt} and {keywordsPrompt} for consistent behavior with settings
3. Be specific about what you want the AI to focus on
4. Structure your prompt with clear sections and instructions
5. End with "Provide only the summary without preamble" for clean output
`;

    const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'markdown'
    });

    await vscode.window.showTextDocument(doc, { preview: false });
}
