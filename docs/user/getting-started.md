---
layout: default
title: Quick Start Guide
parent: User Guide
nav_order: 1
---

# Quick Start Guide

Get up and running with Noted in just a few minutes.

## Installation

### From VS Code Marketplace

1. Open **VS Code**
2. Open **Extensions** view (`Cmd+Shift+X` / `Ctrl+Shift+X`)
3. Search for **"Noted"**
4. Click **Install**
5. Reload VS Code if prompted

### From VSIX File

1. Download `.vsix` file from [releases](https://github.com/jsonify/noted/releases)
2. Open **Extensions** view
3. Click **"..."** menu (top right)
4. Select **"Install from VSIX..."**
5. Choose downloaded file

## Initial Setup

When you first use Noted, you'll choose where to store your notes.

### Option 1: Default Location

**Default location:** `{workspace}/Notes/` or `{home}/Notes/`

1. Open Command Palette (`Cmd+Shift+P`)
2. Run **"Noted: Setup Default Notes Folder"**
3. Confirms creation
4. Notes folder ready!

### Option 2: Custom Location

**Choose your own folder:**

1. Open Command Palette (`Cmd+Shift+P`)
2. Run **"Noted: Setup Custom Notes Folder"**
3. Select folder in file picker
4. Notes folder configured!

## Your First Note

### Create Today's Note

1. Open Command Palette (`Cmd+Shift+P`)
2. Run **"Noted: Open Today's Note"**
3. Note opens in editor
4. Start writing!

Your note is automatically created at:
```
Notes/2025/10-October/2025-10-21.md
```

> **Note:** New notes are created as Markdown (`.md`) files by default. You can change this in settings to use `.txt` if preferred.

### Add Some Content

```
2025-10-21
==================================================

Today I'm setting up Noted for the first time!

Tasks:
- Learn basic features #tutorial
- Create my first template #todo
- Link some notes together

Notes on project:
- Need to review [[api-design]]
- Schedule [[team-meeting]]

#getting-started #day-one
```

### Save Your Note

Notes auto-save in VS Code. Just start typing!

## Exploring the Sidebar

Open the **Noted** activity bar (notebook icon) to see four panels:

### 1. Templates

- Quick access to built-in templates
- Create custom templates
- Manage template variables

**Try it:** Click "Meeting" to create a meeting note

### 2. My Notes

- Browse all your notes
- Organized by year and month
- Pinned notes at top
- Recent notes section
- Archive section

**Try it:** See your first note appear in the tree

### 3. Connections

- See all incoming backlinks for current note
- See all outgoing links from current note
- View context snippets with line numbers
- Click to navigate to connected notes

**Try it:** Open a note with links and see connections automatically

### 4. Tags

- All tags with usage counts
- Click to filter notes
- Sort alphabetically or by frequency

**Try it:** Click the `#getting-started` tag

## Essential Features to Try

### 1. Add a Timestamp

Place cursor where you want timestamp:

1. Open Command Palette
2. Run **"Noted: Insert Timestamp"**
3. Timestamp inserted: `[2:30 PM]`

### 2. Link Notes Together

Create a link to another note:

```
See also: [[my-other-note]]
```

Link is clickable - click to navigate!

### 3. Filter by Tag

1. Open **Tags** panel
2. Click any tag (e.g., `#todo`)
3. My Notes view filters to show only notes with that tag

### 4. Search Your Notes

1. Click search icon in My Notes toolbar
2. Enter search term
3. View results with previews
4. Click to open note

### 5. Use Quick Switcher

1. Click quick switcher icon (or run command)
2. See 20 most recent notes
3. Type to filter
4. Select to open

## Next Steps

### Set Up Templates

Create a custom template for your daily workflow:

1. Open **Templates** panel
2. Click **"Create New Template"**
3. Name it (e.g., "daily-log")
4. Add structure with [template variables]({{ '/features/templates' | relative_url }})

### Organize Your Notes

- Create custom folders for projects
- Pin frequently accessed notes
- Archive completed work

[Learn more about organization]({{ '/user/organizing-notes' | relative_url }})

### Build Your Knowledge Base

- Link related notes with `[[note-name]]`
- View all connections in the Connections panel (always visible)
- See backlinks by hovering over note headers
- Visualize connections with Graph View

[Learn more about linking]({{ '/features/wiki-links' | relative_url }}) • [Learn about Connections Panel]({{ '/features/connections' | relative_url }})

### Customize Settings

1. Open Settings (`Cmd+,`)
2. Search for "Noted"
3. Configure:
   - File format (`.txt` or `.md`, default: `.md`)
   - Tag autocomplete
   - Notes folder location

[See all configuration options]({{ '/user/configuration' | relative_url }})

## Common Workflows

### Daily Workflow

1. **Morning:** Open today's note, add tasks and goals
2. **Throughout day:** Add timestamps and progress notes
3. **Evening:** Review, add tags, link to related notes

### Meeting Workflow

1. Use **Meeting** template
2. Take notes during meeting
3. Add action items with `- [ ]` checkboxes
4. Tag with project and `#meeting`
5. Link to related notes

### Project Workflow

1. Create custom folder for project
2. Create template for project notes
3. Link notes together as project grows
4. Tag consistently (e.g., `#project-name`)
5. Use Graph View to visualize structure

## Getting Help

### Documentation

- [Features]({{ '/features/' | relative_url }}) - Detailed feature documentation
- [User Guide]({{ '/user/' | relative_url }}) - Complete user guide
- [FAQ]({{ '/user/faq' | relative_url }}) - Common questions

### Community

- [GitHub Issues](https://github.com/jsonify/noted/issues) - Report bugs or request features
- [Discussions](https://github.com/jsonify/noted/discussions) - Ask questions and share workflows

### Tips

- Hover over toolbar buttons for tooltips
- Right-click notes/folders/tags for context menus
- Use Command Palette to discover all commands (search "Noted:")

## What's Next?

Now that you've created your first note, explore these guides:

- **[Daily Note-Taking]({{ '/user/daily-notes' | relative_url }})** - Establish a daily note routine
- **[Using Templates]({{ '/user/using-templates' | relative_url }})** - Create structured notes efficiently
- **[Organizing Notes]({{ '/user/organizing-notes' | relative_url }})** - Keep your notes organized
- **[Linking Notes]({{ '/user/linking-notes' | relative_url }})** - Build connections between ideas

---

[← Back to User Guide]({{ '/user/' | relative_url }}) | [Next: Configuration →]({{ '/user/configuration' | relative_url }})
