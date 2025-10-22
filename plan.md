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
- [ ] **Rename symbol command**: Refactor/rename links across all notes in workspace

### Embedding Capabilities (inspired by Markdown Memo)
- [ ] **Embed notes**: Support `![[note-name]]` syntax to embed entire note content inline
- [ ] **Embed images**: Support `![[image.png]]` to display images within notes
- [ ] **Embed specific sections**: Support `![[note-name#section]]` to embed portions of notes
- [ ] **Embed with transclusion**: Live-updating embedded content when source changes

### Preview Enhancements (inspired by Markdown Memo)
- [ ] **Hover previews**: Show note/link preview on hover without opening the file
- [ ] **Inline image previews**: Display images directly in editor when using markdown image syntax
- [ ] **Embedded content rendering**: Render embedded notes/images in preview mode
- [ ] **Link preview cards**: Rich previews showing note metadata (tags, created date, etc.)

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
- [ ] **Dedicated backlinks sidebar panel**: Always-visible panel showing all incoming references
- [ ] **Context preview in backlinks**: Show surrounding text/paragraph for each backlink
- [ ] **Backlinks grouping**: Group backlinks by source note, date, or section
- [ ] **Unlinked mentions**: Find notes that mention current note's title without explicit links

### Orphan & Placeholder Detection (inspired by Foam)
- [ ] **Orphan notes detection**: Identify notes with no incoming or outgoing links
- [ ] **Placeholder tracking**: Track `[[links]]` to notes that don't exist yet (dangling references)
- [ ] **Orphans explorer panel**: Dedicated tree view showing all orphaned notes
- [ ] **Placeholders explorer panel**: Show all placeholder links with source note context
- [ ] **Visual indicators**: Highlight orphans and placeholders in graph and tree views
- [ ] **Auto-create from placeholder**: Create new note directly from placeholder link

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
- [ ] **Graph filtering**: Show/hide specific notes, tags, or connection types in graph
- [ ] **Graph customization**: Adjust node colors, sizes, edge styles, and layout algorithms
- [ ] **Orphan highlighting**: Visual indicator for orphaned notes in graph (different color/shape)
- [ ] **Export graph**: Save graph visualization as PNG/SVG image
- [ ] **Graph focus mode**: Focus on single note and its immediate connections
- [ ] **Connection strength**: Edge thickness based on number of links between notes
- [ ] **Time-based filtering**: Show notes created/modified in specific time periods

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
- [ ] **Dedicated connections sidebar**: Always-visible panel showing all related notes
- [ ] **Bidirectional view**: Display both incoming (backlinks) and outgoing links together
- [ ] **Context snippets**: Show surrounding text for each connection with highlighting
- [ ] **Grouped connections**: Group by connection type (direct links, tags, mentions)
- [ ] **Connection strength indicators**: Show how many times notes reference each other
- [ ] **Quick navigation**: Click connection to jump to linked note or specific mention

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
