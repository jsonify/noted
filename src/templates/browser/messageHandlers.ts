import * as vscode from 'vscode';
import * as path from 'path';
import { getTemplatesPath } from '../../services/configService';
import { pathExists, readFile, writeFile } from '../../services/fileSystemService';
import { Template, TemplateVariable } from '../TemplateTypes';
import { BUILT_IN_TEMPLATE_VARIABLES } from '../../constants';
import { getTemplateContent, getTemplateLines, highlightVariables, generateSamplePreview } from '../../services/templateService';
import { templateGenerator } from '../TemplateGenerator';
import { findTemplateFile, updateTemplateUsage } from './templateOperations';

/**
 * Handle creating a note from a template
 */
export async function handleCreateFromTemplate(templateId: string): Promise<void> {
    // Execute the openWithTemplate command with the template ID
    await vscode.commands.executeCommand('noted.openWithTemplate', templateId);

    // Update usage tracking
    await updateTemplateUsage(templateId);
}

/**
 * Handle editing a template
 */
export async function handleEditTemplate(templateId: string): Promise<void> {
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        vscode.window.showErrorMessage('Templates folder not configured');
        return;
    }

    const templateFile = await findTemplateFile(templatesPath, templateId);
    if (templateFile) {
        const document = await vscode.workspace.openTextDocument(templateFile.path);
        await vscode.window.showTextDocument(document);
    } else {
        vscode.window.showErrorMessage(`Template not found: ${templateId}`);
    }
}

/**
 * Handle deleting a template
 */
export async function handleDeleteTemplate(templateId: string): Promise<void> {
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        vscode.window.showErrorMessage('Templates folder not configured');
        return;
    }

    const answer = await vscode.window.showWarningMessage(
        `Delete template "${templateId}"?`,
        { modal: true },
        'Delete'
    );

    if (answer !== 'Delete') {
        return;
    }

    const templateFile = await findTemplateFile(templatesPath, templateId);
    if (templateFile) {
        await vscode.workspace.fs.delete(vscode.Uri.file(templateFile.path));
        vscode.window.showInformationMessage(`Template "${templateId}" deleted`);
    } else {
        vscode.window.showErrorMessage(`Template not found: ${templateId}`);
    }
}

/**
 * Handle duplicating a template
 */
export async function handleDuplicateTemplate(templateId: string): Promise<void> {
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        vscode.window.showErrorMessage('Templates folder not configured');
        return;
    }

    const newName = await vscode.window.showInputBox({
        prompt: 'Enter name for the duplicated template',
        value: `${templateId}-copy`,
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Template name cannot be empty';
            }
            return null;
        }
    });

    if (!newName) {
        return;
    }

    const templateFile = await findTemplateFile(templatesPath, templateId);
    if (!templateFile) {
        vscode.window.showErrorMessage(`Template not found: ${templateId}`);
        return;
    }

    if (templateFile.type === 'json') {
        const content = await readFile(templateFile.path);
        const template: Template = JSON.parse(content);

        // Update template metadata
        template.id = newName;
        template.name = newName.charAt(0).toUpperCase() + newName.slice(1).replace(/-/g, ' ');
        template.created = new Date().toISOString();
        template.modified = new Date().toISOString();

        const newPath = path.join(templatesPath, `${newName}.json`);
        await writeFile(newPath, JSON.stringify(template, null, 2));
        vscode.window.showInformationMessage(`Template duplicated as "${newName}"`);
    } else {
        // Legacy template
        const content = await readFile(templateFile.path);
        const newPath = path.join(templatesPath, `${newName}.${templateFile.type}`);
        await writeFile(newPath, content);
        vscode.window.showInformationMessage(`Template duplicated as "${newName}"`);
    }
}

/**
 * Handle exporting a template
 */
export async function handleExportTemplate(templateId: string): Promise<void> {
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        vscode.window.showErrorMessage('Templates folder not configured');
        return;
    }

    const templateFile = await findTemplateFile(templatesPath, templateId);
    if (!templateFile) {
        vscode.window.showErrorMessage(`Template not found: ${templateId}`);
        return;
    }

    const filters: { [name: string]: string[] } = templateFile.type === 'json'
        ? { 'JSON': ['json'] }
        : { 'Text': ['txt', 'md'] };

    const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(`${templateId}.${templateFile.type}`),
        filters: filters
    });

    if (uri) {
        const content = await readFile(templateFile.path);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
        vscode.window.showInformationMessage(`Template exported to ${uri.fsPath}`);
    }
}

/**
 * Handle getting a preview of a template (limited lines)
 */
export async function handleGetPreview(panel: vscode.WebviewPanel, templateId: string, maxLines: number): Promise<void> {
    const templatesPath = getTemplatesPath();
    const content = await getTemplateContent(templateId, templatesPath);

    if (!content) {
        panel.webview.postMessage({
            command: 'previewResponse',
            templateId,
            maxLines,
            error: 'Template not found'
        });
        return;
    }

    const { lines, hasMore } = getTemplateLines(content, maxLines);
    const highlightedContent = highlightVariables(lines);

    panel.webview.postMessage({
        command: 'previewResponse',
        templateId,
        maxLines,
        content: highlightedContent,
        hasMore
    });
}

/**
 * Handle getting a full preview of a template
 */
export async function handleGetFullPreview(panel: vscode.WebviewPanel, templateId: string): Promise<void> {
    const templatesPath = getTemplatesPath();
    const content = await getTemplateContent(templateId, templatesPath);

    if (!content) {
        panel.webview.postMessage({
            command: 'fullPreviewResponse',
            templateId,
            error: 'Template not found'
        });
        return;
    }

    const highlightedContent = highlightVariables(content);
    const samplePreview = generateSamplePreview(content);

    panel.webview.postMessage({
        command: 'fullPreviewResponse',
        templateId,
        content: highlightedContent,
        samplePreview
    });
}

/**
 * Handle getting template data for variable editor
 */
export async function handleGetTemplateData(panel: vscode.WebviewPanel, templateId: string): Promise<void> {
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        panel.webview.postMessage({
            command: 'templateDataResponse',
            templateId,
            error: 'Templates folder not configured'
        });
        return;
    }

    const templateFile = await findTemplateFile(templatesPath, templateId);
    if (!templateFile) {
        panel.webview.postMessage({
            command: 'templateDataResponse',
            templateId,
            error: 'Template not found'
        });
        return;
    }

    // Only JSON templates support variables
    if (templateFile.type !== 'json') {
        panel.webview.postMessage({
            command: 'templateDataResponse',
            templateId,
            error: 'Only JSON templates support custom variables'
        });
        return;
    }

    try {
        const content = await readFile(templateFile.path);
        const template: Template = JSON.parse(content);

        panel.webview.postMessage({
            command: 'templateDataResponse',
            templateId,
            template: {
                id: template.id,
                name: template.name,
                description: template.description,
                variables: template.variables || [],
                content: template.content
            },
            builtInVariables: [...BUILT_IN_TEMPLATE_VARIABLES]
        });
    } catch (error) {
        panel.webview.postMessage({
            command: 'templateDataResponse',
            templateId,
            error: 'Failed to load template data'
        });
    }
}

/**
 * Handle saving template variables
 */
export async function handleSaveTemplateVariables(
    panel: vscode.WebviewPanel,
    templateId: string,
    variables: TemplateVariable[]
): Promise<void> {
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        panel.webview.postMessage({
            command: 'saveVariablesResponse',
            templateId,
            success: false,
            error: 'Templates folder not configured'
        });
        return;
    }

    const templateFile = await findTemplateFile(templatesPath, templateId);
    if (!templateFile || templateFile.type !== 'json') {
        panel.webview.postMessage({
            command: 'saveVariablesResponse',
            templateId,
            success: false,
            error: 'Template not found or not a JSON template'
        });
        return;
    }

    try {
        const content = await readFile(templateFile.path);
        const template: Template = JSON.parse(content);

        // Update variables
        template.variables = variables;
        template.modified = new Date().toISOString();

        // Write back to file
        await writeFile(templateFile.path, JSON.stringify(template, null, 2));

        panel.webview.postMessage({
            command: 'saveVariablesResponse',
            templateId,
            success: true
        });

        vscode.window.showInformationMessage(`Template variables updated for "${template.name}"`);
    } catch (error) {
        panel.webview.postMessage({
            command: 'saveVariablesResponse',
            templateId,
            success: false,
            error: 'Failed to save template variables'
        });
    }
}

/**
 * Handle real-time variable validation (Phase 3)
 */
export async function handleValidateVariable(
    panel: vscode.WebviewPanel,
    templateId: string,
    variable: TemplateVariable,
    existingVariables: TemplateVariable[],
    originalName?: string
): Promise<void> {
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        panel.webview.postMessage({
            command: 'validateVariableResponse',
            isValid: false,
            errors: ['Templates folder not configured'],
            warnings: []
        });
        return;
    }

    const templateFile = await findTemplateFile(templatesPath, templateId);
    if (!templateFile || templateFile.type !== 'json') {
        panel.webview.postMessage({
            command: 'validateVariableResponse',
            isValid: false,
            errors: ['Template not found or not a JSON template'],
            warnings: []
        });
        return;
    }

    try {
        const content = await readFile(templateFile.path);
        const template: Template = JSON.parse(content);

        // Perform advanced validation
        const validation = templateGenerator.validateVariableAdvanced(
            variable,
            template.content,
            existingVariables,
            originalName
        );

        panel.webview.postMessage({
            command: 'validateVariableResponse',
            isValid: validation.isValid,
            errors: validation.errors,
            warnings: validation.warnings
        });
    } catch (error) {
        panel.webview.postMessage({
            command: 'validateVariableResponse',
            isValid: false,
            errors: ['Failed to validate variable'],
            warnings: []
        });
    }
}

/**
 * Handle variable usage info request (Phase 3)
 */
export async function handleGetVariableUsageInfo(
    panel: vscode.WebviewPanel,
    templateId: string,
    variableName: string
): Promise<void> {
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        panel.webview.postMessage({
            command: 'variableUsageInfoResponse',
            variableName,
            count: 0,
            positions: []
        });
        return;
    }

    const templateFile = await findTemplateFile(templatesPath, templateId);
    if (!templateFile || templateFile.type !== 'json') {
        panel.webview.postMessage({
            command: 'variableUsageInfoResponse',
            variableName,
            count: 0,
            positions: []
        });
        return;
    }

    try {
        const content = await readFile(templateFile.path);
        const template: Template = JSON.parse(content);

        // Get usage count and positions
        const count = templateGenerator.getVariableUsageCount(variableName, template.content);
        const positions = templateGenerator.getVariableUsagePositions(variableName, template.content);

        panel.webview.postMessage({
            command: 'variableUsageInfoResponse',
            variableName,
            count,
            positions
        });
    } catch (error) {
        panel.webview.postMessage({
            command: 'variableUsageInfoResponse',
            variableName,
            count: 0,
            positions: []
        });
    }
}

/**
 * Handle export variables request (Phase 3)
 */
export async function handleExportVariables(
    panel: vscode.WebviewPanel,
    templateId: string
): Promise<void> {
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        vscode.window.showErrorMessage('Templates folder not configured');
        return;
    }

    const templateFile = await findTemplateFile(templatesPath, templateId);
    if (!templateFile || templateFile.type !== 'json') {
        vscode.window.showErrorMessage('Template not found or not a JSON template');
        return;
    }

    try {
        const content = await readFile(templateFile.path);
        const template: Template = JSON.parse(content);

        // Prepare export data
        const exportData = {
            templateName: template.name,
            templateId: template.id,
            exportedAt: new Date().toISOString(),
            variables: template.variables || []
        };

        // Prompt for save location
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(path.join(templatesPath, `${templateId}-variables.json`)),
            filters: {
                'JSON': ['json']
            }
        });

        if (uri) {
            await writeFile(uri.fsPath, JSON.stringify(exportData, null, 2));
            vscode.window.showInformationMessage(`Variables exported to ${path.basename(uri.fsPath)}`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to export variables: ${errorMessage}`);
        console.error('Failed to export variables:', error);
    }
}

/**
 * Handle import variables request (Phase 3)
 */
export async function handleImportVariables(
    panel: vscode.WebviewPanel,
    templateId: string,
    variablesJson: string
): Promise<void> {
    // Parse JSON
    let importData;
    try {
        importData = JSON.parse(variablesJson);
    } catch (error) {
        panel.webview.postMessage({
            command: 'importVariablesResponse',
            success: false,
            error: 'Invalid JSON format. Failed to parse variables file.'
        });
        return;
    }

    // Validate import data structure
    if (!importData.variables || !Array.isArray(importData.variables)) {
        panel.webview.postMessage({
            command: 'importVariablesResponse',
            success: false,
            error: 'Invalid variables file format. Missing or invalid "variables" array.'
        });
        return;
    }

    // Check templates path
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        panel.webview.postMessage({
            command: 'importVariablesResponse',
            success: false,
            error: 'Templates folder not configured'
        });
        return;
    }

    // Validate template exists
    const templateFile = await findTemplateFile(templatesPath, templateId);
    if (!templateFile || templateFile.type !== 'json') {
        panel.webview.postMessage({
            command: 'importVariablesResponse',
            success: false,
            error: 'Template not found or not a JSON template'
        });
        return;
    }

    // Validate all imported variables
    const validVariables: TemplateVariable[] = [];
    const errors: string[] = [];

    for (const variable of importData.variables) {
        const validation = templateGenerator.validateVariable(variable, validVariables);
        if (validation.isValid) {
            validVariables.push(variable);
        } else {
            errors.push(`Variable '${variable.name}': ${validation.error}`);
        }
    }

    if (errors.length > 0) {
        panel.webview.postMessage({
            command: 'importVariablesResponse',
            success: false,
            error: `Import validation failed:\n${errors.join('\n')}`
        });
        return;
    }

    // Send valid variables back to webview for user review
    panel.webview.postMessage({
        command: 'importVariablesResponse',
        success: true,
        variables: validVariables
    });

    vscode.window.showInformationMessage(`Imported ${validVariables.length} variable(s). Review and save to apply.`);
}
