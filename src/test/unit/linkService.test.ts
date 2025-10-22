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

  describe('Path-based link disambiguation', () => {
    beforeEach(async () => {
      // Create a directory structure with duplicate note names
      await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });
      await fs.mkdir(path.join(tempDir, '2025', '11-November'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'work'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'personal'), { recursive: true });
    });

    it('should resolve simple note name links', async () => {
      const notePath = path.join(tempDir, '2025', '10-October', 'meeting.txt');
      await fs.writeFile(notePath, 'Meeting notes');

      const resolved = await linkService.resolveLink('meeting');
      expect(resolved).to.equal(notePath);
    });

    it('should resolve path-based links with full path', async () => {
      const notePath = path.join(tempDir, '2025', '10-October', 'meeting.txt');
      await fs.writeFile(notePath, 'Meeting notes');

      const resolved = await linkService.resolveLink('2025/10-October/meeting');
      expect(resolved).to.equal(notePath);
    });

    it('should resolve path-based links with partial path', async () => {
      const notePath = path.join(tempDir, 'work', 'meeting.txt');
      await fs.writeFile(notePath, 'Work meeting');

      const resolved = await linkService.resolveLink('work/meeting');
      expect(resolved).to.equal(notePath);
    });

    it('should disambiguate between notes with same name in different folders', async () => {
      const workMeeting = path.join(tempDir, 'work', 'meeting.txt');
      const personalMeeting = path.join(tempDir, 'personal', 'meeting.txt');

      await fs.writeFile(workMeeting, 'Work meeting');
      await fs.writeFile(personalMeeting, 'Personal meeting');

      // Simple name resolves to first match
      const simpleResolved = await linkService.resolveLink('meeting');
      expect(simpleResolved).to.be.oneOf([workMeeting, personalMeeting]);

      // Path-based links resolve to specific notes
      const workResolved = await linkService.resolveLink('work/meeting');
      expect(workResolved).to.equal(workMeeting);

      const personalResolved = await linkService.resolveLink('personal/meeting');
      expect(personalResolved).to.equal(personalMeeting);
    });

    it('should find all matching notes for ambiguous links', async () => {
      const meeting1 = path.join(tempDir, '2025', '10-October', 'meeting.txt');
      const meeting2 = path.join(tempDir, '2025', '11-November', 'meeting.txt');
      const meeting3 = path.join(tempDir, 'work', 'meeting.txt');

      await fs.writeFile(meeting1, 'October meeting');
      await fs.writeFile(meeting2, 'November meeting');
      await fs.writeFile(meeting3, 'Work meeting');

      const matches = await linkService.findAllMatchingNotes('meeting');
      expect(matches).to.have.lengthOf(3);
      expect(matches).to.include.members([meeting1, meeting2, meeting3]);
    });

    it('should detect ambiguous links', async () => {
      const note1 = path.join(tempDir, '2025', '10-October', 'project.txt');
      const note2 = path.join(tempDir, 'work', 'project.txt');

      await fs.writeFile(note1, 'Project 1');
      await fs.writeFile(note2, 'Project 2');

      const isAmbiguous = await linkService.isAmbiguousLink('project');
      expect(isAmbiguous).to.be.true;
    });

    it('should not consider path-based links as ambiguous', async () => {
      const note1 = path.join(tempDir, '2025', '10-October', 'project.txt');
      const note2 = path.join(tempDir, 'work', 'project.txt');

      await fs.writeFile(note1, 'Project 1');
      await fs.writeFile(note2, 'Project 2');

      const isAmbiguous = await linkService.isAmbiguousLink('work/project');
      expect(isAmbiguous).to.be.false;
    });

    it('should handle links with backslashes (Windows-style paths)', async () => {
      const notePath = path.join(tempDir, 'work', 'project.txt');
      await fs.writeFile(notePath, 'Work project');

      const resolved = await linkService.resolveLink('work\\project');
      expect(resolved).to.equal(notePath);
    });

    it('should resolve links with multiple path components', async () => {
      const notePath = path.join(tempDir, '2025', '10-October', 'meeting.txt');
      await fs.writeFile(notePath, 'October meeting');

      const resolved = await linkService.resolveLink('2025/10-October/meeting');
      expect(resolved).to.equal(notePath);
    });

    it('should handle non-existent path-based links', async () => {
      const resolved = await linkService.resolveLink('nonexistent/folder/note');
      expect(resolved).to.be.undefined;
    });

    it('should return empty array for non-matching findAllMatchingNotes', async () => {
      const matches = await linkService.findAllMatchingNotes('nonexistent-note');
      expect(matches).to.have.lengthOf(0);
    });

    it('should handle markdown files in path resolution', async () => {
      const notePath = path.join(tempDir, 'work', 'notes.md');
      await fs.writeFile(notePath, '# Work Notes');

      const resolved = await linkService.resolveLink('work/notes');
      expect(resolved).to.equal(notePath);
    });
  });

  describe('updateLinksInFile - File Moves', () => {
    it('should update simple links when file is moved to different folder', async () => {
      // Create folder structure
      await fs.mkdir(path.join(tempDir, 'old-folder'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'new-folder'), { recursive: true });

      const oldPath = path.join(tempDir, 'old-folder', 'meeting.txt');
      const newPath = path.join(tempDir, 'new-folder', 'meeting.txt');
      const sourceNote = path.join(tempDir, 'project.txt');

      // Create notes
      await fs.writeFile(oldPath, 'Meeting notes');
      await fs.writeFile(sourceNote, 'See [[meeting]] for details');

      // Update links to reflect the move
      const count = await linkService.updateLinksInFile(sourceNote, oldPath, newPath);

      // Should update the link to use path-based syntax or remain simple if unique
      expect(count).to.equal(1);
      const content = await fs.readFile(sourceNote, 'utf-8');
      // After move, simple link [[meeting]] should still work if name is unique
      expect(content).to.equal('See [[meeting]] for details');
    });

    it('should update path-based links when file is moved', async () => {
      await fs.mkdir(path.join(tempDir, 'old-folder'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'new-folder'), { recursive: true });

      const oldPath = path.join(tempDir, 'old-folder', 'document.txt');
      const newPath = path.join(tempDir, 'new-folder', 'document.txt');
      const sourceNote = path.join(tempDir, 'index.txt');

      await fs.writeFile(oldPath, 'Document content');
      await fs.writeFile(sourceNote, 'Check [[old-folder/document]] for info');

      const count = await linkService.updateLinksInFile(sourceNote, oldPath, newPath);

      expect(count).to.equal(1);
      const content = await fs.readFile(sourceNote, 'utf-8');
      expect(content).to.equal('Check [[new-folder/document]] for info');
    });

    it('should convert simple link to path-based when move creates ambiguity', async () => {
      await fs.mkdir(path.join(tempDir, 'folder1'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'folder2'), { recursive: true });

      const oldPath = path.join(tempDir, 'folder1', 'notes.txt');
      const newPath = path.join(tempDir, 'folder2', 'notes.txt');
      const conflictingNote = path.join(tempDir, 'notes.txt'); // Same basename in root
      const sourceNote = path.join(tempDir, 'index.txt');

      await fs.writeFile(oldPath, 'Original notes');
      await fs.writeFile(conflictingNote, 'Conflicting notes');
      await fs.writeFile(sourceNote, 'See [[notes]] for details');

      const count = await linkService.updateLinksInFile(sourceNote, oldPath, newPath);

      expect(count).to.equal(1);
      const content = await fs.readFile(sourceNote, 'utf-8');
      // Should use path-based link to avoid ambiguity
      expect(content).to.equal('See [[folder2/notes]] for details');
    });

    it('should preserve display text when updating moved file links', async () => {
      await fs.mkdir(path.join(tempDir, 'old-location'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'new-location'), { recursive: true });

      const oldPath = path.join(tempDir, 'old-location', 'guide.txt');
      const newPath = path.join(tempDir, 'new-location', 'guide.txt');
      const sourceNote = path.join(tempDir, 'readme.txt');

      await fs.writeFile(oldPath, 'Guide content');
      await fs.writeFile(sourceNote, 'Read the [[old-location/guide|User Guide]] first');

      const count = await linkService.updateLinksInFile(sourceNote, oldPath, newPath);

      expect(count).to.equal(1);
      const content = await fs.readFile(sourceNote, 'utf-8');
      expect(content).to.equal('Read the [[new-location/guide|User Guide]] first');
    });

    it('should handle nested folder moves correctly', async () => {
      await fs.mkdir(path.join(tempDir, 'projects', 'alpha'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'archive', 'completed'), { recursive: true });

      const oldPath = path.join(tempDir, 'projects', 'alpha', 'spec.txt');
      const newPath = path.join(tempDir, 'archive', 'completed', 'spec.txt');
      const sourceNote = path.join(tempDir, 'overview.txt');

      await fs.writeFile(oldPath, 'Spec document');
      await fs.writeFile(sourceNote, 'Details in [[projects/alpha/spec]]');

      const count = await linkService.updateLinksInFile(sourceNote, oldPath, newPath);

      expect(count).to.equal(1);
      const content = await fs.readFile(sourceNote, 'utf-8');
      expect(content).to.equal('Details in [[archive/completed/spec]]');
    });

    it('should not update links that do not point to moved file', async () => {
      await fs.mkdir(path.join(tempDir, 'folder1'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'folder2'), { recursive: true });

      const oldPath = path.join(tempDir, 'folder1', 'document.txt');
      const newPath = path.join(tempDir, 'folder2', 'document.txt');
      const otherNote = path.join(tempDir, 'other.txt');
      const sourceNote = path.join(tempDir, 'source.txt');

      await fs.writeFile(oldPath, 'Document to move');
      await fs.writeFile(otherNote, 'Different document');
      await fs.writeFile(sourceNote, 'See [[other]] for info');

      const count = await linkService.updateLinksInFile(sourceNote, oldPath, newPath);

      expect(count).to.equal(0);
      const content = await fs.readFile(sourceNote, 'utf-8');
      expect(content).to.equal('See [[other]] for info');
    });

    it('should handle file rename in same folder (basename change)', async () => {
      await fs.mkdir(path.join(tempDir, 'docs'), { recursive: true });

      const oldPath = path.join(tempDir, 'docs', 'draft.txt');
      const newPath = path.join(tempDir, 'docs', 'final.txt');
      const sourceNote = path.join(tempDir, 'index.txt');

      await fs.writeFile(oldPath, 'Draft content');
      await fs.writeFile(sourceNote, 'Current version: [[draft]]');

      const count = await linkService.updateLinksInFile(sourceNote, oldPath, newPath);

      expect(count).to.equal(1);
      const content = await fs.readFile(sourceNote, 'utf-8');
      expect(content).to.equal('Current version: [[final]]');
    });

    it('should handle both move and rename (path and basename change)', async () => {
      await fs.mkdir(path.join(tempDir, 'drafts'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'published'), { recursive: true });

      const oldPath = path.join(tempDir, 'drafts', 'article-draft.txt');
      const newPath = path.join(tempDir, 'published', 'article-final.txt');
      const sourceNote = path.join(tempDir, 'tracking.txt');

      await fs.writeFile(oldPath, 'Article content');
      await fs.writeFile(sourceNote, 'WIP: [[drafts/article-draft]]');

      const count = await linkService.updateLinksInFile(sourceNote, oldPath, newPath);

      expect(count).to.equal(1);
      const content = await fs.readFile(sourceNote, 'utf-8');
      expect(content).to.equal('WIP: [[published/article-final]]');
    });
  });
});
