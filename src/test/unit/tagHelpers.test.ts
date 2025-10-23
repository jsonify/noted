import { expect } from 'chai';
import {
  extractTagsFromContent,
  isValidTag,
  formatTagForDisplay,
  formatTagForStorage,
  normalizeTag
} from '../../utils/tagHelpers';

describe('Tag Helpers', () => {
  describe('extractTagsFromContent', () => {
    it('should extract tags from anywhere in content', () => {
      const content = 'Working on #bug #urgent #project-alpha today\n\nNote content here';
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal(['bug', 'urgent', 'project-alpha']);
    });

    it('should extract tags with various spacing', () => {
      const content = 'Tags: #bug  #urgent   #feature\n\nContent';
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal(['bug', 'urgent', 'feature']);
    });

    it('should extract tags from anywhere in note (inline support)', () => {
      const content = 'First paragraph #tag1\n\n' +
        'Middle section with #tag2 here\n\n' +
        'End of note #tag3';
      const tags = extractTagsFromContent(content);
      expect(tags).to.have.members(['tag1', 'tag2', 'tag3']);
    });

    it('should handle empty content', () => {
      const tags = extractTagsFromContent('');
      expect(tags).to.deep.equal([]);
    });

    it('should handle content without tags', () => {
      const content = 'Just some regular note content\nwithout any tags';
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal([]);
    });

    it('should extract inline tags from sentences', () => {
      const content = 'Fixed the login bug #bugfix today';
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal(['bugfix']);
    });

    it('should convert tags to lowercase', () => {
      const content = 'Working on #Bug #URGENT #Project-Alpha\n\nContent';
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal(['bug', 'urgent', 'project-alpha']);
    });

    it('should handle duplicate tags (return unique set)', () => {
      const content = 'Working on #bug and #urgent stuff. Also #bug again and #feature with #urgent\n\nContent';
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal(['bug', 'urgent', 'feature']);
    });

    it('should extract from multiple locations in note', () => {
      const content = 'Started with #bug and #urgent\nThen worked on #feature\n\nMore content';
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal(['bug', 'urgent', 'feature']);
    });

    it('should handle content with no hashtags', () => {
      const content = 'Just regular content\n\nNo tags here';
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal([]);
    });

    it('should handle malformed tags gracefully', () => {
      const content = 'Working on #valid-tag and #invalid! plus #another-valid\n\nContent';
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal(['valid-tag', 'another-valid']);
    });

    it('should handle tags with numbers', () => {
      const content = 'Tasks: #bug-123 #version-2 #test1\n\nContent';
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal(['bug-123', 'version-2', 'test1']);
    });

    it('should ignore tags with special characters', () => {
      const content = 'Tags found: #valid #invalid! #test@tag #ok-tag\n\nContent';
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal(['valid', 'ok-tag']);
    });

    it('should handle empty metadata section', () => {
      const content = '\n\n\nContent starts here';
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal([]);
    });

    it('should handle very long tag lists', () => {
      const longTags = Array.from({ length: 50 }, (_, i) => `#tag${i}`).join(' ');
      const content = `Working with many tags: ${longTags}\n\nContent`;
      const tags = extractTagsFromContent(content);
      expect(tags).to.have.lengthOf(50);
      expect(tags[0]).to.equal('tag0');
      expect(tags[49]).to.equal('tag49');
    });

    // Frontmatter array format tests
    it('should extract tags from YAML frontmatter array format', () => {
      const content = `---
tags: [diy, tires, maintenance]
---

Note content here`;
      const tags = extractTagsFromContent(content);
      expect(tags).to.have.members(['diy', 'tires', 'maintenance']);
    });

    it('should extract tags from frontmatter with quoted values', () => {
      const content = `---
tags: ["bug", "urgent", "project-alpha"]
---

Note content`;
      const tags = extractTagsFromContent(content);
      expect(tags).to.have.members(['bug', 'urgent', 'project-alpha']);
    });

    it('should extract tags from frontmatter with single quotes', () => {
      const content = `---
tags: ['feature', 'enhancement']
---

Content`;
      const tags = extractTagsFromContent(content);
      expect(tags).to.have.members(['feature', 'enhancement']);
    });

    it('should extract tags from frontmatter with mixed spacing', () => {
      const content = `---
tags: [  bug,  feature  ,  urgent  ]
---

Content`;
      const tags = extractTagsFromContent(content);
      expect(tags).to.have.members(['bug', 'feature', 'urgent']);
    });

    it('should combine frontmatter and inline hashtag tags', () => {
      const content = `---
tags: [diy, tires]
---

Working on #maintenance and #repair today`;
      const tags = extractTagsFromContent(content);
      expect(tags).to.have.members(['diy', 'tires', 'maintenance', 'repair']);
    });

    it('should deduplicate tags from frontmatter and inline', () => {
      const content = `---
tags: [bug, urgent]
---

Working on #bug and #feature`;
      const tags = extractTagsFromContent(content);
      expect(tags).to.have.members(['bug', 'urgent', 'feature']);
    });

    it('should handle frontmatter with empty array', () => {
      const content = `---
tags: []
---

Content with #hashtag`;
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal(['hashtag']);
    });

    it('should handle frontmatter without tags field', () => {
      const content = `---
title: My Note
author: John
---

Content with #hashtag`;
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal(['hashtag']);
    });

    it('should normalize tags from frontmatter to lowercase', () => {
      const content = `---
tags: [Bug, URGENT, Project-Alpha]
---

Content`;
      const tags = extractTagsFromContent(content);
      expect(tags).to.have.members(['bug', 'urgent', 'project-alpha']);
    });

    it('should validate tags from frontmatter (reject invalid)', () => {
      const content = `---
tags: [valid-tag, invalid!, another-valid, 123invalid]
---

Content`;
      const tags = extractTagsFromContent(content);
      expect(tags).to.have.members(['valid-tag', 'another-valid']);
    });

    it('should handle frontmatter with hashtags in array (normalize them)', () => {
      const content = `---
tags: [#bug, #feature]
---

Content`;
      const tags = extractTagsFromContent(content);
      expect(tags).to.have.members(['bug', 'feature']);
    });
  });

  describe('isValidTag', () => {
    it('should validate tags with lowercase letters', () => {
      expect(isValidTag('bug')).to.be.true;
      expect(isValidTag('feature')).to.be.true;
      expect(isValidTag('urgent')).to.be.true;
    });

    it('should validate tags with hyphens', () => {
      expect(isValidTag('bug-fix')).to.be.true;
      expect(isValidTag('project-alpha')).to.be.true;
      expect(isValidTag('test-case-1')).to.be.true;
    });

    it('should validate tags with numbers', () => {
      expect(isValidTag('bug123')).to.be.true;
      expect(isValidTag('version2')).to.be.true;
      expect(isValidTag('test-1')).to.be.true;
    });

    it('should reject tags with spaces', () => {
      expect(isValidTag('bug fix')).to.be.false;
      expect(isValidTag('project alpha')).to.be.false;
    });

    it('should reject tags with special characters', () => {
      expect(isValidTag('bug!')).to.be.false;
      expect(isValidTag('test@tag')).to.be.false;
      expect(isValidTag('tag#1')).to.be.false;
      expect(isValidTag('tag$value')).to.be.false;
      expect(isValidTag('tag*')).to.be.false;
    });

    it('should reject tags with uppercase letters', () => {
      expect(isValidTag('Bug')).to.be.false;
      expect(isValidTag('PROJECT')).to.be.false;
      expect(isValidTag('Test-Case')).to.be.false;
    });

    it('should reject empty tags', () => {
      expect(isValidTag('')).to.be.false;
    });

    it('should reject tags that start with numbers', () => {
      expect(isValidTag('123bug')).to.be.false;
    });

    it('should reject tags that start or end with hyphens', () => {
      expect(isValidTag('-bug')).to.be.false;
      expect(isValidTag('bug-')).to.be.false;
      expect(isValidTag('-bug-')).to.be.false;
    });

    it('should reject tags with consecutive hyphens', () => {
      expect(isValidTag('bug--fix')).to.be.false;
      expect(isValidTag('test---case')).to.be.false;
    });

    it('should validate single character tags', () => {
      expect(isValidTag('a')).to.be.true;
      expect(isValidTag('b')).to.be.true;
    });
  });

  describe('formatTagForDisplay', () => {
    it('should add hash prefix to tag', () => {
      expect(formatTagForDisplay('bug')).to.equal('#bug');
      expect(formatTagForDisplay('feature')).to.equal('#feature');
    });

    it('should handle tags that already have hash prefix', () => {
      expect(formatTagForDisplay('#bug')).to.equal('#bug');
      expect(formatTagForDisplay('#feature')).to.equal('#feature');
    });

    it('should handle empty string', () => {
      expect(formatTagForDisplay('')).to.equal('#');
    });

    it('should preserve tag case', () => {
      expect(formatTagForDisplay('Bug')).to.equal('#Bug');
      expect(formatTagForDisplay('PROJECT')).to.equal('#PROJECT');
    });
  });

  describe('formatTagForStorage', () => {
    it('should convert tag to lowercase', () => {
      expect(formatTagForStorage('Bug')).to.equal('bug');
      expect(formatTagForStorage('URGENT')).to.equal('urgent');
      expect(formatTagForStorage('Project-Alpha')).to.equal('project-alpha');
    });

    it('should remove hash prefix if present', () => {
      expect(formatTagForStorage('#bug')).to.equal('bug');
      expect(formatTagForStorage('#feature')).to.equal('feature');
    });

    it('should handle already normalized tags', () => {
      expect(formatTagForStorage('bug')).to.equal('bug');
      expect(formatTagForStorage('feature-123')).to.equal('feature-123');
    });

    it('should handle empty string', () => {
      expect(formatTagForStorage('')).to.equal('');
    });

    it('should trim whitespace', () => {
      expect(formatTagForStorage('  bug  ')).to.equal('bug');
      expect(formatTagForStorage('\ttag\t')).to.equal('tag');
    });
  });

  describe('normalizeTag', () => {
    it('should normalize tags to lowercase', () => {
      expect(normalizeTag('Bug')).to.equal('bug');
      expect(normalizeTag('FEATURE')).to.equal('feature');
    });

    it('should remove hash prefix', () => {
      expect(normalizeTag('#bug')).to.equal('bug');
      expect(normalizeTag('#feature')).to.equal('feature');
    });

    it('should trim whitespace', () => {
      expect(normalizeTag('  bug  ')).to.equal('bug');
      expect(normalizeTag('\tfeature\n')).to.equal('feature');
    });

    it('should handle already normalized tags', () => {
      expect(normalizeTag('bug')).to.equal('bug');
      expect(normalizeTag('feature-123')).to.equal('feature-123');
    });

    it('should handle empty string', () => {
      expect(normalizeTag('')).to.equal('');
    });

    it('should handle complex formatting', () => {
      expect(normalizeTag('  #Bug-Fix  ')).to.equal('bug-fix');
      expect(normalizeTag('\t#PROJECT-ALPHA\n')).to.equal('project-alpha');
    });
  });
});
