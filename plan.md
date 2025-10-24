# Noted Extension - Development Plan

This document tracks planned features, improvements, and ideas for the Noted VS Code extension.

For a complete list of implemented features, see [notes.md](./notes.md).

## Planned Features & Ideas

### Enhanced Link Features (inspired by Markdown Memo)
- [x] **Link labels/aliases**: Support `[[note-name|Custom Display Text]]` syntax for readable link text (v1.13.5)
- [x] **Automatic link synchronization on rename**: Update all `[[links]]` when a note is renamed or moved (v1.13.5)
- [x] **Full-path links for disambiguation**: Handle cases where multiple notes have similar names (e.g., `[[folder/note]]`) (v1.14.0)
  - Path-based link syntax: `[[2025/10-October/meeting]]`, `[[work/project]]`
  - Smart resolution: supports both simple names and full/partial paths
  - Link completion: autocomplete suggests paths while typing `[[`
  - Diagnostics: warns about ambiguous links with quick fixes
- [x] **Extract selection to new note**: Select text and create a new linked note from it (v1.14.1)
  - Select text in any editor and extract to a new note
  - Automatically replaces selection with wiki-style link `[[note-name]]`
  - Opens extracted note in side-by-side view
  - Includes metadata: source file, extraction date
  - Available via context menu when text is selected
- [x] **Rename symbol command**: Refactor/rename links across all notes in workspace (v1.14.2)
  - Rename/refactor all occurrences of a link across the workspace
  - Preview affected files before renaming
  - Preserves display text when using `[[link|Display]]` syntax
  - Shows progress notification during rename operation
  - Automatically rebuilds backlinks index after rename

### Embedding Capabilities (inspired by Markdown Memo)
- [x] **Embed notes**: Support `![[note-name]]` syntax to embed entire note content inline
- [x] **Embed images**: Support `![[image.png]]` to display images within notes (v1.17.0)
  - Full image embed syntax: `![[image.png]]`, `![[./images/photo.jpg]]`, `![[image.png|Caption]]`
  - Supports PNG, JPG, JPEG, GIF, SVG, WEBP, BMP, ICO formats
  - Hover previews show inline image with metadata (file size, dimensions)
  - Inline decorations show 🖼️ icon for image embeds
  - Smart path resolution: absolute paths, relative to document, workspace-relative
  - Image metadata extraction (file size, with dimensions support ready for future enhancement)
  - Comprehensive test coverage with 11 new tests (296 total passing)
- [x] **Embed specific sections**: Support `![[note-name#section]]` to embed portions of notes (v1.17.0)
  - Full embed syntax: `![[note-name]]`, `![[note-name#section]]`, `![[note-name#section|Display Text]]`
  - Section extraction for both markdown headings (`# Heading`, `## Heading`) and text-style headings (`Heading:`)
  - Hover previews show embedded content with available sections
  - Inline decorations render embedded content with icons
  - Case-insensitive section matching
  - Comprehensive test coverage with 14 new tests
- [x] **Embed with transclusion**: Live-updating embedded content when source changes (v1.17.0)
  - FileWatcherService monitors source files for changes
  - EmbedService tracks which files are embedded in which documents
  - Decorations automatically refresh when embedded source content changes
  - Real-time updates: edit a source note and see embeds update instantly
  - Comprehensive test coverage with 15 new tests for transclusion (314 total tests passing)

### Preview Enhancements (inspired by Markdown Memo)
- [x] **Hover previews**: Show note/link preview on hover without opening the file (v1.15.0)
  - Hover over wiki-style links to see note content preview
  - Shows first 10 lines of note content
  - Truncates long lines for better readability
  - Includes clickable "Open note" link
  - Shows "Create note" option for broken links
- [x] **Link preview cards**: Rich previews showing note metadata (tags, created date, etc.) (v1.29.2)
  - Displays comprehensive metadata in hover preview cards
  - Shows all tags from frontmatter and inline `#tags`
  - Smart date formatting with relative times (e.g., "Just now", "2 days ago")
  - Displays file size in KB
  - Shows up to 3 additional frontmatter fields (status, priority, etc.)
  - Maintains existing content preview alongside metadata
  - 8 comprehensive unit tests added (334 total tests passing)
- [ ] **Inline image previews**: Display images directly in editor when using markdown image syntax
- [ ] **Embedded content rendering**: Render embedded notes/images in preview mode

### Navigation Features (inspired by Markdown Memo)
- [ ] **Random note**: Open a random note for serendipitous discovery and review
- [ ] **Open link to the side**: Automatically open linked notes in split view with keyboard shortcut
- [ ] **Breadcrumb navigation**: Show note hierarchy/connection path in editor
- [ ] **Forward/back navigation**: Navigate through note history like a browser

### Web Integration (inspired by Markdown Memo)
- [ ] **Paste HTML as Markdown**: Convert copied web content to markdown format
- [ ] **Web clipper functionality**: Save web content directly as notes with metadata
- [ ] **URL unfurling**: Automatically fetch and display metadata for pasted URLs

### Note Refactoring (inspired by Markdown Memo)
- [ ] **Extract range to new note**: Select text and create a linked note from selection
- [ ] **Merge notes**: Combine multiple notes with automatic link preservation and updates
- [ ] **Split note**: Break large notes into smaller linked notes with intelligent splitting

### Reference Panel Enhancements (inspired by Markdown Memo)
- [x] **Dedicated backlinks sidebar panel**: Always-visible panel showing all incoming references (v1.22.0)
  - Dedicated "Connections" panel in sidebar showing incoming (backlinks) and outgoing links
  - Real-time updates when switching between notes
  - Shows context snippets for each connection with line numbers
  - Click connections to navigate to linked notes
  - "Open Connection Source" command to jump to exact line where link appears
  - Grouped display showing all connections for active note
  - Automatic refresh when documents are saved
- [x] **Context preview in backlinks**: Show surrounding text/paragraph for each backlink (v1.22.0)
  - Each connection displays the line containing the link
  - Extended context available (configurable lines before/after)
  - Display text shown when using `[[link|Display Text]]` syntax
- [x] **Backlinks grouping**: Group backlinks by source note (v1.22.0)
  - Connections grouped by source/target note
  - Shows count when multiple connections exist to same note
  - Separate sections for "Outgoing Links" and "Backlinks"
- [ ] **Unlinked mentions**: Find notes that mention current note's title without explicit links

### Orphan & Placeholder Detection (inspired by Foam)
- [ ] **Orphan notes detection**: Identify notes with no incoming or outgoing links
- [ ] **Placeholder tracking**: Track `[[links]]` to notes that don't exist yet (dangling references)
- [ ] **Orphans explorer panel**: Dedicated tree view showing all orphaned notes
- [ ] **Placeholders explorer panel**: Show all placeholder links with source note context
- [ ] **Visual indicators**: Highlight orphans and placeholders in graph and tree views
- [x] **Auto-create from placeholder**: Create new note directly from placeholder link (v1.17.1)
  - Click broken `[[links]]` to create missing notes
  - Prompts for confirmation before creating
  - Creates in current month's folder
  - Opens automatically for editing

### Advanced Template System (inspired by Foam)
- [ ] **JavaScript templates**: Support templates with logic, functions, and conditionals
- [ ] **Enhanced template variables**: Add `FOAM_SLUG` (URL-friendly title), more date format options
- [ ] **Template selection on creation**: Choose template when creating note from placeholder link
- [ ] **Note creation from selection**: Select text in editor and create new linked note with it
- [ ] **Per-folder templates**: Different default templates for different note folders
- [ ] **Template inheritance**: Templates that extend/override base templates

### Section References (inspired by Foam)
- [ ] **Link to sections**: Support `[[note#Section Title]]` syntax for linking to specific sections
- [ ] **Section autocomplete**: Suggest available sections when typing `#` in wikilink
- [ ] **Section navigation**: Jump to specific section when clicking section link
- [ ] **Section backlinks**: Show which notes link to specific sections

### Hierarchical Tags (inspired by Foam)
- [ ] **Nested tag syntax**: Support `#parent/child/grandchild` hierarchical tag structure
- [ ] **Tag explorer panel**: Tree view showing tag hierarchy with expand/collapse
- [ ] **Tag hierarchy navigation**: Click nested tags to filter by entire hierarchy or specific level
- [ ] **Tag inheritance**: Child tags automatically include parent tag matches in filters
- [ ] **Tag breadcrumbs**: Show full tag path when hovering over nested tags

### Enhanced Graph Features (inspired by Foam)
- [x] **Graph filtering**: Show/hide specific notes, tags, or connection types in graph (v1.17.1)
  - Filter by "All Notes", "Connected Only", or "Orphans Only"
  - Real-time search to find and highlight specific notes
  - Layout switching between Force-Directed, Hierarchical, and Circular views
- [x] **Graph customization**: Adjust node colors, sizes, edge styles, and layout algorithms (v1.17.1)
  - Customizable node appearance: size (5-50), border width (1-6), shape (dot/diamond/square/triangle/star/hexagon)
  - Toggle node shadows on/off
  - Customizable edge appearance: width (1-8), color (color picker), style (smooth/dynamic/straight/cubic)
  - Toggle edge arrows on/off
  - Physics tuning: spring length (50-400), node repulsion (10k-50k), central gravity (0-1.0)
  - Custom color schemes for node connection levels (orphan, 1-2, 3-5, 6-10, 10+ connections)
  - Settings persist across sessions using VS Code webview state
  - Reset to defaults option available
  - Interactive customization panel with live preview of slider values
- [ ] **Orphan highlighting**: Visual indicator for orphaned notes in graph (different color/shape)
- [ ] **Export graph**: Save graph visualization as PNG/SVG image
- [x] **Graph focus mode**: Focus on single note and its immediate connections (v1.20.1)
  - Right-click any node to enter focus mode
  - Shows only the selected note and its immediate connections (1-hop neighbors)
  - Visual indicator displays focused note name with exit button
  - Focused node is highlighted with pink border and larger size
  - Connected edges highlighted in pink
  - "Focus Mode" button in toolbar shows active state
  - Easy exit via button or clicking "Focus Mode" toggle
- [x] **Connection strength**: Edge thickness based on number of links between notes (v1.14.0)
  - Bidirectional links shown with thicker edges (3px)
- [x] **Time-based filtering**: Show notes created/modified in specific time periods (v1.19.1)
  - Filter by preset time ranges: Today, Last 7/30/90/365 Days
  - Custom date range picker with start/end dates
  - Toggle between created and modified timestamps
  - Real-time filtering updates graph visualization
  - Integrated seamlessly with existing connection and search filters

### Attachment Support (inspired by Foam)
- [ ] **PDF support**: Link to PDFs with `[[document.pdf]]`, preview in hover
- [ ] **Image gallery**: Dedicated view for all images used across notes
- [ ] **Attachment folder**: Auto-organize attachments in dedicated folder structure
- [ ] **Drag-and-drop attachments**: Drop files into notes to create links and copy to attachments folder
- [ ] **Attachment preview**: Hover preview for PDFs, images, and other file types
- [ ] **Broken attachment detection**: Warn about missing or moved attachments

### Advanced Wikilink Features (inspired by Foam)
- [ ] **Link diagnostics**: Real-time warnings for ambiguous, broken, or circular links
- [ ] **Quick fixes**: Automated suggestions to fix link issues (create note, rename, etc.)
- [ ] **Unique identifiers**: Disambiguate notes with same name using file paths or IDs
- [ ] **Link validation**: Check all links in workspace and report issues
- [ ] **Case-sensitive link matching**: Option for strict vs. fuzzy link matching

### Connections Panel (inspired by Foam)
- [x] **Dedicated connections sidebar**: Always-visible panel showing all related notes (v1.22.0)
  - "Connections" view in sidebar activity bar
  - Auto-updates when switching between notes
  - Shows empty state when no note is active
- [x] **Bidirectional view**: Display both incoming (backlinks) and outgoing links together (v1.22.0)
  - Separate sections for "Outgoing Links (N)" and "Backlinks (N)"
  - Clear visual distinction between incoming and outgoing connections
  - Real-time count of connections in section headers
- [x] **Context snippets**: Show surrounding text for each connection with highlighting (v1.22.0)
  - Each connection shows the line containing the link
  - Tooltip displays full context with file metadata
  - Line numbers shown for easy navigation
  - Extended context available (configurable before/after lines)
- [x] **Grouped connections**: Group by connection type (v1.22.0)
  - Groups connections by source/target note
  - Shows connection count when multiple links exist
  - Organized by direct wiki-style `[[links]]`
- [x] **Connection strength indicators**: Show how many times notes reference each other (v1.22.0)
  - Connection count shown in grouped view
  - Multiple connections to same note grouped together
- [x] **Quick navigation**: Click connection to jump to linked note or specific mention (v1.22.0)
  - Click any connection to open the target note
  - Right-click menu: "Open Connection" and "Open Connection Source"
  - "Open Connection Source" navigates to exact line with link

### Editor Enhancements
- [ ] **Syntax highlighting for note content**: Custom syntax highlighting for note-specific patterns

### Other Ideas
- Export to different formats (PDF, HTML)
- Note encryption for sensitive information
- Collaboration features (shared notes)
- Cloud sync integration
- Mobile companion app
- Daily note reminders/notifications
- Note templates with form fields
- Statistics dashboard with charts
- Integration with other VS Code extensions

## Technical Debt

- [ ] Improve TypeScript types (reduce use of `any`)
- [ ] Add JSDoc comments for public APIs
- [ ] Performance optimization for large note collections

## Documentation Needs

- [ ] Add contributing guidelines
- [ ] Create user documentation/wiki
- [ ] Add inline code comments for complex logic
- [ ] Create video tutorials or GIFs for features
- [ ] Write migration guide for major version updates

### Visual Documentation for Graph Features
- [ ] **Screenshots for Graph Focus Mode**:
  - How to right-click a node to enter focus mode
  - The focus mode indicator appearance
  - Before/after comparison of full graph vs focused view
  - The pink active state of the Focus Mode button
- [ ] **Video Tutorial for Graph View**:
  - Common focus mode workflows
  - How focus mode helps with large graphs
  - Comparison between Focus Mode and Node Highlighting feature
  - Demonstrating all graph customization options
- [ ] **Graph View FAQ Section**:
  - "What's the difference between Focus Mode and Node Highlighting?"
  - "Can I use Focus Mode with filters and search?"
  - "Does Focus Mode persist when I close and reopen the graph?"
  - Common graph customization questions
- [ ] **Keyboard Shortcut for Focus Mode**: Consider adding keyboard shortcut for toggling focus mode (currently only via right-click and toolbar button)

## Architecture Status

### Modular Refactoring (Completed)

**Goal**: Split 2119-line extension.ts into maintainable, focused modules

#### Completed Modules (100%)
- [ ] **src/constants.ts** (93 lines) - All constants, templates, patterns
- [ ] **src/utils/** (3 files, ~150 lines)
  - validators.ts - Folder name validation
  - dateHelpers.ts - Date formatting utilities
  - folderHelpers.ts - Recursive folder operations
- [ ] **src/services/** (13 files, ~1400 lines)
  - configService.ts - Configuration management
  - fileSystemService.ts - File operation wrappers
  - noteService.ts - Note operations (search, stats, export)
  - templateService.ts - Template generation
  - searchService.ts - Advanced search with regex and filters (v1.6.0)
  - tagService.ts - Tag indexing and querying
  - tagCompletionProvider.ts - Tag autocomplete integration
  - pinnedNotesService.ts - Pinned notes management (v1.5.0)
  - archiveService.ts - Archive functionality (v1.5.0)
  - linkService.ts - Wiki-style links and backlinks (v1.5.0)
  - bulkOperationsService.ts - Multi-select and bulk operations (v1.10.0)
  - undoService.ts - Undo/redo functionality (v1.13.0)
  - undoHelpers.ts - Undo operation helpers (v1.13.0)
  - graphService.ts - Graph data preparation and analysis (v1.14.0)
- [ ] **src/providers/** (3 files, ~350 lines)
  - treeItems.ts - Tree item classes
  - templatesTreeProvider.ts - Templates view
  - notesTreeProvider.ts - Main notes tree with drag-and-drop
- [ ] **src/commands/** (2 files, ~900 lines)
  - commands.ts - Main command handlers
  - bulkCommands.ts - Bulk operation commands (v1.10.0)
- [ ] **src/calendar/** (2 files, ~560 lines)
  - calendarHelpers.ts - Calendar date operations
  - calendarView.ts - Calendar webview and HTML generation
- [ ] **src/graph/** (1 file)
  - graphView.ts - Interactive graph webview with vis.js
- [ ] **src/extension.ts** (1570 lines, down from 2119)
  - Entry point and command registration

**Status**: ✅ Completed - All modules created, compiles successfully

#### Benefits Achieved
- Clear separation of concerns
- Each module <700 lines (down from 2119)
- Better testability
- Easier navigation and maintenance
- Reusable components
- 26% reduction in extension.ts size (2119 → 1570 lines)

### Test Infrastructure (Completed)

#### CI/CD Pipeline (January 2025)
- ✅ All 184 tests passing locally and in CI/CD
- ✅ Tests pass on all platforms (Ubuntu, macOS, Windows)
- ✅ Tests pass on all Node versions (18.x, 20.x)
- ✅ Enhanced VS Code mocks (Position, Range, CompletionItem, MarkdownString, EventEmitter)
- ✅ Test execution time: ~270ms for full suite

#### Test Coverage
- [ ] **Unit Tests**: 184 passing tests covering all core functionality
- [ ] **Integration Tests**: 3 comprehensive test suites
  - `src/test/integration/commands.test.ts` - Note creation, editor, configuration, view, and search commands
  - `src/test/integration/noteManagement.test.ts` - Setup, folder management, export, and calendar commands
  - `src/test/integration/tagSystem.test.ts` - Tag view, filtering, autocomplete, and search integration
