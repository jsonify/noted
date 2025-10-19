# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-10-18-note-tagging-system/spec.md

> Created: 2025-10-18
> Version: 1.0.0

## Technical Requirements

### Tag Parsing and Storage

- **Tag Format**: Inline tags anywhere in note content using `#tagname` syntax (v1.4.0+)
- **Tag Pattern**: Hash-based (`#`), followed by lowercase alphanumeric with hyphens: `/\#[a-z0-9-]+/g`
- **Case Handling**: Tags are case-insensitive (convert to lowercase for storage/comparison)
- **Tag Extraction**: Parse entire note content to extract all inline tags using regex
- **Caching Strategy**: Cache tag index in memory, rebuild on file changes or command trigger
- **Legacy Support**: Still supports metadata format `tags: #tag1 #tag2` for backward compatibility

### UI Components

- **Tags Tree Provider**: New `TagsTreeProvider` class implementing `vscode.TreeDataProvider<TagItem>`
- **Tag Items**: `TagItem` class with properties: `tagName`, `count`, `noteReferences[]`
- **Tree View Integration**: Add "Tags" section to existing `notedView` container
- **Collapsible State**: Tags section starts expanded, maintains state across sessions
- **Context Menus**: Right-click context menu on tag items for rename/merge/delete operations

### Filtering Logic

- **Active Filter State**: Store active tag filters in `NotesTreeProvider` state
- **Filter Indicator**: Show active filters in tree view title/description
- **Multi-Tag Filtering**: Support AND logic (show notes with ALL selected tags)
- **Clear Filters**: Command and UI button to clear all active tag filters
- **Performance**: Filter tree items in-memory, no file re-reading required

### Search Integration

- **Search Syntax**: Support `tag:tagname` in search input
- **Combined Search**: Allow `tag:bug error message` to search tags + text
- **Multiple Tags**: Support `tag:bug tag:urgent` for multi-tag search
- **Search Results**: Highlight matched tags in search results preview

### Tag Management Operations

- **Rename Tag**: Find all notes with tag, update metadata section, preserve formatting
- **Merge Tags**: Combine two tags into one across all notes, remove duplicates
- **Delete Tag**: Remove tag from all notes, confirm before deletion
- **List Tags**: Export all tags with counts to JSON or display in output panel
- **Atomic Updates**: Use async file operations with error rollback

### Autocomplete Provider

- **Trigger Character**: `#` anywhere in note content
- **Completion Items**: Return existing tags sorted by frequency
- **Context Awareness**: Triggers throughout entire note for inline tag support
- **VSCode API**: Implement `vscode.CompletionItemProvider` interface

## Approach Options

### Option A: Real-time Tag Parsing (Selected)
- **Description**: Parse tags on-demand when notes are opened/modified
- **Pros**: Always up-to-date, no stale data, simpler implementation
- **Cons**: Slower for large note collections, repeated parsing
- **Rationale**: Better for MVP, can optimize later with caching layer

### Option B: Persistent Tag Index
- **Description**: Build and persist tag index to workspace state
- **Pros**: Faster performance, one-time parsing cost
- **Cons**: More complex, requires sync logic, potential stale data
- **Rationale**: Consider for v2 if performance issues arise

## External Dependencies

**None required** - Implementation uses only existing VS Code API and Node.js built-ins:
- `vscode.TreeDataProvider` for tree views
- `vscode.CompletionItemProvider` for autocomplete
- `fs.promises` for file operations (already in use)
- Native JavaScript regex for tag parsing

## Performance Considerations

- **Tag Index Rebuild**: < 500ms for 1000 notes (async operation)
- **Filter Operation**: < 100ms for filtering tree with 1000 notes
- **Search with Tags**: < 1s for searching 1000 notes with tag + text query
- **Autocomplete**: < 50ms to generate completion list

## File Structure

New files to create:
```
src/
  providers/
    tagsTreeProvider.ts    (~200 lines) - Tags tree view provider
  services/
    tagService.ts          (~300 lines) - Tag parsing, indexing, management
  commands/
    tagCommands.ts         (~250 lines) - Tag-related command handlers
  utils/
    tagHelpers.ts          (~100 lines) - Tag validation, formatting utilities
```

Modifications to existing files:
```
src/extension.ts           - Register tag commands and tree provider
src/providers/notesTreeProvider.ts - Add filter state and logic
src/services/noteService.ts - Integrate tag search in searchNotes()
package.json              - Add new commands, tree view, configuration
```

## Configuration Settings

Add to `package.json` contributions:
```json
{
  "noted.enableTags": {
    "type": "boolean",
    "default": true,
    "description": "Enable tag system for notes"
  },
  "noted.tagAutoComplete": {
    "type": "boolean",
    "default": true,
    "description": "Enable tag autocomplete suggestions"
  },
  "noted.tagSortOrder": {
    "type": "string",
    "enum": ["frequency", "alphabetical"],
    "default": "frequency",
    "description": "Sort order for tags in tree view"
  }
}
```

## VS Code Commands

New commands to register:
- `noted.filterByTag` - Show quick pick to select tags for filtering
- `noted.clearTagFilters` - Clear all active tag filters
- `noted.renameTag` - Rename a tag across all notes
- `noted.mergeTags` - Merge two tags into one
- `noted.deleteTag` - Remove tag from all notes
- `noted.exportTags` - Export tag index to JSON
- `noted.refreshTags` - Manually rebuild tag index
