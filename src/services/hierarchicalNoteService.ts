/**
 * Service for managing hierarchical notes with dot-delimited naming
 * Handles creation, retrieval, and organization of hierarchical notes
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { SUPPORTED_EXTENSIONS } from '../constants';
import { getNotesPath, getFileFormat } from './configService';
import {
    pathExists,
    readDirectoryWithTypes,
    writeFile,
    getFileStats,
    readFile
} from './fileSystemService';
import {
    isHierarchicalNote,
    parseHierarchicalPath,
    validateHierarchicalName,
    buildHierarchicalFileName,
    buildHierarchyTree,
    normalizeHierarchicalName,
    getNotesInHierarchy,
    HierarchyNode
} from '../utils/hierarchicalHelpers';
import { isYearFolder } from '../utils/validators';
import { SPECIAL_FOLDERS } from '../constants';

/**
 * Get all hierarchical notes in the notes folder
 * @returns Array of hierarchical note file paths (relative to notes folder)
 */
export async function getHierarchicalNotes(): Promise<string[]> {
    const notesPath = getNotesPath();
    if (!notesPath || !(await pathExists(notesPath))) {
        return [];
    }

    try {
        const entries = await readDirectoryWithTypes(notesPath);
        const hierarchicalNotes: string[] = [];

        for (const entry of entries) {
            // Skip directories and special folders
            if (entry.isDirectory()) {
                continue;
            }

            // Check if it's a supported note file
            if (!SUPPORTED_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
                continue;
            }

            // Check if it uses hierarchical naming
            if (isHierarchicalNote(entry.name)) {
                hierarchicalNotes.push(entry.name);
            }
        }

        return hierarchicalNotes;
    } catch (error) {
        console.error('[NOTED] Error reading hierarchical notes:', error);
        return [];
    }
}

/**
 * Get all flat notes (non-hierarchical, non-date-based) in the root notes folder
 * @returns Array of flat note file paths (relative to notes folder)
 */
export async function getFlatNotes(): Promise<string[]> {
    const notesPath = getNotesPath();
    if (!notesPath || !(await pathExists(notesPath))) {
        return [];
    }

    try {
        const entries = await readDirectoryWithTypes(notesPath);
        const flatNotes: string[] = [];

        for (const entry of entries) {
            // Skip directories
            if (entry.isDirectory()) {
                continue;
            }

            // Check if it's a supported note file
            if (!SUPPORTED_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
                continue;
            }

            // Check if it's NOT hierarchical (just a simple filename)
            if (!isHierarchicalNote(entry.name)) {
                flatNotes.push(entry.name);
            }
        }

        return flatNotes;
    } catch (error) {
        console.error('[NOTED] Error reading flat notes:', error);
        return [];
    }
}

/**
 * Build hierarchy tree from all hierarchical notes
 * @returns Root hierarchy node
 */
export async function buildNotesHierarchy(): Promise<HierarchyNode> {
    const hierarchicalNotes = await getHierarchicalNotes();
    return buildHierarchyTree(hierarchicalNotes);
}

/**
 * Create a new hierarchical note
 * @param hierarchyPath The dot-delimited hierarchy path (e.g., 'project.design.frontend')
 * @param content Optional initial content for the note
 * @param extension Optional file extension (defaults to configured format)
 * @returns The full file path of the created note, or null if creation failed
 */
export async function createHierarchicalNote(
    hierarchyPath: string,
    content?: string,
    extension?: string
): Promise<string | null> {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Please open a workspace folder first');
        return null;
    }

    try {
        // Normalize the hierarchy path
        const normalizedPath = normalizeHierarchicalName(hierarchyPath);
        if (!normalizedPath) {
            vscode.window.showErrorMessage('Invalid hierarchy path format');
            return null;
        }

        // Validate the hierarchical name
        const validation = validateHierarchicalName(normalizedPath, {
            maxDepth: getMaxHierarchyDepth(),
            strict: true
        });

        if (!validation.valid) {
            vscode.window.showErrorMessage(`Invalid hierarchy path: ${validation.error}`);
            return null;
        }

        // Determine file extension
        const fileExt = extension || getFileFormat();
        const fileName = buildHierarchicalFileName(normalizedPath.split('.'), fileExt);
        const filePath = path.join(notesPath, fileName);

        // Check if file already exists
        if (await pathExists(filePath)) {
            vscode.window.showWarningMessage(`Note '${fileName}' already exists`);
            return filePath; // Return path to existing note
        }

        // Create the note file
        const noteContent = content || '';
        await writeFile(filePath, noteContent);

        return filePath;
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create hierarchical note: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

/**
 * Open an existing hierarchical note or create it if it doesn't exist
 * @param hierarchyPath The dot-delimited hierarchy path
 * @param createIfMissing Whether to create the note if it doesn't exist
 * @returns true if note was opened/created successfully
 */
export async function openHierarchicalNote(
    hierarchyPath: string,
    createIfMissing: boolean = true
): Promise<boolean> {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Please open a workspace folder first');
        return false;
    }

    try {
        // Normalize the hierarchy path
        const normalizedPath = normalizeHierarchicalName(hierarchyPath);
        if (!normalizedPath) {
            vscode.window.showErrorMessage('Invalid hierarchy path format');
            return false;
        }

        // Build file path
        const fileExt = getFileFormat();
        const fileName = buildHierarchicalFileName(normalizedPath.split('.'), fileExt);
        const filePath = path.join(notesPath, fileName);

        // Check if file exists
        if (!(await pathExists(filePath))) {
            if (!createIfMissing) {
                vscode.window.showWarningMessage(`Note '${fileName}' does not exist`);
                return false;
            }

            // Create the note
            const createdPath = await createHierarchicalNote(normalizedPath);
            if (!createdPath) {
                return false;
            }
        }

        // Open the note
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);

        return true;
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open hierarchical note: ${error instanceof Error ? error.message : String(error)}`);
        return false;
    }
}

/**
 * Get all notes within a specific hierarchy
 * @param hierarchyPrefix The hierarchy prefix (e.g., 'project.design')
 * @returns Array of note file paths
 */
export async function getNotesInHierarchyPrefix(hierarchyPrefix: string): Promise<string[]> {
    const allNotes = await getHierarchicalNotes();
    return getNotesInHierarchy(allNotes, hierarchyPrefix);
}

/**
 * Check if hierarchical notes feature is enabled
 * @returns true if hierarchical notes are enabled
 */
export function isHierarchicalNotesEnabled(): boolean {
    const config = vscode.workspace.getConfiguration('noted.hierarchy');
    return config.get<boolean>('enabled', true);
}

/**
 * Get maximum hierarchy depth from configuration
 * @returns Maximum depth (0 = unlimited)
 */
export function getMaxHierarchyDepth(): number {
    const config = vscode.workspace.getConfiguration('noted.hierarchy');
    return config.get<number>('maxDepth', 10);
}

/**
 * Get hierarchy separator from configuration
 * @returns Separator character ('.' or '/')
 */
export function getHierarchySeparator(): string {
    const config = vscode.workspace.getConfiguration('noted.hierarchy');
    return config.get<string>('separator', '.');
}

/**
 * Count total notes in a hierarchy node (including descendants)
 * @param node The hierarchy node
 * @returns Total count of notes
 */
export function countNotesInHierarchy(node: HierarchyNode): number {
    let count = node.notes.length;

    for (const child of node.children.values()) {
        count += countNotesInHierarchy(child);
    }

    return count;
}

/**
 * Find a hierarchy node by path
 * @param root The root hierarchy node
 * @param hierarchyPath The path to find (e.g., 'project.design')
 * @returns The hierarchy node, or null if not found
 */
export function findHierarchyNode(root: HierarchyNode, hierarchyPath: string): HierarchyNode | null {
    if (!hierarchyPath) {
        return root;
    }

    const segments = hierarchyPath.split('.');
    let currentNode = root;

    for (const segment of segments) {
        const childNode = currentNode.children.get(segment);
        if (!childNode) {
            return null;
        }
        currentNode = childNode;
    }

    return currentNode;
}

/**
 * Get suggested hierarchical note names based on existing notes
 * @param prefix Optional prefix to filter suggestions
 * @param limit Maximum number of suggestions
 * @returns Array of suggested hierarchy paths
 */
export async function getHierarchySuggestions(prefix?: string, limit: number = 10): Promise<string[]> {
    const notes = await getHierarchicalNotes();
    const suggestions = new Set<string>();

    for (const note of notes) {
        const segments = parseHierarchicalPath(note);
        if (!segments) continue;

        // Add all ancestor paths as suggestions
        for (let i = 1; i <= segments.length; i++) {
            const hierarchyPath = segments.slice(0, i).join('.');

            // Filter by prefix if provided
            if (prefix && !hierarchyPath.startsWith(prefix)) {
                continue;
            }

            suggestions.add(hierarchyPath);
        }
    }

    return Array.from(suggestions).sort().slice(0, limit);
}
