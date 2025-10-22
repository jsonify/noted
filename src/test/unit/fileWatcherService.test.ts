import { expect } from 'chai';
import { FileWatcherService } from '../../services/fileWatcherService';

describe('FileWatcherService', () => {
    let fileWatcherService: FileWatcherService;

    beforeEach(() => {
        fileWatcherService = new FileWatcherService();
    });

    afterEach(() => {
        fileWatcherService.dispose();
    });

    it('should start with no watched files', () => {
        const watchedFiles = fileWatcherService.getWatchedFiles();
        expect(watchedFiles).to.have.lengthOf(0);
    });

    it('should track watched files', () => {
        const testPath = '/test/file.txt';
        fileWatcherService.watchFile(testPath);

        const watchedFiles = fileWatcherService.getWatchedFiles();
        expect(watchedFiles).to.have.lengthOf(1);
        expect(watchedFiles[0]).to.equal(testPath);
    });

    it('should check if file is being watched', () => {
        const testPath = '/test/file.txt';
        expect(fileWatcherService.isWatching(testPath)).to.be.false;

        fileWatcherService.watchFile(testPath);
        expect(fileWatcherService.isWatching(testPath)).to.be.true;
    });

    it('should not duplicate watchers for same file', () => {
        const testPath = '/test/file.txt';
        fileWatcherService.watchFile(testPath);
        fileWatcherService.watchFile(testPath); // Watch again

        const watchedFiles = fileWatcherService.getWatchedFiles();
        expect(watchedFiles).to.have.lengthOf(1);
    });

    it('should unwatch specific file', () => {
        const testPath1 = '/test/file1.txt';
        const testPath2 = '/test/file2.txt';

        fileWatcherService.watchFile(testPath1);
        fileWatcherService.watchFile(testPath2);
        expect(fileWatcherService.getWatchedFiles()).to.have.lengthOf(2);

        fileWatcherService.unwatchFile(testPath1);
        const watchedFiles = fileWatcherService.getWatchedFiles();
        expect(watchedFiles).to.have.lengthOf(1);
        expect(watchedFiles[0]).to.equal(testPath2);
    });

    it('should watch multiple files', () => {
        const testPaths = ['/test/file1.txt', '/test/file2.txt', '/test/file3.txt'];
        fileWatcherService.watchFiles(testPaths);

        const watchedFiles = fileWatcherService.getWatchedFiles();
        expect(watchedFiles).to.have.lengthOf(3);
        for (const path of testPaths) {
            expect(fileWatcherService.isWatching(path)).to.be.true;
        }
    });

    it('should unwatch multiple files', () => {
        const testPaths = ['/test/file1.txt', '/test/file2.txt', '/test/file3.txt'];
        fileWatcherService.watchFiles(testPaths);
        expect(fileWatcherService.getWatchedFiles()).to.have.lengthOf(3);

        fileWatcherService.unwatchFiles([testPaths[0], testPaths[1]]);
        const watchedFiles = fileWatcherService.getWatchedFiles();
        expect(watchedFiles).to.have.lengthOf(1);
        expect(watchedFiles[0]).to.equal(testPaths[2]);
    });

    it('should unwatch all files', () => {
        const testPaths = ['/test/file1.txt', '/test/file2.txt', '/test/file3.txt'];
        fileWatcherService.watchFiles(testPaths);
        expect(fileWatcherService.getWatchedFiles()).to.have.lengthOf(3);

        fileWatcherService.unwatchAll();
        expect(fileWatcherService.getWatchedFiles()).to.have.lengthOf(0);
    });

    it('should handle unwatching non-existent file gracefully', () => {
        fileWatcherService.unwatchFile('/nonexistent/file.txt');
        // Should not throw
        expect(fileWatcherService.getWatchedFiles()).to.have.lengthOf(0);
    });

    it('should properly dispose and clean up', () => {
        const testPaths = ['/test/file1.txt', '/test/file2.txt'];
        fileWatcherService.watchFiles(testPaths);
        expect(fileWatcherService.getWatchedFiles()).to.have.lengthOf(2);

        fileWatcherService.dispose();
        expect(fileWatcherService.getWatchedFiles()).to.have.lengthOf(0);
    });
});
