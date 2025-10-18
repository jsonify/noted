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
- **Rename Note**: Rename individual notes
- **Duplicate Note**: Create a copy of any note
- **Delete Note**: Delete notes with confirmation
- **Copy Path**: Copy note file path to clipboard

## Search & Discovery

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

## Tree View

### Hierarchical Organization
- **Recent Notes**: Quick access to recently modified notes
- **Custom Folders**: User-created organizational folders (alphabetically sorted)
- **Year Folders**: Automatic date-based organization (reverse chronological)
  - **Month Folders**: Within each year, organized by month
    - **Note Files**: Individual notes within months

### Icons
- Custom folders: Opened folder icon
- Year folders: Standard folder icon
- Month folders: Calendar icon
- Notes: Note icon

## Context Menus

### On Notes
- Move Note to Folder
- Delete Note
- Rename Note
- Duplicate Note
- Copy Path

### On Custom Folders
- Rename Folder
- Delete Folder

### Toolbar Actions
- Open Today's Note
- Create Folder
- Search Notes
- Refresh
- Show Calendar View
- Show Statistics
- Export Notes

## Architecture Notes

- **Single-file implementation**: All code in `src/extension.ts`
- **Synchronous file operations**: Direct use of Node.js `fs` module
- **TreeDataProvider pattern**: Standard VS Code tree view implementation
- **Date formatting**: Uses locale-specific formatting (en-US)
- **File name sanitization**: Automatic sanitization for note names from templates
