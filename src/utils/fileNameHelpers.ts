/**
 * Utility functions for handling filenames and extensions
 */

/**
 * List of common file extensions that should be preserved
 * when user explicitly provides them in the filename
 */
const COMMON_EXTENSIONS = [
    // Code files
    'js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'java', 'cpp', 'c', 'h', 'hpp',
    'cs', 'go', 'rs', 'php', 'swift', 'kt', 'scala', 'sh', 'bash', 'zsh',
    'ps1', 'bat', 'cmd',

    // Data & Config
    'json', 'yaml', 'yml', 'toml', 'xml', 'csv', 'ini', 'conf', 'env',

    // Documentation
    'md', 'txt', 'rst', 'adoc', 'org',

    // Web
    'html', 'htm', 'css', 'scss', 'sass', 'less',

    // Other
    'sql', 'r', 'm', 'pl', 'lua', 'vim', 'el'
];

/**
 * Extract file extension from a filename
 * @param filename The filename to check
 * @returns Object with baseName and extension (without dot), or null extension if none found
 */
export function extractFileExtension(filename: string): { baseName: string; extension: string | null } {
    const trimmed = filename.trim();

    // Find last dot that's not at the start
    const lastDotIndex = trimmed.lastIndexOf('.');

    // No extension if:
    // - No dot found
    // - Dot is at the start (hidden file like .gitignore)
    // - Dot is at the end (invalid)
    if (lastDotIndex === -1 || lastDotIndex === 0 || lastDotIndex === trimmed.length - 1) {
        return { baseName: trimmed, extension: null };
    }

    const potentialExtension = trimmed.substring(lastDotIndex + 1).toLowerCase();
    const baseName = trimmed.substring(0, lastDotIndex);

    // Check if it's a recognized extension
    if (COMMON_EXTENSIONS.includes(potentialExtension)) {
        return { baseName, extension: potentialExtension };
    }

    // Not a recognized extension, treat the whole thing as the base name
    return { baseName: trimmed, extension: null };
}

/**
 * Sanitize a filename by removing/replacing invalid characters
 * Preserves user-provided file extensions if they're recognized
 * @param input The raw user input filename
 * @param defaultExtension The default extension to use if none provided (without dot)
 * @returns Object with sanitized filename and the extension that should be used
 */
export function sanitizeFileName(input: string, defaultExtension: string): {
    sanitizedName: string;
    extension: string;
} {
    const { baseName, extension } = extractFileExtension(input);

    // Sanitize the base name: replace spaces with dashes, remove special chars
    // Keep alphanumeric, dashes, and underscores only
    const sanitized = baseName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-_]/g, '');

    // Use user's extension if provided, otherwise use default
    const finalExtension = extension || defaultExtension;

    return {
        sanitizedName: sanitized,
        extension: finalExtension
    };
}
