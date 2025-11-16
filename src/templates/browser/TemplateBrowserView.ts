import * as vscode from 'vscode';
import * as path from 'path';
import { promises as fsp } from 'fs';
import { TemplatesTreeProvider } from '../../providers/templatesTreeProvider';
import { loadAllTemplates } from './templateOperations';
import * as messageHandlers from './messageHandlers';

// Module-level reference to templates tree provider for refreshing
let templatesProvider: TemplatesTreeProvider | undefined;

/**
 * Show the template browser webview
 */
export async function showTemplateBrowser(context: vscode.ExtensionContext, provider?: TemplatesTreeProvider): Promise<void> {
    // Store reference to templates provider for refreshing after operations
    templatesProvider = provider;

    const panel = vscode.window.createWebviewPanel(
        'notedTemplateBrowser',
        'Template Browser',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(context.extensionPath, 'src', 'templates', 'browser'))
            ]
        }
    );

    // Load all templates
    const templates = await loadAllTemplates();

    // Set the initial HTML
    panel.webview.html = await getTemplateBrowserHtml(panel.webview, context.extensionPath, templates);

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
                    await messageHandlers.handleCreateFromTemplate(message.templateId);
                    break;

                case 'editTemplate':
                    await messageHandlers.handleEditTemplate(message.templateId);
                    break;

                case 'deleteTemplate':
                    await messageHandlers.handleDeleteTemplate(message.templateId);
                    await refreshWebviewTemplates();
                    templatesProvider?.refresh(); // Refresh sidebar tree view
                    break;

                case 'duplicateTemplate':
                    await messageHandlers.handleDuplicateTemplate(message.templateId);
                    await refreshWebviewTemplates();
                    templatesProvider?.refresh(); // Refresh sidebar tree view
                    break;

                case 'exportTemplate':
                    await messageHandlers.handleExportTemplate(message.templateId);
                    break;

                case 'refresh':
                    await refreshWebviewTemplates();
                    break;

                case 'getPreview':
                    await messageHandlers.handleGetPreview(panel, message.templateId, message.maxLines);
                    break;

                case 'getFullPreview':
                    await messageHandlers.handleGetFullPreview(panel, message.templateId);
                    break;

                case 'getTemplateData':
                    await messageHandlers.handleGetTemplateData(panel, message.templateId);
                    break;

                case 'saveTemplateVariables':
                    await messageHandlers.handleSaveTemplateVariables(panel, message.templateId, message.variables);
                    await refreshWebviewTemplates();
                    templatesProvider?.refresh();
                    break;

                case 'validateVariable':
                    await messageHandlers.handleValidateVariable(panel, message.templateId, message.variable, message.existingVariables, message.originalName);
                    break;

                case 'getVariableUsageInfo':
                    await messageHandlers.handleGetVariableUsageInfo(panel, message.templateId, message.variableName);
                    break;

                case 'exportVariables':
                    await messageHandlers.handleExportVariables(panel, message.templateId);
                    break;

                case 'importVariables':
                    await messageHandlers.handleImportVariables(panel, message.templateId, message.variablesJson);
                    break;
            }
        },
        undefined,
        context.subscriptions
    );
}

/**
 * Generate the HTML content for the template browser webview
 */
async function getTemplateBrowserHtml(webview: vscode.Webview, extensionPath: string, templates: any[]): Promise<string> {
    // Get paths to resources
    const browserPath = path.join(extensionPath, 'src', 'templates', 'browser');
    const htmlPath = path.join(browserPath, 'templateBrowser.html');
    const cssPath = path.join(browserPath, 'templateBrowser.css');
    const jsPath = path.join(browserPath, 'templateBrowser.js');

    // Read the HTML template
    let html = await fsp.readFile(htmlPath, 'utf8');

    // Read CSS and JS content for inline inclusion (since webview URIs can be tricky)
    const cssContent = await fsp.readFile(cssPath, 'utf8');
    const jsContent = await fsp.readFile(jsPath, 'utf8');

    // Replace placeholders
    html = html.replace('{{TEMPLATES_JSON}}', JSON.stringify(templates));
    html = html.replace('<link rel="stylesheet" href="{{CSS_URI}}">', `<style>${cssContent}</style>`);
    html = html.replace('<script src="{{JS_URI}}"></script>', `<script>${jsContent}</script>`);

    return html;
}
