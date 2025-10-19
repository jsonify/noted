# Testing Guide for Noted Extension

This document provides comprehensive information about the testing infrastructure for the Noted VS Code extension.

## Table of Contents

- [Overview](#overview)
- [Test Infrastructure](#test-infrastructure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Coverage Reports](#coverage-reports)
- [CI/CD Pipeline](#cicd-pipeline)
- [Best Practices](#best-practices)

## Overview

The Noted extension uses **Vitest** as the primary testing framework for unit tests. The test suite covers:

- **Utils**: Validators, date helpers, folder helpers (100% coverage)
- **Services**: File system operations, template generation (100% coverage on tested modules)
- **Integration Tests**: Coming soon (using @vscode/test-cli)

### Current Test Coverage

```
✓ 103 unit tests passing
✓ 100% coverage on utils/
✓ 100% coverage on services/fileSystemService.ts
✓ 98% coverage on services/templateService.ts
```

## Test Infrastructure

### Framework: Vitest

**Why Vitest?**
- Fast, modern testing framework optimized for TypeScript
- Native ESM support
- Jest-compatible API
- Excellent developer experience with watch mode and UI

### Project Structure

```
noted/
├── src/
│   ├── __tests__/
│   │   ├── unit/
│   │   │   ├── utils/
│   │   │   │   ├── validators.test.ts
│   │   │   │   ├── dateHelpers.test.ts
│   │   │   │   └── folderHelpers.test.ts
│   │   │   └── services/
│   │   │       ├── fileSystemService.test.ts
│   │   │       └── templateService.test.ts
│   │   └── integration/
│   │       └── (future integration tests)
│   └── (source files)
├── __mocks__/
│   └── vscode.ts (VS Code API mock)
├── vitest.config.ts
└── .github/
    └── workflows/
        └── test.yml (CI/CD)
```

### Configuration Files

#### `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'out', '.vscode-test'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'out/',
        'src/test/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/test/**',
        '**/__mocks__/**',
      ],
      all: true,
      lines: 75,
      functions: 75,
      branches: 70,
      statements: 75,
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      vscode: path.resolve(__dirname, './__mocks__/vscode.ts'),
    },
  },
});
```

#### `tsconfig.json` Exclusions

```json
{
  "exclude": [
    "node_modules",
    ".vscode-test",
    "__mocks__",
    "vitest.config.ts",
    "src/__tests__"
  ]
}
```

## Running Tests

### Available Commands

```bash
# Run all tests once
pnpm run test

# Run tests in watch mode (re-runs on file changes)
pnpm run test:watch

# Run tests with interactive UI
pnpm run test:ui

# Run tests with coverage report
pnpm run test:coverage

# Run only unit tests
pnpm run test:unit
```

### Running Specific Tests

```bash
# Run tests in a specific file
pnpm run test src/__tests__/unit/utils/validators.test.ts

# Run tests matching a pattern
pnpm run test --grep "validators"

# Run tests in watch mode for a specific file
pnpm run test:watch validators
```

### Debug Tests in VS Code

Add this configuration to `.vscode/launch.json`:

```json
{
  "name": "Debug Unit Tests",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
  "args": ["run", "--threads", "false"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Writing Tests

### Unit Test Template

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { functionToTest } from '../../../path/to/module';

describe('Module Name', () => {
  describe('functionToTest', () => {
    beforeEach(() => {
      // Setup before each test
      vi.clearAllMocks();
    });

    afterEach(() => {
      // Cleanup after each test
      vi.resetAllMocks();
    });

    it('should do something', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should handle edge cases', () => {
      expect(functionToTest('')).toBe('default');
      expect(functionToTest(null)).toThrow();
    });
  });
});
```

### Mocking File System Operations

```typescript
import { vi } from 'vitest';
import { promises as fsp } from 'fs';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readdir: vi.fn(),
    // ... other fs operations
  },
}));

// In your test
it('should read file', async () => {
  vi.mocked(fsp.readFile).mockResolvedValue('file content');

  const result = await readFile('/test/file.txt');

  expect(result).toBe('file content');
  expect(fsp.readFile).toHaveBeenCalledWith('/test/file.txt', 'utf8');
});
```

### Mocking VS Code API

The VS Code API is already mocked in `__mocks__/vscode.ts`. Use it in your tests:

```typescript
import { vi } from 'vitest';
import * as vscode from 'vscode';

// Mock is automatically applied via vitest.config.ts alias

it('should show information message', () => {
  const mockConfig = {
    get: vi.fn().mockReturnValue('Notes'),
  };
  vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfig as any);

  // Your test code here
});
```

### Testing Date-Dependent Functions

```typescript
import { vi } from 'vitest';

it('should check if date is today', () => {
  // Mock current date as 2024-01-15
  const mockDate = new Date('2024-01-15T12:00:00');
  vi.setSystemTime(mockDate);

  expect(isTodayDate(2024, 0, 15)).toBe(true);
  expect(isTodayDate(2024, 0, 16)).toBe(false);

  // Clean up
  vi.useRealTimers();
});
```

### Testing Async Functions

```typescript
it('should handle async operations', async () => {
  const promise = asyncFunction();

  await expect(promise).resolves.toBe('success');
});

it('should handle async errors', async () => {
  const promise = failingAsyncFunction();

  await expect(promise).rejects.toThrow('Error message');
});
```

## Coverage Reports

### Viewing Coverage

After running `pnpm run test:coverage`, coverage reports are generated in multiple formats:

1. **Terminal Output**: Summary displayed immediately
2. **HTML Report**: Open `coverage/index.html` in a browser
3. **LCOV Report**: `coverage/lcov.info` for CI tools
4. **JSON Report**: `coverage/coverage-final.json` for programmatic access

### Coverage Thresholds

Current thresholds (configured in `vitest.config.ts`):

- Statements: 75%
- Branches: 70%
- Functions: 75%
- Lines: 75%

### Current Coverage Status

```
File                       | % Stmts | % Branch | % Funcs | % Lines
---------------------------|---------|----------|---------|----------
src/utils/validators.ts    |   100   |   100    |   100   |   100
src/utils/dateHelpers.ts   |   100   |   100    |   100   |   100
src/utils/folderHelpers.ts |   100   |   100    |   100   |   100
src/services/fileSystemService.ts | 100 | 100 | 100 | 100
src/services/templateService.ts   |  98 |  96  | 100 |  98
```

## CI/CD Pipeline

### GitHub Actions Workflow

The extension uses GitHub Actions for continuous integration:

**File**: `.github/workflows/test.yml`

**Jobs**:

1. **Test** - Runs on Ubuntu, macOS, and Windows
   - Installs dependencies with pnpm
   - Compiles TypeScript
   - Runs all unit tests

2. **Coverage** - Runs on Ubuntu only
   - Generates coverage report
   - Uploads to Codecov (if token configured)

3. **Lint** - Type-checks the codebase
   - Runs TypeScript compiler
   - Ensures no type errors

### Workflow Triggers

- **Push** to `main` or `develop` branches
- **Pull Requests** to `main` branch

### Setting Up Codecov (Optional)

1. Sign up at [codecov.io](https://codecov.io)
2. Add your repository
3. Get your Codecov token
4. Add as GitHub secret: `CODECOV_TOKEN`

### Local Pre-commit Checks

Run these commands before committing:

```bash
pnpm run compile  # Check for TypeScript errors
pnpm run test     # Run all tests
```

## Best Practices

### 1. Write Tests First (TDD)

When adding new features:
1. Write failing tests
2. Implement the feature
3. Watch tests pass
4. Refactor with confidence

### 2. Test Behavior, Not Implementation

✅ Good:
```typescript
it('should validate year folder names', () => {
  expect(isYearFolder('2024')).toBe(true);
  expect(isYearFolder('abc')).toBe(false);
});
```

❌ Bad:
```typescript
it('should use regex to validate', () => {
  expect(isYearFolder.toString()).toContain('test');
});
```

### 3. Use Descriptive Test Names

✅ Good:
```typescript
it('should return false for empty or whitespace-only names', () => {
  // ...
});
```

❌ Bad:
```typescript
it('test 1', () => {
  // ...
});
```

### 4. Arrange-Act-Assert Pattern

```typescript
it('should format date correctly', () => {
  // Arrange
  const date = new Date('2024-01-15');

  // Act
  const result = formatDateForNote(date);

  // Assert
  expect(result).toContain('January 15, 2024');
});
```

### 5. Test Edge Cases

Always test:
- Empty inputs
- Null/undefined values
- Boundary conditions
- Error cases
- Large inputs

### 6. Keep Tests Independent

Each test should:
- Set up its own data
- Clean up after itself
- Not depend on other tests
- Run in any order

### 7. Mock External Dependencies

Always mock:
- File system operations
- VS Code API calls
- Network requests
- External services

### 8. Avoid Test Duplication

Use `describe` blocks and shared setup:

```typescript
describe('validator with special characters', () => {
  const invalidChars = ['<', '>', ':', '"', '|', '?', '*'];

  invalidChars.forEach(char => {
    it(`should reject names with ${char}`, () => {
      expect(isValidCustomFolderName(`test${char}name`)).toBe(false);
    });
  });
});
```

## Future Improvements

### Planned Testing Enhancements

1. **Integration Tests**
   - Set up `@vscode/test-cli` for VS Code extension testing
   - Test commands end-to-end
   - Test tree view interactions
   - Test webview functionality

2. **Additional Unit Tests**
   - `services/configService.ts`
   - `services/noteService.ts`
   - `providers/notesTreeProvider.ts`
   - `calendar/calendarHelpers.ts`

3. **E2E Tests**
   - Full user workflows
   - Multi-step operations
   - Error handling scenarios

4. **Performance Tests**
   - Large note collections
   - Deep folder hierarchies
   - Search performance

5. **Test Documentation**
   - Add JSDoc comments to complex tests
   - Create troubleshooting guide
   - Document common testing patterns

## Troubleshooting

### Tests Fail on CI but Pass Locally

**Common causes**:
- Different Node.js versions
- Missing dependencies
- Path separators (Windows vs Unix)
- Timezone differences

**Solutions**:
```typescript
// Use path.join() for cross-platform paths
const filePath = path.join('/test', 'folder', 'file.txt');

// Mock dates consistently
vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
```

### Mock Not Working

**Issue**: Mock is not being applied

**Solution**: Ensure mock is defined before import:
```typescript
// Mock MUST come before import
vi.mock('fs', () => ({
  promises: { readFile: vi.fn() }
}));

import { readFile } from '../services/fileSystemService';
```

### Coverage Too Low

**Issue**: Coverage report shows low percentages

**Solutions**:
1. Add tests for uncovered functions
2. Remove dead code
3. Adjust coverage thresholds in `vitest.config.ts`

### Tests Timing Out

**Issue**: Tests exceed timeout limit

**Solutions**:
```typescript
// Increase timeout for specific test
it('slow operation', async () => {
  // test code
}, 20000); // 20 second timeout

// Or globally in vitest.config.ts
testTimeout: 10000
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [VS Code Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [VS Code Extension Samples](https://github.com/microsoft/vscode-extension-samples)

---

**Last Updated**: October 18, 2025
**Test Coverage**: 103 tests, 100% on utils and tested services
