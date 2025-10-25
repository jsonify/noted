---
title: Wiki-Style Links
date: 2025-10-24 11:00:00 -0800
categories: [Features, Linking]
tags: [wiki-links, backlinks, connections]
---

# What are Wiki-Style Links?

Connect your notes together to build a personal knowledge base with automatic bidirectional linking.

## Basic Syntax

Link to another note using double brackets:

```markdown
Check out my thoughts in [[project-ideas]]
```

## Link Types

### Note Links

Link to any note by name:

```markdown
[[meeting-notes]]
[[2024-10-23]]
[[research-findings]]
```

### Section Links

Link to specific sections within notes:

```markdown
[[project-alpha#timeline]]
[[meeting-notes#action-items]]
```

### Creating New Notes

Click on a link to a non-existent note to create it:

```markdown
[[future-project]]  ← Click to create this note
```

## Automatic Backlinks

When you link to a note, Noted automatically tracks the backlink. The linked note will show:

```markdown
## Backlinks

- [[source-note]] - #tag1 #tag2
```

> Backlinks are automatically maintained when you have `noted.autoBacklinks: true` in settings
{: .prompt-tip }

## Connections Panel

The Connections sidebar shows:

- **Outgoing Links**: Notes you link to from the current note
- **Backlinks**: Notes that link to the current note

Each connection includes:
- Line number where the link appears
- Surrounding context
- Click to navigate

## Hover Previews

Hover over any wiki-style link to see a rich preview card with:

- **Note Content**: First 10 lines of the note
- **Tags**: All tags from frontmatter and inline hashtags
- **Dates**: Created and modified dates with smart relative formatting ("Just now", "2 days ago")
- **File Size**: Note size in KB
- **Custom Metadata**: Up to 3 additional frontmatter fields (status, priority, etc.)
- **Quick Actions**: Click the title to open the note instantly

For broken links (notes that don't exist yet), the preview shows a "Create note" action.

> Hover previews work seamlessly with both simple links `[[note-name]]` and display text syntax `[[note-name|Display Text]]`
{: .prompt-tip }

## Link Autocomplete

As you type `[[`, Noted suggests note names from your workspace:

1. Type `[[`
2. Start typing a note name
3. Select from suggestions
4. Press `Tab` or `Enter` to complete

## Use Cases

### Knowledge Management

Build interconnected notes:

```markdown
# Project Alpha

Related: [[project-planning]], [[team-structure]]

## Dependencies
- Backend: [[api-design]]
- Frontend: [[ui-mockups]]
```

### Meeting References

Link meeting notes to projects:

```markdown
# Standup 2024-10-23

Discussed [[feature-authentication]] and [[bug-database-connection]]
```

### Research Network

Connect research findings:

```markdown
# Machine Learning Basics

See also:
- [[neural-networks]]
- [[deep-learning-fundamentals]]
- [[training-strategies]]
```

## Best Practices

1. **Use Descriptive Names**: `[[user-authentication-flow]]` not `[[notes1]]`
2. **Link Liberally**: Create connections as you think of them
3. **Check Backlinks**: Periodically review what links to important notes
4. **Use Sections**: Link to specific sections for precise references

## Advanced Features

### Rename Across Links

When you rename a note, all links to it update automatically (feature coming soon).

### Orphan Detection

Find notes with no links in Graph View to identify isolated content.

### Link Strength

Graph View shows connection strength based on how many links exist between notes.

## Related Features

- [Connections Panel](/noted/posts/connections/) - View all links in one place
- [Note Embeds](/noted/posts/embeds/) - Embed note content inline
- [Graph View](/noted/posts/graph/) - Visualize your note network

---

Start connecting your notes today and build your personal knowledge graph! 🔗
