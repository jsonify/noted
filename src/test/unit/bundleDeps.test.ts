import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

describe('Bundle Dependencies', () => {
    describe('bundle-deps.js configuration', () => {
        it('should include all required runtime dependencies', () => {
            const bundleScriptPath = path.join(__dirname, '../../../scripts/bundle-deps.js');
            const bundleScript = fs.readFileSync(bundleScriptPath, 'utf-8');

            // Required dependencies for Smart Search feature
            const requiredDeps = [
                'chrono-node',  // Date parsing for QueryAnalyzer
                'fuse.js',      // Fuzzy search for KeywordSearch
                'marked',       // Markdown parsing
                'js-yaml'       // YAML frontmatter parsing
            ];

            for (const dep of requiredDeps) {
                const hasQuotedDep = bundleScript.includes(`'${dep}'`) || bundleScript.includes(`"${dep}"`);
                expect(hasQuotedDep).to.be.true,
                    `bundle-deps.js should include ${dep} in DEPS_TO_BUNDLE array`;
            }
        });

        it('should have valid DEPS_TO_BUNDLE array structure', () => {
            const bundleScriptPath = path.join(__dirname, '../../../scripts/bundle-deps.js');
            const bundleScript = fs.readFileSync(bundleScriptPath, 'utf-8');

            // Check for DEPS_TO_BUNDLE constant
            expect(bundleScript).to.include('DEPS_TO_BUNDLE');
            expect(bundleScript).to.include('[');
            expect(bundleScript).to.include(']');
        });
    });

    describe('package.json dependencies', () => {
        it('should declare all bundled dependencies', () => {
            const packageJsonPath = path.join(__dirname, '../../../package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

            const requiredDeps = [
                'chrono-node',
                'fuse.js',
                'marked',
                'js-yaml'
            ];

            for (const dep of requiredDeps) {
                expect(packageJson.dependencies).to.have.property(dep),
                    `package.json should have ${dep} in dependencies`;
            }
        });
    });

    describe('Smart Search dependencies', () => {
        it('should be able to require chrono-node', () => {
            expect(() => require('chrono-node')).to.not.throw();
        });

        it('should be able to require fuse.js', () => {
            expect(() => require('fuse.js')).to.not.throw();
        });
    });
});
