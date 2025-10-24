---
layout: default
title: Search & Filter
parent: User Guide
nav_order: 6
---

# Search & Filter

Find exactly what you need with powerful search, filters, and navigation tools.

## Quick Switcher

The fastest way to access recent notes.

### Opening Quick Switcher

**Command:**
- Run `Noted: Quick Switcher (Recent Notes)`
- Or click Quick Switcher button in My Notes toolbar

**Shows:**
- 20 most recently modified notes
- File names and paths
- Modification dates
- Tags for each note
- Content previews

### Using Quick Switcher

**Navigate with keyboard:**
1. Open Quick Switcher
2. Type to filter results
3. Arrow keys to select
4. Enter to open note

**Quick access patterns:**
- Resume work from yesterday
- Jump between active project notes
- Check recent meeting notes
- Find that note you just edited

**Best for:**
- Notes you touched today or this week
- Quick context switching
- Recently created notes

## Advanced Search

Search across all note content with powerful filters.

### Basic Search

**Open search:**
1. Run `Noted: Search Notes` from Command Palette
2. Or click search icon in My Notes toolbar
3. Enter search query
4. View results with previews

**Search features:**
- Full-text search across all notes
- Content preview showing matching lines
- Match count per note
- Tags and modification date shown
- Click result to open note

### Search Filters

Add special filter keywords to refine searches:

#### Tag Filter

Find notes with specific tags:

```
tag:backend
tag:backend tag:api
tag:meeting tag:urgent
```

**Multiple tags:**
- Uses AND logic
- Note must have all specified tags
- `tag:bug tag:critical` finds notes tagged with both

#### Date Range Filters

Find notes by modification date:

**After a date:**
```
from:2025-10-01
```

**Before a date:**
```
to:2025-10-31
```

**Between dates:**
```
from:2025-10-01 to:2025-10-31
```

**Date format:** `YYYY-MM-DD`

#### Regex Search

Use regular expressions for pattern matching:

```
regex: bug.*fix
regex: (error|exception|failure)
regex: TODO.*urgent
```

**Common patterns:**
- `bug.*fix` - "bug" followed by "fix"
- `\d{3}-\d{4}` - Pattern like "123-4567"
- `(feature|enhancement)` - Either word
- `^# ` - Lines starting with "# "

#### Case-Sensitive Search

Enable exact case matching:

```
case: TODO
case: BUG-
```

**Default:** Search is case-insensitive
**With case:**: Must match exact case

### Combined Filters

Use multiple filters together:

**Example 1:**
```
tag:backend tag:api from:2025-10-01 authentication
```

Finds:
- Notes tagged with both `#backend` and `#api`
- Modified after Oct 1, 2025
- Containing "authentication"

**Example 2:**
```
regex: tag:bug case: ERROR from:2025-10-20
```

Finds:
- Tagged with `#bug`
- Contains "ERROR" (exact case)
- Modified after Oct 20
- Matching regex pattern

**Example 3:**
```
tag:meeting from:2025-10-01 to:2025-10-31 Q4
```

Finds:
- Meeting notes from October 2025
- Containing "Q4"

### Search Results

**Results display:**
- **Note name** with full path
- **Match count** (e.g., "3 matches")
- **Tags** from the note
- **Modified date**
- **Content preview** showing matching lines
- **Context** (surrounding text)

**Sorting:**
- Results sorted by modification date
- Newest notes first
- Most relevant matches highlighted

**Navigate results:**
- Click any result to open note
- Use arrow keys in quick pick
- Press Enter to open selected

## Filter by Tag

Focus on notes with specific tags.

### Single Tag Filter

**From Tags View:**
1. Click any tag in Tags panel
2. My Notes filters to show only notes with that tag
3. "Clear Tag Filters" button appears

**From Command:**
1. Run `Noted: Filter Notes by Tag`
2. Select tag from list
3. View filtered results

**Effect:**
- My Notes tree shows only matching notes
- Other notes hidden temporarily
- Tag filter indicator visible
- Click "Clear Tag Filters" to restore

### Multi-Tag Filter

Filter by multiple tags (AND logic):

1. Run `Noted: Filter Notes by Tag`
2. Select first tag
3. Select additional tags
4. Only notes with **all** tags shown

**Example:**
- Filter by `#backend` AND `#critical`
- Shows only notes tagged with both
- Useful for finding specific combinations

### Clear Tag Filters

**Remove active filters:**
- Click "Clear Tag Filters" button in toolbar
- Or run `Noted: Clear Tag Filters` command
- All notes become visible again

## Calendar View Navigation

Visual date-based navigation.

### Using Calendar View

**Open calendar:**
- Run `Noted: Show Calendar View` from Command Palette
- Or click calendar icon in My Notes toolbar

**Navigate by date:**
1. See monthly calendar
2. Days with notes are highlighted
3. Click any date to see notes
4. Notes list appears below calendar
5. Click note to open

**Month navigation:**
- Previous/Next month buttons
- "Today" button to jump to current date
- Visual indicators for days with notes

**Best for:**
- Finding notes from specific dates
- Reviewing past week/month
- Identifying gaps in note-taking
- Creating notes for future dates

[Full Calendar View guide]({{ '/features/calendar' | relative_url }})

## Graph View Exploration

Visual network exploration.

### Opening Graph View

**Open graph:**
- Run `Noted: Show Graph View` from Command Palette
- Or click graph icon in My Notes toolbar

### Finding Notes in Graph

**Search box:**
- Type note name
- Graph filters to matching notes
- Updates in real-time

**Connection filter:**
- **All Notes:** Everything
- **Connected Only:** Notes with links
- **Orphans Only:** Isolated notes

**Time-based filtering:**
- **Today** - Notes from today
- **Last 7 Days** - Recent notes
- **Last 30 Days** - Past month
- **Custom Range** - Specific dates
- Filter by **Created** or **Modified**

**Visual indicators:**
- **Node size:** More connections = larger
- **Node color:** Gray=orphan, Green/Blue/Orange/Red=connection count
- **Edge thickness:** Bidirectional links thicker

### Graph Navigation

**Interact with graph:**
- **Click node** to open note
- **Drag nodes** to reposition
- **Zoom/pan** to navigate
- **Hover** for note details

**Focus mode:**
- Right-click node to focus
- Shows only immediate connections
- Reduces visual clutter
- Exit to restore full graph

[Full Graph View guide]({{ '/features/graph' | relative_url }})

## Search Strategies

### Finding Specific Content

**Known phrase:**
```
"exact phrase in quotes"
```

**Keyword combination:**
```
authentication OAuth setup
```

**Technical patterns:**
```
regex: (bug|issue|problem).*\d+
```

### Finding By Context

**Project notes:**
```
tag:project-alpha
```

**Recent work:**
```
from:2025-10-20 tag:in-progress
```

**Meeting notes:**
```
tag:meeting from:2025-10-01 to:2025-10-31
```

### Finding Todos

**All todos:**
```
TODO
- [ ]
```

**Urgent todos:**
```
tag:todo tag:urgent
TODO.*urgent
```

**Recent todos:**
```
from:2025-10-20 TODO
```

### Finding By Status

**Using tags:**
```
tag:in-progress
tag:blocked
tag:completed
```

**Using text:**
```
regex: status:.*complete
```

## Combining Search Methods

### Search → Filter → Navigate

**Workflow:**
1. **Search** for broad topic
2. **Filter by tag** to narrow
3. **Use Calendar** to find specific date
4. **Check Graph** to see relationships

**Example:**
1. Search: `authentication`
2. Filter: `tag:backend`
3. Calendar: Check October dates
4. Graph: See connected notes

### Quick Switcher + Search

**For recent notes:**
- Use Quick Switcher (20 most recent)

**For older notes:**
- Use Search with date filters

### Tags + Links + Search

**Workflow:**
1. **Tag** notes consistently
2. **Link** related notes
3. **Search** by tag to find all
4. **Follow links** to navigate
5. **Graph** to visualize

## Search Tips

### Effective Queries

**Be specific:**
- ✅ `tag:bug tag:critical authentication error`
- ❌ `error`

**Use appropriate filters:**
- Date ranges for temporal searches
- Tags for categorical searches
- Regex for pattern matching

**Combine methods:**
- Search finds content
- Tags categorize
- Links connect
- Calendar shows temporal

### Search Workflow

**Daily:**
- Quick Switcher for recent notes

**Weekly:**
- Search with date range for week

**Project:**
- Filter by project tag
- Search within results

**Research:**
- Search for topic
- Follow links in results
- Build network

## Advanced Techniques

### Saved Searches

**Create reference notes:**
```markdown
# Saved Searches

## Critical Bugs
tag:bug tag:critical

## This Month's Meetings
tag:meeting from:2025-10-01 to:2025-10-31

## In Progress Work
tag:in-progress tag:backend
```

Copy/paste queries as needed.

### Search Patterns

**Development:**
```
tag:development regex: (bug|feature|refactor)
```

**Documentation:**
```
tag:docs regex: TODO|FIXME
```

**Planning:**
```
tag:planning from:2025-10-01
```

### Regex Patterns

**Issue numbers:**
```
regex: #\d+
regex: BUG-\d+
regex: ISSUE-\d+
```

**Action items:**
```
regex: - \[ \].*urgent
regex: TODO.*@\w+
```

**Code references:**
```
regex: `[^`]+`
regex: function \w+
```

## Troubleshooting

### No Results Found

**Check:**
- Spelling in query
- Tag names are correct
- Date format is YYYY-MM-DD
- Filters aren't too restrictive

**Try:**
- Broader search terms
- Remove some filters
- Check different date ranges

### Too Many Results

**Narrow with:**
- Add more tags
- Use date range
- Add specific keywords
- Use case-sensitive search

### Search Slow

**For large workspaces:**
- Use specific filters first
- Narrow date range
- Filter by tag before text search
- Use Quick Switcher for recent notes

### Can't Find Known Note

**Check:**
- Archive section (might be archived)
- Tag filters (might be active)
- Spelling of search terms
- File actually exists (tree view)

## Related Features

- [Tags System]({{ '/features/tags' | relative_url }}) - Organizing with tags
- [Calendar View]({{ '/features/calendar' | relative_url }}) - Date-based navigation
- [Graph View]({{ '/features/graph' | relative_url }}) - Visual exploration
- [Search & Discovery]({{ '/features/search' | relative_url }}) - Full search features

---

[← Back: Linking Notes]({{ '/user/linking-workflow' | relative_url }}) | [Next: Troubleshooting →]({{ '/user/troubleshooting' | relative_url }})
