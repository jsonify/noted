# Documentation Site - Chirpy Theme Implementation

This document describes the implementation of the Noted documentation website using Jekyll and the Chirpy theme.

## Overview

The Noted documentation site is built with [Jekyll](https://jekyllrb.com/) using the [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) theme. It provides a clean, professional, and feature-rich documentation experience with built-in search, dark mode, and responsive design.

**Live Site**: https://jsonify.github.io/noted/

## Implementation Details

### Theme Selection

**Chirpy** was chosen for the following reasons:

- **Modern Design**: Clean, professional appearance with excellent typography
- **Built-in Features**:
  - Full-text search across all documentation
  - Dark/light mode toggle
  - Responsive design for mobile and desktop
  - Syntax highlighting for code blocks
  - Table of contents generation
  - Social sharing capabilities
- **Active Maintenance**: Regularly updated and well-maintained
- **GitHub Pages Compatible**: Works seamlessly with GitHub Pages deployment
- **Extensive Documentation**: Comprehensive documentation and examples available

### Directory Structure

```
docs/
├── _config.yml              # Jekyll and Chirpy configuration
├── _tabs/                   # Top navigation pages
│   ├── about.md            # About page
│   ├── archives.md         # Post archives
│   ├── categories.md       # Category index
│   ├── features.md         # Features overview
│   ├── getting-started.md  # Getting started guide
│   └── tags.md             # Tag index
├── _posts/                  # Feature documentation posts
│   ├── 2024-10-23-getting-started.md
│   ├── 2024-10-23-graph-view.md
│   ├── 2024-10-23-templates.md
│   └── 2024-10-23-wiki-links.md
├── _data/                   # Theme data files
├── assets/                  # Images, CSS, JavaScript
├── Gemfile                  # Ruby dependencies
├── .ruby-version           # Ruby version (3.1.6)
└── README.md               # Setup and development instructions
```

### Key Configuration

**_config.yml** contains the main site configuration:

- **Site metadata**: Title, description, URL, author information
- **Theme settings**: Color scheme, sidebar, TOC behavior
- **Build settings**: Markdown processor, plugins, exclude patterns
- **Chirpy-specific**: Avatar, social links, timezone, date format

### Ruby Environment

The site uses **rbenv** to manage Ruby versions:

- **Ruby Version**: 3.1.6 (specified in `.ruby-version`)
- **Bundler**: For dependency management
- **Jekyll**: Static site generator
- **Chirpy**: Theme gem and dependencies

### Local Development

**Prerequisites**:
```bash
# Install rbenv and Ruby
brew install rbenv ruby-build
rbenv install 3.1.6

# Set local Ruby version
cd docs
rbenv local 3.1.6
```

**Setup**:
```bash
# Install dependencies
bundle install
```

**Development Server**:
```bash
# Start with live reload
bundle exec jekyll serve --livereload

# Site available at http://127.0.0.1:4000/noted/
```

**Building**:
```bash
# Build static site to _site/
bundle exec jekyll build
```

### Deployment

The site uses **GitHub Actions** for automated deployment:

**Workflow File**: `.github/workflows/pages-deploy.yml`

**Process**:
1. Triggered on push to `main` branch or manual workflow dispatch
2. Checks out repository code
3. Sets up Ruby 3.1.6 environment
4. Installs dependencies via Bundler
5. Builds Jekyll site with Chirpy theme
6. Deploys to GitHub Pages

**GitHub Pages Settings**:
- **Source**: GitHub Actions (not branch-based)
- **Custom domain**: Not configured (uses default github.io)
- **HTTPS**: Enabled by default

### Content Organization

**Tabs** (`_tabs/`):
- Fixed navigation items in sidebar
- Ordered by `order` frontmatter property
- Support icons using Font Awesome

**Posts** (`_posts/`):
- Individual feature documentation
- Automatically organized by date, categories, and tags
- Support for table of contents, math rendering, mermaid diagrams
- Naming convention: `YYYY-MM-DD-title.md`

**Frontmatter Example**:
```yaml
---
title: Graph View
date: 2024-10-23 12:00:00 -0800
categories: [Features, Visualization]
tags: [graph, links, connections]
---
```

### Theme Customization

**Color Scheme**:
- Default Chirpy theme colors
- Automatic dark/light mode based on user preference
- Can be customized in `assets/css/`

**Typography**:
- System font stack for optimal performance
- Syntax highlighting via Rouge
- Code block themes optimized for dark/light modes

**Layout**:
- Responsive design with breakpoints for mobile, tablet, desktop
- Collapsible sidebar on mobile
- Sticky table of contents on desktop

## Features Enabled

### Search
- Full-text search across all documentation
- Instant search results with highlighting
- Keyboard navigation support

### Dark Mode
- Automatic detection of system preference
- Manual toggle available
- Persistent user preference

### Navigation
- Breadcrumb navigation
- Post navigation (previous/next)
- Table of contents with scroll spy
- Archive by date, category, and tag

### Social Features
- Social sharing buttons (Twitter, Facebook, etc.)
- RSS feed generation
- Comment system support (not currently enabled)

### Performance
- Asset minification and bundling
- Lazy loading of images
- Service worker for offline support (optional)

## Maintenance

### Updating Dependencies

```bash
# Update all gems to latest compatible versions
bundle update

# Update specific gem
bundle update jekyll-theme-chirpy

# Check for outdated dependencies
bundle outdated
```

### Adding New Content

**New Tab Page**:
```bash
# Create file in _tabs/
touch _tabs/my-page.md

# Add frontmatter:
# ---
# layout: page
# title: My Page
# icon: fas fa-icon-name
# order: 4
# ---
```

**New Post**:
```bash
# Create file in _posts/ with date prefix
touch _posts/2024-10-23-my-feature.md

# Add frontmatter with title, date, categories, tags
```

### Theme Updates

When Chirpy releases new versions:

1. Check [Chirpy releases](https://github.com/cotes2020/jekyll-theme-chirpy/releases)
2. Review changelog for breaking changes
3. Update `Gemfile` version if needed
4. Run `bundle update jekyll-theme-chirpy`
5. Test locally before deploying
6. Review customizations for compatibility

## Troubleshooting

### Common Issues

**Jekyll build fails**:
- Check Ruby version: `ruby -v` (should be 3.1.6)
- Verify bundler installation: `gem install bundler`
- Clear cache: `bundle exec jekyll clean`
- Reinstall dependencies: `rm -rf vendor && bundle install`

**LiveReload not working**:
- Ensure you're using `--livereload` flag
- Check browser console for WebSocket errors
- Try clearing browser cache

**GitHub Pages deployment fails**:
- Check workflow logs in Actions tab
- Verify `_config.yml` syntax
- Ensure all required files are committed
- Check for file permission issues

**Styling issues**:
- Clear Jekyll cache: `bundle exec jekyll clean`
- Check for custom CSS conflicts
- Verify theme version compatibility

### Debug Mode

```bash
# Enable verbose output
bundle exec jekyll serve --verbose

# Enable incremental builds
bundle exec jekyll serve --incremental

# Trace build process
bundle exec jekyll serve --trace
```

## Resources

- **Chirpy Theme**: https://github.com/cotes2020/jekyll-theme-chirpy
- **Chirpy Documentation**: https://chirpy.cotes.page/
- **Jekyll Documentation**: https://jekyllrb.com/docs/
- **GitHub Pages**: https://docs.github.com/en/pages

## Future Enhancements

- [ ] Add comment system (Disqus, utterances, or giscus)
- [ ] Enable PWA features for offline documentation
- [ ] Add custom domain
- [ ] Create more feature-specific documentation posts
- [ ] Add video tutorials or animated GIFs
- [ ] Implement versioned documentation for different extension releases
- [ ] Add search analytics to understand user documentation needs
- [ ] Create interactive examples or demos where applicable
