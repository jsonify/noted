import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { renameTag, mergeTags, deleteTag, exportTags } from '../../commands/tagCommands';
import { TagService } from '../../services/tagService';
import { cleanupMocks } from '../setup';

describe('tagCommands', () => {
  let tempDir: string;
  let tagService: TagService;
  let sandbox: sinon.SinonSandbox;

  beforeEach(async () => {
    // Create temporary directory for test notes
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'noted-tag-cmd-test-'));
    tagService = new TagService(tempDir);
    sandbox = sinon.createSandbox();

    // Reset mocks before each test
    cleanupMocks();
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

      // Mock VS Code window API
      const inputBoxStub = sandbox.stub();
      inputBoxStub.onFirstCall().resolves('bug');    // old tag
      inputBoxStub.onSecondCall().resolves('defect'); // new tag
      
      const mockWindow = {
        showInputBox: inputBoxStub,
        showInformationMessage: sandbox.stub().resolves(),
        showErrorMessage: sandbox.stub().resolves()
      };

      Object.assign(vscode.window, mockWindow);

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

      const inputBoxStub = sandbox.stub();
      inputBoxStub.onFirstCall().resolves('bug');
      inputBoxStub.onSecondCall().resolves('defect');

      const infoStub = sandbox.stub().resolves();
      
      const mockWindow = {
        showInputBox: inputBoxStub,
        showInformationMessage: infoStub,
        showErrorMessage: sandbox.stub().resolves()
      };

      Object.assign(vscode.window, mockWindow);

      await renameTag(tagService, tempDir);

      expect(infoStub.calledOnce).to.be.true;
      expect(infoStub.firstCall.args[0]).to.include('2 notes');
    });

    it('should handle cancellation', async () => {
      await createTestNote('2025-10-October', '2025-10-15.txt', 'tags: #bug\n\nContent');
      await tagService.buildTagIndex();

      const mockWindow = {
        showInputBox: sandbox.stub().resolves(undefined),
        showInformationMessage: sandbox.stub().resolves(),
        showErrorMessage: sandbox.stub().resolves()
      };

      Object.assign(vscode.window, mockWindow);

      await renameTag(tagService, tempDir);

      expect(mockWindow.showInformationMessage.called).to.be.false;
    });

    // ... rest of existing test cases ...
  });

  describe('mergeTags', () => {
    it('should merge two tags into one', async () => {
      const note1 = await createTestNote('2025-10-October', '2025-10-15.txt', 'tags: #bug #urgent\n\nNote 1');
      const note2 = await createTestNote('2025-10-October', '2025-10-16.txt', 'tags: #defect #feature\n\nNote 2');
      const note3 = await createTestNote('2025-10-October', '2025-10-17.txt', 'tags: #bug #defect\n\nNote 3');

      await tagService.buildTagIndex();

      // Mock VS Code window API for merge
      const quickPickStub = sandbox.stub();
      quickPickStub.onFirstCall().resolves({ label: '#bug', description: '2 notes', tag: 'bug' });
      quickPickStub.onSecondCall().resolves({ label: '#defect', description: '2 notes', tag: 'defect' });

      const mockWindow = {
        showQuickPick: quickPickStub,
        showInformationMessage: sandbox.stub().resolves(),
        showErrorMessage: sandbox.stub().resolves()
      };

      Object.assign(vscode.window, mockWindow);

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

    // ... rest of existing test cases ...
  });

  // ... rest of existing test suites ...
});
