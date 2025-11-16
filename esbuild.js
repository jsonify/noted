#!/usr/bin/env node

/**
 * esbuild configuration for bundling the VS Code extension
 *
 * This bundles all TypeScript source files into a single extension.js file,
 * dramatically reducing file count and improving load performance.
 */

const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',

  setup(build) {
    build.onStart(() => {
      console.log('[build] build started');
    });
    build.onEnd(result => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        if (location) {
          console.error(`    ${location.file}:${location.line}:${location.column}:`);
        }
      });
      result.warnings.forEach(({ text, location }) => {
        console.warn(`⚠ [WARNING] ${text}`);
        if (location) {
          console.warn(`    ${location.file}:${location.line}:${location.column}:`);
        }
      });
      console.log('[build] build finished');
    });
  },
};

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'out/extension.js',
    external: ['vscode'],
    logLevel: 'silent',
    plugins: [
      esbuildProblemMatcherPlugin,
    ],
    // Bundle all dependencies except those in VS Code's runtime
    packages: 'bundle',
    // Load HTML/CSS/client JS files from browser directory as text to bundle them
    loader: {
      '.html': 'text',
      '.css': 'text',
      '.client.js': 'text',
    },
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
