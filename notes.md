# Noted Extension - Features

## Core Note-Taking Features

### Daily Notes
- **Open Today's Note**: Quickly create or open today's note
- **Automatic Organization**: Notes are organized in `YYYY/MM-MonthName/YYYY-MM-DD.format` structure
- **File Formats**: Support for both `.txt` and `.md` formats (configurable, default: `.md`)

### Templates
Four built-in note templates accessible from the Templates view:
- **Problem/Solution**: For troubleshooting and bug tracking
- **Meeting**: Meeting notes with attendees, agenda, and action items
- **Research**: Structured research with questions, findings, and sources
- **Quick**: Simple dated note

All templates automatically include a timestamp header with creation date and time.

#### Custom Templates (v1.4.0)
- **Create Custom Template**: Create your own reusable note templates
- **Edit Template**: Modify existing custom templates
- **Delete Template**: Remove templates you no longer need
- **Duplicate Template**: Copy templates as a starting point for new ones
- **Templates Folder**: Access and organize all custom templates in one place

#### Template Variables (v1.4.0)
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
- **Insert Timestamp**: Insert `[HH:MM AM/PM]` at cursor position

## Organization Features

### Custom Folders
- **Create Folder**: Create custom organizational folders at root level
- **Rename Folder**: Rename custom folders (date folders are protected)
- **Delete Folder**: Delete custom folders with confirmation
- **Validation**: Prevents using date patterns (YYYY, MM-MonthName) for custom folder names

### Note Management
- **Move Note**: Move notes between any folder (date or custom) with folder picker
- **Drag-and-Drop**: Drag notes to move them between folders
  - Drag notes from any location (Recent Notes, month folders, custom folders)
  - Drop on month folders, custom folders, or other notes (moves to parent folder)
  - Multi-select support: Drag multiple notes at once
  - Smart restrictions: Cannot drop on year folders, sections, or root
  - Conflict prevention: Shows error if file already exists at destination
- **Rename Note**: Rename individual notes
- **Duplicate Note**: Create a copy of any note
- **Delete Note**: Delete notes with confirmation
- **Copy Path**: Copy note file path to clipboard

### Bulk Operations (v1.10.0-1.11.0)
- **Select Mode**: Toggle selection mode to select multiple notes at once
- **Visual Selection**: Selected notes show checkmark icon for clear feedback
- **Multi-Select**: Click notes to select/deselect in select mode
- **Bulk Delete**: Delete multiple notes with confirmation dialog showing affected notes
- **Bulk Move**: Move multiple notes to a folder with picker and preview
- **Bulk Archive**: Archive multiple selected notes with confirmation
- **Selection Management**:
  - Toggle select mode with toolbar button
  - Select all notes with one click
  - Clear all selections with one click
  - Selection count displayed in status
- **Context-Aware UI**: Bulk operation buttons only appear when notes are selected
- **Safety Features**: All destructive operations show confirmation dialogs with note previews

## Search & Discovery

### Tags
- **Tag Your Notes**: Add tags using two methods:
  - **Inline hashtags**: `#tagname` syntax works anywhere in your note content
  - **YAML frontmatter** (v1.25.0): `tags: [tag1, tag2, tag3]` array format at the beginning of notes
- **Flexible Tag Formats**:
  - Inline: `#tagname` throughout note content
  - Frontmatter array: `tags: [backend, auth, bugfix]`
  - Quoted values: `tags: ["bug", "feature"]` or `tags: ['bug', 'feature']`
  - Combined: Use both frontmatter and inline tags in the same note (automatically merged)
- **Tags View**: Dedicated sidebar showing all tags with usage counts
- **Filter by Tag**: Click any tag to instantly filter the My Notes view, or use the Filter command for multi-tag selection
- **Tag Autocomplete**: Type `#` anywhere in notes to see autocomplete suggestions from existing tags
- **Sort Tags**: Sort tags alphabetically or by frequency (usage count)
- **Tag Statistics**: See how many notes use each tag at a glance
- **Multi-Tag Filtering**: Filter notes by multiple tags simultaneously (AND logic - shows notes with all selected tags)
- **Tag Format**: Tags support alphanumeric characters, hyphens, and underscores (e.g., `#bug-fix`, `#work_notes`)
- **Inline Support**: Tags can appear anywhere in your notes - in paragraphs, lists, headings, or anywhere else

### Calendar View
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

### Graph View (v1.14.0, Enhanced v1.17.1, v1.19.1, v1.20.1)
- **Show Graph View**: Interactive visualization of note connections via wiki-style links
- **Interactive Graph Features**:
  - **Click nodes** to open notes instantly
  - **Drag nodes** to reposition and explore relationships
  - **Zoom and pan** to navigate large graphs
  - **Hover tooltips** showing note names, connection counts, and "Click to open" hint
  - **Node highlighting** (v1.17.1): Click any node to highlight its immediate connections
    - Connected nodes stay at full opacity while others dim to 20%
    - Connected edges become hot pink and thicker
    - Click canvas to clear highlights
  - **Focus Mode** (v1.20.1): Right-click any node to focus on it and its immediate connections
    - Shows only the selected note and its 1-hop neighbors
    - Focused node highlighted with pink border and enlarged 30%
    - Visual indicator displays focused note name with exit button
    - "Focus Mode" button in toolbar turns pink when active
    - Exit via button click or toolbar toggle
    - Best for exploring local neighborhoods, reducing clutter, and creating clean screenshots
- **Layout Options**:
  - **Force-Directed** (default): Natural physics-based layout showing organic clusters
  - **Hierarchical**: Top-down tree structure showing clear relationships
  - **Circular**: Ring arrangement for alternative perspective
- **Filters and Search**:
  - **Search box**: Find specific notes by name (live filtering)
  - **Filter by connection**: Show all notes, connected only, or orphans only
  - **Orphan detection**: Quickly identify notes without any links
  - **Time-based filtering** (v1.19.1): Filter notes by creation or modification date
    - **Preset ranges**: Today, Last 7 Days, Last 30 Days, Last 90 Days, Last Year
    - **Custom date range**: Select specific start and end dates
    - **Toggle mode**: Switch between filtering by created date or modified date
    - **Combined filtering**: Works seamlessly with connection filters and search
    - **Real-time updates**: Graph updates instantly when filters are changed
- **Visual Encoding**:
  - **Node size**: Larger nodes have more connections (logarithmic scaling)
  - **Node color** (customizable):
    - Gray: Orphan notes (no connections)
    - Green: Lightly connected (1-2 links)
    - Blue: Moderately connected (3-5 links)
    - Orange: Well connected (6-10 links)
    - Red: Highly connected hubs (10+ links)
  - **Edge width**: Thicker edges for bidirectional links (notes linking to each other)
  - **Edge color** (v1.17.1): Pink (#e83e8c) for better visibility on dark backgrounds
  - **Edge arrows** (v1.17.1): Directional arrows showing link direction
  - **Node shadows** (v1.17.1): Drop shadows for depth perception
- **Statistics Dashboard**: Real-time graph metrics
  - Total notes count
  - Total links count
  - Orphan notes count
  - Average connections per note
- **Graph Customization** (v1.17.1): Comprehensive appearance controls
  - **Node Appearance**:
    - Adjustable node size (5-50 pixels)
    - Border width control (1-6 pixels)
    - 6 node shapes: Dot/Circle, Diamond, Square, Triangle, Star, Hexagon
    - Toggle shadows on/off
  - **Edge Appearance**:
    - Adjustable edge width (1-8 pixels)
    - Custom edge color via color picker
    - 4 edge styles: Smooth Curve, Dynamic, Straight Line, Cubic Bezier
    - Toggle directional arrows on/off
  - **Physics & Animation Tuning**:
    - Spring length control (50-400) for edge spacing
    - Node repulsion control (10k-50k) for node spacing
    - Central gravity control (0-1.0) for graph centering
  - **Custom Color Schemes**:
    - Customize colors for each connection level (orphan, 1-2, 3-5, 6-10, 10+)
    - Full color picker support
    - Colors update in both graph and legend
  - **Settings Persistence**: All customizations save across VS Code sessions
  - **Reset to Defaults**: One-click restore to original settings
  - **Live Preview**: Range sliders show current values in real-time
- **Controls**:
  - **Refresh button**: Rebuild graph after creating new links
  - **Fit View button**: Auto-zoom to show entire graph
  - **Customize button**: Open customization panel

### Search (ENHANCED v1.6.0)
- **Full-Text Search**: Search across all notes with preview of matching lines
- **Regex Search**: Use `regex:` flag in search to enable regular expression pattern matching
- **Advanced Filters**:
  - `tag:tagname` - Filter results by specific tags
  - `from:YYYY-MM-DD` - Show only notes modified after this date
  - `to:YYYY-MM-DD` - Show only notes modified before this date
  - `case:` - Enable case-sensitive search
- **Combined Filters**: Use multiple filters together (e.g., "regex: tag:work from:2025-01-01 bug.*fix")
- **Quick Switcher**: Quickly access your 20 most recently modified notes
- **Filter by Tag**: Filter notes by specific tags
- **Enhanced Results**: See match counts, tags, modification dates, and rich previews
- **Smart Sorting**: Results sorted by modification date (newest first)
- **Quick Pick**: Select from search results to open notes

### Recent Notes
- Dedicated "Recent Notes" section showing 10 most recently modified notes
- Quick access from tree view

### Wiki-Style Note Linking (v1.5.0, Enhanced v1.14.0-v1.15.0)
- **Link Syntax**: Create links between notes using `[[note-name]]` syntax
- **Link with Display Text** (v1.13.5): Use `[[note-name|Custom Display Text]]` syntax for readable link labels
- **Path-Based Disambiguation** (v1.14.0): Use full or partial paths when multiple notes have the same name
  - **Simple links**: `[[meeting]]` - links to any note named "meeting"
  - **Full path**: `[[2025/10-October/meeting]]` - disambiguates to specific note
  - **Partial path**: `[[work/meeting]]` - works with custom folders too
  - **Cross-platform**: Supports both forward slashes `/` and backslashes `\` in paths
- **Hover Previews** (v1.15.0, Enhanced v1.29.2): See note content and rich metadata without opening files
  - **Rich Metadata Cards** (v1.29.2): Preview cards now display comprehensive note metadata
    - **Tags**: Shows all tags from frontmatter and inline `#tags`
    - **Dates**: Displays created and modified dates with smart relative formatting (e.g., "Just now", "2 days ago")
    - **File Size**: Shows note size in KB
    - **Custom Frontmatter**: Displays up to 3 additional frontmatter fields (status, priority, etc.)
  - **Preview on Hover**: Hover over any `[[wiki-link]]` to see note content preview
  - **First 10 Lines**: Shows the beginning of the note for quick context
  - **Smart Truncation**: Long lines are automatically truncated for readability
  - **Quick Actions**: Click "📖 Open note →" to open the full note
  - **Create from Broken Links**: Hover over non-existent notes shows "Create note →" link
  - **Works with Display Text**: Previews work for `[[note|Display Text]]` syntax too
- **Link Autocomplete** (v1.14.0): Type `[[` to get intelligent suggestions
  - Shows all available notes with their paths
  - Highlights duplicate names that need disambiguation
  - Suggests both simple names and full paths
  - Triggers on `[[` and `/` for path completion
- **Link Diagnostics** (v1.14.0): Real-time warnings and quick fixes
  - **Ambiguous link warnings**: Alerts when multiple notes match a simple link
  - **Broken link errors**: Highlights links to non-existent notes
  - **Quick fixes**: Click to automatically convert to full-path links
  - **Related information**: Shows all matching notes for ambiguous links
- **Extract Selection to Note** (v1.14.1): Create new notes from selected text
  - **Select & Extract**: Right-click selected text and choose "Extract Selection to New Note"
  - **Automatic Link**: Selection is replaced with `[[note-name]]` link to the new note
  - **Side-by-Side**: New note opens in split view for easy reference
  - **Rich Metadata**: Extracted note includes source file and extraction timestamp
  - **Smart Naming**: Prompted for note name with automatic sanitization
  - **Context Menu**: Available when any text is selected in the editor
- **Automatic Link Synchronization** (v1.13.5): When renaming or moving notes, all `[[links]]` across your workspace are automatically updated
- **Clickable Links**: Links are automatically detected and clickable in the editor
- **Create Missing Notes from Links** (v1.17.1): Click broken links to create missing notes
  - Clicking a `[[non-existent-note]]` prompts to create it
  - New note created in current month's folder
  - Opens automatically for editing
  - Backlinks index updates to include the new note
- **Link Resolution**: Supports exact matches, partial matches, and fuzzy matching
- **Cross-Navigation**: Click any link to open the target note
- **Document Link Provider**: VS Code integration for seamless navigation
- **Auto-Activation** (v1.17.1): Extension activates automatically on startup for immediate link functionality

### Note and Image Embedding (v1.16.0-v1.17.0, Enhanced v1.31.7)
- **Embed Notes** (v1.16.0): Include entire notes or sections inline using `![[note-name]]` syntax
  - **Full Note Embed**: `![[my-note]]` - embeds entire note content
  - **Section Embed**: `![[my-note#Section]]` - embeds specific sections only
  - **Display Text**: `![[my-note|Custom Display]]` - customize the embed label
  - **Section Support**: Works with markdown headings (`# Heading`) and text-style headings (`HEADING:`)
  - **Case-Insensitive**: Section matching ignores case for convenience
  - **Hover Previews**: Hover to see embedded content with available sections listed
  - **Inline Icons**: Shows 📄 icon next to note embeds for quick identification
- **Embed Images** (v1.17.0): Display images inline using `![[image.png]]` syntax
  - **Image Formats**: Supports PNG, JPG, JPEG, GIF, SVG, WEBP, BMP, ICO
  - **Path Flexibility**:
    - Absolute paths: `![[/Users/name/photos/image.png]]`
    - Relative to note: `![[./images/photo.jpg]]` or `![[images/photo.jpg]]`
    - Workspace-relative: `![[assets/logo.png]]`
  - **Display Text**: `![[image.png|Photo Caption]]` - add captions to images
  - **Hover Previews**: Hover to see full image with metadata
  - **Image Metadata**: Shows file size and dimensions (when available)
  - **Inline Icons**: Shows 🖼️ icon next to image embeds
  - **Smart Resolution**: Automatically searches document folder, then workspace folders
- **Embed Diagrams** (v1.31.0, Enhanced v1.31.7): Display diagrams inline using `![[diagram.drawio]]` syntax
  - **Diagram Formats**: Supports Draw.io (.drawio), Excalidraw (.excalidraw, .excalidraw.svg, .excalidraw.png)
  - **Automatic Sibling Folder Search** (v1.31.7): Automatically finds diagrams in sibling `Diagrams/` folder
    - If note is in `Notes/2025/10-October/`, automatically checks `Diagrams/`
    - Works without adding parent directory to workspace
    - Configurable via `noted.diagramsFolder` setting (default: "Diagrams")
  - **Custom Preview**: Use `Noted: Open Preview (with Diagram Support)` command
    - Renders exported diagrams (.svg, .png) inline as images
    - Shows clickable links for raw diagrams (.drawio, .excalidraw) to open in editors
    - Proper webview permissions for files outside workspace
    - Live updates as you edit
  - **Path Resolution Order**: Same folder → Sibling Diagrams → Workspace → Recursive search
  - **Hover Previews**: Hover to see diagram with metadata
  - **Inline Icons**: Shows 📊 icon next to diagram embeds

### Backlinks System (v1.5.0)
- **Automatic Detection**: All links to current note are automatically tracked
- **Hover Information**: Hover over note header to see all backlinks
- **Context Display**: Each backlink shows the source note and surrounding context
- **Navigation**: Click backlinks in hover to navigate to linking notes
- **Async Indexing**: Background index building for optimal performance
- **Rebuild Index**: Command to manually refresh the backlinks index

### Auto-Backlinks Sections (v1.24.0)
- **Automatic Appending**: Backlinks are automatically written to the end of note files
- **Format**: Each backlink shows as `- [[source-note]] - #tag1 #tag2`
- **Tag Integration**: Displays tags from the source note's frontmatter
- **Separator**: Clear `---` separator marks the auto-generated section
- **Real-Time Updates**: Backlinks section updates automatically when notes are saved
- **Configurable**: Toggle with `noted.autoBacklinks` setting (enabled by default)
- **Manual Control**:
  - **Rebuild All**: `noted.rebuildBacklinks` command regenerates all backlinks sections
  - **Clear All**: `noted.clearBacklinks` removes all backlinks sections from notes
- **Smart Updates**: Only updates files when backlinks actually change
- **No Circular Updates**: Prevents infinite loops when saving notes with backlinks sections
- **Frontmatter Support**: Parses YAML frontmatter to extract tags for display

### Pinned/Favorite Notes (v1.5.0)
- **Pin Notes**: Mark frequently accessed notes as favorites
- **Dedicated Section**: "Pinned Notes" section at top of tree view
- **Visual Indicators**: Pinned notes show pin icon (📌) and special styling
- **Persistent Storage**: Pinned state saved across VS Code sessions
- **Context Menu**: Right-click any note to pin or unpin
- **Auto-Cleanup**: Automatically removes pins for deleted notes

### Archive Functionality (v1.5.0)
- **Archive Notes**: Move old or completed notes to archive
- **Hidden Storage**: Archived notes stored in `.archive` folder (excluded from main view)
- **Archive Section**: Dedicated "Archive" section in tree view
- **Visual Indicators**: Archived notes show archive icon (📦)
- **Unarchive**: Restore archived notes to active notes
- **Bulk Archive**: Archive all notes older than specified days
- **Safe Operations**: Confirmation dialogs for all destructive operations

### Orphans & Placeholders Detection (v1.30.0)
- **Orphan Notes Detection**: Identify notes with missing connections
  - **Isolated Notes**: Notes with no incoming or outgoing links
  - **No Backlinks**: Notes with outgoing links but no incoming references
  - **No Outgoing Links**: Notes referenced by others but don't link anywhere
  - **Real-time Tracking**: Automatically updates as links are added/removed
- **Placeholder Tracking**: Track broken/dangling wiki-style links
  - Detects `[[links]]` to notes that don't exist yet
  - Groups placeholders by target with reference counts
  - Shows all source locations for each placeholder
  - Context snippets with line numbers for each reference
- **Dedicated Explorer Panels**: Two sidebar panels for navigation
  - **Orphans Panel**: Tree view showing all orphaned notes in three categories
  - **Placeholders Panel**: Tree view grouping placeholders with expandable sources
- **Quick Actions**:
  - Click orphan note to open and add connections
  - Click placeholder to create the missing note
  - Navigate to source location where placeholder appears
- **Commands**:
  - `noted.refreshOrphans` - Rebuild orphans detection
  - `noted.refreshPlaceholders` - Rebuild placeholder tracking
  - `noted.createNoteFromPlaceholder` - Create note from placeholder link
  - `noted.openPlaceholderSource` - Jump to source location
- **Visual Indicators**: Icons distinguish categories (circle-slash, arrows)
- **Tooltips**: Detailed connection status on hover

## Editor Features

### Markdown Preview (v1.12.0)
- **Toggle Markdown Preview**: Preview markdown files with live rendering
- **Editor Title Button**: Click preview icon in editor toolbar for .md files
- **Side-by-Side View**: View source and preview simultaneously
- **Auto-Update**: Preview updates automatically as you type
- **Embedded Content Rendering** (v1.28.9):
  - **Embedded Notes**: Render note content inline using `![[note-name]]` syntax
    - Supports wiki-style note resolution (finds notes by name across workspace)
    - Section-specific embeds: `![[note-name#section]]` to embed only a specific section
    - Custom display text: `![[note-name|Display Text]]` to override the shown title
    - Automatic frontmatter removal for cleaner embedded content
    - Styled with distinct visual separator and title
  - **Embedded Images**: Render images inline using `![[image.png]]` syntax
    - Supports relative paths (from notes folder or current note)
    - Supports workspace-relative paths
    - Supports all common formats: PNG, JPG, JPEG, GIF, SVG, WebP, BMP, ICO
    - Graceful error handling with descriptive placeholders for missing resources

### Undo/Redo System (v1.13.0)
- **Undo Last Operation**: Undo destructive operations
- **Redo Last Operation**: Redo previously undone operations
- **Show Undo History**: View complete history of undoable operations
- **Clear Undo History**: Clear all stored undo history
- **Supported Operations**: Delete, rename, move, archive, bulk delete, bulk move, bulk archive
- **Operation Details**: Each history entry shows operation type, affected files, and timestamp
- **Smart Restore**: Automatically restores file contents and locations

## Statistics & Export

### Statistics
- **Note Statistics**: View total notes, notes this week, and notes this month

### Export
- **Export Notes**: Export notes by date range (This Week, This Month, All Notes)
- Creates combined text file with all selected notes

## Command Access

All commands are accessible via:
- **Command Palette**: Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux) and search for "Noted"
- **Sidebar Toolbar**: Icon buttons in the Notes, Templates, and Tags panels
- **Context Menus**: Right-click on notes, folders, and tags for quick actions
- **Keyboard Shortcuts**: Users can assign custom keyboard shortcuts in VS Code settings (File > Preferences > Keyboard Shortcuts)

## Configuration

### Setup
- **Setup Default Folder**: Create notes folder in workspace or home directory
- **Setup Custom Folder**: Choose custom location via folder picker
- **Move Notes Folder**: Relocate entire notes folder with all contents

### Settings
- `noted.notesFolder`: Location of notes folder (absolute path recommended)
- `noted.fileFormat`: File format - "txt" or "md" (default: "md")
- `noted.useTemplate`: Enable custom template (not currently implemented)
- `noted.template`: Custom template string (not currently implemented)
- `noted.tagAutoComplete`: Enable tag autocomplete suggestions when typing # (default: true)

## Tree View

### Hierarchical Organization
- **Templates**: Quick access to note templates
- **My Notes**: Main notes organization
  - **Pinned Notes** (v1.5.0): Quick access to favorited notes
  - **Recent Notes**: Quick access to recently modified notes
  - **Archive** (v1.5.0): Archived notes section
  - **Custom Folders**: User-created organizational folders (alphabetically sorted)
  - **Year Folders**: Automatic date-based organization (reverse chronological)
    - **Month Folders**: Within each year, organized by month
      - **Note Files**: Individual notes within months (with selection support in bulk mode)
- **Tags**: All tags with usage counts, sortable and filterable

### Icons
- Custom folders: Opened folder icon
- Year folders: Standard folder icon
- Month folders: Calendar icon
- Notes: Note icon (checkmark when selected in bulk mode)
- **Pinned Notes** (v1.5.0): Pin icon (📌)
- **Archived Notes** (v1.5.0): Archive icon (📦)
- Tags: Tag icon with count badge
- Pinned Notes section: Pin icon
- Archive section: Archive icon
- Recent Notes section: History icon

## Context Menus

### On Notes
- Toggle Note Selection (when in select mode)
- Move Note to Folder
- Delete Note
- Rename Note
- Duplicate Note
- Copy Path
- Show in System Explorer
- **Pin/Unpin Note** (v1.5.0)
- **Archive Note** (v1.5.0)

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
- Quick Switcher
- Refresh
- Show Calendar View
- Show Graph View
- Clear Tag Filters (when active)
- Toggle Select Mode
- Bulk Delete (when notes selected)
- Bulk Move (when notes selected)
- Bulk Archive (when notes selected)
- Clear Selection (when notes selected)
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
    - Core services: configService, fileSystemService, noteService, templateService
    - Search: searchService
    - Tags: tagService, tagCompletionProvider
    - Organization: pinnedNotesService, archiveService
    - Linking: linkService (wiki-style links and backlinks), embedService (note and image embeds)
    - Operations: bulkOperationsService, undoService, undoHelpers
    - Graph: graphService (connection analysis and visualization)
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

### Unit Tests (352 tests - all passing)
- **Testing Framework**: Mocha + Chai (v4 for CommonJS compatibility)
- **Test Coverage**:
  - Utilities: validators, date helpers, folder operations (23 tests)
  - Services: file system, templates, note service, tag service, tag completion, embed service with image support, placeholders service (130 tests)
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
- `src/test/unit/placeholdersService.test.ts` - Placeholder link detection and tracking tests (27 tests)
- `src/test/unit/tagHelpers.test.ts` - Tag parsing and validation tests (including YAML frontmatter support)
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

### Diagram Embed Enhancements (v1.31.7)
- **Automatic Sibling Folder Search**: Diagrams in `Diagrams/` folder automatically discovered
  - No need to add parent directory to workspace
  - Works for deeply nested notes (e.g., `Notes/2025/10-October/note.md` finds `Diagrams/diagram.drawio`)
  - Configurable folder name via `noted.diagramsFolder` setting
- **Custom Preview with Webview Permissions**: Enhanced preview panel for diagram rendering
  - Proper resource permissions for files outside workspace
  - Renders exported diagrams (.svg, .png) inline
  - Shows helpful messages for raw diagrams with export instructions
  - Multi-level parent directory access for flexible folder structures
- **Smart Path Resolution**: Improved path resolution logic
  - Checks sibling Diagrams folder before workspace search
  - Handles both folder name and full path configurations
  - Extracts folder name from paths automatically
- **Command**: `Noted: Open Preview (with Diagram Support)` for custom preview

### YAML Frontmatter Tag Support (v1.25.0)
- **Frontmatter Tags**: Add tags using standard YAML frontmatter array format: `tags: [tag1, tag2, tag3]`
- **Flexible Formats**: Supports unquoted, double-quoted, and single-quoted tag values
- **Combined Support**: Use both frontmatter tags and inline hashtags in the same note
- **Automatic Merging**: Tags from frontmatter and inline content are automatically combined and deduplicated
- **Validation**: Frontmatter tags are validated using the same rules as inline tags
- **Comprehensive Testing**: 11 new unit tests covering all frontmatter scenarios (325 total passing tests)

### Undo/Redo System (v1.13.0)
- **Comprehensive Undo/Redo**: Full undo/redo support for all destructive operations
- **Operation Tracking**: Automatic tracking of delete, rename, move, archive, and bulk operations
- **History Management**: View complete history with operation details and timestamps
- **Smart Restore**: Intelligently restores files with original content and locations
- **Keyboard Shortcuts**: Quick access via Cmd/Ctrl+Alt+Z (undo) and Cmd/Ctrl+Shift+Alt+Z (redo)
- **Clear History**: Option to clear undo history when needed

### Embedded Content Rendering (v1.28.9)
- **Embedded Notes**: Render note content inline in markdown preview using `![[note-name]]` syntax
- **Section Embeds**: Embed specific sections with `![[note-name#section]]`
- **Custom Display Text**: Override titles with `![[note-name|Display Text]]`
- **Embedded Images**: Render images inline using `![[image.png]]` syntax
- **Smart Resolution**: Automatically finds notes and images across workspace
- **Multiple Formats**: Supports PNG, JPG, JPEG, GIF, SVG, WebP, BMP, ICO
- **Clean Rendering**: Automatic frontmatter removal from embedded notes
- **Visual Styling**: Distinct styling for embedded content with titles and separators
- **Error Handling**: Graceful placeholders for missing notes or images

### Markdown Preview (v1.12.0, Enhanced v1.28.9)
- **Live Preview**: Real-time markdown rendering for .md files
- **Editor Integration**: Toggle preview from editor toolbar or keyboard shortcut
- **Side-by-Side View**: View source and rendered markdown simultaneously
- **Auto-Update**: Preview automatically updates as you type
- **Embedded Content** (v1.28.9): Full support for embedded notes and images in preview

### Bulk Operations (v1.10.0-1.11.0)
- **Multi-Select Mode**: Select multiple notes for batch operations
- **Visual Feedback**: Selected notes show checkmark icon
- **Bulk Actions**: Delete, move, or archive multiple notes at once
- **Safety Confirmations**: All operations show confirmation dialogs with previews
- **Comprehensive Testing**: 51 unit tests covering all bulk operation scenarios

### Note Tagging System (Completed - v1.4.0, Enhanced v1.25.0)
- **Inline Tag Support**: Add tags anywhere in note content using `#tagname` syntax
- **YAML Frontmatter Tags** (v1.25.0): Add tags in frontmatter using `tags: [tag1, tag2, tag3]` format
- **Flexible Tag Formats** (v1.25.0): Supports both inline hashtags and YAML frontmatter arrays
- **Combined Tag Support** (v1.25.0): Use both formats in same note - automatically merged and deduplicated
- **Tag Parsing and Indexing**: Automatically parse and index tags from entire note content and frontmatter
- **Tags Tree View**: Dedicated sidebar panel showing all tags with usage counts
- **Tag Filtering**: Click tags to filter notes instantly, or select multiple tags for AND filtering
- **Tag Autocomplete**: Intelligent autocomplete suggestions when typing `#` anywhere in notes
- **Tag Sorting**: Sort tags alphabetically or by frequency (most-used first)
- **Comprehensive Testing**: Full unit test coverage for tag functionality (325 passing tests, including 11 frontmatter tests)
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
