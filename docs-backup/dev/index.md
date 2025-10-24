---
layout: default
title: Development
nav_order: 4
has_children: true
permalink: /dev/
---

# Development Documentation

Welcome to the Noted development documentation! This section covers contributing to Noted, understanding the architecture, and extending functionality.

## Getting Started

- [Contributing Guide]({{ '/dev/contributing' | relative_url }}) - How to contribute to Noted
- [Development Setup]({{ '/dev/setup' | relative_url }}) - Set up your development environment
- [Architecture Overview]({{ '/dev/architecture' | relative_url }}) - Understand the codebase structure

## Development Guides

- [Testing]({{ '/dev/testing' | relative_url }}) - Running and writing tests
- [Building & Packaging]({{ '/dev/building' | relative_url }}) - Build and package the extension
- [Release Process]({{ '/dev/releases' | relative_url }}) - How releases are created

## Technical Documentation

- [Code Structure]({{ '/dev/code-structure' | relative_url }}) - Detailed code organization
- [API Reference]({{ '/dev/api' | relative_url }}) - Internal APIs and services
- [Extension Points]({{ '/dev/extension-points' | relative_url }}) - VS Code integration points

## Project Status

[View Latest Release](https://github.com/jsonify/noted/releases){: .btn .btn-primary }

### Build Status

[![CI](https://github.com/jsonify/noted/actions/workflows/ci.yml/badge.svg)](https://github.com/jsonify/noted/actions/workflows/ci.yml)

- **Tests:** 325 passing unit tests
- **Platforms:** Ubuntu, macOS, Windows
- **Node Versions:** 18.x, 20.x

### Technology Stack

- **Language:** TypeScript 5.0
- **Runtime:** Node.js 18+
- **Framework:** VS Code Extension API v1.80.0
- **Testing:** Mocha + Chai
- **Package Manager:** pnpm 8.15.9
- **Build Tool:** TypeScript Compiler
- **CI/CD:** GitHub Actions

## Quick Links

- **Repository:** [github.com/jsonify/noted](https://github.com/jsonify/noted)
- **Issues:** [Report bugs or request features](https://github.com/jsonify/noted/issues)
- **Pull Requests:** [View open PRs](https://github.com/jsonify/noted/pulls)
- **Discussions:** [Community discussions](https://github.com/jsonify/noted/discussions)

## Contributing

We welcome contributions! Here's how you can help:

### Types of Contributions

- **Bug Reports:** Found an issue? [Report it](https://github.com/jsonify/noted/issues/new)
- **Feature Requests:** Have an idea? [Suggest it](https://github.com/jsonify/noted/issues/new)
- **Code:** Submit pull requests for fixes or features
- **Documentation:** Improve guides and examples
- **Testing:** Add test coverage
- **Design:** Improve UI/UX

### Getting Started with Development

1. **Fork the repository**
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/noted.git
   cd noted
   ```
3. **Install dependencies:**
   ```bash
   pnpm install
   ```
4. **Run in development mode:**
   - Press `F5` in VS Code to launch Extension Development Host
5. **Make your changes**
6. **Test your changes:**
   ```bash
   pnpm run compile
   pnpm run test:unit
   ```
7. **Submit a pull request**

[Full Contributing Guide]({{ '/dev/contributing' | relative_url }})

## Development Workflow

### Daily Development

```bash
# Watch mode for automatic compilation
pnpm run watch

# Run unit tests
pnpm run test:unit

# Compile TypeScript
pnpm run compile

# Package extension
pnpm run package
```

### Testing Changes

1. Make code changes
2. Compile: `pnpm run compile`
3. Press `F5` to test in Extension Development Host
4. Test your changes
5. Run unit tests: `pnpm run test:unit`
6. Ensure all tests pass

### Code Quality

- Follow existing code style
- Add tests for new features
- Update documentation
- Run tests before submitting PR
- Keep commits focused and clear

## Architecture Highlights

### Modular Design

Noted uses a modular architecture with clear separation of concerns:

- **`src/extension.ts`** - Entry point and command registration
- **`src/constants.ts`** - Shared constants and templates
- **`src/services/`** - Business logic and file operations
- **`src/providers/`** - VS Code tree view providers
- **`src/commands/`** - Command handlers
- **`src/utils/`** - Validation and helper functions
- **`src/calendar/`** - Calendar view functionality
- **`src/graph/`** - Graph visualization

### Key Services

- **ConfigService** - Configuration management
- **FileSystemService** - Async file operations
- **NoteService** - Note operations (search, stats, export)
- **SearchService** - Advanced search with regex and filters
- **TagService** - Tag indexing and querying
- **LinkService** - Wiki-style links and backlinks
- **EmbedService** - Note and image embeds
- **ConnectionsService** - Connection data for backlinks and outgoing links
- **BacklinksAppendService** - Automatic backlinks sections
- **BulkOperationsService** - Multi-select operations
- **UndoService** - Undo/redo functionality
- **GraphService** - Graph data and analysis
- **PinnedNotesService** - Pinned notes management
- **ArchiveService** - Archive functionality

[Full Architecture Documentation]({{ '/dev/architecture' | relative_url }})

## Testing Infrastructure

### Test Coverage

- **325 unit tests** covering all core functionality
- **Test suites:** utilities, services, providers, commands, helpers
- **Execution time:** ~270ms for full suite
- **All tests passing** across all platforms

### CI/CD Pipeline

- **Automated testing** on every push and PR
- **Cross-platform:** Ubuntu, macOS, Windows
- **Multiple Node versions:** 18.x, 20.x
- **Matrix testing:** 6 parallel jobs
- **Automatic VSIX build** and artifact upload

[Testing Documentation]({{ '/dev/testing' | relative_url }})

## Recent Development

### Latest Features

- Auto-backlinks sections appended to notes
- YAML frontmatter tag support
- Connections panel with rich context
- Note and image embeds with section support
- Enhanced graph view with customization and focus mode
- Time-based filtering in graph view
- Comprehensive undo/redo system
- Bulk operations for notes

### Roadmap

See [plan.md](https://github.com/jsonify/noted/blob/main/plan.md) for upcoming features and development roadmap.

## Community & Support

### For Developers

- **GitHub Discussions:** Ask questions, share ideas
- **Issues:** Report bugs, request features
- **Pull Requests:** Contribute code

### For Users

- **Documentation:** [User Guide]({{ '/user/' | relative_url }})
- **Features:** [Feature Documentation]({{ '/features/' | relative_url }})
- **GitHub Issues:** Report bugs or request features

---

**Ready to contribute?** Start with the [Contributing Guide]({{ '/dev/contributing' | relative_url }})

**Need help?** [Open a discussion](https://github.com/jsonify/noted/discussions)
