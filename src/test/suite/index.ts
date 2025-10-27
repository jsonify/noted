import * as path from 'path';
import { glob } from 'glob';

export async function run(): Promise<void> {
  // Create the mocha test - use require to ensure proper loading
  const Mocha = require('mocha');
  const mocha = new Mocha({
    ui: 'bdd',
    color: true,
    timeout: 30000,
    slow: 10000,
    reporter: 'spec'
  });

  const testsRoot = path.resolve(__dirname, '..');

  // CRITICAL: Set up BDD interface globals (suite, test, etc.) in the global scope
  // before any test files are loaded. This is necessary because when Mocha requires
  // the test files, they immediately call suite() which must be defined.
  const bddInterface = require('mocha/lib/interfaces/bdd');

  // Initialize the BDD interface - this sets up event listeners on the suite
  bddInterface(mocha.suite);

  // Emit the 'pre-require' event to trigger global injection
  // This is what Mocha does internally when loading test files
  mocha.suite.emit('pre-require', global, null, mocha);

  // Find all test files
  const files = await glob('**/**.test.js', { cwd: testsRoot });

  // Manually require each test file NOW (after setting up globals)
  // This way suite(), test(), etc. are available when the files execute
  // We don't use mocha.addFile() because we're loading them ourselves
  files.forEach((f: string) => {
    const filePath = path.resolve(testsRoot, f);
    try {
      // Delete from require cache to ensure fresh load
      delete require.cache[filePath];
      // Require the file - this will execute the test definitions
      require(filePath);
    } catch (err) {
      console.error(`Error loading test file ${filePath}:`, err);
      throw err;
    }
  });

  // Run the tests (files are already loaded, so mocha.run won't call loadFiles)
  return new Promise<void>((resolve, reject) => {
    try {
      mocha.run((failures: number) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      console.error(err);
      reject(err);
    }
  });
}
