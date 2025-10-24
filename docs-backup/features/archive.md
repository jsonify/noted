---
layout: default
title: Archive
parent: Features
nav_order: 12
---

# Archive

Archive old or completed notes to keep your workspace clean and organized.

## Overview

The Archive feature allows you to move notes out of your main workspace without deleting them. Archived notes are hidden from the main My Notes view but remain accessible in a dedicated Archive section. This keeps your active workspace clean while preserving notes for future reference.

## Archiving Notes

### Archive a Single Note

Move a note to the archive:

**Context Menu**:
1. Right-click any note in the tree view
2. Select "Archive Note"
3. Note moves to the `.archive` folder
4. Note appears in the Archive section

**From Any Location**:
- Archive from Recent Notes section
- Archive from month folders
- Archive from custom folders
- Archive from Pinned Notes section (automatically unpins)

### Bulk Archive

Archive multiple notes at once:

1. Enter Select Mode (`Noted: Toggle Select Mode`)
2. Select multiple notes
3. Click "Bulk Archive" button or run `Noted: Bulk Archive`
4. Confirmation dialog shows notes to be archived
5. All selected notes move to archive

See [Bulk Operations]({{ '/features/bulk-operations' | relative_url }}) for details.

### Bulk Archive by Age

Archive all notes older than a specified number of days:

1. Run `Noted: Bulk Archive Old Notes`
2. Enter the number of days (e.g., `90` for 90 days)
3. Confirmation dialog shows how many notes will be archived
4. Notes older than the threshold are moved to archive

**Example**: Bulk archive notes older than 6 months (180 days)

## Archive Storage

### .archive Folder

Archived notes are stored in a hidden folder:

```
Notes/
├── .archive/               # Hidden archive folder
│   ├── 2024-05-15.md
│   ├── old-meeting.md
│   └── completed-project.md
├── 2025/                   # Active notes
│   └── 10-October/
│       └── 2025-10-23.md
└── custom-folder/
    └── active-note.md
```

### Archive Section

The Archive section in the tree view:

- Shows all archived notes
- Located below the main notes sections
- Collapsible to save space
- Shows archive icon (📦) for each note
- Can be expanded to browse archived notes

### Hidden from Main View

Archived notes are excluded from:

- Main notes tree view
- Recent Notes section
- Search results (by default)
- Calendar View (only shows active notes)
- Graph View (unless explicitly included)

This keeps your workspace focused on active work.

## Unarchiving Notes

### Restore a Note

Move a note back to active status:

1. Navigate to the Archive section
2. Expand to see archived notes
3. Right-click the note you want to restore
4. Select "Unarchive Note"
5. Note moves back to its original location (or current month if original location doesn't exist)

**Note**: Unarchiving restores the note to the active workspace but doesn't automatically restore it to its original folder if that folder was deleted.

### Bulk Unarchive

Restore multiple notes at once:

1. Enter Select Mode
2. Navigate to Archive section
3. Select multiple archived notes
4. Use Bulk Move to move them back to active folders

## Visual Indicators

Archived notes have distinctive markers:

- **Archive icon** (📦) appears next to note name
- Only visible in the Archive section
- Archive section header shows archive icon
- Section is collapsible to hide when not needed

## Typical Use Cases

### Completed Projects

Archive project notes when done:

1. Project completes
2. Select all project-related notes
3. Bulk Archive them
4. Workspace is cleaner, but notes preserved for reference

### Old Daily Notes

Archive old daily notes periodically:

**Monthly cleanup**:
1. At end of month, review last month's notes
2. Archive daily notes you don't need to reference
3. Keep important notes in main view

**Bulk cleanup**:
1. Run Bulk Archive Old Notes
2. Set threshold (e.g., 180 days for 6 months)
3. All older daily notes move to archive

### Seasonal Work

Archive notes from past seasons or quarters:

- Archive Q1 notes at start of Q2
- Archive summer project notes in fall
- Archive last year's notes annually

### Completed Meetings

Archive old meeting notes:

1. Filter notes by `#meeting` tag
2. Review and identify old meetings
3. Archive completed or outdated meeting notes
4. Recent meetings stay in main view

## Best Practices

### When to Archive

**Archive notes that are**:
- Completed work
- Old daily notes (> 3-6 months)
- Historical reference only
- Low chance of being needed
- Cluttering your workspace

**Keep notes that are**:
- Active projects
- Frequently referenced
- Recent work (< 3 months)
- Important reference material

### Archive vs. Delete

**Archive when**:
- Might need reference later
- Uncertain about future value
- Completed work that documents decisions
- Historical context that might be useful

**Delete when**:
- Definitely won't be needed
- Duplicate content exists elsewhere
- Incorrect or obsolete information
- Test notes or junk

### Organizing Archive

The archive folder mirrors your main structure:

- Archived notes keep their file names
- No additional organization needed
- Use search to find archived notes if needed
- Periodically review archive to delete truly unnecessary notes

### Regular Maintenance

**Weekly**:
- Archive completed work from the past week

**Monthly**:
- Review last month's daily notes and archive as needed
- Archive completed project notes

**Quarterly**:
- Bulk archive notes older than 90 days
- Review archive folder and delete unnecessary notes

**Annually**:
- Review previous year's archive
- Delete notes that are no longer relevant

## Integration with Other Features

### Undo Support

All archive operations can be undone:

- Use `Cmd+Alt+Z` to undo archive operation
- Or run `Noted: Undo Last Operation`
- Note is restored to its original location
- See [Undo/Redo]({{ '/features/undo-redo' | relative_url }})

### Bulk Operations

Archive works seamlessly with bulk operations:

- Bulk Archive multiple notes
- Bulk Move to restore archived notes
- Bulk Delete archived notes (permanent removal)
- See [Bulk Operations]({{ '/features/bulk-operations' | relative_url }})

### Pinned Notes

Archiving a pinned note automatically unpins it:

- Archive removes pin
- Note moves to archive
- Unarchiving doesn't restore pin (must re-pin manually)

### Search

Search can include or exclude archived notes:

- Default: Archived notes excluded from search
- Use file path patterns to search archive folder specifically
- Or navigate to Archive section and browse manually

## Safety Features

### Confirmation Dialogs

Archive operations show confirmations:

**Single archive**: Simple confirmation
**Bulk archive**: Shows preview of notes to be archived (up to 10 listed)
**Bulk archive by age**: Shows count and age threshold

### Non-Destructive

Archiving is completely reversible:

- Notes are moved, not deleted
- Full content preserved
- Can be unarchived at any time
- Can be undone immediately after archiving

### Auto-Cleanup

System maintains archive integrity:

- Deleted notes removed from archive section
- File system and tree view stay in sync

## Shortcuts and Commands

### Archive Commands

- `Noted: Archive Note` - Archive selected note
- `Noted: Bulk Archive` - Archive all selected notes
- `Noted: Bulk Archive Old Notes` - Archive notes older than X days
- `Noted: Unarchive Note` - Restore archived note

### Keyboard Shortcuts

No default shortcuts, but you can assign:

1. Open Keyboard Shortcuts (`Cmd+K Cmd+S`)
2. Search for "Noted: Archive"
3. Assign preferred shortcuts

Recommended:
- `Cmd+K Cmd+A`: Archive Note
- `Cmd+K Cmd+U`: Unarchive Note

## Troubleshooting

### Can't find Archive section

**Cause**: No notes archived yet

**Solution**: Archive a note and the section will appear

### Archive note command not available

**Cause**: Right-clicking a folder or section, not a note

**Solution**: Right-click an individual note file

### Archived note doesn't appear in Archive section

**Cause**: Tree view needs refresh

**Solution**: Click the Refresh button in the toolbar or run `Noted: Refresh`

### Can't unarchive note

**Cause**: Not in Archive section or right-clicking wrong item

**Solution**:
1. Navigate to Archive section
2. Expand it
3. Right-click the specific note
4. Select "Unarchive Note"

### Bulk Archive by age archived too many notes

**Solution**: Immediately run `Noted: Undo Last Operation` to restore all notes

### Want to permanently delete archived notes

**Solution**:
1. Navigate to Archive section
2. Right-click individual notes and select "Delete Note"
3. Or use Bulk Delete in Select Mode
4. Deletion is permanent and cannot be undone (unless using system file recovery)

## Tips & Tricks

### Gradual Archiving

Use a two-step cleanup process:

1. **Week 1**: Archive uncertain notes
2. **Week 2**: Review archive
3. **Week 3**: Delete notes from archive that you didn't need

This reduces risk of losing important notes.

### Archive as Inbox

Use archive as a "someday/maybe" storage:

- Archive notes you might need later
- Periodically review archive
- Promote useful notes back to main workspace
- Delete notes that are no longer relevant

### Create Archive Reference Note

Create a note that catalogs your archive:

```markdown
# Archive Index

## Q4 2024 Projects
- [[old-project-1]] - Completed Dec 2024
- [[old-project-2]] - Completed Nov 2024

## Old Meeting Notes
- [[standup-archive]] - Daily standups from Q3 2024
```

Pin this index note for easy archive navigation.

### Seasonal Review

Set calendar reminders:

- End of each quarter: Review and archive
- End of year: Review archive and delete unnecessary notes
- Spring cleaning: Deep archive review

## Related Features

- [Bulk Operations]({{ '/features/bulk-operations' | relative_url }}) - Archive multiple notes at once
- [Undo/Redo]({{ '/features/undo-redo' | relative_url }}) - Undo archive operations
- [Pinned Notes]({{ '/features/pinned-notes' | relative_url }}) - Opposite of archiving (quick access)
- [Search & Discovery]({{ '/features/search' | relative_url }}) - Find notes before archiving

---

[← Back to Features]({{ '/features/' | relative_url }})
