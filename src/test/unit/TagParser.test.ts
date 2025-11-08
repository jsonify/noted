import { expect } from 'chai';
import * as sinon from 'sinon';
import { TagParser, NoteMetadata, NoteTag } from '../../tagging/TagParser';

describe('TagParser', () => {
  let clock: sinon.SinonFakeTimers;

  beforeEach(() => {
    // Use a fixed date for deterministic testing: 2024-01-15T12:00:00.000Z
    clock = sinon.useFakeTimers(new Date('2024-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    clock.restore();
  });
  describe('hasFrontmatter', () => {
    it('should return true for content with YAML frontmatter', () => {
      const content = `---
tags: [test, example]
---

Note content`;

      const hasFrontmatter = TagParser.hasFrontmatter(content);
      expect(hasFrontmatter).to.be.true;
    });

    it('should return false for content without frontmatter', () => {
      const content = 'Just a regular note without frontmatter';

      const hasFrontmatter = TagParser.hasFrontmatter(content);
      expect(hasFrontmatter).to.be.false;
    });

    it('should return false for empty content', () => {
      const content = '';

      const hasFrontmatter = TagParser.hasFrontmatter(content);
      expect(hasFrontmatter).to.be.false;
    });
  });

  describe('parseTags', () => {
    it('should parse tags from YAML frontmatter array', () => {
      const content = `---
tags: [bug, urgent, feature]
---

Note content`;

      const metadata = TagParser.parseTags(content);
      expect(metadata.tags).to.have.lengthOf(3);
      expect(metadata.tags.map(t => t.name)).to.have.members(['bug', 'urgent', 'feature']);
      expect(metadata.tags[0].source).to.equal('manual');
      expect(metadata.tags[0].confidence).to.equal(1.0);
    });

    it('should parse tags from YAML frontmatter list format', () => {
      const content = `---
tags:
  - project
  - frontend
  - typescript
---

Note content`;

      const metadata = TagParser.parseTags(content);
      expect(metadata.tags).to.have.lengthOf(3);
      expect(metadata.tags.map(t => t.name)).to.have.members(['project', 'frontend', 'typescript']);
    });

    it('should return empty array for content without tags', () => {
      const content = `---
title: My Note
---

Content`;

      const metadata = TagParser.parseTags(content);
      expect(metadata.tags).to.have.lengthOf(0);
    });

    it('should return empty array for content without frontmatter', () => {
      const content = 'Regular note content';

      const metadata = TagParser.parseTags(content);
      expect(metadata.tags).to.have.lengthOf(0);
    });

    it('should parse tagged-at timestamp when present', () => {
      const content = `---
tags: [bug, feature]
tagged-at: 2025-01-01T00:00:00.000Z
---

Content`;

      const metadata = TagParser.parseTags(content);
      expect(metadata.tags).to.have.lengthOf(2);
      expect(metadata.lastTagged).to.be.instanceOf(Date);
      expect(metadata.lastTagged?.toISOString()).to.equal('2025-01-01T00:00:00.000Z');
    });

    it('should parse old string format tags', () => {
      const content = `---
tags: bug, feature, urgent
---

Content`;

      const metadata = TagParser.parseTags(content);
      expect(metadata.tags).to.have.lengthOf(3);
      expect(metadata.tags.map(t => t.name)).to.have.members(['bug', 'feature', 'urgent']);
    });
  });

  describe('writeTags', () => {
    it('should add frontmatter with tags to content without frontmatter', () => {
      const content = 'Note content';
      const metadata: NoteMetadata = {
        tags: [
          { name: 'bug', confidence: 1.0, source: 'manual', addedAt: new Date() },
          { name: 'feature', confidence: 1.0, source: 'manual', addedAt: new Date() }
        ]
      };

      const result = TagParser.writeTags(content, metadata);
      expect(result).to.include('---');
      expect(result).to.include('tags: [bug, feature]');
      expect(result).to.include('Note content');
    });

    it('should update existing frontmatter with new tags', () => {
      const content = `---
title: My Note
---

Content`;
      const metadata: NoteMetadata = {
        tags: [
          { name: 'urgent', confidence: 1.0, source: 'manual', addedAt: new Date() },
          { name: 'todo', confidence: 1.0, source: 'manual', addedAt: new Date() }
        ]
      };

      const result = TagParser.writeTags(content, metadata);
      expect(result).to.include('title: My Note');
      expect(result).to.include('tags: [urgent, todo]');
    });

    it('should preserve existing frontmatter fields', () => {
      const content = `---
title: My Note
author: John
---

Content`;
      const metadata: NoteMetadata = {
        tags: [
          { name: 'new', confidence: 1.0, source: 'manual', addedAt: new Date() }
        ]
      };

      const result = TagParser.writeTags(content, metadata);
      expect(result).to.include('title: My Note');
      expect(result).to.include('author: John');
      expect(result).to.include('tags: [new]');
    });

    it('should add tagged-at timestamp when tags are added', () => {
      const content = 'Content';
      const metadata: NoteMetadata = {
        tags: [
          { name: 'test', confidence: 1.0, source: 'manual', addedAt: new Date() }
        ]
      };

      const result = TagParser.writeTags(content, metadata);
      // YAML may quote the timestamp string, so check for both formats
      const hasTimestamp = result.includes('tagged-at: 2024-01-15T12:00:00.000Z') ||
                          result.includes("tagged-at: '2024-01-15T12:00:00.000Z'");
      expect(hasTimestamp).to.be.true;
    });

    it('should remove tags field when metadata has empty tags', () => {
      const content = `---
tags: [bug, feature]
title: My Note
---

Content`;
      const metadata: NoteMetadata = {
        tags: []
      };

      const result = TagParser.writeTags(content, metadata);
      expect(result).to.not.include('tags:');
      expect(result).to.include('title: My Note');
    });
  });

  describe('removeTags', () => {
    it('should remove all tags from frontmatter', () => {
      const content = `---
tags: [bug, feature]
title: My Note
---

Content`;

      const result = TagParser.removeTags(content);
      expect(result).to.include('title: My Note');
      expect(result).to.not.include('tags:');
    });

    it('should handle content without tags gracefully', () => {
      const content = `---
title: My Note
---

Content`;

      const result = TagParser.removeTags(content);
      expect(result).to.include('title: My Note');
    });

    it('should handle content without frontmatter gracefully', () => {
      const content = 'Just content';

      const result = TagParser.removeTags(content);
      expect(result).to.equal('Just content');
    });
  });
});
