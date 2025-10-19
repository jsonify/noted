import { expect } from 'chai';
import * as path from 'path';
import * as os from 'os';
import { promises as fsp } from 'fs';
import {
  pathExists,
  createDirectory,
  readFile,
  writeFile,
  deleteFile,
  renameFile,
  copyFile,
  deleteDirectory,
  readDirectory,
  readDirectoryWithTypes,
  getFileStats,
  copyDirectoryRecursive
} from '../../services/fileSystemService';

describe('File System Service', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `noted-fs-test-${Date.now()}`);
    await fsp.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fsp.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('pathExists', () => {
    it('should return true for existing path', async () => {
      const result = await pathExists(testDir);
      expect(result).to.be.true;
    });

    it('should return false for non-existing path', async () => {
      const nonExistentPath = path.join(testDir, 'does-not-exist');
      const result = await pathExists(nonExistentPath);
      expect(result).to.be.false;
    });
  });

  describe('createDirectory', () => {
    it('should create a directory', async () => {
      const newDir = path.join(testDir, 'new-folder');
      await createDirectory(newDir);

      const exists = await pathExists(newDir);
      expect(exists).to.be.true;
    });

    it('should create nested directories', async () => {
      const nestedDir = path.join(testDir, 'level1', 'level2', 'level3');
      await createDirectory(nestedDir);

      const exists = await pathExists(nestedDir);
      expect(exists).to.be.true;
    });
  });

  describe('readFile and writeFile', () => {
    it('should write and read file content', async () => {
      const filePath = path.join(testDir, 'test.txt');
      const content = 'Hello, World!';

      await writeFile(filePath, content);
      const readContent = await readFile(filePath);

      expect(readContent).to.equal(content);
    });

    it('should handle UTF-8 characters', async () => {
      const filePath = path.join(testDir, 'unicode.txt');
      const content = 'Hello 世界 🌍';

      await writeFile(filePath, content);
      const readContent = await readFile(filePath);

      expect(readContent).to.equal(content);
    });
  });

  describe('deleteFile', () => {
    it('should delete an existing file', async () => {
      const filePath = path.join(testDir, 'to-delete.txt');
      await writeFile(filePath, 'content');

      let exists = await pathExists(filePath);
      expect(exists).to.be.true;

      await deleteFile(filePath);

      exists = await pathExists(filePath);
      expect(exists).to.be.false;
    });
  });

  describe('renameFile', () => {
    it('should rename a file', async () => {
      const oldPath = path.join(testDir, 'old-name.txt');
      const newPath = path.join(testDir, 'new-name.txt');
      await writeFile(oldPath, 'content');

      await renameFile(oldPath, newPath);

      const oldExists = await pathExists(oldPath);
      const newExists = await pathExists(newPath);

      expect(oldExists).to.be.false;
      expect(newExists).to.be.true;
    });

    it('should move a file to different directory', async () => {
      const srcPath = path.join(testDir, 'file.txt');
      const destDir = path.join(testDir, 'subfolder');
      const destPath = path.join(destDir, 'file.txt');

      await writeFile(srcPath, 'content');
      await createDirectory(destDir);

      await renameFile(srcPath, destPath);

      const srcExists = await pathExists(srcPath);
      const destExists = await pathExists(destPath);

      expect(srcExists).to.be.false;
      expect(destExists).to.be.true;
    });
  });

  describe('copyFile', () => {
    it('should copy a file', async () => {
      const srcPath = path.join(testDir, 'source.txt');
      const destPath = path.join(testDir, 'destination.txt');
      const content = 'Test content';

      await writeFile(srcPath, content);
      await copyFile(srcPath, destPath);

      const srcExists = await pathExists(srcPath);
      const destExists = await pathExists(destPath);
      const destContent = await readFile(destPath);

      expect(srcExists).to.be.true;
      expect(destExists).to.be.true;
      expect(destContent).to.equal(content);
    });
  });

  describe('deleteDirectory', () => {
    it('should delete an empty directory', async () => {
      const dirPath = path.join(testDir, 'empty-dir');
      await createDirectory(dirPath);

      await deleteDirectory(dirPath);

      const exists = await pathExists(dirPath);
      expect(exists).to.be.false;
    });

    it('should delete a directory with contents', async () => {
      const dirPath = path.join(testDir, 'full-dir');
      await createDirectory(dirPath);
      await writeFile(path.join(dirPath, 'file1.txt'), 'content');
      await writeFile(path.join(dirPath, 'file2.txt'), 'content');

      await deleteDirectory(dirPath);

      const exists = await pathExists(dirPath);
      expect(exists).to.be.false;
    });
  });

  describe('readDirectory', () => {
    it('should list directory entries', async () => {
      await writeFile(path.join(testDir, 'file1.txt'), 'content');
      await writeFile(path.join(testDir, 'file2.md'), 'content');
      await createDirectory(path.join(testDir, 'subfolder'));

      const entries = await readDirectory(testDir);

      expect(entries).to.be.an('array');
      expect(entries).to.have.lengthOf(3);
      expect(entries).to.include('file1.txt');
      expect(entries).to.include('file2.md');
      expect(entries).to.include('subfolder');
    });
  });

  describe('readDirectoryWithTypes', () => {
    it('should provide file type information', async () => {
      await writeFile(path.join(testDir, 'file.txt'), 'content');
      await createDirectory(path.join(testDir, 'folder'));

      const entries = await readDirectoryWithTypes(testDir);

      expect(entries).to.have.lengthOf(2);

      const file = entries.find(e => e.name === 'file.txt');
      const folder = entries.find(e => e.name === 'folder');

      expect(file?.isFile()).to.be.true;
      expect(folder?.isDirectory()).to.be.true;
    });
  });

  describe('getFileStats', () => {
    it('should return file statistics', async () => {
      const filePath = path.join(testDir, 'stats-test.txt');
      await writeFile(filePath, 'content');

      const stats = await getFileStats(filePath);

      expect(stats.isFile()).to.be.true;
      expect(stats.size).to.be.greaterThan(0);
    });
  });

  describe('copyDirectoryRecursive', () => {
    it('should copy directory structure recursively', async () => {
      const srcDir = path.join(testDir, 'source');
      const destDir = path.join(testDir, 'destination');

      // Create source structure
      await createDirectory(srcDir);
      await writeFile(path.join(srcDir, 'file1.txt'), 'content1');
      await createDirectory(path.join(srcDir, 'subfolder'));
      await writeFile(path.join(srcDir, 'subfolder', 'file2.txt'), 'content2');

      // Create destination directory
      await createDirectory(destDir);

      // Copy
      await copyDirectoryRecursive(srcDir, destDir);

      // Verify structure
      const file1Exists = await pathExists(path.join(destDir, 'file1.txt'));
      const file2Exists = await pathExists(path.join(destDir, 'subfolder', 'file2.txt'));
      const file1Content = await readFile(path.join(destDir, 'file1.txt'));
      const file2Content = await readFile(path.join(destDir, 'subfolder', 'file2.txt'));

      expect(file1Exists).to.be.true;
      expect(file2Exists).to.be.true;
      expect(file1Content).to.equal('content1');
      expect(file2Content).to.equal('content2');
    });
  });
});
