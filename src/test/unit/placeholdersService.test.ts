import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { PlaceholdersService } from '../../services/placeholdersService';
import { LinkService } from '../../services/linkService';

describe('PlaceholdersService - Placeholder Link Detection', () => {
  let tempDir: string;
  let linkService: LinkService;
  let placeholdersService: PlaceholdersService;

  beforeEach(async () => {
    // Create temporary directory for test notes
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'noted-placeholder-test-'));
    linkService = new LinkService(tempDir);
    placeholdersService = new PlaceholdersService(linkService);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('getAllPlaceholders', () => {
    it('should detect placeholder links to non-existent notes', async () => {
      // Create test notes directory
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const sourceNote = path.join(tempDir, '2025', '10-October', 'source.txt');

      // Create source note with link to non-existent note
      await fs.writeFile(sourceNote, 'This links to [[non-existent-note]] that does not exist');

      // Get placeholders
      const placeholders = await placeholdersService.getAllPlaceholders();

      // Verify
      expect(placeholders.size).to.equal(1);
      expect(placeholders.has('non-existent-note')).to.be.true;

      const placeholder = placeholders.get('non-existent-note')!;
      expect(placeholder.linkText).to.equal('non-existent-note');
      expect(placeholder.sourceFile).to.equal(sourceNote);
      expect(placeholder.sources).to.have.lengthOf(1);
    });

    it('should not detect links to existing notes as placeholders', async () => {
      // Create test notes
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const sourceNote = path.join(tempDir, '2025', '10-October', 'source.txt');
      const targetNote = path.join(tempDir, '2025', '10-October', 'target.txt');

      await fs.writeFile(sourceNote, 'This links to [[target]] that exists');
      await fs.writeFile(targetNote, 'Target note content');

      // Get placeholders
      const placeholders = await placeholdersService.getAllPlaceholders();

      // Verify - should be empty since target exists
      expect(placeholders.size).to.equal(0);
    });

    it('should group multiple references to same placeholder', async () => {
      // Create test notes directory
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const source1 = path.join(tempDir, '2025', '10-October', 'source1.txt');
      const source2 = path.join(tempDir, '2025', '10-October', 'source2.txt');

      // Create two source notes linking to same non-existent note
      await fs.writeFile(source1, 'First reference to [[missing-note]]');
      await fs.writeFile(source2, 'Second reference to [[missing-note]]');

      // Get placeholders
      const placeholders = await placeholdersService.getAllPlaceholders();

      // Verify - should have one placeholder with two sources
      expect(placeholders.size).to.equal(1);

      const placeholder = placeholders.get('missing-note')!;
      expect(placeholder.linkText).to.equal('missing-note');
      expect(placeholder.sources).to.have.lengthOf(2);

      // Verify both sources are tracked
      const sourceFiles = placeholder.sources.map(s => s.file);
      expect(sourceFiles).to.include(source1);
      expect(sourceFiles).to.include(source2);
    });

    it('should handle placeholder links with display text', async () => {
      // Create test notes directory
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const sourceNote = path.join(tempDir, '2025', '10-October', 'source.txt');

      // Create source note with link that has display text
      await fs.writeFile(sourceNote, 'Check out [[missing-note|My Custom Display]]');

      // Get placeholders
      const placeholders = await placeholdersService.getAllPlaceholders();

      // Verify
      expect(placeholders.size).to.equal(1);

      const placeholder = placeholders.get('missing-note')!;
      expect(placeholder.linkText).to.equal('missing-note');
      expect(placeholder.displayText).to.equal('My Custom Display');
    });

    it('should extract context for each placeholder reference', async () => {
      // Create test notes directory
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const sourceNote = path.join(tempDir, '2025', '10-October', 'source.txt');

      const content = 'Line before\nThis links to [[placeholder-link]] in context\nLine after';
      await fs.writeFile(sourceNote, content);

      // Get placeholders
      const placeholders = await placeholdersService.getAllPlaceholders();

      // Verify context is captured
      expect(placeholders.size).to.equal(1);

      const placeholder = placeholders.get('placeholder-link')!;
      expect(placeholder.context).to.include('[[placeholder-link]]');
      expect(placeholder.sources[0].context).to.include('[[placeholder-link]]');
    });

    it('should detect multiple different placeholders in same file', async () => {
      // Create test notes directory
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const sourceNote = path.join(tempDir, '2025', '10-October', 'source.txt');

      await fs.writeFile(sourceNote, '[[first-missing]] and [[second-missing]] and [[third-missing]]');

      // Get placeholders
      const placeholders = await placeholdersService.getAllPlaceholders();

      // Verify all three are detected
      expect(placeholders.size).to.equal(3);
      expect(placeholders.has('first-missing')).to.be.true;
      expect(placeholders.has('second-missing')).to.be.true;
      expect(placeholders.has('third-missing')).to.be.true;
    });

    it('should track line numbers for each placeholder reference', async () => {
      // Create test notes directory
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const sourceNote = path.join(tempDir, '2025', '10-October', 'source.txt');

      const content = 'Line 0\nLine 1 [[placeholder-one]]\nLine 2\nLine 3 [[placeholder-two]]';
      await fs.writeFile(sourceNote, content);

      // Get placeholders
      const placeholders = await placeholdersService.getAllPlaceholders();

      // Verify line numbers are correct
      const placeholder1 = placeholders.get('placeholder-one')!;
      expect(placeholder1.line).to.equal(1);

      const placeholder2 = placeholders.get('placeholder-two')!;
      expect(placeholder2.line).to.equal(3);
    });
  });

  describe('getAllPlaceholdersFlat', () => {
    it('should return flat array with one entry per source', async () => {
      // Create test notes directory
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const source1 = path.join(tempDir, '2025', '10-October', 'source1.txt');
      const source2 = path.join(tempDir, '2025', '10-October', 'source2.txt');

      // Both files link to same placeholder
      await fs.writeFile(source1, 'Reference [[missing-note]]');
      await fs.writeFile(source2, 'Another reference [[missing-note]]');

      // Get flat placeholders
      const placeholders = await placeholdersService.getAllPlaceholdersFlat();

      // Verify - should have two entries (one per source file)
      expect(placeholders).to.have.lengthOf(2);

      const sourceFiles = placeholders.map(p => p.sourceFile);
      expect(sourceFiles).to.include(source1);
      expect(sourceFiles).to.include(source2);
    });

    it('should return multiple entries for multiple placeholders in same file', async () => {
      // Create test notes directory
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const sourceNote = path.join(tempDir, '2025', '10-October', 'source.txt');

      await fs.writeFile(sourceNote, '[[first]] and [[second]]');

      // Get flat placeholders
      const placeholders = await placeholdersService.getAllPlaceholdersFlat();

      // Verify - should have two entries
      expect(placeholders).to.have.lengthOf(2);

      const linkTexts = placeholders.map(p => p.linkText);
      expect(linkTexts).to.include('first');
      expect(linkTexts).to.include('second');
    });
  });

  describe('getPlaceholdersInFile', () => {
    it('should return placeholders only from specified file', async () => {
      // Create test notes directory
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const source1 = path.join(tempDir, '2025', '10-October', 'source1.txt');
      const source2 = path.join(tempDir, '2025', '10-October', 'source2.txt');

      await fs.writeFile(source1, '[[placeholder-in-source1]]');
      await fs.writeFile(source2, '[[placeholder-in-source2]]');

      // Get placeholders from source1 only
      const placeholders = await placeholdersService.getPlaceholdersInFile(source1);

      // Verify - should only have placeholder from source1
      expect(placeholders).to.have.lengthOf(1);
      expect(placeholders[0].linkText).to.equal('placeholder-in-source1');
      expect(placeholders[0].sourceFile).to.equal(source1);
    });

    it('should return empty array if file has no placeholders', async () => {
      // Create test notes directory
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const sourceNote = path.join(tempDir, '2025', '10-October', 'source.txt');
      const targetNote = path.join(tempDir, '2025', '10-October', 'target.txt');

      await fs.writeFile(sourceNote, 'Links to [[target]] which exists');
      await fs.writeFile(targetNote, 'Target content');

      // Get placeholders
      const placeholders = await placeholdersService.getPlaceholdersInFile(sourceNote);

      // Verify - should be empty
      expect(placeholders).to.have.lengthOf(0);
    });

    it('should return all placeholders from file with multiple broken links', async () => {
      // Create test notes directory
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const sourceNote = path.join(tempDir, '2025', '10-October', 'source.txt');

      await fs.writeFile(sourceNote, '[[first]] [[second]] [[third]]');

      // Get placeholders
      const placeholders = await placeholdersService.getPlaceholdersInFile(sourceNote);

      // Verify
      expect(placeholders).to.have.lengthOf(3);

      const linkTexts = placeholders.map(p => p.linkText);
      expect(linkTexts).to.include('first');
      expect(linkTexts).to.include('second');
      expect(linkTexts).to.include('third');
    });
  });

  describe('getPlaceholderTargets', () => {
    it('should return array of unique placeholder target names', async () => {
      // Create test notes directory
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const source1 = path.join(tempDir, '2025', '10-October', 'source1.txt');
      const source2 = path.join(tempDir, '2025', '10-October', 'source2.txt');

      // Multiple files linking to same and different placeholders
      await fs.writeFile(source1, '[[shared-placeholder]] and [[unique-to-source1]]');
      await fs.writeFile(source2, '[[shared-placeholder]] and [[unique-to-source2]]');

      // Get placeholder targets
      const targets = await placeholdersService.getPlaceholderTargets();

      // Verify - should have three unique targets
      expect(targets).to.have.lengthOf(3);
      expect(targets).to.include('shared-placeholder');
      expect(targets).to.include('unique-to-source1');
      expect(targets).to.include('unique-to-source2');
    });

    it('should return empty array when no placeholders exist', async () => {
      // Create test notes directory
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const sourceNote = path.join(tempDir, '2025', '10-October', 'source.txt');

      await fs.writeFile(sourceNote, 'No links here');

      // Get placeholder targets
      const targets = await placeholdersService.getPlaceholderTargets();

      // Verify
      expect(targets).to.have.lengthOf(0);
    });
  });

  describe('getPlaceholderCounts', () => {
    it('should return map of placeholder names to reference counts', async () => {
      // Create test notes directory
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const source1 = path.join(tempDir, '2025', '10-October', 'source1.txt');
      const source2 = path.join(tempDir, '2025', '10-October', 'source2.txt');
      const source3 = path.join(tempDir, '2025', '10-October', 'source3.txt');

      // Create varying numbers of references to different placeholders
      await fs.writeFile(source1, '[[popular-placeholder]]');
      await fs.writeFile(source2, '[[popular-placeholder]]');
      await fs.writeFile(source3, '[[popular-placeholder]] and [[rare-placeholder]]');

      // Get placeholder counts
      const counts = await placeholdersService.getPlaceholderCounts();

      // Verify
      expect(counts.size).to.equal(2);
      expect(counts.get('popular-placeholder')).to.equal(3);
      expect(counts.get('rare-placeholder')).to.equal(1);
    });

    it('should return empty map when no placeholders exist', async () => {
      // Create test notes directory
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const sourceNote = path.join(tempDir, '2025', '10-October', 'source.txt');

      await fs.writeFile(sourceNote, 'No placeholders');

      // Get placeholder counts
      const counts = await placeholdersService.getPlaceholderCounts();

      // Verify
      expect(counts.size).to.equal(0);
    });
  });

  describe('isPlaceholder', () => {
    it('should return true for links to non-existent notes', async () => {
      // No need to create any files - this note doesn't exist
      const result = await placeholdersService.isPlaceholder('non-existent-note');

      expect(result).to.be.true;
    });

    it('should return false for links to existing notes', async () => {
      // Create test notes directory
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const existingNote = path.join(tempDir, '2025', '10-October', 'existing-note.txt');

      await fs.writeFile(existingNote, 'This note exists');

      // Check if link to existing note is a placeholder
      const result = await placeholdersService.isPlaceholder('existing-note');

      expect(result).to.be.false;
    });

    it('should handle links with path components', async () => {
      // Create test notes directory
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const existingNote = path.join(tempDir, '2025', '10-October', 'existing-note.txt');

      await fs.writeFile(existingNote, 'This note exists');

      // Check with path-based link
      const result1 = await placeholdersService.isPlaceholder('2025/10-October/existing-note');
      expect(result1).to.be.false;

      // Non-existent with path should still be placeholder
      const result2 = await placeholdersService.isPlaceholder('2025/10-October/missing-note');
      expect(result2).to.be.true;
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty workspace', async () => {
      const placeholders = await placeholdersService.getAllPlaceholders();
      expect(placeholders.size).to.equal(0);
    });

    it('should handle files with no links', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const sourceNote = path.join(tempDir, '2025', '10-October', 'source.txt');

      await fs.writeFile(sourceNote, 'Just plain text, no links');

      const placeholders = await placeholdersService.getAllPlaceholders();
      expect(placeholders.size).to.equal(0);
    });

    it('should handle mixed valid and invalid links', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const sourceNote = path.join(tempDir, '2025', '10-October', 'source.txt');
      const validTarget = path.join(tempDir, '2025', '10-October', 'valid.txt');

      await fs.writeFile(sourceNote, '[[valid]] and [[invalid]]');
      await fs.writeFile(validTarget, 'Valid note');

      const placeholders = await placeholdersService.getAllPlaceholders();

      // Only invalid link should be a placeholder
      expect(placeholders.size).to.equal(1);
      expect(placeholders.has('invalid')).to.be.true;
      expect(placeholders.has('valid')).to.be.false;
    });

    it('should handle same placeholder appearing multiple times in same file', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const sourceNote = path.join(tempDir, '2025', '10-October', 'source.txt');

      await fs.writeFile(sourceNote, '[[repeated]] and [[repeated]] and [[repeated]]');

      const placeholders = await placeholdersService.getAllPlaceholders();

      // Should be grouped as one placeholder with 3 sources
      expect(placeholders.size).to.equal(1);
      const placeholder = placeholders.get('repeated')!;
      expect(placeholder.sources).to.have.lengthOf(3);
    });
  });
});
