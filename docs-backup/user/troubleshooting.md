---
layout: default
title: Troubleshooting
parent: User Guide
nav_order: 7
---

# Troubleshooting

Common issues and solutions for Noted.

## Installation Issues

### Extension Won't Install

**Symptoms:**
- Installation fails
- Error messages during install
- Extension doesn't appear

**Solutions:**

1. **Check VS Code version:**
   - Requires VS Code 1.80.0 or higher
   - Update VS Code: Help → Check for Updates

2. **Check internet connection:**
   - Marketplace requires internet access
   - Disable VPN/proxy temporarily

3. **Try alternative installation:**
   - Install from [marketplace website](https://marketplace.visualstudio.com/items?itemName=jsonify.noted)
   - Download VSIX manually and install

4. **Check disk space:**
   - Ensure sufficient space available
   - Clear temporary files if needed

5. **Check extension logs:**
   - Open Output panel
   - Select "Extensions" from dropdown
   - Look for error messages

### Extension Installed But Not Working

**Symptoms:**
- Extension shows as installed
- Commands don't appear
- Sidebar icon missing

**Solutions:**

1. **Reload VS Code:**
   - `Cmd+Shift+P` → "Reload Window"
   - Or restart VS Code completely

2. **Check if enabled:**
   - Extensions view → Find "Noted"
   - Ensure not disabled
   - Click "Enable" if needed

3. **Check for conflicts:**
   - Disable other note-taking extensions
   - Reload VS Code
   - Re-enable one by one

4. **Reinstall extension:**
   - Uninstall Noted
   - Reload VS Code
   - Reinstall from marketplace

## Setup Issues

### Notes Folder Not Created

**Symptoms:**
- Setup command runs but no folder appears
- Can't find notes folder

**Solutions:**

1. **Check folder location:**
   - Run setup again, note the path
   - Open file explorer to that location
   - Look for "Notes" folder

2. **Check permissions:**
   - Ensure write access to parent directory
   - Try different location with "Setup Custom Folder"

3. **Manual creation:**
   - Create folder manually
   - Set path in settings: `noted.notesFolder`
   - Reload VS Code

4. **Check settings:**
   - Open Settings (`Cmd+,`)
   - Search "noted.notesFolder"
   - Verify path is correct and accessible

### Can't Change Notes Folder

**Symptoms:**
- Setting doesn't update
- Notes still in old location

**Solutions:**

1. **Use Move command:**
   - Run `Noted: Move Notes Folder`
   - Select new location
   - Files move automatically

2. **Manual process:**
   - Copy notes to new folder manually
   - Update `noted.notesFolder` setting
   - Reload VS Code
   - Delete old folder when confirmed

3. **Check path format:**
   - Use absolute paths: `/Users/name/Notes`
   - Windows: `C:\\Users\\name\\Notes`
   - Or use `~/Notes` for home directory

## Daily Use Issues

### "Open Today's Note" Doesn't Work

**Symptoms:**
- Command doesn't create note
- Error message appears
- Nothing happens

**Solutions:**

1. **Check notes folder:**
   - Run setup if folder not configured
   - Verify folder exists and is writable

2. **Check file format setting:**
   - Settings → `noted.fileFormat`
   - Should be "txt" or "md"

3. **Check date structure:**
   - Should create: `YYYY/MM-MonthName/YYYY-MM-DD.format`
   - Verify parent folders exist or can be created

4. **Check console for errors:**
   - Help → Toggle Developer Tools
   - Console tab
   - Look for red errors

### Timestamps Not Inserting

**Symptoms:**
- `Insert Timestamp` command doesn't work
- No timestamp appears at cursor

**Solutions:**

1. **Check cursor position:**
   - Cursor must be in an editor
   - File must be a text file

2. **Check keyboard shortcut:**
   - Verify `Cmd+Shift+T` not overridden
   - Try from Command Palette instead

3. **Check for conflicts:**
   - Another extension might override shortcut
   - Reassign shortcut in Keyboard Shortcuts

### Can't Find Sidebar

**Symptoms:**
- Noted icon missing from Activity Bar
- Can't access tree views

**Solutions:**

1. **Check Activity Bar:**
   - Look for notebook icon in Activity Bar
   - May be at bottom if many extensions installed

2. **Reset Activity Bar:**
   - Right-click Activity Bar
   - Select "Reset Activity Bar Locations"

3. **Check Views menu:**
   - View → Open View
   - Search for "Noted"
   - Select view to open

4. **Check if extension enabled:**
   - Extensions view → Noted
   - Ensure enabled, not disabled

## Search and Filter Issues

### Search Returns No Results

**Symptoms:**
- Search finds nothing
- Know note exists with search term

**Solutions:**

1. **Check search syntax:**
   - Verify filter format: `tag:tagname`
   - Check date format: `from:YYYY-MM-DD`

2. **Check tag filters:**
   - Clear active tag filters
   - Look for "Clear Tag Filters" button

3. **Check spelling:**
   - Verify search terms spelled correctly
   - Try partial word search

4. **Check file contents:**
   - Open note manually
   - Verify content actually contains search term

5. **Rebuild index:**
   - Run `Noted: Refresh Connections`
   - Try search again

### Tags Not Showing

**Symptoms:**
- Tags View empty
- Tags in notes not appearing

**Solutions:**

1. **Refresh tags:**
   - Click Refresh button in Tags View
   - Or run `Noted: Refresh Tags`

2. **Check tag syntax:**
   - Inline: `#tagname` (must be valid characters)
   - Frontmatter: `tags: [tag1, tag2]`
   - No spaces in tag names (use hyphens)

3. **Check file format:**
   - Tags work in both .txt and .md files
   - Save file after adding tags

4. **Rebuild tag index:**
   - Reload VS Code window
   - Tags should rebuild automatically

### Calendar View Not Loading

**Symptoms:**
- Calendar View blank
- Webview doesn't open

**Solutions:**

1. **Check command:**
   - Run `Noted: Show Calendar View`
   - Or use `Cmd+Shift+C`

2. **Close and reopen:**
   - Close calendar tab
   - Run command again

3. **Check for errors:**
   - Toggle Developer Tools
   - Console tab for errors

4. **Reload VS Code:**
   - `Cmd+Shift+P` → "Reload Window"
   - Try calendar again

## Link Issues

### Links Not Clickable

**Symptoms:**
- `[[links]]` don't work
- Can't click to navigate

**Solutions:**

1. **Check file type:**
   - Links work in .txt and .md files
   - File must be in notes folder

2. **Check link syntax:**
   - Must use double brackets: `[[note-name]]`
   - No spaces around brackets

3. **Reload window:**
   - `Cmd+Shift+P` → "Reload Window"
   - Extension might not have activated

4. **Check extension active:**
   - Look for Noted icon in Activity Bar
   - Extension should auto-activate

### Broken Links

**Symptoms:**
- Red underline on link
- Link doesn't open note

**Solutions:**

1. **Check note exists:**
   - Look in tree view for target note
   - Verify spelling matches exactly

2. **Use autocomplete:**
   - Type `[[` and let autocomplete suggest
   - Prevents typos

3. **Create missing note:**
   - Click broken link
   - Select "Create note"
   - Or create note manually

4. **Use full path:**
   - For duplicate names: `[[folder/note-name]]`
   - See Link Diagnostics warnings

### Backlinks Not Showing

**Symptoms:**
- Connections Panel empty
- No backlinks in hover

**Solutions:**

1. **Rebuild backlinks:**
   - Run `Noted: Refresh Connections`
   - Wait for rebuild to complete

2. **Check link syntax:**
   - Links must use `[[note-name]]` format
   - Verify links saved in source files

3. **Check note name:**
   - Backlinks match note file name
   - Case-insensitive but must match

4. **Save files:**
   - Ensure all files saved
   - Backlinks update on save

## Performance Issues

### Slow Performance

**Symptoms:**
- VS Code feels sluggish
- Commands take long time
- UI freezes briefly

**Solutions:**

1. **Large workspace:**
   - Many notes (1000+) may slow down
   - Consider archiving old notes
   - Use tag filtering to reduce visible notes

2. **Rebuild indexes:**
   - Can be slow with many notes
   - Run manually during downtime
   - Happens in background

3. **Disable features:**
   - Turn off `noted.autoBacklinks` if slow
   - Reduce graph view nodes with filters

4. **Check other extensions:**
   - Disable other extensions temporarily
   - Identify conflicts

5. **Restart VS Code:**
   - Clears memory
   - Rebuilds indexes fresh

### Graph View Slow

**Symptoms:**
- Graph takes long to load
- Dragging nodes laggy
- UI unresponsive

**Solutions:**

1. **Filter the graph:**
   - Use "Connected Only" filter
   - Use search to show fewer nodes
   - Use time filters to reduce displayed notes

2. **Adjust graph settings:**
   - Disable shadows
   - Use straight edge style instead of curves
   - Reduce node size

3. **Try different layout:**
   - Hierarchical often faster than Force-Directed
   - Circular can be faster for smaller graphs

4. **Reduce notes:**
   - Archive old notes
   - Split large workspace
   - Focus on active project

## File Operation Issues

### Can't Delete Note

**Symptoms:**
- Delete command fails
- Error message appears

**Solutions:**

1. **Check file permissions:**
   - Ensure file not read-only
   - Check folder permissions

2. **Close file first:**
   - Close note in editor
   - Then delete from tree view

3. **Check if file open elsewhere:**
   - Another app might have file open
   - Close other applications

4. **Use undo:**
   - If accidental, use `Cmd+Alt+Z`

### Can't Rename Note

**Symptoms:**
- Rename command fails
- Name doesn't change

**Solutions:**

1. **Check file permissions:**
   - Ensure write access to folder

2. **Check for duplicates:**
   - Can't rename to existing note name
   - Choose different name

3. **Close file first:**
   - Close in editor
   - Rename from tree view

4. **Check name validity:**
   - Avoid special characters
   - Use letters, numbers, hyphens, underscores

### Can't Move Note

**Symptoms:**
- Move command fails
- Note stays in same location

**Solutions:**

1. **Check destination:**
   - Folder must exist
   - Must have write permission

2. **Check for duplicates:**
   - Can't move if same name exists in destination
   - Rename first, then move

3. **Use bulk move:**
   - Sometimes works when single move doesn't
   - Select note in Select Mode
   - Use Bulk Move

## Archive Issues

### Can't Archive Note

**Symptoms:**
- Archive command doesn't work
- Note doesn't move

**Solutions:**

1. **Check .archive folder:**
   - Should create automatically
   - May need permissions

2. **Close file:**
   - Close note in editor first
   - Then archive

3. **Check pinned status:**
   - Unpins automatically when archived
   - But verify not causing issue

### Archived Notes Not Showing

**Symptoms:**
- Archive section empty
- Know notes were archived

**Solutions:**

1. **Expand Archive section:**
   - Click to expand in tree view

2. **Check .archive folder:**
   - Look in file system
   - Folder is in notes root

3. **Refresh tree:**
   - Click Refresh button
   - Or reload VS Code

## Template Issues

### Templates Not Showing

**Symptoms:**
- Templates View empty
- Can't see custom templates

**Solutions:**

1. **Check .templates folder:**
   - Should be in notes folder
   - Create if doesn't exist

2. **Check file format:**
   - Templates should be .txt or .md
   - Match your file format setting

3. **Refresh view:**
   - Click Refresh in Templates View
   - Or reload VS Code

### Template Variables Not Replacing

**Symptoms:**
- `{date}` shows as literal text
- Variables not replaced

**Solutions:**

1. **Check variable names:**
   - Must be exact: `{date}`, `{time}`, etc.
   - Case sensitive

2. **Check when created:**
   - Variables replace when note created
   - Not when template viewed

3. **View variables reference:**
   - Run `Noted: Template Variables Reference`
   - See all available variables

## Getting Help

### Check Documentation

- [FAQ]({{ '/user/faq' | relative_url }}) - Frequently asked questions
- [Features]({{ '/features/' | relative_url }}) - All feature documentation
- [Configuration]({{ '/user/configuration' | relative_url }}) - Settings guide

### Report Issues

If problem persists:

1. **Check existing issues:**
   - [GitHub Issues](https://github.com/jsonify/noted/issues)
   - Search for similar problems

2. **Create new issue:**
   - Include VS Code version
   - Include Noted version
   - Describe steps to reproduce
   - Include error messages if any

3. **Include context:**
   - Operating system
   - Notes folder configuration
   - Other extensions installed

### General Tips

**When troubleshooting:**
1. Try reloading VS Code window first
2. Check console for error messages
3. Try with other extensions disabled
4. Test in clean workspace
5. Verify settings are correct

**Preventive measures:**
- Keep VS Code updated
- Keep Noted updated
- Back up notes regularly
- Use version control if possible

---

[← Back: Search & Filter]({{ '/user/search-filter' | relative_url }}) | [Next: FAQ →]({{ '/user/faq' | relative_url }})
