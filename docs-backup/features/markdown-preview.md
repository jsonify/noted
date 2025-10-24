---
layout: default
title: Markdown Preview
parent: Features
nav_order: 14
---

# Markdown Preview

Live markdown rendering with side-by-side editing and preview.

## Overview

The Markdown Preview feature provides real-time rendering of your markdown notes. See your formatted content as you type with automatic updates, perfect for viewing headings, lists, links, images, and all markdown formatting.

## Opening Markdown Preview

There are multiple ways to open the preview:

### Editor Toolbar Button

The easiest way to toggle preview:

1. Open any `.md` file in the editor
2. Look for the preview icon in the editor toolbar (top-right)
3. Click the preview icon
4. Preview opens in a split view

### Command Palette

Use the command:

- **Command**: `Noted: Toggle Markdown Preview`
- **Keyboard Shortcut**: `Cmd+K Cmd+V` (Mac) or `Ctrl+K Ctrl+V` (Windows/Linux)

### Automatic Availability

The preview feature:

- Only available for `.md` (markdown) files
- Not available for `.txt` files
- Editor button only appears when a markdown file is active

## Preview Modes

### Side-by-Side View

Default mode shows both editor and preview:

- **Left pane**: Your markdown source code
- **Right pane**: Rendered preview
- **Synchronized scrolling**: Preview scrolls as you edit (VS Code standard behavior)
- **Live updates**: Preview updates as you type

This is ideal for:

- Writing while seeing results
- Checking formatting in real-time
- Learning markdown syntax
- Verifying links and images render correctly

### Preview Only

You can also open preview only:

1. Toggle preview with source open
2. Close the source editor pane
3. Preview remains open for reading

Useful for:

- Reading finished notes
- Presenting notes to others
- Focusing on content without source code

## Auto-Update

The preview updates automatically:

- **Real-time**: Updates as you type (with slight delay)
- **No manual refresh**: No need to save or refresh
- **Incremental**: Only changed sections re-render
- **Efficient**: Minimal performance impact

Just type and see results immediately.

## Supported Markdown Features

The preview renders all standard markdown:

### Text Formatting

- **Bold**: `**bold**` or `__bold__`
- *Italic*: `*italic*` or `_italic_`
- ~~Strikethrough~~: `~~strikethrough~~`
- `Code`: `` `code` ``

### Headings

```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
```

### Lists

**Unordered**:
```markdown
- Item 1
- Item 2
  - Nested item
  - Another nested item
```

**Ordered**:
```markdown
1. First item
2. Second item
3. Third item
```

**Task lists**:
```markdown
- [ ] Unchecked task
- [x] Checked task
```

### Links

**Standard links**:
```markdown
[Link text](https://example.com)
```

**Wiki-style links** (rendered as plain text in preview):
```markdown
[[note-name]]
[[note-name|Display Text]]
```

**Note**: Wiki-style links are clickable in the editor but appear as plain text in preview. Use the editor view to navigate wiki links.

### Images

```markdown
![Alt text](path/to/image.png)
![Photo](https://example.com/photo.jpg)
```

Images are rendered inline in the preview.

### Code Blocks

**Inline code**: `` `code` ``

**Fenced code blocks**:
````markdown
```javascript
function hello() {
  console.log("Hello world");
}
```
````

With syntax highlighting based on language specified.

### Quotes

```markdown
> This is a blockquote
> It can span multiple lines
```

### Tables

```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
```

### Horizontal Rules

```markdown
---
***
___
```

## Preview Styling

The preview uses VS Code's built-in markdown rendering:

- **Theme-aware**: Respects your VS Code theme colors
- **Consistent**: Matches VS Code's markdown preview styling
- **Readable**: Optimized for readability

### Light vs. Dark Theme

Preview automatically adapts:

- **Light theme**: Black text on white background
- **Dark theme**: Light text on dark background
- **Contrast**: Optimized contrast ratios
- **Syntax highlighting**: Theme-appropriate code colors

## Typical Use Cases

### Writing Documentation

Create documentation with preview:

1. Open your `.md` note
2. Toggle preview (`Cmd+K Cmd+V`)
3. Write your documentation on the left
4. See formatted result on the right
5. Verify headings, lists, and links are correct

### Note Formatting Verification

Check your note formatting:

1. Open existing markdown note
2. Toggle preview
3. Scroll through to verify formatting
4. Fix any issues in the source
5. See corrections immediately in preview

### Creating Readable Notes

Format notes for readability:

1. Use headings to organize sections
2. Use lists for tasks and items
3. Use bold/italic for emphasis
4. Preview to ensure it looks good
5. Makes notes easier to scan later

### Sharing Notes

Prepare notes for sharing:

1. Write content in markdown
2. Use preview to verify appearance
3. Export or copy formatted content
4. Share with team members
5. Know it will look as expected

## Integration with Other Features

### Works with Templates

Markdown templates preview beautifully:

- Meeting templates show formatted agendas
- Research templates show structured sections
- Problem/solution templates show clear organization

### Works with Wiki-Style Links

Wiki links in preview:

- Appear as plain text `[[note-name]]`
- Click links in source editor to navigate
- Preview is for viewing, editor is for navigating

### Works with Tags

Tags in preview:

- Appear as plain text `#tagname`
- Still functional in the source editor
- Preview shows them in context

### Works with Embeds

Note embeds in preview:

- Embed syntax appears as plain text
- Actual embed rendering happens in editor view
- Preview is for markdown-only rendering

### Works with Daily Notes

Daily notes preview well:

- Headings organize daily sections
- Lists show tasks and notes
- Timestamps format nicely
- Links and tags visible in context

## Keyboard Shortcuts

### Toggle Preview

Default shortcut:
- **Mac**: `Cmd+K Cmd+V`
- **Windows/Linux**: `Ctrl+K Ctrl+V`

This is a two-step chord:
1. Press and release `Cmd+K`
2. Press `V`

### Custom Shortcuts

Assign a different shortcut:

1. Open Keyboard Shortcuts (`Cmd+K Cmd+S`)
2. Search for "Toggle Markdown Preview"
3. Assign your preferred shortcut

Suggested alternatives:
- `Cmd+Shift+V`: Quick single-key combo
- `Cmd+P Cmd+V`: Different chord

## Best Practices

### When to Use Preview

**Use preview for**:
- Writing new markdown notes
- Formatting complex content (tables, code blocks)
- Verifying final appearance
- Reading finished notes

**Don't need preview for**:
- Quick plain text notes
- Notes that don't use markdown formatting
- `.txt` files (not supported)

### Preview vs. Just Reading

**Open preview when**:
- Note has significant formatting
- You're actively writing markdown
- Sharing note and want to verify appearance

**Just read in editor when**:
- Note is mostly plain text
- You're familiar with markdown
- Quick reference lookup

### Organizing Workspace

Manage editor panes:

- **Close preview** when done writing
- **Keep preview open** for long writing sessions
- **Use split view** for active markdown work
- **Full editor** for non-markdown tasks

## Troubleshooting

### Preview button doesn't appear

**Cause**: File is not a markdown (.md) file

**Solution**: Only works with `.md` files. Convert `.txt` to `.md` or use markdown format in settings.

### Preview not updating

**Cause**: Rare rendering bug

**Solution**:
- Close preview and reopen
- Save file (`Cmd+S`)
- Restart VS Code if issue persists

### Preview shows wrong content

**Cause**: Different file in preview pane

**Solution**: Close preview and toggle it again from the correct file

### Preview formatting looks wrong

**Cause**: Invalid markdown syntax

**Solution**: Check markdown syntax in editor. Common issues:
- Missing closing backticks on code blocks
- Incorrect list indentation
- Broken table syntax

### Images don't show in preview

**Cause**: Incorrect image path

**Solution**:
- Verify image path is correct
- Use relative paths from note location
- Check image file exists

### Can't close preview pane

**Cause**: Normal editor pane behavior

**Solution**: Click the X on the preview tab, or use `Cmd+W` to close the active pane

## Tips & Tricks

### Learn Markdown Faster

Use preview to learn markdown:

1. Try markdown syntax in editor
2. See result immediately in preview
3. Iterate until you get desired result
4. Build markdown skills quickly

### Quick Formatting Checks

Before closing a note:

1. Toggle preview
2. Quickly scan formatted output
3. Fix any formatting issues
4. Close preview and save

### Use for Presentations

Present notes in meetings:

1. Open preview only (close source editor)
2. Full-screen VS Code
3. Scroll through formatted content
4. Professional appearance

### Combine with Graph View

Understand note structure:

1. Use preview to read individual notes
2. Use Graph View to see how they connect
3. Navigate between notes via wiki links in editor
4. Preview to verify content

### Template Preview

Preview templates before using:

1. Open template file from `.templates` folder
2. Toggle preview
3. See how template will look when filled
4. Edit template if needed

## Comparison with Other Preview Tools

### VS Code Built-in Preview

Noted's preview uses VS Code's standard markdown preview:

- Same rendering engine
- Same keyboard shortcuts
- Same behavior
- Consistent with other markdown files in VS Code

### External Markdown Viewers

Noted preview vs. external viewers:

**Noted preview advantages**:
- Integrated in VS Code
- Side-by-side editing
- Auto-updates
- No context switching

**External viewer advantages**:
- May have different styling
- May support additional markdown extensions
- Can export to HTML/PDF

## Related Features

- [Daily Notes]({{ '/features/daily-notes' | relative_url }}) - Preview daily markdown notes
- [Templates]({{ '/features/templates' | relative_url }}) - Preview template formatting
- [Wiki-Style Links]({{ '/features/wiki-links' | relative_url }}) - Links work in editor, appear in preview
- [Tags System]({{ '/features/tags' | relative_url }}) - Tags visible in preview

---

[← Back to Features]({{ '/features/' | relative_url }})
