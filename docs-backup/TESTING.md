# Testing Guide for Noted Extension

## Quick Start - Manual Testing

### Setup (Every Test Session)

1. **Compile the extension:**
   ```bash
   pnpm run compile
   ```

2. **Launch Extension Development Host:**
   - Press `F5` in VS Code (or Run > Start Debugging)
   - A new VS Code window opens titled "[Extension Development Host]"
   - Your extension is loaded in this window

3. **Set up a test workspace:**
   - In the Extension Development Host window: File > Open Folder
   - Choose a test folder (or create a new one)
   - The Noted icon appears in the Activity Bar (left sidebar)

---

## Development Workflow

### Watch Mode (Recommended)

For active development, use watch mode to auto-compile on file changes:

```bash
# In your terminal
pnpm run watch
```

Then:
1. Press `F5` to launch Extension Development Host
2. Make changes to .ts files
3. Files auto-compile when saved
4. Press `Cmd+R` (Mac) or `Ctrl+R` (Windows/Linux) in Extension Development Host to reload
5. Test your changes

---

## Manual Testing Checklist

### ✅ Initial Setup

- [ ] Extension Development Host launches without errors
- [ ] Noted icon appears in Activity Bar
- [ ] Clicking Noted icon shows two views: "Templates" and "My Notes"
- [ ] Welcome message appears in "My Notes" view
- [ ] "Use Default Location" button works
- [ ] "Choose Custom Location" button works
- [ ] Notes folder is created successfully

### ✅ Core Features

#### Daily Notes
- [ ] `Cmd+Shift+N` (Mac) / `Ctrl+Shift+N` (Windows) opens today's note
- [ ] Note is created in correct folder: `Notes/YYYY/MM-MonthName/YYYY-MM-DD.txt`
- [ ] Note has correct timestamp header
- [ ] Opening today's note again opens existing file (doesn't create duplicate)

#### Templates
- [ ] Clicking template buttons in Templates view works
  - [ ] Problem/Solution template
  - [ ] Meeting template
  - [ ] Research template
  - [ ] Quick template
- [ ] "Choose Template..." shows template picker
- [ ] Template note is created with format: `YYYY-MM-DD-HHMM-name.txt`
- [ ] All template placeholders are replaced correctly

#### Tree View
- [ ] Recent Notes section shows recent files (max 10)
- [ ] Year folders display (most recent first)
- [ ] Month folders display inside years (most recent first)
- [ ] Notes display inside months (most recent first)
- [ ] Custom folders appear at root level (alphabetically)
- [ ] Clicking a note opens it in editor
- [ ] Tree refreshes automatically after operations

### ✅ Calendar View

- [ ] Calendar icon in toolbar opens calendar webview
- [ ] Current month displays correctly
- [ ] Today's date is highlighted with border
- [ ] Days with notes are highlighted
- [ ] Navigation buttons work:
  - [ ] Previous month
  - [ ] Next month
  - [ ] Today (jumps to current month)
- [ ] Clicking a date shows notes for that day
- [ ] "Create New Note" button works
- [ ] Clicking a note in the list opens it
- [ ] "Create Another Note" button works when notes exist

### ✅ Folder Management

#### Create Custom Folder
- [ ] "Create Folder" toolbar button works
- [ ] Folder name validation works:
  - [ ] Empty names rejected
  - [ ] YYYY pattern rejected (e.g., "2025")
  - [ ] MM-MonthName pattern rejected (e.g., "01-January")
  - [ ] Valid names accepted
- [ ] Folder appears in tree view
- [ ] Folder can contain notes

#### Rename Folder
- [ ] Right-click on custom folder > "Rename Folder" works
- [ ] Same validation as create
- [ ] Folder renamed successfully
- [ ] Error shown if new name already exists
- [ ] Year/month folders cannot be renamed

#### Delete Folder
- [ ] Right-click on custom folder > "Delete Folder" works
- [ ] Confirmation dialog appears
- [ ] Folder and contents deleted
- [ ] Year/month folders cannot be deleted

### ✅ Note Management

#### Move Note
- [ ] Right-click note > "Move Note to Folder" shows folder picker
- [ ] Note moves to selected folder
- [ ] Error shown if file already exists in destination
- [ ] Works for custom folders
- [ ] Works for month folders

#### Drag and Drop
- [ ] Can drag a single note to another folder
- [ ] Can drag multiple selected notes
- [ ] Drop on month folder works
- [ ] Drop on custom folder works
- [ ] Drop on another note moves to that note's parent folder
- [ ] Cannot drop on year folder (error shown)
- [ ] Cannot drop on sections (error shown)
- [ ] Cannot drop on root (error shown)
- [ ] Duplicate file error shown appropriately

#### Rename Note
- [ ] Right-click note > "Rename Note" works
- [ ] Note renamed successfully
- [ ] File extension preserved

#### Duplicate Note
- [ ] Right-click note > "Duplicate Note" works
- [ ] New file created with "-copy" suffix
- [ ] Content matches original

#### Delete Note
- [ ] Right-click note > "Delete Note" shows confirmation
- [ ] Clicking "Delete" removes the note
- [ ] Clicking "Cancel" keeps the note
- [ ] Tree updates after deletion

#### Other Note Actions
- [ ] Copy Path: Copies file path to clipboard
- [ ] Show in System Explorer: Opens file location in Finder/Explorer

### ✅ Search & Export

#### Search
- [ ] Search toolbar button opens search input
- [ ] Entering query finds matching notes
- [ ] Shows preview of matching line
- [ ] Clicking result opens the note
- [ ] "No results found" message when appropriate

#### Statistics
- [ ] Stats toolbar button shows:
  - [ ] Total notes count
  - [ ] Notes this week count
  - [ ] Notes this month count

#### Export
- [ ] Export toolbar button shows range picker
- [ ] "This Week" exports correctly
- [ ] "This Month" exports correctly
- [ ] "All Notes" exports correctly
- [ ] Exported file opens in editor
- [ ] Exported content is correct

### ✅ Settings & Configuration

#### Timestamps
- [ ] `Cmd+Shift+T` / `Ctrl+Shift+T` inserts timestamp `[HH:MM AM/PM]`
- [ ] Timestamp inserted at cursor position

#### File Format
- [ ] Command Palette > "Noted: Toggle File Format" switches .txt ↔ .md
- [ ] New notes use selected format
- [ ] Both .txt and .md files show in tree view

#### Move Notes Folder
- [ ] Command Palette > "Noted: Move Notes Folder"
- [ ] Folder picker appears
- [ ] All notes copied to new location
- [ ] Old folder removed
- [ ] Configuration updated
- [ ] Extension works with new location

#### Custom Templates
- [ ] "Create New Template" in Templates view works
- [ ] Template file created in `.noted-templates/`
- [ ] Template can be edited
- [ ] Template appears in template picker
- [ ] Template placeholders (`{filename}`, `{date}`, `{time}`) work
- [ ] "Open Templates Folder" reveals folder in system

---

## Debugging Tips

### Check Debug Console
In your main VS Code window (not Extension Development Host):
- View > Debug Console
- Look for `[NOTED DEBUG]` messages
- Check for errors or warnings

### Check Extension Host Output
In Extension Development Host window:
- View > Output
- Select "Extension Host" from dropdown
- Look for errors from your extension

### Common Issues

**Extension doesn't activate:**
- Check if `activate()` function is called
- Look for TypeScript compilation errors
- Verify `activationEvents` in package.json

**Commands don't appear:**
- Check command registration in extension.ts
- Verify commands are in package.json
- Try reloading Extension Development Host (Cmd+R)

**Tree view empty:**
- Check Debug Console for errors
- Verify notes folder configuration
- Try "Setup Default Folder" command

**File operations fail:**
- Check file permissions
- Verify paths are absolute
- Look for async/await errors in Debug Console

---

## Testing Modular Code

Since the code is now modular, you can test individual modules:

### Utils Testing
Test validators, date helpers, folder helpers independently:
- Create test files with edge cases
- Call functions directly with various inputs
- Verify outputs

### Services Testing
Test file system, config, notes, templates:
- Mock VS Code APIs where needed
- Test error handling
- Verify async operations complete

### Providers Testing
Test tree view providers:
- Verify getChildren returns correct items
- Test drag and drop logic
- Check context values

### Calendar Testing
Test calendar helpers and view:
- Test date calculations
- Verify note detection
- Check HTML generation

---

## Recommended Testing Flow

1. **After each code change:**
   - Save file (watch mode auto-compiles)
   - Reload Extension Development Host (Cmd+R)
   - Test the specific feature you changed

2. **Before committing:**
   - Run full compile: `pnpm run compile`
   - Do a fresh F5 launch
   - Test core workflows (create note, search, calendar)
   - Check for any console errors

3. **Before releasing:**
   - Go through entire manual testing checklist
   - Test on a fresh workspace
   - Test with both .txt and .md formats
   - Test with empty notes folder
   - Test with many notes (100+)

---

## Next Steps: Automated Testing

To add automated tests:

1. Install test dependencies:
   ```bash
   pnpm add -D @vscode/test-electron mocha @types/mocha
   ```

2. Create test files in `src/test/`

3. Add test script to package.json:
   ```json
   "test": "node ./out/test/runTest.js"
   ```

4. Write unit tests for utils, services, and providers

See VS Code extension testing docs: https://code.visualstudio.com/api/working-with-extensions/testing-extension
