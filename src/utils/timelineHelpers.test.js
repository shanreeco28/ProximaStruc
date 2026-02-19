import { test, describe } from 'node:test';
import assert from 'node:assert';
import { processTimelineData } from './timelineHelpers.js';

describe('Timeline Helpers', () => {
  describe('processTimelineData', () => {
    test('should return empty array for null or undefined input', () => {
      assert.deepStrictEqual(processTimelineData(null), []);
      assert.deepStrictEqual(processTimelineData(undefined), []);
    });

    test('should return empty array for empty array input', () => {
      assert.deepStrictEqual(processTimelineData([]), []);
    });

    test('should filter out items without castingDate', () => {
      const input = [
        { id: 1, castingDate: '2023-01-01' },
        { id: 2, castingDate: null },
        { id: 3, castingDate: undefined },
        { id: 4, castingDate: '' },
      ];
      const result = processTimelineData(input);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].id, 1);
    });

    test('should sort items by castingDate ascending', () => {
      const input = [
        { id: 1, castingDate: '2023-02-01' },
        { id: 2, castingDate: '2023-01-01' },
        { id: 3, castingDate: '2023-03-01' },
      ];
      const result = processTimelineData(input);
      assert.strictEqual(result[0].id, 2);
      assert.strictEqual(result[1].id, 1);
      assert.strictEqual(result[2].id, 3);
    });

    test('should correctly map startDate and endDate', () => {
      const input = [
        { id: 1, castingDate: '2023-01-01', actualCastingDate: '2023-01-05' },
        { id: 2, castingDate: '2023-02-01', actualCastingDate: null },
      ];
      const result = processTimelineData(input);

      // Item 1: has actualCastingDate
      assert.strictEqual(result[0].startDate, '2023-01-01');
      assert.strictEqual(result[0].endDate, '2023-01-05');

      // Item 2: no actualCastingDate, endDate fallback to castingDate
      assert.strictEqual(result[1].startDate, '2023-02-01');
      assert.strictEqual(result[1].endDate, '2023-02-01');
    });

    test('should correctly calculate delay', () => {
      const input = [
        { id: 1, castingDate: '2023-01-01', actualCastingDate: '2023-01-05' }, // Delayed
        { id: 2, castingDate: '2023-02-05', actualCastingDate: '2023-02-01' }, // Early
        { id: 3, castingDate: '2023-03-01', actualCastingDate: '2023-03-01' }, // On time
        { id: 4, castingDate: '2023-04-01', actualCastingDate: null },         // No actual date
      ];
      const result = processTimelineData(input);

      assert.strictEqual(result[0].delay, true, 'Delayed item should have delay: true');
      assert.strictEqual(result[1].delay, false, 'Early item should have delay: false');
      assert.strictEqual(result[2].delay, false, 'On time item should have delay: false');
      assert.strictEqual(result[3].delay, false, 'Item without actual date should have delay: false');
    });

    test('should handle invalid items in the array gracefully', () => {
        const input = [
            { id: 1, castingDate: '2023-01-01' },
            null,
            undefined
        ];
        const result = processTimelineData(input);
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].id, 1);
    });
  });
});
