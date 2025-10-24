---
layout: default
title: Undo/Redo System
parent: Features
nav_order: 13
---

# Undo/Redo System

Full undo/redo support for all destructive operations with complete history tracking.

## Overview

The Undo/Redo system provides safety and confidence when working with your notes. Every destructive operation—delete, rename, move, archive, and bulk operations—is tracked and can be undone or redone with full restoration of content and locations.

## Supported Operations

The following operations can be undone and redone:

### Single File Operations

- **Delete**: Restore deleted notes with original content
- **Rename**: Revert to original name
- **Move**: Return note to original folder
- **Archive**: Restore from archive to original location

### Bulk Operations

- **Bulk Delete**: Restore all deleted notes
- **Bulk Move**: Return all notes to original folders
- **Bulk Archive**: Restore all notes from archive

### Automatic Tracking

Every supported operation is automatically tracked:

- No manual save required
- Operations captured in real-time
- History persists across VS Code sessions
- No limits on history size

## Undo Operations

### Undo Last Operation

Reverse the most recent operation:

- **Command**: `Noted: Undo Last Operation`
- **Keyboard Shortcut**: `Cmd+Alt+Z` (Mac) or `Ctrl+Alt+Z` (Windows/Linux)
- **Effect**: Immediately reverses the last operation

### What Happens During Undo

When you undo an operation:

1. **File restoration**: Original file content is restored exactly as it was
2. **Location restoration**: File returns to its original folder
3. **Metadata preservation**: All note properties preserved (tags, links, etc.)
4. **History update**: Operation moves to redo stack
5. **Notification**: Success message confirms what was undone

### Undo Examples

**Undo Delete**:
```
Deleted: project-notes.md
Undo → Restores project-notes.md to Notes/2025/10-October/
```

**Undo Bulk Move**:
```
Moved: 15 notes from various folders to custom-folder
Undo → All 15 notes return to their original folders
```

**Undo Archive**:
```
Archived: meeting-notes.md
Undo → Restores meeting-notes.md from .archive to Notes/2025/10-October/
```

## Redo Operations

### Redo Last Undone Operation

Re-apply an operation you just undid:

- **Command**: `Noted: Redo Last Operation`
- **Keyboard Shortcut**: `Cmd+Shift+Alt+Z` (Mac) or `Ctrl+Shift+Alt+Z` (Windows/Linux)
- **Effect**: Re-applies the last undone operation

### What Happens During Redo

When you redo an operation:

1. **Operation replay**: The operation is performed again
2. **Same result**: Outcome is identical to original operation
3. **History update**: Operation moves back to undo stack
4. **Notification**: Success message confirms what was redone

### Redo Examples

**Redo Delete**:
```
Undid delete of: project-notes.md
Redo → Deletes project-notes.md again
```

**Redo Rename**:
```
Undid rename from old-name.md to new-name.md
Redo → Renames old-name.md to new-name.md again
```

## Undo History

### View Complete History

See all tracked operations:

- **Command**: `Noted: Show Undo History`
- **Shows**: List of all undoable operations with details

### History Details

Each history entry displays:

- **Operation type**: Delete, Rename, Move, Archive, Bulk Delete, Bulk Move, Bulk Archive
- **Affected files**: Note file names and paths
- **Timestamp**: When the operation occurred
- **Status**: Pending (can be undone) or Undone (can be redone)

### History Example

```
Undo History:

1. Bulk Archive - 2025-10-23 14:30:15
   - Archived 12 notes
   - Status: Can be undone

2. Delete - 2025-10-23 14:25:42
   - Deleted: old-notes.md
   - Status: Can be undone

3. Rename - 2025-10-23 14:20:11
   - From: draft.md
   - To: final-notes.md
   - Status: Can be undone

4. Bulk Move - 2025-10-23 14:15:33
   - Moved 8 notes to project-folder
   - Status: Undone (can be redone)
```

### Clear History

Remove all undo history:

- **Command**: `Noted: Clear Undo History`
- **Effect**: Permanently clears all undo/redo history
- **Warning**: Shows confirmation dialog (action is permanent)

**Use when**:
- History has grown very large
- You're certain you won't need to undo past operations
- Starting fresh after major cleanup

## Smart Restore

The undo system intelligently handles edge cases:

### Original Folder Missing

If the original folder no longer exists:

- **Undo recreates the folder structure**
- Note is restored to exact original location
- All parent folders created as needed

### Conflicting File Names

If a file with the same name exists at the original location:

- **Conflict prevention**: Undo detects the conflict
- **Error notification**: Alerts you to the issue
- **Manual resolution**: You'll need to rename or move the conflicting file

### Multiple Operations on Same File

If a file was affected by multiple operations:

- **Sequential undo**: Each undo reverses one operation at a time
- **Correct state**: File returns to state before each operation
- **Full restoration**: Keep undoing to reach original state

## Operation Details

### What's Stored

For each operation, the system stores:

- **Operation type**: Which command was executed
- **File paths**: Original and new locations
- **File content**: Full note content before operation
- **Metadata**: Additional context (original name, destination folder, etc.)
- **Timestamp**: When operation occurred

### Storage Location

History is stored:

- **In memory**: During current session
- **Persistent**: Saved to VS Code workspace storage
- **Workspace-specific**: Each workspace has separate history
- **Automatic**: No manual management needed

### History Limits

Currently:

- **No size limit**: All operations are tracked
- **No time limit**: History persists indefinitely
- **Manual cleanup**: Use "Clear Undo History" if needed

## Typical Workflows

### Accidental Deletion Recovery

Quick recovery from mistakes:

1. Accidentally delete a note
2. Immediately press `Cmd+Alt+Z`
3. Note is restored with original content
4. Continue working with confidence

### Experimental Cleanup

Try cleanup operations safely:

1. Select and bulk archive old notes
2. Review the Archive section
3. If you archived too much, press `Cmd+Alt+Z`
4. All notes are restored to original locations
5. Refine your selection and try again

### Rename Iterations

Iterate on note names:

1. Rename note to `draft-v1.md`
2. Not satisfied, undo (`Cmd+Alt+Z`)
3. Rename to `draft-final.md`
4. Still not right, undo again
5. Finally rename to `project-notes.md`

### Bulk Move Trials

Test organization schemes:

1. Bulk move project notes to new folder
2. Work with new organization for a day
3. Decide original was better
4. Undo to restore original structure

### Rollback Complex Changes

Undo multiple operations:

1. Perform several rename/move operations
2. Realize you made mistakes
3. View undo history to see all operations
4. Undo each operation sequentially (newest to oldest)
5. Return to clean state

## Best Practices

### Undo Immediately

For best results:

- **Undo right away** if you realize a mistake
- Don't perform many operations before undoing
- Each undo only reverses the most recent operation

### Review Before Bulk Operations

Reduce need for undo:

- **Preview** selections before bulk operations
- **Confirm** in dialogs carefully
- **Start small** with bulk operations to test
- **Undo immediately** if result isn't what you wanted

### Check Undo History Periodically

Stay aware of tracked operations:

- Review history monthly
- Clear history when confident in past operations
- Reduces storage usage

### Don't Rely Solely on Undo

Undo is a safety net, not a primary workflow:

- **Think before acting** on destructive operations
- **Use archive** instead of delete when uncertain
- **Backup** important notes outside of VS Code

## Limitations

### Operations Not Tracked

Some operations are not undoable:

- **Note content edits**: Use VS Code's built-in undo (`Cmd+Z`) for text edits
- **Folder creation/deletion**: Custom folders not tracked
- **Configuration changes**: Settings changes not tracked
- **Import/Export**: Bulk import/export not tracked

### External Changes

Changes made outside VS Code:

- **File system edits**: Not tracked by undo system
- **Manual file moves**: Cannot be undone
- **External deletions**: Not recoverable via undo

### Undo Doesn't Cascade

Undo reverses one operation at a time:

- **Sequential**: Must undo multiple operations one by one
- **No "undo all"**: Each operation undone separately
- **Order matters**: Undo works newest to oldest

## Troubleshooting

### Undo command not available

**Cause**: No operations in undo history

**Solution**: Only appears after a destructive operation has been performed

### Undo didn't restore file content

**Cause**: Operation type might not store content (rare edge case)

**Solution**: Check backup or git history if using version control

### Undo fails with error

**Cause**: File system conflict or permissions issue

**Solution**:
- Check error message for details
- Ensure original location is writable
- Manually resolve conflicts if needed

### Redo doesn't work

**Cause**: New operation cleared redo stack

**Solution**: Redo only works immediately after undo. Any new operation clears redo history.

### History shows wrong operation details

**Cause**: Rare display bug

**Solution**: View undo history to confirm details before undoing

### Can't clear undo history

**Cause**: Command palette not showing command

**Solution**: Search for "Noted: Clear Undo History" in command palette

## Integration with Other Features

### Works with Bulk Operations

Full support for bulk operations:

- Bulk Delete fully undoable
- Bulk Move fully undoable
- Bulk Archive fully undoable
- All notes restored to original locations

### Works with Archive

Archive operations are undoable:

- Undo archive restores note from `.archive` folder
- Note returns to original location
- Pin status not restored (must re-pin manually)

### Works with Move Operations

Move operations are undoable:

- Single move: Return to original folder
- Bulk move: All notes return to original folders
- Preserves folder structure

### No Integration with Text Edits

Note content editing uses VS Code's undo:

- Use `Cmd+Z` for text edits
- Use `Cmd+Alt+Z` for file operations
- Two separate undo systems

## Tips & Tricks

### Keyboard Shortcuts

Set up convenient shortcuts:

1. Open Keyboard Shortcuts (`Cmd+K Cmd+S`)
2. Search for "Noted: Undo"
3. Assign easy-to-reach shortcuts

Default shortcuts work well:
- `Cmd+Alt+Z`: Undo
- `Cmd+Shift+Alt+Z`: Redo

### Safety Net Workflow

Use undo as a safety net:

1. Make a change
2. If wrong, immediately `Cmd+Alt+Z`
3. Try again
4. Build confidence in making bold changes

### History as Audit Log

View history to understand what you've done:

- Review operations from yesterday
- See patterns in your file management
- Understand your workflow better

### Clear History After Major Changes

After completing major reorganization:

1. Confirm everything is correct
2. Clear undo history
3. Start fresh with new clean history

## Related Features

- [Bulk Operations]({{ '/features/bulk-operations' | relative_url }}) - All bulk operations support undo
- [Archive]({{ '/features/archive' | relative_url }}) - Archive operations are undoable
- [Daily Notes]({{ '/features/daily-notes' | relative_url }}) - Delete/move daily notes safely

---

[← Back to Features]({{ '/features/' | relative_url }})
