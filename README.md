# Noted Extension

[![CI](https://github.com/jsonify/noted/actions/workflows/ci.yml/badge.svg)](https://github.com/jsonify/noted/actions/workflows/ci.yml)
[![Tests](https://github.com/jsonify/noted/actions/workflows/test.yml/badge.svg)](https://github.com/jsonify/noted/actions/workflows/test.yml)

A VS Code extension for quick daily note-taking, meeting notes, project ideas, and more - your digital scratch pad!

## Features

- **Quick Access**: Press `Ctrl+Shift+N` (or `Cmd+Shift+N` on Mac) to instantly open today's note
- **Auto-Organization**: Notes are automatically organized in `Notes/YEAR/MM-MonthName/YYYY-MM-DD.txt`
- **Timestamps**: Press `Ctrl+Shift+T` (or `Cmd+Shift+T`) to insert a timestamp with custom note filenames
- **Flexible Format**: Default .txt files, easily switch to .md with a command
- **Built-in Templates**: Choose from Problem/Solution, Meeting, Research, or Quick note templates
- **Custom Templates**: Create and manage your own reusable note templates
- **Tag System** ⭐ NEW: Organize notes with tags, filter by tags, and get autocomplete suggestions
- **Calendar View**: Visual monthly calendar for navigating and creating daily notes
- **Drag & Drop**: Move notes between folders with simple drag-and-drop
- **Full-Text Search**: Search across all notes with instant preview

## Usage

1. **Open Today's Note**:
   - Keyboard: `Ctrl+Shift+N` (Windows/Linux) or `Cmd+Shift+N` (Mac)
   - Command Palette: "Noted: Open Today's Note"

2. **Insert Timestamp**:
   - Keyboard: `Ctrl+Shift+T` (Windows/Linux) or `Cmd+Shift+T` (Mac)
   - Command Palette: "Noted: Insert Timestamp"

3. **Toggle Format**:
   - Command Palette: "Noted: Toggle File Format (txt/md)"

4. **Use Tags** ⭐ NEW:
   - Add tags anywhere in your notes using `#tagname` syntax
   - View all tags in the dedicated Tags sidebar panel
   - Click any tag to filter notes containing that tag
   - Type `#` in a note to see autocomplete suggestions
   - Sort tags alphabetically or by frequency
   - Filter by multiple tags simultaneously

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

### Tag Management

**Refresh Tags:**
- Click the refresh button in Tags panel
- Or use Command Palette: "Noted: Refresh Tags"
- Automatically rebuilds the tag index from all notes

**View Tag Statistics:**
- Each tag shows its usage count in the Tags panel
- See which tags you use most often at a glance

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

## Configuration

Access settings via VS Code Settings (search for "Noted"):

- **Notes Folder**: Change where notes are stored (default: "Notes")
- **File Format**: Choose between .txt or .md format (default: "txt")
- **Use Template**: Enable custom templates for new notes
- **Template**: Customize your note structure (supports {date}, {time}, and {filename} placeholders)
- **Tag Autocomplete**: Enable/disable tag suggestions when typing `#` (default: enabled)

### Example Template for Problem Solving

```
{date}
==================================================

PROBLEM:


STEPS TAKEN:
1. 

SOLUTION:


NOTES:

```

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

The project includes 143 passing unit tests covering utilities, services, providers, and the tag system.

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
