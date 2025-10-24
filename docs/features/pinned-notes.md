---
layout: default
title: Pinned Notes
parent: Features
nav_order: 11
---

# Pinned Notes

Pin frequently accessed notes for quick access at the top of your tree view.

## Overview

Pinned Notes (also called Favorites) allow you to mark important or frequently accessed notes for quick access. Pinned notes appear in a dedicated section at the top of the My Notes view, so they're always just one click away—no matter where they're stored in your folder structure.

## Pinning Notes

### Pin a Note

There are several ways to pin a note:

**Context Menu**:
1. Right-click any note in the tree view
2. Select "Pin Note"
3. Note immediately appears in the Pinned Notes section

**From Any Location**:
- Notes can be pinned from Recent Notes section
- Notes can be pinned from month folders
- Notes can be pinned from custom folders
- Notes can be pinned from Archive section

### Visual Indicators

Pinned notes have distinctive visual markers:

- **Pin icon** (📌) appears next to the note name
- **Special styling** in the tree view
- Appears in both the "Pinned Notes" section AND its original location
- "Pinned Notes" section header shows a pin icon

## Unpinning Notes

### Unpin a Note

Remove a note from pinned status:

**Context Menu**:
1. Right-click the pinned note (in Pinned Notes section or original location)
2. Select "Unpin Note"
3. Note is removed from the Pinned Notes section
4. Note remains in its original location

**Quick Access**:
- Unpinning is available from either location (Pinned Notes section or original folder)
- Both show the same context menu option

## Pinned Notes Section

### Location

The Pinned Notes section appears:

- At the top of the My Notes view
- Above the Recent Notes section
- Always visible when you have pinned notes
- Collapses when empty (no pinned notes)

### Organization

Notes in the Pinned Notes section:

- Show the note name (without full path)
- Maintain their original file format (.md or .txt)
- Are sorted by the order they were pinned (newest at bottom)
- Show the pin icon (📌) for visual distinction

### Interacting with Pinned Notes

From the Pinned Notes section, you can:

- **Click** to open the note
- **Right-click** for context menu options:
  - Unpin Note
  - Move Note to Folder
  - Delete Note
  - Rename Note
  - Duplicate Note
  - Copy Path
  - Archive Note (if unpinned first)

## Persistent Storage

Pinned state is saved across VS Code sessions:

- **Persistent**: Pinned notes remain pinned after closing VS Code
- **Cross-session**: Pinned state saved in VS Code workspace storage
- **Automatic sync**: No manual save required

### Auto-Cleanup

The system automatically maintains pin integrity:

- **Deleted notes**: Automatically removed from pinned list
- **Moved notes**: Remain pinned at new location
- **Renamed notes**: Remain pinned with new name

## Typical Use Cases

### Frequently Accessed Notes

Pin notes you open multiple times per day:

- Daily standup template
- Project planning document
- Personal todo list
- Weekly meeting notes
- Ongoing research notes

### Reference Material

Pin notes that contain information you reference often:

- API endpoint documentation
- Code snippets collection
- Team contact information
- Project guidelines
- Configuration examples

### Active Projects

Pin notes related to your current work:

- Current sprint notes
- Active bug investigation
- Feature planning document
- Architecture decisions
- Meeting action items

### Long-Term Notes

Pin evergreen notes that are always relevant:

- Personal goals and objectives
- Learning resources
- Career development notes
- Book notes and summaries
- Ideas and inspiration

## Best Practices

### How Many to Pin?

**Recommended**: 5-10 notes

- Too few: Not leveraging the feature
- Too many: Defeats the purpose of quick access
- Sweet spot: 5-10 notes you truly access frequently

### Keep Pins Current

Regularly review and update your pinned notes:

- **Weekly**: Unpin notes you haven't accessed
- **Monthly**: Review all pinned notes for relevance
- **After projects**: Unpin completed project notes

### Pin vs. Archive

**Pin notes that are**:
- Currently active
- Frequently accessed
- High priority
- Reference material

**Archive notes that are**:
- Completed work
- No longer relevant
- Infrequently accessed
- Historical reference

### Organizing Pinned Notes

Since pins appear in order they were pinned:

- Pin most important notes last (they appear at bottom, closer to Recent Notes)
- Or unpin all and re-pin in your preferred order
- Consider naming conventions to keep related pins grouped alphabetically

## Integration with Other Features

### Works with All Note Types

Pin any note regardless of:

- File format (.md or .txt)
- Location (daily notes, custom folders, archived notes)
- Creation date
- Tags or content

### Works with Move Operations

When you move a pinned note:

1. Note remains pinned
2. Pin follows the note to new location
3. Pinned Notes section still shows it
4. Original folder location updates automatically

### Works with Rename Operations

When you rename a pinned note:

1. Note remains pinned
2. New name appears in Pinned Notes section
3. No need to re-pin

### Works with Archive

You can pin archived notes:

1. Navigate to Archive section
2. Pin a note from there
3. Note appears in Pinned Notes section
4. Still accessible from Archive section

### Works with Bulk Operations

Pinned notes can be selected in bulk mode:

- Select pinned notes in Select Mode
- Perform bulk operations (move, delete, archive)
- Deleting or archiving automatically unpins

## Shortcuts and Quick Access

### Opening Pinned Notes

Fastest ways to access pinned notes:

1. **Tree View**: Click in Pinned Notes section (2 clicks: section expand + note)
2. **Quick Switcher**: `Cmd+Shift+P` → "Quick Switcher" shows pinned notes
3. **Search**: Pinned notes appear in search results normally

### Managing Pins

Quick management:

- Pin: Right-click → "Pin Note" (2 clicks)
- Unpin: Right-click pinned note → "Unpin Note" (2 clicks)
- Re-order: Unpin all, then re-pin in desired order

## Troubleshooting

### Pinned note doesn't appear in section

**Cause**: Note might have been deleted

**Solution**:
- Check if note still exists in its original folder
- Check Archive section
- If deleted, pin is automatically removed

### Can't find pin option in context menu

**Cause**: Context menu not showing for note items

**Solution**:
- Ensure you're right-clicking a note (not a folder)
- Ensure you're right-clicking in the tree view
- Try clicking the note first, then right-clicking

### Pinned notes disappeared after restart

**Cause**: Workspace storage might be corrupted

**Solution**:
- Re-pin the notes you need
- Check VS Code workspace settings for corruption
- Ensure you're in the same workspace

### Too many pinned notes, can't find what I need

**Solution**: Review and unpin less frequently accessed notes

**Best Practice**: Keep pins to 5-10 most important notes

### Pinned note still shows in folder

**Expected Behavior**: Pinned notes appear in BOTH locations:
- In the Pinned Notes section (for quick access)
- In their original folder location (for context)

This is intentional—unpinning removes it only from the Pinned Notes section.

## Tips & Tricks

### Temporary Pins

For active projects:

1. Pin project-related notes at project start
2. Use them throughout the project lifecycle
3. Unpin all at project completion
4. Keeps Pinned Notes section relevant to current work

### Weekly Rotation

Rotate pins weekly:

- Monday: Review and update pinned notes
- Unpin completed work
- Pin notes for current week's focus
- Keeps pins fresh and relevant

### Combine with Tags

Pin notes that serve as tag "indexes":

1. Create a note listing all `#project-x` tagged notes
2. Pin this index note
3. Quick access to the overview of all project notes

### Use for Onboarding

New to a project or team?

- Pin team documentation
- Pin onboarding checklists
- Pin reference materials
- Unpin as you become familiar

## Related Features

- [Daily Notes]({{ '/features/daily-notes' | relative_url }}) - Pin frequently accessed daily notes
- [Archive]({{ '/features/archive' | relative_url }}) - Complement to pinning (archive vs. pin)
- [Search & Discovery]({{ '/features/search' | relative_url }}) - Find notes to pin
- [Bulk Operations]({{ '/features/bulk-operations' | relative_url }}) - Manage pinned notes in bulk

---

[← Back to Features]({{ '/features/' | relative_url }})
