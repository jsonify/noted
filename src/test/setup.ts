/**
 * Test setup - registers mocks for VS Code API
 * This file should ONLY be loaded for unit tests, never for integration tests!
 */
import Module from 'module';
import * as vscode from './mocks/vscode';

// Check if we're in an integration test environment (VS Code Extension Host)
// The VS Code Extension Host environment has process.env.VSCODE_PID set
const isIntegrationTest = process.env.VSCODE_PID !== undefined;

if (isIntegrationTest) {
  // Don't mock anything in integration test environment
  console.log('[NOTED TEST] Skipping mocks - running in VS Code Extension Host');
} else {
  // Unit test environment - set up mocks
  const originalRequire = Module.prototype.require;

  // Keep track of loaded modules for cleanup
  const loadedModules = new Set<string>();

  // Override require to provide our mock vscode module
  (Module.prototype as any).require = function(id: string) {
    if (id === 'vscode') {
      loadedModules.add('vscode');
      return vscode;
    }
    return originalRequire.apply(this, arguments as any);
  };

  // Initialize required VS Code namespaces
  (global as any).vscode = vscode;
}

// Add cleanup helper
export function cleanupMocks() {
  // No-op in integration tests
  if (isIntegrationTest) {
    return;
  }

  // Note: We don't try to clear require.cache for 'vscode'
  // since it's not a real module that can be resolved
}
