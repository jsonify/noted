---
layout: default
title: Calendar View
parent: Features
nav_order: 8
---

# Calendar View

Visual monthly calendar for navigating daily notes and viewing note history.

## Overview

The Calendar View provides an interactive monthly calendar that shows all your notes organized by date. It's the perfect way to navigate your daily notes, review past activity, and see your note-taking patterns at a glance.

## Opening Calendar View

There are multiple ways to open the Calendar View:

- **Command Palette**: `Noted: Show Calendar View`
- **Keyboard Shortcut**: `Cmd+Shift+C` (Mac) or `Ctrl+Shift+C` (Windows/Linux)
- **Sidebar Toolbar**: Click the calendar icon in the My Notes toolbar

The calendar opens in a new editor tab as an interactive webview.

## Calendar Interface

### Monthly Calendar Grid

The calendar displays a traditional monthly grid view:

- **Month/Year header**: Shows current month and year
- **Day grid**: All days of the month in a 7-column layout
- **Day indicators**: Each day shows its date number
- **Navigation buttons**: Previous/Next month arrows and "Today" button

### Visual Indicators

Days with notes are **highlighted** to show note activity:

- **Days with notes**: Highlighted background (indicates notes exist for that day)
- **Current day**: Special border to show today's date
- **Other days**: Normal appearance

This gives you an instant visual overview of which days you've taken notes.

## Selecting Dates

Click any date on the calendar to:

1. **See all notes for that date**: A list appears below the calendar
2. **View note details**: Each note shows its filename and path
3. **Access notes quickly**: Click any note in the list to open it

### Notes List

When you click a date, the notes list shows:

- All notes created on that date
- Both daily notes (e.g., `2025-10-23.md`) and named notes (e.g., `meeting-notes.md`)
- File names as clickable links

Click any note in the list to open it in the editor.

## Creating Notes from Calendar

### For the Current Date

If you select today's date and no daily note exists:

- **"Create Today's Note" button** appears
- Click to create today's note instantly
- Opens the new note in the editor

### For Dates with Existing Notes

If the selected date already has notes:

- **"Create Another Note" button** appears
- Click to create an additional note for that date
- Prompts you to choose a template and enter a name
- The new note is saved in that month's folder

### For Past or Future Dates

You can select any date (past or future) to:

- See what notes exist for that date
- Create notes for future planning
- Add additional notes to past dates

## Navigation

### Month Navigation

Navigate through months using the header buttons:

- **← Previous**: Go to previous month
- **Today**: Jump back to current month
- **Next →**: Go to next month

The calendar remembers your position as you navigate, so you can easily jump between months to review your note history.

### Quick Jump to Today

The **"Today"** button always brings you back to the current month and highlights today's date. This is useful when you've navigated far into the past or future.

## Multi-Note Support

The calendar is designed to handle multiple notes per day:

### Daily Notes + Templated Notes

You might have:

- One daily note: `2025-10-23.md`
- Multiple templated notes: `morning-standup.md`, `bug-investigation.md`, `project-meeting.md`

All of these notes appear in the notes list when you click that date.

### Use Cases

**Meeting-heavy days**: Create multiple meeting notes for different meetings on the same day

```
2025/10-October/
├── 2025-10-23.md              # Daily note
├── standup-meeting.md          # Morning standup
├── design-review.md            # Afternoon design review
└── retrospective.md            # End of day retro
```

**Project work**: Daily note plus project-specific notes

```
2025/10-October/
├── 2025-10-23.md              # Daily note
├── feature-planning.md         # Feature planning session
└── bug-fix-notes.md           # Bug investigation
```

## Integration with Other Features

### Works with Daily Notes

The calendar is the perfect companion to Daily Notes:

- Visualize your daily note-taking habit
- See which days you missed
- Quickly access any past daily note
- Create daily notes for past days you missed

### Works with Search

After using the calendar to browse:

- You can still use search (`Cmd+Shift+F`) to find specific content
- Use date filters in search to narrow results: `from:2025-10-01 to:2025-10-31`
- Combine calendar navigation with text search for powerful discovery

### Works with Tags

Notes shown in the calendar can have tags:

- Open a note from the calendar
- See its tags in the Tags panel
- Use tag filtering in the main tree view to organize notes

### Works with Graph View

- Calendar shows *when* notes were created
- Graph View shows *how* notes are connected
- Use both together to understand your knowledge base chronologically and structurally

## Typical Workflows

### Weekly Review

Review your week's notes:

1. Open Calendar View (`Cmd+Shift+C`)
2. Click each day of the past week
3. Review the notes list for each day
4. Open notes to read or update them
5. Tag or link related notes

### Monthly Planning

Plan the upcoming month:

1. Navigate to next month in Calendar View
2. Click dates where you have meetings or events planned
3. Create notes for each event using templates
4. Add agenda items or preparation notes

### Gap Analysis

Find days you missed:

1. Open Calendar View for the current month
2. Look for days without highlighting
3. Click those days to confirm no notes exist
4. Create daily notes for missed days if needed

### Historical Research

Find notes from a specific time period:

1. Open Calendar View
2. Navigate to the target month
3. Click dates with highlighted indicators
4. Review notes to find what you're looking for
5. Use search if you need more specific content matching

## Best Practices

### Visual Patterns

The calendar reveals patterns:

- **Consistent highlighting**: Shows regular note-taking habit
- **Gaps**: Days you missed (weekends, vacations, busy days)
- **Clusters**: Periods of high activity

Use these patterns to:

- Evaluate your note-taking consistency
- Identify busy periods
- Plan better habits

### Quick Navigation

- Use `Today` button frequently to reset your view
- Don't be afraid to jump months—it's fast
- Click a date before searching to set context

### Creating Notes

- Create notes for future dates to prep for meetings
- Fill in missed past dates if you remember important events
- Use templates when creating from calendar for consistency

## Troubleshooting

### Calendar shows no highlighted days

**Cause**: No notes exist in the current month

**Solution**:
- Navigate to a month where you have notes
- Or create your first note with `Cmd+Shift+N`
- Calendar will update automatically

### Clicked date but no notes appear

**Cause**: The day has no notes (highlighted indicators might appear for adjacent days)

**Solution**:
- Click the "Create Today's Note" or "Create Another Note" button
- Or verify you clicked the correct date

### Calendar won't open

**Cause**: Notes folder not configured

**Solution**:
- Run `Noted: Setup Default Folder` or `Noted: Setup Custom Folder`
- Restart VS Code if needed

### Notes list doesn't update after creating a note

**Cause**: Webview needs refresh

**Solution**:
- Close and reopen Calendar View
- Or click a different date and click back

## Tips & Tricks

### Keyboard-Free Navigation

- Everything in Calendar View is clickable
- No keyboard shortcuts needed within the calendar
- Perfect for mouse/trackpad workflows

### Combine with Quick Switcher

1. Open Calendar View to see which days have notes
2. Close it and use Quick Switcher (`Cmd+Shift+P` → "Quick Switcher")
3. Quickly access recent notes without opening calendar again

### Monthly Note-Taking Goals

Use the calendar to track goals:

- Aim for consistent daily highlighting
- Review monthly at month-end
- Identify patterns to improve

### Planning Ahead

Create notes for future dates:

- Meeting prep notes for next week
- Project planning notes for next month
- Agenda items for upcoming events

This gives you a "future calendar" view of planned work.

## Related Features

- [Daily Notes]({{ '/features/daily-notes' | relative_url }}) - The notes shown in the calendar
- [Templates]({{ '/features/templates' | relative_url }}) - Use when creating notes from calendar
- [Search & Discovery]({{ '/features/search' | relative_url }}) - Find notes after browsing calendar
- [Graph View]({{ '/features/graph' | relative_url }}) - Complementary view showing connections

---

[← Back to Features]({{ '/features/' | relative_url }})
