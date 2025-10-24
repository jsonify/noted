# Development Scripts Guide for Noted VSCode Extension

This guide explains when and how to use the different npm/pnpm scripts defined in [`package.json`](package.json:213-222) for the Noted VSCode extension development workflow.

## 📋 Quick Reference

| Script | Command | Purpose | When to Use |
|--------|---------|---------|-------------|
| `compile` | `pnpm run compile` | One-time TypeScript compilation | Before testing, after code changes |
| `watch` | `pnpm run watch` | Continuous TypeScript compilation | During active development |
| `package` | `pnpm run package` | Create `.vsix` extension package | For distribution or testing |
| `changelog` | `pnpm run changelog` | Generate changelog from commits | Before releases, after features |
| `release:patch` | `pnpm run release:patch` | Release patch version (1.0.8 → 1.0.9) | Bug fixes, small improvements |
| `release:minor` | `pnpm run release:minor` | Release minor version (1.0.8 → 1.1.0) | New features, enhancements |
| `release:major` | `pnpm run release:major` | Release major version (1.0.8 → 2.0.0) | Breaking changes, major rewrites |

## 🔧 Development Scripts

### `compile` - TypeScript Compilation
```bash
pnpm run compile
```

**What it does:** Compiles TypeScript source files from [`src/`](src/) to JavaScript in `out/` directory using [`tsc -p ./`](tsconfig.json).

**When to use:**
- After making code changes and before testing
- Before creating a package
- When you need a one-time build (not continuous)
- To check for TypeScript compilation errors

**Output:** Creates compiled JavaScript files in `out/` directory, with the main entry point at [`out/extension.js`](package.json:21).

### `watch` - Continuous Compilation
```bash
pnpm run watch
```

**What it does:** Runs TypeScript compiler in watch mode using `tsc -watch -p ./`.

**When to use:**
- During active development sessions
- When you want automatic recompilation on file changes
- For continuous feedback on TypeScript errors
- When testing the extension repeatedly

**Benefits:**
- Automatically recompiles when you save TypeScript files
- Faster subsequent builds (incremental compilation)
- Immediate feedback on compilation errors

**How to stop:** Press `Ctrl+C` in the terminal.

## 📦 Packaging Scripts

### `package` - Create Extension Package
```bash
pnpm run package
```

**What it does:** Uses `vsce package` to create a `.vsix` file for distribution.

**When to use:**
- Creating a distributable extension package
- Testing the extension in a clean VS Code instance
- Preparing for marketplace publication
- Sharing the extension with others

**Requirements:**
- Code must be compiled first (automatically handled by `vscode:prepublish`)
- All files specified in [`.vscodeignore`](.vscodeignore) will be excluded

**Output:** Creates a `noted-{version}.vsix` file (e.g., `noted-1.0.8.vsix`).

### `vscode:prepublish` - Pre-publication Hook
```bash
# Runs automatically before packaging
pnpm run vscode:prepublish
```

**What it does:** Automatically runs [`compile`](package.json:214) before packaging.

**When it runs:**
- Automatically before `vsce package`
- Automatically before `vsce publish`
- Ensures code is compiled before distribution

## 📝 Documentation Scripts

### `changelog` - Generate Changelog
```bash
pnpm run changelog
```

**What it does:** Uses `conventional-changelog` to generate [`CHANGELOG.md`](CHANGELOG.md) from git commit messages following Angular convention.

**When to use independently:**
- **After completing a milestone** - When you've finished a set of related features/fixes but aren't ready to release yet
- **Before a planned release** - To review what changes will be included and ensure proper documentation
- **Weekly/monthly documentation** - To keep changelog up-to-date for team visibility
- **After merging feature branches** - To document completed work even if release is later
- **Before major announcements** - To prepare release notes or feature summaries
- **When testing changelog generation** - To verify your commit messages are generating proper entries

**Standalone workflow:**
```bash
# After completing some work with conventional commits
git log --oneline  # Review recent commits
pnpm run changelog # Generate updated changelog
git add CHANGELOG.md
git commit -m "docs: update changelog with recent features"
```

**Note:** The release scripts (`release:patch`, `release:minor`, `release:major`) automatically run this command, so you don't need to run it separately before releases unless you want to preview the changes first.

**Requirements:**
- Git commits should follow [Conventional Commits](https://www.conventionalcommits.org/) format:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation changes
  - `chore:` for maintenance tasks

**Example commit messages:**
```
feat: add search functionality to notes
fix: resolve timestamp insertion bug
docs: update README with new features
chore: update dependencies
```

## 🚀 Release Scripts

All release scripts follow this pattern:
1. **Generate changelog** from commit history (before version bump)
2. **Commit changelog** to git (separate commit)
3. **Bump version** in [`package.json`](package.json:5) and create git tag
4. **Create package** for distribution

**⚠️ Important:** The changelog must be generated BEFORE the version bump and committed as a separate step because `conventional-changelog` uses git tags to determine which commits to include. If the tag is created first, there are no "new" commits to process.

### `release:patch` - Patch Release
```bash
pnpm run release:patch
```

**Version bump:** `1.0.8` → `1.0.9`

**When to use:**
- Bug fixes
- Small improvements
- Security patches
- Documentation updates
- Non-breaking changes

**Examples:**
- Fixed timestamp formatting issue
- Improved error handling
- Updated help text
- Performance optimizations

### `release:minor` - Minor Release
```bash
pnpm run release:minor
```

**Version bump:** `1.0.8` → `1.1.0`

**When to use:**
- New features
- New commands or functionality
- Enhanced existing features
- Backward-compatible changes

**Examples:**
- Added export functionality
- New search capabilities
- Additional configuration options
- New file format support

### `release:major` - Major Release
```bash
pnpm run release:major
```

**Version bump:** `1.0.8` → `2.0.0`

**When to use:**
- Breaking changes
- Complete rewrites or restructures
- Changes that require user migration
- Removal of deprecated features

**Examples:**
- Changed extension API
- Removed old commands
- Complete UI redesign
- Changed configuration structure

## 🔄 Typical Development Workflows

### Daily Development (Testing During Development)
```bash
# Start development session
pnpm run watch

# Make code changes...
# Watch automatically recompiles

# Test in VS Code Extension Host (F5 or Run > Start Debugging)
# This uses the compiled files directly - no packaging needed
```

### Testing a Pre-Release Build (Optional)
```bash
# Only needed if you want to test the actual packaged extension
# This creates a package with the CURRENT version number
pnpm run compile
pnpm run package

# Install and test the .vsix file (same version as before)
code --install-extension noted-1.0.8.vsix
```

**⚠️ Important:** The "Testing a Build" workflow above does NOT increment the version number. It creates a package with whatever version is currently in [`package.json`](package.json:5). This is only useful for testing the packaging process itself.

### Preparing a Release

#### For Bug Fixes (Patch Release: 1.0.8 → 1.0.9)
```bash
# Make sure all changes are committed
git status

# Create patch release (bumps version, updates changelog, creates new package)
pnpm run release:patch

# This creates noted-1.0.9.vsix (NEW version number!)
ls -la *.vsix

# Review the version bump and changelog
git log --oneline -3
cat CHANGELOG.md

# Install the NEW version to test
code --install-extension noted-1.0.9.vsix

# Publish to marketplace (if desired)
vsce publish
```

#### For New Features (Minor Release: 1.0.8 → 1.1.0)
```bash
# Make sure all changes are committed
git add .
git commit -m "feat: add new search functionality"

# Create minor release (bumps version, updates changelog, creates new package)
pnpm run release:minor

# This creates noted-1.1.0.vsix (NEW version number!)
ls -la *.vsix

# Review generated changelog, version tag, and package
git log --oneline -3
cat CHANGELOG.md

# Install the NEW version to test
code --install-extension noted-1.1.0.vsix
```

#### For Breaking Changes (Major Release: 1.0.8 → 2.0.0)
```bash
# Make sure all changes are committed and tested
git add .
git commit -m "feat!: redesign extension API"

# Create major release (bumps version, updates changelog, creates new package)
pnpm run release:major

# This creates noted-2.0.0.vsix (NEW version number!)
ls -la *.vsix

# Carefully review changelog and version tag for breaking changes
git log --oneline -3
cat CHANGELOG.md

# Install the NEW version to test
code --install-extension noted-2.0.0.vsix
```

## ⚠️ Important Notes

1. **Always commit changes** before running release scripts
2. **Test thoroughly** before creating releases
3. **Review the generated changelog** to ensure accuracy
4. **Use conventional commit messages** for better changelog generation
5. **The `watch` script** needs to be stopped (`Ctrl+C`) when switching between development and packaging
6. **Package files** (`.vsix`) should not be committed to git
7. **Two different workflows**:
   - **Development testing**: Use F5 (Extension Host) - no packaging needed
   - **Release creation**: Use `release:*` scripts - creates new version number and package
8. **Release scripts automatically**:
   - Update [`package.json`](package.json:5) version number
   - Generate and commit updated [`CHANGELOG.md`](CHANGELOG.md)
   - Create version tags in git
   - Create new `.vsix` package with the NEW version number
9. **Version numbers**: Only `release:*` scripts increment versions. The `package` script uses the current version in [`package.json`](package.json:5)
10. **Changelog generation** is fully automated - no manual intervention needed

## 🛠️ Development Dependencies

The scripts rely on these development dependencies from [`package.json`](package.json:224-229):

- **`typescript`**: TypeScript compiler for [`compile`](package.json:215) and [`watch`](package.json:216)
- **`conventional-changelog-cli`**: Generates changelog from git commits for [`changelog`](package.json:218)
- **`@types/vscode`**: TypeScript definitions for VS Code extension API
- **`@types/node`**: TypeScript definitions for Node.js APIs

## 📚 Additional Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [VS Code Extension Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)