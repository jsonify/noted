# JavaScript Template Support - Integration Analysis

## Executive Summary

This document provides a comprehensive analysis of all integration points needed to add JavaScript (.js) template support to the Noted VS Code extension. JavaScript templates would execute custom code to generate note content dynamically, alongside existing static text-based templates.

---

## Current Template System Architecture

### 1. Template Types

**Built-in Templates** (defined in `src/constants.ts`):
- `problem-solution` - Bug tracking format
- `meeting` - Meeting notes format
- `research` - Research documentation format
- `quick` - Minimal template (just note title, no frontmatter)

**Custom Templates** (user-created):
- Stored in: `{notesFolder}/.noted-templates/`
- Extensions: `.txt` or `.md` (based on `noted.fileFormat` config)
- Support 10 placeholder variables (e.g., `{date}`, `{time}`, `{filename}`)

### 2. Template Discovery & Loading

**File: `src/services/templateService.ts`**

Key Functions:
- `generateTemplate(templateType, date, filename)` - Main template generation
- `getCustomTemplates()` - Lists all custom template files
- `getCustomTemplatePath(templateName)` - Returns full path to template
- `replacePlaceholders(content, date, filename)` - Replaces all placeholders
- `getTemplateVariables()` - Returns list of available placeholders
- `getTemplatePreview(content)` - Previews template with sample data

Template Resolution Order:
1. Check if `templateType === 'quick'` → special handling (no frontmatter)
2. Check if custom template exists in `.noted-templates/` folder
3. Check if matches built-in template name
4. Fall back to default (frontmatter only)

### 3. Template Execution Flow

```
User selects template
    ↓
generateTemplate() called
    ↓
1. Generate YAML frontmatter (tags, created timestamp, file metadata)
2. Load template content:
   - For built-in: Get from BUILT_IN_TEMPLATES object
   - For custom: Read file from .noted-templates/{name}.{format}
3. Replace placeholders using replacePlaceholders()
4. Return: frontmatter + processed template content
```

**Special Cases:**
- **Quick template**: No frontmatter, just `# {filename}\n\n`
- **Custom templates with frontmatter**: If template already has `---` delimiter, don't prepend another frontmatter block

### 4. Template Usage Points

**Note Creation Commands:**
- `noted.openToday` → `openDailyNote()` → uses template or default
- `noted.openWithTemplate` → shows picker → `createNoteFromTemplate()`
- `noted.createQuickNote` → directly creates with 'quick' template
- `noted.createCategoryNote` → creates note in category folder with template

**Files that call `generateTemplate()`:**
1. `src/services/noteService.ts` - `openDailyNote()`, `createNoteFromTemplate()`
2. `src/services/categoryService.ts` - `createCategoryNote()`
3. `src/extension.ts` - Legacy `generateTemplate()` function (lines 1954-2044)
4. `src/commands/commands.ts` - Imports and uses template service

---

## Integration Points for JavaScript Templates

### A. Files Requiring Modification

#### 1. **src/services/templateService.ts** (PRIMARY)

**Current Behavior:**
- Only reads `.txt` or `.md` files
- Uses simple string replacement for placeholders
- Returns static string content

**Required Changes:**
```typescript
// Add new function to detect template type
function getTemplateType(templatePath: string): 'text' | 'javascript' {
    const ext = path.extname(templatePath);
    return ext === '.js' ? 'javascript' : 'text';
}

// Add new function to execute JS templates
async function executeJavaScriptTemplate(
    templatePath: string,
    context: TemplateContext
): Promise<string> {
    // Read JS file
    // Execute in sandboxed environment (vm2 or isolated-vm)
    // Pass context object with date, filename, user, workspace, etc.
    // Return generated string
}

// Modify generateTemplate() to handle both types
export async function generateTemplate(
    templateType: string | undefined,
    date: Date,
    filename?: string
): Promise<string> {
    // ... existing quick template handling ...

    // Check for custom templates
    if (templatesPath && templateType) {
        // Check for .js template first
        const jsTemplatePath = path.join(templatesPath, `${templateType}.js`);
        if (await pathExists(jsTemplatePath)) {
            const context = buildTemplateContext(date, filename);
            return executeJavaScriptTemplate(jsTemplatePath, context);
        }

        // Check for text templates (.txt/.md)
        // ... existing logic ...
    }

    // ... rest of function ...
}
```

**New Functions Needed:**
- `buildTemplateContext(date, filename)` - Creates context object for JS execution
- `executeJavaScriptTemplate(templatePath, context)` - Executes JS in sandbox
- `validateJavaScriptTemplate(templatePath)` - Validates JS syntax before execution
- Update `getCustomTemplates()` to include `.js` files

**Security Considerations:**
- Use `vm2` or `isolated-vm` for sandboxed execution
- Whitelist allowed Node.js modules (no `fs`, `child_process`, etc.)
- Timeout for execution (prevent infinite loops)
- Memory limits
- Error handling and user-friendly error messages

#### 2. **src/constants.ts**

**Required Changes:**
```typescript
// Add JS template support to supported extensions
export const TEMPLATE_EXTENSIONS = ['.txt', '.md', '.js'];

// Define template context interface
export interface TemplateContext {
    filename: string;
    date: string;
    time: string;
    year: string;
    month: string;
    day: string;
    weekday: string;
    monthName: string;
    user: string;
    workspace: string;
    // Additional helpers
    formatDate(format: string): string;
    getTimestamp(): number;
    // Access to VS Code API (limited)
    vscode?: {
        workspace: string;
        // ... safe subset of API
    };
}
```

#### 3. **src/providers/templatesTreeProvider.ts**

**Current Behavior:**
- Lists custom templates from `.noted-templates/` folder
- Displays template actions in category sections

**Required Changes:**
```typescript
// In getChildren() for CategoryItem:
const customTemplates = await getCustomTemplates();
// ... existing code for custom templates ...

// Add visual indicator for JS templates
for (const customTemplate of customTemplates) {
    const isJsTemplate = customTemplate.endsWith('.js'); // Need to track extension
    items.push(
        new TemplateActionItem(
            `+ ${customTemplate}${isJsTemplate ? ' (JS)' : ''}`,
            customTemplate,
            'noted.createCategoryNote',
            `Create a new note from ${customTemplate} template`
        )
    );
}
```

**New Requirements:**
- Modify `getCustomTemplates()` to return objects with `{ name, type }` instead of just names
- Add icon/badge to distinguish JS templates from text templates

#### 4. **src/commands/commands.ts**

**Required Changes:**
```typescript
// Update handleCreateCustomTemplate() to prompt for template type
export async function handleCreateCustomTemplate() {
    // Ask for template type
    const templateType = await vscode.window.showQuickPick(
        [
            { label: 'Text Template', value: 'text', description: 'Static template with placeholders' },
            { label: 'JavaScript Template', value: 'js', description: 'Dynamic template with code execution' }
        ],
        { placeHolder: 'Select template type' }
    );

    if (!templateType) return;

    // Ask for template name
    const templateName = await vscode.window.showInputBox({ /* ... */ });

    // Create appropriate starter content based on type
    if (templateType.value === 'js') {
        const starterContent = `// JavaScript Template for Noted
// Return a string with the note content

module.exports = function(context) {
    const { filename, date, time, user, workspace } = context;

    return \`---
tags: []
created: \${date} at \${time}
file: \${filename}
---

# \${filename.replace(/\\.(txt|md)$/, '')}

Created by \${user} in \${workspace}

Your note content here...
\`;
};
`;
        await writeFile(templateFile, starterContent);
    } else {
        // ... existing text template creation ...
    }
}
```

#### 5. **package.json**

**Required Changes:**
```json
{
  "contributes": {
    "configuration": {
      "properties": {
        "noted.allowJavaScriptTemplates": {
          "type": "boolean",
          "default": false,
          "description": "Enable JavaScript templates (requires sandbox execution). Only enable if you trust your templates."
        },
        "noted.templateTimeout": {
          "type": "number",
          "default": 5000,
          "description": "Maximum execution time for JavaScript templates (milliseconds)"
        }
      }
    },
    "commands": [
      {
        "command": "noted.validateJsTemplate",
        "title": "Noted: Validate JavaScript Template"
      }
    ]
  },
  "dependencies": {
    "vm2": "^3.9.19"  // or "isolated-vm": "^4.6.0"
  }
}
```

#### 6. **src/services/configService.ts**

**Required Changes:**
```typescript
export function isJavaScriptTemplatesEnabled(): boolean {
    const config = vscode.workspace.getConfiguration('noted');
    return config.get<boolean>('allowJavaScriptTemplates', false);
}

export function getTemplateTimeout(): number {
    const config = vscode.workspace.getConfiguration('noted');
    return config.get<number>('templateTimeout', 5000);
}
```

### B. New Files Required

#### 1. **src/services/jsTemplateExecutor.ts** (NEW)

Purpose: Sandboxed JavaScript template execution

```typescript
import { VM } from 'vm2';
import * as vscode from 'vscode';
import { TemplateContext } from '../constants';
import { getTemplateTimeout } from './configService';

/**
 * Execute a JavaScript template in a sandboxed environment
 */
export async function executeJsTemplate(
    code: string,
    context: TemplateContext
): Promise<string> {
    const timeout = getTemplateTimeout();

    const vm = new VM({
        timeout,
        sandbox: {
            context,
            console: {
                log: (...args: any[]) => console.log('[Template]', ...args),
                error: (...args: any[]) => console.error('[Template]', ...args)
            }
        }
    });

    try {
        const templateFunction = vm.run(code);

        if (typeof templateFunction !== 'function') {
            throw new Error('Template must export a function');
        }

        const result = templateFunction(context);

        if (typeof result !== 'string') {
            throw new Error('Template function must return a string');
        }

        return result;
    } catch (error) {
        throw new Error(
            `Template execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * Validate JavaScript template syntax
 */
export function validateJsTemplate(code: string): { valid: boolean; error?: string } {
    try {
        new Function(code); // Basic syntax check
        return { valid: true };
    } catch (error) {
        return {
            valid: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
```

#### 2. **src/test/unit/jsTemplateExecutor.test.ts** (NEW)

Purpose: Unit tests for JS template execution

```typescript
import { expect } from 'chai';
import { executeJsTemplate, validateJsTemplate } from '../../services/jsTemplateExecutor';
import { TemplateContext } from '../../constants';

describe('JavaScript Template Executor', () => {
    const mockContext: TemplateContext = {
        filename: 'test.md',
        date: '2024-10-15',
        time: '02:30 PM',
        year: '2024',
        month: '10',
        day: '15',
        weekday: 'Tue',
        monthName: 'October',
        user: 'testuser',
        workspace: 'test-workspace'
    };

    describe('executeJsTemplate', () => {
        it('should execute simple template', async () => {
            const code = `module.exports = (context) => \`Hello \${context.user}\`;`;
            const result = await executeJsTemplate(code, mockContext);
            expect(result).to.equal('Hello testuser');
        });

        it('should reject non-function exports', async () => {
            const code = `module.exports = "not a function";`;
            await expect(executeJsTemplate(code, mockContext)).to.be.rejected;
        });

        // ... more tests ...
    });
});
```

#### 3. **src/commands/jsTemplateCommands.ts** (NEW)

Purpose: Commands specific to JS templates

```typescript
import * as vscode from 'vscode';
import { validateJsTemplate } from '../services/jsTemplateExecutor';
import { readFile } from '../services/fileSystemService';

/**
 * Validate a JavaScript template file
 */
export async function handleValidateJsTemplate() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
    }

    const document = editor.document;
    if (!document.fileName.endsWith('.js')) {
        vscode.window.showErrorMessage('Not a JavaScript file');
        return;
    }

    const code = document.getText();
    const validation = validateJsTemplate(code);

    if (validation.valid) {
        vscode.window.showInformationMessage('Template syntax is valid');
    } else {
        vscode.window.showErrorMessage(`Template validation failed: ${validation.error}`);
    }
}
```

### C. UI/UX Changes

#### 1. Template Picker Enhancement

**Current:** Simple list of template names

**Proposed:** Enhanced picker with template types and descriptions

```typescript
// In extension.ts or commands.ts
const items = [
    ...BUILT_IN_TEMPLATE_INFO.map(t => ({
        label: `$(file-text) ${t.label}`,
        description: t.description,
        detail: 'Built-in • Text',
        value: t.value,
        type: 'built-in'
    })),
    ...customTemplates.map(t => ({
        label: `$(${t.type === 'js' ? 'code' : 'file'}) ${t.name}`,
        description: t.type === 'js' ? 'Dynamic JavaScript template' : 'Custom template',
        detail: `Custom • ${t.type === 'js' ? 'JavaScript' : 'Text'}`,
        value: t.name,
        type: t.type
    }))
];
```

#### 2. Management Section Updates

Add new commands:
- **Validate JS Template** - Check syntax before use
- **Convert to JS Template** - Migrate text template to JS
- **Template Execution Log** - View console output from templates

#### 3. Security Warnings

Show warning when enabling JS templates:
```typescript
const answer = await vscode.window.showWarningMessage(
    'JavaScript templates can execute code on your system. Only enable this feature if you trust your templates.',
    { modal: true },
    'Enable', 'Cancel'
);
```

### D. Documentation Updates

#### 1. **README.md** additions:
- New "JavaScript Templates" section
- Security considerations
- Example templates
- Migration guide from text to JS templates

#### 2. **docs/** folder:
- Create `docs/javascript-templates.md` with:
  - Getting started guide
  - Template context API reference
  - Security best practices
  - Example templates (meeting, research, custom logic)
  - Troubleshooting common issues

#### 3. **CHANGELOG.md**:
```markdown
## [v2.0.0] - YYYY-MM-DD

### Added
- JavaScript template support for dynamic content generation
- Template type selection when creating custom templates
- Template validation command for JS templates
- Configuration options for JS template execution
- Security sandbox for template execution
```

---

## Backward Compatibility Considerations

### Template Discovery
- **Issue:** Existing code only looks for `.txt` and `.md` files
- **Solution:** Update `getCustomTemplates()` to return objects with type info, maintain name-only return for legacy callers
- **Impact:** All existing templates continue to work without changes

### Template File Naming
- **Issue:** No extension collision - `.js` is new
- **Solution:** None needed - perfect separation
- **Impact:** Zero impact on existing templates

### Configuration
- **Issue:** New settings might confuse users
- **Solution:** Default `allowJavaScriptTemplates` to `false` (opt-in)
- **Impact:** Feature is invisible until explicitly enabled

### API Changes
```typescript
// OLD (still supported)
const templates = await getCustomTemplates();
// Returns: ['template1', 'template2', 'template3']

// NEW (enhanced)
const templates = await getCustomTemplatesWithMetadata();
// Returns: [
//   { name: 'template1', type: 'text', path: '...' },
//   { name: 'template2', type: 'text', path: '...' },
//   { name: 'template3', type: 'js', path: '...' }
// ]
```

---

## Migration Path for Existing Templates

### Option 1: Automatic Conversion Tool

Command: `noted.convertTemplateToJs`

```typescript
export async function handleConvertTemplateToJs() {
    // 1. Select text template
    const templates = await getCustomTemplates();
    const selected = await vscode.window.showQuickPick(templates);

    // 2. Read content
    const content = await readFile(templatePath);

    // 3. Convert to JS format
    const jsTemplate = convertTextTemplateToJs(content);

    // 4. Save as .js file
    const newPath = templatePath.replace(/\.(txt|md)$/, '.js');
    await writeFile(newPath, jsTemplate);

    // 5. Optionally delete old template
    const deleteOld = await vscode.window.showQuickPick(['Keep both', 'Delete old']);
    if (deleteOld === 'Delete old') {
        await deleteFile(templatePath);
    }
}

function convertTextTemplateToJs(content: string): string {
    // Escape backticks and ${} in content
    const escaped = content
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${');

    // Replace placeholders with context references
    const converted = escaped
        .replace(/{filename}/g, '${context.filename}')
        .replace(/{date}/g, '${context.date}')
        .replace(/{time}/g, '${context.time}')
        // ... etc for all placeholders

    return `module.exports = function(context) {
    return \`${converted}\`;
};`;
}
```

### Option 2: Manual Migration Guide

Provide documentation showing side-by-side examples:

**Before (text template):**
```
File: {filename}
Created: {date} at {time}
Author: {user}

My content here
```

**After (JS template):**
```javascript
module.exports = function(context) {
    const { filename, date, time, user } = context;

    return `File: ${filename}
Created: ${date} at ${time}
Author: ${user}

My content here`;
};
```

---

## Potential Conflicts & Edge Cases

### 1. Template Name Collisions

**Scenario:** User has both `meeting.txt` and `meeting.js`

**Current Behavior:** Only checks for one extension based on config

**Solution:**
```typescript
// Priority order: .js > .md > .txt
async function findTemplate(name: string): Promise<string | null> {
    const extensions = ['.js', '.md', '.txt'];
    for (const ext of extensions) {
        const path = `${templatesPath}/${name}${ext}`;
        if (await pathExists(path)) {
            return path;
        }
    }
    return null;
}
```

### 2. Template Execution Failures

**Scenario:** JS template throws error or times out

**Solution:**
- Show user-friendly error message
- Fall back to blank note with error comment
- Log full error to console for debugging

```typescript
try {
    content = await executeJsTemplate(templatePath, context);
} catch (error) {
    vscode.window.showErrorMessage(`Template execution failed: ${error.message}`);
    content = `# Error Executing Template\n\n${error.message}\n\n---\n\nTemplate: ${templateType}`;
}
```

### 3. Placeholder Syntax in JS Templates

**Issue:** Text templates use `{variable}`, JS uses `${variable}`

**Solution:** Document clearly that JS templates use standard JS template literals

### 4. Frontmatter Handling

**Issue:** JS templates might generate their own frontmatter

**Solution:**
```typescript
// Check if JS template result already has frontmatter
if (processedContent.trimStart().startsWith('---')) {
    return processedContent; // Use as-is
} else {
    return yamlFrontmatter + processedContent; // Prepend
}
```

### 5. Performance

**Issue:** JS execution may be slower than text replacement

**Solution:**
- Measure and optimize sandbox creation
- Cache VM instance if possible
- Consider worker threads for heavy templates
- Add timeout configuration

---

## Security Considerations

### Threat Model

**Threats:**
1. Malicious template reads sensitive files
2. Template executes system commands
3. Template makes network requests
4. Template consumes excessive resources
5. Template accesses VS Code APIs inappropriately

### Mitigations

#### 1. Sandboxing (vm2 or isolated-vm)
```typescript
const vm = new VM({
    timeout: 5000, // 5 second timeout
    sandbox: {
        context: templateContext,
        console: sanitizedConsole
    },
    // Block dangerous modules
    require: {
        external: false, // No external modules
        builtin: ['util'], // Only safe builtins
        root: './',
        mock: {
            fs: {}, // Mock dangerous APIs
            child_process: {}
        }
    }
});
```

#### 2. Permission System
```typescript
// In package.json
"noted.jsTemplatePermissions": {
    "type": "array",
    "items": { "type": "string" },
    "default": [],
    "description": "Allowed modules for JS templates (e.g., ['util', 'path'])"
}
```

#### 3. Template Signature/Verification
- Optional: Sign trusted templates with crypto
- Warn when executing unsigned templates
- Trust store for verified template authors

#### 4. Execution Logging
```typescript
// Log all template executions
console.log(`[NOTED] Executing JS template: ${templateName}`);
console.log(`[NOTED] Context: user=${context.user}, workspace=${context.workspace}`);
```

#### 5. User Consent
- Prompt on first JS template use
- Show template source before execution (preview mode)
- "Always trust this template" option with checkbox

---

## Testing Strategy

### Unit Tests Required

1. **src/services/jsTemplateExecutor.test.ts**
   - Basic template execution
   - Context variable access
   - Error handling
   - Timeout enforcement
   - Sandbox escape prevention

2. **src/services/templateService.test.ts** (extend existing)
   - JS template detection
   - Template type resolution
   - Mixed text/JS template scenarios
   - Frontmatter handling with JS

3. **Integration tests**
   - End-to-end note creation with JS template
   - Template picker with mixed types
   - CRUD operations on JS templates
   - Migration from text to JS

### Manual Testing Checklist

- [ ] Create JS template via command
- [ ] Edit JS template in editor
- [ ] Delete JS template
- [ ] Duplicate JS template
- [ ] Create note from JS template
- [ ] Test all context variables in template
- [ ] Verify sandbox blocks file access
- [ ] Verify sandbox blocks network access
- [ ] Test timeout with infinite loop
- [ ] Test error handling with syntax error
- [ ] Test mixed text/JS template listing
- [ ] Test template name collision (.txt and .js)
- [ ] Convert text template to JS
- [ ] Validate JS template syntax
- [ ] Test with various VS Code themes (icon rendering)

---

## Performance Impact Analysis

### Estimated Performance Changes

| Operation | Current (Text) | With JS | Impact |
|-----------|----------------|---------|--------|
| Template discovery | ~5ms | ~8ms | +60% (more file types) |
| Template loading | ~2ms | ~2ms | No change (file read) |
| Template execution | ~0.5ms | ~15ms | +3000% (VM overhead) |
| Note creation (total) | ~50ms | ~63ms | +26% |

### Optimization Strategies

1. **Lazy VM Initialization**
   - Create VM only when JS template selected
   - Don't initialize if feature disabled

2. **Template Caching**
   - Cache compiled templates in memory
   - Invalidate cache on file change

3. **Parallel Processing**
   - If creating multiple notes, execute templates in parallel
   - Use worker threads for heavy computation

4. **Progressive Loading**
   - Load text templates first, JS templates async
   - Don't block UI on template discovery

---

## Rollout Plan

### Phase 1: Experimental (v2.0.0-beta)
- Release JS template support as experimental feature
- Default disabled, opt-in via config
- Gather feedback from early adopters
- Iterate on security model
- **Duration:** 4-8 weeks

### Phase 2: Stable Release (v2.0.0)
- Feature complete and tested
- Documentation finalized
- Security audited
- Still opt-in by default
- **Duration:** Initial stable release

### Phase 3: Promotion (v2.1.0)
- Consider enabling by default (if safe)
- Promote feature in README
- Create example template gallery
- Blog post / demo video
- **Duration:** 2-4 weeks after v2.0.0

---

## Alternative Approaches Considered

### Alternative 1: Lua Templates
**Pros:** Safer than JS, designed for embedding
**Cons:** Less familiar to developers, smaller ecosystem

### Alternative 2: Handlebars/Mustache
**Pros:** Logic-less, very safe
**Cons:** Limited expressiveness, can't do complex logic

### Alternative 3: Python Templates
**Pros:** Popular, great for data processing
**Cons:** Requires Python runtime, harder to sandbox

### Alternative 4: WebAssembly Templates
**Pros:** Perfect sandbox, high performance
**Cons:** Steep learning curve, overkill for simple templates

**Conclusion:** JavaScript offers the best balance of familiarity, power, and (with proper sandboxing) security.

---

## Dependencies to Add

### Required
```json
{
  "dependencies": {
    "vm2": "^3.9.19"
  }
}
```

### Alternative (if vm2 has issues)
```json
{
  "dependencies": {
    "isolated-vm": "^4.6.0"
  }
}
```

**Note:** `isolated-vm` requires native compilation but offers better security. `vm2` is pure JavaScript and easier to install.

### Development Dependencies
```json
{
  "devDependencies": {
    "@types/vm2": "^1.1.0"
  }
}
```

---

## Summary of Required Changes

### High Priority (Core Functionality)
1. ✅ Modify `templateService.ts` - Template execution logic
2. ✅ Create `jsTemplateExecutor.ts` - Sandbox execution
3. ✅ Update `constants.ts` - Add JS support constants
4. ✅ Modify `getCustomTemplates()` - Detect .js files
5. ✅ Update template picker UI - Show template types
6. ✅ Add configuration settings - Enable/disable JS templates
7. ✅ Update `commands.ts` - Template type selection

### Medium Priority (Enhanced UX)
8. ✅ Update `templatesTreeProvider.ts` - Visual indicators for JS
9. ✅ Add validation command - Check JS syntax
10. ✅ Create conversion tool - Text → JS migration
11. ✅ Add security warnings - First-time use consent
12. ✅ Update documentation - New feature docs

### Low Priority (Nice to Have)
13. ⚠️ Template gallery/marketplace - Share templates
14. ⚠️ Template debugging - Step through execution
15. ⚠️ Template profiling - Performance metrics
16. ⚠️ Template linting - Style checking
17. ⚠️ IntelliSense for context - Autocomplete in JS templates

---

## Conclusion

Adding JavaScript template support to Noted is feasible and can be implemented with minimal disruption to existing functionality. The key success factors are:

1. **Security First**: Proper sandboxing is non-negotiable
2. **Backward Compatibility**: All existing templates must continue to work
3. **Opt-In**: Feature disabled by default until user explicitly enables
4. **Clear Documentation**: Security implications must be clearly communicated
5. **Gradual Rollout**: Beta → Stable → Promoted

**Estimated Effort:**
- Core implementation: 40-60 hours
- Testing & security: 20-30 hours
- Documentation: 10-15 hours
- **Total: 70-105 hours** (2-3 weeks full-time)

**Risk Assessment:** Medium
- Technical risks: Low (well-understood sandboxing solutions exist)
- Security risks: Medium (requires careful implementation and review)
- User acceptance risks: Low (opt-in feature, doesn't affect existing users)

**Recommendation:** Proceed with implementation, prioritizing security and backward compatibility.
