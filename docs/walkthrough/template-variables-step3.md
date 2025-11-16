# Step 3: View Real-Time Feedback

The validation system provides instant feedback as you define variables, preventing errors before they occur.

## Error vs. Warning

### Errors (Red, Blocking)
These prevent note creation entirely:
- ❌ Reserved keyword usage (`class`, `function`, built-in variable names)
- ❌ Circular references (variable referencing itself in default)
- ❌ Invalid variable names (uppercase, spaces, special characters)
- ❌ Missing required enum values
- ❌ Invalid regex patterns
- ❌ Min > max violations

### Warnings (Yellow, Non-Blocking)
These allow creation but indicate potential issues:
- ⚠️ Unused variables (defined but not in template)
- ⚠️ Undefined variables (used but not defined)

## Real-Time Checks

As you type in the variable editor:

1. **Name Validation**: Instant format checking (lowercase, alphanumeric, underscores)
2. **Reserved Keyword Check**: Highlights conflicts with built-ins or JavaScript keywords
3. **Circular Reference Detection**: Warns if default value references itself
4. **Usage Analysis**: Shows occurrence count in template content

## Example Error Messages

| Error | What It Means | Solution |
|-------|--------------|----------|
| `'function' is a reserved keyword` | Can't use JavaScript keyword | Use `fn_name` or `method` instead |
| `Circular reference in default value` | Variable contains `{itself}` | Remove self-reference |
| `Enum requires at least one value` | Empty `values` array | Add at least one option |

## Try It Out

Try creating a variable named `class` - you'll see an error immediately!

---

**Next**: Analyze how variables are used in your template
