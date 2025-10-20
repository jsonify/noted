/**
 * Test setup - registers mocks for VS Code API
 */
import Module from 'module';
import * as vscode from './mocks/vscode';

// Mock the vscode module
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

// Add cleanup helper
export function cleanupMocks() {
  // Clear the loaded modules set
  loadedModules.clear();

  // Note: We don't try to clear require.cache for 'vscode'
  // since it's not a real module that can be resolved
}

// Initialize required VS Code namespaces
(global as any).vscode = vscode;
