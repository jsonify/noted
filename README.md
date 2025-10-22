# Noted Extension

[![CI](https://github.com/jsonify/noted/actions/workflows/ci.yml/badge.svg)](https://github.com/jsonify/noted/actions/workflows/ci.yml)

A VS Code extension for quick daily note-taking, meeting notes, project ideas, and more - your digital scratch pad!

## Features

- **Quick Access**: Instantly open today's note via command palette
- **Auto-Organization**: Notes are automatically organized in `Notes/YEAR/MM-MonthName/YYYY-MM-DD.txt`
- **Timestamps**: Insert timestamps with custom note filenames
- **Flexible Format**: Default .txt files, easily switch to .md with a command
- **Built-in Templates**: Choose from Problem/Solution, Meeting, Research, or Quick note templates
- **Custom Templates** Create, edit, and manage your own reusable templates with 10 powerful variables
- **Template Variables** Use dynamic placeholders like {date}, {user}, {workspace}, and more
- **Tag System**: Organize notes with tags, filter by tags, and get autocomplete suggestions
- **Advanced Tag Management** Rename, merge, delete, and export tags across all notes
- **Wiki-Style Links** Link notes together with `[[note-name]]` syntax and see backlinks
- **Pinned Notes** Pin frequently accessed notes for quick access
- **Archive** Archive old or completed notes to keep your workspace clean
- **Calendar View**: Visual monthly calendar for navigating and creating daily notes
- **Drag & Drop**: Move notes between folders with simple drag-and-drop
- **Advanced Search** Powerful search with regex, date filters, and tag filtering
- **Quick Switcher** Instantly access your 20 most recent notes

## Usage

1. **Open Today's Note**:
   - Command Palette: "Noted: Open Today's Note"
   - Sidebar: Click the "+" icon in the Notes panel

2. **Insert Timestamp**:
   - Command Palette: "Noted: Insert Timestamp"

3. **Toggle Format**:
   - Command Palette: "Noted: Toggle File Format (txt/md)"

4. **Quick Switcher**:
   - Command Palette: "Noted: Quick Switcher (Recent Notes)"
   - Instantly access your 20 most recently modified notes

5. **Use Tags**:
   - Add tags anywhere in your notes using `#tagname` syntax
   - View all tags in the dedicated Tags sidebar panel
   - Click any tag to filter notes containing that tag
   - Type `#` in a note to see autocomplete suggestions
   - Sort tags alphabetically or by frequency
   - Filter by multiple tags simultaneously
   - Manage tags: rename, merge, delete, or export them

## Tag System

The tag system helps you organize and find your notes quickly:

### Adding Tags to Notes

Simply type `#` followed by your tag name anywhere in your note:

```
2025-10-19
==================================================

Working on the new authentication feature today #backend #auth

Fixed bug in login form #bugfix #frontend

Next steps:
- Add tests #todo
- Update documentation #docs
```

**Tag Format:**
- Tags can contain letters, numbers, hyphens, and underscores
- Valid examples: `#bug-fix`, `#work_notes`, `#project2024`
- Tags are case-insensitive (`#Bug` and `#bug` are the same)

### Finding Tagged Notes

**Filter by Tag:**
1. Open the "Tags" panel in the sidebar (third panel)
2. Click any tag to filter notes
3. Or use Command Palette: "Noted: Filter Notes by Tag"
4. Select multiple tags to find notes with all selected tags

**Tag Autocomplete:**
- Type `#` in any note to see suggestions
- Suggestions are sorted by frequency (most-used tags first)
- Press Enter or Tab to accept a suggestion

**Sort Tags:**
- Click the sort buttons in the Tags panel toolbar
- Sort alphabetically (A-Z)
- Sort by frequency (most-used first)

### Tag Management ⭐ NEW

**Rename Tags:**
- Right-click a tag and select "Rename Tag"
- Or use Command Palette: "Noted: Rename Tag"
- Updates the tag across all notes automatically
- Validates tag names and prevents duplicates

**Merge Tags:**
- Use Command Palette: "Noted: Merge Tags"
- Select the tag to keep and the tag to merge
- Automatically removes duplicates after merging
- Updates all affected notes in one operation

**Delete Tags:**
- Right-click a tag and select "Delete Tag"
- Or use Command Palette: "Noted: Delete Tag"
- Removes the tag from all notes with confirmation
- Includes rollback support if errors occur

**Export Tags:**
- Use Command Palette: "Noted: Export Tags to JSON"
- Exports all tags with metadata (name, count, notes)
- Includes export date and total tag count
- Perfect for backup or external analysis

**Refresh Tags:**
- Click the refresh button in Tags panel
- Or use Command Palette: "Noted: Refresh Tags"
- Automatically rebuilds the tag index from all notes

**View Tag Statistics:**
- Each tag shows its usage count in the Tags panel
- See which tags you use most often at a glance

## Note Organization & Discovery ⭐ NEW

### Wiki-Style Note Linking ⭐ ENHANCED

Connect your notes together to build a knowledge base:

**Creating Links:**
```
Working on the authentication feature today.
See also: [[user-authentication-spec]]
Related: [[api-design]] and [[security-considerations]]

# New in v1.14.0: Disambiguate with paths when you have duplicate names
Meeting today: [[work/meeting]]
Yesterday's meeting: [[2025/10-October/meeting]]
```

**Link Features:**
- Use `[[note-name]]` syntax to link to any note
- Use `[[note-name|Custom Text]]` to display custom link text (v1.13.5)
- Use `[[folder/note-name]]` for disambiguation when multiple notes share the same name (v1.14.0)
- Links are clickable and navigate directly to the target note
- Automatic link resolution with fuzzy matching
- Works with partial note names for convenience
- **NEW:** Autocomplete shows all available notes while typing `[[`
- **NEW:** Warnings for ambiguous or broken links with quick fixes

**Path-Based Disambiguation (v1.14.0):**
When you have multiple notes with the same name in different folders:
- `[[meeting]]` - links to first match
- `[[work/meeting]]` - links to specific note in work folder
- `[[2025/10-October/meeting]]` - links to note in specific month
- Works with both `/` and `\` path separators
- Get autocomplete suggestions showing all matches with their paths
- Yellow warnings on ambiguous links with quick fixes to convert to full paths

**Viewing Backlinks:**
- Hover over any note's header to see all notes that link to it
- Each backlink shows the source note name and context
- Click backlinks to navigate to linking notes
- Automatically indexed for fast lookups

**Managing Links:**
- Links automatically update when you rename or move notes (v1.13.5)
- Use Command Palette: "Noted: Rebuild Backlinks Index"
- Index rebuilds automatically when notes change
- Works across all note formats (.txt and .md)

### Pinned Notes

Keep your most important notes at your fingertips:

**Pinning Notes:**
- Right-click any note and select "Pin/Unpin Note"
- Or use Command Palette: "Noted: Pin/Unpin Note"
- Pinned notes appear in a dedicated section at the top of the tree view

**Pinned Notes Features:**
- Visual pin indicator (📌) on pinned notes
- Persistent across VS Code sessions
- Quick access without scrolling
- Automatically removed if note is deleted

**Common Uses:**
- Current project notes
- Meeting agenda templates
- Frequently referenced guides
- Active task lists

### Archive

Keep your workspace clean by archiving completed work:

**Archiving Notes:**
- Right-click any note and select "Archive Note"
- Or use Command Palette: "Noted: Archive Note"
- Archived notes move to a hidden `.archive` folder

**Archive Features:**
- Dedicated "Archive" section in tree view
- Visual archive indicator (📦) on archived notes
- Archive old notes in bulk by age
- Unarchive notes to restore them

**Bulk Archive:**
- Use Command Palette: "Noted: Archive Old Notes"
- Specify how many days old (e.g., 90 days)
- Confirmation dialog before archiving
- Perfect for end-of-project cleanup

**Unarchiving:**
- Right-click archived note and select "Unarchive Note"
- Restores note to active notes
- Safe with confirmation dialogs

## Advanced Search & Discovery ⭐ NEW v1.6.0

### Powerful Search with Filters

Search across all your notes with advanced filtering capabilities:

**Basic Search:**
- Command Palette: "Noted: Search Notes"
- Enter any text to search across all note content
- View results with preview snippets and match counts

**Advanced Filters:**

Use special filter keywords in your search query:

- `regex:` - Enable regular expression pattern matching
  ```
  regex: bug.*fix
  ```

- `case:` - Enable case-sensitive search
  ```
  case: TODO
  ```

- `tag:tagname` - Filter results by specific tags
  ```
  tag:backend tag:api
  ```

- `from:YYYY-MM-DD` - Show only notes modified after this date
  ```
  from:2025-01-01
  ```

- `to:YYYY-MM-DD` - Show only notes modified before this date
  ```
  to:2025-01-31
  ```

**Combine Multiple Filters:**
```
regex: tag:work from:2025-01-01 authentication.*error
case: tag:bug tag:critical from:2025-10-01 BUG-
```

**Search Results:**
- Shows match counts for each note
- Displays tags associated with each note
- Preview of matching content
- Modification dates
- Click any result to open the note

### Quick Switcher

Instantly access your most recent notes:

**Features:**
- Command Palette: "Noted: Quick Switcher (Recent Notes)"
- Shows 20 most recently modified notes
- Displays tags, dates, and content preview
- Searchable by filename, tags, or content
- Fast navigation for easy access

**Use Cases:**
- Quickly return to your active work notes
- Jump between related notes in a project
- Access recently tagged items
- Navigate your daily notes chronologically

### Common Tag Use Cases

**Project Organization:**
```
Working on user authentication #project-alpha #backend
Designing new dashboard #project-alpha #frontend #design
```

**Task Management:**
```
Need to refactor the database layer #todo #refactoring
Bug in payment processing #bug #critical #backend
Code review for PR #42 #review
```

**Topic Categorization:**
```
Learned about React hooks today #learning #react #frontend
Performance optimization notes #performance #optimization
Meeting notes with design team #meeting #design
```

**Status Tracking:**
```
Started implementation #in-progress
Completed and tested #done
Waiting for feedback #blocked
```

## Custom Templates

Create personalized templates that match your workflow! Custom templates support 10 powerful variables that automatically fill in contextual information.

### Creating a Custom Template

1. Open the **Templates** panel in the sidebar (first panel)
2. Click **"Create New Template"**
3. Enter a name for your template
4. Edit the template file with your structure
5. Use any of the 10 template variables

### Template Variables

All templates (built-in and custom) support these dynamic placeholders:

**Basic Information:**
- `{filename}` - The name of the note file
- `{date}` - Full date (e.g., "Sunday, October 19, 2025")
- `{time}` - Current time in 12-hour format (e.g., "2:30 PM")

**Date Components:**
- `{year}` - Year (e.g., "2025")
- `{month}` - Month with leading zero (e.g., "10")
- `{day}` - Day with leading zero (e.g., "19")
- `{weekday}` - Short day name (e.g., "Sun", "Mon")
- `{month_name}` - Full month name (e.g., "October")

**Context:**
- `{user}` - Your system username
- `{workspace}` - Current VS Code workspace name

### Example Custom Templates

**Daily Standup Template:**
```
File: {filename}
Date: {date}
Author: {user}
==================================================

## What I did yesterday:
-

## What I'm doing today:
-

## Blockers:
- None

#standup #team
```

**Project Notes Template:**
```
Project: {workspace}
Created: {date} at {time}
==================================================

## Objective:


## Progress ({weekday}, {month_name} {day}):


## Next Steps:
-

#project #{workspace}
```

**Weekly Review Template:**
```
Weekly Review - Week of {month_name} {day}, {year}
By: {user}
==================================================

## Accomplishments:
-

## Challenges:
-

## Goals for Next Week:
-

#weekly-review #reflection
```

### Managing Templates

**Edit Template:**
- Click "Edit Template" in the Templates panel
- Select the template to modify
- Make your changes and save

**Delete Template:**
- Click "Delete Template" in the Templates panel
- Confirm deletion

**Duplicate Template:**
- Click "Duplicate Template" to copy an existing template
- Rename it and customize as needed

**View Variables Reference:**
- Click "Template Variables Reference" to see all available placeholders
- Opens a helpful reference panel with descriptions

**Templates Folder:**
- Click "Open Templates Folder" to access your templates in the file system
- Templates are stored in `{notesPath}/.templates/`

## Configuration

Access settings via VS Code Settings (search for "Noted"):

- **Notes Folder**: Change where notes are stored (default: "Notes")
- **File Format**: Choose between .txt or .md format (default: "txt")
- **Tag Autocomplete**: Enable/disable tag suggestions when typing `#` (default: enabled)

### Template Variables in Settings

The legacy `noted.useTemplate` and `noted.template` settings are superseded by the new Custom Templates feature. Use the Templates panel to create and manage templates instead of the settings.

All custom templates support the full set of 10 template variables: `{filename}`, `{date}`, `{time}`, `{year}`, `{month}`, `{day}`, `{weekday}`, `{month_name}`, `{user}`, and `{workspace}`.

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Noted"
4. Click Install

### Manual Installation

1. Download the latest `.vsix` file from the releases page
2. Open VS Code
3. Go to Extensions view
4. Click the "..." menu at the top
5. Select "Install from VSIX..."
6. Choose the downloaded file

## Development

1. Clone this repository
2. Run `pnpm install` to install dependencies
3. Run `pnpm run compile` to build the extension
4. Press F5 in VS Code to test the extension
5. To package: `pnpm dlx @vscode/vsce package`

### Testing

```bash
# Run unit tests
pnpm run test:unit

# Compile TypeScript
pnpm run compile

# Run all tests (requires VS Code)
pnpm run test
```

The project includes 184 passing unit tests covering utilities, services, providers, templates, tag system, and search functionality.

## Folder Structure

Your notes will be organized like this:

```
Notes/
  └── 2025/
      └── 10-October/
          ├── 2025-10-02.txt
          ├── 2025-10-03.txt
          └── ...
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
Please ensure to follow the existing code style and include tests for new features.

Also, keep in mind that I tend to make lots of updates, so please check for any breaking changes before submitting PRs.
