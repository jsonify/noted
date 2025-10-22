---
layout: default
title: Templates
---

# Templates

Create structured, consistent notes with built-in templates or design your own custom templates with dynamic variables.

## Overview

Templates provide a starting structure for your notes, saving time and ensuring consistency across your documentation. Noted supports both built-in templates and unlimited custom templates with powerful variable substitution.

## Built-in Templates

Noted includes 4 ready-to-use templates:

### Problem/Solution

For troubleshooting and bug tracking:

```
{date}
==================================================

PROBLEM:


STEPS TAKEN:
1.

SOLUTION:


NOTES:
```

**Use for:** Bug fixes, troubleshooting, technical issues

### Meeting

For structured meeting notes:

```
{date}
==================================================

MEETING:

ATTENDEES:
-

AGENDA:
1.

NOTES:


ACTION ITEMS:
- [ ]

NEXT MEETING:
```

**Use for:** Team meetings, client calls, planning sessions

### Research

For organized research and learning:

```
{date}
==================================================

TOPIC:

QUESTIONS:
-

FINDINGS:


SOURCES:
-

NEXT STEPS:
```

**Use for:** Technical research, learning notes, investigation

### Quick

For simple dated notes:

```
{date}
==================================================


```

**Use for:** Quick thoughts, daily logs, simple notes

## Using Built-in Templates

### From Templates View

1. Open **Templates** panel in sidebar
2. Click desired template name
3. Enter note name when prompted
4. Note is created with template structure

### From Command Palette

1. Open Command Palette (`Cmd+Shift+P`)
2. Run "Noted: Open with Template"
3. Select template
4. Enter note name

### Quick Links in Welcome View

Click template quick links in Templates welcome view:
- Problem/Solution
- Meeting
- Research
- Quick

## Custom Templates

Create personalized templates for your unique workflows.

### Creating Custom Templates

1. Open **Templates** panel
2. Click **"Create New Template"** button
3. Enter template name (e.g., "daily-standup")
4. Template file opens in editor
5. Add your structure and variables
6. Save the file

Templates are stored in `{notesPath}/.templates/` folder.

### Template Variables

All templates support 10 dynamic placeholders that automatically populate with contextual information:

#### Basic Information

- `{filename}` - The note file name
- `{date}` - Full date (e.g., "Sunday, October 19, 2025")
- `{time}` - Current time (e.g., "2:30 PM")

#### Date Components

- `{year}` - Year (e.g., "2025")
- `{month}` - Month with leading zero (e.g., "10")
- `{day}` - Day with leading zero (e.g., "19")
- `{weekday}` - Short day name (e.g., "Sun")
- `{month_name}` - Full month name (e.g., "October")

#### Context

- `{user}` - System username
- `{workspace}` - VS Code workspace name

### Example Custom Templates

#### Daily Standup

```
File: {filename}
Date: {date}
Author: {user}
==================================================

## What I did yesterday:
-

## What I'm doing today:
-

## Blockers:
- None

#standup #team
```

#### Project Notes

```
Project: {workspace}
Created: {date} at {time}
==================================================

## Objective:


## Progress ({weekday}, {month_name} {day}):


## Next Steps:
-

#project #{workspace}
```

#### Weekly Review

```
Weekly Review - Week of {month_name} {day}, {year}
By: {user}
==================================================

## Accomplishments:
-

## Challenges:
-

## Goals for Next Week:
-

#weekly-review #reflection
```

#### Bug Report

```
Bug Report - {date}
Reported by: {user}
Project: {workspace}
==================================================

## Description:


## Steps to Reproduce:
1.

## Expected Behavior:


## Actual Behavior:


## Environment:
-

## Status:
[ ] Open

#bug #{workspace}
```

## Managing Templates

### Edit Template

Update existing custom templates:

1. Click **"Edit Template"** in Templates panel
2. Select template to modify
3. Make changes in editor
4. Save file

### Delete Template

Remove custom templates:

1. Click **"Delete Template"** in Templates panel
2. Select template to delete
3. Confirm deletion

**Note:** Built-in templates cannot be deleted.

### Duplicate Template

Copy existing template as a starting point:

1. Click **"Duplicate Template"** in Templates panel
2. Select template to copy
3. Enter new template name
4. Customize duplicated template

### Open Templates Folder

Access templates directory directly:

1. Click **"Open Templates Folder"** in Templates panel
2. System file explorer opens to `.templates/` folder
3. Manage templates as regular files

## Template Variables Reference

View all available variables with descriptions:

1. Click **"Template Variables Reference"** in Templates panel
2. Webview opens showing all 10 variables
3. Examples and descriptions for each variable

Or run: "Noted: Template Variables Reference" from Command Palette

## Template Best Practices

### Variable Usage

**Use `{date}` for headers:**
```
{date}
==================================================
```

**Use date components for custom formats:**
```
## {weekday}, {month_name} {day}, {year}
```

**Use `{user}` for attribution:**
```
Created by: {user}
```

**Use `{workspace}` for project context:**
```
Project: {workspace}
Tag: #{workspace}
```

### Template Structure

**Clear sections:**
```
## Section Title


## Another Section

```

**Use consistent formatting:**
- Headers with `##`
- Lists with `-` or `1.`
- Checkboxes with `- [ ]`
- Separators with `---`

**Include tags:**
```
#template-name #project
```

### Template Organization

**Name templates descriptively:**
- `daily-standup` not `standup`
- `client-meeting` not `meeting2`
- `bug-report` not `bug`

**Create templates for repeated workflows:**
- Daily routines
- Meeting types
- Report formats
- Project structures

**Keep templates focused:**
- One purpose per template
- Not too complex
- Easy to fill in

## Advanced Template Techniques

### Nested Sections

```
## {date} - Daily Log

### Morning
Tasks:
-

### Afternoon
Tasks:
-

### Evening
Notes:
-
```

### Conditional Sections

Use placeholders for optional sections:

```
## Meeting Notes - {date}

Attendees: [FILL IN]
Project: {workspace}

## Discussion
[NOTES HERE]

## Action Items
- [ ] [ASSIGNEE] - [TASK]

## Follow-up
Next meeting: [DATE]
```

### Combined Variables

```
# {workspace} - {weekday} Update
*{month_name} {day}, {year} at {time}*
By {user}

---

Content here
```

### Templates with Links

```
# Research: [TOPIC]
Date: {date}

## Related Notes
- [[background-research]]
- [[project-requirements]]

## Findings


## Next Steps
- [ ] [[follow-up-note]]
```

## Tips & Tricks

### Quick Template Creation

1. Create a regular note with desired structure
2. Duplicate as template
3. Replace specific values with variables
4. Save in `.templates/` folder

### Testing Templates

1. Create template
2. Use "Open with Template"
3. Check variable substitution
4. Iterate and refine

### Sharing Templates

Templates are just text files! Share them:
- Commit `.templates/` folder to git
- Share individual template files
- Create a template repository

### Template Shortcuts

Create keyboard shortcuts for frequently used templates:

1. Open Keyboard Shortcuts (`Cmd+K Cmd+S`)
2. Search for "Noted: Open with Template"
3. Add custom keybinding
4. Pass template name as argument

---

[← Back: Tags]({{ '/features/tags' | relative_url }}) | [Next: Search & Discovery →]({{ '/features/search' | relative_url }})
