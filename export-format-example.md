# Export with AI Summaries - Format Example

## Without Summaries (Original Format)
```
Exported Notes - This Week
==================================================

Total Notes: 3
==================================================


--- 2025-11-03.txt ---

File: 2025-11-03.txt
Created: Sunday, November 3, 2025 at 9:00 AM
==================================================

[Note content here...]


--- 2025-11-04.txt ---

File: 2025-11-04.txt
Created: Monday, November 4, 2025 at 10:30 AM
==================================================

[Note content here...]
```

## With AI Summaries (New Format)
```
Exported Notes - This Week
==================================================
Export Date: Thursday, November 7, 2025 at 2:30 PM
Total Notes: 3
AI Summaries: Included
==================================================


==================================================
2025-11-03.txt
==================================================

## AI Summary

This note documents a team meeting discussing the Q4 product roadmap. Key decisions include:
- Priority shift to focus on performance improvements
- New feature freeze until end of quarter
- Weekly sync meetings scheduled for Thursdays

Action items:
- Schedule architecture review meeting (John)
- Update project timeline in Jira (Sarah)
- Draft performance benchmarking plan (Mike)

Keywords: roadmap, performance, Q4, feature-freeze, team-meeting

## Note Content

File: 2025-11-03.txt
Created: Sunday, November 3, 2025 at 9:00 AM
==================================================

# Team Meeting - Q4 Roadmap

Attendees: John, Sarah, Mike, Lisa

## Discussion Points

[Full original note content...]


==================================================
2025-11-04.txt
==================================================

## AI Summary

Development update covering three main areas:
- Bug fix for authentication timeout issue deployed to production
- Code review completed for new API endpoints
- Database migration planning for user table refactoring

The authentication fix resolved intermittent logout issues affecting ~5% of users.
API endpoints now support rate limiting and enhanced error handling.

Keywords: bugfix, authentication, API, code-review, database-migration

## Note Content

File: 2025-11-04.txt
Created: Monday, November 4, 2025 at 10:30 AM
==================================================

# Development Update - Nov 4

## Completed
- Fixed auth timeout bug
- Reviewed API changes

[Full original note content...]
```

## Key Differences

1. **Enhanced Header**: Includes export date, note count, and AI summary status
2. **Structured Format**: Each note has clear sections with separator lines
3. **AI Summary Section**: Appears first, providing quick overview of note content
4. **Action Items**: Automatically extracted from note content
5. **Keywords**: Relevant tags/keywords identified by AI
6. **Original Content**: Full note content preserved after summary

## Progress Notification

While generating summaries, users see:
```
Exporting notes with AI summaries
Exporting 2 of 3 notes (generating summaries)...
[Progress bar] [Cancel button]
```

## Error Handling

If summary generation fails for a note:
```
## AI Summary

[Summary generation failed: GitHub Copilot is not available]

## Note Content

[Original note content...]
```
