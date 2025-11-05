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

/**
 * Calculate the current streak (consecutive days with notes from today backwards)
 */
export async function getCurrentStreak(notesPath: string): Promise<number> {
    const now = new Date();
    let streak = 0;
    let checkDate = new Date(now);

    try {
        // Check each day backwards from today
        while (true) {
            const year = checkDate.getFullYear();
            const month = checkDate.getMonth();
            const day = checkDate.getDate();

            const count = await countNotesForDate(notesPath, year, month, day);

            if (count > 0) {
                streak++;
                // Move to previous day
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                // Streak broken
                break;
            }
        }
    } catch (error) {
        console.error('[NOTED] Error calculating current streak:', error);
    }

    return streak;
}

/**
 * Calculate the longest streak in history
 */
export async function getLongestStreak(notesPath: string): Promise<number> {
    if (!(await pathExists(notesPath))) {
        return 0;
    }

    let longestStreak = 0;
    let currentStreak = 0;
    const allDates: Date[] = [];

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
                                // Extract date from filename (YYYY-MM-DD)
                                const dateMatch = file.name.match(/^(\d{4})-(\d{2})-(\d{2})/);
                                if (dateMatch) {
                                    const date = new Date(parseInt(dateMatch[1]), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[3]));
                                    allDates.push(date);
                                }
                            }
                        }
                    }
                }
            }
        }

        // Sort dates
        allDates.sort((a, b) => a.getTime() - b.getTime());

        // Remove duplicates (same day, different notes)
        const uniqueDates = allDates.filter((date, index) => {
            if (index === 0) {return true;}
            const prev = allDates[index - 1];
            return date.toDateString() !== prev.toDateString();
        });

        // Calculate streaks
        if (uniqueDates.length > 0) {
            currentStreak = 1;
            longestStreak = 1;

            for (let i = 1; i < uniqueDates.length; i++) {
                const prevDate = uniqueDates[i - 1];
                const currDate = uniqueDates[i];

                // Calculate difference in days
                const diffTime = currDate.getTime() - prevDate.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    // Consecutive day
                    currentStreak++;
                    longestStreak = Math.max(longestStreak, currentStreak);
                } else {
                    // Streak broken
                    currentStreak = 1;
                }
            }
        }
    } catch (error) {
        console.error('[NOTED] Error calculating longest streak:', error);
    }

    return longestStreak;
}

/**
 * Get heatmap data for the last N days
 */
export async function getStreakHeatmap(notesPath: string, days: number = 30): Promise<Array<{date: Date, count: number, hasNote: boolean}>> {
    const heatmap: Array<{date: Date, count: number, hasNote: boolean}> = [];
    const now = new Date();

    try {
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);

            const year = date.getFullYear();
            const month = date.getMonth();
            const day = date.getDate();

            const count = await countNotesForDate(notesPath, year, month, day);
            heatmap.push({
                date: new Date(date),
                count,
                hasNote: count > 0
            });
        }
    } catch (error) {
        console.error('[NOTED] Error getting streak heatmap:', error);
    }

    return heatmap;
}

/**
 * Get monthly trend data for the last N months
 */
export async function getMonthlyTrend(notesPath: string, months: number = 6): Promise<Array<{month: string, year: number, monthNum: number, count: number}>> {
    const trend: Array<{month: string, year: number, monthNum: number, count: number}> = [];
    const now = new Date();

    try {
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const year = date.getFullYear();
            const monthNum = date.getMonth();
            const monthName = date.toLocaleString('en-US', { month: 'short' });

            const monthStr = (monthNum + 1).toString().padStart(2, '0');
            const fullMonthName = date.toLocaleString('en-US', { month: 'long' });
            const folderName = `${monthStr}-${fullMonthName}`;
            const monthPath = path.join(notesPath, year.toString(), folderName);

            let count = 0;
            if (await pathExists(monthPath)) {
                const noteFiles = await readDirectoryWithTypes(monthPath);
                for (const file of noteFiles) {
                    if (!file.isDirectory() && SUPPORTED_EXTENSIONS.some(ext => file.name.endsWith(ext))) {
                        count++;
                    }
                }
            }

            trend.push({ month: monthName, year, monthNum, count });
        }
    } catch (error) {
        console.error('[NOTED] Error getting monthly trend:', error);
    }

    return trend;
}

/**
 * Get day of week analysis - which days user writes most
 */
export async function getDayOfWeekAnalysis(notesPath: string): Promise<Array<{day: string, dayNum: number, count: number}>> {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];

    try {
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
                                const dateMatch = file.name.match(/^(\d{4})-(\d{2})-(\d{2})/);
                                if (dateMatch) {
                                    const date = new Date(parseInt(dateMatch[1]), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[3]));
                                    const dayOfWeek = date.getDay();
                                    dayCounts[dayOfWeek]++;
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('[NOTED] Error analyzing day of week:', error);
    }

    return dayNames.map((day, index) => ({
        day,
        dayNum: index,
        count: dayCounts[index]
    }));
}

/**
 * Get growth data - cumulative notes over time
 */
export async function getGrowthData(notesPath: string, months: number = 6): Promise<Array<{month: string, year: number, cumulative: number}>> {
    const growth: Array<{month: string, year: number, cumulative: number}> = [];
    let cumulative = 0;
    const now = new Date();

    try {
        // First, get total notes before the period
        const yearEntries = await readDirectoryWithTypes(notesPath);
        const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

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
                                const dateMatch = file.name.match(/^(\d{4})-(\d{2})-(\d{2})/);
                                if (dateMatch) {
                                    const date = new Date(parseInt(dateMatch[1]), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[3]));
                                    if (date < startDate) {
                                        cumulative++;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Now build growth data for each month
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const year = date.getFullYear();
            const monthNum = date.getMonth();
            const monthName = date.toLocaleString('en-US', { month: 'short' });

            const monthStr = (monthNum + 1).toString().padStart(2, '0');
            const fullMonthName = date.toLocaleString('en-US', { month: 'long' });
            const folderName = `${monthStr}-${fullMonthName}`;
            const monthPath = path.join(notesPath, year.toString(), folderName);

            let monthCount = 0;
            if (await pathExists(monthPath)) {
                const noteFiles = await readDirectoryWithTypes(monthPath);
                for (const file of noteFiles) {
                    if (!file.isDirectory() && SUPPORTED_EXTENSIONS.some(ext => file.name.endsWith(ext))) {
                        monthCount++;
                    }
                }
            }

            cumulative += monthCount;
            growth.push({ month: monthName, year, cumulative });
        }
    } catch (error) {
        console.error('[NOTED] Error getting growth data:', error);
    }

    return growth;
}

export { isTodayDate };
