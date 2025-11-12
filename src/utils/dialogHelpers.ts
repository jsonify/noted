/**
 * Dialog helper utilities for modal confirmations
 * Provides consistent modal dialog patterns across the extension
 */

import * as vscode from 'vscode';

/**
 * Button configuration for modal dialogs
 */
export interface ModalButton {
    /** Button label shown to user */
    title: string;
    /** Whether this button closes the dialog (ESC key) */
    isCloseAffordance?: boolean;
}

/**
 * Options for modal dialogs
 */
export interface ModalOptions {
    /** Additional detail text shown below the message */
    detail?: string;
}

/**
 * Show a modal warning message with button objects
 * @param message The warning message to display
 * @param options Optional detail text and other options
 * @param buttons Button configurations (at least 2 required)
 * @returns The selected button, or undefined if dismissed
 *
 * @example
 * const answer = await showModalWarning(
 *   'Delete this file?',
 *   { detail: 'This action cannot be undone.' },
 *   { title: 'Delete', isCloseAffordance: false },
 *   { title: 'Cancel', isCloseAffordance: true }
 * );
 * if (answer?.title === 'Delete') {
 *   // Perform deletion
 * }
 */
export async function showModalWarning(
    message: string,
    options: ModalOptions,
    ...buttons: ModalButton[]
): Promise<ModalButton | undefined> {
    return vscode.window.showWarningMessage(
        message,
        { modal: true, ...options },
        ...buttons
    );
}

/**
 * Show a modal information message with button objects
 * @param message The information message to display
 * @param options Optional detail text and other options
 * @param buttons Button configurations (at least 2 required)
 * @returns The selected button, or undefined if dismissed
 *
 * @example
 * const answer = await showModalInfo(
 *   'Move 5 notes to archive?',
 *   { detail: 'Notes to move: note1.txt, note2.txt...' },
 *   { title: 'Move', isCloseAffordance: false },
 *   { title: 'Cancel', isCloseAffordance: true }
 * );
 */
export async function showModalInfo(
    message: string,
    options: ModalOptions,
    ...buttons: ModalButton[]
): Promise<ModalButton | undefined> {
    return vscode.window.showInformationMessage(
        message,
        { modal: true, ...options },
        ...buttons
    );
}

/**
 * Standard button configurations for common scenarios
 */
export const StandardButtons = {
    /** Delete button (destructive action) */
    Delete: { title: 'Delete', isCloseAffordance: false } as ModalButton,

    /** Archive button (non-destructive move) */
    Archive: { title: 'Archive', isCloseAffordance: false } as ModalButton,

    /** Move button (non-destructive move) */
    Move: { title: 'Move', isCloseAffordance: false } as ModalButton,

    /** Merge button (combining items) */
    Merge: { title: 'Merge', isCloseAffordance: false } as ModalButton,

    /** Yes button (confirmation) */
    Yes: { title: 'Yes', isCloseAffordance: false } as ModalButton,

    /** No button (cancellation) */
    No: { title: 'No', isCloseAffordance: true } as ModalButton,

    /** Cancel button (cancellation) */
    Cancel: { title: 'Cancel', isCloseAffordance: true } as ModalButton,

    /** Continue button (proceed) */
    Continue: { title: 'Continue', isCloseAffordance: false } as ModalButton,

    /** Install Extension button (for diagram service) */
    InstallExtension: { title: 'Install Extension', isCloseAffordance: false } as ModalButton,

    /** Create Anyway button (for diagram service) */
    CreateAnyway: { title: 'Create Anyway', isCloseAffordance: false } as ModalButton,

    /** Don't Ask Again button (for diagram service) */
    DontAskAgain: { title: "Don't Ask Again", isCloseAffordance: false } as ModalButton,

    /** Dismiss button (close without action) */
    Dismiss: { title: 'Dismiss', isCloseAffordance: true } as ModalButton,
};

/**
 * Standard detail messages for common scenarios
 */
export const StandardDetails = {
    /** Detail for delete operations */
    CannotUndo: 'This action cannot be undone.',

    /** Detail for delete folder operations */
    DeleteFolderWarning: 'This action cannot be undone. All notes in this folder will be permanently deleted.',

    /** Detail for archive operations */
    WillBeArchived: 'The note will be moved to the archive folder.',

    /** Detail for bulk archive operations */
    WillBeMovedToArchive: 'These notes will be moved to the archive folder.',

    /** Detail for tag merge operations */
    TagMergeWarning: 'All instances of both tags will be merged into one.',

    /** Detail for extension warnings */
    ExtensionRequired: 'The extension is required for creating and editing diagrams.',
};
