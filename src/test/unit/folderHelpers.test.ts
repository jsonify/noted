import { expect } from 'chai';
import { getAllFolders } from '../../utils/folderHelpers';
import * as path from 'path';
import { promises as fsp } from 'fs';
import * as os from 'os';

describe('Folder Helpers', () => {
  describe('getAllFolders', () => {
    let testDir: string;

    beforeEach(async () => {
      // Create a temporary directory for testing
      testDir = path.join(os.tmpdir(), `noted-test-${Date.now()}`);
      await fsp.mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
      // Clean up test directory
      try {
        await fsp.rm(testDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    it('should return empty array for directory with no subdirectories', async () => {
      const result = await getAllFolders(testDir);
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(0);
    });

    it('should find direct subdirectories', async () => {
      // Create some subdirectories
      await fsp.mkdir(path.join(testDir, 'folder1'));
      await fsp.mkdir(path.join(testDir, 'folder2'));
      await fsp.mkdir(path.join(testDir, 'folder3'));

      const result = await getAllFolders(testDir);
      expect(result).to.have.lengthOf(3);

      const names = result.map(f => f.name).sort();
      expect(names).to.deep.equal(['folder1', 'folder2', 'folder3']);
    });

    it('should find nested subdirectories recursively', async () => {
      // Create nested structure
      await fsp.mkdir(path.join(testDir, '2024'));
      await fsp.mkdir(path.join(testDir, '2024', '01-January'));
      await fsp.mkdir(path.join(testDir, '2024', '02-February'));
      await fsp.mkdir(path.join(testDir, '2025'));
      await fsp.mkdir(path.join(testDir, '2025', '01-January'));

      const result = await getAllFolders(testDir);
      expect(result).to.have.lengthOf(5);

      const names = result.map(f => f.name).sort();
      expect(names).to.include('2024');
      expect(names).to.include('2024/01-January');
      expect(names).to.include('2024/02-February');
      expect(names).to.include('2025');
      expect(names).to.include('2025/01-January');
    });

    it('should return correct absolute paths', async () => {
      await fsp.mkdir(path.join(testDir, 'test-folder'));

      const result = await getAllFolders(testDir);
      expect(result).to.have.lengthOf(1);
      expect(result[0].path).to.equal(path.join(testDir, 'test-folder'));
    });

    it('should ignore files, only return directories', async () => {
      // Create a mix of files and directories
      await fsp.mkdir(path.join(testDir, 'folder1'));
      await fsp.writeFile(path.join(testDir, 'file1.txt'), 'content');
      await fsp.mkdir(path.join(testDir, 'folder2'));
      await fsp.writeFile(path.join(testDir, 'file2.md'), 'content');

      const result = await getAllFolders(testDir);
      expect(result).to.have.lengthOf(2);

      const names = result.map(f => f.name).sort();
      expect(names).to.deep.equal(['folder1', 'folder2']);
    });

    it('should handle deeply nested structures', async () => {
      // Create a deep nesting
      let currentPath = testDir;
      for (let i = 1; i <= 5; i++) {
        currentPath = path.join(currentPath, `level${i}`);
        await fsp.mkdir(currentPath);
      }

      const result = await getAllFolders(testDir);
      expect(result).to.have.lengthOf(5);

      const names = result.map(f => f.name);
      expect(names).to.include('level1');
      expect(names).to.include('level1/level2');
      expect(names).to.include('level1/level2/level3');
      expect(names).to.include('level1/level2/level3/level4');
      expect(names).to.include('level1/level2/level3/level4/level5');
    });

    it('should handle error gracefully for non-existent directory', async () => {
      const nonExistentPath = path.join(testDir, 'does-not-exist');
      const result = await getAllFolders(nonExistentPath);

      // Should return empty array and not throw
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(0);
    });
  });
});
