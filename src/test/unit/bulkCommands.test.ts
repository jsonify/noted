/**
 * Unit tests for bulk command handlers
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { handleBulkDelete, handleBulkArchive, handleBulkMove, handleBulkMerge } from '../../commands/bulkCommands';
import { BulkOperationsService } from '../../services/bulkOperationsService';
import { ArchiveService } from '../../services/archiveService';
import { cleanupMocks } from '../setup';

describe('bulkCommands', () => {
    let sandbox: sinon.SinonSandbox;
    let tempDir: string;
    let bulkService: BulkOperationsService;
    let archiveService: ArchiveService;

    beforeEach(async () => {
        sandbox = sinon.createSandbox();
        cleanupMocks();

        // Create temporary directory for test files
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'noted-bulk-cmd-test-'));

        // Initialize services
        bulkService = new BulkOperationsService();
        archiveService = new ArchiveService(tempDir);
    });

    afterEach(async () => {
        sandbox.restore();
        // Clean up temporary directory
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    describe('handleBulkDelete', () => {
        it('should show modal dialog with proper button objects', async () => {
            // Create test files and select them
            const note1 = path.join(tempDir, 'note1.txt');
            const note2 = path.join(tempDir, 'note2.txt');
            await fs.writeFile(note1, 'content 1');
            await fs.writeFile(note2, 'content 2');

            bulkService.enterSelectMode();
            bulkService.select(note1);
            bulkService.select(note2);

            // Mock VS Code window API
            const showWarningStub = sandbox.stub().resolves({ title: 'Cancel', isCloseAffordance: true });

            const mockWindow = {
                showWarningMessage: showWarningStub,
                showInformationMessage: sandbox.stub().resolves(),
                showErrorMessage: sandbox.stub().resolves()
            };

            Object.assign(vscode.window, mockWindow);

            // Execute bulk delete
            await handleBulkDelete(bulkService);

            // Verify showWarningMessage was called with correct format
            expect(showWarningStub.calledOnce).to.be.true;

            const args = showWarningStub.firstCall.args;
            expect(args[0]).to.equal('Delete 2 notes?');

            // Verify options object with modal: true and detail
            expect(args[1]).to.be.an('object');
            expect(args[1].modal).to.be.true;
            expect(args[1].detail).to.be.a('string');
            expect(args[1].detail).to.include('permanently deleted');

            // Verify button objects (not strings)
            expect(args[2]).to.be.an('object');
            expect(args[2].title).to.equal('Delete');
            expect(args[2].isCloseAffordance).to.be.false;

            expect(args[3]).to.be.an('object');
            expect(args[3].title).to.equal('Cancel');
            expect(args[3].isCloseAffordance).to.be.true;
        });

        it('should delete all selected files when Delete button is clicked', async () => {
            const note1 = path.join(tempDir, 'note1.txt');
            const note2 = path.join(tempDir, 'note2.txt');
            const note3 = path.join(tempDir, 'note3.txt');
            await fs.writeFile(note1, 'content 1');
            await fs.writeFile(note2, 'content 2');
            await fs.writeFile(note3, 'content 3');

            bulkService.enterSelectMode();
            bulkService.select(note1);
            bulkService.select(note2);

            // Mock VS Code window API - user clicks Delete
            const showWarningStub = sandbox.stub().resolves({ title: 'Delete', isCloseAffordance: false });

            const mockWindow = {
                showWarningMessage: showWarningStub,
                showInformationMessage: sandbox.stub().resolves(),
                showErrorMessage: sandbox.stub().resolves()
            };

            Object.assign(vscode.window, mockWindow);

            // Execute bulk delete
            await handleBulkDelete(bulkService);

            // Verify files were deleted
            const file1Exists = await fs.access(note1).then(() => true).catch(() => false);
            const file2Exists = await fs.access(note2).then(() => true).catch(() => false);
            const file3Exists = await fs.access(note3).then(() => true).catch(() => false);

            expect(file1Exists).to.be.false;
            expect(file2Exists).to.be.false;
            expect(file3Exists).to.be.true; // Not selected, should still exist
        });

        it('should not delete files when Cancel button is clicked', async () => {
            const note1 = path.join(tempDir, 'note1.txt');
            const note2 = path.join(tempDir, 'note2.txt');
            await fs.writeFile(note1, 'content 1');
            await fs.writeFile(note2, 'content 2');

            bulkService.enterSelectMode();
            bulkService.select(note1);
            bulkService.select(note2);

            // Mock VS Code window API - user clicks Cancel
            const showWarningStub = sandbox.stub().resolves({ title: 'Cancel', isCloseAffordance: true });

            const mockWindow = {
                showWarningMessage: showWarningStub,
                showInformationMessage: sandbox.stub().resolves(),
                showErrorMessage: sandbox.stub().resolves()
            };

            Object.assign(vscode.window, mockWindow);

            // Execute bulk delete
            await handleBulkDelete(bulkService);

            // Verify files were NOT deleted
            const file1Exists = await fs.access(note1).then(() => true).catch(() => false);
            const file2Exists = await fs.access(note2).then(() => true).catch(() => false);

            expect(file1Exists).to.be.true;
            expect(file2Exists).to.be.true;
        });

        it('should clear selection and exit select mode after successful deletion', async () => {
            const note1 = path.join(tempDir, 'note1.txt');
            await fs.writeFile(note1, 'content 1');

            bulkService.enterSelectMode();
            bulkService.select(note1);

            // Mock VS Code window API - user clicks Delete
            const showWarningStub = sandbox.stub().resolves({ title: 'Delete', isCloseAffordance: false });

            const mockWindow = {
                showWarningMessage: showWarningStub,
                showInformationMessage: sandbox.stub().resolves(),
                showErrorMessage: sandbox.stub().resolves()
            };

            Object.assign(vscode.window, mockWindow);

            // Execute bulk delete
            await handleBulkDelete(bulkService);

            // Verify selection was cleared and select mode exited
            expect(bulkService.getSelectionCount()).to.equal(0);
            expect(bulkService.isSelectModeActive()).to.be.false;
        });

        it('should show warning if no notes are selected', async () => {
            const showWarningStub = sandbox.stub().resolves();

            const mockWindow = {
                showWarningMessage: showWarningStub,
                showInformationMessage: sandbox.stub().resolves(),
                showErrorMessage: sandbox.stub().resolves()
            };

            Object.assign(vscode.window, mockWindow);

            // Execute bulk delete with no selection
            await handleBulkDelete(bulkService);

            // Verify warning was shown
            expect(showWarningStub.calledOnce).to.be.true;
            expect(showWarningStub.firstCall.args[0]).to.include('No notes selected');
        });
    });

    describe('handleBulkArchive', () => {
        it('should show modal dialog with proper button objects', async () => {
            // Create test files and select them
            const note1 = path.join(tempDir, 'note1.txt');
            await fs.writeFile(note1, 'content 1');

            bulkService.enterSelectMode();
            bulkService.select(note1);

            // Mock VS Code window API
            const showInfoStub = sandbox.stub().resolves({ title: 'Cancel', isCloseAffordance: true });

            const mockWindow = {
                showWarningMessage: sandbox.stub().resolves(),
                showInformationMessage: showInfoStub,
                showErrorMessage: sandbox.stub().resolves()
            };

            Object.assign(vscode.window, mockWindow);

            // Execute bulk archive
            await handleBulkArchive(bulkService, archiveService);

            // Verify showInformationMessage was called with correct format
            expect(showInfoStub.calledOnce).to.be.true;

            const args = showInfoStub.firstCall.args;
            expect(args[0]).to.include('Archive');

            // Verify options object with modal: true and detail
            expect(args[1]).to.be.an('object');
            expect(args[1].modal).to.be.true;
            expect(args[1].detail).to.be.a('string');
            expect(args[1].detail).to.include('archive');

            // Verify button objects
            expect(args[2]).to.be.an('object');
            expect(args[2].title).to.equal('Archive');
            expect(args[2].isCloseAffordance).to.be.false;

            expect(args[3]).to.be.an('object');
            expect(args[3].title).to.equal('Cancel');
            expect(args[3].isCloseAffordance).to.be.true;
        });
    });

    describe('handleBulkMove', () => {
        it('should show modal dialog with proper button objects when confirming move', async () => {
            // Create test files and a destination folder
            const note1 = path.join(tempDir, 'note1.txt');
            const destFolder = path.join(tempDir, 'destination');
            await fs.writeFile(note1, 'content 1');
            await fs.mkdir(destFolder);

            bulkService.enterSelectMode();
            bulkService.select(note1);

            // Mock folder selection first, then move confirmation
            const showQuickPickStub = sandbox.stub().resolves({
                label: 'destination',
                description: destFolder,
                folder: { name: 'destination', path: destFolder }
            });

            const showInfoStub = sandbox.stub().resolves({ title: 'Cancel', isCloseAffordance: true });

            const mockWindow = {
                showWarningMessage: sandbox.stub().resolves(),
                showInformationMessage: showInfoStub,
                showQuickPick: showQuickPickStub,
                showErrorMessage: sandbox.stub().resolves()
            };

            Object.assign(vscode.window, mockWindow);

            // Mock workspace configuration
            const mockWorkspace = {
                getConfiguration: () => ({
                    get: () => tempDir
                }),
                workspaceFolders: [{ uri: { fsPath: tempDir } }]
            };

            Object.assign(vscode.workspace, mockWorkspace);

            // Execute bulk move
            await handleBulkMove(bulkService);

            // Verify showInformationMessage was called with button objects
            expect(showInfoStub.calledOnce).to.be.true;

            const args = showInfoStub.firstCall.args;

            // Verify options object
            expect(args[1]).to.be.an('object');
            expect(args[1].modal).to.be.true;

            // Verify button objects
            expect(args[2]).to.be.an('object');
            expect(args[2].title).to.equal('Move');

            expect(args[3]).to.be.an('object');
            expect(args[3].title).to.equal('Cancel');
        });
    });

    describe('handleBulkMerge', () => {
        it('should show modal dialog with proper button objects', async () => {
            // Create test files and select them
            const note1 = path.join(tempDir, 'note1.txt');
            const note2 = path.join(tempDir, 'note2.txt');
            await fs.writeFile(note1, 'content 1');
            await fs.writeFile(note2, 'content 2');

            bulkService.enterSelectMode();
            bulkService.select(note1);
            bulkService.select(note2);

            // Mock VS Code window API
            const showWarningStub = sandbox.stub().resolves({ title: 'Cancel', isCloseAffordance: true });

            const mockWindow = {
                showWarningMessage: showWarningStub,
                showInformationMessage: sandbox.stub().resolves(),
                showQuickPick: sandbox.stub().resolves(undefined), // Cancel on quick pick
                showErrorMessage: sandbox.stub().resolves()
            };

            Object.assign(vscode.window, mockWindow);

            // Execute bulk merge
            await handleBulkMerge(bulkService);

            // Verify showWarningMessage was called with correct format
            expect(showWarningStub.calledOnce).to.be.true;

            const args = showWarningStub.firstCall.args;
            expect(args[0]).to.include('Merge');

            // Verify options object with modal: true and detail
            expect(args[1]).to.be.an('object');
            expect(args[1].modal).to.be.true;
            expect(args[1].detail).to.be.a('string');

            // Verify button objects
            expect(args[2]).to.be.an('object');
            expect(args[2].title).to.equal('Merge');
            expect(args[2].isCloseAffordance).to.be.false;

            expect(args[3]).to.be.an('object');
            expect(args[3].title).to.equal('Cancel');
            expect(args[3].isCloseAffordance).to.be.true;
        });

        it('should require at least 2 notes for merge', async () => {
            const note1 = path.join(tempDir, 'note1.txt');
            await fs.writeFile(note1, 'content 1');

            bulkService.enterSelectMode();
            bulkService.select(note1);

            const showWarningStub = sandbox.stub().resolves();

            const mockWindow = {
                showWarningMessage: showWarningStub,
                showInformationMessage: sandbox.stub().resolves(),
                showErrorMessage: sandbox.stub().resolves()
            };

            Object.assign(vscode.window, mockWindow);

            // Execute bulk merge with only 1 note
            await handleBulkMerge(bulkService);

            // Verify warning was shown
            expect(showWarningStub.calledOnce).to.be.true;
            expect(showWarningStub.firstCall.args[0]).to.include('at least 2 notes');
        });
    });
});
