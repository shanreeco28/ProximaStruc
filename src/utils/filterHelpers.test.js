import { test, describe } from 'node:test';
import assert from 'node:assert';
import { filterSlabData } from './filterHelpers.js';

describe('filterSlabData', () => {
  const sampleData = [
    {
      id: '1',
      slabId: 'Slab-A',
      zone: 'Zone 1',
      bbs: ['BBS-101', 'BBS-102'],
      castingDate: '2023-10-25'
    },
    {
      id: '2',
      slabId: 'Slab-B',
      zone: 'Zone 2',
      bbs: [{ number: 'BBS-201' }, { number: 'BBS-202' }],
      castingDate: '2023-10-26'
    },
    {
      id: '3',
      slabId: 'Slab-C',
      zone: 'Zone 1',
      bbs: [],
      castingDate: '2023-10-27'
    },
    {
      id: '4',
      slabId: 'Slab-D',
      zone: 'zone 3',
      bbs: ['BBS-301'],
      castingDate: '2023-10-28'
    }
  ];

  test('should return all data when no filters are provided', () => {
    const result = filterSlabData(sampleData, '', {});
    assert.strictEqual(result.length, 4);
  });

  test('should filter by slabId (case insensitive)', () => {
    const result = filterSlabData(sampleData, 'slab-a', {});
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, '1');
  });

  test('should filter by zone', () => {
    const result = filterSlabData(sampleData, 'Zone 1', {});
    assert.strictEqual(result.length, 2); // Slab-A and Slab-C
    const ids = result.map(i => i.id).sort();
    assert.deepStrictEqual(ids, ['1', '3']);
  });

  test('should filter by BBS number (string format)', () => {
    const result = filterSlabData(sampleData, 'BBS-101', {});
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, '1');
  });

  test('should filter by BBS number (object format)', () => {
    const result = filterSlabData(sampleData, 'BBS-201', {});
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, '2');
  });

  test('should filter by partial match', () => {
    const result = filterSlabData(sampleData, 'Slab', {});
    assert.strictEqual(result.length, 4);
  });

  test('should handle undefined/null properties gracefully', () => {
     const badData = [{ id: '5', slabId: null, zone: undefined, bbs: null }];
     const result = filterSlabData(badData, 'foo', {});
     assert.strictEqual(result.length, 0);

     const result2 = filterSlabData(badData, '', {});
     assert.strictEqual(result2.length, 1);
  });

  test('should filter by date range (inclusive)', () => {
    const dateFilter = { start: '2023-10-26', end: '2023-10-27' };
    const result = filterSlabData(sampleData, '', dateFilter);
    assert.strictEqual(result.length, 2); // Slab-B (26) and Slab-C (27)
    const ids = result.map(i => i.id).sort();
    assert.deepStrictEqual(ids, ['2', '3']);
  });

  test('should filter by date range (start only - skipped)', () => {
     // The function requires both start and end to filter by date
     const dateFilter = { start: '2023-10-26', end: '' };
     const result = filterSlabData(sampleData, '', dateFilter);
     assert.strictEqual(result.length, 4);
  });

  test('should combine text search and date filter', () => {
    const dateFilter = { start: '2023-10-25', end: '2023-10-27' };
    const result = filterSlabData(sampleData, 'Zone 1', dateFilter);
    // Zone 1 items: Slab-A (25), Slab-C (27)
    // Date range 25-27 covers both
    assert.strictEqual(result.length, 2);

    // Test filtering out one
    const dateFilter2 = { start: '2023-10-26', end: '2023-10-27' };
    const result2 = filterSlabData(sampleData, 'Zone 1', dateFilter2);
    // Zone 1 items: Slab-A (25), Slab-C (27).
    // Date range 26-27 covers only Slab-C.
    assert.strictEqual(result2.length, 1);
    assert.strictEqual(result2[0].id, '3');
  });

  test('should return empty array if inputs are invalid', () => {
      assert.deepStrictEqual(filterSlabData(null, '', {}), []);
      assert.deepStrictEqual(filterSlabData(undefined, '', {}), []);
  });
});
