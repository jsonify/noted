---
title: Bulk Operations
date: 2025-10-24 06:00:00 -0800
categories: [Features, Productivity]
tags: [bulk, multi-select, operations, productivity]
---

# Bulk Operations

Select multiple notes at once for batch operations: move, delete, or archive many notes in a single action. Powerful multi-select capabilities for efficient note management.

## Quick Start

```
1. Click "Toggle Select Mode" in Notes toolbar
2. Click notes to select them (checkmarks appear)
3. Choose bulk action: Delete, Move, or Archive
4. Confirm the operation
```

## Select Mode

### Entering Select Mode

**From Toolbar:**
```
Click: Toggle Select Mode button in Notes View
```

**From Command Palette:**
```
Command: Noted: Toggle Select Mode
```

**What Changes:**
- Select mode becomes active
- Bulk operation buttons appear
- Notes show selection checkboxes
- Click notes to select/deselect

### Exiting Select Mode

**From Toolbar:**
```
Click: Toggle Select Mode (toggles off)
```

**From Command:**
```
Command: Noted: Clear Selection
Choose: "Yes, exit select mode"
```

## Selecting Notes

### Individual Selection

Click any note to select it:

```
My Notes
  └── 2024/
      └── 10-October/
          ├── ✓ 2024-10-01.md  ← Selected
          ├── ✓ 2024-10-02.md  ← Selected
          └──   2024-10-03.md  ← Not selected
```

**Visual Indicators:**
- ✓ Checkmark icon when selected
- Different styling/color
- Context value changes to 'note-selected'

### Select All

```
Command: Noted: Select All Notes
```

Selects all visible notes in the tree.

### Clear Selection

```
Command: Noted: Clear Selection
```

Deselects all notes without exiting select mode.

**Or:**

Click "Clear Selection" button in toolbar.

## Bulk Operations

### Bulk Delete

Delete multiple notes at once:

```
1. Select notes
2. Click "Bulk Delete" button
3. Review confirmation dialog
4. Confirm deletion
```

**Confirmation Dialog:**
```
Delete 5 selected notes?

Files to delete:
- 2024-10-01.md
- 2024-10-02.md
- 2024-10-03.md
- meeting-notes.md
- bug-fix-123.md

[Cancel] [Delete]
```

**Features:**
- Shows up to 10 notes in preview
- If more than 10: "... and N more files"
- Can be undone with Undo command

### Bulk Move

Move multiple notes to a folder:

```
1. Select notes
2. Click "Bulk Move" button
3. Choose destination folder
4. Confirm move
```

**Folder Picker:**
```
Choose destination folder:
├── 2024/
│   ├── 10-October/
│   └── 11-November/  ← Select this
├── Projects/
│   └── Alpha/
└── Archive/
```

**Confirmation:**
```
Move 3 notes to "2024/11-November"?

Files to move:
- 2024-10-01.md
- 2024-10-02.md
- meeting-notes.md

[Cancel] [Move]
```

**Features:**
- Pick any valid folder
- Can't move to year folders (protected)
- Can be undone
- Updates all links automatically

### Bulk Archive

Archive multiple notes at once:

```
1. Select notes
2. Click "Bulk Archive" button
3. Confirm archive
```

**Confirmation:**
```
Archive 4 selected notes?

Files to archive:
- old-meeting.md
- completed-task.md
- 2024-01-15.md
- project-notes.md

[Cancel] [Archive]
```

**Features:**
- Moves notes to `.archive/` folder
- Preserves folder structure
- Can be undone
- Removed from main Notes view

## Selection Management

### Selection Count

When notes are selected, see count in UI:

```
My Notes (3 selected)
```

Status bar also shows:
```
3 notes selected
```

### Selection State

The extension tracks:
- Which notes are selected (Set<string>)
- Select mode active/inactive
- Selection count

**Context Variables:**
- `noted.selectModeActive`: true/false
- `noted.hasSelectedNotes`: true/false

These control UI element visibility.

## Use Cases

### Cleaning Up Old Notes

Archive last month's daily notes:

```
1. Enter select mode
2. Navigate to last month
3. Select all daily notes
4. Bulk archive
```

Fast cleanup!

### Reorganizing Projects

Move project notes to new folder:

```
1. Select all project-alpha notes
2. Bulk move to "Projects/Alpha" folder
3. Keeps workspace organized
```

### Deleting Test Notes

Remove experimental notes:

```
1. Search for tag:#test
2. Enter select mode
3. Select all test notes
4. Bulk delete
```

### Batch Processing

Move notes by tag:

```
1. Filter by tag:#completed
2. Enter select mode
3. Select all
4. Bulk archive
```

## Safety Features

### Confirmation Dialogs

All bulk operations show confirmation:
- **Bulk Delete**: Shows files to be deleted
- **Bulk Move**: Shows destination and files
- **Bulk Archive**: Shows files to be archived

**Up to 10 files listed**, then "... and N more"

### Undo Support

All bulk operations can be undone:

```
Command: Noted: Undo
```

Restores:
- Deleted files (with content)
- Moved files (to original location)
- Archived files (from archive)

### No Accidental Actions

Bulk buttons only appear when:
- Select mode is active
- Notes are selected

Can't accidentally trigger bulk operations.

## Best Practices

1. **Review Before Confirming**: Always check the preview list
2. **Use Select All Carefully**: Make sure you want all visible notes
3. **Filter First**: Use tags/search to narrow selection
4. **Undo Insurance**: Remember you can undo if needed
5. **Exit Select Mode**: Exit when done to avoid accidental selections

## Tips & Tricks

### Combine with Search

Powerful workflow:

```
1. Search: tag:old from:2024-01-01 to:2024-06-30
2. Enter select mode
3. Select all results
4. Bulk archive
```

### Combine with Tag Filter

Filter then select:

```
1. Filter by tag:#completed
2. Enter select mode
3. Select all
4. Bulk archive or delete
```

### Selective Operations

Don't have to select all:

```
1. Enter select mode
2. Navigate folders
3. Select only specific notes
4. Bulk move just those
```

### Quick Archive Workflow

End of sprint cleanup:

```
1. Navigate to sprint folder
2. Select completed items
3. Bulk archive
4. Clear selection
5. Exit select mode
```

### Keyboard-Free Selection

Use only mouse/trackpad:
- Click to enter select mode
- Click notes to select
- Click bulk operation button
- Confirm in dialog

Completely GUI-driven!

## Keyboard Shortcuts

While there are no default shortcuts for bulk operations, you can assign custom shortcuts in VS Code:

```
File > Preferences > Keyboard Shortcuts

Search for:
- "Noted: Toggle Select Mode"
- "Noted: Select All Notes"
- "Noted: Clear Selection"
- "Noted: Bulk Delete"
- "Noted: Bulk Move"
- "Noted: Bulk Archive"
```

Assign shortcuts like:
- `Cmd+Shift+A`: Select All
- `Cmd+Shift+D`: Clear Selection

## Visual Feedback

### Selected Notes

```
✓ note-1.md     ← Checkmark icon
✓ note-2.md
  note-3.md     ← No checkmark
```

### Toolbar Changes

When select mode active:
```
[Toggle Select Mode ✓]  ← Active indicator
[Select All]
[Clear Selection]

When notes selected:
[Bulk Delete]
[Bulk Move]
[Bulk Archive]
```

### Status Updates

After operations:
```
✓ Successfully deleted 5 notes
✓ Successfully moved 3 notes
✓ Successfully archived 8 notes
```

## Troubleshooting

### Can't Select Notes

Ensure:
- Select mode is active (toggle button pressed)
- Clicking on actual note items (not folders)
- Notes are not protected system items

### Bulk Buttons Not Showing

Check:
- Select mode is active
- At least one note is selected
- Not in a filtered view that's empty

### Selection Not Clearing

Try:
- Click "Clear Selection" button
- Run "Noted: Clear Selection" command
- Toggle select mode off and on

### Undo Not Working

Verify:
- Operation was completed (not canceled)
- Haven't exceeded undo history limit
- Run "Noted: Show Undo History" to see available operations

## Related Features

- [Undo/Redo](/noted/posts/undo-redo/) - Undo bulk operations
- [Archive](/noted/posts/archive/) - Bulk archive notes
- [Search](/noted/posts/search/) - Find notes to bulk process
- [Tags](/noted/posts/tags/) - Filter for bulk operations

---

Manage notes efficiently with bulk operations! ⚡
