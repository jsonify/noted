# Graph View Guide

## What is the Graph View?

The Graph View visualizes connections between your notes using wiki-style links. It shows:
- **Nodes** = Your notes
- **Edges** = Links between notes (created with `[[note-name]]` syntax)
- **Orphans** = Notes with no connections

## How to Create Links

### The Simple Rule
**You only need to add `[[note-name]]` in the SOURCE note.** The target note needs nothing special.

### Step-by-Step Example

#### 1. Create Some Notes

**File: `Notes/ideas.txt`**
```
Random thoughts and ideas.
```

**File: `Notes/project.txt`**
```
Project planning document.
```

**File: `Notes/meeting.txt`**
```
Meeting notes from today.
```

At this point, all 3 notes are **orphans** (no connections).

#### 2. Add Links to Connect Them

**Edit `Notes/ideas.txt`:**
```
Random thoughts and ideas.

Need to add these to the [[project]] plan.
Discussed in [[meeting]].
```

**Edit `Notes/project.txt`:**
```
Project planning document.

Review [[ideas]] and [[meeting]] notes.
```

Now the graph shows:
- `ideas` → links to → `project` and `meeting`
- `project` → links to → `ideas` and `meeting`
- All three are **connected** (bidirectional links between ideas↔project)

## Link Syntax Options

All of these work:

```
[[note-name]]           - Links to any note with "note-name" in filename
[[boom]]                - Links to "boom.txt" or "boom.md"
[[boom.txt]]            - Links specifically to "boom.txt"
[[2025-01-15]]          - Links to date-based note "2025-01-15.txt"
[[meeting-notes]]       - Links to "meeting-notes.txt"
```

You can use links **anywhere** in your note:
- In paragraphs: `I discussed this in [[meeting]]`
- In lists: `- See [[ideas]]`
- In headings: `## Related to [[project]]`

## Understanding the Graph

### Node Colors
- **Gray** = Orphan (0 connections)
- **Green** = Lightly connected (1-2 links)
- **Blue** = Moderately connected (3-5 links)
- **Orange** = Well connected (6-10 links)
- **Red** = Hub (10+ links)

### Node Size
- Larger nodes = more connections
- Size is calculated using logarithmic scaling

### Edge Width
- **Thin lines** = One-way link (A links to B, but B doesn't link back)
- **Thick lines** = Bidirectional (A links to B, and B links to A)

### Layout Options

**Force-Directed** (default)
- Natural, physics-based layout
- Shows organic clusters
- Nodes repel each other, edges pull them together

**Hierarchical**
- Top-down tree structure
- Good for parent-child relationships
- No physics simulation

**Circular**
- Nodes arranged in a ring
- Alternative perspective
- Good for seeing overall structure

### Filters

**All Notes**
- Shows every note in your system

**Connected Only**
- Hides orphan notes
- Only shows notes with at least one link

**Orphans Only**
- Shows only unconnected notes
- Helps find notes that might need linking

## Troubleshooting

### "I don't see any nodes"

**Solution 1: Reload VS Code**
1. Press `Cmd+Shift+P` (or `Ctrl+Shift+P`)
2. Type "Reload Window"
3. Press Enter
4. Reopen Graph View with `Cmd+Shift+G`

**Solution 2: Check the stats**
- Look at the top of the Graph View
- Does it show "Notes: X"? If X is 0, no notes were found
- If X is greater than 0 but you see nothing, try clicking "Fit View" button

**Solution 3: Check your notes location**
- Make sure your notes folder is configured correctly
- Go to VS Code Settings → search for "noted.notesFolder"
- Verify the path is correct

### "Links aren't showing up"

**Check your syntax:**
- Must use double square brackets: `[[note-name]]` ✓
- Single brackets don't work: `[note-name]` ✗
- Parentheses don't work: `((note-name))` ✗

**Check the target note exists:**
- The note you're linking to must actually exist in your notes folder
- File extensions (.txt or .md) are optional in the link

**Refresh the graph:**
- After adding links, click the "Refresh" button in the Graph View
- This rebuilds the connection index

### "I see orphans count but no nodes visible"

This was a bug that was fixed. If you still experience this:
1. Make sure you're running the latest version
2. Reload VS Code window
3. Close and reopen the Graph View
4. Try clicking "Fit View" button

## Quick Start Tutorial

### Create a Connected Knowledge Base

1. **Create a hub note** (`Notes/index.txt`):
```
# My Knowledge Base

Topics:
- [[work-projects]]
- [[personal-ideas]]
- [[daily-logs]]
```

2. **Create the linked notes:**

`Notes/work-projects.txt`:
```
Current projects at work.
Related to [[daily-logs]].
```

`Notes/personal-ideas.txt`:
```
Ideas for side projects.
```

`Notes/daily-logs.txt`:
```
Daily activity log.
Connected to [[work-projects]].
```

3. **Open Graph View** (`Cmd+Shift+G`)

You should now see:
- 4 nodes
- `index` in the center (hub - links to 3 others)
- `work-projects` and `daily-logs` connected bidirectionally
- `personal-ideas` as a single connection to `index`

## Pro Tips

### 1. Create Index Pages
Make "hub" notes that link to related topics:
```
# Project X

Team: [[team-members]]
Timeline: [[project-schedule]]
Notes: [[meeting-2025-01-15]]
```

### 2. Link Date Notes
Connect daily notes to create a timeline:
```
# 2025-01-16

Yesterday: [[2025-01-15]]
Tomorrow: [[2025-01-17]]
```

### 3. Use Backlinks
Hover over any note in your editor (first 5 lines) to see which notes link TO it. This is complementary to the graph view.

### 4. Find Orphans to Link
Use the "Orphans Only" filter to find notes that might benefit from connections.

### 5. Use Search
Type in the search box to quickly find specific notes in large graphs.

## Graph View Shortcuts

- **Click node** = Open that note
- **Drag node** = Reposition (temporary)
- **Scroll wheel** = Zoom in/out
- **Click and drag background** = Pan around
- **Refresh button** = Rebuild graph after changes
- **Fit View button** = Auto-zoom to show all nodes

## Example Use Cases

### Project Management
```
[[project-overview]] → [[task-list]] → [[completed-tasks]]
                    → [[meeting-notes]]
                    → [[ideas-brainstorm]]
```

### Daily Notes
```
[[2025-01-14]] → [[2025-01-15]] → [[2025-01-16]]
       ↓               ↓               ↓
  [[project-a]]   [[meeting]]    [[review]]
```

### Knowledge Base
```
         [[index]]
       /    |    \
   [[code]] [[design]] [[research]]
     |        |          |
  [[tips]] [[colors]] [[papers]]
```

---

**Still having issues?** Check the main documentation in `notes.md` or open an issue on GitHub.
