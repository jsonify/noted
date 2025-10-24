---
title: Pinned Notes
date: 2025-10-24 05:00:00 -0800
categories: [Features, Organization]
tags: [pinned, favorites, quick-access, organization]
---

# What are Pinned Notes?

Pin important notes for instant access from the top of your sidebar. Keep frequently referenced notes always within reach.

## Quick Start

**Pin a note:**
```
Right-click note → Pin Note
```

**Unpin a note:**
```
Right-click pinned note → Unpin Note
```

## Pinned Notes Section

Pinned notes appear at the top of the Notes view:

```
My Notes
  📌 Pinned Notes (3)
      ├── 📌 project-roadmap.md
      ├── 📌 daily-standup-template.md
      └── 📌 common-commands.md

  📁 Recent Notes
      └── ...

  📁 2024
      └── ...
```

**Always visible**, always accessible!

## Pinning Notes

### From Context Menu

Right-click any note:

```
Open Note
Move to Folder
Rename Note
Duplicate Note
Delete Note
───────────────
Pin Note        ← Click here
Archive Note
```

Note becomes pinned immediately.

### From Any Location

You can pin notes from anywhere:
- Recent Notes section
- Date folders (year/month)
- Custom folders
- Search results (open note first, then pin)

### Visual Indicators

Pinned notes show:
- 📌 Pin icon
- "Pinned Notes" section header
- Grouped at top of tree view
- Special highlighting

## Unpinning Notes

### Remove Pin

Right-click pinned note:

```
Open Note
Move to Folder
Rename Note
Duplicate Note
Delete Note
───────────────
Unpin Note      ← Click here
Archive Note
```

**Result:**
- Note removed from Pinned section
- Returns to original location
- Still accessible in date/custom folders

### Automatic Cleanup

Pinned notes are automatically unpinned if:
- Note is deleted
- Note is archived
- Note file is moved outside workspace

No broken pins left behind!

## Use Cases

### Project Dashboards

Pin project overview notes:

```
📌 Pinned Notes
    ├── 📌 project-alpha-overview.md
    ├── 📌 project-beta-status.md
    └── 📌 team-contacts.md
```

Quick access to key project info!

### Reference Material

Pin commonly referenced notes:

```
📌 Pinned Notes
    ├── 📌 coding-standards.md
    ├── 📌 deployment-checklist.md
    └── 📌 api-endpoints.md
```

Always available when you need them.

### Templates

Pin your favorite templates:

```
📌 Pinned Notes
    ├── 📌 daily-standup-template.md
    ├── 📌 bug-report-template.md
    └── 📌 meeting-notes-template.md
```

Quick access for creating new notes.

### Active Work

Pin notes you're actively working on:

```
📌 Pinned Notes
    ├── 📌 feature-auth-spec.md
    ├── 📌 bug-123-investigation.md
    └── 📌 sprint-planning.md
```

Temporary pins - unpin when done.

### Quick Reference

Pin cheat sheets and guides:

```
📌 Pinned Notes
    ├── 📌 git-commands.md
    ├── 📌 regex-patterns.md
    └── 📌 keyboard-shortcuts.md
```

### Team Information

Pin team-related notes:

```
📌 Pinned Notes
    ├── 📌 team-directory.md
    ├── 📌 on-call-schedule.md
    └── 📌 meeting-links.md
```

## Best Practices

1. **Limit Pins**: Keep 3-7 pinned notes for best usability
2. **Review Regularly**: Unpin notes when no longer needed
3. **Meaningful Names**: Use clear names so pins are easy to scan
4. **Organize by Purpose**: Group related pinned notes
5. **Temporary vs. Permanent**: Some pins are permanent (references), some temporary (active work)

## Pinning Strategies

### The "Top 5" Strategy

Pin your 5 most important notes:
- Project roadmap
- Current sprint
- Team contacts
- Personal todo
- Quick reference

Review weekly, update as needed.

### Project-Based Strategy

Pin current project materials:
- Pin when starting project
- Unpin when project completes
- Keeps pins relevant to current work

### Role-Based Strategy

Pin based on your role:

**Developer:**
- Coding standards
- API documentation
- Development checklist

**Manager:**
- Team roster
- Meeting templates
- Project status

**Designer:**
- Design system
- Brand guidelines
- Asset locations

### Time-Based Strategy

Pin for specific time periods:

**Weekly:**
- This week's goals
- Weekly standup template
- Active tasks

**Sprint:**
- Sprint backlog
- Sprint retrospective
- Team capacity

## Pinned Notes Workflow

### Daily Workflow

```
1. Open VS Code
2. Pinned notes immediately visible
3. Click to access frequently used notes
4. No navigation needed!
```

### Weekly Review

```
Sunday:
1. Review pinned notes
2. Unpin completed items
3. Pin upcoming week's priorities
4. Update project pins
```

### Project Lifecycle

```
Start:
- Pin project spec
- Pin task list
- Pin relevant docs

Middle:
- Adjust pins as focus shifts
- Add/remove as needed

End:
- Unpin project notes
- Archive or keep for reference
```

## Pin Management

### How Many Pins?

**Recommended:**
- 3-7 pins: Ideal for quick access
- Up to 10: Still manageable
- More than 10: Consider organizing differently

**Too many pins:**
- Defeats purpose of quick access
- Hard to scan
- Consider using tags/folders instead

### Pin Organization

Pins appear in order pinned (chronological):

```
📌 Pinned Notes
    ├── First pinned
    ├── Second pinned
    └── Third pinned
```

To reorder:
1. Unpin all
2. Re-pin in desired order

### Pin Persistence

Pinned state is stored:
- In workspace settings
- Survives VS Code restarts
- Workspace-specific (different pins per workspace)

## Visual Design

### Pin Icon

Pinned notes use 📌 (pushpin) icon:
- Universal symbol for "pinned"
- Distinct from other icons
- Easy to spot in tree view

### Section Header

```
📌 Pinned Notes (3)
```

Shows:
- 📌 Icon
- Section name
- Count of pinned notes

### Collapsible

The Pinned Notes section can be collapsed:

```
▼ 📌 Pinned Notes (3)    ← Expanded
▶ 📌 Pinned Notes (3)    ← Collapsed
```

Collapse if you need more space.

## Integration with Other Features

### Recent Notes

Pinned notes can also appear in Recent Notes:

```
📌 Pinned Notes
    └── 📌 active-project.md

📁 Recent Notes
    ├── active-project.md  ← Same file
    └── other-note.md
```

File appears in both locations!

### Search

Pinned notes appear in search results:

```
Search: "authentication"

Results:
📌 active-project.md (pinned)
📄 other-note.md
```

### Archive

Archiving a pinned note:
- Automatically unpins
- Moves to archive
- No orphaned pins

### Graph View

Pinned notes appear in graph:
- No special indicator (yet)
- Same as any other note
- Could be hub nodes if frequently linked

## Tips & Tricks

### Pin Templates

Pin your template starter:

```
📌 Pinned Notes
    └── 📌 _templates-index.md
```

Content:
```markdown
# Templates Index

Quick links to all templates:
- [[daily-standup-template]]
- [[meeting-notes-template]]
- [[bug-report-template]]
```

One pin → Access all templates!

### Pin Index Notes

Create index notes that link to groups:

```markdown
# Project Alpha Index

- [[project-alpha-spec]]
- [[project-alpha-tasks]]
- [[project-alpha-decisions]]
- [[project-alpha-retrospective]]
```

Pin the index, access everything.

### Pin Your "Home"

Create a dashboard note:

```markdown
# My Dashboard

## Current Focus
- [[feature-auth]]
- [[bug-123]]

## Reference
- [[team-contacts]]
- [[coding-standards]]

## This Week
![[weekly-goals]]
```

Pin this as your starting point each day.

### Emoji Pins

Use emojis in pinned note names:

```
📌 Pinned Notes
    ├── 📌 🎯 current-sprint.md
    ├── 📌 📚 reference-docs.md
    └── 📌 ⚡ quick-commands.md
```

Visual categorization!

### Pin Keyboard Shortcuts

Can't pin the pin command, but you can:

```
File > Preferences > Keyboard Shortcuts
Search: "Noted: Pin Note"
Assign: Cmd+K Cmd+P (or your choice)
```

## Troubleshooting

### Pin Not Showing

Check:
- Note was successfully pinned
- Pinned Notes section is expanded
- Tree view has refreshed

Try:
```
Command: Noted: Refresh
```

### Can't Unpin

Verify:
- Right-clicking the actual pinned note
- Context menu shows "Unpin Note" option
- Not in read-only mode

### Pins Disappeared

Possible causes:
- Workspace was reset
- Settings were cleared
- Notes were deleted/archived

**Prevention:**
- Keep notes in version control
- Don't delete workspace settings
- Archive carefully

### Too Many Pins

If pins become unmanageable:

1. Unpin all
2. Decide on top 5 only
3. Re-pin selectively
4. Use tags/folders for rest

## Related Features

- [Recent Notes](/noted/posts/recent-notes/) - Another quick access method
- [Quick Switcher](/noted/posts/quick-switcher/) - Fast navigation
- [Favorites](/noted/posts/favorites/) - Similar concept (if implemented)
- [Bookmarks](/noted/posts/bookmarks/) - Alternative organization

---

Keep important notes always at hand! 📌
