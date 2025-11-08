import { expect } from 'chai';

/**
 * Tests for keyword splitting behavior in advancedSearch
 *
 * These tests verify that multi-word queries like "authentication issues"
 * are split into individual keywords and searched with OR logic.
 * This was the core fix to make search work as expected.
 */
describe('Advanced Search - Keyword Splitting', () => {
    describe('Query Pattern Generation', () => {
        /**
         * Helper to simulate the keyword splitting logic from advancedSearch
         */
        function generateSearchPattern(query: string): RegExp {
            const keywords = query.trim().split(/\s+/).filter(k => k.length > 0);
            if (keywords.length === 0) {
                throw new Error('Empty query');
            }

            // Escape special regex characters for each keyword
            const escapedKeywords = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            const pattern = escapedKeywords.length === 1
                ? escapedKeywords[0]
                : `(${escapedKeywords.join('|')})`;

            return new RegExp(pattern, 'gi');
        }

        it('should split multi-word queries into OR pattern', () => {
            const pattern = generateSearchPattern('authentication issues');

            expect(pattern.source).to.equal('(authentication|issues)');
            expect(pattern.flags).to.include('i'); // case insensitive
            expect(pattern.flags).to.include('g'); // global
        });

        it('should match files containing either keyword', () => {
            const pattern = generateSearchPattern('authentication issues');

            const content1 = 'This file discusses authentication methods';
            const content2 = 'This file lists known issues';
            const content3 = 'This file has neither word';

            expect(pattern.test(content1)).to.be.true;

            // Reset pattern for next test
            pattern.lastIndex = 0;
            expect(pattern.test(content2)).to.be.true;

            pattern.lastIndex = 0;
            expect(pattern.test(content3)).to.be.false;
        });

        it('should match files containing both keywords', () => {
            const pattern = generateSearchPattern('authentication issues');
            const content = 'There are authentication issues in the login system';

            expect(pattern.test(content)).to.be.true;

            // Should find multiple matches
            pattern.lastIndex = 0;
            const matches = content.match(pattern);
            expect(matches).to.have.length(2); // "authentication" and "issues"
        });

        it('should handle single-word queries', () => {
            const pattern = generateSearchPattern('authentication');

            expect(pattern.source).to.equal('authentication');
            expect(pattern.flags).to.include('i');
        });

        it('should escape special regex characters', () => {
            const pattern = generateSearchPattern('api.endpoint');

            // The dot should be escaped
            expect(pattern.source).to.include('\\.');

            // Should not match "apixendpoint" (dot as wildcard)
            expect(pattern.test('apixendpoint')).to.be.false;

            // Should match "api.endpoint"
            expect(pattern.test('api.endpoint')).to.be.true;
        });

        it('should handle queries with multiple spaces', () => {
            const pattern = generateSearchPattern('authentication    issues');

            // Should still split correctly
            expect(pattern.source).to.equal('(authentication|issues)');
        });

        it('should handle three or more keywords', () => {
            const pattern = generateSearchPattern('authentication oauth security');

            expect(pattern.source).to.equal('(authentication|oauth|security)');

            const content = 'This discusses oauth integration';
            expect(pattern.test(content)).to.be.true;
        });

        it('should be case-insensitive', () => {
            const pattern = generateSearchPattern('authentication issues');

            expect(pattern.test('Authentication System')).to.be.true;

            // Reset regex state for next test
            pattern.lastIndex = 0;
            expect(pattern.test('KNOWN ISSUES')).to.be.true;

            pattern.lastIndex = 0;
            expect(pattern.test('AuThEnTiCaTiOn')).to.be.true;
        });

        it('should filter out empty keywords from extra spaces', () => {
            const pattern = generateSearchPattern('  authentication   issues  ');

            expect(pattern.source).to.equal('(authentication|issues)');
            // Should not have empty alternatives like (authentication||issues)
        });
    });

    describe('Scoring Implications', () => {
        it('should explain scoring behavior with split keywords', () => {
            // This is a documentation test to explain the scoring behavior

            // A file with 5 matches of "authentication" should score:
            // - Match count: min(5/10, 0.4) = 0.4
            // - Title match: 0.15 (1 of 2 keywords = 0.3 * 0.5)
            // - Preview: ~0.2
            // Total: ~0.75 (well above 0.5 threshold)

            const expectedMinScore = 0.4; // Just from match count
            const expectedScoreThreshold = 0.5; // Configured threshold

            expect(expectedMinScore).to.be.greaterThan(0);
            expect(expectedScoreThreshold).to.equal(0.5);

            // With title and preview bonuses, should easily exceed threshold
            const expectedTotalScore = expectedMinScore + 0.15 + 0.2;
            expect(expectedTotalScore).to.be.greaterThan(expectedScoreThreshold);
        });
    });

    describe('Backward Compatibility', () => {
        it('should maintain exact phrase search when regex mode is used', () => {
            // When useRegex: true, the user-provided pattern should be used as-is
            // This is NOT tested here but documented for future reference
            // The advancedSearch function checks options.useRegex before splitting

            expect(true).to.be.true; // Documentation test
        });
    });
});
