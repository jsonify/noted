# Noted Extension - Development Plan

This document tracks planned features, improvements, and ideas for the Noted VS Code extension.

## Current Priorities

### Code Quality & Reliability
- [x] Add error handling around file operations (completed)
- [x] Convert synchronous file operations to async for better performance (completed)
- [x] Refactor to modular architecture (completed - 100%)
- [x] Complete modular refactoring (completed)
- [x] Add unit tests for core functionality (completed - 66 passing tests)
- [x] Create CI/CD pipeline for automated testing (completed - GitHub Actions)
- [ ] Add integration tests for VS Code commands

### Planned Features

#### Template System Enhancements
- [ ] Implement custom template feature (config exists but isn't used - `noted.useTemplate` and `noted.template`)
- [ ] Allow users to create and save their own templates
- [ ] Template variables beyond {date} and {time}

#### Note Organization & Discovery
- [x] Tag system for notes (completed - tag parsing, indexing, filtering, autocomplete)
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

### Note Tagging System (v1.4.0)
- Tag parsing with `#tagname` syntax
- Tag indexing service with async operations
- Tags tree view with usage counts
- Filter notes by tags (single or multiple)
- Tag autocomplete when typing `#`
- Sort tags alphabetically or by frequency
- Comprehensive unit tests for all tag functionality
- Tag completion provider with VS Code integration

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
