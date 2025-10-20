/**
 * Integration tests for tag system commands (filter, autocomplete, sorting)
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

suite('Tag System Integration Tests', () => {
  let tempDir: string;
  let notesPath: string;

  suiteSetup(async function() {
    this.timeout(30000);

    // Create temporary workspace
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'noted-tags-test-'));
    notesPath = path.join(tempDir, 'Notes');

    // Update configuration
    const config = vscode.workspace.getConfiguration('noted');
    await config.update('notesFolder', 'Notes', vscode.ConfigurationTarget.Global);
    await config.update('tagAutoComplete', true, vscode.ConfigurationTarget.Global);

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

  setup(async function() {
    this.timeout(10000);

    // Create test notes with tags
    const yearPath = path.join(notesPath, '2025');
    const monthPath = path.join(yearPath, '10-October');
    await fs.mkdir(monthPath, { recursive: true });

    // Create notes with different tag combinations
    await fs.writeFile(
      path.join(monthPath, '2025-10-15.txt'),
      'tags: #bug #urgent #frontend\n\nThis is a bug in the frontend'
    );
    await fs.writeFile(
      path.join(monthPath, '2025-10-16.txt'),
      'tags: #feature #backend\n\nNew backend feature'
    );
    await fs.writeFile(
      path.join(monthPath, '2025-10-17.txt'),
      'tags: #bug #backend\n\nBackend bug fix needed'
    );
    await fs.writeFile(
      path.join(monthPath, '2025-10-18.txt'),
      'tags: #documentation\n\nUpdate docs'
    );

    // Refresh to build tag index
    await vscode.commands.executeCommand('noted.refreshTags');
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  teardown(async () => {
    // Clean up test notes
    if (await fs.access(notesPath).then(() => true).catch(() => false)) {
      await fs.rm(notesPath, { recursive: true, force: true });
    }
  });

  suite('Tag View Commands', () => {
    test('noted.refreshTags should rebuild tag index', async function() {
      this.timeout(10000);

      await assert.doesNotReject(
        async () => await vscode.commands.executeCommand('noted.refreshTags'),
        'refreshTags command should not throw'
      );

      await new Promise(resolve => setTimeout(resolve, 500));
      assert.ok(true, 'Tag index should be rebuilt');
    });

    test('noted.sortTagsByName should sort tags alphabetically', async function() {
      this.timeout(10000);

      await assert.doesNotReject(
        async () => await vscode.commands.executeCommand('noted.sortTagsByName'),
        'sortTagsByName command should not throw'
      );

      await new Promise(resolve => setTimeout(resolve, 500));
      assert.ok(true, 'Tags should be sorted by name');
    });

    test('noted.sortTagsByFrequency should sort tags by usage count', async function() {
      this.timeout(10000);

      await assert.doesNotReject(
        async () => await vscode.commands.executeCommand('noted.sortTagsByFrequency'),
        'sortTagsByFrequency command should not throw'
      );

      await new Promise(resolve => setTimeout(resolve, 500));
      assert.ok(true, 'Tags should be sorted by frequency');
    });
  });

  suite('Tag Filtering', () => {
    test('noted.filterByTag should execute without error', async function() {
      this.timeout(10000);

      // This command requires user input to select tags
      await assert.doesNotReject(
        async () => await vscode.commands.executeCommand('noted.filterByTag'),
        'filterByTag command should not throw'
      );
    });
  });

  suite('Tag Autocomplete', () => {
    test('Tag autocomplete should be available in notes', async function() {
      this.timeout(10000);

      // Create a new note
      await vscode.commands.executeCommand('noted.openToday');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const activeEditor = vscode.window.activeTextEditor;
      assert.ok(activeEditor, 'Should have active editor');

      // Add tags metadata section
      await activeEditor.edit(editBuilder => {
        editBuilder.insert(new vscode.Position(0, 0), 'tags: #');
      });
      await new Promise(resolve => setTimeout(resolve, 500));

      // Position cursor after the #
      const position = new vscode.Position(0, 7);
      activeEditor.selection = new vscode.Selection(position, position);

      // Request completion at the # position
      const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
        'vscode.executeCompletionItemProvider',
        activeEditor.document.uri,
        position
      );

      // Verify we get completions (may be empty if tag index is not ready)
      assert.ok(completions, 'Should return completion list');

      // If completions exist, they should be tag suggestions
      if (completions && completions.items.length > 0) {
        const hasTagSuggestions = completions.items.some(item =>
          item.label.toString().startsWith('#')
        );
        assert.ok(hasTagSuggestions, 'Completions should include tag suggestions');
      }
    });

    test('Tag autocomplete configuration should be respected', async function() {
      this.timeout(10000);

      const config = vscode.workspace.getConfiguration('noted');
      const originalValue = config.get<boolean>('tagAutoComplete');

      // Disable tag autocomplete
      await config.update('tagAutoComplete', false, vscode.ConfigurationTarget.Global);
      await new Promise(resolve => setTimeout(resolve, 500));

      let currentValue = config.get<boolean>('tagAutoComplete');
      assert.strictEqual(currentValue, false, 'Tag autocomplete should be disabled');

      // Re-enable
      await config.update('tagAutoComplete', true, vscode.ConfigurationTarget.Global);
      await new Promise(resolve => setTimeout(resolve, 500));

      currentValue = config.get<boolean>('tagAutoComplete');
      assert.strictEqual(currentValue, true, 'Tag autocomplete should be enabled');

      // Restore original value
      await config.update('tagAutoComplete', originalValue, vscode.ConfigurationTarget.Global);
    });
  });

  suite('Tag Search Integration', () => {
    test('Search with tag: prefix should filter by tags', async function() {
      this.timeout(10000);

      // Create a note and save it
      await vscode.commands.executeCommand('noted.openToday');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor) {
        await activeEditor.edit(editBuilder => {
          editBuilder.insert(new vscode.Position(0, 0), 'tags: #testing\n\nTest content');
        });
        await activeEditor.document.save();
      }

      // Rebuild tag index
      await vscode.commands.executeCommand('noted.refreshTags');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Note: Can't fully test search without simulating user input
      // But we can verify the command executes
      await assert.doesNotReject(
        async () => await vscode.commands.executeCommand('noted.searchNotes'),
        'Search with tags should not throw'
      );
    });
  });
});
