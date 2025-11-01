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

/**
 * Count the number of notes for a specific date (for heatmap visualization)
 */
export async function countNotesForDate(notesPath: string, year: number, month: number, day: number): Promise<number> {
    const notes = await getNotesForDate(notesPath, year, month, day);
    return notes.length;
}

/**
 * Get total count of all notes in the workspace
 */
export async function getTotalNotesCount(notesPath: string): Promise<number> {
    if (!(await pathExists(notesPath))) {
        return 0;
    }

    let totalCount = 0;

    try {
        // Get all year folders
        const yearEntries = await readDirectoryWithTypes(notesPath);

        for (const yearEntry of yearEntries) {
            if (yearEntry.isDirectory() && /^\d{4}$/.test(yearEntry.name)) {
                const yearPath = path.join(notesPath, yearEntry.name);
                const monthEntries = await readDirectoryWithTypes(yearPath);

                for (const monthEntry of monthEntries) {
                    if (monthEntry.isDirectory()) {
                        const monthPath = path.join(yearPath, monthEntry.name);
                        const noteFiles = await readDirectoryWithTypes(monthPath);

                        for (const file of noteFiles) {
                            if (!file.isDirectory() && SUPPORTED_EXTENSIONS.some(ext => file.name.endsWith(ext))) {
                                totalCount++;
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('[NOTED] Error counting total notes:', error);
    }

    return totalCount;
}

/**
 * Get statistics for the current month, week, and today
 */
export async function getMonthlyStats(notesPath: string): Promise<{month: number, week: number, today: number}> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    let monthCount = 0;
    let weekCount = 0;
    let todayCount = 0;

    // Get start of week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    try {
        // Count notes in current month folder
        const monthStr = (currentMonth + 1).toString().padStart(2, '0');
        const monthName = new Date(currentYear, currentMonth).toLocaleString('en-US', { month: 'long' });
        const folderName = `${monthStr}-${monthName}`;
        const monthPath = path.join(notesPath, currentYear.toString(), folderName);

        if (await pathExists(monthPath)) {
            const noteFiles = await readDirectoryWithTypes(monthPath);

            for (const file of noteFiles) {
                if (!file.isDirectory() && SUPPORTED_EXTENSIONS.some(ext => file.name.endsWith(ext))) {
                    monthCount++;

                    // Check if file matches current date pattern for today
                    const dayStr = currentDay.toString().padStart(2, '0');
                    const todayPrefix = `${currentYear}-${monthStr}-${dayStr}`;
                    if (file.name.startsWith(todayPrefix)) {
                        todayCount++;
                    }

                    // Check if file is from this week
                    const dateMatch = file.name.match(/^(\d{4})-(\d{2})-(\d{2})/);
                    if (dateMatch) {
                        const fileDate = new Date(parseInt(dateMatch[1]), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[3]));
                        if (fileDate >= startOfWeek && fileDate <= now) {
                            weekCount++;
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('[NOTED] Error getting monthly stats:', error);
    }

    return { month: monthCount, week: weekCount, today: todayCount };
}

/**
 * Find the most active day (day with most notes)
 */
export async function getMostActiveDay(notesPath: string, year: number, month: number): Promise<{day: number, count: number} | null> {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    let maxDay = 0;
    let maxCount = 0;

    try {
        for (let day = 1; day <= daysInMonth; day++) {
            const count = await countNotesForDate(notesPath, year, month, day);
            if (count > maxCount) {
                maxCount = count;
                maxDay = day;
            }
        }
    } catch (error) {
        console.error('[NOTED] Error finding most active day:', error);
    }

    if (maxCount === 0) {
        return null;
    }

    return { day: maxDay, count: maxCount };
}

/**
 * Get recent activity for the last 7 days
 */
export async function getRecentActivity(notesPath: string): Promise<Array<{date: Date, count: number}>> {
    const activity: Array<{date: Date, count: number}> = [];
    const now = new Date();

    try {
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);

            const year = date.getFullYear();
            const month = date.getMonth();
            const day = date.getDate();

            const count = await countNotesForDate(notesPath, year, month, day);
            activity.push({ date: new Date(date), count });
        }
    } catch (error) {
        console.error('[NOTED] Error getting recent activity:', error);
    }

    return activity;
}

export { isTodayDate };
