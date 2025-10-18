# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Links

- **[notes.md](./notes.md)**: Complete list of implemented features and current capabilities
- **[plan.md](./plan.md)**: Development roadmap, planned features, and todo list

## Project Overview

This is a VS Code extension called "Noted" (published as "noted" by jsonify) that provides organized workspace notes with templates, search, and daily tracking. The extension creates a sidebar activity bar with a tree view for managing notes organized by year/month.

## Build & Development Commands

- **Install dependencies**: `pnpm install`
- **Compile TypeScript**: `pnpm run compile`
- **Watch mode for development**: `pnpm run watch`
- **Test extension**: Press F5 in VS Code to open Extension Development Host

## Architecture

### Core Components

**Modular Architecture** (completed):
The extension now uses a fully modular architecture with clear separation of concerns:

- **`src/extension.ts`** (1570 lines): Entry point and command registration
- **`src/constants.ts`**: Shared constants, templates, and patterns
- **`src/utils/`**: Validation and helper functions
  - `validators.ts`: Folder name validation
  - `dateHelpers.ts`: Date formatting utilities
  - `folderHelpers.ts`: Recursive folder operations
- **`src/services/`**: Business logic and file operations
  - `configService.ts`: Configuration management
  - `fileSystemService.ts`: Async file operation wrappers
  - `noteService.ts`: Note operations (search, stats, export)
  - `templateService.ts`: Template generation
- **`src/providers/`**: VS Code tree view providers
  - `treeItems.ts`: Tree item classes
  - `templatesTreeProvider.ts`: Templates view
  - `notesTreeProvider.ts`: Main notes tree with drag-and-drop
- **`src/commands/`**: Command handlers
- **`src/calendar/`**: Calendar view functionality
  - `calendarHelpers.ts`: Calendar date operations
  - `calendarView.ts`: Webview and HTML generation

**File Operations**:
- All file I/O uses `fs.promises` API with async/await pattern
- Comprehensive error handling with try/catch blocks and user-friendly messages

### Key Classes

- **NotesTreeProvider**: Implements `vscode.TreeDataProvider<TreeItem>` for the sidebar tree view
  - Organizes notes into sections: Templates, Recent Notes, and hierarchical year/month folders
  - Refreshes via `_onDidChangeTreeData` EventEmitter
  - `getChildren()` handles different item types (SectionItem, NoteItem with types: year/month/note)

- **Tree Item Types**:
  - `TreeItem`: Base class extending `vscode.TreeItem`
  - `SectionItem`: Top-level sections (Templates, Recent Notes)
  - `TemplateItem`: Template options in the Templates section
  - `NoteItem`: Represents years, months, or individual note files
  - `WelcomeItem`/`ActionItem`: For welcome screen (though currently unused as welcome is defined in package.json)

### File Organization Pattern

Notes are stored in hierarchical structure:
```
{notesFolder}/{YYYY}/{MM-MonthName}/{YYYY-MM-DD}.{format}
```
Example: `Notes/2025/10-October/2025-10-02.txt`

### Template System

Four built-in templates in `generateTemplate()`:
- `problem-solution`: Problem/steps/solution/notes format
- `meeting`: Meeting notes with attendees/agenda/action items
- `research`: Research topic with questions/findings/sources
- `quick`: Just date header

Templates support `{date}` and `{time}` placeholders (though user-defined templates from config are not fully implemented - config template is defined but not used).

### Configuration

Settings in `package.json` contributions:
- `noted.notesFolder`: Folder name (default: "Notes")
- `noted.fileFormat`: "txt" or "md" (default: "txt")
- `noted.useTemplate`: Boolean (not currently used in code)
- `noted.template`: Template string (defined but not used - only built-in templates are used)

## Commands

All commands are registered in `activate()` and defined in package.json contributions:

**Primary Commands**:
- `noted.openToday` - Opens today's note, creates if doesn't exist (Cmd+Shift+N)
- `noted.insertTimestamp` - Inserts `[HH:MM AM/PM]` at cursor (Cmd+Shift+T)
- `noted.openWithTemplate` - Prompts for note name and template type

**Management Commands**:
- `noted.searchNotes` - Full-text search across all notes with preview
- `noted.showStats` - Shows total/weekly/monthly note counts
- `noted.exportNotes` - Exports notes by date range to single file
- `noted.deleteNote`, `renameNote`, `duplicateNote`, `copyPath` - File operations on notes
- `noted.moveNotesFolder` - Renames the notes folder location
- `noted.setupDefaultFolder`, `setupCustomFolder` - Initial setup commands

## Important Implementation Details

1. **File I/O is asynchronous**: All operations use `fs.promises` API with async/await pattern
2. **Comprehensive error handling**: All file operations wrapped in try/catch with user-friendly messages
3. **Search is recursive and async**: `searchInNotes()` in `noteService.ts` recursively reads all note files
4. **Date formatting**: Uses `toLocaleString('en-US', ...)` for consistent formatting
5. **Note names from templates**: Sanitized with `.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')`
6. **Tree view welcome**: Defined in package.json `viewsWelcome` with markdown buttons
7. **Modular structure**: Code split across 13+ modules for maintainability and testability

## VS Code Extension Specifics

- **Activation**: `onCommand:noted.openToday` (activates when command is first invoked)
- **VS Code API version**: ^1.80.0
- **Main entry**: `./out/extension.js` (compiled from TypeScript)
- **Activity bar icon**: Uses codicon `$(notebook)`
- **View ID**: `notedView` in container `notedExplorer`
- **Context values**: Notes have `contextValue: 'note'` for context menu visibility

## TypeScript Configuration

- Target: ES2020
- Module: CommonJS
- Strict mode enabled
- Output directory: `out/`
- Source maps enabled
