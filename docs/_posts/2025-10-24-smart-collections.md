---
title: Smart Collections
date: 2025-10-24 08:00:00 -0800
categories: [Features, Organization]
tags: [search, collections, filters, saved-searches]
---

# What are Smart Collections?

Smart Collections are saved search queries that automatically update as your notes change. Think of them as dynamic folders that organize notes based on criteria you define - tags, dates, content patterns, and more.

### Think of it like this:

Instead of manually dragging notes into folders, you define rules like:
- "Show me all notes tagged `#bug` from this month"
- "Show me all meeting notes with action items"
- "Show me my learning notes from the last week"

Then the collection **automatically shows** all matching notes - and updates when you create or edit notes!

## Quick Start

Let's create your first Smart Collection in 3 easy steps:

### Step 1: Open the Command
Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux) to open the Command Palette, then type:
```
Noted: Create Smart Collection
```
Press Enter.

### Step 2: Fill in the Details
You'll see a series of prompts:

**Prompt 1 - Collection Name:**
```
Work Notes This Month
```
This is what you'll see in your Collections sidebar.

**Prompt 2 - Search Query:**
```
tag:work from:2025-10-01
```
This filters for notes tagged with `#work` created since October 1st.

**Prompt 3 - Description (optional):**
```
All work-related notes from this month
```
Press Enter to skip, or add a description for reference.

**Prompt 4 - Icon (optional):**
```
🚀
```
Choose from 10 icons or press Enter to use the default 🔍.

**Prompt 5 - Pin Collection? (yes/no):**
```
yes
```
Type `yes` to pin it to the top of your Collections sidebar for quick access.

### Step 3: Find Your Collection
Look in the **Collections** sidebar panel (in the Noted activity bar on the left). You'll see:

```
Collections View
  ├── 📌 Pinned Collections
  │   └── 🚀 Work Notes This Month (15)
```

**Click on the collection** to see all matching notes! The number `(15)` shows how many notes match your query.

The collection **updates automatically** as you create or modify notes - no manual refresh needed!

**Tip**: Pin frequently-used collections to keep them at the top of the sidebar.

## Why Use Smart Collections?

**Problem**: Manually organizing hundreds of notes into folders is time-consuming and inflexible.

**Solution**: Smart Collections automatically group notes by any criteria you choose.

**Benefits:**
- Auto-update as notes change
- Multiple views of the same notes (one note can appear in many collections)
- Powerful filtering with all Advanced Search features
- Save time with pre-built queries
- Quick access to important note sets

## Creating Collections

### Basic Collection

Create a simple collection that shows all notes:

1. Run command: `Noted: Create Smart Collection`
2. Enter when prompted:
   - **Name:** `Recent Notes`
   - **Query:** *(press Enter to leave empty - shows all notes)*
   - **Description:** `All notes sorted by date`
   - **Icon:** `📜`
   - **Pin:** `yes`

### Collection with Tag Filter

Filter notes by a specific tag:

1. Run command: `Noted: Create Smart Collection`
2. Enter when prompted:
   - **Name:** `Backend Work`
   - **Query:** `tag:backend`
   - **Description:** `All backend development notes`

### Collection with Date Range

Filter notes by date:

1. Run command: `Noted: Create Smart Collection`
2. Enter when prompted:
   - **Name:** `This Week`
   - **Query:** `from:2025-10-20`
   - **Description:** `Notes from the last 7 days`

### Advanced Collection

Combine multiple filters (tags + dates):

1. Run command: `Noted: Create Smart Collection`
2. Enter when prompted:
   - **Name:** `Critical Backend Bugs`
   - **Query:** `tag:backend tag:bug tag:critical from:2025-10-01`
   - **Description:** `High-priority backend bugs this month`
   - **Icon:** `🔥`
   - **Pin:** `yes`

## Collection Query Syntax

Collections use the same powerful query syntax as Advanced Search.

### Tag Filters

**Single tag:**
```
tag:backend
```

**Multiple tags (AND):**
```
tag:backend tag:security
```

All notes must have BOTH tags.

### Date Filters

**From date (inclusive):**
```
from:2025-10-01
```

**To date (inclusive):**
```
to:2025-10-31
```

**Date range:**
```
from:2025-10-01 to:2025-10-31
```

**Date format**: `YYYY-MM-DD` (ISO 8601)

### Text Search

**Simple text:**
```
authentication
```

**Multiple words:**
```
authentication oauth
```

### Regex Patterns

**Bug numbers:**
```
regex: bug-\d+
```

**Feature or bug:**
```
regex: (feature|bug).*auth
```

**TODO items:**
```
regex: - \[ \]
```

### Case Sensitivity

**Case-sensitive matching:**
```
case:true Authentication
```

Default is case-insensitive.

### Combining Filters

Mix and match any filters:

```
tag:backend from:2025-10-01 regex: bug-\d+
```

This finds:
- Notes with `#backend` tag
- Modified since Oct 1, 2025
- Containing patterns like "bug-123"

## Managing Collections

### Running a Collection

**From Collections View:**
```
Right-click collection → Run Collection
```

**Shows:**
- All matching notes
- Number of matches
- Preview of content
- Click to open note

**From Command Palette:**
```
Command: Noted: Run Collection
Select: Collection name
```

### Editing a Collection

**Change name, query, or description:**
```
Right-click collection → Edit Collection
Update: Name, query, or description
```

**Example**: Update date range for "This Month" collection each month.

### Pinning Collections

**Pin to top:**
```
Right-click collection → Pin/Unpin Collection
```

**Pinned section:**
```
Collections View
  ├── 📌 Pinned Collections
  │   ├── Critical Bugs (5)
  │   ├── This Week (23)
  │   └── Work Notes (45)
  └── Collections
      ├── Archive (120)
      └── Learning Notes (18)
```

### Duplicating Collections

**Create variations:**
```
Right-click collection → Duplicate Collection
```

Use to:
- Create similar collections with different filters
- Make a backup before editing
- Create monthly variations (This Month → Last Month)

### Deleting Collections

```
Right-click collection → Delete Collection
Confirm deletion
```

**Note**: Deleting a collection doesn't delete any notes - it only removes the saved query.

### Refreshing Collections

```
Command: Noted: Refresh Collections
```

Rebuilds the collections view. Use if:
- Collections seem out of sync
- New collections don't appear
- Counts are incorrect

## Collection Icons

Choose from 10 built-in icons:

| Icon | Name | Best For |
|------|------|----------|
| 🔍 | Search | General collections |
| 📁 | Folder | Organized groups |
| 🏷️ | Tag | Tag-based collections |
| 📅 | Calendar | Date-based collections |
| ⭐ | Star | Favorites |
| 🔖 | Bookmark | Reading lists |
| ❤️ | Heart | Personal favorites |
| 🔥 | Flame | Urgent/hot items |
| ⚡ | Zap | Quick actions |
| 🚀 | Rocket | Projects |

## Save Current Search as Collection

Found a search query you use often? Save it as a collection!

### How to Save a Search

1. **Run a search:**
   - Open Command Palette (`Cmd+Shift+P`)
   - Run: `Noted: Search Notes`
   - Enter query: `tag:meeting from:2025-10-01`

2. **Review the results** to make sure the query finds what you want

3. **Save as collection:**
   - Open Command Palette again (`Cmd+Shift+P`)
   - Run: `Noted: Save Current Search as Collection`
   - When prompted:
     - **Name:** `October Meetings`
     - **Description:** `Meetings from October`
     - **Icon:** Choose one or press Enter
     - **Pin:** `yes` or `no`

The collection is created instantly with your search query already filled in!

## Pre-Built Collection Ideas

### Time-Based Collections

**This Week:**
```
Name: This Week
Query: from:2025-10-20
```

**This Month:**
```
Name: This Month
Query: from:2025-10-01
```

**Last Quarter:**
```
Name: Q3 2024
Query: from:2024-07-01 to:2024-09-30
```

### Status Collections

**Recent Changes:**
```
Name: Recently Modified
Query: from:2025-10-20
Description: Notes modified since Oct 20. Update the date as needed.
```

**Note**: For untagged notes and orphaned notes, use the dedicated Orphans & Placeholders panel rather than Smart Collections, as these require special detection that cannot be expressed as search queries.

### Project Collections

**Project Alpha:**
```
Name: Project Alpha
Query: tag:project-alpha
```

**Active Projects:**
```
Name: Active Projects
Query: tag:project tag:active
```

**Project Meetings:**
```
Name: Project Meetings
Query: tag:project-alpha tag:meeting
```

### Bug Tracking

**All Bugs:**
```
Name: All Bugs
Query: tag:bug
```

**Open Bugs:**
```
Name: Open Bugs
Query: tag:bug tag:open
```

**Critical Bugs:**
```
Name: Critical Bugs
Query: tag:bug tag:critical
Pin: Yes
```

**Recent Bugs:**
```
Name: New Bugs
Query: tag:bug from:2025-10-01
```

### Learning & Reference

**Learning Notes:**
```
Name: Learning Log
Query: tag:learning
```

**Study This Week:**
```
Name: Recent Learning
Query: tag:learning from:2025-10-20
```

**JavaScript Learning:**
```
Name: JavaScript
Query: tag:learning javascript
```

**Reference Material:**
```
Name: Reference Docs
Query: tag:reference
```

### Meeting Notes

**All Meetings:**
```
Name: All Meetings
Query: tag:meeting
```

**Team Meetings:**
```
Name: Team Meetings
Query: tag:meeting tag:team
```

**This Month's Meetings:**
```
Name: October Meetings
Query: tag:meeting from:2025-10-01 to:2025-10-31
```

**Meetings with Action Items:**
```
Name: Action Items
Query: tag:meeting regex: - \[ \]
Description: Meetings with open TODOs
```

## Use Cases

### Personal Knowledge Management

**Organize by topic:**
```
Collections:
- Programming (tag:programming)
- Design (tag:design)
- Productivity (tag:productivity)
- Learning (tag:learning)
```

**Organize by status:**
```
Collections:
- Inbox (tag:inbox)
- In Progress (tag:in-progress)
- Done (tag:done)
- Archive (tag:archive)
```

### Project Management

**Organize by project:**
```
Collections:
- Project Alpha (tag:project-alpha)
- Project Beta (tag:project-beta)
- Infrastructure (tag:infrastructure)
```

**Organize by priority:**
```
Collections:
- 🔴 Urgent (tag:urgent)
- 🟡 High Priority (tag:high-priority)
- 🟢 Low Priority (tag:low-priority)
```

### Development Workflow

**Track work items:**
```
Collections:
- 🐛 Bugs (tag:bug)
- ✨ Features (tag:feature)
- 🔧 Tech Debt (tag:tech-debt)
- 📝 Documentation (tag:docs)
```

**Track progress:**
```
Collections:
- 📋 Backlog (tag:backlog)
- 🚧 In Progress (tag:in-progress)
- ✅ Done This Week (tag:done from:2025-10-20)
```

### Research & Writing

**Research stages:**
```
Collections:
- 🔍 Research Notes (tag:research)
- 📊 Data Analysis (tag:analysis)
- ✍️ Drafts (tag:draft)
- 📚 Published (tag:published)
```

**By topic:**
```
Collections:
- AI/ML (tag:ai tag:machine-learning)
- Security (tag:security)
- Performance (tag:performance)
```

## Best Practices

### 1. Start Small

Begin with 3-5 essential collections:
- Recent Notes (no filter)
- This Week (from:recent-date)
- Your main project (tag:project-name)
- Urgent items (tag:urgent)

Add more as needed.

### 2. Pin Important Collections

Pin collections you use daily:
- Active project collections
- Urgent/priority collections
- Inbox or processing queues

Keep unpinned collections for occasional use.

### 3. Use Descriptive Names

**Good names:**
- "Backend Bugs This Quarter"
- "Team Meetings October"
- "Unprocessed Inbox Items"

**Avoid:**
- "Collection 1"
- "Notes"
- "Stuff"

### 4. Update Date Filters Regularly

**Monthly collections:**
```
"This Month" → Update from: date each month
```

**Or create specific collections:**
```
"October 2024" → from:2024-10-01 to:2024-10-31
"November 2024" → from:2024-11-01 to:2024-11-30
```

### 5. Combine with Tags

Use consistent tagging for effective collections:

```
Tag strategy:
- Project: #project-alpha, #project-beta
- Type: #bug, #feature, #meeting
- Status: #todo, #in-progress, #done
- Priority: #urgent, #high, #low

Collections:
- "Alpha Urgent" → tag:project-alpha tag:urgent
- "Alpha Bugs" → tag:project-alpha tag:bug
- "Done This Week" → tag:done from:2025-10-20
```

### 6. Use Icons Consistently

**Icon conventions:**
- 🔥 Flame → Urgent/High Priority
- 🚀 Rocket → Projects
- 📅 Calendar → Date-based collections
- 🏷️ Tag → Tag-based collections
- ⭐ Star → Favorites
- ⚡ Zap → Quick actions
- 🔖 Bookmark → Reading lists
- 🔍 Search → General searches

### 7. Review & Prune Regularly

**Monthly review:**
1. Delete unused collections
2. Update date ranges
3. Refine queries based on usage
4. Check if collections still serve your workflow

## Advanced Tips

### Dynamic Date Collections

Create collections that stay relevant:

**Last 7 Days:**
```
Query: from:2025-10-20
Update: Change date weekly
```

**Or use specific periods:**
```
"Week 42" → from:2024-10-14 to:2024-10-20
"Week 43" → from:2024-10-21 to:2024-10-27
```

### Multi-Layer Organization

Create hierarchical collections:

**Level 1 - Project:**
```
Project Alpha (tag:project-alpha)
```

**Level 2 - Status:**
```
Alpha - In Progress (tag:project-alpha tag:in-progress)
Alpha - Done (tag:project-alpha tag:done)
```

**Level 3 - Type:**
```
Alpha Bugs (tag:project-alpha tag:bug)
Alpha Features (tag:project-alpha tag:feature)
```

### Collection Templates

Create collection templates in a reference note:

```markdown
# Collection Templates

## New Project Template
Name: [Project Name]
Query: tag:project-[name]
Description: All notes for [Project Name]
Icon: Rocket
Pin: Yes

## Sprint Template
Name: Sprint [Number]
Query: tag:sprint-[number] from:[start-date] to:[end-date]
Description: Sprint [number] - [dates]
Icon: Calendar
Pin: Yes during sprint

## Weekly Review Template
Name: Week of [Date]
Query: from:[monday] to:[sunday]
Description: All notes from week of [date]
Icon: Calendar
Pin: No
```

### Regex Power Patterns

**Find TODO items:**
```
Query: regex: - \[ \]
```

**Find completed items:**
```
Query: regex: - \[x\]
```

**Find specific patterns:**
```
Query: regex: bug-\d+   (bug-123, bug-456)
Query: regex: #\d+      (GitHub issue numbers)
Query: regex: v\d+\.\d+  (version numbers)
```

### Combination Collections

**Active high-priority work:**
```
Query: tag:in-progress tag:high-priority from:2025-10-01
```

**Recent team meetings with action items:**
```
Query: tag:meeting tag:team regex: - \[ \] from:2025-10-01
```

## Troubleshooting

### Collection Shows No Results

**Check:**
1. Query syntax is correct
2. Tags are spelled correctly
3. Date format is `YYYY-MM-DD`
4. Files match all combined filters
5. Files are saved (unsaved changes not indexed)

**Try:**
- Simplify query (remove filters one by one)
- Run query in Advanced Search first
- Verify tags exist in Tags view

### Collection Shows Wrong Results

**Check:**
1. Query combines filters correctly
2. Date range is what you expect
3. Tag filters use AND logic (all tags required)
4. Regex pattern is valid

**Fix:**
- Edit collection and review query
- Test query in Advanced Search
- Check recent file modifications

### Collection Not Updating

**Cause**: Collections auto-update, but may need refresh.

**Fix:**
```
Command: Noted: Refresh Collections
```

Or:
- Close and reopen VS Code
- Save the note you expect to appear
- Rebuild tag index: `Noted: Refresh Tags`

### Too Many Collections

**Symptoms:**
- Hard to find the right collection
- Collections view is cluttered
- Rarely use most collections

**Solutions:**
1. Delete unused collections
2. Pin only essential collections (3-5)
3. Use more specific queries
4. Combine similar collections

### Slow Collection Performance

For very large workspaces:

**Optimize:**
1. Use tag filters first (fastest)
2. Add date filters to limit scope
3. Be specific with text search
4. Avoid complex regex patterns
5. Consider archiving old notes

## Keyboard Shortcuts

Create shortcuts for frequently-used commands:

**Suggested bindings:**

| Command | Suggested Shortcut | Purpose |
|---------|-------------------|---------|
| Create Collection | `Cmd+K Cmd+C` | New collection |
| Run Collection | `Cmd+K Cmd+R` | Run selected |
| Refresh Collections | `Cmd+K Cmd+Shift+C` | Refresh view |

Set in: `Preferences → Keyboard Shortcuts → Search "collection"`

## Related Features

- [Advanced Search](/noted/posts/search/) - Powerful search with filters
- [Tags System](/noted/posts/tags/) - Organize with tags
- [Pinned Notes](/noted/posts/pinned-notes/) - Pin individual notes
- [Archive](/noted/posts/archive/) - Archive old notes

## Comparison: Collections vs Other Features

### Collections vs Folders

**Folders:**
- Static organization
- One note = one folder
- Manual management

**Collections:**
- Dynamic organization
- One note = many collections
- Automatic management

### Collections vs Tags

**Tags:**
- Broad categorization
- Single dimension
- Manual application

**Collections:**
- Precise filtering
- Multiple dimensions (tags + dates + content)
- Automatic grouping

### Collections vs Pinned Notes

**Pinned Notes:**
- Individual important notes
- Manual pinning
- Quick access

**Collections:**
- Groups of notes
- Automatic membership
- Filtered views

**Use Together**: Pin individual notes AND create collections for related groups!

### Collections vs Search

**Search:**
- Ad-hoc queries
- Enter each time
- Temporary results

**Collections:**
- Saved queries
- Reusable
- Always available

**Workflow**: Search → Refine → Save as Collection

---

Organize notes effortlessly with Smart Collections! 📚✨

## Quick Reference Card

```
╔══════════════════════════════════════════════╗
║         SMART COLLECTIONS CHEAT SHEET        ║
╠══════════════════════════════════════════════╣
║ FILTERS:                                     ║
║  tag:name           - Filter by tag          ║
║  from:YYYY-MM-DD    - From date              ║
║  to:YYYY-MM-DD      - To date                ║
║  regex:pattern      - Regex search           ║
║  case:true          - Case sensitive         ║
║                                              ║
║ COMMON COLLECTIONS:                          ║
║  Recent             - from:recent-date       ║
║  This Week          - from:week-start        ║
║  Untagged           - [no tags filter]       ║
║  Project            - tag:project-name       ║
║  Urgent             - tag:urgent             ║
║                                              ║
║ COMMANDS:                                    ║
║  Create             - New collection         ║
║  Edit               - Modify collection      ║
║  Run                - Show results           ║
║  Pin/Unpin          - Toggle pinned          ║
║  Duplicate          - Copy collection        ║
║  Delete             - Remove collection      ║
║  Refresh            - Rebuild view           ║
╚══════════════════════════════════════════════╝
```
