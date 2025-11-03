/**
 * Command registration module
 * Centralizes all VS Code command registrations
 */

import * as vscode from 'vscode';
import { Services } from './servicesSetup';
import { NoteItem, ConnectionItem, TagItem } from '../providers/treeItems';
import { showCalendarView } from '../calendar/calendarView';
import { showGraphView } from '../graph/graphView';
import { showMarkdownPreview } from '../preview/markdownPreview';
import { clearPathResolutionCache } from '../features/preview/wikilink-embed';
import { isValidCustomFolderName, isYearFolder, isMonthFolder } from '../utils/validators';
import { getAllFolders } from '../utils/folderHelpers';

// Import command handlers
import * as commands from '../commands/commands';
import * as tagCommands from '../commands/tagCommands';
import * as bulkCommands from '../commands/bulkCommands';
import * as undoCommands from '../commands/undoCommands';
import * as collectionCommands from '../commands/collectionCommands';
import * as diagramCommands from '../commands/diagramCommands';
import * as connectionCommands from '../commands/connectionCommands';
import * as linkCommands from '../commands/linkCommands';
import * as noteCommands from '../commands/noteCommands';
import * as templateCommands from '../commands/templateCommands';

/**
 * Register all commands
 */
export function registerCommands(context: vscode.ExtensionContext, services: Services): void {
    const {
        notesProvider,
        journalProvider,
        templatesProvider,
        tagsProvider,
        connectionsProvider,
        orphansProvider,
        placeholdersProvider,
        collectionsProvider,
        diagramsProvider,
        tagService,
        linkService,
        connectionsService,
        backlinksAppendService,
        orphansService,
        placeholdersService,
        smartCollectionsService,
        embedService,
        diagramService,
        pinnedNotesService,
        archiveService,
        bulkOperationsService,
        undoService,
        markdownToolbarService,
        notesTreeView,
        journalTreeView,
        templatesTreeView,
        tagsTreeView,
        connectionsTreeView,
        orphansTreeView,
        placeholdersTreeView,
        collectionsTreeView,
        diagramsTreeView
    } = services;

    // Helper to refresh all tree providers
    const refreshAllProviders = () => {
        notesProvider.refresh();
        journalProvider.refresh();
        templatesProvider.refresh();
    };

    // Set refresh callback for commands.ts handlers
    commands.setRefreshCallback(refreshAllProviders);

    // Helper to update connections panel
    const updateConnectionsPanel = async (editor: vscode.TextEditor | undefined) => {
        await connectionsProvider.updateForNote(editor);
    };

    // ============================================================================
    // Core Note Commands
    // ============================================================================

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.openToday', async () => {
            await commands.handleOpenToday();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.openWithTemplate', async (templateType?: string) => {
            await commands.handleOpenWithTemplate(templateType);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.createQuickNote', async () => {
            await commands.handleOpenWithTemplate('quick');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.createCategoryNote', async (templateType: string) => {
            await commands.handleCreateCategoryNote(templateType);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.openNote', async (filePath: string) => {
            await commands.handleOpenNote(filePath);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.insertTimestamp', async () => {
            await commands.handleInsertTimestamp();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.extractSelectionToNote', async () => {
            await commands.handleExtractSelectionToNote();
        })
    );

    // ============================================================================
    // Note Management Commands (with Undo)
    // ============================================================================

    const treeViews = [
        notesTreeView,
        journalTreeView,
        templatesTreeView,
        connectionsTreeView,
        orphansTreeView,
        placeholdersTreeView
    ];

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.deleteNote', async (item?: NoteItem) => {
            await noteCommands.handleDeleteNoteWithUndo(
                item,
                undoService,
                treeViews,
                refreshAllProviders
            );
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.deleteCurrentNote', async () => {
            await noteCommands.handleDeleteCurrentNote(undoService, refreshAllProviders);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.renameNote', async (item: NoteItem) => {
            await noteCommands.handleRenameNoteWithUndo(
                item,
                undoService,
                refreshAllProviders
            );
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.duplicateNote', async (item: NoteItem) => {
            await noteCommands.handleDuplicateNote(item, refreshAllProviders);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.moveNote', async (item: NoteItem) => {
            await noteCommands.handleMoveNoteWithUndo(
                item,
                undoService,
                getAllFolders,
                refreshAllProviders
            );
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.copyPath', async (item: NoteItem) => {
            await commands.handleCopyPath(item);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.revealInExplorer', async (item: NoteItem) => {
            await commands.handleRevealInExplorer(item);
        })
    );

    // ============================================================================
    // Folder Commands
    // ============================================================================

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.createFolder', async () => {
            await commands.handleCreateFolder();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.renameFolder', async (item: NoteItem) => {
            await noteCommands.handleRenameFolderWithUndo(
                item,
                undoService,
                isValidCustomFolderName,
                isYearFolder,
                isMonthFolder,
                refreshAllProviders
            );
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.deleteFolder', async (item: NoteItem) => {
            await noteCommands.handleDeleteFolderWithUndo(
                item,
                undoService,
                refreshAllProviders
            );
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.moveNotesFolder', async () => {
            await commands.handleMoveNotesFolder();
        })
    );

    // ============================================================================
    // Template Commands
    // ============================================================================

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.createCustomTemplate', async () => {
            await commands.handleCreateCustomTemplate();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.editCustomTemplate', async () => {
            await templateCommands.handleEditCustomTemplate();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.deleteCustomTemplate', async () => {
            await templateCommands.handleDeleteCustomTemplate();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.duplicateCustomTemplate', async () => {
            await templateCommands.handleDuplicateCustomTemplate();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.previewTemplateVariables', async () => {
            await templateCommands.handlePreviewTemplateVariables();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.openTemplatesFolder', async () => {
            await commands.handleOpenTemplatesFolder();
        })
    );

    // ============================================================================
    // Link and Connection Commands
    // ============================================================================

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.createNoteFromPlaceholder', async (linkText: string) => {
            await linkCommands.handleCreateNoteFromPlaceholder(linkText, refreshAllProviders);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.openPlaceholderSource', async (filePath: string, lineNumber: number) => {
            await linkCommands.handleOpenPlaceholderSource(filePath, lineNumber);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.createNoteFromLink', async (linkText: string) => {
            await linkCommands.handleCreateNoteFromLink(linkText, refreshAllProviders);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.openLinkWithSection', async (filePath: string, sectionName: string) => {
            await linkCommands.handleOpenLinkWithSection(filePath, sectionName);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.refreshConnections', async () => {
            await connectionCommands.handleRefreshConnections(linkService, updateConnectionsPanel);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.openConnection', async (connectionItem: ConnectionItem) => {
            await connectionCommands.handleOpenConnection(connectionItem);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.openConnectionSource', async (connectionItem: ConnectionItem) => {
            await connectionCommands.handleOpenConnectionSource(connectionItem);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.refreshOrphans', async () => {
            await connectionCommands.handleRefreshOrphans(orphansProvider);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.refreshPlaceholders', async () => {
            await connectionCommands.handleRefreshPlaceholders(placeholdersProvider);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.renameSymbol', async () => {
            await commands.handleRenameSymbol(linkService);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.rebuildBacklinks', async () => {
            await linkService.buildBacklinksIndex();
            await backlinksAppendService.rebuildAllBacklinks();
            vscode.window.showInformationMessage('Backlinks rebuilt for all notes');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.clearBacklinks', async () => {
            const confirm = await vscode.window.showWarningMessage(
                'Remove all backlinks sections from notes?',
                { modal: true },
                'Clear All',
                'Cancel'
            );

            if (confirm === 'Clear All') {
                await backlinksAppendService.clearAllBacklinks();
                vscode.window.showInformationMessage('All backlinks sections cleared');
            }
        })
    );

    // ============================================================================
    // Tag Commands
    // ============================================================================

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.filterByTag', async (item?: TagItem) => {
            if (item && item.tag) {
                tagService.addFilter(item.tag.name);
            } else {
                const allTags = tagService.getAllTags();
                if (allTags.length === 0) {
                    vscode.window.showInformationMessage('No tags found in notes');
                    return;
                }

                const items = allTags.map(tag => ({
                    label: tag.displayName,
                    description: `${tag.count} note${tag.count > 1 ? 's' : ''}`,
                    tag: tag.name
                }));

                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: 'Select tag to filter by'
                });

                if (selected) {
                    tagService.addFilter(selected.tag);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.clearTagFilters', () => {
            tagService.clearFilters();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.refreshTags', () => {
            tagService.loadTags();
            tagsProvider.refresh();
            vscode.window.showInformationMessage('Tags refreshed');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.renameTag', async (item?: TagItem) => {
            await tagCommands.renameTag(tagService, item);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.mergeTags', async () => {
            await tagCommands.mergeTags(tagService);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.deleteTag', async (item?: TagItem) => {
            await tagCommands.deleteTag(tagService, item);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.exportTags', async () => {
            await tagCommands.exportTags(tagService);
        })
    );

    // ============================================================================
    // Bulk Operations Commands
    // ============================================================================

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.toggleSelectMode', async () => {
            await bulkCommands.handleToggleSelectMode(bulkOperationsService, notesProvider);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.toggleNoteSelection', async (item: NoteItem) => {
            await bulkCommands.handleToggleNoteSelection(bulkOperationsService, notesProvider, item);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.selectAllNotes', async () => {
            await bulkCommands.handleSelectAllNotes(bulkOperationsService, notesProvider);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.clearSelection', async () => {
            await bulkCommands.handleClearSelection(bulkOperationsService, notesProvider);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.bulkDelete', async () => {
            await bulkCommands.handleBulkDelete(bulkOperationsService, notesProvider, undoService);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.bulkMove', async () => {
            await bulkCommands.handleBulkMove(bulkOperationsService, notesProvider);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.bulkArchive', async () => {
            await bulkCommands.handleBulkArchive(bulkOperationsService, notesProvider, archiveService);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.bulkMerge', async () => {
            await bulkCommands.handleBulkMerge(bulkOperationsService, notesProvider);
        })
    );

    // ============================================================================
    // Undo/Redo Commands
    // ============================================================================

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.undo', async () => {
            await undoCommands.handleUndo(undoService, notesProvider);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.redo', async () => {
            await undoCommands.handleRedo(undoService, notesProvider);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.showUndoHistory', async () => {
            await undoCommands.handleShowUndoHistory(undoService);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.clearUndoHistory', async () => {
            await undoCommands.handleClearUndoHistory(undoService);
        })
    );

    // ============================================================================
    // Collection Commands
    // ============================================================================

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.createCollection', () =>
            collectionCommands.handleCreateCollection(smartCollectionsService, collectionsProvider)
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.createCollectionFromSearch', (query?: string) =>
            collectionCommands.handleCreateCollectionFromSearch(smartCollectionsService, collectionsProvider, query)
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.editCollection', (collectionId?: string) =>
            collectionCommands.handleEditCollection(smartCollectionsService, collectionsProvider, collectionId)
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.deleteCollection', (collectionId?: string) =>
            collectionCommands.handleDeleteCollection(smartCollectionsService, collectionsProvider, collectionId)
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.runCollection', (collectionId?: string) =>
            collectionCommands.handleRunCollection(smartCollectionsService, collectionId)
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.togglePinCollection', (collectionId?: string) =>
            collectionCommands.handleTogglePinCollection(smartCollectionsService, collectionsProvider, collectionId)
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.duplicateCollection', (collectionId?: string) =>
            collectionCommands.handleDuplicateCollection(smartCollectionsService, collectionsProvider, collectionId)
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.refreshCollections', () =>
            collectionCommands.handleRefreshCollections(collectionsProvider)
        )
    );

    // ============================================================================
    // Diagram Commands
    // ============================================================================

    diagramCommands.registerDiagramCommands(context, diagramService, diagramsProvider);

    // ============================================================================
    // View Commands
    // ============================================================================

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.showCalendar', async () => {
            await showCalendarView(context);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.showGraph', async () => {
            await showGraphView(context, linkService);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.showPreview', async () => {
            await showMarkdownPreview(context);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.showMarkdownToolbar', async () => {
            await markdownToolbarService.show();
        })
    );

    // ============================================================================
    // Utility Commands
    // ============================================================================

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.refresh', () => {
            refreshAllProviders();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.searchNotes', async () => {
            await commands.handleSearchNotes();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.quickSwitcher', async () => {
            await commands.handleQuickSwitcher();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.showStats', async () => {
            await commands.handleShowStats();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.exportNotes', async () => {
            await commands.handleExportNotes();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.changeFormat', async () => {
            await commands.handleChangeFormat();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.showConfig', async () => {
            await commands.handleShowConfig();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.setupDefaultFolder', async () => {
            await commands.handleSetupDefaultFolder();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('noted.setupCustomFolder', async () => {
            await commands.handleSetupCustomFolder();
        })
    );

    // ============================================================================
    // Event Listeners
    // ============================================================================

    // Update connections panel when active editor changes
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(async (editor) => {
            await updateConnectionsPanel(editor);
        })
    );

    // Update connections panel and backlinks when document is saved
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(async (document) => {
            // Update connections panel
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document === document) {
                await updateConnectionsPanel(editor);
            }

            // Update backlinks if auto-backlinks is enabled
            const config = vscode.workspace.getConfiguration('noted');
            const autoBacklinks = config.get<boolean>('autoBacklinks', true);
            if (autoBacklinks) {
                await backlinksAppendService.updateBacklinksForLinkedNotes(document.uri.fsPath);
            }

            // Refresh providers
            refreshAllProviders();
            orphansProvider.refresh();
            placeholdersProvider.refresh();
            tagsProvider.refresh();
        })
    );

    // Refresh on configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('noted')) {
                refreshAllProviders();
                clearPathResolutionCache();
            }
        })
    );
}
