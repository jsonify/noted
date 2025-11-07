/**
 * Service for managing summary history and versions
 * Stores multiple versions of summaries for each note
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as crypto from 'crypto';
import { SummaryOptions } from './summarizationService';
import { createDirectory } from './fileSystemService';

/**
 * A single version of a summary
 */
export interface SummaryVersion {
    timestamp: Date;
    summary: string;
    options: SummaryOptions;
    model: string;
    promptTemplate?: string;
    fileModifiedAt?: Date;
}

/**
 * Summary history for a single note
 */
interface SummaryHistory {
    filePath: string;
    fileHash: string;
    versions: SummaryVersion[];
}

/**
 * Service for managing summary version history
 */
export class SummaryHistoryService {
    private static readonly CACHE_FOLDER = '.noted-cache';
    private static readonly SUMMARIES_FOLDER = 'summaries';
    private static readonly MAX_VERSIONS = 10;

    private notesPath: string;

    constructor(notesPath: string) {
        this.notesPath = notesPath;
    }

    /**
     * Get the path to the summaries cache folder
     */
    private getSummariesPath(): string {
        return path.join(this.notesPath, SummaryHistoryService.CACHE_FOLDER, SummaryHistoryService.SUMMARIES_FOLDER);
    }

    /**
     * Generate a hash for a file path (for filename)
     */
    private getFileHash(filePath: string): string {
        return crypto.createHash('md5').update(filePath).digest('hex');
    }

    /**
     * Get the history file path for a note
     */
    private getHistoryFilePath(filePath: string): string {
        const hash = this.getFileHash(filePath);
        return path.join(this.getSummariesPath(), `${hash}.json`);
    }

    /**
     * Ensure the summaries cache folder exists
     */
    private async ensureCacheFolderExists(): Promise<void> {
        const summariesPath = this.getSummariesPath();
        await createDirectory(summariesPath);
    }

    /**
     * Load history for a file
     */
    async loadHistory(filePath: string): Promise<SummaryHistory | null> {
        try {
            const historyPath = this.getHistoryFilePath(filePath);
            const uri = vscode.Uri.file(historyPath);

            const data = await vscode.workspace.fs.readFile(uri);
            const json = JSON.parse(Buffer.from(data).toString('utf8'));

            // Hydrate dates
            const history: SummaryHistory = {
                ...json,
                versions: json.versions.map((v: any) => ({
                    ...v,
                    timestamp: new Date(v.timestamp),
                    fileModifiedAt: v.fileModifiedAt ? new Date(v.fileModifiedAt) : undefined
                }))
            };

            return history;
        } catch (error) {
            // File doesn't exist or error reading
            return null;
        }
    }

    /**
     * Save history for a file
     */
    async saveHistory(history: SummaryHistory): Promise<void> {
        try {
            await this.ensureCacheFolderExists();

            const historyPath = this.getHistoryFilePath(history.filePath);
            const uri = vscode.Uri.file(historyPath);

            const json = JSON.stringify(history, null, 2);
            await vscode.workspace.fs.writeFile(uri, Buffer.from(json, 'utf8'));
        } catch (error) {
            console.error('Failed to save summary history:', error);
            throw new Error(`Failed to save summary history: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Add a new summary version to history
     */
    async addVersion(
        filePath: string,
        summary: string,
        options: SummaryOptions,
        model: string,
        promptTemplate?: string,
        fileModifiedAt?: Date
    ): Promise<void> {
        // Load existing history or create new
        let history = await this.loadHistory(filePath);

        if (!history) {
            history = {
                filePath,
                fileHash: this.getFileHash(filePath),
                versions: []
            };
        }

        // Add new version
        const newVersion: SummaryVersion = {
            timestamp: new Date(),
            summary,
            options,
            model,
            promptTemplate,
            fileModifiedAt
        };

        history.versions.push(newVersion);

        // Evict oldest versions if exceeding max (LRU)
        if (history.versions.length > SummaryHistoryService.MAX_VERSIONS) {
            history.versions = history.versions.slice(-SummaryHistoryService.MAX_VERSIONS);
        }

        // Save updated history
        await this.saveHistory(history);
    }

    /**
     * Get all versions for a file
     */
    async getVersions(filePath: string): Promise<SummaryVersion[]> {
        const history = await this.loadHistory(filePath);
        return history ? history.versions : [];
    }

    /**
     * Get a specific version by index (0 = oldest, length-1 = newest)
     */
    async getVersion(filePath: string, index: number): Promise<SummaryVersion | null> {
        const versions = await this.getVersions(filePath);
        if (index < 0 || index >= versions.length) {
            return null;
        }
        return versions[index];
    }

    /**
     * Get the latest version
     */
    async getLatestVersion(filePath: string): Promise<SummaryVersion | null> {
        const versions = await this.getVersions(filePath);
        return versions.length > 0 ? versions[versions.length - 1] : null;
    }

    /**
     * Clear history for a specific file
     */
    async clearHistory(filePath: string): Promise<void> {
        try {
            const historyPath = this.getHistoryFilePath(filePath);
            const uri = vscode.Uri.file(historyPath);

            await vscode.workspace.fs.delete(uri);
        } catch (error) {
            // File doesn't exist, nothing to clear
        }
    }

    /**
     * Clear all history
     */
    async clearAllHistory(): Promise<void> {
        try {
            const summariesPath = this.getSummariesPath();
            const uri = vscode.Uri.file(summariesPath);

            await vscode.workspace.fs.delete(uri, { recursive: true });
        } catch (error) {
            // Folder doesn't exist, nothing to clear
        }
    }

    /**
     * Get total number of history files
     */
    async getHistoryCount(): Promise<number> {
        try {
            const summariesPath = this.getSummariesPath();
            const uri = vscode.Uri.file(summariesPath);

            const entries = await vscode.workspace.fs.readDirectory(uri);
            return entries.filter(([name]) => name.endsWith('.json')).length;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Get statistics about history storage
     */
    async getStats(): Promise<{ totalFiles: number; totalVersions: number; maxVersions: number }> {
        try {
            const summariesPath = this.getSummariesPath();
            const uri = vscode.Uri.file(summariesPath);

            const entries = await vscode.workspace.fs.readDirectory(uri);
            const jsonFiles = entries.filter(([name]) => name.endsWith('.json'));

            let totalVersions = 0;
            for (const [filename] of jsonFiles) {
                try {
                    const fileUri = vscode.Uri.file(path.join(summariesPath, filename));
                    const data = await vscode.workspace.fs.readFile(fileUri);
                    const json = JSON.parse(Buffer.from(data).toString('utf8'));
                    totalVersions += json.versions?.length || 0;
                } catch (error) {
                    // Skip invalid files
                }
            }

            return {
                totalFiles: jsonFiles.length,
                totalVersions,
                maxVersions: SummaryHistoryService.MAX_VERSIONS
            };
        } catch (error) {
            return {
                totalFiles: 0,
                totalVersions: 0,
                maxVersions: SummaryHistoryService.MAX_VERSIONS
            };
        }
    }

    /**
     * Format a version for display in a quick pick
     */
    formatVersionForDisplay(version: SummaryVersion, index: number, total: number): string {
        const versionNum = index + 1;
        const timeAgo = this.getTimeAgo(version.timestamp);
        const lengthLabel = version.options.maxLength || 'medium';
        const formatLabel = version.options.format || 'structured';

        return `Version ${versionNum} of ${total} • ${timeAgo} • ${lengthLabel}/${formatLabel}`;
    }

    /**
     * Get a human-readable time ago string
     */
    private getTimeAgo(date: Date): string {
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) {
            return 'just now';
        }

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        }

        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }

        const days = Math.floor(hours / 24);
        if (days < 7) {
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }

        const weeks = Math.floor(days / 7);
        if (weeks < 4) {
            return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        }

        const months = Math.floor(days / 30);
        if (months < 12) {
            return `${months} month${months > 1 ? 's' : ''} ago`;
        }

        const years = Math.floor(days / 365);
        return `${years} year${years > 1 ? 's' : ''} ago`;
    }

    /**
     * Format version metadata for display
     */
    formatVersionMetadata(version: SummaryVersion): string {
        const lines = [
            `Generated: ${version.timestamp.toLocaleString()}`,
            `Model: ${version.model}`,
            `Length: ${version.options.maxLength || 'medium'}`,
            `Format: ${version.options.format || 'structured'}`,
            `Action Items: ${version.options.includeActionItems ? 'Yes' : 'No'}`,
            `Keywords: ${version.options.includeKeywords ? 'Yes' : 'No'}`
        ];

        if (version.promptTemplate) {
            lines.push(`Template: ${version.promptTemplate}`);
        }

        if (version.fileModifiedAt) {
            lines.push(`File Modified: ${version.fileModifiedAt.toLocaleString()}`);
        }

        return lines.join('\n');
    }
}
