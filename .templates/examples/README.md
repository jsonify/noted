# JavaScript Templates Examples

Welcome to JavaScript templates for Noted! These example templates demonstrate the power of programmable note generation.

## What are JavaScript Templates?

JavaScript templates (`.js.template` files) allow you to write dynamic, programmable templates using JavaScript code. Unlike static templates with simple placeholders, JavaScript templates can:

- **Execute logic**: Use if/else, loops, and functions
- **Process data**: Fetch and manipulate information
- **Generate dynamic content**: Create context-aware notes
- **Integrate with APIs**: Pull data from external sources
- **Calculate values**: Perform computations and formatting

## File Structure

JavaScript template files must:
- End with `.js.template` extension
- Export a default async function that returns a string
- Use the provided `note` context object for data access

## Basic Template Structure

```javascript
/**
 * Template Name: Example Template
 * Description: Brief description of what this template does
 */

module.exports = async (note) => {
  // Access context data
  const { date, time, filename } = note.vars;

  // Your template logic here
  let content = `# ${filename}\n\n`;
  content += `Created: ${date} at ${time}\n\n`;

  // Return the generated content
  return content;
};
```

## Available Context API

The `note` object provides:

### Variables (`note.vars`)
- `filename` - Note file name
- `date` - Full date string (Sunday, October 24, 2025)
- `time` - 12-hour time with AM/PM (2:30 PM)
- `year` - Year (2025)
- `month` - Month with leading zero (10)
- `day` - Day with leading zero (19)
- `weekday` - Short day name (Sun, Mon, Tue)
- `month_name` - Full month name (October)
- `user` - System username
- `workspace` - VS Code workspace name

### Utility Functions (`note.utils`)
- `formatDate(date)` - Format date objects
- `getDayOfWeek(date)` - Get day name
- `getWeekNumber(date)` - Get ISO week number
- `relativeDays(days)` - Get date N days from now
- `parseDate(string)` - Parse date strings

### File Operations (`note.files`)
- `list(path, options)` - List files in directory
- `read(path)` - Read file contents
- `exists(path)` - Check if file exists
- `glob(pattern)` - Find files by pattern

### Note Operations (`note.notes`)
- `search(query)` - Search notes
- `getRecent(count)` - Get recent notes
- `getTags()` - Get all tags
- `getByTag(tag)` - Get notes by tag

## Example Templates

This directory includes 5 example templates:

1. **daily-smart.js.template** - Context-aware daily note that adapts based on day of week
2. **weekly-review.js.template** - Weekly review that automatically fetches last week's notes
3. **meeting-smart.js.template** - Smart meeting template with recurring meeting detection
4. **project-kickoff.js.template** - Project template with auto-generated IDs and structure
5. **standup.js.template** - Daily standup with task formatting helpers

## Security

JavaScript templates run in a sandboxed environment with:
- Limited file system access (read-only within workspace)
- No network access by default
- Timeout limits (5 seconds)
- Memory limits
- No access to Node.js globals (process, require, etc.)

For security reasons, JavaScript templates are **disabled by default**. Enable them in settings:

```json
{
  "noted.enableJavaScriptTemplates": true
}
```

## Creating Your Own

1. Create a new `.js.template` file in `.templates/` or `.templates/examples/`
2. Use the basic structure shown above
3. Add your custom logic
4. Test with "Noted: Open with Template"

## Converting Static Templates

Convert existing static templates to JavaScript:

1. Open Command Palette
2. Run "Noted: Convert Template to JavaScript"
3. Select the template to convert
4. Review and customize the generated code

## Best Practices

1. **Keep it simple**: Start with basic logic, add complexity as needed
2. **Handle errors**: Use try/catch for file operations
3. **Document code**: Add comments explaining complex logic
4. **Test thoroughly**: Try different scenarios and edge cases
5. **Async/await**: Use async operations for file I/O
6. **Performance**: Be mindful of loops and recursive operations

## Troubleshooting

### Template doesn't appear
- Check file has `.js.template` extension
- Verify JavaScript templates are enabled in settings
- Restart VS Code

### Syntax errors
- Check for missing parentheses, braces
- Ensure function returns a string
- Use `console.log()` for debugging (shows in Output panel)

### Timeout errors
- Reduce complexity
- Avoid infinite loops
- Limit file operations

### Context data missing
- Verify you're accessing `note.vars.property` correctly
- Check spelling of property names
- Some functions may return undefined if data unavailable

## Learn More

See the full documentation:
- [JavaScript Templates Guide](https://jsonify.github.io/noted/posts/javascript-templates/)
- [Template Variables](https://jsonify.github.io/noted/posts/templates/)
- [Advanced Techniques](https://jsonify.github.io/noted/posts/javascript-templates/#advanced)

---

Happy templating! Start with the examples and build from there.
