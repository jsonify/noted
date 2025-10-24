---
layout: default
title: Configuration
parent: User Guide
nav_order: 2
---

# Configuration

Customize Noted to match your workflow and preferences.

## Accessing Settings

### Via Settings UI

1. **Open Settings** (`Cmd+,` on Mac, `Ctrl+,` on Windows/Linux)
2. **Search for "Noted"** in the search box
3. **Adjust settings** using the UI controls

### Via settings.json

Edit settings directly:

1. **Open Command Palette** (`Cmd+Shift+P`)
2. **Run "Preferences: Open Settings (JSON)"**
3. **Add Noted settings** to the JSON file

Example:
```json
{
  "noted.notesFolder": "/Users/username/Documents/Notes",
  "noted.fileFormat": "md",
  "noted.tagAutoComplete": true,
  "noted.autoBacklinks": true
}
```

## Core Settings

### Notes Folder

**Setting:** `noted.notesFolder`

**Description:** Path to your notes directory

**Default:** `"Notes"` (relative to workspace or home directory)

**Example values:**
```json
"noted.notesFolder": "Notes"                           // Relative to workspace
"noted.notesFolder": "/Users/username/Documents/Notes"  // Absolute path
"noted.notesFolder": "~/MyNotes"                       // Home directory
"noted.notesFolder": "C:\\Users\\username\\Notes"      // Windows path
```

**Best practices:**
- **Use absolute paths** for consistency across workspaces
- **Use home directory** (`~`) for universal access
- **Use workspace-relative** for project-specific notes

**Changing the folder:**
- Use `Noted: Move Notes Folder` command to relocate
- Or manually update setting and restart VS Code
- Notes aren't moved automatically when changing this setting

### File Format

**Setting:** `noted.fileFormat`

**Description:** Default file extension for new notes

**Options:** `"txt"` or `"md"`

**Default:** `"md"`

**What it affects:**
- Daily notes created with `Open Today's Note`
- Notes created from templates
- All new note creation commands

**What it doesn't affect:**
- Existing notes (they keep their current format)
- Template files themselves
- Archived notes

**Example:**
```json
"noted.fileFormat": "md"   // Use markdown (.md)
"noted.fileFormat": "txt"  // Use plain text (.txt)
```

**Choosing between formats:**

**Markdown (.md):**
- Rich formatting (headings, lists, bold, italic)
- Preview support with `Cmd+K Cmd+V`
- Better for wiki links and embeds
- Syntax highlighting
- Recommended for most users

**Plain Text (.txt):**
- Simple, lightweight
- Universal compatibility
- Faster file operations
- No formatting overhead
- Good for quick capture

### Tag Autocomplete

**Setting:** `noted.tagAutoComplete`

**Description:** Enable tag suggestions when typing `#`

**Type:** Boolean

**Default:** `true`

**Example:**
```json
"noted.tagAutoComplete": true   // Enable autocomplete (recommended)
"noted.tagAutoComplete": false  // Disable autocomplete
```

**When enabled:**
- Type `#` to trigger suggestions
- Shows existing tags with usage counts
- Sorted by frequency (most used first)
- Works in both `.txt` and `.md` files

**When disabled:**
- No autocomplete popup appears
- Must type tags manually
- Tags still indexed and searchable

**Disable if:**
- You prefer manual tag entry
- Autocomplete interferes with other extensions
- Working in very large workspaces (performance)

### Auto-Backlinks

**Setting:** `noted.autoBacklinks`

**Description:** Automatically append backlinks sections to notes

**Type:** Boolean

**Default:** `true`

**Example:**
```json
"noted.autoBacklinks": true   // Enable automatic backlinks sections
"noted.autoBacklinks": false  // Disable automatic backlinks sections
```

**When enabled:**
- Notes automatically get a `## Backlinks` section at the end
- Section lists all notes that link to the current note
- Shows tags from source notes' frontmatter
- Updates automatically when links are created or removed

**When disabled:**
- No backlinks sections are added to notes
- Use Connections panel to view backlinks instead
- Notes remain clean of auto-generated content

**Managing backlinks sections:**
- `Noted: Rebuild Backlinks Index` - Regenerate all sections
- `Noted: Clear All Backlinks Sections` - Remove all sections
- Manual edits to backlinks section are preserved between updates

## Advanced Settings

### Template Settings

**Note:** These settings exist but are currently not actively used by the extension.

**Setting:** `noted.useTemplate`

**Description:** Enable custom template (legacy setting)

**Default:** `false`

**Setting:** `noted.template`

**Description:** Custom template string (legacy setting)

**Default:** `""`

**Current behavior:**
- Built-in templates are always available
- Custom templates are created as files in `.templates/` folder
- These settings may be used in future versions

## Workspace vs User Settings

### User Settings

**Scope:** Apply to all VS Code workspaces

**Location:** Global settings file

**Use for:**
- Notes folder location (if same across all projects)
- File format preference
- Tag autocomplete preference
- Auto-backlinks preference

**Example:**
```json
// settings.json (User)
{
  "noted.notesFolder": "~/Documents/Notes",
  "noted.fileFormat": "md",
  "noted.tagAutoComplete": true,
  "noted.autoBacklinks": true
}
```

### Workspace Settings

**Scope:** Apply only to current workspace

**Location:** `.vscode/settings.json` in workspace

**Use for:**
- Project-specific notes folder
- Different file format for specific project
- Project-specific preferences

**Example:**
```json
// .vscode/settings.json (Workspace)
{
  "noted.notesFolder": "${workspaceFolder}/project-notes",
  "noted.fileFormat": "txt"
}
```

**Priority:** Workspace settings override User settings

## Common Configuration Scenarios

### Personal Knowledge Base

Single notes folder for all your notes:

```json
{
  "noted.notesFolder": "~/Documents/PersonalNotes",
  "noted.fileFormat": "md",
  "noted.tagAutoComplete": true,
  "noted.autoBacklinks": true
}
```

### Project-Specific Notes

Different notes for each project:

```json
// .vscode/settings.json in each project
{
  "noted.notesFolder": "${workspaceFolder}/notes",
  "noted.fileFormat": "md"
}
```

### Synced Notes (Dropbox/Google Drive)

Notes in cloud-synced folder:

```json
{
  "noted.notesFolder": "~/Dropbox/Notes",
  "noted.fileFormat": "md",
  "noted.tagAutoComplete": true
}
```

### Minimal Plain Text

Lightweight plain text setup:

```json
{
  "noted.notesFolder": "~/Notes",
  "noted.fileFormat": "txt",
  "noted.tagAutoComplete": false,
  "noted.autoBacklinks": false
}
```

### Team Documentation

Shared project documentation:

```json
{
  "noted.notesFolder": "${workspaceFolder}/docs/notes",
  "noted.fileFormat": "md",
  "noted.autoBacklinks": true
}
```

## Keyboard Shortcuts

Noted includes default keyboard shortcuts. Customize them:

### View Keyboard Shortcuts

1. **Open Keyboard Shortcuts** (`Cmd+K Cmd+S`)
2. **Search for "Noted"**
3. **See all Noted commands** with current shortcuts

### Change a Shortcut

1. **Find command** in Keyboard Shortcuts editor
2. **Click the pencil icon** or double-click
3. **Press your desired key combination**
4. **Press Enter** to confirm

### Recommended Custom Shortcuts

Default shortcuts that you might want to customize:

```
Noted: Open Today's Note        Cmd+Shift+N (Default)
Noted: Insert Timestamp         Cmd+Shift+T (Default)
Noted: Search Notes            Cmd+Shift+F (Default)
Noted: Show Calendar View      Cmd+Shift+C (Default)
Noted: Show Graph View         Cmd+Shift+G (Default)
```

Optional shortcuts to add:

```
Noted: Toggle Select Mode       Cmd+K Cmd+S (Suggested)
Noted: Archive Note            Cmd+K Cmd+A (Suggested)
Noted: Filter by Tag           Cmd+K Cmd+T (Suggested)
Noted: Quick Switcher          Cmd+K Cmd+Q (Suggested)
```

[See full Keyboard Shortcuts guide]({{ '/user/keyboard-shortcuts' | relative_url }})

## Changing Notes Folder Location

### Move Existing Notes

Use the built-in move command:

1. **Run "Noted: Move Notes Folder"**
2. **Select new location**
3. **All notes are moved** to new folder
4. **Setting updates** automatically

### Manual Change

Change without moving files:

1. **Update setting** `noted.notesFolder`
2. **Restart VS Code**
3. **Manually move files** if needed

**Warning:** Manually changing the setting doesn't move your notes. Use the "Move Notes Folder" command for automatic migration.

## Resetting Configuration

### Reset to Defaults

Remove all Noted settings:

1. **Open Settings** (`Cmd+,`)
2. **Search "Noted"**
3. **Click gear icon** on each setting → "Reset Setting"
4. **Or** remove from `settings.json` manually

### Start Fresh

Complete reset:

1. **Reset all settings** (steps above)
2. **Delete notes folder** (if desired)
3. **Run "Noted: Setup Default Folder"**
4. **Start with clean slate**

## Configuration Tips

### Use Absolute Paths

**Recommended:**
```json
"noted.notesFolder": "/Users/username/Documents/Notes"
```

**Avoid:**
```json
"noted.notesFolder": "Notes"  // Relative, depends on workspace
```

**Why:** Absolute paths work consistently across all workspaces

### Organize by Purpose

**Personal:** User settings with home directory path
**Work:** Workspace settings with project-relative path
**Shared:** Workspace settings with team-accessible path

### Version Control

**For personal projects:**
- Add `.vscode/settings.json` to `.gitignore`
- Keep notes folder path personal

**For team projects:**
- Commit `.vscode/settings.json` with relative path
- Use `${workspaceFolder}/notes`
- Team members get same setup

### Backup Your Settings

Export settings for backup:

1. **Copy from settings.json**
2. **Save to external file**
3. **Or** use VS Code Settings Sync feature

## Troubleshooting

### Settings Not Taking Effect

**Solutions:**
- Reload VS Code window (`Cmd+Shift+P` → "Reload Window")
- Check for syntax errors in settings.json
- Verify setting names are spelled correctly
- Check workspace settings aren't overriding user settings

### Notes Folder Not Found

**Check:**
- Path is absolute and correct
- Folder exists at specified location
- Permissions allow read/write
- Path uses correct separators for OS

**Fix:**
- Run "Setup Default Folder" or "Setup Custom Folder"
- Manually create folder at specified path
- Update path in settings

### File Format Not Working

**Issue:** New notes still using old format

**Remember:** Setting only affects new notes, not existing ones

**To change existing notes:**
- Manually rename files (`.txt` ↔ `.md`)
- Content remains the same
- Or use file format preference going forward

## Related Documentation

- [Installation Guide]({{ '/user/installation' | relative_url }}) - Initial setup
- [Keyboard Shortcuts]({{ '/user/keyboard-shortcuts' | relative_url }}) - All shortcuts
- [Troubleshooting]({{ '/user/troubleshooting' | relative_url }}) - Common issues

---

[← Back: Installation]({{ '/user/installation' | relative_url }}) | [Next: Getting Started →]({{ '/user/getting-started' | relative_url }})
