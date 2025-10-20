import * as vscode from 'vscode';
import * as path from 'path';
import { pathExists } from './fileSystemService';

/**
 * Service for managing pinned/favorite notes
 * Uses VS Code's globalState to persist pinned notes across sessions
 */
export class PinnedNotesService {
    private static readonly STORAGE_KEY = 'noted.pinnedNotes';
    private context: vscode.ExtensionContext;
    private pinnedNotes: Set<string>;
    private _onDidChangePinnedNotes: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    readonly onDidChangePinnedNotes: vscode.Event<void> = this._onDidChangePinnedNotes.event;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.pinnedNotes = this.loadPinnedNotes();
    }

    /**
     * Load pinned notes from storage
     */
    private loadPinnedNotes(): Set<string> {
        const stored = this.context.globalState.get<string[]>(PinnedNotesService.STORAGE_KEY, []);
        return new Set(stored);
    }

    /**
     * Save pinned notes to storage
     */
    private async savePinnedNotes(): Promise<void> {
        const array = Array.from(this.pinnedNotes);
        await this.context.globalState.update(PinnedNotesService.STORAGE_KEY, array);
        this._onDidChangePinnedNotes.fire();
    }

    /**
     * Pin a note
     */
    async pinNote(filePath: string): Promise<void> {
        if (!(await pathExists(filePath))) {
            throw new Error('Note file does not exist');
        }

        this.pinnedNotes.add(filePath);
        await this.savePinnedNotes();
    }

    /**
     * Unpin a note
     */
    async unpinNote(filePath: string): Promise<void> {
        this.pinnedNotes.delete(filePath);
        await this.savePinnedNotes();
    }

    /**
     * Toggle pin state of a note
     */
    async togglePin(filePath: string): Promise<boolean> {
        if (this.isPinned(filePath)) {
            await this.unpinNote(filePath);
            return false;
        } else {
            await this.pinNote(filePath);
            return true;
        }
    }

    /**
     * Check if a note is pinned
     */
    isPinned(filePath: string): boolean {
        return this.pinnedNotes.has(filePath);
    }

    /**
     * Get all pinned notes
     * Filters out notes that no longer exist
     */
    async getPinnedNotes(): Promise<string[]> {
        const pinned = Array.from(this.pinnedNotes);
        const existing: string[] = [];

        // Filter out non-existent files
        for (const filePath of pinned) {
            if (await pathExists(filePath)) {
                existing.push(filePath);
            } else {
                // Remove from pinned list if file no longer exists
                this.pinnedNotes.delete(filePath);
            }
        }

        // Save if we removed any non-existent files
        if (existing.length !== pinned.length) {
            await this.savePinnedNotes();
        }

        return existing;
    }

    /**
     * Clear all pinned notes
     */
    async clearAll(): Promise<void> {
        this.pinnedNotes.clear();
        await this.savePinnedNotes();
    }

    /**
     * Get the number of pinned notes
     */
    getCount(): number {
        return this.pinnedNotes.size;
    }
}
