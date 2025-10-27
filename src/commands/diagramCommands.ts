import * as vscode from 'vscode';
import { DiagramService, DiagramFile } from '../services/diagramService';
import { DiagramsTreeProvider } from '../providers/diagramsTreeProvider';

/**
 * Register all diagram-related commands
 */
export function registerDiagramCommands(
    context: vscode.ExtensionContext,
    diagramService: DiagramService,
    diagramsTreeProvider: DiagramsTreeProvider
): void {
    // Create Draw.io Diagram
    context.subscriptions.push(
        vscode.commands.registerCommand('noted.createDrawioDiagram', async () => {
            await createDrawioDiagram(diagramService, diagramsTreeProvider);
        })
    );

    // Create Excalidraw Diagram
    context.subscriptions.push(
        vscode.commands.registerCommand('noted.createExcalidrawDiagram', async () => {
            await createExcalidrawDiagram(diagramService, diagramsTreeProvider);
        })
    );

    // Insert Diagram
    context.subscriptions.push(
        vscode.commands.registerCommand('noted.insertDiagram', async () => {
            await insertDiagram(diagramService);
        })
    );

    // Open Diagram
    context.subscriptions.push(
        vscode.commands.registerCommand('noted.openDiagram', async (diagramFile?: DiagramFile) => {
            await openDiagram(diagramService, diagramFile);
        })
    );

    // Refresh Diagrams
    context.subscriptions.push(
        vscode.commands.registerCommand('noted.refreshDiagrams', () => {
            diagramsTreeProvider.refresh();
            vscode.window.showInformationMessage('Diagrams refreshed');
        })
    );
}

/**
 * Create a new Draw.io diagram
 */
async function createDrawioDiagram(
    diagramService: DiagramService,
    diagramsTreeProvider: DiagramsTreeProvider
): Promise<void> {
    // Check if Draw.io extension is installed
    if (!diagramService.isDrawioExtensionInstalled()) {
        diagramService.showExtensionWarning('drawio');
        return;
    }

    // Prompt for diagram name
    const name = await vscode.window.showInputBox({
        prompt: 'Enter diagram name',
        placeHolder: 'architecture-diagram',
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Diagram name cannot be empty';
            }
            if (!/^[a-zA-Z0-9-_ ]+$/.test(value)) {
                return 'Diagram name can only contain letters, numbers, spaces, hyphens, and underscores';
            }
            return null;
        }
    });

    if (!name) {
        return; // User cancelled
    }

    try {
        // Create the diagram file
        const filePath = await diagramService.createDrawioDiagram(name);
        const diagramFile = await diagramService.getDiagramInfo(filePath);

        if (!diagramFile) {
            throw new Error('Failed to get diagram info');
        }

        // Copy embed syntax to clipboard
        await diagramService.copyEmbedSyntaxToClipboard(diagramFile);

        // Open the diagram
        await diagramService.openDiagram(diagramFile);

        // Refresh tree view
        diagramsTreeProvider.refresh();

        // Show success message
        vscode.window.showInformationMessage(
            `✨ Created Draw.io diagram: ${diagramFile.name}\n📋 Embed syntax copied to clipboard!`,
            'Insert in Note'
        ).then(selection => {
            if (selection === 'Insert in Note') {
                vscode.commands.executeCommand('noted.insertDiagram');
            }
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to create Draw.io diagram: ${errorMessage}`);
    }
}

/**
 * Create a new Excalidraw diagram
 */
async function createExcalidrawDiagram(
    diagramService: DiagramService,
    diagramsTreeProvider: DiagramsTreeProvider
): Promise<void> {
    // Check if Excalidraw extension is installed
    if (!diagramService.isExcalidrawExtensionInstalled()) {
        diagramService.showExtensionWarning('excalidraw');
        return;
    }

    // Prompt for diagram name
    const name = await vscode.window.showInputBox({
        prompt: 'Enter diagram name',
        placeHolder: 'wireframe-sketch',
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Diagram name cannot be empty';
            }
            if (!/^[a-zA-Z0-9-_ ]+$/.test(value)) {
                return 'Diagram name can only contain letters, numbers, spaces, hyphens, and underscores';
            }
            return null;
        }
    });

    if (!name) {
        return; // User cancelled
    }

    try {
        // Create the diagram file
        const filePath = await diagramService.createExcalidrawDiagram(name);
        const diagramFile = await diagramService.getDiagramInfo(filePath);

        if (!diagramFile) {
            throw new Error('Failed to get diagram info');
        }

        // Copy embed syntax to clipboard
        await diagramService.copyEmbedSyntaxToClipboard(diagramFile);

        // Open the diagram
        await diagramService.openDiagram(diagramFile);

        // Refresh tree view
        diagramsTreeProvider.refresh();

        // Show success message
        vscode.window.showInformationMessage(
            `✨ Created Excalidraw diagram: ${diagramFile.name}\n📋 Embed syntax copied to clipboard!`,
            'Insert in Note'
        ).then(selection => {
            if (selection === 'Insert in Note') {
                vscode.commands.executeCommand('noted.insertDiagram');
            }
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to create Excalidraw diagram: ${errorMessage}`);
    }
}

/**
 * Insert diagram embed syntax at cursor
 */
async function insertDiagram(diagramService: DiagramService): Promise<void> {
    // Get all diagrams
    const allDiagrams = await diagramService.getAllDiagrams();

    if (allDiagrams.length === 0) {
        vscode.window.showInformationMessage(
            'No diagrams found. Create a diagram first!',
            'Create Draw.io',
            'Create Excalidraw'
        ).then(selection => {
            if (selection === 'Create Draw.io') {
                vscode.commands.executeCommand('noted.createDrawioDiagram');
            } else if (selection === 'Create Excalidraw') {
                vscode.commands.executeCommand('noted.createExcalidrawDiagram');
            }
        });
        return;
    }

    // Create quick pick items
    const quickPickItems = allDiagrams.map(diagram => {
        const typeIcon = diagram.type === 'drawio' ? '📐' : '🎨';
        const formatLabel = diagram.isExported ? '(exported)' : '(editable)';

        return {
            label: `${typeIcon} ${diagram.name}`,
            description: formatLabel,
            detail: `${diagram.type.toUpperCase()} • Click to insert embed syntax`,
            diagram
        };
    });

    // Show quick pick
    const selection = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: 'Select a diagram to insert',
        matchOnDescription: true,
        matchOnDetail: true
    });

    if (!selection) {
        return; // User cancelled
    }

    // Get active editor
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor. Open a note first.');
        return;
    }

    // Insert embed syntax at cursor
    const embedSyntax = diagramService.getSimpleEmbedSyntax(selection.diagram);
    await editor.edit(editBuilder => {
        editBuilder.insert(editor.selection.active, embedSyntax);
    });

    vscode.window.showInformationMessage(`Inserted: ${embedSyntax}`);
}

/**
 * Open diagram in its editor
 */
async function openDiagram(
    diagramService: DiagramService,
    diagramFile?: DiagramFile
): Promise<void> {
    if (!diagramFile) {
        // If no diagram file provided, show picker
        const allDiagrams = await diagramService.getAllDiagrams();

        if (allDiagrams.length === 0) {
            vscode.window.showInformationMessage('No diagrams found.');
            return;
        }

        const quickPickItems = allDiagrams.map(diagram => ({
            label: diagram.name,
            description: diagram.type === 'drawio' ? 'Draw.io' : 'Excalidraw',
            diagram
        }));

        const selection = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: 'Select a diagram to open'
        });

        if (!selection) {
            return;
        }

        diagramFile = selection.diagram;
    }

    // Check if required extension is installed
    if (diagramFile.type === 'drawio' && !diagramService.isDrawioExtensionInstalled()) {
        diagramService.showExtensionWarning('drawio');
        return;
    }

    if (diagramFile.type === 'excalidraw' && !diagramService.isExcalidrawExtensionInstalled()) {
        diagramService.showExtensionWarning('excalidraw');
        return;
    }

    // Open the diagram
    await diagramService.openDiagram(diagramFile);
}
