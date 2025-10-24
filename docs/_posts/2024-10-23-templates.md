---
title: Templates System
date: 2024-10-23 10:00:00 -0800
categories: [Features, Templates]
tags: [templates, automation, productivity]
---

# Templates System

Create structured notes quickly with built-in and custom templates featuring dynamic variables.

## Quick Start

1. Open Command Palette (`Cmd+Shift+P`)
2. Run "Noted: Open with Template"
3. Enter note name
4. Select template
5. Start writing!

## Built-in Templates

### Meeting Template

```markdown
# Meeting: {filename}
**Date**: {date}
**Time**: {time}

## Attendees
-

## Agenda
1.

## Notes


## Action Items
- [ ]

## Next Steps

```

### Research Template

```markdown
# Research: {filename}
**Date**: {date}
**Researcher**: {user}

## Topic


## Questions
-

## Findings


## Sources
-

## Conclusions

```

### Problem-Solution Template

```markdown
# Problem: {filename}
**Date**: {date}

## Problem Statement


## Steps Taken
1.

## Solution


## Notes

```

### Quick Template

```markdown
# {filename}
**Date**: {date}
**Time**: {time}

```

## Template Variables

Templates support 10 dynamic placeholders:

| Variable | Example Output | Description |
|----------|---------------|-------------|
| `{filename}` | `project-meeting` | Note file name |
| `{date}` | `Sunday, October 23, 2024` | Full date |
| `{time}` | `2:30 PM` | 12-hour time |
| `{year}` | `2024` | Year |
| `{month}` | `10` | Month (with leading zero) |
| `{day}` | `23` | Day (with leading zero) |
| `{weekday}` | `Sun` | Short day name |
| `{month_name}` | `October` | Full month name |
| `{user}` | `john` | System username |
| `{workspace}` | `my-project` | VS Code workspace name |

## Custom Templates

### Creating Custom Templates

1. Open Command Palette
2. Run "Noted: Create Custom Template"
3. Enter template name
4. Edit the template file
5. Use any variables from the table above

Example custom template:

```markdown
# Daily Standup - {date}
**Team Member**: {user}
**Project**: {workspace}

## Yesterday
-

## Today
-

## Blockers
-

---
Tags: #standup #team
```

### Managing Templates

**Edit Template**:
```
Command: Noted: Edit Custom Template
```

**Duplicate Template**:
```
Command: Noted: Duplicate Custom Template
```

**Delete Template**:
```
Command: Noted: Delete Custom Template
```

**Open Templates Folder**:
```
Command: Noted: Open Templates Folder
Location: {notesFolder}/.templates/
```

### Preview Variables

See all available variables and their current values:

```
Command: Noted: Preview Template Variables
```

This shows a webview with all 10 variables and example output.

## Use Cases

### Daily Standups

Create a consistent format for team updates:

```markdown
# Standup - {date}
**Team**: {workspace}

## Completed
- Finished [[feature-authentication]]
- Fixed [[bug-123]]

## In Progress
- Working on [[api-refactor]]

## Planned
- Start [[database-migration]]

## Blockers
None

Tags: #standup
```

### Bug Reports

Standardize bug documentation:

```markdown
# Bug: {filename}
**Reported**: {date} at {time}
**Reporter**: {user}

## Description


## Steps to Reproduce
1.
2.
3.

## Expected Behavior


## Actual Behavior


## Environment
- OS:
- Version:
- Browser:

## Solution


Tags: #bug
```

### Project Planning

Structure project documents:

```markdown
# Project: {filename}
**Created**: {date}
**Owner**: {user}
**Workspace**: {workspace}

## Overview


## Goals
-

## Timeline
- **Start**: {year}-{month}-{day}
- **End**:

## Resources
-

## Related Notes
- [[team-structure]]
- [[requirements]]

Tags: #project #planning
```

## Best Practices

1. **Use Variables**: Leverage dynamic variables for consistency
2. **Include Tags**: Add relevant tags in templates
3. **Add Links**: Include common note links
4. **Structure Matters**: Use clear headings and sections
5. **Keep It Simple**: Don't over-complicate templates

## Tips & Tricks

### Checklists

Use markdown checkboxes for action items:

```markdown
## Tasks
- [ ] Review code
- [ ] Update docs
- [ ] Run tests
```

### Metadata Section

Add frontmatter for advanced features:

```markdown
---
tags: [meeting, project-alpha]
status: active
priority: high
---

# Meeting Notes
```

### Code Blocks

Include language-specific code blocks:

````markdown
## Implementation

```javascript
function example() {
  // code here
}
```
````

## Related Features

- [Daily Notes](/noted/posts/daily-notes/) - Quick daily note access
- [Tags](/noted/posts/tags/) - Organize with tags
- [Wiki Links](/noted/posts/wiki-links/) - Connect notes

---

Start using templates to standardize your note-taking workflow! 📋
