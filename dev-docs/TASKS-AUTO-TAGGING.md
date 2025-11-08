# Smart Auto-Tagging Implementation Task List

## Phase 1: Core Infrastructure (Days 1-2)

### Setup & Dependencies
- [ ] Add `js-yaml` package to dependencies
  ```bash
  pnpm add js-yaml
  pnpm add -D @types/js-yaml
  ```
- [ ] Update `tsconfig.json` if needed for new module imports
- [ ] Create `src/tagging/` directory for tagging-related modules

### Tag Parser Implementation
- [ ] Create `src/tagging/TagParser.ts`
- [ ] Implement `parseTags()` method
  - [ ] Parse YAML frontmatter using js-yaml
  - [ ] Extract tags array from frontmatter
  - [ ] Extract tagged-at timestamp
  - [ ] Handle missing frontmatter gracefully
  - [ ] Return NoteMetadata object
- [ ] Implement `writeTags()` method
  - [ ] Check if frontmatter exists
  - [ ] If exists, update tags field
  - [ ] If not exists, create new frontmatter block
  - [ ] Preserve other frontmatter fields
  - [ ] Return updated file content
- [ ] Implement `hasFrontmatter()` utility method
- [ ] Add unit tests for TagParser
  - [ ] Test parsing with frontmatter
  - [ ] Test parsing without frontmatter
  - [ ] Test preserving existing fields
  - [ ] Test malformed YAML handling

### Tag Manager Implementation
- [ ] Create `src/tagging/TagManager.ts`
- [ ] Define `NoteTag` interface
  ```typescript
  interface NoteTag {
    name: string;
    confidence: number;
    source: 'ai' | 'manual';
    addedAt: Date;
  }
  ```
- [ ] Define `NoteMetadata` interface
- [ ] Implement `tagNote()` method
  - [ ] Read file content
  - [ ] Parse existing tags
  - [ ] Merge with new tags (avoid duplicates)
  - [ ] Write back to file
- [ ] Implement `getNoteTags()` method
  - [ ] Read file
  - [ ] Parse and return tags
- [ ] Implement `findNotesByTag()` method
  - [ ] Scan all notes in notes folder
  - [ ] Check each note's tags
  - [ ] Return matching file paths
- [ ] Implement `getAllTags()` method
  - [ ] Scan all notes
  - [ ] Build map of tag -> count
  - [ ] Return sorted map
- [ ] Implement `removeTag()` method
  - [ ] Read file
  - [ ] Parse tags
  - [ ] Filter out specified tag
  - [ ] Write back
- [ ] Add caching layer for performance
  - [ ] Create simple in-memory cache
  - [ ] Cache tag results per file
  - [ ] Invalidate on file changes

### Configuration Setup
- [ ] Update `package.json` configuration section
- [ ] Add `noted.tagging.enabled` setting
- [ ] Add `noted.tagging.autoTagOnCreate` setting
- [ ] Add `noted.tagging.maxTags` setting (default: 5)
- [ ] Add `noted.tagging.customCategories` array setting
- [ ] Add `noted.tagging.excludePatterns` array setting

## Phase 2: AI Integration (Days 2-3)

### Tag Generator Implementation
- [ ] Create `src/tagging/TagGenerator.ts`
- [ ] Implement `generateTags()` method
  - [ ] Check for Copilot availability
  - [ ] Build prompt using `buildTagPrompt()`
  - [ ] Send request to LLM API
  - [ ] Stream response
  - [ ] Parse response with `parseTagResponse()`
  - [ ] Handle errors gracefully
- [ ] Implement `buildTagPrompt()` method
  - [ ] Get tag categories from config
  - [ ] Format prompt with categories
  - [ ] Include note content
  - [ ] Add JSON format instructions
  - [ ] Add tagging rules
- [ ] Implement `getCategories()` method
  - [ ] Define default categories
  - [ ] Load custom categories from config
  - [ ] Merge and return combined list
- [ ] Implement `parseTagResponse()` method
  - [ ] Remove markdown code fences
  - [ ] Parse JSON
  - [ ] Filter by confidence threshold (>0.6)
  - [ ] Convert to NoteTag objects
  - [ ] Handle parsing errors
- [ ] Add error handling
  - [ ] Handle Copilot not available
  - [ ] Handle LLM request failures
  - [ ] Handle rate limiting
  - [ ] Handle malformed responses

### Content Hashing for Cache Invalidation
- [ ] Add content hash utility
- [ ] Use Node.js crypto module for SHA-256
- [ ] Implement `needsRetagging()` check
- [ ] Store hash with cached tags
- [ ] Compare hashes to detect changes

### Testing with Real LLM
- [ ] Create test note samples
- [ ] Test with problem-solution template
- [ ] Test with meeting template
- [ ] Test with research template
- [ ] Test with quick note
- [ ] Verify tag quality and relevance
- [ ] Tune prompt if needed

## Phase 3: UI Components (Days 3-4)

### Commands Implementation
- [ ] Register `noted.tagNote` command
  - [ ] Get active text editor
  - [ ] Check if it's a note file
  - [ ] Generate tags using TagGenerator
  - [ ] Show quick pick with suggestions
  - [ ] Allow multi-select
  - [ ] Apply selected tags
  - [ ] Show success message
- [ ] Register `noted.tagAllNotes` command
  - [ ] Show confirmation dialog
  - [ ] Get all note files
  - [ ] Show progress notification
  - [ ] Tag each note sequentially
  - [ ] Handle errors per note
  - [ ] Show summary on completion
- [ ] Register `noted.showTagSuggestions` command
  - [ ] Similar to tagNote but preview-only
  - [ ] Don't auto-apply
- [ ] Register `noted.manageNoteTags` command
  - [ ] Get current note's tags
  - [ ] Get AI suggestions
  - [ ] Show multi-select with both
  - [ ] Include "Add custom..." option
  - [ ] Update tags based on selection
- [ ] Register `noted.filterByTag` command
  - [ ] Show quick pick of all tags
  - [ ] Display note count per tag
  - [ ] On selection, show filtered notes
  - [ ] Open note on selection

### Context Menu Integration
- [ ] Add "Generate Tags" to note context menu
- [ ] Add "Manage Tags..." to note context menu
- [ ] Update `package.json` menus section

### Tag Tree View
- [ ] Create `src/tagging/TagTreeProvider.ts`
- [ ] Implement `TreeDataProvider<TagTreeItem>`
- [ ] Implement `getTreeItem()` method
- [ ] Implement `getChildren()` method
  - [ ] Root level: return all tags with counts
  - [ ] Tag level: return notes with that tag
- [ ] Create `TagTreeItem` class
  - [ ] Set appropriate icon (tag icon)
  - [ ] Set label with count
  - [ ] Set command for note items
- [ ] Add refresh mechanism
- [ ] Register tree provider in extension.ts
- [ ] Update `package.json` views section
  - [ ] Add "notedTagsView" to notedExplorer

### Status Bar Integration
- [ ] Create status bar item for tags
- [ ] Show tag count for active note
- [ ] Click to open manage tags command
- [ ] Update on active editor change
- [ ] Hide when not viewing a note

### Progress Indicators
- [ ] Implement progress for batch tagging
- [ ] Show "Tagging notes... (5/50)"
- [ ] Allow cancellation
- [ ] Handle cancellation gracefully

## Phase 4: Advanced Features & Polish (Days 4-5)

### Batch Tagging Options
- [ ] Add option: "Tag only untagged notes"
- [ ] Add option: "Re-tag all notes"
- [ ] Add option: "Tag notes from date range"
- [ ] Store user preference

### Tag Management Features
- [ ] Implement tag rename
  - [ ] Prompt for new tag name
  - [ ] Update all notes with old tag
  - [ ] Show progress for large operations
- [ ] Implement tag merge
  - [ ] Select two or more tags
  - [ ] Choose target tag name
  - [ ] Merge across all notes
- [ ] Implement bulk tag delete
  - [ ] Select tag to delete
  - [ ] Confirm deletion
  - [ ] Remove from all notes

### Tag Statistics
- [ ] Create statistics view/command
- [ ] Show most used tags (top 10)
- [ ] Show tags over time graph (text-based)
- [ ] Show tag co-occurrence
- [ ] Export statistics to file

### Enhanced Search
- [ ] Update existing search to filter by tags
- [ ] Add "Search within tag" option
- [ ] Show tags in search results

### Export Enhancement
- [ ] Add "Export by tag" option
- [ ] Group exported notes by tag
- [ ] Include tag in export metadata

### Auto-Tagging on Create
- [ ] Hook into note creation commands
- [ ] Check `autoTagOnCreate` setting
- [ ] Tag new notes automatically if enabled
- [ ] Show brief notification

## Phase 5: Testing & Documentation (Day 5)

### Unit Tests
- [ ] Write tests for TagParser
- [ ] Write tests for TagManager
- [ ] Write tests for TagGenerator (mocked)
- [ ] Write tests for utilities

### Integration Tests
- [ ] Test end-to-end tagging flow
- [ ] Test with multiple note formats (.txt, .md)
- [ ] Test with large note collections (100+ notes)
- [ ] Test tag tree view updates
- [ ] Test batch operations

### Manual Testing
- [ ] Test on fresh workspace
- [ ] Test with existing notes
- [ ] Test all commands manually
- [ ] Test error scenarios
  - [ ] Copilot not signed in
  - [ ] Network issues
  - [ ] Malformed notes
  - [ ] Read-only files
- [ ] Test performance with large note collection
- [ ] Test concurrent operations

### Documentation Updates
- [ ] Update README.md
  - [ ] Add "Smart Auto-Tagging" section
  - [ ] Add usage examples
  - [ ] Add screenshots (if applicable)
  - [ ] Document configuration options
- [ ] Update CHANGELOG.md
  - [ ] Add version entry
  - [ ] List new features
  - [ ] List new commands
  - [ ] List configuration options
- [ ] Update CLAUDE.md
  - [ ] Document new modules
  - [ ] Document architecture changes
  - [ ] Update command list

### Code Quality
- [ ] Run TypeScript compiler checks
- [ ] Fix any type errors
- [ ] Add JSDoc comments to public methods
- [ ] Clean up console.log statements
- [ ] Add appropriate error logging

## Phase 6: Release Preparation (Weekend)

### Version Bump
- [ ] Decide on version number (1.1.0)
- [ ] Update package.json version
- [ ] Run changelog generation
  ```bash
  pnpm run changelog
  ```

### Build & Package
- [ ] Run compile
  ```bash
  pnpm run compile
  ```
- [ ] Test compiled extension
- [ ] Package extension
  ```bash
  pnpm run package
  ```
- [ ] Test .vsix installation

### Pre-Release Checklist
- [ ] All tests passing
- [ ] Documentation complete
- [ ] CHANGELOG updated
- [ ] README updated
- [ ] No console errors in Extension Host
- [ ] Extension activates correctly
- [ ] All commands work as expected

### Publishing
- [ ] Test in VS Code Marketplace (manual upload)
- [ ] Verify extension page looks correct
- [ ] Verify icon displays correctly
- [ ] Monitor for early issues
- [ ] Prepare for user feedback

## Future Enhancements (Backlog)

### v1.2 Ideas
- [ ] Tag aliases/synonyms
- [ ] Hierarchical tags (parent/child)
- [ ] Tag colors in UI
- [ ] Tag cloud visualization
- [ ] Quick pick search by tag in global search

### v2.0 Ideas
- [ ] Machine learning from corrections
- [ ] Context-aware tag suggestions
- [ ] Team/collaborative tagging
- [ ] Tag-based workspace organization
- [ ] Integration with other extensions

## Notes & Decisions

### Key Decisions Made
- Use YAML frontmatter for tag storage (widely supported, human-readable)
- Store confidence scores for transparency
- Separate tag view instead of inline in notes tree
- Cache tags in memory for performance
- Support both AI and manual tags

### Open Questions to Resolve
- [ ] Should tags be case-sensitive? (Recommendation: No, normalize to lowercase)
- [ ] Should we support multi-word tags with spaces? (Recommendation: No, use hyphens)
- [ ] Should batch tagging be cancellable? (Recommendation: Yes, important for UX)
- [ ] Should we persist cache to disk? (Recommendation: Start with memory, add persistence if needed)
- [ ] Should we show confidence scores in UI? (Recommendation: Yes, but subtle)

### Performance Targets
- Single note tagging: < 2 seconds
- Batch tagging: ~50 notes/minute
- Tag search: < 100ms for 1000+ notes
- Tree view load: < 500ms

### Dependencies Added
- `js-yaml`: For frontmatter parsing
- `@types/js-yaml`: TypeScript definitions

## Timeline Summary

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1 | 2 days | Core infrastructure, storage, config |
| Phase 2 | 1 day | AI integration, LLM prompts |
| Phase 3 | 1.5 days | UI, commands, tree view |
| Phase 4 | 1 day | Advanced features, polish |
| Phase 5 | 0.5 days | Testing, documentation |
| Phase 6 | Weekend | Build, package, release |
| **Total** | **~6 days** | **MVP to release** |

## Getting Started

1. Create feature branch:
   ```bash
   git checkout -b feature/smart-auto-tagging
   ```

2. Install dependencies:
   ```bash
   pnpm add js-yaml
   pnpm add -D @types/js-yaml
   ```

3. Create directory structure:
   ```bash
   mkdir -p src/tagging
   ```

4. Start with Phase 1, Task 1!
