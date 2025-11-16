import * as vscode from 'vscode';
import * as path from 'path';
import { getTemplatesPath, getFileFormat } from '../services/configService';
import { pathExists, readFile, readDirectory, writeFile } from '../services/fileSystemService';
import { Template, TemplateDifficulty, TemplateVariable } from './TemplateTypes';
import { BUILT_IN_TEMPLATES, BUILT_IN_TEMPLATE_INFO, BUILT_IN_TEMPLATE_VARIABLES } from '../constants';
import { TemplatesTreeProvider } from '../providers/templatesTreeProvider';
import { getTemplateContent, getTemplateLines, highlightVariables, generateSamplePreview } from '../services/templateService';
import { templateGenerator } from './TemplateGenerator';

// Module-level reference to templates tree provider for refreshing
let templatesProvider: TemplatesTreeProvider | undefined;

/**
 * Template display info for the browser
 */
interface TemplateDisplayInfo {
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

/**
 * Show the template browser webview
 */
export async function showTemplateBrowser(context: vscode.ExtensionContext, provider?: TemplatesTreeProvider): Promise<void> {
    // Store reference to templates provider for refreshing after operations
    templatesProvider = provider;

    const templatesPath = getTemplatesPath();

    const panel = vscode.window.createWebviewPanel(
        'notedTemplateBrowser',
        'Template Browser',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    // Load all templates
    const templates = await loadAllTemplates();

    // Set the initial HTML
    panel.webview.html = getTemplateBrowserHtml(templates);

    // Helper function to refresh webview templates
    const refreshWebviewTemplates = async () => {
        const updatedTemplates = await loadAllTemplates();
        panel.webview.postMessage({
            command: 'updateTemplates',
            templates: updatedTemplates
        });
    };

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'createFromTemplate':
                    await handleCreateFromTemplate(message.templateId);
                    break;

                case 'editTemplate':
                    await handleEditTemplate(message.templateId);
                    break;

                case 'deleteTemplate':
                    await handleDeleteTemplate(message.templateId);
                    await refreshWebviewTemplates();
                    templatesProvider?.refresh(); // Refresh sidebar tree view
                    break;

                case 'duplicateTemplate':
                    await handleDuplicateTemplate(message.templateId);
                    await refreshWebviewTemplates();
                    templatesProvider?.refresh(); // Refresh sidebar tree view
                    break;

                case 'exportTemplate':
                    await handleExportTemplate(message.templateId);
                    break;

                case 'refresh':
                    await refreshWebviewTemplates();
                    break;

                case 'createNewTemplate':
                    await handleCreateNewTemplate();
                    await refreshWebviewTemplates();
                    templatesProvider?.refresh(); // Refresh sidebar tree view
                    break;

                case 'createTemplateWithVariables':
                    await handleCreateTemplateWithVariables();
                    await refreshWebviewTemplates();
                    templatesProvider?.refresh(); // Refresh sidebar tree view
                    break;

                case 'getPreview':
                    await handleGetPreview(panel, message.templateId, message.maxLines);
                    break;

                case 'getFullPreview':
                    await handleGetFullPreview(panel, message.templateId);
                    break;

                case 'getTemplateData':
                    await handleGetTemplateData(panel, message.templateId);
                    break;

                case 'saveTemplateVariables':
                    await handleSaveTemplateVariables(panel, message.templateId, message.variables);
                    await refreshWebviewTemplates();
                    templatesProvider?.refresh();
                    break;

                case 'validateVariable':
                    await handleValidateVariable(panel, message.templateId, message.variable, message.existingVariables, message.originalName);
                    break;

                case 'getVariableUsageInfo':
                    await handleGetVariableUsageInfo(panel, message.templateId, message.variableName);
                    break;

                case 'exportVariables':
                    await handleExportVariables(panel, message.templateId);
                    break;

                case 'importVariables':
                    await handleImportVariables(panel, message.templateId, message.variablesJson);
                    break;
            }
        },
        undefined,
        context.subscriptions
    );
}

/**
 * Helper function to find a template file (JSON or legacy)
 * Returns { path: string, type: 'json' | 'txt' | 'md' } or null if not found
 */
async function findTemplateFile(templatesPath: string, templateId: string): Promise<{ path: string; type: 'json' | 'txt' | 'md' } | null> {
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
async function loadAllTemplates(): Promise<TemplateDisplayInfo[]> {
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
                    // Load legacy template
                    // Check if a JSON version exists (skip if it does)
                    const jsonPath = path.join(templatesPath, `${baseName}.json`);
                    if (await pathExists(jsonPath)) {
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
 * Handle creating a note from a template
 */
async function handleCreateFromTemplate(templateId: string): Promise<void> {
    // Execute the openWithTemplate command with the template ID
    await vscode.commands.executeCommand('noted.openWithTemplate', templateId);

    // Update usage tracking
    await updateTemplateUsage(templateId);
}

/**
 * Handle creating a new custom template
 */
async function handleCreateNewTemplate(): Promise<void> {
    // Execute the createCustomTemplate command
    await vscode.commands.executeCommand('noted.createCustomTemplate');
}

/**
 * Handle creating a new template with variables
 */
async function handleCreateTemplateWithVariables(): Promise<void> {
    // Execute the createTemplateWithVariables command
    await vscode.commands.executeCommand('noted.createTemplateWithVariables');
}

/**
 * Handle editing a template
 */
async function handleEditTemplate(templateId: string): Promise<void> {
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
async function handleDeleteTemplate(templateId: string): Promise<void> {
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
async function handleDuplicateTemplate(templateId: string): Promise<void> {
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
async function handleExportTemplate(templateId: string): Promise<void> {
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
async function handleGetPreview(panel: vscode.WebviewPanel, templateId: string, maxLines: number): Promise<void> {
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
async function handleGetFullPreview(panel: vscode.WebviewPanel, templateId: string): Promise<void> {
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
async function handleGetTemplateData(panel: vscode.WebviewPanel, templateId: string): Promise<void> {
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
async function handleSaveTemplateVariables(
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
async function handleValidateVariable(
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
async function handleGetVariableUsageInfo(
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
async function handleExportVariables(
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
async function handleImportVariables(
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

/**
 * Update template usage tracking
 */
async function updateTemplateUsage(templateId: string): Promise<void> {
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

/**
 * Generate the HTML content for the template browser webview
 */
function getTemplateBrowserHtml(templates: TemplateDisplayInfo[]): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Template Browser</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .header h1 {
            font-size: 24px;
            font-weight: 600;
        }

        .controls {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .search-box {
            flex: 1;
            min-width: 300px;
            padding: 8px 12px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-size: 14px;
        }

        .view-toggle {
            display: flex;
            gap: 5px;
        }

        .btn {
            padding: 8px 16px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        }

        .btn:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        .btn-secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .enhanced-filters {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            align-items: center;
            margin-bottom: 20px;
            padding: 15px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 6px;
        }

        .filter-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .filter-label {
            font-size: 13px;
            color: var(--vscode-foreground);
            font-weight: 500;
            white-space: nowrap;
        }

        .filter-select {
            padding: 6px 10px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-size: 13px;
            cursor: pointer;
            min-width: 140px;
        }

        .filter-select:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: -1px;
        }

        .filter-badge-container {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-left: auto;
            padding: 8px 12px;
            background: var(--vscode-button-background);
            border-radius: 4px;
        }

        .filter-badge {
            font-size: 12px;
            color: var(--vscode-button-foreground);
            font-weight: 600;
        }

        .btn-clear-filters {
            padding: 4px 12px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            transition: background 0.2s;
        }

        .btn-clear-filters:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .filters {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 20px;
        }

        .filter-btn {
            padding: 6px 12px;
            background: transparent;
            color: var(--vscode-foreground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s;
        }

        .filter-btn.active {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-color: var(--vscode-button-background);
        }

        .templates-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }

        .templates-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .template-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
        }

        .template-card:hover {
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .template-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
        }

        .template-title-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;
        }

        .template-icon {
            font-size: 20px;
            flex-shrink: 0;
        }

        .template-title {
            font-size: 16px;
            font-weight: 600;
        }

        .template-badges {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-bottom: 8px;
        }

        .template-category {
            font-size: 11px;
            display: inline-block;
            padding: 3px 8px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 3px;
            font-weight: 500;
        }

        .status-badge {
            font-size: 10px;
            padding: 3px 6px;
            border-radius: 3px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .status-new {
            background: var(--vscode-gitDecoration-addedResourceForeground);
            color: var(--vscode-editor-background);
        }

        .status-popular {
            background: var(--vscode-list-warningForeground);
            color: var(--vscode-editor-background);
        }

        .difficulty-stars {
            font-size: 14px;
            color: var(--vscode-list-warningForeground);
            letter-spacing: 1px;
        }

        .filetype-badge {
            font-size: 11px;
            padding: 3px 8px;
            border-radius: 3px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            font-family: monospace;
        }

        .template-description {
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 12px;
            line-height: 1.5;
        }

        .template-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 12px;
        }

        .tag {
            font-size: 11px;
            padding: 3px 8px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border-radius: 3px;
        }

        .template-meta {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 12px;
        }

        .template-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        .action-btn {
            flex: 1;
            min-width: fit-content;
            padding: 6px 12px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.2s;
        }

        .action-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .action-btn.primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .action-btn.primary:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .action-btn.danger {
            background: var(--vscode-inputValidation-errorBackground);
            color: var(--vscode-inputValidation-errorForeground);
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--vscode-descriptionForeground);
        }

        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }

        .empty-state-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .stats {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            padding: 15px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 6px;
        }

        .stat-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .stat-value {
            font-size: 24px;
            font-weight: 600;
        }

        .stat-label {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }

        /* Preview System Styles */

        /* Level 1: Hover Tooltip */
        .template-card {
            position: relative;
        }

        .template-tooltip {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--vscode-editorHoverWidget-background);
            border: 1px solid var(--vscode-editorHoverWidget-border);
            border-radius: 4px;
            padding: 12px;
            margin-top: 8px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            display: none;
            max-width: 600px;
        }

        .template-card:hover .template-tooltip {
            display: block;
        }

        .tooltip-content {
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
            line-height: 1.5;
            color: var(--vscode-editorHoverWidget-foreground);
            white-space: pre-wrap;
            word-wrap: break-word;
        }

        .tooltip-footer {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid var(--vscode-panel-border);
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }

        /* Phase 3: Usage Guidance Styles */
        .guidance-section {
            margin-top: 12px;
            border-top: 1px solid var(--vscode-panel-border);
            padding-top: 12px;
        }

        .guidance-toggle {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: transparent;
            color: var(--vscode-textLink-foreground);
            border: 1px solid var(--vscode-textLink-foreground);
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.2s, color 0.2s, border-color 0.2s;
            width: 100%;
        }

        .guidance-toggle:hover {
            background: var(--vscode-textLink-activeForeground);
            color: var(--vscode-editor-background);
        }

        .guidance-toggle-icon {
            transition: transform 0.2s;
        }

        .guidance-toggle.expanded .guidance-toggle-icon {
            transform: rotate(90deg);
        }

        .guidance-time {
            font-size: 11px;
            opacity: 0.8;
            margin-left: auto;
        }

        .guidance-content {
            display: none;
            margin-top: 12px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 12px;
        }

        .guidance-content.visible {
            display: block;
        }

        .guidance-item {
            margin-bottom: 12px;
        }

        .guidance-item:last-child {
            margin-bottom: 0;
        }

        .guidance-label {
            font-size: 12px;
            font-weight: 600;
            color: var(--vscode-foreground);
            margin-bottom: 6px;
        }

        .guidance-text {
            font-size: 12px;
            line-height: 1.5;
            color: var(--vscode-descriptionForeground);
        }

        .guidance-list {
            font-size: 12px;
            line-height: 1.6;
            color: var(--vscode-descriptionForeground);
            margin-left: 20px;
            margin-top: 6px;
        }

        .guidance-list li {
            margin-bottom: 4px;
        }

        .related-templates {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 6px;
        }

        .related-template-tag {
            font-size: 11px;
            padding: 4px 8px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border-radius: 3px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .related-template-tag:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        /* Level 2: Inline Expandable Preview */
        .preview-section {
            margin-top: 12px;
            border-top: 1px solid var(--vscode-panel-border);
            padding-top: 12px;
        }

        .preview-toggle {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: transparent;
            color: var(--vscode-textLink-foreground);
            border: 1px solid var(--vscode-textLink-foreground);
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
            width: 100%;
            justify-content: center;
        }

        .preview-toggle:hover {
            background: var(--vscode-textLink-activeForeground);
            color: var(--vscode-editor-background);
        }

        .preview-toggle-icon {
            transition: transform 0.2s;
        }

        .preview-toggle.expanded .preview-toggle-icon {
            transform: rotate(90deg);
        }

        .preview-content {
            display: none;
            margin-top: 12px;
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 12px;
            max-height: 300px;
            overflow-y: auto;
        }

        .preview-content.visible {
            display: block;
        }

        .preview-code {
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
            line-height: 1.5;
            white-space: pre-wrap;
            word-wrap: break-word;
            color: var(--vscode-editor-foreground);
        }

        .template-variable {
            color: var(--vscode-textLink-activeForeground);
            font-weight: 600;
            background: var(--vscode-textBlockQuote-background);
            padding: 2px 4px;
            border-radius: 3px;
        }

        .preview-actions {
            display: flex;
            gap: 8px;
            margin-top: 8px;
        }

        .preview-btn {
            flex: 1;
            padding: 6px 12px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            transition: background 0.2s;
        }

        .preview-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .preview-loading {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            padding: 20px;
            font-size: 12px;
        }

        .preview-more {
            margin-top: 8px;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }

        /* Level 3: Full Preview Modal */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        }

        .modal-overlay.visible {
            display: flex;
        }

        .modal-container {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            max-width: 800px;
            max-height: 90vh;
            width: 90%;
            display: flex;
            flex-direction: column;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .modal-title {
            font-size: 18px;
            font-weight: 600;
        }

        .modal-close {
            background: transparent;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: var(--vscode-foreground);
            padding: 0;
            width: 32px;
            height: 32px;
            border-radius: 4px;
            transition: background 0.2s;
        }

        .modal-close:hover {
            background: var(--vscode-toolbar-hoverBackground);
        }

        .modal-tabs {
            display: flex;
            gap: 8px;
            padding: 12px 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
            background: var(--vscode-editor-inactiveSelectionBackground);
        }

        .modal-tab {
            padding: 8px 16px;
            background: transparent;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            color: var(--vscode-foreground);
            transition: background 0.2s;
        }

        .modal-tab:hover {
            background: var(--vscode-toolbar-hoverBackground);
        }

        .modal-tab.active {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .modal-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
        }

        .modal-tab-content {
            display: none;
        }

        .modal-tab-content.active {
            display: block;
        }

        .modal-code {
            font-family: var(--vscode-editor-font-family);
            font-size: 13px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-wrap: break-word;
            color: var(--vscode-editor-foreground);
        }

        .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 16px 20px;
            border-top: 1px solid var(--vscode-panel-border);
        }

        .modal-btn {
            padding: 8px 16px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            transition: background 0.2s;
        }

        .modal-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .modal-btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        .modal-btn-secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        /* Phase 5: Favorites System */
        .favorite-btn {
            position: absolute;
            top: 16px;
            right: 16px;
            background: transparent;
            border: none;
            font-size: 20px;
            cursor: pointer;
            padding: 4px;
            transition: transform 0.2s;
            z-index: 10;
        }

        .favorite-btn:hover {
            transform: scale(1.2);
        }

        .favorite-btn.favorited {
            color: var(--vscode-list-warningForeground);
        }

        /* Phase 5: Context Menu */
        .context-menu {
            position: fixed;
            background: var(--vscode-menu-background);
            border: 1px solid var(--vscode-menu-border);
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 3000;
            min-width: 180px;
            padding: 4px 0;
            display: none;
        }

        .context-menu.visible {
            display: block;
        }

        .context-menu-item {
            padding: 8px 16px;
            cursor: pointer;
            font-size: 13px;
            color: var(--vscode-menu-foreground);
            display: flex;
            align-items: center;
            gap: 10px;
            transition: background 0.1s;
        }

        .context-menu-item:hover {
            background: var(--vscode-menu-selectionBackground);
            color: var(--vscode-menu-selectionForeground);
        }

        .context-menu-item.danger {
            color: var(--vscode-inputValidation-errorForeground);
        }

        .context-menu-separator {
            height: 1px;
            background: var(--vscode-menu-separatorBackground);
            margin: 4px 0;
        }

        /* Phase 5: Keyboard Navigation */
        .template-card.keyboard-focused {
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 2px var(--vscode-focusBorder);
        }

        .keyboard-shortcut-hint {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 12px 16px;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            max-width: 300px;
            display: none;
            z-index: 1500;
        }

        .keyboard-shortcut-hint.visible {
            display: block;
        }

        .shortcut-key {
            display: inline-block;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 11px;
            margin: 0 2px;
        }

        /* Variable Editor Modal Styles */
        .variable-editor-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 2500;
        }

        .variable-editor-modal.visible {
            display: flex;
        }

        .variable-editor-container {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            max-width: 900px;
            max-height: 90vh;
            width: 90%;
            display: flex;
            flex-direction: column;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        }

        .variable-editor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .variable-editor-title {
            font-size: 18px;
            font-weight: 600;
        }

        .variable-editor-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .variable-list-panel {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .variable-preview-panel {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .panel-header {
            font-size: 14px;
            font-weight: 600;
            color: var(--vscode-foreground);
            padding-bottom: 8px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .variables-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 300px;
            overflow-y: auto;
            padding: 4px;
        }

        .variable-item {
            background: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .variable-item:hover {
            border-color: var(--vscode-focusBorder);
            background: var(--vscode-list-hoverBackground);
        }

        .variable-item.selected {
            border-color: var(--vscode-focusBorder);
            background: var(--vscode-list-activeSelectionBackground);
        }

        .variable-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        }

        .variable-name {
            font-family: monospace;
            font-weight: 600;
            color: var(--vscode-textLink-activeForeground);
        }

        .variable-type-badge {
            font-size: 10px;
            padding: 2px 6px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 3px;
            text-transform: uppercase;
        }

        .variable-description {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }

        .variable-form {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 16px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .form-label {
            font-size: 13px;
            font-weight: 500;
            color: var(--vscode-foreground);
        }

        .form-input {
            padding: 8px 12px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-size: 13px;
            font-family: inherit;
        }

        .form-input:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: -1px;
        }

        .form-input.error {
            border-color: var(--vscode-inputValidation-errorBorder);
        }

        .form-error {
            font-size: 12px;
            color: var(--vscode-inputValidation-errorForeground);
            display: block;
            margin-top: 4px;
            min-height: 18px;
        }

        .form-hint {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            display: block;
            margin-top: 4px;
            opacity: 0.8;
        }

        /* Screen reader only class for accessibility */
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border-width: 0;
        }

        /* Advanced Validation Panel - Issue #111 */
        .validation-panel {
            margin-bottom: 16px;
            padding: 12px;
            border-radius: 4px;
            background-color: var(--vscode-inputValidation-infoBackground);
            border: 1px solid var(--vscode-inputValidation-infoBorder);
        }

        .validation-errors {
            margin-bottom: 8px;
        }

        .validation-error-item {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            padding: 6px;
            margin-bottom: 4px;
            background-color: var(--vscode-inputValidation-errorBackground);
            border-left: 3px solid var(--vscode-inputValidation-errorBorder);
            color: var(--vscode-inputValidation-errorForeground);
            font-size: 13px;
            border-radius: 2px;
        }

        .validation-error-item::before {
            content: '✕';
            color: var(--vscode-inputValidation-errorForeground);
            font-weight: bold;
            flex-shrink: 0;
        }

        .validation-warnings {
            margin-top: 8px;
        }

        .validation-warning-item {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            padding: 6px;
            margin-bottom: 4px;
            background-color: var(--vscode-inputValidation-warningBackground);
            border-left: 3px solid var(--vscode-inputValidation-warningBorder);
            color: var(--vscode-inputValidation-warningForeground);
            font-size: 13px;
            border-radius: 2px;
        }

        .validation-warning-item::before {
            content: '⚠';
            color: var(--vscode-inputValidation-warningForeground);
            font-weight: bold;
            flex-shrink: 0;
        }

        /* Usage Info Panel - Issue #111 */
        .usage-info-panel {
            margin-bottom: 16px;
            padding: 12px;
            border-radius: 4px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-panel-border);
        }

        .usage-count {
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--vscode-foreground);
        }

        .usage-count-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            font-size: 11px;
            font-weight: 600;
            margin-left: 8px;
        }

        .usage-positions {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }

        .usage-position-item {
            padding: 4px 8px;
            margin: 4px 0;
            background-color: var(--vscode-editor-background);
            border-radius: 2px;
            font-family: var(--vscode-editor-font-family);
            font-size: 11px;
        }

        .usage-position-item .line-number {
            color: var(--vscode-editorLineNumber-foreground);
            margin-right: 8px;
        }

        .usage-position-item .context-text {
            color: var(--vscode-editor-foreground);
        }

        .usage-position-item .highlight {
            background-color: var(--vscode-editor-findMatchHighlightBackground);
            padding: 2px 4px;
            border-radius: 2px;
        }

        /* Focus visible styles for keyboard navigation - WCAG 2.1 AA */
        input:focus-visible,
        select:focus-visible,
        textarea:focus-visible,
        button:focus-visible {
            outline: 2px solid var(--vscode-focusBorder);
            outline-offset: 2px;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
            .validation-error-item,
            .validation-warning-item {
                border-width: 2px;
            }

            input:focus-visible,
            select:focus-visible,
            textarea:focus-visible,
            button:focus-visible {
                outline-width: 3px;
            }
        }

        /* Additional utility classes - Issue #111 Code Review */
        .usage-positions-more-info {
            margin-top: 8px;
            font-size: 11px;
            opacity: 0.7;
        }

        .import-failed-message,
        .save-failed-message {
            color: var(--vscode-inputValidation-errorForeground);
        }

        .form-select {
            padding: 8px 12px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-size: 13px;
            cursor: pointer;
        }

        .form-textarea {
            padding: 8px 12px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-size: 13px;
            font-family: inherit;
            resize: vertical;
            min-height: 60px;
        }

        .form-checkbox {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .form-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
        }

        .enum-values-container {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .enum-value-row {
            display: flex;
            gap: 6px;
            align-items: center;
        }

        .enum-value-input {
            flex: 1;
        }

        .btn-remove-enum {
            padding: 6px 12px;
            background: var(--vscode-inputValidation-errorBackground);
            color: var(--vscode-inputValidation-errorForeground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }

        .btn-add-enum {
            padding: 6px 12px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }

        .template-preview-box {
            padding: 12px;
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-wrap: break-word;
            max-height: 400px;
            overflow-y: auto;
        }

        .variable-highlight {
            color: var(--vscode-textLink-activeForeground);
            font-weight: 600;
            background: var(--vscode-textBlockQuote-background);
            padding: 2px 4px;
            border-radius: 3px;
        }

        .built-in-variables-info {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            padding: 12px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            line-height: 1.5;
        }

        .built-in-var {
            font-family: monospace;
            color: var(--vscode-textLink-foreground);
        }

        .variable-usage-guide {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .usage-instructions {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            padding: 12px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            line-height: 1.5;
        }

        .usage-instructions strong {
            color: var(--vscode-foreground);
            display: block;
            margin-bottom: 8px;
        }

        .usage-instructions ol {
            margin: 8px 0 0 20px;
            padding: 0;
        }

        .usage-instructions li {
            margin: 4px 0;
        }

        .variable-usage-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .usage-variable-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
        }

        .usage-variable-name {
            flex: 1;
            font-family: monospace;
            font-size: 13px;
            color: var(--vscode-textLink-foreground);
        }

        .usage-variable-type {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            padding: 2px 6px;
            background: var(--vscode-badge-background);
            border-radius: 3px;
        }

        .copy-var-btn {
            padding: 4px 8px;
            font-size: 11px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .copy-var-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .copy-var-btn.copied {
            background: var(--vscode-testing-iconPassed);
            color: white;
        }

        .edit-template-btn-header {
            padding: 6px 12px;
            font-size: 13px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .edit-template-btn-header:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .empty-variables-state {
            text-align: center;
            padding: 40px 20px;
            color: var(--vscode-descriptionForeground);
        }

        .variable-editor-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            padding: 16px 20px;
            border-top: 1px solid var(--vscode-panel-border);
        }

        .footer-info {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }

        .footer-actions {
            display: flex;
            gap: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📝 Template Browser</h1>
        <div style="display: flex; gap: 10px;">
            <button class="btn primary" data-command="createNewTemplate">➕ Create Template</button>
            <button class="btn primary" data-command="createTemplateWithVariables" title="Create a JSON template with the advanced variable system">⚙️ Create with Variables</button>
            <button class="btn" data-command="refresh">🔄 Refresh</button>
        </div>
    </div>

    <div class="controls">
        <input
            type="text"
            class="search-box"
            placeholder="Search templates by name, description, or tags..."
            id="searchInput"
        />
        <div class="view-toggle">
            <button class="btn btn-secondary" data-command="setView" data-view="grid" id="gridBtn">Grid</button>
            <button class="btn btn-secondary" data-command="setView" data-view="list" id="listBtn">List</button>
        </div>
    </div>

    <!-- Enhanced Filters Row -->
    <div class="enhanced-filters">
        <div class="filter-group">
            <label for="fileTypeFilter" class="filter-label">File Type:</label>
            <select id="fileTypeFilter" class="filter-select">
                <option value="all">All Types</option>
                <option value="builtin">Built-in</option>
                <option value="json">JSON</option>
                <option value="md">Markdown</option>
                <option value="txt">Text</option>
            </select>
        </div>

        <div class="filter-group">
            <label for="difficultyFilter" class="filter-label">Difficulty:</label>
            <select id="difficultyFilter" class="filter-select">
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
            </select>
        </div>

        <div class="filter-group">
            <label for="showOnlyFilter" class="filter-label">Show Only:</label>
            <select id="showOnlyFilter" class="filter-select">
                <option value="all">All Templates</option>
                <option value="favorites">Favorites</option>
                <option value="recent">Recently Used (7 days)</option>
                <option value="unused">Unused</option>
            </select>
        </div>

        <div class="filter-group">
            <label for="sortBy" class="filter-label">Sort By:</label>
            <select id="sortBy" class="filter-select">
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="modified">Recently Modified</option>
                <option value="usage">Most Used</option>
                <option value="category">Category</option>
            </select>
        </div>

        <div class="filter-badge-container" id="filterBadgeContainer" style="display: none;">
            <span class="filter-badge" id="filterBadge">
                <span id="filterCount">0</span> active filters
            </span>
            <button class="btn-clear-filters" id="clearFiltersBtn">Clear All</button>
        </div>
    </div>

    <div class="filters" id="filters"></div>

    <div class="stats" id="stats"></div>

    <div class="templates-grid" id="templatesContainer"></div>

    <!-- Full Preview Modal -->
    <div class="modal-overlay" id="previewModal">
        <div class="modal-container">
            <div class="modal-header">
                <div class="modal-title" id="modalTitle">Template Preview</div>
                <button class="modal-close" data-command="closePreviewModal" aria-label="Close">&times;</button>
            </div>
            <div class="modal-tabs">
                <button class="modal-tab active" data-command="switchModalTab" data-tab="raw" id="rawTab">Raw Template</button>
                <button class="modal-tab" data-command="switchModalTab" data-tab="sample" id="sampleTab">Sample Preview</button>
            </div>
            <div class="modal-body">
                <div class="modal-tab-content active" id="rawContent">
                    <div class="modal-code" id="rawCodeContent"></div>
                </div>
                <div class="modal-tab-content" id="sampleContent">
                    <div class="modal-code" id="sampleCodeContent"></div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn modal-btn-secondary" data-command="copyModalContent">Copy to Clipboard</button>
                <button class="modal-btn" data-command="closePreviewModal">Close</button>
            </div>
        </div>
    </div>

    <!-- Variable Editor Modal -->
    <div class="variable-editor-modal" id="variableEditorModal">
        <div class="variable-editor-container">
            <div class="variable-editor-header">
                <div class="variable-editor-title" id="variableEditorTitle">Edit Template Variables</div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button class="edit-template-btn-header" data-command="editTemplateContent" id="editTemplateBtn" aria-label="Edit template content to use variables">📝 Edit Template Content</button>
                    <button class="modal-close" data-command="closeVariableEditor" aria-label="Close">&times;</button>
                </div>
            </div>
            <div class="variable-editor-body">
                <!-- Left Panel: Variable List and Form -->
                <div class="variable-list-panel">
                    <div class="panel-header">Custom Variables</div>
                    <div class="variables-list" id="variablesList">
                        <!-- Variables will be populated here -->
                    </div>
                    <button class="btn" data-command="addNewVariable">+ Add Variable</button>

                    <div class="variable-form" id="variableForm" style="display: none;" role="form" aria-labelledby="variableFormTitle">
                        <h3 id="variableFormTitle" class="sr-only">Variable Configuration Form</h3>

                        <!-- Advanced Validation Feedback Panel -->
                        <div class="validation-panel" id="validationPanel" style="display: none;" role="alert" aria-live="polite">
                            <div class="validation-errors" id="validationErrors"></div>
                            <div class="validation-warnings" id="validationWarnings"></div>
                        </div>

                        <!-- Usage Info Panel -->
                        <div class="usage-info-panel" id="usageInfoPanel" style="display: none;" role="status" aria-live="polite">
                            <div class="usage-count" id="usageCount"></div>
                            <div class="usage-positions" id="usagePositions"></div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="varName" id="varNameLabel">Variable Name*</label>
                            <input
                                type="text"
                                class="form-input"
                                id="varName"
                                placeholder="e.g., project_name"
                                aria-labelledby="varNameLabel"
                                aria-required="true"
                                aria-describedby="varNameError varNameHint"
                                aria-invalid="false"
                            >
                            <span class="form-hint" id="varNameHint">Must start with a letter, use lowercase, numbers, and underscores only</span>
                            <span class="form-error" id="varNameError" role="alert"></span>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="varType" id="varTypeLabel">Type*</label>
                            <select
                                class="form-select"
                                id="varType"
                                aria-labelledby="varTypeLabel"
                                aria-required="true"
                            >
                                <option value="string">String</option>
                                <option value="number">Number</option>
                                <option value="enum">Enum (dropdown)</option>
                                <option value="date">Date</option>
                                <option value="boolean">Boolean</option>
                            </select>
                        </div>

                        <div class="form-group" id="enumValuesGroup" style="display: none;">
                            <label class="form-label" for="enumValues" id="enumValuesLabel">Enum Values*</label>
                            <div
                                class="enum-values-container"
                                id="enumValues"
                                role="list"
                                aria-labelledby="enumValuesLabel"
                            >
                                <!-- Enum values will be populated here -->
                            </div>
                            <button class="btn-add-enum" data-command="addEnumValue" aria-label="Add new enum option">+ Add Option</button>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="varDescription" id="varDescLabel">Description</label>
                            <textarea
                                class="form-textarea"
                                id="varDescription"
                                placeholder="Describe what this variable is for..."
                                aria-labelledby="varDescLabel"
                                rows="3"
                            ></textarea>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="varDefault" id="varDefaultLabel">Default Value</label>
                            <input
                                type="text"
                                class="form-input"
                                id="varDefault"
                                placeholder="Optional default value"
                                aria-labelledby="varDefaultLabel"
                                aria-describedby="varDefaultError"
                            >
                            <span class="form-error" id="varDefaultError" role="alert"></span>
                        </div>

                        <div class="form-group">
                            <div class="form-checkbox">
                                <input
                                    type="checkbox"
                                    id="varRequired"
                                    aria-labelledby="varRequiredLabel"
                                >
                                <label class="form-label" for="varRequired" id="varRequiredLabel">Required</label>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button class="btn btn-secondary" data-command="cancelVariableEdit" aria-label="Cancel and close variable editor">Cancel</button>
                            <button class="btn" data-command="deleteVariable" id="deleteVarBtn" style="display: none;" aria-label="Delete this variable">Delete</button>
                            <button class="btn primary" data-command="saveVariable" aria-label="Save variable changes">Save</button>
                        </div>
                    </div>

                    <div class="built-in-variables-info">
                        <strong>Built-in Variables:</strong><br>
                        <span class="built-in-var">{filename}</span>, <span class="built-in-var">{date}</span>, <span class="built-in-var">{time}</span>, <span class="built-in-var">{year}</span>, <span class="built-in-var">{month}</span>, <span class="built-in-var">{day}</span>, <span class="built-in-var">{weekday}</span>, <span class="built-in-var">{month_name}</span>, <span class="built-in-var">{user}</span>, <span class="built-in-var">{workspace}</span>
                    </div>
                </div>

                <!-- Right Panel: Variable Usage Guide -->
                <div class="variable-preview-panel">
                    <div class="panel-header">How to Use Variables</div>
                    <div class="variable-usage-guide">
                        <div class="usage-instructions">
                            <strong>📚 Usage Instructions:</strong>
                            <ol>
                                <li>Define your custom variables in the left panel</li>
                                <li>Click "📝 Edit Template Content" to open the template file</li>
                                <li>Add variables to your content using the syntax: <code>{variable_name}</code></li>
                                <li>Click the copy button (📋) next to each variable to copy it</li>
                                <li>Save your variables, then save the template file</li>
                            </ol>
                        </div>
                        <div id="variableUsageList">
                            <!-- Variable usage list will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
            <div class="variable-editor-footer">
                <div class="footer-controls">
                    <span class="footer-info" id="variableCount">0 custom variables</span>
                    <button class="modal-btn modal-btn-secondary" data-command="exportVariables" aria-label="Export variables to JSON file" title="Export variables">Export</button>
                    <button class="modal-btn modal-btn-secondary" data-command="importVariables" aria-label="Import variables from JSON file" title="Import variables">Import</button>
                </div>
                <div class="footer-actions">
                    <button class="modal-btn modal-btn-secondary" data-command="closeVariableEditor" aria-label="Cancel and close without saving">Cancel</button>
                    <button class="modal-btn" data-command="saveAllVariables" aria-label="Save all variable changes">Save Changes</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Phase 5: Context Menu -->
    <div class="context-menu" id="contextMenu">
        <!-- Menu items populated dynamically -->
    </div>

    <!-- Phase 5: Keyboard Shortcut Hint - Enhanced for Issue #111 -->
    <div class="keyboard-shortcut-hint" id="keyboardHint">
        <strong>Keyboard Shortcuts:</strong><br>
        <span class="shortcut-key">/</span> Focus search<br>
        <span class="shortcut-key">ESC</span> Clear search / Close modal<br>
        <span class="shortcut-key">↑↓</span> Navigate cards<br>
        <span class="shortcut-key">Enter</span> Create note<br>
        <span class="shortcut-key">Space</span> Toggle preview<br>
        <span class="shortcut-key">F</span> Toggle favorite<br>
        <span class="shortcut-key">Ctrl+S</span> Save (in editor)<br>
        <span class="shortcut-key">Delete</span> Delete variable<br>
        <span class="shortcut-key">Tab</span> Navigate within modal<br>
        <span class="shortcut-key">?</span> Show/hide shortcuts
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let templates = ${JSON.stringify(templates)};
        let currentView = 'grid';
        let activeCategory = 'all';
        let searchQuery = '';

        // Enhanced filter state
        let filterState = {
            fileType: 'all',
            difficulty: 'all',
            showOnly: 'all',
            sortBy: 'name-asc'
        };

        // Favorites tracking (stored in vscode state)
        let favorites = new Set();

        // Constants for template icons and badges
        const TEMPLATE_ICON_MAP = {
            'Built-in': '⚙️',
            'Custom': '✏️',
            'Documentation': '📚',
            'Project': '📊',
            'Meeting': '🤝',
            'Research': '🔬',
            'Planning': '📋',
            'Development': '💻',
            'Design': '🎨',
            'General': '📝',
            'Daily Notes': '📅',
            'User Story': '📖'
        };

        const FILE_TYPE_BADGES = {
            'builtin': '⚙️ Built-in',
            'json': '📦 JSON',
            'txt': '📄 Text',
            'md': '📝 Markdown'
        };

        // HTML escaping function to prevent XSS
        function escapeHtml(unsafe) {
            const text = typeof unsafe === 'string' ? unsafe : String(unsafe);
            return text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        // Get icon for template based on category and file type
        function getTemplateIcon(template) {
            return TEMPLATE_ICON_MAP[template.category] || '📝';
        }

        // Determine if template is "new" (created within last 7 days)
        function isNew(template, now) {
            if (!template.created) return false;
            const created = new Date(template.created);
            const daysDiff = (now - created) / (1000 * 60 * 60 * 24);
            return daysDiff <= 7;
        }

        // Determine if template is "popular" (usage_count > 10)
        function isPopular(template) {
            return template.usage_count >= 10;
        }

        // Get file type display text
        function getFileTypeBadge(fileType) {
            return FILE_TYPE_BADGES[fileType] || fileType;
        }

        // Convert difficulty to stars (1-3 stars)
        function getDifficultyStars(difficulty) {
            const starMap = {
                'beginner': '⭐',
                'intermediate': '⭐⭐',
                'advanced': '⭐⭐⭐'
            };
            return starMap[difficulty] || '';
        }

        // Calculate usage trend (mock implementation - would need historical data)
        function getUsageTrend(template) {
            // For now, return empty string. In a real implementation, this would
            // compare current week's usage to previous weeks
            // Example: "↑ 3 this week" or "↓ 2 this week"
            if (!template.usage_count || template.usage_count === 0) {
                return '';
            }
            // Mock: Templates with high usage show upward trend
            if (template.usage_count >= 10) {
                const weeklyUses = (template.id.length % 5) + 1;
                return \`↑ \${weeklyUses} this week\`;
            }
            return '';
        }

        // Initialize
        initializeFilterState();
        renderFilters();
        renderStats();
        renderTemplates();

        // === Event Delegation System ===

        // Master click handler for all buttons with data-command
        document.body.addEventListener('click', (event) => {
            const target = event.target.closest('[data-command]');
            if (!target) return;

            const command = target.getAttribute('data-command');
            const templateId = target.getAttribute('data-template-id');
            const category = target.getAttribute('data-category');
            const view = target.getAttribute('data-view');
            const tab = target.getAttribute('data-tab');

            switch (command) {
                case 'refresh':
                    refresh();
                    break;
                case 'createNewTemplate':
                    createNewTemplate();
                    break;
                case 'createTemplateWithVariables':
                    createTemplateWithVariables();
                    break;
                case 'setView':
                    setView(view);
                    break;
                case 'setCategory':
                    setCategory(category);
                    break;
                case 'toggleGuidance':
                    toggleGuidance(target);
                    break;
                case 'togglePreview':
                    togglePreview(target, templateId);
                    break;
                case 'showFullPreview':
                    showFullPreview(templateId);
                    break;
                case 'createFromTemplate':
                    createFromTemplate(templateId);
                    break;
                case 'editTemplate':
                    editTemplate(templateId);
                    break;
                case 'duplicateTemplate':
                    duplicateTemplate(templateId);
                    break;
                case 'exportTemplate':
                    exportTemplate(templateId);
                    break;
                case 'deleteTemplate':
                    deleteTemplate(templateId);
                    break;
                case 'closePreviewModal':
                    closePreviewModal();
                    break;
                case 'switchModalTab':
                    switchModalTab(tab);
                    break;
                case 'copyModalContent':
                    copyModalContent(event);
                    break;
                case 'toggleFavorite':
                    toggleFavorite(templateId);
                    event.stopPropagation(); // Prevent card click
                    break;
                case 'copyTemplateId':
                    copyTemplateId(templateId);
                    break;
                case 'editVariables':
                    openVariableEditor(templateId);
                    break;
                case 'closeVariableEditor':
                    closeVariableEditor();
                    break;
                case 'addNewVariable':
                    addNewVariable();
                    break;
                case 'addEnumValue':
                    addEnumValue();
                    break;
                case 'saveVariable':
                    saveVariable();
                    break;
                case 'cancelVariableEdit':
                    cancelVariableEdit();
                    break;
                case 'deleteVariable':
                    deleteCurrentVariable();
                    break;
                case 'saveAllVariables':
                    saveAllVariables();
                    break;
                case 'exportVariables':
                    exportVariablesConfig();
                    break;
                case 'importVariables':
                    importVariablesConfig();
                    break;
                case 'editTemplateContent':
                    editTemplateContent();
                    break;
            }
        });

        // Search input listener
        document.getElementById('searchInput').addEventListener('input', filterTemplates);

        // Enhanced filter listeners
        document.getElementById('fileTypeFilter').addEventListener('change', handleFilterChange);
        document.getElementById('difficultyFilter').addEventListener('change', handleFilterChange);
        document.getElementById('showOnlyFilter').addEventListener('change', handleFilterChange);
        document.getElementById('sortBy').addEventListener('change', handleFilterChange);
        document.getElementById('clearFiltersBtn').addEventListener('click', clearAllFilters);

        // Modal overlay click handler (close on overlay click, not modal content)
        document.getElementById('previewModal').addEventListener('click', (event) => {
            if (event.target.id === 'previewModal') {
                closePreviewModal();
            }
        });

        // === Enhanced Filter & Sort Functions ===

        function initializeFilterState() {
            // Try to restore state from vscode
            const state = vscode.getState();
            if (state && state.filterState) {
                filterState = state.filterState;
                favorites = new Set(state.favorites || []);

                // Restore UI state
                document.getElementById('fileTypeFilter').value = filterState.fileType;
                document.getElementById('difficultyFilter').value = filterState.difficulty;
                document.getElementById('showOnlyFilter').value = filterState.showOnly;
                document.getElementById('sortBy').value = filterState.sortBy;
            }
            updateFilterBadge();
        }

        function handleFilterChange(event) {
            const filterId = event.target.id;
            const value = event.target.value;

            // Update filter state
            switch (filterId) {
                case 'fileTypeFilter':
                    filterState.fileType = value;
                    break;
                case 'difficultyFilter':
                    filterState.difficulty = value;
                    break;
                case 'showOnlyFilter':
                    filterState.showOnly = value;
                    break;
                case 'sortBy':
                    filterState.sortBy = value;
                    break;
            }

            // Save state
            saveFilterState();

            // Update UI
            updateFilterBadge();
            renderTemplates();
        }

        function clearAllFilters() {
            // Reset all filters to default
            filterState = {
                fileType: 'all',
                difficulty: 'all',
                showOnly: 'all',
                sortBy: 'name-asc'
            };

            // Reset UI
            document.getElementById('fileTypeFilter').value = 'all';
            document.getElementById('difficultyFilter').value = 'all';
            document.getElementById('showOnlyFilter').value = 'all';
            document.getElementById('sortBy').value = 'name-asc';

            // Save and update
            saveFilterState();
            updateFilterBadge();
            renderTemplates();
        }

        function updateFilterBadge() {
            let activeCount = 0;

            // Count non-default filters (excluding sortBy)
            if (filterState.fileType !== 'all') activeCount++;
            if (filterState.difficulty !== 'all') activeCount++;
            if (filterState.showOnly !== 'all') activeCount++;

            const badgeContainer = document.getElementById('filterBadgeContainer');
            const filterCount = document.getElementById('filterCount');

            if (activeCount > 0) {
                badgeContainer.style.display = 'flex';
                filterCount.textContent = activeCount;
            } else {
                badgeContainer.style.display = 'none';
            }
        }

        function saveFilterState() {
            vscode.setState({
                filterState: filterState,
                favorites: Array.from(favorites)
            });
        }

        function applyFilters(templatesArray) {
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            return templatesArray.filter(t => {
                // Category filter (existing)
                const matchesCategory = activeCategory === 'all' || t.category === activeCategory;

                // Search filter (existing)
                const matchesSearch = !searchQuery ||
                    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

                // File type filter
                const matchesFileType = filterState.fileType === 'all' || t.fileType === filterState.fileType;

                // Difficulty filter
                const matchesDifficulty = filterState.difficulty === 'all' ||
                    (t.difficulty && t.difficulty === filterState.difficulty) ||
                    (filterState.difficulty === 'beginner' && !t.difficulty); // Treat no difficulty as beginner

                // Show only filter
                let matchesShowOnly = true;
                if (filterState.showOnly === 'favorites') {
                    matchesShowOnly = favorites.has(t.id);
                } else if (filterState.showOnly === 'recent') {
                    // Recently used: last_used within last 7 days
                    if (t.last_used) {
                        const lastUsedDate = new Date(t.last_used);
                        matchesShowOnly = lastUsedDate >= sevenDaysAgo;
                    } else {
                        matchesShowOnly = false;
                    }
                } else if (filterState.showOnly === 'unused') {
                    matchesShowOnly = !t.usage_count || t.usage_count === 0;
                }

                return matchesCategory && matchesSearch && matchesFileType && matchesDifficulty && matchesShowOnly;
            });
        }

        function sortTemplates(templatesArray) {
            const sorted = [...templatesArray];

            switch (filterState.sortBy) {
                case 'name-asc':
                    sorted.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'name-desc':
                    sorted.sort((a, b) => b.name.localeCompare(a.name));
                    break;
                case 'modified':
                    sorted.sort((a, b) => {
                        const dateA = a.modified ? new Date(a.modified) : new Date(0);
                        const dateB = b.modified ? new Date(b.modified) : new Date(0);
                        return dateB - dateA; // Newest first
                    });
                    break;
                case 'usage':
                    sorted.sort((a, b) => {
                        const usageA = a.usage_count || 0;
                        const usageB = b.usage_count || 0;
                        return usageB - usageA; // Most used first
                    });
                    break;
                case 'category':
                    sorted.sort((a, b) => {
                        const catCompare = a.category.localeCompare(b.category);
                        if (catCompare !== 0) return catCompare;
                        return a.name.localeCompare(b.name); // Then by name
                    });
                    break;
            }

            return sorted;
        }

        function renderFilters() {
            const categories = ['all', ...new Set(templates.map(t => t.category))];
            const filtersContainer = document.getElementById('filters');
            filtersContainer.innerHTML = categories.map(cat =>
                \`<button
                    class="filter-btn \${cat === activeCategory ? 'active' : ''}"
                    data-command="setCategory"
                    data-category="\${escapeHtml(cat)}"
                >
                    \${escapeHtml(cat.charAt(0).toUpperCase() + cat.slice(1))} (\${cat === 'all' ? templates.length : templates.filter(t => t.category === cat).length})
                </button>\`
            ).join('');
        }

        function renderStats() {
            const stats = {
                total: templates.length,
                custom: templates.filter(t => !t.isBuiltIn).length,
                builtin: templates.filter(t => t.isBuiltIn).length
            };

            const statsContainer = document.getElementById('stats');
            statsContainer.innerHTML = \`
                <div class="stat-item">
                    <div class="stat-value">\${stats.total}</div>
                    <div class="stat-label">Total Templates</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">\${stats.custom}</div>
                    <div class="stat-label">Custom</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">\${stats.builtin}</div>
                    <div class="stat-label">Built-in</div>
                </div>
            \`;
        }

        function renderTemplates() {
            // Apply all filters
            const filteredTemplates = applyFilters(templates);

            // Apply sorting
            const sortedTemplates = sortTemplates(filteredTemplates);

            const container = document.getElementById('templatesContainer');
            container.className = currentView === 'grid' ? 'templates-grid' : 'templates-list';

            if (sortedTemplates.length === 0) {
                // Phase 5: Context-aware empty states
                container.innerHTML = getEmptyStateHtml();
                return;
            }

            // Create date once for performance
            const now = new Date();

            container.innerHTML = sortedTemplates.map(t => {
                const showNew = isNew(t, now);
                const showPopular = isPopular(t);
                const difficultyStars = getDifficultyStars(t.difficulty);
                const usageTrend = getUsageTrend(t);

                return \`
                <div class="template-card" data-template-id="\${escapeHtml(t.id)}" tabindex="0">
                    <!-- Phase 5: Favorite Button -->
                    <button
                        class="favorite-btn \${favorites.has(t.id) ? 'favorited' : ''}"
                        data-command="toggleFavorite"
                        data-template-id="\${escapeHtml(t.id)}"
                        title="\${favorites.has(t.id) ? 'Remove from favorites' : 'Add to favorites'}"
                        aria-label="\${favorites.has(t.id) ? 'Remove from favorites' : 'Add to favorites'}"
                    >
                        \${favorites.has(t.id) ? '⭐' : '☆'}
                    </button>
                    <div class="template-header">
                        <div style="flex: 1;">
                            <div class="template-title-row">
                                <span class="template-icon">\${getTemplateIcon(t)}</span>
                                <div class="template-title">\${escapeHtml(t.name)}</div>
                                \${difficultyStars ? \`<span class="difficulty-stars" title="Difficulty: \${escapeHtml(t.difficulty)}">\${difficultyStars}</span>\` : ''}
                            </div>
                            <div class="template-badges">
                                <span class="template-category">\${escapeHtml(t.category)}</span>
                                <span class="filetype-badge">\${getFileTypeBadge(t.fileType)}</span>
                                \${showNew ? '<span class="status-badge status-new">NEW</span>' : ''}
                                \${showPopular ? '<span class="status-badge status-popular">🔥 POPULAR</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="template-description">\${escapeHtml(t.description)}</div>
                    <div class="template-tags">
                        \${t.tags.map(tag => \`<span class="tag">#\${escapeHtml(tag)}</span>\`).join('')}
                    </div>
                    <div class="template-meta">
                        <span>v\${escapeHtml(t.version)}</span>
                        <span>\${t.usage_count !== undefined ? \`📊 \${escapeHtml(t.usage_count)} uses\${usageTrend ? \` · \${usageTrend}\` : ''}\` : '📊 0 uses'}</span>
                        \${t.author ? \`<span>👤 \${escapeHtml(t.author)}</span>\` : ''}
                    </div>

                    <!-- Phase 3: Usage Guidance Section -->
                    \${(t.when_to_use || t.use_cases || t.prerequisites || t.related_templates || t.estimated_time) ? \`
                    <div class="guidance-section">
                        <button
                            class="guidance-toggle"
                            data-command="toggleGuidance"
                            aria-expanded="false"
                        >
                            <span class="guidance-toggle-icon">▶</span>
                            <span>📖 Usage Guidance</span>
                            \${t.estimated_time ? \`<span class="guidance-time">⏱️ \${escapeHtml(t.estimated_time)}</span>\` : ''}
                        </button>
                        <div class="guidance-content">
                            \${t.when_to_use ? \`
                                <div class="guidance-item">
                                    <div class="guidance-label">📌 When to Use</div>
                                    <div class="guidance-text">\${escapeHtml(t.when_to_use)}</div>
                                </div>
                            \` : ''}
                            \${t.use_cases && t.use_cases.length > 0 ? \`
                                <div class="guidance-item">
                                    <div class="guidance-label">💡 Example Use Cases</div>
                                    <ul class="guidance-list">
                                        \${t.use_cases.map(uc => \`<li>\${escapeHtml(uc)}</li>\`).join('')}
                                    </ul>
                                </div>
                            \` : ''}
                            \${t.prerequisites && t.prerequisites.length > 0 ? \`
                                <div class="guidance-item">
                                    <div class="guidance-label">✅ Prerequisites</div>
                                    <ul class="guidance-list">
                                        \${t.prerequisites.map(pr => \`<li>\${escapeHtml(pr)}</li>\`).join('')}
                                    </ul>
                                </div>
                            \` : ''}
                            \${t.related_templates && t.related_templates.length > 0 ? \`
                                <div class="guidance-item">
                                    <div class="guidance-label">🔗 Related Templates</div>
                                    <div class="related-templates">
                                        \${t.related_templates.map(rt => \`<span class="related-template-tag">\${escapeHtml(rt)}</span>\`).join('')}
                                    </div>
                                </div>
                            \` : ''}
                        </div>
                    </div>
                    \` : ''}

                    <!-- Level 1: Hover Tooltip -->
                    <div class="template-tooltip" data-tooltip-id="\${escapeHtml(t.id)}">
                        <div class="tooltip-content" id="tooltip-\${escapeHtml(t.id)}">Loading preview...</div>
                        <div class="tooltip-footer">Hover to see first 4 lines • Click Preview for more</div>
                    </div>

                    <!-- Level 2: Inline Preview Section -->
                    <div class="preview-section">
                        <button
                            class="preview-toggle"
                            data-command="togglePreview"
                            data-template-id="\${escapeHtml(t.id)}"
                            aria-expanded="false"
                        >
                            <span class="preview-toggle-icon">▶</span>
                            <span>Preview Template</span>
                        </button>
                        <div class="preview-content">
                            <div class="preview-loading">Loading preview...</div>
                        </div>
                    </div>

                    <div class="template-actions">
                        <button class="action-btn primary" data-command="createFromTemplate" data-template-id="\${escapeHtml(t.id)}">Create</button>
                        \${!t.isBuiltIn ? \`
                            <button class="action-btn" data-command="editVariables" data-template-id="\${escapeHtml(t.id)}" \${t.fileType !== 'json' ? 'disabled title="Only JSON templates support variables"' : ''}>✏️ Edit Variables</button>
                            <button class="action-btn" data-command="editTemplate" data-template-id="\${escapeHtml(t.id)}">Edit</button>
                            <button class="action-btn" data-command="duplicateTemplate" data-template-id="\${escapeHtml(t.id)}">Duplicate</button>
                            <button class="action-btn" data-command="exportTemplate" data-template-id="\${escapeHtml(t.id)}">Export</button>
                            <button class="action-btn danger" data-command="deleteTemplate" data-template-id="\${escapeHtml(t.id)}">Delete</button>
                        \` : ''}
                    </div>
                </div>
                \`;
            }).join('');

            // Add mouseenter event listeners for on-demand tooltip loading
            setTimeout(() => {
                document.querySelectorAll('.template-card').forEach(card => {
                    card.addEventListener('mouseenter', () => {
                        const templateId = card.getAttribute('data-template-id');
                        if (templateId) {
                            loadTooltipPreview(templateId);
                        }
                    }, { once: true }); // Use { once: true } to only fire the event once per card
                });
            }, 0);
        }

        function setView(view) {
            currentView = view;
            document.getElementById('gridBtn').classList.toggle('btn-secondary', view !== 'grid');
            document.getElementById('gridBtn').classList.toggle('btn', view === 'grid');
            document.getElementById('listBtn').classList.toggle('btn-secondary', view !== 'list');
            document.getElementById('listBtn').classList.toggle('btn', view === 'list');
            renderTemplates();
        }

        function setCategory(category) {
            activeCategory = category;
            renderFilters();
            renderTemplates();
        }

        function filterTemplates() {
            searchQuery = document.getElementById('searchInput').value;
            renderTemplates();
        }

        function createFromTemplate(templateId) {
            vscode.postMessage({
                command: 'createFromTemplate',
                templateId: templateId
            });
        }

        function editTemplate(templateId) {
            vscode.postMessage({
                command: 'editTemplate',
                templateId: templateId
            });
        }

        function deleteTemplate(templateId) {
            vscode.postMessage({
                command: 'deleteTemplate',
                templateId: templateId
            });
        }

        function duplicateTemplate(templateId) {
            vscode.postMessage({
                command: 'duplicateTemplate',
                templateId: templateId
            });
        }

        function exportTemplate(templateId) {
            vscode.postMessage({
                command: 'exportTemplate',
                templateId: templateId
            });
        }

        function refresh() {
            vscode.postMessage({
                command: 'refresh'
            });
        }

        function createNewTemplate() {
            vscode.postMessage({
                command: 'createNewTemplate'
            });
        }

        function createTemplateWithVariables() {
            vscode.postMessage({
                command: 'createTemplateWithVariables'
            });
        }

        // === Guidance System Functions ===

        // Toggle guidance section visibility
        function toggleGuidance(toggleBtn) {
            if (!toggleBtn) return;

            const content = toggleBtn.nextElementSibling;
            if (!content) return;

            const isExpanded = toggleBtn.getAttribute('aria-expanded') !== 'true';

            toggleBtn.setAttribute('aria-expanded', String(isExpanded));
            toggleBtn.classList.toggle('expanded', isExpanded);
            content.classList.toggle('visible', isExpanded);
        }

        // === Preview System Functions ===

        // Preview cache to avoid redundant requests
        const previewCache = new Map();

        // Level 1: Load tooltip preview (first 4 lines)
        function loadTooltipPreview(templateId) {
            // Check cache first
            if (previewCache.has(\`tooltip-\${templateId}\`)) {
                const cached = previewCache.get(\`tooltip-\${templateId}\`);
                updateTooltipContent(templateId, cached.content);
                return;
            }

            // Request preview from extension
            vscode.postMessage({
                command: 'getPreview',
                templateId: templateId,
                maxLines: 4
            });
        }

        function updateTooltipContent(templateId, content) {
            const tooltip = document.getElementById(\`tooltip-\${templateId}\`);
            if (tooltip) {
                tooltip.innerHTML = content;
            }
        }

        // Level 2: Toggle inline expandable preview
        function togglePreview(toggleBtn, templateId) {
            if (!toggleBtn) return;

            const content = toggleBtn.nextElementSibling;
            if (!content) return;

            const isExpanded = toggleBtn.getAttribute('aria-expanded') !== 'true';

            toggleBtn.setAttribute('aria-expanded', String(isExpanded));
            toggleBtn.classList.toggle('expanded', isExpanded);
            content.classList.toggle('visible', isExpanded);

            // Load preview if expanding and not already loaded
            if (isExpanded && !previewCache.has(\`preview-\${templateId}\`)) {
                vscode.postMessage({
                    command: 'getPreview',
                    templateId: templateId,
                    maxLines: 15
                });
            }
        }

        function updateInlinePreview(templateId, content, hasMore) {
            // Find preview content by traversing from the toggle button
            const toggleBtn = document.querySelector(\`[data-command="togglePreview"][data-template-id="\${escapeHtml(templateId)}"]\`);
            if (!toggleBtn) return;

            const previewSection = toggleBtn.closest('.preview-section');
            const previewContent = previewSection ? previewSection.querySelector('.preview-content') : null;

            if (previewContent) {
                previewContent.innerHTML = \`
                    <div class="preview-code">\${content}</div>
                    \${hasMore ? '<div class="preview-more">... (showing first 15 lines)</div>' : ''}
                    <div class="preview-actions">
                        <button class="preview-btn" data-command="showFullPreview" data-template-id="\${escapeHtml(templateId)}">
                            Show Full Template
                        </button>
                    </div>
                \`;
            }
        }

        // Level 3: Full preview modal
        let currentModalTemplateId = null;
        let currentModalTab = 'raw';

        function showFullPreview(templateId) {
            currentModalTemplateId = templateId;
            currentModalTab = 'raw';

            // Find template name
            const template = templates.find(t => t.id === templateId);
            const modalTitle = document.getElementById('modalTitle');
            if (modalTitle && template) {
                modalTitle.textContent = \`\${template.name} - Preview\`;
            }

            // Show modal
            const modal = document.getElementById('previewModal');
            modal.classList.add('visible');

            // Reset tabs
            document.getElementById('rawTab').classList.add('active');
            document.getElementById('sampleTab').classList.remove('active');
            document.getElementById('rawContent').classList.add('active');
            document.getElementById('sampleContent').classList.remove('active');

            // Load full preview if not cached
            if (!previewCache.has(\`full-\${templateId}\`)) {
                document.getElementById('rawCodeContent').innerHTML = '<div class="preview-loading">Loading...</div>';
                document.getElementById('sampleCodeContent').innerHTML = '<div class="preview-loading">Loading...</div>';

                vscode.postMessage({
                    command: 'getFullPreview',
                    templateId: templateId
                });
            } else {
                // Use cached data
                const cached = previewCache.get(\`full-\${templateId}\`);
                updateModalContent(cached.content, cached.samplePreview);
            }
        }

        function updateModalContent(rawContent, samplePreview) {
            document.getElementById('rawCodeContent').innerHTML = rawContent;
            document.getElementById('sampleCodeContent').innerHTML = samplePreview;
        }

        function closePreviewModal() {
            const modal = document.getElementById('previewModal');
            modal.classList.remove('visible');
            currentModalTemplateId = null;
        }

        function closeModalOnOverlay(event) {
            // Only close if clicking the overlay, not the modal container
            if (event.target.id === 'previewModal') {
                closePreviewModal();
            }
        }

        function switchModalTab(tab) {
            currentModalTab = tab;

            // Update tab buttons
            document.getElementById('rawTab').classList.toggle('active', tab === 'raw');
            document.getElementById('sampleTab').classList.toggle('active', tab === 'sample');

            // Update tab content
            document.getElementById('rawContent').classList.toggle('active', tab === 'raw');
            document.getElementById('sampleContent').classList.toggle('active', tab === 'sample');
        }

        function copyModalContent(event) {
            const content = currentModalTab === 'raw'
                ? document.getElementById('rawCodeContent').innerText
                : document.getElementById('sampleCodeContent').innerText;

            // Use the clipboard API
            navigator.clipboard.writeText(content).then(() => {
                // Visual feedback - temporarily change button text
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy:', err);
            });
        }

        // Phase 5: Enhanced Keyboard Navigation
        let currentFocusedIndex = -1;
        let keyboardHintVisible = false;

        document.addEventListener('keydown', (event) => {
            // Cache DOM references for performance - Issue #111 Code Review
            const variableEditor = document.getElementById('variableEditorModal');
            const isVariableEditorOpen = variableEditor && variableEditor.classList.contains('visible');

            // Ctrl+S / Cmd+S to save in variable editor (Issue #111)
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                if (isVariableEditorOpen) {
                    event.preventDefault();
                    const variableForm = document.getElementById('variableForm');
                    if (variableForm && variableForm.style.display !== 'none') {
                        saveVariable();
                    } else {
                        saveAllVariables();
                    }
                    return;
                }
            }

            // ESC to close modal or variable editor or clear search (Issue #111)
            if (event.key === 'Escape') {
                // Close variable editor if open
                if (isVariableEditorOpen) {
                    const variableForm = document.getElementById('variableForm');
                    if (variableForm && variableForm.style.display !== 'none') {
                        // Cancel variable edit form
                        cancelVariableEdit();
                    } else {
                        // Close entire variable editor
                        closeVariableEditor();
                    }
                    return;
                }

                // Close preview modal
                const modal = document.getElementById('previewModal');
                if (modal.classList.contains('visible')) {
                    closePreviewModal();
                    return;
                }

                // Clear search
                const searchInput = document.getElementById('searchInput');
                if (searchInput.value) {
                    searchInput.value = '';
                    filterTemplates();
                    return;
                }
            }

            // Delete key for variable deletion in variable editor (Issue #111)
            if (event.key === 'Delete') {
                if (isVariableEditorOpen) {
                    const deleteBtn = document.getElementById('deleteVarBtn');
                    if (deleteBtn && deleteBtn.style.display !== 'none' && !isInputFocused()) {
                        event.preventDefault();
                        deleteCurrentVariable();
                        return;
                    }
                }
            }

            // / to focus search
            if (event.key === '/' && !isInputFocused()) {
                event.preventDefault();
                document.getElementById('searchInput').focus();
                return;
            }

            // ? to toggle keyboard shortcuts hint
            if (event.key === '?' && !isInputFocused()) {
                event.preventDefault();
                toggleKeyboardHint();
                return;
            }

            // Arrow keys for card navigation
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                if (!isInputFocused()) {
                    event.preventDefault();
                    navigateCards(event.key === 'ArrowDown' ? 1 : -1);
                    return;
                }
            }

            // Enter to create note from focused card
            if (event.key === 'Enter' && !isInputFocused()) {
                const card = getFocusedCard();
                if (card) {
                    const templateId = card.getAttribute('data-template-id');
                    if (templateId) {
                        createFromTemplate(templateId);
                    }
                    return;
                }
            }

            // Space to toggle preview
            if (event.key === ' ' && !isInputFocused()) {
                event.preventDefault();
                const card = getFocusedCard();
                if (card) {
                    const templateId = card.getAttribute('data-template-id');
                    const toggleBtn = card.querySelector('[data-command="togglePreview"]');
                    if (toggleBtn && templateId) {
                        togglePreview(toggleBtn, templateId);
                    }
                    return;
                }
            }

            // F to toggle favorite
            if (event.key === 'f' && !isInputFocused()) {
                event.preventDefault();
                const card = getFocusedCard();
                if (card) {
                    const templateId = card.getAttribute('data-template-id');
                    if (templateId) {
                        toggleFavorite(templateId);
                    }
                    return;
                }
            }
        });

        // Phase 5: Context Menu Support
        document.addEventListener('contextmenu', (event) => {
            const card = event.target.closest('.template-card');
            if (card) {
                event.preventDefault();
                const templateId = card.getAttribute('data-template-id');
                if (templateId) {
                    showContextMenu(event.clientX, event.clientY, templateId);
                }
            }
        });

        // Close context menu on click outside
        document.addEventListener('click', (event) => {
            const contextMenu = document.getElementById('contextMenu');
            if (!event.target.closest('#contextMenu') && !event.target.closest('.template-card')) {
                contextMenu.classList.remove('visible');
            }
        });

        // === Phase 5: Helper Functions ===

        // Check if an input element is focused
        function isInputFocused() {
            const activeElement = document.activeElement;
            return activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.tagName === 'SELECT'
            );
        }

        // Get the currently focused card
        function getFocusedCard() {
            const cards = Array.from(document.querySelectorAll('.template-card'));
            if (currentFocusedIndex >= 0 && currentFocusedIndex < cards.length) {
                return cards[currentFocusedIndex];
            }
            return null;
        }

        // Navigate between template cards with arrow keys
        function navigateCards(direction) {
            const cards = Array.from(document.querySelectorAll('.template-card'));
            if (cards.length === 0) return;

            // Remove previous focus
            if (currentFocusedIndex >= 0 && currentFocusedIndex < cards.length) {
                cards[currentFocusedIndex].classList.remove('keyboard-focused');
            }

            // Update index
            currentFocusedIndex += direction;

            // Wrap around
            if (currentFocusedIndex < 0) {
                currentFocusedIndex = cards.length - 1;
            } else if (currentFocusedIndex >= cards.length) {
                currentFocusedIndex = 0;
            }

            // Apply focus
            const focusedCard = cards[currentFocusedIndex];
            focusedCard.classList.add('keyboard-focused');
            focusedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Toggle keyboard shortcuts hint visibility
        function toggleKeyboardHint() {
            keyboardHintVisible = !keyboardHintVisible;
            const hint = document.getElementById('keyboardHint');
            hint.classList.toggle('visible', keyboardHintVisible);
        }

        // Toggle favorite status for a template
        function toggleFavorite(templateId) {
            if (favorites.has(templateId)) {
                favorites.delete(templateId);
            } else {
                favorites.add(templateId);
            }

            // Save to state
            saveFilterState();

            // Update UI
            renderTemplates();
        }

        // Show context menu at specified position
        function showContextMenu(x, y, templateId) {
            const template = templates.find(t => t.id === templateId);
            if (!template) return;

            const contextMenu = document.getElementById('contextMenu');
            const isFavorited = favorites.has(templateId);
            const isBuiltIn = template.isBuiltIn;
            const escapedId = escapeHtml(templateId);

            // Build menu items
            let menuHtml = \`
                <div class="context-menu-item" data-command="createFromTemplate" data-template-id="\${escapedId}">
                    <span>✨</span> Create Note
                </div>
                <div class="context-menu-item" data-command="showFullPreview" data-template-id="\${escapedId}">
                    <span>👁️</span> Preview
                </div>
                <div class="context-menu-item" data-command="toggleFavorite" data-template-id="\${escapedId}">
                    <span>\${isFavorited ? '⭐' : '☆'}</span> \${isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
                </div>
                <div class="context-menu-separator"></div>
            \`;

            if (!isBuiltIn) {
                menuHtml += \`
                    <div class="context-menu-item" data-command="editTemplate" data-template-id="\${escapedId}">
                        <span>✏️</span> Edit
                    </div>
                    <div class="context-menu-item" data-command="duplicateTemplate" data-template-id="\${escapedId}">
                        <span>📋</span> Duplicate
                    </div>
                    <div class="context-menu-separator"></div>
                \`;
            }

            menuHtml += \`
                <div class="context-menu-item" data-command="exportTemplate" data-template-id="\${escapedId}">
                    <span>💾</span> Export
                </div>
                <div class="context-menu-item" data-command="copyTemplateId" data-template-id="\${escapedId}">
                    <span>📎</span> Copy Template ID
                </div>
            \`;

            if (!isBuiltIn) {
                menuHtml += \`
                    <div class="context-menu-separator"></div>
                    <div class="context-menu-item danger" data-command="deleteTemplate" data-template-id="\${escapedId}">
                        <span>🗑️</span> Delete
                    </div>
                \`;
            }

            contextMenu.innerHTML = menuHtml;

            // Position the menu
            contextMenu.style.left = x + 'px';
            contextMenu.style.top = y + 'px';
            contextMenu.classList.add('visible');

            // Adjust if menu goes off-screen
            setTimeout(() => {
                const rect = contextMenu.getBoundingClientRect();
                if (rect.right > window.innerWidth) {
                    contextMenu.style.left = (x - rect.width) + 'px';
                }
                if (rect.bottom > window.innerHeight) {
                    contextMenu.style.top = (y - rect.height) + 'px';
                }
            }, 0);
        }

        // Copy template ID to clipboard
        function copyTemplateId(templateId) {
            navigator.clipboard.writeText(templateId).then(() => {
                // Visual feedback could be added here
                const contextMenu = document.getElementById('contextMenu');
                contextMenu.classList.remove('visible');
            }).catch(err => {
                console.error('Failed to copy template ID:', err);
            });
        }

        // Get context-aware empty state HTML
        function getEmptyStateHtml() {
            const hasSearch = searchQuery.trim().length > 0;
            const hasFilters = filterState.fileType !== 'all' ||
                              filterState.difficulty !== 'all' ||
                              filterState.showOnly !== 'all';
            const showingFavorites = filterState.showOnly === 'favorites';
            const totalTemplates = templates.length;

            // No templates at all
            if (totalTemplates === 0) {
                return \`
                    <div class="empty-state">
                        <div class="empty-state-icon">📝</div>
                        <div class="empty-state-title">No Templates Yet</div>
                        <div style="margin-bottom: 16px;">Get started by creating your first custom template</div>
                        <button class="btn" onclick="vscode.postMessage({command: 'refresh'})">
                            Refresh Templates
                        </button>
                    </div>
                \`;
            }

            // No favorites selected
            if (showingFavorites && favorites.size === 0) {
                return \`
                    <div class="empty-state">
                        <div class="empty-state-icon">⭐</div>
                        <div class="empty-state-title">No Favorites Yet</div>
                        <div style="margin-bottom: 16px;">Star your frequently used templates for quick access</div>
                        <button class="btn" data-command="showAllFromEmptyState">
                            Show All Templates
                        </button>
                    </div>
                \`;
            }

            // No search results
            if (hasSearch && !hasFilters) {
                return \`
                    <div class="empty-state">
                        <div class="empty-state-icon">🔍</div>
                        <div class="empty-state-title">No Matches Found</div>
                        <div style="margin-bottom: 16px;">No templates match "\${escapeHtml(searchQuery)}"</div>
                        <button class="btn" onclick="document.getElementById('searchInput').value = ''; filterTemplates()">
                            Clear Search
                        </button>
                    </div>
                \`;
            }

            // No results with filters
            if (hasFilters || hasSearch) {
                return \`
                    <div class="empty-state">
                        <div class="empty-state-icon">🔍</div>
                        <div class="empty-state-title">No Results</div>
                        <div style="margin-bottom: 16px;">No templates match your current filters</div>
                        <button class="btn" onclick="clearAllFilters(); document.getElementById('searchInput').value = ''; filterTemplates()">
                            Clear All Filters
                        </button>
                    </div>
                \`;
            }

            // Fallback
            return \`
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-title">No Templates Found</div>
                    <div>Try adjusting your search or filters</div>
                </div>
            \`;
        }

        // === Variable Editor Functions ===

        // Variable editor state
        let currentTemplateData = null;
        let customVariables = [];
        let editingVariableIndex = -1;
        let BUILT_IN_VARS = []; // Will be populated from backend

        // Validation promise management (Issue #111 Code Review - replaced window.pendingVariable)
        let currentValidationResolver = null;

        // Focus trap management for modal accessibility (Issue #111)
        let focusTrapActive = false;
        let lastFocusedElement = null;

        // Open variable editor modal - Enhanced with focus trap (Issue #111)
        function openVariableEditor(templateId) {
            const template = templates.find(t => t.id === templateId);
            if (!template) return;

            if (template.fileType !== 'json') {
                // Show error for non-JSON templates
                return;
            }

            // Store last focused element to restore later
            lastFocusedElement = document.activeElement;

            // Request template data from extension
            vscode.postMessage({
                command: 'getTemplateData',
                templateId: templateId
            });

            // Show modal (will be populated when data arrives)
            const modal = document.getElementById('variableEditorModal');
            modal.classList.add('visible');

            // Setup focus trap
            setupFocusTrap(modal);

            // Focus first focusable element
            setTimeout(() => {
                const firstFocusable = getFirstFocusableElement(modal);
                if (firstFocusable) {
                    firstFocusable.focus();
                }
            }, 100);
        }

        // Close variable editor modal - Enhanced to restore focus (Issue #111)
        function closeVariableEditor() {
            const modal = document.getElementById('variableEditorModal');
            modal.classList.remove('visible');
            currentTemplateData = null;
            customVariables = [];
            editingVariableIndex = -1;

            // Remove focus trap
            removeFocusTrap();

            // Restore focus to previously focused element
            if (lastFocusedElement) {
                lastFocusedElement.focus();
                lastFocusedElement = null;
            }
        }

        // Setup focus trap within modal (Issue #111 - Accessibility)
        function setupFocusTrap(container) {
            focusTrapActive = true;

            // Add Tab key listener for focus trapping
            document.addEventListener('keydown', handleFocusTrap);

            // Add aria-modal attribute
            container.setAttribute('role', 'dialog');
            container.setAttribute('aria-modal', 'true');
        }

        // Remove focus trap (Issue #111 - Accessibility)
        function removeFocusTrap() {
            focusTrapActive = false;
            document.removeEventListener('keydown', handleFocusTrap);
        }

        // Handle focus trap Tab navigation (Issue #111 - Accessibility)
        function handleFocusTrap(event) {
            if (!focusTrapActive || event.key !== 'Tab') return;

            const modal = document.getElementById('variableEditorModal');
            if (!modal || !modal.classList.contains('visible')) return;

            const focusableElements = getFocusableElements(modal);
            if (focusableElements.length === 0) return;

            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];

            if (event.shiftKey) {
                // Shift+Tab - move backwards
                if (document.activeElement === firstFocusable) {
                    event.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                // Tab - move forwards
                if (document.activeElement === lastFocusable) {
                    event.preventDefault();
                    firstFocusable.focus();
                }
            }
        }

        // Get all focusable elements within a container (Issue #111)
        function getFocusableElements(container) {
            const focusableSelectors = [
                'button:not([disabled])',
                'input:not([disabled])',
                'select:not([disabled])',
                'textarea:not([disabled])',
                'a[href]',
                '[tabindex]:not([tabindex="-1"])'
            ];

            return Array.from(
                container.querySelectorAll(focusableSelectors.join(', '))
            ).filter(el => {
                // Filter out hidden elements
                return el.offsetParent !== null || el.offsetHeight > 0 || el.offsetWidth > 0;
            });
        }

        // Get first focusable element (Issue #111)
        function getFirstFocusableElement(container) {
            const elements = getFocusableElements(container);
            return elements.length > 0 ? elements[0] : null;
        }

        // Populate variable editor with template data
        function populateVariableEditor(templateData, builtInVariables) {
            currentTemplateData = templateData;
            customVariables = templateData.variables || [];
            BUILT_IN_VARS = builtInVariables || [];

            document.getElementById('variableEditorTitle').textContent = \`Edit Variables: \${templateData.name}\`;
            renderVariablesList();
            updateVariableUsageList();
            updateVariableCount();
            updateBuiltInVariablesDisplay();
        }

        // Render variables list
        function renderVariablesList() {
            const listContainer = document.getElementById('variablesList');

            if (customVariables.length === 0) {
                listContainer.innerHTML = \`
                    <div class="empty-variables-state">
                        <div style="font-size: 32px; margin-bottom: 12px;">📝</div>
                        <div>No custom variables yet</div>
                        <div style="font-size: 12px; margin-top: 6px;">Click "Add Variable" to create one</div>
                    </div>
                \`;
                return;
            }

            listContainer.innerHTML = customVariables.map((v, index) => \`
                <div class="variable-item \${editingVariableIndex === index ? 'selected' : ''}" data-index="\${index}">
                    <div class="variable-item-header">
                        <span class="variable-name">{\${escapeHtml(v.name)}}</span>
                        <span class="variable-type-badge">\${escapeHtml(v.type)}</span>
                    </div>
                    \${v.description ? \`<div class="variable-description">\${escapeHtml(v.description)}</div>\` : ''}
                </div>
            \`).join('');

            // Add event listeners using event delegation
            listContainer.querySelectorAll('.variable-item').forEach(item => {
                item.addEventListener('click', () => {
                    const index = parseInt(item.getAttribute('data-index') || '-1', 10);
                    if (index >= 0) {
                        selectVariableForEdit(index);
                    }
                });
            });
        }

        // Select a variable for editing - Enhanced with usage info (Issue #111)
        function selectVariableForEdit(index) {
            editingVariableIndex = index;
            const variable = customVariables[index];

            // Show form
            document.getElementById('variableForm').style.display = 'block';
            document.getElementById('deleteVarBtn').style.display = 'block';

            // Populate form
            document.getElementById('varName').value = variable.name;
            document.getElementById('varType').value = variable.type;
            document.getElementById('varDescription').value = variable.description || '';
            document.getElementById('varDefault').value = variable.default || '';
            document.getElementById('varRequired').checked = variable.required || false;

            // Handle enum values
            if (variable.type === 'enum') {
                document.getElementById('enumValuesGroup').style.display = 'block';
                renderEnumValues(variable.values || []);
            } else {
                document.getElementById('enumValuesGroup').style.display = 'none';
            }

            // Clear errors and validation
            clearValidationErrors();

            // Request variable usage info from backend
            requestVariableUsageInfo(variable.name);

            renderVariablesList();
        }

        // Request variable usage information (Issue #111)
        function requestVariableUsageInfo(variableName) {
            vscode.postMessage({
                command: 'getVariableUsageInfo',
                templateId: currentEditingTemplate,
                variableName: variableName
            });
        }

        // Handle variable usage response (Issue #111)
        function handleVariableUsageResponse(data) {
            const usagePanel = document.getElementById('usageInfoPanel');
            const countDiv = document.getElementById('usageCount');
            const positionsDiv = document.getElementById('usagePositions');

            if (!data.count || data.count === 0) {
                usagePanel.style.display = 'none';
                return;
            }

            // Display usage count
            countDiv.innerHTML = \`Variable used <span class="usage-count-badge">\${data.count} time\${data.count !== 1 ? 's' : ''}</span> in template\`;

            // Display usage positions (show first 5)
            if (data.positions && data.positions.length > 0) {
                const maxShow = 5;
                const positions = data.positions.slice(0, maxShow);
                positionsDiv.innerHTML = positions.map(pos =>
                    \`<div class="usage-position-item">
                        <span class="line-number">Line \${pos.line}:</span>
                        <span class="context-text">\${escapeHtml(pos.context).replace(
                            new RegExp(\`\\\\{\${escapeRegex(pos.variableName)}\\\\}\`, 'g'),
                            '<span class="highlight">{\$&}</span>'
                        )}</span>
                    </div>\`
                ).join('');

                if (data.positions.length > maxShow) {
                    positionsDiv.innerHTML += \`<div class="usage-positions-more-info">...and \${data.positions.length - maxShow} more</div>\`;
                }
            }

            usagePanel.style.display = 'block';
        }

        // Escape regex special characters
        function escapeRegex(str) {
            return str.replace(/[.*+?^$\{\\}()|\\[\\]\\\\]/g, '\\\\$&');
        }

        // Add new variable
        function addNewVariable() {
            editingVariableIndex = -1;

            // Show form
            document.getElementById('variableForm').style.display = 'block';
            document.getElementById('deleteVarBtn').style.display = 'none';

            // Clear form
            document.getElementById('varName').value = '';
            document.getElementById('varType').value = 'string';
            document.getElementById('varDescription').value = '';
            document.getElementById('varDefault').value = '';
            document.getElementById('varRequired').checked = false;
            document.getElementById('enumValuesGroup').style.display = 'none';

            // Clear errors
            document.getElementById('varNameError').textContent = '';
            document.getElementById('varName').classList.remove('error');

            renderVariablesList();
        }

        // Cancel variable edit
        function cancelVariableEdit() {
            document.getElementById('variableForm').style.display = 'none';
            editingVariableIndex = -1;
            renderVariablesList();
        }

        // Validate variable name
        function validateVariableName(name) {
            if (!name || name.trim().length === 0) {
                return { isValid: false, error: 'Variable name cannot be empty' };
            }

            const validFormat = /^[a-z][a-z0-9_]*$/;
            if (!validFormat.test(name)) {
                return {
                    isValid: false,
                    error: 'Must start with a letter and contain only lowercase letters, numbers, and underscores'
                };
            }

            if (BUILT_IN_VARS.includes(name)) {
                return {
                    isValid: false,
                    error: \`'\${name}' is a built-in variable\`
                };
            }

            // Check for duplicates (excluding currently editing variable)
            const duplicate = customVariables.findIndex((v, idx) => v.name === name && idx !== editingVariableIndex);
            if (duplicate !== -1) {
                return {
                    isValid: false,
                    error: \`Variable '\${name}' already exists\`
                };
            }

            return { isValid: true };
        }

        // Save variable - Enhanced with advanced validation (Issue #111)
        async function saveVariable() {
            const name = document.getElementById('varName').value.trim();
            const type = document.getElementById('varType').value;
            const description = document.getElementById('varDescription').value.trim();
            const defaultValue = document.getElementById('varDefault').value.trim();
            const required = document.getElementById('varRequired').checked;

            // Clear previous errors
            clearValidationErrors();

            // Validate name
            const validation = validateVariableName(name);
            if (!validation.isValid) {
                document.getElementById('varNameError').textContent = validation.error;
                document.getElementById('varName').classList.add('error');
                document.getElementById('varName').setAttribute('aria-invalid', 'true');
                announceToScreenReader(validation.error);
                return;
            }

            // Build variable object
            const variable = {
                name,
                type,
                required,
                description: description || undefined,
                default: defaultValue || undefined
            };

            // Handle enum values
            if (type === 'enum') {
                const enumInputs = document.querySelectorAll('.enum-value-input');
                const values = Array.from(enumInputs)
                    .map(input => input.value.trim())
                    .filter(val => val.length > 0);

                if (values.length === 0) {
                    document.getElementById('varNameError').textContent = 'Enum must have at least one value';
                    document.getElementById('varName').setAttribute('aria-invalid', 'true');
                    announceToScreenReader('Enum must have at least one value');
                    return;
                }

                variable.values = values;
            }

            // Perform advanced validation via backend
            const otherVariables = customVariables.filter((v, idx) => idx !== editingVariableIndex);
            const originalName = editingVariableIndex >= 0 ? customVariables[editingVariableIndex].name : undefined;

            const validationResult = await performAdvancedValidation(variable, otherVariables, originalName);

            // If validation passed, save the variable
            if (validationResult.isValid) {
                // Add or update variable
                if (editingVariableIndex === -1) {
                    customVariables.push(variable);
                } else {
                    customVariables[editingVariableIndex] = variable;
                }

                // Hide form and refresh
                document.getElementById('variableForm').style.display = 'none';
                editingVariableIndex = -1;
                renderVariablesList();
                updateVariableUsageList();
                updateVariableCount();

                announceToScreenReader('Variable saved successfully');
            }
        }

        // Perform advanced validation and return Promise (Issue #111 Code Review)
        function performAdvancedValidation(variable, otherVariables, originalName) {
            return new Promise((resolve, reject) => {
                // Store resolver for the response handler
                currentValidationResolver = { resolve, reject, variable, originalName };

                // Request advanced validation from backend
                vscode.postMessage({
                    command: 'validateVariable',
                    templateId: currentEditingTemplate,
                    variable: variable,
                    existingVariables: otherVariables,
                    originalName: originalName
                });
            });
        }

        // Handle validation response from backend (Issue #111 Code Review - Promise-based)
        function handleValidationResponse(data) {
            const validationPanel = document.getElementById('validationPanel');
            const errorsDiv = document.getElementById('validationErrors');
            const warningsDiv = document.getElementById('validationWarnings');

            // Clear previous validation
            errorsDiv.innerHTML = '';
            warningsDiv.innerHTML = '';

            // Display errors
            if (data.errors && data.errors.length > 0) {
                errorsDiv.innerHTML = data.errors.map(error =>
                    \`<div class="validation-error-item">\${escapeHtml(error)}</div>\`
                ).join('');
                validationPanel.style.display = 'block';

                // Announce errors to screen reader
                announceToScreenReader(\`\${data.errors.length} validation error\${data.errors.length > 1 ? 's' : ''}: \${data.errors.join(', ')}\`);

                // Resolve promise with validation result (validation failed)
                if (currentValidationResolver) {
                    currentValidationResolver.resolve(data);
                    currentValidationResolver = null;
                }
                return;
            }

            // Display warnings (non-blocking)
            if (data.warnings && data.warnings.length > 0) {
                warningsDiv.innerHTML = data.warnings.map(warning =>
                    \`<div class="validation-warning-item">\${escapeHtml(warning)}</div>\`
                ).join('');
                validationPanel.style.display = 'block';

                // Announce warnings to screen reader
                announceToScreenReader(\`\${data.warnings.length} validation warning\${data.warnings.length > 1 ? 's' : ''}\`);
            } else {
                validationPanel.style.display = 'none';
            }

            // Validation passed - resolve promise with success
            if (currentValidationResolver && data.isValid) {
                currentValidationResolver.resolve(data);
                currentValidationResolver = null;
            }
        }

        // Clear validation errors
        function clearValidationErrors() {
            document.getElementById('varNameError').textContent = '';
            document.getElementById('varDefaultError').textContent = '';
            document.getElementById('varName').classList.remove('error');
            document.getElementById('varName').setAttribute('aria-invalid', 'false');
            document.getElementById('validationPanel').style.display = 'none';
            document.getElementById('validationErrors').innerHTML = '';
            document.getElementById('validationWarnings').innerHTML = '';
        }

        // Announce message to screen reader (Issue #111 - Accessibility)
        function announceToScreenReader(message) {
            const liveRegion = document.createElement('div');
            liveRegion.setAttribute('role', 'status');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.className = 'sr-only';
            liveRegion.textContent = message;
            document.body.appendChild(liveRegion);

            // Remove after announcement
            setTimeout(() => {
                document.body.removeChild(liveRegion);
            }, 1000);
        }

        // Delete current variable
        function deleteCurrentVariable() {
            if (editingVariableIndex === -1) return;

            const varName = customVariables[editingVariableIndex].name;

            // Show inline confirmation instead of native confirm dialog
            const form = document.getElementById('variableForm');
            const originalHTML = form.innerHTML;

            form.innerHTML = \`
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 16px; margin-bottom: 20px;">
                        Delete variable '<strong>\${escapeHtml(varName)}</strong>'?
                    </div>
                    <div style="display: flex; gap: 8px; justify-content: center;">
                        <button class="btn btn-secondary" id="cancelDelete">Cancel</button>
                        <button class="btn danger" id="confirmDelete">Delete</button>
                    </div>
                </div>
            \`;

            document.getElementById('cancelDelete').addEventListener('click', () => {
                form.innerHTML = originalHTML;
                selectVariableForEdit(editingVariableIndex);
            });

            document.getElementById('confirmDelete').addEventListener('click', () => {
                customVariables.splice(editingVariableIndex, 1);
                form.style.display = 'none';
                form.innerHTML = originalHTML;
                editingVariableIndex = -1;
                renderVariablesList();
                updateVariableUsageList();
                updateVariableCount();
            });
        }

        // Render enum values
        function renderEnumValues(values) {
            const container = document.getElementById('enumValues');
            container.innerHTML = values.map((val, idx) => \`
                <div class="enum-value-row" data-enum-index="\${idx}">
                    <input type="text" class="form-input enum-value-input" value="\${escapeHtml(val)}" placeholder="Option \${idx + 1}">
                    <button class="btn-remove-enum">×</button>
                </div>
            \`).join('');

            // Add event listeners for remove buttons
            container.querySelectorAll('.btn-remove-enum').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const row = e.target.closest('.enum-value-row');
                    if (row && container.children.length > 1) {
                        row.remove();
                    }
                });
            });

            if (values.length === 0) {
                addEnumValue();
            }
        }

        // Add enum value
        function addEnumValue() {
            const container = document.getElementById('enumValues');
            const currentCount = container.children.length;

            const row = document.createElement('div');
            row.className = 'enum-value-row';
            row.innerHTML = \`
                <input type="text" class="form-input enum-value-input" placeholder="Option \${currentCount + 1}">
                <button class="btn-remove-enum">×</button>
            \`;

            // Add event listener for remove button
            const removeBtn = row.querySelector('.btn-remove-enum');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    if (container.children.length > 1) {
                        row.remove();
                    }
                });
            }

            container.appendChild(row);
        }

        // Listen for type changes to show/hide enum values
        document.addEventListener('DOMContentLoaded', () => {
            const typeSelect = document.getElementById('varType');
            if (typeSelect) {
                typeSelect.addEventListener('change', (e) => {
                    const enumGroup = document.getElementById('enumValuesGroup');
                    if (e.target.value === 'enum') {
                        enumGroup.style.display = 'block';
                        renderEnumValues(['']);
                    } else {
                        enumGroup.style.display = 'none';
                    }
                });
            }
        });

        // Update variable usage list with copy buttons
        function updateVariableUsageList() {
            if (!currentTemplateData) return;

            const listContainer = document.getElementById('variableUsageList');

            if (customVariables.length === 0) {
                listContainer.innerHTML = \`
                    <div style="text-align: center; padding: 20px; color: var(--vscode-descriptionForeground); font-size: 12px;">
                        No custom variables yet. Add some above!
                    </div>
                \`;
                return;
            }

            listContainer.innerHTML = \`
                <div style="font-size: 12px; color: var(--vscode-descriptionForeground); margin-bottom: 8px;">
                    <strong>Your Custom Variables:</strong>
                </div>
                <div class="variable-usage-list">
                    \${customVariables.map((v, idx) => \`
                        <div class="usage-variable-item">
                            <span class="usage-variable-name">{\${escapeHtml(v.name)}}</span>
                            <span class="usage-variable-type">\${escapeHtml(v.type)}</span>
                            <button class="copy-var-btn" onclick="copyVariableToClipboard('\${escapeHtml(v.name)}', this)" aria-label="Copy \${escapeHtml(v.name)} to clipboard">
                                📋 Copy
                            </button>
                        </div>
                    \`).join('')}
                </div>
            \`;
        }

        // Copy variable name to clipboard
        function copyVariableToClipboard(varName, btnElement) {
            const text = \`{\${varName}}\`;
            navigator.clipboard.writeText(text).then(() => {
                // Visual feedback
                const originalText = btnElement.textContent;
                btnElement.textContent = '✓ Copied!';
                btnElement.classList.add('copied');

                setTimeout(() => {
                    btnElement.textContent = originalText;
                    btnElement.classList.remove('copied');
                }, 2000);

                announceToScreenReader(\`Copied \${varName} to clipboard\`);
            }).catch(err => {
                console.error('Failed to copy:', err);
                announceToScreenReader(\`Failed to copy \${varName}\`);
            });
        }

        // Edit template content button handler
        function editTemplateContent() {
            if (!currentTemplateData) return;

            // Send message to open the template file
            vscode.postMessage({
                command: 'editTemplate',
                templateId: currentTemplateData.id
            });

            // Show a helpful tip
            const footer = document.querySelector('.variable-editor-footer .footer-info');
            if (footer) {
                footer.innerHTML = \`<span style="color: var(--vscode-textLink-foreground);">💡 Tip: Paste variables using {variable_name} syntax in your template</span>\`;
                setTimeout(() => {
                    footer.textContent = \`\${customVariables.length} custom variable\${customVariables.length !== 1 ? 's' : ''}\`;
                }, 5000);
            }
        }

        // Update variable count
        function updateVariableCount() {
            const count = customVariables.length;
            document.getElementById('variableCount').textContent = \`\${count} custom variable\${count !== 1 ? 's' : ''}\`;
        }

        // Update built-in variables display
        function updateBuiltInVariablesDisplay() {
            const infoDiv = document.querySelector('.built-in-variables-info');
            if (infoDiv && BUILT_IN_VARS.length > 0) {
                infoDiv.innerHTML = \`
                    <strong>Built-in Variables:</strong><br>
                    \${BUILT_IN_VARS.map(v => \`<span class="built-in-var">{\${escapeHtml(v)}}</span>\`).join(', ')}
                \`;
            }
        }

        // Save all variables to template
        function saveAllVariables() {
            if (!currentTemplateData) return;

            vscode.postMessage({
                command: 'saveTemplateVariables',
                templateId: currentTemplateData.id,
                variables: customVariables
            });
        }

        // Export variables configuration (Issue #111 - UX Enhancement)
        function exportVariablesConfig() {
            if (!currentTemplateData) return;

            vscode.postMessage({
                command: 'exportVariables',
                templateId: currentTemplateData.id
            });
        }

        // Import variables configuration (Issue #111 - UX Enhancement)
        function importVariablesConfig() {
            if (!currentTemplateData) return;

            // Create a file input element dynamically
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.style.display = 'none';

            input.addEventListener('change', async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                try {
                    const text = await file.text();
                    vscode.postMessage({
                        command: 'importVariables',
                        templateId: currentTemplateData.id,
                        variablesJson: text
                    });
                } catch (error) {
                    announceToScreenReader('Failed to read file: ' + error.message);
                } finally {
                    document.body.removeChild(input);
                }
            });

            document.body.appendChild(input);
            input.click();
        }

        // Handle export variables response (Issue #111)
        function handleExportVariablesResponse(message) {
            if (message.success) {
                announceToScreenReader('Variables exported successfully');
            } else {
                announceToScreenReader('Failed to export variables: ' + message.error);
            }
        }

        // Handle import variables response (Issue #111)
        function handleImportVariablesResponse(message) {
            if (message.success) {
                // Replace current variables with imported ones
                customVariables = message.variables || [];
                renderVariablesList();
                updateVariableUsageList();
                updateVariableCount();
                announceToScreenReader(\`Successfully imported \${customVariables.length} variable\${customVariables.length !== 1 ? 's' : ''}\`);
            } else {
                announceToScreenReader('Failed to import variables: ' + message.error);
                // Show error in footer
                const footer = document.querySelector('.variable-editor-footer .footer-info');
                if (footer) {
                    footer.innerHTML = \`<span class="import-failed-message">❌ Import failed: \${escapeHtml(message.error)}</span>\`;
                    setTimeout(() => {
                        footer.textContent = \`\${customVariables.length} custom variable\${customVariables.length !== 1 ? 's' : ''}\`;
                    }, 5000);
                }
            }
        }

        // Update message handler to process preview responses
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateTemplates':
                    templates = message.templates;
                    renderFilters();
                    renderStats();
                    renderTemplates();
                    break;

                case 'previewResponse':
                    if (message.error) {
                        console.error('Preview error:', message.error);
                        return;
                    }

                    // Cache the preview
                    const cacheKey = message.maxLines === 4 ? 'tooltip' : 'preview';
                    previewCache.set(\`\${cacheKey}-\${message.templateId}\`, {
                        content: message.content,
                        hasMore: message.hasMore
                    });

                    // Update UI
                    if (message.maxLines === 4) {
                        updateTooltipContent(message.templateId, message.content);
                    } else {
                        updateInlinePreview(message.templateId, message.content, message.hasMore);
                    }
                    break;

                case 'fullPreviewResponse':
                    if (message.error) {
                        console.error('Full preview error:', message.error);
                        return;
                    }

                    // Cache the full preview
                    previewCache.set(\`full-\${message.templateId}\`, {
                        content: message.content,
                        samplePreview: message.samplePreview
                    });

                    // Update modal content
                    updateModalContent(message.content, message.samplePreview);
                    break;

                case 'templateDataResponse':
                    if (message.error) {
                        console.error('Template data error:', message.error);
                        closeVariableEditor();
                        return;
                    }

                    populateVariableEditor(message.template, message.builtInVariables || []);
                    break;

                case 'saveVariablesResponse':
                    if (message.success) {
                        // Show success message with next steps
                        announceToScreenReader('Variables saved successfully');

                        // Option 1: Show success banner and keep editor open so they can click "Edit Template Content"
                        const footer = document.querySelector('.variable-editor-footer .footer-info');
                        if (footer) {
                            footer.innerHTML = \`<span style="color: var(--vscode-testing-iconPassed);">✓ Variables saved! Click "📝 Edit Template Content" to use them in your template.</span>\`;
                        }

                        // Automatically close after 8 seconds, or user can manually close or edit template
                        setTimeout(() => {
                            closeVariableEditor();
                        }, 8000);
                    } else {
                        console.error('Save variables error:', message.error);
                        // Show inline error instead of alert
                        const footer = document.querySelector('.variable-editor-footer .footer-info');
                        if (footer) {
                            footer.innerHTML = \`<span class="save-failed-message">❌ Failed to save: \${escapeHtml(message.error)}</span>\`;
                            setTimeout(() => {
                                footer.textContent = \`\${customVariables.length} custom variable\${customVariables.length !== 1 ? 's' : ''}\`;
                            }, 5000);
                        }
                    }
                    break;

                case 'validateVariableResponse':
                    handleValidationResponse(message);
                    break;

                case 'variableUsageInfoResponse':
                    handleVariableUsageResponse(message);
                    break;

                case 'exportVariablesResponse':
                    handleExportVariablesResponse(message);
                    break;

                case 'importVariablesResponse':
                    handleImportVariablesResponse(message);
                    break;
            }
        });
    </script>
</body>
</html>`;
}
