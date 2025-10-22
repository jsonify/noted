---
layout: default
title: Wiki-Style Links
---

# Wiki-Style Links

Connect your notes together to build a personal knowledge base with wiki-style linking and automatic backlinks.

## Overview

Wiki-style links allow you to create connections between notes using a simple `[[note-name]]` syntax. This creates a web of knowledge where related information is always just a click away.

## Creating Links

### Basic Link Syntax

Link to another note by wrapping its name in double brackets:

```
Working on authentication today.
See also: [[user-authentication-spec]]
Related: [[api-design]] and [[security-considerations]]
```

### Link with Display Text (v1.13.5)

Use custom display text while linking to a note:

```
Check out [[meeting-2025-10-19|yesterday's meeting notes]] for context.
Review the [[api-docs|API documentation]] before starting.
```

Syntax: `[[note-name|Custom Display Text]]`

### Path-Based Disambiguation (v1.14.0)

When you have multiple notes with the same name, use paths to specify which one:

```
Today's meeting: [[work/meeting]]
Yesterday's meeting: [[2025/10-October/meeting]]
Project kickoff: [[projects/alpha/meeting]]
```

**Supported path formats:**
- Full path: `[[2025/10-October/meeting]]`
- Partial path: `[[work/meeting]]`
- Custom folders: `[[projects/alpha/notes]]`
- Both `/` and `\` separators work

## Link Autocomplete (v1.14.0)

Type `[[` to trigger intelligent autocomplete:

- Shows all available notes with their paths
- Highlights duplicate names that need disambiguation
- Suggests both simple names and full paths
- Type `/` within `[[` to complete folder paths
- Navigate with arrow keys, select with Enter/Tab

**Example:**

```
[[meet<cursor>
  → Shows: meeting (multiple matches!)
  → Shows: work/meeting
  → Shows: 2025/10-October/meeting
```

## Link Diagnostics (v1.14.0)

Real-time warnings and quick fixes help you maintain link integrity:

### Ambiguous Link Warnings

Yellow warning when multiple notes match:

```
[[meeting]]  ⚠️ Ambiguous link - multiple matches found
```

**Quick fix:** Click to automatically convert to full-path link

### Broken Link Errors

Red error when link target doesn't exist:

```
[[non-existent-note]]  ❌ Link target not found
```

### Related Information

Hover over ambiguous links to see all matching notes with their paths.

## Backlinks System

### Viewing Backlinks

Hover over any note's header (first line) to see all notes that link to it:

```
Meeting Notes - 2025-10-19
==================================================
```

**Backlinks panel shows:**
- Source note name
- Context (surrounding text)
- Click to navigate to linking note

### Rebuilding Backlinks Index

If backlinks seem out of date:

1. Open Command Palette (`Cmd+Shift+P`)
2. Run "Noted: Rebuild Backlinks Index"
3. Index rebuilds automatically in background

## Extract Selection to Note (v1.14.1)

Create new notes from selected text with automatic linking:

### How to Extract

1. **Select text** in any note
2. **Right-click** and choose "Extract Selection to New Note"
3. **Enter note name** when prompted
4. **New note opens** in split view

### What Happens

- Selected text is replaced with `[[note-name]]` link
- New note contains extracted text
- Metadata added: source file, extraction timestamp
- Opens side-by-side for easy reference

**Example:**

Before:
```
I need to research WebAuthn for passwordless authentication.
This will require studying the W3C spec and browser support.
```

After extraction (selecting the second sentence):
```
I need to research WebAuthn for passwordless authentication.
[[webauthn-browser-support]]
```

New note `webauthn-browser-support.txt`:
```
2025-10-21
==================================================

Extracted from: [[meeting-notes-2025-10-19]]
Extracted on: Sunday, October 21, 2025 at 2:30 PM

---

This will require studying the W3C spec and browser support.
```

## Rename Symbol (v1.14.2)

Refactor links across your entire workspace:

### How to Rename

1. **Open Command Palette** (`Cmd+Shift+P`)
2. **Run** "Noted: Rename Symbol (Refactor Links)"
3. **Select note** to rename
4. **Enter new name**
5. **Preview affected files**
6. **Confirm** to update all links

### What Gets Updated

- All `[[old-name]]` → `[[new-name]]`
- All `[[old-name|Display]]` → `[[new-name|Display]]`
- Display text is preserved
- Backlinks index automatically rebuilds

## Automatic Link Synchronization (v1.13.5)

When you rename or move notes, all links automatically update:

### Supported Operations

- **Rename Note**: All links update to new name
- **Move Note**: Path-based links update to new location
- **Works across workspace**: Updates all notes, not just open ones

### Example

Rename `api-design` to `api-architecture`:

**Before:**
```
// note1.txt
See [[api-design]] for details

// note2.txt
Related to [[api-design|our API design]]
```

**After:**
```
// note1.txt
See [[api-architecture]] for details

// note2.txt
Related to [[api-architecture|our API design]]
```

## Link Resolution

Noted uses intelligent link resolution:

1. **Exact match**: Looks for exact note name first
2. **Partial match**: Tries matching with file extension
3. **Fuzzy match**: Searches for similar names
4. **Path-based**: Matches folder structure when paths included

## Best Practices

### When to Use Simple Links

Use `[[note-name]]` when:
- Note name is unique across workspace
- Quick linking without ambiguity
- You don't have duplicate names

### When to Use Path-Based Links

Use `[[folder/note-name]]` when:
- Multiple notes share the same name
- Organizing by project or category
- Clarity is important for future reference

### When to Use Display Text

Use `[[note-name|Display Text]]` when:
- Link text needs to read naturally in a sentence
- Note name is technical but context needs plain language
- Creating user-friendly references

### Organizing Your Notes

**By Project:**
```
projects/
  alpha/
    meeting.txt
    design.txt
  beta/
    meeting.txt
    specs.txt
```

Link as `[[alpha/meeting]]` and `[[beta/meeting]]`

**By Date:**
```
2025/
  10-October/
    meeting.txt
  11-November/
    meeting.txt
```

Link as `[[2025/10-October/meeting]]`

## Tips & Tricks

### Quick Navigation

- Click any link to open target note
- Use `Cmd+Click` (Mac) or `Ctrl+Click` (Windows/Linux) to open in split view

### Finding Connections

- Use Graph View to visualize all link connections
- Check backlinks to see incoming references
- Search for `[[` to find all links in a note

### Maintaining Link Integrity

- Use autocomplete to avoid typos
- Let diagnostics catch broken links
- Use Rename Symbol instead of manual renaming
- Review Graph View to find orphaned notes

### Building Knowledge

- Link liberally - connections reveal patterns
- Use bidirectional links (link back to create a web)
- Extract frequently referenced sections to separate notes
- Tag linked notes for additional organization

---

[← Back to Features]({{ '/features/' | relative_url }}) | [Next: Tags →]({{ '/features/tags' | relative_url }})
