# Automated Testing Guide

This document describes the automated testing infrastructure for the Noted VS Code extension.

## Test Overview

The project uses a comprehensive testing setup with **66 passing unit tests** covering:
- Utilities (validators, date helpers, folder operations)
- Services (file system, templates, configuration)  
- Providers (tree items and tree view)

## Running Tests

### Unit Tests (Recommended)

```bash
# Run all unit tests
pnpm run test:unit

# Run with compilation
pnpm run pretest && pnpm run test:unit
```

Unit tests run in ~120ms and don't require a VS Code instance.

### Integration Tests

```bash
# Run all tests including VS Code extension tests
pnpm run test
```

This requires VS Code to be installed and will launch an Extension Development Host.

## Test Structure

```
src/test/
├── mocks/
│   └── vscode.ts           # Mock VS Code API for unit tests
├── setup.ts                # Test environment setup
├── runTest.ts              # Extension test runner
├── suite/
│   └── index.ts            # Mocha test suite configuration
└── unit/
    ├── validators.test.ts        # Folder name validation (9 tests)
    ├── dateHelpers.test.ts       # Date formatting (14 tests)
    ├── folderHelpers.test.ts     # Folder operations (7 tests)
    ├── fileSystemService.test.ts # File I/O (11 tests)
    ├── templateService.test.ts   # Templates (9 tests)
    └── treeItems.test.ts         # Tree view items (16 tests)
```

## CI/CD Integration with GitHub Actions

### Workflows Created

#### 1. Full CI Pipeline (`.github/workflows/ci.yml`)
**Runs on:** Push to `main`, Pull Requests to `main`

**Jobs:**
- **unit-tests**: Runs on Ubuntu, macOS, Windows with Node 18.x and 20.x
- **lint**: Type checking on Ubuntu with Node 20.x
- **build**: Builds VSIX package and uploads artifact

**What it does:**
1. Checks out code
2. Sets up Node.js and pnpm
3. Installs dependencies with cache
4. Compiles TypeScript
5. Runs all 66 unit tests
6. Builds the extension package

#### 2. Test Workflow (`.github/workflows/test.yml`)
**Runs on:** Push to `main`/`develop`, Pull Requests

**Features:**
- Cross-platform testing (Ubuntu, macOS, Windows)
- Multiple Node versions (18.x, 20.x)
- Optional integration tests on Linux (with xvfb)

### Status Badges

Add these to your README to show build status:

```markdown
[![CI](https://github.com/jsonify/noted/actions/workflows/ci.yml/badge.svg)](https://github.com/jsonify/noted/actions/workflows/ci.yml)
[![Tests](https://github.com/jsonify/noted/actions/workflows/test.yml/badge.svg)](https://github.com/jsonify/noted/actions/workflows/test.yml)
```

## How GitHub Actions Will Run

### On Every Push to Main

1. **Parallel Test Jobs** across 6 environments:
   - Ubuntu + Node 18
   - Ubuntu + Node 20
   - macOS + Node 18
   - macOS + Node 20
   - Windows + Node 18
   - Windows + Node 20

2. **Lint Job** runs TypeScript compiler

3. **Build Job** (only if tests pass):
   - Builds the .vsix package
   - Uploads as artifact
   - Available for 7 days

### On Every Pull Request

- Same as above
- Results appear as checks on the PR
- Must pass before merging (if branch protection enabled)

## First Time Setup

After pushing these changes, GitHub Actions will automatically:

1. Detect the workflow files in `.github/workflows/`
2. Start running on the next push
3. Show results in the "Actions" tab of your repository

### Enable Branch Protection (Optional)

To require tests to pass before merging:

1. Go to Settings → Branches
2. Add branch protection rule for `main`
3. Check "Require status checks to pass before merging"
4. Select the CI checks you want to require

## Testing Locally Before Push

```bash
# Run what CI will run
pnpm install --frozen-lockfile
pnpm run compile
pnpm run test:unit
```

If all these pass locally, they should pass in CI.

## Viewing Test Results

### On GitHub

1. Go to your repository
2. Click "Actions" tab
3. Click on any workflow run
4. View logs for each job
5. Download VSIX artifact if build succeeded

### In Pull Requests

- Status checks appear at the bottom of the PR
- Click "Details" to see full logs
- Green checkmark = all tests passed
- Red X = something failed

## Troubleshooting CI Failures

### "pnpm: command not found"
- The pnpm/action-setup@v4 step should handle this
- Check that the pnpm version matches your packageManager in package.json

### Tests pass locally but fail in CI
- Check Node version differences
- Verify pnpm-lock.yaml is committed
- Look for timezone-dependent tests
- Check for hardcoded paths

### Build artifacts not uploaded
- Check that all tests passed first
- Verify the build job has `needs: [unit-tests, lint]`

## Future Enhancements

- [ ] Add code coverage reporting
- [ ] Publish coverage to Codecov
- [ ] Add automated changelog generation
- [ ] Deploy releases automatically
- [ ] Add E2E tests in CI
