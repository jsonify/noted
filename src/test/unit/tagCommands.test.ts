import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { renameTag, mergeTags, deleteTag, exportTags } from '../../commands/tagCommands';
import { TagService } from '../../services/tagService';

describe('tagCommands', () => {
  let tempDir: string;
  let tagService: TagService;
  let sandbox: sinon.SinonSandbox;

  beforeEach(async () => {
    // Create temporary directory for test notes
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'noted-tag-cmd-test-'));
    tagService = new TagService(tempDir);
    sandbox = sinon.createSandbox();
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
    sandbox.restore();
  });

  // Helper function to create test notes
  async function createTestNote(yearMonth: string, filename: string, content: string): Promise<string> {
    const [year, month] = yearMonth.split('-');
    const dir = path.join(tempDir, year, month);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, content);
    return filePath;
  }

  // Helper function to read note content
  async function readNoteContent(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf8');
  }

  describe('renameTag', () => {
    it('should rename a tag across all notes', async () => {
      // Create test notes with tags
      const note1 = await createTestNote('2025-10-October', '2025-10-15.txt', 'tags: #bug #urgent\n\nNote 1 content');
      const note2 = await createTestNote('2025-10-October', '2025-10-16.txt', 'tags: #bug #feature\n\nNote 2 content');
      const note3 = await createTestNote('2025-10-October', '2025-10-17.txt', 'tags: #feature\n\nNote 3 content');

      await tagService.buildTagIndex();

      // Mock VS Code UI
      sandbox.stub(vscode.window, 'showInputBox')
        .onFirstCall().resolves('bug')   // old tag
        .onSecondCall().resolves('defect'); // new tag
      sandbox.stub(vscode.window, 'showInformationMessage').resolves();

      // Execute rename
      await renameTag(tagService, tempDir);

      // Verify tags were renamed
      const content1 = await readNoteContent(note1);
      const content2 = await readNoteContent(note2);
      const content3 = await readNoteContent(note3);

      expect(content1).to.include('#defect');
      expect(content1).to.not.include('#bug');
      expect(content1).to.include('#urgent');

      expect(content2).to.include('#defect');
      expect(content2).to.not.include('#bug');
      expect(content2).to.include('#feature');

      expect(content3).to.include('#feature');
      expect(content3).to.not.include('#bug');
    });

    it('should show count of affected notes', async () => {
      await createTestNote('2025-10-October', '2025-10-15.txt', 'tags: #bug\n\nContent');
      await createTestNote('2025-10-October', '2025-10-16.txt', 'tags: #bug\n\nContent');
      await tagService.buildTagIndex();

      sandbox.stub(vscode.window, 'showInputBox')
        .onFirstCall().resolves('bug')
        .onSecondCall().resolves('defect');

      const infoStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves();

      await renameTag(tagService, tempDir);

      expect(infoStub.calledOnce).to.be.true;
      expect(infoStub.firstCall.args[0]).to.include('2 notes');
    });

    it('should handle cancellation', async () => {
      await createTestNote('2025-10-October', '2025-10-15.txt', 'tags: #bug\n\nContent');
      await tagService.buildTagIndex();

      // User cancels at old tag input
      sandbox.stub(vscode.window, 'showInputBox').resolves(undefined);
      const infoStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves();

      await renameTag(tagService, tempDir);

      expect(infoStub.called).to.be.false;
    });

    it('should handle non-existent tag', async () => {
      await createTestNote('2025-10-October', '2025-10-15.txt', 'tags: #bug\n\nContent');
      await tagService.buildTagIndex();

      sandbox.stub(vscode.window, 'showInputBox')
        .onFirstCall().resolves('nonexistent')
        .onSecondCall().resolves('new');

      const errorStub = sandbox.stub(vscode.window, 'showErrorMessage').resolves();

      await renameTag(tagService, tempDir);

      expect(errorStub.calledOnce).to.be.true;
      expect(errorStub.firstCall.args[0]).to.include('not found');
    });

    it('should handle invalid new tag name', async () => {
      await createTestNote('2025-10-October', '2025-10-15.txt', 'tags: #bug\n\nContent');
      await tagService.buildTagIndex();

      sandbox.stub(vscode.window, 'showInputBox')
        .onFirstCall().resolves('bug')
        .onSecondCall().resolves('Invalid Tag!'); // invalid format

      const errorStub = sandbox.stub(vscode.window, 'showErrorMessage').resolves();

      await renameTag(tagService, tempDir);

      expect(errorStub.calledOnce).to.be.true;
      expect(errorStub.firstCall.args[0]).to.include('Invalid');
    });

    it('should preserve note content and formatting', async () => {
      const originalContent = 'tags: #bug #urgent\n\nImportant content\nMultiple lines\n  Indentation';
      const note = await createTestNote('2025-10-October', '2025-10-15.txt', originalContent);
      await tagService.buildTagIndex();

      sandbox.stub(vscode.window, 'showInputBox')
        .onFirstCall().resolves('bug')
        .onSecondCall().resolves('defect');
      sandbox.stub(vscode.window, 'showInformationMessage').resolves();

      await renameTag(tagService, tempDir);

      const newContent = await readNoteContent(note);
      expect(newContent).to.include('Important content');
      expect(newContent).to.include('Multiple lines');
      expect(newContent).to.include('  Indentation');
    });

    // Note: Skipping rollback test as fs.promises cannot be easily stubbed with sinon
  });

  describe('mergeTags', () => {
    it('should merge two tags into one', async () => {
      const note1 = await createTestNote('2025-10-October', '2025-10-15.txt', 'tags: #bug #urgent\n\nNote 1');
      const note2 = await createTestNote('2025-10-October', '2025-10-16.txt', 'tags: #defect #feature\n\nNote 2');
      const note3 = await createTestNote('2025-10-October', '2025-10-17.txt', 'tags: #bug #defect\n\nNote 3');

      await tagService.buildTagIndex();

      // Mock VS Code UI - merge defect into bug
      const quickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
      quickPickStub.onFirstCall().resolves({ label: '#bug', description: '2 notes', tag: 'bug' } as any);
      quickPickStub.onSecondCall().resolves({ label: '#defect', description: '2 notes', tag: 'defect' } as any);

      sandbox.stub(vscode.window, 'showInformationMessage').resolves();

      await mergeTags(tagService, tempDir);

      // Verify merging
      const content1 = await readNoteContent(note1);
      const content2 = await readNoteContent(note2);
      const content3 = await readNoteContent(note3);

      expect(content1).to.include('#bug');
      expect(content2).to.include('#bug');
      expect(content2).to.not.include('#defect');
      expect(content3).to.include('#bug');
      expect(content3).to.not.include('#defect');
    });

    it('should remove duplicate tags after merge', async () => {
      const note = await createTestNote('2025-10-October', '2025-10-15.txt', 'tags: #bug #defect\n\nNote with both');
      await tagService.buildTagIndex();

      const quickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
      quickPickStub.onFirstCall().resolves({ label: '#bug', tag: 'bug' } as any);
      quickPickStub.onSecondCall().resolves({ label: '#defect', tag: 'defect' } as any);

      sandbox.stub(vscode.window, 'showInformationMessage').resolves();

      await mergeTags(tagService, tempDir);

      const content = await readNoteContent(note);
      const bugMatches = (content.match(/#bug/g) || []).length;

      expect(bugMatches).to.equal(1);
      expect(content).to.not.include('#defect');
    });

    it('should handle cancellation at first tag selection', async () => {
      await createTestNote('2025-10-October', '2025-10-15.txt', 'tags: #bug\n\nContent');
      await createTestNote('2025-10-October', '2025-10-16.txt', 'tags: #feature\n\nContent');
      await tagService.buildTagIndex();

      sandbox.stub(vscode.window, 'showQuickPick').resolves(undefined);
      const infoStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves();

      await mergeTags(tagService, tempDir);

      expect(infoStub.called).to.be.false;
    });

    it('should handle cancellation at second tag selection', async () => {
      await createTestNote('2025-10-October', '2025-10-15.txt', 'tags: #bug #feature\n\nContent');
      await tagService.buildTagIndex();

      const quickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
      quickPickStub.onFirstCall().resolves({ label: '#bug', tag: 'bug' } as any);
      quickPickStub.onSecondCall().resolves(undefined);

      const infoStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves();

      await mergeTags(tagService, tempDir);

      expect(infoStub.called).to.be.false;
    });

    it('should prevent merging tag into itself', async () => {
      await createTestNote('2025-10-October', '2025-10-15.txt', 'tags: #bug\n\nContent');
      await createTestNote('2025-10-October', '2025-10-16.txt', 'tags: #feature\n\nContent');
      await tagService.buildTagIndex();

      const quickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
      quickPickStub.onFirstCall().resolves({ label: '#bug', tag: 'bug' } as any);
      quickPickStub.onSecondCall().resolves({ label: '#bug', tag: 'bug' } as any);

      const errorStub = sandbox.stub(vscode.window, 'showErrorMessage').resolves();

      await mergeTags(tagService, tempDir);

      expect(errorStub.calledOnce).to.be.true;
      expect(errorStub.firstCall.args[0]).to.include('Cannot merge a tag into itself');
    });

    it('should show count of affected notes', async () => {
      await createTestNote('2025-10-October', '2025-10-15.txt', 'tags: #bug\n\nContent');
      await createTestNote('2025-10-October', '2025-10-16.txt', 'tags: #defect\n\nContent');
      await tagService.buildTagIndex();

      const quickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
      quickPickStub.onFirstCall().resolves({ label: '#bug', tag: 'bug' } as any);
      quickPickStub.onSecondCall().resolves({ label: '#defect', tag: 'defect' } as any);

      const infoStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves();

      await mergeTags(tagService, tempDir);

      expect(infoStub.calledOnce).to.be.true;
      expect(infoStub.firstCall.args[0]).to.include('2 notes');
    });
  });

  describe('deleteTag', () => {
    it('should delete a tag from all notes', async () => {
      const note1 = await createTestNote('2025-10-October', '2025-10-15.txt', 'tags: #bug #urgent\n\nNote 1');
      const note2 = await createTestNote('2025-10-October', '2025-10-16.txt', 'tags: #bug #feature\n\nNote 2');
      const note3 = await createTestNote('2025-10-October', '2025-10-17.txt', 'tags: #feature\n\nNote 3');

      await tagService.buildTagIndex();

      // Mock VS Code UI
      sandbox.stub(vscode.window, 'showQuickPick').resolves({ label: '#bug', description: '2 notes', tag: 'bug' } as any);
      sandbox.stub(vscode.window, 'showWarningMessage').resolves('Delete' as any);
      sandbox.stub(vscode.window, 'showInformationMessage').resolves();

      await deleteTag(tagService, tempDir);

      const content1 = await readNoteContent(note1);
      const content2 = await readNoteContent(note2);
      const content3 = await readNoteContent(note3);

      expect(content1).to.not.include('#bug');
      expect(content1).to.include('#urgent');
      expect(content2).to.not.include('#bug');
      expect(content2).to.include('#feature');
      expect(content3).to.include('#feature');
    });

    it('should require confirmation before deletion', async () => {
      await createTestNote('2025-10-October', '2025-10-15.txt', 'tags: #bug\n\nContent');
      await tagService.buildTagIndex();

      sandbox.stub(vscode.window, 'showQuickPick').resolves({ label: '#bug', tag: 'bug' } as any);
      sandbox.stub(vscode.window, 'showWarningMessage').resolves('Cancel' as any);
      const infoStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves();

      await deleteTag(tagService, tempDir);

      expect(infoStub.called).to.be.false;
    });

    it('should handle cancellation at tag selection', async () => {
      await createTestNote('2025-10-October', '2025-10-15.txt', 'tags: #bug\n\nContent');
      await tagService.buildTagIndex();

      sandbox.stub(vscode.window, 'showQuickPick').resolves(undefined);
      const warningStub = sandbox.stub(vscode.window, 'showWarningMessage').resolves();

      await deleteTag(tagService, tempDir);

      expect(warningStub.called).to.be.false;
    });

    it('should clean up empty tag lines', async () => {
      const note = await createTestNote('2025-10-October', '2025-10-15.txt', 'tags: #bug\n\nNote content');
      await tagService.buildTagIndex();

      sandbox.stub(vscode.window, 'showQuickPick').resolves({ label: '#bug', tag: 'bug' } as any);
      sandbox.stub(vscode.window, 'showWarningMessage').resolves('Delete' as any);
      sandbox.stub(vscode.window, 'showInformationMessage').resolves();

      await deleteTag(tagService, tempDir);

      const content = await readNoteContent(note);
      expect(content).to.not.include('tags:');
      expect(content).to.include('Note content');
    });

    it('should show count of affected notes in confirmation', async () => {
      await createTestNote('2025-10-October', '2025-10-15.txt', 'tags: #bug\n\nContent');
      await createTestNote('2025-10-October', '2025-10-16.txt', 'tags: #bug\n\nContent');
      await tagService.buildTagIndex();

      sandbox.stub(vscode.window, 'showQuickPick').resolves({ label: '#bug', description: '2 notes', tag: 'bug' } as any);
      const warningStub = sandbox.stub(vscode.window, 'showWarningMessage').resolves('Delete' as any);
      sandbox.stub(vscode.window, 'showInformationMessage').resolves();

      await deleteTag(tagService, tempDir);

      expect(warningStub.calledOnce).to.be.true;
      expect(warningStub.firstCall.args[0]).to.include('2 notes');
    });
  });

  describe('exportTags', () => {
    it('should export tags to JSON format', async () => {
      await createTestNote('2025-10-October', '2025-10-15.txt', 'tags: #bug #urgent\n\nNote 1');
      await createTestNote('2025-10-October', '2025-10-16.txt', 'tags: #bug #feature\n\nNote 2');
      await tagService.buildTagIndex();

      let exportedData: any = null;
      sandbox.stub(vscode.window, 'showInformationMessage').callsFake((message: string) => {
        // Extract JSON from message
        const jsonMatch = message.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          exportedData = JSON.parse(jsonMatch[1]);
        }
        return Promise.resolve(undefined);
      });

      await exportTags(tagService);

      expect(exportedData).to.not.be.null;
      expect(exportedData.tags).to.be.an('array');
      expect(exportedData.tags).to.have.lengthOf(3);
      expect(exportedData.total).to.equal(3);
    });

    it('should include tag metadata in export', async () => {
      const note1 = await createTestNote('2025-10-October', '2025-10-15.txt', 'tags: #bug\n\nNote 1');
      const note2 = await createTestNote('2025-10-October', '2025-10-16.txt', 'tags: #bug\n\nNote 2');
      await tagService.buildTagIndex();

      let exportedData: any = null;
      sandbox.stub(vscode.window, 'showInformationMessage').callsFake((message: string) => {
        const jsonMatch = message.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          exportedData = JSON.parse(jsonMatch[1]);
        }
        return Promise.resolve(undefined);
      });

      await exportTags(tagService);

      const bugTag = exportedData.tags.find((t: any) => t.name === 'bug');
      expect(bugTag).to.exist;
      expect(bugTag.count).to.equal(2);
      expect(bugTag.notes).to.be.an('array');
      expect(bugTag.notes).to.have.lengthOf(2);
    });

    it('should handle empty tag index', async () => {
      await tagService.buildTagIndex();

      let exportedData: any = null;
      sandbox.stub(vscode.window, 'showInformationMessage').callsFake((message: string) => {
        const jsonMatch = message.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          exportedData = JSON.parse(jsonMatch[1]);
        }
        return Promise.resolve(undefined);
      });

      await exportTags(tagService);

      expect(exportedData).to.not.be.null;
      expect(exportedData.tags).to.deep.equal([]);
      expect(exportedData.total).to.equal(0);
    });

    it('should include export timestamp', async () => {
      await tagService.buildTagIndex();

      let exportedData: any = null;
      sandbox.stub(vscode.window, 'showInformationMessage').callsFake((message: string) => {
        const jsonMatch = message.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          exportedData = JSON.parse(jsonMatch[1]);
        }
        return Promise.resolve(undefined);
      });

      await exportTags(tagService);

      expect(exportedData.exportDate).to.be.a('string');
      expect(new Date(exportedData.exportDate).getTime()).to.be.greaterThan(0);
    });
  });
});
