/**
 * Commands for the Connections panel
 */

import * as vscode from 'vscode';
import { ConnectionItem } from '../providers/treeItems';
import { LinkService } from '../services/linkService';

export async function handleRefreshConnections(
    linkService: LinkService,
    updateConnectionsPanel: (editor: vscode.TextEditor | undefined) => Promise<void>
) {
    // Rebuild backlinks index
    await linkService.buildBacklinksIndex();
    // Refresh the connections panel
    await updateConnectionsPanel(vscode.window.activeTextEditor);
    vscode.window.showInformationMessage('Connections refreshed');
}

export async function handleOpenConnection(connectionItem: ConnectionItem) {
    try {
        const document = await vscode.workspace.openTextDocument(connectionItem.targetPath);
        await vscode.window.showTextDocument(document);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open note: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function handleOpenConnectionSource(connectionItem: ConnectionItem) {
    try {
        const document = await vscode.workspace.openTextDocument(connectionItem.sourcePath);
        const editor = await vscode.window.showTextDocument(document);

        // Navigate to the line where the connection appears
        const line = connectionItem.lineNumber;
        const position = new vscode.Position(line, 0);
        const range = new vscode.Range(position, position);

        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open source: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function handleRefreshOrphans(orphansProvider: any) {
    orphansProvider.refresh();
    vscode.window.showInformationMessage('Orphans panel refreshed');
}

export async function handleRefreshPlaceholders(placeholdersProvider: any) {
    placeholdersProvider.refresh();
    vscode.window.showInformationMessage('Placeholders panel refreshed');
}
