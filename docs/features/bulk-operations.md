---
layout: default
title: Bulk Operations
parent: Features
nav_order: 10
---

# Bulk Operations

Multi-select notes for batch operations: move, delete, or archive multiple notes at once.

## Overview

Bulk Operations allow you to select multiple notes and perform actions on them all at once. This is perfect for organizing your workspace, cleaning up old notes, or moving groups of related notes to a new location.

## Select Mode

### Entering Select Mode

Enable multi-select mode to start selecting notes:

- **Command Palette**: `Noted: Toggle Select Mode`
- **Sidebar Toolbar**: Click the "Toggle Select Mode" button in the My Notes toolbar
- **Keyboard Shortcut**: Assign a custom shortcut in VS Code settings

When Select Mode is active:

- The toolbar button appears highlighted/active
- Notes become selectable via click
- Context menus show selection options

### Exiting Select Mode

Exit Select Mode when you're done:

- Click the "Toggle Select Mode" button again
- Run the `Toggle Select Mode` command
- Or use `Clear Selection` command which optionally exits select mode

## Selecting Notes

### Single Note Selection

While in Select Mode:

1. Click any note to select it
2. A **checkmark icon** appears next to selected notes
3. Click again to deselect the note

### Multi-Select

Select multiple notes one by one:

1. Enter Select Mode
2. Click the first note (checkmark appears)
3. Click additional notes (each gets a checkmark)
4. Continue selecting as many notes as needed

### Select All

Select all visible notes at once:

- **Command**: `Noted: Select All Notes`
- **Toolbar Button**: "Select All" button appears when in Select Mode
- Selects all notes currently visible in the tree view

### Clear Selection

Deselect all notes:

- **Command**: `Noted: Clear Selection`
- **Toolbar Button**: "Clear Selection" button appears when notes are selected
- Removes checkmarks from all selected notes

### Visual Feedback

Selected notes show clear visual indicators:

- **Checkmark icon** (✓) instead of the normal note icon
- Context value changes to show selection state
- Selection count displayed in the UI

## Bulk Operations

Once you have notes selected, three bulk operations are available:

### Bulk Delete

Delete all selected notes at once:

- **Command**: `Noted: Bulk Delete`
- **Toolbar Button**: "Bulk Delete" button appears when notes are selected
- **Safety**: Confirmation dialog shows all notes to be deleted (up to 10 listed)

**Confirmation Dialog**:
```
Delete 15 selected notes?

The following notes will be deleted:
- 2025-10-20.md
- 2025-10-19.md
- meeting-notes.md
- project-planning.md
- bug-investigation.md
... and 10 more notes

This action can be undone.
```

### Bulk Move

Move all selected notes to a folder:

- **Command**: `Noted: Bulk Move`
- **Toolbar Button**: "Bulk Move" button appears when notes are selected
- **Process**:
  1. Folder picker appears showing all available folders
  2. Select destination folder (month folder or custom folder)
  3. Confirmation dialog shows notes and destination (up to 10 listed)
  4. Notes are moved to the selected folder

**Confirmation Dialog**:
```
Move 8 selected notes to "2025/09-September"?

The following notes will be moved:
- daily-standup.md
- retrospective.md
- sprint-planning.md
- bug-fixes.md
... and 4 more notes

This action can be undone.
```

### Bulk Archive

Archive all selected notes:

- **Command**: `Noted: Bulk Archive`
- **Toolbar Button**: "Bulk Archive" button appears when notes are selected
- **Process**: Confirmation dialog shows notes to be archived (up to 10 listed)
- **Result**: Notes moved to the `.archive` folder

**Confirmation Dialog**:
```
Archive 12 selected notes?

The following notes will be archived:
- 2024-05-15.md
- 2024-05-16.md
- old-meeting-notes.md
- completed-project.md
... and 8 more notes

This action can be undone.
```

## Context-Aware UI

The toolbar adapts based on your selection state:

### When Select Mode is OFF

Toolbar shows:
- Open Today's Note
- Create Folder
- Search Notes
- Quick Switcher
- Refresh
- Calendar View
- Graph View
- **Toggle Select Mode** button

### When Select Mode is ON (no notes selected)

Toolbar adds:
- **Select All** button

### When Select Mode is ON (notes selected)

Toolbar shows:
- **Bulk Delete** button
- **Bulk Move** button
- **Bulk Archive** button
- **Clear Selection** button
- Selection count indicator

## Safety Features

All bulk operations include safety measures:

### Confirmation Dialogs

Every destructive operation shows a confirmation dialog:

- **Preview**: Shows up to 10 notes that will be affected
- **Count**: Displays total count of selected notes
- **Action description**: Clear explanation of what will happen
- **Undo notice**: Reminds you that actions can be undone

### Undo Support

All bulk operations are fully undoable:

- Use `Cmd+Alt+Z` to undo the last bulk operation
- Or use `Noted: Undo Last Operation` command
- See [Undo/Redo]({{ '/features/undo-redo' | relative_url }}) for details

### Non-Destructive Options

For safety, consider these alternatives:

- **Archive** instead of delete for old notes
- **Move** to organize rather than remove
- Use **Search** to verify your selection before acting

## Typical Workflows

### Weekly Cleanup

Clean up old daily notes:

1. Open the My Notes view
2. Enter Select Mode
3. Navigate to last month's folder
4. Select daily notes you want to archive
5. Bulk Archive selected notes
6. Exit Select Mode

### Project Organization

Move project-related notes to a custom folder:

1. Create a custom folder for the project (if not exists)
2. Enter Select Mode
3. Navigate through month folders
4. Select all notes related to the project
5. Bulk Move to the project folder
6. Exit Select Mode

### Sprint Cleanup

Archive completed sprint notes:

1. Enter Select Mode
2. Select all notes tagged with the completed sprint
3. Bulk Archive them
4. Clear selection and exit Select Mode

### Monthly Review

Delete or archive old notes in bulk:

1. Open Calendar View to identify old periods
2. Return to tree view and enter Select Mode
3. Navigate to old month folders
4. Select all notes from that period
5. Choose Bulk Archive or Bulk Delete
6. Confirm and exit Select Mode

## Tips & Best Practices

### Selection Strategy

**Do**:
- Select notes methodically (by folder, by date range, by project)
- Use "Select All" only when all visible notes should be affected
- Verify your selection before running bulk operations
- Use Clear Selection to start over if you make mistakes

**Don't**:
- Don't bulk delete without reviewing what's selected
- Don't forget to exit Select Mode when done
- Don't select across different contexts (keep selections focused)

### Using with Search

Combine search with bulk operations:

1. Search for specific notes (`tag:old` or `from:2024-01-01 to:2024-12-31`)
2. Review results
3. Enter Select Mode in the tree view
4. Manually select the notes you want to affect
5. Perform bulk operation

**Note**: Search results aren't directly selectable—use search to identify, then select in tree view.

### Archive vs. Delete

**Archive when**:
- Notes might be needed later
- You're unsure if they're still valuable
- They're completed work but reference material

**Delete when**:
- Notes are duplicates
- Content is no longer relevant
- You're certain they won't be needed

### Organizing Large Workspaces

For large note collections:

1. **Phase 1**: Archive old notes by year using bulk operations
2. **Phase 2**: Review archived notes and bulk delete true junk
3. **Phase 3**: Organize remaining notes into custom folders
4. Use bulk move to relocate notes by project/topic

## Integration with Other Features

### Undo/Redo System

Every bulk operation is tracked:

- Full undo support for all operations
- Undo restores notes with original content and locations
- View undo history to see all past bulk operations
- See [Undo/Redo]({{ '/features/undo-redo' | relative_url }})

### Archive Feature

Bulk Archive integrates with the Archive system:

- Archived notes appear in the Archive section
- Can be unarchived individually or in bulk
- See [Archive]({{ '/features/archive' | relative_url }})

### Drag & Drop

Alternative to bulk move for smaller selections:

- Drag single or multiple notes to folders
- Useful for quick organization
- Bulk Move better for large selections (10+ notes)

### Pinned Notes

Pinned notes can be selected and bulk operated:

- Select pinned notes in the Pinned Notes section
- Perform bulk operations just like regular notes
- Moving/archiving unpins automatically

## Keyboard Shortcuts

While there are no default keyboard shortcuts for bulk operations, you can assign them:

1. Open Keyboard Shortcuts (`Cmd+K Cmd+S`)
2. Search for "Noted: Toggle Select Mode"
3. Assign your preferred shortcut
4. Repeat for Bulk Delete, Bulk Move, Bulk Archive, etc.

Recommended shortcuts:
- `Cmd+K Cmd+S`: Toggle Select Mode
- `Cmd+K Cmd+D`: Bulk Delete
- `Cmd+K Cmd+M`: Bulk Move
- `Cmd+K Cmd+A`: Bulk Archive

## Troubleshooting

### Can't select notes

**Cause**: Not in Select Mode

**Solution**: Run `Noted: Toggle Select Mode` or click the button in the toolbar

### Bulk operation buttons don't appear

**Cause**: No notes selected

**Solution**: Select at least one note in Select Mode

### Selection cleared unexpectedly

**Cause**: Exited Select Mode or used Clear Selection

**Solution**: Re-enter Select Mode and reselect notes

### Can't select notes from search results

**Limitation**: Search results aren't directly selectable

**Workaround**: Note the files in search results, navigate to them in the tree view, enter Select Mode, and select them there

### Accidentally deleted wrong notes

**Solution**: Immediately run `Noted: Undo Last Operation` or press `Cmd+Alt+Z`

## Related Features

- [Archive]({{ '/features/archive' | relative_url }}) - Where bulk archived notes go
- [Undo/Redo]({{ '/features/undo-redo' | relative_url }}) - Undo bulk operations
- [Search & Discovery]({{ '/features/search' | relative_url }}) - Find notes to select
- [Daily Notes]({{ '/features/daily-notes' | relative_url }}) - Organize daily notes in bulk

---

[← Back to Features]({{ '/features/' | relative_url }})
