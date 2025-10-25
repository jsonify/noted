---
title: JavaScript Templates
date: 2025-10-25 10:00:00 -0800
categories: [Features, Templates, Advanced]
tags: [templates, javascript, automation, programming, advanced]
---

# JavaScript Templates

Take your note automation to the next level with programmable JavaScript templates that adapt to context, fetch data, and execute complex logic.

## What are JavaScript Templates?

JavaScript templates are `.js.template` files that use JavaScript code to generate dynamic note content. Unlike static templates with simple placeholder substitution, JavaScript templates can:

- **Execute Logic**: Use if/else conditionals, loops, and functions
- **Process Data**: Manipulate strings, dates, and collections
- **Fetch Information**: Access note history, tags, and metadata
- **Calculate Values**: Perform computations and transformations
- **Adapt to Context**: Generate different content based on conditions

## Quick Start

### Enable JavaScript Templates

JavaScript templates are **disabled by default** for security. Enable in settings:

```json
{
  "noted.enableJavaScriptTemplates": true
}
```

### Create Your First JavaScript Template

1. Open Command Palette (`Cmd+Shift+P`)
2. Run **"Noted: Convert Template to JavaScript"**
3. Select an existing template to convert
4. Review and customize the generated code

Or manually create a `.js.template` file in `.templates/` folder.

### Basic Template Structure

```javascript
/**
 * Template: My First JS Template
 * Description: A simple programmable template
 */

module.exports = async (note) => {
  // Access template variables
  const { filename, date, time, user } = note.vars;

  // Build the content
  let content = `# ${filename}\n\n`;
  content += `Created by ${user} on ${date} at ${time}\n\n`;
  content += `## Getting Started\n\n`;

  // Return the generated note content
  return content;
};
```

## Template Context API

Every JavaScript template receives a `note` context object with powerful APIs:

### Variables (`note.vars`)

Access all template variables:

```javascript
const {
  filename,      // Note file name
  date,          // Full date: "Sunday, October 24, 2025"
  time,          // 12-hour time: "2:30 PM"
  year,          // Year: "2025"
  month,         // Month with zero: "10"
  day,           // Day with zero: "24"
  weekday,       // Short day: "Sun", "Mon", etc.
  month_name,    // Full month: "October"
  user,          // System username
  workspace      // VS Code workspace name
} = note.vars;
```

### Utility Functions (`note.utils`)

Helper functions for common operations:

```javascript
// Date formatting
const formatted = note.utils.formatDate(new Date());

// Get day of week
const dayName = note.utils.getDayOfWeek(new Date());

// Get ISO week number
const weekNum = note.utils.getWeekNumber(new Date());

// Relative dates
const nextWeek = note.utils.relativeDays(7);
const lastWeek = note.utils.relativeDays(-7);

// Parse date strings
const parsed = note.utils.parseDate('2025-10-24');
```

### File Operations (`note.files`)

Read-only file system access (workspace only):

```javascript
// List files in directory
const files = await note.files.list('/path/to/dir');

// Read file contents
const content = await note.files.read('/path/to/file.txt');

// Check if file exists
const exists = await note.files.exists('/path/to/file.txt');

// Find files by pattern
const matches = await note.files.glob('**/*.md');
```

### Note Operations (`note.notes`)

Access your note collection:

```javascript
// Search notes by content
const results = await note.notes.search('project alpha');

// Get recent notes
const recent = await note.notes.getRecent(10);

// Get all tags
const tags = await note.notes.getTags();

// Get notes by tag
const tagged = await note.notes.getByTag('meeting');
```

## Examples

### Example 1: Day-Aware Daily Note

Generate different sections based on the day of the week:

```javascript
module.exports = async (note) => {
  const { weekday, date, user } = note.vars;

  let content = '';

  // Different greetings per day
  if (weekday === 'Mon') {
    content += `# Week Start - ${date}\n\n`;
    content += `Welcome to a new week, ${user}!\n\n`;
    content += `## Week Goals\n\n`;
    content += `- [ ] Goal 1\n`;
    content += `- [ ] Goal 2\n\n`;
  } else if (weekday === 'Fri') {
    content += `# Week End - ${date}\n\n`;
    content += `Time to wrap up and celebrate wins!\n\n`;
    content += `## Week Review\n\n`;
    content += `**Completed:**\n- \n\n`;
  } else {
    content += `# ${weekday}, ${date}\n\n`;
    content += `## Today's Focus\n\n`;
  }

  content += `## Notes\n\n`;

  return content;
};
```

### Example 2: Weekly Review with Data

Fetch last week's notes automatically:

```javascript
module.exports = async (note) => {
  const { date, user } = note.vars;

  let content = `# Weekly Review - ${date}\n\n`;
  content += `**Reviewer:** ${user}\n\n`;

  // Fetch recent notes
  try {
    const recentNotes = await note.notes.getRecent(7);

    if (recentNotes.length > 0) {
      content += `## Notes from Last Week\n\n`;
      for (const n of recentNotes) {
        content += `- [[${n.name}]] - ${n.date}\n`;
      }
      content += '\n';
    }
  } catch (err) {
    content += `## Notes from Last Week\n\n`;
    content += `*Unable to fetch notes*\n\n`;
  }

  content += `## Achievements\n\n- \n\n`;
  content += `## Challenges\n\n- \n\n`;
  content += `## Next Week\n\n- \n\n`;

  return content;
};
```

### Example 3: Smart Meeting Detector

Detect recurring meetings and link to previous sessions:

```javascript
module.exports = async (note) => {
  const { filename, date, time } = note.vars;

  const meetingName = filename.replace(/\.(txt|md)$/i, '');

  let content = `# ${meetingName}\n\n`;
  content += `**Date:** ${date}\n`;
  content += `**Time:** ${time}\n\n`;

  // Check for recurring meeting
  try {
    const similar = await note.notes.search(meetingName);

    if (similar.length > 1) {
      content += `## Previous Meetings\n\n`;
      content += `*This is a recurring meeting.*\n\n`;

      const previous = similar.slice(0, 3);
      for (const prev of previous) {
        if (prev.name !== filename) {
          content += `- [[${prev.name}]]\n`;
        }
      }
      content += '\n';
    }
  } catch (err) {
    // Search unavailable
  }

  content += `## Agenda\n\n1. \n\n`;
  content += `## Notes\n\n`;
  content += `## Action Items\n\n- [ ] \n\n`;

  return content;
};
```

### Example 4: Project with Auto-Generated ID

Generate unique project identifiers:

```javascript
module.exports = async (note) => {
  const { filename, date, year, month, day, user } = note.vars;

  // Generate unique project ID
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const projectId = `PROJ-${year}${month}${day}-${random}`;

  let content = '---\n';
  content += 'tags: [project]\n';
  content += `project-id: ${projectId}\n`;
  content += '---\n\n';

  content += `# Project: ${filename}\n\n`;
  content += `**Project ID:** \`${projectId}\`\n`;
  content += `**Created:** ${date}\n`;
  content += `**Owner:** ${user}\n\n`;

  content += `## Overview\n\n`;
  content += `## Goals\n\n1. \n\n`;
  content += `## Timeline\n\n`;
  content += `**Start:** ${year}-${month}-${day}\n`;
  content += `**End:** \n\n`;

  return content;
};
```

### Example 5: Dynamic Task List

Generate checklists with helper functions:

```javascript
module.exports = async (note) => {
  const { filename, date, weekday } = note.vars;

  // Helper function
  function createTasks(tasks) {
    return tasks.map(t => `- [ ] ${t}`).join('\n');
  }

  let content = `# ${filename}\n\n`;
  content += `**Date:** ${date}\n\n`;

  // Different tasks per day
  const isWeekend = weekday === 'Sat' || weekday === 'Sun';

  if (isWeekend) {
    content += `## Weekend Tasks\n\n`;
    content += createTasks([
      'Personal project work',
      'Learning and development',
      'Rest and recharge'
    ]);
  } else {
    content += `## Work Tasks\n\n`;
    content += createTasks([
      'Review emails',
      'Team standup',
      'Deep work session',
      'End of day review'
    ]);
  }

  content += '\n\n## Notes\n\n';

  return content;
};
```

## Converting Static Templates

Transform existing templates into JavaScript:

### Using the Converter

1. Open Command Palette
2. Run **"Noted: Convert Template to JavaScript"**
3. Select template to convert
4. Enter name for new JS template
5. Review and customize the generated code

### What Gets Converted

Static placeholders are transformed to JavaScript variables:

**Before (Static):**
```
# Meeting: {filename}
**Date**: {date}
**User**: {user}
```

**After (JavaScript):**
```javascript
module.exports = async (note) => {
  const { filename, date, user } = note.vars;

  const content = `# Meeting: ${filename}
**Date**: ${date}
**User**: ${user}`;

  return content;
};
```

### Customizing After Conversion

Add logic, conditions, and dynamic behavior:

```javascript
module.exports = async (note) => {
  const { filename, date, user, weekday } = note.vars;

  let content = `# Meeting: ${filename}\n`;
  content += `**Date**: ${date}\n`;
  content += `**User**: ${user}\n\n`;

  // Add day-specific sections
  if (weekday === 'Mon') {
    content += `## Weekly Kickoff\n\n`;
  }

  return content;
};
```

## Best Practices

### 1. Start Simple

Begin with basic templates and add complexity gradually:

```javascript
// Good: Simple and clear
module.exports = async (note) => {
  const { date } = note.vars;
  return `# Daily Note - ${date}\n\n## Notes\n\n`;
};

// Avoid: Too complex initially
module.exports = async (note) => {
  // 100 lines of complex logic...
};
```

### 2. Use Helper Functions

Organize code with helper functions:

```javascript
module.exports = async (note) => {
  const { weekday, date } = note.vars;

  // Helper function
  function getGreeting(day) {
    if (day === 'Mon') return 'Start strong!';
    if (day === 'Fri') return 'Finish strong!';
    return 'Keep going!';
  }

  let content = `# ${date}\n\n`;
  content += `${getGreeting(weekday)}\n\n`;

  return content;
};
```

### 3. Handle Errors Gracefully

Wrap async operations in try/catch:

```javascript
module.exports = async (note) => {
  const { date } = note.vars;

  let content = `# Review - ${date}\n\n`;

  try {
    const notes = await note.notes.getRecent(7);
    content += `Found ${notes.length} recent notes\n\n`;
  } catch (err) {
    content += `Unable to fetch recent notes\n\n`;
  }

  return content;
};
```

### 4. Add Comments

Document complex logic:

```javascript
module.exports = async (note) => {
  const { weekday, date } = note.vars;

  let content = '';

  // Check if it's Monday to look back to Friday
  // instead of yesterday for weekend gap
  const isMonday = weekday === 'Mon';

  if (isMonday) {
    // Add week planning section
    content += `## Week Goals\n\n`;
  }

  return content;
};
```

### 5. Test Thoroughly

Try different scenarios:

- Different days of the week
- Edge cases (first/last day of month)
- Empty results from searches
- Missing files or data

## Security

JavaScript templates run in a **sandboxed environment** with restrictions:

### Limitations

- **File Access**: Read-only, workspace directory only
- **Network**: No network requests (fetch, http, etc.)
- **Timeout**: 5 second execution limit
- **Memory**: Limited memory allocation
- **Node.js APIs**: No access to `process`, `require`, etc.

### Why Disabled by Default

JavaScript templates can execute arbitrary code, so they're disabled by default. Only enable if:

1. You created the templates yourself
2. You trust the source of any templates you use
3. You understand the security implications

### Enabling Safely

```json
{
  "noted.enableJavaScriptTemplates": true
}
```

⚠️ **Warning**: Only use templates from trusted sources.

## Advanced Techniques

### Loops and Iteration

Generate repeated content:

```javascript
module.exports = async (note) => {
  const { date } = note.vars;

  let content = `# Daily Standup - ${date}\n\n`;

  // Generate sections for team members
  const team = ['Alice', 'Bob', 'Charlie'];

  for (const member of team) {
    content += `## ${member}\n\n`;
    content += `**Yesterday:**\n- \n\n`;
    content += `**Today:**\n- \n\n`;
    content += `**Blockers:**\n- \n\n`;
  }

  return content;
};
```

### Date Calculations

Work with dates:

```javascript
module.exports = async (note) => {
  const { year, month, day } = note.vars;

  // Create date object
  const today = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day)
  );

  // Calculate yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Calculate next week
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Format dates
  const formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  let content = `# Planning\n\n`;
  content += `**Yesterday:** ${formatDate(yesterday)}\n`;
  content += `**Today:** ${formatDate(today)}\n`;
  content += `**Next Week:** ${formatDate(nextWeek)}\n\n`;

  return content;
};
```

### Conditional Sections

Show/hide content based on conditions:

```javascript
module.exports = async (note) => {
  const { filename, weekday } = note.vars;

  const isStandup = /standup|daily/i.test(filename);
  const isMonday = weekday === 'Mon';
  const isFriday = weekday === 'Fri';

  let content = `# ${filename}\n\n`;

  // Conditional sections
  if (isStandup) {
    content += `## Updates\n\n`;

    if (isMonday) {
      content += `### Week Planning\n\n`;
    }

    if (isFriday) {
      content += `### Week Wrap-up\n\n`;
    }
  } else {
    content += `## Notes\n\n`;
  }

  return content;
};
```

### String Formatting

Build complex strings:

```javascript
module.exports = async (note) => {
  const { filename } = note.vars;

  // Extract and format name
  const name = filename
    .replace(/\.(txt|md)$/i, '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Create table
  const createTable = (headers, rows) => {
    let table = `| ${headers.join(' | ')} |\n`;
    table += `| ${headers.map(() => '---').join(' | ')} |\n`;

    for (const row of rows) {
      table += `| ${row.join(' | ')} |\n`;
    }

    return table;
  };

  let content = `# ${name}\n\n`;
  content += createTable(
    ['Task', 'Status', 'Owner'],
    [
      ['Task 1', '🔲', 'Alice'],
      ['Task 2', '✅', 'Bob']
    ]
  );

  return content;
};
```

## Troubleshooting

### Template Doesn't Appear

**Problem**: JavaScript template not showing in template picker

**Solutions**:
- Check file has `.js.template` extension
- Verify JavaScript templates enabled in settings
- Restart VS Code
- Check template folder location

### Syntax Errors

**Problem**: "SyntaxError" or template fails to load

**Solutions**:
- Check for missing parentheses, braces, quotes
- Ensure `module.exports = async (note) => { ... }`
- Verify function returns a string
- Check for unescaped backticks in template strings

### Timeout Errors

**Problem**: "Template execution timed out"

**Solutions**:
- Reduce complexity
- Avoid infinite loops
- Limit file operations
- Remove or optimize slow operations

### Context Data Missing

**Problem**: Variables are undefined or empty

**Solutions**:
- Verify correct property access: `note.vars.property`
- Check spelling of property names
- Some functions may return `undefined` if data unavailable
- Add null checks: `const x = note.vars.x || 'default'`

### Async Operation Fails

**Problem**: "Promise rejected" or async errors

**Solutions**:
- Wrap in try/catch blocks
- Add error handling for all async calls
- Provide fallback content
- Check file/note existence before accessing

## Example Templates

Explore the included examples in `.templates/examples/`:

1. **daily-smart.js.template**
   - Context-aware daily note
   - Adapts to day of week
   - Different sections for Monday/Friday/Weekend

2. **weekly-review.js.template**
   - Fetches last 7 days of notes
   - Calculates week number
   - Generates comprehensive review structure

3. **meeting-smart.js.template**
   - Detects recurring meetings
   - Links to previous sessions
   - Adapts format (standup, retro, 1-1, etc.)

4. **project-kickoff.js.template**
   - Auto-generates project IDs
   - Calculates timelines
   - Creates comprehensive project structure

5. **standup.js.template**
   - Helper functions for task lists
   - Handles Monday/Friday variations
   - Progress tracking and metrics

## Related Features

- [Templates System](/noted/posts/templates/) - Static templates with placeholders
- [Daily Notes](/noted/posts/daily-notes/) - Quick daily note creation
- [Calendar View](/noted/posts/calendar/) - Navigate notes by date
- [Advanced Search](/noted/posts/search/) - Search and filter notes

## Learn More

For questions or issues:
- [GitHub Issues](https://github.com/jsonify/noted/issues)
- [Documentation](https://jsonify.github.io/noted)

---

Supercharge your note-taking with programmable JavaScript templates!
