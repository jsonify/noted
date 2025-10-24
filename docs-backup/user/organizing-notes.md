---
layout: default
title: Organizing Notes
parent: User Guide
nav_order: 4
---

# Organizing Notes

Keep your notes organized with folders, pinning, archiving, tags, and bulk operations.

## Automatic Date Organization

Noted automatically organizes daily notes chronologically—no manual work required.

### How It Works

When you create a daily note:
```
Open Today's Note → Creates: 2025/10-October/2025-10-23.md
```

Automatic structure:
```
Notes/
└── 2025/                    # Year folder
    ├── 01-January/          # Month folder
    │   ├── 2025-01-15.md
    │   └── 2025-01-16.md
    ├── 02-February/
    │   └── 2025-02-10.md
    └── 10-October/
        ├── 2025-10-20.md
        ├── 2025-10-21.md
        └── 2025-10-23.md
```

**Benefits:**
- Chronological by default
- Easy to browse by date
- No filing decisions needed
- Works forever (scales to years of notes)

### Tree View Display

In the My Notes sidebar:
- **Years**: Reverse chronological (2025, 2024, 2023...)
- **Months**: Reverse chronological within year (12-December, 11-November...)
- **Notes**: Newest first within month

## Custom Folders

Create folders for projects, topics, or any organizational scheme.

### Creating Folders

**From toolbar:**
1. Click "Create Folder" button in My Notes toolbar
2. Enter folder name
3. Folder appears in tree view

**From command:**
1. Run `Noted: Create Folder`
2. Enter folder name

**Folder location:**
- Created at root level of notes folder
- Appears alphabetically in My Notes view
- Shows above date-organized folders

### Folder Names

**Valid names:**
- Project names: `project-alpha`, `website-redesign`
- Topics: `learning`, `research`, `meetings`
- Clients: `client-acme`, `client-widgets`

**Avoid:**
- Year patterns: `2025` (conflicts with date folders)
- Month patterns: `10-October` (conflicts with date folders)
- The system prevents using date patterns

### Moving Notes to Folders

**Move single note:**
1. Right-click note
2. Select "Move Note to Folder"
3. Choose destination folder
4. Note moves immediately

**Move multiple notes:**
1. Toggle Select Mode
2. Select notes
3. Click "Bulk Move"
4. Choose destination folder
5. Confirm

**Drag and drop:**
- Drag note from any location
- Drop on target folder
- Multi-select supported
- Cannot drop on year folders or root

### Organizing with Folders

**By project:**
```
Notes/
├── project-alpha/
│   ├── planning.md
│   ├── architecture.md
│   └── meeting-notes.md
├── project-beta/
│   └── requirements.md
└── 2025/
    └── 10-October/
        └── 2025-10-23.md  # Daily work log
```

**By topic:**
```
Notes/
├── learning/
│   ├── react-hooks.md
│   └── typescript.md
├── meetings/
│   └── standup-template.md
└── research/
    └── authentication.md
```

**Mixed approach:**
```
Notes/
├── active-projects/     # Current work
├── reference/           # Documentation
├── templates/           # Reusable templates
└── 2025/               # Daily logs
```

## Pinned Notes

Quick access to frequently used notes.

### Pinning Notes

**Pin a note:**
1. Right-click any note
2. Select "Pin Note"
3. Appears in "Pinned Notes" section

**Visual indicators:**
- Pin icon (📌) next to note
- Appears at top of sidebar
- Also visible in original location

### Using Pinned Notes

**Good candidates for pinning:**
- Active project index notes
- Frequently referenced documentation
- Current sprint planning
- Personal task list
- Templates you use daily

**How many to pin:**
- Recommend: 5-10 notes
- Too many defeats quick access purpose
- Rotate pins as priorities change

### Unpinning

**Unpin a note:**
1. Right-click pinned note
2. Select "Unpin Note"
3. Removes from Pinned section
4. Remains in original location

## Archiving

Move old notes out of main view while preserving them.

### When to Archive

Archive notes that are:
- Completed projects
- Old meeting notes (> 3-6 months)
- Historical reference only
- Cluttering main view

Keep notes that are:
- Active work
- Frequently referenced
- Recent (< 3 months)

### Archive Single Note

**Archive a note:**
1. Right-click note
2. Select "Archive Note"
3. Moves to `.archive` folder
4. Appears in Archive section

### Bulk Archive

**Archive multiple notes:**
1. Toggle Select Mode
2. Select notes
3. Click "Bulk Archive"
4. Confirm

**Archive by age:**
1. Run `Noted: Bulk Archive Old Notes`
2. Enter days threshold (e.g., 180 for 6 months)
3. Confirm
4. All older notes archived

### Unarchiving

**Restore a note:**
1. Expand Archive section
2. Right-click archived note
3. Select "Unarchive Note"
4. Returns to active notes

### Archive Strategy

**Monthly:**
- Archive last month's daily notes you don't need

**Quarterly:**
- Bulk archive notes older than 90 days
- Review and unarchive anything still relevant

**Annually:**
- Review archive
- Delete truly unnecessary notes

## Tagging

Organize notes by topic, status, priority, or any categorization.

### Adding Tags

**Inline tags:**
```markdown
Working on authentication system #backend #auth #security
Meeting notes from standup #meeting #team
Bug investigation in progress #bug #critical #investigating
```

**Frontmatter tags:**
```yaml
---
tags: [project-alpha, backend, feature]
---

Rest of note content...
```

**Combined:**
```yaml
---
tags: [project-alpha, backend]
---

Working on authentication #auth #security
Fixed login bug #bugfix
```

### Tag Categories

**Type of work:**
```
#development #design #documentation #testing
```

**Status:**
```
#todo #in-progress #completed #blocked
```

**Priority:**
```
#critical #high-priority #low-priority
```

**Project:**
```
#project-alpha #project-beta #personal
```

**Topic:**
```
#backend #frontend #database #api #security
```

### Using Tags for Organization

**Filter by tag:**
1. Click tag in Tags panel
2. My Notes filters to tagged notes
3. Or use "Filter by Tag" command for multi-tag

**Search with tags:**
```
tag:backend tag:auth authentication
```

**Tag-based workflows:**
- `#todo` for task tracking
- `#weekly-review` for review notes
- `#learning` for educational content
- `#bug` for issue tracking

[See full Tags documentation]({{ '/features/tags' | relative_url }})

## Bulk Operations

Efficiently manage multiple notes at once.

### Entering Select Mode

**Activate:**
- Click "Toggle Select Mode" in toolbar
- Or run `Noted: Toggle Select Mode`

**Visual changes:**
- Checkboxes appear on notes
- Toolbar shows bulk action buttons
- Selection count displayed

### Selecting Notes

**Select individual notes:**
- Click notes to toggle selection
- Checkmark appears when selected

**Select all:**
- Click "Select All" button
- All visible notes selected

**Clear selection:**
- Click "Clear Selection" button
- Or toggle off Select Mode

### Bulk Actions

**Bulk Delete:**
1. Select notes
2. Click "Bulk Delete"
3. Confirm (shows preview of up to 10 notes)
4. All selected notes deleted

**Bulk Move:**
1. Select notes
2. Click "Bulk Move"
3. Choose destination folder
4. Confirm
5. Notes moved to folder

**Bulk Archive:**
1. Select notes
2. Click "Bulk Archive"
3. Confirm
4. Notes moved to archive

**Safety:**
- All operations show confirmation
- All operations can be undone
- Preview shows affected notes

[See full Bulk Operations guide]({{ '/features/bulk-operations' | relative_url }})

## Organizational Workflows

### Weekly Cleanup

**Sunday routine:**
1. Review last week's daily notes (Calendar View)
2. Archive old daily notes
3. Extract important items to project notes
4. Update project indexes

### Project Organization

**New project:**
1. Create project folder
2. Create index note
3. Link from daily notes as you work
4. Pin project index for quick access

**Project structure:**
```
project-alpha/
├── index.md              # Overview and links
├── architecture.md       # Design decisions
├── meeting-notes.md      # Cumulative meetings
└── resources.md          # Links and references
```

### Topic Collections

**Build topic notes:**
1. Tag notes with topic
2. Filter by tag to find all related
3. Create topic index note
4. Link to all related notes
5. Pin topic index

Example topic index:
```markdown
# Authentication Resources

## Implementation Notes
- [[auth-architecture]]
- [[auth-flow-diagram]]
- [[auth-testing]]

## Related Issues
- [[bug-token-expiry]]
- [[bug-session-timeout]]

## Documentation
- [[api-auth-endpoints]]
- [[auth-configuration]]

## Research
Filter by #auth #security to see all notes
```

### Reference Library

**Create dedicated folders:**
```
Notes/
├── reference/
│   ├── code-snippets.md
│   ├── api-docs.md
│   └── troubleshooting.md
├── templates/
│   ├── meeting.md
│   └── daily.md
└── 2025/
```

**Keep separate from daily notes:**
- Reference notes timeless
- Daily notes chronological
- Link between them as needed

## Advanced Organization

### Multi-Dimensional Organization

Combine all methods:

**Example:**
- **Folders** for projects
- **Tags** for topics and status
- **Pins** for current focus
- **Archive** for old work
- **Daily notes** for chronological record

**In practice:**
```markdown
# 2025-10-23

Working on [[project-alpha/authentication]] today #backend #in-progress

See pinned [[project-alpha/index]] for context
```

### Time-Based + Topic-Based

**Daily notes:** What happened when
**Topic notes:** Everything about a subject

**Workflow:**
1. Capture in daily note
2. Tag with topics
3. Link to topic notes
4. Topic notes accumulate related info

### Dynamic vs. Static Notes

**Dynamic (daily notes):**
- Created regularly
- Archive periodically
- Chronological organization

**Static (reference notes):**
- Created as needed
- Kept permanently
- Topic-based folders
- Pin frequently used ones

## Best Practices

### Start Simple

Begin with:
- Automatic date organization
- Basic tagging
- Pin 2-3 most-used notes

Add complexity as needed.

### Review Regularly

**Daily:** Quick scan
**Weekly:** Organize and archive
**Monthly:** Review structure

### Don't Over-Organize

**Avoid:**
- Too many folders (< 10 recommended)
- Too many tags per note (3-5 ideal)
- Too many pins (5-10 max)
- Over-categorizing daily notes

**Remember:**
- Search finds anything
- Links connect related notes
- Perfect organization not required

### Use Search + Organization

Organization + search are complementary:
- Organization: Browse by category
- Search: Find specific content
- Links: Navigate relationships
- Tags: Cross-cutting categorization

## Maintaining Organization

### Prevent Clutter

**Regular maintenance:**
- Archive old notes monthly
- Review and update pins weekly
- Merge duplicate folders
- Clean up obsolete tags

### Handle Edge Cases

**Notes that fit multiple categories:**
- Choose primary folder
- Use tags for other dimensions
- Link from multiple index notes

**Temporary notes:**
- Keep in daily notes
- Archive after project completion
- Don't create folders for short-term work

**Shared notes:**
- Use workspace settings
- Commit folder structure to git
- Document organization scheme in README

## Troubleshooting

### Can't Find Notes

**Check:**
- Archive section (might be archived)
- Tag filters (might be active)
- Search for content
- Calendar View for date-based notes

### Too Many Notes

**Solutions:**
- Archive old notes
- Use tags for filtering
- Create topic index notes
- Bulk operations for cleanup

### Inconsistent Organization

**Fix:**
- Choose one scheme and stick to it
- Use bulk move to reorganize
- Update daily to maintain
- Document your system

## Related Guides

- [Daily Workflow]({{ '/user/daily-workflow' | relative_url }}) - Note-taking patterns
- [Linking Notes]({{ '/user/linking-workflow' | relative_url }}) - Building connections
- [Search & Filter]({{ '/user/search-filter' | relative_url }}) - Finding notes

---

[← Back: Daily Workflow]({{ '/user/daily-workflow' | relative_url }}) | [Next: Linking Notes →]({{ '/user/linking-workflow' | relative_url }})
