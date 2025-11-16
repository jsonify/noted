# Step 2: Add Variable with Validation

Variables transform static templates into dynamic, intelligent tools. Let's add your first variable!

## Variable Types Available

- **String**: Text inputs with pattern matching and length constraints
- **Number**: Numeric values with min/max validation
- **Enum**: Dropdown selections from predefined choices
- **Date**: Date values with format validation
- **Boolean**: Yes/no toggles for optional sections

## Adding a Variable

1. In the Template Browser, click **"Add Variable"**
2. Enter a name (lowercase, letters, numbers, underscores only)
3. Choose a type from the dropdown
4. Set validation rules (optional but recommended)

## Example: Bug Severity Variable

```json
{
  "name": "severity",
  "type": "enum",
  "required": true,
  "prompt": "Select bug severity",
  "values": ["Critical", "High", "Medium", "Low"],
  "default": "Medium"
}
```

This creates a dropdown with 4 options, defaults to "Medium", and requires user selection.

## Validation Options

- **String**: `pattern` (regex), `minLength`, `maxLength`
- **Number**: `min`, `max`
- **Enum**: `values` array (required)
- **Date**: `pattern` for format validation

---

**Next**: See real-time validation feedback in action
