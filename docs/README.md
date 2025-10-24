# Noted Documentation Site

This directory contains the Jekyll-based documentation site for Noted, designed to be hosted on GitHub Pages.

## Structure

```
docs/
├── _config.yml           # Jekyll configuration
├── _layouts/             # Page layouts
│   └── default.html      # Main layout template
├── assets/               # Static assets
│   └── css/
│       └── style.scss    # Custom styles
├── features/             # Feature documentation
│   ├── index.md
│   ├── wiki-links.md
│   ├── tags.md
│   ├── templates.md
│   └── search.md
├── user/                 # User guide
│   ├── index.md
│   ├── getting-started.md
│   └── keyboard-shortcuts.md
├── dev/                  # Developer documentation
│   ├── index.md
│   └── architecture.md
├── index.md              # Homepage
├── Gemfile               # Ruby dependencies
└── README.md             # This file
```

## Local Development

**Note:** Local testing is **optional**. GitHub Pages builds the site automatically when you push changes.

### Prerequisites

Due to compatibility issues with macOS system Ruby (2.6), you need a modern Ruby installation:

1. **Ruby 3.1+** (install via Homebrew)
2. **Bundler** gem

### Setup

1. Install Ruby via Homebrew:
   ```bash
   brew install ruby@3.1

   # Add to PATH (add to ~/.zshrc or ~/.bash_profile)
   export PATH="/opt/homebrew/opt/ruby@3.1/bin:$PATH"

   # Reload shell
   source ~/.zshrc
   ```

2. Uncomment gems in `Gemfile` (lines 9-13)

3. Install dependencies:
   ```bash
   cd docs
   bundle install
   ```

4. Run local Jekyll server:
   ```bash
   bundle exec jekyll serve
   ```

5. Open browser to:
   ```
   http://localhost:4000/noted/
   ```

### Making Changes

1. Edit markdown files in `docs/`
2. Jekyll will auto-rebuild (watch mode)
3. Refresh browser to see changes
4. Check for build errors in terminal

### Troubleshooting Bundle Install

If you encounter native extension compilation errors with system Ruby:

1. **Option 1 (Recommended):** Skip local testing and rely on GitHub Pages
2. **Option 2:** Install modern Ruby via Homebrew (see setup above)
3. **Option 3:** Use Docker for Jekyll development

## Deploying to GitHub Pages

### One-Time Setup

1. **Enable GitHub Pages** in repository settings:
   - Go to repository Settings
   - Navigate to "Pages" section
   - Under "Source", select:
     - Branch: `main` (or your default branch)
     - Folder: `/docs`
   - Click Save

2. **Wait for deployment**:
   - GitHub Actions will build the site
   - Check "Actions" tab for build status
   - Site will be available at: `https://jsonify.github.io/noted/`

### Publishing Updates

Updates are published automatically:

1. Make changes to files in `docs/`
2. Commit and push to `main` branch:
   ```bash
   git add docs/
   git commit -m "docs: update documentation"
   git push origin main
   ```
3. GitHub Actions automatically rebuilds
4. Changes appear at `https://jsonify.github.io/noted/` in 1-2 minutes

### Checking Deployment Status

1. Go to repository "Actions" tab
2. Look for "pages-build-deployment" workflow
3. Green checkmark = successful deployment
4. Red X = build failed (check logs)

## Theme and Styling

### Theme

The site uses the **Just the Docs** theme via `remote_theme`:
- Professional documentation-focused design
- Built-in search functionality
- Automatic navigation sidebar
- Mobile-responsive layout
- Clean, readable typography

Theme configuration is in `_config.yml`:
- Search settings
- Color scheme
- Navigation structure
- Footer content

## Content Guidelines

### Writing Documentation

**Use clear headers:**
```markdown
# Main Title
## Section
### Subsection
```

**Include navigation:**
```markdown
[← Back]({{ '/path/' | relative_url }}) | [Next →]({{ '/path/' | relative_url }})
```

**Use code blocks:**
````markdown
```bash
command here
```

```typescript
code here
```
````

**Add front matter:**
```yaml
---
layout: default
title: Page Title
---
```

### Adding New Pages

1. Create `.md` file in appropriate directory
2. Add front matter (layout, title)
3. Write content in markdown
4. Link from index or other pages
5. Test locally
6. Commit and push

### Linking Pages

Use `relative_url` filter:

```liquid
[Link Text]({{ '/features/wiki-links' | relative_url }})
```

This ensures links work both locally and on GitHub Pages.

## File Organization

### Feature Pages

Location: `docs/features/`

Each major feature gets its own page:
- `wiki-links.md` - Wiki-style linking
- `embeds.md` - Note embeds and section embeds
- `tags.md` - Tag system
- `templates.md` - Templates
- `search.md` - Search and discovery
- etc.

### User Guide Pages

Location: `docs/user/`

User-focused documentation:
- `getting-started.md` - Quick start
- `keyboard-shortcuts.md` - Shortcuts
- `configuration.md` - Settings
- etc.

### Developer Pages

Location: `docs/dev/`

Developer documentation:
- `architecture.md` - Code structure
- `contributing.md` - How to contribute
- `testing.md` - Testing guide
- etc.

## Troubleshooting

### "Page not found" after pushing

**Cause:** GitHub Pages not enabled or wrong source folder

**Fix:**
1. Check repository Settings → Pages
2. Ensure source is set to `/docs` folder
3. Wait 1-2 minutes for rebuild

### Styles not loading

**Cause:** Incorrect `baseurl` in `_config.yml`

**Fix:**
1. Check `baseurl: "/noted"` in `_config.yml`
2. Ensure it matches repository name
3. Rebuild locally to test

### Local server won't start

**Cause:** Missing dependencies

**Fix:**
```bash
cd docs
bundle install
bundle exec jekyll serve
```

### Build fails on GitHub

**Cause:** Jekyll errors or invalid markdown

**Fix:**
1. Check Actions tab for error details
2. Test build locally: `bundle exec jekyll build`
3. Fix errors shown in output
4. Push corrected changes

## Maintenance

### Updating Dependencies

Periodically update Ruby gems:

```bash
cd docs
bundle update
git add Gemfile.lock
git commit -m "chore: update docs dependencies"
git push
```

### Checking Links

Periodically check for broken links:
1. Build site locally
2. Use link checker tool
3. Fix broken links
4. Update outdated content

### Keeping Content Fresh

- Update screenshots when UI changes
- Add new features to documentation
- Review user guide for accuracy
- Update version numbers

## Resources

### Jekyll Documentation
- [Jekyll Docs](https://jekyllrb.com/docs/)
- [Liquid Templating](https://shopify.github.io/liquid/)
- [GitHub Pages Docs](https://docs.github.com/en/pages)

### Markdown
- [GitHub Flavored Markdown](https://guides.github.com/features/mastering-markdown/)
- [Kramdown Syntax](https://kramdown.gettalong.org/syntax.html)

### GitHub Pages
- [GitHub Pages Guide](https://pages.github.com/)
- [Supported Themes](https://pages.github.com/themes/)
- [Custom Domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)

## Questions?

- **Documentation issues:** [Open an issue](https://github.com/jsonify/noted/issues)
- **Content suggestions:** [Start a discussion](https://github.com/jsonify/noted/discussions)
- **Contribution:** See [Contributing Guide](./dev/contributing.md)
