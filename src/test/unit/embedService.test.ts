import { expect } from 'chai';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { EmbedService, EMBED_PATTERN } from '../../services/embedService';
import { LinkService } from '../../services/linkService';

describe('EmbedService', () => {
    let tempDir: string;
    let embedService: EmbedService;
    let linkService: LinkService;

    beforeEach(async () => {
        // Create a temporary directory for test notes
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'noted-embed-test-'));
        linkService = new LinkService(tempDir);
        embedService = new EmbedService(linkService);
    });

    afterEach(async () => {
        // Clean up temporary directory
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    describe('EMBED_PATTERN', () => {
        it('should match simple embed syntax', () => {
            const text = 'This is ![[note-name]] an embed';
            EMBED_PATTERN.lastIndex = 0;
            const match = EMBED_PATTERN.exec(text);

            expect(match).to.not.be.null;
            expect(match![1]).to.equal('note-name');
            expect(match![2]).to.be.undefined;
            expect(match![3]).to.be.undefined;
        });

        it('should match embed with section', () => {
            const text = 'This is ![[note-name#Section Title]] an embed';
            EMBED_PATTERN.lastIndex = 0;
            const match = EMBED_PATTERN.exec(text);

            expect(match).to.not.be.null;
            expect(match![1]).to.equal('note-name');
            expect(match![2]).to.equal('Section Title');
            expect(match![3]).to.be.undefined;
        });

        it('should match embed with display text', () => {
            const text = 'This is ![[note-name|Custom Text]] an embed';
            EMBED_PATTERN.lastIndex = 0;
            const match = EMBED_PATTERN.exec(text);

            expect(match).to.not.be.null;
            expect(match![1]).to.equal('note-name');
            expect(match![2]).to.be.undefined;
            expect(match![3]).to.equal('Custom Text');
        });

        it('should match embed with section and display text', () => {
            const text = 'This is ![[note-name#Section|Custom Text]] an embed';
            EMBED_PATTERN.lastIndex = 0;
            const match = EMBED_PATTERN.exec(text);

            expect(match).to.not.be.null;
            expect(match![1]).to.equal('note-name');
            expect(match![2]).to.equal('Section');
            expect(match![3]).to.equal('Custom Text');
        });

        it('should not match regular links', () => {
            const text = 'This is [[note-name]] a regular link';
            EMBED_PATTERN.lastIndex = 0;
            const match = EMBED_PATTERN.exec(text);

            expect(match).to.be.null;
        });

        it('should match multiple embeds in one line', () => {
            const text = 'First ![[note1]] and second ![[note2#section]]';
            const matches: RegExpExecArray[] = [];
            EMBED_PATTERN.lastIndex = 0;
            let match;

            while ((match = EMBED_PATTERN.exec(text)) !== null) {
                matches.push(match);
            }

            expect(matches.length).to.equal(2);
            expect(matches[0][1]).to.equal('note1');
            expect(matches[1][1]).to.equal('note2');
            expect(matches[1][2]).to.equal('section');
        });
    });

    describe('getEmbedContent - section extraction', () => {
        it('should extract markdown section by heading', async () => {
            const content = [
                '# Main Title',
                'Some intro text',
                '',
                '## Section One',
                'Content of section one',
                'More content',
                '',
                '## Section Two',
                'Content of section two'
            ].join('\n');

            const filePath = path.join(tempDir, 'test.md');
            await fs.writeFile(filePath, content);

            const result = await embedService.getEmbedContent(filePath, 'Section One');

            expect(result).to.not.be.undefined;
            expect(result!).to.include('## Section One');
            expect(result!).to.include('Content of section one');
            expect(result!).to.include('More content');
            expect(result!).to.not.include('Section Two');
        });

        it('should extract nested markdown sections', async () => {
            const content = [
                '# Main Title',
                '',
                '## Section One',
                'Content of section one',
                '',
                '### Subsection',
                'Subsection content',
                '',
                '## Section Two',
                'Content of section two'
            ].join('\n');

            const filePath = path.join(tempDir, 'test.md');
            await fs.writeFile(filePath, content);

            const result = await embedService.getEmbedContent(filePath, 'Section One');

            expect(result).to.not.be.undefined;
            expect(result!).to.include('## Section One');
            expect(result!).to.include('### Subsection');
            expect(result!).to.include('Subsection content');
            expect(result!).to.not.include('Section Two');
        });

        it('should return undefined for non-existent section', async () => {
            const content = [
                '# Main Title',
                '',
                '## Section One',
                'Content'
            ].join('\n');

            const filePath = path.join(tempDir, 'test.md');
            await fs.writeFile(filePath, content);

            const result = await embedService.getEmbedContent(filePath, 'Non Existent');

            expect(result).to.be.undefined;
        });
    });

    describe('getSectionsFromNote', () => {
        it('should extract all markdown headings', async () => {
            const content = [
                '# Main Title',
                'Content',
                '## Section One',
                'Content',
                '### Subsection',
                'Content',
                '## Section Two',
                'Content'
            ].join('\n');

            const filePath = path.join(tempDir, 'test.md');
            await fs.writeFile(filePath, content);

            const sections = await embedService.getSectionsFromNote(filePath);

            expect(sections.length).to.equal(4);
            expect(sections).to.include('Main Title');
            expect(sections).to.include('Section One');
            expect(sections).to.include('Subsection');
            expect(sections).to.include('Section Two');
        });

        it('should return empty array for note without sections', async () => {
            const content = 'Just some plain text without any headings';
            const filePath = path.join(tempDir, 'test.txt');
            await fs.writeFile(filePath, content);

            const sections = await embedService.getSectionsFromNote(filePath);

            expect(sections.length).to.equal(0);
        });
    });

    describe('getEmbedContent', () => {
        it('should return entire note when no section specified', async () => {
            const content = [
                '# Title',
                'Some content',
                '## Section',
                'More content'
            ].join('\n');

            const filePath = path.join(tempDir, 'test.md');
            await fs.writeFile(filePath, content);

            const result = await embedService.getEmbedContent(filePath);

            expect(result).to.equal(content);
        });

        it('should return undefined for non-existent file', async () => {
            const result = await embedService.getEmbedContent('/non/existent/path.md');

            expect(result).to.be.undefined;
        });
    });
});
