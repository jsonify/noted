# Noted Extension - Verification Checklist

After installing v1.31.8, please verify the following:

## 🔄 First: Reload VS Code
1. Press `Cmd+Shift+P`
2. Type "Developer: Reload Window"
3. Press Enter

---

## ✅ Tree Views Verification

### 1. MY NOTES Panel
- [ ] Panel loads and shows content (not "no data provider" error)
- [ ] Can see your existing notes organized by year/month
- [ ] Notes are clickable and open correctly
- [ ] Can create new notes (click + icon)
- [ ] Can use context menu (right-click on a note)

### 2. TEMPLATES & RECENT Panel
- [ ] Panel loads correctly
- [ ] Shows template options (Problem/Solution, Meeting, Research, Quick)
- [ ] Can create notes from templates
- [ ] Recent notes appear if you have any

### 3. JOURNAL Panel
- [ ] Shows daily notes organized by date
- [ ] Can navigate through dates
- [ ] Can create today's note

### 4. DIAGRAMS Panel
- [ ] Panel loads correctly
- [ ] Shows "No diagrams yet!" message with Create button (if you don't have diagrams)
- [ ] OR shows your existing diagrams (if you have any)
- [ ] Can click "Create Draw.io Diagram" button
- [ ] Can click "Create Excalidraw Diagram" button

---

## 🎨 Diagram Functionality Tests

### Test 1: Create Draw.io Diagram
1. Click "Create Draw.io Diagram" in the Diagrams panel
2. **Expected:** Shows warning about Draw.io Integration extension with options:
   - "Install Extension"
   - "Create Anyway"
   - "Don't Ask Again"
   - "Dismiss"
3. Choose "Create Anyway" (or install extension if you want)
4. Enter a diagram name
5. **Expected:** Diagram file is created and appears in the Diagrams panel
6. **Expected:** Can click to open the diagram

### Test 2: Create Excalidraw Diagram
1. Click "Create Excalidraw Diagram" in the Diagrams panel
2. **Expected:** Shows warning about Excalidraw extension with options
3. Choose "Create Anyway" (or install extension if you want)
4. Enter a diagram name
5. **Expected:** Diagram file is created and appears in the Diagrams panel
6. **Expected:** Can click to open the diagram

### Test 3: Diagram Context Menu
1. Right-click on an existing diagram
2. **Expected:** Context menu shows:
   - "Open Diagram"
   - "Copy Embed Syntax"
   - "Rename Diagram"
   - "Delete Diagram"

### Test 4: Diagram Embeds
1. Create or open a note
2. Type `![[your-diagram-name.drawio]]`
3. Save the note
4. **Expected:** In the editor, you should see a link or preview of the diagram

---

## 🐛 Known Issues from v1.31.8

The changes in v1.31.8 included:
- ✅ Streamlined error handling (removed console.log spam)
- ✅ Better user prompts for missing extensions ("Create Anyway", "Don't Ask Again")
- ✅ DiagramService now requires ExtensionContext (for remembering user preferences)

### Potential Issues to Watch For:
- If tree views still show "no data provider" after reload → Configuration issue
- If diagram creation fails → Check the error message
- If "Don't Ask Again" doesn't persist → ExtensionContext not saving properly

---

## 📝 Quick Smoke Test

Run these commands in order:
1. `Cmd+Shift+N` - Open today's note
2. `Cmd+Shift+T` - Insert timestamp
3. `Cmd+K Cmd+N` - Open with template (choose Quick)
4. Create a diagram from the Diagrams panel
5. Embed that diagram in a note using `![[diagram-name.drawio]]`

If all 5 work, you're good to go! ✅

---

## 🆘 If Something Is Broken

### Option 1: Check VS Code Developer Console
1. Press `Cmd+Shift+P`
2. Type "Developer: Toggle Developer Tools"
3. Look for errors in the Console tab

### Option 2: Revert to Previous Version
```bash
cd /Users/jruecke/personal/VSCode/Plugins/noted
git log --oneline -10  # Find the commit before the problematic changes
git checkout <commit-hash>
./rebuild-and-install.sh
```

### Option 3: Get Help
- Check GitHub Issues: https://github.com/jsonify/noted/issues
- Or ask me for help debugging!

---

## 📊 What Changed in v1.31.8

The PR #43 "streamline error handling and user prompts" made these changes:
- Removed 50+ `console.log` statements (cleaner console)
- Changed silent error catches to inline comments
- Made diagram extension warnings interactive (not just dismissible)
- Added "Create Anyway" and "Don't Ask Again" options
- Fixed DiagramService to use ExtensionContext for state persistence

These changes should NOT break existing functionality - they only improve UX.
