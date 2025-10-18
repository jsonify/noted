import { FOLDER_PATTERNS } from '../constants';

/**
 * Check if a folder name matches year pattern (YYYY)
 */
export function isYearFolder(name: string): boolean {
    return FOLDER_PATTERNS.YEAR.test(name);
}

/**
 * Check if a folder name matches month pattern (MM-MonthName)
 */
export function isMonthFolder(name: string): boolean {
    return FOLDER_PATTERNS.MONTH.test(name);
}

/**
 * Validate custom folder name
 * - Cannot be empty
 * - Cannot match date patterns (year/month)
 * - Cannot contain invalid filesystem characters
 */
export function isValidCustomFolderName(name: string): boolean {
    // Don't allow empty names
    if (!name || name.trim().length === 0) {
        return false;
    }

    // Don't allow names that match date patterns
    if (isYearFolder(name) || isMonthFolder(name)) {
        return false;
    }

    // Don't allow invalid filesystem characters
    if (FOLDER_PATTERNS.INVALID_CHARS.test(name)) {
        return false;
    }

    return true;
}
