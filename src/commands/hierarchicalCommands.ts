/**
 * Command handlers for hierarchical note operations
 */

import * as vscode from 'vscode';
import * as path from 'path';
import {
    createHierarchicalNote,
    openHierarchicalNote,
    getHierarchySuggestions
} from '../services/hierarchicalNoteService';
import { getNotesPath, getFileFormat } from '../services/configService';
import { normalizeHierarchicalName, validateHierarchicalName } from '../utils/hierarchicalHelpers';
import { generateTemplate } from '../services/templateService';

/**
 * Handle createHierarchicalNote command
 * Creates a new hierarchical note with dot-delimited path
 */
export async function handleCreateHierarchicalNote(): Promise<void> {
    try {
        // Get hierarchy path from user
        const hierarchyPath = await vscode.window.showInputBox({
            prompt: 'Enter hierarchical note path (e.g., project.design.frontend)',
            placeHolder: 'work.meetings.standup',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Hierarchy path cannot be empty';
                }

                const normalized = normalizeHierarchicalName(value);
                if (!normalized) {
                    return 'Invalid hierarchy path format';
                }

                const validation = validateHierarchicalName(normalized);
                if (!validation.valid) {
                    return validation.error;
                }

                return null;
            }
        });

        if (!hierarchyPath) {
            return;
        }

        // Ask if user wants to use a template
        const useTemplate = await vscode.window.showQuickPick(
            [
                { label: 'No Template', value: 'none', description: 'Create empty note' },
                { label: 'Quick Note', value: 'quick', description: 'Just a date header' },
                { label: 'Meeting Notes', value: 'meeting', description: 'Meeting agenda and action items' },
                { label: 'Research', value: 'research', description: 'Research topic with questions and findings' },
                { label: 'Problem-Solution', value: 'problem-solution', description: 'Problem solving template' }
            ],
            {
                placeHolder: 'Select a template (optional)',
                title: 'Choose Template'
            }
        );

        if (!useTemplate) {
            return;
        }

        // Generate template content if needed
        let content = '';
        if (useTemplate.value !== 'none') {
            const normalized = normalizeHierarchicalName(hierarchyPath);
            if (normalized) {
                content = await generateTemplate(useTemplate.value, new Date(), `${normalized}.${getFileFormat()}`);
            }
        }

        // Create the note
        const filePath = await createHierarchicalNote(hierarchyPath, content);
        if (!filePath) {
            return;
        }

        // Open the note
        const document = await vscode.workspace.openTextDocument(filePath);
        const editor = await vscode.window.showTextDocument(document);

        // Move cursor to end of document
        const lastLine = document.lineCount - 1;
        const lastCharacter = document.lineAt(lastLine).text.length;
        editor.selection = new vscode.Selection(lastLine, lastCharacter, lastLine, lastCharacter);

        vscode.window.showInformationMessage(`Created hierarchical note: ${path.basename(filePath)}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create hierarchical note: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handle openHierarchicalNote command
 * Opens an existing hierarchical note or creates it if it doesn't exist
 */
export async function handleOpenHierarchicalNote(): Promise<void> {
    try {
        // Get suggestions from existing notes
        const suggestions = await getHierarchySuggestions(undefined, 20);

        // Build quick pick items
        const items: vscode.QuickPickItem[] = suggestions.map(path => ({
            label: path,
            description: 'Existing hierarchy'
        }));

        // Add "Create New" option
        items.unshift({
            label: '$(add) Create New Hierarchical Note',
            description: 'Enter a new hierarchy path'
        });

        // Show quick pick
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select or create hierarchical note',
            title: 'Open Hierarchical Note'
        });

        if (!selected) {
            return;
        }

        // If "Create New" was selected, prompt for path
        let hierarchyPath: string;
        if (selected.label.startsWith('$(add)')) {
            const input = await vscode.window.showInputBox({
                prompt: 'Enter hierarchical note path (e.g., project.design.frontend)',
                placeHolder: 'work.meetings.standup',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Hierarchy path cannot be empty';
                    }

                    const normalized = normalizeHierarchicalName(value);
                    if (!normalized) {
                        return 'Invalid hierarchy path format';
                    }

                    const validation = validateHierarchicalName(normalized);
                    if (!validation.valid) {
                        return validation.error;
                    }

                    return null;
                }
            });

            if (!input) {
                return;
            }

            hierarchyPath = input;
        } else {
            hierarchyPath = selected.label;
        }

        // Open the note (create if missing)
        const success = await openHierarchicalNote(hierarchyPath, true);
        if (success) {
            vscode.window.showInformationMessage(`Opened hierarchical note: ${hierarchyPath}`);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open hierarchical note: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handle searchHierarchicalNotes command
 * Search for hierarchical notes by path prefix
 */
export async function handleSearchHierarchicalNotes(): Promise<void> {
    try {
        // Get all suggestions
        const suggestions = await getHierarchySuggestions(undefined, 100);

        if (suggestions.length === 0) {
            vscode.window.showInformationMessage('No hierarchical notes found. Create one with "Create Hierarchical Note" command.');
            return;
        }

        // Show quick pick with fuzzy search
        const selected = await vscode.window.showQuickPick(suggestions, {
            placeHolder: 'Search hierarchical notes',
            title: 'Find Hierarchical Note',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (!selected) {
            return;
        }

        // Open the selected hierarchy path
        await openHierarchicalNote(selected, false);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to search hierarchical notes: ${error instanceof Error ? error.message : String(error)}`);
    }
}
