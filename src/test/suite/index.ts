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
  const interfaceSetup = bddInterface(mocha.suite);

  // Call the interface setup function with the global context to inject globals
  interfaceSetup(global);

  // Find all test files
  const files = await glob('**/**.test.js', { cwd: testsRoot });

  // Add files to the test suite
  files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

  // Run the tests
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
