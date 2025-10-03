# Noted Extension

A VS Code extension for quick daily note-taking, meeting notes, project ideas, and more - your digital scratch pad!

## Features

- **Quick Access**: Press `Ctrl+Shift+N` (or `Cmd+Shift+N` on Mac) to instantly open today's note
- **Auto-Organization**: Notes are automatically organized in `Notes/YEAR/MM-MonthName/YYYY-MM-DD.txt`
- **Timestamps**: Press `Ctrl+Shift+T` (or `Cmd+Shift+T`) to insert a timestamp
- **Flexible Format**: Default .txt files, easily switch to .md with a command
- **Optional Templates**: Set up a template for structured problem-solving notes

## Usage

1. **Open Today's Note**:
   - Keyboard: `Ctrl+Shift+N` (Windows/Linux) or `Cmd+Shift+N` (Mac)
   - Command Palette: "Noted: Open Today's Note"

2. **Insert Timestamp**:
   - Keyboard: `Ctrl+Shift+T` (Windows/Linux) or `Cmd+Shift+T` (Mac)
   - Command Palette: "Noted: Insert Timestamp"

3. **Toggle Format**:
   - Command Palette: "Noted: Toggle File Format (txt/md)"

## Configuration

Access settings via VS Code Settings (search for "Noted"):

- **Notes Folder**: Change where notes are stored (default: "Notes")
- **File Format**: Choose .txt or .md (default: "txt")
- **Use Template**: Enable custom templates for new notes
- **Template**: Customize your note structure (supports {date} and {time} placeholders)

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
