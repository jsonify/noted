import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

export async function run(): Promise<void> {
  // Create the mocha test with increased timeout for extension host tests
  const mocha = new Mocha({
    color: true,
    timeout: 30000, // Increased timeout for extension tests
    slow: 10000,
    reporter: 'spec',
    ui: 'bdd' // Set BDD interface
  });

  const testsRoot = path.resolve(__dirname, '..');

  // Find all test files
  const files = await glob('integration/**/*.test.js', { cwd: testsRoot });

  console.log('[NOTED TEST] Found test files:', `(${files.length})`, files);

  // Add files to the test suite
  files.forEach(f => {
    const fullPath = path.resolve(testsRoot, f);
    console.log('[NOTED TEST] Adding file:', fullPath);
    mocha.addFile(fullPath);
  });

  // Run the tests
  return new Promise<void>((resolve, reject) => {
    try {
      console.log('[NOTED TEST] Starting mocha.run()');
      mocha.run((failures: number) => {
        console.log('[NOTED TEST] Test run completed with failures:', failures);
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      console.error('[NOTED TEST] Error running tests:', err);
      reject(err);
    }
  });
}
