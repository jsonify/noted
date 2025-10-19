import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { searchInNotes } from '../../services/noteService';
import { TagService } from '../../services/tagService';

describe('noteService - Tag Search Integration', () => {
  let tempDir: string;
  let tagService: TagService;

  beforeEach(async () => {
    // Create temporary directory for test notes
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'noted-search-test-'));
    tagService = new TagService(tempDir);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Tag-only search', () => {
    it('should find notes with single tag using tag: syntax', async () => {
      // Create test notes
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const note1 = path.join(tempDir, '2025', '10-October', '2025-10-15.txt');
      const note2 = path.join(tempDir, '2025', '10-October', '2025-10-16.txt');
      const note3 = path.join(tempDir, '2025', '10-October', '2025-10-17.txt');

      await fs.writeFile(note1, 'tags: #bug #urgent\n\nThis is a bug report');
      await fs.writeFile(note2, 'tags: #feature\n\nNew feature request');
      await fs.writeFile(note3, 'tags: #bug\n\nAnother bug');

      // Build tag index
      await tagService.buildTagIndex();

      // Search with tag syntax
      const results = await searchInNotes('tag:bug', tagService, tempDir);

      expect(results).to.have.lengthOf(2);
      expect(results.map(r => r.file)).to.include(note1);
      expect(results.map(r => r.file)).to.include(note3);
    });

    it('should return empty array for non-existent tag', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-15.txt'),
        'tags: #bug\n\nContent'
      );

      await tagService.buildTagIndex();
      const results = await searchInNotes('tag:nonexistent', tagService, tempDir);

      expect(results).to.deep.equal([]);
    });

    it('should be case-insensitive for tag search', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const notePath = path.join(tempDir, '2025', '10-October', '2025-10-15.txt');
      await fs.writeFile(notePath, 'tags: #bug\n\nContent');

      await tagService.buildTagIndex();
      const results = await searchInNotes('tag:BUG', tagService, tempDir);

      expect(results).to.have.lengthOf(1);
      expect(results[0].file).to.equal(notePath);
    });
  });

  describe('Multi-tag search', () => {
    it('should find notes with ALL specified tags using AND logic', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const note1 = path.join(tempDir, '2025', '10-October', '2025-10-15.txt');
      const note2 = path.join(tempDir, '2025', '10-October', '2025-10-16.txt');
      const note3 = path.join(tempDir, '2025', '10-October', '2025-10-17.txt');

      await fs.writeFile(note1, 'tags: #bug #urgent\n\nUrgent bug');
      await fs.writeFile(note2, 'tags: #bug #feature\n\nBug in feature');
      await fs.writeFile(note3, 'tags: #bug #urgent #critical\n\nCritical bug');

      await tagService.buildTagIndex();
      const results = await searchInNotes('tag:bug tag:urgent', tagService, tempDir);

      expect(results).to.have.lengthOf(2);
      expect(results.map(r => r.file)).to.include(note1);
      expect(results.map(r => r.file)).to.include(note3);
      expect(results.map(r => r.file)).to.not.include(note2);
    });

    it('should handle three or more tags', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const note1 = path.join(tempDir, '2025', '10-October', '2025-10-15.txt');
      const note2 = path.join(tempDir, '2025', '10-October', '2025-10-16.txt');

      await fs.writeFile(note1, 'tags: #bug #urgent #critical\n\nContent');
      await fs.writeFile(note2, 'tags: #bug #urgent\n\nContent');

      await tagService.buildTagIndex();
      const results = await searchInNotes('tag:bug tag:urgent tag:critical', tagService, tempDir);

      expect(results).to.have.lengthOf(1);
      expect(results[0].file).to.equal(note1);
    });

    it('should return empty array when no notes have all tags', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-15.txt'),
        'tags: #bug\n\nContent'
      );
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-16.txt'),
        'tags: #urgent\n\nContent'
      );

      await tagService.buildTagIndex();
      const results = await searchInNotes('tag:bug tag:urgent', tagService, tempDir);

      expect(results).to.deep.equal([]);
    });
  });

  describe('Combined tag + text search', () => {
    it('should find notes matching both tag and text content', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const note1 = path.join(tempDir, '2025', '10-October', '2025-10-15.txt');
      const note2 = path.join(tempDir, '2025', '10-October', '2025-10-16.txt');
      const note3 = path.join(tempDir, '2025', '10-October', '2025-10-17.txt');

      await fs.writeFile(note1, 'tags: #bug\n\nError in authentication module');
      await fs.writeFile(note2, 'tags: #bug\n\nBug in rendering');
      await fs.writeFile(note3, 'tags: #feature\n\nError handling feature');

      await tagService.buildTagIndex();
      const results = await searchInNotes('tag:bug error', tagService, tempDir);

      expect(results).to.have.lengthOf(1);
      expect(results[0].file).to.equal(note1);
    });

    it('should handle text before tag query', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const notePath = path.join(tempDir, '2025', '10-October', '2025-10-15.txt');
      await fs.writeFile(notePath, 'tags: #bug\n\nAuthentication error');

      await tagService.buildTagIndex();
      const results = await searchInNotes('authentication tag:bug', tagService, tempDir);

      expect(results).to.have.lengthOf(1);
      expect(results[0].file).to.equal(notePath);
    });

    it('should handle multiple tags and text search', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const note1 = path.join(tempDir, '2025', '10-October', '2025-10-15.txt');
      const note2 = path.join(tempDir, '2025', '10-October', '2025-10-16.txt');

      await fs.writeFile(note1, 'tags: #bug #urgent\n\nCritical authentication error');
      await fs.writeFile(note2, 'tags: #bug #urgent\n\nBug in rendering');

      await tagService.buildTagIndex();
      const results = await searchInNotes('tag:bug tag:urgent authentication', tagService, tempDir);

      expect(results).to.have.lengthOf(1);
      expect(results[0].file).to.equal(note1);
    });

    it('should return empty array when tags match but text does not', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-15.txt'),
        'tags: #bug\n\nSome content'
      );

      await tagService.buildTagIndex();
      const results = await searchInNotes('tag:bug nonexistent', tagService, tempDir);

      expect(results).to.deep.equal([]);
    });

    it('should return empty array when text matches but tags do not', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-15.txt'),
        'tags: #feature\n\nError in code'
      );

      await tagService.buildTagIndex();
      const results = await searchInNotes('tag:bug error', tagService, tempDir);

      expect(results).to.deep.equal([]);
    });
  });

  describe('Search result formatting', () => {
    it('should include matched tags in preview for tag-only search', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-15.txt'),
        'tags: #bug #urgent\n\nThis is content'
      );

      await tagService.buildTagIndex();
      const results = await searchInNotes('tag:bug', tagService, tempDir);

      expect(results[0].preview).to.include('#bug');
    });

    it('should include content match in preview for combined search', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-15.txt'),
        'tags: #bug\n\nAuthentication error occurred'
      );

      await tagService.buildTagIndex();
      const results = await searchInNotes('tag:bug authentication', tagService, tempDir);

      expect(results[0].preview.toLowerCase()).to.include('authentication');
    });

    it('should truncate long previews to 80 characters', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const longContent = 'A'.repeat(100);
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-15.txt'),
        `tags: #bug\n\n${longContent}`
      );

      await tagService.buildTagIndex();
      const results = await searchInNotes('tag:bug', tagService, tempDir);

      expect(results[0].preview.length).to.be.at.most(80);
    });
  });

  describe('Backward compatibility', () => {
    it('should work with regular text search when no tag: syntax present', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const notePath = path.join(tempDir, '2025', '10-October', '2025-10-15.txt');
      await fs.writeFile(notePath, 'tags: #bug\n\nAuthentication error');

      await tagService.buildTagIndex();
      const results = await searchInNotes('authentication', tagService, tempDir);

      expect(results).to.have.lengthOf(1);
      expect(results[0].file).to.equal(notePath);
    });

    it('should handle search without TagService parameter (legacy support)', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const notePath = path.join(tempDir, '2025', '10-October', '2025-10-15.txt');
      await fs.writeFile(notePath, 'tags: #bug\n\nContent here');

      const results = await searchInNotes('content', undefined, tempDir);

      expect(results).to.have.lengthOf(1);
      expect(results[0].file).to.equal(notePath);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty tag query', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-15.txt'),
        'tags: #bug\n\nContent'
      );

      await tagService.buildTagIndex();
      const results = await searchInNotes('tag:', tagService, tempDir);

      // Should treat as regular text search
      expect(results).to.deep.equal([]);
    });

    it('should handle whitespace around tag names', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const notePath = path.join(tempDir, '2025', '10-October', '2025-10-15.txt');
      await fs.writeFile(notePath, 'tags: #bug\n\nContent');

      await tagService.buildTagIndex();
      const results = await searchInNotes('tag: bug', tagService, tempDir);

      expect(results).to.have.lengthOf(1);
      expect(results[0].file).to.equal(notePath);
    });

    it('should handle mixed case in tag queries', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const notePath = path.join(tempDir, '2025', '10-October', '2025-10-15.txt');
      await fs.writeFile(notePath, 'tags: #bug\n\nContent');

      await tagService.buildTagIndex();
      const results = await searchInNotes('TAG:BuG', tagService, tempDir);

      expect(results).to.have.lengthOf(1);
      expect(results[0].file).to.equal(notePath);
    });
  });
});
