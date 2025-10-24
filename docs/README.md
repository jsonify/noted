# Noted Documentation Site

This directory contains the documentation website for Noted, built with [Jekyll](https://jekyllrb.com/) using the [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) theme.

## Local Development

### Prerequisites

- Ruby 3.1+ (managed via rbenv)
- Bundler

### Setup

1. Install rbenv and Ruby 3.1.6 (if not already installed):
```bash
brew install rbenv ruby-build
rbenv install 3.1.6
```

2. Set local Ruby version:
```bash
rbenv local 3.1.6
```

3. Install dependencies:
```bash
bundle install
```

### Running Locally

Start the development server:
```bash
bundle exec jekyll serve --livereload
```

The site will be available at: http://127.0.0.1:4000/noted/

Changes to files will automatically rebuild the site and refresh your browser.

### Building for Production

Build the static site:
```bash
bundle exec jekyll build
```

Output will be in the `_site` directory.

## Site Structure

- `_config.yml` - Jekyll configuration
- `_tabs/` - Top navigation pages (Features, Getting Started, About, etc.)
- `_posts/` - Individual feature documentation posts
- `_data/` - Data files for localization and configuration
- `assets/` - Images, CSS, and JavaScript
- `index.html` - Home page

## Adding Content

### Creating a New Tab

Create a markdown file in `_tabs/`:

```markdown
---
layout: page
title: My Page
icon: fas fa-icon-name
order: 3
---

# Content here
```

### Creating a New Post

Create a markdown file in `_posts/` with the naming convention `YYYY-MM-DD-title.md`:

```markdown
---
title: My Feature
date: 2024-10-23 12:00:00 -0800
categories: [Features, Category]
tags: [tag1, tag2]
---

# Content here
```

## Deployment

The site is automatically built and deployed to GitHub Pages via GitHub Actions when changes are pushed to the `main` branch.

Live site: https://jsonify.github.io/noted/

## Theme Customization

The Chirpy theme can be customized via:

- `_config.yml` - Site-wide settings
- `assets/css/` - Custom CSS
- `_data/` - Localization and theme data

See the [Chirpy documentation](https://chirpy.cotes.page/) for more details.

## License

This work is published under [MIT](https://github.com/cotes2020/chirpy-starter/blob/master/LICENSE) License.
