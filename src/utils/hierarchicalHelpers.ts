/**
 * Utility functions for hierarchical note naming and organization
 * Supports dot-delimited hierarchies like: project.design.frontend.md
 */

import * as path from 'path';
import { SUPPORTED_EXTENSIONS } from '../constants';

/**
 * Regular expression for validating hierarchy segments
 * - Must start with letter or number
 * - Can contain lowercase letters, numbers, hyphens, underscores
 * - No consecutive hyphens or underscores
 */
const SEGMENT_PATTERN = /^[a-z0-9]([a-z0-9_-]*[a-z0-9])?$/;

/**
 * Regular expression for validating full hierarchical names (without extension)
 * - One or more segments separated by dots
 * - Each segment follows SEGMENT_PATTERN rules
 */
const HIERARCHICAL_NAME_PATTERN = /^[a-z0-9]([a-z0-9_-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9_-]*[a-z0-9])?)*$/;

/**
 * Check if a filename uses hierarchical naming (contains dots before extension)
 * @param filename The filename to check (with or without extension)
 * @returns true if the filename uses hierarchical naming
 */
export function isHierarchicalNote(filename: string): boolean {
    // Remove extension if present
    const nameWithoutExt = removeExtension(filename);

    // Must have at least one dot to be hierarchical
    if (!nameWithoutExt.includes('.')) {
        return false;
    }

    // Must match the hierarchical naming pattern
    return HIERARCHICAL_NAME_PATTERN.test(nameWithoutExt);
}

/**
 * Parse a hierarchical note name into segments
 * @param filename The filename (with or without extension)
 * @returns Array of hierarchy segments, or null if not hierarchical
 * @example
 * parseHierarchicalPath('project.design.frontend.md') → ['project', 'design', 'frontend']
 * parseHierarchicalPath('note.md') → null (not hierarchical, only one segment)
 */
export function parseHierarchicalPath(filename: string): string[] | null {
    if (!isHierarchicalNote(filename)) {
        return null;
    }

    const nameWithoutExt = removeExtension(filename);
    return nameWithoutExt.split('.');
}

/**
 * Validate a hierarchical note name
 * @param name The note name (without extension)
 * @param options Validation options
 * @returns Validation result with success flag and error message
 */
export function validateHierarchicalName(
    name: string,
    options: { maxDepth?: number; strict?: boolean } = {}
): { valid: boolean; error?: string } {
    const { maxDepth = 10, strict = true } = options;

    // Check for empty name
    if (!name || name.trim().length === 0) {
        return { valid: false, error: 'Note name cannot be empty' };
    }

    // Check for leading/trailing dots
    if (name.startsWith('.') || name.endsWith('.')) {
        return { valid: false, error: 'Note name cannot start or end with a dot' };
    }

    // Check for consecutive dots
    if (name.includes('..')) {
        return { valid: false, error: 'Note name cannot contain consecutive dots' };
    }

    // Split into segments
    const segments = name.split('.');

    // Check max depth
    if (maxDepth > 0 && segments.length > maxDepth) {
        return { valid: false, error: `Hierarchy depth exceeds maximum of ${maxDepth} levels` };
    }

    // Validate each segment
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];

        // Check for empty segments
        if (segment.length === 0) {
            return { valid: false, error: `Segment ${i + 1} is empty` };
        }

        // Check segment format
        if (!SEGMENT_PATTERN.test(segment)) {
            if (strict) {
                return {
                    valid: false,
                    error: `Segment '${segment}' contains invalid characters. Use only lowercase letters, numbers, hyphens, and underscores.`
                };
            } else {
                // In relaxed mode, just warn about uppercase
                if (/[A-Z]/.test(segment)) {
                    return {
                        valid: false,
                        error: `Segment '${segment}' contains uppercase letters. Hierarchical names must be lowercase.`
                    };
                }
            }
        }

        // Check for reserved names
        const reservedNames = ['con', 'prn', 'aux', 'nul', 'com1', 'com2', 'lpt1', 'lpt2'];
        if (reservedNames.includes(segment.toLowerCase())) {
            return { valid: false, error: `Segment '${segment}' is a reserved system name` };
        }
    }

    return { valid: true };
}

/**
 * Remove file extension from a filename
 * @param filename The filename
 * @returns The filename without extension
 */
export function removeExtension(filename: string): string {
    const ext = path.extname(filename);
    if (ext && SUPPORTED_EXTENSIONS.includes(ext)) {
        return filename.slice(0, -ext.length);
    }
    return filename;
}

/**
 * Get the parent hierarchy path from a hierarchical note name
 * @param filename The hierarchical note filename
 * @returns The parent path, or null if at root level
 * @example
 * getParentPath('project.design.frontend.md') → 'project.design'
 * getParentPath('project.md') → null
 */
export function getParentPath(filename: string): string | null {
    const segments = parseHierarchicalPath(filename);
    if (!segments || segments.length <= 1) {
        return null;
    }

    return segments.slice(0, -1).join('.');
}

/**
 * Get the note name (last segment) from a hierarchical path
 * @param filename The hierarchical note filename
 * @returns The note name (last segment)
 * @example
 * getNoteName('project.design.frontend.md') → 'frontend'
 * getNoteName('readme.md') → 'readme'
 */
export function getNoteName(filename: string): string {
    const segments = parseHierarchicalPath(filename);
    if (segments && segments.length > 0) {
        return segments[segments.length - 1];
    }

    // Fallback for non-hierarchical notes
    return removeExtension(filename);
}

/**
 * Build a hierarchical file name from segments and extension
 * @param segments The hierarchy segments
 * @param extension The file extension (with or without leading dot)
 * @returns The complete filename
 * @example
 * buildHierarchicalFileName(['project', 'design', 'frontend'], 'md') → 'project.design.frontend.md'
 */
export function buildHierarchicalFileName(segments: string[], extension: string): string {
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    return `${segments.join('.')}${ext}`;
}

/**
 * Get all ancestor paths for a hierarchical note
 * @param filename The hierarchical note filename
 * @returns Array of ancestor paths from root to parent
 * @example
 * getAncestorPaths('project.design.frontend.md') → ['project', 'project.design']
 */
export function getAncestorPaths(filename: string): string[] {
    const segments = parseHierarchicalPath(filename);
    if (!segments || segments.length <= 1) {
        return [];
    }

    const ancestors: string[] = [];
    for (let i = 1; i < segments.length; i++) {
        ancestors.push(segments.slice(0, i).join('.'));
    }

    return ancestors;
}

/**
 * Check if one hierarchical path is a descendant of another
 * @param childPath The potential child path
 * @param parentPath The potential parent path
 * @returns true if childPath is a descendant of parentPath
 * @example
 * isDescendantOf('project.design.frontend', 'project') → true
 * isDescendantOf('project.design.frontend', 'project.design') → true
 * isDescendantOf('work.meeting', 'project') → false
 */
export function isDescendantOf(childPath: string, parentPath: string): boolean {
    const childSegments = parseHierarchicalPath(childPath);
    const parentSegments = parseHierarchicalPath(parentPath + '.md'); // Add dummy extension

    if (!childSegments || !parentSegments) {
        return false;
    }

    if (childSegments.length <= parentSegments.length) {
        return false;
    }

    for (let i = 0; i < parentSegments.length; i++) {
        if (childSegments[i] !== parentSegments[i]) {
            return false;
        }
    }

    return true;
}

/**
 * Get the depth of a hierarchical note
 * @param filename The hierarchical note filename
 * @returns The depth (number of segments), or 0 if not hierarchical
 * @example
 * getHierarchyDepth('project.design.frontend.md') → 3
 * getHierarchyDepth('readme.md') → 0
 */
export function getHierarchyDepth(filename: string): number {
    const segments = parseHierarchicalPath(filename);
    return segments ? segments.length : 0;
}

/**
 * Normalize a hierarchical name (lowercase, trim, validate)
 * @param name The raw note name
 * @returns Normalized name, or null if invalid
 */
export function normalizeHierarchicalName(name: string): string | null {
    // Trim and lowercase
    let normalized = name.trim().toLowerCase();

    // Replace spaces with dots (user convenience)
    normalized = normalized.replace(/\s+/g, '.');

    // Remove multiple consecutive dots
    normalized = normalized.replace(/\.{2,}/g, '.');

    // Remove leading/trailing dots
    normalized = normalized.replace(/^\.+|\.+$/g, '');

    // Validate
    const validation = validateHierarchicalName(normalized);
    if (!validation.valid) {
        return null;
    }

    return normalized;
}

/**
 * Hierarchy node for building tree structures
 */
export interface HierarchyNode {
    /** The segment name (e.g., 'project', 'design') */
    segment: string;

    /** Full path to this node (e.g., 'project.design') */
    path: string;

    /** Child hierarchy nodes */
    children: Map<string, HierarchyNode>;

    /** Note files at this level */
    notes: Array<{ name: string; fullPath: string }>;
}

/**
 * Build a hierarchy tree from a list of hierarchical note filenames
 * @param filenames Array of hierarchical note filenames (with extensions)
 * @returns Root hierarchy node
 */
export function buildHierarchyTree(filenames: string[]): HierarchyNode {
    const root: HierarchyNode = {
        segment: '',
        path: '',
        children: new Map(),
        notes: []
    };

    for (const filename of filenames) {
        const segments = parseHierarchicalPath(filename);
        if (!segments) {
            // Not a hierarchical note, add to root
            root.notes.push({
                name: removeExtension(filename),
                fullPath: filename
            });
            continue;
        }

        // Build path incrementally
        let currentNode = root;
        let currentPath = '';

        for (let i = 0; i < segments.length - 1; i++) {
            const segment = segments[i];
            currentPath = currentPath ? `${currentPath}.${segment}` : segment;

            if (!currentNode.children.has(segment)) {
                currentNode.children.set(segment, {
                    segment,
                    path: currentPath,
                    children: new Map(),
                    notes: []
                });
            }

            currentNode = currentNode.children.get(segment)!;
        }

        // Last segment is the note file
        const noteName = segments[segments.length - 1];
        currentNode.notes.push({
            name: noteName,
            fullPath: filename
        });
    }

    return root;
}

/**
 * Get all hierarchical notes that match a hierarchy path prefix
 * @param filenames Array of all note filenames
 * @param pathPrefix The hierarchy path prefix (e.g., 'project.design')
 * @returns Array of matching filenames
 * @example
 * getNotesInHierarchy(files, 'project.design') → ['project.design.frontend.md', 'project.design.backend.md']
 */
export function getNotesInHierarchy(filenames: string[], pathPrefix: string): string[] {
    return filenames.filter(filename => {
        const nameWithoutExt = removeExtension(filename);
        return nameWithoutExt === pathPrefix || nameWithoutExt.startsWith(pathPrefix + '.');
    });
}
