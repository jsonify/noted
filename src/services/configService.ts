import * as vscode from 'vscode';
import * as path from 'path';
import { DEFAULTS } from '../constants';

/**
 * Get the resolved notes folder path
 * Returns absolute path or null if not configured
 */
export function getNotesPath(): string | null {
    const config = vscode.workspace.getConfiguration('noted');
    const notesFolder = config.get<string>('notesFolder', DEFAULTS.NOTES_FOLDER);

    console.log('[NOTED DEBUG] getNotesPath() called:');
    console.log('[NOTED DEBUG] - notesFolder config:', notesFolder);
    console.log('[NOTED DEBUG] - is absolute:', path.isAbsolute(notesFolder));

    // If absolute path, use it directly (this is the preferred approach for global configuration)
    if (path.isAbsolute(notesFolder)) {
        console.log('[NOTED DEBUG] - returning absolute path:', notesFolder);
        return notesFolder;
    }

    // For relative paths, try to resolve against workspace first, then fall back to current folder
    const workspaceFolders = vscode.workspace.workspaceFolders;
    console.log('[NOTED DEBUG] - workspaceFolders exist:', !!workspaceFolders);

    if (workspaceFolders) {
        const rootPath = workspaceFolders[0].uri.fsPath;
        const resolvedPath = path.join(rootPath, notesFolder);
        console.log('[NOTED DEBUG] - returning workspace-relative path:', resolvedPath);
        return resolvedPath;
    }

    // No workspace and relative path - this means user hasn't configured a default location yet
    console.log('[NOTED DEBUG] - no workspace and relative path, returning null');
    return null;
}

/**
 * Get the templates folder path
 * Returns path or null if notes folder not configured
 */
export function getTemplatesPath(): string | null {
    const notesPath = getNotesPath();
    if (!notesPath) {
        return null;
    }
    return path.join(notesPath, '.noted-templates');
}

/**
 * Get the configured file format
 */
export function getFileFormat(): string {
    const config = vscode.workspace.getConfiguration('noted');
    return config.get<string>('fileFormat', DEFAULTS.FILE_FORMAT);
}
