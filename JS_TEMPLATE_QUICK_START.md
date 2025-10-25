# JavaScript Templates - Quick Start Guide

## What Are JavaScript Templates?

JavaScript templates are dynamic, programmable note templates that use EJS-style syntax to generate content. Unlike static templates that use simple placeholder replacement, JS templates can include loops, conditionals, and complex logic.

## Example Comparison

### Static Template (`.txt` or `.md`)
```
# Meeting Notes - {date}

Attendees:
- {user}

Notes:

```

### JavaScript Template (`.js.template`)
```javascript
<%
const hour = new Date().getHours();
const greeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
%>
# <%= greeting %> Meeting - <%= dateHelper.getMonthName() %> <%= day %>

**Attendees:**
- <%= user %>

**Quick Stats:**
- Meeting #<%= Math.floor(Math.random() * 100) + 1 %>
- Duration: 30 mins
- Next meeting: <%= dateHelper.addDays(7).format('YYYY-MM-DD') %>
```

## Syntax Quick Reference

### Code Blocks
```javascript
<%
// JavaScript code that doesn't output
const name = "John";
%>
```

### Expressions (Output)
```javascript
<%= expression %>  // Outputs the result
```

### Example
```javascript
<% const items = ['Review', 'Code', 'Test']; %>
<% for (let i = 0; i < items.length; i++) { %>
- [ ] <%= items[i] %>
<% } %>
```

## Available Context Variables

| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `filename` | string | `"meeting-notes"` | Note filename without extension |
| `year` | string | `"2025"` | Current year |
| `month` | string | `"10"` | Current month (01-12) |
| `day` | string | `"25"` | Current day (01-31) |
| `weekday` | string | `"Sun"` | Short day name |
| `monthName` | string | `"October"` | Full month name |
| `user` | string | `"john"` | System username |
| `workspace` | string | `"my-project"` | VS Code workspace name |
| `dateString` | string | `"Sunday, October 25, 2025"` | Formatted date |
| `timeString` | string | `"2:30 PM"` | Formatted time |
| `dateHelper` | object | - | Date helper with methods |
| `timeHelper` | object | - | Time helper with methods |

## Helper Methods

### `dateHelper`
```javascript
dateHelper.format('YYYY-MM-DD')           // "2025-10-25"
dateHelper.getDayName()                   // "Sunday"
dateHelper.getMonthName()                 // "October"
dateHelper.addDays(7).format('YYYY-MM-DD') // "2025-11-01"
```

### `timeHelper`
```javascript
timeHelper.format12Hour()  // "2:30 PM"
timeHelper.format24Hour()  // "14:30"
timeHelper.now()           // "2025-10-25T14:30:00.000Z"
```

## Setup Instructions

### 1. Enable JavaScript Templates
Open VS Code settings and add:
```json
{
  "noted.allowJavaScriptTemplates": true
}
```

### 2. Create a Template
1. Find your templates folder: `.noted-templates/` in your notes directory
2. Create a file with `.js.template` extension (e.g., `my-template.js.template`)
3. Write your template code

### 3. Use the Template
1. Open Noted sidebar
2. Find your template under a category (it will have a ⚡ icon)
3. Click it to create a note
4. On first use, click "Allow Always" when prompted

## Common Patterns

### Dynamic Greeting
```javascript
<%
const hour = new Date().getHours();
let greeting = 'Hello';
if (hour < 12) greeting = 'Good morning';
else if (hour < 18) greeting = 'Good afternoon';
else greeting = 'Good evening';
%>
# <%= greeting %>, <%= user %>!
```

### Numbered List
```javascript
<%
const tasks = ['Review code', 'Write docs', 'Run tests'];
for (let i = 0; i < tasks.length; i++) {
%>
<%= i + 1 %>. [ ] <%= tasks[i] %>
<% } %>
```

### Conditional Content
```javascript
<%
const isWeekend = dateHelper.getDayOfWeek() === 0 || dateHelper.getDayOfWeek() === 6;
%>
<% if (isWeekend) { %>
## Weekend Mode 🎉
Relax and recharge!
<% } else { %>
## Workday Focus 💼
Time to be productive!
<% } %>
```

### Date Calculations
```javascript
**This Week:**
- Today: <%= dateHelper.format('YYYY-MM-DD') %>
- Next Monday: <%= dateHelper.addDays(1).format('YYYY-MM-DD') %>
- End of month: <%= dateHelper.addMonths(1).format('YYYY-MM-01') %>
```

## Security Notes

### What You CAN Do
- ✅ All JavaScript math and string operations
- ✅ Date manipulation
- ✅ Loops and conditionals
- ✅ Arrays and objects
- ✅ Random numbers

### What You CANNOT Do
- ❌ File system access (no `fs`, no file reading/writing)
- ❌ Network requests (no `fetch`, no HTTP)
- ❌ Node.js APIs (no `require`, no `import`)
- ❌ VS Code APIs (no `vscode.*`)
- ❌ Async operations (no `async`/`await`)

### Why These Restrictions?
Templates run in a secure WebAssembly sandbox for safety. This prevents malicious templates from accessing your system.

## Troubleshooting

### "JavaScript templates are disabled"
**Solution:** Enable in settings: `"noted.allowJavaScriptTemplates": true`

### "Template execution timeout"
**Cause:** Template took too long (>5 seconds)
**Solution:** Simplify your template or increase timeout in settings:
```json
{
  "noted.jsTemplates.maxExecutionTime": 10000
}
```

### "Template execution failed: [error]"
**Cause:** JavaScript syntax error
**Solution:** Check your template syntax. Common issues:
- Missing closing `%>`
- Unclosed strings
- Undefined variables

### Template not showing up
**Checklist:**
1. File has `.js.template` extension
2. File is in `.noted-templates/` folder
3. Noted view has been refreshed (click refresh icon)

## Best Practices

### 1. Keep Templates Simple
Templates should generate content quickly (<100ms). Complex logic slows down note creation.

### 2. Use Comments
```javascript
<%
// Calculate days until weekend
const today = dateHelper.getDayOfWeek();
const daysUntilWeekend = today === 6 ? 1 : 6 - today;
%>
```

### 3. Handle Edge Cases
```javascript
<%
const name = filename || 'Untitled';
const hours = new Date().getHours();
%>
# <%= name %> - <%= hours > 12 ? 'PM' : 'AM' %>
```

### 4. Test Your Templates
Create a test note to verify output before committing to a template.

### 5. Don't Include Frontmatter (Usually)
The system adds YAML frontmatter automatically. Only include if you need custom frontmatter:
```javascript
---
tags: [meeting, <%= monthName.toLowerCase() %>]
priority: high
---

# Meeting Notes
```

## Examples Repository

Check `/home/user/noted/examples/` for complete examples:
- `example-meeting.js.template`: Meeting notes with randomization
- `example-daily.js.template`: Daily note with dynamic greeting

## Configuration Reference

```json
{
  // Enable/disable JS templates (default: false)
  "noted.allowJavaScriptTemplates": true,

  // Max execution time in milliseconds (default: 5000)
  "noted.jsTemplates.maxExecutionTime": 5000,

  // Max memory in MB (default: 32)
  "noted.jsTemplates.maxMemory": 32
}
```

## Next Steps

1. **Enable** JS templates in settings
2. **Create** your first template using an example as a starting point
3. **Test** it by creating a note
4. **Iterate** and add more dynamic features
5. **Share** your favorite templates with the community!

## Need Help?

- Check the full integration summary: `JS_TEMPLATE_INTEGRATION_SUMMARY.md`
- Review compatibility notes: `JS_TEMPLATE_COMPATIBILITY_NOTES.md`
- Look at examples in `/examples/` directory
- File an issue if you find bugs or have feature requests
