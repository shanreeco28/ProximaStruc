import { test, describe } from 'node:test';
import assert from 'node:assert';
import { isRamp, getSortedData } from './reportHelpers.js';

describe('Report Helpers', () => {
  describe('isRamp', () => {
    test('should return true if zone contains "ramp" (case insensitive)', () => {
      assert.strictEqual(isRamp({ zone: 'Ramp A', slabId: 'Slab 1' }), true);
      assert.strictEqual(isRamp({ zone: 'ramp B', slabId: 'Slab 2' }), true);
      assert.strictEqual(isRamp({ zone: 'LEVEL 1 RAMP', slabId: 'Slab 3' }), true);
    });

    test('should return true if slabId contains "ramp" (case insensitive)', () => {
      assert.strictEqual(isRamp({ zone: 'Zone 1', slabId: 'Ramp Slab' }), true);
      assert.strictEqual(isRamp({ zone: 'Zone 2', slabId: 'ramp-01' }), true);
    });

    test('should return false if neither contains "ramp"', () => {
      assert.strictEqual(isRamp({ zone: 'Zone 1', slabId: 'Slab 1' }), false);
      assert.strictEqual(isRamp({ zone: 'Level 2', slabId: 'BBS-1' }), false);
    });

    test('should handle null or undefined properties', () => {
      assert.strictEqual(isRamp({}), false);
      assert.strictEqual(isRamp({ zone: null, slabId: null }), false);
      assert.strictEqual(isRamp({ zone: undefined, slabId: 'Slab 1' }), false);
    });
  });

  describe('getSortedData', () => {
    test('should sort by probableCastingDate', () => {
      const input = [
        { id: 1, probableCastingDate: '2023-10-02' },
        { id: 2, probableCastingDate: '2023-10-01' },
        { id: 3, probableCastingDate: '2023-10-03' }
      ];
      const result = getSortedData(input);
      assert.deepStrictEqual(result.map(i => i.id), [2, 1, 3]);
    });

    test('should sort by castingDate when probableCastingDate is missing', () => {
      const input = [
        { id: 1, castingDate: '2023-10-02' },
        { id: 2, castingDate: '2023-10-01' },
        { id: 3, castingDate: '2023-10-03' }
      ];
      const result = getSortedData(input);
      assert.deepStrictEqual(result.map(i => i.id), [2, 1, 3]);
    });

    test('should handle mixed date fields', () => {
      const input = [
        { id: 1, probableCastingDate: '2023-10-02' }, // Uses probable
        { id: 2, castingDate: '2023-10-01' },         // Uses castingDate
        { id: 3, probableCastingDate: '2023-10-03', castingDate: '2023-01-01' } // Uses probable (priority)
      ];
      const result = getSortedData(input);
      assert.deepStrictEqual(result.map(i => i.id), [2, 1, 3]);
    });

    test('should handle missing dates by treating them as 1970-01-01 (ascending order)', () => {
       const input = [
        { id: 1, castingDate: '2023-10-01' },
        { id: 2 } // Missing date -> 1970
      ];
      const result = getSortedData(input);
      // id 2 (1970) comes before id 1 (2023)
      assert.deepStrictEqual(result.map(i => i.id), [2, 1]);
    });

    test('should not mutate the original array', () => {
      const input = [
        { id: 1, probableCastingDate: '2023-10-02' },
        { id: 2, probableCastingDate: '2023-10-01' }
      ];
      const original = [...input]; // shallow copy to compare against
      getSortedData(input);
      // We need to check if objects inside are same ref, but array order is preserved?
      // Wait, getSortedData returns a new array sorted.
      // But does it mutate the input array?
      // implementation: return [...data].sort(...)
      // So it creates a copy.
      // To test mutation of input array:
      const input2 = [
          { id: 1, val: 2 },
          { id: 2, val: 1 }
      ];
      // sort would change order.
      // But here we need dates to sort.
      const input3 = [
          { id: 1, castingDate: '2023-10-02' },
          { id: 2, castingDate: '2023-10-01' }
      ];
      const snapshot = JSON.stringify(input3);
      getSortedData(input3);
      assert.strictEqual(JSON.stringify(input3), snapshot);
    });
  });
});
