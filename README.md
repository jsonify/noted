# Noted Extension

[![CI](https://github.com/jsonify/noted/actions/workflows/ci.yml/badge.svg)](https://github.com/jsonify/noted/actions/workflows/ci.yml)

A comprehensive VS Code extension for organized workspace notes with templates, wiki-style linking, graph visualization, and powerful search - your digital knowledge base!

## ✨ Key Features

- **📝 Daily Notes**: Instantly open today's note with automatic year/month organization
- **🔗 Wiki-Style Links**: Connect notes with `[[note-name]]` syntax, see backlinks, and navigate your knowledge graph
- **🔄 Connections Panel**: Always-visible sidebar showing incoming backlinks and outgoing links with context
- **📄 Note & Image Embeds**: Embed entire notes or sections inline with `![[embed]]` syntax
- **🕸️ Interactive Graph View**: Visualize your entire note network with customizable, interactive graph
- **🏷️ Powerful Tag System**: Organize with inline `#tags` or YAML frontmatter, filter, autocomplete, and manage
- **🔍 Advanced Search**: Regex patterns, date filters, tag filtering, and quick switcher
- **📅 Calendar View**: Visual monthly calendar for navigating and creating daily notes
- **📋 Templates**: Built-in and custom templates with 10 dynamic variables
- **⚡ Bulk Operations**: Multi-select notes for batch move, delete, or archive
- **↩️ Undo/Redo**: Full undo/redo support for all destructive operations
- **📌 Pinned Notes**: Pin frequently accessed notes for instant access
- **📦 Archive**: Keep workspace clean by archiving completed notes
- **👁️ Markdown Preview**: Live preview for .md files with side-by-side editing

## 🚀 Quick Start

1. Open Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
2. Type "Noted: Open Today's Note"
3. Start writing!

Notes are automatically organized in: `Notes/2025/10-October/2025-10-24.md`

## 📖 Core Features

### Daily Notes

**Quick Access**: Open today's note instantly via Command Palette

**Auto-Organization**: Notes stored in `Notes/YEAR/MM-MonthName/YYYY-MM-DD.format`

**Timestamps**: Insert formatted timestamps `[HH:MM AM/PM]` at cursor

**Flexible Format**: Choose between `.txt` or `.md` files (configurable)

### Wiki-Style Links

Connect your notes to build a personal knowledge base:

```markdown
Working on authentication today.
See also: [[user-auth-spec]] and [[api-design]]

# Use custom display text
Check out [[long-note-name|this note]] for details

# Disambiguate with paths when names conflict
Meeting notes: [[work/meeting]] vs [[personal/meeting]]
```

**Features:**
- Clickable `[[wiki-links]]` navigate directly to notes
- Custom display text: `[[note|Display Text]]`
- Path-based disambiguation: `[[folder/note]]` for duplicate names
- Autocomplete while typing `[[` shows all available notes
- Warnings for broken or ambiguous links with quick fixes
- Automatic link updates when renaming/moving notes
- Hover previews showing note content
- Create missing notes directly from broken links

### Connections Panel 🆕

Always-visible sidebar showing all note relationships:

**Outgoing Links**: Notes that the current note links to
- Shows target note name
- Line number and context where link appears
- Click to navigate to linked note

**Backlinks**: Notes that link to the current note
- See what notes reference your work
- Context snippets showing how notes are connected
- Quick navigation to source notes
- "Open Connection Source" to jump to exact line

**Real-Time Updates**: Panel refreshes as you edit and save notes

### Note & Image Embeds 🆕

Include content from other notes or display images inline:

**Embed Notes:**
```markdown
![[meeting-notes]]                    # Embed entire note
![[project-overview#Goals]]           # Embed specific section
![[api-docs#Authentication|How to Auth]]  # Custom display text
```

**Embed Images:**
```markdown
![[screenshot.png]]                   # Simple image
![[./images/diagram.png|Diagram]]     # Relative path with caption
![[/path/to/photo.jpg]]              # Absolute path
```

**Supported Formats**: PNG, JPG, JPEG, GIF, SVG, WebP, BMP, ICO

**Live Updates**: Embedded content updates automatically when source changes

### Graph View 🆕

Interactive visualization of your note network:

**Interactive Features:**
- Click nodes to open notes
- Drag nodes to reorganize
- Zoom and pan to explore
- Hover for tooltips
- Click to highlight connections
- Right-click for focus mode

**Customization:**
- 3 layout algorithms: Force-Directed, Hierarchical, Circular
- Adjust node sizes, colors, shapes (6 options)
- Configure edge styles, colors, arrows
- Custom color schemes for connection levels
- Physics tuning: spring length, repulsion, gravity

**Filtering:**
- Search by note name
- Filter by connection type (all/connected/orphans)
- Date-based filtering (created/modified)
- Preset ranges: Today, Last 7/30/90/365 Days
- Custom date ranges

**Statistics:**
- Total notes and links
- Orphan detection
- Most connected notes
- Average connections per note

### Tag System

Organize notes with flexible tagging:

**Add Tags:**
```markdown
# Inline hashtags
Working on #backend #authentication today

# YAML frontmatter
---
tags: [backend, security, auth]
---

# Combine both approaches!
```

**Features:**
- Click tags to filter notes
- Multi-tag filtering (AND logic)
- Tag autocomplete when typing `#`
- Sort alphabetically or by frequency
- Rename tags across all notes
- Merge duplicate tags
- Delete tags with confirmation
- Export tags to JSON

### Advanced Search

Powerful search with multiple filter types:

**Filter Syntax:**
```
regex: pattern           # Regular expressions
case: true              # Case-sensitive search
tag:name               # Filter by tags
from:2025-01-01        # Date range start
to:2025-01-31          # Date range end
```

**Combine Filters:**
```
regex: tag:backend from:2025-10-01 authentication.*error
```

**Quick Switcher:**
- Access 20 most recent notes instantly
- Searchable by filename, tags, content
- Fast navigation for active work

### Calendar View

Visual monthly calendar for navigating daily notes:

**Features:**
- Click any date to see/create notes
- Highlighted days with existing notes
- Current day indicator
- Month navigation (Previous/Today/Next)
- Create multiple notes per day
- Shows all notes for selected date

### Templates

**Built-in Templates:**
- Problem/Solution: Troubleshooting and bug tracking
- Meeting: Agenda, attendees, action items
- Research: Structured research notes
- Quick: Simple dated note

**Custom Templates:**
Create personalized templates with 10 dynamic variables:
- `{filename}` - Note file name
- `{date}` - Full date (Sunday, October 24, 2025)
- `{time}` - 12-hour time (2:30 PM)
- `{year}`, `{month}`, `{day}` - Date components
- `{weekday}` - Short day name (Sun, Mon)
- `{month_name}` - Full month name (October)
- `{user}` - System username
- `{workspace}` - VS Code workspace name

**Template Management:**
- Create, edit, duplicate, delete templates
- Template variables reference viewer
- Open templates folder in system

### Bulk Operations 🆕

Multi-select notes for batch operations:

**Features:**
- Toggle select mode
- Visual selection with checkmarks
- Select all / clear selection
- Bulk delete with confirmation
- Bulk move to folder
- Bulk archive
- Undo support for all operations

### Undo/Redo 🆕

Full undo/redo system for safety:

**Supported Operations:**
- Delete, rename, move notes
- Archive/unarchive
- Bulk operations
- All destructive changes

**Features:**
- View complete undo history
- Redo previously undone operations
- Clear history when needed
- Smart file restoration with content

### Pinned Notes

Pin important notes for quick access:

**Features:**
- Pin/unpin from context menu
- Dedicated "Pinned Notes" section at top
- Visual pin indicator (📌)
- Persistent across sessions
- Auto-cleanup if note deleted

### Archive

Keep workspace clean:

**Features:**
- Archive to hidden `.archive` folder
- Dedicated archive section in tree
- Visual archive indicator (📦)
- Bulk archive by age
- Easy unarchive to restore

### Markdown Preview 🆕

Live preview for markdown files:

**Features:**
- Side-by-side editing and preview
- Auto-update as you type
- Toggle from editor toolbar
- Full markdown support

## ⚙️ Configuration

Access via VS Code Settings (search for "Noted"):

- **noted.notesFolder**: Where notes are stored (default: "Notes")
- **noted.fileFormat**: File format - "txt" or "md" (default: "md")
- **noted.tagAutoComplete**: Tag suggestions when typing # (default: true)
- **noted.autoBacklinks**: Auto-append backlinks sections (default: true)

## 📥 Installation

### From VS Code Marketplace

1. Open VS Code Extensions (`Cmd+Shift+X` or `Ctrl+Shift+X`)
2. Search for "Noted"
3. Click Install

### Manual Installation

1. Download latest `.vsix` from [releases](https://github.com/jsonify/noted/releases)
2. Open VS Code Extensions view
3. Click "..." menu → "Install from VSIX..."
4. Select downloaded file

## 🎯 Common Workflows

### Daily Standup

```markdown
---
tags: [standup, team]
---

# Standup - 2025-10-24

## Yesterday
- Completed [[feature-auth]]
- Reviewed [[pr-142]]

## Today
- Starting [[api-refactor]]
- Meeting about [[database-migration]]

## Blockers
None

#standup #team
```

### Project Notes

```markdown
---
tags: [project-alpha, planning]
---

# Project Alpha - Planning

## Overview
![[project-alpha-spec#Overview]]

## Current Status
See [[sprint-5-retrospective]] for latest updates

## Team
- Alice: [[user-auth]]
- Bob: [[database-migration]]
- Charlie: [[ui-redesign]]

## Resources
- [[architecture-decisions]]
- [[api-documentation]]

#project-alpha
```

### Meeting Minutes

```markdown
---
tags: [meeting, team, weekly]
---

# Weekly Team Sync - 2025-10-24

**Attendees**: Alice, Bob, Charlie

## Agenda
1. Sprint review
2. Blockers
3. Next week planning

## Notes
[10:00 AM] Sprint 5 completed successfully
- [[feature-auth]] shipped
- [[bug-payment]] resolved

[10:15 AM] Blockers discussed
- Bob blocked on [[database-migration]]
- Need DevOps support

## Action Items
- [ ] Bob: Schedule DevOps meeting
- [ ] Alice: Document [[auth-flow]]
- [ ] Charlie: Update [[roadmap]]

#meeting #weekly
```

## 🔧 Development

### Setup

```bash
# Clone repository
git clone https://github.com/jsonify/noted.git
cd noted

# Install dependencies
pnpm install

# Compile TypeScript
pnpm run compile

# Run tests
pnpm run test:unit
```

### Testing

```bash
# Unit tests (325 passing)
pnpm run test:unit

# Integration tests
pnpm run test

# Package extension
pnpm dlx @vscode/vsce package
```

**Test Coverage:**
- 325 unit tests covering all functionality
- Cross-platform CI/CD (Ubuntu, macOS, Windows)
- Multiple Node versions (18.x, 20.x)

### Project Structure

```
src/
├── extension.ts              # Entry point
├── constants.ts              # Shared constants
├── utils/                    # Utilities
│   ├── validators.ts
│   ├── dateHelpers.ts
│   └── folderHelpers.ts
├── services/                 # Business logic
│   ├── noteService.ts
│   ├── tagService.ts
│   ├── linkService.ts
│   ├── graphService.ts
│   ├── connectionsService.ts
│   ├── embedService.ts
│   ├── bulkOperationsService.ts
│   └── undoService.ts
├── providers/                # Tree view providers
├── commands/                 # Command handlers
├── calendar/                 # Calendar view
└── graph/                    # Graph visualization
```

## 📂 Folder Structure

Notes are automatically organized:

```
Notes/
├── .templates/              # Custom templates
├── .archive/               # Archived notes
└── 2025/
    ├── 10-October/
    │   ├── 2025-10-01.md
    │   ├── 2025-10-02.md
    │   └── 2025-10-24.md
    └── 11-November/
        └── ...
```

## 🌐 Documentation

Full documentation available at: [https://jsonify.github.io/noted](https://jsonify.github.io/noted)

**Topics:**
- Getting Started Guide
- Daily Notes Workflow
- Wiki-Style Links & Connections
- Note & Image Embeds
- Graph View Tutorial
- Tags System
- Advanced Search
- Calendar View
- Bulk Operations
- Undo/Redo
- Templates Guide
- Pinned Notes & Archive

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Follow existing code style
5. Submit a Pull Request

**Note**: This project receives frequent updates, so please check for breaking changes before submitting PRs.

## 🙏 Acknowledgments

Built with ❤️ for the VS Code community

**Technologies:**
- TypeScript
- VS Code Extension API
- Vis.js (graph visualization)
- Mocha & Chai (testing)

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/jsonify/noted/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jsonify/noted/discussions)
- **Documentation**: [Website](https://jsonify.github.io/noted)
