/**
 * Undo/Redo command handlers for the Noted extension
 */

import * as vscode from 'vscode';
import { UndoService } from '../services/undoService';

/**
 * Handle undo command
 */
export async function handleUndo(
    undoService: UndoService,
    refreshCallback: () => void
): Promise<void> {
    const success = await undoService.undo();
    if (success) {
        // Refresh the tree view to show the changes
        refreshCallback();
    }
}

/**
 * Handle redo command
 */
export async function handleRedo(
    undoService: UndoService,
    refreshCallback: () => void
): Promise<void> {
    const success = await undoService.redo();
    if (success) {
        // Refresh the tree view to show the changes
        refreshCallback();
    }
}

/**
 * Handle show undo history command
 * Shows a quick pick with all available undo operations
 */
export async function handleShowUndoHistory(
    undoService: UndoService
): Promise<void> {
    const undoSize = undoService.getUndoStackSize();

    if (undoSize === 0) {
        vscode.window.showInformationMessage('No undo history available');
        return;
    }

    const message = `Undo history: ${undoSize} operation${undoSize !== 1 ? 's' : ''} available`;
    const nextUndo = undoService.getUndoDescription();

    if (nextUndo) {
        vscode.window.showInformationMessage(`${message}\nNext undo: ${nextUndo}`);
    } else {
        vscode.window.showInformationMessage(message);
    }
}

/**
 * Handle clear undo history command
 * Clears all undo/redo history after confirmation
 */
export async function handleClearUndoHistory(
    undoService: UndoService
): Promise<void> {
    const undoSize = undoService.getUndoStackSize();
    const redoSize = undoService.getRedoStackSize();

    if (undoSize === 0 && redoSize === 0) {
        vscode.window.showInformationMessage('Undo history is already empty');
        return;
    }

    const answer = await vscode.window.showWarningMessage(
        `Clear all undo/redo history? (${undoSize} undo, ${redoSize} redo operations)`,
        'Clear',
        'Cancel'
    );

    if (answer === 'Clear') {
        undoService.clear();
        vscode.window.showInformationMessage('Undo history cleared');
    }
}
