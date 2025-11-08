# Smart Search Enhancement Implementation Task List

## Phase 1: Foundation & Query Analysis (Days 1-2)

### Setup & Dependencies
- [ ] Evaluate optional dependencies
  ```bash
  # Optional: for natural language date parsing
  pnpm add chrono-node
  pnpm add -D @types/chrono-node
  
  # Optional: for fuzzy matching
  pnpm add fuse.js
  ```
- [ ] Create `src/search/` directory for search-related modules
- [ ] Move existing `searchInNotes()` to new module structure

### Query Analyzer Implementation
- [ ] Create `src/search/QueryAnalyzer.ts`
- [ ] Define `SearchQuery` interface
  ```typescript
  interface SearchQuery {
    rawQuery: string;
    intent: 'keyword' | 'semantic' | 'hybrid';
    semanticQuery?: string;
    filters: SearchFilters;
    options: SearchOptions;
  }
  ```
- [ ] Define `SearchFilters` interface
- [ ] Define `SearchOptions` interface
- [ ] Implement `analyzeQuery()` method
  - [ ] Detect question patterns (who, what, when, where, why, how)
  - [ ] Extract date references ("yesterday", "last week", "October")
  - [ ] Extract tag references (#tag syntax)
  - [ ] Determine if semantic search needed
  - [ ] Clean query for semantic processing
- [ ] Implement `extractDateFilter()` method
  - [ ] Use chrono-node for natural language dates
  - [ ] Handle relative dates (yesterday, last week, etc.)
  - [ ] Handle absolute dates (October 15, 2025-10-15, etc.)
  - [ ] Handle date ranges (October 1-15, last month, etc.)
- [ ] Implement `extractTags()` method
  - [ ] Find #tag patterns in query
  - [ ] Support multiple tags
  - [ ] Remove tags from semantic query portion
- [ ] Implement `needsSemanticSearch()` method
  - [ ] Detect question words
  - [ ] Detect conceptual queries (vs specific keyword searches)
  - [ ] Check query length and complexity
- [ ] Implement `cleanForSemantic()` method
  - [ ] Remove date filters
  - [ ] Remove tag filters
  - [ ] Keep semantic meaning
- [ ] Add unit tests for QueryAnalyzer
  - [ ] Test date extraction
  - [ ] Test tag extraction
  - [ ] Test intent detection
  - [ ] Test query cleaning

### Keyword Search Enhancement
- [ ] Refactor existing `searchInNotes()` function
- [ ] Create `src/search/KeywordSearch.ts`
- [ ] Define `SearchResult` interface
  ```typescript
  interface SearchResult {
    filePath: string;
    fileName: string;
    score: number;
    matchType: 'keyword' | 'semantic' | 'both';
    matches: MatchInfo[];
    preview: string;
    metadata: any;
  }
  ```
- [ ] Implement `KeywordSearch` class
  - [ ] Port existing functionality
  - [ ] Return structured `SearchResult[]` instead of simple objects
  - [ ] Add relevance scoring for keyword matches
  - [ ] Count keyword frequency
  - [ ] Boost title matches
  - [ ] Consider proximity of keywords
- [ ] Add fuzzy matching (optional)
  - [ ] Use fuse.js for typo tolerance
  - [ ] Configure threshold
- [ ] Implement `generatePreview()` method
  - [ ] Extract context around matches
  - [ ] Limit to 150 characters
  - [ ] Show best matching line
- [ ] Add unit tests for keyword search

### Configuration Setup
- [ ] Update `package.json` configuration section
- [ ] Add `noted.search.enableSemantic` setting (default: true)
- [ ] Add `noted.search.maxResults` setting (default: 20)
- [ ] Add `noted.search.minRelevanceScore` setting (default: 0.5)
- [ ] Add `noted.search.cacheEmbeddings` setting (default: true)
- [ ] Add `noted.search.autoIndexOnStartup` setting (default: false)
- [ ] Add `noted.search.chunkSize` setting (default: 2000)
- [ ] Add `noted.search.enableFuzzyMatch` setting (default: false)

## Phase 2: Semantic Search Foundation (Days 2-3)

### Approach Decision
- [ ] Review the three LLM integration approaches in design doc
- [ ] Decision: Start with **Approach B** (Direct LLM Similarity)
- [ ] Reason: Most accurate for MVP, works with VS Code API, clear path to Approach C

### Semantic Search Engine Implementation
- [ ] Create `src/search/SemanticSearchEngine.ts`
- [ ] Implement `search()` method
  - [ ] Accept query and list of note files
  - [ ] For each note, call `scoreRelevance()`
  - [ ] Filter by minimum score threshold
  - [ ] Sort by score descending
  - [ ] Return SearchResult[]
- [ ] Implement `scoreRelevance()` method
  - [ ] Check for Copilot availability
  - [ ] Read note content
  - [ ] Truncate if too long (max 3000 chars)
  - [ ] Build relevance scoring prompt
  - [ ] Send to LLM
  - [ ] Parse score (0.0-1.0)
  - [ ] Handle errors gracefully
  - [ ] Return score
- [ ] Implement `generatePreview()` method
  - [ ] Use LLM to extract relevant excerpt
  - [ ] Build excerpt extraction prompt
  - [ ] Limit to 150 characters
  - [ ] Return preview text
- [ ] Add error handling
  - [ ] Handle Copilot not available
  - [ ] Handle LLM request failures
  - [ ] Handle parsing errors
  - [ ] Log errors appropriately
- [ ] Add rate limiting awareness
  - [ ] Detect rate limit errors
  - [ ] Implement backoff strategy
  - [ ] Show user-friendly messages

### Prompt Engineering
- [ ] Design relevance scoring prompt
  - [ ] Clear instructions
  - [ ] Examples of scores
  - [ ] Handle edge cases (empty notes, off-topic)
  - [ ] Request JSON format for easier parsing
- [ ] Design excerpt extraction prompt
  - [ ] Request relevant section
  - [ ] Specify length limit
  - [ ] Handle no-match case
- [ ] Test prompts with various queries
  - [ ] Question queries ("What bugs did I fix?")
  - [ ] Conceptual queries ("performance issues")
  - [ ] Specific queries ("authentication error")
- [ ] Tune prompts based on results
  - [ ] Adjust scoring criteria
  - [ ] Improve excerpt quality
  - [ ] Handle ambiguous queries better

### Testing with Real LLM
- [ ] Create diverse test note samples
  - [ ] Problem-solution notes
  - [ ] Meeting notes
  - [ ] Research notes
  - [ ] Quick notes
- [ ] Test queries
  - [ ] "bugs fixed last week"
  - [ ] "authentication issues"
  - [ ] "What did I learn about React?"
  - [ ] "performance optimization"
- [ ] Evaluate result quality
  - [ ] Are relevant notes ranked high?
  - [ ] Are irrelevant notes filtered out?
  - [ ] Are previews helpful?
- [ ] Measure performance
  - [ ] Time per note scoring
  - [ ] Total search time for N notes
  - [ ] Identify bottlenecks

## Phase 3: Search Orchestration (Days 3-4)

### Search Orchestrator Implementation
- [ ] Create `src/search/SearchOrchestrator.ts`
- [ ] Implement constructor
  - [ ] Initialize KeywordSearch
  - [ ] Initialize SemanticSearchEngine
  - [ ] Load configuration
- [ ] Implement main `search()` method
  - [ ] Accept raw query string
  - [ ] Call QueryAnalyzer to analyze query
  - [ ] Route to appropriate search strategy:
    - [ ] Keyword-only if intent is 'keyword'
    - [ ] Semantic if intent is 'semantic'
    - [ ] Hybrid if intent is 'hybrid'
  - [ ] Apply filters (date, tags)
  - [ ] Return merged and ranked results
- [ ] Implement `keywordOnlySearch()` method
  - [ ] Use KeywordSearch
  - [ ] Apply filters
  - [ ] Return results
- [ ] Implement `semanticOnlySearch()` method
  - [ ] Use SemanticSearchEngine
  - [ ] Apply filters
  - [ ] Return results
- [ ] Implement `hybridSearch()` method (IMPORTANT)
  - [ ] Step 1: Fast keyword pre-filter
  - [ ] Get top N keyword results (e.g., 20)
  - [ ] Step 2: Semantic re-ranking on filtered set
  - [ ] Score each with LLM
  - [ ] Merge and sort by final score
  - [ ] Return combined results
- [ ] Implement `applyFilters()` method
  - [ ] Filter by date range
  - [ ] Filter by tags
  - [ ] Filter by file format
  - [ ] Filter by template type
- [ ] Implement `mergeResults()` method
  - [ ] Combine keyword and semantic results
  - [ ] Deduplicate (same file may appear in both)
  - [ ] Calculate combined score
  - [ ] Sort by final score
- [ ] Add error handling and fallbacks
  - [ ] If semantic fails, use keyword
  - [ ] If both fail, show helpful error
  - [ ] Don't crash the extension

### Result Caching
- [ ] Create simple in-memory cache
- [ ] Cache query results for repeat searches
- [ ] Implement cache invalidation
  - [ ] On file changes
  - [ ] On note creation/deletion
  - [ ] Time-based expiry (e.g., 5 minutes)
- [ ] Add cache statistics for debugging

### File System Utilities
- [ ] Create `getAllNoteFiles()` helper
  - [ ] Scan notes directory recursively
  - [ ] Return array of file paths
  - [ ] Filter by format (.txt, .md)
- [ ] Create `readNoteContent()` helper
  - [ ] Read file content
  - [ ] Handle errors gracefully
  - [ ] Return empty string if fails
- [ ] Create `extractMetadata()` helper
  - [ ] Get file stats (created, modified)
  - [ ] Parse tags from frontmatter (if available)
  - [ ] Detect template type from content
  - [ ] Return metadata object

## Phase 4: Enhanced UI (Days 4-5)

### Update Search Command
- [ ] Locate existing `noted.searchNotes` command in extension.ts
- [ ] Refactor to use new SearchOrchestrator
- [ ] Update input prompt
  - [ ] Change placeholder to encourage natural language
  - [ ] Add examples in tooltip
- [ ] Add progress indicator
  - [ ] Show "Searching notes..." notification
  - [ ] Make it cancellable
  - [ ] Update progress as searching
- [ ] Enhance Quick Pick items
  - [ ] Create `EnhancedSearchItem` interface
  - [ ] Include score in description
  - [ ] Include match type (keyword/semantic)
  - [ ] Use appropriate icons
    - [ ] `$(star)` for semantic matches
    - [ ] `$(search)` for keyword matches
  - [ ] Show preview in detail field
- [ ] Improve Quick Pick configuration
  - [ ] Set helpful placeholder
  - [ ] Enable match on description
  - [ ] Enable match on detail (for searching within results)
- [ ] Add "no results" handling
  - [ ] Show helpful message
  - [ ] Suggest trying different query
  - [ ] Offer to search again
- [ ] Open selected note
  - [ ] Get selected result
  - [ ] Open in editor
  - [ ] Optionally scroll to relevant section (future enhancement)

### Build Search Index Command
- [ ] Register `noted.buildSearchIndex` command
- [ ] Implement command handler
  - [ ] Show confirmation dialog (optional)
  - [ ] Show progress notification
  - [ ] Call orchestrator.buildIndex()
  - [ ] Update progress incrementally
  - [ ] Show completion message
  - [ ] Handle errors gracefully
- [ ] Add to command palette
- [ ] Update package.json commands section
- [ ] Document command in README

### Search Result Actions
- [ ] Add context menu to search results (future enhancement)
  - [ ] "Find similar notes"
  - [ ] "Copy excerpt"
  - [ ] "Show full context"
- [ ] Add keyboard shortcuts for search
  - [ ] Update existing Cmd+Shift+F if used
  - [ ] Or assign new shortcut

### Status Bar Integration (Optional)
- [ ] Create status bar item for search
- [ ] Show search index status
  - [ ] "Search: Ready" when indexed
  - [ ] "Search: Building index..." during indexing
  - [ ] "Search: Keyword only" if semantic disabled
- [ ] Click to trigger search
- [ ] Update on configuration changes

## Phase 5: Advanced Features (Days 5-6)

### Hybrid Search Optimization
- [ ] Implement smart pre-filtering
  - [ ] Use keyword search to get candidates
  - [ ] Limit candidates to top N (configurable)
  - [ ] Apply semantic search only to candidates
- [ ] Add configuration for hybrid behavior
  - [ ] `noted.search.hybridCandidates` (default: 20)
  - [ ] `noted.search.hybridEnabled` (default: true)
- [ ] Test performance improvement
  - [ ] Measure time saved
  - [ ] Verify result quality maintained

### Search History
- [ ] Create `SearchHistory` class
- [ ] Store recent searches (max 10)
- [ ] Persist to workspace storage
- [ ] Show recent searches at top of Quick Pick
  - [ ] Different icon for history items
  - [ ] Show timestamp
  - [ ] Click to search again
- [ ] Add "Clear history" command

### Search Filters UI
- [ ] Add filter button to Quick Pick
  - [ ] Create QuickInputButton for filter
  - [ ] Set icon and tooltip
  - [ ] Handle button trigger
- [ ] Implement filter selection flow
  - [ ] Show filter type picker (date, tags, template)
  - [ ] For date: show common ranges + custom
  - [ ] For tags: show all available tags
  - [ ] For template: show template types
- [ ] Apply filters to search
  - [ ] Re-run search with filters
  - [ ] Show active filters in UI
  - [ ] Allow removing filters
- [ ] Persist filter preferences

### Context Actions
- [ ] Implement "Find similar notes" command
  - [ ] Use current note as query
  - [ ] Extract key concepts
  - [ ] Search for similar notes
  - [ ] Show results
- [ ] Add to note context menu
- [ ] Add to editor context menu when note is active

### Search Refinement
- [ ] Add "Search within results" option
  - [ ] Show in Quick Pick buttons
  - [ ] Apply additional filter to current results
  - [ ] Show refined results
- [ ] Add "More like this" for individual results
  - [ ] Extract key terms from selected result
  - [ ] Search for similar notes
- [ ] Add "Exclude from results" option
  - [ ] Remove selected item
  - [ ] Continue searching in remaining results

## Phase 6: Testing & Documentation (Day 6)

### Unit Tests
- [ ] Write tests for QueryAnalyzer
  - [ ] Test various query formats
  - [ ] Test date extraction
  - [ ] Test tag extraction
  - [ ] Test intent detection
- [ ] Write tests for KeywordSearch
  - [ ] Test exact matches
  - [ ] Test fuzzy matching
  - [ ] Test scoring
- [ ] Write tests for SearchOrchestrator
  - [ ] Test routing logic
  - [ ] Test filter application
  - [ ] Test result merging

### Integration Tests
- [ ] Create test note collection (20-30 notes)
- [ ] Test keyword search
  - [ ] Verify correct results returned
  - [ ] Verify scoring makes sense
- [ ] Test semantic search (with Copilot available)
  - [ ] Verify relevant notes ranked high
  - [ ] Verify irrelevant notes filtered out
  - [ ] Verify previews are helpful
- [ ] Test hybrid search
  - [ ] Verify pre-filtering works
  - [ ] Verify final ranking is accurate
  - [ ] Measure performance improvement
- [ ] Test with various query types
  - [ ] Questions
  - [ ] Conceptual queries
  - [ ] Specific keywords
  - [ ] Queries with filters

### Performance Testing
- [ ] Test with large note collection (100+ notes)
  - [ ] Measure keyword search time
  - [ ] Measure semantic search time
  - [ ] Measure hybrid search time
- [ ] Test caching effectiveness
  - [ ] First search vs repeat search
  - [ ] Measure cache hit rate
- [ ] Identify bottlenecks
  - [ ] Profile LLM call times
  - [ ] Profile file I/O
  - [ ] Profile scoring logic
- [ ] Optimize if needed

### Manual Testing
- [ ] Test on fresh workspace
- [ ] Test with real notes (developer's own notes)
- [ ] Test various query patterns
  - [ ] "What bugs did I fix last week?"
  - [ ] "authentication issues"
  - [ ] "#react performance"
  - [ ] "meeting notes October"
- [ ] Test error scenarios
  - [ ] Copilot not signed in
  - [ ] Network issues during LLM call
  - [ ] Empty notes folder
  - [ ] Malformed queries
- [ ] Test UI/UX
  - [ ] Quick Pick is responsive
  - [ ] Progress indicators work
  - [ ] Results are readable
  - [ ] Actions work as expected
- [ ] Test edge cases
  - [ ] Very long queries
  - [ ] Empty query
  - [ ] Special characters in query
  - [ ] Non-English queries (if applicable)

### Documentation Updates
- [ ] Update README.md
  - [ ] Add "Smart Search" section
  - [ ] Include feature description
  - [ ] Add usage examples
  - [ ] Document configuration options
  - [ ] Add tips for best results
  - [ ] Include screenshots (if applicable)
- [ ] Update CHANGELOG.md
  - [ ] Add version entry (e.g., 1.2.0)
  - [ ] List new features
  - [ ] List new commands
  - [ ] List configuration options
  - [ ] Mention improvements to existing search
- [ ] Update CLAUDE.md
  - [ ] Document new search architecture
  - [ ] Document new modules and classes
  - [ ] Update command list
  - [ ] Add implementation notes
- [ ] Create search documentation page (optional)
  - [ ] Detailed guide on using semantic search
  - [ ] Query examples
  - [ ] Troubleshooting tips
  - [ ] FAQ

### Code Quality
- [ ] Run TypeScript compiler
  - [ ] Fix any type errors
  - [ ] Ensure strict mode compliance
- [ ] Add JSDoc comments
  - [ ] Document all public methods
  - [ ] Add parameter descriptions
  - [ ] Add return type descriptions
- [ ] Code cleanup
  - [ ] Remove console.log statements
  - [ ] Add appropriate error logging
  - [ ] Remove commented-out code
  - [ ] Format code consistently
- [ ] Run linter (if configured)
  - [ ] Fix any linting errors
  - [ ] Apply auto-fixes
- [ ] Review code for best practices
  - [ ] Error handling complete
  - [ ] No memory leaks
  - [ ] Proper resource disposal

## Phase 7: Release Preparation (Weekend)

### Version Bump
- [ ] Decide on version number (1.2.0 recommended)
- [ ] Update package.json version
- [ ] Run changelog generation
  ```bash
  pnpm run changelog
  ```
- [ ] Review and edit generated changelog

### Build & Package
- [ ] Clean build directory
  ```bash
  rm -rf out/
  ```
- [ ] Run full compile
  ```bash
  pnpm run compile
  ```
- [ ] Fix any compilation errors
- [ ] Test compiled extension in Extension Development Host
  - [ ] Verify all features work
  - [ ] Verify no console errors
  - [ ] Test search thoroughly
- [ ] Package extension
  ```bash
  pnpm run package
  ```
- [ ] Verify .vsix file created

### Pre-Release Testing
- [ ] Install .vsix in fresh VS Code instance
- [ ] Test with fresh workspace
- [ ] Verify all commands registered
- [ ] Test search with and without Copilot
- [ ] Verify configuration options work
- [ ] Test with existing Noted users' notes
- [ ] Check for any console errors
- [ ] Verify performance is acceptable

### Pre-Release Checklist
- [ ] All tests passing
- [ ] Documentation complete and accurate
- [ ] CHANGELOG.md updated
- [ ] README.md updated
- [ ] CLAUDE.md updated
- [ ] No TypeScript errors
- [ ] No console errors in Extension Host
- [ ] Extension activates correctly
- [ ] All commands work as expected
- [ ] Search results are relevant
- [ ] Performance is acceptable
- [ ] Error handling works properly
- [ ] Configuration options work

### Publishing
- [ ] Review extension marketplace page
- [ ] Update description if needed
- [ ] Upload .vsix to marketplace (manual)
- [ ] Verify extension page looks correct
  - [ ] Icon displays correctly
  - [ ] Description is clear
  - [ ] Screenshots are helpful (if added)
  - [ ] Version number is correct
- [ ] Publish extension
- [ ] Verify installation from marketplace
- [ ] Monitor for early user issues
- [ ] Prepare to respond to feedback

### Post-Release
- [ ] Monitor extension analytics
- [ ] Watch for error reports
- [ ] Respond to user feedback
- [ ] Plan bug fix releases if needed
- [ ] Consider collecting usage metrics
  - [ ] How many searches per day?
  - [ ] Semantic vs keyword usage?
  - [ ] Search success rate?

## Future Enhancements (Backlog)

### v1.3 Ideas
- [ ] Search Panel UI (dedicated webview)
  - [ ] Rich results display
  - [ ] Side-by-side preview
  - [ ] Advanced filters
  - [ ] Search history
- [ ] Saved searches
  - [ ] Save frequent queries
  - [ ] Quick access to saved searches
  - [ ] Export/import saved searches
- [ ] Search suggestions as you type
  - [ ] Autocomplete queries
  - [ ] Suggest similar searches
- [ ] "Find similar" from context menu
  - [ ] Right-click any note
  - [ ] Find conceptually similar notes
- [ ] Export search results
  - [ ] To markdown file
  - [ ] To CSV
  - [ ] Include metadata

### v2.0 Ideas
- [ ] True embeddings (if API supports it)
  - [ ] Replace LLM scoring with embeddings
  - [ ] Vector database for fast similarity search
  - [ ] Better semantic understanding
- [ ] Cross-workspace search
  - [ ] Search across all workspaces
  - [ ] Unified search index
- [ ] Search API for other extensions
  - [ ] Public API for search
  - [ ] Allow other extensions to query notes
- [ ] Search analytics
  - [ ] Trending topics in notes
  - [ ] Search patterns over time
  - [ ] Popular queries
- [ ] Voice search integration (if API available)
- [ ] Real-time search (as you type)
- [ ] Collaborative search (team features)

## Notes & Decisions

### Key Architecture Decisions
- **Hybrid approach for UI**: Start with enhanced Quick Pick, add panel later if needed
- **Direct LLM similarity**: More accurate than pseudo-embeddings, works with current API
- **Smart pre-filtering**: Use keyword search to narrow candidates before semantic search
- **Lazy indexing**: Don't build index until needed, save startup time
- **Graceful degradation**: Fall back to keyword search if semantic fails

### Performance Trade-offs
- **Accuracy vs Speed**: Chose accuracy for MVP (direct LLM scoring)
- **Optimization**: Plan to add hybrid pre-filtering to improve speed
- **Caching**: Essential for acceptable performance with LLM-based approach

### Open Questions to Resolve
- [ ] Should we cache LLM relevance scores? (Recommendation: Yes, with TTL)
- [ ] Should we support search operators (AND, OR, NOT)? (Recommendation: Not for MVP)
- [ ] Should search be incremental (as-you-type)? (Recommendation: Too slow with LLM, skip for now)
- [ ] How many notes can we reasonably support? (Recommendation: Cap at 100 for full semantic, suggest filters for larger collections)
- [ ] Should we persist search history? (Recommendation: Yes, in workspace storage)

### Performance Targets
- Keyword search: < 100ms (maintain current speed)
- Semantic search (full): < 10 seconds for 100 notes
- Semantic search (hybrid): < 3 seconds for 100 notes
- Query analysis: < 50ms
- Search with cache hit: < 500ms

### Dependencies
**Required:**
- VS Code LLM API (Copilot)
- Existing search functionality

**Optional:**
- `chrono-node`: Natural language date parsing (~100KB)
- `fuse.js`: Fuzzy search (~10KB)

## Timeline Summary

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1 | 1 day | Foundation, query analysis, keyword enhancement |
| Phase 2 | 1 day | Semantic search with LLM integration |
| Phase 3 | 1 day | Search orchestration, hybrid search |
| Phase 4 | 1 day | Enhanced UI, commands |
| Phase 5 | 1 day | Advanced features, optimization |
| Phase 6 | 1 day | Testing, documentation |
| Phase 7 | Weekend | Build, package, release |
| **Total** | **~6 days** | **MVP to release** |

## Getting Started

1. **Review design document thoroughly**
   - Understand architecture decisions
   - Review LLM integration approaches
   - Understand hybrid search strategy

2. **Create feature branch:**
   ```bash
   git checkout -b feature/smart-search
   ```

3. **Optional: Install dependencies:**
   ```bash
   pnpm add chrono-node fuse.js
   pnpm add -D @types/chrono-node
   ```

4. **Create directory structure:**
   ```bash
   mkdir -p src/search
   ```

5. **Start with Phase 1, Task 1!**
   - Begin with QueryAnalyzer
   - Test each component as you build
   - Commit frequently

## Tips for Success

- **Test early and often** with real Copilot LLM calls
- **Start simple** - get basic semantic search working before optimizations
- **Profile performance** - LLM calls will be the bottleneck
- **Handle errors gracefully** - Copilot may not always be available
- **Get user feedback** - semantic search quality is subjective
- **Document prompts** - prompt engineering is critical for good results
