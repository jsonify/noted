import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as vscode from 'vscode';
import { NotePreviewHoverProvider } from '../../providers/notePreviewHoverProvider';
import { LinkService } from '../../services/linkService';
import { cleanupMocks } from '../setup';

describe('NotePreviewHoverProvider', () => {
    let tempDir: string;
    let linkService: LinkService;
    let hoverProvider: NotePreviewHoverProvider;

    beforeEach(async () => {
        // Create temporary directory for test notes
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'noted-hover-test-'));

        // Create test notes
        await fs.mkdir(path.join(tempDir, '2025', '10-October'), { recursive: true });

        // Create a target note with some content
        await fs.writeFile(
            path.join(tempDir, '2025', '10-October', 'target-note.txt'),
            'This is the first line of the target note.\nSecond line with more content.\nThird line.'
        );

        // Create another note with empty content
        await fs.writeFile(
            path.join(tempDir, '2025', '10-October', 'empty-note.txt'),
            ''
        );

        // Create a note with very long lines
        const longLine = 'A'.repeat(150);
        await fs.writeFile(
            path.join(tempDir, '2025', '10-October', 'long-note.txt'),
            `${longLine}\nSecond line`
        );

        // Initialize services
        linkService = new LinkService(tempDir);
        await linkService.buildBacklinksIndex();
        hoverProvider = new NotePreviewHoverProvider(linkService);
    });

    afterEach(async () => {
        // Clean up temporary directory
        await fs.rm(tempDir, { recursive: true, force: true });
        cleanupMocks();
    });

    describe('provideHover', () => {
        it('should return hover for valid wiki link', async () => {
            // Create a document with a wiki link
            const content = 'Some text [[target-note]] more text';
            const document = {
                uri: vscode.Uri.file(path.join(tempDir, 'test.txt')),
                getText: () => content,
                lineAt: (line: number) => ({
                    text: content,
                    lineNumber: line
                }),
                positionAt: (offset: number) => new vscode.Position(0, offset),
                lineCount: 1
            } as any;

            // Position cursor inside the link
            const position = new vscode.Position(0, 12); // Inside [[target-note]]

            const hover = await hoverProvider.provideHover(document, position, {} as any);

            expect(hover).to.not.be.undefined;
            expect(hover!.contents).to.have.lengthOf(1);
            const markdown = hover!.contents[0] as vscode.MarkdownString;
            expect(markdown.value).to.include('target-note');
            expect(markdown.value).to.include('This is the first line');
        });

        it('should return undefined when not hovering over a link', async () => {
            const content = 'Some text [[target-note]] more text';
            const document = {
                uri: vscode.Uri.file(path.join(tempDir, 'test.txt')),
                getText: () => content,
                lineAt: (line: number) => ({
                    text: content,
                    lineNumber: line
                }),
                positionAt: (offset: number) => new vscode.Position(0, offset),
                lineCount: 1
            } as any;

            // Position cursor outside the link
            const position = new vscode.Position(0, 0);

            const hover = await hoverProvider.provideHover(document, position, {} as any);

            expect(hover).to.be.undefined;
        });

        it('should show "not found" message for broken links', async () => {
            const content = 'Link to [[non-existent-note]]';
            const document = {
                uri: vscode.Uri.file(path.join(tempDir, 'test.txt')),
                getText: () => content,
                lineAt: (line: number) => ({
                    text: content,
                    lineNumber: line
                }),
                positionAt: (offset: number) => new vscode.Position(0, offset),
                lineCount: 1
            } as any;

            const position = new vscode.Position(0, 12);

            const hover = await hoverProvider.provideHover(document, position, {} as any);

            expect(hover).to.not.be.undefined;
            expect(hover!.contents).to.have.lengthOf(1);
            const markdown = hover!.contents[0] as vscode.MarkdownString;
            expect(markdown.value).to.include('Note not found');
            expect(markdown.value).to.include('non-existent-note');
        });

        it('should handle links with display text', async () => {
            const content = 'Link with display [[target-note|Custom Display]]';
            const document = {
                uri: vscode.Uri.file(path.join(tempDir, 'test.txt')),
                getText: () => content,
                lineAt: (line: number) => ({
                    text: content,
                    lineNumber: line
                }),
                positionAt: (offset: number) => new vscode.Position(0, offset),
                lineCount: 1
            } as any;

            const position = new vscode.Position(0, 25);

            const hover = await hoverProvider.provideHover(document, position, {} as any);

            expect(hover).to.not.be.undefined;
            expect(hover!.contents).to.have.lengthOf(1);
            const markdown = hover!.contents[0] as vscode.MarkdownString;
            expect(markdown.value).to.include('target-note');
            expect(markdown.value).to.include('This is the first line');
        });

        it('should show empty note message for notes with no content', async () => {
            const content = 'Link to [[empty-note]]';
            const document = {
                uri: vscode.Uri.file(path.join(tempDir, 'test.txt')),
                getText: () => content,
                lineAt: (line: number) => ({
                    text: content,
                    lineNumber: line
                }),
                positionAt: (offset: number) => new vscode.Position(0, offset),
                lineCount: 1
            } as any;

            const position = new vscode.Position(0, 12);

            const hover = await hoverProvider.provideHover(document, position, {} as any);

            expect(hover).to.not.be.undefined;
            expect(hover!.contents).to.have.lengthOf(1);
            const markdown = hover!.contents[0] as vscode.MarkdownString;
            expect(markdown.value).to.include('Empty note');
        });

        it('should truncate very long lines in preview', async () => {
            const content = 'Link to [[long-note]]';
            const document = {
                uri: vscode.Uri.file(path.join(tempDir, 'test.txt')),
                getText: () => content,
                lineAt: (line: number) => ({
                    text: content,
                    lineNumber: line
                }),
                positionAt: (offset: number) => new vscode.Position(0, offset),
                lineCount: 1
            } as any;

            const position = new vscode.Position(0, 12);

            const hover = await hoverProvider.provideHover(document, position, {} as any);

            expect(hover).to.not.be.undefined;
            expect(hover!.contents).to.have.lengthOf(1);
            const markdown = hover!.contents[0] as vscode.MarkdownString;
            // Should be truncated with ellipsis
            expect(markdown.value).to.include('…');
            // Should not contain the full 150 'A's
            expect(markdown.value).to.not.include('A'.repeat(150));
        });
    });

    describe('hover includes command links', () => {
        it('should include "Open note" command for valid links', async () => {
            const content = 'Link [[target-note]]';
            const document = {
                uri: vscode.Uri.file(path.join(tempDir, 'test.txt')),
                getText: () => content,
                lineAt: (line: number) => ({
                    text: content,
                    lineNumber: line
                }),
                positionAt: (offset: number) => new vscode.Position(0, offset),
                lineCount: 1
            } as any;

            const position = new vscode.Position(0, 7);

            const hover = await hoverProvider.provideHover(document, position, {} as any);

            expect(hover).to.not.be.undefined;
            const markdown = hover!.contents[0] as vscode.MarkdownString;
            expect(markdown.value).to.include('Open note');
            expect(markdown.value).to.include('command:noted.openNote');
        });

        it('should include "Create note" command for broken links', async () => {
            const content = 'Link [[new-note]]';
            const document = {
                uri: vscode.Uri.file(path.join(tempDir, 'test.txt')),
                getText: () => content,
                lineAt: (line: number) => ({
                    text: content,
                    lineNumber: line
                }),
                positionAt: (offset: number) => new vscode.Position(0, offset),
                lineCount: 1
            } as any;

            const position = new vscode.Position(0, 7);

            const hover = await hoverProvider.provideHover(document, position, {} as any);

            expect(hover).to.not.be.undefined;
            const markdown = hover!.contents[0] as vscode.MarkdownString;
            expect(markdown.value).to.include('Create note');
            expect(markdown.value).to.include('command:noted.createNoteFromLink');
        });
    });
});
