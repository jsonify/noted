import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { LinkService } from '../../services/linkService';

describe('LinkService - Link Synchronization', () => {
  let tempDir: string;
  let linkService: LinkService;

  beforeEach(async () => {
    // Create temporary directory for test notes
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'noted-link-test-'));
    linkService = new LinkService(tempDir);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('updateLinksInFile', () => {
    it('should update simple wikilinks when note is renamed', async () => {
      // Create test notes
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const sourceNote = path.join(tempDir, '2025', '10-October', 'source.txt');
      const targetNote = path.join(tempDir, '2025', '10-October', 'old-name.txt');
      const newTargetNote = path.join(tempDir, '2025', '10-October', 'new-name.txt');

      // Create source note with links to target
      await fs.writeFile(sourceNote, 'This links to [[old-name]] and also [[old-name]]');
      await fs.writeFile(targetNote, 'Target note content');

      // Update links
      const count = await linkService.updateLinksInFile(sourceNote, targetNote, newTargetNote);

      // Verify
      expect(count).to.equal(2);
      const updatedContent = await fs.readFile(sourceNote, 'utf-8');
      expect(updatedContent).to.equal('This links to [[new-name]] and also [[new-name]]');
    });

    it('should update wikilinks with display text when note is renamed', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const sourceNote = path.join(tempDir, '2025', '10-October', 'source.txt');
      const targetNote = path.join(tempDir, '2025', '10-October', 'old-name.txt');
      const newTargetNote = path.join(tempDir, '2025', '10-October', 'new-name.txt');

      // Create source note with link that has display text
      await fs.writeFile(sourceNote, 'Check out [[old-name|My Custom Link Text]]');
      await fs.writeFile(targetNote, 'Target note content');

      // Update links
      const count = await linkService.updateLinksInFile(sourceNote, targetNote, newTargetNote);

      // Verify - link target updated but display text preserved
      expect(count).to.equal(1);
      const updatedContent = await fs.readFile(sourceNote, 'utf-8');
      expect(updatedContent).to.equal('Check out [[new-name|My Custom Link Text]]');
    });

    it('should handle multiple links with mixed display text', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const sourceNote = path.join(tempDir, '2025', '10-October', 'source.txt');
      const targetNote = path.join(tempDir, '2025', '10-October', 'meeting-notes.txt');
      const newTargetNote = path.join(tempDir, '2025', '10-October', 'project-meeting.txt');

      const content = `# Daily Notes
Here's a link to [[meeting-notes]] and another [[meeting-notes|The Meeting]].
Also check [[meeting-notes|Important Discussion]].`;

      await fs.writeFile(sourceNote, content);
      await fs.writeFile(targetNote, 'Meeting content');

      const count = await linkService.updateLinksInFile(sourceNote, targetNote, newTargetNote);

      expect(count).to.equal(3);
      const updatedContent = await fs.readFile(sourceNote, 'utf-8');
      expect(updatedContent).to.include('[[project-meeting]]');
      expect(updatedContent).to.include('[[project-meeting|The Meeting]]');
      expect(updatedContent).to.include('[[project-meeting|Important Discussion]]');
    });

    it('should not update links that do not match', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const sourceNote = path.join(tempDir, '2025', '10-October', 'source.txt');
      const targetNote = path.join(tempDir, '2025', '10-October', 'old-name.txt');
      const newTargetNote = path.join(tempDir, '2025', '10-October', 'new-name.txt');

      // Create source note with links to different notes
      await fs.writeFile(sourceNote, 'Links to [[other-note]] and [[another-note]]');
      await fs.writeFile(targetNote, 'Target note content');

      const count = await linkService.updateLinksInFile(sourceNote, targetNote, newTargetNote);

      expect(count).to.equal(0);
      const updatedContent = await fs.readFile(sourceNote, 'utf-8');
      expect(updatedContent).to.equal('Links to [[other-note]] and [[another-note]]');
    });

    it('should handle special characters in note names', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const sourceNote = path.join(tempDir, '2025', '10-October', 'source.txt');
      const targetNote = path.join(tempDir, '2025', '10-October', 'note-(draft).txt');
      const newTargetNote = path.join(tempDir, '2025', '10-October', 'note-(final).txt');

      await fs.writeFile(sourceNote, 'Link to [[note-(draft)]]');
      await fs.writeFile(targetNote, 'Draft content');

      const count = await linkService.updateLinksInFile(sourceNote, targetNote, newTargetNote);

      expect(count).to.equal(1);
      const updatedContent = await fs.readFile(sourceNote, 'utf-8');
      expect(updatedContent).to.equal('Link to [[note-(final)]]');
    });
  });

  describe('updateLinksOnRename', () => {
    it('should update all backlinks when a note is renamed', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });

      const targetNote = path.join(tempDir, '2025', '10-October', 'target.txt');
      const newTargetNote = path.join(tempDir, '2025', '10-October', 'renamed-target.txt');
      const source1 = path.join(tempDir, '2025', '10-October', 'source1.txt');
      const source2 = path.join(tempDir, '2025', '10-October', 'source2.txt');

      await fs.writeFile(targetNote, 'Target content');
      await fs.writeFile(source1, 'References [[target]] here');
      await fs.writeFile(source2, 'Also links to [[target|Target Note]]');

      // Build backlinks index
      await linkService.buildBacklinksIndex();

      // Perform rename
      const result = await linkService.updateLinksOnRename(targetNote, newTargetNote);

      // Verify results
      expect(result.filesUpdated).to.equal(2);
      expect(result.linksUpdated).to.equal(2);

      // Verify file contents
      const content1 = await fs.readFile(source1, 'utf-8');
      const content2 = await fs.readFile(source2, 'utf-8');

      expect(content1).to.equal('References [[renamed-target]] here');
      expect(content2).to.equal('Also links to [[renamed-target|Target Note]]');
    });

    it('should return zero counts when note has no backlinks', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });

      const targetNote = path.join(tempDir, '2025', '10-October', 'lonely-note.txt');
      const newTargetNote = path.join(tempDir, '2025', '10-October', 'renamed-lonely.txt');

      await fs.writeFile(targetNote, 'No one links to me');

      // Build backlinks index
      await linkService.buildBacklinksIndex();

      // Perform rename
      const result = await linkService.updateLinksOnRename(targetNote, newTargetNote);

      // Verify no updates
      expect(result.filesUpdated).to.equal(0);
      expect(result.linksUpdated).to.equal(0);
    });

    it('should handle multiple links from same file', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });

      const targetNote = path.join(tempDir, '2025', '10-October', 'api-docs.txt');
      const newTargetNote = path.join(tempDir, '2025', '10-October', 'api-reference.txt');
      const sourceNote = path.join(tempDir, '2025', '10-October', 'project.txt');

      await fs.writeFile(targetNote, 'API documentation');
      await fs.writeFile(sourceNote,
        'See [[api-docs]] for details. Also [[api-docs|API Guide]] and [[api-docs]].');

      // Build backlinks index
      await linkService.buildBacklinksIndex();

      // Perform rename
      const result = await linkService.updateLinksOnRename(targetNote, newTargetNote);

      // Should count 1 file but 3 links
      expect(result.filesUpdated).to.equal(1);
      expect(result.linksUpdated).to.equal(3);

      const content = await fs.readFile(sourceNote, 'utf-8');
      expect(content).to.equal(
        'See [[api-reference]] for details. Also [[api-reference|API Guide]] and [[api-reference]].');
    });

    it('should rebuild index after updating links', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });

      const targetNote = path.join(tempDir, '2025', '10-October', 'old.txt');
      const newTargetNote = path.join(tempDir, '2025', '10-October', 'new.txt');
      const sourceNote = path.join(tempDir, '2025', '10-October', 'source.txt');

      await fs.writeFile(targetNote, 'Content');
      await fs.writeFile(sourceNote, 'Link to [[old]]');

      // Build initial index
      await linkService.buildBacklinksIndex();

      // Get initial backlinks
      const initialBacklinks = linkService.getBacklinks(targetNote);
      expect(initialBacklinks).to.have.lengthOf(1);

      // Perform rename (which should rebuild index)
      await linkService.updateLinksOnRename(targetNote, newTargetNote);

      // Actually rename the file (the link service updates links but doesn't move files)
      await fs.rename(targetNote, newTargetNote);

      // Rebuild index manually to reflect the file system changes
      await linkService.buildBacklinksIndex();

      // The old path should now have no backlinks
      const oldBacklinks = linkService.getBacklinks(targetNote);
      expect(oldBacklinks).to.have.lengthOf(0);

      // The new path should have backlinks
      const newBacklinks = linkService.getBacklinks(newTargetNote);
      expect(newBacklinks).to.have.lengthOf(1);
    });
  });

  describe('Link extraction and resolution', () => {
    it('should extract links with and without display text', async () => {
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      const testFile = path.join(tempDir, '2025', '10-October', 'test.txt');

      const content = `First link: [[note1]]
Second link: [[note2|Custom Text]]
Third link: [[note3]]`;

      await fs.writeFile(testFile, content);

      const links = await linkService.extractLinksFromFile(testFile);

      expect(links).to.have.lengthOf(3);
      expect(links[0].linkText).to.equal('note1');
      expect(links[0].displayText).to.be.undefined;
      expect(links[1].linkText).to.equal('note2');
      expect(links[1].displayText).to.equal('Custom Text');
      expect(links[2].linkText).to.equal('note3');
      expect(links[2].displayText).to.be.undefined;
    });
  });
});
