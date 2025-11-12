/**
 * Unit tests for command handlers
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { handleDeleteNote, handleDeleteFolder, setRefreshCallback } from '../../commands/commands';
import { NoteItem } from '../../providers/treeItems';
import { cleanupMocks } from '../setup';

describe('commands', () => {
    let sandbox: sinon.SinonSandbox;
    let tempDir: string;

    beforeEach(async () => {
        sandbox = sinon.createSandbox();
        cleanupMocks();

        // Create temporary directory for test files
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'noted-cmd-test-'));

        // Set up a mock refresh callback
        setRefreshCallback(() => {});
    });

    afterEach(async () => {
        sandbox.restore();
        cleanupMocks(); // Reset mock objects after restoring stubs
        // Clean up temporary directory
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    describe('handleDeleteNote', () => {
        it('should show modal dialog with proper button objects', async () => {
            // Create a test file
            const testFile = path.join(tempDir, 'test-note.txt');
            await fs.writeFile(testFile, 'test content');

            const noteItem = new NoteItem('test-note.txt', testFile, vscode.TreeItemCollapsibleState.None, 'note');

            // Mock VS Code window API
            const showWarningStub = sandbox.stub().resolves({ title: 'Cancel', isCloseAffordance: true });

            const mockWindow = {
                showWarningMessage: showWarningStub,
                showInformationMessage: sandbox.stub().resolves(),
                showErrorMessage: sandbox.stub().resolves()
            };

            Object.assign(vscode.window, mockWindow);

            // Execute delete
            await handleDeleteNote(noteItem);

            // Verify showWarningMessage was called with correct format
            expect(showWarningStub.calledOnce).to.be.true;

            const args = showWarningStub.firstCall.args;
            expect(args[0]).to.equal('Delete test-note.txt?');

            // Verify options object with modal: true and detail
            expect(args[1]).to.be.an('object');
            expect(args[1].modal).to.be.true;
            expect(args[1].detail).to.be.a('string');

            // Verify button objects (not strings)
            expect(args[2]).to.be.an('object');
            expect(args[2].title).to.equal('Delete');
            expect(args[2].isCloseAffordance).to.be.false;

            expect(args[3]).to.be.an('object');
            expect(args[3].title).to.equal('Cancel');
            expect(args[3].isCloseAffordance).to.be.true;
        });

        it('should delete file when Delete button is clicked', async () => {
            const testFile = path.join(tempDir, 'test-note.txt');
            await fs.writeFile(testFile, 'test content');

            const noteItem = new NoteItem('test-note.txt', testFile, vscode.TreeItemCollapsibleState.None, 'note');

            // Mock VS Code window API - user clicks Delete
            const showWarningStub = sandbox.stub().resolves({ title: 'Delete', isCloseAffordance: false });

            const mockWindow = {
                showWarningMessage: showWarningStub,
                showInformationMessage: sandbox.stub().resolves(),
                showErrorMessage: sandbox.stub().resolves()
            };

            Object.assign(vscode.window, mockWindow);

            // Execute delete
            await handleDeleteNote(noteItem);

            // Verify file was deleted
            const fileExists = await fs.access(testFile).then(() => true).catch(() => false);
            expect(fileExists).to.be.false;
        });

        it('should not delete file when Cancel button is clicked', async () => {
            const testFile = path.join(tempDir, 'test-note.txt');
            await fs.writeFile(testFile, 'test content');

            const noteItem = new NoteItem('test-note.txt', testFile, vscode.TreeItemCollapsibleState.None, 'note');

            // Mock VS Code window API - user clicks Cancel
            const showWarningStub = sandbox.stub().resolves({ title: 'Cancel', isCloseAffordance: true });

            const mockWindow = {
                showWarningMessage: showWarningStub,
                showInformationMessage: sandbox.stub().resolves(),
                showErrorMessage: sandbox.stub().resolves()
            };

            Object.assign(vscode.window, mockWindow);

            // Execute delete
            await handleDeleteNote(noteItem);

            // Verify file was NOT deleted
            const fileExists = await fs.access(testFile).then(() => true).catch(() => false);
            expect(fileExists).to.be.true;
        });

        it('should not delete file when dialog is dismissed (undefined response)', async () => {
            const testFile = path.join(tempDir, 'test-note.txt');
            await fs.writeFile(testFile, 'test content');

            const noteItem = new NoteItem('test-note.txt', testFile, vscode.TreeItemCollapsibleState.None, 'note');

            // Mock VS Code window API - user dismisses dialog
            const showWarningStub = sandbox.stub().resolves(undefined);

            const mockWindow = {
                showWarningMessage: showWarningStub,
                showInformationMessage: sandbox.stub().resolves(),
                showErrorMessage: sandbox.stub().resolves()
            };

            Object.assign(vscode.window, mockWindow);

            // Execute delete
            await handleDeleteNote(noteItem);

            // Verify file was NOT deleted
            const fileExists = await fs.access(testFile).then(() => true).catch(() => false);
            expect(fileExists).to.be.true;
        });

        it('should show error message if delete fails', async () => {
            const noteItem = new NoteItem('nonexistent.txt', '/nonexistent/path/note.txt', vscode.TreeItemCollapsibleState.None, 'note');

            const showWarningStub = sandbox.stub().resolves({ title: 'Delete', isCloseAffordance: false });
            const showErrorStub = sandbox.stub().resolves();

            const mockWindow = {
                showWarningMessage: showWarningStub,
                showInformationMessage: sandbox.stub().resolves(),
                showErrorMessage: showErrorStub
            };

            Object.assign(vscode.window, mockWindow);

            // Execute delete
            await handleDeleteNote(noteItem);

            // Verify error message was shown
            expect(showErrorStub.calledOnce).to.be.true;
            expect(showErrorStub.firstCall.args[0]).to.include('Failed to delete note');
        });
    });

    describe('handleDeleteFolder', () => {
        it('should show modal dialog with proper button objects', async () => {
            // Create a test folder
            const testFolder = path.join(tempDir, 'test-folder');
            await fs.mkdir(testFolder);

            const folderItem = new NoteItem('test-folder', testFolder, vscode.TreeItemCollapsibleState.Collapsed, 'custom-folder');

            // Mock VS Code window API
            const showWarningStub = sandbox.stub().resolves({ title: 'Cancel', isCloseAffordance: true });

            const mockWindow = {
                showWarningMessage: showWarningStub,
                showInformationMessage: sandbox.stub().resolves(),
                showErrorMessage: sandbox.stub().resolves()
            };

            Object.assign(vscode.window, mockWindow);

            // Execute delete
            await handleDeleteFolder(folderItem);

            // Verify showWarningMessage was called with correct format
            expect(showWarningStub.calledOnce).to.be.true;

            const args = showWarningStub.firstCall.args;
            expect(args[0]).to.include('Delete folder');

            // Verify options object with modal: true and detail
            expect(args[1]).to.be.an('object');
            expect(args[1].modal).to.be.true;
            expect(args[1].detail).to.be.a('string');
            expect(args[1].detail).to.include('cannot be undone');

            // Verify button objects
            expect(args[2]).to.be.an('object');
            expect(args[2].title).to.equal('Delete');
            expect(args[2].isCloseAffordance).to.be.false;

            expect(args[3]).to.be.an('object');
            expect(args[3].title).to.equal('Cancel');
            expect(args[3].isCloseAffordance).to.be.true;
        });

        it('should only allow deletion of custom folders', async () => {
            const yearFolder = new NoteItem('2025', path.join(tempDir, '2025'), vscode.TreeItemCollapsibleState.Collapsed, 'year');

            const showWarningStub = sandbox.stub().resolves({ title: 'Delete', isCloseAffordance: false });
            const showErrorStub = sandbox.stub().resolves();

            const mockWindow = {
                showWarningMessage: showWarningStub,
                showInformationMessage: sandbox.stub().resolves(),
                showErrorMessage: showErrorStub
            };

            Object.assign(vscode.window, mockWindow);

            // Execute delete on year folder
            await handleDeleteFolder(yearFolder);

            // Verify error was shown and warning was NOT shown
            expect(showErrorStub.calledOnce).to.be.true;
            expect(showErrorStub.firstCall.args[0]).to.include('Only custom folders can be deleted');
            expect(showWarningStub.called).to.be.false;
        });
    });
});
