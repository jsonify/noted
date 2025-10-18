import { promises as fsp } from 'fs';

/**
 * Check if a path exists
 */
export async function pathExists(filePath: string): Promise<boolean> {
    try {
        await fsp.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Create directory recursively
 */
export async function createDirectory(dirPath: string): Promise<void> {
    await fsp.mkdir(dirPath, { recursive: true });
}

/**
 * Read file content as UTF-8
 */
export async function readFile(filePath: string): Promise<string> {
    return await fsp.readFile(filePath, 'utf8');
}

/**
 * Write file content as UTF-8
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
    await fsp.writeFile(filePath, content);
}

/**
 * Delete file
 */
export async function deleteFile(filePath: string): Promise<void> {
    await fsp.unlink(filePath);
}

/**
 * Rename/move file
 */
export async function renameFile(oldPath: string, newPath: string): Promise<void> {
    await fsp.rename(oldPath, newPath);
}

/**
 * Copy file
 */
export async function copyFile(srcPath: string, destPath: string): Promise<void> {
    await fsp.copyFile(srcPath, destPath);
}

/**
 * Delete directory recursively
 */
export async function deleteDirectory(dirPath: string): Promise<void> {
    await fsp.rm(dirPath, { recursive: true, force: true });
}

/**
 * Read directory entries
 */
export async function readDirectory(dirPath: string): Promise<string[]> {
    return await fsp.readdir(dirPath);
}

/**
 * Read directory with file types
 */
export async function readDirectoryWithTypes(dirPath: string) {
    return await fsp.readdir(dirPath, { withFileTypes: true });
}

/**
 * Get file stats
 */
export async function getFileStats(filePath: string) {
    return await fsp.stat(filePath);
}

/**
 * Copy directory recursively
 */
export async function copyDirectoryRecursive(src: string, dest: string): Promise<void> {
    const entries = await fsp.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = require('path').join(src, entry.name);
        const destPath = require('path').join(dest, entry.name);
        if (entry.isDirectory()) {
            await fsp.mkdir(destPath, { recursive: true });
            await copyDirectoryRecursive(srcPath, destPath);
        } else {
            await fsp.copyFile(srcPath, destPath);
        }
    }
}
