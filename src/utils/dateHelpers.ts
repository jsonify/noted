/**
 * Format a date for display in notes
 */
export function formatDateForNote(date: Date): string {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format a time for display in notes
 */
export function formatTimeForNote(date: Date): string {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Format current time for timestamp insertion
 */
export function formatTimestamp(): string {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Get year string from date
 */
export function getYear(date: Date): string {
    return date.getFullYear().toString();
}

/**
 * Get month string with leading zero (01-12)
 */
export function getMonth(date: Date): string {
    return date.toLocaleString('en-US', { month: '2-digit' });
}

/**
 * Get month name (January, February, etc.)
 */
export function getMonthName(date: Date): string {
    return date.toLocaleString('en-US', { month: 'long' });
}

/**
 * Get day string with leading zero (01-31)
 */
export function getDay(date: Date): string {
    return date.toLocaleString('en-US', { day: '2-digit' });
}

/**
 * Get folder name for a date (MM-MonthName)
 */
export function getFolderName(date: Date): string {
    const month = getMonth(date);
    const monthName = getMonthName(date);
    return `${month}-${monthName}`;
}

/**
 * Get time string for filename (HHMM)
 */
export function getTimeForFilename(date: Date): string {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(':', '');
}

/**
 * Check if a date is today
 */
export function isTodayDate(year: number, month: number, day: number): boolean {
    const today = new Date();
    return today.getFullYear() === year &&
           today.getMonth() === month &&
           today.getDate() === day;
}
