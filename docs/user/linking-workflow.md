---
layout: default
title: Linking Notes Workflow
parent: User Guide
nav_order: 5
---

# Linking Notes Workflow

Build a connected knowledge base with wiki-style links, backlinks, and the connections panel.

## Why Link Notes?

Linking creates a web of knowledge where:
- **Related information** is one click away
- **Context** is always accessible
- **Patterns** emerge through connections
- **Knowledge** compounds over time

## Basic Wiki-Style Links

### Creating Simple Links

Link to another note using double brackets:

```markdown
Working on the authentication system today.
See [[auth-architecture]] for design decisions.
Related: [[api-documentation]] and [[security-policies]]
```

**Syntax:** `[[note-name]]`

### Link with Display Text

Make links read naturally:

```markdown
Check [[api-docs|the API documentation]] before starting.
Review [[meeting-2025-10-19|yesterday's meeting notes]] for context.
```

**Syntax:** `[[note-name|Display Text]]`

**When to use:**
- Link text needs to flow in sentence
- Note name is technical or dated
- Improving readability

### Clicking Links

**Open linked note:**
- Click any `[[link]]` in the editor
- Target note opens in current editor
- Or `Cmd+Click` (Mac) / `Ctrl+Click` (Windows) for split view

[Full Wiki Links documentation]({{ '/features/wiki-links' | relative_url }})

## Daily Note Linking Workflow

### Link as You Write

**In your daily note:**
```markdown
# 2025-10-23

## Morning
Started work on [[feature-notifications]]
Reviewed [[design-mockups]] from Sarah

## Afternoon
Bug investigation [[bug-login-redirect]]
Meeting about [[q4-planning]]

## Notes
Need to update [[api-documentation]] after changes
See [[authentication-system]] for related work
```

**Benefits:**
- Captures relationships in the moment
- Builds network organically
- Easy to navigate later

### Extract and Link

For topics needing detail:

1. **Write in daily note:**
   ```markdown
   Discovered authentication bug - login redirects to wrong page after
   successful authentication. Happens inconsistently, maybe timing related.
   ```

2. **Select the text**
3. **Right-click** → "Extract Selection to New Note"
4. **Name it:** "bug-login-redirect"
5. **Result:**
   ```markdown
   # Original daily note
   Discovered authentication bug [[bug-login-redirect]]

   # New bug note (opens automatically)
   Extracted from: [[2025-10-23]]

   Login redirects to wrong page after successful authentication...
   ```

### Link to Context

Connect daily notes to longer-term notes:

```markdown
# 2025-10-23

Working on sprint 12 tasks today
See [[sprint-12-planning]] for full context

Completed:
- [[task-implement-auth]]
- [[task-update-docs]]

Next:
- Continue on [[feature-notifications]]
```

## Project Organization with Links

### Create Project Index

**project-alpha/index.md:**
```markdown
# Project Alpha

## Overview
Customer portal redesign for Q4 2025

## Key Documents
- [[architecture]] - Technical design
- [[requirements]] - Product requirements
- [[timeline]] - Project schedule

## Implementation Notes
- [[feature-dashboard]] - New dashboard
- [[feature-auth]] - Authentication system
- [[feature-notifications]] - Notification system

## Meetings
- [[kickoff-meeting]]
- [[design-review-sept]]
- [[sprint-planning]]

## Related
See also: [[project-beta]], [[design-system]]
Filter by: #project-alpha
```

### Link from Daily Notes

```markdown
# 2025-10-23

All day on [[project-alpha]]

Progress on [[project-alpha/feature-dashboard]]
Meeting: [[project-alpha/design-review]]

See [[project-alpha/index]] for full context
```

### Bidirectional Links

Create connections both ways:

**In project-alpha/feature-dashboard.md:**
```markdown
# Dashboard Feature

Part of [[project-alpha]]

Design: [[design-mockups-dashboard]]
Implementation notes in [[2025-10-20]], [[2025-10-21]]
```

**Benefits:**
- Navigate in either direction
- Connections panel shows all relationships
- Graph view reveals structure

## Using the Connections Panel

### Always-Visible Context

The Connections panel shows:
- **Outgoing Links:** Notes this note links to
- **Backlinks:** Notes linking to this note

**Workflow:**
1. Open any note
2. Check Connections panel (sidebar)
3. See all related notes automatically
4. Click connection to navigate

### Exploring Relationships

**Find related work:**
```markdown
# feature-notifications.md (open in editor)

Connections Panel shows:

Outgoing Links (3):
- api-endpoints
- design-system
- testing-plan

Backlinks (5):
- 2025-10-20 (daily note)
- 2025-10-21 (daily note)
- project-alpha/index
- sprint-12-planning
- roadmap-q4
```

**Insights:**
- Feature is well-documented (outgoing links)
- Actively worked on (recent daily notes)
- Part of larger planning (backlinks from index, sprint, roadmap)

### Jump to Source

**See where backlink appears:**
1. Right-click connection in panel
2. Select "Open Connection Source"
3. Opens note at exact line with link
4. See full context of reference

[Full Connections Panel guide]({{ '/features/connections' | relative_url }})

## Research and Learning Workflow

### Build Topic Notes

**Start with question:**
```markdown
# learning-react-hooks.md

## Questions
- When to use useEffect vs useLayoutEffect?
- How to handle async in useEffect?

## Resources
- [[react-docs]] official documentation
- [[article-hooks-guide]] great tutorial

## Experiments
- [[experiment-useeffect-timing]]
- [[experiment-custom-hooks]]

## Related
- [[learning-react-context]]
- [[project-dashboard]] uses hooks
```

### Link Learning to Practice

**In daily note:**
```markdown
# 2025-10-23

Applied what I learned about [[learning-react-hooks]]
to [[project-dashboard/feature-live-updates]]

Works well! Notes in [[experiment-useeffect-timing]]
```

**In project note:**
```markdown
# project-dashboard/feature-live-updates

Implementation uses custom hooks
See [[learning-react-hooks#Custom Hooks]] for pattern
```

### Accumulate Knowledge

Over time, topic notes accumulate:
- Links to daily discoveries
- Links to implementations
- Links to resources
- Cross-links to related topics

Filter by tag to find all related notes:
```
tag:react tag:learning
```

## Meeting Notes Workflow

### Link Meeting Series

**Recurring meetings:**
```markdown
# standup-2025-10-23

Previous: [[standup-2025-10-22]]
Next: [[standup-2025-10-24]]

## Discussions
Follow-up on [[bug-login-redirect]] from yesterday
New work: [[feature-notifications]] kickoff

## Action Items
- [ ] Update [[api-documentation]]
- [ ] Review [[design-mockups]]
```

### Link to Decisions

**In meeting note:**
```markdown
Decision: Use OAuth 2.0 for authentication

Created: [[decision-oauth-implementation]]
See: [[auth-architecture]]
```

**In decision note:**
```markdown
# Decision: OAuth Implementation

Decided in: [[design-meeting-2025-10-15]]
Implemented in: [[feature-auth]]
Documentation: [[auth-setup-guide]]
```

### Link Action Items

**Track tasks across notes:**
```markdown
# meeting-design-review

Action Items:
- [ ] Update mockups [[task-update-mockups]]
- [ ] Get stakeholder feedback [[task-stakeholder-review]]
- [ ] Implement changes [[task-implement-design-changes]]
```

**Each task note:**
```markdown
# task-update-mockups

From: [[meeting-design-review]]
For: [[project-alpha]]
Status: In Progress #in-progress

Notes:
...
```

## Link Maintenance

### Fix Broken Links

**Link Diagnostics shows:**
- ❌ Red underline: broken link
- ⚠️ Yellow warning: ambiguous link

**Fix broken links:**
1. Click broken link
2. Prompt to create note
3. Or update link to existing note

**Fix ambiguous links:**
1. Hover to see matches
2. Use quick fix to add path
3. Changes `[[meeting]]` → `[[2025/10-October/meeting]]`

### Rename and Refactor

**Rename a note:**
1. Right-click in tree view → "Rename Note"
2. Enter new name
3. All `[[links]]` update automatically

**Or use Rename Symbol:**
1. Run `Noted: Rename Symbol`
2. Select note to rename
3. Enter new name
4. Preview all changes
5. Confirm
6. All links across workspace update

### Check Link Health

**Use Graph View:**
1. Open Graph View (`Cmd+Shift+G`)
2. Look for orphan nodes (gray, no connections)
3. Click orphan to open
4. Add appropriate links

**Use Connections Panel:**
- Notes with no backlinks might need linking
- Notes with many outgoing links but no incoming might need visibility

## Advanced Linking Patterns

### Hub and Spoke

**Create hub notes:**
```markdown
# Backend Development

## Active Work
- [[feature-api-v2]]
- [[performance-optimization]]

## Documentation
- [[api-reference]]
- [[deployment-guide]]
- [[troubleshooting]]

## Related
- [[frontend-development]]
- [[database-schema]]
```

**Spoke notes link back:**
```markdown
# feature-api-v2

Part of [[backend-development]]
```

### Map of Content (MOC)

**Topic overview:**
```markdown
# Authentication MOC

## Architecture
- [[auth-overview]]
- [[auth-flow-diagram]]
- [[auth-components]]

## Implementation
- [[oauth-setup]]
- [[session-management]]
- [[token-handling]]

## Security
- [[security-considerations]]
- [[vulnerability-testing]]

## Troubleshooting
- [[auth-debugging-guide]]
- [[common-auth-issues]]
```

### Progressive Summarization

**Link detail to summaries:**
```markdown
# Project Alpha Summary

High-level: [[project-alpha-overview]]

Details by area:
- Architecture: [[architecture-deep-dive]]
- Frontend: [[frontend-implementation-details]]
- Backend: [[backend-implementation-details]]

Daily progress: Filter by #project-alpha
```

## Linking Best Practices

### Link Liberally

**Don't overthink:**
- See a note reference? Link it
- Mention a project? Link it
- Reference a doc? Link it

**Build network organically:**
- Links are cheap
- Easy to navigate
- Connections emerge over time

### Use Consistent Names

**Avoid:**
- `auth`, `authentication`, `auth-system` for same thing

**Instead:**
- Choose one: `authentication-system`
- Link variations: `[[authentication-system|auth]]`
- Consistent names make linking easier

### Create Missing Notes

**When link breaks:**
- Create the note immediately
- Or note in task list
- Don't leave broken links

**Placeholder notes:**
```markdown
# future-feature-x

TODO: Document this feature

Related: [[roadmap-q1]]
```

### Review Connections

**Weekly check:**
- Open key project notes
- Check Connections panel
- Add missing links
- Update outdated references

## Tips and Tricks

### Quick Navigation

**Command Palette flow:**
1. Run "Noted: Open Today's Note"
2. Type, add `[[links]]`
3. `Cmd+Click` (Mac) or `Ctrl+Click` (Windows/Linux) link - Open in split
4. Continue linking
5. Check Connections panel for relationships

### Link Patterns

**Temporal:**
```markdown
Previous: [[2025-10-22]]
Next: [[2025-10-24]]
```

**Hierarchical:**
```markdown
Parent: [[project-alpha]]
Children: [[feature-a]], [[feature-b]]
```

**Associative:**
```markdown
Related: [[similar-topic-1]], [[similar-topic-2]]
See also: [[alternative-approach]]
```

### Use Both Links and Tags

**Links:** Specific relationships
**Tags:** Categorical grouping

```markdown
Working on [[feature-notifications]] for [[project-alpha]]
#development #backend #sprint-12
```

- Links: Navigate to specific notes
- Tags: Find all related notes

## Troubleshooting

### Links Not Working

**Check:**
- Syntax: `[[note-name]]` (double brackets)
- Note exists
- Name spelled correctly
- Use autocomplete to avoid typos

### Can't Find Backlinks

**Solutions:**
- Check Connections panel
- Rebuild backlinks index
- Ensure links use correct note name
- Check for broken links

### Too Many Links

**Manage complexity:**
- Focus on important relationships
- Use hub notes to organize
- Archive old notes
- Review and prune periodically

## Related Documentation

- [Wiki-Style Links]({{ '/features/wiki-links' | relative_url }}) - Full linking features
- [Connections Panel]({{ '/features/connections' | relative_url }}) - Viewing relationships
- [Graph View]({{ '/features/graph' | relative_url }}) - Visualizing connections

---

[← Back: Organizing Notes]({{ '/user/organizing-notes' | relative_url }}) | [Next: Search & Filter →]({{ '/user/search-filter' | relative_url }})
