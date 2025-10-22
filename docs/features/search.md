---
layout: default
title: Search & Discovery
---

# Search & Discovery

Find exactly what you need with powerful search capabilities, advanced filters, and quick navigation tools.

## Advanced Search

### Basic Search

Search across all notes with full-text search:

1. Open Command Palette (`Cmd+Shift+P`)
2. Run "Noted: Search Notes"
3. Enter search query
4. View results with previews
5. Click result to open note

### Search Filters

Enhance your search with special filter keywords:

#### Regex Search

Use `regex:` flag for pattern matching:

```
regex: bug.*fix
```

Matches: "bug fix", "bugfix", "bug-fix", etc.

#### Case-Sensitive Search

Use `case:` flag for exact case matching:

```
case: TODO
```

Matches only "TODO", not "todo" or "Todo"

#### Tag Filtering

Use `tag:` to filter by specific tags:

```
tag:backend tag:api
```

Shows only notes with both `#backend` and `#api` tags

#### Date Range Filtering

**From Date:**

Use `from:YYYY-MM-DD` to show notes after a date:

```
from:2025-01-01
```

**To Date:**

Use `to:YYYY-MM-DD` to show notes before a date:

```
to:2025-01-31
```

**Date Range:**

Combine both for a specific range:

```
from:2025-01-01 to:2025-01-31
```

### Combined Filters

Combine multiple filters for powerful searches:

```
regex: tag:work from:2025-01-01 authentication.*error
```

Finds notes:
- Tagged with `#work`
- Modified after Jan 1, 2025
- Matching pattern "authentication...error"

```
case: tag:bug tag:critical from:2025-10-01 BUG-
```

Finds critical bugs from October 2025 with "BUG-" prefix

### Search Results

Results display:
- **Note name** with path
- **Match count** (number of matches in note)
- **Tags** associated with note
- **Modified date**
- **Preview** of matching content
- **Context** showing surrounding text

Results are sorted by modification date (newest first)

## Quick Switcher

Instantly access your most recent notes.

### Opening Quick Switcher

1. Open Command Palette (`Cmd+Shift+P`)
2. Run "Noted: Quick Switcher (Recent Notes)"
3. Shows 20 most recently modified notes

Or use toolbar button in My Notes view

### Quick Switcher Features

- Shows 20 most recent notes
- Displays tags for each note
- Shows modification date
- Content preview
- Searchable by filename, tags, or content
- Fast keyboard navigation

### Use Cases

**Return to active work:**
- Jump back to notes you were just editing
- Resume where you left off

**Navigate related notes:**
- Quickly switch between project notes
- Access recently tagged items

**Review recent activity:**
- See what you've been working on
- Track daily progress

## Filter by Tag

### Single Tag Filtering

**From Tags View:**
1. Click tag in Tags panel
2. My Notes filters to show only notes with that tag

**From Command:**
1. Run "Noted: Filter Notes by Tag"
2. Select tag from list

### Multi-Tag Filtering

Filter by multiple tags (AND logic):

1. Run "Noted: Filter Notes by Tag"
2. Select multiple tags
3. Shows only notes with **all** selected tags

Example: Filter by `#backend` AND `#auth` shows only notes with both tags

### Clear Tag Filters

**Toolbar button:**
- Click "Clear Tag Filters" (appears when filters active)

**Command:**
- Run "Noted: Clear Tag Filters"

## Calendar View

Visual navigation for daily notes.

### Opening Calendar

1. Run "Noted: Show Calendar View"
2. Or click calendar icon in My Notes toolbar

### Calendar Features

**Visual indicators:**
- Days with notes are highlighted
- Current day has special border
- Multiple notes per day supported

**Interactive:**
- Click any date to see notes for that day
- Click note to open it
- Create new notes from calendar

**Navigation:**
- Previous/Next month buttons
- "Today" button to jump to current date
- Month and year display

### Creating Notes from Calendar

1. Select date
2. Click "Create Note for [Date]"
3. Or "Create Another Note" if notes exist
4. New note created for that date

## Graph View

Visualize connections between notes.

### Opening Graph View

1. Run "Noted: Show Graph View"
2. Or click graph icon in My Notes toolbar

### Graph Features

**Interactive:**
- Click nodes to open notes
- Drag nodes to reposition
- Zoom and pan to navigate

**Layouts:**
- Force-Directed (natural clusters)
- Hierarchical (tree structure)
- Circular (ring arrangement)

**Filters:**
- Search for specific notes
- Show all/connected/orphans only
- Filter by connection count

**Visual encoding:**
- Node size: Based on connection count
- Node color: By connection level (gray=orphan, green=light, blue=moderate, orange=well-connected, red=hub)
- Edge width: Thicker for bidirectional links

**Statistics:**
- Total notes
- Total links
- Orphan count
- Average connections

[Learn more about Graph View]({{ '/features/graph' | relative_url }})

## Search Tips

### Effective Queries

**Be specific:**
```
tag:backend authentication error
```

Better than:
```
error
```

**Use regex for patterns:**
```
regex: (bug|issue|problem).*fix
```

**Combine filters:**
```
tag:meeting from:2025-10-01 to:2025-10-31
```

### Search Strategies

**Find recent notes on topic:**
```
from:2025-10-01 api design
```

**Find all notes in project:**
```
tag:project-alpha
```

**Find urgent items:**
```
tag:todo tag:high-priority
```

**Find patterns:**
```
regex: TODO|FIXME|HACK
```

## Best Practices

### Tagging for Search

- Tag notes consistently
- Use descriptive tags
- Don't over-tag (3-5 tags per note)
- Create tag standards for teams

### Naming Conventions

- Use clear, descriptive note names
- Include keywords in content
- Front-load important information

### Regular Reviews

- Use Quick Switcher to review recent work
- Check Calendar View for gaps
- Use Graph View to find orphaned notes
- Search for `#todo` periodically

---

[← Back: Templates]({{ '/features/templates' | relative_url }}) | [Next: Graph View →]({{ '/features/graph' | relative_url }})
