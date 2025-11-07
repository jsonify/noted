import * as vscode from 'vscode';
import * as path from 'path';
import { getNotesPath, getFileFormat } from '../services/configService';
import { pathExists, createDirectory, writeFile, readDirectoryWithTypes, readFile, getFileStats } from '../services/fileSystemService';
import { generateTemplate } from '../services/templateService';
import { isTodayDate } from '../utils/dateHelpers';
import { SUPPORTED_EXTENSIONS } from '../constants';
import { parseFrontmatter } from '../utils/frontmatterParser';

/**
 * Extract the creation date from a note using multiple strategies:
 * 1. Filename (YYYY-MM-DD prefix)
 * 2. Frontmatter 'created' field
 * 3. File creation timestamp (birthtime)
 */
async function extractNoteDate(filePath: string): Promise<Date | null> {
    // Strategy 1: Extract from filename (YYYY-MM-DD prefix)
    const fileName = path.basename(filePath);
    const dateMatch = fileName.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
        return new Date(
            parseInt(dateMatch[1]),
            parseInt(dateMatch[2]) - 1,
            parseInt(dateMatch[3])
        );
    }

    // Strategy 2: Parse frontmatter 'created' field
    try {
        const content = await readFile(filePath);
        const frontmatter = parseFrontmatter(content);
        if (frontmatter.created) {
            const createdDate = new Date(frontmatter.created);
            if (!isNaN(createdDate.getTime())) {
                return createdDate;
            }
        }
    } catch (error) {
        // Fall through to file stats
    }

    // Strategy 3: Use file creation timestamp
    try {
        const stats = await getFileStats(filePath);
        return stats.birthtime;
    } catch (error) {
        return null;
    }
}

/**
 * Async generator that yields note file information from the entire notes directory structure.
 * This eliminates code duplication across multiple statistics functions.
 *
 * @param notesPath - Root path of the notes directory
 * @yields Object containing file name and the extracted date from the filename
 */
async function* iterateNoteFiles(notesPath: string): AsyncGenerator<{ fileName: string; date: Date; filePath: string }> {
    if (!(await pathExists(notesPath))) {
        return;
    }

    // Recursive helper to scan directories
    async function* scanDirectory(dirPath: string): AsyncGenerator<string> {
        const entries = await readDirectoryWithTypes(dirPath);
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            // Skip special folders
            if (entry.isDirectory()) {
                const skipFolders = ['.templates', 'Archive', '.trash'];
                if (!skipFolders.includes(entry.name)) {
                    yield* scanDirectory(fullPath);
                }
            } else if (SUPPORTED_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
                yield fullPath;
            }
        }
    }

    // Scan all notes and extract dates
    for await (const filePath of scanDirectory(notesPath)) {
        const date = await extractNoteDate(filePath);
        if (date) {
            yield {
                fileName: path.basename(filePath),
                date,
                filePath
            };
        }
    }
}

/**
 * Helper function to check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

/**
 * Get all notes for a specific date
 */
export async function getNotesForDate(notesPath: string, year: number, month: number, day: number): Promise<Array<{name: string, path: string}>> {
    const targetDate = new Date(year, month, day);
    const notes: Array<{name: string, path: string}> = [];

    try {
        // Scan all notes and filter by date
        for await (const noteInfo of iterateNoteFiles(notesPath)) {
            if (isSameDay(noteInfo.date, targetDate)) {
                notes.push({
                    name: noteInfo.fileName,
                    path: noteInfo.filePath
                });
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
        for await (const _ of iterateNoteFiles(notesPath)) {
            totalCount++;
        }
    } catch (error) {
        console.error('[NOTED] Error counting total notes:', error);
    }

    return totalCount;
}

/**
 * Get the date range of all notes (earliest and latest dates)
 * Returns null if no notes exist
 */
export async function getNoteDateRange(notesPath: string): Promise<{firstDate: Date, lastDate: Date, daySpan: number} | null> {
    if (!(await pathExists(notesPath))) {
        return null;
    }

    let firstDate: Date | null = null;
    let lastDate: Date | null = null;

    try {
        for await (const { date } of iterateNoteFiles(notesPath)) {
            if (!firstDate || date < firstDate) {
                firstDate = date;
            }
            if (!lastDate || date > lastDate) {
                lastDate = date;
            }
        }

        if (firstDate && lastDate) {
            // Calculate the number of days between first and last note
            const diffTime = lastDate.getTime() - firstDate.getTime();
            const daySpan = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1, 1); // Add 1 to include both first and last day
            return { firstDate, lastDate, daySpan };
        }

        return null;
    } catch (error) {
        console.error('[NOTED] Error getting note date range:', error);
        throw error;
    }
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
        throw error;
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
        // Collect all note dates
        for await (const { date } of iterateNoteFiles(notesPath)) {
            allDates.push(date);
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
        throw error;
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
        throw error;
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
        throw error;
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
        for await (const { date } of iterateNoteFiles(notesPath)) {
            const dayOfWeek = date.getDay();
            dayCounts[dayOfWeek]++;
        }
    } catch (error) {
        console.error('[NOTED] Error analyzing day of week:', error);
        throw error;
    }

    return dayNames.map((day, index) => ({
        day,
        dayNum: index,
        count: dayCounts[index]
    }));
}

/**
 * Get growth data - cumulative notes over time
 * Optimized to use single-pass directory traversal
 */
export async function getGrowthData(notesPath: string, months: number = 6): Promise<Array<{month: string, year: number, cumulative: number}>> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    // Map to store note counts by month key (YYYY-MM)
    const monthCounts = new Map<string, number>();
    let notesBeforeStart = 0;

    try {
        // Single pass through all notes
        for await (const { date } of iterateNoteFiles(notesPath)) {
            if (date < startDate) {
                // Count notes before the period
                notesBeforeStart++;
            } else {
                // Categorize notes by month
                const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);
            }
        }

        // Build growth data for each month
        const growth: Array<{month: string, year: number, cumulative: number}> = [];
        let cumulative = notesBeforeStart;

        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const year = date.getFullYear();
            const monthNum = date.getMonth();
            const monthName = date.toLocaleString('en-US', { month: 'short' });
            const monthKey = `${year}-${(monthNum + 1).toString().padStart(2, '0')}`;

            const monthCount = monthCounts.get(monthKey) || 0;
            cumulative += monthCount;
            growth.push({ month: monthName, year, cumulative });
        }

        return growth;
    } catch (error) {
        console.error('[NOTED] Error getting growth data:', error);
        throw error;
    }
}

/**
 * Get time-of-day analysis - when notes are created throughout the day
 * Returns hourly breakdown (0-23) with note counts
 */
export async function getTimeOfDayAnalysis(notesPath: string): Promise<Array<{hour: number, count: number, percentage: number}>> {
    const hourCounts = new Array(24).fill(0);
    let totalNotes = 0;

    try {
        for await (const { date } of iterateNoteFiles(notesPath)) {
            const hour = date.getHours();
            hourCounts[hour]++;
            totalNotes++;
        }

        // Convert to percentage and create result array
        return hourCounts.map((count, hour) => ({
            hour,
            count,
            percentage: totalNotes > 0 ? Math.round((count / totalNotes) * 100) : 0
        }));
    } catch (error) {
        console.error('[NOTED] Error getting time-of-day analysis:', error);
        return hourCounts.map((count, hour) => ({ hour, count, percentage: 0 }));
    }
}

/**
 * Get "On This Day" memories - notes from previous years on the same date
 */
export async function getOnThisDayMemories(notesPath: string, currentDate: Date = new Date()): Promise<Array<{year: number, notes: Array<{name: string, path: string}>}>> {
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();
    const currentYear = currentDate.getFullYear();

    const memoriesByYear = new Map<number, Array<{name: string, path: string}>>();

    try {
        for await (const { filePath, date } of iterateNoteFiles(notesPath)) {
            // Check if same month and day, but different year
            if (date.getMonth() === currentMonth &&
                date.getDate() === currentDay &&
                date.getFullYear() !== currentYear) {

                const year = date.getFullYear();
                if (!memoriesByYear.has(year)) {
                    memoriesByYear.set(year, []);
                }

                memoriesByYear.get(year)!.push({
                    name: path.basename(filePath, path.extname(filePath)),
                    path: filePath
                });
            }
        }

        // Convert map to sorted array (most recent years first)
        const result = Array.from(memoriesByYear.entries())
            .map(([year, notes]) => ({ year, notes }))
            .sort((a, b) => b.year - a.year);

        return result;
    } catch (error) {
        console.error('[NOTED] Error getting on this day memories:', error);
        return [];
    }
}

/**
 * Get "On This Month" memories - notes from previous months on the same day
 */
export async function getOnThisMonthMemories(notesPath: string, currentDate: Date = new Date()): Promise<Array<{monthsAgo: number, yearMonth: string, notes: Array<{name: string, path: string}>}>> {
    const currentDay = currentDate.getDate();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const memoriesByMonthsAgo = new Map<number, {yearMonth: string, notes: Array<{name: string, path: string}>}>();

    try {
        for await (const { filePath, date } of iterateNoteFiles(notesPath)) {
            // Check if same day of month, but different month
            if (date.getDate() === currentDay &&
                (date.getFullYear() !== currentYear || date.getMonth() !== currentMonth)) {

                // Calculate how many months ago
                const monthsDiff = (currentYear - date.getFullYear()) * 12 + (currentMonth - date.getMonth());

                if (monthsDiff > 0) {
                    const yearMonth = date.toLocaleString('en-US', { year: 'numeric', month: 'long' });

                    if (!memoriesByMonthsAgo.has(monthsDiff)) {
                        memoriesByMonthsAgo.set(monthsDiff, {
                            yearMonth,
                            notes: []
                        });
                    }

                    memoriesByMonthsAgo.get(monthsDiff)!.notes.push({
                        name: path.basename(filePath, path.extname(filePath)),
                        path: filePath
                    });
                }
            }
        }

        // Convert map to sorted array (most recent months first)
        const result = Array.from(memoriesByMonthsAgo.entries())
            .map(([monthsAgo, data]) => ({ monthsAgo, ...data }))
            .sort((a, b) => a.monthsAgo - b.monthsAgo);

        return result;
    } catch (error) {
        console.error('[NOTED] Error getting on this month memories:', error);
        return [];
    }
}

/**
 * Get perfect week data - which days of the current week have notes
 */
export async function getPerfectWeekData(notesPath: string): Promise<{
    daysWithNotes: boolean[],
    daysComplete: number,
    totalDays: number,
    perfectWeeksThisMonth: number
}> {
    const now = new Date();

    // Get start of current week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - now.getDay());

    // Get end of current week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Initialize days array (Sunday = 0, Saturday = 6)
    const daysWithNotes = new Array(7).fill(false);

    // Get start of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Track perfect weeks in current month
    const weekDays = new Map<string, Set<number>>(); // weekKey -> set of days with notes

    try {
        for await (const { date } of iterateNoteFiles(notesPath)) {
            // Check if in current week
            if (date >= startOfWeek && date <= endOfWeek) {
                const dayOfWeek = date.getDay();
                daysWithNotes[dayOfWeek] = true;
            }

            // Check if in current month for perfect week tracking
            if (date >= startOfMonth && date <= endOfMonth) {
                // Get week key (ISO week start)
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                weekStart.setHours(0, 0, 0, 0);
                const weekKey = `${weekStart.getFullYear()}-${(weekStart.getMonth() + 1).toString().padStart(2, '0')}-${weekStart.getDate().toString().padStart(2, '0')}`;

                if (!weekDays.has(weekKey)) {
                    weekDays.set(weekKey, new Set());
                }
                weekDays.get(weekKey)!.add(date.getDay());
            }
        }

        // Count perfect weeks (all 7 days have notes)
        let perfectWeeksThisMonth = 0;
        for (const days of weekDays.values()) {
            if (days.size === 7) {
                perfectWeeksThisMonth++;
            }
        }

        const daysComplete = daysWithNotes.filter(Boolean).length;

        return {
            daysWithNotes,
            daysComplete,
            totalDays: 7,
            perfectWeeksThisMonth
        };
    } catch (error) {
        console.error('[NOTED] Error getting perfect week data:', error);
        return {
            daysWithNotes: new Array(7).fill(false),
            daysComplete: 0,
            totalDays: 7,
            perfectWeeksThisMonth: 0
        };
    }
}

export { isTodayDate };
