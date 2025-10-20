/**
 * Integration tests for Noted extension commands
 * These tests run in the VS Code Extension Host environment
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

suite('Noted Extension Integration Tests', () => {
  let tempDir: string;
  let workspaceFolder: vscode.WorkspaceFolder;

  suiteSetup(async function() {
    // Increase timeout for extension activation
    this.timeout(30000);

    // Create temporary workspace
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'noted-integration-'));

    // Update workspace folders
    const workspaceFolderUri = vscode.Uri.file(tempDir);
    workspaceFolder = {
      uri: workspaceFolderUri,
      name: path.basename(tempDir),
      index: 0
    };

    // Wait for extension to activate
    const extension = vscode.extensions.getExtension('jsonify.noted');
    if (extension && !extension.isActive) {
      await extension.activate();
    }

    // Give extension time to fully initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  suiteTeardown(async () => {
    // Clean up temporary directory
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  suite('Note Creation Commands', () => {
    test('noted.openToday should create today\'s note', async function() {
      this.timeout(10000);

      // Execute command
      await vscode.commands.executeCommand('noted.openToday');

      // Wait for file to be created and opened
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify active editor has a document
      const activeEditor = vscode.window.activeTextEditor;
      assert.ok(activeEditor, 'No active editor found');

      // Verify the file path contains today's date
      const today = new Date();
      const year = today.getFullYear().toString();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const expectedDateStr = `${year}-${month}-${day}`;

      const filePath = activeEditor.document.fileName;
      assert.ok(
        filePath.includes(expectedDateStr),
        `File path ${filePath} should contain ${expectedDateStr}`
      );

      // Verify file exists
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      assert.ok(fileExists, 'Note file should exist');
    });

    test('noted.openWithTemplate should create note with problem-solution template', async function() {
      this.timeout(10000);

      // Execute command with template type
      await vscode.commands.executeCommand('noted.openWithTemplate', 'problem-solution');

      // Wait for file to be created
      await new Promise(resolve => setTimeout(resolve, 1000));

      const activeEditor = vscode.window.activeTextEditor;
      assert.ok(activeEditor, 'No active editor found');

      const content = activeEditor.document.getText();

      // Verify template structure
      assert.ok(content.includes('PROBLEM:'), 'Should contain PROBLEM section');
      assert.ok(content.includes('STEPS TAKEN:'), 'Should contain STEPS TAKEN section');
      assert.ok(content.includes('SOLUTION:'), 'Should contain SOLUTION section');
      assert.ok(content.includes('NOTES:'), 'Should contain NOTES section');
    });

    test('noted.openWithTemplate should create note with meeting template', async function() {
      this.timeout(10000);

      await vscode.commands.executeCommand('noted.openWithTemplate', 'meeting');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const activeEditor = vscode.window.activeTextEditor;
      assert.ok(activeEditor, 'No active editor found');

      const content = activeEditor.document.getText();
      assert.ok(content.includes('MEETING:'), 'Should contain MEETING section');
      assert.ok(content.includes('ATTENDEES:'), 'Should contain ATTENDEES section');
      assert.ok(content.includes('AGENDA:'), 'Should contain AGENDA section');
      assert.ok(content.includes('ACTION ITEMS:'), 'Should contain ACTION ITEMS section');
    });

    test('noted.openWithTemplate should create note with research template', async function() {
      this.timeout(10000);

      await vscode.commands.executeCommand('noted.openWithTemplate', 'research');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const activeEditor = vscode.window.activeTextEditor;
      assert.ok(activeEditor, 'No active editor found');

      const content = activeEditor.document.getText();
      assert.ok(content.includes('RESEARCH:'), 'Should contain RESEARCH section');
      assert.ok(content.includes('QUESTIONS:'), 'Should contain QUESTIONS section');
      assert.ok(content.includes('FINDINGS:'), 'Should contain FINDINGS section');
      assert.ok(content.includes('SOURCES:'), 'Should contain SOURCES section');
    });

    test('noted.openWithTemplate should create note with quick template', async function() {
      this.timeout(10000);

      await vscode.commands.executeCommand('noted.openWithTemplate', 'quick');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const activeEditor = vscode.window.activeTextEditor;
      assert.ok(activeEditor, 'No active editor found');

      const content = activeEditor.document.getText();
      // Quick template just has date header
      const today = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      assert.ok(content.includes(today), 'Should contain today\'s date');
    });
  });

  suite('Editor Commands', () => {
    test('noted.insertTimestamp should insert timestamp at cursor', async function() {
      this.timeout(10000);

      // Create a new document
      const doc = await vscode.workspace.openTextDocument({
        content: 'Test content',
        language: 'plaintext'
      });
      const editor = await vscode.window.showTextDocument(doc);

      // Move cursor to end
      const endPosition = new vscode.Position(0, 12); // After "Test content"
      editor.selection = new vscode.Selection(endPosition, endPosition);

      // Insert timestamp
      await vscode.commands.executeCommand('noted.insertTimestamp');
      await new Promise(resolve => setTimeout(resolve, 500));

      const content = editor.document.getText();

      // Verify timestamp format [HH:MM AM/PM]
      const timestampRegex = /\[\d{1,2}:\d{2} [AP]M\]/;
      assert.ok(timestampRegex.test(content), `Content "${content}" should contain timestamp`);
    });
  });

  suite('Configuration Commands', () => {
    test('noted.changeFormat should toggle file format', async function() {
      this.timeout(10000);

      const config = vscode.workspace.getConfiguration('noted');
      const originalFormat = config.get<string>('fileFormat');

      // Execute toggle command
      await vscode.commands.executeCommand('noted.changeFormat');
      await new Promise(resolve => setTimeout(resolve, 500));

      const newFormat = config.get<string>('fileFormat');
      const expectedFormat = originalFormat === 'txt' ? 'md' : 'txt';

      assert.strictEqual(newFormat, expectedFormat, 'File format should toggle');

      // Restore original format
      await config.update('fileFormat', originalFormat, vscode.ConfigurationTarget.Global);
    });
  });

  suite('View Commands', () => {
    test('noted.refresh should not throw error', async function() {
      this.timeout(5000);

      // This command refreshes the tree view
      await assert.doesNotReject(
        async () => await vscode.commands.executeCommand('noted.refresh'),
        'Refresh command should not throw'
      );
    });

    test('noted.showStats should display statistics', async function() {
      this.timeout(10000);

      // Create a test note first
      await vscode.commands.executeCommand('noted.openToday');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Show stats
      await vscode.commands.executeCommand('noted.showStats');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Note: We can't easily verify the information message content
      // but we can verify the command executes without error
      assert.ok(true, 'showStats should complete without error');
    });
  });

  suite('Search Commands', () => {
    test('noted.searchNotes should execute without error', async function() {
      this.timeout(10000);

      // Create a test note with searchable content
      await vscode.commands.executeCommand('noted.openToday');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor) {
        await activeEditor.edit(editBuilder => {
          editBuilder.insert(new vscode.Position(0, 0), 'Test searchable content');
        });
        await activeEditor.document.save();
      }

      // Execute search (will show input box, but command should execute)
      // Note: Can't fully test interactive commands without simulating user input
      await assert.doesNotReject(
        async () => await vscode.commands.executeCommand('noted.searchNotes'),
        'Search command should not throw'
      );
    });
  });
});
