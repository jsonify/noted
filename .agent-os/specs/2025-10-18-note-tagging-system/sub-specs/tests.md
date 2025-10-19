# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-10-18-note-tagging-system/spec.md

> Created: 2025-10-18
> Version: 1.0.0

## Test Coverage

### Unit Tests

**tagHelpers.ts**
- `extractTagsFromContent()` extracts tags from metadata section
- `extractTagsFromContent()` ignores tags in note body beyond metadata
- `extractTagsFromContent()` handles empty content
- `extractTagsFromContent()` handles content without tags
- `extractTagsFromContent()` converts tags to lowercase
- `extractTagsFromContent()` handles duplicate tags (returns unique set)
- `isValidTag()` validates tag format (alphanumeric + hyphens)
- `isValidTag()` rejects tags with spaces
- `isValidTag()` rejects tags with special characters
- `formatTagForDisplay()` formats tag with hash prefix
- `formatTagForStorage()` normalizes tag to lowercase

**tagService.ts**
- `buildTagIndex()` scans all notes and builds tag index
- `buildTagIndex()` handles notes without tags
- `buildTagIndex()` counts tag occurrences correctly
- `buildTagIndex()` stores note file paths for each tag
- `getTagsForNote()` returns tags for a specific note
- `getNotesWithTag()` returns all notes containing a tag
- `getNotesWithTags()` returns notes with all specified tags (AND logic)
- `getAllTags()` returns sorted tag list
- `renameTag()` updates tag in all notes
- `renameTag()` handles file write errors gracefully
- `mergeTags()` combines tags and removes duplicates
- `deleteTag()` removes tag from all notes
- `addTagToNote()` adds tag to metadata section
- `addTagToNote()` creates metadata section if missing
- `removeTagFromNote()` removes tag from metadata section

**tagsTreeProvider.ts**
- `getChildren()` returns all tags as TagItems
- `getChildren()` returns empty array when no tags exist
- `getTreeItem()` creates tree item with correct label and count
- `refresh()` triggers tree update
- `sortTags()` sorts by frequency when configured
- `sortTags()` sorts alphabetically when configured

### Integration Tests

**Tag Filtering Workflow**
- User can filter notes by single tag via tree view click
- User can filter notes by multiple tags via command palette
- Filtered tree view shows only notes with selected tags
- Clear filters command restores full tree view
- Filter state persists during session
- Filter indicator shows active tags in tree view title

**Tag Management Workflow**
- Rename tag command updates all notes successfully
- Rename tag command shows confirmation with affected note count
- Merge tags command combines tags and removes duplicates
- Delete tag command removes tag from all notes after confirmation
- Tag operations handle file system errors gracefully
- Tag operations refresh tree view automatically

**Search Integration Workflow**
- Search with `tag:name` returns only notes with tag
- Search with `tag:bug tag:urgent` returns notes with both tags
- Search with `tag:bug error` returns notes with tag containing "error"
- Search results highlight matched tags
- Search handles malformed tag syntax gracefully

**Autocomplete Workflow**
- Typing `#` in metadata section triggers autocomplete
- Autocomplete shows existing tags sorted by frequency
- Selecting autocomplete inserts tag correctly
- Autocomplete only triggers in first 10 lines
- Autocomplete handles empty tag list

### Performance Tests

**Tag Index Building**
- Build tag index for 100 notes completes in < 200ms
- Build tag index for 1000 notes completes in < 500ms
- Incremental index update for single note < 50ms

**Filtering Performance**
- Filter 100 notes by single tag < 50ms
- Filter 1000 notes by single tag < 100ms
- Filter by multiple tags scales linearly

**Search Performance**
- Search with tag + text in 100 notes < 200ms
- Search with tag + text in 1000 notes < 1s

### Edge Cases and Error Handling

**Malformed Metadata**
- Handle notes with malformed metadata gracefully
- Handle notes with tags outside metadata section
- Handle notes with invalid tag characters
- Handle notes with extremely long tag lists (>100 tags)

**File System Errors**
- Handle read errors during tag index building
- Handle write errors during tag rename/merge/delete
- Provide user-friendly error messages
- Roll back failed operations where possible

**Concurrent Operations**
- Handle multiple tag operations in quick succession
- Handle tag index rebuild during active filtering
- Handle external file modifications during tag operations

## Mocking Requirements

**VS Code API Mocks**
- `vscode.workspace.workspaceFolders` for workspace path
- `vscode.window.showQuickPick` for tag selection UI
- `vscode.window.showInputBox` for rename tag input
- `vscode.window.showInformationMessage` for confirmations
- `vscode.window.showErrorMessage` for error display
- `vscode.TreeDataProvider` event emitters

**File System Mocks**
- Mock `fs.promises.readFile` for reading note files
- Mock `fs.promises.writeFile` for updating notes
- Mock `fs.promises.readdir` for scanning note directories
- Mock file system errors for error handling tests

**Configuration Mocks**
- Mock `vscode.workspace.getConfiguration` for settings
- Mock different tag sort order settings
- Mock enable/disable tag features

## Test Data

**Sample Notes with Tags**
```
File: 2025-10-15.txt
Content:
tags: #bug #urgent #project-alpha

Found critical bug in user authentication.
Need to fix ASAP.
```

```
File: 2025-10-16.txt
Content:
tags: #feature #project-alpha

Implementing new dashboard feature.
```

```
File: 2025-10-17.txt
Content:
No tags

Just some quick notes without tags.
```

**Expected Tag Index**
```javascript
{
  "bug": { count: 1, notes: ["2025-10-15.txt"] },
  "urgent": { count: 1, notes: ["2025-10-15.txt"] },
  "project-alpha": { count: 2, notes: ["2025-10-15.txt", "2025-10-16.txt"] },
  "feature": { count: 1, notes: ["2025-10-16.txt"] }
}
```

## Coverage Goals

- **Unit Tests**: ≥ 90% coverage for tag utilities and services
- **Integration Tests**: All major user workflows covered
- **Edge Cases**: All error scenarios have dedicated tests
- **Performance**: All performance benchmarks validated
