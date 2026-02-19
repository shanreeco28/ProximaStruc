import { describe, test } from 'node:test';
import assert from 'node:assert';
import { getStatusStyle } from './statusStyles.js';

describe('getStatusStyle', () => {
  const baseStyle = "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600";
  const delayedStyle = "bg-red-600 text-white border-red-700 shadow-sm";
  const ongoingStyle = "bg-blue-600 text-white border-blue-700 shadow-sm";
  const castLateStyle = "bg-red-600 text-white border-red-700 font-bold shadow-sm";
  const castOnTimeStyle = "bg-soilGreen-600 text-white border-soilGreen-700 font-bold shadow-sm";
  const castNoDatesStyle = "bg-soilGreen-600 text-white border-soilGreen-700 shadow-sm";
  const castInvalidDatesStyle = "bg-white dark:bg-slate-700 text-slate-700 dark:text-white border-slate-300 dark:border-slate-600";

  test('should return delayed style for "Delayed"', () => {
    assert.strictEqual(getStatusStyle('Delayed'), delayedStyle);
  });

  test('should return ongoing style for "Ongoing"', () => {
    assert.strictEqual(getStatusStyle('Ongoing'), ongoingStyle);
  });

  test('should return base style for unknown status', () => {
    assert.strictEqual(getStatusStyle('Scheduled'), baseStyle);
    assert.strictEqual(getStatusStyle('Unknown'), baseStyle);
    assert.strictEqual(getStatusStyle(null), baseStyle);
  });

  describe('Cast status', () => {
    test('should return castNoDatesStyle when no dates are provided', () => {
      assert.strictEqual(getStatusStyle('Cast'), castNoDatesStyle);
    });

    test('should return castOnTimeStyle when actual <= target', () => {
      // Same day
      assert.strictEqual(getStatusStyle('Cast', '2023-01-01', '2023-01-01'), castOnTimeStyle);
      // Early
      assert.strictEqual(getStatusStyle('Cast', '2023-01-05', '2023-01-01'), castOnTimeStyle);
    });

    test('should return castLateStyle when actual > target', () => {
      assert.strictEqual(getStatusStyle('Cast', '2023-01-01', '2023-01-02'), castLateStyle);
    });

    test('should return castInvalidDatesStyle when dates are invalid', () => {
      assert.strictEqual(getStatusStyle('Cast', 'invalid', '2023-01-01'), castInvalidDatesStyle);
      assert.strictEqual(getStatusStyle('Cast', '2023-01-01', 'invalid'), castInvalidDatesStyle);
      assert.strictEqual(getStatusStyle('Cast', 'invalid', 'invalid'), castInvalidDatesStyle);
    });
  });
});
