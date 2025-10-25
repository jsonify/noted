/**
 * TypeScript interfaces and types for JavaScript template execution
 */

/**
 * Helper class for date manipulation in templates
 */
export class DateHelper {
    private date: Date;

    constructor(date: Date = new Date()) {
        this.date = new Date(date);
    }

    /**
     * Format date as YYYY-MM-DD
     */
    format(pattern: string): string {
        const year = this.date.getFullYear();
        const month = (this.date.getMonth() + 1).toString().padStart(2, '0');
        const day = this.date.getDate().toString().padStart(2, '0');
        const hours = this.date.getHours().toString().padStart(2, '0');
        const minutes = this.date.getMinutes().toString().padStart(2, '0');
        const seconds = this.date.getSeconds().toString().padStart(2, '0');

        return pattern
            .replace('YYYY', year.toString())
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    }

    /**
     * Add days to the date
     */
    addDays(days: number): DateHelper {
        const newDate = new Date(this.date);
        newDate.setDate(newDate.getDate() + days);
        this.date = newDate;
        return this;
    }

    /**
     * Add months to the date
     */
    addMonths(months: number): DateHelper {
        const newDate = new Date(this.date);
        newDate.setMonth(newDate.getMonth() + months);
        this.date = newDate;
        return this;
    }

    /**
     * Get day of week (0-6, Sunday = 0)
     */
    getDayOfWeek(): number {
        return this.date.getDay();
    }

    /**
     * Get day name (Sunday, Monday, etc.)
     */
    getDayName(): string {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[this.date.getDay()];
    }

    /**
     * Get month name (January, February, etc.)
     */
    getMonthName(): string {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
        return months[this.date.getMonth()];
    }

    /**
     * Convert to ISO string
     */
    toISOString(): string {
        return this.date.toISOString();
    }

    /**
     * Get underlying Date object
     */
    toDate(): Date {
        return new Date(this.date);
    }
}

/**
 * Helper class for time formatting in templates
 */
export class TimeHelper {
    /**
     * Format time as HH:MM AM/PM
     */
    static format12Hour(date: Date): string {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${ampm}`;
    }

    /**
     * Format time as HH:MM (24-hour)
     */
    static format24Hour(date: Date): string {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    /**
     * Get current timestamp
     */
    static now(): string {
        return new Date().toISOString();
    }
}

/**
 * Context object available to JavaScript templates
 */
export interface NoteContext {
    /**
     * Note filename without extension
     */
    filename: string;

    /**
     * Current date object
     */
    date: Date;

    /**
     * Date helper with utility methods
     */
    dateHelper: DateHelper;

    /**
     * Time helper with utility methods
     */
    timeHelper: typeof TimeHelper;

    /**
     * Current year (YYYY)
     */
    year: string;

    /**
     * Current month (MM)
     */
    month: string;

    /**
     * Current day (DD)
     */
    day: string;

    /**
     * Day of week (Sun, Mon, etc.)
     */
    weekday: string;

    /**
     * Full month name (January, February, etc.)
     */
    monthName: string;

    /**
     * System username
     */
    user: string;

    /**
     * Workspace name
     */
    workspace: string;

    /**
     * Formatted date string (e.g., "Sunday, October 15, 2025")
     */
    dateString: string;

    /**
     * Formatted time string (e.g., "2:30 PM")
     */
    timeString: string;
}

/**
 * Options for template execution
 */
export interface TemplateExecutionOptions {
    /**
     * Maximum execution time in milliseconds (default: 5000)
     */
    timeout?: number;

    /**
     * Maximum memory limit in bytes (default: 32MB)
     */
    memoryLimit?: number;

    /**
     * Maximum output size in bytes (default: 1MB)
     */
    maxOutputSize?: number;
}

/**
 * Result of template execution
 */
export interface TemplateExecutionResult {
    /**
     * Generated output from template
     */
    output: string;

    /**
     * Execution time in milliseconds
     */
    executionTime: number;

    /**
     * Any errors encountered during execution
     */
    error?: string;
}

/**
 * Template parsing result
 */
export interface ParsedTemplate {
    /**
     * JavaScript code extracted from template
     */
    code: string;

    /**
     * Static parts of the template
     */
    staticParts: string[];

    /**
     * Expression parts to be evaluated
     */
    expressions: string[];
}
