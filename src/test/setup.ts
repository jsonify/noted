/**
 * Test setup - registers mocks for VS Code API
 */
import Module from 'module';
import * as vscode from './mocks/vscode';

// Mock the vscode module
const originalRequire = Module.prototype.require;

(Module.prototype as any).require = function(id: string) {
  if (id === 'vscode') {
    return vscode;
  }
  return originalRequire.apply(this, arguments as any);
};
