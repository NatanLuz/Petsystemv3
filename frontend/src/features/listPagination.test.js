import assert from 'node:assert/strict';
import test from 'node:test';
import { getPageSlice } from './listPagination.js';

test('pagination returns the requested slice and clamps out-of-range pages', () => {
  const values = Array.from({ length: 23 }, (_, index) => index + 1);
  assert.deepEqual(getPageSlice(values, 2, 10), {
    items: values.slice(10, 20), page: 2, pageCount: 3, firstItem: 11, lastItem: 20, total: 23,
  });
  assert.equal(getPageSlice(values, 99, 10).page, 3);
  assert.deepEqual(getPageSlice([], 1), {
    items: [], page: 1, pageCount: 1, firstItem: 0, lastItem: 0, total: 0,
  });
});
