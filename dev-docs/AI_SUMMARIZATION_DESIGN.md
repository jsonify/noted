# Noted AI Summarization Feature Design

## Overview

This document outlines the design for adding AI-powered summarization capabilities to the Noted extension using VS Code's Language Model API. This feature will leverage the built-in Copilot LLM to provide intelligent summaries of notes, helping users quickly understand and navigate their note collection.

## Goals

1. **Quick Understanding**: Allow users to quickly grasp the content of notes without reading them entirely
2. **Batch Processing**: Enable summarization of multiple notes (week/month views)
3. **Context Preservation**: Maintain note structure and important details in summaries
4. **Non-Intrusive**: Provide summaries without modifying original notes
5. **Progressive Enhancement**: Work as an optional feature that enhances existing functionality

## Use Cases

### Primary Use Cases

1. **Single Note Summary**
   - User right-clicks a note in the tree view
   - Selects "Summarize Note"
   - Summary appears in a new editor tab or panel

2. **Time Range Summary**
   - User right-clicks a month folder
   - Selects "Summarize Month's Notes"
   - Combined summary of all notes in that period

3. **Recent Activity Summary**
   - Command: "Noted: Summarize Recent Notes"
   - Summarizes last 7 days of activity
   - Useful for weekly reviews or status updates

4. **Search Results Summary**
   - After performing a search, option to "Summarize Results"
   - Provides overview of what was found across matching notes

### Secondary Use Cases

1. **Quick Peek Summary**
   - Hover tooltip on notes shows AI-generated preview
   - Cached for performance

2. **Export with Summaries**
   - Enhanced export that includes summaries before full content
   - Executive summary + detailed notes format

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Noted Extension                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐      ┌──────────────────────┐    │
│  │  Command Layer   │──────│  Summarization       │    │
│  │  - Commands      │      │  Service             │    │
│  │  - Context Menus │      │  - LLM Integration   │    │
│  └──────────────────┘      │  - Prompt Templates  │    │
│           │                 │  - Cache Management  │    │
│           ↓                 └──────────────────────┘    │
│  ┌──────────────────┐               ↓                   │
│  │  UI Components   │      ┌──────────────────────┐    │
│  │  - Summary View  │      │  VS Code Language    │    │
│  │  - Progress      │──────│  Model API           │    │
│  │  - Notifications │      │  (Copilot)           │    │
│  └──────────────────┘      └──────────────────────┘    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. SummarizationService

**Responsibilities:**
- Interact with VS Code Language Model API
- Manage prompt construction for different summary types
- Handle streaming responses
- Implement retry logic for API failures
- Cache summaries to avoid redundant API calls

**Key Methods:**
```typescript
class SummarizationService {
  // Summarize a single note
  async summarizeNote(filePath: string, options?: SummaryOptions): Promise<string>

  // Summarize multiple notes with context
  async summarizeNotes(filePaths: string[], options?: SummaryOptions): Promise<string>

  // Get or create cached summary
  async getCachedSummary(filePath: string): Promise<string | null>

  // Clear cache for a specific note or all
  clearCache(filePath?: string): void
}

interface SummaryOptions {
  maxLength?: 'short' | 'medium' | 'long'; // Target summary length
  format?: 'paragraph' | 'bullets' | 'structured';
  includeActionItems?: boolean;
  includeKeywords?: boolean;
}
```

#### 2. Summary View Component

**Responsibilities:**
- Display summaries in a readable format
- Show progress during generation
- Allow copying/exporting summaries
- Provide feedback on summary quality

**Implementation:**
- Use VS Code's WebView API for rich formatting
- Or use a simple text editor with markdown
- Include metadata: generation time, note count, date range

#### 3. Cache Management

**Storage Strategy:**
- Use VS Code's `globalState` for persistent cache
- Cache key: `hash(filePath + file.mtime)`
- Invalidate cache when file is modified
- Implement LRU eviction (keep last 100 summaries)

**Cache Structure:**
```typescript
interface CachedSummary {
  filePath: string;
  summary: string;
  generatedAt: Date;
  fileModifiedAt: Date;
  options: SummaryOptions;
}
```

### Prompt Engineering

#### Single Note Prompt Template

```
You are analyzing a note from a developer's workspace note-taking system.
Provide a concise summary of the following note.

Note content:
---
{noteContent}
---

Summary requirements:
- Length: {maxLength} (approximately {wordCount} words)
- Format: {format}
- Focus on: main topics, key decisions, action items, and outcomes
{includeActionItems ? '- Extract action items as a bulleted list' : ''}
{includeKeywords ? '- Include 3-5 relevant keywords/tags' : ''}

Provide only the summary without preamble.
```

#### Multi-Note Prompt Template

```
You are analyzing multiple notes from a developer's workspace spanning {dateRange}.
Provide a cohesive summary that synthesizes the content across all notes.

Notes:
{notesWithDates}

Summary requirements:
- Identify common themes and patterns
- Highlight key accomplishments and decisions
- Note any open questions or unresolved issues
- Organize chronologically when relevant
- Format: {format}

Provide only the summary without preamble.
```

### Commands

#### New Commands to Add

```typescript
// Single note summarization
'noted.summarizeNote'           // Right-click on note
'noted.summarizeCurrentNote'    // Active editor command

// Batch summarization
'noted.summarizeMonth'          // Right-click on month folder
'noted.summarizeWeek'           // Command palette
'noted.summarizeRecent'         // Last 7 days

// Search integration
'noted.summarizeSearchResults'  // After search

// Management
'noted.clearSummaryCache'       // Clear all cached summaries
'noted.configureSummarySettings' // Open settings
```

#### Command Placement

**package.json additions:**
```json
{
  "commands": [
    {
      "command": "noted.summarizeNote",
      "title": "Noted: Summarize Note",
      "icon": "$(sparkle)"
    },
    {
      "command": "noted.summarizeRecent",
      "title": "Noted: Summarize Recent Notes",
      "icon": "$(sparkle)"
    }
  ],
  "menus": {
    "view/item/context": [
      {
        "command": "noted.summarizeNote",
        "when": "view == notedView && viewItem == note",
        "group": "ai@1"
      },
      {
        "command": "noted.summarizeMonth",
        "when": "view == notedView && viewItem == month",
        "group": "ai@1"
      }
    ],
    "editor/context": [
      {
        "command": "noted.summarizeCurrentNote",
        "when": "resourcePath =~ /Notes.*\\.(txt|md)$/",
        "group": "ai@1"
      }
    ]
  }
}
```

### Configuration Settings

New settings in `package.json`:

```json
"noted.ai.enabled": {
  "type": "boolean",
  "default": true,
  "description": "Enable AI-powered summarization features"
},
"noted.ai.summaryLength": {
  "type": "string",
  "enum": ["short", "medium", "long"],
  "default": "medium",
  "description": "Default summary length"
},
"noted.ai.summaryFormat": {
  "type": "string",
  "enum": ["paragraph", "bullets", "structured"],
  "default": "structured",
  "description": "Default summary format"
},
"noted.ai.autoSummarize": {
  "type": "boolean",
  "default": false,
  "description": "Automatically generate summaries for new notes after 1 minute of inactivity."
},
"noted.ai.includeActionItems": {
  "type": "boolean",
  "default": true,
  "description": "Extract action items in summaries"
},
"noted.ai.cacheEnabled": {
  "type": "boolean",
  "default": true,
  "description": "Cache generated summaries for better performance"
}
```

## User Experience Flow

### Single Note Summary Flow

1. User right-clicks note → "Summarize Note"
2. Progress notification appears: "Generating summary..."
3. Summary opens in new editor tab titled: "Summary: {note-name}"
4. Summary shows:
   - Original note metadata (date, path)
   - AI-generated summary
   - Action items (if any)
   - Keywords/tags (if enabled)
   - Footer: "Generated by Copilot • {timestamp}"

### Month Summary Flow

1. User right-clicks month folder → "Summarize Month's Notes"
2. Progress shows: "Analyzing 15 notes from October 2025..."
3. Summary opens showing:
   - Month overview
   - Key themes and patterns
   - Chronological highlights
   - Total notes processed
   - Link to each summarized note

## Error Handling

### Common Scenarios

1. **Copilot Not Available**
   - Show friendly message: "This feature requires GitHub Copilot"
   - Provide link to Copilot documentation
   - Disable AI commands gracefully

2. **API Rate Limiting**
   - Implement exponential backoff
   - Show progress: "Waiting for API availability..."
   - Queue multiple requests

3. **Large File Handling**
   - Truncate content that exceeds token limits
   - Show warning: "Note truncated for summarization"
   - Offer to split into sections

4. **Network Errors**
   - Retry up to 3 times
   - Show error message with retry button
   - Fall back to cached summary if available

## Performance Considerations

### Optimization Strategies

1. **Caching**
   - Cache summaries with file modification time
   - Invalidate only when file changes
   - Keep cache size under 10MB

2. **Streaming**
   - Show partial summaries as they generate
   - Allow user to stop generation early
   - Progress indicator during streaming

3. **Batch Processing**
   - Process notes in parallel (max 3 concurrent)
   - Show aggregate progress bar
   - Allow cancellation of batch operations

4. **Token Management**
   - Estimate tokens before sending
   - Truncate intelligently (preserve headers/action items)
   - Warn user if note is too large

## Privacy & Security

### Considerations

1. **Data Handling**
   - Notes are sent to Copilot API (Microsoft/OpenAI)
   - No data is stored externally by Noted
   - Cache is local to VS Code workspace

2. **User Consent**
   - First-time use shows disclaimer
   - User can disable AI features anytime
   - Clear documentation about data flow

3. **Sensitive Information**
   - Warn users about sharing sensitive notes
   - Option to exclude specific folders
   - Consider adding keyword filters (future)

## Implementation Phases

### Phase 1: Core Functionality (MVP)
- [x] Design document
- [ ] Add Language Model API to package.json
- [ ] Implement SummarizationService
- [ ] Add "Summarize Note" command
- [ ] Basic summary display in new editor
- [ ] Error handling for missing Copilot

**Estimated effort:** 2-3 days

### Phase 2: Enhanced Features
- [ ] Batch summarization (week/month)
- [ ] Cache implementation
- [ ] Progress indicators
- [ ] Summary formatting options
- [ ] Configuration settings

**Estimated effort:** 2-3 days

### Phase 3: Polish & Integration
- [ ] Search results summarization
- [ ] Export with summaries
- [ ] Hover tooltips with previews
- [ ] Action item extraction
- [ ] Keyword generation

**Estimated effort:** 2-3 days

### Phase 4: Advanced Features (Future)
- [ ] Custom prompt templates
- [ ] Summary history/versions
- [ ] Comparison between note versions
- [ ] Semantic search using embeddings
- [ ] Auto-tagging based on content

**Estimated effort:** 4-5 days

## Testing Strategy

### Unit Tests
- SummarizationService methods
- Prompt template generation
- Cache management logic
- Error handling scenarios

### Integration Tests
- VS Code API mocking
- Command execution
- Tree view context menu actions

### Manual Testing
- Test with various note sizes
- Test with different template types
- Test batch operations
- Test error scenarios (no Copilot, rate limits)

## Dependencies

### Required
- VS Code API version: ^1.90.0 (for stable Language Model API)
- No additional npm packages needed

### Optional (Future)
- `markdown-it` - For rich summary rendering
- `turndown` - For markdown conversion if needed

## Success Metrics

### User Engagement
- % of users who enable AI features
- Number of summaries generated per user
- Most common summary type (single vs batch)

### Performance
- Average summary generation time
- Cache hit rate
- API error rate

### Quality
- User satisfaction (via feedback command)
- Summary length appropriateness
- Action item extraction accuracy

## Open Questions

1. **Should summaries be editable?**
   - Pro: Users can refine AI output
   - Con: Confusing to have two versions
   - **Recommendation:** Read-only, with "Copy to New Note" option

2. **Should we support other AI providers?**
   - Could abstract service to support multiple providers
   - Would require additional configuration
   - **Recommendation:** Start with Copilot only, make extensible

3. **How to handle very large note collections?**
   - Summarizing 100+ notes could be slow/expensive
   - **Recommendation:** Set max of 50 notes per batch, offer sampling

4. **Should summaries be version-controlled?**
   - Could track summary history alongside notes
   - **Recommendation:** Not in MVP, consider for Phase 4

## Related Plugin Ideas

This feature provides a foundation for several other plugin concepts:

1. **Auto-Tagging Plugin** - Use LLM to generate tags based on content
2. **Action Item Tracker** - Extract and track action items across notes
3. **Meeting Notes Assistant** - Enhance meeting template with AI summaries
4. **Weekly Digest** - Automated weekly summary emails/reports
5. **Smart Search** - Semantic search using LLM embeddings

## References

- [VS Code Language Model API](https://code.visualstudio.com/api/extension-guides/language-model)
- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

---

**Document Status:** Draft v1.0
**Last Updated:** 2025-11-07
**Author:** Claude (AI Assistant)
**Review Status:** Pending team review
