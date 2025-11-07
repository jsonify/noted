# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

- When reporting information to me, be extremely concise and sacrifice grammar for the sake of concision.

## Quick Links

- **[notes.md](./notes.md)**: Complete list of implemented features and current capabilities
- **[plan.md](./plan.md)**: Development roadmap, planned features, and todo list
- **[docs/](./docs/)**: Always update the website documentation when new features are added

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
  - `frontmatterParser.ts`: YAML frontmatter parsing and tag extraction (v1.24.0)
- **`src/services/`**: Business logic and file operations
  - `configService.ts`: Configuration management
  - `fileSystemService.ts`: Async file operation wrappers
  - `noteService.ts`: Note operations (search, stats, export)
  - `searchService.ts`: Advanced search with regex and filters (v1.6.0)
  - `templateService.ts`: Template generation
  - `tagService.ts`: Tag indexing and querying
  - `tagCompletionProvider.ts`: Tag autocomplete integration
  - `pinnedNotesService.ts`: Pinned notes management (v1.5.0)
  - `archiveService.ts`: Archive functionality (v1.5.0)
  - `linkService.ts`: Wiki-style links and backlinks (v1.5.0)
  - `connectionsService.ts`: Connection data for backlinks and outgoing links (v1.22.0)
  - `backlinksAppendService.ts`: Automatic backlinks sections appended to notes (v1.24.0)
  - `bulkOperationsService.ts`: Multi-select and bulk operations (v1.10.0)
  - `undoService.ts`: Undo/redo functionality (v1.13.0)
  - `undoHelpers.ts`: Undo operation helpers (v1.13.0)
  - `graphService.ts`: Graph data preparation and analysis (v1.14.0)
  - `activityService.ts`: Activity metrics collection and analysis (v1.36.0)
- **`src/providers/`**: VS Code tree view providers
  - `treeItems.ts`: Tree item classes (includes ConnectionSectionItem and ConnectionItem)
  - `templatesTreeProvider.ts`: Templates view
  - `notesTreeProvider.ts`: Main notes tree with drag-and-drop
  - `connectionsTreeProvider.ts`: Connections panel for showing backlinks and outgoing links (v1.22.0)
- **`src/commands/`**: Command handlers
  - `commands.ts`: Main command handlers
  - `tagCommands.ts`: Tag management commands
  - `bulkCommands.ts`: Bulk operation commands (v1.10.0)
- **`src/calendar/`**: Calendar view functionality
  - `calendarHelpers.ts`: Calendar date operations
  - `calendarView.ts`: Webview and HTML generation
- **`src/graph/`**: Graph view visualization
  - `graphView.ts`: Interactive graph webview with vis.js
- **`src/activity/`**: Activity chart visualization (v1.36.0)
  - `activityView.ts`: Stacked area chart webview with Chart.js

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
  - `NoteItem`: Represents years, months, or individual note files with selection support (v1.10.0)
    - `isSelected` property tracks selection state
    - `setSelected()` method updates visual appearance (checkmark icon when selected)
    - `contextValue` changes to 'note-selected' when in select mode
  - `WelcomeItem`/`ActionItem`: For welcome screen (though currently unused as welcome is defined in package.json)

- **BulkOperationsService** (v1.10.0): Manages multi-select state and bulk operations
  - Tracks selected notes in a `Set<string>` for efficient operations
  - Manages select mode state (on/off)
  - Provides methods: `select()`, `deselect()`, `toggleSelection()`, `selectMultiple()`, `clearSelection()`
  - Fires `onDidChangeSelection` events to refresh tree view
  - Integrates with VS Code context variables for conditional UI (`noted.selectModeActive`, `noted.hasSelectedNotes`)

- **GraphService** (v1.14.0): Builds and analyzes note connection graphs
  - Leverages `LinkService` to extract wiki-style link data
  - Builds graph with nodes (notes) and edges (links between notes)
  - Provides graph statistics: total notes, total links, orphan notes, most connected note
  - Supports node coloring based on connection count
  - Calculates node sizes using logarithmic scaling for better visual distribution
  - Identifies bidirectional links (notes that link to each other)

- **ActivityService** (v1.36.0): Collects and analyzes activity metrics over time
  - Tracks three key metrics: notes created, tags added, links created
  - `getWeeklyActivity(weeks)` returns activity data for the last N weeks
  - Infers historical data from file creation (`birthtime`) and modification (`mtime`) timestamps
  - Groups activity into weekly buckets for visualization
  - `getActivityStats()` provides summary statistics and averages
  - Integrates with `LinkService` and `TagService` for accurate metrics
  - Recursively processes all note files while excluding templates folder

- **EmbedService** (v1.5.0, diagram support v1.31.0): Manages note, image, and diagram embeds
  - Extracts embeds using `![[note-name]]`, `![[image.png]]`, and `![[diagram.drawio]]` syntax
  - Supports section-specific embeds: `![[note#section]]`
  - Supports custom display text: `![[note|Display Text]]`
  - Image resolution: Supports relative, absolute, and workspace-relative paths
  - Section extraction: Supports both markdown headers and text-style headings
  - Transclusion support: Live-updating embeds when source files change
  - Diagram support (v1.31.0): Embeds Draw.io and Excalidraw diagram files
    - Supported formats: `.drawio`, `.excalidraw`, `.excalidraw.svg`, `.excalidraw.png`
    - Raw diagram files (`.drawio`, `.excalidraw`) show clickable links to open in their editors
    - Exported formats (`.svg`, `.png`) render inline as images
    - Requires Draw.io Integration (hediet.vscode-drawio) or Excalidraw (pomdtr.excalidraw-editor) extensions

- **ConnectionsService** (v1.22.0): Manages connection data for the connections panel
  - Builds on `LinkService` to provide enriched connection information
  - `getConnectionsForNote()` returns incoming (backlinks) and outgoing connections
  - Extracts context snippets showing lines before/after each connection
  - Groups connections by source/target note for better organization
  - Tracks connection strength (number of links between notes)
  - Configurable context lines via `setContextLines(before, after)`

- **ConnectionsTreeProvider** (v1.22.0): Tree provider for the connections sidebar panel
  - Implements `vscode.TreeDataProvider<TreeItem>` for connections view
  - Shows two main sections: "Outgoing Links" and "Backlinks" with counts
  - Auto-updates when active editor changes or documents are saved
  - `updateForNote()` refreshes panel for specific note
  - Displays empty state when no note is active
  - Connection items are clickable to navigate to linked notes

- **Connection Tree Items** (v1.22.0):
  - `ConnectionSectionItem`: Section headers for "Outgoing Links (N)" and "Backlinks (N)"
  - `ConnectionItem`: Individual connections with target path, source path, line number, context
    - Shows filename as label with line number in description
    - Tooltip displays full context and metadata
    - Clickable to open target note
    - Context menu: "Open Connection" and "Open Connection Source"

- **BacklinksAppendService** (v1.24.0): Automatically appends backlinks sections to notes
  - Maintains a "Backlinks" section at the end of each note file
  - Format: `- [[source-note]] - #tag1 #tag2` (tags from source note's frontmatter)
  - `updateBacklinksSection()` updates a specific note's backlinks section
  - `updateBacklinksForLinkedNotes()` updates all target notes when a file is saved
  - `rebuildAllBacklinks()` regenerates backlinks sections for all notes
  - `clearAllBacklinks()` removes all backlinks sections from workspace
  - Prevents circular updates using `processingFiles` set
  - Integrates with `LinkService` backlinks cache
  - Controlled by `noted.autoBacklinks` configuration setting (default: true)

- **TagService** (v1.36.0): Location-based tag indexing with hierarchical support
  - Core data structure: `Map<string, Location<Tag>[]>` (tag → locations with exact positions)
  - Supports inline #hashtags and YAML frontmatter tags
  - Supports hierarchical tags with '/' separator (e.g., `#project/frontend`)
  - `buildTagIndex()` builds tag index from all notes
  - `getLocationsForTag()` returns all locations for a tag
  - `getLocationsForTagInFile()` returns locations in specific file
  - `getTagAtPosition()` finds tag at cursor position (for F2 rename)
  - `getTagReferenceCount()` counts total occurrences (not just unique files)
  - `getAllTagLabels()` returns all tag names
  - Hierarchical utilities: `splitTagPath()`, `getTagHierarchy()`, `isChildTag()`, `getParentTag()`, `getChildTags()`

- **TagsTreeProvider** (v1.36.0): Hierarchical tag navigation (tags → files → line references)
  - Three-level hierarchy: TagItem → TagFileItem → TagReferenceItem
  - Root level: All tags sorted alphabetically with reference counts
  - Tag level: Files containing the tag with occurrence counts
  - File level: Line references with context snippets
  - Click line references to jump to exact position with tag highlighted
  - Removed old filtering system (deprecated in favor of hierarchical view)

- **TagRenameProvider** (v1.36.0): F2 rename support for tags
  - Implements `vscode.RenameProvider` for inline #hashtags and YAML tags
  - `prepareRename()` detects if cursor is on a tag
  - `provideRenameEdits()` generates atomic workspace edits for all occurrences
  - Validates new tag name with format checking
  - Prompts for confirmation if target tag already exists (merge detection)
  - Atomic operations with rollback support via WorkspaceEdit

- **TagEditService** (v1.36.0): Advanced tag editing operations
  - `validateTagRename()` validates tag rename with error messages
  - `createRenameEdits()` creates workspace edit for single tag rename
  - `createHierarchicalRenameEdits()` renames parent and all child tags together
  - `openWorkspaceSearch()` opens VS Code search with tag regex pattern
  - `hasChildren()`, `getChildCount()` helper methods for hierarchy checks

### File Organization Pattern

Notes are stored in hierarchical structure:
```
{notesFolder}/{YYYY}/{MM-MonthName}/{YYYY-MM-DD}.{format}
```
Example: `Notes/2025/10-October/2025-10-02.txt`

### Template System

**Built-in Templates** in `generateTemplate()`:
- `problem-solution`: Problem/steps/solution/notes format
- `meeting`: Meeting notes with attendees/agenda/action items
- `research`: Research topic with questions/findings/sources
- `quick`: Just date header

**Custom Templates** (v1.4.0):
- Users can create custom templates in `{notesPath}/.templates/` folder
- Template files use the same format as notes (.txt or .md based on config)
- Full CRUD operations: create, edit, delete, duplicate templates
- Templates are automatically discovered and available in the template picker

**Template Variables** (v1.4.0):
Templates support 10 powerful placeholders via `replacePlaceholders()` function in `templateService.ts`:
- `{filename}`: Note file name
- `{date}`: Full date (Sunday, October 19, 2025)
- `{time}`: 12-hour time with AM/PM
- `{year}`: Year (2025)
- `{month}`: Month with leading zero (10)
- `{day}`: Day with leading zero (19)
- `{weekday}`: Short day name (Sun, Mon, etc.)
- `{month_name}`: Full month name (October)
- `{user}`: System username from `os.userInfo()`
- `{workspace}`: VS Code workspace name

**Template Functions**:
- `generateTemplate()`: Main template generation with placeholder replacement
- `getCustomTemplates()`: Lists all custom template files
- `getCustomTemplatePath()`: Returns full path to a template file
- `getTemplatePreview()`: Previews template with sample data
- `getTemplateVariables()`: Returns list of all available variables with descriptions
- `replacePlaceholders()`: Core function that replaces all variables in template content

### Configuration

Settings in `package.json` contributions:
- `noted.notesFolder`: Folder name (default: "Notes")
- `noted.fileFormat`: "txt" or "md" (default: "txt")
- `noted.useTemplate`: Boolean (not currently used in code)
- `noted.template`: Template string (defined but not used - only built-in templates are used)
- `noted.tagAutoComplete`: Enable tag autocomplete (default: true)
- `noted.autoBacklinks`: Automatically append backlinks sections to notes (default: true, v1.24.0)

## Commands

All commands are registered in `activate()` and defined in package.json contributions:

**Primary Commands**:
- `noted.openToday` - Opens today's note, creates if doesn't exist (Cmd+Shift+N)
- `noted.insertTimestamp` - Inserts `[HH:MM AM/PM]` at cursor (Cmd+Shift+T)
- `noted.openWithTemplate` - Prompts for note name and template type (Cmd+K Cmd+N)
- `noted.refresh` - Refresh the notes tree view (Cmd+Shift+R)

**Template Commands** (v1.4.0):
- `noted.createCustomTemplate` - Create a new custom template with starter content
- `noted.editCustomTemplate` - Open and edit an existing custom template
- `noted.deleteCustomTemplate` - Delete a custom template with confirmation
- `noted.duplicateCustomTemplate` - Duplicate a template as starting point for new one
- `noted.previewTemplateVariables` - Show webview with all available template variables
- `noted.openTemplatesFolder` - Open the templates folder in system file explorer

**Search Commands** (enhanced v1.6.0):
- `noted.searchNotes` - Advanced search with regex and filters (regex:, case:, tag:, from:, to:) (Cmd+Shift+F)
- `noted.quickSwitcher` - Quick access to 20 most recent notes (Cmd+Shift+P)

**Tag Commands** (redesigned v1.36.0):
- `noted.searchTag` - Search for tag in workspace (opens VS Code search with regex)
- `noted.refreshTags` - Rebuild tag index and refresh Tags view
- `noted.renameTag` - Rename a tag across all notes (also available via F2 on any tag)
- `noted.mergeTags` - Merge two tags into one
- `noted.deleteTag` - Delete a tag from all notes
- `noted.exportTags` - Export tags to JSON file
- `noted.filterByTag` - (Deprecated v1.36.0) Shows message to use hierarchical Tags view
- `noted.clearTagFilters` - (Deprecated v1.36.0) No longer needed
- `noted.sortTagsByName` - (Deprecated v1.36.0) Tags always sorted alphabetically
- `noted.sortTagsByFrequency` - (Deprecated v1.36.0) No longer available

**Management Commands**:
- `noted.showStats` - Shows total/weekly/monthly note counts (Cmd+Shift+S)
- `noted.showCalendar` - Show calendar view for navigating daily notes (Cmd+Shift+C)
- `noted.showGraph` - Show interactive graph view of note connections (Cmd+Shift+G)
- `noted.showActivity` - Show activity chart with notes created, tags added, and links created over 12 weeks (v1.36.0)
- `noted.exportNotes` - Exports notes by date range to single file (Cmd+Shift+E)
- `noted.deleteNote`, `renameNote`, `duplicateNote`, `copyPath` - File operations on notes
- `noted.moveNotesFolder` - Renames the notes folder location
- `noted.setupDefaultFolder`, `setupCustomFolder` - Initial setup commands

**Bulk Operations Commands** (v1.10.0):
- `noted.toggleSelectMode` - Enter/exit select mode for multi-selecting notes
- `noted.toggleNoteSelection` - Select/deselect individual note (appears in context menu when in select mode)
- `noted.selectAllNotes` - Select all visible notes
- `noted.clearSelection` - Deselect all notes and optionally exit select mode
- `noted.bulkDelete` - Delete all selected notes with confirmation dialog
- `noted.bulkMove` - Move all selected notes to a folder with picker
- `noted.bulkArchive` - Archive all selected notes with confirmation

**Undo/Redo Commands** (v1.13.0):
- `noted.undo` - Undo last destructive operation (Cmd+Alt+Z)
- `noted.redo` - Redo last undone operation (Cmd+Shift+Alt+Z)
- `noted.showUndoHistory` - Show complete undo history with operation details
- `noted.clearUndoHistory` - Clear all stored undo history

**Connections Panel Commands** (v1.22.0):
- `noted.refreshConnections` - Rebuild backlinks index and refresh connections panel
- `noted.openConnection` - Open the target note of a connection (invoked by clicking connection item)
- `noted.openConnectionSource` - Navigate to the source note and jump to the line where the link appears

**Auto-Backlinks Commands** (v1.24.0):
- `noted.rebuildBacklinks` - Rebuild backlinks index and regenerate all backlinks sections in notes
- `noted.clearBacklinks` - Remove all backlinks sections from all notes (with confirmation)

## Important Implementation Details

1. **File I/O is asynchronous**: All operations use `fs.promises` API with async/await pattern
2. **Comprehensive error handling**: All file operations wrapped in try/catch with user-friendly messages
3. **Search functionality**:
   - Legacy: `searchInNotes()` in `noteService.ts` for basic tag-filtered search
   - Advanced (v1.6.0): `advancedSearch()` in `searchService.ts` with regex, date filters, and tag filtering
   - Both are recursive and async for optimal performance
4. **Search query parsing**: `parseSearchQuery()` extracts filters from query strings (regex:, case:, tag:, from:, to:)
5. **Date formatting**: Uses `toLocaleString('en-US', ...)` for consistent formatting
6. **Note names from templates**: Sanitized with `.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')`
7. **Tree view welcome**: Defined in package.json `viewsWelcome` with markdown buttons
8. **Modular structure**: Code split across 14+ modules for maintainability and testability
9. **Bulk operations** (v1.10.0):
   - Selection state managed by `BulkOperationsService` using `Set<string>` for efficient lookups
   - Visual feedback: selected notes show checkmark icon and `contextValue: 'note-selected'`
   - Context variables control UI visibility: `noted.selectModeActive`, `noted.hasSelectedNotes`
   - All bulk operations show confirmation dialogs with previews (up to 10 notes listed)
   - Comprehensive testing: 51 unit tests in `bulkOperationsService.test.ts`

## VS Code Extension Specifics

- **Activation**: `onCommand:noted.openToday` (activates when command is first invoked)
- **VS Code API version**: ^1.80.0
- **Main entry**: `./out/extension.js` (compiled from TypeScript)
- **Activity bar icon**: Uses codicon `$(notebook)`
- **View IDs in container `notedExplorer`**:
  - `notedTemplatesView` - Templates view
  - `notedView` - Main notes tree view
  - `notedConnectionsView` - Connections panel (v1.22.0)
  - `notedTagsView` - Tags view
- **Context values**:
  - Notes have `contextValue: 'note'` for context menu visibility
  - Selected notes have `contextValue: 'note-selected'` (v1.10.0)
  - Tags have `contextValue: 'tag'` for context menu visibility (v1.36.0)
  - Tag files have `contextValue: 'tag-file'` (v1.36.0)
  - Tag references have `contextValue: 'tag-reference'` (v1.36.0)
  - Connection items have `contextValue: 'connection'` (v1.22.0)
  - Connection sections have `contextValue: 'connection-section'` (v1.22.0)
  - Context variables: `noted.selectModeActive`, `noted.hasSelectedNotes`

## TypeScript Configuration

- Target: ES2020
- Module: CommonJS
- Strict mode enabled
- Output directory: `out/`
- Source maps enabled
