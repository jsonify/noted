import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsp } from 'fs';
import { showCalendarView } from './calendar/calendarView';
import { showGraphView } from './graph/graphView';
import { MarkdownToolbarService } from './services/markdownToolbarService';
import { TagService } from './services/tagService';
import { formatTagForDisplay } from './utils/tagHelpers';
import { renameTag, mergeTags, deleteTag, exportTags } from './commands/tagCommands';
import { NotesTreeProvider } from './providers/notesTreeProvider';
import { JournalTreeProvider } from './providers/journalTreeProvider';
import { TemplatesTreeProvider } from './providers/templatesTreeProvider';
import { TagsTreeProvider } from './providers/tagsTreeProvider';
import { ConnectionsTreeProvider } from './providers/connectionsTreeProvider';
import { OrphansTreeProvider } from './providers/orphansTreeProvider';
import { PlaceholdersTreeProvider } from './providers/placeholdersTreeProvider';
import { TreeItem, NoteItem, SectionItem, TagItem, ConnectionItem } from './providers/treeItems';
import { TagCompletionProvider } from './services/tagCompletionProvider';
import { LinkService } from './services/linkService';
import { ConnectionsService } from './services/connectionsService';
import { BacklinksAppendService } from './services/backlinksAppendService';
import { OrphansService } from './services/orphansService';
import { PlaceholdersService } from './services/placeholdersService';
import { EmbedService } from './services/embedService';
import { FileWatcherService } from './services/fileWatcherService';
import { DiagramService } from './services/diagramService';
import { DiagramsTreeProvider } from './providers/diagramsTreeProvider';
import { registerDiagramCommands } from './commands/diagramCommands';
import { NoteLinkProvider } from './providers/noteLinkProvider';
import { BacklinkHoverProvider } from './providers/backlinkHoverProvider';
import { NotePreviewHoverProvider } from './providers/notePreviewHoverProvider';
import { EmbedHoverProvider } from './providers/embedHoverProvider';
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
    handleBulkArchive
} from './commands/bulkCommands';
import { UndoService } from './services/undoService';
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
import { markdownItWikilinkEmbed, warmUpPathCache, clearPathResolutionCache } from './features/preview/wikilink-embed';
import { showMarkdownPreview } from './preview/markdownPreview';

export function activate(context: vscode.ExtensionContext) {
    console.log('Noted extension is now active');

    const config = vscode.workspace.getConfiguration('noted');
    const notesFolder = config.get<string>('notesFolder', 'Notes');
    const workspaceFolders = vscode.workspace.workspaceFolders;

    // Check if notes folder is configured
    initializeNotesFolder();

    // Create tree data provider for main notes view
    const notesProvider = new NotesTreeProvider();
    const treeView = vscode.window.createTreeView('notedView', {
        treeDataProvider: notesProvider,
        dragAndDropController: notesProvider
    });

    // Create tree data provider for journal view (daily notes)
    const journalProvider = new JournalTreeProvider();
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('notedJournalView', journalProvider)
    );

    // Create tree data provider for templates view (empty, uses viewsWelcome)
    const templatesProvider = new TemplatesTreeProvider();
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('notedTemplatesView', templatesProvider)
    );

    // Initialize tag service for tag filtering
    const notesPath = getNotesPath();
    const tagService = new TagService(notesPath || '');

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
            [{ pattern: '**/*.txt' }, { pattern: '**/*.md' }],
            tagCompletionProvider,
            '#'
        );
        context.subscriptions.push(completionDisposable);
    }

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

    // NOTE: We do NOT register DocumentLinkProvider because it conflicts with VS Code's
    // built-in markdown wikilink handler. Instead, we only use DefinitionProvider which
    // handles Cmd+Click directly and has higher priority.

    // Register definition provider to handle Cmd+Click on [[note-name]] links
    // This works for both "hover + cmd + click" and "direct cmd + click"
    const { NoteDefinitionProvider } = require('./providers/noteDefinitionProvider');
    const definitionProvider = new NoteDefinitionProvider(linkService);
    const definitionProviderDisposable = vscode.languages.registerDefinitionProvider(
        [{ pattern: '**/*.txt' }, { pattern: '**/*.md' }],
        definitionProvider
    );
    context.subscriptions.push(definitionProviderDisposable);

    // Register hover provider for backlinks
    const backlinkHoverProvider = new BacklinkHoverProvider(linkService);
    const hoverProviderDisposable = vscode.languages.registerHoverProvider(
        [{ pattern: '**/*.txt' }, { pattern: '**/*.md' }],
        backlinkHoverProvider
    );
    context.subscriptions.push(hoverProviderDisposable);

    // Register hover provider for note content previews
    const notePreviewHoverProvider = new NotePreviewHoverProvider(linkService);
    const notePreviewHoverDisposable = vscode.languages.registerHoverProvider(
        [{ pattern: '**/*.txt' }, { pattern: '**/*.md' }],
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
            [{ pattern: '**/*.txt' }, { pattern: '**/*.md' }],
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
        [{ pattern: '**/*.txt' }, { pattern: '**/*.md' }],
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
        [{ pattern: '**/*.txt' }, { pattern: '**/*.md' }],
        linkCodeActionProvider,
        {
            providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
        }
    );
    context.subscriptions.push(codeActionDisposable);

    // Initialize connections service and provider
    const connectionsService = new ConnectionsService(linkService);
    const connectionsProvider = new ConnectionsTreeProvider(connectionsService);
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('notedConnectionsView', connectionsProvider)
    );

    // Initialize orphans service and provider
    const orphansService = new OrphansService(linkService);
    const orphansProvider = new OrphansTreeProvider(orphansService);
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('notedOrphansView', orphansProvider)
    );

    // Initialize placeholders service and provider
    const placeholdersService = new PlaceholdersService(linkService);
    const placeholdersProvider = new PlaceholdersTreeProvider(placeholdersService);
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('notedPlaceholdersView', placeholdersProvider)
    );

    // Initialize diagram service and diagrams tree provider
    // DiagramService now checks for workspace availability on-demand
    const diagramService = new DiagramService(context);
    const diagramsProvider = new DiagramsTreeProvider(diagramService);
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('notedDiagramsView', diagramsProvider)
    );

    // Register diagram commands
    registerDiagramCommands(context, diagramService, diagramsProvider);

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
            const isSupportedFile = ['.txt', '.md'].some(ext => filePath.endsWith(ext));

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
                { label: 'Quick', value: 'quick', description: 'Simple dated note' }
            ];

            const items = [
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

            templateType = selected.value;
        }

        await createNoteFromTemplate(templateType);
        refreshAllProviders();
    });

    // Command to create a quick note directly
    let createQuickNote = vscode.commands.registerCommand('noted.createQuickNote', async () => {
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

    // Command to open note from tree
    let openNote = vscode.commands.registerCommand('noted.openNote', async (filePath: string) => {
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
    });

    // Command to follow wiki link at cursor (triggered by Shift+Click)
    let followLinkAtCursor = vscode.commands.registerCommand('noted.followLinkAtCursor', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const document = editor.document;
        const position = editor.selection.active;
        const line = document.lineAt(position.line);
        const text = line.text;

        // Find if cursor is within a [[link]]
        const LINK_PATTERN_LOCAL = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
        LINK_PATTERN_LOCAL.lastIndex = 0;
        let match;

        while ((match = LINK_PATTERN_LOCAL.exec(text)) !== null) {
            const linkStart = match.index;
            const linkEnd = match.index + match[0].length;

            // Check if cursor is within this link
            if (position.character >= linkStart && position.character <= linkEnd) {
                const linkText = match[1].trim();

                // Resolve the link
                const targetPath = await linkService.resolveLink(linkText);

                if (targetPath) {
                    // Open the file
                    const targetUri = vscode.Uri.file(targetPath);
                    const targetDoc = await vscode.workspace.openTextDocument(targetUri);
                    await vscode.window.showTextDocument(targetDoc);
                } else {
                    // Link not found - trigger createNoteFromLink command
                    await vscode.commands.executeCommand('noted.createNoteFromLink', linkText);
                }
                return;
            }
        }
    });

    // Command to create a note from a link (used in hover preview for broken links)
    let createNoteFromLink = vscode.commands.registerCommand('noted.createNoteFromLink', async (linkText: string) => {
        const notesPath = getNotesPath();
        if (!notesPath) {
            vscode.window.showErrorMessage('Notes folder not configured.');
            return;
        }

        // First, try to find if the note already exists anywhere in the workspace
        const existingPath = await linkService.resolveLink(linkText);

        if (existingPath) {
            // Note exists, open it
            const document = await vscode.workspace.openTextDocument(existingPath);
            await vscode.window.showTextDocument(document);
            return;
        }

        // Sanitize the link text for use as a filename
        const sanitizedName = linkText.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');

        // Use the configured file format
        const config = vscode.workspace.getConfiguration('noted');
        const fileFormat = config.get<string>('fileFormat', 'txt');

        const now = new Date();
        const year = now.getFullYear().toString();
        const month = now.toLocaleString('en-US', { month: '2-digit' });
        const monthName = now.toLocaleString('en-US', { month: 'long' });
        const folderName = `${month}-${monthName}`;

        // Create the note in today's folder
        const noteFolder = path.join(notesPath, year, folderName);
        const fileName = `${sanitizedName}.${fileFormat}`;
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
                vscode.window.showInformationMessage(`Note already exists: ${sanitizedName}`);
                const document = await vscode.workspace.openTextDocument(filePath);
                await vscode.window.showTextDocument(document);
                return;
            } catch {
                // File doesn't exist, which is what we want
            }

            // Create the note with a simple template
            const template = await generateTemplate('quick', now, fileName);
            await fsp.writeFile(filePath, template, 'utf8');

            // Open the new note
            const document = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(document);

            // Refresh the tree view
            refreshAllProviders();

            vscode.window.showInformationMessage(`Created note: ${sanitizedName}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create note: ${error}`);
        }
    });

    // Command to delete note
    let deleteNote = vscode.commands.registerCommand('noted.deleteNote', async (item: NoteItem) => {
        const answer = await vscode.window.showWarningMessage(
            `Delete ${item.label}?`,
            'Delete',
            'Cancel'
        );
        if (answer === 'Delete') {
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
        const answer = await vscode.window.showWarningMessage(
            `Archive ${item.label}?`,
            'Archive',
            'Cancel'
        );
        if (answer === 'Archive') {
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
        const answer = await vscode.window.showWarningMessage(
            `Archive all notes older than ${days} days?`,
            'Archive',
            'Cancel'
        );

        if (answer === 'Archive') {
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

    // Command to search notes with advanced filters
    let searchNotes = vscode.commands.registerCommand('noted.searchNotes', async () => {
        const { advancedSearch, parseSearchQuery } = await import('./services/searchService');

        const query = await vscode.window.showInputBox({
            prompt: 'Search notes (supports: regex:, case:, tag:tagname, from:YYYY-MM-DD, to:YYYY-MM-DD)',
            placeHolder: 'Enter search term with optional filters...'
        });

        if (query) {
            try {
                const options = parseSearchQuery(query);
                const results = await advancedSearch(options, tagService);

                if (results.length === 0) {
                    vscode.window.showInformationMessage('No results found');
                } else {
                    const items = results.map(r => {
                        const fileName = path.basename(r.file);
                        const matchInfo = r.matches > 0 ? ` (${r.matches} match${r.matches > 1 ? 'es' : ''})` : '';
                        const tagInfo = r.tags.length > 0 ? ` [${r.tags.join(', ')}]` : '';

                        return {
                            label: `${fileName}${matchInfo}`,
                            description: r.preview,
                            detail: `${r.file}${tagInfo}`,
                            filePath: r.file
                        };
                    });

                    const selected = await vscode.window.showQuickPick(items, {
                        placeHolder: `Found ${results.length} result(s) - Use filters: regex:, case:, tag:, from:, to:`
                    });

                    if (selected && selected.filePath) {
                        const document = await vscode.workspace.openTextDocument(selected.filePath);
                        await vscode.window.showTextDocument(document);
                    }
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Search error: ${error instanceof Error ? error.message : String(error)}`);
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

    // Command to filter notes by tag
    let filterByTag = vscode.commands.registerCommand('noted.filterByTag', async (tagName?: string) => {
        // Rebuild tag index to ensure it's up to date
        if (notesPath) {
            await tagService.buildTagIndex();
        }

        let selectedTags: string[] = [];

        if (tagName) {
            // Tag name provided (e.g., clicked from tag tree)
            selectedTags = [tagName];
        } else {
            // Show quick pick with all available tags
            const allTags = tagService.getAllTags('frequency');

            if (allTags.length === 0) {
                vscode.window.showInformationMessage('No tags found in notes');
                return;
            }

            const items = allTags.map(tag => ({
                label: formatTagForDisplay(tag.name),
                description: `${tag.count} note${tag.count !== 1 ? 's' : ''}`,
                picked: notesProvider.getActiveFilters().includes(tag.name)
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select tags to filter by (supports multiple selection)',
                canPickMany: true
            });

            if (!selected || selected.length === 0) {
                return;
            }

            selectedTags = selected.map(item => item.label.substring(1)); // Remove # prefix
        }

        // Apply filters
        notesProvider.filterByTag(selectedTags, tagService);

        // Show filter description
        const filterDesc = notesProvider.getFilterDescription();
        if (filterDesc) {
            const noteCount = notesProvider.getFilteredNotePaths().length;
            vscode.window.showInformationMessage(
                `${filterDesc} - ${noteCount} note${noteCount !== 1 ? 's' : ''} found`
            );
        }
    });

    // Command to clear tag filters
    let clearTagFilters = vscode.commands.registerCommand('noted.clearTagFilters', () => {
        notesProvider.clearTagFilters();
        vscode.window.showInformationMessage('Tag filters cleared');
    });

    // Command to sort tags by name
    let sortTagsByName = vscode.commands.registerCommand('noted.sortTagsByName', () => {
        tagsProvider.setSortOrder('alphabetical');
        vscode.window.showInformationMessage('Tags sorted alphabetically');
    });

    // Command to sort tags by frequency
    let sortTagsByFrequency = vscode.commands.registerCommand('noted.sortTagsByFrequency', () => {
        tagsProvider.setSortOrder('frequency');
        vscode.window.showInformationMessage('Tags sorted by frequency');
    });

    // Command to refresh tags
    let refreshTags = vscode.commands.registerCommand('noted.refreshTags', async () => {
        await tagsProvider.refresh();
        vscode.window.showInformationMessage('Tags refreshed');
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
        const options = await vscode.window.showQuickPick(
            ['This Week', 'This Month', 'All Notes'],
            { placeHolder: 'Select export range' }
        );

        if (options) {
            await exportNotesToFile(options);
        }
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

    context.subscriptions.push(
        openTodayNote, openWithTemplate, createQuickNote, createCategoryNote, insertTimestamp, extractSelectionToNote, changeFormat,
        refreshNotes, refreshConnections, openNote, openConnection, openConnectionSource, followLinkAtCursor, createNoteFromLink, deleteNote, renameNote, copyPath, revealInExplorer,
        searchNotes, quickSwitcher, filterByTag, clearTagFilters, sortTagsByName, sortTagsByFrequency, refreshTags,
        renameTagCmd, mergeTagsCmd, deleteTagCmd, exportTagsCmd,
        showStats, exportNotes, duplicateNote, moveNotesFolder,
        setupDefaultFolder, setupCustomFolder, showNotesConfig,
        createCustomTemplate, editCustomTemplateCmd, deleteCustomTemplateCmd,
        duplicateCustomTemplateCmd, previewTemplateCmd, openTemplatesFolder,
        createFolder, moveNote, renameFolder, deleteFolder, showCalendar, showGraph,
        togglePinNote, archiveNote, unarchiveNote, archiveOldNotes, rebuildBacklinks, clearBacklinks,
        toggleSelectMode, toggleNoteSelection, selectAllNotes, clearSelection, bulkDelete, bulkMove, bulkArchive,
        showPreview, showMarkdownToolbar,
        undoCommand, redoCommand, showUndoHistory, clearUndoHistory,
        renameSymbol,
        refreshOrphans, refreshPlaceholders, createNoteFromPlaceholder, openPlaceholderSource
    );

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

        try {
            await fsp.access(noteFolder);
        } catch {
            await fsp.mkdir(noteFolder, { recursive: true });
        }

        try {
            await fsp.access(filePath);
        } catch {
            const content = await generateTemplate(templateType, now);
            await fsp.writeFile(filePath, content);
        }

        const document = await vscode.workspace.openTextDocument(filePath);
        const editor = await vscode.window.showTextDocument(document);

        const lastLine = document.lineCount - 1;
        const lastCharacter = document.lineAt(lastLine).text.length;
        editor.selection = new vscode.Selection(lastLine, lastCharacter, lastLine, lastCharacter);
    } catch (error) {
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
            const content = await generateTemplate(templateType, now, fileName);
            await fsp.writeFile(filePath, content);

            const document = await vscode.workspace.openTextDocument(filePath);
            const editor = await vscode.window.showTextDocument(document);

            const lastLine = document.lineCount - 1;
            const lastCharacter = document.lineAt(lastLine).text.length;
            editor.selection = new vscode.Selection(lastLine, lastCharacter, lastLine, lastCharacter);
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

async function exportNotesToFile(range: string) {
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

    let combinedContent = `Exported Notes - ${range}\n${'='.repeat(50)}\n\n`;

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
                            combinedContent += `\n\n--- ${entry.name} ---\n\n${content}`;
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
        await collectNotes(notesPath);

        const exportPath = path.join(rootPath, `notes-export-${Date.now()}.txt`);
        await fsp.writeFile(exportPath, combinedContent);

        const document = await vscode.workspace.openTextDocument(exportPath);
        await vscode.window.showTextDocument(document);
        vscode.window.showInformationMessage(`Exported to ${path.basename(exportPath)}`);
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

export function deactivate() {}
