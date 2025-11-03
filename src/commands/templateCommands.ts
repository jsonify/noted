/**
 * Custom template management commands
 */

import * as vscode from 'vscode';
import { promises as fsp } from 'fs';
import { getCustomTemplates, getCustomTemplatePath, getTemplateVariables } from '../services/templateService';

export async function handleEditCustomTemplate() {
    const customTemplates = await getCustomTemplates();
    if (customTemplates.length === 0) {
        vscode.window.showInformationMessage('No custom templates found. Create one first!');
        return;
    }

    const selected = await vscode.window.showQuickPick(customTemplates, {
        placeHolder: 'Select template to edit'
    });

    if (!selected) {
        return;
    }

    const templatePath = getCustomTemplatePath(selected);
    if (!templatePath) {
        vscode.window.showErrorMessage('Template path not found');
        return;
    }

    try {
        const document = await vscode.workspace.openTextDocument(templatePath);
        await vscode.window.showTextDocument(document);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open template: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function handleDeleteCustomTemplate() {
    const customTemplates = await getCustomTemplates();
    if (customTemplates.length === 0) {
        vscode.window.showInformationMessage('No custom templates found.');
        return;
    }

    const selected = await vscode.window.showQuickPick(customTemplates, {
        placeHolder: 'Select template to delete'
    });

    if (!selected) {
        return;
    }

    const confirm = await vscode.window.showWarningMessage(
        `Are you sure you want to delete the template "${selected}"?`,
        { modal: true },
        'Delete'
    );

    if (confirm !== 'Delete') {
        return;
    }

    const templatePath = getCustomTemplatePath(selected);
    if (!templatePath) {
        vscode.window.showErrorMessage('Template path not found');
        return;
    }

    try {
        await fsp.unlink(templatePath);
        vscode.window.showInformationMessage(`Template "${selected}" deleted`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to delete template: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function handleDuplicateCustomTemplate() {
    const customTemplates = await getCustomTemplates();
    if (customTemplates.length === 0) {
        vscode.window.showInformationMessage('No custom templates found.');
        return;
    }

    const selected = await vscode.window.showQuickPick(customTemplates, {
        placeHolder: 'Select template to duplicate'
    });

    if (!selected) {
        return;
    }

    const newName = await vscode.window.showInputBox({
        prompt: 'Enter name for duplicated template',
        placeHolder: `${selected}-copy`,
        value: `${selected}-copy`
    });

    if (!newName) {
        return;
    }

    const sourcePath = getCustomTemplatePath(selected);
    const targetPath = getCustomTemplatePath(newName);

    if (!sourcePath || !targetPath) {
        vscode.window.showErrorMessage('Template paths not found');
        return;
    }

    try {
        // Check if target already exists
        try {
            await fsp.access(targetPath);
            vscode.window.showErrorMessage('A template with that name already exists');
            return;
        } catch {
            // Target doesn't exist, proceed with copy
        }

        const content = await fsp.readFile(sourcePath, 'utf-8');
        await fsp.writeFile(targetPath, content);
        vscode.window.showInformationMessage(`Template duplicated as "${newName}"`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to duplicate template: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function handlePreviewTemplateVariables() {
    const variables = getTemplateVariables();

    const items = variables.map(v => `${v.name}: ${v.description}`).join('\n');

    const panel = vscode.window.createWebviewPanel(
        'templateHelp',
        'Template Variables',
        vscode.ViewColumn.Beside,
        {}
    );

    panel.webview.html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    padding: 20px;
                    color: var(--vscode-foreground);
                }
                h1 {
                    color: var(--vscode-textLink-foreground);
                }
                .variable {
                    margin: 15px 0;
                    padding: 10px;
                    background-color: var(--vscode-editor-background);
                    border-left: 3px solid var(--vscode-textLink-foreground);
                }
                .variable-name {
                    font-weight: bold;
                    font-family: monospace;
                    color: var(--vscode-textLink-activeForeground);
                }
                .variable-desc {
                    margin-top: 5px;
                    color: var(--vscode-descriptionForeground);
                }
            </style>
        </head>
        <body>
            <h1>Template Variables</h1>
            <p>Use these placeholders in your custom templates. They will be replaced with actual values when creating a note.</p>
            ${variables.map(v => `
                <div class="variable">
                    <div class="variable-name">${v.name}</div>
                    <div class="variable-desc">${v.description}</div>
                </div>
            `).join('')}
        </body>
        </html>
    `;
}
