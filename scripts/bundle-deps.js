#!/usr/bin/env node

/**
 * Bundle dependencies for VS Code extension packaging
 *
 * This script copies required runtime dependencies to out/node_modules/
 * so they're included in the packaged .vsix file when using --no-dependencies.
 *
 * This is necessary because vsce's --no-dependencies flag excludes all node_modules,
 * but we need certain runtime dependencies available in the extension.
 */

const fs = require('fs');
const path = require('path');

// Dependencies that need to be bundled with the extension
const DEPS_TO_BUNDLE = [
  'marked',
  'markdown-it-regex',
  'js-yaml'
];

const OUT_DIR = path.join(__dirname, '..', 'out', 'node_modules');

/**
 * Resolve the actual location of a package in pnpm's node_modules
 * @param {string} packageName - Name of the package to resolve
 * @returns {string} Absolute path to the package directory
 */
function resolvePackagePath(packageName) {
  try {
    // First try to resolve package.json directly
    try {
      const packageJsonPath = require.resolve(`${packageName}/package.json`, {
        paths: [path.join(__dirname, '..')]
      });
      return path.dirname(packageJsonPath);
    } catch (e) {
      // If package.json is not exported, resolve the main entry point instead
      const mainPath = require.resolve(packageName, {
        paths: [path.join(__dirname, '..')]
      });

      // Walk up the directory tree to find the package root
      let currentDir = path.dirname(mainPath);
      while (currentDir !== path.dirname(currentDir)) {
        const potentialPackageJson = path.join(currentDir, 'package.json');
        if (fs.existsSync(potentialPackageJson)) {
          const pkg = JSON.parse(fs.readFileSync(potentialPackageJson, 'utf8'));
          if (pkg.name === packageName) {
            return currentDir;
          }
        }
        currentDir = path.dirname(currentDir);
      }

      throw new Error(`Could not find package root for ${packageName}`);
    }
  } catch (error) {
    console.error(`Error resolving ${packageName}:`, error.message);
    process.exit(1);
  }
}

/**
 * Recursively copy a directory
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
function copyDir(src, dest) {
  // Create destination directory
  fs.mkdirSync(dest, { recursive: true });

  // Read all entries in source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Main bundling logic
 */
function bundleDependencies() {
  console.log('Bundling dependencies for extension packaging...\n');

  // Create out/node_modules directory if it doesn't exist
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Bundle each dependency
  for (const dep of DEPS_TO_BUNDLE) {
    console.log(`Bundling ${dep}...`);

    const sourcePath = resolvePackagePath(dep);
    const destPath = path.join(OUT_DIR, dep);

    // Copy the package
    copyDir(sourcePath, destPath);

    console.log(`  ✓ Copied from ${sourcePath}`);
    console.log(`  ✓ To ${destPath}\n`);
  }

  console.log(`✓ Successfully bundled ${DEPS_TO_BUNDLE.length} dependencies`);
}

// Run the bundling
try {
  bundleDependencies();
} catch (error) {
  console.error('Error bundling dependencies:', error);
  process.exit(1);
}
