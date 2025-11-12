/**
 * Unit tests for DiagramService modal dialogs
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { DiagramService } from '../../services/diagramService';
import { cleanupMocks } from '../setup';

describe('DiagramService', () => {
    let sandbox: sinon.SinonSandbox;
    let diagramService: DiagramService;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        cleanupMocks();

        // Create mock extension context
        const mockContext = {
            subscriptions: [],
            workspaceState: {
                get: sandbox.stub(),
                update: sandbox.stub()
            },
            globalState: {
                get: sandbox.stub(),
                update: sandbox.stub()
            },
            extensionPath: '/mock/extension/path',
            storagePath: '/mock/storage/path',
            globalStoragePath: '/mock/global/storage/path',
            logPath: '/mock/log/path'
        } as any;

        // Initialize diagram service with mock context
        diagramService = new DiagramService(mockContext);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('showExtensionWarning', () => {
        it('should show modal dialog with proper button objects for Draw.io', async () => {
            // Mock VS Code window and extensions API
            const showWarningStub = sandbox.stub(vscode.window, 'showWarningMessage').resolves({ title: 'Dismiss', isCloseAffordance: true } as any);
            const getExtensionStub = sandbox.stub(vscode.extensions, 'getExtension').returns(undefined);

            // Trigger warning for drawio
            const result = await (diagramService as any).showExtensionWarning('drawio');

            // Verify showWarningMessage was called with correct format
            expect(showWarningStub.calledOnce).to.be.true;

            const args = showWarningStub.firstCall.args;
            expect(args[0]).to.include('Draw.io Integration');
            expect(args[0]).to.include('extension is not available');

            // Verify options object with modal: true and detail
            expect(args[1]).to.be.an('object');
            expect(args[1].modal).to.be.true;
            expect(args[1].detail).to.be.a('string');
            expect(args[1].detail).to.include('extension is required');

            // Verify button objects (not strings)
            expect(args[2]).to.be.an('object');
            expect(args[2].title).to.equal('Install Extension');
            expect(args[2].isCloseAffordance).to.be.false;

            expect(args[3]).to.be.an('object');
            expect(args[3].title).to.equal('Create Anyway');
            expect(args[3].isCloseAffordance).to.be.false;

            expect(args[4]).to.be.an('object');
            expect(args[4].title).to.equal("Don't Ask Again");
            expect(args[4].isCloseAffordance).to.be.false;

            expect(args[5]).to.be.an('object');
            expect(args[5].title).to.equal('Dismiss');
            expect(args[5].isCloseAffordance).to.be.true;

            // Verify result
            expect(result).to.equal('dismiss');
        });

        it('should show modal dialog with proper button objects for Excalidraw', async () => {
            // Mock VS Code window and extensions API
            const showWarningStub = sandbox.stub(vscode.window, 'showWarningMessage').resolves({ title: 'Dismiss', isCloseAffordance: true } as any);
            const getExtensionStub = sandbox.stub(vscode.extensions, 'getExtension').returns(undefined);

            // Trigger warning for excalidraw
            const result = await (diagramService as any).showExtensionWarning('excalidraw');

            // Verify showWarningMessage was called
            expect(showWarningStub.calledOnce).to.be.true;

            const args = showWarningStub.firstCall.args;
            expect(args[0]).to.include('Excalidraw');
            expect(args[0]).to.include('extension is not available');
        });

        it('should return "install" when Install Extension button is clicked', async () => {
            const showWarningStub = sandbox.stub(vscode.window, 'showWarningMessage').resolves({ title: 'Install Extension', isCloseAffordance: false } as any);
            const executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand').resolves();
            const getExtensionStub = sandbox.stub(vscode.extensions, 'getExtension').returns(undefined);

            // Trigger warning
            const result = await (diagramService as any).showExtensionWarning('drawio');

            // Verify result and that install command was executed
            expect(result).to.equal('install');
            expect(executeCommandStub.calledOnce).to.be.true;
            expect(executeCommandStub.firstCall.args[0]).to.equal('workbench.extensions.installExtension');
            expect(executeCommandStub.firstCall.args[1]).to.equal('hediet.vscode-drawio');
        });

        it('should return "proceed" when Create Anyway button is clicked', async () => {
            const showWarningStub = sandbox.stub(vscode.window, 'showWarningMessage').resolves({ title: 'Create Anyway', isCloseAffordance: false } as any);
            const getExtensionStub = sandbox.stub(vscode.extensions, 'getExtension').returns(undefined);

            // Trigger warning
            const result = await (diagramService as any).showExtensionWarning('drawio');

            // Verify result
            expect(result).to.equal('proceed');
        });

        it('should return "proceed" and suppress future warnings when "Don\'t Ask Again" is clicked', async () => {
            const showWarningStub = sandbox.stub(vscode.window, 'showWarningMessage').resolves({ title: "Don't Ask Again", isCloseAffordance: false } as any);
            const getExtensionStub = sandbox.stub(vscode.extensions, 'getExtension').returns(undefined);

            // Trigger warning
            const result = await (diagramService as any).showExtensionWarning('drawio');

            // Verify result
            expect(result).to.equal('proceed');

            // Verify subsequent calls are suppressed
            showWarningStub.resetHistory();
            const result2 = await (diagramService as any).showExtensionWarning('drawio');
            expect(result2).to.equal('proceed');
            expect(showWarningStub.called).to.be.false; // Warning should not be shown again
        });

        it('should return "dismiss" when dialog is dismissed with undefined', async () => {
            const showWarningStub = sandbox.stub(vscode.window, 'showWarningMessage').resolves(undefined);
            const getExtensionStub = sandbox.stub(vscode.extensions, 'getExtension').returns(undefined);

            // Trigger warning
            const result = await (diagramService as any).showExtensionWarning('drawio');

            // Verify result
            expect(result).to.equal('dismiss');
        });
    });
});
