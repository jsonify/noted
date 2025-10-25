---
layout: page
title: Features
icon: fas fa-star
order: 1
---

# Features

Noted brings powerful note-taking capabilities right into VS Code with a focus on organization, connectivity, and developer workflows.

## 📝 Daily Notes

Instantly create or open today's note with automatic organization by year and month.

- **Quick Access**: `Cmd+Shift+N` opens today's note instantly
- **Auto-Organization**: Notes stored in `YYYY/MM-MonthName/YYYY-MM-DD.format` structure
- **Time Stamps**: Insert formatted timestamps with `Cmd+Shift+T`

[Learn more →](/noted/posts/daily-notes/)

## 🔗 Wiki-Style Links

Connect your notes with `[[note-name]]` syntax. Build your personal knowledge base with automatic backlinks.

- **Simple Linking**: Type `[[note-name]]` to link to other notes
- **Autocomplete**: Suggestions appear as you type
- **Section Links**: Link to specific sections with `[[note#section]]`
- **Automatic Backlinks**: See what notes link to your current note
- **Rich Hover Previews**: See content, tags, dates, and metadata on hover

[Learn more →](/noted/posts/wiki-links/)

## 🔄 Connections Panel

Always-visible sidebar showing all incoming backlinks and outgoing links with rich context and quick navigation.

- **Two-Way Visibility**: See both links from and to your current note
- **Context Preview**: View surrounding text for each connection
- **Quick Navigation**: Click to jump to any linked note
- **Real-Time Updates**: Panel refreshes as you edit

[Learn more →](/noted/posts/connections/)

## 📄 Note Embeds

Embed entire notes or specific sections inline with `![[note#section]]` syntax. Perfect for reusable content.

- **Full Note Embeds**: Include entire notes with `![[note-name]]`
- **Section Embeds**: Embed specific sections with `![[note#section]]`
- **Image Embeds**: Display images inline with `![[image.png]]`
- **Live Updates**: Embedded content updates when source changes

[Learn more →](/noted/posts/embeds/)

## 🏷️ Tag System

Organize with inline tags using `#tagname`. Filter, search, and autocomplete your tags.

- **Inline Tags**: Use `#tagname` anywhere in your notes
- **YAML Frontmatter**: Add tags via frontmatter `tags: [tag1, tag2]`
- **Tag Autocomplete**: Suggestions from existing tags
- **Filter by Tag**: View all notes with specific tags
- **Tag Management**: Rename tags across all notes

[Learn more →](/noted/posts/tags/)

## 📋 Templates

Built-in templates for meetings, research, and problem-solving. Create custom templates with 10 dynamic variables.

- **Built-in Templates**: Quick access to common formats
- **Custom Templates**: Create your own with full CRUD support
- **Template Variables**: 10 placeholders like `{date}`, `{time}`, `{user}`
- **Easy Management**: Create, edit, duplicate, and delete templates

[Learn more →](/noted/posts/templates/)

## 🔍 Advanced Search

Powerful search with regex, date filters, and tag filtering to find exactly what you need.

- **Regex Support**: Use `regex:pattern` for complex searches
- **Date Filters**: Find notes with `from:2024-01-01 to:2024-12-31`
- **Tag Filtering**: Search by tags with `tag:bug tag:critical`
- **Case Sensitivity**: Control matching with `case:true`
- **Quick Switcher**: `Cmd+Shift+P` for recent notes access

[Learn more →](/noted/posts/search/)

## 📅 Calendar View

Visual monthly calendar for navigating daily notes and viewing note history.

- **Monthly View**: See all notes in a visual calendar
- **Quick Navigation**: Click any date to open that day's note
- **Highlight Active Days**: Days with notes are clearly marked
- **Create Missing Notes**: Click empty dates to create new notes

[Learn more →](/noted/posts/calendar/)

## 🕸️ Graph View

Interactive visualization of note connections showing your knowledge network.

- **Interactive Nodes**: Drag, zoom, and explore your note network
- **Connection Strength**: See how notes relate by link count
- **Focus Mode**: Highlight specific notes and their connections
- **Time Filtering**: View connections from specific date ranges
- **Customizable Display**: Adjust physics, colors, and layout

[Learn more →](/noted/posts/graph/)

## ⚡ Bulk Operations

Multi-select notes for batch operations: move, delete, or archive multiple notes at once.

- **Multi-Select Mode**: Toggle with select mode command
- **Visual Feedback**: Selected notes show checkmarks
- **Batch Delete**: Remove multiple notes at once
- **Batch Move**: Organize notes by moving in bulk
- **Batch Archive**: Archive completed notes together

[Learn more →](/noted/posts/bulk-operations/)

## ↩️ Undo/Redo

Full undo/redo support for all destructive operations with complete history tracking.

- **Operation History**: Track all destructive changes
- **Full Restoration**: Undo deletes, moves, and edits
- **Redo Support**: Reapply undone operations
- **History Browser**: View complete operation timeline
- **Smart Tracking**: Captures file content and metadata

[Learn more →](/noted/posts/undo-redo/)

## 📌 Pinned Notes

Pin important notes for quick access from the sidebar.

- **Quick Pinning**: Pin/unpin from context menu
- **Dedicated Section**: Pinned notes appear at top of tree
- **Persistent**: Pins survive VS Code restarts
- **Easy Management**: Unpin anytime

[Learn more →](/noted/posts/pinned-notes/)

## 📦 Archive

Archive completed or old notes to keep your workspace clean.

- **Archive Command**: Move notes to dedicated archive folder
- **Preserve Organization**: Maintains date hierarchy in archive
- **Easy Retrieval**: Browse archived notes in tree view
- **Bulk Archive**: Archive multiple notes at once

[Learn more →](/noted/posts/archive/)

## 🔍 Orphans & Placeholders

Maintain a healthy knowledge base by tracking disconnected notes and broken links.

- **Orphan Detection**: Find notes with no connections to your knowledge network
- **Three Categories**: Isolated, source-only, and sink-only orphans
- **Placeholder Tracking**: Track all broken wiki-style links
- **One-Click Creation**: Create missing notes directly from placeholders
- **Context Snippets**: See where each placeholder is referenced

[Learn more →](/noted/posts/orphans-placeholders/)

---

Ready to explore these features? [Get Started →](/noted/posts/getting-started/)
