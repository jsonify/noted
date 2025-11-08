# Smart Auto-Tagging Testing Guide

## Prerequisites

1. **GitHub Copilot**: You must have GitHub Copilot installed and signed in
   - The feature uses VS Code's Language Model API (Copilot)
   - Without Copilot, you'll get a friendly error message

2. **Notes Folder**: Have the Noted extension configured with a notes folder

## Quick Testing Steps

### Test 1: Manual Tag Generation (Easiest to Start)

1. **Create a test note** with some content:
   ```
   PROBLEM: User authentication fails with 401 error

   STEPS TAKEN:
   1. Checked JWT token expiration
   2. Verified API endpoint configuration
   3. Tested with Postman

   SOLUTION:
   The JWT secret key was incorrect in the .env file.
   Updated the key and restarted the server.

   NOTES:
   - Need to add better error messages
   - Should implement token refresh logic
   ```

2. **Open Command Palette** (`Cmd+Shift+P` or `Ctrl+Shift+P`)

3. **Run**: `Noted: Generate Tags for Current Note`

4. **Expected behavior**:
   - Shows "Generating tags..." notification
   - AI analyzes the content (takes 2-3 seconds)
   - Quick pick appears with suggested tags and confidence scores
   - Tags might include: `bug`, `authentication`, `jwt`, `problem-solving`
   - High confidence tags (>80%) are pre-selected
   - Select/deselect tags as desired
   - Press Enter to apply

5. **Verify**:
   - Open the note again
   - Should see frontmatter at the top:
   ```yaml
   ---
   tags: [bug, authentication, jwt, problem-solving]
   tagged-at: 2025-11-08T...
   ---
   ```

### Test 2: Right-Click Context Menu

1. **In the Noted sidebar**, right-click any note
2. **Look for**: "Generate Tags with AI" (sparkle icon ✨)
3. **Click it** - same behavior as Test 1
4. **Also try**: "Manage Note Tags" to manually edit tags

### Test 3: Batch Tag Multiple Notes

1. **Open Command Palette**
2. **Run**: `Noted: Batch Generate Tags`
3. **Choose option**:
   - "Tag only untagged notes" (recommended for testing)
   - OR "Re-tag all notes"
4. **Confirm** the action
5. **Watch progress**: Shows "Tagging notes... (1/10)" etc.
6. **Review results**: Shows summary of how many notes were tagged

### Test 4: Auto-Tag on Creation (Advanced)

1. **Enable the setting**:
   - Open Settings (`Cmd+,`)
   - Search for: `noted.tagging.autoTagOnCreate`
   - Check the box to enable

2. **Create a new note**:
   - Run: `Noted: Open Today's Note`
   - OR: `Noted: Open with Template`

3. **Write some content** (at least 50 characters):
   ```
   Meeting with the frontend team about the new React dashboard.
   Discussed performance optimizations and state management.
   ```

4. **Wait 2 seconds**

5. **Expected behavior**:
   - Notification appears: "Auto-tagged note with: meeting, react, frontend"
   - Click "View Tags" to review
   - Tags are already in frontmatter

### Test 5: Tag Statistics

1. **After tagging some notes**, run: `Noted: Show Tag Statistics`

2. **See summary** with:
   - Total tags
   - Tagged/untagged notes
   - Top 5 tags
   - AI vs manual count

3. **Click "View Details"** to see beautiful dashboard:
   - Stat cards
   - Most used tags list
   - Progress bars
   - Recent activity

### Test 6: Manage Tags Manually

1. **Open a note** that has tags
2. **Run**: `Noted: Manage Note Tags`
3. **See**:
   - Existing tags (pre-selected with checkmarks)
   - AI-suggested tags (unchecked)
4. **Toggle selections** as desired
5. **Press Enter** to update

### Test 7: Add Custom Tag

1. **Open a note**
2. **Run**: `Noted: Add Custom Tag`
3. **Enter tag name**: e.g., `urgent` or `follow-up`
4. **Validation**: Only allows lowercase, hyphens, numbers
5. **Tag is added** to the note

## Expected Tag Suggestions

Based on content, you should see tags like:

**For bug/problem notes:**
- `bug`, `problem-solving`, `debugging`, `troubleshooting`
- Technology tags: `typescript`, `javascript`, `react`, `node`
- Specific issues: `authentication`, `api`, `database`

**For meeting notes:**
- `meeting`, `discussion`, `planning`
- Teams: `frontend`, `backend`, `design`
- Topics: `architecture`, `performance`, `ui-ux`

**For research notes:**
- `research`, `learning`, `documentation`
- Technologies being researched
- Topics: `security`, `optimization`, `deployment`

## Configuration Options to Test

Open Settings and try:

1. **`noted.tagging.maxTags`**: Change from 5 to 3
   - Should only suggest 3 tags instead of 5

2. **`noted.tagging.customCategories`**: Add your own categories
   ```json
   ["frontend-team", "backend-team", "urgent", "later"]
   ```
   - AI should include these in suggestions

3. **`noted.tagging.excludePatterns`**: Add patterns to exclude
   ```json
   ["draft", "temp", "test"]
   ```
   - AI won't suggest these tags

## Troubleshooting

### "GitHub Copilot is not available"
- **Cause**: Not signed in to Copilot
- **Fix**: Install GitHub Copilot extension and sign in

### No tags suggested
- **Cause**: Note content too short or generic
- **Fix**: Add more specific technical content (at least 100 chars recommended)

### Tags not appearing in frontmatter
- **Cause**: File wasn't saved
- **Fix**: Save the file (Cmd+S) and reopen

### Auto-tag not working
- **Cause**: Setting disabled or note too short
- **Fix**:
  - Enable `noted.tagging.autoTagOnCreate`
  - Write at least 50 characters
  - Wait 2 seconds

## Verifying Tag Storage

Open any tagged note in a text editor - you should see:

```yaml
---
tags: [bug, typescript, react]
tagged-at: 2025-11-08T10:30:00.000Z
---

Your note content here...
```

The tags are:
- ✅ Searchable using existing tag features (F2 rename, tag search, etc.)
- ✅ Compatible with inline `#hashtags`
- ✅ Shown in the Tags sidebar view
- ✅ Included in tag statistics

## What to Look For

**Good signs:**
- ✅ Suggested tags are relevant to content
- ✅ Confidence scores make sense (higher for obvious tags)
- ✅ Tags follow naming convention (lowercase, hyphenated)
- ✅ No duplicate tags
- ✅ Frontmatter preserves other fields

**Issues to report:**
- ❌ Irrelevant tag suggestions
- ❌ Duplicate tags in frontmatter
- ❌ Frontmatter corrupted
- ❌ Performance issues (slow response)
- ❌ Crashes or errors

## Performance Notes

- **Single note**: ~2-3 seconds (depends on Copilot API)
- **Batch tagging**: ~1-2 notes per second (rate limited)
- **Auto-tag on create**: Non-blocking, runs in background

## Next Steps

After testing, you can:
1. Review tag statistics to see patterns
2. Adjust configuration based on your needs
3. Use tags for better note organization
4. Search notes by tags using existing features
