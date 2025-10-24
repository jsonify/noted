---
layout: default
title: Installation
parent: User Guide
nav_order: 1
---

# Installation

Get Noted up and running in your VS Code workspace in just a few minutes.

## Installing from VS Code Marketplace

### Method 1: VS Code Extensions View

The easiest way to install Noted:

1. **Open VS Code**
2. **Click the Extensions icon** in the Activity Bar (or press `Cmd+Shift+X` on Mac, `Ctrl+Shift+X` on Windows/Linux)
3. **Search for "Noted"** in the search box
4. **Look for "Noted" by jsonify**
5. **Click Install**

The extension installs automatically and activates when ready.

### Method 2: Command Palette

Install via command:

1. **Open Command Palette** (`Cmd+Shift+P` or `Ctrl+Shift+P`)
2. **Type "Extensions: Install Extensions"**
3. **Search for "Noted"**
4. **Click Install** on "Noted" by jsonify

### Method 3: Marketplace Website

Install from your browser:

1. **Visit** [marketplace.visualstudio.com](https://marketplace.visualstudio.com/items?itemName=jsonify.noted)
2. **Click "Install"** button
3. **Browser prompts** to open VS Code
4. **Allow** the action
5. **VS Code opens** and installs the extension

## Initial Setup

After installing, set up your notes folder:

### Quick Setup (Recommended)

Use the default notes folder in your home directory:

1. **Open Command Palette** (`Cmd+Shift+P`)
2. **Run "Noted: Setup Default Folder"**
3. **Confirm** the default location (usually `~/Notes`)
4. **Notes folder created** automatically

This creates a `Notes` folder in your home directory that works across all workspaces.

### Custom Setup

Choose a custom location for your notes:

1. **Open Command Palette**
2. **Run "Noted: Setup Custom Folder"**
3. **Folder picker opens**
4. **Select or create** your preferred folder
5. **Confirm** selection

This is useful if you want notes in a specific project directory or synced folder (Dropbox, Google Drive, etc.).

## Verifying Installation

Check that Noted is working:

### Open the Sidebar

1. **Look for the Noted icon** in the Activity Bar (notebook icon)
2. **Click the icon** to open the Noted sidebar
3. **You should see**:
   - Templates view
   - My Notes view
   - Connections view
   - Tags view

### Create Your First Note

Test the extension:

1. **Press `Cmd+Shift+N`** (Mac) or `Ctrl+Shift+N`** (Windows/Linux)
2. **Or run "Noted: Open Today's Note"** from Command Palette
3. **Today's note opens** in the editor
4. **Type something** and save

If this works, Noted is successfully installed!

## Configuration

Customize Noted to your preferences:

### Access Settings

1. **Open Settings** (`Cmd+,` or `Ctrl+,`)
2. **Search for "Noted"**
3. **Adjust settings** as needed

### Key Settings

**Notes Folder**
- `noted.notesFolder`: Path to your notes directory
- Set during initial setup, can be changed later

**File Format**
- `noted.fileFormat`: Choose "txt" or "md"
- Default: "md" (Markdown)
- Affects new notes only

**Tag Autocomplete**
- `noted.tagAutoComplete`: Enable/disable tag suggestions
- Default: true (enabled)

**Auto-Backlinks**
- `noted.autoBacklinks`: Automatically append backlinks sections to notes
- Default: true (enabled)

[See full Configuration Guide]({{ '/user/configuration' | relative_url }})

## Updating Noted

VS Code automatically updates extensions by default.

### Manual Update

Update to the latest version:

1. **Open Extensions view** (`Cmd+Shift+X`)
2. **Search for "Noted"**
3. **If update available**: "Update" button appears
4. **Click "Update"**
5. **Reload VS Code** if prompted

### Check Version

See which version you have:

1. **Extensions view** → Search "Noted"
2. **Version number** shown below extension name
3. **Or** check `package.json` in extension folder

## Uninstalling Noted

If you need to remove Noted:

### Uninstall Steps

1. **Extensions view** (`Cmd+Shift+X`)
2. **Find "Noted"**
3. **Click gear icon** → "Uninstall"
4. **Reload VS Code** when prompted

### Your Notes Are Safe

Uninstalling the extension does NOT delete your notes:
- Your notes folder remains intact
- All `.txt` and `.md` files are preserved
- You can reinstall anytime and continue where you left off

### Clean Removal

To completely remove Noted and its data:

1. **Uninstall** the extension (steps above)
2. **Delete notes folder** (if desired)
3. **Delete settings**: Open Settings → Search "Noted" → Remove settings

## Troubleshooting Installation

### Extension Won't Install

**Check:**
- VS Code version (requires 1.80.0 or higher)
- Internet connection is working
- Marketplace access isn't blocked by firewall
- Enough disk space available

**Solution:**
- Update VS Code to latest version
- Retry installation
- Install from marketplace website instead
- Check VS Code logs for errors

### Notes Folder Not Created

**Issue:** Setup commands don't create folder

**Solutions:**
- Verify folder location has write permissions
- Choose different location with "Setup Custom Folder"
- Manually create folder and set path in settings
- Check VS Code output panel for errors

### Extension Icon Missing

**Issue:** Can't find Noted in Activity Bar

**Solutions:**
- Right-click Activity Bar → "Reset Activity Bar Locations"
- Check in "Views" menu → Look for "Noted"
- Disable/re-enable extension
- Reload VS Code

### Commands Not Available

**Issue:** "Noted: ..." commands don't appear

**Solutions:**
- Ensure extension is enabled (Extensions view)
- Reload VS Code window (`Cmd+Shift+P` → "Reload Window")
- Check for extension errors (Output panel → Noted)
- Reinstall extension

## Next Steps

Now that Noted is installed:

1. **[Quick Start]({{ '/user/getting-started' | relative_url }})** - Create your first notes
2. **[Configuration]({{ '/user/configuration' | relative_url }})** - Customize settings
3. **[Daily Workflow]({{ '/user/daily-workflow' | relative_url }})** - Learn daily note-taking patterns

---

[← Back to User Guide]({{ '/user/' | relative_url }}) | [Next: Configuration →]({{ '/user/configuration' | relative_url }})
