---
layout: default
title: Home
nav_order: 1
description: "Your digital scratch pad for organized note-taking in VS Code"
permalink: /
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

### 📝 Daily Notes
Instantly create or open today's note with automatic organization by year and month.

### 🔗 Wiki-Style Links
Connect your notes with `[[note-name]]` syntax. Build your personal knowledge base with automatic backlinks.

### 🔄 Connections Panel
Always-visible sidebar showing all incoming backlinks and outgoing links with rich context and quick navigation.

### 📄 Note Embeds
Embed entire notes or specific sections inline with `![[note#section]]` syntax. Perfect for reusable content.

### 🏷️ Tag System
Organize with inline tags using `#tagname`. Filter, search, and autocomplete your tags.

### 📋 Templates
Built-in templates for meetings, research, and problem-solving. Create custom templates with 10 dynamic variables.

### 🔍 Advanced Search
Powerful search with regex, date filters, and tag filtering to find exactly what you need.

### 📅 Calendar View
Visual monthly calendar for navigating daily notes and viewing note history.

### 🕸️ Graph View
Interactive visualization of note connections showing your knowledge network.

### ⚡ Bulk Operations
Multi-select notes for batch operations: move, delete, or archive multiple notes at once.

### ↩️ Undo/Redo
Full undo/redo support for all destructive operations with complete history tracking.

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

[Getting Started Guide]({{ '/user/getting-started' | relative_url }}){: .btn .btn-primary }
[Explore Features]({{ '/features/' | relative_url }}){: .btn .btn-blue }
[Install Now](https://marketplace.visualstudio.com/items?itemName=jsonify.noted){: .btn .btn-green }

## What's New

### Recent Highlights

- **Auto-Backlinks Sections**: Backlinks automatically appended to notes with tags from source notes
- **YAML Frontmatter Tags**: Add tags using standard frontmatter format: `tags: [tag1, tag2, tag3]`
- **Connections Panel**: Dedicated sidebar showing all incoming backlinks and outgoing links with rich context
- **Note & Image Embeds**: Embed entire notes, sections, or images inline with `![[note-name]]` syntax
- **Graph View**: Interactive visualization with customizable nodes, edges, physics, focus mode, and time-based filtering
- **Undo/Redo System**: Complete history tracking for all destructive operations
- **Bulk Operations**: Multi-select notes for batch delete, move, or archive operations
- **Extract to Note**: Create new linked notes from selected text with automatic linking

[View Full Changelog](https://github.com/jsonify/noted/releases)

## Community

- **GitHub**: [github.com/jsonify/noted](https://github.com/jsonify/noted)
- **Issues**: [Report bugs or request features](https://github.com/jsonify/noted/issues)
- **Discussions**: Share your workflows and get help

---

**Ready to get organized?** [Install Noted from the VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=jsonify.noted)
