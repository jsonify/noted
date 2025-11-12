# Template System Implementation Plan

**Goal:** Modernize template system to support AI-powered workflows and multi-note scaffolding

---

## Phase 1: AI-Powered Template Creation (2-3 days) ⭐ START HERE

### Commands to Implement

1. **`noted.createTemplateWithAI`**
   - User describes template purpose (natural language input)
   - AI generates template structure using existing Copilot integration
   - Show preview webview with edit capability
   - Save to `.noted-templates/` with metadata

2. **`noted.enhanceTemplate`**
   - Select existing custom template
   - AI analyzes and suggests improvements
   - Preview changes before applying

### Technical Implementation

```typescript
// src/templates/TemplateGenerator.ts
export class TemplateGenerator {
  async generateFromDescription(description: string): Promise<TemplateMetadata> {
    // Use VS Code LLM API (like TagGenerator does)
    const model = await this.selectCopilotModel();
    const prompt = this.buildTemplateGenerationPrompt(description);
    const response = await model.sendRequest([
      vscode.LanguageModelChatMessage.User(prompt)
    ]);

    // Parse AI response into template structure
    return this.parseTemplateResponse(response);
  }
}
```

### Prompt Template for AI

```
You are a template generation assistant for a note-taking extension.

User wants: "{description}"

Generate a structured note template with:
1. Appropriate YAML frontmatter (tags, status, etc.)
2. Logical sections with headers
3. Placeholders for content (using {variable} syntax)
4. Helpful prompts and examples
5. Related note suggestions

Output format:
{
  "name": "template-name",
  "description": "brief description",
  "category": "category",
  "tags": ["tag1", "tag2"],
  "variables": [
    {"name": "var1", "type": "string", "required": true, "prompt": "Enter..."}
  ],
  "content": "full template content with {variables}"
}
```

### Configuration

```json
// package.json contributions
"noted.templates.useAI": {
  "type": "boolean",
  "default": true,
  "description": "Use AI to enhance template creation"
}
```

---

## Phase 2: Multi-Note Workflow Bundles (3-4 days) ⭐⭐

### Data Structure

```typescript
// src/templates/TemplateMetadata.ts
export interface TemplateBundle {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;

  variables: TemplateVariable[];

  notes: BundleNote[];

  post_create?: {
    open_notes?: string[];  // Note names to open after creation
    message?: string;        // Success message to show
  };
}

export interface BundleNote {
  name: string;           // Can include {variables}
  template: string;       // Template ID to use
  folder: string;         // Target folder (can include {variables})
  description?: string;
  links?: string[];       // Other note names to link to
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'enum' | 'date' | 'boolean';
  required?: boolean;
  default?: any;
  prompt?: string;
  values?: string[];      // For enum type
}
```

### Commands to Implement

1. **`noted.createBundle`**
   - Show picker with available bundles
   - Collect variable values from user (multi-step input)
   - Create all notes in bundle
   - Establish wiki-links between notes
   - Open specified notes

2. **`noted.createBundleFromTemplates`**
   - Select multiple existing templates
   - Define relationships between them
   - Save as new bundle

### Implementation

```typescript
// src/templates/BundleService.ts
export class BundleService {
  async createFromBundle(bundleId: string): Promise<string[]> {
    const bundle = await this.loadBundle(bundleId);
    const variables = await this.collectVariables(bundle.variables);

    const createdPaths: string[] = [];

    // Create each note
    for (const note of bundle.notes) {
      const noteName = this.replaceVariables(note.name, variables);
      const folder = this.replaceVariables(note.folder, variables);
      const content = await this.generateNoteContent(note.template, variables);

      // Add links to other notes in bundle
      const linkedContent = this.addBundleLinks(content, note.links, variables);

      const filePath = await this.createNote(folder, noteName, linkedContent);
      createdPaths.push(filePath);
    }

    // Post-creation actions
    if (bundle.post_create?.open_notes) {
      await this.openNotes(bundle.post_create.open_notes, variables, createdPaths);
    }

    return createdPaths;
  }
}
```

### Example Bundle: Video Tutorial Workflow

```json
// .noted-templates/bundles/video-tutorial.bundle.json
{
  "id": "video-tutorial-complete",
  "name": "Video Tutorial Workflow",
  "description": "Script + text guide + resources for tutorial videos",
  "version": "1.0.0",

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
      "template": "video-script",
      "folder": "Tutorials/Scripts",
      "description": "Video script and outline"
    },
    {
      "name": "{topic}-guide",
      "template": "text-guide",
      "folder": "Tutorials/Guides",
      "description": "Written companion guide",
      "links": ["{topic}-script"]
    },
    {
      "name": "{topic}-resources",
      "template": "resources",
      "folder": "Tutorials/Resources",
      "description": "Assets and resource tracking",
      "links": ["{topic}-script", "{topic}-guide"]
    }
  ],

  "post_create": {
    "open_notes": ["{topic}-script"],
    "message": "Tutorial workflow created! Start with the script."
  }
}
```

---

## Phase 3: Enhanced Template Metadata (2-3 days) ⭐⭐

### Migrate from Plain Text to JSON

**Current:** `.noted-templates/my-template.md` (plain text)
**New:** `.noted-templates/my-template.json` (structured metadata)

```typescript
// src/templates/TemplateMetadata.ts
export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  version: string;
  author?: string;

  variables: TemplateVariable[];

  ai_generation?: {
    enabled: boolean;
    sections?: string[];  // Which sections to generate
    hints?: string[];     // Hints for AI
  };

  content: string;  // Actual template content

  // Metadata
  created?: string;
  modified?: string;
  usage_count?: number;
}
```

### Backward Compatibility

```typescript
// src/services/templateService.ts
export async function loadTemplate(templateId: string): Promise<Template> {
  const templatesPath = getTemplatesPath();

  // Try JSON first
  const jsonPath = path.join(templatesPath, `${templateId}.json`);
  if (await pathExists(jsonPath)) {
    const content = await readFile(jsonPath);
    return JSON.parse(content) as Template;
  }

  // Fall back to .md/.txt for backward compatibility
  const fileFormat = getFileFormat();
  const textPath = path.join(templatesPath, `${templateId}.${fileFormat}`);
  if (await pathExists(textPath)) {
    const content = await readFile(textPath);

    // Convert plain text template to Template object
    return {
      id: templateId,
      name: templateId,
      description: 'Legacy template',
      category: 'Custom',
      tags: [],
      version: '1.0.0',
      variables: extractVariablesFromContent(content),
      content: content
    };
  }

  throw new Error(`Template not found: ${templateId}`);
}
```

### Migration Command

```typescript
// noted.migrateTemplates
export async function handleMigrateTemplates() {
  const legacyTemplates = await findLegacyTemplates();

  if (legacyTemplates.length === 0) {
    vscode.window.showInformationMessage('No legacy templates to migrate');
    return;
  }

  const answer = await vscode.window.showInformationMessage(
    `Migrate ${legacyTemplates.length} template(s) to new JSON format?`,
    'Migrate', 'Cancel'
  );

  if (answer !== 'Migrate') return;

  for (const template of legacyTemplates) {
    await migrateTemplate(template);
  }

  vscode.window.showInformationMessage(
    `Migrated ${legacyTemplates.length} templates successfully`
  );
}
```

---

## Phase 4: Template Browser UI (4-5 days) ⭐⭐⭐

### Webview Implementation

Similar to existing graph view (`src/graph/graphView.ts`) and calendar view (`src/calendar/calendarView.ts`)

```typescript
// src/templates/templateBrowserView.ts
export class TemplateBrowserView {
  private panel: vscode.WebviewPanel | undefined;

  async show() {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'notedTemplateBrowser',
      'Template Browser',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    this.panel.webview.html = this.getHtmlContent();

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'createFromTemplate':
          await this.createFromTemplate(message.templateId);
          break;
        case 'editTemplate':
          await this.editTemplate(message.templateId);
          break;
        case 'deleteTemplate':
          await this.deleteTemplate(message.templateId);
          break;
      }
    });
  }

  private getHtmlContent(): string {
    // Return HTML with embedded Vue/React component
    // Show template cards with preview, description, metadata
    // Filter by category, tags, search
    // Show usage statistics
  }
}
```

### UI Features

- **Grid/List View:** Template cards with icons, descriptions
- **Filter Bar:** By category, tags, author
- **Search:** Fuzzy search by name, description, content
- **Preview:** Hover or click to see template content
- **Quick Actions:**
  - Create note from template
  - Edit template
  - Duplicate template
  - Delete template
  - Export template
- **Statistics:** Usage count, last used date, rating
- **Sorting:** By name, usage, date created, date modified

### Command

```typescript
// noted.showTemplateBrowser
export async function handleShowTemplateBrowser() {
  const browser = new TemplateBrowserView(context);
  await browser.show();
}
```

---

## Configuration Settings

### Add to `package.json`

```json
{
  "contributes": {
    "configuration": {
      "title": "Noted Templates",
      "properties": {
        "noted.templates.useAI": {
          "type": "boolean",
          "default": true,
          "description": "Use AI to enhance template creation and suggestions"
        },
        "noted.templates.defaultCategory": {
          "type": "string",
          "default": "General",
          "description": "Default category for new custom templates"
        },
        "noted.templates.enableBundles": {
          "type": "boolean",
          "default": true,
          "description": "Enable multi-note workflow bundles"
        },
        "noted.templates.showBrowser": {
          "type": "boolean",
          "default": false,
          "description": "Show template browser instead of quick pick (requires restart)"
        },
        "noted.templates.aiModel": {
          "type": "string",
          "default": "gpt-4o",
          "enum": ["gpt-4o", "gpt-3.5-turbo"],
          "description": "AI model to use for template generation"
        }
      }
    }
  }
}
```

---

## Commands to Register

### Add to `extension.ts`

```typescript
// Template commands
context.subscriptions.push(
  vscode.commands.registerCommand('noted.createTemplateWithAI',
    () => handleCreateTemplateWithAI()),
  vscode.commands.registerCommand('noted.enhanceTemplate',
    () => handleEnhanceTemplate()),
  vscode.commands.registerCommand('noted.createBundle',
    () => handleCreateBundle()),
  vscode.commands.registerCommand('noted.createBundleFromTemplates',
    () => handleCreateBundleFromTemplates()),
  vscode.commands.registerCommand('noted.showTemplateBrowser',
    () => handleShowTemplateBrowser()),
  vscode.commands.registerCommand('noted.migrateTemplates',
    () => handleMigrateTemplates())
);
```

### Add to `package.json` commands

```json
{
  "contributes": {
    "commands": [
      {
        "command": "noted.createTemplateWithAI",
        "title": "Create Template with AI",
        "category": "Noted"
      },
      {
        "command": "noted.enhanceTemplate",
        "title": "Enhance Template with AI",
        "category": "Noted"
      },
      {
        "command": "noted.createBundle",
        "title": "Create Notes from Bundle",
        "category": "Noted"
      },
      {
        "command": "noted.showTemplateBrowser",
        "title": "Show Template Browser",
        "category": "Noted"
      }
    ]
  }
}
```

---

## Testing Plan

### Unit Tests

- `TemplateGenerator.test.ts` - AI generation, prompt building
- `BundleService.test.ts` - Variable replacement, note creation, linking
- `TemplateParser.test.ts` - JSON parsing, validation
- `TemplateMetadata.test.ts` - Type conversions, validation

### Integration Tests

- Create template with AI → save → load → verify
- Create bundle → verify all notes created → verify links
- Migrate legacy template → verify structure → verify content

### Manual Testing

1. Create template with description "video tutorial script"
2. Verify AI generates appropriate structure
3. Edit and save template
4. Create bundle from multiple templates
5. Execute bundle → verify all notes created
6. Check wiki-links between notes
7. Open template browser → filter, search, preview
8. Migrate existing template → verify backward compatibility

---

## Rollout Strategy

### Version 1.41.0: AI Template Creation
- New command: `noted.createTemplateWithAI`
- New command: `noted.enhanceTemplate`
- Documentation: How to use AI template creation
- **Release notes:** "AI-powered template creation - describe what you need and let Copilot generate the structure"

### Version 1.42.0: Multi-Note Bundles
- New command: `noted.createBundle`
- Bundle format specification
- Example bundles (video tutorial, project, sprint)
- Migration path for existing workflows
- **Release notes:** "Multi-note workflow bundles - create related notes with automatic linking"

### Version 1.43.0: Enhanced Metadata
- JSON template format
- Variable type system
- Migration command
- Backward compatibility with existing templates
- **Release notes:** "Enhanced template system with rich metadata and variable types"

### Version 1.44.0: Template Browser
- Template browser webview
- Filter, search, preview capabilities
- Usage statistics
- Template sharing (export/import)
- **Release notes:** "Visual template browser with search, filtering, and statistics"

---

## Documentation Updates

### Update Files

1. **CLAUDE.md** - Document new template architecture
2. **README.md** - Add template features to feature list
3. **docs/templates.md** - Comprehensive template guide
   - Basic templates
   - AI-powered templates
   - Multi-note bundles
   - Variable reference
   - Bundle format specification
   - Best practices

### New Documentation

1. **docs/bundles.md** - Bundle format specification and examples
2. **docs/ai-templates.md** - AI template generation guide
3. **TEMPLATE_MIGRATION.md** - Migration guide for v1.43.0

---

## Questions & Decisions Needed

### 1. Template Format
- **JSON** (structured, strongly typed, validatable) ← **Recommended**
- YAML (more readable, less verbose)
- Hybrid (metadata in JSON, content in markdown)

### 2. Storage Structure
- Current: `.noted-templates/*.{md,txt}`
- Option A: `.noted-templates/templates/*.json` + `.noted-templates/bundles/*.json`
- Option B: Keep flat structure, differentiate by file extension ← **Recommended**

### 3. AI Behavior
- Always suggest AI generation for new templates
- Opt-in per template via checkbox
- Global setting (on/off) ← **Recommended (default: on)**

### 4. Bundle Execution
- Create all notes immediately
- Create notes progressively (one at a time with preview)
- Hybrid (create structure, user fills in) ← **Recommended**

### 5. Variable Collection UI
- Quick pick for each variable (current approach)
- Single form with all variables ← **Recommended (better UX)**
- Webview with rich input controls (future enhancement)

---

## Success Metrics

### Adoption
- % of users who create at least one custom template
- % of users who use AI template creation
- % of users who create bundles
- Average templates per user

### Usage
- Template usage frequency (uses per week)
- Most popular templates (built-in vs custom)
- Bundle usage vs single templates
- AI enhancement acceptance rate

### Quality
- Template rating (if we add rating feature)
- Template duplication rate (indicates reuse)
- Templates shared (if we add sharing)

---

## Timeline Estimate

**Total:** 11-15 days (2.5-3 weeks)

- Phase 1: 2-3 days (AI template creation)
- Phase 2: 3-4 days (Multi-note bundles)
- Phase 3: 2-3 days (Enhanced metadata)
- Phase 4: 4-5 days (Template browser)

**Recommendation:** Start with Phase 1 to validate AI integration, then proceed to Phase 2 for your video tutorial use case. Phases 3 & 4 can be done in parallel or deferred.

---

## Next Steps

1. ✅ Review implementation plan
2. 🎯 Approve Phase 1 approach
3. 🎯 Create `src/templates/` directory structure
4. 🎯 Implement `TemplateGenerator.ts` (copy pattern from `TagGenerator.ts`)
5. 🎯 Create AI prompt for template generation
6. 🎯 Build template creation command
7. 🎯 Test with video tutorial template example
8. 🎯 Document and release v1.41.0
