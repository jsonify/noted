---
title: Keyboard Shortcuts & Navigation
date: 2025-10-31 12:00:00 -0800
categories: [Features, Productivity]
tags: [keyboard, shortcuts, navigation, delete]
---

# Keyboard Shortcuts & Navigation

Boost your productivity with built-in keyboard shortcuts and efficient navigation patterns in Noted.

## Quick Delete (v1.34.0)

Delete notes without reaching for your mouse using two convenient methods:

### Method 1: Tree View Navigation

**Best for**: Quickly browsing and cleaning up multiple notes

1. Navigate to any Noted panel (My Notes, Journal, Inbox, etc.)
2. Use **arrow keys** (↑↓) to select a note
3. Press **Delete** or **Backspace**
4. Confirm deletion in the dialog

**Keyboard Shortcuts**:
- `Delete` - Delete selected note
- `Backspace` - Delete selected note

> **Tip**: Focus stays in the tree view, so you can quickly delete multiple notes by using arrow keys and Delete repeatedly!
{: .prompt-tip }

### Method 2: Editor-Focused Delete

**Best for**: Deleting the note you're currently working on

1. Open any note from your notes folder
2. Press **Cmd+Shift+Delete** (Mac) or **Ctrl+Shift+Delete** (Windows/Linux)
3. Confirm deletion in the dialog
4. The note is closed and deleted

**Keyboard Shortcuts**:
- `Cmd+Shift+Delete` (Mac) - Delete currently open note
- `Ctrl+Shift+Delete` (Windows/Linux) - Delete currently open note
- `Cmd+Shift+Backspace` (Mac) - Alternative shortcut
- `Ctrl+Shift+Backspace` (Windows/Linux) - Alternative shortcut

> **Safety**: Only works on notes within your notes folder, not on regular files!
{: .prompt-warning }

## Focus Preservation (v1.34.0)

Noted panels now behave like VS Code's built-in file explorer:

### How It Works

When you **click a note** in any panel:
1. ✅ Note opens in the editor (preview mode)
2. ✅ **Focus stays in the panel** (not the editor)
3. ✅ Selection remains highlighted
4. ✅ You can continue using arrow keys immediately

### Benefits

**Efficient browsing**:
```
Click note → Preview opens → Press ↓ → Next note → Press ↓ → Next note
```

**Quick cleanup**:
```
Click note → Press Delete → Confirm → Press ↓ → Press Delete → Confirm
```

**No clicking back**: The panel keeps focus, so you never need to click back into the panel to continue navigating.

## Navigation Workflows

### Quick Note Review

Browse through notes efficiently:

1. Click any note to start
2. Use `↓` to move to next note
3. Use `↑` to move to previous note
4. Notes preview automatically as you navigate

### Rapid Cleanup

Delete multiple unwanted notes:

1. Navigate to the section (e.g., Inbox)
2. Use arrow keys to select first note to delete
3. Press `Delete`, confirm
4. Press `↓` to next note
5. Press `Delete`, confirm
6. Repeat as needed

### Review and Organize

Quickly browse and organize:

1. Navigate with arrow keys
2. Preview each note automatically
3. Drag notes to other folders (or use Move command)
4. Delete unwanted notes with `Delete` key

## All Built-in Shortcuts

### Note Creation
- `Cmd+Shift+N` (Mac) / `Ctrl+Shift+N` (Windows) - Open today's note
- `Cmd+K Cmd+N` - Create note with template

### Navigation
- `Cmd+Shift+C` - Open calendar view
- `Cmd+Shift+G` - Open graph view
- `Arrow Keys` (↑↓) - Navigate between notes in panels

### Editing
- `Cmd+Shift+T` - Insert timestamp

### Search
- `Cmd+Shift+F` - Advanced search notes
- `Cmd+Shift+P` - Quick switcher (recent notes)

### Management
- `Delete` / `Backspace` - Delete selected note (tree view)
- `Cmd+Shift+Delete` - Delete current note (editor)
- `Cmd+Shift+S` - Show note statistics

### Undo/Redo
- `Cmd+Alt+Z` (Mac) / `Ctrl+Alt+Z` (Windows) - Undo last operation
- `Cmd+Shift+Alt+Z` (Mac) / `Ctrl+Shift+Alt+Z` (Windows) - Redo

## Tips & Tricks

### Tip 1: Arrow Key Power User

Keep your hands on the keyboard:
1. Use `Cmd+Shift+P` to open command palette
2. Type "Noted" to see all commands
3. Navigate any Noted panel with arrow keys
4. Delete, move, or manage notes without the mouse

### Tip 2: Safe Deletion

Both delete methods include safety features:
- ✅ Confirmation dialog before deleting
- ✅ Undo support (Cmd/Ctrl+Alt+Z)
- ✅ Only works on notes in your notes folder
- ✅ Clear feedback messages

### Tip 3: Combine with Search

Efficient cleanup workflow:
1. Use `Cmd+Shift+F` to search for old notes
2. Review results in the tree view
3. Navigate with arrow keys
4. Delete unwanted notes with `Delete` key

### Tip 4: Preview Mode

When you navigate with arrow keys:
- Notes open in **preview mode** (italicized tab name)
- Only one preview tab is used
- Edit any note to convert preview to permanent tab
- Keeps your editor clean while browsing

## Platform Differences

### macOS
- `Cmd` key for all shortcuts
- `Cmd+Shift+Delete` to delete current note

### Windows/Linux
- `Ctrl` key for most shortcuts
- `Ctrl+Shift+Delete` to delete current note

All shortcuts respect your custom VS Code keybindings and can be remapped in:
**File > Preferences > Keyboard Shortcuts** (or `Cmd+K Cmd+S`)

## Related Features

- [Getting Started](/noted/posts/getting-started/) - Set up keyboard shortcuts
- [Bulk Operations](/noted/posts/bulk-operations/) - Multi-select and delete
- [Undo/Redo](/noted/posts/undo-redo/) - Recover deleted notes

---

Master these keyboard shortcuts and you'll never need to reach for your mouse! ⌨️
