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

    // If absolute path, use it directly (this is the preferred approach for global configuration)
    if (path.isAbsolute(notesFolder)) {
        return notesFolder;
    }

    // For relative paths, try to resolve against workspace first, then fall back to current folder
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (workspaceFolders) {
        const rootPath = workspaceFolders[0].uri.fsPath;
        const resolvedPath = path.join(rootPath, notesFolder);
        return resolvedPath;
    }

    // No workspace and relative path - this means user hasn't configured a default location yet
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
