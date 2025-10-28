# Noted Extension v1.31.8 - Diagnostic Steps

## Problem
After updating to v1.31.8, all tree panels show "There is no data provider registered" or welcome screens, even though notes existed before the update.

## Quick Fix (Try This First)

###  Step 1: Reload VS Code Window
1. Press `Cmd+Shift+P`
2. Type "Developer: Reload Window"
3. Press Enter
4. Wait 10 seconds for extension to activate
5. Check if panels load

If that doesn't work, continue below...

---

## Step 2: Check Developer Console for Errors

1. Press `Cmd+Shift+P`
2. Type "Developer: Toggle Developer Tools"
3. Click on the **Console** tab
4. Look for RED ERROR messages starting with `[NOTED]` or containing "noted"
5. Copy any errors you see

**Common errors to look for:**
- `Cannot read property 'X' of undefined`
- `Failed to activate extension`
- `No workspace folder`
- `DiagramService` errors

---

## Step 3: Check Extension is Actually Installed

1. Press `Cmd+Shift+X` (Extensions view)
2. Search for "Noted"
3. **Verify it shows version 1.31.8**
4. If it shows 1.31.7 or older → Run `./rebuild-and-install.sh` again

---

## Step 4: Check Notes Folder Configuration

Open VS Code settings and check:

1. Press `Cmd+,` to open Settings
2. Search for "noted.notesFolder"
3. **What does it say?**
   - If it shows a path (like `/Users/you/Notes`) → Good!
   - If it's empty or says "Notes" → That's your issue!

**Fix:**
1. Click "Edit in settings.json"
2. Find the `"noted.notesFolder"` line
3. Make sure it has an **absolute path**, like:
   ```json
   "noted.notesFolder": "/Users/jruecke/WorkNotes/Notes"
   ```
4. Save and reload VS Code

---

## Step 5: Verify Notes Folder Exists

Open Terminal and run:
```bash
# Replace with YOUR notes path from Step 4
ls -la "/Users/jruecke/WorkNotes/Notes"
```

**Expected output:** Should list your year folders (2025, 2024, etc.)

**If you get "No such file or directory":**
- Your notes folder moved or was deleted
- The path in settings is wrong
- You need to reconfigure the notes folder location

---

## Step 6: Check Workspace Configuration

The extension requires a workspace to be open.

1. Go to File → Open Folder (not just files)
2. Open the folder that CONTAINS your Notes folder
3. Reload VS Code
4. Check if panels load

---

## Step 7: Nuclear Option - Clean Reinstall

If nothing else works:

```bash
cd /Users/jruecke/personal/VSCode/Plugins/noted

# 1. Completely uninstall
code --uninstall-extension jsonify.noted

# 2. Clear VS Code extension cache
rm -rf ~/.vscode/extensions/jsonify.noted-*

# 3. Checkout previous working version
git checkout v1.31.7
./rebuild-and-install.sh

# 4. Test if v1.31.7 works
# (Reload VS Code and check)

# 5. If v1.31.7 works, that confirms v1.31.8 has a bug
# If v1.31.7 ALSO doesn't work, it's a configuration issue
```

---

## What Changed in v1.31.8?

The PR #43 made these changes:
1. Removed 50+ `console.log` statements (just cleaner logging)
2. Changed `DiagramService` constructor to require `ExtensionContext`
3. Improved error handling in extension warnings
4. Added "Create Anyway" and "Don't Ask Again" to diagram extension prompts

**None of these should break tree providers or notes access.**

---

## Most Likely Causes

Based on the screenshot showing welcome screens:

### Theory 1: Configuration Lost
- The `noted.notesFolder` setting got cleared during update
- **Fix:** Reconfigure it in settings

### Theory 2: Extension Not Fully Activated
- VS Code didn't reload after installation
- **Fix:** Reload window

### Theory 3: DiagramService Constructor Error
- The new `DiagramService(context)` constructor is throwing an error
- This could crash the entire activation function
- **Fix:** Check developer console for errors

### Theory 4: Workspace Issue
- No workspace folder is open
- Extension can't find notes without a workspace context
- **Fix:** Open a workspace folder

---

## Report Back

Please run through these steps and report:
1. What does Step 4 show for your `noted.notesFolder` setting?
2. What errors appear in Step 2 (Developer Console)?
3. Does Step 7 (reverting to v1.31.7) make it work again?

This will help pinpoint whether it's:
- **A bug in v1.31.8 code** (needs hotfix)
- **A configuration issue** (needs settings update)
- **An installation issue** (needs clean reinstall)
