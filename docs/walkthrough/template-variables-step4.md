# Step 4: Analyze Variable Usage

The Template Browser analyzes how variables are used in your template content, catching common mistakes.

## Usage Features

### 1. Occurrence Counting
See how many times `{variablename}` appears in template content.

**Example**:
```
Variable: title
Used 2 times
```

This confirms the variable appears where expected.

### 2. Position Tracking
Get exact line and column numbers for each variable usage.

**Example**:
```
Variable: title
  Line 1, Column 3: # {title}
  Line 3, Column 11: Project: {title}
```

Perfect for debugging or documenting variable purposes!

### 3. Unused Variables Detection
Find variables defined but never used in content.

**Warning Example**:
```
⚠️ Variable 'author' is defined but not used in template
```

**When to fix**: Add `{author}` to template if you forgot it.
**When to ignore**: It's a placeholder for future use.

### 4. Undefined Variables Detection
Find variables used in content but not defined.

**Warning Example**:
```
⚠️ Variable 'deadline' is used in template but not defined
```

**Impact**: `{deadline}` will appear as literal text instead of being replaced!

## Usage Statistics Dashboard

The browser displays:
```
Variable Usage Statistics:
✓ 3 of 4 variables used in template
⚠️ 1 unused variable: author
⚠️ 0 undefined variables
```

**Healthy templates**: 100% of defined variables used, 0 undefined variables.

---

**Next**: Export variables to share with your team
