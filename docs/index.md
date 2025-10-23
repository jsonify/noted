---
layout: default
title: Home
---

# Noted

**Your digital scratch pad for organized note-taking in VS Code**

Noted is a powerful VS Code extension designed for developers who need quick access to daily notes, meeting minutes, research findings, and project ideas - all automatically organized and easily searchable.

[![CI](https://github.com/jsonify/noted/actions/workflows/ci.yml/badge.svg)](https://github.com/jsonify/noted/actions/workflows/ci.yml)

## Quick Start

1. **Install** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=jsonify.noted)
2. **Open** Command Palette (`Cmd+Shift+P`)
3. **Run** "Noted: Open Today's Note"
4. **Start writing!**

## Key Features

<div class="feature-grid">

<div class="feature-card">
<h3>📝 Daily Notes</h3>
<p>Instantly create or open today's note with automatic organization by year and month.</p>
</div>

<div class="feature-card">
<h3>🔗 Wiki-Style Links</h3>
<p>Connect your notes with <code>[[note-name]]</code> syntax. Build your personal knowledge base with automatic backlinks.</p>
</div>

<div class="feature-card">
<h3>🔄 Connections Panel</h3>
<p>Always-visible sidebar showing all incoming backlinks and outgoing links with rich context and quick navigation.</p>
</div>

<div class="feature-card">
<h3>📄 Note Embeds</h3>
<p>Embed entire notes or specific sections inline with <code>![[note#section]]</code> syntax. Perfect for reusable content.</p>
</div>

<div class="feature-card">
<h3>🏷️ Tag System</h3>
<p>Organize with inline tags using <code>#tagname</code>. Filter, search, and autocomplete your tags.</p>
</div>

<div class="feature-card">
<h3>📋 Templates</h3>
<p>Built-in templates for meetings, research, and problem-solving. Create custom templates with 10 dynamic variables.</p>
</div>

<div class="feature-card">
<h3>🔍 Advanced Search</h3>
<p>Powerful search with regex, date filters, and tag filtering to find exactly what you need.</p>
</div>

<div class="feature-card">
<h3>📅 Calendar View</h3>
<p>Visual monthly calendar for navigating daily notes and viewing note history.</p>
</div>

<div class="feature-card">
<h3>🕸️ Graph View</h3>
<p>Interactive visualization of note connections showing your knowledge network.</p>
</div>

<div class="feature-card">
<h3>⚡ Bulk Operations</h3>
<p>Multi-select notes for batch operations: move, delete, or archive multiple notes at once.</p>
</div>

<div class="feature-card">
<h3>↩️ Undo/Redo</h3>
<p>Full undo/redo support for all destructive operations with complete history tracking.</p>
</div>

</div>

## Why Noted?

### Built for Developers

Noted understands developer workflows. Keep track of bugs, solutions, API endpoints, meeting decisions, and research - all in plain text files that integrate seamlessly with your version control.

### Stay Organized

Your notes are automatically organized in a `YYYY/MM-MonthName/YYYY-MM-DD.format` structure. Never manually manage folders again.

### Quick Access

With keyboard shortcuts and the quick switcher, your notes are always just a keystroke away. No context switching, no leaving your editor.

### Plain Text First

All notes are stored as plain `.txt` or `.md` files. No proprietary formats, no lock-in. Your notes belong to you.

## Popular Workflows

### Daily Standups
Use templates with dynamic variables to quickly create standardized daily standup notes with automatic date/time insertion.

### Bug Tracking
Tag your bugs with `#bug #critical` and use advanced search to filter by tag, date range, or regex patterns.

### Knowledge Management
Link related notes together with wiki-style links. Embed reusable sections across notes. Build a personal knowledge base that grows with your projects.

### Meeting Minutes
Create structured meeting notes with the built-in template, then link to related notes and tag with project names.

## Get Started

<a href="{{ '/user/getting-started' | relative_url }}" class="btn-secondary">Getting Started Guide</a>
<a href="{{ '/features/' | relative_url }}" class="btn-secondary">Explore Features</a>
<a href="https://marketplace.visualstudio.com/items?itemName=jsonify.noted" class="btn-secondary">Install Now</a>

## What's New

### Latest Release: v1.22.0

- **Connections Panel**: Dedicated sidebar showing all incoming backlinks and outgoing links with rich context
- **Bidirectional View**: See both backlinks and outgoing connections in one always-visible panel
- **Connection Context**: View line numbers and snippets for each connection
- **Quick Navigation**: Click connections to open notes or jump to exact source lines
- **Note Embeds**: Embed entire notes with `![[note-name]]` syntax
- **Section Embeds**: Embed specific sections with `![[note#section]]` syntax
- **Enhanced Link Features**: Full-path links for disambiguation, autocomplete, and diagnostics
- **Extract to Note**: Create new linked notes from selected text
- **Rename Symbol**: Refactor links across all notes
- **Undo/Redo System**: Complete history tracking for all operations
- **Bulk Operations**: Multi-select and batch operations
- **Graph View**: Interactive visualization of note connections

[View Full Changelog](https://github.com/jsonify/noted/releases)

## Community

- **GitHub**: [github.com/jsonify/noted](https://github.com/jsonify/noted)
- **Issues**: [Report bugs or request features](https://github.com/jsonify/noted/issues)
- **Discussions**: Share your workflows and get help

---

**Ready to get organized?** [Install Noted from the VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=jsonify.noted)
