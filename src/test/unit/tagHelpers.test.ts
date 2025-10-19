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
    it('should extract tags from metadata section', () => {
      const content = 'tags: #bug #urgent #project-alpha\n\nNote content here';
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal(['bug', 'urgent', 'project-alpha']);
    });

    it('should extract tags with various spacing', () => {
      const content = 'tags:#bug  #urgent   #feature\n\nContent';
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal(['bug', 'urgent', 'feature']);
    });

    it('should ignore tags outside metadata section (first 10 lines)', () => {
      const content = 'tags: #bug\n\n' +
        Array(10).fill('Line').join('\n') +
        '\n#ignored-tag should not be extracted';
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal(['bug']);
      expect(tags).to.not.include('ignored-tag');
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

    it('should handle content without tags line', () => {
      const content = 'Some content\n#not-a-tag-line';
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal([]);
    });

    it('should convert tags to lowercase', () => {
      const content = 'tags: #Bug #URGENT #Project-Alpha\n\nContent';
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal(['bug', 'urgent', 'project-alpha']);
    });

    it('should handle duplicate tags (return unique set)', () => {
      const content = 'tags: #bug #urgent #bug #feature #urgent\n\nContent';
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal(['bug', 'urgent', 'feature']);
    });

    it('should extract from multiple metadata lines', () => {
      const content = 'tags: #bug #urgent\ntags: #feature\n\nContent';
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal(['bug', 'urgent', 'feature']);
    });

    it('should handle tags: line without tags', () => {
      const content = 'tags:\n\nContent';
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal([]);
    });

    it('should handle malformed tags gracefully', () => {
      const content = 'tags: #valid-tag #invalid! #another-valid\n\nContent';
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal(['valid-tag', 'another-valid']);
    });

    it('should handle tags with numbers', () => {
      const content = 'tags: #bug-123 #version-2 #test1\n\nContent';
      const tags = extractTagsFromContent(content);
      expect(tags).to.deep.equal(['bug-123', 'version-2', 'test1']);
    });

    it('should ignore tags with special characters', () => {
      const content = 'tags: #valid #invalid! #test@tag #ok-tag\n\nContent';
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
      const content = `tags: ${longTags}\n\nContent`;
      const tags = extractTagsFromContent(content);
      expect(tags).to.have.lengthOf(50);
      expect(tags[0]).to.equal('tag0');
      expect(tags[49]).to.equal('tag49');
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
