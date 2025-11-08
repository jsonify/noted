import { expect } from 'chai';
import * as sinon from 'sinon';
import { KeywordSearch } from '../../search/KeywordSearch';
import * as searchService from '../../services/searchService';
import * as fileSystemService from '../../services/fileSystemService';

describe('KeywordSearch', () => {
    let sandbox: sinon.SinonSandbox;
    let advancedSearchStub: sinon.SinonStub;
    let getFileStatsStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        advancedSearchStub = sandbox.stub(searchService, 'advancedSearch');
        getFileStatsStub = sandbox.stub(fileSystemService, 'getFileStats');

        // Mock file stats for all test files
        getFileStatsStub.resolves({
            birthtime: new Date(),
            mtime: new Date(),
            size: 1000,
            isDirectory: () => false,
            isFile: () => true
        } as any);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Multi-word Query Splitting', () => {
        it('should split multi-word queries and find files with any keyword', async () => {
            // Setup: Return mock results from advancedSearch
            advancedSearchStub.resolves([
                {
                    file: '/path/to/auth-note.md',
                    preview: 'Authentication service implementation',
                    matches: 3,
                    modified: new Date(),
                    tags: []
                }
            ]);

            const keywordSearch = new KeywordSearch();
            const results = await keywordSearch.search('authentication issues', {}, {});

            expect(results.length).to.be.greaterThan(0);
            // Verify advancedSearch was called with the multi-word query
            expect(advancedSearchStub.calledOnce).to.be.true;
            const call = advancedSearchStub.getCall(0);
            expect(call.args[0].query).to.equal('authentication issues');
        });

        it('should handle single-word queries', async () => {
            advancedSearchStub.resolves([
                {
                    file: '/path/to/note.md',
                    preview: 'Authentication details',
                    matches: 2,
                    modified: new Date(),
                    tags: []
                }
            ]);

            const keywordSearch = new KeywordSearch();
            const results = await keywordSearch.search('authentication', {}, {});

            expect(results.length).to.be.greaterThan(0);
        });
    });

    describe('Scoring Algorithm with Split Keywords', () => {
        it('should score multi-keyword queries above 0.5 threshold', async () => {
            // Mock a file that contains one of the keywords
            advancedSearchStub.resolves([
                {
                    file: '/path/to/auth-service.md',
                    preview: 'Authentication service implementation details',
                    matches: 5, // Multiple matches of "authentication"
                    modified: new Date(),
                    tags: []
                }
            ]);

            const keywordSearch = new KeywordSearch();
            const results = await keywordSearch.search('authentication issues', {}, {});

            expect(results.length).to.be.greaterThan(0);
            // Score should be above 0.5 threshold (0.4 from matches + preview relevance)
            expect(results[0].score).to.be.greaterThan(0.5);
        });

        it('should give higher scores when keywords appear in filename', async () => {
            advancedSearchStub.resolves([
                {
                    file: '/path/to/authentication-issues.md',
                    preview: 'Details about authentication problems',
                    matches: 3,
                    modified: new Date(),
                    tags: []
                }
            ]);

            const keywordSearch = new KeywordSearch();
            const results = await keywordSearch.search('authentication issues', {}, {});

            expect(results.length).to.be.greaterThan(0);
            // Should get title boost (0.3 for both keywords in title)
            expect(results[0].score).to.be.greaterThan(0.6);
        });

        it('should score based on proportion of keywords matched', async () => {
            advancedSearchStub.resolves([
                {
                    file: '/path/to/authentication-service.md',
                    preview: 'Authentication service',
                    matches: 2,
                    modified: new Date(),
                    tags: []
                },
                {
                    file: '/path/to/authentication-issues.md',
                    preview: 'Authentication issues and problems',
                    matches: 4,
                    modified: new Date(),
                    tags: []
                }
            ]);

            const keywordSearch = new KeywordSearch();
            const results = await keywordSearch.search('authentication issues', {}, {});

            expect(results.length).to.equal(2);
            // File matching both keywords should score higher
            const authIssuesFile = results.find(r => r.fileName === 'authentication-issues.md');
            const authServiceFile = results.find(r => r.fileName === 'authentication-service.md');

            expect(authIssuesFile).to.exist;
            expect(authServiceFile).to.exist;
            expect(authIssuesFile!.score).to.be.greaterThan(authServiceFile!.score);
        });

        it('should not filter out results with scores above minRelevanceScore', async () => {
            advancedSearchStub.resolves([
                {
                    file: '/path/to/high-score.md',
                    preview: 'authentication authentication authentication',
                    matches: 10,
                    modified: new Date(),
                    tags: []
                },
                {
                    file: '/path/to/medium-score.md',
                    preview: 'authentication details',
                    matches: 3,
                    modified: new Date(),
                    tags: []
                }
            ]);

            const keywordSearch = new KeywordSearch();
            const results = await keywordSearch.search('authentication issues', {}, {
                maxResults: 20
            });

            // Both should pass 0.5 threshold after our fix
            expect(results.length).to.equal(2);
        });
    });

    describe('Empty and Edge Cases', () => {
        it('should handle empty query gracefully', async () => {
            advancedSearchStub.resolves([]);

            const keywordSearch = new KeywordSearch();
            const results = await keywordSearch.search('', {}, {});

            expect(results).to.be.an('array');
            expect(results.length).to.equal(0);
        });

        it('should handle query with only whitespace', async () => {
            advancedSearchStub.resolves([]);

            const keywordSearch = new KeywordSearch();
            const results = await keywordSearch.search('   ', {}, {});

            expect(results).to.be.an('array');
        });

        it('should handle queries with multiple spaces between words', async () => {
            advancedSearchStub.resolves([
                {
                    file: '/path/to/note.md',
                    preview: 'authentication issues',
                    matches: 2,
                    modified: new Date(),
                    tags: []
                }
            ]);

            const keywordSearch = new KeywordSearch();
            const results = await keywordSearch.search('authentication    issues', {}, {});

            expect(results.length).to.be.greaterThan(0);
        });
    });
});
