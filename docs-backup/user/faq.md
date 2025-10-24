---
layout: default
title: FAQ
parent: User Guide
nav_order: 8
---

# Frequently Asked Questions

Common questions about Noted.

## General Questions

### What is Noted?

Noted is a VS Code extension for taking organized notes with:
- Automatic daily note organization
- Wiki-style links between notes
- Tags for categorization
- Calendar and graph views
- Templates for structured notes
- Full-text search

### Is Noted free?

Yes, Noted is completely free and open source.

### Where are my notes stored?

Your notes are stored as plain text files (`.txt` or `.md`) in a folder you specify. By default, this is a "Notes" folder in your home directory.

**Location:**
- Default: `~/Notes` (home directory)
- Custom: Anywhere you choose
- Format: Plain text files you can access outside VS Code

### Can I use Noted without VS Code?

Notes are plain text files, so you can:
- Read/edit with any text editor
- Open on any device
- Use with other applications
- Keep in version control

However, Noted-specific features (links, graph, tags view) only work in VS Code with the extension installed.

### Do I need an account or internet connection?

No. Noted works completely offline with no account required. Notes are stored locally on your computer.

## Installation & Setup

### How do I install Noted?

1. Open VS Code
2. Go to Extensions view (`Cmd+Shift+X`)
3. Search for "Noted"
4. Click Install on "Noted" by jsonify

[Full installation guide]({{ '/user/installation' | relative_url }})

### How do I set up Noted for the first time?

After installation:
1. Run `Noted: Setup Default Folder` or `Noted: Setup Custom Folder`
2. Choose where to store notes
3. Press `Cmd+Shift+N` to create your first note

### Can I change the notes folder location later?

Yes. Use `Noted: Move Notes Folder` command to relocate all your notes automatically.

Or manually:
1. Update `noted.notesFolder` setting
2. Manually move files
3. Reload VS Code

## Daily Notes

### How are daily notes organized?

Automatically by date:
```
Notes/
└── 2025/
    └── 10-October/
        └── 2025-10-23.md
```

No manual filing required.

### Can I have multiple notes per day?

Yes! Daily note is just the default. Create additional notes using templates:
- `Cmd+K Cmd+N` for template picker
- Choose template and name
- Saved in current month's folder

### What file format should I use?

**Markdown (.md):**
- Rich formatting
- Preview support
- Better for wiki links
- Recommended

**Plain text (.txt):**
- Simple and lightweight
- Universal compatibility
- Faster for quick notes

Set in `noted.fileFormat` setting.

### Can I change file format for existing notes?

Setting only affects new notes. To convert existing:
- Manually rename files (.txt ↔ .md)
- Content remains the same
- Or keep mixed formats

## Organization

### How should I organize my notes?

**Automatic (recommended for beginners):**
- Use automatic date organization
- Add tags for categorization
- Link related notes

**Custom (advanced):**
- Create project folders
- Pin important notes
- Archive old notes
- Combine with tags and links

[Full organizing guide]({{ '/user/organizing-notes' | relative_url }})

### What's the difference between folders and tags?

**Folders:**
- Notes stored in one location
- Hierarchical organization
- Mutually exclusive

**Tags:**
- Cross-cutting categories
- Notes can have multiple tags
- Filter by any combination

Use both for best results.

### Should I use daily notes or custom folders?

**Daily notes for:**
- Chronological record
- Daily logs
- Meeting notes
- Quick capture

**Custom folders for:**
- Project documentation
- Reference material
- Long-term notes
- Topic collections

Or use both! Link daily notes to project folders.

### How do I prevent clutter?

**Regular maintenance:**
- Archive old notes monthly
- Delete unnecessary duplicates
- Use bulk operations for cleanup
- Pin only 5-10 most important notes

**Good habits:**
- Tag consistently
- Link instead of duplicate
- Extract details to separate notes
- Review and organize weekly

## Linking & Connections

### How do wiki-style links work?

Use double brackets to link notes:
```markdown
See [[project-plan]] for details
Meeting notes: [[standup-2025-10-23]]
```

Click links to navigate between notes.

[Full linking guide]({{ '/user/linking-workflow' | relative_url }})

### What if I have multiple notes with the same name?

Use path-based links:
```markdown
[[work/meeting]]
[[personal/meeting]]
[[2025/10-October/meeting]]
```

Link autocomplete shows all matches with paths.

### What are backlinks?

Backlinks show which notes link TO the current note. They appear in:
- Connections Panel (always visible)
- Hover over note header
- Auto-backlinks sections (if enabled)

### How do I see all connections for a note?

Open the Connections Panel in the sidebar:
- Shows outgoing links (notes you link to)
- Shows backlinks (notes linking to you)
- Updates automatically
- Click to navigate

## Search & Tags

### How do I search my notes?

**Quick access:**
- `Cmd+Shift+P` → Quick Switcher (recent notes)

**Full search:**
- `Cmd+Shift+F` → Advanced search with filters

**By tag:**
- Click tag in Tags panel

[Full search guide]({{ '/user/search-filter' | relative_url }})

### What search filters are available?

- `tag:tagname` - Filter by tags
- `from:YYYY-MM-DD` - Notes after date
- `to:YYYY-MM-DD` - Notes before date
- `regex:` - Regular expression search
- `case:` - Case-sensitive search

Combine multiple filters.

### Can I use tags in frontmatter?

Yes! Two formats supported:

**Inline:**
```markdown
Working on project #backend #api
```

**Frontmatter:**
```yaml
---
tags: [backend, api, feature]
---
```

Or use both in the same note.

### How many tags should I use per note?

**Recommended:** 3-5 tags

- Too few: Hard to categorize
- Too many: Over-complicated

Focus on tags you'll actually filter by.

## Templates

### How do I use templates?

**From Templates view:**
- Click template name

**From command:**
- `Cmd+K Cmd+N`
- Choose template
- Enter note name

### Can I create custom templates?

Yes!
1. Click "Create New Template" in Templates view
2. Enter template name
3. Add structure and variables
4. Save

Templates are stored in `.templates/` folder.

### What template variables are available?

10 built-in variables:
- `{date}` - Full date
- `{time}` - Current time
- `{year}`, `{month}`, `{day}` - Date components
- `{weekday}` - Day of week
- `{month_name}` - Month name
- `{filename}` - Note filename
- `{user}` - System username
- `{workspace}` - Workspace name

Run `Noted: Template Variables Reference` to see all.

## Advanced Features

### What is the Graph View?

Interactive visualization showing:
- All notes as nodes
- Wiki links as connections
- Clusters and patterns
- Orphan notes

Open with `Cmd+Shift+G`.

Useful for:
- Understanding note relationships
- Finding orphaned notes
- Seeing knowledge structure
- Exploring connections

### What is Focus Mode in Graph View?

Right-click any node to show only that note and its immediate connections. Great for:
- Reducing clutter in large graphs
- Exploring local neighborhoods
- Understanding specific note context

### Can I embed notes in other notes?

Yes! Use `![[note-name]]` syntax:

```markdown
![[meeting-template]]          # Full note
![[design-doc#Architecture]]   # Specific section
![[./images/diagram.png]]      # Images
```

### What's the difference between links and embeds?

**Links** (`[[note]]`):
- Click to navigate
- Reference to note
- Keeps notes separate

**Embeds** (`![[note]]`):
- Shows content inline
- Includes note content
- For viewing without clicking

### How does undo/redo work?

All destructive operations can be undone:
- Delete, rename, move, archive
- Bulk operations
- All tracked automatically

**Undo:** `Cmd+Alt+Z`
**Redo:** `Cmd+Shift+Alt+Z`

## Performance & Limits

### How many notes can Noted handle?

Tested with 1000+ notes. Performance depends on:
- Computer specs
- Number of links
- Search complexity
- Graph view usage

**For large collections:**
- Archive old notes
- Use filters
- Split into multiple workspaces if needed

### Why is Graph View slow?

Large graphs (500+ notes) can be slow. Try:
- Filter to reduce nodes
- Use time-based filtering
- Disable shadows
- Use straight edge style
- Try hierarchical layout

### Can I sync notes across devices?

Noted doesn't include sync, but you can:
- Store notes in Dropbox/Google Drive/iCloud
- Use git for version control
- Use any cloud storage
- Set `noted.notesFolder` to synced folder

Notes are plain text files that sync easily.

## Privacy & Data

### Where is my data stored?

Locally on your computer in the notes folder you specified. Noted doesn't send any data to external servers.

### Can I use Noted for sensitive information?

Notes are plain text files on your computer. Security depends on:
- Your computer's security
- Folder permissions
- Encryption (if you enable it at OS level)

Consider using encrypted disk/folder for sensitive notes.

### Can I back up my notes?

Yes! Notes are regular files. Back up by:
- Copying notes folder
- Using Time Machine/Windows Backup
- Storing in git repository
- Syncing to cloud storage

## Troubleshooting

### Extension not working

Try:
1. Reload VS Code window
2. Check extension is enabled
3. Run `Noted: Setup Default Folder`
4. Check for errors in Console

[Full troubleshooting guide]({{ '/user/troubleshooting' | relative_url }})

### Can't find my notes

Check:
- Archive section (might be archived)
- Active tag filters
- Search with broad terms
- File system location directly

### Links not clickable

Ensure:
- File is in notes folder
- Using `[[double brackets]]`
- File is .txt or .md
- Extension is activated

### Tags not showing

Try:
- Refresh Tags view
- Check tag syntax (`#tagname` or frontmatter)
- Verify file is saved
- Reload VS Code

## Getting Help

### Where can I get help?

- **Documentation:** [Full guides]({{ '/' | relative_url }})
- **Troubleshooting:** [Common issues]({{ '/user/troubleshooting' | relative_url }})
- **GitHub Issues:** [Report bugs](https://github.com/jsonify/noted/issues)

### How do I report a bug?

1. Check [existing issues](https://github.com/jsonify/noted/issues)
2. Create new issue with:
   - VS Code version
   - Noted version
   - Steps to reproduce
   - Error messages

### How do I request a feature?

Open an issue on [GitHub](https://github.com/jsonify/noted/issues) describing:
- What you want to do
- Why it's useful
- How you'd use it

## Tips for Success

### Best practices for daily use?

1. **Make it a habit:**
   - Same time each day
   - `Cmd+Shift+N` becomes automatic
   - Start small, build consistency

2. **Link liberally:**
   - Don't overthink
   - Link anything related
   - Build network organically

3. **Tag consistently:**
   - Choose standard tags
   - 3-5 tags per note
   - Use for filtering, not exhaustiveness

4. **Review regularly:**
   - Daily: Quick scan
   - Weekly: Organize and link
   - Monthly: Archive and clean

### How do I learn all the features?

**Start simple:**
1. Week 1: Daily notes only
2. Week 2: Add tags
3. Week 3: Add links
4. Week 4: Try templates
5. Week 5+: Advanced features (graph, embeds, bulk ops)

Don't try to use everything at once.

### What's the minimum viable workflow?

Absolute minimum:
1. `Cmd+Shift+N` to open today's note
2. Write notes
3. Use `Cmd+Shift+F` to search when needed

That's it. Everything else is optional enhancements.

---

[← Back: Troubleshooting]({{ '/user/troubleshooting' | relative_url }}) | [Back to User Guide]({{ '/user/' | relative_url }})
