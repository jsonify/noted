import * as path from 'path';
import { promises as fsp } from 'fs';

/**
 * Get all folders recursively from a root path
 * Returns array of {name: relative path, path: absolute path}
 */
export async function getAllFolders(rootPath: string): Promise<Array<{name: string, path: string}>> {
    const folders: Array<{name: string, path: string}> = [];

    async function scanDir(dir: string, relativePath: string = '') {
        try {
            const entries = await fsp.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const fullPath = path.join(dir, entry.name);
                    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
                    folders.push({
                        name: relPath,
                        path: fullPath
                    });
                    await scanDir(fullPath, relPath);
                }
            }
        } catch (error) {
            console.error('[NOTED] Error scanning directory:', dir, error);
        }
    }

    await scanDir(rootPath);
    return folders;
}
