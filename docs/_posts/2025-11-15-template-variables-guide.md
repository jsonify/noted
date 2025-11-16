---
title: Advanced Template Variables Guide
date: 2025-11-15 10:00:00 -0800
categories: [Features, Templates, Advanced]
tags: [templates, variables, validation, ai, automation]
---

# Advanced Template Variables Guide

Master the art of creating powerful, reusable templates with custom variables, advanced validation, and AI-powered features.

## What Are Template Variables?

Template variables transform static note templates into dynamic, intelligent tools that adapt to your workflow. Instead of manually filling in repetitive information, variables automatically populate with context-aware data, enforce validation rules, and guide users through structured note creation.

**Value Proposition**: Template variables save time, reduce errors, and ensure consistency across your notes. A well-designed template with variables can turn a 5-minute manual process into a 30-second guided workflow.

**Real-world impact**:
- **Time savings**: Reduce note creation time by 70-90%
- **Consistency**: Enforce standardized structures across teams
- **Error prevention**: Validate inputs before note creation
- **Guided workflows**: Interactive prompts ensure nothing is forgotten

## Quick Start (5-Minute Walkthrough)

Let's create your first template with custom variables in under 5 minutes.

### Step 1: Open Template Browser

1. Open Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
2. Type "Noted: Show Template Browser"
3. Click "Create New Template" button

### Step 2: Define Basic Template

```json
{
  "id": "bug-report",
  "name": "Bug Report",
  "description": "Structured bug report with severity tracking",
  "category": "Development",
  "tags": ["bug", "development"],
  "version": "1.0.0",
  "variables": [],
  "content": "# Bug: {title}\n\n**Severity**: {severity}\n**Reporter**: {user}\n**Date**: {date}\n\n## Description\n{description}\n\n## Steps to Reproduce\n1. {step1}\n2. {step2}\n3. {step3}\n\n## Expected Behavior\n{expected}\n\n## Actual Behavior\n{actual}\n"
}
```

### Step 3: Add Variables with Validation

Click "Add Variable" in the Template Browser and define these variables:

```json
{
  "name": "title",
  "type": "string",
  "required": true,
  "prompt": "Brief bug title",
  "validation": {
    "minLength": 5,
    "maxLength": 80
  }
}
```

```json
{
  "name": "severity",
  "type": "enum",
  "required": true,
  "prompt": "Bug severity level",
  "values": ["Critical", "High", "Medium", "Low"],
  "default": "Medium"
}
```

```json
{
  "name": "description",
  "type": "string",
  "required": true,
  "prompt": "Detailed description of the bug",
  "validation": {
    "minLength": 20
  }
}
```

### Step 4: Test Your Template

1. Click "Create Note from Template"
2. Fill in the prompted values
3. See your structured note created instantly!

**Congratulations!** You've created a production-ready template with validation in under 5 minutes.

## Variable Types Deep Dive

Noted supports five powerful variable types, each with specific use cases and validation capabilities.

### String Variables

**Best for**: Text inputs, descriptions, names, titles

```json
{
  "name": "project_name",
  "type": "string",
  "required": true,
  "prompt": "Enter the project name",
  "default": "Untitled Project",
  "validation": {
    "pattern": "^[a-zA-Z0-9-_]+$",
    "minLength": 3,
    "maxLength": 50
  }
}
```

**Validation options**:
- `pattern`: Regex pattern (e.g., `"^[A-Z]{3}-[0-9]{4}$"` for ticket IDs like "BUG-1234")
- `minLength`: Minimum character count
- `maxLength`: Maximum character count

**Use cases**:
- Project names with alphanumeric constraints
- Ticket IDs following specific formats
- User input requiring format validation
- Multi-line descriptions (no maxLength)

### Number Variables

**Best for**: Quantities, scores, ratings, percentages, counts

```json
{
  "name": "priority_score",
  "type": "number",
  "required": false,
  "prompt": "Priority score (1-100)",
  "default": 50,
  "validation": {
    "min": 1,
    "max": 100
  }
}
```

**Validation options**:
- `min`: Minimum allowed value
- `max`: Maximum allowed value

**Use cases**:
- Priority rankings (1-100)
- Story points (1, 2, 3, 5, 8, 13, 21)
- Budget amounts with min/max constraints
- Percentage values (0-100)
- Age or duration values

### Enum Variables

**Best for**: Predefined choices, status values, categories

```json
{
  "name": "status",
  "type": "enum",
  "required": true,
  "prompt": "Select status",
  "values": ["Draft", "In Review", "Approved", "Published"],
  "default": "Draft"
}
```

**Validation options**:
- `values`: **Required** - Array of allowed values

**Use cases**:
- Status workflows (Draft → Review → Approved)
- Priority levels (Critical, High, Medium, Low)
- Environment selection (Development, Staging, Production)
- Team assignments (Frontend, Backend, DevOps, QA)

**Pro tip**: Keep enum values to 3-7 options for best UX. Too many options overwhelm users.

### Date Variables

**Best for**: Deadlines, milestones, scheduled events

```json
{
  "name": "due_date",
  "type": "date",
  "required": false,
  "prompt": "Project due date (YYYY-MM-DD)",
  "default": "2025-12-31",
  "validation": {
    "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
  }
}
```

**Validation options**:
- `pattern`: Regex for date format validation

**Common date formats**:
- ISO 8601: `^\d{4}-\d{2}-\d{2}$` (2025-11-15)
- US format: `^\d{2}/\d{2}/\d{4}$` (11/15/2025)
- European: `^\d{2}\.\d{2}\.\d{4}$` (15.11.2025)

**Use cases**:
- Project deadlines with format enforcement
- Sprint start/end dates
- Release schedules
- Event timestamps

### Boolean Variables

**Best for**: Yes/no decisions, feature flags, toggles

```json
{
  "name": "include_changelog",
  "type": "boolean",
  "required": false,
  "prompt": "Include changelog section?",
  "default": true
}
```

**Validation options**: None (booleans are inherently valid)

**Use cases**:
- Optional template sections (include/exclude)
- Feature flags in configuration notes
- Acknowledgment checkboxes
- Binary choices (public/private, active/inactive)

**Implementation tip**: Use with conditional logic in templates:
```markdown
{if include_changelog}
## Changelog
-
{endif}
```

## Advanced Validation Rules

Advanced validation ensures data quality before note creation, catching errors early and guiding users toward correct inputs.

### String Pattern Validation

Use regex patterns to enforce specific formats:

```json
{
  "name": "ticket_id",
  "type": "string",
  "prompt": "Enter Jira ticket ID (e.g., PROJ-1234)",
  "validation": {
    "pattern": "^[A-Z]{2,10}-[0-9]{1,6}$"
  }
}
```

**Common patterns**:
- Email: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
- Phone (US): `^\d{3}-\d{3}-\d{4}$`
- URL: `^https?://[^\s/$.?#].[^\s]*$`
- Git branch: `^[a-z0-9/_-]+$`
- Semantic version: `^\d+\.\d+\.\d+$`

### String Length Constraints

Prevent too-short or too-long inputs:

```json
{
  "name": "summary",
  "type": "string",
  "validation": {
    "minLength": 20,
    "maxLength": 280
  }
}
```

**Use cases**:
- Tweet-length summaries (280 chars)
- Minimum viable descriptions (20+ chars)
- Title constraints for readability (5-80 chars)

### Number Range Validation

Enforce logical boundaries:

```json
{
  "name": "confidence_score",
  "type": "number",
  "validation": {
    "min": 0.0,
    "max": 1.0
  }
}
```

**Real-world examples**:
- Percentage: min=0, max=100
- Star rating: min=1, max=5
- Age: min=0, max=120
- Story points: min=1, max=21 (Fibonacci)

### Enum Value Enforcement

Enum types automatically validate against the `values` array:

```json
{
  "name": "environment",
  "type": "enum",
  "values": ["dev", "staging", "prod"]
}
```

**Error prevention**: Users cannot enter "production" if only "prod" is allowed. This eliminates inconsistencies across notes.

## Validation Feedback System

The Template Browser provides **real-time validation feedback** as you define variables, preventing errors before they occur.

### Error vs. Warning Distinction

**Errors** (red, blocks note creation):
- Reserved keyword usage
- Circular references
- Invalid variable names
- Missing required enum values
- Invalid regex patterns
- Min > max violations

**Warnings** (yellow, allows creation):
- Unused variables (defined but not in template)
- Undefined variables (used but not defined)

### Real-Time Feedback Display

As you type in the Template Browser variable editor:

1. **Variable name validation**: Instant feedback on format (lowercase, letters, numbers, underscores)
2. **Reserved keyword check**: Highlights if name conflicts with built-ins or JavaScript keywords
3. **Circular reference detection**: Warns if default value references itself
4. **Usage analysis**: Shows occurrence count and positions in template

### Error Messages Reference

| Error | Cause | Solution |
|-------|-------|----------|
| `Variable name cannot be empty` | Blank name field | Enter a valid name |
| `'function' is a reserved keyword` | Using JavaScript keyword | Choose different name (e.g., `fn_name`) |
| `Circular reference in default value` | `{name}` contains `{name}` | Remove self-reference |
| `Enum requires at least one value` | Empty `values` array | Add at least one enum option |
| `Min cannot be greater than max` | Invalid number range | Fix min/max values |
| `Invalid regex pattern` | Malformed regex | Test pattern at regex101.com |

### Using Warnings Effectively

**Unused variable warning**:
```
⚠️ Variable 'author' is defined but not used in template
```

**When to fix**: If you intended to use it, add `{author}` to template content.

**When to ignore**: If you're defining it for future use or API compatibility.

**Undefined variable warning**:
```
⚠️ Variable 'deadline' is used in template but not defined
```

**Fix**: Add variable definition for `deadline`, or it will be treated as literal text `{deadline}` in created notes.

## Reserved Keywords Reference

Certain words cannot be used as variable names to avoid conflicts with built-in systems.

### JavaScript Reserved Words (50+ keywords)

These conflict with the template engine's JavaScript execution context:

**Control flow**: `if`, `else`, `for`, `while`, `do`, `switch`, `case`, `break`, `continue`, `return`

**Declarations**: `var`, `let`, `const`, `function`, `class`

**Operators**: `typeof`, `instanceof`, `new`, `delete`, `void`, `in`, `of`

**Exception handling**: `try`, `catch`, `finally`, `throw`

**Module system**: `import`, `export`, `from`, `as`

**OOP**: `this`, `super`, `extends`, `static`

**Async**: `async`, `await`, `yield`

**Literals**: `null`, `true`, `false`, `undefined`, `NaN`, `Infinity`

**Strict mode**: `implements`, `interface`, `package`, `private`, `protected`, `public`

**Full list**: See [MDN JavaScript Reserved Words](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#reserved_words)

### Built-In Template Variables (10)

These are system-provided variables that auto-populate with runtime data:

| Variable | Example Output | Description |
|----------|---------------|-------------|
| `filename` | `project-meeting` | Note file name |
| `date` | `Sunday, November 15, 2025` | Full date |
| `time` | `2:30 PM` | 12-hour time |
| `year` | `2025` | Year |
| `month` | `11` | Month (with leading zero) |
| `day` | `15` | Day (with leading zero) |
| `weekday` | `Sun` | Short day name |
| `month_name` | `November` | Full month name |
| `user` | `john` | System username |
| `workspace` | `my-project` | VS Code workspace name |

**Cannot override**: You cannot create custom variables with these names.

### Validation Behavior

When you attempt to use a reserved keyword:

```json
{
  "name": "function",  // ❌ Reserved keyword
  "type": "string"
}
```

**Error message**: `'function' is a reserved keyword and cannot be used as a variable name`

**Solution**: Use descriptive alternatives:
- Instead of `class`: Use `class_name`, `category`, or `type`
- Instead of `function`: Use `fn_name`, `method`, or `operation`
- Instead of `new`: Use `is_new`, `new_item`, or `created`

## Circular Reference Detection

Circular references occur when a variable's default value references itself, creating an infinite loop.

### What Are Circular References?

```json
{
  "name": "title",
  "type": "string",
  "default": "Project: {title}"  // ❌ References itself
}
```

**Why it's problematic**:
1. Creates infinite expansion: `Project: {title}` → `Project: Project: {title}` → ...
2. Causes template engine to hang or crash
3. Prevents note creation

### Detection Algorithm

The validation system checks if a variable's default value contains `{variablename}`:

```typescript
// Simplified detection logic
function detectCircular(variable) {
  if (!variable.default) return false;
  const pattern = new RegExp(`\\{${variable.name}\\}`, 'g');
  return pattern.test(variable.default);
}
```

### Error Message

```
❌ Variable 'title' has a circular reference in its default value
```

### How to Fix

**Bad example**:
```json
{
  "name": "summary",
  "default": "Summary: {summary}"  // ❌ Circular
}
```

**Good example**:
```json
{
  "name": "summary",
  "default": "Summary: {project_name}"  // ✅ References different variable
}
```

**Alternative patterns**:
```json
// Pattern 1: Static default
{
  "name": "title",
  "default": "Untitled"  // ✅ No variable reference
}

// Pattern 2: Reference other variables
{
  "name": "full_name",
  "default": "{first_name} {last_name}"  // ✅ References other vars
}

// Pattern 3: Built-in variables
{
  "name": "created_by",
  "default": "{user} on {date}"  // ✅ Built-in variables allowed
}
```

## Usage Analysis Features

The Template Browser analyzes how variables are used in your template content, providing insights and catching common mistakes.

### Variable Occurrence Counting

**What it shows**: How many times `{variablename}` appears in template content.

**Example**:
```json
{
  "content": "# {title}\n\nProject: {title}\n\nSummary: {summary}\n"
}
```

**Analysis**:
- `title`: Used 2 times
- `summary`: Used 1 time

**Use case**: Verify important variables appear where expected (e.g., title in heading and metadata).

### Position Tracking

**What it shows**: Exact line and column numbers where each variable appears.

**Example output**:
```
Variable: title
  Line 1, Column 3: # {title}
  Line 3, Column 11: Project: {title}
```

**Use case**:
- Debug template rendering issues
- Quickly navigate to variable usage
- Document variable purposes

### Unused Variables Detection

**What it shows**: Variables defined in the `variables` array but never used in `content`.

**Example**:
```json
{
  "variables": [
    {"name": "title", "type": "string"},
    {"name": "author", "type": "string"}  // ⚠️ Not used
  ],
  "content": "# {title}\n\nCreated on {date}\n"
}
```

**Warning**: `⚠️ Variable 'author' is defined but not used in template`

**When to fix**:
- You forgot to add it to content → Add `{author}` to template
- It's a draft/placeholder → Safe to ignore for now

**When to remove**:
- It's no longer needed → Delete from `variables` array

### Undefined Variables Detection

**What it shows**: Variables used in `content` but not defined in the `variables` array.

**Example**:
```json
{
  "variables": [
    {"name": "title", "type": "string"}
  ],
  "content": "# {title}\n\nAuthor: {author}\n"  // ⚠️ author not defined
}
```

**Warning**: `⚠️ Variable 'author' is used but not defined`

**Impact**: `{author}` will appear as literal text in created notes instead of being replaced.

**Fix**: Add variable definition:
```json
{
  "name": "author",
  "type": "string",
  "default": "{user}"
}
```

### Usage Statistics Dashboard

The Template Browser displays usage stats:

```
Variable Usage Statistics:
✓ 3 of 4 variables used in template
⚠️ 1 unused variable: author
⚠️ 0 undefined variables
```

**Healthy templates**: 100% of defined variables used, 0 undefined variables.

## Import/Export Workflow

Share variable definitions across templates, teams, or workspaces using JSON import/export.

### Exporting Variables

**Step 1**: Open template in Template Browser

**Step 2**: Click "Export Variables" button

**Step 3**: Choose export options:
- **Format**: JSON (default), YAML, CSV
- **Include metadata**: Validation rules, descriptions, prompts
- **Scope**: All variables or selected only

**Example export (JSON)**:
```json
{
  "export_version": "1.0",
  "exported_at": "2025-11-15T10:30:00Z",
  "source_template": "bug-report",
  "variables": [
    {
      "name": "title",
      "type": "string",
      "required": true,
      "prompt": "Brief bug title",
      "validation": {
        "minLength": 5,
        "maxLength": 80
      }
    },
    {
      "name": "severity",
      "type": "enum",
      "required": true,
      "values": ["Critical", "High", "Medium", "Low"],
      "default": "Medium"
    }
  ]
}
```

**File saved**: `bug-report-variables.json` in your downloads folder.

### Importing Variables

**Step 1**: Click "Import Variables" in Template Browser

**Step 2**: Select exported JSON file

**Step 3**: Review import preview:
```
Importing 2 variables:
✓ title (string) - Valid
✓ severity (enum) - Valid

0 conflicts detected
```

**Step 4**: Choose merge strategy:
- **Replace all**: Delete existing variables, use imported
- **Merge**: Keep existing, add new, skip duplicates
- **Merge with overwrite**: Keep existing, add new, update duplicates

**Step 5**: Click "Confirm Import"

### Use Cases

**1. Template standardization across teams**:
```
Team Lead exports "user-story-variables.json"
→ Developers import into their templates
→ Ensures consistent story structure
```

**2. Template versioning**:
```
v1.0: Export baseline variables
v1.1: Add new variable
v1.2: Export updated set
→ Easy rollback if needed
```

**3. Cross-workspace reuse**:
```
Export from "Work" workspace
→ Import into "Personal" workspace
→ Adapt content, keep variable structure
```

**4. Template marketplace sharing**:
```
Create amazing template with 15 variables
→ Export to GitHub gist
→ Community imports and customizes
```

### Validation During Import

Imported variables are validated to ensure compatibility:

**Checks performed**:
- ✅ Variable names follow format rules
- ✅ No reserved keywords
- ✅ Required fields present (name, type)
- ✅ Enum types have values array
- ✅ Validation rules are valid (regex compiles, min < max)

**Invalid variables are flagged**:
```
⚠️ Skipping variable 'class': Reserved keyword
❌ Variable 'priority' missing required field 'type'
```

**Result**: Only valid variables are imported.

## Best Practices & Examples

### Complete Template Examples

#### Example 1: Bug Report Template

```json
{
  "id": "bug-report-pro",
  "name": "Professional Bug Report",
  "description": "Comprehensive bug tracking with validation",
  "category": "Development",
  "tags": ["bug", "qa", "development"],
  "version": "2.0.0",
  "difficulty": "intermediate",
  "when_to_use": "When reporting bugs that require detailed tracking and reproducible steps",
  "use_cases": [
    "Production incidents requiring root cause analysis",
    "QA testing findings with screenshots and logs",
    "User-reported bugs needing triage and prioritization"
  ],
  "estimated_time": "3-5 minutes",
  "variables": [
    {
      "name": "ticket_id",
      "type": "string",
      "required": true,
      "prompt": "Jira ticket ID (e.g., BUG-1234)",
      "validation": {
        "pattern": "^[A-Z]{2,10}-[0-9]{1,6}$"
      }
    },
    {
      "name": "title",
      "type": "string",
      "required": true,
      "prompt": "Brief, descriptive title",
      "validation": {
        "minLength": 10,
        "maxLength": 80
      }
    },
    {
      "name": "severity",
      "type": "enum",
      "required": true,
      "prompt": "Bug severity",
      "values": ["Critical", "High", "Medium", "Low"],
      "default": "Medium"
    },
    {
      "name": "environment",
      "type": "enum",
      "required": true,
      "values": ["Production", "Staging", "Development"],
      "default": "Production"
    },
    {
      "name": "affected_users",
      "type": "number",
      "required": false,
      "prompt": "Estimated number of affected users",
      "validation": {
        "min": 0
      }
    }
  ],
  "content": "---\ntags: [bug, {severity}]\nstatus: open\nticket: {ticket_id}\n---\n\n# Bug: {title}\n\n**Ticket**: {ticket_id}\n**Severity**: {severity}\n**Environment**: {environment}\n**Reported**: {date} at {time}\n**Reporter**: {user}\n**Affected Users**: {affected_users}\n\n## Description\n\n\n## Steps to Reproduce\n\n1. \n2. \n3. \n\n## Expected Behavior\n\n\n## Actual Behavior\n\n\n## Screenshots/Logs\n\n\n## Environment Details\n\n- OS: \n- Browser: \n- Version: \n\n## Root Cause\n\n\n## Solution\n\n\n## Related\n\n- [[troubleshooting-guide]]\n"
}
```

#### Example 2: Sprint Planning Template

```json
{
  "id": "sprint-planning",
  "name": "Agile Sprint Planning",
  "description": "Structured sprint planning with capacity tracking",
  "category": "Project Management",
  "tags": ["agile", "sprint", "planning"],
  "version": "1.0.0",
  "difficulty": "beginner",
  "variables": [
    {
      "name": "sprint_number",
      "type": "number",
      "required": true,
      "prompt": "Sprint number",
      "validation": {
        "min": 1
      }
    },
    {
      "name": "sprint_start",
      "type": "date",
      "required": true,
      "prompt": "Sprint start date (YYYY-MM-DD)",
      "validation": {
        "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
      }
    },
    {
      "name": "sprint_end",
      "type": "date",
      "required": true,
      "prompt": "Sprint end date (YYYY-MM-DD)",
      "validation": {
        "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
      }
    },
    {
      "name": "capacity_points",
      "type": "number",
      "required": true,
      "prompt": "Team capacity (story points)",
      "validation": {
        "min": 1,
        "max": 200
      }
    },
    {
      "name": "sprint_goal",
      "type": "string",
      "required": true,
      "prompt": "Sprint goal statement",
      "validation": {
        "minLength": 20
      }
    }
  ],
  "content": "---\ntags: [sprint, planning, sprint-{sprint_number}]\nstatus: active\n---\n\n# Sprint {sprint_number} Planning\n\n**Duration**: {sprint_start} to {sprint_end}\n**Capacity**: {capacity_points} points\n**Team**: {workspace}\n**Planned**: {date}\n\n## Sprint Goal\n\n{sprint_goal}\n\n## Committed Stories\n\n- [ ] Story 1 (points: )\n- [ ] Story 2 (points: )\n- [ ] Story 3 (points: )\n\n**Total Committed**: 0 / {capacity_points} points\n\n## Stretch Goals\n\n- [ ] \n\n## Team Availability\n\n- {user}: Available\n- \n\n## Dependencies\n\n- \n\n## Risks\n\n- \n\n## Related\n\n- [[sprint-{sprint_number}-retrospective]]\n- [[product-backlog]]\n"
}
```

#### Example 3: API Documentation Template

```json
{
  "id": "api-endpoint-doc",
  "name": "API Endpoint Documentation",
  "description": "REST API endpoint documentation with examples",
  "category": "Technical Documentation",
  "tags": ["api", "documentation", "rest"],
  "version": "1.0.0",
  "variables": [
    {
      "name": "endpoint_path",
      "type": "string",
      "required": true,
      "prompt": "API endpoint path (e.g., /api/v1/users)",
      "validation": {
        "pattern": "^/[a-z0-9/_-]+$"
      }
    },
    {
      "name": "http_method",
      "type": "enum",
      "required": true,
      "values": ["GET", "POST", "PUT", "PATCH", "DELETE"],
      "default": "GET"
    },
    {
      "name": "requires_auth",
      "type": "boolean",
      "required": true,
      "prompt": "Requires authentication?",
      "default": true
    },
    {
      "name": "version",
      "type": "string",
      "required": true,
      "prompt": "API version (e.g., 1.0.0)",
      "validation": {
        "pattern": "^\\d+\\.\\d+\\.\\d+$"
      }
    }
  ],
  "content": "---\ntags: [api, {http_method}]\nversion: {version}\n---\n\n# API: {endpoint_path}\n\n**Method**: `{http_method}`\n**Version**: {version}\n**Authentication**: {requires_auth}\n**Documented**: {date}\n\n## Description\n\n\n## Request\n\n### Headers\n\n```json\n{\n  \"Content-Type\": \"application/json\",\n  \"Authorization\": \"Bearer <token>\"\n}\n```\n\n### Parameters\n\n| Name | Type | Required | Description |\n|------|------|----------|-------------|\n|      |      |          |             |\n\n### Body Example\n\n```json\n{\n  \n}\n```\n\n## Response\n\n### Success (200 OK)\n\n```json\n{\n  \"success\": true,\n  \"data\": {\n    \n  }\n}\n```\n\n### Error (4xx/5xx)\n\n```json\n{\n  \"success\": false,\n  \"error\": {\n    \"code\": \"\",\n    \"message\": \"\"\n  }\n}\n```\n\n## Error Codes\n\n| Code | Description |\n|------|-------------|\n| 400  | Bad Request |\n| 401  | Unauthorized |\n| 404  | Not Found |\n| 500  | Server Error |\n\n## Examples\n\n### cURL\n\n```bash\ncurl -X {http_method} \\\n  https://api.example.com{endpoint_path} \\\n  -H 'Authorization: Bearer <token>' \\\n  -H 'Content-Type: application/json'\n```\n\n## Related\n\n- [[api-authentication]]\n- [[api-rate-limiting]]\n"
}
```

### Anti-Patterns to Avoid

#### Anti-Pattern 1: Overly Complex Variable Names

❌ **Bad**:
```json
{
  "name": "user_story_acceptance_criteria_description_text"
}
```

✅ **Good**:
```json
{
  "name": "acceptance_criteria"
}
```

**Why**: Long names are hard to type, read, and remember. Keep variable names concise but descriptive.

#### Anti-Pattern 2: Missing Validation

❌ **Bad**:
```json
{
  "name": "email",
  "type": "string"
}
```

✅ **Good**:
```json
{
  "name": "email",
  "type": "string",
  "validation": {
    "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
  }
}
```

**Why**: Without validation, users can enter invalid emails, causing downstream issues.

#### Anti-Pattern 3: Too Many Required Variables

❌ **Bad**:
```json
{
  "variables": [
    {"name": "title", "required": true},
    {"name": "description", "required": true},
    {"name": "author", "required": true},
    {"name": "tags", "required": true},
    {"name": "priority", "required": true},
    {"name": "category", "required": true},
    {"name": "status", "required": true},
    {"name": "assignee", "required": true}
  ]
}
```

✅ **Good**:
```json
{
  "variables": [
    {"name": "title", "required": true},
    {"name": "description", "required": true},
    {"name": "priority", "required": true, "default": "Medium"},
    {"name": "status", "required": false, "default": "Draft"},
    {"name": "assignee", "required": false, "default": "{user}"}
  ]
}
```

**Why**: Requiring 8+ inputs creates friction. Use sensible defaults for optional variables.

#### Anti-Pattern 4: Enum with Too Many Values

❌ **Bad**:
```json
{
  "name": "department",
  "type": "enum",
  "values": ["Engineering", "Marketing", "Sales", "HR", "Finance", "Legal", "Operations", "Product", "Design", "IT", "Support", "Admin"]
}
```

✅ **Good**:
```json
{
  "name": "department",
  "type": "string",
  "prompt": "Department name"
}
```

**Why**: 12+ enum options overwhelm users. Use string type with autocomplete or separate templates per department.

#### Anti-Pattern 5: No Default Values

❌ **Bad**:
```json
{
  "name": "created_by",
  "type": "string",
  "required": false
}
```

✅ **Good**:
```json
{
  "name": "created_by",
  "type": "string",
  "required": false,
  "default": "{user}"
}
```

**Why**: Providing defaults reduces user input and ensures consistency.

### Comparison Table: Good vs. Bad Templates

| Aspect | ❌ Bad Practice | ✅ Good Practice |
|--------|----------------|-----------------|
| **Variable Count** | 15+ variables | 5-8 core variables, rest optional with defaults |
| **Required Fields** | All required | 2-3 required, rest with sensible defaults |
| **Validation** | No validation | Validates format, length, ranges |
| **Naming** | `userStoryTitle` (camelCase) | `user_story_title` (snake_case) |
| **Enum Size** | 10+ options | 3-7 options |
| **Default Values** | None provided | Built-in variables or static defaults |
| **Prompts** | Generic "Enter value" | Specific "Enter Jira ticket ID (e.g., PROJ-123)" |
| **Documentation** | No `description` field | Clear `when_to_use`, `use_cases` |

## Troubleshooting FAQ

### Q: Why isn't my variable being replaced in the created note?

**A**: Three common causes:

1. **Variable not defined**: Add variable to `variables` array
2. **Typo in template**: Verify `{variablename}` matches exactly (case-sensitive after `{`)
3. **Reserved keyword**: Variable name conflicts with built-in (use different name)

**Debug steps**:
1. Open Template Browser → Select template
2. Click "Validate Variables" button
3. Check for undefined variable warning
4. Review usage analysis section

---

### Q: What's the difference between errors and warnings?

**A**:

**Errors** (red, blocking):
- Prevent note creation entirely
- Must be fixed before template can be used
- Examples: reserved keywords, circular references, invalid regex

**Warnings** (yellow, non-blocking):
- Allow note creation but indicate potential issues
- Should be reviewed but don't block workflow
- Examples: unused variables, undefined variables

**Rule of thumb**: Fix all errors immediately. Address warnings based on context.

---

### Q: Can I use variables in frontmatter?

**A**: **Yes!** Variables work in frontmatter and content:

```json
{
  "content": "---\ntags: [{category}, {priority}]\nstatus: {status}\n---\n\n# {title}\n"
}
```

**Result**:
```markdown
---
tags: [development, high]
status: in-progress
---

# Implement User Authentication
```

**Tip**: Enum variables work great in frontmatter for tags and status fields.

---

### Q: How do I validate dates in specific formats?

**A**: Use `validation.pattern` with regex:

```json
{
  "name": "deadline",
  "type": "date",
  "validation": {
    "pattern": "^\\d{4}-\\d{2}-\\d{2}$"  // YYYY-MM-DD
  }
}
```

**Common patterns**:
- ISO 8601: `^\d{4}-\d{2}-\d{2}$`
- US format: `^\d{2}/\d{2}/\d{4}$`
- European: `^\d{2}\.\d{2}\.\d{4}$`

**Test your regex**: Use [regex101.com](https://regex101.com) before adding to template.

---

### Q: Can I reference one variable in another's default value?

**A**: **Yes!** Use `{other_variable}` in default values:

```json
{
  "variables": [
    {
      "name": "project_name",
      "type": "string",
      "default": "Untitled"
    },
    {
      "name": "full_title",
      "type": "string",
      "default": "Project: {project_name}"
    }
  ]
}
```

**⚠️ Warning**: Ensure no circular references (A → B → A).

---

### Q: Why does my number validation fail with decimals?

**A**: Numbers support both integers and decimals:

```json
{
  "name": "score",
  "type": "number",
  "validation": {
    "min": 0.0,
    "max": 100.0
  }
}
```

**Valid inputs**: `0`, `42`, `99.5`, `100.0`

**Invalid**: `"42"` (string), `abc`, `1,000` (formatted numbers)

**Tip**: Users must enter raw numbers without formatting (commas, currency symbols).

---

### Q: How do I share templates with my team?

**A**: Three methods:

**Method 1: Export variables + share template JSON**
1. Export variables from Template Browser
2. Share both files via Git, SharePoint, etc.
3. Team imports variables and template JSON

**Method 2: Workspace sync**
1. Commit `.templates/` folder to Git
2. Team pulls repository
3. Templates auto-discovered

**Method 3: Template marketplace (future)**
- Publish to VS Code Marketplace
- One-click install for teams

**Recommended**: Method 2 for teams using Git.

---

### Q: What happens if I delete a variable that's used in the template?

**A**: The Template Browser will warn you:

```
⚠️ Variable 'author' is used in template but will be deleted.
Continue?
```

**If you proceed**:
- Variable definition removed
- `{author}` remains in template content as literal text
- Created notes will show `{author}` instead of user's name

**Best practice**: Check "Variable Usage" before deleting to see where it's used.

---

### Q: Can I use AI to generate variable definitions?

**A**: **Yes!** (Feature in development for v1.45.0)

**Planned workflow**:
1. Write template content with `{placeholders}`
2. Click "AI: Suggest Variables" button
3. AI analyzes content and suggests variable definitions
4. Review and accept/modify suggestions

**Example**:
- Template contains `{ticket_id}`
- AI suggests: `{"name": "ticket_id", "type": "string", "validation": {"pattern": "^[A-Z]+-[0-9]+$"}}`

**Status**: Coming soon in Phase 5 of the Enhanced Template System.

---

### Q: How do I test my template before deploying?

**A**: Use the Template Browser preview feature:

**Step 1**: Click "Preview Template" button

**Step 2**: Fill in sample values:
```
title: Test Bug Report
severity: High
description: This is a test description
```

**Step 3**: Review generated note preview

**Step 4**: Click "Create Test Note" to create in temporary location

**Step 5**: Verify all variables replaced correctly

**Tip**: Test with edge cases (empty values, max length, special characters).

---

## Related Features

- [Templates System](/noted/posts/templates/) - Basic template overview and built-in templates
- [Bundles](/noted/posts/bundles/) - Multi-note workflow bundles using shared variables
- [Tags](/noted/posts/tags/) - Organize templates with tags for discoverability
- [Smart Collections](/noted/posts/smart-collections/) - Filter notes created from specific templates

---

**Ready to create production-grade templates?** Open the Template Browser and start building! 🚀

**Need help?** Check the [GitHub Discussions](https://github.com/jsonify/noted/discussions) or file an [issue](https://github.com/jsonify/noted/issues).
