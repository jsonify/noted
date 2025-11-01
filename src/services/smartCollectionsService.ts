/**
 * Smart Collections Service
 * Manages saved search queries that auto-update as notes change
 */

import * as vscode from 'vscode';
import { SearchOptions, parseSearchQuery, advancedSearch, SearchResult } from './searchService';
import { TagService } from './tagService';

/**
 * Represents a saved smart collection
 */
export interface SmartCollection {
    id: string;
    name: string;
    description?: string;
    query: string;
    icon?: string;
    color?: string;
    pinned: boolean;
    createdAt: number;
    updatedAt: number;
}

/**
 * Service for managing smart collections
 */
export class SmartCollectionsService {
    private static readonly STORAGE_KEY = 'noted.smartCollections';
    private collections: Map<string, SmartCollection> = new Map();
    private context: vscode.ExtensionContext;
    private _onDidChangeCollections = new vscode.EventEmitter<void>();
    public readonly onDidChangeCollections = this._onDidChangeCollections.event;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadCollections();
    }

    /**
     * Load collections from storage
     */
    private loadCollections(): void {
        const stored = this.context.workspaceState.get<SmartCollection[]>(
            SmartCollectionsService.STORAGE_KEY,
            []
        );
        this.collections.clear();
        for (const collection of stored) {
            this.collections.set(collection.id, collection);
        }
    }

    /**
     * Save collections to storage
     */
    private async saveCollections(): Promise<void> {
        const collectionsArray = Array.from(this.collections.values());
        await this.context.workspaceState.update(
            SmartCollectionsService.STORAGE_KEY,
            collectionsArray
        );
        this._onDidChangeCollections.fire();
    }

    /**
     * Create a new collection
     */
    async createCollection(
        name: string,
        query: string,
        options?: {
            description?: string;
            icon?: string;
            color?: string;
            pinned?: boolean;
        }
    ): Promise<SmartCollection> {
        const id = this.generateId();
        const now = Date.now();

        const collection: SmartCollection = {
            id,
            name,
            description: options?.description,
            query,
            icon: options?.icon,
            color: options?.color,
            pinned: options?.pinned ?? false,
            createdAt: now,
            updatedAt: now
        };

        this.collections.set(id, collection);
        await this.saveCollections();

        return collection;
    }

    /**
     * Update an existing collection
     */
    async updateCollection(
        id: string,
        updates: Partial<Omit<SmartCollection, 'id' | 'createdAt'>>
    ): Promise<SmartCollection | null> {
        const collection = this.collections.get(id);
        if (!collection) {
            return null;
        }

        const updated: SmartCollection = {
            ...collection,
            ...updates,
            id: collection.id,
            createdAt: collection.createdAt,
            updatedAt: Date.now()
        };

        this.collections.set(id, updated);
        await this.saveCollections();

        return updated;
    }

    /**
     * Delete a collection
     */
    async deleteCollection(id: string): Promise<boolean> {
        const deleted = this.collections.delete(id);
        if (deleted) {
            await this.saveCollections();
        }
        return deleted;
    }

    /**
     * Get a collection by ID
     */
    getCollection(id: string): SmartCollection | undefined {
        return this.collections.get(id);
    }

    /**
     * Get all collections
     */
    getAllCollections(): SmartCollection[] {
        return Array.from(this.collections.values());
    }

    /**
     * Get pinned collections
     */
    getPinnedCollections(): SmartCollection[] {
        return this.getAllCollections()
            .filter(c => c.pinned)
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Get unpinned collections
     */
    getUnpinnedCollections(): SmartCollection[] {
        return this.getAllCollections()
            .filter(c => !c.pinned)
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Toggle pin status of a collection
     */
    async togglePin(id: string): Promise<SmartCollection | null> {
        const collection = this.collections.get(id);
        if (!collection) {
            return null;
        }

        return this.updateCollection(id, { pinned: !collection.pinned });
    }

    /**
     * Duplicate a collection
     */
    async duplicateCollection(id: string): Promise<SmartCollection | null> {
        const original = this.collections.get(id);
        if (!original) {
            return null;
        }

        return this.createCollection(
            `${original.name} (Copy)`,
            original.query,
            {
                description: original.description,
                icon: original.icon,
                color: original.color,
                pinned: false
            }
        );
    }

    /**
     * Run a collection search
     */
    async runCollection(
        id: string,
        tagService?: TagService
    ): Promise<SearchResult[]> {
        const collection = this.collections.get(id);
        if (!collection) {
            return [];
        }

        const searchOptions = parseSearchQuery(collection.query);
        return advancedSearch(searchOptions, tagService);
    }

    /**
     * Parse a collection's query into SearchOptions
     */
    getSearchOptions(id: string): SearchOptions | null {
        const collection = this.collections.get(id);
        if (!collection) {
            return null;
        }

        return parseSearchQuery(collection.query);
    }

    /**
     * Create pre-built collections for new users
     */
    async createDefaultCollections(): Promise<void> {
        // Only create if no collections exist
        if (this.collections.size > 0) {
            return;
        }

        const defaults = [
            {
                name: 'Recent Notes',
                query: '',
                description: 'All notes sorted by date',
                icon: 'history',
                pinned: true
            },
            {
                name: 'Untagged Notes',
                query: '',
                description: 'Notes without any tags',
                icon: 'tag',
                pinned: false
            },
            {
                name: 'This Week',
                query: `from:${this.getDateDaysAgo(7)}`,
                description: 'Notes from the last 7 days',
                icon: 'calendar',
                pinned: true
            },
            {
                name: 'This Month',
                query: `from:${this.getDateDaysAgo(30)}`,
                description: 'Notes from the last 30 days',
                icon: 'calendar',
                pinned: false
            }
        ];

        for (const def of defaults) {
            await this.createCollection(def.name, def.query, {
                description: def.description,
                icon: def.icon,
                pinned: def.pinned
            });
        }
    }

    /**
     * Generate a unique ID
     */
    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Get date N days ago in YYYY-MM-DD format
     */
    private getDateDaysAgo(days: number): string {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this._onDidChangeCollections.dispose();
    }
}
