---
layout: default
title: Daily Notes
parent: Features
nav_order: 1
---

# Daily Notes

Quickly create or open today's note with automatic organization in a hierarchical year/month/day structure.

## Overview

Daily Notes is the core feature of Noted. With a single command or keyboard shortcut, you can instantly create or open today's note. Notes are automatically organized into a clean folder structure so you never have to think about file management.

## Quick Access

### Open Today's Note

The fastest way to start taking notes:

- **Command Palette**: `Noted: Open Today's Note`
- **Keyboard Shortcut**: `Cmd+Shift+N` (Mac) or `Ctrl+Shift+N` (Windows/Linux)
- **Sidebar Button**: Click the "Open Today's Note" button in the My Notes toolbar

If today's note doesn't exist, it will be created automatically. If it already exists, it opens instantly.

## Automatic Organization

Notes are automatically organized in a hierarchical structure:

```
Notes/
└── 2025/
    ├── 01-January/
    │   ├── 2025-01-15.md
    │   ├── 2025-01-16.md
    │   └── 2025-01-17.md
    ├── 02-February/
    │   ├── 2025-02-01.md
    │   ├── 2025-02-02.md
    │   └── 2025-02-03.md
    └── 10-October/
        ├── 2025-10-19.md
        ├── 2025-10-20.md
        └── 2025-10-23.md
```

### Folder Structure

- **Year folders**: `YYYY` format (e.g., `2025`)
- **Month folders**: `MM-MonthName` format (e.g., `10-October`)
- **Note files**: `YYYY-MM-DD.format` format (e.g., `2025-10-23.md`)

This structure provides several benefits:

- **Chronological organization**: Notes are naturally sorted by date
- **Easy navigation**: Browse by year, then month
- **No manual filing**: Never create folders yourself
- **Clean workspace**: Keeps your notes organized automatically

## File Formats

Daily notes support two file formats:

### Markdown (.md)

Default format, ideal for rich formatting with:

- Headings, lists, and emphasis
- Wiki-style links to other notes
- Tags for organization
- Embedded images and notes
- Markdown preview support

### Plain Text (.txt)

Simple text format for:

- Lightweight notes
- Quick capture without formatting
- Maximum compatibility
- Faster file operations

### Changing Format

Set your preferred format in VS Code settings:

1. Open Settings (`Cmd+,` or `Ctrl+,`)
2. Search for "Noted"
3. Find "File Format" setting
4. Choose "md" or "txt"

**Note**: Changing this setting only affects *new* notes. Existing notes keep their current format.

## Multiple Notes Per Day

You can create multiple notes on the same day using templates:

1. Use `Cmd+K Cmd+N` to create a new note with a template
2. Choose a template (Meeting, Research, Problem/Solution, etc.)
3. Give it a custom name
4. The note is saved in today's month folder

Example:

```
2025/10-October/
├── 2025-10-23.md          # Daily note
├── morning-standup.md      # Meeting note
└── bug-investigation.md    # Research note
```

All notes appear in the Calendar View for that date.

## Tree View Organization

In the Noted sidebar, daily notes appear under their respective month folders:

- **Recent Notes** section shows the 10 most recently modified notes
- **Year folders** are shown in reverse chronological order (newest first)
- **Month folders** are shown in reverse chronological order within each year
- **Note files** within months are sorted newest to oldest

### Visual Indicators

- **Year folders**: Standard folder icon
- **Month folders**: Calendar icon
- **Note files**: Document icon

## Integration with Other Features

Daily notes work seamlessly with all Noted features:

### Calendar View

- Click any date to see all notes created that day
- Create new daily notes directly from the calendar
- Visual indicators show which days have notes

### Tags

Add tags anywhere in your daily notes:

```markdown
# 2025-10-23

Today's standup #meeting #team
- Discussed bug fix #bug #critical
- Planning sprint review #planning
```

### Wiki-Style Links

Link between daily notes or to other notes:

```markdown
# 2025-10-23

Follow up from [[2025-10-22]]
See [[project-planning]] for details
```

### Templates

Create structured daily notes using templates:

```markdown
# 2025-10-23

## Daily Standup

**Attendees**: {user}
**Date**: {date}
**Time**: {time}

### Yesterday
- Completed feature X

### Today
- Working on feature Y

### Blockers
- None
```

### Search

Search across all daily notes:

- Use `Cmd+Shift+F` to search note content
- Filter by tag: `tag:meeting`
- Filter by date range: `from:2025-10-01 to:2025-10-31`
- Use regex: `regex:bug.*fix`

## Best Practices

### Daily Note Workflow

1. **Start your day**: Open today's note with `Cmd+Shift+N`
2. **Quick capture**: Jot down tasks, ideas, or meeting notes
3. **Add structure**: Use headings, lists, and timestamps
4. **Tag as you go**: Add `#tags` for organization
5. **Link to context**: Reference related notes with `[[wiki-links]]`
6. **End of day**: Review and move important items to project notes

### Organizing Daily Content

**Do**:
- Use daily notes for time-sensitive information
- Add timestamps with `Cmd+Shift+T` for meeting notes
- Tag recurring topics for easy filtering
- Link to project notes for full context

**Don't**:
- Don't put long-term reference material in daily notes
- Don't duplicate information—use links instead
- Don't forget to use templates for recurring note types

### When to Create Additional Notes

Create a separate note (not a daily note) when:

- Content is project-specific, not time-specific
- You need to reference it frequently
- It will be updated over time
- It contains reference material or documentation

Use daily notes when:

- Capturing today's activities or thoughts
- Recording meeting minutes from today
- Tracking daily progress or standup notes
- Quick capture of ideas or tasks

## Troubleshooting

### Note doesn't open in editor

- **Solution**: Check that your notes folder is properly configured in settings
- Run `Noted: Setup Default Folder` or `Noted: Setup Custom Folder`

### Wrong file format created

- **Solution**: Check the "File Format" setting in VS Code settings
- Change to "md" or "txt" as preferred
- Only affects new notes going forward

### Can't find old notes

- **Solution**: Use the Calendar View or Search functionality
- Calendar View: `Cmd+Shift+C` to browse by date
- Search: `Cmd+Shift+F` to search content or use Quick Switcher

### Notes folder in wrong location

- **Solution**: Use `Noted: Move Notes Folder` command
- Choose new location
- All notes will be moved automatically

## Related Features

- [Calendar View]({{ '/features/calendar' | relative_url }}) - Navigate daily notes visually
- [Templates]({{ '/features/templates' | relative_url }}) - Structure your daily notes
- [Search & Discovery]({{ '/features/search' | relative_url }}) - Find past daily notes
- [Tags System]({{ '/features/tags' | relative_url }}) - Organize daily notes by topic

---

[← Back to Features]({{ '/features/' | relative_url }})
