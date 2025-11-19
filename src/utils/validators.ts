import { FOLDER_PATTERNS, getSupportedExtensionsRegex } from '../constants';
import * as path from 'path';

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
 * Check if a file is a daily note based on its filename (YYYY-MM-DD.ext)
 * @param filePath Full path or just filename
 */
export function isDailyNote(filePath: string): boolean {
    const fileName = path.basename(filePath);
    const nameWithoutExt = fileName.replace(getSupportedExtensionsRegex(), '');
    return FOLDER_PATTERNS.DAILY_NOTE.test(nameWithoutExt);
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
