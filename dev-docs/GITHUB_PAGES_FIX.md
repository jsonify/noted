# GitHub Pages 404 Fix

## Changes Made

Fixed the configuration issues that were causing the 404 error:

### 1. Updated `docs/_config.yml`

**Changed:**
- `baseurl: "/noted"` → `baseurl: ""`
- `url: "https://jsonify.github.io"` → `url: "https://jsonify.github.io/noted"`
- `theme: jekyll-theme-cayman` → `remote_theme: pages-themes/cayman@v0.2.0`
- Added `jekyll-remote-theme` plugin

**Why:**
- When using a `/docs` folder in GitHub Pages, the `baseurl` should be empty
- The full URL should include the repository name
- GitHub Pages works better with `remote_theme` instead of `theme`

### 2. Excluded Non-Site Files

Added exclusion for documentation files that aren't part of the website:
- README.md
- AUTOMATED_TESTING.md
- TESTING.md
- etc.

This prevents Jekyll from trying to process these files.

## What to Do Next

1. **Commit and push these changes:**
   ```bash
   git add docs/_config.yml
   git commit -m "fix: update Jekyll config for GitHub Pages deployment"
   git push origin main
   ```

2. **Wait for GitHub Actions to rebuild** (1-2 minutes)
   - Go to your repository → Actions tab
   - Watch for "pages-build-deployment" to complete
   - Should show green checkmark when done

3. **Visit your site:**
   ```
   https://jsonify.github.io/noted/
   ```

4. **If still showing 404:**
   - Check GitHub repository Settings → Pages
   - Verify source is set to: `main` branch, `/docs` folder
   - Try a hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
   - Clear browser cache
   - Wait a few more minutes (sometimes takes up to 5 minutes)

## Alternative: If Issues Persist

If you still see 404 errors, try this simpler approach:

### Option A: Use GitHub Pages Automatic Theme

Edit `docs/_config.yml` and change the theme line to:

```yaml
theme: jekyll-theme-cayman
```

Remove the `remote_theme` line and the `jekyll-remote-theme` plugin.

### Option B: Check Repository Settings

1. Go to Settings → Pages
2. Under "Source":
   - Branch: `main`
   - Folder: `/docs`
3. Click Save again
4. Wait for rebuild

### Option C: Verify Build Logs

1. Go to Actions tab
2. Click latest "pages-build-deployment" workflow
3. Check for any error messages
4. Look for warnings about missing files or configuration issues

## Testing Locally

Before pushing, test locally:

```bash
cd docs
bundle install
bundle exec jekyll serve
```

Then visit: `http://localhost:4000/`

Note: Local testing uses `http://localhost:4000/` (no `/noted/` in path)

## Common Issues

### Issue: CSS Not Loading

**Symptom:** Site loads but looks unstyled

**Fix:** Check `assets/css/style.scss` first line:
```scss
---
---
```
Must have empty front matter (two sets of triple dashes)

### Issue: Links Don't Work

**Symptom:** Navigation links lead to 404

**Fix:** All internal links should use:
```liquid
{{ '/path/' | relative_url }}
```

### Issue: Page Shows Raw Markdown

**Symptom:** Markdown isn't rendered, just shows as text

**Fix:** Check front matter on page:
```yaml
---
layout: default
title: Page Title
---
```

## Verification

Once deployed, verify these URLs work:

- `https://jsonify.github.io/noted/` - Homepage
- `https://jsonify.github.io/noted/features/` - Features page
- `https://jsonify.github.io/noted/user/` - User guide
- `https://jsonify.github.io/noted/dev/` - Developer docs

All should load with:
- Styled header with gradient
- Navigation bar
- Proper content rendering
- Working links

## Need More Help?

If issues persist:

1. Check the GitHub Pages documentation: https://docs.github.com/en/pages
2. Review Jekyll documentation: https://jekyllrb.com/docs/
3. Check build logs in Actions tab for specific errors
4. Open an issue with:
   - Error messages from Actions log
   - What you've tried
   - Screenshots of 404 error
