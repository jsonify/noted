import { expect } from 'chai';

/**
 * NotesTreeProvider Tag Filtering Tests
 *
 * These tests have been removed as part of Phase 3 of the tag system redesign.
 * Tag filtering functionality has been replaced with the hierarchical tag view
 * (tags → files → line references) in the Tags panel.
 *
 * Removed test suites:
 * - Filter State Management (getActiveFilters, setTagFilters)
 * - filterByTag (single tag and multi-tag filtering)
 * - Filter Integration with Tree View (tree refresh on filter changes)
 *
 * The NotesTreeProvider no longer has filtering capabilities.
 * Users should use the hierarchical Tags panel for navigation instead.
 */

describe('NotesTreeProvider Tag Filtering', () => {
  it('tag filtering has been removed', () => {
    // This test suite is intentionally empty
    // Tag filtering functionality was removed in Phase 3
    expect(true).to.be.true;
  });
});
