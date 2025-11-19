# Dendron Features Comparison

A comprehensive analysis of Dendron features that Noted currently lacks, organized by potential value and implementation complexity.

## High Priority - High Value Features

### 1. **Hierarchical Note Naming & Organization**

**What Dendron Has:**
- Dot-delimited hierarchical naming (e.g., `project.design.frontend.md`, `daily.2025.11.19.md`)
- Hierarchy navigation directly from filenames
- Flexible restructuring without folder constraints

**What Noted Has:**
- Folder-based organization (`{YYYY}/{MM-MonthName}/{YYYY-MM-DD}.{format}`)
- Limited to date-based hierarchies for daily notes
- Custom notes go in flat structure

**Gap Analysis:**
- Noted lacks hierarchical naming for project/topic organization
- No easy way to create nested topic hierarchies (e.g., `work.meetings.2025.md`)
- Users need folder-based workarounds for non-date-based organization

**Potential Value:** ⭐⭐⭐⭐⭐
- Would dramatically improve note organization for non-temporal content
- Enables topic-based knowledge management alongside date-based journaling

**Implementation Complexity:** Medium-High
- Requires new file naming strategy
- Need to support both current date-based and new hierarchical naming
- Tree view provider would need significant updates

---

### 2. **Schema System**

**What Dendron Has:**
- Schema definitions that match hierarchy patterns
- Automatic template application when creating notes in specific hierarchies
- Schema validation and autocomplete hints
- Composable schemas (import and reuse schema components)

**What Noted Has:**
- Custom templates in `.templates/` folder
- Manual template selection when creating notes
- No automatic template application
- Template bundles for multi-note workflows (v1.42.0)

**Gap Analysis:**
- No way to automatically apply templates based on note location/type
- Users must manually select templates every time
- No validation that notes follow expected structures

**Potential Value:** ⭐⭐⭐⭐⭐
- Reduces friction in note creation
- Ensures consistency across similar note types
- Perfect for daily journals, meeting notes, project templates

**Implementation Complexity:** Medium
- Could build on existing template system
- Schema files could be JSON/YAML in `.templates/schemas/`
- Pattern matching against note paths/names

---

### 3. **Unified Lookup/Quick Switcher**

**What Dendron Has:**
- Central lookup bar for finding AND creating notes
- Fuzzy search with hierarchy-aware suggestions
- Create notes in specific hierarchies from lookup
- Navigate, create, and organize from single interface

**What Noted Has:**
- `noted.quickSwitcher` - shows 20 most recent notes only
- `noted.searchNotes` - AI-powered semantic search
- Separate commands for different actions

**Gap Analysis:**
- No unified "find or create" interface
- Quick switcher limited to recent notes
- Can't create hierarchical notes from quick switcher

**Potential Value:** ⭐⭐⭐⭐⭐
- Massive UX improvement for daily workflows
- Reduces context switching between search/create
- Natural fit with hierarchical naming

**Implementation Complexity:** Medium
- Build on existing quick switcher and search
- Add "create note" option when no matches found
- Support hierarchy creation (e.g., type `work.meetings.standup` to create)

---

### 4. **Multi-Vault Support**

**What Dendron Has:**
- Multiple vaults (separate note collections) in one workspace
- Vault-specific settings and schemas
- Ability to separate work/personal/projects
- Cross-vault linking and references

**What Noted Has:**
- Single notes folder per workspace
- All notes in one location
- No separation of concerns

**Gap Analysis:**
- Users can't separate work and personal notes
- No way to have project-specific note collections
- Can't sync different note sets to different locations

**Potential Value:** ⭐⭐⭐⭐
- Critical for users who want work/personal separation
- Enables sharing project-specific note collections
- Better privacy and organization

**Implementation Complexity:** High
- Major architectural change
- Need vault management UI
- Update all file operations to be vault-aware
- Cross-vault search and linking

---

### 5. **Advanced Refactoring Tools**

**What Dendron Has:**
- Bulk rename with regex patterns
- Rename hierarchies (e.g., `project.old.*` → `project.new.*`)
- Rename note sections with link updates
- Automatic link updates across all affected notes

**What Noted Has:**
- Single note rename (updates backlinks automatically via `LinkService`)
- Tag rename across all notes (F2 or command)
- Bulk operations (move, archive, delete) on selected notes (v1.10.0)

**Gap Analysis:**
- No regex-based bulk renaming
- Can't rename hierarchies/patterns
- No section-level refactoring

**Potential Value:** ⭐⭐⭐⭐
- Essential for large knowledge bases
- Reduces fear of "getting structure wrong"
- Enables iterative organization improvements

**Implementation Complexity:** Medium
- Can leverage existing link update mechanisms
- Need regex pattern UI
- Batch processing with undo support

---

## Medium Priority - High Value Features

### 6. **Publishing to Static Sites**

**What Dendron Has:**
- Export knowledge base as NextJS static site
- Per-note, per-hierarchy, per-vault publishing controls
- Fine-grained permissions
- Custom domains and styling

**What Noted Has:**
- Export notes to single file by date range (`noted.exportNotes`)
- No publishing capabilities
- No website generation

**Gap Analysis:**
- Can't share notes publicly as websites
- No way to create knowledge base documentation
- Limited to file exports only

**Potential Value:** ⭐⭐⭐⭐
- Enable public knowledge sharing
- Great for documentation and portfolios
- Team wikis and shared resources

**Implementation Complexity:** High
- Requires static site generator integration
- Need template system for site layout
- Publishing configuration UI

---

### 7. **Pods (Import/Export System)**

**What Dendron Has:**
- Modular import/export system ("pods")
- Pods for: Markdown, JSON, Airtable, Google Docs, Notion, etc.
- Custom pod development
- Scheduled imports/exports

**What Noted Has:**
- Basic export to single file
- No import capabilities
- No integration with external services

**Gap Analysis:**
- Can't import from other note systems
- No way to sync with external tools
- Limited export options

**Potential Value:** ⭐⭐⭐⭐
- Reduces lock-in concerns
- Enables workflows with other tools
- Better onboarding from other systems

**Implementation Complexity:** High
- Need pod framework/architecture
- Each pod requires specific integration
- Configuration management

---

### 8. **Daily/Periodic Note Commands**

**What Dendron Has:**
- Commands for daily, weekly, monthly, yearly notes
- Automatic hierarchy placement
- Calendar navigation between periodic notes
- Previous/next note navigation

**What Noted Has:**
- `noted.openToday` for daily notes
- Calendar view for navigating daily notes (v1.5.0)
- Only daily note support

**Gap Analysis:**
- No weekly/monthly/yearly note templates
- Limited to daily notes
- No previous/next navigation

**Potential Value:** ⭐⭐⭐
- Useful for weekly reviews, monthly planning
- Natural extension of existing functionality

**Implementation Complexity:** Low
- Can reuse existing template system
- Add new commands for different periodicities
- Extend calendar view

---

## Lower Priority - Nice to Have Features

### 9. **Workspace-Level Configuration**

**What Dendron Has:**
- `dendron.yml` config file in workspace
- Override global settings per workspace
- Version-controlled configuration

**What Noted Has:**
- VS Code settings only (user or workspace)
- No dedicated config file

**Gap Analysis:**
- Configuration not version-controlled
- Can't share workspace-specific settings
- Limited to VS Code settings schema

**Potential Value:** ⭐⭐⭐
- Better for teams and shared projects
- Easier configuration portability

**Implementation Complexity:** Low
- Add `.noted.json` or `noted.config.json`
- Load config in extension activation
- Merge with VS Code settings

---

### 10. **Note References with Ranges**

**What Dendron Has:**
- Embed note ranges: `![[note#header1:#header2]]`
- Embed specific line ranges: `![[note#L1:L10]]`
- Block references: `![[note#^block-id]]`

**What Noted Has:**
- Basic embeds: `![[note]]`
- Section embeds: `![[note#section]]`
- Image embeds: `![[image.png]]`
- Diagram embeds: `![[diagram.drawio]]`

**Gap Analysis:**
- Can't embed line ranges
- No block-level references
- Limited to full sections

**Potential Value:** ⭐⭐⭐
- More precise content reuse
- Better for embedding code snippets

**Implementation Complexity:** Medium
- Extend existing `EmbedService`
- Add range parsing
- Line-level content extraction

---

### 11. **Workspace Sync**

**What Dendron Has:**
- Dendron Cloud sync service
- Cross-device synchronization
- Collaboration features

**What Noted Has:**
- Local files only
- Users manage sync via Git/Dropbox/etc.

**Gap Analysis:**
- No built-in sync solution
- Users responsible for backup strategy

**Potential Value:** ⭐⭐
- Convenience feature
- Not essential (users can use existing tools)

**Implementation Complexity:** Very High
- Requires backend infrastructure
- Conflict resolution
- Ongoing maintenance costs

---

### 12. **Task Management Integration**

**What Dendron Has:**
- Task aggregation across notes
- Task status tracking
- Due date support

**What Noted Has:**
- Basic markdown checkboxes
- No task aggregation
- No task-specific features

**Gap Analysis:**
- Can't view all tasks in one place
- No task tracking or reminders

**Potential Value:** ⭐⭐⭐
- Useful for GTD workflows
- Competes with dedicated task extensions

**Implementation Complexity:** Medium
- Parse checkboxes with dates
- Create tasks view
- Status tracking

---

## Summary & Recommendations

### Immediate Opportunities (Low-hanging fruit)

1. **[Daily/Weekly/Monthly Note Commands](#8-dailyperiodic-note-commands)** (Low complexity, Medium value)
   - Build on existing daily notes feature
   - Add `noted.openWeekly`, `noted.openMonthly` commands
   - Extend calendar to show weekly/monthly views

2. **[Workspace Config File](#9-workspace-level-configuration)** (Low complexity, Medium value)
   - Add `.noted.json` support
   - Enable version-controlled settings
   - Share configurations across teams

### High-Impact Features (Worth the investment)

1. **[Hierarchical Note Naming](#1-hierarchical-note-naming--organization)** (Medium-High complexity, Very High value)
   - Biggest differentiator for power users
   - Enables topic-based organization
   - Foundation for many other features

2. **[Schema System](#2-schema-system)** (Medium complexity, Very High value)
   - Natural extension of existing templates
   - Massive UX improvement
   - Reduces manual template selection

3. **[Unified Lookup](#3-unified-lookupquick-switcher)** (Medium complexity, Very High value)
   - Single interface for find/create
   - Works with hierarchical naming
   - Improves daily workflow significantly

4. **[Advanced Refactoring](#5-advanced-refactoring-tools)** (Medium complexity, High value)
   - Essential for large knowledge bases
   - Builds on existing link update code
   - Enables fearless reorganization

### Long-term Investments

1. **[Multi-Vault Support](#4-multi-vault-support)** (High complexity, High value)
   - Major architectural undertaking
   - Critical for work/personal separation
   - Enables advanced use cases

2. **[Publishing System](#6-publishing-to-static-sites)** (High complexity, High value)
   - Expands use cases significantly
   - Competitive with other PKM tools
   - Enables team documentation

3. **[Pods/Import-Export](#7-pods-importexport-system)** (High complexity, High value)
   - Reduces lock-in concerns
   - Better migration paths
   - Integration ecosystem

---

## Feature Comparison Matrix

| Feature | Dendron | Noted | Priority | Complexity |
|---------|---------|-------|----------|------------|
| [Hierarchical Naming](#1-hierarchical-note-naming--organization) | ✅ | ❌ | High | Medium-High |
| [Schema System](#2-schema-system) | ✅ | ❌ | High | Medium |
| [Unified Lookup](#3-unified-lookupquick-switcher) | ✅ | Partial | High | Medium |
| [Multi-Vault](#4-multi-vault-support) | ✅ | ❌ | High | High |
| [Advanced Refactoring](#5-advanced-refactoring-tools) | ✅ | Partial | High | Medium |
| [Publishing](#6-publishing-to-static-sites) | ✅ | ❌ | Medium | High |
| [Pods (Import/Export)](#7-pods-importexport-system) | ✅ | ❌ | Medium | High |
| Daily Notes | ✅ | ✅ | ✅ Exists | - |
| [Weekly/Monthly Notes](#8-dailyperiodic-note-commands) | ✅ | ❌ | Medium | Low |
| [Workspace Config](#9-workspace-level-configuration) | ✅ | ❌ | Low | Low |
| [Note References](#10-note-references-with-ranges) | ✅ Advanced | ✅ Basic | Low | Medium |
| [Task Management](#12-task-management-integration) | ✅ | ❌ | Low | Medium |
| Backlinks | ✅ | ✅ | ✅ Exists | - |
| Graph View | ✅ | ✅ | ✅ Exists | - |
| Calendar View | ✅ | ✅ | ✅ Exists | - |
| Templates | ✅ Auto | ✅ Manual | ✅ Exists | - |
| Tags | ✅ | ✅ AI-powered | ✅ Exists | - |
| Search | ✅ | ✅ AI-powered | ✅ Exists | - |

---

## Noted's Unique Advantages

While Dendron has many features Noted lacks, Noted has some unique strengths:

1. **AI-Powered Semantic Search** (v1.40.0) - GitHub Copilot integration for natural language search
2. **Smart Auto-Tagging** (v1.40.0) - AI-generated tag suggestions with confidence scores
3. **AI-Powered Template Generation** (v1.41.0) - Create templates from natural language descriptions
4. **Activity Metrics** (v1.36.0) - Visualize notes created, tags added, links created over time
5. **Template Bundles** (v1.42.0) - Multi-note workflow creation with automatic linking
6. **Auto-Backlinks Sections** (v1.24.0) - Automatically append backlinks to note files
7. **Diagram Embeds** (v1.31.0) - Embed Draw.io and Excalidraw diagrams
8. **Bulk Operations** (v1.10.0) - Multi-select with visual feedback and confirmation dialogs
9. **Undo/Redo System** (v1.13.0) - Comprehensive undo for destructive operations
10. **Template Browser UI** (v1.44.0) - Visual interface for template management

---

## Implementation Roadmap Suggestion

### Phase 1: Foundation (v1.45-1.47)
- [Hierarchical note naming support](#1-hierarchical-note-naming--organization)
- [Workspace config file (`.noted.json`)](#9-workspace-level-configuration)
- [Weekly/monthly note commands](#8-dailyperiodic-note-commands)

### Phase 2: Power Features (v1.48-1.52)
- [Schema system for automatic template application](#2-schema-system)
- [Enhanced lookup (find or create with hierarchy support)](#3-unified-lookupquick-switcher)
- [Advanced refactoring (regex-based bulk operations)](#5-advanced-refactoring-tools)

### Phase 3: Collaboration (v1.53-1.57)
- [Multi-vault support](#4-multi-vault-support)
- [Publishing to static sites](#6-publishing-to-static-sites)
- [Import/export pods](#7-pods-importexport-system)

### Phase 4: Polish (v1.58+)
- [Task management aggregation](#12-task-management-integration)
- [Enhanced note references (ranges, blocks)](#10-note-references-with-ranges)
- [Additional pod integrations](#7-pods-importexport-system)
---

*Generated: 2025-11-19*
*Noted Version: v1.44.0+*
*Dendron Research: GitHub README + Wiki Documentation*
