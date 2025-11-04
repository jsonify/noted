import { expect } from 'chai';
import { parseSearchQuery } from '../../services/searchService';

describe('Search Service', () => {
  describe('parseSearchQuery', () => {
    describe('Dynamic Date Keywords', () => {
      describe('TODAY keyword', () => {
        it('should parse from:TODAY', () => {
          const result = parseSearchQuery('from:TODAY');
          expect(result.dateFrom).to.exist;
          expect(result.dateFrom!.getHours()).to.equal(0);
          expect(result.dateFrom!.getMinutes()).to.equal(0);
          expect(result.dateFrom!.getSeconds()).to.equal(0);
        });

        it('should parse to:TODAY', () => {
          const result = parseSearchQuery('to:TODAY');
          expect(result.dateTo).to.exist;
          expect(result.dateTo!.getHours()).to.equal(0);
        });

        it('should parse from:TODAY to:TODAY', () => {
          const result = parseSearchQuery('from:TODAY to:TODAY');
          expect(result.dateFrom).to.exist;
          expect(result.dateTo).to.exist;
        });

        it('should be case-insensitive', () => {
          const upper = parseSearchQuery('from:TODAY');
          const lower = parseSearchQuery('from:today');
          const mixed = parseSearchQuery('from:Today');

          expect(upper.dateFrom).to.exist;
          expect(lower.dateFrom).to.exist;
          expect(mixed.dateFrom).to.exist;
        });

        it('should not capture text after TODAY keyword', () => {
          const result = parseSearchQuery('from:TODAY tag:bug');
          expect(result.dateFrom).to.exist;
          expect(result.tags).to.deep.equal(['bug']);
          expect(result.query).to.equal('');
        });
      });

      describe('YESTERDAY keyword', () => {
        it('should parse from:YESTERDAY', () => {
          const result = parseSearchQuery('from:YESTERDAY');
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);

          expect(result.dateFrom).to.exist;
          expect(result.dateFrom!.getDate()).to.equal(yesterday.getDate());
        });

        it('should not capture text after YESTERDAY keyword', () => {
          const result = parseSearchQuery('from:YESTERDAY tag:meeting');
          expect(result.dateFrom).to.exist;
          expect(result.tags).to.deep.equal(['meeting']);
        });
      });

      describe('LAST N DAYS keyword', () => {
        it('should parse from:LAST 7 DAYS', () => {
          const result = parseSearchQuery('from:LAST 7 DAYS');
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 7 days means today + 6 previous

          expect(result.dateFrom).to.exist;
          expect(result.dateFrom!.getDate()).to.equal(sevenDaysAgo.getDate());
        });

        it('should parse from:LAST 30 DAYS', () => {
          const result = parseSearchQuery('from:LAST 30 DAYS');
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); // 30 days means today + 29 previous

          expect(result.dateFrom).to.exist;
          expect(result.dateFrom!.getDate()).to.equal(thirtyDaysAgo.getDate());
        });

        it('should handle LAST 1 DAY as just today', () => {
          const result = parseSearchQuery('from:LAST 1 DAY');
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          expect(result.dateFrom).to.exist;
          expect(result.dateFrom!.getDate()).to.equal(today.getDate());
        });

        it('should parse singular DAY form', () => {
          const result = parseSearchQuery('from:LAST 1 DAY');
          expect(result.dateFrom).to.exist;
        });

        it('should parse plural DAYS form', () => {
          const result = parseSearchQuery('from:LAST 7 DAYS');
          expect(result.dateFrom).to.exist;
        });

        it('should not capture text after LAST N DAYS keyword', () => {
          const result = parseSearchQuery('from:LAST 7 DAYS tag:bug');
          expect(result.dateFrom).to.exist;
          expect(result.tags).to.deep.equal(['bug']);
          expect(result.query).to.equal('');
        });

        it('should work with different numbers', () => {
          const result90 = parseSearchQuery('from:LAST 90 DAYS');
          const result14 = parseSearchQuery('from:LAST 14 DAYS');
          const result365 = parseSearchQuery('from:LAST 365 DAYS');

          expect(result90.dateFrom).to.exist;
          expect(result14.dateFrom).to.exist;
          expect(result365.dateFrom).to.exist;
        });
      });

      describe('THIS WEEK keyword', () => {
        it('should parse from:THIS WEEK', () => {
          const result = parseSearchQuery('from:THIS WEEK');
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const startOfWeek = new Date(today);
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

          expect(result.dateFrom).to.exist;
          expect(result.dateFrom!.getDate()).to.equal(startOfWeek.getDate());
        });

        it('should not capture text after THIS WEEK keyword', () => {
          const result = parseSearchQuery('from:THIS WEEK tag:meeting');
          expect(result.dateFrom).to.exist;
          expect(result.tags).to.deep.equal(['meeting']);
        });
      });

      describe('THIS MONTH keyword', () => {
        it('should parse from:THIS MONTH', () => {
          const result = parseSearchQuery('from:THIS MONTH');
          const today = new Date();
          const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

          expect(result.dateFrom).to.exist;
          expect(result.dateFrom!.getDate()).to.equal(1);
          expect(result.dateFrom!.getMonth()).to.equal(today.getMonth());
        });

        it('should not capture text after THIS MONTH keyword', () => {
          const result = parseSearchQuery('from:THIS MONTH tag:work');
          expect(result.dateFrom).to.exist;
          expect(result.tags).to.deep.equal(['work']);
        });
      });

      describe('THIS YEAR keyword', () => {
        it('should parse from:THIS YEAR', () => {
          const result = parseSearchQuery('from:THIS YEAR');
          const today = new Date();
          const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

          expect(result.dateFrom).to.exist;
          expect(result.dateFrom!.getDate()).to.equal(1);
          expect(result.dateFrom!.getMonth()).to.equal(0);
          expect(result.dateFrom!.getFullYear()).to.equal(today.getFullYear());
        });

        it('should not capture text after THIS YEAR keyword', () => {
          const result = parseSearchQuery('from:THIS YEAR tag:project');
          expect(result.dateFrom).to.exist;
          expect(result.tags).to.deep.equal(['project']);
        });
      });
    });

    describe('Static Date Filters', () => {
      it('should parse from:YYYY-MM-DD format', () => {
        const result = parseSearchQuery('from:2024-10-15');
        expect(result.dateFrom).to.exist;
        expect(result.dateFrom!.getFullYear()).to.equal(2024);
        expect(result.dateFrom!.getMonth()).to.equal(9); // 0-indexed
        expect(result.dateFrom!.getDate()).to.equal(15);
      });

      it('should parse to:YYYY-MM-DD format', () => {
        const result = parseSearchQuery('to:2024-10-31');
        expect(result.dateTo).to.exist;
        expect(result.dateTo!.getFullYear()).to.equal(2024);
        expect(result.dateTo!.getMonth()).to.equal(9);
        expect(result.dateTo!.getDate()).to.equal(31);
      });

      it('should parse date range', () => {
        const result = parseSearchQuery('from:2024-10-01 to:2024-10-31');
        expect(result.dateFrom).to.exist;
        expect(result.dateTo).to.exist;
        expect(result.dateFrom!.getDate()).to.equal(1);
        expect(result.dateTo!.getDate()).to.equal(31);
      });

      it('should not capture text after static date', () => {
        const result = parseSearchQuery('from:2024-10-01 tag:backend');
        expect(result.dateFrom).to.exist;
        expect(result.tags).to.deep.equal(['backend']);
        expect(result.query).to.equal('');
      });
    });

    describe('Tag Filters', () => {
      it('should parse single tag', () => {
        const result = parseSearchQuery('tag:backend');
        expect(result.tags).to.deep.equal(['backend']);
      });

      it('should parse multiple tags', () => {
        const result = parseSearchQuery('tag:backend tag:bug tag:critical');
        expect(result.tags).to.deep.equal(['backend', 'bug', 'critical']);
      });

      it('should lowercase tag names', () => {
        const result = parseSearchQuery('tag:BackEnd tag:BUG');
        expect(result.tags).to.deep.equal(['backend', 'bug']);
      });
    });

    describe('Text Search', () => {
      it('should extract search text after removing filters', () => {
        const result = parseSearchQuery('authentication tag:backend from:TODAY');
        expect(result.query).to.equal('authentication');
      });

      it('should handle multiple words', () => {
        const result = parseSearchQuery('authentication oauth tag:security');
        expect(result.query).to.equal('authentication oauth');
      });

      it('should return empty query when only filters present', () => {
        const result = parseSearchQuery('tag:bug from:LAST 7 DAYS');
        expect(result.query).to.equal('');
      });
    });

    describe('Regex Mode', () => {
      it('should detect regex: keyword', () => {
        const result = parseSearchQuery('regex: bug-\\d+');
        expect(result.useRegex).to.be.true;
        expect(result.query).to.equal('bug-\\d+');
      });

      it('should work with other filters', () => {
        const result = parseSearchQuery('regex: bug-\\d+ tag:backend from:THIS MONTH');
        expect(result.useRegex).to.be.true;
        expect(result.tags).to.deep.equal(['backend']);
        expect(result.dateFrom).to.exist;
      });
    });

    describe('Case Sensitive Mode', () => {
      it('should detect case: keyword', () => {
        const result = parseSearchQuery('case: Authentication');
        expect(result.caseSensitive).to.be.true;
        expect(result.query).to.equal('Authentication');
      });

      it('should work with other filters', () => {
        const result = parseSearchQuery('case: OAuth tag:security from:TODAY');
        expect(result.caseSensitive).to.be.true;
        expect(result.tags).to.deep.equal(['security']);
        expect(result.dateFrom).to.exist;
      });
    });

    describe('Combined Filters', () => {
      it('should parse all filter types together', () => {
        const result = parseSearchQuery('regex: case: bug-\\d+ tag:backend tag:critical from:LAST 30 DAYS');
        expect(result.useRegex).to.be.true;
        expect(result.caseSensitive).to.be.true;
        expect(result.tags).to.deep.equal(['backend', 'critical']);
        expect(result.dateFrom).to.exist;
        expect(result.query).to.equal('bug-\\d+');
      });

      it('should handle complex real-world query', () => {
        const result = parseSearchQuery('from:LAST 7 DAYS tag:bug authentication');
        expect(result.dateFrom).to.exist;
        expect(result.tags).to.deep.equal(['bug']);
        expect(result.query).to.equal('authentication');
      });

      it('should handle date range with tags and text', () => {
        const result = parseSearchQuery('from:THIS MONTH to:TODAY tag:meeting action items');
        expect(result.dateFrom).to.exist;
        expect(result.dateTo).to.exist;
        expect(result.tags).to.deep.equal(['meeting']);
        expect(result.query).to.equal('action items');
      });
    });

    describe('Filter Order Independence', () => {
      it('should work regardless of filter order', () => {
        const result1 = parseSearchQuery('tag:bug from:TODAY authentication');
        const result2 = parseSearchQuery('from:TODAY authentication tag:bug');
        const result3 = parseSearchQuery('authentication from:TODAY tag:bug');

        expect(result1.tags).to.deep.equal(['bug']);
        expect(result2.tags).to.deep.equal(['bug']);
        expect(result3.tags).to.deep.equal(['bug']);

        expect(result1.dateFrom).to.exist;
        expect(result2.dateFrom).to.exist;
        expect(result3.dateFrom).to.exist;

        expect(result1.query).to.equal('authentication');
        expect(result2.query).to.equal('authentication');
        expect(result3.query).to.equal('authentication');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty query', () => {
        const result = parseSearchQuery('');
        expect(result.query).to.equal('');
        expect(result.tags).to.deep.equal([]);
        expect(result.dateFrom).to.be.undefined;
        expect(result.dateTo).to.be.undefined;
      });

      it('should handle query with only whitespace', () => {
        const result = parseSearchQuery('   ');
        expect(result.query).to.equal('');
      });

      it('should trim leading and trailing whitespace from final query', () => {
        const result = parseSearchQuery('   authentication   tag:security   ');
        expect(result.query).to.equal('authentication');
      });

      it('should handle invalid date keyword gracefully', () => {
        const result = parseSearchQuery('from:INVALID_KEYWORD');
        expect(result.dateFrom).to.be.undefined;
        // Invalid keyword should remain in query as it's not recognized
        expect(result.query).to.include('from:INVALID_KEYWORD');
      });

      it('should not match partial keywords', () => {
        const result = parseSearchQuery('from:TODAYS');
        expect(result.dateFrom).to.be.undefined;
      });

      it('should handle multiple spaces in LAST N DAYS', () => {
        const result = parseSearchQuery('from:LAST  7  DAYS');
        // Regex is lenient with \s+ and matches multiple spaces
        expect(result.dateFrom).to.exist;
      });
    });

    describe('Query Cleanup', () => {
      it('should remove date filters from query text', () => {
        const result = parseSearchQuery('from:TODAY to:YESTERDAY meeting notes');
        expect(result.query).to.equal('meeting notes');
        expect(result.query).to.not.include('from:');
        expect(result.query).to.not.include('to:');
      });

      it('should remove tag filters from query text', () => {
        const result = parseSearchQuery('tag:bug tag:critical important notes');
        expect(result.query).to.equal('important notes');
        expect(result.query).to.not.include('tag:');
      });

      it('should remove mode keywords from query text', () => {
        const result = parseSearchQuery('regex: case: bug-\\d+');
        expect(result.query).to.equal('bug-\\d+');
        expect(result.query).to.not.include('regex:');
        expect(result.query).to.not.include('case:');
      });

      it('should preserve search text between filters', () => {
        const result = parseSearchQuery('authentication tag:security oauth from:TODAY');
        expect(result.query).to.equal('authentication oauth');
      });
    });
  });
});
