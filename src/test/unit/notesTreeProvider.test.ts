import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as vscode from 'vscode';
import { NotesTreeProvider } from '../../providers/notesTreeProvider';
import { TagService } from '../../services/tagService';
import { cleanupMocks } from '../setup';

describe('NotesTreeProvider Tag Filtering', () => {
  let tempDir: string;
  let notesProvider: NotesTreeProvider;
  let tagService: TagService;
  let mockConfig: any;

  beforeEach(async () => {
    // Create temporary directory for test notes
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'noted-filter-test-'));
    
    // Setup mock configuration
    mockConfig = {
      get: (key: string, defaultValue?: any) => defaultValue,
      update: (key: string, value: any, target: vscode.ConfigurationTarget.Global) => Promise.resolve()
    };

    // Mock workspace configuration
    const mockWorkspace = {
      getConfiguration: () => mockConfig
    };
    Object.assign(vscode.workspace, mockWorkspace);

    // Create instances with proper initialization
    notesProvider = new NotesTreeProvider();
    tagService = new TagService(tempDir);

    // Configure the notes path for testing
    await mockConfig.update('notesFolder', tempDir, vscode.ConfigurationTarget.Global);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });

    // Reset configuration
    await mockConfig.update('notesFolder', undefined, vscode.ConfigurationTarget.Global);

    // Clean up mocks
    cleanupMocks();
  });

  describe('Filter State Management', () => {
    it('should initialize with no active filters', () => {
      expect(notesProvider.getActiveFilters()).to.deep.equal([]);
    });

    it('should add a single tag filter', () => {
      notesProvider.setTagFilters(['bug']);
      expect(notesProvider.getActiveFilters()).to.deep.equal(['bug']);
    });

    // ... rest of existing test cases ...

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

    // ... rest of existing test cases ...
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
      const subscription = notesProvider.onDidChangeTreeData(() => {
        refreshCalled = true;
      });

      notesProvider.filterByTag('bug', tagService);
      expect(refreshCalled).to.be.true;

      subscription.dispose();
    });

    it('should trigger tree refresh when filters are cleared', () => {
      let refreshCalled = false;
      notesProvider.setTagFilters(['bug']);

      const subscription = notesProvider.onDidChangeTreeData(() => {
        refreshCalled = true;
      });

      notesProvider.clearTagFilters();
      expect(refreshCalled).to.be.true;

      subscription.dispose();
    });
  });
});
