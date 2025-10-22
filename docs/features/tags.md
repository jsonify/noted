---
layout: default
title: Tags System
---

# Tags System

Organize and discover your notes with a powerful inline tagging system that supports autocomplete, filtering, and advanced tag management.

## Overview

The tags system in Noted allows you to categorize and organize your notes using simple `#tagname` syntax. Unlike metadata-only tags, Noted supports inline tags that can appear anywhere in your notes.

## Adding Tags

### Tag Syntax

Simply type `#` followed by your tag name anywhere in your note:

```
2025-10-19
==================================================

Working on the new authentication feature today #backend #auth

Fixed bug in login form #bugfix #frontend

Next steps:
- Add tests #todo
- Update documentation #docs
```

### Tag Format

**Valid characters:**
- Letters (a-z, A-Z)
- Numbers (0-9)
- Hyphens (-)
- Underscores (_)

**Examples:**
- `#bug-fix`
- `#work_notes`
- `#project2024`
- `#meeting`

**Case insensitive:** `#Bug` and `#bug` are treated as the same tag.

### Inline Support

Tags work anywhere in your notes:
- In paragraphs
- In lists
- In headings
- In code comments (for `.md` files)
- At the end of lines
- Throughout your entire note

## Tag Autocomplete

Type `#` to trigger intelligent tag suggestions:

### How It Works

1. Type `#` anywhere in your note
2. Autocomplete suggestions appear
3. Suggestions are sorted by frequency (most-used first)
4. Navigate with arrow keys
5. Select with `Enter` or `Tab`

### Autocomplete Features

- Shows existing tags from all notes
- Displays usage count for each tag
- Sorted by frequency (most popular first)
- Updates in real-time as you create new tags
- Works in both `.txt` and `.md` files

### Disable Autocomplete

If you prefer not to use autocomplete:

1. Open Settings (`Cmd+,`)
2. Search for "Noted"
3. Uncheck "Tag AutoComplete"

## Tags View

The Tags panel in the sidebar shows all your tags at a glance.

### Tag Information

Each tag displays:
- Tag name
- Usage count (number of notes)
- Tag icon with count badge

### Tag Actions

**Click a tag** to filter notes by that tag

**Right-click a tag** for options:
- Filter by Tag
- Rename Tag
- Delete Tag

## Filtering by Tag

### Single Tag Filter

**From Tags View:**
1. Click any tag in the Tags panel
2. My Notes view filters to show only notes with that tag

**From Command Palette:**
1. Open Command Palette (`Cmd+Shift+P`)
2. Run "Noted: Filter Notes by Tag"
3. Select tag from list

### Multi-Tag Filtering

Filter notes that have **all** selected tags (AND logic):

1. Open Command Palette
2. Run "Noted: Filter Notes by Tag"
3. Select multiple tags
4. Only notes with **all** selected tags are shown

**Example:** Filtering by `#backend` AND `#auth` shows only notes that have both tags.

### Clear Filters

**Toolbar button:**
- Click "Clear Tag Filters" button (appears when filters active)

**Command Palette:**
- Run "Noted: Clear Tag Filters"

## Sorting Tags

Sort tags in the Tags view:

### Sort by Name (A-Z)

Click the "Sort by Name" button in Tags toolbar

- Alphabetical order
- Case-insensitive
- Great for finding specific tags

### Sort by Frequency

Click the "Sort by Frequency" button in Tags toolbar

- Most-used tags first
- Shows your most common categorizations
- Helps identify important topics

## Tag Management

### Rename Tag

Update a tag name across all notes:

1. Right-click tag in Tags view
2. Select "Rename Tag"
3. Enter new tag name
4. Confirms before updating
5. Updates all occurrences in all notes

**Validation:**
- Prevents duplicate tag names
- Ensures valid tag format
- Shows error if invalid

### Merge Tags

Combine two tags into one:

1. Open Command Palette
2. Run "Noted: Merge Tags"
3. Select tag to **keep**
4. Select tag to **merge into the kept tag**
5. All notes with merged tag get the kept tag
6. Duplicates are automatically removed

**Example:** Merge `#bug-fix` into `#bugfix`
- All `#bug-fix` tags become `#bugfix`
- Notes with both tags only show `#bugfix` once

### Delete Tag

Remove a tag from all notes:

1. Right-click tag in Tags view
2. Select "Delete Tag"
3. Confirm deletion
4. Tag removed from all notes

**Features:**
- Confirmation dialog before deletion
- Shows number of affected notes
- Rollback support if errors occur
- Updates tags view automatically

### Export Tags

Export all tags with metadata to JSON:

1. Open Command Palette
2. Run "Noted: Export Tags to JSON"
3. Choose export location
4. JSON file created with:
   - Export date and timestamp
   - Total tag count
   - Each tag with:
     - Name
     - Usage count
     - List of notes containing the tag

**Use cases:**
- Backup tag data
- External analysis
- Migration to other tools
- Statistics and reporting

## Tag Statistics

View tag usage at a glance:

### In Tags View

Each tag shows usage count indicating number of notes containing that tag.

### Most Popular Tags

Sort by frequency to see your most-used tags first.

### In Search Results

Search results show all tags for each matching note.

## Common Tag Workflows

### Project Organization

```
Working on user authentication #project-alpha #backend
Designing new dashboard #project-alpha #frontend #design
```

Filter by `#project-alpha` to see all related notes.

### Task Management

```
Need to refactor the database layer #todo #refactoring
Bug in payment processing #bug #critical #backend
Code review for PR #42 #review
```

Filter by `#todo` to see all pending tasks.

### Topic Categorization

```
Learned about React hooks today #learning #react #frontend
Performance optimization notes #performance #optimization
Meeting notes with design team #meeting #design
```

Filter by `#learning` to review educational notes.

### Status Tracking

```
Started implementation #in-progress
Completed and tested #done
Waiting for feedback #blocked
```

Filter by `#in-progress` to see active work.

### Multi-Tag Organization

Combine tags for powerful organization:

```
Fixing login redirect bug #bug #auth #high-priority #sprint-12
```

Filter by `#bug` + `#high-priority` to see critical issues.

## Advanced Features

### Tag Search Integration

Use tags in advanced search:

```
tag:backend tag:auth authentication
```

Combines tag filtering with text search.

### Tag-Based Export

Export notes by tag:

```
from:2025-01-01 tag:meeting
```

Export all meeting notes from 2025.

### Tag in Graph View

Graph View shows tag-based connections:
- Color-code notes by primary tag
- Filter graph by specific tags
- Visualize tag clusters

## Best Practices

### Tag Naming

- Use descriptive, clear names
- Keep names short but meaningful
- Use hyphens for multi-word tags (`#code-review`)
- Be consistent with naming conventions

### Tag Hierarchy

While Noted doesn't support hierarchical tags yet, you can use naming conventions:

```
#project-alpha
#project-alpha-backend
#project-alpha-frontend
```

### Tag Quantity

- Don't over-tag (3-5 tags per note is usually sufficient)
- Tag for discoverability, not exhaustiveness
- Focus on tags you'll actually filter by

### Tag Maintenance

- Periodically review and merge similar tags
- Delete obsolete tags
- Rename tags for clarity as projects evolve
- Export tags for backup

## Tips & Tricks

### Quick Tagging

- Use autocomplete to avoid typos
- Create a "tagging template" for consistent tags
- Tag as you write, not afterwards

### Finding Untagged Notes

1. Use Graph View to find orphaned notes
2. Review Recent Notes for new notes without tags
3. Search for notes without common tags

### Tag Combinations

Develop a tagging system:
- **Type**: `#bug`, `#feature`, `#docs`
- **Status**: `#todo`, `#in-progress`, `#done`
- **Project**: `#project-alpha`, `#project-beta`
- **Priority**: `#high-priority`, `#low-priority`

Then filter by combinations like `#bug` + `#high-priority` + `#project-alpha`

---

[← Back: Wiki-Style Links]({{ '/features/wiki-links' | relative_url }}) | [Next: Templates →]({{ '/features/templates' | relative_url }})
