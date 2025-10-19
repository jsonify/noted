# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-10-18-note-tagging-system/spec.md

> Created: 2025-10-18
> Status: Ready for Implementation

## Tasks

- [x] 1. Implement core tag parsing and utilities
  - [x] 1.1 Write tests for tag extraction, validation, and formatting
  - [x] 1.2 Create `src/utils/tagHelpers.ts` with tag utility functions
  - [x] 1.3 Implement `extractTagsFromContent()` to parse metadata section
  - [x] 1.4 Implement `isValidTag()` and `formatTag*()` helpers
  - [x] 1.5 Verify all unit tests pass

- [x] 2. Build tag indexing service
  - [x] 2.1 Write tests for TagService class methods
  - [x] 2.2 Create `src/services/tagService.ts` with TagService class
  - [x] 2.3 Implement `buildTagIndex()` to scan notes and extract tags
  - [x] 2.4 Implement `getTagsForNote()` and `getNotesWithTag()` methods
  - [x] 2.5 Implement `getAllTags()` with sorting options
  - [x] 2.6 Add in-memory caching for tag index
  - [x] 2.7 Verify all tests pass

- [ ] 3. Create tags tree view provider
  - [ ] 3.1 Write tests for TagsTreeProvider
  - [ ] 3.2 Create `src/providers/tagsTreeProvider.ts`
  - [ ] 3.3 Implement `TreeDataProvider` interface for tag items
  - [ ] 3.4 Create `TagItem` class in `src/providers/treeItems.ts`
  - [ ] 3.5 Implement tree refresh on tag index changes
  - [ ] 3.6 Add context menu support for tag items
  - [ ] 3.7 Register tree view in package.json and extension.ts
  - [ ] 3.8 Verify tags appear in sidebar with counts

- [ ] 4. Implement tag filtering functionality
  - [ ] 4.1 Write tests for filter operations
  - [ ] 4.2 Add filter state management to NotesTreeProvider
  - [ ] 4.3 Implement `filterByTag()` method in NotesTreeProvider
  - [ ] 4.4 Create `noted.filterByTag` command with quick pick UI
  - [ ] 4.5 Create `noted.clearTagFilters` command
  - [ ] 4.6 Add filter indicator to tree view title/description
  - [ ] 4.7 Implement click-to-filter on tag tree items
  - [ ] 4.8 Verify filtering works with single and multiple tags

- [ ] 5. Integrate tag search with existing search
  - [ ] 5.1 Write tests for tag search integration
  - [ ] 5.2 Update `searchNotes()` in noteService.ts to parse `tag:` syntax
  - [ ] 5.3 Implement combined tag + text search logic
  - [ ] 5.4 Update search results to highlight matched tags
  - [ ] 5.5 Handle multiple `tag:` queries in single search
  - [ ] 5.6 Verify tag search works independently and combined with text

- [ ] 6. Build tag management commands
  - [ ] 6.1 Write tests for tag management operations
  - [ ] 6.2 Create `src/commands/tagCommands.ts`
  - [ ] 6.3 Implement `renameTag()` command with confirmation UI
  - [ ] 6.4 Implement `mergeTags()` command for combining tags
  - [ ] 6.5 Implement `deleteTag()` command with confirmation
  - [ ] 6.6 Implement `exportTags()` command to output JSON
  - [ ] 6.7 Add error handling and rollback for failed operations
  - [ ] 6.8 Register all commands in package.json and extension.ts
  - [ ] 6.9 Verify all management operations work correctly

- [ ] 7. Implement tag autocomplete
  - [ ] 7.1 Write tests for completion provider
  - [ ] 7.2 Create completion provider in tagService.ts
  - [ ] 7.3 Implement `provideCompletionItems()` for tag suggestions
  - [ ] 7.4 Filter suggestions by frequency and relevance
  - [ ] 7.5 Register completion provider for .txt and .md files
  - [ ] 7.6 Add configuration option to enable/disable autocomplete
  - [ ] 7.7 Verify autocomplete triggers on `#` in metadata section

- [ ] 8. Add configuration and polish
  - [ ] 8.1 Add configuration settings to package.json
  - [ ] 8.2 Implement configuration reading in relevant services
  - [ ] 8.3 Add keyboard shortcuts for common tag commands
  - [ ] 8.4 Update README.md with tag system documentation
  - [ ] 8.5 Add context menu items to package.json
  - [ ] 8.6 Verify all configuration options work correctly
  - [ ] 8.7 Run full test suite and ensure all tests pass
  - [ ] 8.8 Manual testing of complete tag workflow
