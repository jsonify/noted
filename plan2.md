# Noted Extension - Prioritized Development Plan (plan2.md)

This document provides a curated, prioritized list of features to work on next, based on analysis of existing capabilities and user value.

## 🎯 Top Priority Features (High Value, Medium Complexity)

### 1. **Saved Searches / Smart Collections** 🔍 ✅ COMPLETED
**Status**: ✅ Implemented (v1.35.0)
**Complexity**: Medium
**Value**: Very High
**Documentation**: Comprehensive guide with improved Quick Start (2025-11-04)

Dynamic, auto-updating note collections based on saved queries.

**Why this is valuable**:
- Builds perfectly on existing advanced search system (v1.6.0)
- Complements inbox, tags, and orphans features
- Power users who work with many notes need this
- Makes notes more actionable and organized

**Implemented Features**:
- ✅ Save complex search queries with names and descriptions
- ✅ Dedicated "Collections" tree view panel in sidebar
- ✅ Auto-update as notes change (real-time filtering)
- ✅ Pin important collections for quick access
- ✅ 10 built-in icons for visual organization
- ✅ All Advanced Search filters supported (tags, dates, regex, case-sensitivity)
- ✅ "Save Current Search as Collection" workflow
- ✅ Full CRUD operations: Create, Edit, Duplicate, Delete, Pin/Unpin
- ✅ "Run Collection" to execute saved queries
- ✅ Comprehensive documentation with step-by-step Quick Start

**Implementation**:
```
src/
├── services/
│   └── collectionsService.ts        # Collection storage, filtering, and querying
├── providers/
│   └── collectionsTreeProvider.ts   # Tree view with pinned/unpinned sections
└── commands/
    └── collectionCommands.ts        # Full CRUD operations
```

**User Stories** (Now Possible):
- ✅ "Show me all work notes tagged urgent from the last 30 days" → `tag:urgent tag:work from:2025-10-01`
- ✅ "Show me all unprocessed inbox notes" → `tag:inbox`
- ✅ "Show me all meeting notes with action items" → `tag:meeting regex: - \[ \]`
- ✅ "Show me all backend bugs from this quarter" → `tag:backend tag:bug from:2025-10-01`
- ✅ "Show me recent learning notes" → `tag:learning from:2025-10-20`

---

### 2. **Unlinked Mentions Detection** 🔗
**Status**: Listed in plan.md (Reference Panel Enhancements)
**Complexity**: Medium
**Value**: Very High

Find notes that mention the current note's title without explicit `[[links]]`.

**Why this is valuable**:
- Discovers implicit connections between notes
- Helps build your knowledge graph organically
- Surface related content you forgot about
- Natural extension of existing backlinks system

**Features**:
- Scan all notes for mentions of current note's title (case-insensitive)
- Show in Connections panel as "Unlinked Mentions (N)" section
- Context snippets showing where mentions appear
- "Convert to Link" quick action for each mention
- "Link All" batch action to convert all mentions at once
- Configurable minimum word length (ignore short titles)

**Integration**:
- Add to existing ConnectionsTreeProvider
- Extend ConnectionsService to find text matches
- New section between "Outgoing Links" and "Backlinks"

**Example**:
```
Note: "Project Alpha"
Unlinked Mentions (3):
  📝 meeting-notes-2025-01-15.md:12
     "...discussed Project Alpha timeline..."
  📝 quarterly-review.md:45
     "...Project Alpha delivered on time..."
```

---

### 3. **Random Note Command** 🎲
**Status**: Listed in plan.md (Navigation Features)
**Complexity**: Easy
**Value**: High

Open a random note for serendipitous discovery and review.

**Why this is valuable**:
- Helps rediscover forgotten notes
- Encourages review and connection-building
- Simple to implement, high user delight
- Great for daily review workflows

**Features**:
- "Noted: Open Random Note" command
- Keyboard shortcut (e.g., Cmd+Shift+?)
- Filter options:
  - Random from all notes
  - Random from unlinked notes (orphans)
  - Random from notes not opened in X days
  - Random from specific tags
- Status bar: "🎲 Open Random Note" button
- "Next Random Note" for browsing multiple

**Implementation**: ~50 lines of code in commands.ts

---

### 4. **Section Links** 🔗
**Status**: Listed in plan.md (Section References) - Partially implemented for embeds only
**Complexity**: Medium
**Value**: High

Link to specific sections within notes using `[[note#Section]]` syntax.

**Why this is valuable**:
- You already have section embeds (`![[note#section]]`)
- Natural extension to make sections linkable
- More precise references than full note links
- Better navigation for long-form notes

**Features**:
- Click `[[note#section]]` to jump to that section
- Autocomplete suggestions show available sections when typing `#`
- Hover preview shows just that section
- Backlinks track section-level references
- Support both markdown headers (`# Section`) and text-style (`Section:`)
- Graph view option to show section-level connections

**Extends existing**:
- LinkService already parses wiki-style links
- EmbedService already extracts sections
- Just need DocumentLinkProvider to handle `#section` navigation

---

### 5. **Hierarchical Tags** 🏷️
**Status**: Listed in plan.md (Hierarchical Tags)
**Complexity**: Medium-High
**Value**: High

Support nested tag hierarchies like `#work/project-alpha/backend`.

**Why this is valuable**:
- Your tag system is already robust (inline + frontmatter)
- Users with many tags need better organization
- Natural categorization (projects, areas, topics)
- Filter by hierarchy levels

**Features**:
- Nested tag syntax: `#parent/child/grandchild`
- Tags tree view shows hierarchy with expand/collapse
- Tag inheritance: filtering `#work` includes `#work/project-alpha`
- Tag breadcrumbs in hover previews
- Auto-suggest parent tags when creating new tags
- Migration tool: convert flat tags to hierarchical

**Example**:
```
Tags View:
📁 work (45)
  📁 project-alpha (12)
    🏷️ backend (5)
    🏷️ frontend (7)
  📁 project-beta (8)
🏷️ personal (23)
```

---

## 🚀 Quick Wins (Easy Implementation, Good Value)

### 6. **Merge Notes Command** 📎
**Status**: Listed in plan.md (Note Refactoring)
**Complexity**: Medium
**Value**: Medium-High

Combine multiple notes into one with automatic link preservation.

**Features**:
- Select multiple notes (uses existing bulk selection)
- "Merge Selected Notes" command
- Choose target note or create new one
- Preserves all content with separators
- Updates all incoming links to point to merged note
- Creates "Merged from: [[note1]], [[note2]]" section
- Supports undo via existing UndoService

---

### 7. **Daily/Weekly Review System** 📅
**Status**: Not in current plan
**Complexity**: Medium
**Value**: High

Structured workflow to help users actually review and process their notes.

**Features**:
- **Review Dashboard** webview showing:
  - Notes not visited in X days (stale notes)
  - Unprocessed inbox notes
  - Orphaned notes needing connections
  - Placeholders waiting to be created
  - Quick actions: tag, link, archive, delete
- **Review Queue**: Configurable filters for what to review
- **Review Stats**: Track streaks and completion rates
- **Weekly Review Template**: Pre-built template for weekly reviews

**Why this is valuable**:
- Your inbox system (v1.34.0) creates notes fast
- But users need help processing them
- Makes the extension more than just storage
- Builds on existing orphans, placeholders, and inbox features

---

### 8. **Enhanced Template Variables** ✨
**Status**: Listed in plan.md (Advanced Template System)
**Complexity**: Easy
**Value**: Medium

Add more powerful template variables to existing system.

**Current variables** (10):
`{filename}`, `{date}`, `{time}`, `{year}`, `{month}`, `{day}`, `{weekday}`, `{month_name}`, `{user}`, `{workspace}`

**New variables to add**:
- `{slug}`: URL-friendly version of filename (for wikis)
- `{iso_date}`: ISO format date (2025-01-15)
- `{timestamp}`: Unix timestamp
- `{random_id}`: Random UUID for unique IDs
- `{clipboard}`: Current clipboard content
- `{selection}`: Currently selected text (if any)
- `{tags}`: Prompt for tags, insert as frontmatter
- `{title}`: Prompt for custom title

**Why this is valuable**:
- Easy to implement (extend existing `replacePlaceholders()`)
- Makes templates much more powerful
- Enables advanced workflows (IDs, clipboard capture)

---

## 🎨 UI/UX Enhancements

### 9. **Inline Image Previews in Editor** 🖼️
**Status**: Listed in plan.md (Preview Enhancements)
**Complexity**: Medium
**Value**: Medium

Show image thumbnails directly in editor when using `![[image.png]]`.

**Note**: You already have:
- Image embeds in preview (v1.28.9)
- Image hover previews (v1.17.0)
- Just need inline decorations in editor

**Implementation**: Use VS Code's `DecorationRenderOptions` with `after` content showing thumbnail.

---

### 10. **Forward/Back Navigation** ⬅️➡️
**Status**: Listed in plan.md (Navigation Features)
**Complexity**: Easy
**Value**: Medium

Navigate through note history like a web browser.

**Features**:
- Track navigation history when clicking links
- "Go Back" command (Cmd+Alt+Left)
- "Go Forward" command (Cmd+Alt+Right)
- Status bar buttons: ← →
- Works with existing document link provider

---

## 📚 Advanced Features (Higher Complexity, High Value)

### 11. **Attachment Support (PDFs, etc.)** 📎
**Status**: Listed in plan.md (Attachment Support)
**Complexity**: Medium-High
**Value**: High

Support linking and previewing attachments like PDFs.

**Features**:
- Link to PDFs: `[[document.pdf]]`
- Hover preview shows PDF metadata (pages, size, title)
- Attachment gallery view (like diagram management)
- Drag-and-drop files into notes
- Auto-organize in `Attachments/` folder
- Support: PDF, DOCX, XLSX, PPTX, ZIP

**Why defer**: Medium-high complexity, can build diagram system first and reuse patterns.

---

### 12. **Web Clipper / HTML to Markdown** 🌐
**Status**: Listed in plan.md (Web Integration)
**Complexity**: High
**Value**: Medium-High

Convert web content to markdown notes.

**Features**:
- Paste HTML and convert to markdown
- Preserve metadata (URL, title, date)
- Auto-tag with `#clipped`
- URL unfurling for pasted links
- Basic web clipper (requires browser extension)

**Why defer**: High complexity, less aligned with core note-taking focus.

---

## 🛠️ Technical Improvements

### 13. **Note Change History / Simple Versioning** 📜
**Status**: Not in current plan
**Complexity**: Medium
**Value**: Medium

Track how notes evolve over time.

**Features**:
- Automatic snapshots on significant changes
- Show history command with all versions
- Diff view to compare versions
- Restore previous version
- Storage in `.history/` folder
- Configurable retention (keep last N versions or X days)
- Integration with existing undo/redo

**Implementation**:
```
src/
└── services/
    └── versionService.ts  # Snapshot management
```

---

## 📊 Recommended Implementation Order

Based on value, complexity, and dependencies:

### Phase 1: Quick Wins (1-2 weeks)
1. ✅ **Random Note Command** (1 day) - Easy, fun, immediate value
2. ✅ **Enhanced Template Variables** (2-3 days) - Extends existing system
3. ✅ **Forward/Back Navigation** (2-3 days) - Simple, useful

### Phase 2: Core Extensions (2-4 weeks)
4. ✅ **Saved Searches / Smart Collections** (1 week) - ✅ COMPLETED (v1.35.0, docs improved 2025-11-04)
5. **Unlinked Mentions** (3-4 days) - Extends connections panel
6. **Section Links** (3-4 days) - Natural extension of existing embeds

### Phase 3: Advanced Organization (3-4 weeks)
7. ✅ **Hierarchical Tags** (1 week) - Major enhancement to tag system
8. ✅ **Merge Notes** (3-4 days) - Refactoring tool
9. ✅ **Review System** (1 week) - Workflow enhancement

### Phase 4: Future Enhancements
10. Inline image previews
11. Note versioning
12. Attachment support
13. Diagram management (continue from plan.md)

---

## 🎯 Next Steps

**Immediate recommendation**: Start with Phase 1 - Quick Wins

1. **Random Note Command** - Gets users excited, easy to implement
2. **Enhanced Template Variables** - Makes existing feature more powerful
3. **Forward/Back Navigation** - Better UX for link-heavy workflows

These three features can be implemented quickly and provide immediate user value while laying groundwork for more complex features.

---

## Comparison with Existing plan.md

**From plan.md that should be prioritized**:
- Random note (was listed, now prioritized)
- Unlinked mentions (was listed, now prioritized)
- Section links (was listed, now prioritized)
- Hierarchical tags (was listed, now prioritized)
- Merge notes (was listed, now prioritized)

**New suggestions not in plan.md**:
- ✅ **Saved searches / Smart collections** - COMPLETED (v1.35.0, docs improved 2025-11-04)
- Review system / Weekly review
- Note versioning / Change history
- Enhanced template variables (was mentioned briefly)

**From plan.md to defer**:
- ⏸️ Diagram Management Phase 2/3 (already in progress, continue separately)
- ⏸️ Web integration (lower priority)
- ⏸️ Inline image previews (nice-to-have)
- ⏸️ PDF support (can wait)

---

## Questions to Consider

Before starting implementation:

1. **User feedback**: What features do users request most?
2. **Usage analytics**: Which existing features are most used?
3. **Competitive analysis**: What do Obsidian/Foam/Notion users love?
4. **Your vision**: Where do you want this extension to go?

Would you like me to start implementing any of these features?
