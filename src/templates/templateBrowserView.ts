import * as vscode from 'vscode';
import * as path from 'path';
import { getTemplatesPath, getFileFormat } from '../services/configService';
import { pathExists, readFile, readDirectory, writeFile } from '../services/fileSystemService';
import { Template, TemplateDifficulty } from './TemplateTypes';
import { BUILT_IN_TEMPLATES } from '../constants';
import { TemplatesTreeProvider } from '../providers/templatesTreeProvider';
import { getTemplateContent, getTemplateLines, highlightVariables, generateSamplePreview } from '../services/templateService';

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
    isBuiltIn: boolean;
    fileType: 'json' | 'txt' | 'md' | 'builtin';
    difficulty?: TemplateDifficulty;
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

                case 'getPreview':
                    await handleGetPreview(panel, message.templateId, message.maxLines);
                    break;

                case 'getFullPreview':
                    await handleGetFullPreview(panel, message.templateId);
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

    // Add built-in templates
    const builtInNames = Object.keys(BUILT_IN_TEMPLATES);
    for (const name of builtInNames) {
        templates.push({
            id: name,
            name: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' '),
            description: `Built-in ${name} template`,
            category: 'Built-in',
            tags: ['built-in'],
            version: '1.0.0',
            isBuiltIn: true,
            fileType: 'builtin'
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
                            isBuiltIn: false,
                            fileType: 'json',
                            difficulty: template.difficulty
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

        .difficulty-badge {
            font-size: 11px;
            padding: 3px 8px;
            border-radius: 3px;
            font-weight: 500;
        }

        .difficulty-beginner {
            background: var(--vscode-gitDecoration-addedResourceForeground);
            color: var(--vscode-editor-background);
        }

        .difficulty-intermediate {
            background: var(--vscode-list-warningForeground);
            color: var(--vscode-editor-background);
        }

        .difficulty-advanced {
            background: var(--vscode-errorForeground);
            color: var(--vscode-editor-background);
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
    </style>
</head>
<body>
    <div class="header">
        <h1>📝 Template Browser</h1>
        <button class="btn" onclick="refresh()">🔄 Refresh</button>
    </div>

    <div class="controls">
        <input
            type="text"
            class="search-box"
            placeholder="Search templates by name, description, or tags..."
            oninput="filterTemplates()"
            id="searchInput"
        />
        <div class="view-toggle">
            <button class="btn btn-secondary" onclick="setView('grid')" id="gridBtn">Grid</button>
            <button class="btn btn-secondary" onclick="setView('list')" id="listBtn">List</button>
        </div>
    </div>

    <div class="filters" id="filters"></div>

    <div class="stats" id="stats"></div>

    <div class="templates-grid" id="templatesContainer"></div>

    <!-- Full Preview Modal -->
    <div class="modal-overlay" id="previewModal" onclick="closeModalOnOverlay(event)">
        <div class="modal-container">
            <div class="modal-header">
                <div class="modal-title" id="modalTitle">Template Preview</div>
                <button class="modal-close" onclick="closePreviewModal()" aria-label="Close">&times;</button>
            </div>
            <div class="modal-tabs">
                <button class="modal-tab active" onclick="switchModalTab('raw')" id="rawTab">Raw Template</button>
                <button class="modal-tab" onclick="switchModalTab('sample')" id="sampleTab">Sample Preview</button>
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
                <button class="modal-btn modal-btn-secondary" onclick="copyModalContent()">Copy to Clipboard</button>
                <button class="modal-btn" onclick="closePreviewModal()">Close</button>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let templates = ${JSON.stringify(templates)};
        let currentView = 'grid';
        let activeCategory = 'all';
        let searchQuery = '';

        // Constants for template icons and badges
        const TEMPLATE_ICON_MAP = {
            'Built-in': '⚡',
            'Custom': '✏️',
            'Documentation': '📄',
            'Project': '📁',
            'Meeting': '🤝',
            'Research': '🔬',
            'Planning': '📋',
            'Development': '💻',
            'Design': '🎨',
            'General': '📝'
        };

        const FILE_TYPE_BADGES = {
            'builtin': 'BUILT-IN',
            'json': '.json',
            'txt': '.txt',
            'md': '.md'
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

        // Initialize
        renderFilters();
        renderStats();
        renderTemplates();

        function renderFilters() {
            const categories = ['all', ...new Set(templates.map(t => t.category))];
            const filtersContainer = document.getElementById('filters');
            filtersContainer.innerHTML = categories.map(cat =>
                \`<button
                    class="filter-btn \${cat === activeCategory ? 'active' : ''}"
                    onclick="setCategory('\${escapeHtml(cat)}')"
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
            const filteredTemplates = templates.filter(t => {
                const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
                const matchesSearch = !searchQuery ||
                    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
                return matchesCategory && matchesSearch;
            });

            const container = document.getElementById('templatesContainer');
            container.className = currentView === 'grid' ? 'templates-grid' : 'templates-list';

            if (filteredTemplates.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <div class="empty-state-title">No templates found</div>
                        <div>Try adjusting your search or filters</div>
                    </div>
                \`;
                return;
            }

            container.innerHTML = filteredTemplates.map(t => {
                const showNew = isNew(t);
                const showPopular = isPopular(t);

                return \`
                <div class="template-card" data-template-id="\${escapeHtml(t.id)}">
                    <div class="template-header">
                        <div style="flex: 1;">
                            <div class="template-title-row">
                                <span class="template-icon">\${getTemplateIcon(t)}</span>
                                <div class="template-title">\${escapeHtml(t.name)}</div>
                            </div>
                            <div class="template-badges">
                                <span class="template-category">\${escapeHtml(t.category)}</span>
                                <span class="filetype-badge">\${getFileTypeBadge(t.fileType)}</span>
                                \${t.difficulty ? \`<span class="difficulty-badge difficulty-\${t.difficulty}">\${escapeHtml(t.difficulty.toUpperCase())}</span>\` : ''}
                                \${showNew ? '<span class="status-badge status-new">NEW</span>' : ''}
                                \${showPopular ? '<span class="status-badge status-popular">POPULAR</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="template-description">\${escapeHtml(t.description)}</div>
                    <div class="template-tags">
                        \${t.tags.map(tag => \`<span class="tag">#\${escapeHtml(tag)}</span>\`).join('')}
                    </div>
                    <div class="template-meta">
                        <span>v\${escapeHtml(t.version)}</span>
                        <span>\${t.usage_count !== undefined ? \`📊 \${escapeHtml(t.usage_count)} uses\` : '📊 0 uses'}</span>
                        \${t.author ? \`<span>👤 \${escapeHtml(t.author)}</span>\` : ''}
                    </div>

                    <!-- Level 1: Hover Tooltip -->
                    <div class="template-tooltip" data-tooltip-id="\${escapeHtml(t.id)}">
                        <div class="tooltip-content" id="tooltip-\${escapeHtml(t.id)}">Loading preview...</div>
                        <div class="tooltip-footer">Hover to see first 4 lines • Click Preview for more</div>
                    </div>

                    <!-- Level 2: Inline Preview Section -->
                    <div class="preview-section">
                        <button
                            class="preview-toggle"
                            onclick="togglePreview('\${escapeHtml(t.id)}')"
                            aria-expanded="false"
                            id="preview-toggle-\${escapeHtml(t.id)}"
                        >
                            <span class="preview-toggle-icon">▶</span>
                            <span>Preview Template</span>
                        </button>
                        <div class="preview-content" id="preview-content-\${escapeHtml(t.id)}">
                            <div class="preview-loading">Loading preview...</div>
                        </div>
                    </div>

                    <div class="template-actions">
                        <button class="action-btn primary" onclick="createFromTemplate('\${escapeHtml(t.id)}')">Create</button>
                        \${!t.isBuiltIn ? \`
                            <button class="action-btn" onclick="editTemplate('\${escapeHtml(t.id)}')">Edit</button>
                            <button class="action-btn" onclick="duplicateTemplate('\${escapeHtml(t.id)}')">Duplicate</button>
                            <button class="action-btn" onclick="exportTemplate('\${escapeHtml(t.id)}')">Export</button>
                            <button class="action-btn danger" onclick="deleteTemplate('\${escapeHtml(t.id)}')">Delete</button>
                        \` : ''}
                    </div>
                </div>
                \`;
            }).join('');

            // Load tooltip previews for all visible templates
            filteredTemplates.forEach(t => loadTooltipPreview(t.id));
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
        function togglePreview(templateId) {
            const toggleBtn = document.getElementById(\`preview-toggle-\${templateId}\`);
            const content = document.getElementById(\`preview-content-\${templateId}\`);

            const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';

            if (isExpanded) {
                // Collapse
                toggleBtn.setAttribute('aria-expanded', 'false');
                toggleBtn.classList.remove('expanded');
                content.classList.remove('visible');
            } else {
                // Expand
                toggleBtn.setAttribute('aria-expanded', 'true');
                toggleBtn.classList.add('expanded');
                content.classList.add('visible');

                // Load preview if not already loaded
                if (!previewCache.has(\`preview-\${templateId}\`)) {
                    vscode.postMessage({
                        command: 'getPreview',
                        templateId: templateId,
                        maxLines: 15
                    });
                }
            }
        }

        function updateInlinePreview(templateId, content, hasMore) {
            const previewContent = document.getElementById(\`preview-content-\${templateId}\`);
            if (previewContent) {
                previewContent.innerHTML = \`
                    <div class="preview-code">\${content}</div>
                    \${hasMore ? '<div class="preview-more">... (showing first 15 lines)</div>' : ''}
                    <div class="preview-actions">
                        <button class="preview-btn" onclick="showFullPreview('\${escapeHtml(templateId)}')">
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

        function copyModalContent() {
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

        // Keyboard accessibility - ESC to close modal
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                const modal = document.getElementById('previewModal');
                if (modal.classList.contains('visible')) {
                    closePreviewModal();
                }
            }
        });

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
            }
        });
    </script>
</body>
</html>`;
}
