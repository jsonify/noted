/**
 * Category Service
 * Handles category-based note organization and routing
 */

import * as path from 'path';
import * as vscode from 'vscode';
import { DEFAULT_CATEGORIES, CategoryConfig } from '../constants';
import { getNotesPath, getFileFormat } from './configService';
import { pathExists, createDirectory, writeFile } from './fileSystemService';
import { generateTemplate } from './templateService';
import { getYear, getMonth, getFolderName, getDay, getTimeForFilename } from '../utils/dateHelpers';

/**
 * Get category for a given template type
 * Returns the category name if template is mapped, undefined otherwise
 */
export function getCategoryForTemplate(templateType: string): string | undefined {
    for (const [categoryName, config] of Object.entries(DEFAULT_CATEGORIES)) {
        if (config.templates.includes(templateType)) {
            return categoryName;
        }
    }
    return undefined;
}

/**
 * Get category configuration by name
 */
export function getCategoryConfig(categoryName: string): CategoryConfig | undefined {
    return DEFAULT_CATEGORIES[categoryName];
}

/**
 * Get all categories
 */
export function getAllCategories(): Record<string, CategoryConfig> {
    return DEFAULT_CATEGORIES;
}

/**
 * Check if a template type should use date-based organization
 * Currently only daily notes (no template type) use date-based folders
 */
export function shouldUseDateBasedOrganization(templateType?: string): boolean {
    // No template type means daily note
    if (!templateType) {
        return true;
    }

    // Custom templates default to non-date-based unless specified
    const category = getCategoryForTemplate(templateType);
    return category === 'Daily';
}

/**
 * Get the folder path for a note based on its template type
 * @param templateType Template type (e.g., 'meeting', 'research')
 * @param noteName Optional custom note name
 * @returns Object with folderPath and suggested fileName
 */
export async function getCategoryFolderPath(
    templateType?: string,
    noteName?: string
): Promise<{ folderPath: string; fileName: string }> {
    const notesPath = getNotesPath();
    if (!notesPath) {
        throw new Error('Notes folder not configured');
    }

    const fileFormat = getFileFormat();
    const now = new Date();

    // Daily notes use date-based organization
    if (shouldUseDateBasedOrganization(templateType)) {
        const year = getYear(now);
        const month = getMonth(now);
        const folderName = getFolderName(now);
        const day = getDay(now);

        const folderPath = path.join(notesPath, 'Daily', year, folderName);
        const fileName = `${year}-${month}-${day}.${fileFormat}`;

        return { folderPath, fileName };
    }

    // Template-based notes use category folders
    const category = getCategoryForTemplate(templateType!);
    if (!category) {
        // Unknown template - use root level
        return {
            folderPath: notesPath,
            fileName: noteName ? `${noteName}.${fileFormat}` : `note.${fileFormat}`
        };
    }

    const config = getCategoryConfig(category);
    if (!config) {
        throw new Error(`Category configuration not found: ${category}`);
    }

    const folderPath = path.join(notesPath, config.folder);

    // Generate filename - either user-provided or timestamp-based
    let fileName: string;
    if (noteName) {
        // Sanitize the note name
        const sanitizedName = noteName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-_]/g, '');
        fileName = `${sanitizedName}.${fileFormat}`;
    } else {
        // Use timestamp for unique filename
        const year = getYear(now);
        const month = getMonth(now);
        const day = getDay(now);
        const time = getTimeForFilename(now);
        fileName = `${year}-${month}-${day}-${time}.${fileFormat}`;
    }

    return { folderPath, fileName };
}

/**
 * Create a note in the appropriate category folder
 * @param templateType Template type for the note
 * @param noteName User-provided note name
 * @returns Path to the created note
 */
export async function createCategoryNote(
    templateType: string,
    noteName?: string
): Promise<string> {
    const notesPath = getNotesPath();
    if (!notesPath) {
        throw new Error('Notes folder not configured');
    }

    // Get the appropriate folder and filename
    const { folderPath, fileName } = await getCategoryFolderPath(templateType, noteName);

    // Create folder if it doesn't exist
    if (!(await pathExists(folderPath))) {
        await createDirectory(folderPath);
    }

    const filePath = path.join(folderPath, fileName);

    // Check if file already exists
    if (await pathExists(filePath)) {
        throw new Error('A note with this name already exists');
    }

    // Generate content from template
    const now = new Date();
    const content = await generateTemplate(templateType, now, fileName);
    await writeFile(filePath, content);

    return filePath;
}

/**
 * Ensure category folders exist
 * Creates all default category folders if they don't exist
 */
export async function ensureCategoryFolders(): Promise<void> {
    const notesPath = getNotesPath();
    if (!notesPath) {
        return;
    }

    for (const [_, config] of Object.entries(DEFAULT_CATEGORIES)) {
        const folderPath = path.join(notesPath, config.folder);
        if (!(await pathExists(folderPath))) {
            await createDirectory(folderPath);
        }
    }
}

/**
 * Get category name from folder path
 * Returns category name if path is a category folder, undefined otherwise
 */
export function getCategoryFromPath(folderPath: string): string | undefined {
    const notesPath = getNotesPath();
    if (!notesPath) {
        return undefined;
    }

    const relativePath = path.relative(notesPath, folderPath);
    const topLevelFolder = relativePath.split(path.sep)[0];

    for (const [categoryName, config] of Object.entries(DEFAULT_CATEGORIES)) {
        if (config.folder === topLevelFolder) {
            return categoryName;
        }
    }

    return undefined;
}
