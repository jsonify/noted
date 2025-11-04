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
      const tagItem = new TagItem('bug', 5, true);
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
      const tag1 = children![0] as TagItem;
      const tag2 = children![1] as TagItem;
      expect(tag1.tagName).to.equal('bug');
      expect(tag1.referenceCount).to.equal(2);
      expect(tag2.tagName).to.equal('feature');
      expect(tag2.referenceCount).to.equal(2);
    });

    it('should return empty array when no tags exist', async () => {
      await tagService.buildTagIndex();
      const children = await provider.getChildren();

      expect(children).to.deep.equal([]);
    });

    it('should use alphabetical sort order', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '2025', '10-October', '2025-10-15.txt'), 'tags: #bug\n\nContent');
      await fs.writeFile(path.join(tempDir, '2025', '10-October', '2025-10-16.txt'), 'tags: #bug #feature\n\nContent');
      await fs.writeFile(path.join(tempDir, '2025', '10-October', '2025-10-17.txt'), 'tags: #bug\n\nContent');

      await tagService.buildTagIndex();
      const children = await provider.getChildren();

      // Tags are always sorted alphabetically now
      const tag1 = children![0] as TagItem;
      const tag2 = children![1] as TagItem;
      expect(tag1.tagName).to.equal('bug');
      expect(tag1.referenceCount).to.equal(3);
      expect(tag2.tagName).to.equal('feature');
    });

    it('should sort tags alphabetically', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '2025', '10-October', '2025-10-15.txt'), 'tags: #zebra #alpha\n\nContent');

      await tagService.buildTagIndex();
      const children = await provider.getChildren();

      expect(children![0].tagName).to.equal('alpha');
      expect(children![1].tagName).to.equal('zebra');
    });

    it('should return tag items with hasChildren flag', async () => {
      const tagItem = new TagItem('bug', 5, true);
      const result = await provider.getChildren(tagItem);

      // TagItem nodes should have children (files)
      expect(result).to.not.be.undefined;
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

  // Note: setSortOrder and getSortOrder methods have been removed
  // Tags are now always sorted alphabetically in the hierarchical view

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
