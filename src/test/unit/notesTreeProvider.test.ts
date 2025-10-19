import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as vscode from 'vscode';
import { NotesTreeProvider } from '../../providers/notesTreeProvider';
import { TagService } from '../../services/tagService';

describe('NotesTreeProvider Tag Filtering', () => {
  let tempDir: string;
  let notesProvider: NotesTreeProvider;
  let tagService: TagService;

  beforeEach(async () => {
    // Create temporary directory for test notes
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'noted-filter-test-'));

    // Create NotesTreeProvider instance
    notesProvider = new NotesTreeProvider();
    tagService = new TagService(tempDir);

    // Configure the notes path for testing
    const config = vscode.workspace.getConfiguration('noted');
    await config.update('notesFolder', tempDir, vscode.ConfigurationTarget.Global);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });

    // Reset configuration
    const config = vscode.workspace.getConfiguration('noted');
    await config.update('notesFolder', undefined, vscode.ConfigurationTarget.Global);
  });

  describe('Filter State Management', () => {
    it('should initialize with no active filters', () => {
      expect(notesProvider.getActiveFilters()).to.deep.equal([]);
    });

    it('should add a single tag filter', () => {
      notesProvider.setTagFilters(['bug']);
      expect(notesProvider.getActiveFilters()).to.deep.equal(['bug']);
    });

    it('should add multiple tag filters', () => {
      notesProvider.setTagFilters(['bug', 'urgent']);
      expect(notesProvider.getActiveFilters()).to.have.members(['bug', 'urgent']);
    });

    it('should replace existing filters when setting new filters', () => {
      notesProvider.setTagFilters(['bug']);
      notesProvider.setTagFilters(['feature']);
      expect(notesProvider.getActiveFilters()).to.deep.equal(['feature']);
    });

    it('should clear all filters', () => {
      notesProvider.setTagFilters(['bug', 'urgent']);
      notesProvider.clearTagFilters();
      expect(notesProvider.getActiveFilters()).to.deep.equal([]);
    });

    it('should normalize tag filters to lowercase', () => {
      notesProvider.setTagFilters(['BUG', 'Urgent']);
      expect(notesProvider.getActiveFilters()).to.deep.equal(['bug', 'urgent']);
    });

    it('should remove duplicate filters', () => {
      notesProvider.setTagFilters(['bug', 'BUG', 'bug']);
      expect(notesProvider.getActiveFilters()).to.deep.equal(['bug']);
    });

    it('should handle empty filter array', () => {
      notesProvider.setTagFilters([]);
      expect(notesProvider.getActiveFilters()).to.deep.equal([]);
    });
  });

  describe('filterByTag', () => {
    beforeEach(async () => {
      // Create test notes with different tags
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-15.txt'),
        'tags: #bug #urgent\n\nBug note'
      );
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-16.txt'),
        'tags: #feature\n\nFeature note'
      );
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-17.txt'),
        'tags: #bug #feature\n\nBoth tags'
      );
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-18.txt'),
        'No tags\n\nNo tags here'
      );

      // Build tag index
      await tagService.buildTagIndex();
    });

    it('should filter notes by single tag', async () => {
      notesProvider.filterByTag('bug', tagService);

      const filteredPaths = notesProvider.getFilteredNotePaths();
      expect(filteredPaths).to.have.lengthOf(2);
      expect(filteredPaths.some(p => p.includes('2025-10-15.txt'))).to.be.true;
      expect(filteredPaths.some(p => p.includes('2025-10-17.txt'))).to.be.true;
    });

    it('should filter notes by multiple tags with AND logic', async () => {
      notesProvider.filterByTag(['bug', 'feature'], tagService);

      const filteredPaths = notesProvider.getFilteredNotePaths();
      expect(filteredPaths).to.have.lengthOf(1);
      expect(filteredPaths[0]).to.include('2025-10-17.txt');
    });

    it('should return empty array when no notes match filter', async () => {
      notesProvider.filterByTag('nonexistent', tagService);

      const filteredPaths = notesProvider.getFilteredNotePaths();
      expect(filteredPaths).to.deep.equal([]);
    });

    it('should return all notes when filter is cleared', async () => {
      notesProvider.filterByTag('bug', tagService);
      notesProvider.clearTagFilters();

      expect(notesProvider.getActiveFilters()).to.deep.equal([]);
    });

    it('should handle tag normalization in filter', async () => {
      notesProvider.filterByTag('BUG', tagService);

      const filteredPaths = notesProvider.getFilteredNotePaths();
      expect(filteredPaths).to.have.lengthOf(2);
    });
  });

  describe('isNoteFiltered', () => {
    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-15.txt'),
        'tags: #bug #urgent\n\nContent'
      );
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-16.txt'),
        'tags: #feature\n\nContent'
      );

      await tagService.buildTagIndex();
    });

    it('should return true for notes matching active filters', async () => {
      const notePath = path.join(tempDir, '2025', '10-October', '2025-10-15.txt');
      notesProvider.filterByTag('bug', tagService);

      expect(notesProvider.isNoteFiltered(notePath)).to.be.true;
    });

    it('should return false for notes not matching active filters', async () => {
      const notePath = path.join(tempDir, '2025', '10-October', '2025-10-16.txt');
      notesProvider.filterByTag('bug', tagService);

      expect(notesProvider.isNoteFiltered(notePath)).to.be.false;
    });

    it('should return true when no filters are active', async () => {
      const notePath = path.join(tempDir, '2025', '10-October', '2025-10-15.txt');

      expect(notesProvider.isNoteFiltered(notePath)).to.be.true;
    });

    it('should handle multiple tag filters with AND logic', async () => {
      const note1Path = path.join(tempDir, '2025', '10-October', '2025-10-15.txt');
      const note2Path = path.join(tempDir, '2025', '10-October', '2025-10-16.txt');

      notesProvider.filterByTag(['bug', 'urgent'], tagService);

      expect(notesProvider.isNoteFiltered(note1Path)).to.be.true;
      expect(notesProvider.isNoteFiltered(note2Path)).to.be.false;
    });
  });

  describe('getFilterDescription', () => {
    it('should return empty string when no filters active', () => {
      expect(notesProvider.getFilterDescription()).to.equal('');
    });

    it('should return filter description for single tag', () => {
      notesProvider.setTagFilters(['bug']);
      expect(notesProvider.getFilterDescription()).to.equal('Filtered by: #bug');
    });

    it('should return filter description for multiple tags', () => {
      notesProvider.setTagFilters(['bug', 'urgent']);
      const desc = notesProvider.getFilterDescription();
      expect(desc).to.include('#bug');
      expect(desc).to.include('#urgent');
      expect(desc).to.include('Filtered by:');
    });

    it('should format tags with hash prefix', () => {
      notesProvider.setTagFilters(['bug']);
      expect(notesProvider.getFilterDescription()).to.include('#bug');
    });
  });

  describe('Filter Integration with Tree View', () => {
    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-15.txt'),
        'tags: #bug\n\nBug note'
      );
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-16.txt'),
        'tags: #feature\n\nFeature note'
      );

      await tagService.buildTagIndex();
    });

    it('should trigger tree refresh when filters are set', () => {
      let refreshCalled = false;
      notesProvider.onDidChangeTreeData(() => {
        refreshCalled = true;
      });

      notesProvider.filterByTag('bug', tagService);
      expect(refreshCalled).to.be.true;
    });

    it('should trigger tree refresh when filters are cleared', () => {
      let refreshCalled = false;
      notesProvider.setTagFilters(['bug']);

      notesProvider.onDidChangeTreeData(() => {
        refreshCalled = true;
      });

      notesProvider.clearTagFilters();
      expect(refreshCalled).to.be.true;
    });
  });
});
