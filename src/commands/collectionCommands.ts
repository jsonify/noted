/**
 * Command handlers for Smart Collections
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { SmartCollectionsService, SmartCollection } from '../services/smartCollectionsService';
import { TagService } from '../services/tagService';
import { CollectionsTreeProvider } from '../providers/collectionsTreeProvider';
import { CollectionItem } from '../providers/treeItems';

/**
 * Helper function to extract collection ID from either a CollectionItem or a string
 */
function getCollectionId(item: CollectionItem | string | undefined): string | undefined {
    if (!item) {
        return undefined;
    }
    if (typeof item === 'string') {
        return item;
    }
    if (item instanceof CollectionItem) {
        return item.collectionId;
    }
    return undefined;
}

/**
 * Create a new smart collection
 */
export async function handleCreateCollection(
    collectionsService: SmartCollectionsService
): Promise<void> {
    // Step 1: Get collection name
    const name = await vscode.window.showInputBox({
        prompt: 'Enter collection name',
        placeHolder: 'My Collection',
        validateInput: (value) => {
            if (!value || !value.trim()) {
                return 'Collection name cannot be empty';
            }
            return null;
        }
    });

    if (!name) {
        return;
    }

    // Step 2: Get search query
    const query = await vscode.window.showInputBox({
        prompt: 'Enter search query (supports tag:, from:, to:, regex:, case: filters)',
        placeHolder: 'tag:work from:2025-01-01',
        value: '',
    });

    if (query === undefined) {
        return;
    }

    // Step 3: Optional description
    const description = await vscode.window.showInputBox({
        prompt: 'Enter description (optional)',
        placeHolder: 'Work notes from this year'
    });

    // Step 4: Choose icon
    const iconOptions = [
        { label: '$(search) Search', value: 'search' },
        { label: '$(folder) Folder', value: 'folder' },
        { label: '$(tag) Tag', value: 'tag' },
        { label: '$(calendar) Calendar', value: 'calendar' },
        { label: '$(star) Star', value: 'star' },
        { label: '$(bookmark) Bookmark', value: 'bookmark' },
        { label: '$(heart) Heart', value: 'heart' },
        { label: '$(flame) Flame', value: 'flame' },
        { label: '$(zap) Zap', value: 'zap' },
        { label: '$(rocket) Rocket', value: 'rocket' }
    ];

    const selectedIcon = await vscode.window.showQuickPick(iconOptions, {
        placeHolder: 'Select an icon (optional)'
    });

    // Step 5: Pin option
    const pinOptions = [
        { label: 'Pin this collection', value: true },
        { label: 'Don\'t pin', value: false }
    ];

    const pinSelected = await vscode.window.showQuickPick(pinOptions, {
        placeHolder: 'Pin to top of list?'
    });

    // Create the collection
    try {
        await collectionsService.createCollection(name, query, {
            description: description || undefined,
            icon: selectedIcon?.value,
            pinned: pinSelected?.value ?? false
        });

        vscode.window.showInformationMessage(`Collection "${name}" created successfully`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create collection: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Create collection from current search
 */
export async function handleCreateCollectionFromSearch(
    collectionsService: SmartCollectionsService,
    currentQuery?: string
): Promise<void> {
    const query = currentQuery || '';

    // Get collection name
    const name = await vscode.window.showInputBox({
        prompt: 'Enter collection name',
        placeHolder: 'My Collection',
        validateInput: (value) => {
            if (!value || !value.trim()) {
                return 'Collection name cannot be empty';
            }
            return null;
        }
    });

    if (!name) {
        return;
    }

    // Optional description
    const description = await vscode.window.showInputBox({
        prompt: 'Enter description (optional)',
        placeHolder: 'Description of this collection'
    });

    try {
        await collectionsService.createCollection(name, query, {
            description: description || undefined,
            pinned: false
        });

        vscode.window.showInformationMessage(`Collection "${name}" created from search`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create collection: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Edit an existing collection
 */
export async function handleEditCollection(
    collectionsService: SmartCollectionsService,
    collectionIdOrItem?: CollectionItem | string
): Promise<void> {
    // Extract collection ID from either a CollectionItem or a string
    let collectionId = getCollectionId(collectionIdOrItem);

    // If no ID provided, show picker
    if (!collectionId) {
        const collections = collectionsService.getAllCollections();
        if (collections.length === 0) {
            vscode.window.showInformationMessage('No collections to edit');
            return;
        }

        const items = collections.map(c => ({
            label: c.name,
            description: c.query,
            detail: c.description,
            collection: c
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select collection to edit'
        });

        if (!selected) {
            return;
        }

        collectionId = selected.collection.id;
    }

    const collection = collectionsService.getCollection(collectionId);
    if (!collection) {
        vscode.window.showErrorMessage('Collection not found');
        return;
    }

    // Edit name
    const name = await vscode.window.showInputBox({
        prompt: 'Enter collection name',
        value: collection.name,
        validateInput: (value) => {
            if (!value || !value.trim()) {
                return 'Collection name cannot be empty';
            }
            return null;
        }
    });

    if (!name) {
        return;
    }

    // Edit query
    const query = await vscode.window.showInputBox({
        prompt: 'Enter search query',
        value: collection.query
    });

    if (query === undefined) {
        return;
    }

    // Edit description
    const description = await vscode.window.showInputBox({
        prompt: 'Enter description (optional)',
        value: collection.description || ''
    });

    try {
        await collectionsService.updateCollection(collectionId, {
            name,
            query,
            description: description || undefined
        });

        vscode.window.showInformationMessage(`Collection "${name}" updated successfully`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to update collection: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Delete a collection
 */
export async function handleDeleteCollection(
    collectionsService: SmartCollectionsService,
    collectionIdOrItem?: CollectionItem | string
): Promise<void> {
    // Extract collection ID from either a CollectionItem or a string
    let collectionId = getCollectionId(collectionIdOrItem);

    // If no ID provided, show picker
    if (!collectionId) {
        const collections = collectionsService.getAllCollections();
        if (collections.length === 0) {
            vscode.window.showInformationMessage('No collections to delete');
            return;
        }

        const items = collections.map(c => ({
            label: c.name,
            description: c.query,
            detail: c.description,
            collection: c
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select collection to delete'
        });

        if (!selected) {
            return;
        }

        collectionId = selected.collection.id;
    }

    const collection = collectionsService.getCollection(collectionId);
    if (!collection) {
        vscode.window.showErrorMessage('Collection not found');
        return;
    }

    // Confirm deletion
    const confirm = await vscode.window.showWarningMessage(
        `Delete collection "${collection.name}"?`,
        { modal: true },
        'Delete'
    );

    if (confirm !== 'Delete') {
        return;
    }

    try {
        await collectionsService.deleteCollection(collectionId);
        vscode.window.showInformationMessage(`Collection "${collection.name}" deleted`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to delete collection: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Run a collection and show results
 */
export async function handleRunCollection(
    collectionsService: SmartCollectionsService,
    tagService: TagService | undefined,
    collectionIdOrItem?: CollectionItem | string
): Promise<void> {
    // Extract collection ID from either a CollectionItem or a string
    let collectionId = getCollectionId(collectionIdOrItem);

    // If no ID provided, show picker
    if (!collectionId) {
        const collections = collectionsService.getAllCollections();
        if (collections.length === 0) {
            vscode.window.showInformationMessage('No collections available');
            return;
        }

        const items = collections.map(c => ({
            label: c.name,
            description: c.query,
            detail: c.description,
            collection: c
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select collection to run'
        });

        if (!selected) {
            return;
        }

        collectionId = selected.collection.id;
    }

    const collection = collectionsService.getCollection(collectionId);
    if (!collection) {
        vscode.window.showErrorMessage('Collection not found');
        return;
    }

    try {
        // Show progress
        const results = await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Running collection: ${collection.name}`,
                cancellable: false
            },
            async () => {
                return await collectionsService.runCollection(collectionId, tagService);
            }
        );

        // Show results in quick pick
        if (results.length === 0) {
            vscode.window.showInformationMessage(`No results found for "${collection.name}"`);
            return;
        }

        const resultItems = results.map(r => ({
            label: path.basename(r.file),
            description: `${r.matches} match${r.matches !== 1 ? 'es' : ''}`,
            detail: r.preview,
            file: r.file
        }));

        const selected = await vscode.window.showQuickPick(resultItems, {
            placeHolder: `${results.length} result${results.length !== 1 ? 's' : ''} for "${collection.name}"`
        });

        if (selected) {
            const doc = await vscode.workspace.openTextDocument(selected.file);
            await vscode.window.showTextDocument(doc);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to run collection: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Toggle pin status of a collection
 */
export async function handleTogglePinCollection(
    collectionsService: SmartCollectionsService,
    collectionIdOrItem?: CollectionItem | string
): Promise<void> {
    // Extract collection ID from either a CollectionItem or a string
    let collectionId = getCollectionId(collectionIdOrItem);

    // If no ID provided, show picker
    if (!collectionId) {
        const collections = collectionsService.getAllCollections();
        if (collections.length === 0) {
            vscode.window.showInformationMessage('No collections available');
            return;
        }

        const items = collections.map(c => ({
            label: `${c.pinned ? '📌 ' : ''}${c.name}`,
            description: c.query,
            detail: c.description,
            collection: c
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select collection to pin/unpin'
        });

        if (!selected) {
            return;
        }

        collectionId = selected.collection.id;
    }

    const collection = collectionsService.getCollection(collectionId);
    if (!collection) {
        vscode.window.showErrorMessage('Collection not found');
        return;
    }

    try {
        await collectionsService.togglePin(collectionId);
        const action = collection.pinned ? 'unpinned' : 'pinned';
        vscode.window.showInformationMessage(`Collection "${collection.name}" ${action}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to toggle pin: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Duplicate a collection
 */
export async function handleDuplicateCollection(
    collectionsService: SmartCollectionsService,
    collectionIdOrItem?: CollectionItem | string
): Promise<void> {
    // Extract collection ID from either a CollectionItem or a string
    let collectionId = getCollectionId(collectionIdOrItem);

    // If no ID provided, show picker
    if (!collectionId) {
        const collections = collectionsService.getAllCollections();
        if (collections.length === 0) {
            vscode.window.showInformationMessage('No collections to duplicate');
            return;
        }

        const items = collections.map(c => ({
            label: c.name,
            description: c.query,
            detail: c.description,
            collection: c
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select collection to duplicate'
        });

        if (!selected) {
            return;
        }

        collectionId = selected.collection.id;
    }

    try {
        const duplicated = await collectionsService.duplicateCollection(collectionId);
        if (duplicated) {
            vscode.window.showInformationMessage(`Collection duplicated as "${duplicated.name}"`);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to duplicate collection: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Refresh collections view
 */
export function handleRefreshCollections(
    collectionsTreeProvider: CollectionsTreeProvider
): void {
    collectionsTreeProvider.refresh();
    vscode.window.showInformationMessage('Collections refreshed');
}
