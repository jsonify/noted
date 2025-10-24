---
layout: page
title: Getting Started
icon: fas fa-rocket
order: 0
---

# Getting Started with Noted

Get up and running with Noted in just a few minutes.

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Press `Cmd+Shift+X` (or `Ctrl+Shift+X` on Windows/Linux) to open Extensions
3. Search for "Noted"
4. Click **Install** on the extension by "jsonify"

[Install from Marketplace →](https://marketplace.visualstudio.com/items?itemName=jsonify.noted)

### From Command Line

```bash
code --install-extension jsonify.noted
```

## First Steps

### 1. Create Your First Note

Press `Cmd+Shift+P` to open the Command Palette and search for:

```
Noted: Open Today's Note
```

Or use the keyboard shortcut: `Cmd+Shift+N`

This will create a note for today in the format: `Notes/2024/10-October/2024-10-23.txt`

### 2. Explore the Sidebar

Click the notebook icon in the Activity Bar (left sidebar) to see your notes organized by:

- **Templates** - Quick access to note templates
- **Recent Notes** - Your most recently edited notes
- **Year/Month Folders** - All notes organized chronologically

### 3. Try a Template

1. Click the **Templates** section in the sidebar
2. Choose a template type (Meeting, Research, Problem-Solution, or Quick)
3. Enter a name for your note
4. Start writing!

## Essential Commands

Access all Noted commands via the Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`) and type "Noted":

| Command | Description |
|---------|-------------|
| Noted: Open Today's Note | Create or open today's daily note |
| Noted: Insert Timestamp | Insert current time at cursor |
| Noted: Search Notes | Advanced search across all notes |
| Noted: Quick Switcher | Quick access to recent notes |
| Noted: Show Calendar | Open calendar view |
| Noted: Show Graph | Visualize note connections |

### Setting Up Keyboard Shortcuts

Noted doesn't include default keyboard shortcuts, but you can easily set up your own:

1. Open `File > Preferences > Keyboard Shortcuts` (or `Cmd+K Cmd+S`)
2. Search for "Noted"
3. Click the `+` icon next to any command to assign a shortcut
4. Enter your preferred key combination

**Suggested shortcuts:**
- `Cmd+Shift+N` - Open Today's Note
- `Cmd+Shift+T` - Insert Timestamp
- `Cmd+Shift+F` - Search Notes
- `Cmd+Shift+C` - Show Calendar
- `Cmd+Shift+G` - Show Graph

## Configuration

### Customize Your Setup

Open VS Code Settings (`Cmd+,`) and search for "Noted" to configure:

- **Notes Folder**: Default is "Notes" (change to any folder name)
- **File Format**: Choose between `.txt` or `.md` files
- **Tag Autocomplete**: Enable/disable tag suggestions
- **Auto Backlinks**: Automatically append backlinks sections to notes

### Recommended Settings

For the best experience, we recommend:

```json
{
  "noted.fileFormat": "md",
  "noted.tagAutoComplete": true,
  "noted.autoBacklinks": true
}
```

## Quick Workflows

### Daily Standup Notes

1. Use Command Palette → "Noted: Open Today's Note"
2. Add `#standup` tag
3. Use template variables for structure
4. Link to project notes with `[[project-name]]`

### Meeting Minutes

1. Open Command Palette → "Noted: Open with Template"
2. Choose "Meeting" template
3. Fill in attendees, agenda, and action items
4. Tag with `#meeting #project-name`
5. Link to related notes

### Research & Documentation

1. Create a note for your research topic
2. Use `#research` tags
3. Link to related findings with `[[note-name]]`
4. Embed important sections with `![[note#section]]`
5. View connections in the Graph View

## Next Steps

Now that you're set up, explore these features:

1. [**Wiki-Style Links**](/noted/posts/wiki-links/) - Connect related notes
2. [**Tags**](/noted/posts/tags/) - Organize and filter your notes
3. [**Templates**](/noted/posts/templates/) - Create custom templates
4. [**Graph View**](/noted/posts/graph/) - Visualize your knowledge network
5. [**Search**](/noted/posts/search/) - Master advanced search filters

## Need Help?

- **Documentation**: Browse the [Features](/noted/tabs/features/) section
- **Issues**: Report bugs on [GitHub Issues](https://github.com/jsonify/noted/issues)
- **Discussions**: Ask questions in [GitHub Discussions](https://github.com/jsonify/noted/discussions)

---

Happy note-taking! 🎉
