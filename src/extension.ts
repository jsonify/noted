import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsp } from 'fs';
import * as os from 'os';
import { showCalendarView } from './calendar/calendarView';
import { showGraphView } from './graph/graphView';
import { showActivityView } from './activity/activityView';
import { showTemplateBrowser } from './templates/templateBrowserView';
import { showChangelogView } from './version/changelogView';
import { MarkdownToolbarService } from './services/markdownToolbarService';
import { TagService } from './services/tagService';
import { TagRenameProvider } from './services/tagRenameProvider';
import { TagEditService } from './services/tagEditService';
import { renameTag, mergeTags, deleteTag, exportTags } from './commands/tagCommands';
import { NotesTreeProvider } from './providers/notesTreeProvider';
import { JournalTreeProvider } from './providers/journalTreeProvider';
import { TemplatesTreeProvider } from './providers/templatesTreeProvider';
import { TagsTreeProvider } from './providers/tagsTreeProvider';
import { ConnectionsTreeProvider } from './providers/connectionsTreeProvider';
import { OrphansTreeProvider } from './providers/orphansTreeProvider';
import { PlaceholdersTreeProvider } from './providers/placeholdersTreeProvider';
import { CollectionsTreeProvider } from './providers/collectionsTreeProvider';
import { TreeItem, NoteItem, SectionItem, TagItem, TagFileItem, TagReferenceItem, ConnectionItem } from './providers/treeItems';
import { TagCompletionProvider } from './services/tagCompletionProvider';
import { LinkService } from './services/linkService';
import { ConnectionsService } from './services/connectionsService';
import { BacklinksAppendService } from './services/backlinksAppendService';
import { OrphansService } from './services/orphansService';
import { PlaceholdersService } from './services/placeholdersService';
import { SmartCollectionsService } from './services/smartCollectionsService';
import { EmbedService } from './services/embedService';
import { FileWatcherService } from './services/fileWatcherService';
import { DiagramService } from './services/diagramService';
import { DiagramsTreeProvider } from './providers/diagramsTreeProvider';
import { registerDiagramCommands } from './commands/diagramCommands';
import * as collectionCommands from './commands/collectionCommands';
import { NoteLinkProvider } from './providers/noteLinkProvider';
import { BacklinkHoverProvider } from './providers/backlinkHoverProvider';
import { NotePreviewHoverProvider } from './providers/notePreviewHoverProvider';
import { EmbedHoverProvider } from './providers/embedHoverProvider';
import { SummaryHoverProvider } from './providers/summaryHoverProvider';
import { EmbedDecoratorProvider } from './providers/embedDecoratorProvider';
import { LinkCompletionProvider } from './providers/linkCompletionProvider';
import { LinkDiagnosticsProvider, LinkCodeActionProvider } from './providers/linkDiagnosticsProvider';
import { PinnedNotesService } from './services/pinnedNotesService';
import { ArchiveService } from './services/archiveService';
import { BulkOperationsService } from './services/bulkOperationsService';
import {
    handleToggleSelectMode,
    handleToggleNoteSelection,
    handleSelectAllNotes,
    handleClearSelection,
    handleBulkDelete,
    handleBulkMove,
    handleBulkArchive,
    handleBulkMerge
} from './commands/bulkCommands';
import { UndoService } from './services/undoService';
import { SummarizationService } from './services/summarizationService';
import { AutoTagService } from './services/autoTagService';
import {
    trackDeleteNote,
    trackDeleteFolder,
    trackRenameNote,
    trackRenameFolder,
    trackMoveNote,
    trackArchiveNote,
    trackTagOperation
} from './services/undoHelpers';
import {
    handleUndo,
    handleRedo,
    handleShowUndoHistory,
    handleClearUndoHistory
} from './commands/undoCommands';
import { SummarizationCommands } from './commands/summarizationCommands';
import {
    handleSuggestTags
} from './commands/autoTagCommands';
import {
    handleSelectAIModel
} from './commands/aiCommands';
import {
    handleCreateTemplateWithAI,
    handleEnhanceTemplate,
    handleMigrateTemplates,
    handleCreateUserStoryWithAI
} from './commands/templateCommands';
import {
    handleCreateBundle,
    handleCreateBundleFromTemplates,
    handleEditBundle,
    handleDeleteBundle
} from './commands/bundleCommands';
import { logger, LogLevel } from './services/logService';
import {
    handleCreatePromptTemplate,
    handleEditPromptTemplate,
    handleDeletePromptTemplate,
    handleDuplicatePromptTemplate,
    handleListPromptTemplates,
    handleViewTemplateVariables
} from './commands/promptTemplateCommands';
import {
    handleShowSummaryHistory,
    handleCompareSummaries,
    handleRestoreSummaryVersion,
    handleClearSummaryHistory,
    handleShowSummaryHistoryStats
} from './commands/summaryHistoryCommands';
import {
    handleCreateHierarchicalNote,
    handleOpenHierarchicalNote,
    handleSearchHierarchicalNotes
} from './commands/hierarchicalCommands';
import { markdownItWikilinkEmbed, warmUpPathCache, clearPathResolutionCache } from './features/preview/wikilink-embed';
import { showMarkdownPreview } from './preview/markdownPreview';
import { FOLDER_PATTERNS, SPECIAL_FOLDERS, MONTH_NAMES, SUPPORTED_EXTENSIONS, getDocumentSelector } from './constants';
import { showModalWarning, showModalInfo, StandardButtons, StandardDetails } from './utils/dialogHelpers';

export function activate(context: vscode.ExtensionContext) {
    // Initialize logger and add to subscriptions for proper disposal
    const config = vscode.workspace.getConfiguration('noted');
    const debugMode = config.get<boolean>('debug', false);
    if (debugMode) {
        logger.setMinLogLevel(LogLevel.Debug);
    }
    context.subscriptions.push(logger);

    logger.info('Noted extension activated');
    logger.debug('Configuration loaded', { notesFolder: config.get('notesFolder') });
    const notesFolder = config.get<string>('notesFolder', 'Notes');
    const workspaceFolders = vscode.workspace.workspaceFolders;

    // Check if notes folder is configured
    initializeNotesFolder();

    // Create tree data provider for main notes view
    const notesProvider = new NotesTreeProvider();
    const notesTreeView = vscode.window.createTreeView('notedView', {
        treeDataProvider: notesProvider,
        dragAndDropController: notesProvider
    });
    context.subscriptions.push(notesTreeView);

    // Create tree data provider for journal view (daily notes)
    const journalProvider = new JournalTreeProvider();
    const journalTreeView = vscode.window.createTreeView('notedJournalView', {
        treeDataProvider: journalProvider
    });
    context.subscriptions.push(journalTreeView);

    // Create tree data provider for templates view (empty, uses viewsWelcome)
    const templatesProvider = new TemplatesTreeProvider();
    templatesProvider.setContext(context); // Set context for version info
    const templatesTreeView = vscode.window.createTreeView('notedTemplatesView', {
        treeDataProvider: templatesProvider
    });
    context.subscriptions.push(templatesTreeView);

    // Initialize tag service for tag filtering
    const notesPath = getNotesPath();
    const tagService = new TagService(notesPath || '');

    // Initialize tag edit service for advanced tag operations
    const tagEditService = new TagEditService(tagService);

    // Build tag index on activation (async, non-blocking)
    if (notesPath) {
        tagService.buildTagIndex().catch(() => {
            // Error building tag index
        });
    }

    // Create tree data provider for tags view
    const tagsProvider = new TagsTreeProvider(tagService);
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('notedTagsView', tagsProvider)
    );

    // Register tag completion provider
    const tagAutoComplete = config.get<boolean>('tagAutoComplete', true);
    if (tagAutoComplete) {
        const tagCompletionProvider = new TagCompletionProvider(tagService);
        const completionDisposable = vscode.languages.registerCompletionItemProvider(
            getDocumentSelector(),
            tagCompletionProvider,
            '#'
        );
        context.subscriptions.push(completionDisposable);
    }

    // Register tag rename provider for F2 rename support
    const tagRenameProvider = new TagRenameProvider(tagService, tagEditService);
    const tagRenameDisposable = vscode.languages.registerRenameProvider(
        getDocumentSelector(),
        tagRenameProvider
    );
    context.subscriptions.push(tagRenameDisposable);

    // Initialize link service for wiki-style links
    const linkService = new LinkService(notesPath || '');

    // Build backlinks index on activation (async, non-blocking)
    if (notesPath) {
        linkService.buildBacklinksIndex().catch(() => {
            // Error building backlinks index
        });
    }

    // Initialize backlinks append service for automatic backlink sections
    const backlinksAppendService = new BacklinksAppendService(linkService);

    // Register document link provider for clickable [[note-name]] links
    const linkProvider = new NoteLinkProvider(linkService);
    const linkProviderDisposable = vscode.languages.registerDocumentLinkProvider(
        getDocumentSelector(),
        linkProvider
    );
    context.subscriptions.push(linkProviderDisposable);

    // Register hover provider for backlinks
    const backlinkHoverProvider = new BacklinkHoverProvider(linkService);
    const hoverProviderDisposable = vscode.languages.registerHoverProvider(
        getDocumentSelector(),
        backlinkHoverProvider
    );
    context.subscriptions.push(hoverProviderDisposable);

    // Register hover provider for note content previews
    const notePreviewHoverProvider = new NotePreviewHoverProvider(linkService);
    const notePreviewHoverDisposable = vscode.languages.registerHoverProvider(
        getDocumentSelector(),
        notePreviewHoverProvider
    );
    context.subscriptions.push(notePreviewHoverDisposable);

    // Initialize embed service for note embeds with section support
    let embedService: EmbedService | undefined;
    try {
        if (!linkService) {
            throw new Error('LinkService is not initialized');
        }
        embedService = new EmbedService(linkService);

        // Warm up path cache for markdown preview
        warmUpPathCache(embedService).catch(() => {
            // Failed to warm up path cache
        });
    } catch (error) {
        vscode.window.showWarningMessage(
            'Noted: Failed to initialize embed service. Embedded content features may not work correctly.'
        );
        // embedService remains undefined, features will gracefully degrade
    }

    // Register hover provider for embeds (only if embedService is available)
    if (embedService) {
        const embedHoverProvider = new EmbedHoverProvider(embedService);
        const embedHoverDisposable = vscode.languages.registerHoverProvider(
            getDocumentSelector(),
            embedHoverProvider
        );
        context.subscriptions.push(embedHoverDisposable);

        // Register embed decorator provider for inline rendering
        const embedDecoratorProvider = new EmbedDecoratorProvider(embedService);
        context.subscriptions.push(embedDecoratorProvider);

        // Create file watcher service for transclusion (live-updating embeds)
        const fileWatcherService = new FileWatcherService();
        context.subscriptions.push(fileWatcherService);

        // Track which files we're currently watching for transclusion
        const watchedFilesForTransclusion = new Set<string>();

        // Update embed decorations when editor changes
        const updateEmbedDecorations = async (editor: vscode.TextEditor | undefined) => {
            if (editor && (editor.document.languageId === 'plaintext' || editor.document.languageId === 'markdown')) {
                try {
                    await embedDecoratorProvider.updateDecorations(editor);

                    // Get the embedded sources for this document
                    const embeddedSources = embedService.getEmbeddedSources(editor.document.uri.toString());

                    // Start watching new embedded source files for changes (transclusion)
                    for (const sourcePath of embeddedSources) {
                        if (!watchedFilesForTransclusion.has(sourcePath)) {
                            fileWatcherService.watchFile(sourcePath);
                            watchedFilesForTransclusion.add(sourcePath);
                        }
                    }
                } catch (err) {
                    // Error updating embed decorations
                }
            }
        };

        // Listen for changes to watched source files (transclusion)
        context.subscriptions.push(
            fileWatcherService.onDidChangeFile(async (uri) => {
                // Clear markdown preview path cache for this file
                clearPathResolutionCache();

                // Find all documents that embed this source file
                const documentsToRefresh = embedService.getDocumentsEmbeddingSource(uri.fsPath);

                // Refresh decorations for each document that embeds this source
                for (const documentUri of documentsToRefresh) {
                    await embedDecoratorProvider.refreshDecorationsForDocument(vscode.Uri.parse(documentUri));
                }
            })
        );

        // Update decorations for active editor
        updateEmbedDecorations(vscode.window.activeTextEditor);

        // Update decorations when active editor changes
        context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor(updateEmbedDecorations)
        );

        // Update decorations when document is edited
        context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument(event => {
                if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
                    updateEmbedDecorations(vscode.window.activeTextEditor);
                }
            })
        );

        // Update decorations when document is saved
        context.subscriptions.push(
            vscode.workspace.onDidSaveTextDocument(document => {
                if (vscode.window.activeTextEditor && document === vscode.window.activeTextEditor.document) {
                    updateEmbedDecorations(vscode.window.activeTextEditor);
                }
            })
        );
    }

    // Register completion provider for note links
    const linkCompletionProvider = new LinkCompletionProvider(linkService, notesPath || '');
    const linkCompletionDisposable = vscode.languages.registerCompletionItemProvider(
        getDocumentSelector(),
        linkCompletionProvider,
        '[', '/' // Trigger on [[ and / for path completion
    );
    context.subscriptions.push(linkCompletionDisposable);

    // Register diagnostics provider for links (ambiguous/broken link warnings)
    const linkDiagnosticsProvider = new LinkDiagnosticsProvider(linkService, notesPath || '');
    context.subscriptions.push(linkDiagnosticsProvider);

    // Update diagnostics when document is opened or changed
    const updateDiagnostics = (document: vscode.TextDocument) => {
        linkDiagnosticsProvider.updateDiagnostics(document).catch(() => {
            // Error updating link diagnostics
        });
    };

    // Update diagnostics for all open documents
    vscode.workspace.textDocuments.forEach(updateDiagnostics);

    // Update diagnostics when document is opened
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(updateDiagnostics)
    );

    // Update diagnostics when document is saved
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(updateDiagnostics)
    );

    // Register code action provider for quick fixes
    const linkCodeActionProvider = new LinkCodeActionProvider(linkService, notesPath || '');
    const codeActionDisposable = vscode.languages.registerCodeActionsProvider(
        getDocumentSelector(),
        linkCodeActionProvider,
        {
            providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
        }
    );
    context.subscriptions.push(codeActionDisposable);

    // Initialize connections service and provider
    const connectionsService = new ConnectionsService(linkService);
    const connectionsProvider = new ConnectionsTreeProvider(connectionsService);
    const connectionsTreeView = vscode.window.createTreeView('notedConnectionsView', {
        treeDataProvider: connectionsProvider
    });
    context.subscriptions.push(connectionsTreeView);

    // Initialize orphans service and provider
    const orphansService = new OrphansService(linkService);
    const orphansProvider = new OrphansTreeProvider(orphansService);
    const orphansTreeView = vscode.window.createTreeView('notedOrphansView', {
        treeDataProvider: orphansProvider
    });
    context.subscriptions.push(orphansTreeView);

    // Initialize placeholders service and provider
    const placeholdersService = new PlaceholdersService(linkService);
    const placeholdersProvider = new PlaceholdersTreeProvider(placeholdersService);
    const placeholdersTreeView = vscode.window.createTreeView('notedPlaceholdersView', {
        treeDataProvider: placeholdersProvider
    });
    context.subscriptions.push(placeholdersTreeView);

    // Initialize smart collections service and provider
    const smartCollectionsService = new SmartCollectionsService(context);
    const collectionsProvider = new CollectionsTreeProvider(smartCollectionsService);
    const collectionsTreeView = vscode.window.createTreeView('notedCollectionsView', {
        treeDataProvider: collectionsProvider
    });
    context.subscriptions.push(collectionsTreeView);
    context.subscriptions.push(smartCollectionsService);

    // Initialize diagram service and diagrams tree provider
    // DiagramService now checks for workspace availability on-demand
    const diagramService = new DiagramService(context);
    const diagramsProvider = new DiagramsTreeProvider(diagramService);
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('notedDiagramsView', diagramsProvider)
    );

    // Register diagram commands
    registerDiagramCommands(context, diagramService, diagramsProvider);

    // Register smart collections commands
    context.subscriptions.push(
        vscode.commands.registerCommand('noted.createCollection', () =>
            collectionCommands.handleCreateCollection(smartCollectionsService)
        ),
        vscode.commands.registerCommand('noted.createCollectionFromSearch', (query?: string) =>
            collectionCommands.handleCreateCollectionFromSearch(smartCollectionsService, query)
        ),
        vscode.commands.registerCommand('noted.editCollection', (collectionId?: string) =>
            collectionCommands.handleEditCollection(smartCollectionsService, collectionId)
        ),
        vscode.commands.registerCommand('noted.deleteCollection', (collectionId?: string) =>
            collectionCommands.handleDeleteCollection(smartCollectionsService, collectionId)
        ),
        vscode.commands.registerCommand('noted.runCollection', (collectionId?: string) =>
            collectionCommands.handleRunCollection(smartCollectionsService, tagService, collectionId)
        ),
        vscode.commands.registerCommand('noted.togglePinCollection', (collectionId?: string) =>
            collectionCommands.handleTogglePinCollection(smartCollectionsService, collectionId)
        ),
        vscode.commands.registerCommand('noted.duplicateCollection', (collectionId?: string) =>
            collectionCommands.handleDuplicateCollection(smartCollectionsService, collectionId)
        ),
        vscode.commands.registerCommand('noted.refreshCollections', () =>
            collectionCommands.handleRefreshCollections(collectionsProvider)
        )
    );

    // Update connections panel when active editor changes
    const updateConnectionsPanel = async (editor: vscode.TextEditor | undefined) => {
        if (editor && notesPath && editor.document.uri.fsPath.startsWith(notesPath)) {
            // Only update if the editor is showing a note file
            const filePath = editor.document.uri.fsPath;
            await connectionsProvider.updateForNote(filePath);
        } else {
            // No active note or not in notes folder
            await connectionsProvider.updateForNote(null);
        }
    };

    // Update connections for initial active editor
    updateConnectionsPanel(vscode.window.activeTextEditor);

    // Update connections when active editor changes
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(updateConnectionsPanel)
    );

    // Update connections when document is saved (links may have changed)
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(async (document) => {
            // Only update index for note files in the notes folder
            const filePath = document.uri.fsPath;
            const isSupportedFile = SUPPORTED_EXTENSIONS.some(ext => filePath.endsWith(ext));

            if (isSupportedFile && notesPath && filePath.startsWith(notesPath)) {
                // Skip if this file is being processed by backlinks service (prevent circular updates)
                if (backlinksAppendService.isProcessing(filePath)) {
                    return;
                }

                // Incremental update: only re-index this specific file
                const oldOutgoingLinks = linkService.getOutgoingLinks(filePath);
                await linkService.updateIndexForFile(filePath);

                // Update backlinks sections if auto-backlinks is enabled
                const autoBacklinks = vscode.workspace.getConfiguration('noted').get<boolean>('autoBacklinks', true);
                if (autoBacklinks) {
                    await backlinksAppendService.updateBacklinksForLinkedNotes(filePath, oldOutgoingLinks);
                }

                // Update connections panel if this is the active editor
                if (vscode.window.activeTextEditor && document === vscode.window.activeTextEditor.document) {
                    await updateConnectionsPanel(vscode.window.activeTextEditor);
                }

                // Update tags index and refresh tags panel (tags may have changed)
                await tagService.updateIndexForFile(filePath);
                tagsProvider.softRefresh();
            }
        })
    );

    // Initialize pinned notes service
    const pinnedNotesService = new PinnedNotesService(context);
    notesProvider.setPinnedNotesService(pinnedNotesService);
    journalProvider.setPinnedNotesService(pinnedNotesService);
    templatesProvider.setPinnedNotesService(pinnedNotesService);

    // Initialize archive service
    const archiveService = new ArchiveService(notesPath || '');
    notesProvider.setArchiveService(archiveService);

    // Initialize bulk operations service
    const bulkOperationsService = new BulkOperationsService();
    notesProvider.setBulkOperationsService(bulkOperationsService);
    journalProvider.setBulkOperationsService(bulkOperationsService);
    templatesProvider.setBulkOperationsService(bulkOperationsService);

    // Initialize undo service for tracking destructive operations
    const undoService = new UndoService();

    // Set link service on undo service for proper link handling during undo/redo
    undoService.setLinkService(linkService);

    // Initialize AI summarization service
    const summarizationService = new SummarizationService(context, notesPath || undefined);

    // Initialize summarization command handlers
    const summarizationCommands = new SummarizationCommands(summarizationService, context, notesProvider);

    // Initialize auto-tagging service (Phase 4)
    const autoTagService = new AutoTagService();

    // Register hover provider for AI summary previews
    const summaryHoverProvider = new SummaryHoverProvider(linkService, summarizationService);
    const summaryHoverDisposable = vscode.languages.registerHoverProvider(
        getDocumentSelector(),
        summaryHoverProvider
    );
    context.subscriptions.push(summaryHoverDisposable);

    // Initialize markdown toolbar service for visual formatting buttons
    const markdownToolbarService = new MarkdownToolbarService(context);
    context.subscriptions.push(markdownToolbarService);

    // Helper function to refresh all tree providers
    const refreshAllProviders = () => {
        notesProvider.refresh();
        journalProvider.refresh();
        templatesProvider.refresh();
    };

    // Command to open today's note
    let openTodayNote = vscode.commands.registerCommand('noted.openToday', async () => {
        await openDailyNote();
        refreshAllProviders();
    });

    // Command to open with template
    let openWithTemplate = vscode.commands.registerCommand('noted.openWithTemplate', async (templateType?: string) => {
        // If no template type provided, show picker
        if (!templateType) {
            const customTemplates = await getCustomTemplates();
            const builtInTemplates = [
                { label: 'Problem/Solution', value: 'problem-solution', description: 'Document bugs and troubleshooting' },
                { label: 'Meeting', value: 'meeting', description: 'Organize meeting notes and action items' },
                { label: 'Research', value: 'research', description: 'Structure your research and findings' },
                { label: 'User Story', value: 'user-story', description: 'Agile user stories with tasks, criteria, and estimates' },
                { label: 'Quick', value: 'quick', description: 'Simple dated note' }
            ];

            const items = [
                // AI-enhanced option at the top
                {
                    label: '$(sparkle) User Story with AI',
                    description: 'AI-powered user story from brief description',
                    detail: 'AI-Enhanced',
                    value: '__ai_user_story__'
                },
                ...builtInTemplates.map(t => ({
                    label: t.label,
                    description: t.description,
                    detail: 'Built-in',
                    value: t.value
                })),
                ...customTemplates.map(t => ({
                    label: t,
                    description: 'Custom template',
                    detail: 'Custom',
                    value: t
                }))
            ];

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a template'
            });

            if (!selected) {
                return;
            }

            // Handle AI user story option
            if (selected.value === '__ai_user_story__') {
                await handleCreateUserStoryWithAI();
                refreshAllProviders();
                return;
            }

            templateType = selected.value;
        }

        await createNoteFromTemplate(templateType);
        refreshAllProviders();
    });

    // Command to create a quick note directly
    let createQuickNote = vscode.commands.registerCommand('noted.createQuickNote', async () => {
        console.log('========== NOTED.CREATEQUICKNOTE COMMAND TRIGGERED ==========');
        vscode.window.showInformationMessage('[DEBUG] createQuickNote command started!');
        await createNoteFromTemplate('quick');
        refreshAllProviders();
    });

    // Command to create category note
    let createCategoryNote = vscode.commands.registerCommand('noted.createCategoryNote', async (templateType: string) => {
        const { handleCreateCategoryNote } = await import('./commands/commands');
        await handleCreateCategoryNote(templateType);
    });

    // Command to insert timestamp
    let insertTimestamp = vscode.commands.registerCommand('noted.insertTimestamp', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const timestamp = new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, `[${timestamp}] `);
            });
        }
    });

    // Command to extract selection to new note
    let extractSelectionToNote = vscode.commands.registerCommand('noted.extractSelectionToNote', async () => {
        const { handleExtractSelectionToNote } = await import('./commands/commands');
        await handleExtractSelectionToNote();
    });

    // Command to change file format
    let changeFormat = vscode.commands.registerCommand('noted.changeFormat', async () => {
        const config = vscode.workspace.getConfiguration('noted');
        const currentFormat = config.get<string>('fileFormat', 'txt');
        const newFormat = currentFormat === 'txt' ? 'md' : 'txt';

        await config.update('fileFormat', newFormat, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Notes format changed to .${newFormat}`);
    });

    // Command to refresh notes view
    let refreshNotes = vscode.commands.registerCommand('noted.refresh', () => {
        refreshAllProviders();
    });

    // Command to refresh connections panel
    let refreshConnections = vscode.commands.registerCommand('noted.refreshConnections', async () => {
        // Rebuild backlinks index
        await linkService.buildBacklinksIndex();
        // Refresh the connections panel
        await updateConnectionsPanel(vscode.window.activeTextEditor);
        vscode.window.showInformationMessage('Connections refreshed');
    });

    // Command to open a connection (the connected note)
    let openConnection = vscode.commands.registerCommand('noted.openConnection', async (connectionItem: ConnectionItem) => {
        try {
            const document = await vscode.workspace.openTextDocument(connectionItem.targetPath);
            await vscode.window.showTextDocument(document);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open note: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // Command to open the source of a connection (navigate to the line where the link appears)
    let openConnectionSource = vscode.commands.registerCommand('noted.openConnectionSource', async (connectionItem: ConnectionItem) => {
        try {
            const document = await vscode.workspace.openTextDocument(connectionItem.sourcePath);
            const editor = await vscode.window.showTextDocument(document);

            // Navigate to the line where the connection appears
            const line = connectionItem.lineNumber;
            const position = new vscode.Position(line, 0);
            const range = new vscode.Range(position, position);

            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open source: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // Command to refresh orphans panel
    let refreshOrphans = vscode.commands.registerCommand('noted.refreshOrphans', async () => {
        orphansProvider.refresh();
        vscode.window.showInformationMessage('Orphans panel refreshed');
    });

    // Command to refresh placeholders panel
    let refreshPlaceholders = vscode.commands.registerCommand('noted.refreshPlaceholders', async () => {
        placeholdersProvider.refresh();
        vscode.window.showInformationMessage('Placeholders panel refreshed');
    });

    // Command to create note from placeholder
    let createNoteFromPlaceholder = vscode.commands.registerCommand('noted.createNoteFromPlaceholder', async (linkText: string) => {
        const notesPath = getNotesPath();
        if (!notesPath) {
            vscode.window.showErrorMessage('Notes folder not configured.');
            return;
        }

        try {
            // Ask user for confirmation
            const answer = await vscode.window.showInformationMessage(
                `Create new note "${linkText}"?`,
                'Create',
                'Cancel'
            );

            if (answer !== 'Create') {
                return;
            }

            // Get current date for folder structure
            const now = new Date();
            const year = now.getFullYear().toString();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const monthName = now.toLocaleString('en-US', { month: 'long' });
            const folderName = `${month}-${monthName}`;

            // Create folder structure if it doesn't exist
            const yearPath = path.join(notesPath, year);
            const monthPath = path.join(yearPath, folderName);

            if (!fs.existsSync(yearPath)) {
                fs.mkdirSync(yearPath, { recursive: true });
            }
            if (!fs.existsSync(monthPath)) {
                fs.mkdirSync(monthPath, { recursive: true });
            }

            // Get file format from config
            const config = vscode.workspace.getConfiguration('noted');
            const fileFormat = config.get<string>('fileFormat', 'md');

            // Create the note file
            const fileName = `${linkText}.${fileFormat}`;
            const filePath = path.join(monthPath, fileName);

            // Check if file already exists
            if (fs.existsSync(filePath)) {
                vscode.window.showWarningMessage(`Note "${linkText}" already exists.`);
                // Open the existing note
                const document = await vscode.workspace.openTextDocument(filePath);
                await vscode.window.showTextDocument(document);
                return;
            }

            // Create the file with basic content
            const content = `# ${linkText}\n\nCreated from placeholder link.\n`;
            fs.writeFileSync(filePath, content, 'utf8');

            // Refresh views
            notesProvider.refresh();
            placeholdersProvider.refresh();
            orphansProvider.refresh();

            // Open the new note
            const document = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(document);

            vscode.window.showInformationMessage(`Created note: ${linkText}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create note: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // Command to open placeholder source (navigate to the line where the placeholder appears)
    let openPlaceholderSource = vscode.commands.registerCommand('noted.openPlaceholderSource', async (filePath: string, lineNumber: number) => {
        try {
            const document = await vscode.workspace.openTextDocument(filePath);
            const editor = await vscode.window.showTextDocument(document);

            // Navigate to the line where the placeholder appears
            const position = new vscode.Position(lineNumber, 0);
            const range = new vscode.Range(position, position);

            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open source: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // Command to open tag reference (navigate to specific tag location with selection)
    let openTagReference = vscode.commands.registerCommand('noted.openTagReference', async (
        filePath: string,
        lineNumber: number,
        character: number,
        tagLength: number
    ) => {
        try {
            const document = await vscode.workspace.openTextDocument(filePath);
            const editor = await vscode.window.showTextDocument(document);

            // Create selection to highlight the tag
            const startPosition = new vscode.Position(lineNumber, character);
            const endPosition = new vscode.Position(lineNumber, character + tagLength);
            const range = new vscode.Range(startPosition, endPosition);

            editor.selection = new vscode.Selection(startPosition, endPosition);
            editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open tag reference: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // Command to open note from tree, with double-click detection
    const openNote = vscode.commands.registerCommand('noted.openNote', (() => {
        let lastClickedFile: string | null = null;
        let lastClickTime: number = 0;
        const DOUBLE_CLICK_THRESHOLD = 300; // milliseconds

        return async (filePath: string) => {
            const now = Date.now();
            const timeSinceLastClick = now - lastClickTime;
            const isDoubleClick = lastClickedFile === filePath && timeSinceLastClick < DOUBLE_CLICK_THRESHOLD;

            // Update tracking variables for the next click
            lastClickedFile = filePath;
            lastClickTime = now;

            const document = await vscode.workspace.openTextDocument(filePath);

            // Open in persistent mode (non-preview) if double-clicked, otherwise open in preview mode
            if (isDoubleClick) {
                await vscode.window.showTextDocument(document, { preview: false, preserveFocus: false });
            } else {
                await vscode.window.showTextDocument(document, { preview: true, preserveFocus: true });
            }
        };
    })());

    // Command to create a note from a link (used in hover preview for broken links)
    let createNoteFromLink = vscode.commands.registerCommand('noted.createNoteFromLink', async (linkText: string) => {
        const notesPath = getNotesPath();
        if (!notesPath) {
            vscode.window.showErrorMessage('Notes folder not configured.');
            return;
        }

        // Use the configured file format
        const config = vscode.workspace.getConfiguration('noted');
        const fileFormat = config.get<string>('fileFormat', 'txt');

        // Check if the link text is a date format (YYYY-MM-DD)
        const isDateLink = FOLDER_PATTERNS.DAILY_NOTE.test(linkText);

        // Check if it's a hierarchical note format (contains dots and matches pattern)
        const { isHierarchicalNote: checkHierarchical, validateHierarchicalName, normalizeHierarchicalName } = await import('./utils/hierarchicalHelpers');
        const isHierarchical = checkHierarchical(linkText + '.' + fileFormat);

        let noteFolder: string;
        let fileName: string;
        let dateForTemplate: Date;

        if (isDateLink) {
            // Date-formatted links go to date-based folders
            // Parse the date from the link text (YYYY-MM-DD)
            const [yearStr, monthStr, dayStr] = linkText.split('-');
            const year = parseInt(yearStr, 10);
            const monthNum = parseInt(monthStr, 10);
            const day = parseInt(dayStr, 10);

            // Validate the date to prevent issues with non-existent dates like 2025-02-30
            const parsedDate = new Date(year, monthNum - 1, day);
            const isValidDate = parsedDate.getFullYear() === year &&
                               parsedDate.getMonth() === monthNum - 1 &&
                               parsedDate.getDate() === day;

            if (isValidDate) {
                // Valid date - create in date-based folder
                const monthName = MONTH_NAMES[monthNum - 1]; // Month is 1-indexed, array is 0-indexed
                const folderName = `${monthStr}-${monthName}`;
                noteFolder = path.join(notesPath, yearStr, folderName);
                fileName = `${linkText}.${fileFormat}`;
                dateForTemplate = parsedDate;
            } else {
                // Invalid date (e.g., 2025-02-30) - treat as regular link and place in Inbox
                noteFolder = path.join(notesPath, SPECIAL_FOLDERS.INBOX);
                const sanitizedName = linkText.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
                fileName = `${sanitizedName}.${fileFormat}`;
                dateForTemplate = new Date();
            }
        } else if (isHierarchical) {
            // Hierarchical note - create in Hierarchical Notes folder
            const normalized = normalizeHierarchicalName(linkText);
            if (normalized) {
                const validation = validateHierarchicalName(normalized);
                if (validation.valid) {
                    noteFolder = path.join(notesPath, SPECIAL_FOLDERS.HIERARCHICAL);
                    fileName = `${normalized}.${fileFormat}`;
                    dateForTemplate = new Date();
                } else {
                    // Invalid hierarchical name - fall back to Inbox with sanitization
                    noteFolder = path.join(notesPath, SPECIAL_FOLDERS.INBOX);
                    const sanitizedName = linkText.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
                    fileName = `${sanitizedName}.${fileFormat}`;
                    dateForTemplate = new Date();
                }
            } else {
                // Couldn't normalize - fall back to Inbox
                noteFolder = path.join(notesPath, SPECIAL_FOLDERS.INBOX);
                const sanitizedName = linkText.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
                fileName = `${sanitizedName}.${fileFormat}`;
                dateForTemplate = new Date();
            }
        } else {
            // Regular links go to Inbox folder
            const sanitizedName = linkText.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
            noteFolder = path.join(notesPath, SPECIAL_FOLDERS.INBOX);
            fileName = `${sanitizedName}.${fileFormat}`;
            dateForTemplate = new Date();
        }

        const filePath = path.join(noteFolder, fileName);

        try {
            // Ensure folder exists
            try {
                await fsp.access(noteFolder);
            } catch {
                await fsp.mkdir(noteFolder, { recursive: true });
            }

            // Check if file already exists
            try {
                await fsp.access(filePath);
                const displayName = path.basename(fileName, path.extname(fileName));
                vscode.window.showInformationMessage(`Note already exists: ${displayName}`);
                const document = await vscode.workspace.openTextDocument(filePath);
                await vscode.window.showTextDocument(document);
                return;
            } catch {
                // File doesn't exist, which is what we want
            }

            // Create the note with a simple template
            const template = await generateTemplate('quick', dateForTemplate, fileName);
            await fsp.writeFile(filePath, template, 'utf8');

            // Open the new note
            const document = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(document);

            // Refresh the tree view
            refreshAllProviders();

            const displayName = path.basename(fileName, path.extname(fileName));
            vscode.window.showInformationMessage(`Created note: ${displayName}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create note: ${error}`);
        }
    });

    // Command to open a link with section reference (e.g., [[note#section]])
    let openLinkWithSection = vscode.commands.registerCommand('noted.openLinkWithSection', async (filePath: string, sectionName: string) => {
        try {
            // Open the document
            const document = await vscode.workspace.openTextDocument(filePath);
            const editor = await vscode.window.showTextDocument(document);

            // Find the section in the document
            const normalizedSection = sectionName.toLowerCase().trim();
            const headingRegex = /^(?:#{1,6}\s+(.+)|(.+):)$/;

            let targetLine = -1;

            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i).text;
                const trimmedLine = line.trim();

                const match = trimmedLine.match(headingRegex);
                if (match) {
                    // match[1] is for markdown headings, match[2] is for text-style headings
                    const headingText = (match[1] || match[2])?.trim().toLowerCase();
                    if (headingText === normalizedSection) {
                        targetLine = i;
                        break;
                    }
                }
            }

            if (targetLine !== -1) {
                // Jump to the section
                const position = new vscode.Position(targetLine, 0);
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(
                    new vscode.Range(position, position),
                    vscode.TextEditorRevealType.InCenter
                );
            } else {
                // Section not found - still open the file but show a message
                vscode.window.showWarningMessage(`Section "${sectionName}" not found in note`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open note: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // Command to delete note
    let deleteNote = vscode.commands.registerCommand('noted.deleteNote', async (item?: NoteItem) => {
        // If no item provided (keyboard shortcut), get from tree view selection
        if (!item) {
            // Try all tree views to find the active selection
            const treeViews = [
                notesTreeView,
                journalTreeView,
                templatesTreeView,
                connectionsTreeView,
                orphansTreeView,
                placeholdersTreeView
            ];

            for (const treeView of treeViews) {
                const selection = treeView.selection;
                if (selection && selection.length > 0 && selection[0] instanceof NoteItem) {
                    item = selection[0] as NoteItem;
                    break;
                }
            }

            if (!item) {
                vscode.window.showInformationMessage('Please select a note to delete');
                return;
            }
        }

        const answer = await showModalWarning(
            `Delete ${item.label}?`,
            { detail: StandardDetails.CannotUndo },
            StandardButtons.Delete,
            StandardButtons.Cancel
        );
        if (answer?.title === 'Delete') {
            try {
                // Track operation for undo BEFORE deleting
                await trackDeleteNote(undoService, item.filePath);

                await fsp.unlink(item.filePath);
                refreshAllProviders();
                vscode.window.showInformationMessage(`Deleted ${item.label} (Undo available)`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to delete note: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    });

    // Command to delete currently open note in editor
    let deleteCurrentNote = vscode.commands.registerCommand('noted.deleteCurrentNote', async () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showInformationMessage('No note is currently open');
            return;
        }

        const notesPath = getNotesPath();
        if (!notesPath) {
            vscode.window.showErrorMessage('Notes folder not configured');
            return;
        }

        const currentFilePath = activeEditor.document.uri.fsPath;

        // Check if the current file is within the notes folder
        if (!currentFilePath.startsWith(notesPath)) {
            vscode.window.showInformationMessage('Current file is not a note');
            return;
        }

        const fileName = path.basename(currentFilePath);
        const answer = await showModalWarning(
            `Delete ${fileName}?`,
            { detail: StandardDetails.CannotUndo },
            StandardButtons.Delete,
            StandardButtons.Cancel
        );

        if (answer?.title === 'Delete') {
            try {
                // Close the editor first
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

                // Track operation for undo BEFORE deleting
                await trackDeleteNote(undoService, currentFilePath);

                await fsp.unlink(currentFilePath);
                refreshAllProviders();
                vscode.window.showInformationMessage(`Deleted ${fileName} (Undo available)`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to delete note: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    });

    // Command to rename note
    let renameNote = vscode.commands.registerCommand('noted.renameNote', async (item: NoteItem) => {
        const newName = await vscode.window.showInputBox({
            prompt: 'Enter new name',
            value: item.label
        });
        if (newName && newName !== item.label) {
            try {
                const dir = path.dirname(item.filePath);
                const newPath = path.join(dir, newName);

                // Track operation for undo BEFORE renaming
                await trackRenameNote(undoService, item.filePath, newPath);

                // Update all links to this note before renaming
                const linkUpdateResult = await linkService.updateLinksOnRename(item.filePath, newPath);

                await fsp.rename(item.filePath, newPath);
                refreshAllProviders();

                // Show success message with link update info
                let message = `Renamed to ${newName} (Undo available)`;
                if (linkUpdateResult.linksUpdated > 0) {
                    message += ` - Updated ${linkUpdateResult.linksUpdated} link(s) in ${linkUpdateResult.filesUpdated} file(s)`;
                }
                vscode.window.showInformationMessage(message);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to rename note: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    });

    // Command to copy note path
    let copyPath = vscode.commands.registerCommand('noted.copyPath', async (item: NoteItem) => {
        await vscode.env.clipboard.writeText(item.filePath);
        vscode.window.showInformationMessage('Path copied to clipboard');
    });

    // Command to reveal in file explorer
    let revealInExplorer = vscode.commands.registerCommand('noted.revealInExplorer', async (item: NoteItem) => {
        await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(item.filePath));
    });

    // Command to pin/unpin note
    let togglePinNote = vscode.commands.registerCommand('noted.togglePinNote', async (item: NoteItem) => {
        try {
            const isPinned = await pinnedNotesService.togglePin(item.filePath);
            const message = isPinned ? `Pinned ${item.label}` : `Unpinned ${item.label}`;
            vscode.window.showInformationMessage(message);
            refreshAllProviders();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to toggle pin: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // Command to archive note
    let archiveNote = vscode.commands.registerCommand('noted.archiveNote', async (item: NoteItem) => {
        const answer = await showModalWarning(
            `Archive ${item.label}?`,
            { detail: StandardDetails.WillBeArchived },
            StandardButtons.Archive,
            StandardButtons.Cancel
        );
        if (answer?.title === 'Archive') {
            try {
                const destinationPath = await archiveService.archiveNote(item.filePath);

                if (destinationPath) {
                    // Track operation for undo AFTER archiving (since we need the destination path)
                    await trackArchiveNote(undoService, item.filePath, destinationPath);
                } else {
                    vscode.window.showErrorMessage(`Failed to archive ${item.label}`);
                    return;
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to archive note: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    });

    // Command to unarchive note
    let unarchiveNote = vscode.commands.registerCommand('noted.unarchiveNote', async (item: NoteItem) => {
        try {
            const destinationPath = await archiveService.unarchiveNote(item.filePath);

            // Track operation for undo (unarchive is also undoable - it archives again)
            await trackArchiveNote(undoService, destinationPath, item.filePath);

            refreshAllProviders();
            vscode.window.showInformationMessage(`Unarchived ${item.label} (Undo available)`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to unarchive note: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // Command to archive old notes
    let archiveOldNotes = vscode.commands.registerCommand('noted.archiveOldNotes', async () => {
        const daysInput = await vscode.window.showInputBox({
            prompt: 'Archive notes older than how many days?',
            placeHolder: '90',
            validateInput: (value) => {
                const num = parseInt(value);
                if (isNaN(num) || num <= 0) {
                    return 'Please enter a valid number greater than 0';
                }
                return null;
            }
        });

        if (!daysInput) {
            return;
        }

        const days = parseInt(daysInput);
        const answer = await showModalWarning(
            `Archive all notes older than ${days} days?`,
            { detail: StandardDetails.WillBeMovedToArchive },
            StandardButtons.Archive,
            StandardButtons.Cancel
        );

        if (answer?.title === 'Archive') {
            try {
                const count = await archiveService.archiveOldNotes(days);
                refreshAllProviders();
                vscode.window.showInformationMessage(`Archived ${count} note${count !== 1 ? 's' : ''}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to archive old notes: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    });

    // Command to rebuild backlinks index
    let rebuildBacklinks = vscode.commands.registerCommand('noted.rebuildBacklinks', async () => {
        try {
            await linkService.buildBacklinksIndex();

            // Also rebuild backlinks sections if auto-backlinks is enabled
            const autoBacklinks = vscode.workspace.getConfiguration('noted').get<boolean>('autoBacklinks', true);
            if (autoBacklinks && notesPath) {
                const updatedCount = await backlinksAppendService.rebuildAllBacklinks(notesPath);
                vscode.window.showInformationMessage(`Backlinks index rebuilt. Updated ${updatedCount} note(s) with backlinks sections.`);
            } else {
                vscode.window.showInformationMessage('Backlinks index rebuilt');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to rebuild backlinks: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // Command to clear all backlinks sections from notes
    let clearBacklinks = vscode.commands.registerCommand('noted.clearBacklinks', async () => {
        if (!notesPath) {
            vscode.window.showErrorMessage('Notes path not configured');
            return;
        }

        const confirmation = await vscode.window.showWarningMessage(
            'This will remove all backlinks sections from your notes. Continue?',
            { modal: true },
            'Yes', 'No'
        );

        if (confirmation !== 'Yes') {
            return;
        }

        try {
            const clearedCount = await backlinksAppendService.clearAllBacklinks(notesPath);
            vscode.window.showInformationMessage(`Cleared backlinks sections from ${clearedCount} note(s)`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to clear backlinks: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // Command to search notes with AI-powered smart search
    let searchNotes = vscode.commands.registerCommand('noted.searchNotes', async () => {
        const { SearchOrchestrator } = await import('./search/SearchOrchestrator');

        const query = await vscode.window.showInputBox({
            prompt: 'Search notes with AI-powered semantic search (try natural language!)',
            placeHolder: 'e.g., "bugs fixed last week" or "authentication issues" or "What did I work on yesterday?"',
            value: ''
        });

        if (!query || query.trim().length === 0) {
            return;
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Searching notes...',
                cancellable: true
            }, async (progress, token) => {
                const orchestrator = new SearchOrchestrator(tagService);

                const results = await orchestrator.search(query, {
                    progressCallback: (message, increment) => {
                        progress.report({ message, increment });
                    },
                    cancellationToken: token
                });

                if (results.length === 0) {
                    vscode.window.showInformationMessage('No results found. Try a different query or check your filters.');
                    return;
                }

                // Create enhanced quick pick items
                const items = results.map(r => {
                    const scorePercent = Math.round(r.score * 100);
                    const icon = r.matchType === 'semantic' || r.matchType === 'both' ? '$(sparkle)' : '$(search)';
                    const matchTypeLabel = r.matchType === 'both' ? 'Hybrid' :
                                          r.matchType === 'semantic' ? 'Semantic' : 'Keyword';

                    return {
                        label: `${icon} ${r.fileName}`,
                        description: `${scorePercent}% · ${matchTypeLabel}`,
                        detail: r.preview,
                        filePath: r.filePath,
                        score: r.score
                    };
                });

                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: `Found ${results.length} result(s) - sorted by relevance`,
                    matchOnDescription: true,
                    matchOnDetail: true
                });

                if (selected && selected.filePath) {
                    const document = await vscode.workspace.openTextDocument(selected.filePath);
                    await vscode.window.showTextDocument(document);
                }
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            // Check if it's a Copilot availability error
            if (errorMessage.includes('Copilot') || errorMessage.includes('LLM')) {
                vscode.window.showWarningMessage(
                    `Semantic search requires GitHub Copilot. Error: ${errorMessage}`
                );
            } else {
                vscode.window.showErrorMessage(`Search error: ${errorMessage}`);
            }
        }
    });

    // Command for quick switcher (recent notes)
    let quickSwitcher = vscode.commands.registerCommand('noted.quickSwitcher', async () => {
        const { getRecentNotes } = await import('./services/searchService');

        try {
            const results = await getRecentNotes(20);

            if (results.length === 0) {
                vscode.window.showInformationMessage('No recent notes found');
                return;
            }

            const items = results.map(r => {
                const fileName = path.basename(r.file);
                const tagInfo = r.tags.length > 0 ? ` [${r.tags.join(', ')}]` : '';
                const dateInfo = r.modified.toLocaleDateString();

                return {
                    label: fileName,
                    description: `${dateInfo}${tagInfo}`,
                    detail: r.preview,
                    filePath: r.file
                };
            });

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a recent note to open',
                matchOnDescription: true,
                matchOnDetail: true
            });

            if (selected && selected.filePath) {
                const document = await vscode.workspace.openTextDocument(selected.filePath);
                await vscode.window.showTextDocument(document);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Quick switcher error: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // Command to filter notes by tag (deprecated - use hierarchical tag view instead)
    let filterByTag = vscode.commands.registerCommand('noted.filterByTag', async (tagName?: string) => {
        vscode.window.showInformationMessage(
            'Tag filtering has been replaced with the hierarchical tag view. ' +
            'Use the Tags panel to browse tags → files → line references.'
        );
    });

    // Command to clear tag filters (deprecated - no longer needed)
    let clearTagFilters = vscode.commands.registerCommand('noted.clearTagFilters', () => {
        vscode.window.showInformationMessage(
            'Tag filtering has been removed. Use the hierarchical Tags panel for navigation.'
        );
    });

    // Command to toggle sorting tags by name (A-Z / Z-A)
    let sortTagsByName = vscode.commands.registerCommand('noted.sortTagsByName', () => {
        tagsProvider.toggleNameSort();
        const sortMode = tagsProvider.getSortMode();
        const message = sortMode === 'name-asc' ? 'Tags sorted A-Z' : 'Tags sorted Z-A';
        vscode.window.showInformationMessage(message);
    });

    // Command to toggle sorting tags by frequency (most/least frequent)
    let sortTagsByFrequency = vscode.commands.registerCommand('noted.sortTagsByFrequency', () => {
        tagsProvider.toggleFrequencySort();
        const sortMode = tagsProvider.getSortMode();
        const message = sortMode === 'frequency-desc'
            ? 'Tags sorted by frequency (most to least)'
            : 'Tags sorted by frequency (least to most)';
        vscode.window.showInformationMessage(message);
    });

    // Command to refresh tags
    let refreshTags = vscode.commands.registerCommand('noted.refreshTags', async () => {
        await tagsProvider.refresh();
        vscode.window.showInformationMessage('Tags refreshed');
    });

    // Command to search for a tag in workspace
    let searchTagCmd = vscode.commands.registerCommand('noted.searchTag', async (tagName?: string) => {
        // If no tag name provided, ask user to select from available tags
        if (!tagName) {
            const allTags = tagService.getAllTagLabels();
            if (allTags.length === 0) {
                vscode.window.showInformationMessage('No tags found in notes');
                return;
            }

            const selected = await vscode.window.showQuickPick(
                allTags.map(tag => ({ label: `#${tag}`, tag })),
                { placeHolder: 'Select a tag to search for' }
            );

            if (!selected) {
                return;
            }

            tagName = selected.tag;
        }

        const notesPath = getNotesPath() || undefined;
        await tagEditService.openWorkspaceSearch(tagName, notesPath);
    });

    // Command to rename a tag
    let renameTagCmd = vscode.commands.registerCommand('noted.renameTag', async () => {
        const notesPath = getNotesPath();
        if (!notesPath) {
            vscode.window.showErrorMessage('Notes folder not configured');
            return;
        }
        await renameTag(tagService, notesPath);
        await tagsProvider.refresh();
        refreshAllProviders();
    });

    // Command to merge tags
    let mergeTagsCmd = vscode.commands.registerCommand('noted.mergeTags', async () => {
        const notesPath = getNotesPath();
        if (!notesPath) {
            vscode.window.showErrorMessage('Notes folder not configured');
            return;
        }
        await mergeTags(tagService, notesPath);
        await tagsProvider.refresh();
        refreshAllProviders();
    });

    // Command to delete a tag
    let deleteTagCmd = vscode.commands.registerCommand('noted.deleteTag', async () => {
        const notesPath = getNotesPath();
        if (!notesPath) {
            vscode.window.showErrorMessage('Notes folder not configured');
            return;
        }
        await deleteTag(tagService, notesPath);
        await tagsProvider.refresh();
        refreshAllProviders();
    });

    // Command to export tags
    let exportTagsCmd = vscode.commands.registerCommand('noted.exportTags', async () => {
        await exportTags(tagService);
    });

    // Command to show stats
    let showStats = vscode.commands.registerCommand('noted.showStats', async () => {
        const stats = await getNoteStats();
        const message = `Total Notes: ${stats.total}\nThis Week: ${stats.thisWeek}\nThis Month: ${stats.thisMonth}`;
        vscode.window.showInformationMessage(message);
    });

    // Command to export notes
    let exportNotes = vscode.commands.registerCommand('noted.exportNotes', async () => {
        const { handleExportNotes } = await import('./commands/commands');
        await handleExportNotes(summarizationService);
    });

    // Command to move notes folder
    let moveNotesFolder = vscode.commands.registerCommand('noted.moveNotesFolder', async () => {
        await moveNotesFolderLocation();
        refreshAllProviders();
    });

    // Command to duplicate note
    let duplicateNote = vscode.commands.registerCommand('noted.duplicateNote', async (item: NoteItem) => {
        try {
            const content = await fsp.readFile(item.filePath, 'utf8');
            const dir = path.dirname(item.filePath);
            const ext = path.extname(item.label);
            const base = path.basename(item.label, ext);
            const newName = `${base}-copy${ext}`;
            const newPath = path.join(dir, newName);

            await fsp.writeFile(newPath, content);
            refreshAllProviders();
            vscode.window.showInformationMessage(`Duplicated as ${newName}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to duplicate note: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // Command to create custom folder
    let createFolder = vscode.commands.registerCommand('noted.createFolder', async () => {
        const notesPath = getNotesPath();
        if (!notesPath) {
            vscode.window.showErrorMessage('Please configure a notes folder first');
            return;
        }

        const folderName = await vscode.window.showInputBox({
            prompt: 'Enter folder name (will be created at root level)',
            placeHolder: 'my-folder',
            validateInput: (value) => {
                if (!isValidCustomFolderName(value)) {
                    if (!value || value.trim().length === 0) {
                        return 'Folder name cannot be empty';
                    }
                    if (isYearFolder(value) || isMonthFolder(value)) {
                        return 'Cannot use date patterns (YYYY or MM-MonthName) for custom folders';
                    }
                    return 'Invalid folder name (check for invalid characters)';
                }
                return null;
            }
        });

        if (!folderName) {
            return;
        }

        // Always create custom folders at root level
        const newFolderPath = path.join(notesPath, folderName);

        try {
            // Check if exists
            await fsp.access(newFolderPath);
            vscode.window.showErrorMessage('Folder already exists');
            return;
        } catch {
            // Folder doesn't exist, create it
            try {
                await fsp.mkdir(newFolderPath, { recursive: true });
                refreshAllProviders();
                vscode.window.showInformationMessage(`Created folder: ${folderName}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to create folder: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    });

    // Command to move note
    let moveNote = vscode.commands.registerCommand('noted.moveNote', async (item: NoteItem) => {
        const notesPath = getNotesPath();
        if (!notesPath || item.type !== 'note') {
            return;
        }

        try {
            // Get all available folders
            const folders = await getAllFolders(notesPath);

            if (folders.length === 0) {
                vscode.window.showInformationMessage('No folders available');
                return;
            }

            const items = folders.map(f => ({
                label: f.name,
                description: f.path,
                folder: f
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select destination folder'
            });

            if (!selected) {
                return;
            }

            const newPath = path.join(selected.folder.path, path.basename(item.filePath));

            try {
                await fsp.access(newPath);
                vscode.window.showErrorMessage('A file with this name already exists in the destination folder');
                return;
            } catch {
                // File doesn't exist, proceed with move
                // Track operation for undo BEFORE moving
                await trackMoveNote(undoService, item.filePath, newPath);

                await fsp.rename(item.filePath, newPath);
                refreshAllProviders();
                vscode.window.showInformationMessage(`Moved to ${selected.folder.name} (Undo available)`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to move note: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // Command to rename folder
    let renameFolder = vscode.commands.registerCommand('noted.renameFolder', async (item: NoteItem) => {
        if (item.type !== 'custom-folder') {
            vscode.window.showErrorMessage('Only custom folders can be renamed');
            return;
        }

        const newName = await vscode.window.showInputBox({
            prompt: 'Enter new folder name',
            value: item.label,
            validateInput: (value) => {
                if (!isValidCustomFolderName(value)) {
                    if (!value || value.trim().length === 0) {
                        return 'Folder name cannot be empty';
                    }
                    if (isYearFolder(value) || isMonthFolder(value)) {
                        return 'Cannot use date patterns (YYYY or MM-MonthName) for custom folders';
                    }
                    return 'Invalid folder name (check for invalid characters)';
                }
                return null;
            }
        });

        if (!newName || newName === item.label) {
            return;
        }

        const parentDir = path.dirname(item.filePath);
        const newPath = path.join(parentDir, newName);

        try {
            await fsp.access(newPath);
            vscode.window.showErrorMessage('A folder with this name already exists');
            return;
        } catch {
            // Folder doesn't exist, proceed with rename
            try {
                // Track operation for undo BEFORE renaming
                await trackRenameFolder(undoService, item.filePath, newPath);

                await fsp.rename(item.filePath, newPath);
                refreshAllProviders();
                vscode.window.showInformationMessage(`Renamed to ${newName} (Undo available)`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to rename folder: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    });

    // Command to delete folder
    let deleteFolder = vscode.commands.registerCommand('noted.deleteFolder', async (item: NoteItem) => {
        if (item.type !== 'custom-folder') {
            vscode.window.showErrorMessage('Only custom folders can be deleted');
            return;
        }

        const answer = await vscode.window.showWarningMessage(
            `Delete folder "${item.label}" and all its contents?`,
            { modal: true },
            'Delete',
            'Cancel'
        );

        if (answer !== 'Delete') {
            return;
        }

        try {
            // Track operation for undo BEFORE deleting
            await trackDeleteFolder(undoService, item.filePath);

            await fsp.rm(item.filePath, { recursive: true, force: true });
            refreshAllProviders();
            vscode.window.showInformationMessage(`Deleted folder: ${item.label} (Undo available)`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to delete folder: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // Command to show calendar view
    let showCalendar = vscode.commands.registerCommand('noted.showCalendar', async () => {
        await showCalendarView(context);
    });

    // Command to show graph view
    let showGraph = vscode.commands.registerCommand('noted.showGraph', async () => {
        await showGraphView(context, linkService);
    });

    // Command to show activity chart
    let showActivity = vscode.commands.registerCommand('noted.showActivity', async () => {
        await showActivityView(context, linkService, tagService);
    });

    // Command to show version changelog popup
    let showVersionChangelog = vscode.commands.registerCommand('noted.showVersionChangelog', async () => {
        await showChangelogView(context);
    });

    // Command to show the Noted output channel (for debugging)
    let showOutput = vscode.commands.registerCommand('noted.showOutput', () => {
        logger.show(false); // Show the output channel and focus it
    });

    // Command to show current notes folder configuration (for debugging)
    let showNotesConfig = vscode.commands.registerCommand('noted.showConfig', async () => {
        const config = vscode.workspace.getConfiguration('noted');
        const notesFolder = config.get<string>('notesFolder', 'Notes');
        const notesPath = getNotesPath();
        const isAbsolute = path.isAbsolute(notesFolder);

        let exists = false;
        if (notesPath) {
            try {
                await fsp.access(notesPath);
                exists = true;
            } catch {
                exists = false;
            }
        }

        const message = `Notes Configuration:\n\n` +
            `Config value: ${notesFolder}\n` +
            `Is absolute: ${isAbsolute}\n` +
            `Resolved path: ${notesPath}\n` +
            `Exists: ${exists}`;

        vscode.window.showInformationMessage(message, { modal: true });
    });

    // Command to setup default folder
    let setupDefaultFolder = vscode.commands.registerCommand('noted.setupDefaultFolder', async () => {
        try {
            // Create a default path in user's home directory if no workspace is available
            let defaultNotesPath: string;
            const workspaceFolders = vscode.workspace.workspaceFolders;

            if (workspaceFolders) {
                // If workspace exists, use workspace/Notes
                const rootPath = workspaceFolders[0].uri.fsPath;
                defaultNotesPath = path.join(rootPath, 'Notes');
            } else {
                // No workspace, use ~/Notes as a sensible default
                const homeDir = require('os').homedir();
                defaultNotesPath = path.join(homeDir, 'Notes');
            }

            // Check if the path already exists or create it
            try {
                await fsp.access(defaultNotesPath);
            } catch {
                // Folder doesn't exist, create it
                await fsp.mkdir(defaultNotesPath, { recursive: true });
            }

            const config = vscode.workspace.getConfiguration('noted');

            // Always save absolute path to global configuration so it works across all windows
            await config.update('notesFolder', defaultNotesPath, vscode.ConfigurationTarget.Global);

            vscode.window.showInformationMessage(`Notes folder created at: ${defaultNotesPath}`);
            updateFolderConfiguredContext();
            refreshAllProviders();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create default notes folder: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // Command to create custom template
    let createCustomTemplate = vscode.commands.registerCommand('noted.createCustomTemplate', async () => {
        await createNewCustomTemplate();
        templatesProvider.refresh();
    });

    // Command to create JSON template with variables
    let createTemplateWithVariablesCmd = vscode.commands.registerCommand('noted.createTemplateWithVariables', async () => {
        await createTemplateWithVariables();
    });

    // Command to edit custom template
    let editCustomTemplateCmd = vscode.commands.registerCommand('noted.editCustomTemplate', async () => {
        await editCustomTemplate();
    });

    // Command to delete custom template
    let deleteCustomTemplateCmd = vscode.commands.registerCommand('noted.deleteCustomTemplate', async () => {
        await deleteCustomTemplate();
        templatesProvider.refresh();
    });

    // Command to duplicate custom template
    let duplicateCustomTemplateCmd = vscode.commands.registerCommand('noted.duplicateCustomTemplate', async () => {
        await duplicateCustomTemplate();
        templatesProvider.refresh();
    });

    // Command to preview template variables
    let previewTemplateCmd = vscode.commands.registerCommand('noted.previewTemplateVariables', async () => {
        await previewTemplate();
    });

    // Command to open templates folder
    let openTemplatesFolder = vscode.commands.registerCommand('noted.openTemplatesFolder', async () => {
        const templatesPath = getTemplatesPath();
        if (templatesPath) {
            try {
                await fsp.access(templatesPath);
                await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(templatesPath));
            } catch {
                vscode.window.showErrorMessage('Templates folder does not exist');
            }
        } else {
            vscode.window.showErrorMessage('Templates folder does not exist');
        }
    });

    // Phase 1: AI-Powered Template Creation Commands
    let createTemplateWithAI = vscode.commands.registerCommand('noted.createTemplateWithAI', async () => {
        await handleCreateTemplateWithAI();
        templatesProvider.refresh(); // Refresh to show new template
    });
    let enhanceTemplate = vscode.commands.registerCommand('noted.enhanceTemplate', async () => {
        await handleEnhanceTemplate();
        templatesProvider.refresh(); // Refresh to show updated template
    });
    let selectAIModel = vscode.commands.registerCommand('noted.selectAIModel', handleSelectAIModel);

    // Phase 2: Multi-Note Workflow Bundles Commands
    let createBundle = vscode.commands.registerCommand('noted.createBundle', async () => {
        await handleCreateBundle();
    });
    let createBundleFromTemplates = vscode.commands.registerCommand('noted.createBundleFromTemplates', async () => {
        await handleCreateBundleFromTemplates();
    });
    let editBundle = vscode.commands.registerCommand('noted.editBundle', async () => {
        await handleEditBundle();
    });
    let deleteBundle = vscode.commands.registerCommand('noted.deleteBundle', async () => {
        await handleDeleteBundle();
    });

    // Phase 3: Template Migration Command
    let migrateTemplates = vscode.commands.registerCommand('noted.migrateTemplates', async () => {
        await handleMigrateTemplates();
        templatesProvider.refresh(); // Refresh to show migrated templates
    });

    // AI-Enhanced User Story Creation
    let createUserStoryWithAI = vscode.commands.registerCommand('noted.createUserStoryWithAI', async () => {
        await handleCreateUserStoryWithAI();
        notesProvider.refresh(); // Refresh to show new user story
    });

    // Phase 4: Template Browser UI
    let showTemplateBrowserCmd = vscode.commands.registerCommand('noted.showTemplateBrowser', async () => {
        await showTemplateBrowser(context, templatesProvider);
    });

    // Command to setup custom folder
    let setupCustomFolder = vscode.commands.registerCommand('noted.setupCustomFolder', async () => {
        try {
            // Start from user's home directory as a sensible default
            const homeDir = require('os').homedir();
            const defaultUri = vscode.Uri.file(homeDir);

            const selectedUri = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Select Notes Folder',
                defaultUri: defaultUri,
                title: 'Choose where to store your notes'
            });

            if (selectedUri && selectedUri[0]) {
                const selectedPath = selectedUri[0].fsPath;

                // Check if selected path is .vscode or inside it
                if (selectedPath.includes('.vscode')) {
                    vscode.window.showErrorMessage('Cannot use .vscode directory for notes');
                    return;
                }

                try {
                    await fsp.access(selectedPath);
                } catch {
                    // Folder doesn't exist, create it
                    await fsp.mkdir(selectedPath, { recursive: true });
                }

                const config = vscode.workspace.getConfiguration('noted');
                // Always save absolute path to global configuration
                await config.update('notesFolder', selectedPath, vscode.ConfigurationTarget.Global);

                vscode.window.showInformationMessage(`Notes folder set to: ${selectedPath}`);
                updateFolderConfiguredContext();
                refreshAllProviders();
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create notes folder: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // ============================================================================
    // Bulk Operations Commands
    // ============================================================================

    let toggleSelectMode = vscode.commands.registerCommand('noted.toggleSelectMode', async () => {
        await handleToggleSelectMode(bulkOperationsService);
        refreshAllProviders();
    });

    let toggleNoteSelection = vscode.commands.registerCommand('noted.toggleNoteSelection', async (item: NoteItem) => {
        await handleToggleNoteSelection(item, bulkOperationsService);
        refreshAllProviders();
    });

    let selectAllNotes = vscode.commands.registerCommand('noted.selectAllNotes', async () => {
        await handleSelectAllNotes(notesProvider, bulkOperationsService);
        refreshAllProviders();
    });

    let clearSelection = vscode.commands.registerCommand('noted.clearSelection', async () => {
        await handleClearSelection(bulkOperationsService);
        refreshAllProviders();
    });

    let bulkDelete = vscode.commands.registerCommand('noted.bulkDelete', async () => {
        await handleBulkDelete(bulkOperationsService, undoService);
        refreshAllProviders();
    });

    let bulkMove = vscode.commands.registerCommand('noted.bulkMove', async () => {
        await handleBulkMove(bulkOperationsService, linkService, undoService);
        refreshAllProviders();
    });

    let bulkArchive = vscode.commands.registerCommand('noted.bulkArchive', async () => {
        await handleBulkArchive(bulkOperationsService, archiveService, undoService);
        refreshAllProviders();
    });

    let bulkMerge = vscode.commands.registerCommand('noted.bulkMerge', async () => {
        await handleBulkMerge(bulkOperationsService, linkService, undoService);
        refreshAllProviders();
    });

    // ============================================================================
    // Hierarchical Note Commands
    // ============================================================================

    let createHierarchicalNote = vscode.commands.registerCommand('noted.createHierarchicalNote', async () => {
        await handleCreateHierarchicalNote();
        refreshAllProviders();
    });

    let openHierarchicalNote = vscode.commands.registerCommand('noted.openHierarchicalNote', async () => {
        await handleOpenHierarchicalNote();
        refreshAllProviders();
    });

    let searchHierarchicalNotes = vscode.commands.registerCommand('noted.searchHierarchicalNotes', async () => {
        await handleSearchHierarchicalNotes();
    });

    // ============================================================================
    // Markdown Preview Command
    // ============================================================================

    let showPreview = vscode.commands.registerCommand('noted.showPreview', async () => {
        if (embedService) {
            await showMarkdownPreview(embedService);
        } else {
            vscode.window.showErrorMessage('Embed service not available');
        }
    });

    // ============================================================================
    // Markdown Formatting Commands (Visual Toolbar)
    // ============================================================================

    let showMarkdownToolbar = vscode.commands.registerCommand('noted.showMarkdownToolbar', async () => {
        await markdownToolbarService.showFormattingMenu();
    });

    // ============================================================================
    // Undo/Redo Commands
    // ============================================================================

    let undoCommand = vscode.commands.registerCommand('noted.undo', async () => {
        await handleUndo(undoService, refreshAllProviders);
    });

    let redoCommand = vscode.commands.registerCommand('noted.redo', async () => {
        await handleRedo(undoService, refreshAllProviders);
    });

    let showUndoHistory = vscode.commands.registerCommand('noted.showUndoHistory', async () => {
        await handleShowUndoHistory(undoService);
    });

    let clearUndoHistory = vscode.commands.registerCommand('noted.clearUndoHistory', async () => {
        await handleClearUndoHistory(undoService);
    });

    // Command to rename symbol (refactor links)
    let renameSymbol = vscode.commands.registerCommand('noted.renameSymbol', async () => {
        const { handleRenameSymbol } = await import('./commands/commands');
        await handleRenameSymbol(linkService);
    });

    // ============================================================================
    // AI Summarization Commands
    // ============================================================================

    let summarizeNote = vscode.commands.registerCommand('noted.summarizeNote', async (item: NoteItem) => {
        await summarizationCommands.handleSummarizeNote(item);
    });

    let summarizeCurrentNote = vscode.commands.registerCommand('noted.summarizeCurrentNote', async () => {
        await summarizationCommands.handleSummarizeCurrentNote();
    });

    let summarizeRecent = vscode.commands.registerCommand('noted.summarizeRecent', async () => {
        await summarizationCommands.handleSummarizeRecent();
    });

    let summarizeWeek = vscode.commands.registerCommand('noted.summarizeWeek', async () => {
        await summarizationCommands.handleSummarizeWeek();
    });

    let summarizeMonth = vscode.commands.registerCommand('noted.summarizeMonth', async () => {
        await summarizationCommands.handleSummarizeMonth();
    });

    let summarizeCustomRange = vscode.commands.registerCommand('noted.summarizeCustomRange', async () => {
        await summarizationCommands.handleSummarizeCustomRange();
    });

    let clearSummaryCache = vscode.commands.registerCommand('noted.clearSummaryCache', async () => {
        await summarizationCommands.handleClearSummaryCache();
    });

    // ============================================================================
    // Auto-Tagging Commands (Phase 4)
    // ============================================================================

    let suggestTags = vscode.commands.registerCommand('noted.suggestTags', async () => {
        await handleSuggestTags(summarizationService, autoTagService);
    });

    // ============================================================================
    // Smart Auto-Tagging Commands (Phase 1 - Direct LLM Analysis)
    // ============================================================================

    let generateTagsCurrentNote = vscode.commands.registerCommand('noted.generateTagsCurrentNote', async (item?: NoteItem) => {
        const { generateTagsForNote } = await import('./tagging/autoTagCommands');
        // If called from context menu with item, use that file path; otherwise use active editor
        await generateTagsForNote(item?.filePath ? vscode.Uri.file(item.filePath) : undefined);
    });

    let batchGenerateTags = vscode.commands.registerCommand('noted.batchGenerateTags', async () => {
        const { tagAllNotes } = await import('./tagging/autoTagCommands');
        await tagAllNotes();
    });

    let manageNoteTags = vscode.commands.registerCommand('noted.manageNoteTags', async () => {
        const { manageNoteTags } = await import('./tagging/autoTagCommands');
        await manageNoteTags();
    });

    let addCustomTag = vscode.commands.registerCommand('noted.addCustomTag', async () => {
        const { addCustomTag } = await import('./tagging/autoTagCommands');
        await addCustomTag();
    });

    let showTagStats = vscode.commands.registerCommand('noted.showTagStats', async () => {
        const { showTagStatisticsSummary } = await import('./tagging/tagStatistics');
        await showTagStatisticsSummary();
    });

    let showTagStatsDetailed = vscode.commands.registerCommand('noted.showTagStatsDetailed', async () => {
        const { showTagStatistics } = await import('./tagging/tagStatistics');
        await showTagStatistics();
    });

    // ============================================================================
    // Prompt Template Commands
    // ============================================================================

    let createPromptTemplate = vscode.commands.registerCommand('noted.createPromptTemplate', async () => {
        const { PromptTemplateService } = await import('./services/promptTemplateService');
        const promptTemplateService = new PromptTemplateService(context);
        await handleCreatePromptTemplate(promptTemplateService);
    });

    let editPromptTemplate = vscode.commands.registerCommand('noted.editPromptTemplate', async () => {
        const { PromptTemplateService } = await import('./services/promptTemplateService');
        const promptTemplateService = new PromptTemplateService(context);
        await handleEditPromptTemplate(promptTemplateService);
    });

    let deletePromptTemplate = vscode.commands.registerCommand('noted.deletePromptTemplate', async () => {
        const { PromptTemplateService } = await import('./services/promptTemplateService');
        const promptTemplateService = new PromptTemplateService(context);
        await handleDeletePromptTemplate(promptTemplateService);
    });

    let duplicatePromptTemplate = vscode.commands.registerCommand('noted.duplicatePromptTemplate', async () => {
        const { PromptTemplateService } = await import('./services/promptTemplateService');
        const promptTemplateService = new PromptTemplateService(context);
        await handleDuplicatePromptTemplate(promptTemplateService);
    });

    let listPromptTemplates = vscode.commands.registerCommand('noted.listPromptTemplates', async () => {
        const { PromptTemplateService } = await import('./services/promptTemplateService');
        const promptTemplateService = new PromptTemplateService(context);
        await handleListPromptTemplates(promptTemplateService);
    });

    let viewTemplateVariables = vscode.commands.registerCommand('noted.viewTemplateVariables', async () => {
        await handleViewTemplateVariables();
    });

    let showSummaryHistory = vscode.commands.registerCommand('noted.showSummaryHistory', async () => {
        await handleShowSummaryHistory(summarizationService);
    });

    let compareSummaries = vscode.commands.registerCommand('noted.compareSummaries', async () => {
        await handleCompareSummaries(summarizationService);
    });

    let restoreSummaryVersion = vscode.commands.registerCommand('noted.restoreSummaryVersion', async () => {
        await handleRestoreSummaryVersion(summarizationService);
    });

    let clearSummaryHistory = vscode.commands.registerCommand('noted.clearSummaryHistory', async () => {
        await handleClearSummaryHistory(summarizationService);
    });

    let showSummaryHistoryStats = vscode.commands.registerCommand('noted.showSummaryHistoryStats', async () => {
        await handleShowSummaryHistoryStats(summarizationService);
    });

    let summarizeSearchResults = vscode.commands.registerCommand('noted.summarizeSearchResults', async () => {
        const { handleSummarizeSearchResults } = await import('./commands/commands');
        await handleSummarizeSearchResults(summarizationService);
    });

    context.subscriptions.push(
        openTodayNote, openWithTemplate, createQuickNote, createCategoryNote, insertTimestamp, extractSelectionToNote, changeFormat,
        refreshNotes, refreshConnections, openNote, openConnection, openConnectionSource, createNoteFromLink, openLinkWithSection, deleteNote, renameNote, copyPath, revealInExplorer,
        searchNotes, quickSwitcher, filterByTag, clearTagFilters, sortTagsByName, sortTagsByFrequency, refreshTags,
        searchTagCmd, renameTagCmd, mergeTagsCmd, deleteTagCmd, exportTagsCmd,
        showStats, exportNotes, duplicateNote, moveNotesFolder,
        setupDefaultFolder, setupCustomFolder, showNotesConfig,
        createCustomTemplate, createTemplateWithVariablesCmd, editCustomTemplateCmd, deleteCustomTemplateCmd,
        duplicateCustomTemplateCmd, previewTemplateCmd, openTemplatesFolder,
        createTemplateWithAI, enhanceTemplate, selectAIModel,
        createBundle, createBundleFromTemplates, editBundle, deleteBundle,
        migrateTemplates, createUserStoryWithAI, showTemplateBrowserCmd,
        createFolder, moveNote, renameFolder, deleteFolder, showCalendar, showGraph, showActivity, showVersionChangelog, showOutput,
        togglePinNote, archiveNote, unarchiveNote, archiveOldNotes, rebuildBacklinks, clearBacklinks,
        toggleSelectMode, toggleNoteSelection, selectAllNotes, clearSelection, bulkDelete, bulkMove, bulkArchive, bulkMerge,
        createHierarchicalNote, openHierarchicalNote, searchHierarchicalNotes,
        showPreview, showMarkdownToolbar,
        undoCommand, redoCommand, showUndoHistory, clearUndoHistory,
        renameSymbol,
        summarizeNote, summarizeCurrentNote, summarizeRecent, summarizeWeek, summarizeMonth, summarizeCustomRange, clearSummaryCache, summarizeSearchResults,
        showSummaryHistory, compareSummaries, restoreSummaryVersion, clearSummaryHistory, showSummaryHistoryStats,
        createPromptTemplate, editPromptTemplate, deletePromptTemplate, duplicatePromptTemplate, listPromptTemplates, viewTemplateVariables,
        suggestTags,
        generateTagsCurrentNote, batchGenerateTags, manageNoteTags, addCustomTag, showTagStats, showTagStatsDetailed,
        refreshOrphans, refreshPlaceholders, createNoteFromPlaceholder, openPlaceholderSource, openTagReference
    );

    // Listen for configuration changes to handle notes folder relocation
    const configChangeListener = vscode.workspace.onDidChangeConfiguration(async (e) => {
        if (e.affectsConfiguration('noted.notesFolder')) {
            const newNotesPath = getNotesPath();
            if (newNotesPath) {
                // Update all services with the new notes path
                await tagService.updateNotesPath(newNotesPath);
                await linkService.updateNotesPath(newNotesPath);
                archiveService.updateNotesPath(newNotesPath);
                summarizationService.setHistoryService(newNotesPath);

                // Clear path resolution cache for embeds
                clearPathResolutionCache();

                // Refresh all tree views
                const providersToRefresh = [
                    notesProvider,
                    journalProvider,
                    templatesProvider,
                    tagsProvider,
                    connectionsProvider,
                    orphansProvider,
                    placeholdersProvider,
                    collectionsProvider,
                    diagramsProvider
                ];
                providersToRefresh.forEach(p => p.refresh());

                vscode.window.showInformationMessage('Notes folder location updated. All indices have been rebuilt.');
            }
        }
    });
    context.subscriptions.push(configChangeListener);

    // Return API for markdown-it plugin registration
    return {
        extendMarkdownIt(md: any) {
            if (embedService && linkService) {
                const result = markdownItWikilinkEmbed(md, embedService, linkService);
                return result;
            }
            return md;
        }
    };
}

async function initializeNotesFolder() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }

    // Check if notes folder exists - if not, tree view will show welcome actions
    // User can click buttons in the tree view to set up
    updateFolderConfiguredContext();
}

/**
 * Update the context variable that controls whether welcome view is shown
 * The welcome view should only show when the notes folder is not configured
 */
function updateFolderConfiguredContext() {
    const notesPath = getNotesPath();
    const isFolderConfigured = notesPath !== null;
    vscode.commands.executeCommand('setContext', 'noted.isFolderConfigured', isFolderConfigured);
}

// Helper function to check if a folder name matches year pattern (YYYY)
function isYearFolder(name: string): boolean {
    return /^\d{4}$/.test(name);
}

// Helper function to check if a folder name matches month pattern (MM-MonthName)
function isMonthFolder(name: string): boolean {
    return /^\d{2}-[A-Za-z]+$/.test(name);
}

// Helper function to validate custom folder name
function isValidCustomFolderName(name: string): boolean {
    // Don't allow empty names
    if (!name || name.trim().length === 0) {
        return false;
    }

    // Don't allow names that match date patterns
    if (isYearFolder(name) || isMonthFolder(name)) {
        return false;
    }

    // Don't allow invalid filesystem characters
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(name)) {
        return false;
    }

    return true;
}

// Helper function to get all folders recursively
async function getAllFolders(rootPath: string): Promise<Array<{name: string, path: string}>> {
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
            // Error scanning directory
        }
    }

    await scanDir(rootPath);
    return folders;
}

function getNotesPath(): string | null {
    const config = vscode.workspace.getConfiguration('noted');
    const notesFolder = config.get<string>('notesFolder', 'Notes');

    // If absolute path, use it directly (this is the preferred approach for global configuration)
    if (path.isAbsolute(notesFolder)) {
        return notesFolder;
    }

    // For relative paths, try to resolve against workspace first, then fall back to current folder
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (workspaceFolders) {
        const rootPath = workspaceFolders[0].uri.fsPath;
        const resolvedPath = path.join(rootPath, notesFolder);
        return resolvedPath;
    }

    // No workspace and relative path - this means user hasn't configured a default location yet
    return null;
}

function getTemplatesPath(): string | null {
    const notesPath = getNotesPath();
    if (!notesPath) {
        return null;
    }
    return path.join(notesPath, '.noted-templates');
}

async function getCustomTemplates(): Promise<string[]> {
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        return [];
    }

    try {
        await fsp.access(templatesPath);
        const files = await fsp.readdir(templatesPath);
        return files
            .filter(f => f.endsWith('.txt') || f.endsWith('.md'))
            .map(f => path.basename(f, path.extname(f)));
    } catch {
        return [];
    }
}

async function createNewCustomTemplate() {
    const templateName = await vscode.window.showInputBox({
        prompt: 'Enter template name',
        placeHolder: 'my-template'
    });

    if (!templateName) {
        return;
    }

    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        vscode.window.showErrorMessage('Please configure notes folder first');
        return;
    }

    try {
        // Create templates folder if it doesn't exist
        try {
            await fsp.access(templatesPath);
        } catch {
            await fsp.mkdir(templatesPath, { recursive: true });
        }

        const config = vscode.workspace.getConfiguration('noted');
        const fileFormat = config.get<string>('fileFormat', 'txt');
        const templateFile = path.join(templatesPath, `${templateName}.${fileFormat}`);

        try {
            await fsp.access(templateFile);
            vscode.window.showErrorMessage('Template already exists');
            return;
        } catch {
            // Template doesn't exist, create it
            // Create a starter template with all available placeholders
            const starterContent = `File: {filename}
Created: {date} at {time}
Author: {user}
Workspace: {workspace}
==================================================

[Your template content here]

Available placeholders:
- {filename}: The name of the note file
- {date}: Current date (YYYY-MM-DD)
- {time}: Current time (HH:MM AM/PM)
- {year}: Current year (YYYY)
- {month}: Current month (MM)
- {day}: Current day (DD)
- {weekday}: Day of week (Sun, Mon, etc.)
- {month_name}: Month name (January, February, etc.)
- {user}: System username
- {workspace}: Workspace name
`;

            await fsp.writeFile(templateFile, starterContent);

            const document = await vscode.workspace.openTextDocument(templateFile);
            await vscode.window.showTextDocument(document);
            vscode.window.showInformationMessage(`Template created: ${templateName}`);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create template: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function createTemplateWithVariables() {
    const templateName = await vscode.window.showInputBox({
        prompt: 'Enter template name',
        placeHolder: 'my-advanced-template',
        validateInput: (value) => {
            if (!value) {
                return 'Template name is required';
            }
            if (!/^[a-z0-9-_]+$/i.test(value)) {
                return 'Template name can only contain letters, numbers, hyphens, and underscores';
            }
            return null;
        }
    });

    if (!templateName) {
        return;
    }

    const description = await vscode.window.showInputBox({
        prompt: 'Enter template description',
        placeHolder: 'A brief description of what this template is for'
    });

    if (description === undefined) {
        return;
    }

    const category = await vscode.window.showInputBox({
        prompt: 'Enter template category',
        placeHolder: 'General',
        value: 'General'
    });

    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        vscode.window.showErrorMessage('Please configure notes folder first');
        return;
    }

    try {
        // Create templates folder if it doesn't exist
        try {
            await fsp.access(templatesPath);
        } catch {
            await fsp.mkdir(templatesPath, { recursive: true });
        }

        const templateFile = path.join(templatesPath, `${templateName}.json`);

        // Create template object with system username as author
        const template = {
            id: templateName,
            name: templateName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: description || '',
            category: category || 'General',
            tags: [],
            version: '1.0.0',
            author: os.userInfo().username,
            difficulty: 'beginner',
            variables: [],
            content: `# {filename}\n\nCreated: {date} at {time}\nAuthor: {user}\n\n---\n\n[Your template content here]\n\nAdd custom variables using the Variable Editor to make this template interactive!`,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            usage_count: 0
        };

        // Use atomic write with 'wx' flag to prevent race conditions
        try {
            await fsp.writeFile(templateFile, JSON.stringify(template, null, 2), { flag: 'wx' });

            vscode.window.showInformationMessage(`Template created: ${templateName}. Opening variable editor...`);

            // Open the template browser
            await vscode.commands.executeCommand('noted.showTemplateBrowser');

            // Note: The template browser will refresh automatically when it opens
            // The user will see the new template and can click "Edit Variables" to add custom variables
            vscode.window.showInformationMessage(`Click "Edit Variables" on the "${templateName}" template to add custom variables.`);
        } catch (error: any) {
            if (error.code === 'EEXIST') {
                vscode.window.showErrorMessage('Template already exists');
            } else {
                throw error;
            }
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create template: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function moveNotesFolderLocation() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('Please open a workspace folder first');
        return;
    }

    try {
        const config = vscode.workspace.getConfiguration('noted');
        const currentFolder = config.get<string>('notesFolder', 'notes');

        // Handle both relative and absolute paths
        const rootPath = workspaceFolders[0].uri.fsPath;
        const currentPath = path.isAbsolute(currentFolder)
            ? currentFolder
            : path.join(rootPath, currentFolder);

        try {
            await fsp.access(currentPath);
        } catch {
            vscode.window.showErrorMessage('Current notes folder does not exist');
            return;
        }

        const selectedUri = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select New Notes Location',
            defaultUri: vscode.Uri.file(path.dirname(currentPath)),
            title: 'Choose new location for your notes'
        });

        if (!selectedUri || !selectedUri[0]) {
            return;
        }

        const newPath = selectedUri[0].fsPath;

        try {
            await fsp.access(newPath);
            const entries = await fsp.readdir(newPath);
            if (entries.length > 0) {
                vscode.window.showErrorMessage('Destination folder must be empty');
                return;
            }
        } catch {
            // Folder doesn't exist, create it
            await fsp.mkdir(newPath, { recursive: true });
        }

        // Copy all files recursively
        const copyRecursive = async (src: string, dest: string) => {
            const entries = await fsp.readdir(src, { withFileTypes: true });
            for (const entry of entries) {
                const srcPath = path.join(src, entry.name);
                const destPath = path.join(dest, entry.name);
                if (entry.isDirectory()) {
                    await fsp.mkdir(destPath, { recursive: true });
                    await copyRecursive(srcPath, destPath);
                } else {
                    await fsp.copyFile(srcPath, destPath);
                }
            }
        };

        await copyRecursive(currentPath, newPath);

        // Delete old folder
        await fsp.rm(currentPath, { recursive: true });

        // Save to global configuration
        await config.update('notesFolder', newPath, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Notes moved to: ${newPath}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to move notes: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function openDailyNote(templateType?: string) {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Please open a workspace folder first');
        logger.warn('openDailyNote: No workspace folder');
        return;
    }

    try {
        const config = vscode.workspace.getConfiguration('noted');
        const fileFormat = config.get<string>('fileFormat', 'txt');

        const now = new Date();

        const year = now.getFullYear().toString();
        const month = now.toLocaleString('en-US', { month: '2-digit' });
        const monthName = now.toLocaleString('en-US', { month: 'long' });
        const folderName = `${month}-${monthName}`;
        const day = now.toLocaleString('en-US', { day: '2-digit' });
        const fileName = `${year}-${month}-${day}.${fileFormat}`;

        const noteFolder = path.join(notesPath, year, folderName);
        const filePath = path.join(noteFolder, fileName);

        logger.debug('openDailyNote', { fileName, templateType });

        try {
            await fsp.access(noteFolder);
        } catch {
            await fsp.mkdir(noteFolder, { recursive: true });
        }

        let isNewNote = false;
        try {
            await fsp.access(filePath);
            logger.info('Opening existing daily note', { fileName });
        } catch {
            const content = await generateTemplate(templateType, now);
            await fsp.writeFile(filePath, content);
            isNewNote = true;
            logger.info('Created new daily note', { fileName, templateType });
        }

        const document = await vscode.workspace.openTextDocument(filePath);
        const editor = await vscode.window.showTextDocument(document);

        const lastLine = document.lineCount - 1;
        const lastCharacter = document.lineAt(lastLine).text.length;
        editor.selection = new vscode.Selection(lastLine, lastCharacter, lastLine, lastCharacter);

        // Auto-tag new notes if enabled
        if (isNewNote) {
            const { autoTagNewNote } = await import('./tagging/autoTagOnCreate');
            autoTagNewNote(filePath);
        }
    } catch (error) {
        logger.error('Failed to open daily note', error instanceof Error ? error : new Error(String(error)));
        vscode.window.showErrorMessage(`Failed to open daily note: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function createNoteFromTemplate(templateType: string) {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Please open a workspace folder first');
        return;
    }

    try {
        // Check if template has custom variables
        const { loadTemplateMetadata, generateTemplate: generateTemplateContent } = await import('./services/templateService');
        const templateMetadata = await loadTemplateMetadata(templateType);
        let variableValues: Record<string, any> | undefined;

        // Collect variable values if template has variables
        if (templateMetadata?.variables && templateMetadata.variables.length > 0) {
            const { BundleService } = await import('./templates/BundleService');
            const bundleService = new BundleService();
            try {
                variableValues = await bundleService.collectVariables(templateMetadata.variables);
            } catch (error) {
                // User cancelled or error collecting variables
                return;
            }
        }

        // Ask for note name
        const noteName = await vscode.window.showInputBox({
            prompt: 'Enter note name',
            placeHolder: 'my-note'
        });

        if (!noteName) {
            return;
        }

        // Sanitize filename: replace spaces with dashes, remove special chars
        const sanitizedName = noteName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-_]/g, '');

        const config = vscode.workspace.getConfiguration('noted');
        const fileFormat = config.get<string>('fileFormat', 'txt');

        const now = new Date();

        // All non-daily notes go to Inbox folder
        const noteFolder = path.join(notesPath, 'Inbox');
        const fileName = `${sanitizedName}.${fileFormat}`;
        const filePath = path.join(noteFolder, fileName);

        // Create Inbox folder if it doesn't exist
        try {
            await fsp.access(noteFolder);
        } catch {
            await fsp.mkdir(noteFolder, { recursive: true });
        }

        try {
            await fsp.access(filePath);
            vscode.window.showWarningMessage('A note with this name already exists');
            return;
        } catch {
            // File doesn't exist, create it
            const content = await generateTemplateContent(templateType, now, fileName, variableValues);
            await fsp.writeFile(filePath, content);

            const document = await vscode.workspace.openTextDocument(filePath);
            const editor = await vscode.window.showTextDocument(document);

            const lastLine = document.lineCount - 1;
            const lastCharacter = document.lineAt(lastLine).text.length;
            editor.selection = new vscode.Selection(lastLine, lastCharacter, lastLine, lastCharacter);

            // Auto-tag new notes if enabled
            const { autoTagNewNote } = await import('./tagging/autoTagOnCreate');
            autoTagNewNote(filePath);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create note: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function generateTemplate(templateType: string | undefined, date: Date, filename?: string): Promise<string> {
    const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    // Always include timestamp in frontmatter
    const frontmatter = filename
        ? `File: ${filename}\nCreated: ${dateStr} at ${timeStr}\n${'='.repeat(50)}\n\n`
        : `Created: ${dateStr} at ${timeStr}\n${'='.repeat(50)}\n\n`;

    // Check if it's a custom template
    const templatesPath = getTemplatesPath();
    if (templatesPath && templateType) {
        try {
            await fsp.access(templatesPath);
            const config = vscode.workspace.getConfiguration('noted');
            const fileFormat = config.get<string>('fileFormat', 'txt');
            const customTemplatePath = path.join(templatesPath, `${templateType}.${fileFormat}`);

            try {
                const content = await fsp.readFile(customTemplatePath, 'utf8');

                // Replace placeholders
                let processedContent = content.replace(/{filename}/g, filename || '');
                processedContent = processedContent.replace(/{date}/g, dateStr);
                processedContent = processedContent.replace(/{time}/g, timeStr);

                return processedContent;
            } catch {
                // Custom template doesn't exist, fall through to built-in templates
            }
        } catch {
            // Templates folder doesn't exist, fall through to built-in templates
        }
    }

    // Built-in templates
    const templates: Record<string, string> = {
        'problem-solution': `${frontmatter}PROBLEM:


STEPS TAKEN:
1.

SOLUTION:


NOTES:

`,
        'meeting': `${frontmatter}MEETING:
ATTENDEES:

AGENDA:
-

NOTES:


ACTION ITEMS:
-

`,
        'research': `${frontmatter}TOPIC:

QUESTIONS:
-

FINDINGS:


SOURCES:
-

NEXT STEPS:


`,
        'quick': `${frontmatter}`
    };

    return templates[templateType || 'quick'] || `${dateStr}\n${'='.repeat(50)}\n\n`;
}

async function searchInNotes(query: string): Promise<Array<{file: string, preview: string}>> {
    const notesPath = getNotesPath();
    if (!notesPath) {
        return [];
    }

    try {
        await fsp.access(notesPath);
    } catch {
        return [];
    }

    const results: Array<{file: string, preview: string}> = [];
    const searchLower = query.toLowerCase();

    async function searchDir(dir: string) {
        try {
            const entries = await fsp.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await searchDir(fullPath);
                } else if (entry.name.endsWith('.txt') || entry.name.endsWith('.md')) {
                    try {
                        const content = await fsp.readFile(fullPath, 'utf8');
                        if (content.toLowerCase().includes(searchLower)) {
                            const lines = content.split('\n');
                            const matchLine = lines.find(l => l.toLowerCase().includes(searchLower));
                            results.push({
                                file: fullPath,
                                preview: matchLine?.trim().substring(0, 80) || ''
                            });
                        }
                    } catch (error) {
                        // Error reading file
                    }
                }
            }
        } catch (error) {
            // Error reading directory
        }
    }

    await searchDir(notesPath);
    return results;
}

async function getNoteStats(): Promise<{total: number, thisWeek: number, thisMonth: number}> {
    const notesPath = getNotesPath();
    if (!notesPath) {
        return { total: 0, thisWeek: 0, thisMonth: 0 };
    }

    try {
        await fsp.access(notesPath);
    } catch {
        return { total: 0, thisWeek: 0, thisMonth: 0 };
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let total = 0;
    let thisWeek = 0;
    let thisMonth = 0;

    async function countFiles(dir: string) {
        try {
            const entries = await fsp.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await countFiles(fullPath);
                } else if (entry.name.endsWith('.txt') || entry.name.endsWith('.md')) {
                    total++;
                    try {
                        const stat = await fsp.stat(fullPath);
                        if (stat.mtime >= weekAgo) {thisWeek++;}
                        if (stat.mtime >= monthStart) {thisMonth++;}
                    } catch (error) {
                        // Error stating file
                    }
                }
            }
        } catch (error) {
            // Error reading directory
        }
    }

    await countFiles(notesPath);
    return { total, thisWeek, thisMonth };
}

async function exportNotesToFile(range: string, summarizationService?: SummarizationService, includeSummaries: boolean = false) {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Please open a workspace folder first');
        return;
    }

    try {
        await fsp.access(notesPath);
    } catch {
        vscode.window.showErrorMessage('No notes found');
        return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;

    const now = new Date();
    let filterDate: Date;

    if (range === 'This Week') {
        filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === 'This Month') {
        filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
        filterDate = new Date(0);
    }

    // Collect all notes first
    const notesToExport: Array<{ name: string; path: string; content: string }> = [];

    async function collectNotes(dir: string) {
        try {
            const entries = await fsp.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await collectNotes(fullPath);
                } else if (entry.name.endsWith('.txt') || entry.name.endsWith('.md')) {
                    try {
                        const stat = await fsp.stat(fullPath);
                        if (stat.mtime >= filterDate) {
                            const content = await fsp.readFile(fullPath, 'utf8');
                            notesToExport.push({
                                name: entry.name,
                                path: fullPath,
                                content
                            });
                        }
                    } catch (error) {
                        // Error processing file
                    }
                }
            }
        } catch (error) {
            // Error reading directory
        }
    }

    try {
        // First, collect all notes
        await collectNotes(notesPath);

        if (notesToExport.length === 0) {
            vscode.window.showInformationMessage('No notes found in the selected range');
            return;
        }

        // Build export content with optional summaries
        let combinedContent = `Exported Notes - ${range}\n${'='.repeat(50)}\n`;
        combinedContent += `Export Date: ${now.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })}\n`;
        combinedContent += `Total Notes: ${notesToExport.length}\n`;

        if (includeSummaries && summarizationService) {
            combinedContent += `AI Summaries: Included\n`;
        }

        combinedContent += `${'='.repeat(50)}\n\n`;

        // Process notes with or without summaries
        if (includeSummaries && summarizationService) {
            // Use withProgress with cancellation support
            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'Exporting notes with AI summaries',
                    cancellable: true
                },
                async (progress, token) => {
                    for (let i = 0; i < notesToExport.length; i++) {
                        // Check for cancellation
                        if (token.isCancellationRequested) {
                            throw new Error('Export cancelled by user');
                        }

                        const note = notesToExport[i];

                        // Update progress
                        progress.report({
                            message: `Exporting ${i + 1} of ${notesToExport.length} notes (generating summaries)...`,
                            increment: (100 / notesToExport.length)
                        });

                        combinedContent += `\n\n${'='.repeat(50)}\n`;
                        combinedContent += `${note.name}\n`;
                        combinedContent += `${'='.repeat(50)}\n\n`;

                        // Generate summary
                        try {
                            const summary = await summarizationService.summarizeNote(note.path, {
                                maxLength: 'medium',
                                format: 'structured',
                                includeActionItems: true
                            });

                            combinedContent += `## AI Summary\n\n${summary}\n\n`;
                            combinedContent += `## Note Content\n\n${note.content}\n`;
                        } catch (error) {
                            // If summary fails, include note without summary
                            combinedContent += `## AI Summary\n\n[Summary generation failed: ${error instanceof Error ? error.message : String(error)}]\n\n`;
                            combinedContent += `## Note Content\n\n${note.content}\n`;
                        }
                    }
                }
            );
        } else {
            // Export without summaries (original behavior)
            for (const note of notesToExport) {
                combinedContent += `\n\n--- ${note.name} ---\n\n${note.content}`;
            }
        }

        const exportPath = path.join(rootPath, `notes-export-${Date.now()}.txt`);
        await fsp.writeFile(exportPath, combinedContent);

        const document = await vscode.workspace.openTextDocument(exportPath);
        await vscode.window.showTextDocument(document);

        const summaryInfo = includeSummaries ? ' with AI summaries' : '';
        vscode.window.showInformationMessage(`Exported ${notesToExport.length} note(s)${summaryInfo} to ${path.basename(exportPath)}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to export notes: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function editCustomTemplate() {
    const customTemplates = await getCustomTemplates();
    if (customTemplates.length === 0) {
        vscode.window.showInformationMessage('No custom templates found. Create one first!');
        return;
    }

    const selected = await vscode.window.showQuickPick(customTemplates, {
        placeHolder: 'Select template to edit'
    });

    if (!selected) {
        return;
    }

    const { getCustomTemplatePath } = await import('./services/templateService');
    const templatePath = getCustomTemplatePath(selected);
    if (!templatePath) {
        vscode.window.showErrorMessage('Template path not found');
        return;
    }

    try {
        const document = await vscode.workspace.openTextDocument(templatePath);
        await vscode.window.showTextDocument(document);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open template: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function deleteCustomTemplate() {
    const customTemplates = await getCustomTemplates();
    if (customTemplates.length === 0) {
        vscode.window.showInformationMessage('No custom templates found.');
        return;
    }

    const selected = await vscode.window.showQuickPick(customTemplates, {
        placeHolder: 'Select template to delete'
    });

    if (!selected) {
        return;
    }

    const confirm = await vscode.window.showWarningMessage(
        `Are you sure you want to delete the template "${selected}"?`,
        { modal: true },
        'Delete'
    );

    if (confirm !== 'Delete') {
        return;
    }

    const { getCustomTemplatePath } = await import('./services/templateService');
    const templatePath = getCustomTemplatePath(selected);
    if (!templatePath) {
        vscode.window.showErrorMessage('Template path not found');
        return;
    }

    try {
        await fsp.unlink(templatePath);
        vscode.window.showInformationMessage(`Template "${selected}" deleted`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to delete template: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function duplicateCustomTemplate() {
    const customTemplates = await getCustomTemplates();
    if (customTemplates.length === 0) {
        vscode.window.showInformationMessage('No custom templates found.');
        return;
    }

    const selected = await vscode.window.showQuickPick(customTemplates, {
        placeHolder: 'Select template to duplicate'
    });

    if (!selected) {
        return;
    }

    const newName = await vscode.window.showInputBox({
        prompt: 'Enter name for duplicated template',
        placeHolder: `${selected}-copy`,
        value: `${selected}-copy`
    });

    if (!newName) {
        return;
    }

    const { getCustomTemplatePath } = await import('./services/templateService');
    const sourcePath = getCustomTemplatePath(selected);
    const targetPath = getCustomTemplatePath(newName);

    if (!sourcePath || !targetPath) {
        vscode.window.showErrorMessage('Template paths not found');
        return;
    }

    try {
        // Check if target already exists
        try {
            await fsp.access(targetPath);
            vscode.window.showErrorMessage('A template with that name already exists');
            return;
        } catch {
            // Target doesn't exist, proceed with copy
        }

        const content = await fsp.readFile(sourcePath, 'utf-8');
        await fsp.writeFile(targetPath, content);
        vscode.window.showInformationMessage(`Template duplicated as "${newName}"`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to duplicate template: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function previewTemplate() {
    const { getTemplateVariables } = await import('./services/templateService');
    const variables = getTemplateVariables();

    const items = variables.map(v => `${v.name}: ${v.description}`).join('\n');

    const panel = vscode.window.createWebviewPanel(
        'templateHelp',
        'Template Variables',
        vscode.ViewColumn.Beside,
        {}
    );

    panel.webview.html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    padding: 20px;
                    color: var(--vscode-foreground);
                }
                h1 {
                    color: var(--vscode-textLink-foreground);
                    font-size: 24px;
                    margin-bottom: 20px;
                }
                .variable {
                    margin-bottom: 15px;
                    padding: 10px;
                    background: var(--vscode-editor-background);
                    border-left: 3px solid var(--vscode-textLink-foreground);
                }
                .variable-name {
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                    color: var(--vscode-textLink-activeForeground);
                }
                .variable-desc {
                    margin-top: 5px;
                    color: var(--vscode-descriptionForeground);
                }
            </style>
        </head>
        <body>
            <h1>Template Variables Reference</h1>
            <p>Use these variables in your custom templates. They will be replaced with actual values when creating notes.</p>
            ${variables.map(v => `
                <div class="variable">
                    <div class="variable-name">${v.name}</div>
                    <div class="variable-desc">${v.description}</div>
                </div>
            `).join('')}
        </body>
        </html>
    `;
}

export function deactivate() {
    logger.info('Noted extension deactivated');
}
