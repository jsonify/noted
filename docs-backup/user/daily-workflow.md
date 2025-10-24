---
layout: default
title: Daily Note-Taking Workflow
parent: User Guide
nav_order: 3
---

# Daily Note-Taking Workflow

Build an effective daily note-taking practice with Noted.

## The Daily Note Habit

Daily notes provide a chronological record of your work, thoughts, and activities. This guide shows you how to build a sustainable daily note-taking workflow.

## Morning Routine

### Start Your Day

**Open today's note:**
1. Launch VS Code
2. Open Command Palette (`Cmd+Shift+P` on Mac or `Ctrl+Shift+P` on Windows/Linux)
3. Run `Noted: Open Today's Note`
4. Today's note opens (or is created if new day)

**Quick alternatives:**
- Click "Open Today's Note" button in sidebar toolbar
- Assign a keyboard shortcut for even faster access (see [Keyboard Shortcuts guide]({{ '/user/keyboard-shortcuts' | relative_url }}))

### Set Up Your Day

Structure your daily note with clear sections:

```markdown
# 2025-10-23

## Morning Standup
- Yesterday: Completed feature X
- Today: Working on feature Y
- Blockers: None

## Tasks
- [ ] Review pull requests
- [ ] Update documentation
- [ ] Team meeting at 2pm

## Notes

```

**Using templates:**
1. Run `Noted: Open with Template` from Command Palette
2. Choose "Daily Standup" or custom template
3. Fill in sections
4. Link to project notes: `[[project-planning]]`

### Tag Your Focus

Add tags for the day's themes:

```markdown
# 2025-10-23 #work #backend #sprint-12

Today focusing on authentication system #auth #security
```

Tags help you:
- Filter notes by project or topic later
- Track time spent on different areas
- Find related notes quickly

## During the Day

### Quick Capture

Jot down thoughts as they happen:

**Insert timestamps:**
- Run `Noted: Insert Timestamp` from Command Palette
- Timestamp appears: `[2:30 PM]`
- Great for meeting notes or time-tracking
- Tip: Assign a keyboard shortcut for quick access

Example:
```markdown
## Notes

[9:15 AM] Discovered bug in login flow #bug
[10:30 AM] Meeting with design team - reviewed mockups [[design-review]]
[2:00 PM] Pair programming session - made good progress #pairing
```

### Link to Context

Connect daily notes to project documentation:

```markdown
Working on [[authentication-system]] today

Issues encountered:
- [[bug-login-redirect]] - needs investigation
- See [[api-documentation]] for endpoint details

Next steps:
- Review [[sprint-planning]] for priorities
```

**Benefits:**
- Jump to related notes quickly
- Build knowledge network
- Connections panel shows all links
- Graph view reveals patterns

### Create Related Notes

Extract detailed information:

1. **Select text** that needs expansion
2. **Right-click** → "Extract Selection to New Note"
3. **Name the note** (e.g., "bug-login-redirect")
4. **Original text replaced** with `[[bug-login-redirect]]` link
5. **New note opens** with extracted content

Use for:
- Detailed bug investigations
- Meeting deep-dives
- Research topics
- Project documentation

### Use Multiple Notes Per Day

Daily note + specific purpose notes:

```
2025/10-October/
├── 2025-10-23.md           # Daily log
├── standup-morning.md      # Morning standup
├── design-review.md        # Afternoon meeting
└── bug-investigation.md    # Bug notes
```

All appear in Calendar View for October 23.

## Meeting Notes

### During Meetings

**Quick setup:**
1. Press `Cmd+K Cmd+N` for template
2. Choose "Meeting" template
3. Fill in attendees and agenda

**Use timestamps:**
```markdown
Meeting Notes - Design Review
==================================================

Attendees: Sarah, Mike, John
Date: 2025-10-23

## Discussion

[2:00 PM] Sarah presented new dashboard design [[dashboard-mockups]]
[2:15 PM] Discussion about color scheme - decided on blue theme
[2:30 PM] Mike raised concerns about mobile layout #action-item

## Action Items
- [ ] Update mockups with feedback - Sarah - Due Friday
- [ ] Research mobile layout options - Mike - Due Monday
- [ ] Share with stakeholders - John - Due Wednesday

## Next Meeting
Next Thursday, same time
```

**Tag appropriately:**
```markdown
#meeting #design #team
```

### After Meetings

**Link from daily note:**
```markdown
# 2025-10-23

[2:00 PM] Design review meeting [[design-review-2025-10-23]]

Action items:
- Research mobile layouts #todo
```

**Cross-reference:**
- Link meeting notes to project documentation
- Link to previous meeting notes
- Tag with project and participants

## End of Day

### Review and Organize

**Quick review:**
1. Open today's note
2. Scan for incomplete tasks
3. Add any missing notes
4. Tag appropriately

**Move important items:**
- Extract tasks to dedicated task note
- Link decisions to project documentation
- Archive resolved items

### Tomorrow's Preparation

**In today's note:**
```markdown
## Tomorrow
- [ ] Follow up on [[bug-investigation]]
- [ ] Complete [[feature-implementation]]
- [ ] Review draft of [[documentation-update]]
```

**Or create tomorrow's note early:**
- Some prefer to set up next day's note
- Add tomorrow's meetings and priorities
- Link to ongoing work

## Weekly Review

### Friday Wrap-Up

Review the week:

**Use Calendar View:**
1. Press `Cmd+Shift+C` to open calendar
2. Click each day of the past week
3. Review notes for each day
4. Identify patterns and achievements

**Or search:**
```
from:2025-10-20 to:2025-10-23
```

### Create Weekly Summary

```markdown
# Week of Oct 20-23, 2025

## Accomplishments
- [[feature-x]] completed and deployed
- [[bug-login]] fixed and tested
- [[documentation]] updated

## Challenges
- Performance issues with [[database-queries]]
- Blockers on [[api-integration]]

## Next Week Focus
- Complete [[feature-y]]
- Address performance [[optimization-plan]]

#weekly-review #reflection
```

**Link to daily notes:**
```markdown
See detailed notes:
- [[2025-10-20]] - Monday planning
- [[2025-10-21]] - Bug investigation
- [[2025-10-22]] - Feature development
- [[2025-10-23]] - Testing and fixes
```

## Advanced Daily Workflows

### Project-Focused Days

**Dedicated project note:**
```markdown
# 2025-10-23 - Project Alpha

All work today on [[project-alpha]]

## Morning
- Sprint planning [[sprint-12-planning]]
- Reviewed backlog

## Development
[10:00 AM] Started [[feature-authentication]]
[2:00 PM] Pair programming with Mike
[4:00 PM] Code review completed

## Notes
See [[project-alpha-log]] for cumulative progress

#project-alpha #development
```

### Split Personal/Work Notes

**Option 1: Separate folders**
- Work notes: `~/Documents/WorkNotes`
- Personal notes: `~/Documents/PersonalNotes`
- Switch with "Move Notes Folder" command

**Option 2: Tags**
```markdown
# 2025-10-23

## Work #work
...

## Personal #personal
...
```

Filter by tag to separate contexts.

### Time-Blocking Notes

```markdown
# 2025-10-23

## 9:00-11:00 Deep Work #focus
Working on [[feature-implementation]]
Made significant progress on authentication

## 11:00-12:00 Meetings #meetings
Standup [[standup-notes]]
Quick sync with design [[design-sync]]

## 1:00-3:00 Code Review #review
Reviewed 3 PRs
[[pr-123]] [[pr-124]] [[pr-125]]

## 3:00-5:00 Bug Fixes #bugs
Fixed [[bug-login]]
Investigated [[bug-performance]]
```

### Combining Daily with Templates

**Morning:**
```markdown
![[daily-standup-template]]
```

**Throughout day:**
Add notes in free-form

**Evening:**
```markdown
![[end-of-day-reflection-template]]
```

Embeds provide structure, you add content.

## Tips for Consistency

### Make It Easy

**Keyboard shortcuts:**
- `Cmd+Shift+N` becomes muscle memory
- Open VS Code, press shortcut, start writing
- Under 5 seconds to start

**Templates:**
- Create template for daily format
- Consistent structure every day
- Less decision fatigue

### Start Small

**Minimal daily note:**
```markdown
# 2025-10-23

- Worked on X
- Meeting about Y
- Tomorrow: Z
```

Expand over time as habit builds.

### Review Regularly

**Daily:** 2-minute scan at end of day
**Weekly:** 15-minute review on Friday
**Monthly:** Use Calendar View to browse month

### Link Liberally

Don't overthink linking:
- See a project name? Link it: `[[project-alpha]]`
- Reference a bug? Link it: `[[bug-123]]`
- Mention a person? Tag it: `#team-member-name`

Build knowledge graph organically.

## Common Challenges

### "I forget to take notes"

**Solutions:**
- Set daily reminder (phone/calendar)
- Make it first action when opening VS Code
- Start with just one sentence per day
- Pair with existing habit (morning coffee + daily note)

### "My notes are messy"

**That's okay!**
- Daily notes are for you, not anyone else
- Capture > perfect formatting
- Extract important items to dedicated notes later
- Daily notes are chronological record, not final documentation

### "I don't know what to write"

**Try these prompts:**
```markdown
## What I'm working on:
...

## What I learned:
...

## Questions/blockers:
...

## Links/resources:
...
```

### "I take notes elsewhere"

**Noted complements other tools:**
- Quick capture in Noted
- Long-form docs in other tools
- Link from daily note to other docs
- Noted as central index/timeline

## Example Daily Notes

### Developer Daily Note

```markdown
# 2025-10-23 #development #backend

## Standup
- Yesterday: Completed API endpoint [[api-users]]
- Today: Adding authentication [[auth-implementation]]
- Blockers: Waiting on design feedback

## Work Log
[9:00 AM] Started authentication implementation
[10:30 AM] Pair programming with Sarah on [[auth-flow]]
[1:00 PM] Code review - reviewed [[pr-auth-fixes]]
[3:00 PM] Bug investigation [[bug-token-expiry]]

## Notes
- Good progress on auth system
- Need to refactor middleware next week
- Consider [[rate-limiting]] for API

## Tomorrow
- [ ] Complete auth tests
- [ ] Deploy to staging
- [ ] Team meeting on [[q4-planning]]
```

### Designer Daily Note

```markdown
# 2025-10-23 #design #ui

## Focus
Working on new dashboard design #dashboard-redesign

## Activities
[9:30 AM] Design review meeting [[design-review-oct]]
- Feedback on mockups - mostly positive
- Action item: adjust color contrast

[11:00 AM] Revised dashboard mockups [[dashboard-v3]]
[2:00 PM] User testing session #user-research
- 3 participants
- Great feedback on navigation
- Confusion about icon meanings - need to revise

## Assets
![[./designs/dashboard-v3.png]]
![[./designs/icon-set.svg]]

## Next Steps
- [ ] Update icons based on feedback
- [ ] Share revised mockups with team
- [ ] Schedule follow-up user testing

Links: [[design-system]] [[user-research-plan]]
```

### Product Manager Daily Note

```markdown
# 2025-10-23 #product #planning

## Meetings
[9:00 AM] Sprint planning [[sprint-13-planning]]
[11:00 AM] Stakeholder update [[stakeholder-meeting-oct]]
[2:00 PM] Customer feedback review

## Key Decisions
- Prioritizing [[feature-notifications]] for next sprint
- Delaying [[feature-reports]] to Q1
- Green light on [[design-refresh]]

## Insights
Customer feedback session revealed:
- Login flow confusion [[ux-issue-login]]
- Request for dark mode [[feature-request-dark-mode]]
- Performance concerns [[performance-investigation]]

## Action Items
- [ ] Update roadmap [[product-roadmap]]
- [ ] Draft [[prd-notifications]]
- [ ] Schedule UX session on login flow

#sprint-13 #q4
```

## Related Workflows

- [Organizing Notes]({{ '/user/organizing-notes' | relative_url }}) - Folder and tag organization
- [Linking Notes]({{ '/user/linking-workflow' | relative_url }}) - Building knowledge connections
- [Search & Filter]({{ '/user/search-filter' | relative_url }}) - Finding past notes

---

[← Back: Configuration]({{ '/user/configuration' | relative_url }}) | [Next: Organizing Notes →]({{ '/user/organizing-notes' | relative_url }})
