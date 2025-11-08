# Smart Auto-Tagging Guide

Automatically tag your notes using AI to improve organization and discoverability.

## Overview

Smart Auto-Tagging analyzes your note content and suggests relevant tags using GitHub Copilot. Tags help you organize notes by topic, technology, or project - making it easier to find related content across different dates.

## Prerequisites

**GitHub Copilot Required**: This feature uses VS Code's Language Model API powered by GitHub Copilot. You'll need:
- GitHub Copilot extension installed
- Active Copilot subscription
- Signed in to your GitHub account

## Quick Start

### 1. Generate Tags for a Note

The easiest way to get started:

1. Open any note with content (the more specific, the better)
2. Open Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
3. Run: **`Noted: Generate Tags for Current Note`**
4. Review suggested tags with confidence scores
5. Select which tags to apply (high-confidence tags are pre-selected)
6. Press Enter to add tags to your note

**Example:**

If your note contains:
```
PROBLEM: React app performance issues in production

The dashboard component is slow when rendering 1000+ items.
Profiling shows excessive re-renders.

SOLUTION:
Added React.memo() and useMemo() hooks.
Performance improved by 80%.
```

You might get tags like:
- ✨ `react` (95% confidence)
- ✨ `performance` (92% confidence)
- ✨ `bug` (88% confidence)
- ✨ `optimization` (85% confidence)

### 2. Right-Click Menu

For quick access:

1. In the **Noted sidebar**, right-click any note
2. Select **"Generate Tags with AI"** (sparkle icon ✨)
3. Review and apply suggested tags

You can also use **"Manage Note Tags"** to:
- View existing tags
- See AI suggestions
- Add custom tags
- Remove unwanted tags

### 3. Batch Tag Multiple Notes

Tag many notes at once:

1. Run: **`Noted: Batch Generate Tags`**
2. Choose:
   - **"Tag only untagged notes"** (recommended) - only tags notes without tags
   - **"Re-tag all notes"** - adds tags to all notes, merging with existing
3. Confirm the operation
4. Watch progress indicator: "Tagging notes... (5/50)"
5. Review summary when complete

**Tips:**
- Start with untagged notes for best results
- Cancel anytime during batch processing
- High-confidence tags (>70%) are auto-applied

## Features

### Auto-Tag New Notes

Automatically tag notes when you create them (optional):

1. **Enable in Settings:**
   - Open Settings (`Cmd+,`)
   - Search: `noted.tagging.autoTagOnCreate`
   - Check the box

2. **How it works:**
   - Create a new note (daily note or from template)
   - Write at least 50 characters
   - After 2 seconds, AI analyzes and tags your note
   - Notification shows: "Auto-tagged note with: meeting, react, frontend"
   - Click "View Tags" to review or adjust

3. **Configuration:**
   - Only high-confidence tags (>75%) are auto-applied
   - Runs in background without interrupting you
   - Skip by leaving notes short initially

### Tag Statistics

See how your tags are being used:

**Quick Summary:**
1. Run: **`Noted: Show Tag Statistics`**
2. See overview:
   - Total tags and notes
   - Most used tags (top 5)
   - AI vs manual tag breakdown
3. Click "View Details" for full dashboard

**Detailed Dashboard:**
1. Run: **`Noted: Show Detailed Tag Statistics`**
2. Beautiful view with:
   - 📊 Stat cards for key metrics
   - 📈 Visual progress bars
   - 🏆 Top 10 most used tags
   - 🕐 Recently added tags (last 24 hours)
   - 🎨 Color-coded AI vs manual tags

### Manual Tag Management

Full control over your tags:

**Add Custom Tags:**
1. Run: **`Noted: Add Custom Tag`**
2. Enter tag name (e.g., `urgent`, `follow-up`, `phase-2`)
3. Tag format: lowercase, hyphens, numbers only

**Manage Tags:**
1. Run: **`Noted: Manage Note Tags`**
2. See:
   - ✓ Current tags (checked)
   - Suggested tags (unchecked)
   - Option to toggle each tag
3. Press Enter to save changes

## Configuration

Customize auto-tagging in VS Code Settings:

### `noted.tagging.enabled`
- **Default:** `true`
- **Description:** Enable/disable all tagging features
- **When to disable:** If you don't want AI-powered tagging

### `noted.tagging.autoTagOnCreate`
- **Default:** `false`
- **Description:** Automatically tag new notes after creation
- **Recommendation:** Enable once you're comfortable with tag quality

### `noted.tagging.maxTags`
- **Default:** `5`
- **Range:** 1-20
- **Description:** Maximum tags to suggest per note
- **Example:** Set to `3` for more focused suggestions

### `noted.tagging.customCategories`
- **Default:** `[]`
- **Type:** Array of strings
- **Description:** Add your own tag categories for AI to consider
- **Example:**
  ```json
  [
    "frontend-team",
    "backend-team",
    "urgent",
    "product-feature",
    "technical-debt"
  ]
  ```

### `noted.tagging.excludePatterns`
- **Default:** `["draft", "temp"]`
- **Type:** Array of strings
- **Description:** Tag patterns to exclude from AI suggestions
- **Example:**
  ```json
  [
    "draft",
    "temp",
    "test",
    "wip"
  ]
  ```

## How Tags Are Stored

Tags are stored in YAML frontmatter at the top of your note:

```yaml
---
tags: [react, performance, bug, optimization]
tagged-at: 2025-11-08T10:30:00.000Z
---

Your note content here...
```

**Benefits:**
- ✅ Compatible with other markdown tools
- ✅ Human-readable and editable
- ✅ Works with existing Noted tag features
- ✅ Can mix AI tags with inline `#hashtags`
- ✅ Preserved when copying/moving notes

## Tag Quality Tips

Get better tag suggestions:

### ✅ Good Practices

**Be specific:**
```
Building a React dashboard with Chart.js for displaying user analytics.
Using TypeScript for type safety.
```
→ Gets: `react`, `typescript`, `dashboard`, `analytics`

**Include technologies:**
```
API integration using Axios and Express middleware.
Handling JWT authentication tokens.
```
→ Gets: `api`, `authentication`, `jwt`, `express`

**Describe problems clearly:**
```
Database query timeout with MongoDB aggregation pipeline.
Need to optimize the index structure.
```
→ Gets: `database`, `mongodb`, `performance`, `debugging`

### ❌ Avoid

**Too generic:**
```
Had a meeting today. Talked about stuff.
```
→ Gets: `meeting` (not very useful)

**Too short:**
```
Fixed bug.
```
→ May not generate any tags

**No technical content:**
```
Reminder to call Bob tomorrow.
```
→ Gets irrelevant tags

## Examples

### Example 1: Bug Report

**Note content:**
```
PROBLEM: User login fails with 401 Unauthorized

STEPS TAKEN:
1. Checked API endpoint configuration
2. Verified JWT token structure
3. Tested with Postman

SOLUTION:
JWT secret was incorrect in .env file
Updated environment variables

NOTES:
- Need better error messages
- Should add token refresh logic
```

**AI suggests:**
- `bug` (98%)
- `authentication` (95%)
- `jwt` (92%)
- `api` (88%)
- `problem-solving` (85%)

### Example 2: Meeting Notes

**Note content:**
```
Weekly frontend team sync

ATTENDEES: Alice, Bob, Carol

DISCUSSION:
- New React dashboard design review
- Performance optimization for data tables
- Migration to TypeScript progress

ACTION ITEMS:
- Alice: Finish dashboard mockups
- Bob: Implement memoization
- Carol: Update type definitions
```

**AI suggests:**
- `meeting` (98%)
- `react` (95%)
- `frontend` (92%)
- `typescript` (90%)
- `performance` (85%)

### Example 3: Research Notes

**Note content:**
```
Research: Server-Side Rendering with Next.js

Comparing SSR vs SSG for our blog:
- SSR: Fresh data, slower TTFB
- SSG: Fast, but rebuild needed for updates

FINDINGS:
- ISR (Incremental Static Regeneration) best of both
- Can use revalidate parameter
- Works well with our CMS

DECISION: Use ISR with 60s revalidation
```

**AI suggests:**
- `research` (98%)
- `nextjs` (95%)
- `ssr` (92%)
- `performance` (88%)
- `architecture` (85%)

## Use Cases

### 1. Project Organization

Tag notes by project or feature:
- `feature-dashboard`
- `project-redesign`
- `migration-v2`

Find all notes about a project using the Tags sidebar view.

### 2. Technology Tracking

Track which technologies you're working with:
- `react`, `typescript`, `node`
- `mongodb`, `postgres`
- `docker`, `kubernetes`

See technology trends in Tag Statistics.

### 3. Work Classification

Categorize work types:
- `bug`, `feature`, `refactoring`
- `meeting`, `research`, `learning`
- `documentation`, `code-review`

Balance your work by reviewing tag distribution.

### 4. Status Tracking

Mark note status:
- `todo`, `in-progress`, `completed`
- `blocked`, `on-hold`
- `urgent`, `follow-up`

Quickly find items needing attention.

## Integration with Existing Features

Smart Auto-Tagging works seamlessly with Noted's existing tag features:

- **Tag Search:** Use `Noted: Search Tag` to find tagged notes
- **Tag Rename:** Press `F2` on any tag to rename across all notes
- **Tag View:** See all tags in the Tags sidebar
- **Inline Tags:** Mix frontmatter tags with inline `#hashtags`
- **Export:** Tags included when exporting notes

## Troubleshooting

### "GitHub Copilot is not available"

**Problem:** Extension can't access Copilot
**Solution:**
1. Install GitHub Copilot extension
2. Sign in to GitHub account
3. Ensure active Copilot subscription
4. Restart VS Code

### No tags suggested

**Problem:** AI returns empty suggestions
**Possible causes:**
- Note content too short (< 50 characters)
- Content too generic or non-technical
- Copilot API temporarily unavailable

**Solution:**
- Add more specific technical content
- Include technology names or problem descriptions
- Try again in a few minutes

### Tags not appearing

**Problem:** Tags generated but not visible
**Solution:**
1. Save the note file (`Cmd+S`)
2. Reopen the note
3. Check frontmatter at top of file
4. Refresh Noted sidebar (`Noted: Refresh Notes`)

### Poor tag quality

**Problem:** Tags aren't relevant
**Solution:**
1. Adjust `maxTags` to smaller number (e.g., 3)
2. Add `customCategories` for your domain
3. Add poor tags to `excludePatterns`
4. Make note content more specific
5. Use "Manage Note Tags" to refine manually

### Auto-tag not working

**Problem:** New notes aren't being tagged
**Check:**
1. Setting enabled: `noted.tagging.autoTagOnCreate`
2. Note has at least 50 characters
3. Waited 2 seconds after creation
4. GitHub Copilot is working

## Best Practices

1. **Start Manual:** Generate tags manually first to see quality
2. **Review Suggestions:** Don't blindly accept all suggested tags
3. **Use Custom Categories:** Add your project/team-specific tags
4. **Exclude Generic Tags:** Add common but unhelpful tags to exclude list
5. **Batch Tag Old Notes:** Use batch command to tag existing notes
6. **Check Statistics:** Review tag stats monthly to see patterns
7. **Refine Over Time:** Adjust settings based on tag quality

## Privacy & Data

- Tag generation uses GitHub Copilot API
- Note content is sent to Copilot for analysis
- No data is stored by Noted (only Copilot's standard processing)
- Tags are stored locally in your note files
- No tracking or analytics

## FAQ

**Q: Do I need GitHub Copilot?**
A: Yes, Smart Auto-Tagging requires GitHub Copilot to function.

**Q: Can I edit tags manually?**
A: Yes! Tags are just YAML frontmatter. Edit them in the note or use "Manage Note Tags".

**Q: Are tags searchable?**
A: Yes, they work with all existing tag features (search, rename, tag view, etc.).

**Q: Can I use both AI tags and #hashtags?**
A: Yes! They work together. AI tags go in frontmatter, hashtags go inline.

**Q: How accurate are the tags?**
A: Confidence scores indicate accuracy. Tags >80% are usually very relevant.

**Q: Does this work offline?**
A: No, it requires Copilot API access (internet connection).

**Q: Can I change tag names after applying?**
A: Yes, edit frontmatter or use "Manage Note Tags" or press F2 to rename.

**Q: How many tags should I use per note?**
A: 3-5 is ideal. Too many tags reduce their usefulness.

## Support

If you encounter issues:

1. Check [Troubleshooting](#troubleshooting) section
2. Review your configuration settings
3. Test with a well-written technical note
4. Check GitHub Copilot status
5. Report issues on [GitHub](https://github.com/jsonify/noted/issues)

## Related Features

- [Tags View](./tags.md) - Browse notes by tag
- [Search](./search.md) - Advanced search with tag filters
- [Templates](./templates.md) - Note templates work with auto-tagging
- [Export](./export.md) - Export notes grouped by tags
