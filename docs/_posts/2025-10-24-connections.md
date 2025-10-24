---
title: Connections Panel
date: 2025-10-24 08:30:00 -0800
categories: [Features, Navigation]
tags: [connections, backlinks, navigation, links]
---

# Connections Panel

The Connections Panel provides an always-visible sidebar showing all incoming backlinks and outgoing links for your current note. See your note's relationships at a glance.

## Overview

The Connections Panel automatically updates to show:
- **Outgoing Links**: Notes that the current note links to
- **Backlinks**: Notes that link to the current note
- **Context**: Surrounding text for each connection
- **Quick Navigation**: Click to jump to any connected note

## Accessing the Panel

The Connections Panel appears in the sidebar under the "CONNECTIONS" section, below the main Notes tree view.

It automatically updates when you:
- Switch to a different note
- Save changes to a note
- Create or modify wiki-style links

## Panel Sections

### Outgoing Links

Shows all notes that the current note links to using `[[wiki-links]]`:

```
Outgoing Links (3)
  └── project-roadmap
      Line 15: "See [[project-roadmap]] for timeline"
  └── bug-auth
      Line 23: "Related to [[bug-auth]]"
  └── team-meeting
      Line 45: "Discussed in [[team-meeting]]"
```

### Backlinks

Shows all notes that link to the current note:

```
Backlinks (5)
  └── daily-standup
      Line 8: "Working on [[feature-auth]]"
  └── sprint-planning
      Line 12: "Priority: [[feature-auth]]"
  └── code-review
      Line 5: "Reviewed [[feature-auth]] implementation"
```

## Context Preview

Each connection shows:
- **Source/Target Note**: The connected note's name
- **Line Number**: Where the link appears
- **Context**: The line containing the link
- **Tooltip**: Extended context with file metadata

Hover over any connection to see:
- Full file path
- Complete context (configurable lines before/after)
- Link display text (if using `[[note|Display]]` syntax)

## Navigation

### Open Connection

Click any connection item to open the target note:

```
Click on "project-roadmap" → Opens that note in editor
```

### Open Connection Source

Right-click a connection and select "Open Connection Source" to:
- Open the source note
- Jump directly to the line containing the link
- See the exact context where the connection was made

This is especially useful for understanding why a note links to another.

## Connection Strength

When multiple connections exist between notes, they're grouped together:

```
Backlinks (3)
  └── daily-standup (2 connections)
      Line 8: "Working on [[feature-auth]]"
      Line 15: "[[feature-auth]] tests passing"
  └── code-review
      Line 5: "Reviewed [[feature-auth]]"
```

The number in parentheses shows how many times the source note links to the target.

## Real-Time Updates

The panel updates automatically when:

1. **Active Editor Changes**: Switch notes → Panel shows new note's connections
2. **Document Saved**: Save a note → Panel refreshes to reflect new links
3. **Backlinks Rebuilt**: Manual rebuild → Panel shows updated connections

## Use Cases

### Understanding Note Relationships

See how a note fits into your knowledge base:

```markdown
# feature-authentication

Your note content here...
```

**Connections Panel shows:**
- Outgoing: Links to related notes (specs, bugs, PRs)
- Backlinks: Notes that reference this feature (standups, reviews, docs)

### Finding Related Context

Discover where a topic is discussed:

```
Click on backlink → See how others referenced this note
View context → Understand the relationship
```

### Navigation Hub

Use the panel as a quick navigation tool:

1. Open a central note (e.g., `project-overview`)
2. See all connected notes in the panel
3. Click through to explore the network

### Validating Links

Ensure your notes are well-connected:

- **No backlinks?** → Orphan note, consider linking from relevant notes
- **Many backlinks?** → Hub note, good central resource
- **Few outgoing links?** → Could be expanded with more context

## Integration with Other Features

### Wiki-Style Links

The panel shows all `[[wiki-links]]` in your notes:

```markdown
See [[project-roadmap]] for details.
Related: [[bug-123]], [[feature-auth]]
```

### Backlinks Index

The panel uses the backlinks index (built automatically):
- Indexes all notes on activation
- Updates incrementally as you edit
- Manual rebuild with `Noted: Refresh Connections`

### Auto-Backlinks Sections

When auto-backlinks are enabled (`noted.autoBacklinks: true`):
- Backlinks are appended to note files
- Format: `- [[source-note]] - #tag1 #tag2`
- Includes tags from source note's frontmatter
- Panel shows same information, but always up-to-date

## Commands

### Refresh Connections

```
Command: Noted: Refresh Connections
```

Rebuilds the backlinks index and refreshes the panel. Use this if:
- Panel seems out of sync
- You've made many link changes
- You want to ensure accuracy

### Rebuild Backlinks

```
Command: Noted: Rebuild Backlinks
```

Rebuilds the backlinks index AND regenerates auto-backlinks sections in all notes.

## Configuration

### Auto-Backlinks

Control whether backlinks are appended to note files:

```json
{
  "noted.autoBacklinks": true  // default
}
```

When enabled, notes will have a section like:

```markdown
---

## Backlinks
- [[daily-standup]] - #meeting #team
- [[code-review]] - #review
```

This doesn't affect the Connections Panel, which always shows real-time data.

## Best Practices

1. **Use Descriptive Link Text**: Use `[[note|Descriptive Text]]` for clarity
2. **Check Backlinks Regularly**: See how others are using your notes
3. **Link Liberally**: More links = more context in the panel
4. **Explore Connection Sources**: Use "Open Connection Source" to understand relationships
5. **Organize with Tags**: Tags in source notes appear in backlinks

## Tips & Tricks

### Find Orphan Notes

Open a note with no backlinks → Consider linking from relevant notes:
```
Backlinks (0)
  No backlinks found
```

### Hub Notes

Notes with many backlinks are "hub notes" - great entry points:
```
Backlinks (15)
  [Many notes linking here]
```

### Bidirectional Connections

When a note appears in both sections, you have a bidirectional link:
```
Outgoing: [[project-roadmap]]
Backlinks: [[project-roadmap]]
```

This indicates a strong relationship between notes.

### Context Investigation

Use the panel to investigate how a concept evolved:
1. Open a concept note
2. View backlinks chronologically
3. Click through to see how understanding developed

## Troubleshooting

### Panel Not Updating

Run `Noted: Refresh Connections` to rebuild the index.

### Missing Connections

Ensure:
- Links use correct `[[note-name]]` syntax
- Notes have been saved recently
- Link targets exist (broken links won't show in outgoing)

### Performance with Large Workspaces

The panel uses an efficient index:
- Built once on activation
- Updated incrementally on save
- Minimal performance impact

## Related Features

- [Wiki-Style Links](/noted/posts/wiki-links/) - Create connections between notes
- [Graph View](/noted/posts/graph/) - Visualize all connections
- [Tags](/noted/posts/tags/) - Organize notes by topic
- [Search](/noted/posts/search/) - Find notes by content

---

Explore your note connections! 🔗
