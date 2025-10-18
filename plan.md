# Noted Extension - Development Plan

This document tracks planned features, improvements, and ideas for the Noted VS Code extension.

## Current Priorities

### Code Quality & Reliability
- [ ] Add error handling around file operations (currently no try/catch blocks)
- [ ] Convert synchronous file operations to async for better performance
- [ ] Add unit tests for core functionality
- [ ] Add integration tests for VS Code commands
- [ ] Create CI/CD pipeline for automated testing

### Planned Features

#### Template System Enhancements
- [ ] Implement custom template feature (config exists but isn't used - `noted.useTemplate` and `noted.template`)
- [ ] Allow users to create and save their own templates
- [ ] Template variables beyond {date} and {time}

#### Note Organization & Discovery
- [ ] Tag system for notes
- [ ] Note linking/backlinks (wiki-style links)
- [ ] Pinned/favorite notes section
- [ ] Archive functionality for old notes
- [x] Calendar view for daily notes

#### Search & Navigation
- [ ] Search with regex support
- [ ] Advanced filters (by date range, tags, etc.)
- [ ] Quick switcher for recent notes
- [ ] Full-text search with better performance (async)

#### Editor Enhancements
- [ ] Markdown preview for .md files
- [ ] Syntax highlighting for note content
- [ ] Auto-completion for tags or links

#### UX Improvements
- [ ] Keyboard shortcuts for more commands
- [ ] Drag-and-drop to move notes between folders
- [ ] Bulk operations (move/delete multiple notes)
- [ ] Undo functionality for destructive operations
- [ ] Confirmation dialogs with preview

## Completed Features

See [notes.md](./notes.md) for a complete list of implemented features.

## Ideas for Future Consideration

- Export to different formats (PDF, HTML)
- Note encryption for sensitive information
- Collaboration features (shared notes)
- Cloud sync integration
- Mobile companion app
- Daily note reminders/notifications
- Note templates with form fields
- Graph view of note connections
- Statistics dashboard with charts
- Integration with other VS Code extensions

## Technical Debt

- Refactor single-file architecture into modules as codebase grows
- Improve TypeScript types (reduce use of `any`)
- Add JSDoc comments for public APIs
- Performance optimization for large note collections
- Better error messages for users

## Documentation Needs

- [ ] Add contributing guidelines
- [ ] Create user documentation/wiki
- [ ] Add inline code comments for complex logic
- [ ] Create video tutorials or GIFs for features
- [ ] Write migration guide for major version updates
