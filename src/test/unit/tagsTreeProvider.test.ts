import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { TagsTreeProvider } from '../../providers/tagsTreeProvider';
import { TagService } from '../../services/tagService';
import { TagItem } from '../../providers/treeItems';

describe('TagsTreeProvider', () => {
  let tempDir: string;
  let tagService: TagService;
  let provider: TagsTreeProvider;

  beforeEach(async () => {
    // Create temporary directory for test notes
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'noted-tags-tree-test-'));
    tagService = new TagService(tempDir);
    provider = new TagsTreeProvider(tagService);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('getTreeItem', () => {
    it('should return the tag item as-is', () => {
      const tagItem = new TagItem('bug', 5, ['/note1.txt', '/note2.txt']);
      const result = provider.getTreeItem(tagItem);

      expect(result).to.equal(tagItem);
    });
  });

  describe('getChildren', () => {
    it('should return all tags as TagItems', async () => {
      // Create test notes with tags
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '2025', '10-October', '2025-10-15.txt'), 'tags: #bug\n\nContent');
      await fs.writeFile(path.join(tempDir, '2025', '10-October', '2025-10-16.txt'), 'tags: #bug #feature\n\nContent');
      await fs.writeFile(path.join(tempDir, '2025', '10-October', '2025-10-17.txt'), 'tags: #feature\n\nContent');

      await tagService.buildTagIndex();
      const children = await provider.getChildren();

      expect(children).to.have.lengthOf(2);
      expect(children![0]).to.be.instanceOf(TagItem);
      expect(children![0].tagName).to.equal('bug');
      expect(children![0].count).to.equal(2);
      expect(children![1].tagName).to.equal('feature');
      expect(children![1].count).to.equal(2);
    });

    it('should return empty array when no tags exist', async () => {
      await tagService.buildTagIndex();
      const children = await provider.getChildren();

      expect(children).to.deep.equal([]);
    });

    it('should use frequency sort order by default', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '2025', '10-October', '2025-10-15.txt'), 'tags: #bug\n\nContent');
      await fs.writeFile(path.join(tempDir, '2025', '10-October', '2025-10-16.txt'), 'tags: #bug #feature\n\nContent');
      await fs.writeFile(path.join(tempDir, '2025', '10-October', '2025-10-17.txt'), 'tags: #bug\n\nContent');

      await tagService.buildTagIndex();
      const children = await provider.getChildren();

      // Bug appears 3 times, feature 1 time, so bug should be first
      expect(children![0].tagName).to.equal('bug');
      expect(children![0].count).to.equal(3);
      expect(children![1].tagName).to.equal('feature');
    });

    it('should use alphabetical sort order when configured', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '2025', '10-October', '2025-10-15.txt'), 'tags: #zebra #alpha\n\nContent');

      provider.setSortOrder('alphabetical');
      await tagService.buildTagIndex();
      const children = await provider.getChildren();

      expect(children![0].tagName).to.equal('alpha');
      expect(children![1].tagName).to.equal('zebra');
    });

    it('should return undefined for getChildren with element parameter', async () => {
      const tagItem = new TagItem('bug', 5, []);
      const result = await provider.getChildren(tagItem);

      expect(result).to.be.undefined;
    });
  });

  describe('refresh', () => {
    it('should trigger tree data change event', (done) => {
      provider.onDidChangeTreeData(() => {
        done();
      });

      provider.refresh();
    });

    it('should rebuild tag index when refreshed', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '2025', '10-October', '2025-10-15.txt'), 'tags: #bug\n\nContent');

      await provider.refresh();
      const count = tagService.getTagCount();

      expect(count).to.equal(1);
    });
  });

  describe('setSortOrder', () => {
    it('should update sort order to frequency', async () => {
      provider.setSortOrder('frequency');
      expect(provider.getSortOrder()).to.equal('frequency');
    });

    it('should update sort order to alphabetical', async () => {
      provider.setSortOrder('alphabetical');
      expect(provider.getSortOrder()).to.equal('alphabetical');
    });

    it('should trigger tree refresh when sort order changes', (done) => {
      provider.onDidChangeTreeData(() => {
        done();
      });

      provider.setSortOrder('alphabetical');
    });
  });

  describe('getTagCount', () => {
    it('should return total number of tags', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '2025', '10-October', '2025-10-15.txt'), 'tags: #bug #feature #urgent\n\nContent');

      await tagService.buildTagIndex();
      const count = provider.getTagCount();

      expect(count).to.equal(3);
    });

    it('should return zero when no tags exist', () => {
      const count = provider.getTagCount();
      expect(count).to.equal(0);
    });
  });
});
