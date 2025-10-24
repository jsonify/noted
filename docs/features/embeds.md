---
layout: default
title: Note and Image Embeds
parent: Features
nav_order: 7
---

# Note and Image Embeds

Embed content from other notes and display images directly in your notes, creating a seamless way to reference and include information without duplicating content.

## Overview

Embeds allow you to include content directly in your notes:
- **Note embeds**: Include the entire content of a note or specific sections inline
- **Image embeds**: Display images from your workspace or file system

Unlike links which require clicking to view, embeds show the content directly in your editor.

## Basic Embed Syntax

### Embed Entire Notes

Embed the full content of another note using the `![[note-name]]` syntax:

```
Meeting Agenda
==================================================

![[standard-meeting-template]]

## Today's Topics
- Project updates
- Q4 planning
```

The exclamation mark `!` before the brackets converts a link into an embed. When you save or view the note, the content of `standard-meeting-template` appears inline.

### Visual Indicators

Embeds show a 📄 icon next to them to indicate they're actively embedding content:

```
![[template]] 📄
```

Hover over the icon to see a preview of the embedded content.

## Embed Specific Sections (v1.17.0)

### Section Syntax

Embed only a specific section of a note using the hash `#` symbol:

```
![[meeting-notes-2025-10-19#Action Items]]
![[design-doc#Architecture Overview]]
![[research-notes#Key Findings]]
```

**Syntax:** `![[note-name#Section Title]]`

### How Sections Are Identified

Noted recognizes two types of section headings:

#### Markdown Headings

Any markdown heading from H1 to H6:

```markdown
# Main Heading
## Sub Heading
### Sub-Sub Heading
```

#### Text-Style Headings

Headings followed by a colon:

```
Problem:
This is the problem statement.

Solution:
This is the solution.
```

### Section Matching

Section matching is **case-insensitive** and matches the heading text exactly:

```
![[notes#action items]]     → Matches "Action Items"
![[notes#ACTION ITEMS]]     → Matches "Action Items"
![[notes#Action Items]]     → Matches "Action Items"
```

### Nested Sections

When you embed a section, all nested subsections are included:

**Source note `design-doc.md`:**
```markdown
## Architecture

### Frontend
React with TypeScript

### Backend
Node.js with Express

## Deployment

### Production
AWS infrastructure
```

**Embed:** `![[design-doc#Architecture]]`

**Result includes:**
- The "Architecture" heading
- The "Frontend" subsection and its content
- The "Backend" subsection and its content
- Stops at "Deployment" (same level heading)

## Embed with Display Text

Customize how the embed appears in your note:

```
![[template|Standard Meeting Format]]
![[research-notes#Findings|Key Research Results]]
```

**Syntax:** `![[note-name#section|Custom Display Text]]`

The display text appears in place of the embed syntax when rendered, but the actual embedded content comes from the target note/section.

## Hover Previews

### Preview Embedded Content

Hover over any embed to see:
- The note name and section being embedded
- Preview of the content (first 15 lines)
- Available sections in the target note
- Link to open the source note

**Example hover preview:**

```
📄 Embedding: design-doc → Architecture

---
## Architecture

### Frontend
React with TypeScript and modern hooks
...

---

Available sections:
- Main Heading
- Architecture
- Deployment
- Testing Strategy

[Open note →]
```

### Section Not Found

If you reference a non-existent section, you'll see a warning:

```
![[notes#Nonexistent Section]] ⚠️
```

**Hover shows:**
- Warning that section wasn't found
- List of available sections
- Suggestion to update the section name

## Inline Decorations

### Visual Feedback

Embeds show real-time visual feedback in the editor:

- **📄 Green icon**: Valid embed, content found
- **⚠️ Yellow icon**: Note found, but section not found
- **❌ Red icon**: Note not found or error loading

### Content Preview

Hover over the decoration icon to see:
- Note name and section (if specified)
- First 20 lines of embedded content
- Truncated lines shown with `…` indicator
- Total content may be limited for performance

## Practical Examples

### Meeting Template with Embedded Standards

```
Meeting Notes - October 22, 2025
==================================================

![[meeting-template#Agenda Structure]]

## Attendees
- John
- Sarah
- Mike

![[meeting-template#Action Items Format]]

## Notes
Discussion about Q4 planning...
```

### Research Compilation

```
Literature Review
==================================================

## Key Papers

![[paper-smith-2024#Abstract]]

![[paper-jones-2024#Methodology]]

![[paper-williams-2024#Conclusions]]

## Synthesis
Based on the above findings...
```

### Technical Documentation

```
API Implementation Guide
==================================================

## Authentication Flow

![[auth-spec#OAuth Implementation]]

## Error Handling

![[error-handling-guide#Standard Error Responses]]

## Rate Limiting

![[api-policies#Rate Limits]]
```

### Project Status Dashboard

```
Project Alpha - Status
==================================================

## Current Sprint

![[sprint-planning#Sprint Goals]]

## Blockers

![[daily-standup-2025-10-22#Blockers]]

## Upcoming

![[roadmap#Q4 Milestones]]
```

## Best Practices

### When to Use Embeds vs Links

**Use Embeds When:**
- You want content visible without clicking
- Creating aggregation/dashboard notes
- Building composite documents from reusable sections
- Content needs to be inline for context

**Use Links When:**
- Content is supplementary/optional
- You want to keep notes focused and concise
- Avoiding too much visual clutter
- Linking to entire documents for reference

### Organizing for Embeds

**Create Reusable Sections:**

```markdown
# Templates

## Meeting Agenda Template

1. Review action items from last meeting
2. New business
3. Open discussion
4. Action items

## Standard Footer

---
Next Steps: Schedule follow-up
Questions: Contact team lead
```

Then embed specific sections:
```
![[templates#Meeting Agenda Template]]
![[templates#Standard Footer]]
```

**Modular Documentation:**

Break large documents into logical sections that can be embedded independently:

```
api-guide.md
  # Authentication
  # Endpoints
  # Error Codes
  # Rate Limiting

security-policy.md
  # Password Requirements
  # 2FA Setup
  # API Key Management
```

### Performance Considerations

**Limit Embed Depth:**
- Avoid embedding notes that themselves contain many embeds
- Deep nesting can slow down rendering
- Keep embed chains to 2-3 levels maximum

**Section Size:**
- Embedding specific sections is faster than full notes
- Large embedded notes may take longer to render
- Consider breaking very large notes into smaller ones

**Refresh Behavior:**
- Embeds update when you save the source note
- Embeds update when you edit the target note
- Changes appear in real-time as you type

## Troubleshooting

### Embed Not Showing Content

**Check:**
1. Is the note name spelled correctly?
2. Does the note exist in your workspace?
3. Is the section name exact (case-insensitive)?
4. Check the hover preview for error details

### Section Not Found

**Solutions:**
1. Hover over the embed to see available sections
2. Verify the heading exists in the target note
3. Check heading syntax (markdown `#` or text `:` format)
4. Ensure section name matches exactly (spaces, punctuation)

### Embed Shows Old Content

**Refresh:**
1. Save both the target note and embedding note
2. VS Code should auto-refresh decorations
3. If needed, close and reopen the file
4. Or reload VS Code window (`Cmd+Shift+P` → "Reload Window")

### Performance Issues

**If embeds slow down the editor:**
1. Reduce number of embeds per note (< 10 recommended)
2. Embed specific sections instead of full notes
3. Break up very large notes
4. Disable decorations temporarily if needed

## Keyboard Shortcuts

### Quick Embed Creation

1. Copy note name
2. Type `![[`
3. Paste note name
4. Type `]]`

Or use link autocomplete:
1. Type `![[`
2. Start typing note name
3. Select from autocomplete
4. Add `#section` if needed

### Navigate to Embedded Content

1. Hover over embed
2. Click "Open note →" link
3. Note opens in editor
4. Optionally use split view for side-by-side

## Tips & Tricks

### Dynamic Content Aggregation

Create dashboard notes that pull in dynamic content:

```
Daily Dashboard
==================================================

![[today#Weather]]
![[calendar#Today's Meetings]]
![[tasks#High Priority]]
![[standup#Yesterday's Progress]]
```

Update source notes, and dashboard automatically reflects changes.

### Template Library

Build a library of reusable sections:

```
templates/
  meeting-templates.md
    # Standup Format
    # Retro Format
    # Planning Format
  email-templates.md
    # Introduction
    # Follow-up
    # Thank You
```

Embed any template on demand:
```
![[meeting-templates#Standup Format]]
```

### Documentation Assembly

Combine multiple source documents into a master doc:

```
Complete API Documentation
==================================================

![[api-intro#Overview]]
![[authentication#Getting Started]]
![[endpoints#REST API]]
![[examples#Common Use Cases]]
![[troubleshooting#FAQ]]
```

Maintain each section independently, but present as cohesive whole.

### Version History with Embeds

Reference historical versions:

```
Project Evolution
==================================================

## Phase 1
![[design-v1#Core Concept]]

## Phase 2
![[design-v2#Enhanced Features]]

## Current
![[design-v3#Final Implementation]]
```

## Advanced Usage

### Conditional Embeds

While embeds are static, you can create multiple template notes and choose which to embed:

```
# For new projects
![[onboarding-full]]

# For experienced team members
![[onboarding-quick-start]]
```

### Cross-Project References

If you have multiple workspaces:

```
# In Project A
![[../project-b/shared-standards#Coding Style]]
```

Note: Path-based embeds work with relative paths to other workspace folders.

### Embed Chains

Embeds can reference notes that contain embeds:

**Note A:**
```
![[note-b]]
```

**Note B:**
```
![[note-c#Section]]
```

Result: Note A shows content from Note C's section via Note B.

⚠️ **Warning:** Keep chains short for performance.

## Image Embeds (v1.17.0)

### Overview

Display images directly in your notes using the same embed syntax with image file paths. Images appear inline with hover previews showing the full image and metadata.

### Basic Image Syntax

Embed an image using `![[image-path]]`:

```
![[photo.png]]
![[screenshot.jpg]]
![[diagram.svg]]
```

The exclamation mark `!` before the brackets creates an embed. Noted automatically detects image files by extension.

### Supported Image Formats

- **PNG** - `.png`
- **JPEG** - `.jpg`, `.jpeg`
- **GIF** - `.gif` (animated and static)
- **SVG** - `.svg` (vector graphics)
- **WebP** - `.webp` (modern format)
- **BMP** - `.bmp` (bitmap)
- **ICO** - `.ico` (icons)

### Image Path Options

#### Relative to Current Note

Reference images relative to the note's location:

```
![[./images/screenshot.jpg]]
![[../assets/logo.png]]
![[images/diagram.svg]]
```

#### Workspace-Relative Paths

Reference images from workspace root:

```
![[assets/banner.png]]
![[docs/images/architecture.svg]]
![[screenshots/demo.jpg]]
```

#### Absolute Paths

Use full file system paths:

```
![[/Users/username/Pictures/photo.jpg]]
![[C:\Users\username\Pictures\photo.jpg]]
```

### Image Captions

Add descriptive text using the display text syntax:

```
![[screenshot.png|Login Screen]]
![[diagram.svg|System Architecture]]
![[chart.png|Q4 Sales Data]]
```

The caption appears when hovering over the image embed.

### Visual Indicators

Image embeds show a 🖼️ icon to distinguish them from note embeds (📄):

```
![[photo.jpg]] 🖼️
![[meeting-notes]] 📄
```

### Hover Previews

Hover over any image embed to see:
- **Full image preview**: VS Code renders the image inline
- **File information**: Complete file path
- **File size**: Size in KB
- **Dimensions**: Width × height (when available)

**Example hover preview:**

```
🖼️ Image: screenshot.png

[Image rendered inline]

---

File info:
- Path: `/Users/me/workspace/images/screenshot.png`
- Size: 342.5 KB
- Dimensions: 1920 × 1080
```

### Smart Path Resolution

Noted searches for images in this order:

1. **Absolute path**: If path starts with `/` or drive letter, use directly
2. **Relative to note**: Search in note's directory and subdirectories
3. **Workspace folders**: Search all workspace folders

This allows flexibility in organizing your images while maintaining simple embed syntax.

### Practical Examples

#### Documentation with Screenshots

```markdown
Installation Guide
==================================================

## Step 1: Download

Visit our website and click Download.

![[./screenshots/download-page.png|Download Page]]

## Step 2: Install

Run the installer and follow the prompts.

![[./screenshots/installer.png|Installation Wizard]]

## Step 3: Launch

Open the application from your Applications folder.

![[./screenshots/app-icon.png|Application Icon]]
```

#### Design Documentation

```markdown
UI Design Specs
==================================================

## Color Palette

![[./assets/color-palette.png|Brand Colors]]

## Typography

![[./assets/fonts.png|Font Hierarchy]]

## Component Library

### Buttons
![[./components/buttons.png|Button Styles]]

### Forms
![[./components/forms.png|Form Elements]]
```

#### Meeting Notes with Diagrams

```markdown
Architecture Review Meeting
==================================================
Date: October 22, 2025

## System Overview

![[./diagrams/system-architecture.svg|Current Architecture]]

## Proposed Changes

![[./diagrams/new-architecture.svg|Proposed Architecture]]

## Database Schema

![[./diagrams/db-schema.png|Database Design]]
```

#### Research Notes with Charts

```markdown
Data Analysis - Q4 2025
==================================================

## Sales Trends

![[./charts/sales-q4.png|Q4 Sales by Region]]

## User Growth

![[./charts/user-growth.png|Monthly Active Users]]

## Performance Metrics

![[./charts/performance.png|System Performance]]
```

### Organizing Images

#### Recommended Folder Structure

```
workspace/
  notes/
    2025/
      10-October/
        meeting-notes.md
    images/
      screenshots/
      diagrams/
      charts/
  assets/
    logos/
    icons/
```

#### Using a Dedicated Images Folder

Create an `images` folder next to your notes:

```
![[./images/photo.jpg]]
![[images/diagram.svg]]
```

Or organize by type:

```
images/
  screenshots/
  diagrams/
  photos/
  charts/
```

Then reference:
```
![[./images/screenshots/app.png]]
![[./images/diagrams/flow.svg]]
```

### Best Practices

#### When to Use Image Embeds

**Use Image Embeds For:**
- Screenshots in documentation
- Diagrams and flowcharts
- Data visualizations and charts
- UI/UX mockups
- Before/after comparisons
- Process illustrations

**Consider Alternatives For:**
- Very large images (> 5MB) - use links instead
- Many images in one note (> 20) - split into multiple notes
- Images that change frequently - reference by URL

#### Image Optimization

**For Best Performance:**
- Compress images before embedding
- Use appropriate formats (PNG for screenshots, JPG for photos, SVG for diagrams)
- Keep individual images under 2MB when possible
- Use SVG for diagrams that need to scale

**File Size Guidelines:**
- Screenshots: 100-500 KB (PNG)
- Photos: 200-800 KB (JPG at 80% quality)
- Diagrams: < 100 KB (SVG preferred)
- Charts: 50-200 KB (PNG)

#### Naming Conventions

Use descriptive, consistent names:

```
✓ Good:
  login-screen-mockup.png
  user-flow-diagram.svg
  q4-sales-chart.png

✗ Avoid:
  IMG_1234.jpg
  screenshot.png
  diagram1.svg
```

### Troubleshooting

#### Image Not Displaying

**Check:**
1. File path is correct (case-sensitive on some systems)
2. Image file exists at the specified location
3. Image format is supported
4. File has read permissions
5. Check hover preview for specific error

#### Image Shows ⚠️ Warning Icon

**Possible causes:**
- File not found at specified path
- Invalid image format
- File permissions issue
- Path resolution failed

**Solutions:**
1. Hover to see specific error message
2. Verify file exists: `ls /path/to/image.png`
3. Try absolute path as test
4. Check file extension is correct

#### Performance Issues

**If many images slow down the editor:**
1. Reduce images per note (< 15 recommended)
2. Optimize/compress image files
3. Split notes with many images
4. Use image links instead of embeds for some images

#### Path Resolution Not Working

**Debug steps:**
1. Try absolute path first to verify image displays
2. Check workspace folders are configured correctly
3. Verify relative path from note location
4. Use `./` prefix for relative paths to be explicit

### Mixing Note and Image Embeds

Combine both types seamlessly:

```markdown
Project Status Report
==================================================

## Overview

![[project-summary]]

## Architecture

![[./diagrams/system-architecture.svg|System Diagram]]

## Implementation Details

![[implementation-notes#Core Features]]

## Screenshots

![[./screenshots/login-page.png|New Login UI]]
![[./screenshots/dashboard.png|Updated Dashboard]]

## Next Steps

![[roadmap#Q4 Goals]]
```

### Tips & Tricks

#### Quick Image Embed

1. Copy image to your workspace
2. Type `![[`
3. Start typing filename
4. Add `]]`
5. Optional: Add `|caption`

#### Organize by Date

Match note organization:

```
notes/
  2025/
    10-October/
      meeting-notes.md
      images/
        meeting-diagram.svg
        whiteboard-photo.jpg
```

Reference: `![[./images/meeting-diagram.svg]]`

#### Shared Assets Folder

Create workspace-level assets:

```
workspace/
  assets/
    logos/
    templates/
  notes/
```

All notes can reference: `![[assets/logos/company-logo.png]]`

#### Version Control

For Git repositories:
- Commit images with notes
- Use `.gitignore` for very large images
- Consider Git LFS for large binary files
- Keep total repo size reasonable

---

[← Back to Features]({{ '/features/' | relative_url }}) | [Next: Wiki Links →]({{ '/features/wiki-links' | relative_url }})
