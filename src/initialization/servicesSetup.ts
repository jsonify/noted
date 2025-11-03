/**
 * Service initialization and setup
 * Centralizes all service creation and configuration
 */

import * as vscode from 'vscode';
import { NotesTreeProvider } from '../providers/notesTreeProvider';
import { JournalTreeProvider } from '../providers/journalTreeProvider';
import { TemplatesTreeProvider } from '../providers/templatesTreeProvider';
import { TagsTreeProvider } from '../providers/tagsTreeProvider';
import { ConnectionsTreeProvider } from '../providers/connectionsTreeProvider';
import { OrphansTreeProvider } from '../providers/orphansTreeProvider';
import { PlaceholdersTreeProvider } from '../providers/placeholdersTreeProvider';
import { CollectionsTreeProvider } from '../providers/collectionsTreeProvider';
import { DiagramsTreeProvider } from '../providers/diagramsTreeProvider';
import { TagService } from '../services/tagService';
import { TagCompletionProvider } from '../services/tagCompletionProvider';
import { LinkService } from '../services/linkService';
import { ConnectionsService } from '../services/connectionsService';
import { BacklinksAppendService } from '../services/backlinksAppendService';
import { OrphansService } from '../services/orphansService';
import { PlaceholdersService } from '../services/placeholdersService';
import { SmartCollectionsService } from '../services/smartCollectionsService';
import { EmbedService } from '../services/embedService';
import { FileWatcherService } from '../services/fileWatcherService';
import { DiagramService } from '../services/diagramService';
import { NoteLinkProvider } from '../providers/noteLinkProvider';
import { BacklinkHoverProvider } from '../providers/backlinkHoverProvider';
import { NotePreviewHoverProvider } from '../providers/notePreviewHoverProvider';
import { EmbedHoverProvider } from '../providers/embedHoverProvider';
import { EmbedDecoratorProvider } from '../providers/embedDecoratorProvider';
import { LinkCompletionProvider } from '../providers/linkCompletionProvider';
import { LinkDiagnosticsProvider, LinkCodeActionProvider } from '../providers/linkDiagnosticsProvider';
import { PinnedNotesService } from '../services/pinnedNotesService';
import { ArchiveService } from '../services/archiveService';
import { BulkOperationsService } from '../services/bulkOperationsService';
import { UndoService } from '../services/undoService';
import { MarkdownToolbarService } from '../services/markdownToolbarService';
import { warmUpPathCache } from '../features/preview/wikilink-embed';

export interface Services {
    // Tree Providers
    notesProvider: NotesTreeProvider;
    journalProvider: JournalTreeProvider;
    templatesProvider: TemplatesTreeProvider;
    tagsProvider: TagsTreeProvider;
    connectionsProvider: ConnectionsTreeProvider;
    orphansProvider: OrphansTreeProvider;
    placeholdersProvider: PlaceholdersTreeProvider;
    collectionsProvider: CollectionsTreeProvider;
    diagramsProvider: DiagramsTreeProvider;

    // Core Services
    tagService: TagService;
    linkService: LinkService;
    connectionsService: ConnectionsService;
    backlinksAppendService: BacklinksAppendService;
    orphansService: OrphansService;
    placeholdersService: PlaceholdersService;
    smartCollectionsService: SmartCollectionsService;
    embedService: EmbedService | null;
    fileWatcherService: FileWatcherService | null;
    diagramService: DiagramService;

    // Feature Services
    pinnedNotesService: PinnedNotesService;
    archiveService: ArchiveService;
    bulkOperationsService: BulkOperationsService;
    undoService: UndoService;
    markdownToolbarService: MarkdownToolbarService;

    // Providers
    diagnosticsProvider: LinkDiagnosticsProvider | null;

    // Tree Views
    notesTreeView: vscode.TreeView<any>;
    journalTreeView: vscode.TreeView<any>;
    templatesTreeView: vscode.TreeView<any>;
    tagsTreeView: vscode.TreeView<any>;
    connectionsTreeView: vscode.TreeView<any>;
    orphansTreeView: vscode.TreeView<any>;
    placeholdersTreeView: vscode.TreeView<any>;
    collectionsTreeView: vscode.TreeView<any>;
    diagramsTreeView: vscode.TreeView<any>;
}

/**
 * Initialize all services and providers
 */
export function initializeServices(context: vscode.ExtensionContext): Services {
    // Create tree data providers
    const notesProvider = new NotesTreeProvider();
    const notesTreeView = vscode.window.createTreeView('notedView', {
        treeDataProvider: notesProvider,
        dragAndDropController: notesProvider
    });
    context.subscriptions.push(notesTreeView);

    const journalProvider = new JournalTreeProvider();
    const journalTreeView = vscode.window.createTreeView('notedJournalView', {
        treeDataProvider: journalProvider
    });
    context.subscriptions.push(journalTreeView);

    const templatesProvider = new TemplatesTreeProvider();
    const templatesTreeView = vscode.window.createTreeView('notedTemplatesView', {
        treeDataProvider: templatesProvider
    });
    context.subscriptions.push(templatesTreeView);

    // Initialize tag service for tag filtering
    const tagService = new TagService();
    tagService.onDidChangeFilters(() => {
        notesProvider.refresh();
        journalProvider.refresh();
    });
    tagService.loadTags();

    // Create tree data provider for tags view
    const tagsProvider = new TagsTreeProvider(tagService);
    const tagsTreeView = vscode.window.createTreeView('notedTagsView', {
        treeDataProvider: tagsProvider
    });
    context.subscriptions.push(tagsTreeView);

    // Register tag completion provider
    const fileFormat = vscode.workspace.getConfiguration('noted').get<string>('fileFormat', 'md');
    const selector: vscode.DocumentSelector = [
        { scheme: 'file', language: fileFormat === 'md' ? 'markdown' : 'plaintext' },
        { scheme: 'file', pattern: `**/*.${fileFormat}` }
    ];
    const tagCompletionProvider = new TagCompletionProvider(tagService);
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(selector, tagCompletionProvider, '#')
    );

    // Initialize link service for wiki-style links
    const linkService = new LinkService();
    linkService.buildBacklinksIndex().then(() => {
        console.log('Backlinks index built');
    }).catch(err => {
        console.error('Failed to build backlinks index:', err);
    });

    // Initialize backlinks append service
    const backlinksAppendService = new BacklinksAppendService(linkService);

    // Register document link provider for clickable links
    const noteLinkProvider = new NoteLinkProvider(linkService);
    context.subscriptions.push(
        vscode.languages.registerDocumentLinkProvider(selector, noteLinkProvider)
    );

    // Register hover provider for backlinks
    const backlinkHoverProvider = new BacklinkHoverProvider(linkService);
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(selector, backlinkHoverProvider)
    );

    // Register hover provider for note content previews
    const notePreviewHoverProvider = new NotePreviewHoverProvider(linkService);
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(selector, notePreviewHoverProvider)
    );

    // Initialize embed service
    let embedService: EmbedService | null = null;
    let fileWatcherService: FileWatcherService | null = null;
    try {
        embedService = new EmbedService(linkService);

        // Register hover provider for embeds
        if (embedService) {
            const embedHoverProvider = new EmbedHoverProvider(embedService);
            context.subscriptions.push(
                vscode.languages.registerHoverProvider(selector, embedHoverProvider)
            );

            // Register embed decorator provider for inline rendering
            const embedDecoratorProvider = new EmbedDecoratorProvider(embedService);
            context.subscriptions.push(embedDecoratorProvider);

            // Create file watcher service for transclusion
            fileWatcherService = new FileWatcherService(embedService);
            context.subscriptions.push(fileWatcherService);
        }
    } catch (error) {
        console.error('Failed to initialize embed service:', error);
        vscode.window.showWarningMessage('Embed service initialization failed. Some features may be unavailable.');
    }

    // Warm up path cache for preview
    warmUpPathCache().catch(err => {
        console.error('Failed to warm up path cache:', err);
    });

    // Register completion provider for note links
    const linkCompletionProvider = new LinkCompletionProvider(linkService);
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(selector, linkCompletionProvider, '[')
    );

    // Register diagnostics provider for links
    let diagnosticsProvider: LinkDiagnosticsProvider | null = null;
    try {
        diagnosticsProvider = new LinkDiagnosticsProvider(linkService);
        diagnosticsProvider.activate(context);

        // Trigger initial diagnostics for all visible editors
        vscode.window.visibleTextEditors.forEach(editor => {
            if (diagnosticsProvider) {
                diagnosticsProvider.updateDiagnostics(editor.document);
            }
        });
    } catch (error) {
        console.error('Failed to initialize diagnostics provider:', error);
    }

    // Register code action provider for quick fixes
    const codeActionProvider = new LinkCodeActionProvider(linkService);
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(selector, codeActionProvider)
    );

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
    const smartCollectionsService = new SmartCollectionsService(context.globalState);
    const collectionsProvider = new CollectionsTreeProvider(smartCollectionsService);
    const collectionsTreeView = vscode.window.createTreeView('notedCollectionsView', {
        treeDataProvider: collectionsProvider
    });
    context.subscriptions.push(collectionsTreeView);

    // Initialize diagram service and diagrams tree provider
    const diagramService = new DiagramService();
    const diagramsProvider = new DiagramsTreeProvider(diagramService);
    const diagramsTreeView = vscode.window.createTreeView('notedDiagramsView', {
        treeDataProvider: diagramsProvider
    });
    context.subscriptions.push(diagramsTreeView);

    // Initialize pinned notes service
    const pinnedNotesService = new PinnedNotesService(
        notesProvider,
        context.globalState
    );

    // Initialize archive service
    const archiveService = new ArchiveService();

    // Initialize bulk operations service
    const bulkOperationsService = new BulkOperationsService();
    bulkOperationsService.onDidChangeSelection(() => {
        notesProvider.refresh();
    });

    // Initialize undo service
    const undoService = new UndoService();
    context.subscriptions.push(undoService);

    // Initialize markdown toolbar service
    const markdownToolbarService = new MarkdownToolbarService();
    context.subscriptions.push(markdownToolbarService);

    return {
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
        fileWatcherService,
        diagramService,
        pinnedNotesService,
        archiveService,
        bulkOperationsService,
        undoService,
        markdownToolbarService,
        diagnosticsProvider,
        notesTreeView,
        journalTreeView,
        templatesTreeView,
        tagsTreeView,
        connectionsTreeView,
        orphansTreeView,
        placeholdersTreeView,
        collectionsTreeView,
        diagramsTreeView
    };
}
