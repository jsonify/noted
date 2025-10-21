# Noted Extension - Development Plan

This document tracks planned features, improvements, and ideas for the Noted VS Code extension.

## Current Priorities

### Code Quality & Reliability
- [x] Add error handling around file operations (completed)
- [x] Convert synchronous file operations to async for better performance (completed)
- [x] Refactor to modular architecture (completed - 100%)
- [x] Complete modular refactoring (completed)
- [x] Add unit tests for core functionality (completed - 184 passing tests)
- [x] Create CI/CD pipeline for automated testing (completed - GitHub Actions, all tests passing)
- [x] Fix CI/CD test failures (completed - enhanced VS Code mocks with Position, Range, CompletionItem, MarkdownString, EventEmitter)
- [x] Add integration tests for VS Code commands (completed - 3 integration test suites)

### Planned Features

#### Template System Enhancements
- [x] Implement custom template feature (completed v1.4.0)
- [x] Allow users to create and save their own templates (completed v1.4.0)
- [x] Template variables beyond {date} and {time} (completed v1.4.0 - 10 total variables)

#### Note Organization & Discovery
- [x] Tag system for notes (completed - tag parsing, indexing, filtering, autocomplete)
- [x] Advanced tag management (rename, merge, delete, export tags) - completed v1.5.0
- [x] Note linking/backlinks (wiki-style links) - completed v1.5.0
- [x] Pinned/favorite notes section - completed v1.5.0
- [x] Archive functionality for old notes - completed v1.5.0
- [x] Calendar view for daily notes

#### Search & Navigation
- [x] Search with regex support (completed - supports regex: flag)
- [x] Advanced filters (by date range, tags, etc.) (completed - from:, to:, tag:, case: filters)
- [x] Quick switcher for recent notes (completed - Cmd+Shift+P shows 20 recent notes)
- [x] Full-text search with better performance (async) (completed - async search with parallel processing)

#### Editor Enhancements
- [x] Markdown preview for .md files - completed v1.12.0
- [ ] Syntax highlighting for note content
- [x] Auto-completion for tags (completed - tag autocomplete with # trigger)

#### UX Improvements
- [x] Keyboard shortcuts for more commands (completed - 7 new shortcuts added)
- [x] Drag-and-drop to move notes between folders
- [x] Bulk operations (move/delete multiple notes) - completed v1.10.0-1.11.0
- [x] Undo/redo functionality for destructive operations - completed v1.13.0
- [x] Confirmation dialogs with preview (completed for bulk operations)

## Completed Features

### Undo/Redo System (v1.13.0)
- **Comprehensive Operation Tracking**: Automatically tracks all destructive operations
- **Supported Operations**: Delete, rename, move, archive, bulk delete, bulk move, bulk archive
- **Smart Restore**: Restores files with original content and location information
- **History Management**: View complete history with operation details and timestamps
- **Keyboard Shortcuts**:
  - Undo: `Cmd+Alt+Z` / `Ctrl+Alt+Z`
  - Redo: `Cmd+Shift+Alt+Z` / `Ctrl+Shift+Alt+Z`
- **History Commands**: Show history and clear history options
- **Persistent Storage**: Undo history persists across VS Code sessions
- **Operation Details**: Each entry shows type, affected files, and timestamp
- **Services Architecture**: Dedicated undoService.ts and undoHelpers.ts modules

### Markdown Preview (v1.12.0)
- **Live Preview**: Real-time markdown rendering for .md files
- **Editor Integration**: Toggle button in editor title bar for markdown files
- **Keyboard Shortcut**: `Cmd+K Cmd+V` / `Ctrl+K Ctrl+V`
- **Side-by-Side View**: View source and preview simultaneously
- **Auto-Update**: Preview automatically refreshes as you type
- **VS Code Integration**: Uses native VS Code markdown preview capabilities

### Bulk Operations (v1.10.0-1.11.0)
- **Select Mode**: Toggle selection mode to select multiple notes at once
- **Visual Selection**: Selected notes show checkmark icon for clear feedback
- **Bulk Delete**: Delete multiple notes with confirmation dialog showing affected notes
- **Bulk Move**: Move multiple notes to a folder with picker and preview
- **Bulk Archive**: Archive multiple selected notes with confirmation
- **Selection Management**:
  - Toggle select mode with toolbar button
  - Click notes to select/deselect in select mode
  - Clear all selections with one click
  - Selection count displayed in status
- **Context-Aware UI**: Bulk operation buttons only appear when notes are selected
- **Safety Features**: All destructive operations show confirmation dialogs with note previews
- **Comprehensive Testing**: 51 unit tests covering all bulk operation scenarios

### Enhanced Keyboard Shortcuts (v1.10.0)
- Added 7 new keyboard shortcuts for frequently used commands
- Search Notes: `Cmd+Shift+F` / `Ctrl+Shift+F`
- Show Calendar: `Cmd+Shift+C` / `Ctrl+Shift+C`
- Show Statistics: `Cmd+Shift+S` / `Ctrl+Shift+S`
- Export Notes: `Cmd+Shift+E` / `Ctrl+Shift+E`
- Refresh View: `Cmd+Shift+R` / `Ctrl+Shift+R`
- Open with Template: `Cmd+K Cmd+N` / `Ctrl+K Ctrl+N` (chord shortcut)
- Filter by Tag: `Cmd+K Cmd+T` / `Ctrl+K Ctrl+T` (chord shortcut)
- All shortcuts support both Mac and Windows/Linux
- Added dedicated Keyboard Shortcuts section to documentation
- Updated all feature documentation with inline shortcut references

### Template System Enhancements (v1.4.0)
- Custom template creation with full management UI
- Template editing, deletion, and duplication commands
- Extended variable system with 10 placeholders:
  - Basic: `{filename}`, `{date}`, `{time}`
  - Date components: `{year}`, `{month}`, `{day}`, `{weekday}`, `{month_name}`
  - Context: `{user}`, `{workspace}`
- Template variables reference panel (webview)
- Templates folder management
- Enhanced starter template with all available variables
- Comprehensive unit tests (199 passing)
- Updated Templates view welcome screen with new commands

### Note Tagging System (v1.4.0)
- Tag parsing with `#tagname` syntax
- Tag indexing service with async operations
- Tags tree view with usage counts
- Filter notes by tags (single or multiple)
- Tag autocomplete when typing `#`
- Sort tags alphabetically or by frequency
- Comprehensive unit tests for all tag functionality
- Tag completion provider with VS Code integration

### Advanced Tag Management (v1.5.0)
- Rename tags across all notes with validation
- Merge two tags into one with duplicate removal
- Delete tags from all notes with confirmation
- Export tags to JSON format with metadata
- Context menu integration in tags tree view
- Command palette entries for all operations
- Automatic tag index refresh after operations
- Rollback support for destructive operations

### Note Organization & Discovery Features (v1.5.0)

#### Wiki-Style Note Linking
- `[[note-name]]` syntax for linking between notes
- Clickable links that open target notes
- Automatic link resolution with fuzzy matching
- Link detection across all note files
- Document link provider for VS Code integration

#### Backlinks System
- Automatic backlink detection and indexing
- Hover over note header to see all backlinks
- Display source note and context for each backlink
- Clickable backlinks to navigate between notes
- Async index building for performance

#### Pinned/Favorite Notes
- Pin frequently accessed notes for quick access
- Dedicated "Pinned Notes" section in tree view
- Visual pin indicator (📌) on pinned notes
- Persistent pinned state across sessions
- Right-click context menu to pin/unpin notes
- Automatic cleanup of non-existent pinned notes

#### Archive Functionality
- Archive old or completed notes
- Dedicated ".archive" folder (hidden from main view)
- "Archive" section in tree view for archived notes
- Bulk archive notes older than X days
- Unarchive notes back to active notes
- Visual archive indicator (📦) on archived notes
- Confirmation dialogs for safety

### Search & Navigation Enhancements (v1.6.0)
- Regex search support with `regex:` flag for pattern matching
- Advanced date filtering with `from:YYYY-MM-DD` and `to:YYYY-MM-DD` syntax
- Case-sensitive search with `case:` flag
- Tag filtering in search with `tag:tagname` syntax
- Quick switcher for recent notes (Cmd+Shift+P) showing 20 most recent notes
- Enhanced search results with match counts and metadata
- Async search with optimized performance for large note collections
- Rich preview showing tags, dates, and match information

See [notes.md](./notes.md) for a complete list of all implemented features.

## Ideas for Future Consideration

- Export to different formats (PDF, HTML)
- Note encryption for sensitive information
- Collaboration features (shared notes)
- Cloud sync integration
- Mobile companion app
- Daily note reminders/notifications
- Note templates with form fields
- Graph view of note connections
- Statistics dashboard with charts
- Integration with other VS Code extensions

## Technical Debt

- [x] Refactor single-file architecture into modules (completed - see Modular Refactoring Status below)
- [ ] Improve TypeScript types (reduce use of `any`)
- [ ] Add JSDoc comments for public APIs
- [ ] Performance optimization for large note collections
- [x] Better error messages for users (completed with async refactoring)

## Modular Refactoring Status

**Goal**: Split 2119-line extension.ts into maintainable, focused modules

### ✅ Completed Modules (100%)
- **src/constants.ts** (93 lines) - All constants, templates, patterns
- **src/utils/** (3 files, ~150 lines)
  - validators.ts - Folder name validation
  - dateHelpers.ts - Date formatting utilities
  - folderHelpers.ts - Recursive folder operations
- **src/services/** (13 files, ~1400 lines)
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
- **src/providers/** (3 files, ~350 lines)
  - treeItems.ts - Tree item classes
  - templatesTreeProvider.ts - Templates view
  - notesTreeProvider.ts - Main notes tree with drag-and-drop
- **src/commands/** (2 files, ~900 lines)
  - commands.ts - Main command handlers
  - bulkCommands.ts - Bulk operation commands (v1.10.0)
- **src/calendar/** (2 files, ~560 lines)
  - calendarHelpers.ts - Calendar date operations
  - calendarView.ts - Calendar webview and HTML generation
- **src/extension.ts** (1570 lines, down from 2119)
  - Entry point and command registration

**Status**: ✅ Completed - All modules created, compiles successfully

### Benefits Achieved
- Clear separation of concerns
- Each module <700 lines (down from 2119)
- Better testability
- Easier navigation and maintenance
- Reusable components
- 26% reduction in extension.ts size (2119 → 1570 lines)

## Documentation Needs

- [ ] Add contributing guidelines
- [ ] Create user documentation/wiki
- [ ] Add inline code comments for complex logic
- [ ] Create video tutorials or GIFs for features
- [ ] Write migration guide for major version updates

## Recent Test Infrastructure Improvements

### CI/CD Test Fix (Completed - January 2025)
**Problem**: 21 tests failing in GitHub Actions CI/CD pipeline due to incomplete VS Code API mocks

**Solution**: Enhanced VS Code mock implementation in `src/test/mocks/vscode.ts`
- Added `Position` class for text document positions
- Added `Range` class with proper TypeScript constructor overloads
- Added `EndOfLine` enum (LF, CRLF)
- Added `CompletionItemKind` enum for autocomplete types
- Added `CompletionItem` class for tag autocomplete
- Added `MarkdownString` class for formatted documentation
- Fixed `EventEmitter.event` to use getter pattern instead of method

**Results**:
- ✅ All 184 tests now passing locally and in CI/CD
- ✅ Tests pass on all platforms (Ubuntu, macOS, Windows)
- ✅ Tests pass on all Node versions (18.x, 20.x)
- ✅ Fixed `setup.ts` cleanup function to not attempt resolving mock modules
- ✅ Test execution time: ~270ms for full suite

**Files Changed**:
- `src/test/mocks/vscode.ts` - Added 7 new VS Code API types
- `src/test/setup.ts` - Fixed cleanup logic for mock modules

### Integration Tests Addition (Completed - January 2025)
**Goal**: Add integration tests for VS Code commands that run in Extension Host environment

**Implementation**: Created 3 comprehensive integration test suites
- `src/test/integration/commands.test.ts` - Note creation, editor, configuration, view, and search commands
- `src/test/integration/noteManagement.test.ts` - Setup, folder management, export, and calendar commands
- `src/test/integration/tagSystem.test.ts` - Tag view, filtering, autocomplete, and search integration

**Test Coverage**:
- ✅ Note creation commands (openToday, openWithTemplate with all 4 templates)
- ✅ Editor commands (insertTimestamp)
- ✅ Configuration commands (changeFormat, showConfig)
- ✅ View commands (refresh, showStats)
- ✅ Search commands (searchNotes)
- ✅ Setup commands (setupDefaultFolder)
- ✅ Folder management (createFolder)
- ✅ Export commands (exportNotes)
- ✅ Calendar commands (showCalendar)
- ✅ Tag system (refreshTags, sortTagsByName, sortTagsByFrequency, filterByTag)
- ✅ Tag autocomplete (completion provider integration)
- ✅ Tag configuration (tagAutoComplete setting)

**Results**:
- ✅ All integration tests compile and run in VS Code Extension Host
- ✅ Tests verify command execution without errors
- ✅ Tests validate file creation, content structure, and configuration changes
- ✅ Unit tests continue to pass (184 tests)
