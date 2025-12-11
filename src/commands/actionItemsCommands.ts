/**
 * Action Items extraction command handlers
 * All commands are designed to be registered in extension.ts
 */

import * as vscode from 'vscode';
import { ActionItemsService, ActionItemFormat } from '../services/actionItemsService';

/**
 * Class-based command handlers for Action Items extraction
 */
export class ActionItemsCommands {
    constructor(
        private actionItemsService: ActionItemsService
    ) {}

    /**
     * Handle extracting action items from selection with checkboxes format
     */
    public async handleExtractActionItemsCheckboxes(): Promise<void> {
        await this.extractActionItemsFromSelection('checkboxes');
    }

    /**
     * Handle extracting action items from selection with bullets format
     */
    public async handleExtractActionItemsBullets(): Promise<void> {
        await this.extractActionItemsFromSelection('bullets');
    }

    /**
     * Common implementation for extracting action items from selection
     */
    private async extractActionItemsFromSelection(format: ActionItemFormat): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No editor is currently open');
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showErrorMessage('No text is selected. Please select some text to extract action items from.');
            return;
        }

        const selectedText = editor.document.getText(selection);
        if (!selectedText.trim()) {
            vscode.window.showErrorMessage('Selected text is empty or contains only whitespace');
            return;
        }

        try {
            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'Extracting action items...',
                    cancellable: true
                },
                async (progress, token) => {
                    if (token.isCancellationRequested) {
                        return;
                    }

                    const actionItems = await this.actionItemsService.extractActionItems(
                        selectedText,
                        format,
                        token
                    );

                    if (token.isCancellationRequested) {
                        return;
                    }

                    // Check if no action items were found
                    if (actionItems === ActionItemsService.NO_ACTION_ITEMS_MESSAGE) {
                        vscode.window.showInformationMessage('No action items were identified in the selected text');
                        return;
                    }

                    // Insert action items at the end of the line containing the selection's end point
                    const endLine = editor.document.lineAt(selection.end.line);
                    const insertPosition = endLine.range.end;

                    // Format the action items with header (extra blank line before header)
                    const actionItemsText = `\n\n## Action Items\n\n${actionItems}\n`;

                    await editor.edit(editBuilder => {
                        editBuilder.insert(insertPosition, actionItemsText);
                    });

                    vscode.window.showInformationMessage('Action items inserted below selection');
                }
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to extract action items: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
