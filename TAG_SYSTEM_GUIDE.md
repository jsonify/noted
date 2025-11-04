# Tag System User Guide

## Overview

The Noted extension v1.36.0 features a completely redesigned tag system with hierarchical navigation, F2 rename support, and workspace search. This guide covers all tag features and how to use them effectively.

---

## Table of Contents

1. [Creating Tags](#creating-tags)
2. [Hierarchical Tag Navigation](#hierarchical-tag-navigation)
3. [Renaming Tags with F2](#renaming-tags-with-f2)
4. [Workspace Search](#workspace-search)
5. [Tag Management](#tag-management)
6. [Hierarchical Tags](#hierarchical-tags)
7. [Best Practices](#best-practices)
8. [Migration from Old System](#migration-from-old-system)

---

## Creating Tags

### Method 1: Inline Hashtags

Add tags anywhere in your note content using the `#` symbol:

```
# Meeting Notes

Discussed the #bug in the authentication system.
Need to implement #feature/user-profiles next sprint.
```

**Features:**
- Works anywhere in note content
- Supports hierarchical tags with `/` separator
- Autocomplete suggestions after typing `#`

### Method 2: YAML Frontmatter

Add tags in YAML frontmatter at the beginning of your note:

```yaml
---
tags: [bug, feature, urgent]
---

Note content here...
```

**Features:**
- Array format: `tags: [tag1, tag2, tag3]`
- Quoted values: `tags: ["bug", "feature"]` or `tags: ['bug', 'feature']`
- Both frontmatter and inline tags are automatically merged

### Tag Format Rules

**Valid:**
- Lowercase letters: `#bug`, `#feature`
- Numbers: `#bug123`, `#2025-goals`
- Hyphens: `#bug-fix`, `#work-notes`
- Forward slashes (hierarchy): `#project/frontend`, `#work/meetings/2025`

**Invalid:**
- Must start with a letter (not a number)
- No spaces or special characters (except `-` and `/`)
- Automatically converted to lowercase

---

## Hierarchical Tag Navigation

The Tags panel shows a three-level hierarchy:

```
Tags
├─ #bug (5 references)          ← Level 1: Tags
│  ├─ note1.txt (2 occurrences) ← Level 2: Files
│  │  ├─ 10: Found a #bug...    ← Level 3: Line References
│  │  └─ 25: Another #bug...
│  └─ note2.txt (3 occurrences)
│     ├─ 5: Fix this #bug...
│     ├─ 12: Known #bug...
│     └─ 30: Critical #bug...
└─ #feature (3 references)
   └─ note3.txt (3 occurrences)
      └─ ...
```

### Level 1: Tags

- Shows all tags alphabetically
- Reference count shows total occurrences (not unique files)
- Click to expand and see which files contain the tag
- Right-click for context menu with tag operations

### Level 2: Files

- Shows all files containing the tag
- Occurrence count shows how many times tag appears in that file
- Click to open the file
- Expand to see line references

### Level 3: Line References

- Shows exact line and context snippet
- Format: `{line}: {context}`
- Click to jump to that line with tag highlighted
- Tooltip shows full context and metadata

### Navigation Tips

1. **Quick Jump**: Click line reference → Opens file at exact position with tag selected
2. **File Preview**: Expand file to see all tag occurrences before opening
3. **Context Awareness**: Tooltips show surrounding context for each reference

---

## Renaming Tags with F2

Press F2 on any tag to rename all occurrences across your entire workspace.

### How to Use

**Method 1: From Note Content**
1. Place cursor on any tag (inline `#hashtag` or in frontmatter)
2. Press `F2` (or right-click → Rename Symbol)
3. Enter new tag name
4. Press Enter

**Method 2: From Command Palette**
1. Open Command Palette (Cmd+Shift+P / Ctrl+Shift+P)
2. Run "Noted: Rename Tag"
3. Enter old tag name
4. Enter new tag name

### Features

**Atomic Operations:**
- All edits succeed or all fail (no partial updates)
- Rollback support via VS Code's WorkspaceEdit
- Undo/redo integration

**Smart Validation:**
- Checks tag format (must start with letter, lowercase, etc.)
- Detects if target tag already exists

**Merge Detection:**
If you rename `#bug` to `#defect` and `#defect` already exists, you'll see:

```
Tag "#defect" already exists. Renaming will merge these tags. Continue?
[Yes] [No]
```

Clicking "Yes" merges both tags into one.

### Examples

**Example 1: Simple Rename**
```
Before:  #bug appears in 5 files, 12 times
Action:  F2 on #bug → rename to "defect"
After:   #defect appears in 5 files, 12 times
```

**Example 2: Merge Tags**
```
Before:  #bug (5 files) + #defect (3 files)
Action:  F2 on #bug → rename to "defect" → Confirm merge
After:   #defect appears in 8 files (merged)
```

**Example 3: Hierarchical Rename**
```
Before:  #project/frontend
Action:  F2 → rename to "work/ui"
After:   #work/ui (maintains hierarchy)
```

### Tips

- **Work on both formats**: F2 works on inline hashtags and YAML tags
- **Exact positioning**: Tag is highlighted after rename for easy verification
- **Bulk operation**: All occurrences renamed in one atomic operation
- **Safe**: Confirmation for merges, full undo support

---

## Workspace Search

Find all occurrences of a tag across your entire workspace using VS Code's powerful search.

### How to Use

**Method 1: From Tags Panel**
1. Right-click any tag in Tags panel
2. Select "Search for Tag"
3. VS Code search opens with results

**Method 2: From Toolbar**
1. Click search icon (🔍) in Tags panel toolbar
2. Select tag from quick pick
3. VS Code search opens with results

**Method 3: From Command Palette**
1. Open Command Palette (Cmd+Shift+P / Ctrl+Shift+P)
2. Run "Noted: Search for Tag"
3. Select tag from quick pick
4. VS Code search opens with results

### Search Features

**Comprehensive Pattern:**
The search finds tags in all formats:
- Inline hashtags: `#bug`
- YAML array: `tags: [bug, feature]`
- YAML list: `- bug`

**Search Options:**
- **Regex enabled**: Finds tags with word boundaries
- **Case insensitive**: Finds `#Bug`, `#bug`, `#BUG`
- **File patterns**: Searches `**/*.{txt,md}` by default
- **Exclusions**: Skips `node_modules`, `.git` folders

**Preview and Navigate:**
1. Search results show line previews
2. Click result to jump to that line
3. Use `F4` / `Shift+F4` to cycle through results
4. Replace functionality available if needed

### Use Cases

**Use Case 1: Audit Tag Usage**
```
Search for #bug
Results: 25 occurrences across 12 files
Review all usages before making changes
```

**Use Case 2: Find and Replace**
```
Search for #bug
Replace with #defect
Preview changes before confirming
```

**Use Case 3: Context Analysis**
```
Search for #project/frontend
See all frontend-related notes
Analyze context and relationships
```

---

## Tag Management

### Rename Tag

**Command:** `Noted: Rename Tag`

Rename a tag across all notes using the command palette.

**Steps:**
1. Command Palette → "Noted: Rename Tag"
2. Enter old tag name (e.g., "bug")
3. Enter new tag name (e.g., "defect")
4. Confirms and renames all occurrences

**Features:**
- Validates tag names
- Shows count of affected notes
- Confirmation dialog for safety
- Rollback on error

### Merge Tags

**Command:** `Noted: Merge Tags`

Combine two tags into one.

**Steps:**
1. Command Palette → "Noted: Merge Tags"
2. Select target tag to keep (e.g., "bug")
3. Select source tag to merge (e.g., "defect")
4. Confirms and merges tags

**Result:**
```
Before: #bug (5 notes) + #defect (3 notes)
After:  #bug (8 notes), #defect removed
```

### Delete Tag

**Command:** `Noted: Delete Tag`

Remove a tag from all notes.

**Steps:**
1. Command Palette → "Noted: Delete Tag"
2. Select tag to delete
3. Confirm deletion
4. Tag removed from all occurrences

**Safety:**
- Shows count of affected notes
- Requires confirmation
- Rollback on error

### Export Tags

**Command:** `Noted: Export Tags to JSON`

Export all tag data to a JSON file.

**Output Format:**
```json
{
  "tags": [
    {
      "name": "bug",
      "count": 12,
      "notes": [
        "/path/to/note1.txt",
        "/path/to/note2.txt"
      ]
    }
  ],
  "exportDate": "2025-11-04T12:00:00.000Z"
}
```

**Use Cases:**
- Backup tag data
- Analyze tag usage
- Import into other tools
- Generate reports

---

## Hierarchical Tags

Use forward slashes (`/`) to create tag hierarchies.

### Syntax

```
#project               ← Parent
#project/frontend      ← Child
#project/backend       ← Child
#project/backend/auth  ← Grandchild
```

### Benefits

**1. Organization:**
```
#work/meetings
#work/projects
#work/notes

#personal/goals
#personal/ideas
#personal/journal
```

**2. Flexible Granularity:**
```
#bug                  ← Broad
#bug/frontend         ← Specific
#bug/frontend/ui      ← Very Specific
```

**3. Easy Filtering:**
- View all `#project` tags together
- Drill down to `#project/frontend`
- See relationships at a glance

### Future Enhancement

**Hierarchical Rename (Coming Soon):**
Renaming `#project` to `#work` will also rename:
- `#project/frontend` → `#work/frontend`
- `#project/backend` → `#work/backend`

This feature is implemented (`createHierarchicalRenameEdits()`) but not yet exposed in the UI.

---

## Best Practices

### Tagging Strategy

**1. Use Consistent Naming:**
```
Good: #bug, #feature, #urgent
Bad:  #Bug, #FEATURE, #urgent!
```

**2. Hierarchies for Projects:**
```
#myapp/frontend
#myapp/backend
#myapp/docs
```

**3. Status Tags:**
```
#status/todo
#status/in-progress
#status/done
```

**4. Time-Based Tags:**
```
#2025
#2025/q1
#2025/january
```

### Navigation Patterns

**Pattern 1: Top-Down Discovery**
1. Open Tags panel
2. Browse all tags
3. Expand interesting tag
4. See which files contain it
5. Review line references

**Pattern 2: Bottom-Up Search**
1. Place cursor on tag in note
2. Press F2 to see rename dialog
3. Cancel (just exploring)
4. Or: Right-click → Search for Tag

**Pattern 3: Maintenance**
1. Weekly: Review Tags panel
2. Merge similar tags (`#bug` + `#defect`)
3. Rename for consistency
4. Delete obsolete tags

### Performance Tips

**1. Tag Index Rebuilding:**
- Happens automatically when files change
- Manual refresh: Click refresh icon in Tags panel
- Incremental updates: Fast even with many tags

**2. Large Workspaces:**
- Tags are indexed once, then cached
- Line references loaded on-demand
- Context extraction happens lazily

---

## Migration from Old System

### What Changed in v1.36.0

**Removed Features:**
- ❌ Tag filtering in Notes view ("Filter by Tag" button)
- ❌ "Clear Filters" button
- ❌ Sort by frequency
- ❌ Multi-tag filtering (AND logic)

**New Features:**
- ✅ Hierarchical tag view (tags → files → references)
- ✅ F2 rename support
- ✅ Workspace search
- ✅ Character-level positioning
- ✅ Hierarchical tag support

### Migration Guide

**Old Workflow:**
```
1. Click tag in Tags panel
2. Notes view filters to show matching notes
3. Click "Clear Filters" to reset
```

**New Workflow:**
```
1. Click tag in Tags panel → Expands to show files
2. Expand file → Shows line references
3. Click line reference → Jumps to exact position
```

**Advantages:**
- **More precise**: Jump to exact line, not just file
- **Better context**: See snippets before opening
- **No state**: No filter state to manage
- **More discoverable**: Clear hierarchy, no hidden filtering

### Command Replacements

| Old Command | New Alternative |
|-------------|----------------|
| `noted.filterByTag` | Expand tag in Tags panel |
| `noted.clearTagFilters` | No longer needed |
| `noted.sortTagsByName` | Tags always alphabetical |
| `noted.sortTagsByFrequency` | Not available |

### Deprecated Commands

These commands still exist but show info messages:

```
noted.filterByTag
→ "Tag filtering has been replaced with the hierarchical tag view.
   Use the Tags panel to browse tags → files → line references."

noted.clearTagFilters
→ "Tag filtering has been removed.
   Use the hierarchical Tags panel for navigation."
```

---

## Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|--------------|-----|
| Rename tag at cursor | `F2` | `F2` |
| Open Command Palette | `Ctrl+Shift+P` | `Cmd+Shift+P` |
| Next search result | `F4` | `F4` |
| Previous search result | `Shift+F4` | `Shift+F4` |

**Note:** F2 rename is VS Code's standard rename shortcut - works automatically with tags!

---

## Troubleshooting

### Tag Not Found

**Problem:** Tag doesn't appear in Tags panel

**Solutions:**
1. Click refresh icon in Tags panel
2. Check tag format (lowercase, starts with letter)
3. Ensure tag is in `.txt` or `.md` file
4. Verify file is in notes folder

### F2 Rename Not Working

**Problem:** Pressing F2 doesn't open rename dialog

**Solutions:**
1. Ensure cursor is ON the tag (not just near it)
2. Check file is saved
3. Try right-click → "Rename Symbol"
4. Verify tag format is valid

### Workspace Search Missing Results

**Problem:** Search doesn't find all occurrences

**Solutions:**
1. Check search pattern in search box
2. Ensure case-insensitive is enabled
3. Verify file patterns include your files
4. Check exclusion patterns

### Performance Issues

**Problem:** Tags panel slow to load

**Solutions:**
1. Large workspace: Index builds on first load (one-time delay)
2. Click refresh only when needed
3. Close/reopen panel to reset
4. Check VS Code performance generally

---

## Advanced Tips

### Combine with Wiki Links

```markdown
Working on [[project-notes]] with #project/frontend tags.

See also: [[architecture]] #project/backend
```

Benefits:
- Links connect notes structurally
- Tags categorize notes thematically
- Both appear in Graph View

### Tag Templates

Create template with predefined tags:

```yaml
---
tags: [meeting, {team}, {date}]
---

# Meeting Notes - {date}

Attendees:
-

Agenda:
-
```

### Bulk Tagging Strategy

**Initial Setup:**
1. Create notes without tags (focus on content)
2. Weekly review: Add tags in batch
3. Use F2 to normalize tag names
4. Use workspace search to verify coverage

**Tag Maintenance:**
1. Monthly: Review all tags
2. Merge duplicates
3. Rename for consistency
4. Delete obsolete tags

### Integration with Graph View

Tags appear as nodes in Graph View:
- Tag nodes are smaller than note nodes
- Click tag node to see connected notes
- Use to visualize tag relationships
- Filter by tag in Graph View

---

## Frequently Asked Questions

### Q: Can I use uppercase in tags?

**A:** No, tags are automatically converted to lowercase. Use hyphens for readability: `#bug-fix` instead of `#BugFix`.

### Q: How do hierarchical tags work with rename?

**A:** Currently, renaming `#project` only renames that exact tag. The planned hierarchical rename feature will rename `#project/frontend` too, but it's not yet exposed in the UI.

### Q: Can I rename tags in bulk?

**A:** Yes! F2 rename already renames ALL occurrences across ALL files atomically. For multiple different renames, you'll need to do them one at a time.

### Q: Does F2 rename work in YAML frontmatter?

**A:** Yes! F2 works on both inline `#hashtags` and tags in YAML frontmatter arrays.

### Q: Can I search for tags with special characters?

**A:** Tags only support letters, numbers, hyphens, and forward slashes. No other special characters are allowed.

### Q: How do I see which notes have NO tags?

**A:** This isn't currently available, but you could use workspace search with a negative pattern or review files manually.

### Q: Can I export/import tags?

**A:** Export is available (`Noted: Export Tags to JSON`). Import is not yet implemented, but you can edit files manually or use find/replace.

### Q: What happens if I rename a tag that's in a closed file?

**A:** The rename still works! WorkspaceEdit applies to all files, even if they're not open.

### Q: Can I undo a tag rename?

**A:** Yes! Use VS Code's standard undo (Cmd+Z / Ctrl+Z) after a rename. All changes are undoable.

### Q: Does tag autocomplete work with hierarchical tags?

**A:** Yes! Typing `#project/` will show autocomplete suggestions for all `#project/*` tags.

---

## Getting Help

- **Documentation**: See `CLAUDE.md` for technical architecture
- **Features List**: See `notes.md` for complete feature list
- **Report Issues**: Use GitHub issues for bugs and feature requests
- **Ask Questions**: Use GitHub discussions for usage questions

---

## Summary

The redesigned tag system provides:
- ✅ **Hierarchical navigation**: tags → files → line references
- ✅ **F2 rename**: Standard VS Code workflow
- ✅ **Workspace search**: Find all occurrences
- ✅ **Precise positioning**: Character-level accuracy
- ✅ **Hierarchical support**: Use `/` for tag hierarchies
- ✅ **Tag management**: Rename, merge, delete, export
- ✅ **Autocomplete**: Type `#` for suggestions
- ✅ **Both formats**: Inline hashtags and YAML frontmatter

**Next Steps:**
1. Open Tags panel and explore existing tags
2. Try F2 rename on a tag
3. Use workspace search to find tag occurrences
4. Create hierarchical tags for your projects
5. Review and normalize tags monthly

Happy tagging! 🏷️
