---
title: Daily Notes
date: 2025-10-24 09:00:00 -0800
categories: [Features, Core]
tags: [daily, notes, organization, timestamps]
---

# Daily Notes

Instantly create or open today's note with automatic organization by year and month. Daily notes are at the heart of Noted's workflow.

## Quick Access

Access your daily note via the Command Palette:

```
Command: Noted: Open Today's Note
```

This command:
- Creates today's note if it doesn't exist
- Opens today's note if it already exists
- Automatically organizes it in the proper folder structure

**Tip**: Set up a custom keyboard shortcut (like `Cmd+Shift+N`) for even faster access!

## Automatic Organization

Notes are automatically stored in a hierarchical structure:

```
Notes/
  └── 2024/
      └── 10-October/
          ├── 2024-10-01.txt
          ├── 2024-10-02.txt
          └── 2024-10-23.txt
```

**Format**: `{notesFolder}/{YYYY}/{MM-MonthName}/{YYYY-MM-DD}.{format}`

No manual folder management needed - Noted handles all the organization for you!

## File Formats

Choose your preferred format in settings:

- **`.txt`** - Plain text files (default for v1.0-v1.23)
- **`.md`** - Markdown files (default for v1.24+)

Change format in VS Code settings:
```json
{
  "noted.fileFormat": "md"
}
```

## Timestamps

Add precise time markers to your notes:

```
Command: Noted: Insert Timestamp
```

This inserts a formatted timestamp at your cursor:

```
[2:30 PM] Started working on authentication feature
[3:15 PM] Encountered CORS issue
[3:45 PM] Fixed by updating headers
```

**Format**: `[HH:MM AM/PM]`

## Use Cases

### Daily Journaling

Use daily notes to track your work, thoughts, and progress:

```markdown
# 2024-10-23

## Morning
[9:00 AM] Team standup - discussed [[sprint-planning]]
[9:30 AM] Started work on [[feature-auth]]

## Afternoon
[2:00 PM] Code review for [[pr-142]]
[3:30 PM] Fixed [[bug-cors-headers]]

## Notes
- Need to follow up with design team about [[dashboard-redesign]]
- Remember to update docs for [[api-changes]]

#work #dev
```

### Meeting Minutes

Combine with templates for structured meeting notes:

```markdown
# Daily Sync - 2024-10-23
[10:00 AM] Meeting started

**Attendees**: Alice, Bob, Charlie

## Agenda
1. Project status
2. Blockers
3. Next steps

## Notes
[10:05 AM] Alice: Completed [[user-auth]] feature
[10:12 AM] Bob: Blocked on [[database-migration]]
[10:20 AM] Charlie: Starting [[ui-redesign]] next week

## Action Items
- [ ] Bob to schedule meeting with DevOps about [[database-migration]]
- [ ] Alice to review Bob's [[pr-auth-endpoints]]

#meeting #team
```

### Task Tracking

Use daily notes as your daily task list:

```markdown
# Tasks - 2024-10-23

## Priority
- [ ] Fix critical bug [[bug-payment-flow]]
- [ ] Review [[pr-security-patch]]
- [ ] Deploy [[hotfix-v1.2.1]]

## Regular
- [ ] Update [[project-roadmap]]
- [ ] Write tests for [[feature-notifications]]
- [ ] Document [[api-endpoints]]

## Done
- [x] [9:30 AM] Merged [[pr-refactor-auth]]
- [x] [11:00 AM] Updated [[changelog]]

#tasks #todo
```

### Learning Log

Track what you learn each day:

```markdown
# Learning Log - 2024-10-23

## TypeScript
[2:00 PM] Learned about conditional types
- Can use `extends` keyword for type constraints
- Useful for [[generic-utilities]]

## VS Code Extensions
[3:30 PM] Discovered TreeDataProvider pattern
- Better than custom tree implementation
- Used in [[noted-architecture]]

## Resources
- [[typescript-handbook]]
- [[vscode-api-docs]]

#learning #dev
```

## Recent Notes Section

Access your most recent notes quickly from the sidebar:

- Shows the 10 most recently modified notes
- Updates automatically as you work
- Quick access without navigating the date hierarchy

## Multiple Notes Per Day

You can create multiple notes on the same day using templates:

```
Daily note: 2024-10-23.txt
Meeting note: 2024-10-23-standup.txt
Research note: 2024-10-23-api-design.txt
```

All appear in the same month folder, organized chronologically.

## Best Practices

1. **Use Consistent Tags**: Add tags at the bottom of each note for easy filtering
2. **Link Related Notes**: Use `[[wiki-links]]` to connect related thoughts
3. **Timestamp Important Events**: Use the Insert Timestamp command to mark key moments
4. **Review Weekly**: Use the calendar view to review your week
5. **Archive Old Notes**: Keep your workspace clean by archiving completed notes

## Custom Keyboard Shortcuts (Optional)

For faster access, you can set up custom keyboard shortcuts:

1. Open `File > Preferences > Keyboard Shortcuts`
2. Search for "Noted"
3. Assign your preferred shortcuts

**Suggested shortcuts:**
- `Cmd+Shift+N` - Open Today's Note
- `Cmd+Shift+T` - Insert Timestamp
- `Cmd+Shift+C` - Show Calendar
- `Cmd+Shift+F` - Search Notes

## Related Features

- [Templates](/noted/posts/templates/) - Use templates for structured daily notes
- [Calendar View](/noted/posts/calendar/) - Navigate daily notes visually
- [Wiki Links](/noted/posts/wiki-links/) - Connect daily notes together
- [Tags](/noted/posts/tags/) - Organize daily notes by topic

---

Start your daily note practice today! 📝
