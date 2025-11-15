# GitHub Issue #107 Breakdown

## Issue #107 (EDIT THIS EXISTING ISSUE - Convert to Epic)

**Title:** `feat: AI-Powered Template Variable Customization in Template Browser [EPIC]`

**Labels:** `enhancement`, `epic`, `template-browser`

**Description:**

## Overview

This epic tracks the implementation of AI-powered template variable customization within the Template Browser UI. Users will be able to interactively define and customize template variables with AI assistance, validation, and real-time preview.

## Problem Statement

**Current State:**
- Templates support 10 built-in variables (`{filename}`, `{date}`, etc.)
- Custom variables require manual JSON file editing
- No AI assistance for identifying variable candidates
- Error-prone and not discoverable for users

**Desired State:**
- Interactive variable editor UI within Template Browser
- AI-powered variable suggestions based on template content
- Real-time validation and preview
- Consistent UX with bundle variable editing

## Implementation Phases

This epic is broken down into 3 sequential sub-issues:

1. **Phase 1:** Variable Editor UI Foundation (#108) - 2-3 days
2. **Phase 2:** AI-Powered Variable Suggestions (#109) - 3-4 days
3. **Phase 3:** Advanced Validation & UX Polish (#110) - 2 days

**Total Estimated Time:** 7-9 days

## Success Criteria

- ✅ Users can manage template variables through UI without editing JSON
- ✅ AI suggests relevant variables based on template content analysis
- ✅ Real-time validation prevents errors
- ✅ Consistent UX across template and bundle variable editing
- ✅ Built-in templates remain read-only
- ✅ Performance targets met (<500ms modal load, <5s AI suggestions)

## Technical Approach

**Key Files:**
- `src/templates/TemplateGenerator.ts` - Variable management methods
- `src/templates/templateBrowserView.ts` - Message handlers and webview
- `src/templates/TemplateTypes.ts` - Enhanced `TemplateVariable` interface

**Dependencies:**
- VS Code LLM API (GitHub Copilot gpt-4o)
- Existing Template Browser UI (v1.44.0)

## Progress Tracking

- [ ] #108 - Variable Editor UI Foundation
- [ ] #109 - AI-Powered Variable Suggestions
- [ ] #110 - Advanced Validation & UX Polish

---

## Sub-Issue #108 (CREATE NEW ISSUE)

**Title:** `feat: Interactive Variable Editor Modal in Template Browser (Phase 1)`

**Labels:** `enhancement`, `template-browser`, `ui`

**Milestone:** Template Variable Customization

**Description:**

## Overview

Implement the foundational variable editor UI as Phase 1 of the Template Variable Customization epic (#107).

## Scope

Add an interactive modal to the Template Browser that allows users to add, edit, and remove custom template variables through a form-based interface.

## Acceptance Criteria

- ✅ "Edit Variables" button appears on custom template cards
- ✅ Button is disabled/hidden for built-in templates (read-only)
- ✅ Modal displays current variables in an editable list
- ✅ Users can add new variables with name, type, description, default value
- ✅ Users can edit existing variables
- ✅ Users can delete variables (with confirmation)
- ✅ Real-time validation:
  - Variable names must be lowercase with underscores only
  - No duplicate variable names
  - No conflicts with built-in variables
  - Required fields enforced
- ✅ Live preview shows template with current variable values
- ✅ Changes persist to template `.json` files
- ✅ Modal loads in <500ms
- ✅ Error messages are clear and actionable

## Technical Implementation

### Files to Modify

**`src/templates/TemplateTypes.ts`**
```typescript
export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'enum' | 'boolean';
  description: string;
  defaultValue?: any;
  options?: string[]; // For enum type
  required?: boolean;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
  };
}
```

**`src/templates/TemplateGenerator.ts`**
- Add `validateVariableName(name: string, existingVars: string[]): {valid: boolean, error?: string}`
- Add `addVariable(template: Template, variable: TemplateVariable): Promise<void>`
- Add `updateVariable(template: Template, oldName: string, newVariable: TemplateVariable): Promise<void>`
- Add `removeVariable(template: Template, variableName: string): Promise<void>`
- Add `getBuiltInVariableNames(): string[]` - Returns reserved names

**`src/templates/templateBrowserView.ts`**
- Add message handler: `case 'editVariables'`
- Add message handler: `case 'saveVariables'`
- Add method: `loadVariablesForTemplate(templateId: string)`

**Webview HTML/CSS**
- Create modal overlay with variable editor form
- Variable list with add/edit/delete buttons
- Form fields: name, type dropdown, description, default value
- Real-time validation error display
- Preview pane showing template with variable substitutions
- Save/Cancel buttons

### User Flow

1. User clicks "Edit Variables" on custom template card
2. Modal opens showing current variables (or empty state)
3. User adds/edits/removes variables via form
4. Preview updates in real-time
5. Validation errors appear inline
6. User clicks "Save" → changes persist to JSON file
7. Template Browser refreshes to show updated template

## Testing Requirements

- [ ] Unit tests for validation logic in `TemplateGenerator.ts`
- [ ] Verify built-in variables are truly reserved
- [ ] Test edge cases: special characters, very long names, empty values
- [ ] Test persistence: verify JSON file is correctly updated
- [ ] Manual testing: keyboard navigation, error states, modal close

## Dependencies

None - This is the foundation phase

## Estimated Time

2-3 days

---

## Sub-Issue #109 (CREATE NEW ISSUE)

**Title:** `feat: AI-Powered Variable Suggestions in Template Editor (Phase 2)`

**Labels:** `enhancement`, `template-browser`, `ai`, `llm`

**Milestone:** Template Variable Customization

**Description:**

## Overview

Add AI-powered variable suggestions to the Template Variable Editor as Phase 2 of the Template Variable Customization epic (#107).

## Dependencies

**Blocked by:** #108 (Variable Editor UI must be completed first)

## Scope

Integrate VS Code LLM API (GitHub Copilot) to analyze template content and suggest relevant custom variables. Users can review, accept, or reject suggestions.

## Acceptance Criteria

- ✅ "Suggest Variables with AI" button appears in variable editor modal
- ✅ Button is disabled when Copilot is unavailable
- ✅ AI analyzes template content and suggests 3-8 relevant variables
- ✅ Each suggestion includes:
  - Variable name (validated format)
  - Type (string/number/date/enum/boolean)
  - Description explaining purpose
  - Example value
  - Rationale (why AI suggested it)
  - Confidence score (0.0-1.0)
- ✅ Suggestions appear within 5 seconds
- ✅ Loading indicator shown during analysis
- ✅ Users can accept individual suggestions or all at once
- ✅ Accepted suggestions are added to variable list (editable)
- ✅ No duplicate suggestions with existing variables
- ✅ Graceful error handling:
  - Copilot not available
  - Rate limiting
  - Malformed AI responses
  - Network errors

## Technical Implementation

### Files to Modify

**`src/templates/TemplateGenerator.ts`**
```typescript
interface VariableSuggestion {
  name: string;
  type: 'string' | 'number' | 'date' | 'enum' | 'boolean';
  description: string;
  exampleValue: any;
  rationale: string;
  confidence: number;
}

async function suggestVariables(
  templateContent: string,
  existingVariables: TemplateVariable[]
): Promise<VariableSuggestion[]> {
  // 1. Get VS Code LLM API model (gpt-4o)
  // 2. Build prompt with template content and existing variables
  // 3. Request AI analysis
  // 4. Parse JSON response
  // 5. Filter by confidence >0.6
  // 6. Remove duplicates
  // 7. Return suggestions
}

function buildVariableSuggestionPrompt(
  content: string,
  existing: TemplateVariable[]
): string {
  // Construct prompt asking AI to analyze template and suggest variables
}

function parseVariableSuggestions(aiResponse: string): VariableSuggestion[] {
  // Parse JSON response and validate structure
}
```

**`src/templates/templateBrowserView.ts`**
- Add message handler: `case 'suggestVariables'`
- Add method: `handleSuggestVariables(templateId: string)`
- Check Copilot availability before invoking
- Return suggestions or error to webview

**Webview Updates**
- Add "Suggest Variables with AI" button (sparkle icon ✨)
- Display suggestions in expandable cards showing all metadata
- Add "Accept" button per suggestion
- Add "Accept All" button for batch acceptance
- Show loading spinner during AI analysis
- Display error messages for failures

### AI Prompt Design

```
Analyze the following template content and suggest custom variables that would make this template more flexible and reusable.

Template content:
"""
{template_content}
"""

Existing variables:
{existing_variables_list}

Requirements:
- Suggest 3-8 variables based on template content
- Variable names must be lowercase with underscores (e.g., project_name)
- Do not suggest variables that already exist
- Consider: repeated text, placeholder patterns, customizable sections
- Assign confidence scores (0.0-1.0) based on certainty

Return JSON array:
[
  {
    "name": "variable_name",
    "type": "string|number|date|enum|boolean",
    "description": "Clear explanation of purpose",
    "exampleValue": "example",
    "rationale": "Why this variable is useful",
    "confidence": 0.85
  }
]
```

### Error Handling

- **Copilot unavailable:** Show message "AI suggestions require GitHub Copilot. Please enable it in VS Code settings."
- **Rate limiting:** Show message "AI is temporarily unavailable. Please try again in a moment."
- **Malformed response:** Log error, show message "AI could not generate suggestions. Please try again."
- **Network error:** Show message "Network error. Please check your connection."

## Testing Requirements

- [ ] Unit tests for `suggestVariables()` with mock LLM responses
- [ ] Test confidence filtering (<0.6 rejected)
- [ ] Test duplicate detection
- [ ] Test error handling for all failure modes
- [ ] Manual testing with various template types
- [ ] Verify suggestion quality and relevance

## Performance Requirements

- AI response within 5 seconds (show loading after 1s)
- Graceful degradation if timeout occurs

## Estimated Time

3-4 days

---

## Sub-Issue #110 (CREATE NEW ISSUE)

**Title:** `feat: Enhanced Variable Editor UX and Validation (Phase 3)`

**Labels:** `enhancement`, `template-browser`, `ux`, `accessibility`

**Milestone:** Template Variable Customization

**Description:**

## Overview

Polish the Variable Editor with advanced validation, keyboard shortcuts, and accessibility improvements as Phase 3 of the Template Variable Customization epic (#107).

## Dependencies

**Blocked by:**
- #108 (Variable Editor UI)
- #109 (AI Suggestions)

## Scope

Add final UX enhancements, advanced validation rules, keyboard navigation, and accessibility features to complete the variable editor experience.

## Acceptance Criteria

### Advanced Validation
- ✅ Reserved keyword detection (prevent `class`, `function`, `if`, etc.)
- ✅ Circular reference detection (variable referencing itself)
- ✅ Type-specific validation:
  - `enum` type requires `options` array
  - `number` type validates min/max constraints
  - `date` type validates format patterns
- ✅ Warning for unused variables (defined but not used in template)
- ✅ Suggestion for missing variables (used in template but not defined)

### Keyboard Shortcuts
- ✅ `Ctrl+S` / `Cmd+S` - Save changes
- ✅ `Esc` - Close modal (with unsaved changes warning)
- ✅ `Tab` / `Shift+Tab` - Navigate form fields
- ✅ `Enter` - Submit current field / Add variable
- ✅ `Delete` - Remove selected variable (with confirmation)
- ✅ `Ctrl+Z` / `Cmd+Z` - Undo last change
- ✅ Arrow keys - Navigate variable list

### Accessibility
- ✅ All form fields have ARIA labels
- ✅ Error messages announced to screen readers
- ✅ Focus management (modal traps focus, returns on close)
- ✅ Keyboard navigation fully functional without mouse
- ✅ Color contrast meets WCAG 2.1 AA standards
- ✅ Loading states announced to screen readers

### UX Enhancements
- ✅ Variable usage counter (shows how many times variable appears in template)
- ✅ Variable usage highlighting in preview (highlight all occurrences)
- ✅ Tooltips on variable types explaining when to use each
- ✅ Batch operations:
  - Select multiple variables
  - Delete multiple at once
  - Reorder variables via drag-and-drop
- ✅ Smooth animations for add/remove operations
- ✅ Unsaved changes warning when closing modal
- ✅ Export/Import variables as JSON (for sharing configurations)

## Technical Implementation

### Files to Modify

**`src/templates/TemplateGenerator.ts`**
```typescript
// Advanced validation
function validateVariableAdvanced(
  variable: TemplateVariable,
  template: Template,
  existingVars: TemplateVariable[]
): {valid: boolean, errors: string[], warnings: string[]} {
  // Check reserved keywords, circular refs, type-specific rules
}

function getReservedKeywords(): string[] {
  // Return list of reserved JavaScript/template keywords
}

function detectCircularReferences(
  variable: TemplateVariable,
  template: Template
): boolean {
  // Check if variable references itself
}

function getVariableUsageCount(
  variableName: string,
  templateContent: string
): number {
  // Count occurrences of {variable_name} in content
}

function findUnusedVariables(
  variables: TemplateVariable[],
  templateContent: string
): string[] {
  // Return variables defined but not used
}

function findUndefinedVariables(
  templateContent: string,
  variables: TemplateVariable[]
): string[] {
  // Return variables used but not defined
}
```

**`src/templates/templateBrowserView.ts`**
- Add message handler: `case 'exportVariables'`
- Add message handler: `case 'importVariables'`
- Add message handler: `case 'reorderVariables'`
- Add keyboard event handlers

**Webview Updates**
- Add tooltips to all interactive elements
- Implement keyboard event listeners
- Add drag-and-drop for variable reordering
- Add usage counter badges to variable items
- Highlight variable occurrences in preview
- Add export/import buttons
- Implement undo/redo stack for variable changes
- Add confirmation dialogs for destructive actions

### Reserved Keywords List
```typescript
const RESERVED_KEYWORDS = [
  // JavaScript reserved words
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
  'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
  'for', 'function', 'if', 'import', 'in', 'instanceof', 'new',
  'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof',
  'var', 'void', 'while', 'with', 'yield',

  // Built-in template variables
  'filename', 'date', 'time', 'year', 'month', 'day',
  'weekday', 'month_name', 'user', 'workspace'
];
```

### Accessibility Implementation

**ARIA Labels:**
```html
<input
  type="text"
  id="variable-name"
  aria-label="Variable name"
  aria-required="true"
  aria-invalid="false"
  aria-describedby="variable-name-error"
/>
<span id="variable-name-error" role="alert" aria-live="polite"></span>
```

**Focus Management:**
```typescript
// Trap focus in modal
modal.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    const focusableElements = modal.querySelectorAll(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }
});
```

## Testing Requirements

- [ ] Unit tests for all validation functions
- [ ] Test reserved keyword detection
- [ ] Test circular reference detection
- [ ] Test keyboard shortcuts in all scenarios
- [ ] Accessibility audit with screen reader (NVDA/JAWS)
- [ ] Test focus management and keyboard navigation
- [ ] Test color contrast with accessibility checker
- [ ] Manual testing of all UX enhancements

## Performance Requirements

- Variable usage highlighting updates in <100ms
- Drag-and-drop reordering is smooth (60fps)
- No UI jank during animations

## Estimated Time

2 days

---

## Summary

**Total Issues to Create:**
1. Edit existing issue #107 to convert it to an epic
2. Create new issue #108 (Phase 1 - Variable Editor UI)
3. Create new issue #109 (Phase 2 - AI Suggestions)
4. Create new issue #110 (Phase 3 - UX Polish)

**Implementation Order:**
#108 → #109 → #110 → Close #107
