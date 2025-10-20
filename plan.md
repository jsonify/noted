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
- [ ] Note linking/backlinks (wiki-style links)
- [ ] Pinned/favorite notes section
- [ ] Archive functionality for old notes
- [x] Calendar view for daily notes

#### Search & Navigation
- [ ] Search with regex support
- [ ] Advanced filters (by date range, tags, etc.)
- [ ] Quick switcher for recent notes
- [ ] Full-text search with better performance (async)

#### Editor Enhancements
- [ ] Markdown preview for .md files
- [ ] Syntax highlighting for note content
- [x] Auto-completion for tags (completed - tag autocomplete with # trigger)

#### UX Improvements
- [ ] Keyboard shortcuts for more commands
- [x] Drag-and-drop to move notes between folders
- [ ] Bulk operations (move/delete multiple notes)
- [ ] Undo functionality for destructive operations
- [ ] Confirmation dialogs with preview

## Completed Features

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
- **src/services/** (4 files, ~400 lines)
  - configService.ts - Configuration management
  - fileSystemService.ts - File operation wrappers
  - noteService.ts - Note operations (search, stats, export)
  - templateService.ts - Template generation
- **src/providers/** (3 files, ~350 lines)
  - treeItems.ts - Tree item classes
  - templatesTreeProvider.ts - Templates view
  - notesTreeProvider.ts - Main notes tree with drag-and-drop
- **src/commands/** (1 file, ~700 lines)
  - commands.ts - All command handlers
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
