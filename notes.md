# Noted Extension - Features

## Core Note-Taking Features

### Daily Notes
- **Open Today's Note** (`Cmd+Shift+N`): Quickly create or open today's note
- **Automatic Organization**: Notes are organized in `YYYY/MM-MonthName/YYYY-MM-DD.format` structure
- **File Formats**: Support for both `.txt` and `.md` formats (configurable)

### Templates
Four built-in note templates accessible from the Templates view:
- **Problem/Solution**: For troubleshooting and bug tracking
- **Meeting**: Meeting notes with attendees, agenda, and action items
- **Research**: Structured research with questions, findings, and sources
- **Quick**: Simple dated note

All templates automatically include a timestamp header with creation date and time.

#### Custom Templates (NEW v1.4.0)
- **Create Custom Template**: Create your own reusable note templates
- **Edit Template**: Modify existing custom templates
- **Delete Template**: Remove templates you no longer need
- **Duplicate Template**: Copy templates as a starting point for new ones
- **Templates Folder**: Access and organize all custom templates in one place

#### Template Variables (NEW v1.4.0)
Templates support powerful variable substitution with 10 built-in placeholders:
- `{filename}`: The name of the note file
- `{date}`: Current date (Sunday, October 19, 2025)
- `{time}`: Current time (2:30 PM)
- `{year}`: Current year (2025)
- `{month}`: Current month (10)
- `{day}`: Current day (19)
- `{weekday}`: Day of week (Sun, Mon, etc.)
- `{month_name}`: Month name (January, February, etc.)
- `{user}`: System username
- `{workspace}`: Workspace name

**Template Variables Reference**: View all available variables with descriptions via the command palette or Templates view.

### Timestamps
- **Insert Timestamp** (`Cmd+Shift+T`): Insert `[HH:MM AM/PM]` at cursor position

## Organization Features

### Custom Folders (NEW)
- **Create Folder**: Create custom organizational folders at root level
- **Rename Folder**: Rename custom folders (date folders are protected)
- **Delete Folder**: Delete custom folders with confirmation
- **Validation**: Prevents using date patterns (YYYY, MM-MonthName) for custom folder names

### Note Management
- **Move Note**: Move notes between any folder (date or custom) with folder picker
- **Drag-and-Drop** (NEW): Drag notes to move them between folders
  - Drag notes from any location (Recent Notes, month folders, custom folders)
  - Drop on month folders, custom folders, or other notes (moves to parent folder)
  - Multi-select support: Drag multiple notes at once
  - Smart restrictions: Cannot drop on year folders, sections, or root
  - Conflict prevention: Shows error if file already exists at destination
- **Rename Note**: Rename individual notes
- **Duplicate Note**: Create a copy of any note
- **Delete Note**: Delete notes with confirmation
- **Copy Path**: Copy note file path to clipboard

## Search & Discovery

### Tags (NEW)
- **Tag Your Notes**: Add tags anywhere in notes using `#tagname` syntax - works inline throughout your entire note
- **Tags View**: Dedicated sidebar showing all tags with usage counts
- **Filter by Tag**: Click any tag to instantly filter the My Notes view, or use the Filter command for multi-tag selection
- **Tag Autocomplete**: Type `#` anywhere in notes to see autocomplete suggestions from existing tags
- **Sort Tags**: Sort tags alphabetically or by frequency (usage count)
- **Tag Statistics**: See how many notes use each tag at a glance
- **Multi-Tag Filtering**: Filter notes by multiple tags simultaneously (AND logic - shows notes with all selected tags)
- **Tag Format**: Tags support alphanumeric characters, hyphens, and underscores (e.g., `#bug-fix`, `#work_notes`)
- **Inline Support**: Tags can appear anywhere in your notes - in paragraphs, lists, headings, or anywhere else

### Calendar View (NEW)
- **Show Calendar View**: Visual monthly calendar for navigating daily notes
- **Interactive Date Selection**: Click any date to see all notes created on that day
- **Notes List Display**: Shows all notes for selected date below calendar
  - Click on individual notes to open them
  - Create new notes directly from the calendar
  - "Create Another Note" button when notes already exist
- **Visual Indicators**:
  - Days with notes are highlighted
  - Current day marked with special border
- **Month Navigation**: Previous/Next month buttons and "Today" quick jump
- **Multi-note Support**: Handles multiple notes per day (daily notes + templated notes)

### Search
- **Full-Text Search**: Search across all notes with preview of matching lines
- **Quick Pick**: Select from search results to open notes

### Recent Notes
- Dedicated "Recent Notes" section showing 10 most recently modified notes
- Quick access from tree view

### Wiki-Style Note Linking (NEW v1.5.0)
- **Link Syntax**: Create links between notes using `[[note-name]]` syntax
- **Clickable Links**: Links are automatically detected and clickable in the editor
- **Link Resolution**: Supports exact matches, partial matches, and fuzzy matching
- **Cross-Navigation**: Click any link to open the target note
- **Document Link Provider**: VS Code integration for seamless navigation

### Backlinks System (NEW v1.5.0)
- **Automatic Detection**: All links to current note are automatically tracked
- **Hover Information**: Hover over note header to see all backlinks
- **Context Display**: Each backlink shows the source note and surrounding context
- **Navigation**: Click backlinks in hover to navigate to linking notes
- **Async Indexing**: Background index building for optimal performance
- **Rebuild Index**: Command to manually refresh the backlinks index

### Pinned/Favorite Notes (NEW v1.5.0)
- **Pin Notes**: Mark frequently accessed notes as favorites
- **Dedicated Section**: "Pinned Notes" section at top of tree view
- **Visual Indicators**: Pinned notes show pin icon (📌) and special styling
- **Persistent Storage**: Pinned state saved across VS Code sessions
- **Context Menu**: Right-click any note to pin or unpin
- **Auto-Cleanup**: Automatically removes pins for deleted notes

### Archive Functionality (NEW v1.5.0)
- **Archive Notes**: Move old or completed notes to archive
- **Hidden Storage**: Archived notes stored in `.archive` folder (excluded from main view)
- **Archive Section**: Dedicated "Archive" section in tree view
- **Visual Indicators**: Archived notes show archive icon (📦)
- **Unarchive**: Restore archived notes to active notes
- **Bulk Archive**: Archive all notes older than specified days
- **Safe Operations**: Confirmation dialogs for all destructive operations

## Statistics & Export

### Statistics
- **Note Statistics**: View total notes, notes this week, and notes this month

### Export
- **Export Notes**: Export notes by date range (This Week, This Month, All Notes)
- Creates combined text file with all selected notes

## Configuration

### Setup
- **Setup Default Folder**: Create notes folder in workspace or home directory
- **Setup Custom Folder**: Choose custom location via folder picker
- **Move Notes Folder**: Relocate entire notes folder with all contents

### Settings
- `noted.notesFolder`: Location of notes folder (absolute path recommended)
- `noted.fileFormat`: File format - "txt" or "md" (default: "txt")
- `noted.useTemplate`: Enable custom template (not currently implemented)
- `noted.template`: Custom template string (not currently implemented)
- `noted.tagAutoComplete`: Enable tag autocomplete suggestions when typing # (default: true)

## Tree View

### Hierarchical Organization
- **Templates**: Quick access to note templates
- **My Notes**: Main notes organization
  - **Pinned Notes** (NEW v1.5.0): Quick access to favorited notes
  - **Recent Notes**: Quick access to recently modified notes
  - **Archive** (NEW v1.5.0): Archived notes section
  - **Custom Folders**: User-created organizational folders (alphabetically sorted)
  - **Year Folders**: Automatic date-based organization (reverse chronological)
    - **Month Folders**: Within each year, organized by month
      - **Note Files**: Individual notes within months
- **Tags**: All tags with usage counts, sortable and filterable

### Icons
- Custom folders: Opened folder icon
- Year folders: Standard folder icon
- Month folders: Calendar icon
- Notes: Note icon
- **Pinned Notes** (NEW v1.5.0): Pin icon (📌)
- **Archived Notes** (NEW v1.5.0): Archive icon (📦)
- Tags: Tag icon with count badge
- Pinned Notes section: Pin icon
- Archive section: Archive icon
- Recent Notes section: History icon

## Context Menus

### On Notes
- Move Note to Folder
- Delete Note
- Rename Note
- Duplicate Note
- Copy Path
- Show in System Explorer
- **Pin/Unpin Note** (NEW v1.5.0)
- **Archive Note** (NEW v1.5.0)

### On Custom Folders
- Rename Folder
- Delete Folder

### On Tags
- Filter by Tag
- Rename Tag
- Delete Tag

### Toolbar Actions

**My Notes View:**
- Open Today's Note
- Create Folder
- Search Notes
- Refresh
- Show Calendar View
- Show Statistics
- Export Notes

**Tags View:**
- Filter by Tag
- Sort by Name
- Sort by Frequency
- Refresh Tags

## Architecture Notes

- **Modular architecture** (completed): Code organized into focused modules
  - `src/constants.ts` - Shared constants and templates
  - `src/utils/` - Validation and helper functions
  - `src/services/` - Business logic and file operations
  - `src/providers/` - VS Code tree view providers
  - `src/commands/` - Command handlers
  - `src/calendar/` - Calendar view functionality (helpers and webview)
  - `src/test/` - Comprehensive testing infrastructure
  - `src/extension.ts` - Entry point and command registration (1570 lines, down from 2119)
- **Asynchronous file operations**: All file I/O uses `fs.promises` API with async/await pattern
- **Comprehensive error handling**: All file operations wrapped in try/catch with user-friendly error messages
- **TreeDataProvider pattern**: Standard VS Code tree view implementation with async support
- **Date formatting**: Uses locale-specific formatting (en-US)
- **File name sanitization**: Automatic sanitization for note names from templates

## Testing Infrastructure

### Unit Tests (184 tests - all passing)
- **Testing Framework**: Mocha + Chai (v4 for CommonJS compatibility)
- **Test Coverage**:
  - Utilities: validators, date helpers, folder operations (23 tests)
  - Services: file system, templates, note service, tag service, tag completion (92 tests)
  - Providers: tree items, notes tree provider, tags tree provider (53 tests)
  - Commands: tag commands (4 tests)
  - Helpers: tag helpers (12 tests)
- **VS Code Mocking**: Custom mocks for VS Code API to enable pure unit testing
  - Position, Range, EndOfLine, CompletionItemKind, CompletionItem, MarkdownString classes
  - EventEmitter with proper event getter pattern
  - Uri, TreeItem, ThemeIcon, and other core VS Code types
- **Execution Time**: ~270ms for full test suite

### CI/CD Integration
- **GitHub Actions**: Automated testing on every push and PR
- **Cross-Platform**: Tests run on Ubuntu, macOS, and Windows
- **Multiple Node Versions**: Tests against Node 18.x and 20.x
- **Matrix Testing**: 6 parallel test jobs (3 OS × 2 Node versions)
- **Build Pipeline**: Automatic VSIX package build and artifact upload
- **Status Badges**: CI and test status visible in README

### Test Files
- `src/test/unit/validators.test.ts` - Folder name validation tests
- `src/test/unit/dateHelpers.test.ts` - Date formatting and manipulation tests
- `src/test/unit/folderHelpers.test.ts` - Recursive folder operations tests
- `src/test/unit/fileSystemService.test.ts` - File I/O operation tests
- `src/test/unit/templateService.test.ts` - Template generation tests
- `src/test/unit/treeItems.test.ts` - Tree view item tests
- `src/test/unit/noteService.test.ts` - Note search and tag integration tests
- `src/test/unit/tagService.test.ts` - Tag indexing and querying tests
- `src/test/unit/tagHelpers.test.ts` - Tag parsing and validation tests
- `src/test/unit/tagCompletion.test.ts` - Tag autocomplete provider tests
- `src/test/unit/tagCommands.test.ts` - Tag command handler tests
- `src/test/unit/notesTreeProvider.test.ts` - Notes tree view and filtering tests
- `src/test/unit/tagsTreeProvider.test.ts` - Tags tree view tests
- `src/test/mocks/vscode.ts` - Comprehensive VS Code API mocks
- `src/test/setup.ts` - Test environment configuration

### Running Tests
```bash
# Run all unit tests
pnpm run test:unit

# Compile and run tests
pnpm run compile && pnpm run test:unit

# Run VS Code integration tests (requires VS Code)
pnpm run test
```

## Recent Updates

### Note Tagging System (Completed - v1.4.0)
- **Inline Tag Support**: Add tags anywhere in note content using `#tagname` syntax
- **Tag Parsing and Indexing**: Automatically parse and index tags from entire note content
- **Tags Tree View**: Dedicated sidebar panel showing all tags with usage counts
- **Tag Filtering**: Click tags to filter notes instantly, or select multiple tags for AND filtering
- **Tag Autocomplete**: Intelligent autocomplete suggestions when typing `#` anywhere in notes
- **Tag Sorting**: Sort tags alphabetically or by frequency (most-used first)
- **Comprehensive Testing**: Full unit test coverage for tag functionality (143 passing tests)
- **Tag Service**: Efficient tag indexing with async operations and in-memory caching
- **Tag Commands**: Filter, sort, refresh, and clear filter operations
- **Real-time Updates**: Tags automatically detected and indexed as you type

### Modular Architecture Refactoring (Completed)
- **Split 2119-line extension.ts into focused modules**: 100% complete
- **13 new module files created**: constants, utils, services, providers, commands, calendar
- **All modules compile successfully**: TypeScript compilation passes without errors
- **Maintained backward compatibility**: Extension continues working during refactoring
- **26% code reduction**: extension.ts reduced from 2119 to 1570 lines
- **Calendar module**: Split into calendarHelpers.ts and calendarView.ts for better organization

### Async/Await Refactoring (Completed)
- **Converted all file operations to async**: Replaced synchronous fs methods with `fs.promises` API
- **Added comprehensive error handling**: Every file operation now has try/catch blocks with clear error messages
- **Improved performance**: Async operations prevent UI freezing with large note collections
- **Updated TreeDataProvider**: `getChildren()` and `handleDrop()` now fully async
- **Better user experience**: Clear error notifications when operations fail

### Testing & CI/CD Implementation (Completed)
- **Comprehensive Test Suite**: 184 unit tests covering all functionality
  - Validators: 9 tests for folder name validation patterns
  - Date Helpers: 14 tests for date formatting and manipulation
  - Folder Helpers: 7 tests for recursive folder operations
  - File System Service: 11 tests for all async file operations
  - Template Service: 9 tests for built-in and custom templates
  - Tree Items: 16 tests for all tree view node types
  - Note Service: 18 tests for tag search integration
  - Tag Service: 12 tests for tag indexing and querying
  - Tag Helpers: 12 tests for tag parsing and validation
  - Tag Completion: 18 tests for autocomplete provider
  - Tag Commands: 4 tests for tag command handlers
  - Notes Tree Provider: 6 tests for filtering and tree operations
  - Tags Tree Provider: 10 tests for tags tree view
- **Testing Infrastructure**:
  - Mocha test runner with Chai assertions (v4 for CommonJS compatibility)
  - Comprehensive VS Code API mocks (Position, Range, CompletionItem, MarkdownString, EventEmitter)
  - Test execution in ~270ms without VS Code dependency
  - All 184 tests passing on all platforms
- **GitHub Actions CI/CD**:
  - Two workflows: full CI pipeline and test-focused workflow
  - Cross-platform testing: Ubuntu, macOS, Windows
  - Multiple Node versions: 18.x and 20.x
  - Automatic VSIX package building and artifact upload
  - Status badges in README showing build status
  - All CI/CD tests passing after VS Code mock enhancements
- **Dependencies**: Using pnpm@8.15.9 with committed lockfile for reproducible builds
- **Documentation**: AUTOMATED_TESTING.md with comprehensive troubleshooting guides
