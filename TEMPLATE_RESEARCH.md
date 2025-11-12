# Template System Research & Improvement Plan

**Date:** 2025-11-12
**Purpose:** Rethink template usage and creation to better support workflows like video tutorials with text guides

---

## Current State Analysis

### 1. **Basic Template System** (`src/services/templateService.ts`)

**What exists:**
- 4 built-in templates: `problem-solution`, `meeting`, `research`, `quick`
- Custom templates stored in `.noted-templates/` folder
- 10 template variables: `{filename}`, `{date}`, `{time}`, `{year}`, `{month}`, `{day}`, `{weekday}`, `{month_name}`, `{user}`, `{workspace}`
- Simple string replacement via `replacePlaceholders()`

**Built-in Templates:**
```
problem-solution → PROBLEM/STEPS TAKEN/SOLUTION/NOTES
meeting → MEETING/ATTENDEES/AGENDA/NOTES/ACTION ITEMS
research → TOPIC/QUESTIONS/FINDINGS/SOURCES/NEXT STEPS
quick → Just a title (minimal template)
```

**Limitations:**
- ❌ Static text only - no dynamic content generation
- ❌ No AI assistance for creating templates
- ❌ Limited variable set (only date/time/user metadata)
- ❌ No context-aware suggestions
- ❌ Can't scaffold multi-note workflows
- ❌ No preview or validation before creation
- ❌ Poor discoverability of custom templates

### 2. **Advanced AI Systems (Already Implemented)**

Your extension **already has powerful AI infrastructure** that templates don't leverage:

#### A. **Prompt Template System** (`src/services/promptTemplateService.ts`)
Used for AI-powered summarization - much more sophisticated than note templates:

- ✅ Built-in prompt templates with rich variable support
- ✅ Custom prompts stored as JSON with metadata
- ✅ Dynamic variable extraction from prompt text
- ✅ AI-powered content generation via VS Code LLM API
- ✅ Template picker with descriptions and categories
- ✅ "Last used" tracking for convenience

**Built-in Prompt Templates:**
1. `default` - Balanced summary with key points
2. `technical-deep-dive` - Implementation details & architecture
3. `meeting-summary` - Decisions & action items
4. `code-review` - Code changes & issues
5. `brainstorm` - Ideas & possibilities
6. **`video-transcript`** ← This one is highly relevant to your use case!

#### B. **Smart Auto-Tagging** (`src/tagging/TagGenerator.ts`)
- ✅ Uses GitHub Copilot (gpt-4o) via VS Code LLM API
- ✅ Analyzes content and generates intelligent suggestions
- ✅ Confidence scoring and filtering
- ✅ Content hashing for cache invalidation
- ✅ Configurable categories and exclusion patterns

#### C. **Semantic Search** (`src/search/` folder)
- ✅ AI-powered natural language query understanding
- ✅ Intent detection (keyword/semantic/hybrid)
- ✅ Relevance scoring and ranking

### 3. **Category System** (`src/services/categoryService.ts`)

Maps templates to folders:
- `Daily` → Date-based folders (YYYY/MM-MonthName)
- `Meetings` → meeting template
- `Research` → research template
- `Projects` → problem-solution template
- `Quick` → quick template
- All non-daily notes → `Inbox` folder

---

## The Gap: Template System vs AI Infrastructure

**The Problem:**
Your basic template system is **far behind** the sophistication of your AI systems. You've built powerful AI tools (prompt templates, auto-tagging, semantic search) but the core note template system doesn't use any of this.

**Current Template Flow:**
```
User → Pick static template → Get fixed text with {date} replaced → Done
```

**What's Possible (with existing AI infrastructure):**
```
User → Describe intent → AI generates contextual template → Preview & customize → Create note
```

---

## Your Use Case: Video Tutorials with Text Guides

**What you need:**
1. Create video tutorial script/outline
2. Generate accompanying written guide
3. Link between video and text versions
4. Track progress/completion status
5. Manage related assets (video files, screenshots, code samples)

**Current template system can't:**
- ❌ Create multi-note workflows (video outline + text guide + resources)
- ❌ Generate contextual content based on topic
- ❌ Suggest structure based on tutorial type (beginner/advanced, walkthrough/concept)
- ❌ Populate with relevant sections for your specific domain
- ❌ Link related notes automatically

---

## Improvement Opportunities

### Phase 1: AI-Powered Template Generation (Quick Win)

**Leverage existing Copilot integration:**

1. **Smart Template Creator Command** (`noted.createSmartTemplate`)
   - User describes what they need: "Create a template for video tutorials about VS Code extensions"
   - AI generates template structure with:
     - Relevant sections based on description
     - Appropriate placeholders and prompts
     - Suggested tags and categorization
     - Related template suggestions

2. **Context-Aware Variables**
   - Current: `{date}`, `{user}`, `{workspace}` (static metadata)
   - New: `{ai:title_suggestion}`, `{ai:tags}`, `{ai:related_notes}` (dynamic AI-generated)
   - Example: `{ai:prerequisites}` could analyze workspace and suggest required knowledge

3. **Template Enhancement Command** (`noted.enhanceTemplate`)
   - Take existing basic template
   - AI suggests improvements:
     - Missing sections
     - Better structure
     - Additional variables
     - Links to related templates

### Phase 2: Multi-Note Workflows (Scaffolding)

**Create template "bundles" that generate multiple related notes:**

```yaml
# video-tutorial.bundle.yaml
name: "Video Tutorial Bundle"
description: "Complete workflow for creating tutorial videos"
notes:
  - name: "script-{topic}"
    template: "video-script"
    folder: "Tutorials/Scripts"

  - name: "guide-{topic}"
    template: "written-guide"
    folder: "Tutorials/Guides"
    links_to: ["script-{topic}"]

  - name: "resources-{topic}"
    template: "tutorial-resources"
    folder: "Tutorials/Resources"
    links_to: ["script-{topic}", "guide-{topic}"]
```

**Workflow:**
1. User runs: `noted.createBundle`
2. Selects "Video Tutorial Bundle"
3. Enters `{topic}` value: "vscode-debugging"
4. Extension creates 3 linked notes:
   - `script-vscode-debugging.md`
   - `guide-vscode-debugging.md`
   - `resources-vscode-debugging.md`
5. All notes have wiki-links to each other
6. Backlinks automatically track connections

### Phase 3: Smart Template Library

**Transform templates into a discoverable, searchable library:**

1. **Template Metadata** (store as JSON instead of plain text)
   ```json
   {
     "id": "video-tutorial-script",
     "name": "Video Tutorial Script",
     "description": "Structured outline for tutorial videos",
     "category": "Content Creation",
     "tags": ["video", "tutorial", "script"],
     "author": "user",
     "version": "1.0.0",
     "variables": [
       {
         "name": "topic",
         "type": "string",
         "required": true,
         "description": "Tutorial topic or title"
       },
       {
         "name": "duration",
         "type": "number",
         "default": 10,
         "description": "Estimated video length in minutes"
       },
       {
         "name": "audience",
         "type": "enum",
         "values": ["beginner", "intermediate", "advanced"],
         "default": "beginner"
       }
     ],
     "ai_hints": {
       "use_copilot": true,
       "generate_outline": true,
       "suggest_prerequisites": true
     },
     "content": "..."
   }
   ```

2. **Template Browser Webview**
   - Visual gallery like VS Code's extension marketplace
   - Filter by category, tags, or search
   - Preview before use
   - See usage statistics ("You've used this 12 times")
   - Rate and favorite templates

3. **AI-Powered Template Discovery**
   - "Templates for you" suggestions based on:
     - Recent note patterns
     - Frequently used tags
     - Workspace context (e.g., detect you're working on tutorials)
   - Natural language search: "template for documenting API endpoints"

### Phase 4: Dynamic Content Generation

**Templates that adapt to context:**

1. **Pre-fill from Context**
   - Detect open files and suggest content
   - Example: Creating meeting template while viewing calendar → pre-fill attendees
   - Creating bug report while on GitHub issue → pre-fill issue number and description

2. **AI Section Population**
   ```markdown
   # Tutorial: {topic}

   ## Prerequisites
   {ai:analyze_topic_and_suggest_prerequisites}

   ## Key Concepts
   {ai:generate_concept_list}

   ## Outline
   {ai:create_tutorial_outline}
   ```
   - When note is created, AI generates content for `{ai:*}` sections
   - User can regenerate or edit

3. **Progressive Templates**
   - Templates that evolve as you work
   - Example: Tutorial template with checkbox to "Generate companion text guide"
   - When checked, AI creates linked note with text version

### Phase 5: Template Sharing & Community

**Make templates shareable and discoverable:**

1. **Import/Export**
   - Export template as `.noted-template` file (JSON bundle)
   - Share with team or publish online
   - Import from URL or file

2. **Template Marketplace Integration**
   - Publish templates to community repository
   - Browse and install templates by others
   - Version management and updates

3. **Template Inheritance**
   - Base templates that others extend
   - Example: "Tutorial Base" → "Video Tutorial" → "VS Code Extension Tutorial"
   - Inherit variables, structure, AI hints

---

## Recommended Implementation Plan

### **Priority 1: AI-Powered Template Creation** ⭐

**Why:** Solves your immediate need, leverages existing infrastructure, quick to implement

**What to build:**
1. New command: `noted.createTemplateWithAI`
2. User describes template purpose (natural language)
3. AI generates template structure using existing Copilot integration
4. Preview and edit before saving
5. Save to `.noted-templates/` with metadata

**Estimated Effort:** 2-3 days
- Reuse `TagGenerator` pattern for LLM interaction
- Create prompt template for template generation (meta!)
- Add preview webview (reuse calendar/graph view approach)

### **Priority 2: Multi-Note Workflow Bundles** ⭐⭐

**Why:** Directly supports video tutorial + text guide use case

**What to build:**
1. Bundle definition format (YAML or JSON)
2. Command: `noted.createBundle`
3. Variable collection UI
4. Multi-note creation with automatic wiki-links
5. Bundle templates stored in `.noted-templates/bundles/`

**Estimated Effort:** 3-4 days
- Define bundle schema
- Create bundle parser
- Implement multi-note creation flow
- Integrate with existing `LinkService` for auto-linking

### **Priority 3: Enhanced Template Metadata** ⭐⭐

**Why:** Makes templates more powerful and discoverable

**What to build:**
1. Migrate custom templates from plain text to JSON format
2. Add metadata fields (name, description, category, tags, variables)
3. Variable type system (string, number, enum, date)
4. Validation and default values
5. Backward compatibility with existing .txt/.md templates

**Estimated Effort:** 2-3 days
- Create template schema and TypeScript interfaces
- Update `templateService` to handle JSON templates
- Add migration utility for existing templates

### **Priority 4: Template Browser UI** ⭐⭐⭐

**Why:** Improves discoverability and user experience

**What to build:**
1. Webview-based template browser (like graph view)
2. Filter, search, and preview capabilities
3. Template usage statistics
4. Quick actions (create, edit, duplicate, delete)

**Estimated Effort:** 4-5 days
- Create React/Vue component for webview
- Implement search and filtering
- Add template preview rendering
- Integrate with command palette

---

## Technical Architecture Changes

### New Files to Create:

```
src/templates/
  ├── TemplateGenerator.ts        # AI-powered template generation
  ├── TemplateParser.ts           # Parse JSON template format
  ├── TemplateValidator.ts        # Validate template structure
  ├── BundleService.ts            # Multi-note workflow bundles
  ├── TemplateMetadata.ts         # Type definitions
  └── templateBrowserView.ts      # Webview for template browser

src/commands/
  └── templateCommands.ts         # New template commands (split from commands.ts)

.noted-templates/
  ├── templates/                  # Individual templates (JSON)
  │   ├── video-tutorial.json
  │   └── tutorial-text-guide.json
  └── bundles/                    # Multi-note bundles
      └── video-tutorial-complete.bundle.json
```

### Updated Files:

- `src/services/templateService.ts` - Add JSON template support, AI generation
- `src/constants.ts` - Add template metadata interfaces
- `src/extension.ts` - Register new commands
- `package.json` - Add new commands and configuration settings

### New Configuration Settings:

```json
{
  "noted.templates.useAI": {
    "type": "boolean",
    "default": true,
    "description": "Use AI to enhance template creation and suggestions"
  },
  "noted.templates.defaultCategory": {
    "type": "string",
    "default": "General",
    "description": "Default category for custom templates"
  },
  "noted.templates.enableBundles": {
    "type": "boolean",
    "default": true,
    "description": "Enable multi-note workflow bundles"
  },
  "noted.templates.showBrowser": {
    "type": "boolean",
    "default": true,
    "description": "Show template browser instead of quick pick"
  }
}
```

---

## Example: Video Tutorial Bundle (Your Use Case)

### Bundle Definition:
```json
{
  "id": "video-tutorial-complete",
  "name": "Complete Video Tutorial Workflow",
  "description": "Creates script, text guide, and resource tracker for tutorial videos",
  "version": "1.0.0",
  "author": "user",
  "variables": [
    {
      "name": "topic",
      "type": "string",
      "required": true,
      "prompt": "Tutorial topic (e.g., 'VS Code Debugging')"
    },
    {
      "name": "duration",
      "type": "number",
      "default": 10,
      "prompt": "Estimated duration in minutes"
    },
    {
      "name": "level",
      "type": "enum",
      "values": ["beginner", "intermediate", "advanced"],
      "default": "beginner",
      "prompt": "Target audience level"
    }
  ],
  "notes": [
    {
      "name": "{topic}-script",
      "template": "video-tutorial-script",
      "folder": "Tutorials/Scripts",
      "description": "Video script and outline"
    },
    {
      "name": "{topic}-guide",
      "template": "tutorial-text-guide",
      "folder": "Tutorials/Guides",
      "description": "Written companion guide",
      "links": ["{topic}-script"]
    },
    {
      "name": "{topic}-resources",
      "template": "tutorial-resources",
      "folder": "Tutorials/Resources",
      "description": "Assets and resource tracking",
      "links": ["{topic}-script", "{topic}-guide"]
    }
  ],
  "post_create": {
    "open_notes": ["{topic}-script"],
    "message": "Tutorial workflow created! Start with the script, then generate the guide."
  }
}
```

### Template: `video-tutorial-script.json`
```json
{
  "id": "video-tutorial-script",
  "name": "Video Tutorial Script",
  "category": "Content Creation",
  "tags": ["video", "tutorial", "script"],
  "variables": [
    { "name": "topic", "type": "string", "required": true },
    { "name": "duration", "type": "number", "default": 10 },
    { "name": "level", "type": "string", "default": "beginner" }
  ],
  "ai_generation": {
    "enabled": true,
    "sections": ["outline", "key_points", "script_outline"]
  },
  "content": "---\ntags: [tutorial, video, {level}]\ntopic: {topic}\nduration: {duration}\nstatus: draft\ncreated: {date}\n---\n\n# {topic} - Video Tutorial Script\n\n## Overview\n- **Duration:** {duration} minutes\n- **Level:** {level}\n- **Created:** {date}\n\n## Learning Objectives\n{ai:generate_learning_objectives}\n\n## Prerequisites\n{ai:suggest_prerequisites}\n\n## Script Outline\n{ai:create_tutorial_outline}\n\n### Intro (0:00-0:30)\n- Hook\n- What we'll cover\n- Why it matters\n\n### Main Content ({duration} min)\n{ai:generate_section_breakdown}\n\n### Conclusion\n- Recap\n- Next steps\n- Call to action\n\n## B-Roll / Visuals Needed\n- [ ] \n\n## Resources\n- Written guide: [[{topic}-guide]]\n- Resources: [[{topic}-resources]]\n\n## Production Notes\n- Recording date:\n- Edit status:\n- Published:\n"
}
```

### Template: `tutorial-text-guide.json`
```json
{
  "id": "tutorial-text-guide",
  "name": "Tutorial Text Guide",
  "category": "Content Creation",
  "tags": ["tutorial", "guide", "documentation"],
  "variables": [
    { "name": "topic", "type": "string", "required": true },
    { "name": "level", "type": "string", "default": "beginner" }
  ],
  "ai_generation": {
    "enabled": true,
    "sections": ["introduction", "steps", "troubleshooting"],
    "copy_from_script": true
  },
  "content": "---\ntags: [tutorial, guide, {level}]\ntopic: {topic}\nformat: text\nstatus: draft\ncreated: {date}\n---\n\n# {topic} - Step-by-Step Guide\n\n> **Video Version:** See [[{topic}-script]] for the video tutorial\n\n## Introduction\n{ai:generate_introduction}\n\n## Prerequisites\n{ai:copy_prerequisites_from_script}\n\n## Step-by-Step Instructions\n{ai:convert_script_to_written_steps}\n\n### Step 1: Setup\n\n### Step 2: Configuration\n\n### Step 3: Implementation\n\n## Common Issues & Troubleshooting\n{ai:suggest_common_issues}\n\n## Next Steps\n- \n\n## Related Resources\n- Video script: [[{topic}-script]]\n- Additional resources: [[{topic}-resources]]\n\n## Changelog\n- {date}: Initial draft\n"
}
```

---

## Next Steps

**Immediate Actions:**

1. ✅ Review this research document
2. 🎯 **Decide on priorities** - Which phase(s) align with your needs?
3. 🎯 **Start with Priority 1** (AI-powered template creation) - Quick win, immediate value
4. 🎯 Create example bundle for your video tutorial workflow
5. 🎯 Test with real tutorial creation
6. 🎯 Iterate based on usage

**Questions to Consider:**

1. **Template format:** JSON vs YAML vs hybrid approach?
2. **Storage location:** Keep `.noted-templates/` or reorganize?
3. **UI preference:** Quick pick vs webview browser vs both?
4. **AI usage:** Always-on or opt-in per template?
5. **Backward compatibility:** Migrate existing templates or support both formats?

**Potential Concerns:**

- **Copilot dependency:** What if user doesn't have Copilot? (Fallback to basic templates)
- **Performance:** AI generation adds latency (Use loading indicators, cache results)
- **Complexity:** Don't overwhelm users (Start simple, progressive disclosure)
- **Migration:** Existing custom templates (Auto-detect and offer to upgrade)

---

## Conclusion

Your template system has **huge untapped potential**. You've already built the AI infrastructure (Copilot integration, semantic search, auto-tagging) - now it's time to bring that power to templates.

**The gap:** Templates are static text, while the rest of your extension is AI-powered and dynamic.

**The opportunity:** Transform templates from "fill-in-the-blank forms" to "intelligent content scaffolding" that:
- Understands your intent
- Generates contextual content
- Creates multi-note workflows
- Adapts to your workspace
- Suggests improvements

**Starting point:** Implement Priority 1 (AI-powered template creation) to validate the approach, then expand to bundles and the template library.

Your video tutorial use case is a perfect example - you need more than a single template, you need a **workflow**. Let's build it! 🚀
