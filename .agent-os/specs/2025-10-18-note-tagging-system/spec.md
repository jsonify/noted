# Spec Requirements Document

> Spec: Note Tagging System
> Created: 2025-10-18
> Status: Planning

## Overview

Implement a comprehensive tagging system for notes that allows users to organize and filter notes using hashtag-based tags in a metadata section. This feature will enhance note discoverability and organization beyond the current date-based folder structure.

## User Stories

### Organizing Notes with Tags

As a developer taking technical notes, I want to tag my notes with topics like #bug, #feature, #meeting, so that I can quickly find all notes related to a specific topic regardless of when they were created.

**Workflow**: User creates or opens a note, adds a tags metadata section at the top (e.g., `tags: #project-alpha #bug #urgent`), saves the note. The extension parses the tags and makes them available for filtering and search. User can then filter the tree view to show only notes with specific tags, or search for notes by tag.

### Discovering Related Content

As a note-taker, I want to see all available tags with usage counts, so that I can understand how I've organized my notes and discover patterns in my note-taking.

**Workflow**: User opens the Tags section in the tree view, which displays all tags sorted by frequency or alphabetically. Clicking a tag filters the notes tree to show only notes containing that tag. User can also use the command palette to search/filter by tags.

### Managing Tag Taxonomy

As a long-term user, I want to rename or merge tags across all notes, so that I can maintain a clean and consistent tagging system as my needs evolve.

**Workflow**: User right-clicks a tag in the Tags section and selects "Rename Tag" or "Merge Tag". The extension updates all notes containing the old tag with the new tag name, maintaining note integrity.

## Spec Scope

1. **Tag Parsing and Metadata** - Parse hash-based tags (`#tag-name`) from anywhere in note content (inline support)
2. **Tags Tree View Section** - New collapsible "Tags" section in the sidebar showing all tags with usage counts
3. **Tag Filtering** - Filter notes tree view by single or multiple tags via tree view UI and command palette
4. **Enhanced Search** - Integrate tag-based search with existing full-text search using `tag:name` syntax
5. **Tag Management Commands** - Commands for viewing all tags, renaming tags, merging tags, and deleting unused tags
6. **Tag Autocomplete** - Suggest existing tags when typing `#` anywhere in notes

## Out of Scope

- Tag hierarchies or nested tags (e.g., `#project/alpha`)
- Tag colors or visual customization
- Tag aliases or synonyms
- Automatic tag suggestions based on note content (AI-powered)
- Tag-based note templates

## Expected Deliverable

1. Users can add tags anywhere in notes using `#tagname` syntax and see them parsed correctly
2. Tags section appears in the tree view with all available tags and counts
3. Clicking a tag filters the notes tree to show only tagged notes
4. Search command supports `tag:name` syntax combined with text search
5. Tag management commands (rename, merge, delete) work correctly across all notes
6. Tag autocomplete suggests existing tags when typing `#` anywhere in notes

## Spec Documentation

- Tasks: @.agent-os/specs/2025-10-18-note-tagging-system/tasks.md
- Technical Specification: @.agent-os/specs/2025-10-18-note-tagging-system/sub-specs/technical-spec.md
- Tests Specification: @.agent-os/specs/2025-10-18-note-tagging-system/sub-specs/tests.md
