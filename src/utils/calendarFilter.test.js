import { test, describe } from 'node:test';
import assert from 'node:assert';
import { filterCalendarData } from './calendarFilter.js';

describe('Calendar Filter', () => {
  const mockData = [
    { id: '1', slabId: 'Slab-101', zone: 'Zone-A' },
    { id: '2', slabId: 'Slab-102', zone: 'Zone-B' },
    { id: '3', slabId: 'Slab-201', zone: 'Zone-A' },
    { id: '4', slabId: 'Other-1', zone: 'Zone-C' },
    { id: '5', slabId: 'Slab-301', zone: null }, // Edge case: missing zone
  ];

  test('should return all data when filterText is empty', () => {
    const result = filterCalendarData(mockData, '');
    assert.strictEqual(result.length, 5);
  });

  test('should filter by slabId (case insensitive)', () => {
    const result = filterCalendarData(mockData, 'slab-1');
    assert.strictEqual(result.length, 2);
    assert.ok(result.find(item => item.slabId === 'Slab-101'));
    assert.ok(result.find(item => item.slabId === 'Slab-102'));
  });

  test('should filter by zone (case insensitive)', () => {
    const result = filterCalendarData(mockData, 'zone-a');
    assert.strictEqual(result.length, 2);
    assert.ok(result.find(item => item.slabId === 'Slab-101'));
    assert.ok(result.find(item => item.slabId === 'Slab-201'));
  });

  test('should handle partial matches', () => {
    const result = filterCalendarData(mockData, '01');
    assert.strictEqual(result.length, 3); // Slab-101, Slab-201, Slab-301
  });

  test('should handle empty data', () => {
    const result = filterCalendarData([], 'test');
    assert.strictEqual(result.length, 0);
  });

  test('should handle null/undefined data', () => {
    const result = filterCalendarData(null, 'test');
    assert.deepStrictEqual(result, []);
  });

  test('should handle items with missing properties', () => {
      const result = filterCalendarData(mockData, 'zone');
      // Should match Zone-A, Zone-B, Zone-A, Zone-C. (4 items). Item 5 has null zone.
      assert.strictEqual(result.length, 4);
  });
});
