import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { TagService } from '../../services/tagService';

describe('TagService', () => {
  let tempDir: string;
  let tagService: TagService;

  beforeEach(async () => {
    // Create temporary directory for test notes
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'noted-tag-test-'));
    tagService = new TagService(tempDir);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('buildTagIndex', () => {
    it('should build tag index from notes with tags', async () => {
      // Create test notes
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-15.txt'),
        'tags: #bug #urgent\n\nNote content'
      );
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-16.txt'),
        'tags: #feature #bug\n\nAnother note'
      );

      await tagService.buildTagIndex();
      const allTags = tagService.getAllTags();

      expect(allTags).to.have.lengthOf(3);
      expect(allTags.map(t => t.name)).to.include.members(['bug', 'urgent', 'feature']);
    });

    it('should count tag occurrences correctly', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-15.txt'),
        'tags: #bug\n\nContent'
      );
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-16.txt'),
        'tags: #bug #feature\n\nContent'
      );
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-17.txt'),
        'tags: #bug\n\nContent'
      );

      await tagService.buildTagIndex();
      const allTags = tagService.getAllTags();

      const bugTag = allTags.find(t => t.name === 'bug');
      const featureTag = allTags.find(t => t.name === 'feature');

      expect(bugTag?.count).to.equal(3);
      expect(featureTag?.count).to.equal(1);
    });

    it('should handle notes without tags', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-15.txt'),
        'No tags here\n\nJust content'
      );
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-16.txt'),
        'tags: #feature\n\nWith tags'
      );

      await tagService.buildTagIndex();
      const allTags = tagService.getAllTags();

      expect(allTags).to.have.lengthOf(1);
      expect(allTags[0].name).to.equal('feature');
    });

    it('should handle empty notes directory', async () => {
      await tagService.buildTagIndex();
      const allTags = tagService.getAllTags();

      expect(allTags).to.deep.equal([]);
    });

    it('should store note file paths for each tag', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const note1Path = path.join(tempDir, '2025', '10-October', '2025-10-15.txt');
      const note2Path = path.join(tempDir, '2025', '10-October', '2025-10-16.txt');

      await fs.writeFile(note1Path, 'tags: #bug\n\nContent');
      await fs.writeFile(note2Path, 'tags: #bug\n\nContent');

      await tagService.buildTagIndex();
      const notes = tagService.getNotesWithTag('bug');

      expect(notes).to.have.lengthOf(2);
      expect(notes).to.include(note1Path);
      expect(notes).to.include(note2Path);
    });
  });

  describe('getTagsForNote', () => {
    it('should return tags for a specific note', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const notePath = path.join(tempDir, '2025', '10-October', '2025-10-15.txt');
      await fs.writeFile(notePath, 'tags: #bug #urgent #feature\n\nContent');

      await tagService.buildTagIndex();
      const tags = tagService.getTagsForNote(notePath);

      expect(tags).to.have.lengthOf(3);
      expect(tags).to.include.members(['bug', 'urgent', 'feature']);
    });

    it('should return empty array for note without tags', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const notePath = path.join(tempDir, '2025', '10-October', '2025-10-15.txt');
      await fs.writeFile(notePath, 'No tags\n\nContent');

      await tagService.buildTagIndex();
      const tags = tagService.getTagsForNote(notePath);

      expect(tags).to.deep.equal([]);
    });

    it('should return empty array for non-existent note', async () => {
      await tagService.buildTagIndex();
      const tags = tagService.getTagsForNote('/non/existent/note.txt');

      expect(tags).to.deep.equal([]);
    });
  });

  describe('getNotesWithTag', () => {
    it('should return all notes containing a tag', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const note1 = path.join(tempDir, '2025', '10-October', '2025-10-15.txt');
      const note2 = path.join(tempDir, '2025', '10-October', '2025-10-16.txt');
      const note3 = path.join(tempDir, '2025', '10-October', '2025-10-17.txt');

      await fs.writeFile(note1, 'tags: #bug\n\nContent');
      await fs.writeFile(note2, 'tags: #bug #feature\n\nContent');
      await fs.writeFile(note3, 'tags: #feature\n\nContent');

      await tagService.buildTagIndex();
      const notes = tagService.getNotesWithTag('bug');

      expect(notes).to.have.lengthOf(2);
      expect(notes).to.include(note1);
      expect(notes).to.include(note2);
    });

    it('should return empty array for non-existent tag', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-15.txt'),
        'tags: #bug\n\nContent'
      );

      await tagService.buildTagIndex();
      const notes = tagService.getNotesWithTag('nonexistent');

      expect(notes).to.deep.equal([]);
    });
  });

  describe('getNotesWithTags', () => {
    it('should return notes with all specified tags (AND logic)', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const note1 = path.join(tempDir, '2025', '10-October', '2025-10-15.txt');
      const note2 = path.join(tempDir, '2025', '10-October', '2025-10-16.txt');
      const note3 = path.join(tempDir, '2025', '10-October', '2025-10-17.txt');

      await fs.writeFile(note1, 'tags: #bug #urgent\n\nContent');
      await fs.writeFile(note2, 'tags: #bug #feature\n\nContent');
      await fs.writeFile(note3, 'tags: #bug #urgent #feature\n\nContent');

      await tagService.buildTagIndex();
      const notes = tagService.getNotesWithTags(['bug', 'urgent']);

      expect(notes).to.have.lengthOf(2);
      expect(notes).to.include(note1);
      expect(notes).to.include(note3);
      expect(notes).to.not.include(note2);
    });

    it('should return empty array when no notes match all tags', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-15.txt'),
        'tags: #bug\n\nContent'
      );
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-16.txt'),
        'tags: #feature\n\nContent'
      );

      await tagService.buildTagIndex();
      const notes = tagService.getNotesWithTags(['bug', 'feature']);

      expect(notes).to.deep.equal([]);
    });

    it('should handle empty tag array', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-15.txt'),
        'tags: #bug\n\nContent'
      );

      await tagService.buildTagIndex();
      const notes = tagService.getNotesWithTags([]);

      expect(notes).to.deep.equal([]);
    });
  });

  describe('getAllTags', () => {
    it('should return all tags sorted by frequency (default)', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-15.txt'),
        'tags: #bug\n\nContent'
      );
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-16.txt'),
        'tags: #bug #feature\n\nContent'
      );
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-17.txt'),
        'tags: #bug #feature #urgent\n\nContent'
      );

      await tagService.buildTagIndex();
      const tags = tagService.getAllTags();

      expect(tags[0].name).to.equal('bug');
      expect(tags[0].count).to.equal(3);
      expect(tags[1].name).to.equal('feature');
      expect(tags[1].count).to.equal(2);
      expect(tags[2].name).to.equal('urgent');
      expect(tags[2].count).to.equal(1);
    });

    it('should return tags sorted alphabetically when specified', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-15.txt'),
        'tags: #zebra #alpha #beta\n\nContent'
      );

      await tagService.buildTagIndex();
      const tags = tagService.getAllTags('alphabetical');

      expect(tags[0].name).to.equal('alpha');
      expect(tags[1].name).to.equal('beta');
      expect(tags[2].name).to.equal('zebra');
    });

    it('should return empty array when no tags exist', async () => {
      await tagService.buildTagIndex();
      const tags = tagService.getAllTags();

      expect(tags).to.deep.equal([]);
    });
  });

  describe('clearCache', () => {
    it('should clear the tag index cache', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '2025', '10-October', '2025-10-15.txt'),
        'tags: #bug\n\nContent'
      );

      await tagService.buildTagIndex();
      expect(tagService.getAllTags()).to.have.lengthOf(1);

      tagService.clearCache();
      expect(tagService.getAllTags()).to.have.lengthOf(0);
    });
  });
});
