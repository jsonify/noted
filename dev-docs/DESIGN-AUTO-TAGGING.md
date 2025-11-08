# Smart Auto-Tagging Feature Design Document

## Overview

Smart Auto-Tagging leverages VS Code's built-in Language Model API to automatically analyze note content and suggest relevant tags. This feature enhances note organization and discoverability by creating a semantic layer on top of the existing year/month hierarchy.

## Goals

1. **Automatic Tag Suggestion**: Analyze note content using AI to suggest relevant tags
2. **Tag Management**: Allow users to accept, reject, or manually add tags
3. **Enhanced Navigation**: Filter and search notes by tags
4. **Non-Intrusive**: Tags stored as frontmatter without disrupting existing note format
5. **Progressive Enhancement**: Works alongside existing features without breaking changes

## User Stories

### Primary Stories
- As a developer, I want my notes to be automatically tagged so I can find related content across different dates
- As a user, I want to filter my notes by category (bugs, features, meetings) without manual organization
- As a developer tracking problems, I want my problem-solution notes tagged by technology/topic

### Secondary Stories
- As a user, I want to see suggested tags before they're applied to my note
- As a user, I want to manually add or remove tags from my notes
- As a power user, I want to define custom tag categories for my domain

## Architecture

### Data Model

**Tag Structure**:
```typescript
interface NoteTag {
    name: string;        // e.g., "bug", "feature", "react"
    confidence: number;  // 0.0 - 1.0 (AI confidence score)
    source: 'ai' | 'manual';  // How tag was added
    addedAt: Date;
}

interface NoteMetadata {
    tags: NoteTag[];
    lastTagged?: Date;
    tagVersion?: string;  // For future tag schema changes
}
```

**Storage Format** (Frontmatter):
```markdown
---
tags: bug, authentication, typescript
tagged-at: 2025-10-03T14:30:00Z
---

2025-10-03
==================================================

PROBLEM: User login fails with 401 error
...
```

### Components

#### 1. Tag Parser (`TagParser.ts`)
Responsible for reading/writing tag metadata from note files.

```typescript
class TagParser {
    // Extract tags from frontmatter
    static parseTags(fileContent: string): NoteMetadata;
    
    // Insert/update frontmatter with tags
    static writeTags(fileContent: string, metadata: NoteMetadata): string;
    
    // Check if file has frontmatter
    static hasFrontmatter(fileContent: string): boolean;
}
```

#### 2. Tag Generator (`TagGenerator.ts`)
Uses VS Code LLM API to generate tag suggestions.

```typescript
class TagGenerator {
    // Generate tags for note content
    async generateTags(content: string, maxTags?: number): Promise<NoteTag[]>;
    
    // Get predefined tag categories for prompt guidance
    static getDefaultCategories(): string[];
    
    // Build prompt for LLM
    private buildTagPrompt(content: string): string;
}
```

#### 3. Tag Manager (`TagManager.ts`)
Business logic for tag operations.

```typescript
class TagManager {
    // Apply tags to a note file
    async tagNote(filePath: string, tags: NoteTag[]): Promise<void>;
    
    // Get all tags from a note
    async getNoteTags(filePath: string): Promise<NoteTag[]>;
    
    // Search notes by tag
    async findNotesByTag(tag: string): Promise<string[]>;
    
    // Get all unique tags across all notes
    async getAllTags(): Promise<Map<string, number>>; // tag -> count
    
    // Remove tag from note
    async removeTag(filePath: string, tagName: string): Promise<void>;
}
```

#### 4. Tag Tree Provider (`TagTreeProvider.ts`)
New tree view for browsing notes by tag.

```typescript
class TagTreeProvider implements vscode.TreeDataProvider<TagTreeItem> {
    // Show tags with note counts
    getChildren(element?: TagTreeItem): Thenable<TagTreeItem[]>;
    
    // Refresh when tags change
    refresh(): void;
}

class TagTreeItem extends vscode.TreeItem {
    constructor(
        public readonly tag: string,
        public readonly count: number,
        public readonly notes?: string[]
    );
}
```

## UI/UX Design

### 1. Tree View Updates

**Add "Tags" Section** to existing NotesTreeProvider:
```
📁 Noted
  ├── 📋 Templates
  ├── 🏷️ Tags (NEW)
  │   ├── bug (5)
  │   ├── feature (3)
  │   ├── meeting (8)
  │   └── react (12)
  ├── 🕒 Recent Notes
  └── 📅 2025
```

**Alternative: Separate View** (Recommended):
Create dedicated "Tags" view in the Noted container for better organization.

### 2. Commands

**Primary Commands**:
- `noted.tagNote` - Auto-tag the current note
- `noted.tagAllNotes` - Batch tag all notes (with progress indicator)
- `noted.showTagSuggestions` - Preview tags before applying
- `noted.manageNoteTags` - Edit tags for current note
- `noted.filterByTag` - Show notes with specific tag

**Context Menu** (on notes in tree):
- "Generate Tags" - Run auto-tagging
- "Manage Tags..." - Edit tags

**Title Bar Actions** (in Noted view):
- Button: "Tag All Notes" (with confirmation)
- Button: "Filter by Tag"

### 3. User Flows

#### Flow 1: Auto-tag Single Note
1. User opens a note or right-clicks note in tree
2. User runs "Noted: Generate Tags" command
3. Extension shows quick pick with suggested tags (with confidence scores)
4. User can:
   - Accept all (Enter)
   - Toggle individual tags (Space)
   - Cancel (Esc)
5. Selected tags are written to note frontmatter
6. Tree view refreshes to show updated tags

#### Flow 2: Batch Tag All Notes
1. User runs "Noted: Tag All Notes" command
2. Confirmation dialog: "Tag N notes? This may take a few minutes."
3. Progress notification: "Tagging notes... (5/50)"
4. Option to tag only untagged notes or re-tag all
5. Summary: "Tagged 50 notes. Found 23 unique tags."

#### Flow 3: Filter by Tag
1. User clicks tag in Tags view or runs command
2. Quick pick shows all available tags with counts
3. User selects tag
4. New panel/view shows all notes with that tag
5. Clicking note opens it

#### Flow 4: Manual Tag Management
1. User opens note and runs "Noted: Manage Note Tags"
2. Multi-select quick pick shows:
   - Existing tags (already checked)
   - AI suggested tags (unchecked)
   - Option to add custom tag
3. User modifies selection
4. Tags updated in frontmatter

## Technical Implementation

### Phase 1: Core Infrastructure (Days 1-2)

**1.1 Tag Storage**
- Implement `TagParser` class
- Support YAML frontmatter format
- Handle notes with/without existing frontmatter
- Preserve existing frontmatter fields (if any)

**1.2 Basic Tag Operations**
- Create `TagManager` class
- Implement read/write operations
- Add tag extraction from all notes

**1.3 Configuration**
```json
{
  "noted.tagging.enabled": {
    "type": "boolean",
    "default": true,
    "description": "Enable automatic tagging features"
  },
  "noted.tagging.autoTagOnCreate": {
    "type": "boolean",
    "default": false,
    "description": "Automatically tag new notes when created"
  },
  "noted.tagging.maxTags": {
    "type": "number",
    "default": 5,
    "description": "Maximum number of tags to suggest per note"
  },
  "noted.tagging.customCategories": {
    "type": "array",
    "default": [],
    "description": "Custom tag categories for your domain",
    "items": {
      "type": "string"
    }
  },
  "noted.tagging.excludePatterns": {
    "type": "array",
    "default": ["draft", "temp"],
    "description": "Tag patterns to exclude from suggestions"
  }
}
```

### Phase 2: AI Integration (Days 2-3)

**2.1 LLM Tag Generation**
```typescript
class TagGenerator {
    async generateTags(content: string, maxTags: number = 5): Promise<NoteTag[]> {
        const models = await vscode.lm.selectChatModels({
            vendor: 'copilot',
            family: 'gpt-4o'
        });
        
        if (models.length === 0) {
            throw new Error('Copilot not available');
        }

        const prompt = this.buildTagPrompt(content, maxTags);
        const messages = [
            vscode.LanguageModelChatMessage.User(prompt)
        ];

        const response = await models[0].sendRequest(messages, {}, new vscode.CancellationTokenSource().token);
        
        let fullResponse = '';
        for await (const fragment of response.text) {
            fullResponse += fragment;
        }

        return this.parseTagResponse(fullResponse);
    }

    private buildTagPrompt(content: string, maxTags: number): string {
        const categories = this.getCategories();
        
        return `Analyze the following developer note and suggest up to ${maxTags} relevant tags.

AVAILABLE TAG CATEGORIES:
${categories.join(', ')}

NOTE CONTENT:
${content}

Return ONLY a JSON array of tags with confidence scores. Format:
[
  {"tag": "bug", "confidence": 0.95},
  {"tag": "authentication", "confidence": 0.87}
]

Rules:
- Use lowercase, hyphenated tags (e.g., "code-review" not "Code Review")
- Focus on technical topics, technologies, and note types
- Confidence: 0.0-1.0 (only suggest tags with >0.6 confidence)
- Prefer specific tags over generic ones
- Consider the note structure (problem/solution, meeting, research, etc.)

Return ONLY the JSON array, no other text.`;
    }

    private getCategories(): string[] {
        const config = vscode.workspace.getConfiguration('noted');
        const custom = config.get<string[]>('tagging.customCategories', []);
        
        const defaults = [
            // Note Types
            'bug', 'feature', 'idea', 'meeting', 'research', 'learning',
            'problem-solving', 'code-review', 'documentation',
            
            // Technologies
            'typescript', 'javascript', 'react', 'node', 'python',
            'vscode', 'api', 'database', 'testing',
            
            // Topics
            'performance', 'security', 'ui-ux', 'architecture',
            'deployment', 'debugging', 'refactoring',
            
            // Status
            'todo', 'in-progress', 'resolved', 'blocked'
        ];
        
        return [...defaults, ...custom];
    }

    private parseTagResponse(response: string): NoteTag[] {
        try {
            // Remove markdown code blocks if present
            const cleaned = response
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            
            const parsed = JSON.parse(cleaned);
            
            return parsed
                .filter((item: any) => item.confidence > 0.6)
                .map((item: any) => ({
                    name: item.tag.toLowerCase(),
                    confidence: item.confidence,
                    source: 'ai' as const,
                    addedAt: new Date()
                }));
        } catch (error) {
            console.error('Failed to parse tag response:', error);
            return [];
        }
    }
}
```

**2.2 Caching Strategy**
```typescript
interface TagCache {
    filePath: string;
    contentHash: string;  // SHA-256 of content
    tags: NoteTag[];
    generatedAt: Date;
}

class TagCache {
    private cache: Map<string, TagCache> = new Map();
    
    // Check if content changed since last tagging
    needsRetagging(filePath: string, content: string): boolean {
        const cached = this.cache.get(filePath);
        if (!cached) return true;
        
        const currentHash = this.hashContent(content);
        return cached.contentHash !== currentHash;
    }
    
    private hashContent(content: string): string {
        // Simple hash for change detection
        return require('crypto')
            .createHash('sha256')
            .update(content)
            .digest('hex');
    }
}
```

### Phase 3: UI Components (Days 3-4)

**3.1 Tag Tree View**
```typescript
// Add to package.json views
"views": {
  "notedExplorer": [
    {
      "id": "notedView",
      "name": "Notes"
    },
    {
      "id": "notedTagsView",
      "name": "Tags"
    }
  ]
}
```

**3.2 Commands Implementation**
- Single note tagging command
- Batch tagging with progress
- Tag suggestion preview
- Manual tag management
- Filter by tag

**3.3 Status Bar Integration**
Show tag count for current note:
```
🏷️ 3 tags
```
Click to manage tags.

### Phase 4: Advanced Features (Days 4-5)

**4.1 Tag Rename/Merge**
- Rename tag across all notes
- Merge similar tags (e.g., "react" + "reactjs" → "react")

**4.2 Tag Statistics**
- Most used tags
- Tags over time
- Tag co-occurrence (tags that appear together)

**4.3 Smart Suggestions**
- Suggest tags based on similar notes
- Learn from user corrections (accept/reject patterns)

**4.4 Export with Tags**
Update export feature to optionally group by tags instead of date.

## Error Handling

### Scenarios

1. **Copilot Not Available**
   - Show info message: "Copilot required for auto-tagging. Please sign in."
   - Fallback: Allow manual tagging only

2. **LLM Request Fails**
   - Retry once with exponential backoff
   - Show error message with retry option
   - Cache partial results if available

3. **Invalid Note Format**
   - Skip notes with malformed frontmatter
   - Log warning, continue with other notes

4. **Rate Limiting**
   - Batch operations should respect rate limits
   - Show progress: "Waiting... (rate limit)"
   - Option to pause/resume

5. **File System Errors**
   - Handle read-only files gracefully
   - Warn user about files that couldn't be tagged
   - Provide summary of failures

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**
   - Only load tags for visible notes in tree
   - Load full tag index on demand

2. **Batch Processing**
   - Tag multiple notes in single LLM call when possible
   - Group similar notes for better prompt efficiency

3. **Caching**
   - Cache tag results per file
   - Invalidate cache on file modification
   - Persist cache to workspace storage

4. **Incremental Updates**
   - Only re-tag modified notes
   - Track last tagged timestamp

5. **Background Operations**
   - Run batch tagging in background
   - Show progress notification
   - Allow cancellation

### Performance Targets

- Single note tagging: < 2 seconds
- Batch tagging: ~50 notes/minute (with rate limiting)
- Tag search/filter: < 100ms for 1000+ notes
- Tree view load: < 500ms for tag list

## Testing Strategy

### Unit Tests

1. **TagParser**
   - Parse frontmatter correctly
   - Handle missing frontmatter
   - Preserve existing frontmatter fields
   - Handle malformed YAML

2. **TagGenerator**
   - Mock LLM responses
   - Test prompt generation
   - Test response parsing
   - Handle edge cases (empty content, very long content)

3. **TagManager**
   - CRUD operations on tags
   - Search by tag
   - Tag statistics

### Integration Tests

1. Test with sample notes
2. Verify frontmatter preservation
3. Test tree view updates
4. Test batch operations

### Manual Testing Scenarios

1. Create new note with different templates
2. Tag existing notes
3. Filter and search by tags
4. Batch tag 50+ notes
5. Test with very large notes (10k+ lines)
6. Test with notes in different formats (.txt, .md)

## Migration Strategy

### For Existing Users

1. **Non-Breaking**: Feature is opt-in via settings
2. **Gradual Adoption**: Tags don't affect existing functionality
3. **No Data Loss**: Frontmatter added doesn't modify note content
4. **Reversible**: Users can remove frontmatter manually if desired

### First Run Experience

1. Show info message: "New: Auto-tag your notes with AI! [Try It] [Learn More]"
2. "Try It" → Tag 5 most recent notes as demo
3. "Learn More" → Open documentation

## Documentation

### README Updates

Add section:
```markdown
## Smart Auto-Tagging

Automatically tag your notes using AI to improve organization and discoverability.

### Features
- AI-powered tag suggestions based on note content
- Browse notes by tag in dedicated Tags view
- Filter and search notes by tag
- Batch tag all your notes

### Usage
1. Right-click any note → "Generate Tags"
2. Review and accept suggested tags
3. Use Tags view to browse notes by category

### Commands
- `Noted: Generate Tags` - Tag current note
- `Noted: Tag All Notes` - Batch tag all notes
- `Noted: Manage Note Tags` - Edit tags manually
```

### Changelog Entry

```markdown
## [1.1.0] - 2025-10-XX

### Added
- Smart Auto-Tagging: AI-powered tag suggestions for notes
- New Tags view for browsing notes by category
- Commands for generating, managing, and filtering by tags
- Tag configuration options for customization
```

## Future Enhancements

### V1.1+
- Tag aliases (synonyms)
- Hierarchical tags (parent/child relationships)
- Tag colors/icons
- Export tag cloud visualization
- Integration with VS Code's search (search by tag in quick open)

### V2.0+
- Machine learning from user corrections
- Tag recommendations based on time/project context
- Collaborative tagging (team tag definitions)
- Tag-based workspace organization

## Success Metrics

### Quantitative
- Adoption rate: % of users who enable tagging
- Usage frequency: Tags generated per user per week
- Tag acceptance rate: % of suggested tags user keeps
- Performance: P95 latency for tag operations

### Qualitative
- User feedback on tag relevance
- Reduction in time to find notes
- User-reported productivity improvements

## Open Questions

1. Should we support custom tag schemas (e.g., priority tags, status tags)?
2. Should tags be case-sensitive or case-insensitive?
3. Should we support tag emojis/icons out of the box?
4. Should batch tagging be automatic on extension activation?
5. How to handle tag conflicts when merging notes?

## Dependencies

### Required
- VS Code LLM API (Copilot)
- `js-yaml` package for frontmatter parsing (add to dependencies)

### Optional
- `gray-matter` package (alternative frontmatter parser)

## Timeline

- **Week 1 (Days 1-2)**: Core infrastructure + storage
- **Week 1 (Days 2-3)**: AI integration
- **Week 1 (Days 3-4)**: UI components
- **Week 2 (Days 4-5)**: Advanced features + polish
- **Week 2 (Day 5)**: Testing + documentation
- **Week 2 (Weekend)**: Beta release + feedback collection

Total: **10 days** to MVP, **2 weeks** to stable release
