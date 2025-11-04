# Tag System Redesign: Implementation Checklist

## Overview
Complete redesign of the tag system to work like Foam's hierarchical tag panel, showing **tags → files → line references** with support for both YAML frontmatter and inline #hashtags.

---

## Phase 1: Data Layer Refactoring (Core Infrastructure) ✅ COMPLETED

### ✅ Completed
- [x] **Create new type definitions** (`src/types/tags.ts`)
  - Position interface (line, character)
  - Range interface (start, end positions)
  - Tag interface (label, range)
  - Location<T> interface (uri, range, data)
  - RangeUtils namespace with helper functions (createPosition, createRange, containsPosition, toVsCodeRange)

- [x] **Update tagHelpers.ts** - Add inline #hashtag extraction
  - Added `extractInlineHashtagsWithPositions()` function
  - Pattern: `/#([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*(?=\s|$)/gi`
  - Tracks exact line and character positions for each tag
  - Returns `Tag[]` array with ranges

- [x] **Update tagHelpers.ts** - Update YAML tag extraction
  - Created `extractFrontmatterTagsWithPositions()` to return `Tag[]` with positions
  - Calculates exact positions within YAML frontmatter
  - Handles array format `[tag1, tag2]`
  - Added `extractAllTagsWithPositions()` as the main extraction function

- [x] **Update TagService** - Refactor core data structure
  - Changed `tagIndex` from `Map<string, Set<string>>` to `Map<string, Location<Tag>[]>`
  - Updated `extractTagsFromFile()` to use `extractAllTagsWithPositions()`
  - Updated `buildTagIndex()` to store locations with ranges
  - Updated `updateIndexForFile()` to filter locations by URI
  - Updated all query methods to work with locations (getTagsForNote, getNotesWithTag, getNotesWithTags, getAllTags)
  - Added new location-based methods:
    - `getLocationsForTag()` - Get all locations for a tag
    - `getLocationsForTagInFile()` - Get locations for a tag in a specific file
    - `getTagAtPosition()` - Find tag at cursor position (for F2 rename)
    - `getTagReferenceCount()` - Count all occurrences (not just unique files)
    - `getAllTagLabels()` - Get all tag names
    - `getTagIndex()` - Direct access to index

- [x] **Add hierarchical tag support**
  - Updated TAG_PATTERN to allow '/' separator: `/^[a-z](?:[a-z0-9]|-(?=[a-z0-9]))*(?:\/[a-z](?:[a-z0-9]|-(?=[a-z0-9]))*)*$/`
  - Updated TAG_EXTRACT_PATTERN to match hierarchical tags
  - Added utility functions:
    - `splitTagPath(tag: string): string[]` - Split tag into segments
    - `getTagHierarchy(tag: string): string[]` - Get all parent tags
    - `isChildTag(tag, parent): boolean` - Check if tag is child of another
    - `getParentTag(tag: string): string | null` - Get immediate parent
    - `getChildTags(tags[], parent): string[]` - Find all children

---

## Phase 2: Tree Provider Complete Rewrite

### ⏳ Pending
- [ ] **Create new tree item classes** in `treeItems.ts`
  - `TagItem` class - Represents a tag node
    - Properties: tag label, count, hasChildren
    - Icon: `symbol-number`
    - Description: "N references"
  - `TagFileItem` class - Represents a file containing the tag
    - Properties: file path, tag count in file
    - Icon: `file`
    - Command: open file
  - `TagReferenceItem` class - Represents a specific line reference
    - Properties: line number, context snippet
    - Label format: `{line}: {contextSnippet}`
    - Icon: `symbol-number`
    - Command: open file at specific line with selection

- [ ] **Completely rewrite TagsTreeProvider**
  - Remove all filtering logic
  - Remove sort options (alphabetical/frequency)
  - Implement new `getChildren()` logic:
    - Root level: Return all top-level tags (hierarchical splitting)
    - Tag level: Return child tags + files containing this tag
    - File level: Return all line references in that file
  - Add `getTagHierarchy()` method for nested tags
  - Add `groupReferencesByFile()` method
  - Add context extraction (60 chars around tag)

---

## Phase 3: Remove Filtering System

### ⏳ Pending
- [ ] **Update NotesTreeProvider** (`notesTreeProvider.ts`)
  - Remove `activeFilters: Set<string>` property
  - Remove `filteredNotePaths: Set<string>` property
  - Remove `applyFilters()` method
  - Remove `clearFilters()` method
  - Remove filter-related refresh logic
  - Remove context variable updates for `noted.hasActiveTagFilters`

- [ ] **Update tagCommands.ts**
  - Remove `filterByTag` command implementation
  - Remove `clearTagFilters` command implementation
  - Keep: `renameTag`, `mergeTags`, `deleteTag`, `exportTags`
  - Update remaining commands to use new data structure

- [ ] **Update package.json**
  - Remove `noted.filterByTag` command registration
  - Remove `noted.clearTagFilters` command registration
  - Remove keybinding for Cmd+K Cmd+T
  - Remove "Clear Filters" button from notes view toolbar
  - Remove `noted.hasActiveTagFilters` context variable

- [ ] **Update extension.ts**
  - Remove filter command registrations
  - Remove filter-related context updates

---

## Phase 4: Advanced Tag Operations

### ⏳ Pending
- [ ] **Create TagRenameProvider** (F2 rename support)
  - New file: `src/services/tagRenameProvider.ts`
  - Implement `vscode.RenameProvider` interface
  - `prepareRename()`: Detect if cursor is on a tag
    - Check if position is within any tag range
    - Return range and current tag label as placeholder
  - `provideRenameEdits()`: Generate workspace edits
    - Get all locations for the tag
    - Create TextEdit for each location
    - Handle both #hashtag and YAML formats
    - Return WorkspaceEdit

- [ ] **Create TagEditService** (Hierarchical rename)
  - New file: `src/services/tagEditService.ts`
  - `validateTagRename()`: Check if rename is valid
  - `createRenameEdits()`: Generate edits for single tag
  - `createHierarchicalRenameEdits()`: Rename parent and all children
    - Find all child tags (tags starting with "parent/")
    - Generate rename edits for each child tag
    - Prompt user if they want to rename children too

- [ ] **Add workspace search command**
  - New command: `noted.searchTag`
  - Generate regex pattern for tag:
    - `#tag\\b` (hashtag format)
    - `tags:.*?\\btag\\b` (YAML array format)
    - `^\\s*-\\s+tag\\b\\s*$` (YAML list format)
  - Call `vscode.commands.executeCommand('workbench.action.findInFiles', { query, isRegex: true })`

- [ ] **Update rename command**
  - Rewrite `noted.renameTag` to use WorkspaceEdit API
  - Remove manual file reading/writing
  - Use atomic workspace edits with rollback support
  - Add validation before rename (check for conflicts)

- [ ] **Register providers**
  - Register `TagRenameProvider` in `extension.ts`
  - For file patterns: `**/*.{txt,md}`
  - Support both text and markdown formats

---

## Phase 5: Package.json & UI Updates

### ⏳ Pending
- [ ] **Update commands in package.json**
  - Add `noted.searchTag` command
    - Title: "Noted: Search for Tag"
    - Icon: `$(search)`
    - Category: "Noted"
  - Update existing tag commands
  - Remove filter commands (already listed in Phase 3)

- [ ] **Update view contributions**
  - Tags view toolbar:
    - Add "Search Tag" button (when tag selected)
    - Add "Rename Tag" button (when tag selected)
    - Remove "Sort" buttons
  - Notes view toolbar:
    - Remove "Clear Filters" button

- [ ] **Update context menus**
  - Tags view item context menu:
    - "Search for Tag" (magnifying glass icon, inline)
    - "Rename Tag" (pencil icon, inline)
    - Remove "Filter by Tag"
  - Keep existing: Merge Tags, Delete Tag, Export Tags

- [ ] **Update when clauses**
  - Tag commands: `view == notedTagsView && viewItem == tag`
  - File commands: `view == notedTagsView && viewItem == tagFile`
  - Reference commands: `view == notedTagsView && viewItem == tagReference`

- [ ] **Update icons and labels**
  - Ensure consistent icon usage (symbol-number for tags)
  - Update command titles to be clear and actionable

---

## Phase 6: Testing & Documentation

### ⏳ Pending
- [ ] **Update existing test files**
  - `tagService.test.ts`:
    - Update to test location-based storage
    - Test `Map<string, Location<Tag>[]>` structure
    - Test position tracking
  - `tagsTreeProvider.test.ts`:
    - Test new hierarchy (tags → files → references)
    - Test tree item creation
    - Remove filter tests
  - `tagHelpers.test.ts`:
    - Test inline #hashtag extraction with positions
    - Test YAML extraction with positions
    - Test hierarchical tag parsing
  - `tagCommands.test.ts`:
    - Update rename tests to use WorkspaceEdit
    - Remove filter tests
    - Test new search command

- [ ] **Create new test files**
  - `tagRenameProvider.test.ts`:
    - Test F2 rename detection
    - Test rename edit generation
    - Test cursor position detection
  - `tagEditService.test.ts`:
    - Test hierarchical rename
    - Test validation logic
    - Test conflict detection

- [ ] **Integration tests**
  - Test inline #hashtag extraction from real files
  - Test hierarchical tag navigation
  - Test F2 rename workflow end-to-end
  - Test workspace search integration

- [ ] **Update documentation**
  - `CLAUDE.md`:
    - Update tag architecture section
    - Document new data structures
    - Update commands list
    - Remove filtering documentation
  - `notes.md`:
    - Add entry for tag system redesign
    - List new features (hierarchical tags, #hashtags, F2 rename)
  - `docs/tags.md` (or create if doesn't exist):
    - User guide for new tag system
    - How to use hierarchical tags
    - How to use F2 rename
    - How to search for tags
  - Update README if necessary

---

## Breaking Changes & Migration

### Breaking Changes
- ⚠️ **Tag filtering removed** - Users must use search or graph view instead
- ⚠️ **Keybinding Cmd+K Cmd+T removed** - No longer filters by tag
- ⚠️ **Tags panel behavior changed** - Now for navigation, not filtering

### Backward Compatible
- ✅ Existing tags in YAML frontmatter still work
- ✅ Tag autocomplete unchanged
- ✅ Tag management commands preserved (merge, delete)

### User Communication
- [ ] Update changelog
- [ ] Add migration notes
- [ ] Consider showing info message on first use after update

---

## Testing Checklist

Before release, verify:
- [ ] Inline #hashtags are extracted correctly
- [ ] YAML frontmatter tags are extracted correctly
- [ ] Hierarchical tags display correctly (project → project/frontend)
- [ ] Clicking line references navigates to correct location
- [ ] F2 rename works in both #hashtag and YAML contexts
- [ ] Workspace search finds all tag instances
- [ ] Tag rename updates all occurrences
- [ ] No console errors or warnings
- [ ] All tests pass
- [ ] Extension compiles without errors
- [ ] Performance is acceptable with large note collections

---

## Progress Tracking

**Overall Progress:** 5/15 tasks completed (33.3%)

### Phase 1: 5/5 tasks completed (100%) ✅ COMPLETED
### Phase 2: 0/2 tasks completed (0%)
### Phase 3: 0/4 tasks completed (0%)
### Phase 4: 0/5 tasks completed (0%)
### Phase 5: 0/5 tasks completed (0%)
### Phase 6: 0/4 tasks completed (0%)
