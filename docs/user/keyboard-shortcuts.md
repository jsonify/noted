---
layout: default
title: Keyboard Shortcuts
parent: User Guide
nav_order: 2
---

# Keyboard Shortcuts

Work faster with keyboard shortcuts for common Noted operations.

## Default Shortcuts

Noted doesn't include default keyboard shortcuts to avoid conflicts, but all commands are accessible via the Command Palette.

## Setting Up Shortcuts

Create custom keyboard shortcuts for your most-used commands:

### How to Add Shortcuts

1. Open **Keyboard Shortcuts** editor:
   - Mac: `Cmd+K Cmd+S`
   - Windows/Linux: `Ctrl+K Ctrl+S`

2. Search for **"Noted"** to see all commands

3. Click the **+** icon next to a command

4. Press your desired key combination

5. Press `Enter` to confirm

### Recommended Shortcuts

Here are suggested shortcuts (you can customize these):

#### Daily Workflow

| Command | Suggested Shortcut | Description |
|---------|-------------------|-------------|
| Open Today's Note | `Cmd+Shift+N` / `Ctrl+Shift+N` | Quick access to today's note |
| Insert Timestamp | `Cmd+Shift+T` / `Ctrl+Shift+T` | Add timestamp at cursor |
| Quick Switcher | `Cmd+Shift+P` / `Ctrl+Shift+P` | Access recent notes |
| Search Notes | `Cmd+Shift+F` / `Ctrl+Shift+F` | Search all notes |

#### Templates

| Command | Suggested Shortcut | Description |
|---------|-------------------|-------------|
| Open with Template | `Cmd+K Cmd+N` / `Ctrl+K Ctrl+N` | Create templated note |
| Create Custom Template | `Cmd+K Cmd+T` / `Ctrl+K Ctrl+T` | Create new template |

#### Organization

| Command | Suggested Shortcut | Description |
|---------|-------------------|-------------|
| Filter by Tag | `Cmd+K Cmd+F` / `Ctrl+K Ctrl+F` | Filter notes by tag |
| Show Calendar | `Cmd+Shift+C` / `Ctrl+Shift+C` | Open calendar view |
| Show Graph | `Cmd+Shift+G` / `Ctrl+Shift+G` | Open graph view |
| Refresh | `Cmd+Shift+R` / `Ctrl+Shift+R` | Refresh notes view |

#### Editing

| Command | Suggested Shortcut | Description |
|---------|-------------------|-------------|
| Extract Selection to Note | `Cmd+K Cmd+E` / `Ctrl+K Ctrl+E` | Create note from selection |
| Rename Symbol | `Cmd+K Cmd+R` / `Ctrl+K Ctrl+R` | Refactor links |
| Toggle Markdown Preview | `Cmd+K Cmd+V` / `Ctrl+K Ctrl+V` | Preview markdown |

#### Undo/Redo

| Command | Suggested Shortcut | Description |
|---------|-------------------|-------------|
| Undo | `Cmd+Alt+Z` / `Ctrl+Alt+Z` | Undo last operation |
| Redo | `Cmd+Shift+Alt+Z` / `Ctrl+Shift+Alt+Z` | Redo operation |
| Show Undo History | `Cmd+K Cmd+H` / `Ctrl+K Ctrl+H` | View undo history |

## VS Code Built-in Shortcuts

These VS Code shortcuts are useful for Noted:

### Navigation

| Shortcut | Description |
|----------|-------------|
| `Cmd+P` / `Ctrl+P` | Quick Open - open any file |
| `Cmd+Shift+E` / `Ctrl+Shift+E` | Toggle Explorer sidebar |
| `Cmd+B` / `Ctrl+B` | Toggle sidebar visibility |
| `Cmd+\` / `Ctrl+\` | Split editor |

### Editing

| Shortcut | Description |
|----------|-------------|
| `Cmd+S` / `Ctrl+S` | Save file |
| `Cmd+W` / `Ctrl+W` | Close editor |
| `Cmd+K Cmd+W` / `Ctrl+K Ctrl+W` | Close all editors |
| `Cmd+Shift+P` / `Ctrl+Shift+P` | Command Palette |

### Search

| Shortcut | Description |
|----------|-------------|
| `Cmd+F` / `Ctrl+F` | Find in file |
| `Cmd+H` / `Ctrl+H` | Replace in file |
| `Cmd+Shift+F` / `Ctrl+Shift+F` | Search in workspace |

## Custom Keybinding Examples

### Example 1: Template Quick Access

Create shortcuts for frequently used templates:

```json
[
  {
    "key": "cmd+shift+m",
    "command": "noted.openWithTemplate",
    "args": ["meeting"]
  },
  {
    "key": "cmd+shift+b",
    "command": "noted.openWithTemplate",
    "args": ["problem-solution"]
  }
]
```

Add this in **keybindings.json**:
1. Open Command Palette
2. Run "Preferences: Open Keyboard Shortcuts (JSON)"
3. Add above JSON

### Example 2: Tag Filtering

Quick access to specific tag filters:

```json
[
  {
    "key": "cmd+1",
    "command": "noted.filterByTag",
    "args": ["todo"]
  },
  {
    "key": "cmd+2",
    "command": "noted.filterByTag",
    "args": ["urgent"]
  }
]
```

## Workflow Shortcuts

### Morning Routine

1. `Cmd+Shift+N` - Open today's note
2. `Cmd+K Cmd+N` - Create note from template
3. `Cmd+Shift+T` - Add timestamp

### Quick Navigation

1. `Cmd+Shift+P` - Open recent note
2. `Cmd+Shift+F` - Search for specific term
3. `Cmd+Shift+C` - Check calendar for date

### Organization Session

1. `Cmd+Shift+R` - Refresh view
2. `Cmd+K Cmd+F` - Filter by tag
3. `Cmd+Shift+G` - Review graph

## Tips for Effective Shortcuts

### Choose Memorable Combinations

- **Related keys:** `Cmd+Shift+N` for **N**ote
- **Mnemonic:** `Cmd+Shift+T` for **T**imestamp
- **Sequential:** `Cmd+1`, `Cmd+2` for different tags

### Avoid Conflicts

- Check existing VS Code shortcuts
- Test shortcuts before committing
- Use `Cmd+K` / `Ctrl+K` prefix for custom shortcuts

### Start Small

- Add shortcuts for most-used commands first
- Build muscle memory gradually
- Expand as needed

### Document Your Shortcuts

Keep a reference note:

```
# My Noted Shortcuts

## Daily
- Cmd+Shift+N: Open today
- Cmd+Shift+T: Timestamp

## Search
- Cmd+Shift+F: Search notes
- Cmd+K Cmd+F: Filter tags

## Templates
- Cmd+Shift+M: Meeting template
- Cmd+Shift+B: Bug template
```

## Platform Differences

### Mac vs Windows/Linux

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Modifier | `Cmd` | `Ctrl` |
| Secondary | `Option` | `Alt` |
| Open Settings | `Cmd+,` | `Ctrl+,` |
| Command Palette | `Cmd+Shift+P` | `Ctrl+Shift+P` |

### Adjusting for Your Platform

When setting up shortcuts:
- Mac users: Use `Cmd` as primary modifier
- Windows/Linux: Use `Ctrl` as primary modifier
- Consider cross-platform teams: document platform-specific shortcuts

## Advanced Keybinding Configuration

### When Clauses

Restrict shortcuts to specific contexts:

```json
{
  "key": "cmd+enter",
  "command": "noted.openToday",
  "when": "sideBarVisible && activeViewlet == 'workbench.view.extension.notedExplorer'"
}
```

### Multiple Commands

Execute multiple commands with one shortcut using extensions like "multi-command"

## Discovering Commands

### View All Noted Commands

1. Open Command Palette (`Cmd+Shift+P`)
2. Type **"Noted:"**
3. Browse all available commands
4. Right-click command to add shortcut

### Command IDs

All Noted commands start with `noted.`:
- `noted.openToday`
- `noted.insertTimestamp`
- `noted.searchNotes`
- `noted.filterByTag`
- etc.

Find full list in Command Palette or package.json

---

[← Back to User Guide]({{ '/user/' | relative_url }}) | [Next: Tips & Tricks →]({{ '/user/tips-tricks' | relative_url }})
