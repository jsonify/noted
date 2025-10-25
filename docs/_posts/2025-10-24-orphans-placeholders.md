---
title: Orphans & Placeholders
date: 2025-10-24 16:00:00 -0800
categories: [Features, Organization]
tags: [orphans, placeholders, links, broken-links]
---

# What are Orphans and Placeholders?

Maintain a healthy knowledge base by identifying disconnected notes and tracking broken links before they become a problem.

## Orphans Panel

The Orphans panel automatically detects notes that lack connections to other parts of your knowledge base.

### Types of Orphans

#### Isolated Notes
Notes with **no incoming or outgoing links** - completely disconnected from your knowledge network.

```markdown
# My Isolated Note

This note has no [[wiki-links]] and nothing links to it.
```

#### Source-Only Notes
Notes that **link to other notes but have no backlinks** - they reference others but aren't referenced.

```markdown
# My Source Note

I reference [[project-alpha]] and [[meeting-notes]]
but no other notes link back to me.
```

#### Sink-Only Notes
Notes that **have backlinks but no outgoing links** - they're referenced but don't reference others.

```markdown
# My Sink Note

Other notes link to me, but I don't link to anyone else.
```

### Using the Orphans Panel

1. **View Orphans**: Open the Orphans panel in the sidebar
2. **Explore Categories**: Expand sections to see orphans by type
3. **Click to Open**: Click any orphan note to open and start connecting
4. **Refresh**: Use the refresh button to update after creating links

> The Orphans panel updates automatically as you create and remove links
{: .prompt-tip }

## Placeholders Panel

The Placeholders panel tracks all broken wiki-style links - links to notes that don't exist yet.

### What are Placeholders?

Placeholders are wiki-style links like `[[future-note]]` where the target note hasn't been created yet.

```markdown
# My Note

I want to write about [[machine-learning-basics]]
and [[python-best-practices]] someday.
```

In this example, if those notes don't exist, they appear as placeholders in the panel.

### Features

#### Grouped by Target
All references to the same missing note are grouped together:

```
📝 machine-learning-basics (3 references)
  ├─ project-notes.md:15
  ├─ research-ideas.md:8
  └─ todo-list.md:42
```

#### Context Snippets
Each placeholder reference shows surrounding text to understand the context:

```markdown
meeting-notes.md:23
"...discussed implementation of [[authentication-flow]] for the new..."
```

#### One-Click Note Creation
Click "Create Note" to instantly create the missing note:

1. Click the create icon next to any placeholder
2. New note is created in the current month's folder
3. Note opens automatically for editing
4. Backlinks index updates to include the new note

#### Navigate to Source
Click any placeholder reference to jump to the exact location where the link appears.

### Using the Placeholders Panel

1. **View Placeholders**: Open the Placeholders panel in the sidebar
2. **Review References**: See all locations referencing each placeholder
3. **Create Notes**: Click create icon to turn placeholders into real notes
4. **Jump to Source**: Click references to see the link in context
5. **Refresh**: Use refresh button to update after creating notes

> Creating a note from a placeholder automatically updates all links and removes it from the panel
{: .prompt-tip }

## Workflow Examples

### Cleaning Up Orphans

Start with isolated notes and add connections:

```markdown
# Orphan Note

<!-- Before -->
This is a standalone note.

<!-- After -->
Related: [[project-alpha]], [[research-findings]]
See also: [[meeting-2024-10-20#action-items]]
```

### Planning with Placeholders

Create placeholder links as you brainstorm, then fill them in later:

```markdown
# Project Roadmap

## Phase 1
- [[setup-development-environment]]
- [[initial-architecture-design]]

## Phase 2
- [[implement-authentication]]
- [[build-core-features]]

## Phase 3
- [[testing-strategy]]
- [[deployment-plan]]
```

Use the Placeholders panel to track which notes you still need to create.

### Building Connected Knowledge

Combine both features:

1. **Check Orphans**: Find notes that should be connected
2. **Add Links**: Create wiki-style links to connect notes
3. **Create Missing**: Use Placeholders panel to create referenced notes
4. **Verify**: Refresh both panels to see your knowledge base become more connected

## Benefits

### Knowledge Base Health
- **Discover Gaps**: Find areas that need more connections
- **Reduce Isolation**: Ensure all notes contribute to the knowledge network
- **Track Progress**: See your knowledge base grow more interconnected

### Content Planning
- **Brainstorm Freely**: Link to future notes without breaking your flow
- **Track TODOs**: Placeholders serve as a content creation todo list
- **Prioritize**: See which missing notes are referenced most often

### Quality Assurance
- **No Broken Links**: Catch broken links before they accumulate
- **Consistent References**: Ensure all references have corresponding notes
- **Clean Knowledge Graph**: Maintain a well-connected graph visualization

## Commands

Both panels support these commands:

- **Refresh Orphans** (`noted.refreshOrphans`) - Rebuild orphans detection
- **Refresh Placeholders** (`noted.refreshPlaceholders`) - Rebuild placeholder tracking
- **Create Note from Placeholder** - Create missing note from placeholder link
- **Open Placeholder Source** - Navigate to where placeholder is referenced

## Best Practices

1. **Regular Review**: Check orphans weekly to maintain connections
2. **Strategic Placeholders**: Create placeholder links as you think of topics
3. **Batch Creation**: Use placeholders panel to create missing notes in batches
4. **Link Isolated Notes**: Add at least 2-3 links to orphaned notes
5. **Context First**: Before creating from placeholder, review all references to understand context

## Integration

The Orphans & Placeholders features integrate seamlessly with:

- **[Graph View](/noted/posts/graph/)** - Visualize orphans in your knowledge network
- **[Wiki-Style Links](/noted/posts/wiki-links/)** - The foundation for orphan and placeholder detection
- **[Connections Panel](/noted/posts/connections/)** - See detailed link information
- **[Search](/noted/posts/search/)** - Find and connect related content

---

Keep your knowledge base healthy and connected! 🔗
