import * as vscode from 'vscode';
import * as path from 'path';
import { bundleService } from '../templates/BundleService';
import { TemplateBundle } from '../templates/TemplateTypes';
import { getCustomTemplates } from '../services/templateService';

/**
 * Command: Create notes from a bundle
 */
export async function handleCreateBundle(): Promise<void> {
    try {
        // Get all available bundles
        const bundles = await bundleService.getAllBundles();

        if (bundles.length === 0) {
            const action = await vscode.window.showInformationMessage(
                'No bundles found. Would you like to create a bundle from templates?',
                'Create Bundle',
                'Cancel'
            );

            if (action === 'Create Bundle') {
                await handleCreateBundleFromTemplates();
            }
            return;
        }

        // Show quick pick with available bundles
        interface BundleQuickPickItem extends vscode.QuickPickItem {
            bundle: TemplateBundle;
        }

        const items: BundleQuickPickItem[] = bundles.map(bundle => ({
            label: bundle.name,
            description: `${bundle.notes.length} note(s)`,
            detail: bundle.description,
            bundle
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a bundle to create notes from',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (!selected) {
            return;
        }

        // Create notes from bundle
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Creating bundle: ${selected.bundle.name}`,
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: 'Collecting variables...' });

            const createdPaths = await bundleService.createFromBundle(selected.bundle.id);

            progress.report({ increment: 100, message: `Created ${createdPaths.length} note(s)` });

            if (createdPaths.length > 0) {
                // Refresh notes tree view
                await vscode.commands.executeCommand('noted.refresh');
            }
        });

    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(`Failed to create bundle: ${error.message}`);
        } else {
            vscode.window.showErrorMessage('Failed to create bundle');
        }
        console.error('Create bundle error:', error);
    }
}

/**
 * Command: Create a bundle from selected templates
 */
export async function handleCreateBundleFromTemplates(): Promise<void> {
    try {
        // Get all custom templates
        const templates = await getCustomTemplates();

        if (templates.length === 0) {
            vscode.window.showInformationMessage(
                'No custom templates found. Create templates first before creating bundles.'
            );
            return;
        }

        // Show multi-select quick pick for templates
        interface TemplateQuickPickItem extends vscode.QuickPickItem {
            templateId: string;
        }

        const items: TemplateQuickPickItem[] = templates.map(templateId => ({
            label: templateId,
            description: 'Template',
            templateId,
            picked: false
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select templates to include in bundle (press Enter when done)',
            canPickMany: true,
            matchOnDescription: true
        });

        if (!selected || selected.length === 0) {
            return;
        }

        const templateIds = selected.map(item => item.templateId);

        // Create bundle from templates
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Creating bundle...',
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: 'Collecting bundle information...' });

            const bundle = await bundleService.createBundleFromTemplates(templateIds);

            if (!bundle) {
                return;
            }

            progress.report({ increment: 50, message: 'Saving bundle...' });

            // Offer to open the bundle file for editing
            const action = await vscode.window.showInformationMessage(
                `Bundle "${bundle.name}" created! You can now customize variables, folders, and links between notes.`,
                'Edit Bundle',
                'Create Notes from Bundle'
            );

            progress.report({ increment: 100, message: 'Done!' });

            if (action === 'Edit Bundle') {
                await openBundleFile(bundle.id);
            } else if (action === 'Create Notes from Bundle') {
                await handleCreateBundle();
            }
        });

    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(`Failed to create bundle from templates: ${error.message}`);
        } else {
            vscode.window.showErrorMessage('Failed to create bundle from templates');
        }
        console.error('Create bundle from templates error:', error);
    }
}

/**
 * Command: Edit an existing bundle
 */
export async function handleEditBundle(): Promise<void> {
    try {
        // Get all available bundles
        const bundles = await bundleService.getAllBundles();

        if (bundles.length === 0) {
            vscode.window.showInformationMessage('No bundles found.');
            return;
        }

        // Show quick pick with available bundles
        interface BundleQuickPickItem extends vscode.QuickPickItem {
            bundle: TemplateBundle;
        }

        const items: BundleQuickPickItem[] = bundles.map(bundle => ({
            label: bundle.name,
            description: `v${bundle.version}`,
            detail: bundle.description,
            bundle
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a bundle to edit',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (!selected) {
            return;
        }

        await openBundleFile(selected.bundle.id);

    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(`Failed to edit bundle: ${error.message}`);
        } else {
            vscode.window.showErrorMessage('Failed to edit bundle');
        }
        console.error('Edit bundle error:', error);
    }
}

/**
 * Command: Delete a bundle
 */
export async function handleDeleteBundle(): Promise<void> {
    try {
        // Get all available bundles
        const bundles = await bundleService.getAllBundles();

        if (bundles.length === 0) {
            vscode.window.showInformationMessage('No bundles found.');
            return;
        }

        // Show quick pick with available bundles
        interface BundleQuickPickItem extends vscode.QuickPickItem {
            bundle: TemplateBundle;
        }

        const items: BundleQuickPickItem[] = bundles.map(bundle => ({
            label: bundle.name,
            description: `v${bundle.version}`,
            detail: bundle.description,
            bundle
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a bundle to delete',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (!selected) {
            return;
        }

        // Confirm deletion
        const confirm = await vscode.window.showWarningMessage(
            `Delete bundle "${selected.bundle.name}"?`,
            { modal: true },
            'Delete'
        );

        if (confirm !== 'Delete') {
            return;
        }

        // Delete bundle file
        await bundleService.deleteBundle(selected.bundle.id);

        vscode.window.showInformationMessage(`Bundle "${selected.bundle.name}" deleted successfully`);

    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(`Failed to delete bundle: ${error.message}`);
        } else {
            vscode.window.showErrorMessage('Failed to delete bundle');
        }
        console.error('Delete bundle error:', error);
    }
}

/**
 * Open a bundle file in the editor
 */
async function openBundleFile(bundleId: string): Promise<void> {
    const templatesPath = getTemplatesPath();
    const bundlesPath = path.join(templatesPath, 'bundles');
    const bundlePath = path.join(bundlesPath, `${bundleId}.bundle.json`);

    const uri = vscode.Uri.file(bundlePath);
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc, { preview: false });
}
