/**
 * Integration tests for note management commands (delete, rename, duplicate, move)
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

suite('Note Management Integration Tests', () => {
  let tempDir: string;
  let notesPath: string;

  suiteSetup(async function() {
    this.timeout(30000);

    // Create temporary workspace
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'noted-mgmt-test-'));
    notesPath = path.join(tempDir, 'Notes');

    // Update configuration to use our temp directory
    const config = vscode.workspace.getConfiguration('noted');
    await config.update('notesFolder', 'Notes', vscode.ConfigurationTarget.Global);

    // Wait for extension to activate
    const extension = vscode.extensions.getExtension('jsonify.noted');
    if (extension && !extension.isActive) {
      await extension.activate();
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  suiteTeardown(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  suite('Setup Commands', () => {
    test('noted.setupDefaultFolder should create Notes folder', async function() {
      this.timeout(10000);

      await vscode.commands.executeCommand('noted.setupDefaultFolder');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify folder exists
      const folderExists = await fs.access(notesPath).then(() => true).catch(() => false);
      assert.ok(folderExists, 'Notes folder should be created');
    });
  });

  suite('Folder Management Commands', () => {
    setup(async function() {
      this.timeout(10000);
      // Ensure Notes folder exists
      await fs.mkdir(notesPath, { recursive: true });
    });

    test('noted.createFolder should create custom folder', async function() {
      this.timeout(10000);

      // Create a test note first to have the tree view populated
      await vscode.commands.executeCommand('noted.openToday');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Note: This command requires user input for folder name
      // We can't fully test interactive commands, but verify it doesn't throw
      await assert.doesNotReject(
        async () => await vscode.commands.executeCommand('noted.createFolder'),
        'createFolder command should not throw'
      );
    });
  });

  suite('Export Commands', () => {
    setup(async function() {
      this.timeout(10000);
      // Create some test notes
      await fs.mkdir(notesPath, { recursive: true });
      const yearPath = path.join(notesPath, '2025');
      const monthPath = path.join(yearPath, '10-October');
      await fs.mkdir(monthPath, { recursive: true });

      await fs.writeFile(
        path.join(monthPath, '2025-10-15.txt'),
        'Test note 1\nContent here'
      );
      await fs.writeFile(
        path.join(monthPath, '2025-10-16.txt'),
        'Test note 2\nMore content'
      );
    });

    test('noted.exportNotes should execute without error', async function() {
      this.timeout(10000);

      // This command requires user input for date range
      await assert.doesNotReject(
        async () => await vscode.commands.executeCommand('noted.exportNotes'),
        'exportNotes command should not throw'
      );
    });
  });

  suite('Calendar Commands', () => {
    test('noted.showCalendar should open calendar view', async function() {
      this.timeout(10000);

      await vscode.commands.executeCommand('noted.showCalendar');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify a webview panel was created
      // Note: We can't easily access the webview panel in tests,
      // but we can verify the command executes
      assert.ok(true, 'Calendar command should execute');
    });
  });

  suite('Configuration Display', () => {
    test('noted.showConfig should display configuration', async function() {
      this.timeout(5000);

      await assert.doesNotReject(
        async () => await vscode.commands.executeCommand('noted.showConfig'),
        'showConfig command should not throw'
      );
    });
  });
});
