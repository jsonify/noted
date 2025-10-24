---
layout: default
title: Connections Panel
parent: Features
nav_order: 6
---

# Connections Panel

The Connections panel provides an always-visible sidebar view of all note relationships, showing both incoming backlinks and outgoing links with rich context and easy navigation.

## Overview

The Connections panel is a dedicated sidebar view that automatically displays all connections for the currently active note. It updates in real-time as you switch between notes, giving you constant visibility into your knowledge network without running any commands.

## Features

### Always-Visible Sidebar

The Connections panel appears in the Noted sidebar activity bar, below the main notes tree. It's always visible and updates automatically - no commands to run, no panels to toggle.

**Location:** Noted Sidebar → Connections view

### Bidirectional Display

The panel shows two separate sections with real-time counts:

- **Outgoing Links (N)**: Notes that the current note links to
- **Backlinks (N)**: Notes that link to the current note

This bidirectional view gives you a complete picture of how the current note fits into your knowledge base.

### Rich Context

Each connection displays:

- **Note name**: The connected note's filename
- **Line number**: Where the connection appears
- **Context snippet**: The actual line containing the link
- **Display text**: Custom text from `[[link|Display Text]]` syntax (if used)

**Example connection item:**
```
📄 meeting-notes                    "project update" (line 23)
```

Hover over any connection to see the full tooltip with:
- Complete context (lines before/after)
- Source file path
- Metadata about the connection

### Quick Navigation

**Open Connected Note:**
- Click any connection to open the target note
- The note opens in the current editor

**Jump to Source Line:**
- Right-click a connection
- Select "Open Connection Source"
- Opens the source note and jumps to the exact line containing the link
- Useful for seeing the full context of incoming backlinks

### Grouped Connections

When multiple connections exist to the same note, they're intelligently grouped:

```
📄 project-plan          (3 connections)
  ├─ line 12: First reference
  ├─ line 45: Second reference
  └─ line 78: Third reference
```

This shows connection strength and helps you understand how heavily notes reference each other.

### Real-Time Updates

The Connections panel automatically refreshes when:

- You switch to a different note
- You save a document (links may have changed)
- You create or delete a note
- The backlinks index is rebuilt

**No manual refresh needed** - the panel stays synchronized with your workspace.

### Auto-Backlinks Sections

Noted can automatically append a backlinks section to your notes, providing a permanent record of all incoming references directly in the note file.

**How it works:**
- When enabled, notes automatically get a `## Backlinks` section at the end
- The section lists all notes that link to the current note
- Each backlink shows the source note's tags from frontmatter
- Updates automatically whenever links are created or removed

**Example backlinks section:**
```markdown
---
## Backlinks
- [[project-notes]] - #important #project
- [[meeting-2025-01-15]] - #meeting #team
- [[research-ideas]]
```

**Configuration:**
- **Enabled by default** - backlinks sections are added automatically
- **Toggle in settings**: `noted.autoBacklinks` (true/false)
- **Manual refresh**: Run "Noted: Rebuild Backlinks Index"
- **Clear all**: Run "Noted: Clear All Backlinks Sections"

**Format details:**
- Each backlink shows: `- [[note-name]] - #tag1 #tag2`
- Tags are extracted from the source note's frontmatter
- Separator line (`---`) clearly marks auto-generated content
- Only notes with actual backlinks get the section

**Benefits:**
- Permanent record of references (survives outside VS Code)
- See tags from referencing notes at a glance
- Portable - works with any markdown viewer
- Complements the Connections panel (UI vs. file-based)

**Disabling:**
1. Open Settings (`Cmd+,`)
2. Search for "noted.autoBacklinks"
3. Uncheck to disable
4. Run "Noted: Clear All Backlinks Sections" to remove existing sections

## Using the Connections Panel

### Basic Workflow

1. **Open a note** in your editor
2. **Check the Connections panel** to see all relationships
3. **Click a connection** to navigate to a related note
4. **Use "Open Connection Source"** to see where backlinks originated

### Finding Related Information

The Connections panel helps you discover related content:

**Exploring Outgoing Links:**
- See all notes you've referenced in the current note
- Follow links to dive deeper into topics
- Identify notes that need linking

**Exploring Backlinks:**
- See which notes reference the current note
- Discover unexpected connections
- Understand how others use this note

### Building Your Knowledge Network

**Create Bidirectional Links:**
```
// In note-a.txt
See [[note-b]] for more details

// Check Connections panel in note-b.txt
// You'll see note-a in the Backlinks section
// Click to go back and create reverse link if needed
```

**Track Reference Frequency:**
- Look for notes with high connection counts
- These are likely important hub notes
- Consider adding more detail or breaking into subtopics

**Find Orphaned Content:**
- Notes with no connections appear in Graph View as isolated
- Use Connections panel to add relevant links
- Build a more interconnected knowledge base

## Commands

### Refresh Connections

Manually refresh the connections panel and rebuild the backlinks index:

1. Open Command Palette (`Cmd+Shift+P`)
2. Run "Noted: Refresh Connections"
3. Backlinks index rebuilds in background

**When to use:**
- After bulk operations (move, rename, delete)
- If connections seem out of sync
- After external file changes

### Open Connection

Navigate to a connected note:

- **Automatic**: Click any connection in the panel
- **Manual**: Right-click → "Open Connection"

Opens the target note in your editor.

### Open Connection Source

Jump to the exact line where a link appears:

- Right-click any connection
- Select "Open Connection Source"
- Editor opens source note at the specific line
- Line is highlighted and centered

**Especially useful for:**
- Understanding context of backlinks
- Seeing how others reference your notes
- Quick navigation to specific mentions

## Empty State

When no note is active or the current file isn't a note:

```
ℹ️  No active note
    Open a note to see its connections
```

The panel shows an informative message and waits for you to open a note.

## Integration with Other Features

### Graph View

The Connections panel complements Graph View:

- **Graph View**: Visual overview of entire network
- **Connections Panel**: Detailed view of current note

Use together to:
1. Find notes in Graph View
2. Click to open note
3. Check Connections panel for detailed relationships

### Wiki-Style Links

The panel displays all `[[wiki-links]]` from your notes:

- Simple links: `[[note-name]]`
- Display text: `[[note-name|Custom Text]]`
- Path-based: `[[folder/note-name]]`

All link types show with appropriate context.

### Link Diagnostics

Connections only shows successfully resolved links:

- Broken links (`[[non-existent]]`) don't appear
- Fix broken links using Link Diagnostics
- Once fixed, they appear in Connections panel

### Search & Tags

Find notes in specific contexts:

1. **Search** for notes by topic
2. **Open** interesting results
3. **Check Connections** to find related notes
4. **Filter by tags** to focus on specific areas

## Tips & Tricks

### Understanding Connection Patterns

**High Backlink Count:**
- Note is frequently referenced
- Likely a core concept or hub
- Consider expanding or refactoring

**High Outgoing Count:**
- Note references many others
- Might be a summary or index
- Good for navigation

**Balanced Connections:**
- Well-integrated into knowledge network
- Good bidirectional linking

**No Connections:**
- Orphaned note (see Graph View)
- Add relevant links to integrate

### Workflow Strategies

**Start of Day:**
1. Open today's note
2. Check Connections for yesterday's note
3. Link to relevant topics from yesterday

**During Research:**
1. Create new research note
2. Add `[[links]]` to related concepts
3. Check Connections to see related research

**Note Review:**
1. Open old note
2. Check Connections panel
3. Add missing links to strengthen network
4. Follow backlinks to see current usage

**Project Work:**
1. Open project index note
2. Connections shows all project notes
3. Navigate through project structure
4. Use backlinks to track dependencies

### Connection Hygiene

**Regular Maintenance:**
- Review notes with zero connections
- Add links to integrate orphaned content
- Check for one-way links that should be bidirectional

**Link Quality:**
- Ensure links are meaningful, not just present
- Use display text for clarity: `[[api-design|our API]]`
- Group related links together in sections

**Context Preservation:**
- Write clear sentences around links
- Context appears in Connections panel
- Makes future navigation more meaningful

## Performance

The Connections panel is optimized for large note collections:

- **Instant updates**: No lag when switching notes
- **Efficient indexing**: Backlinks cached in memory
- **Lazy loading**: Only processes visible connections
- **Background refresh**: Doesn't block editing

**For very large workspaces (1000+ notes):**
- Initial index build may take a few seconds
- Subsequent updates are instant
- Manual refresh available if needed

## Keyboard-Free Navigation

The Connections panel enables mouse-only workflows:

1. Click note in main tree
2. See connections in panel
3. Click connection to navigate
4. Repeat to explore knowledge network

No keyboard shortcuts needed for basic navigation.

## Comparison with Other Tools

### vs. Hover Backlinks

**Hover Backlinks:**
- Temporary popup
- Must hover over note header
- Disappears when mouse moves

**Connections Panel:**
- Always visible
- No hover required
- Shows both incoming and outgoing
- Persistent context

### vs. Graph View

**Graph View:**
- Visual network overview
- See all notes at once
- Pattern recognition

**Connections Panel:**
- Current note focus
- Detailed context
- Quick navigation
- Always available

**Use both:** Graph for exploration, Connections for workflow.

## Troubleshooting

### Connections Not Appearing

**Check:**
1. Is the active file a note (`.txt` or `.md`)?
2. Are links using correct syntax (`[[note-name]]`)?
3. Do target notes exist?
4. Try "Refresh Connections" command

### Wrong Connection Count

**Fix:**
1. Save all open files
2. Run "Noted: Refresh Connections"
3. Wait for index rebuild (automatic)

### Missing Backlinks

**Possible causes:**
- Linking note not saved yet
- Broken link syntax
- Target note name doesn't match

**Solution:**
- Open linking note and verify syntax
- Use Link Diagnostics to find issues
- Run "Refresh Connections"

### Slow Updates

**If panel feels sluggish:**
- Index may be rebuilding
- Large workspace (1000+ notes) may take seconds
- Wait for background process to complete

---

[← Back to Features]({{ '/features/' | relative_url }}) | [Next: Graph View →]({{ '/features/graph' | relative_url }})
