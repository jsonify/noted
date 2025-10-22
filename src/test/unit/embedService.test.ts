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

    describe('Image embedding support', () => {
        describe('isImageFile', () => {
            it('should identify PNG files as images', () => {
                expect(embedService.isImageFile('photo.png')).to.be.true;
                expect(embedService.isImageFile('photo.PNG')).to.be.true;
            });

            it('should identify JPG/JPEG files as images', () => {
                expect(embedService.isImageFile('photo.jpg')).to.be.true;
                expect(embedService.isImageFile('photo.jpeg')).to.be.true;
                expect(embedService.isImageFile('photo.JPG')).to.be.true;
            });

            it('should identify various image formats', () => {
                expect(embedService.isImageFile('icon.svg')).to.be.true;
                expect(embedService.isImageFile('animation.gif')).to.be.true;
                expect(embedService.isImageFile('image.webp')).to.be.true;
                expect(embedService.isImageFile('bitmap.bmp')).to.be.true;
            });

            it('should not identify non-image files as images', () => {
                expect(embedService.isImageFile('note.txt')).to.be.false;
                expect(embedService.isImageFile('note.md')).to.be.false;
                expect(embedService.isImageFile('document.pdf')).to.be.false;
            });
        });

        describe('extractEmbeds - image type detection', () => {
            it('should detect image embeds and set type to image', () => {
                const document = {
                    getText: () => 'This is ![[photo.png]] an image embed',
                    positionAt: (offset: number) => new vscode.Position(0, offset)
                } as any;

                const embeds = embedService.extractEmbeds(document);

                expect(embeds.length).to.equal(1);
                expect(embeds[0].noteName).to.equal('photo.png');
                expect(embeds[0].type).to.equal('image');
            });

            it('should detect note embeds and set type to note', () => {
                const document = {
                    getText: () => 'This is ![[my-note]] a note embed',
                    positionAt: (offset: number) => new vscode.Position(0, offset)
                } as any;

                const embeds = embedService.extractEmbeds(document);

                expect(embeds.length).to.equal(1);
                expect(embeds[0].noteName).to.equal('my-note');
                expect(embeds[0].type).to.equal('note');
            });

            it('should handle mixed image and note embeds', () => {
                const document = {
                    getText: () => 'Here is ![[photo.jpg]] and ![[my-note]] mixed',
                    positionAt: (offset: number) => new vscode.Position(0, offset)
                } as any;

                const embeds = embedService.extractEmbeds(document);

                expect(embeds.length).to.equal(2);
                expect(embeds[0].noteName).to.equal('photo.jpg');
                expect(embeds[0].type).to.equal('image');
                expect(embeds[1].noteName).to.equal('my-note');
                expect(embeds[1].type).to.equal('note');
            });

            it('should detect image embeds with display text', () => {
                const document = {
                    getText: () => '![[image.png|My Photo]]',
                    positionAt: (offset: number) => new vscode.Position(0, offset)
                } as any;

                const embeds = embedService.extractEmbeds(document);

                expect(embeds.length).to.equal(1);
                expect(embeds[0].noteName).to.equal('image.png');
                expect(embeds[0].displayText).to.equal('My Photo');
                expect(embeds[0].type).to.equal('image');
            });

            it('should detect image embeds with paths', () => {
                const document = {
                    getText: () => '![[./images/photo.png]]',
                    positionAt: (offset: number) => new vscode.Position(0, offset)
                } as any;

                const embeds = embedService.extractEmbeds(document);

                expect(embeds.length).to.equal(1);
                expect(embeds[0].noteName).to.equal('./images/photo.png');
                expect(embeds[0].type).to.equal('image');
            });
        });

        describe('resolveImagePath', () => {
            it('should resolve absolute image paths', async () => {
                const imagePath = path.join(tempDir, 'image.png');
                await fs.writeFile(imagePath, 'fake image data');

                const resolved = await embedService.resolveImagePath(imagePath);

                expect(resolved).to.equal(imagePath);
            });

            it('should resolve relative image paths from document', async () => {
                const imagesDir = path.join(tempDir, 'images');
                await fs.mkdir(imagesDir);
                const imagePath = path.join(imagesDir, 'photo.png');
                await fs.writeFile(imagePath, 'fake image data');

                const documentPath = path.join(tempDir, 'note.md');
                const resolved = await embedService.resolveImagePath('images/photo.png', documentPath);

                expect(resolved).to.equal(imagePath);
            });

            it('should resolve dot-slash relative paths', async () => {
                const imagesDir = path.join(tempDir, 'images');
                await fs.mkdir(imagesDir);
                const imagePath = path.join(imagesDir, 'photo.png');
                await fs.writeFile(imagePath, 'fake image data');

                const documentPath = path.join(tempDir, 'note.md');
                const resolved = await embedService.resolveImagePath('./images/photo.png', documentPath);

                expect(resolved).to.equal(imagePath);
            });

            it('should return undefined for non-existent images', async () => {
                const resolved = await embedService.resolveImagePath('non-existent.png');

                expect(resolved).to.be.undefined;
            });
        });

        describe('getImageMetadata', () => {
            it('should return file size for existing images', async () => {
                const imagePath = path.join(tempDir, 'test.png');
                const fakeImageData = 'fake image data content';
                await fs.writeFile(imagePath, fakeImageData);

                const metadata = await embedService.getImageMetadata(imagePath);

                expect(metadata).to.not.be.undefined;
                expect(metadata!.size).to.be.greaterThan(0);
                expect(metadata!.size).to.equal(fakeImageData.length);
            });

            it('should return undefined for non-existent images', async () => {
                const metadata = await embedService.getImageMetadata('/non/existent/image.png');

                expect(metadata).to.be.undefined;
            });
        });

        describe('getEmbedAtPosition - image detection', () => {
            it('should detect image embed at cursor position', () => {
                const line = {
                    text: 'This is ![[photo.png]] an embed'
                };
                const document = {
                    lineAt: () => line
                } as any;
                const position = new vscode.Position(0, 10);

                const embed = embedService.getEmbedAtPosition(document, position);

                expect(embed).to.not.be.undefined;
                expect(embed!.noteName).to.equal('photo.png');
                expect(embed!.type).to.equal('image');
            });

            it('should detect note embed at cursor position', () => {
                const line = {
                    text: 'This is ![[my-note]] an embed'
                };
                const document = {
                    lineAt: () => line
                } as any;
                const position = new vscode.Position(0, 10);

                const embed = embedService.getEmbedAtPosition(document, position);

                expect(embed).to.not.be.undefined;
                expect(embed!.noteName).to.equal('my-note');
                expect(embed!.type).to.equal('note');
            });
        });

        describe('Transclusion Support', () => {
            it('should track embedded sources for a document', async () => {
                // Create test notes
                const sourceNote1 = path.join(tempDir, 'source1.txt');
                const sourceNote2 = path.join(tempDir, 'source2.txt');
                await fs.writeFile(sourceNote1, 'Source 1 content');
                await fs.writeFile(sourceNote2, 'Source 2 content');

                // Create document with embeds
                const documentUri = 'file:///test/document.txt';
                const embeds = [
                    {
                        noteName: 'source1',
                        range: new vscode.Range(0, 0, 0, 15),
                        type: 'note' as const
                    },
                    {
                        noteName: 'source2',
                        range: new vscode.Range(1, 0, 1, 15),
                        type: 'note' as const
                    }
                ];

                await embedService.updateEmbedSourcesCache(documentUri, embeds);

                const sources = embedService.getEmbeddedSources(documentUri);
                expect(sources).to.have.lengthOf(2);
                expect(sources).to.include(sourceNote1);
                expect(sources).to.include(sourceNote2);
            });

            it('should get documents that embed a specific source', async () => {
                // Create test notes
                const sourceNote = path.join(tempDir, 'source.txt');
                await fs.writeFile(sourceNote, 'Source content');

                // Create two documents that embed the same source
                const documentUri1 = 'file:///test/doc1.txt';
                const documentUri2 = 'file:///test/doc2.txt';
                const embeds = [
                    {
                        noteName: 'source',
                        range: new vscode.Range(0, 0, 0, 15),
                        type: 'note' as const
                    }
                ];

                await embedService.updateEmbedSourcesCache(documentUri1, embeds);
                await embedService.updateEmbedSourcesCache(documentUri2, embeds);

                const documents = embedService.getDocumentsEmbeddingSource(sourceNote);
                expect(documents).to.have.lengthOf(2);
                expect(documents).to.include(documentUri1);
                expect(documents).to.include(documentUri2);
            });

            it('should return empty array for documents with no embeds', () => {
                const documentUri = 'file:///test/document.txt';
                const sources = embedService.getEmbeddedSources(documentUri);
                expect(sources).to.have.lengthOf(0);
            });

            it('should return empty array for source not embedded anywhere', () => {
                const sourcePath = path.join(tempDir, 'unused.txt');
                const documents = embedService.getDocumentsEmbeddingSource(sourcePath);
                expect(documents).to.have.lengthOf(0);
            });

            it('should clear embed sources cache for specific document', async () => {
                // Create test notes
                const sourceNote = path.join(tempDir, 'source.txt');
                await fs.writeFile(sourceNote, 'Source content');

                const documentUri = 'file:///test/document.txt';
                const embeds = [
                    {
                        noteName: 'source',
                        range: new vscode.Range(0, 0, 0, 15),
                        type: 'note' as const
                    }
                ];

                await embedService.updateEmbedSourcesCache(documentUri, embeds);
                expect(embedService.getEmbeddedSources(documentUri)).to.have.lengthOf(1);

                embedService.clearEmbedSourcesCache(documentUri);
                expect(embedService.getEmbeddedSources(documentUri)).to.have.lengthOf(0);
            });

            it('should clear all embed sources cache', async () => {
                // Create test notes
                const sourceNote1 = path.join(tempDir, 'source1.txt');
                const sourceNote2 = path.join(tempDir, 'source2.txt');
                await fs.writeFile(sourceNote1, 'Source 1 content');
                await fs.writeFile(sourceNote2, 'Source 2 content');

                const documentUri1 = 'file:///test/doc1.txt';
                const documentUri2 = 'file:///test/doc2.txt';
                const embeds1 = [
                    {
                        noteName: 'source1',
                        range: new vscode.Range(0, 0, 0, 15),
                        type: 'note' as const
                    }
                ];
                const embeds2 = [
                    {
                        noteName: 'source2',
                        range: new vscode.Range(0, 0, 0, 15),
                        type: 'note' as const
                    }
                ];

                await embedService.updateEmbedSourcesCache(documentUri1, embeds1);
                await embedService.updateEmbedSourcesCache(documentUri2, embeds2);

                embedService.clearAllEmbedSourcesCache();

                expect(embedService.getEmbeddedSources(documentUri1)).to.have.lengthOf(0);
                expect(embedService.getEmbeddedSources(documentUri2)).to.have.lengthOf(0);
            });

            it('should handle documents with unresolvable embeds', async () => {
                const documentUri = 'file:///test/document.txt';
                const embeds = [
                    {
                        noteName: 'nonexistent-note',
                        range: new vscode.Range(0, 0, 0, 25),
                        type: 'note' as const
                    }
                ];

                await embedService.updateEmbedSourcesCache(documentUri, embeds);

                const sources = embedService.getEmbeddedSources(documentUri);
                // Should not include unresolvable embeds
                expect(sources).to.have.lengthOf(0);
            });

            it('should update cache when document embeds change', async () => {
                // Create test notes
                const sourceNote1 = path.join(tempDir, 'source1.txt');
                const sourceNote2 = path.join(tempDir, 'source2.txt');
                await fs.writeFile(sourceNote1, 'Source 1 content');
                await fs.writeFile(sourceNote2, 'Source 2 content');

                const documentUri = 'file:///test/document.txt';

                // Initial embeds
                const embeds1 = [
                    {
                        noteName: 'source1',
                        range: new vscode.Range(0, 0, 0, 15),
                        type: 'note' as const
                    }
                ];
                await embedService.updateEmbedSourcesCache(documentUri, embeds1);
                expect(embedService.getEmbeddedSources(documentUri)).to.have.lengthOf(1);

                // Updated embeds - now embedding both sources
                const embeds2 = [
                    {
                        noteName: 'source1',
                        range: new vscode.Range(0, 0, 0, 15),
                        type: 'note' as const
                    },
                    {
                        noteName: 'source2',
                        range: new vscode.Range(1, 0, 1, 15),
                        type: 'note' as const
                    }
                ];
                await embedService.updateEmbedSourcesCache(documentUri, embeds2);
                expect(embedService.getEmbeddedSources(documentUri)).to.have.lengthOf(2);
            });
        });
    });
});
