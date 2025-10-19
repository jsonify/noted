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
  // Reset all loaded modules
  loadedModules.forEach(id => {
    delete require.cache[require.resolve(id)];
  });
  loadedModules.clear();

  // Restore original require
  (Module.prototype as any).require = originalRequire;
}

// Initialize required VS Code namespaces
(global as any).vscode = vscode;
