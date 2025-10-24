---
layout: default
title: Architecture Overview
parent: Development
nav_order: 1
---

# Architecture Overview

Noted uses a modular, service-oriented architecture designed for maintainability, testability, and extensibility.

## Design Principles

### Separation of Concerns

Code is organized into focused modules:
- **Services** handle business logic
- **Providers** integrate with VS Code
- **Commands** handle user actions
- **Utils** provide shared functionality

### Async/Await Pattern

All file I/O uses `fs.promises` API:
- Non-blocking operations
- Prevents UI freezing
- Better error handling
- Improved performance

### Comprehensive Error Handling

Every file operation has:
- Try/catch blocks
- User-friendly error messages
- Graceful degradation
- Error logging

## Project Structure

```
noted/
├── src/
│   ├── extension.ts           # Entry point (1570 lines)
│   ├── constants.ts            # Shared constants and patterns
│   ├── utils/                  # Helper functions
│   │   ├── validators.ts       # Validation functions
│   │   ├── dateHelpers.ts      # Date formatting
│   │   └── folderHelpers.ts    # Folder operations
│   ├── services/               # Business logic (13 services)
│   │   ├── configService.ts
│   │   ├── fileSystemService.ts
│   │   ├── noteService.ts
│   │   ├── templateService.ts
│   │   ├── searchService.ts
│   │   ├── tagService.ts
│   │   ├── tagCompletionProvider.ts
│   │   ├── pinnedNotesService.ts
│   │   ├── archiveService.ts
│   │   ├── linkService.ts
│   │   ├── bulkOperationsService.ts
│   │   ├── undoService.ts
│   │   ├── undoHelpers.ts
│   │   └── graphService.ts
│   ├── providers/              # VS Code providers
│   │   ├── treeItems.ts        # Tree item classes
│   │   ├── templatesTreeProvider.ts
│   │   └── notesTreeProvider.ts
│   ├── commands/               # Command handlers
│   │   ├── commands.ts
│   │   ├── tagCommands.ts
│   │   └── bulkCommands.ts
│   ├── calendar/               # Calendar view
│   │   ├── calendarHelpers.ts
│   │   └── calendarView.ts
│   ├── graph/                  # Graph visualization
│   │   └── graphView.ts
│   └── test/                   # Testing
│       ├── setup.ts
│       ├── mocks/
│       │   └── vscode.ts
│       └── unit/               # Unit tests
├── docs/                       # Documentation site
├── out/                        # Compiled JavaScript
└── package.json                # Extension manifest
```

## Core Modules

### Extension Entry Point

**`src/extension.ts`** (1570 lines)

Responsibilities:
- Extension activation/deactivation
- Command registration (50+ commands)
- Service initialization
- Provider setup
- Event listener registration

Key functions:
- `activate(context)` - Extension initialization
- `deactivate()` - Cleanup on extension unload
- Command handler registrations

### Constants

**`src/constants.ts`** (93 lines)

Shared constants:
- Template definitions
- Regex patterns (date, tags, links)
- File format constants
- Default configurations

### Utilities

#### Validators (`src/utils/validators.ts`)

Functions:
- `isDatePattern(name)` - Check if string matches date pattern
- `isYearFolder(name)` - Validate year folder format
- `isMonthFolder(name)` - Validate month folder format

Used for:
- Preventing invalid folder names
- Protecting date-based organization
- Validating custom folder names

#### Date Helpers (`src/utils/dateHelpers.ts`)

Functions:
- `formatDate()` - Format dates for display
- `getMonthName()` - Get month name from number
- `parseDate()` - Parse date strings

Used for:
- Consistent date formatting
- Folder name generation
- Calendar view rendering

#### Folder Helpers (`src/utils/folderHelpers.ts`)

Functions:
- `recursiveReadDir()` - Read directories recursively
- `getAllNoteFiles()` - Get all note files
- `copyDirectory()` - Copy folder structures

Used for:
- Tree view population
- Search operations
- Bulk operations

## Services Layer

### Config Service

**`src/services/configService.ts`**

Responsibilities:
- Read VS Code settings
- Provide configuration values
- Handle default values

Key functions:
- `getNotesPath()` - Get notes folder path
- `getFileFormat()` - Get file format setting
- `getTagAutoComplete()` - Get autocomplete setting

### File System Service

**`src/services/fileSystemService.ts`**

Responsibilities:
- Async file operations
- Error handling for file I/O
- File system utilities

Key functions:
- `readFile(path)` - Read file async
- `writeFile(path, content)` - Write file async
- `readDir(path)` - Read directory async
- `exists(path)` - Check file existence
- `stat(path)` - Get file stats

All functions use `fs.promises` API.

### Note Service

**`src/services/noteService.ts`**

Responsibilities:
- Note search operations
- Note statistics
- Note export functionality

Key functions:
- `searchInNotes(query, tags)` - Search notes
- `getNoteStats()` - Get note counts
- `exportNotes(range)` - Export notes by date range
- `getRecentNotes(limit)` - Get recent notes

### Template Service

**`src/services/templateService.ts`**

Responsibilities:
- Template generation
- Custom template management
- Variable substitution

Key functions:
- `generateTemplate(type, filename)` - Generate from built-in
- `getCustomTemplates()` - List custom templates
- `getCustomTemplatePath(name)` - Get template path
- `replacePlaceholders(content, filename)` - Replace variables
- `getTemplateVariables()` - Get available variables

Template variables:
- `{filename}`, `{date}`, `{time}`
- `{year}`, `{month}`, `{day}`, `{weekday}`, `{month_name}`
- `{user}`, `{workspace}`

### Tag Service

**`src/services/tagService.ts`**

Responsibilities:
- Tag indexing
- Tag querying
- Tag management (rename, merge, delete)

Key functions:
- `buildTagIndex()` - Index all tags
- `getTags()` - Get all tags
- `getNotesWithTag(tag)` - Get notes by tag
- `getNotesWithAllTags(tags)` - Multi-tag filter
- `renameTag(old, new)` - Rename across all notes
- `mergeTags(keep, merge)` - Merge two tags
- `deleteTag(tag)` - Delete tag from all notes

Tag indexing:
- In-memory cache
- Async operations
- Real-time updates

### Link Service

**`src/services/linkService.ts`**

Responsibilities:
- Wiki-style link resolution
- Backlinks tracking
- Link synchronization

Key functions:
- `resolveLink(linkText, currentFile)` - Resolve link to file
- `extractLinks(content)` - Parse links from content
- `buildBacklinksIndex()` - Index all backlinks
- `getBacklinks(file)` - Get incoming links
- `updateLinksOnRename(oldName, newName)` - Update links
- `updateLinksOnMove(oldPath, newPath)` - Update paths

Link patterns:
- `[[note-name]]` - Simple link
- `[[note-name|Display]]` - Link with display text
- `[[folder/note-name]]` - Path-based link

### Bulk Operations Service

**`src/services/bulkOperationsService.ts`**

Responsibilities:
- Multi-select state management
- Bulk operations coordination

Key functions:
- `toggleSelection(noteId)` - Select/deselect note
- `selectMultiple(noteIds)` - Select multiple notes
- `clearSelection()` - Deselect all
- `getSelectedNotes()` - Get selected note IDs
- `isSelectModeActive()` - Check select mode state

Selection tracking:
- Uses `Set<string>` for efficiency
- Fires `onDidChangeSelection` events
- Updates context variables

### Undo Service

**`src/services/undoService.ts`**

Responsibilities:
- Track destructive operations
- Undo/redo functionality
- Operation history management

Key functions:
- `recordOperation(operation)` - Record operation
- `undo()` - Undo last operation
- `redo()` - Redo last undone operation
- `getHistory()` - Get operation history
- `clearHistory()` - Clear all history

Supported operations:
- Delete, rename, move, archive
- Bulk delete, move, archive
- Preserves file contents and locations

## Providers Layer

### Tree Data Provider Pattern

All tree providers implement `vscode.TreeDataProvider<TreeItem>`:

```typescript
interface TreeDataProvider<T> {
  getChildren(element?: T): Promise<T[]>
  getTreeItem(element: T): TreeItem
  refresh(): void
}
```

### Notes Tree Provider

**`src/providers/notesTreeProvider.ts`**

Responsibilities:
- Main notes tree view
- Hierarchical organization
- Drag-and-drop support

Structure:
- Sections (Pinned, Recent, Archive)
- Custom folders
- Year folders → Month folders → Notes

Features:
- Async `getChildren()`
- Drag-and-drop handler
- Selection support
- Tag filtering

### Templates Tree Provider

**`src/providers/templatesTreeProvider.ts`**

Responsibilities:
- Templates view
- Built-in templates
- Custom template listing

### Tree Items

**`src/providers/treeItems.ts`**

Tree item classes:
- `TreeItem` - Base class
- `SectionItem` - Top-level sections
- `TemplateItem` - Template entries
- `NoteItem` - Note files (with selection support)

Properties:
- `contextValue` - For context menus
- `iconPath` - Visual icons
- `collapsibleState` - Expand/collapse
- `command` - Click action

## Command Layer

### Command Registration

Commands are registered in `extension.ts`:

```typescript
context.subscriptions.push(
  vscode.commands.registerCommand('noted.commandName', handler)
)
```

### Command Handlers

**`src/commands/commands.ts`**

Main command handlers:
- Note operations (create, delete, rename, move)
- Template operations
- Search and navigation
- Calendar and graph views

**`src/commands/tagCommands.ts`**

Tag-specific commands:
- Filter by tag
- Sort tags
- Rename/merge/delete tags
- Export tags

**`src/commands/bulkCommands.ts`**

Bulk operation commands:
- Toggle select mode
- Select/deselect notes
- Bulk delete/move/archive

## Views Layer

### Calendar View

**`src/calendar/`**

Components:
- `calendarHelpers.ts` - Date operations
- `calendarView.ts` - Webview HTML generation

Features:
- Monthly calendar rendering
- Note indicators
- Date selection
- Note creation

### Graph View

**`src/graph/graphView.ts`**

Responsibilities:
- Interactive graph visualization
- Uses vis.js library
- WebView integration

Features:
- Multiple layouts (force-directed, hierarchical, circular)
- Interactive nodes and edges
- Filters and search
- Statistics dashboard

## Data Flow

### Note Creation Flow

1. User triggers command (`noted.openToday`)
2. Command handler in `extension.ts`
3. Calls `templateService.generateTemplate()`
4. Calls `fileSystemService.writeFile()`
5. Opens file in editor
6. Refreshes tree provider

### Tag Filtering Flow

1. User clicks tag in Tags view
2. Command handler `filterByTag`
3. Calls `tagService.getNotesWithTag()`
4. Updates `notesTreeProvider` filter
5. Tree view refreshes with filtered notes

### Link Navigation Flow

1. User clicks `[[link]]` in editor
2. Document link provider resolves link
3. Calls `linkService.resolveLink()`
4. Opens target note in editor

## Testing Architecture

### Unit Tests

**`src/test/unit/`**

Test structure:
- One test file per module
- Mocha test framework
- Chai assertions
- VS Code API mocks

### VS Code Mocks

**`src/test/mocks/vscode.ts`**

Mocked classes:
- `Position`, `Range`, `Uri`
- `TreeItem`, `EventEmitter`
- `CompletionItem`, `MarkdownString`

Enables testing without VS Code dependency.

### Test Execution

```bash
# Unit tests only (no VS Code required)
pnpm run test:unit

# Full integration tests (requires VS Code)
pnpm run test
```

## Extension Points

### VS Code Integration

**Activity Bar:**
- Custom view container (`notedExplorer`)
- Notebook icon

**Views:**
- Templates view
- My Notes view
- Tags view

**Commands:**
- 50+ registered commands
- Command palette integration
- Context menus

**Providers:**
- TreeDataProvider (3 instances)
- CompletionItemProvider (tag autocomplete)
- DocumentLinkProvider (wiki links)
- HoverProvider (backlinks)
- CodeActionProvider (link diagnostics)

### Configuration

**Settings contributions:**
- `noted.notesFolder` - Folder path
- `noted.fileFormat` - txt or md
- `noted.tagAutoComplete` - Enable/disable autocomplete

**Context variables:**
- `noted.selectModeActive` - Select mode state
- `noted.hasSelectedNotes` - Has selections
- `noted.hasActiveTagFilters` - Tag filters active

## Performance Considerations

### Async Operations

All file I/O is asynchronous:
- Prevents blocking UI
- Handles large note collections
- Better user experience

### Caching

Services use in-memory caching:
- Tag index cached
- Backlinks index cached
- Tree view caches children

### Lazy Loading

Tree views use lazy loading:
- Only load visible items
- Expand on demand
- Reduces initial load time

## Future Architecture Plans

### Planned Improvements

- Enhanced caching strategies
- Debounced search
- Virtual scrolling for large trees
- Worker threads for indexing
- Optimized graph rendering

---

[← Back to Development]({{ '/dev/' | relative_url }}) | [Next: Testing →]({{ '/dev/testing' | relative_url }})
