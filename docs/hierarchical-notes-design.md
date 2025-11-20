# Hierarchical Note Naming - Design Document

## Overview

This document describes the design for implementing hierarchical note naming in Noted, inspired by Dendron's dot-delimited hierarchy system.

## Goals

1. Enable topic-based organization using dot-delimited hierarchies (e.g., `project.design.frontend.md`)
2. Maintain backwards compatibility with existing date-based and folder-based organization
3. Provide flexible restructuring without folder constraints
4. Improve note organization for non-temporal content

## Design Decisions

### 1. Storage Format

**Decision:** Store hierarchical notes as flat files with dot-delimited names in the root notes folder.

**Example:**
- File: `Notes/project.design.frontend.md`
- Displays as hierarchy:
  ```
  📁 project
    📁 design
      📄 frontend.md
  ```

**Advantages:**
- Simple to implement and maintain
- Easy to search (single flat namespace)
- Flexible restructuring (just rename file)
- No nested folder complexity
- Matches Dendron's approach

### 2. File Naming Rules

**Format:** `segment1.segment2.segment3.{ext}`

**Validation Rules:**
- Each segment must contain only lowercase letters, numbers, hyphens, underscores
- No dots at start or end of filename
- No consecutive dots
- Minimum 1 segment (can have flat notes like `readme.md`)
- Regex pattern: `^[a-z0-9_-]+(\.[a-z0-9_-]+)*$` (before extension)

**Valid Examples:**
- `work.meetings.standup.md`
- `project.design.frontend.md`
- `daily.2025.11.20.md`
- `readme.md` (flat, single segment)
- `api-docs.md` (flat with hyphen)

**Invalid Examples:**
- `.hidden.note.md` (starts with dot)
- `note..extra.md` (consecutive dots)
- `Work.Meeting.md` (uppercase not allowed)
- `note with spaces.md` (spaces not allowed)

### 3. Tree View Organization

**New Tree Item Type:** `HierarchyItem`
- Represents a virtual hierarchy node (not an actual folder)
- Can have child hierarchy nodes
- Can have note files as children
- Stores the hierarchy path (e.g., `project.design`)

**Tree Structure:**
```
📁 Notes (root)
  📁 Hierarchical Notes (section - shown if hierarchical notes exist)
    📁 project (HierarchyItem)
      📁 design (HierarchyItem)
        📄 frontend.md (NoteItem)
        📄 backend.md (NoteItem)
      📄 overview.md (NoteItem under 'project')
    📁 work (HierarchyItem)
      📁 meetings (HierarchyItem)
        📄 standup.md (NoteItem)
  📌 Pinned Notes (existing section)
  📦 Archive (existing section)
  📥 Inbox (existing section)
  📁 Projects (custom folder - existing)
```

### 4. Hierarchy Building Algorithm

**Input:** List of hierarchical note files
**Output:** Tree structure

**Algorithm:**
```typescript
buildHierarchyTree(files: string[]): HierarchyNode {
  const root = new HierarchyNode('');

  for (const file of files) {
    // Extract name without extension: project.design.frontend.md → project.design.frontend
    const nameWithoutExt = removeExtension(file);

    // Split into segments: ['project', 'design', 'frontend']
    const segments = nameWithoutExt.split('.');

    // Build path incrementally
    let currentNode = root;
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      if (!currentNode.children[segment]) {
        currentNode.children[segment] = new HierarchyNode(segment);
      }
      currentNode = currentNode.children[segment];
    }

    // Last segment is the note file
    const noteName = segments[segments.length - 1];
    currentNode.notes.push({ name: noteName, fullPath: file });
  }

  return root;
}
```

### 5. Storage Location

**Hierarchical notes** are stored in the **root of the notes folder** (same level as year folders, Inbox, Archive, etc.)

**Example file structure:**
```
Notes/
  project.design.frontend.md          # hierarchical note
  work.meetings.standup.md            # hierarchical note
  readme.md                           # flat note (no hierarchy)
  2025/                               # date-based (existing)
    11-November/
      2025-11-20.md
  Inbox/                              # inbox (existing)
    quick-note.md
  Archive/                            # archive (existing)
  .templates/                         # templates (existing)
  Projects/                           # custom folder (existing)
    project1.md
```

### 6. Backwards Compatibility

**Existing features continue to work:**

1. **Daily Notes** (Journal view)
   - Continue using `{YYYY}/{MM-MonthName}/{YYYY-MM-DD}.{format}` format
   - Stored in dated folders
   - Accessed via `noted.openToday` command
   - Journal tree provider shows date-based hierarchy

2. **Custom Folders** (Notes view)
   - Continue showing in Notes tree provider
   - Can contain notes and subfolders
   - No changes to existing behavior

3. **Special Sections**
   - Pinned Notes, Archive, Inbox continue working
   - No changes to existing behavior

**New behavior:**
- Hierarchical notes appear in Notes view under "Hierarchical Notes" section
- Flat notes (no dots in name, in root folder) can appear in "Other Notes" section

### 7. Commands

**New Commands:**

1. **`noted.createHierarchicalNote`** - Create a new hierarchical note
   - Prompts for hierarchical path (e.g., `project.design.frontend`)
   - Validates format
   - Creates file in root notes folder
   - Opens in editor

2. **`noted.openHierarchicalNote`** - Open or create a hierarchical note
   - Quick picker showing existing hierarchical notes
   - Option to create new if not found
   - Supports fuzzy search

3. **`noted.renameHierarchicalNote`** - Rename a hierarchical note
   - Updates all wiki-links to the note
   - Validates new name format

**Updated Commands:**

1. **`noted.openWithTemplate`** - Enhanced to support hierarchical naming
   - When creating from template, user can specify hierarchical path
   - Example: "project.design.frontend" → creates `project.design.frontend.md`

### 8. Configuration

**New Settings:**

```json
{
  "noted.hierarchy.enabled": {
    "type": "boolean",
    "default": true,
    "description": "Enable hierarchical note naming with dot-delimited paths"
  },
  "noted.hierarchy.separator": {
    "type": "string",
    "default": ".",
    "description": "Separator character for hierarchy (default: dot)",
    "enum": [".", "/"]
  },
  "noted.hierarchy.validation": {
    "type": "string",
    "default": "strict",
    "description": "Validation level for hierarchical note names",
    "enum": ["strict", "relaxed"]
  },
  "noted.hierarchy.maxDepth": {
    "type": "number",
    "default": 10,
    "description": "Maximum depth for hierarchical notes (0 = unlimited)"
  }
}
```

### 9. Integration with Existing Features

**Search:**
- Search should work with hierarchical note names
- Example: Searching "project design" should find `project.design.frontend.md`
- Both filename and content search should work

**Links:**
- Wiki-links should work with hierarchical names
- `[[project.design.frontend]]` should link to `project.design.frontend.md`
- Link completion should suggest hierarchical notes
- When renaming hierarchical notes, update all links

**Tags:**
- Tags should work normally with hierarchical notes
- No changes needed to tag system

**Backlinks:**
- Backlinks should work with hierarchical notes
- No changes needed to backlinks system

**Embeds:**
- Embeds should work with hierarchical names
- `![[project.design.frontend]]` should embed the note
- No changes needed to embed system

### 10. Implementation Phases

**Phase 1: Core Infrastructure** (Current)
- Create `hierarchicalHelpers.ts` with parsing and validation utilities
- Create `HierarchyItem` tree item class
- Create `hierarchicalNoteService.ts` for managing hierarchical notes

**Phase 2: Tree View**
- Update `NotesTreeProvider` to display hierarchical notes
- Implement hierarchy building algorithm
- Add "Hierarchical Notes" section

**Phase 3: Commands**
- Implement `noted.createHierarchicalNote` command
- Update `noted.openWithTemplate` to support hierarchical naming
- Add rename command with link updates

**Phase 4: Integration**
- Update search to work with hierarchical notes
- Update link completion to suggest hierarchical notes
- Test all existing features with hierarchical notes

**Phase 5: Configuration & Polish**
- Add configuration options
- Add keyboard shortcuts
- Update documentation

## User Experience Examples

### Creating a Hierarchical Note

**User action:** Run `noted.createHierarchicalNote` command

**Flow:**
1. Input prompt: "Enter hierarchical note path (e.g., project.design.frontend)"
2. User enters: `work.meetings.standup`
3. Validation: Check format is valid
4. Template selection (optional)
5. Create file: `Notes/work.meetings.standup.md`
6. Open in editor

**Tree view shows:**
```
📁 Hierarchical Notes
  📁 work
    📁 meetings
      📄 standup.md
```

### Navigating Hierarchical Notes

**User action:** Click on "work" in tree view

**Result:**
- Expands to show child hierarchy: "meetings"

**User action:** Click on "meetings"

**Result:**
- Expands to show notes: "standup.md"

**User action:** Click on "standup.md"

**Result:**
- Opens note in editor

### Linking to Hierarchical Notes

**In any note, user types:** `[[work.meetings.standup]]`

**Result:**
- Creates clickable link to hierarchical note
- Clicking link opens `work.meetings.standup.md`
- Backlink appears in target note's connections panel

## Technical Considerations

### Performance
- Building hierarchy tree is O(n × m) where n = number of files, m = average depth
- For 1000 hierarchical notes with average depth 4: ~4000 operations (negligible)
- Cache hierarchy tree and rebuild only when files change

### File Watching
- Watch for file creation/deletion/rename in notes folder
- Rebuild hierarchy tree when hierarchical notes change
- Use existing `FileWatcherService`

### Edge Cases
1. **Flat notes in root folder** (e.g., `readme.md`)
   - Show in "Other Notes" section or at root of "Hierarchical Notes"

2. **Name conflicts**
   - If `project.md` and folder `project/` both exist, show error
   - Prevent creation of conflicting names

3. **Very deep hierarchies** (e.g., 15 levels)
   - Add configuration option for max depth
   - Show warning if depth exceeds limit

4. **Special characters in segments**
   - Strict validation: only lowercase, numbers, hyphens, underscores
   - Clear error messages for invalid names

## Success Metrics

1. **User adoption**: % of users creating hierarchical notes
2. **Note organization**: Average hierarchy depth
3. **Performance**: Tree view refresh time < 100ms for 1000 notes
4. **Compatibility**: All existing features work with hierarchical notes

## Future Enhancements

1. **Schema system** - Automatic template application based on hierarchy
2. **Hierarchy refactoring** - Bulk rename operations (e.g., `project.*` → `work.*`)
3. **Hierarchy navigation** - Quick jump to parent/sibling notes
4. **Hierarchy search** - Filter by hierarchy path
5. **Daily notes in hierarchy** - Allow `daily.2025.11.20` format

---

**Document Version:** 1.0
**Date:** 2025-11-20
**Status:** Design Complete, Ready for Implementation
