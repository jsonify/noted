# Multi-Note Workflow Bundles Guide

Create multiple related notes at once with automatic links between them.

## Overview

**Bundles** let you create entire workflows of connected notes in one step. Instead of manually creating multiple notes and linking them together, bundles automate the process - perfect for recurring workflows like video tutorials, project planning, or research papers.

## Quick Start

### 1. Use a Built-in Bundle

The fastest way to get started:

1. Open Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
2. Run: **`Noted: Create Notes from Bundle`**
3. Select a bundle:
   - **Video Tutorial Workflow** - Script + guide + resources
   - **Project Planning Workflow** - Overview + tasks + meetings + resources
4. Answer the prompts to fill in variables (e.g., project name, topic, dates)
5. Press Enter - all notes are created and linked automatically!

**Example: Video Tutorial Workflow**

You'll be asked:
- **Tutorial topic**: `"VS Code Extensions"`
- **Duration (minutes)**: `15`
- **Audience level**: `beginner` / `intermediate` / `advanced`

This creates 3 notes:
```
Tutorials/
├── Scripts/
│   └── VS-Code-Extensions-script.txt
├── Guides/
│   └── VS-Code-Extensions-guide.txt  [[links to script]]
└── Resources/
    └── VS-Code-Extensions-resources.txt  [[links to both]]
```

Each note automatically includes wiki-links to related notes in a "Related Notes" section!

### 2. Try It Right Now

**Step-by-step example:**

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type: `bundle` and select **"Noted: Create Notes from Bundle"**
3. Choose: **"Project Planning Workflow"**
4. Enter when prompted:
   - Project name: `"New Website"`
   - Start date: `2025-01-15`
   - Priority: `high`
5. Watch as 4 notes are created:
   - `Projects/New-Website/New-Website-overview.txt`
   - `Projects/New-Website/New-Website-tasks.txt` ← links to overview
   - `Projects/New-Website/New-Website-meetings.txt` ← links to overview and tasks
   - `Projects/New-Website/New-Website-resources.txt` ← links to overview

The first note opens automatically so you can start working!

## What Are Bundles?

Think of bundles as **templates for creating multiple notes at once**:

- **Single template** = One note
- **Bundle** = Multiple related notes with automatic connections

### When to Use Bundles

✅ **Perfect for:**
- Recurring workflows (video tutorials, blog posts, research)
- Project kickoffs (overview + tasks + meetings)
- Related note sets (book notes: summary + quotes + review)
- Multi-part documentation (guide + examples + references)

❌ **Not needed for:**
- Single standalone notes (use regular templates)
- One-off notes without connections

## Understanding Variables

Bundles use **variables** to customize notes. When you create a bundle, you'll be asked for values:

### Variable Types

1. **String** - Text input
   - Example: `project_name` → `"My New App"`
   - Used for: Names, titles, descriptions

2. **Number** - Numeric input
   - Example: `duration` → `15`
   - Used for: Durations, quantities, IDs

3. **Date** - Date picker (YYYY-MM-DD)
   - Example: `start_date` → `2025-01-15`
   - Used for: Deadlines, milestones, schedules

4. **Enum** - Multiple choice
   - Example: `priority` → `low` / `medium` / `high` / `critical`
   - Used for: Categories, statuses, levels

5. **Boolean** - Yes/No choice
   - Example: `include_tests` → `Yes` / `No`
   - Used for: Feature flags, optional sections

### How Variables Work

Variables use `{variable_name}` syntax and work in:

- **Note names**: `{topic}-guide.txt` → `VS-Code-Extensions-guide.txt`
- **Folder paths**: `Projects/{project_name}/` → `Projects/My-App/`
- **Note content**: `# {topic} Tutorial` → `# VS Code Extensions Tutorial`
- **Links**: `[[{topic}-script]]` → `[[VS-Code-Extensions-script]]`

## Creating Your Own Bundles

### Method 1: From Existing Templates (Easiest)

If you already have custom templates:

1. Run: **`Noted: Create Bundle from Templates`**
2. Select 2+ templates to include
3. Enter bundle name: `"blog-post-workflow"`
4. Enter description: `"Draft + images + publish checklist"`
5. Bundle is saved! You can now edit it to add variables and links

### Method 2: From Scratch (Most Flexible)

1. Create a file: `.noted-templates/bundles/my-workflow.bundle.json`
2. Use this structure:

```json
{
  "id": "my-workflow",
  "name": "My Custom Workflow",
  "description": "What this bundle creates",
  "version": "1.0.0",

  "variables": [
    {
      "name": "title",
      "type": "string",
      "required": true,
      "prompt": "What's the title?",
      "description": "Main title for all notes"
    }
  ],

  "notes": [
    {
      "name": "{title}-main",
      "template": "quick",
      "folder": "MyNotes",
      "description": "Main note"
    },
    {
      "name": "{title}-tasks",
      "template": "quick",
      "folder": "MyNotes",
      "description": "Task list",
      "links": ["{title}-main"]
    }
  ],

  "post_create": {
    "open_notes": ["{title}-main"],
    "message": "Workflow '{title}' created!"
  }
}
```

3. Save the file
4. Run: **`Noted: Create Notes from Bundle`** to use it

## Managing Bundles

### Edit a Bundle

1. Run: **`Noted: Edit Bundle`**
2. Select the bundle to edit
3. Modify the JSON file:
   - Add/remove variables
   - Change note names or folders
   - Update links between notes
   - Adjust templates used
4. Save and close

### Delete a Bundle

1. Run: **`Noted: Delete Bundle`**
2. Select the bundle
3. Confirm deletion

## Advanced Bundle Features

### Automatic Linking

Bundles create wiki-style links automatically:

```json
{
  "notes": [
    {
      "name": "main-note",
      "template": "quick",
      "folder": "Notes"
    },
    {
      "name": "related-note",
      "template": "quick",
      "folder": "Notes",
      "links": ["main-note"]  ← Creates [[main-note]] link
    }
  ]
}
```

The "Related Notes" section is added automatically:

```
## Related Notes

- [[main-note]]
```

### Post-Creation Actions

Control what happens after bundle creation:

```json
{
  "post_create": {
    "open_notes": ["main-note", "tasks"],  ← Opens these notes
    "message": "Project '{name}' is ready!" ← Custom success message
  }
}
```

### Variable Defaults

Provide sensible defaults:

```json
{
  "variables": [
    {
      "name": "priority",
      "type": "enum",
      "values": ["low", "medium", "high"],
      "default": "medium"  ← Pre-selected
    }
  ]
}
```

### Required vs Optional Variables

```json
{
  "variables": [
    {
      "name": "title",
      "type": "string",
      "required": true  ← Must provide value
    },
    {
      "name": "author",
      "type": "string",
      "required": false,  ← Can skip
      "default": "Anonymous"
    }
  ]
}
```

## Example Bundles

### Research Paper Workflow

```json
{
  "id": "research-paper",
  "name": "Research Paper Workflow",
  "description": "Outline + notes + bibliography + drafts",
  "version": "1.0.0",

  "variables": [
    {
      "name": "paper_title",
      "type": "string",
      "required": true,
      "prompt": "Paper title"
    },
    {
      "name": "deadline",
      "type": "date",
      "required": true,
      "prompt": "Submission deadline (YYYY-MM-DD)"
    }
  ],

  "notes": [
    {
      "name": "{paper_title}-outline",
      "template": "research",
      "folder": "Research/{paper_title}",
      "description": "Paper structure and key points"
    },
    {
      "name": "{paper_title}-literature",
      "template": "quick",
      "folder": "Research/{paper_title}",
      "description": "Literature review and sources",
      "links": ["{paper_title}-outline"]
    },
    {
      "name": "{paper_title}-bibliography",
      "template": "quick",
      "folder": "Research/{paper_title}",
      "description": "Citations and references",
      "links": ["{paper_title}-literature"]
    },
    {
      "name": "{paper_title}-draft",
      "template": "quick",
      "folder": "Research/{paper_title}",
      "description": "Writing draft",
      "links": ["{paper_title}-outline", "{paper_title}-literature"]
    }
  ],

  "post_create": {
    "open_notes": ["{paper_title}-outline"],
    "message": "Research workflow ready! Deadline: {deadline}"
  }
}
```

### Meeting Series Workflow

```json
{
  "id": "meeting-series",
  "name": "Meeting Series",
  "description": "Recurring meeting with agenda + notes + action items",
  "version": "1.0.0",

  "variables": [
    {
      "name": "meeting_name",
      "type": "string",
      "required": true,
      "prompt": "Meeting name (e.g., 'Weekly Standup')"
    },
    {
      "name": "frequency",
      "type": "enum",
      "values": ["daily", "weekly", "biweekly", "monthly"],
      "default": "weekly",
      "prompt": "Meeting frequency"
    }
  ],

  "notes": [
    {
      "name": "{meeting_name}-template",
      "template": "meeting",
      "folder": "Meetings/{meeting_name}",
      "description": "Reusable meeting template"
    },
    {
      "name": "{meeting_name}-action-items",
      "template": "quick",
      "folder": "Meetings/{meeting_name}",
      "description": "Ongoing action items tracker",
      "links": ["{meeting_name}-template"]
    },
    {
      "name": "{meeting_name}-decisions",
      "template": "quick",
      "folder": "Meetings/{meeting_name}",
      "description": "Key decisions log",
      "links": ["{meeting_name}-template"]
    }
  ],

  "post_create": {
    "open_notes": ["{meeting_name}-template"],
    "message": "{frequency} meeting '{meeting_name}' set up!"
  }
}
```

## Tips & Best Practices

### Bundle Design

✅ **Do:**
- Keep bundles focused (3-5 notes max)
- Use descriptive variable names
- Provide helpful prompt text
- Set sensible defaults
- Link related notes together

❌ **Avoid:**
- Too many variables (keeps it simple)
- Complex folder structures (flat is better)
- Circular links (A→B, B→A)

### Naming Conventions

Use clear, consistent patterns:
- `{topic}-main` / `{topic}-tasks` / `{topic}-notes`
- `{project}-overview` / `{project}-meetings` / `{project}-resources`
- `{title}-draft` / `{title}-review` / `{title}-final`

### Templates vs Bundles

- **Use templates** when you need ONE customized note
- **Use bundles** when you need MULTIPLE connected notes

### Folder Organization

Bundles can create folder hierarchies:
- `Projects/{project_name}/` - One folder per project
- `Tutorials/{category}/{topic}/` - Organized by category
- `Research/{year}/{paper_title}/` - Organized by year

## Configuration

### Settings

- `noted.templates.enableBundles` - Enable/disable bundle features (default: `true`)

### Disable Bundles

If you don't use bundles:

1. Open Settings (`Cmd+,` or `Ctrl+,`)
2. Search: `noted.templates.enableBundles`
3. Uncheck to disable

## Troubleshooting

### Bundle Not Appearing

**Problem**: Created a bundle but don't see it in the picker

**Solution**:
1. Check file location: `.noted-templates/bundles/your-bundle.bundle.json`
2. Verify JSON is valid (use a JSON validator)
3. Ensure `"id"` field matches filename (without `.bundle.json`)
4. Reload VS Code window

### Variables Not Replacing

**Problem**: Note contains `{variable}` instead of actual value

**Solution**:
1. Check variable name matches exactly (case-sensitive)
2. Ensure you provided a value when prompted
3. Check `"required": true` for mandatory variables

### Notes Not Linking

**Problem**: "Related Notes" section not created

**Solution**:
1. Check `"links"` array in bundle JSON
2. Verify linked note names match exactly
3. Ensure linked notes exist in bundle

### Folders Not Created

**Problem**: Notes go to wrong location

**Solution**:
1. Check `"folder"` field in each note
2. Verify path doesn't start with `/` (relative paths)
3. Check variable replacement in folder names

## Commands Reference

All bundle commands:

- **`Noted: Create Notes from Bundle`** - Use existing bundle
- **`Noted: Create Bundle from Templates`** - Build custom bundle
- **`Noted: Edit Bundle`** - Modify bundle definition
- **`Noted: Delete Bundle`** - Remove bundle

## Getting Help

- Check [TEMPLATE_IMPLEMENTATION_PLAN.md](../TEMPLATE_IMPLEMENTATION_PLAN.md) for technical details
- Review example bundles in `.noted-templates/bundles/`
- Ask questions in GitHub Issues

## What's Next

Future enhancements planned:
- **Phase 3**: Enhanced metadata, template migration
- **Phase 4**: Visual bundle browser with search and filtering

---

**Happy bundling! 🎁** Create once, use forever.
