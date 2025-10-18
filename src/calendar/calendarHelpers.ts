import * as vscode from 'vscode';
import * as path from 'path';
import { getNotesPath, getFileFormat } from '../services/configService';
import { pathExists, createDirectory, writeFile, readDirectoryWithTypes } from '../services/fileSystemService';
import { generateTemplate } from '../services/templateService';
import { isTodayDate } from '../utils/dateHelpers';
import { SUPPORTED_EXTENSIONS } from '../constants';

/**
 * Get all notes for a specific date
 */
export async function getNotesForDate(notesPath: string, year: number, month: number, day: number): Promise<Array<{name: string, path: string}>> {
    const monthStr = (month + 1).toString().padStart(2, '0');
    const monthName = new Date(year, month).toLocaleString('en-US', { month: 'long' });
    const dayStr = day.toString().padStart(2, '0');
    const folderName = `${monthStr}-${monthName}`;
    const datePrefix = `${year}-${monthStr}-${dayStr}`;

    const noteFolder = path.join(notesPath, year.toString(), folderName);

    if (!(await pathExists(noteFolder))) {
        return [];
    }

    const notes: Array<{name: string, path: string}> = [];

    try {
        const entries = await readDirectoryWithTypes(noteFolder);

        for (const entry of entries) {
            if (!entry.isDirectory() && SUPPORTED_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
                // Check if the file starts with the date prefix (YYYY-MM-DD)
                if (entry.name.startsWith(datePrefix)) {
                    notes.push({
                        name: entry.name,
                        path: path.join(noteFolder, entry.name)
                    });
                }
            }
        }
    } catch (error) {
        console.error('[NOTED] Error reading notes for date:', error);
        return [];
    }

    return notes.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Open or create a note for a specific date
 */
export async function openNoteForDate(year: number, month: number, day: number): Promise<void> {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Please configure a notes folder first');
        return;
    }

    try {
        const fileFormat = getFileFormat();

        // Format month and day with leading zeros
        const monthStr = (month + 1).toString().padStart(2, '0');
        const monthName = new Date(year, month).toLocaleString('en-US', { month: 'long' });
        const dayStr = day.toString().padStart(2, '0');
        const folderName = `${monthStr}-${monthName}`;
        const fileName = `${year}-${monthStr}-${dayStr}.${fileFormat}`;

        const noteFolder = path.join(notesPath, year.toString(), folderName);
        const filePath = path.join(noteFolder, fileName);

        // Create folder if it doesn't exist
        if (!(await pathExists(noteFolder))) {
            await createDirectory(noteFolder);
        }

        // Create note if it doesn't exist
        if (!(await pathExists(filePath))) {
            const noteDate = new Date(year, month, day);
            const content = await generateTemplate(undefined, noteDate);
            await writeFile(filePath, content);
        }

        // Open the note
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open note: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Check if a note exists for a specific date
 */
export async function checkNoteExists(notesPath: string, year: number, month: number, day: number, fileFormat: string): Promise<boolean> {
    const monthStr = (month + 1).toString().padStart(2, '0');
    const monthName = new Date(year, month).toLocaleString('en-US', { month: 'long' });
    const dayStr = day.toString().padStart(2, '0');
    const folderName = `${monthStr}-${monthName}`;

    // Check for both .txt and .md files, not just the current format
    const fileName1 = `${year}-${monthStr}-${dayStr}.txt`;
    const fileName2 = `${year}-${monthStr}-${dayStr}.md`;
    const filePath1 = path.join(notesPath, year.toString(), folderName, fileName1);
    const filePath2 = path.join(notesPath, year.toString(), folderName, fileName2);

    if (await pathExists(filePath1)) {
        return true;
    }

    if (await pathExists(filePath2)) {
        return true;
    }

    return false;
}

export { isTodayDate };
