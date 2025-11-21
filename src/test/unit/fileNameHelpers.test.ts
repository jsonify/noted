import { expect } from 'chai';
import { extractFileExtension, sanitizeFileName } from '../../utils/fileNameHelpers';

describe('fileNameHelpers', () => {
    describe('extractFileExtension', () => {
        it('should extract common code file extensions', () => {
            expect(extractFileExtension('example.sh')).to.deep.equal({
                baseName: 'example',
                extension: 'sh'
            });

            expect(extractFileExtension('script.py')).to.deep.equal({
                baseName: 'script',
                extension: 'py'
            });

            expect(extractFileExtension('app.js')).to.deep.equal({
                baseName: 'app',
                extension: 'js'
            });
        });

        it('should extract documentation file extensions', () => {
            expect(extractFileExtension('readme.md')).to.deep.equal({
                baseName: 'readme',
                extension: 'md'
            });

            expect(extractFileExtension('notes.txt')).to.deep.equal({
                baseName: 'notes',
                extension: 'txt'
            });
        });

        it('should extract config file extensions', () => {
            expect(extractFileExtension('config.json')).to.deep.equal({
                baseName: 'config',
                extension: 'json'
            });

            expect(extractFileExtension('settings.yaml')).to.deep.equal({
                baseName: 'settings',
                extension: 'yaml'
            });
        });

        it('should return null extension for files without extensions', () => {
            expect(extractFileExtension('README')).to.deep.equal({
                baseName: 'README',
                extension: null
            });

            expect(extractFileExtension('my-note')).to.deep.equal({
                baseName: 'my-note',
                extension: null
            });
        });

        it('should handle hidden files (starting with dot)', () => {
            expect(extractFileExtension('.gitignore')).to.deep.equal({
                baseName: '.gitignore',
                extension: null
            });
        });

        it('should return null for unrecognized extensions', () => {
            expect(extractFileExtension('file.xyz')).to.deep.equal({
                baseName: 'file.xyz',
                extension: null
            });

            expect(extractFileExtension('test.unknown')).to.deep.equal({
                baseName: 'test.unknown',
                extension: null
            });
        });

        it('should handle files ending with dot', () => {
            expect(extractFileExtension('file.')).to.deep.equal({
                baseName: 'file.',
                extension: null
            });
        });

        it('should handle multiple dots in filename', () => {
            expect(extractFileExtension('my.backup.config.json')).to.deep.equal({
                baseName: 'my.backup.config',
                extension: 'json'
            });
        });

        it('should handle uppercase extensions', () => {
            expect(extractFileExtension('Script.SH')).to.deep.equal({
                baseName: 'Script',
                extension: 'sh'
            });

            expect(extractFileExtension('README.MD')).to.deep.equal({
                baseName: 'README',
                extension: 'md'
            });
        });
    });

    describe('sanitizeFileName', () => {
        it('should preserve user-provided recognized extensions', () => {
            const result = sanitizeFileName('example.sh', 'md');
            expect(result.sanitizedName).to.equal('example');
            expect(result.extension).to.equal('sh');
        });

        it('should use default extension when none provided', () => {
            const result = sanitizeFileName('my note', 'md');
            expect(result.sanitizedName).to.equal('my-note');
            expect(result.extension).to.equal('md');
        });

        it('should replace spaces with dashes', () => {
            const result = sanitizeFileName('my awesome note', 'md');
            expect(result.sanitizedName).to.equal('my-awesome-note');
            expect(result.extension).to.equal('md');
        });

        it('should convert to lowercase', () => {
            const result = sanitizeFileName('MyNote.SH', 'md');
            expect(result.sanitizedName).to.equal('mynote');
            expect(result.extension).to.equal('sh');
        });

        it('should remove special characters except dashes and underscores', () => {
            const result = sanitizeFileName('my@note#with$special%chars', 'md');
            expect(result.sanitizedName).to.equal('mynotewithspecialchars');
            expect(result.extension).to.equal('md');
        });

        it('should preserve underscores', () => {
            const result = sanitizeFileName('my_note_name', 'md');
            expect(result.sanitizedName).to.equal('my_note_name');
            expect(result.extension).to.equal('md');
        });

        it('should preserve dashes', () => {
            const result = sanitizeFileName('my-note-name', 'md');
            expect(result.sanitizedName).to.equal('my-note-name');
            expect(result.extension).to.equal('md');
        });

        it('should handle multiple spaces', () => {
            const result = sanitizeFileName('my    note   with    spaces', 'md');
            expect(result.sanitizedName).to.equal('my-note-with-spaces');
            expect(result.extension).to.equal('md');
        });

        it('should handle complex filename with extension', () => {
            const result = sanitizeFileName('My Complex Note Name!.py', 'md');
            expect(result.sanitizedName).to.equal('my-complex-note-name');
            expect(result.extension).to.equal('py');
        });

        it('should use default extension for unrecognized extensions', () => {
            const result = sanitizeFileName('test.xyz', 'md');
            expect(result.sanitizedName).to.equal('testxyz');
            expect(result.extension).to.equal('md');
        });

        it('should handle filenames with dots but no recognized extension', () => {
            const result = sanitizeFileName('1.2.3 version', 'md');
            expect(result.sanitizedName).to.equal('123-version');
            expect(result.extension).to.equal('md');
        });
    });
});
