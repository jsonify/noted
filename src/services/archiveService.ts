import * as vscode from 'vscode';
import * as path from 'path';
import { pathExists, createDirectory, renameFile, readDirectoryWithTypes, getFileStats } from './fileSystemService';
import { SUPPORTED_EXTENSIONS } from '../constants';

/**
 * Service for archiving old notes
 */
export class ArchiveService {
    private notesPath: string;
    private archiveFolderName: string = '.archive';

    constructor(notesPath: string) {
        this.notesPath = notesPath;
    }

    /**
     * Get the archive folder path
     */
    getArchivePath(): string {
        return path.join(this.notesPath, this.archiveFolderName);
    }

    /**
     * Ensure archive folder exists
     */
    private async ensureArchiveFolder(): Promise<string> {
        const archivePath = this.getArchivePath();
        if (!(await pathExists(archivePath))) {
            await createDirectory(archivePath);
        }
        return archivePath;
    }

    /**
     * Archive a single note
     * Returns the destination path for undo tracking
     */
    async archiveNote(filePath: string): Promise<string> {
        if (!(await pathExists(filePath))) {
            throw new Error('Note file does not exist');
        }

        // Don't archive if already in archive
        if (filePath.includes(this.archiveFolderName)) {
            throw new Error('Note is already archived');
        }

        const archivePath = await this.ensureArchiveFolder();
        const fileName = path.basename(filePath);
        let destinationPath = path.join(archivePath, fileName);

        // Check if file already exists in archive
        if (await pathExists(destinationPath)) {
            // Add timestamp to avoid conflicts
            const ext = path.extname(fileName);
            const base = path.basename(fileName, ext);
            const timestamp = Date.now();
            const newFileName = `${base}-${timestamp}${ext}`;
            destinationPath = path.join(archivePath, newFileName);
        }

        await renameFile(filePath, destinationPath);
        return destinationPath;
    }

    /**
     * Unarchive a note (move back to notes)
     * Returns the destination path for undo tracking
     */
    async unarchiveNote(filePath: string): Promise<string> {
        if (!(await pathExists(filePath))) {
            throw new Error('Archived note does not exist');
        }

        if (!filePath.includes(this.archiveFolderName)) {
            throw new Error('Note is not in archive');
        }

        // Extract the relative path structure to preserve organization
        const archivePath = this.getArchivePath();
        const relativePath = path.relative(archivePath, filePath);
        const fileName = path.basename(relativePath);

        // Move to root of notes (could be enhanced to preserve folder structure)
        const destinationPath = path.join(this.notesPath, fileName);

        if (await pathExists(destinationPath)) {
            throw new Error('A note with this name already exists in active notes');
        }

        await renameFile(filePath, destinationPath);
        return destinationPath;
    }

    /**
     * Get all archived notes
     */
    async getArchivedNotes(): Promise<string[]> {
        const archivePath = this.getArchivePath();
        if (!(await pathExists(archivePath))) {
            return [];
        }

        const archived: string[] = [];

        async function findArchivedNotes(dir: string) {
            try {
                const entries = await readDirectoryWithTypes(dir);
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        await findArchivedNotes(fullPath);
                    } else if (SUPPORTED_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
                        archived.push(fullPath);
                    }
                }
            } catch (error) {
                console.error('[NOTED] Error reading archive directory:', dir, error);
            }
        }

        await findArchivedNotes(archivePath);
        return archived;
    }

    /**
     * Archive old notes based on age
     * @param daysOld Number of days - notes older than this will be archived
     */
    async archiveOldNotes(daysOld: number): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const allNotes = await this.getAllActiveNotes();
        let archivedCount = 0;

        for (const notePath of allNotes) {
            try {
                const stat = await getFileStats(notePath);
                if (stat.mtime < cutoffDate) {
                    await this.archiveNote(notePath);
                    archivedCount++;
                }
            } catch (error) {
                console.error('[NOTED] Error archiving old note:', notePath, error);
            }
        }

        return archivedCount;
    }

    /**
     * Get all active (non-archived) notes
     */
    private async getAllActiveNotes(): Promise<string[]> {
        const notes: string[] = [];
        const archivePath = this.getArchivePath();

        async function findNotes(dir: string, isArchive: boolean) {
            try {
                if (!(await pathExists(dir))) {
                    return;
                }

                const entries = await readDirectoryWithTypes(dir);
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);

                    // Skip archive folder
                    if (entry.isDirectory() && entry.name === '.archive') {
                        continue;
                    }

                    if (entry.isDirectory()) {
                        await findNotes(fullPath, isArchive || fullPath === archivePath);
                    } else if (!isArchive && SUPPORTED_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
                        notes.push(fullPath);
                    }
                }
            } catch (error) {
                console.error('[NOTED] Error reading directory:', dir, error);
            }
        }

        await findNotes(this.notesPath, false);
        return notes;
    }

    /**
     * Check if a note is archived
     */
    isArchived(filePath: string): boolean {
        return filePath.includes(this.archiveFolderName);
    }

    /**
     * Update the notes path
     * Used when the notes folder location changes
     */
    updateNotesPath(newPath: string): void {
        this.notesPath = newPath;
    }
}
