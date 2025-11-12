/**
 * Unit tests for TagRenameProvider
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { TagRenameProvider } from '../../services/tagRenameProvider';
import { TagService } from '../../services/tagService';
import { TagEditService } from '../../services/tagEditService';
import * as dialogHelpers from '../../utils/dialogHelpers';
import { cleanupMocks } from '../setup';

describe('TagRenameProvider', () => {
    let sandbox: sinon.SinonSandbox;
    let tempDir: string;
    let tagService: TagService;
    let tagEditService: TagEditService;
    let renameProvider: TagRenameProvider;

    beforeEach(async () => {
        sandbox = sinon.createSandbox();
        cleanupMocks();

        // Create temporary directory for test files
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'noted-tag-rename-test-'));

        // Initialize services
        tagService = new TagService(tempDir);
        tagEditService = new TagEditService(tagService);
        renameProvider = new TagRenameProvider(tagService, tagEditService);
    });

    afterEach(async () => {
        sandbox.restore();
        cleanupMocks(); // Reset mock objects after restoring stubs
        // Clean up temporary directory
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    describe('provideRenameEdits', () => {
        it('should index tags from test file correctly', async () => {
            // Create test file with multiple tags
            const noteDir = path.join(tempDir, '2025', '11-November');
            await fs.mkdir(noteDir, { recursive: true });
            const notePath = path.join(noteDir, '2025-11-11.txt');
            await fs.writeFile(notePath, 'Content with #bug and #defect tags');

            // Build tag index
            await tagService.buildTagIndex();

            // Verify tags were indexed
            const allTags = tagService.getAllTagLabels();
            expect(allTags).to.include('bug');
            expect(allTags).to.include('defect');

            // Verify getTagAtPosition can find tags
            // 'Content with #bug and #defect tags'
            // Position 14 is at 'b' in '#bug'
            const tagAtPos = tagService.getTagAtPosition(notePath, 0, 14);
            expect(tagAtPos).to.not.be.null;
            expect(tagAtPos?.tag).to.equal('bug');
        });

        it('should show modal dialog with button objects when tag already exists', async () => {
            // Create test file with multiple tags
            const noteDir = path.join(tempDir, '2025', '11-November');
            await fs.mkdir(noteDir, { recursive: true });
            const notePath = path.join(noteDir, '2025-11-11.txt');
            await fs.writeFile(notePath, 'Content with #bug and #defect tags');

            // Build tag index
            await tagService.buildTagIndex();

            // Mock dialog helpers showModalWarning
            const showWarningStub = sandbox.stub(dialogHelpers, 'showModalWarning').resolves({ title: 'No', isCloseAffordance: true } as any);

            // Create mock document and position
            const mockDocument = {
                uri: vscode.Uri.file(notePath),
                fileName: notePath,  // IMPORTANT: provideRenameEdits uses document.fileName
                getText: sandbox.stub().returns('#bug'),
                lineAt: sandbox.stub().returns({
                    text: 'Content with #bug and #defect tags',
                    range: new vscode.Range(0, 0, 0, 37)
                }),
                lineCount: 1
            } as any;

            const position = new vscode.Position(0, 14); // Position at '#bug'

            // Try to rename 'bug' to 'defect' (which already exists)
            const result = await renameProvider.provideRenameEdits(
                mockDocument,
                position,
                'defect',
                {} as any
            );

            // Verify showModalWarning was called with correct format
            expect(showWarningStub.calledOnce).to.be.true;

            const args = showWarningStub.firstCall.args;

            // Verify message
            expect(args[0]).to.include('already exists');
            expect(args[0]).to.include('merge');

            // Verify options object with detail
            expect(args[1]).to.be.an('object');
            expect(args[1].detail).to.be.a('string');

            // Verify button objects (not strings)
            expect(args[2]).to.be.an('object');
            expect(args[2].title).to.equal('Yes');
            expect(args[2].isCloseAffordance).to.be.false;

            expect(args[3]).to.be.an('object');
            expect(args[3].title).to.equal('No');
            expect(args[3].isCloseAffordance).to.be.true;

            // Verify rename was cancelled (user clicked No)
            expect(result).to.be.null;
        });

        it('should proceed with merge when Yes button is clicked', async () => {
            // Create test file with multiple tags
            const noteDir = path.join(tempDir, '2025', '11-November');
            await fs.mkdir(noteDir, { recursive: true });
            const notePath = path.join(noteDir, '2025-11-11.txt');
            await fs.writeFile(notePath, 'Content with #bug and #defect tags');

            // Build tag index
            await tagService.buildTagIndex();

            // Mock dialog helpers showModalWarning - user clicks Yes
            const showWarningStub = sandbox.stub(dialogHelpers, 'showModalWarning').resolves({ title: 'Yes', isCloseAffordance: false } as any);

            // Create mock document and position
            const mockDocument = {
                uri: vscode.Uri.file(notePath),
                fileName: notePath,  // IMPORTANT: provideRenameEdits uses document.fileName
                getText: sandbox.stub().returns('#bug'),
                lineAt: sandbox.stub().returns({
                    text: 'Content with #bug and #defect tags',
                    range: new vscode.Range(0, 0, 0, 37)
                }),
                lineCount: 1
            } as any;

            const position = new vscode.Position(0, 14); // Position at '#bug'

            // Try to rename 'bug' to 'defect' (which already exists)
            const result = await renameProvider.provideRenameEdits(
                mockDocument,
                position,
                'defect',
                {} as any
            );

            // Verify rename proceeded (returned WorkspaceEdit, not null)
            expect(result).to.not.be.null;
        });

        it('should cancel rename when dialog is dismissed', async () => {
            // Create test file with multiple tags
            const noteDir = path.join(tempDir, '2025', '11-November');
            await fs.mkdir(noteDir, { recursive: true });
            const notePath = path.join(noteDir, '2025-11-11.txt');
            await fs.writeFile(notePath, 'Content with #bug and #defect tags');

            // Build tag index
            await tagService.buildTagIndex();

            // Mock dialog helpers showModalWarning - user dismisses dialog
            const showWarningStub = sandbox.stub(dialogHelpers, 'showModalWarning').resolves(undefined);

            // Create mock document and position
            const mockDocument = {
                uri: vscode.Uri.file(notePath),
                fileName: notePath,  // IMPORTANT: provideRenameEdits uses document.fileName
                getText: sandbox.stub().returns('#bug'),
                lineAt: sandbox.stub().returns({
                    text: 'Content with #bug and #defect tags',
                    range: new vscode.Range(0, 0, 0, 37)
                }),
                lineCount: 1
            } as any;

            const position = new vscode.Position(0, 14); // Position at '#bug'

            // Try to rename 'bug' to 'defect'
            const result = await renameProvider.provideRenameEdits(
                mockDocument,
                position,
                'defect',
                {} as any
            );

            // Verify rename was cancelled
            expect(result).to.be.null;
        });
    });
});
