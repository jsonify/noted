# Step 5: Export & Share Variables

Share variable definitions across templates, teams, or workspaces using JSON import/export.

## Exporting Variables

1. Open template in Template Browser
2. Click **"Export Variables"** button
3. Choose export options:
   - **Format**: JSON (recommended), YAML, or CSV
   - **Include metadata**: Validation rules, descriptions, prompts
   - **Scope**: All variables or selected only

**Result**: File saved as `templatename-variables.json` in your downloads.

## Importing Variables

1. Click **"Import Variables"** in Template Browser
2. Select exported JSON file
3. Review import preview showing valid/invalid variables
4. Choose merge strategy:
   - **Replace all**: Delete existing, use imported
   - **Merge**: Keep existing, add new, skip duplicates
   - **Merge with overwrite**: Keep existing, add new, update duplicates
5. Click **"Confirm Import"**

## Use Cases

### Team Standardization
```
Team Lead exports "user-story-variables.json"
→ Developers import into their templates
→ Ensures consistent story structure
```

### Template Versioning
```
v1.0: Export baseline variables
v1.1: Add new variable
v1.2: Export updated set
→ Easy rollback if needed
```

### Cross-Workspace Reuse
```
Export from "Work" workspace
→ Import into "Personal" workspace
→ Adapt content, keep variable structure
```

### Template Marketplace Sharing
```
Create amazing template with 15 variables
→ Export to GitHub gist
→ Community imports and customizes
```

## Validation During Import

Imported variables are validated:
- ✅ Variable names follow format rules
- ✅ No reserved keywords
- ✅ Required fields present
- ✅ Validation rules are valid

Invalid variables are flagged and skipped automatically!

---

**Congratulations!** You've mastered template variables. Ready to create your first production-grade template?

[Open Template Browser](command:noted.showTemplateBrowser)
