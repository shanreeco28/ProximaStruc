import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getStatusStyle } from './statusStyles.js';

describe('getStatusStyle', () => {
  const defaultStyle = "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600";
  const delayedStyle = "bg-red-600 text-white border-red-700 shadow-sm";
  const ongoingStyle = "bg-blue-600 text-white border-blue-700 shadow-sm";
  const castLateStyle = "bg-red-600 text-white border-red-700 font-bold shadow-sm";
  const castOnTimeStyle = "bg-soilGreen-600 text-white border-soilGreen-700 font-bold shadow-sm";
  const castDefaultStyle = "bg-soilGreen-600 text-white border-soilGreen-700 shadow-sm";
  const castFallbackStyle = "bg-white dark:bg-slate-700 text-slate-700 dark:text-white border-slate-300 dark:border-slate-600";

  test('should return delayed style when status is Delayed', () => {
    assert.strictEqual(getStatusStyle('Delayed'), delayedStyle);
  });

  test('should return ongoing style when status is Ongoing', () => {
    assert.strictEqual(getStatusStyle('Ongoing'), ongoingStyle);
  });

  test('should return default style when status is Scheduled', () => {
    assert.strictEqual(getStatusStyle('Scheduled'), defaultStyle);
  });

  test('should return default style when status is unknown', () => {
    assert.strictEqual(getStatusStyle('Unknown'), defaultStyle);
  });

  describe('when status is Cast', () => {
    test('should return default cast style when no dates are provided', () => {
      assert.strictEqual(getStatusStyle('Cast'), castDefaultStyle);
    });

    test('should return late style when actual date is after target date', () => {
      // 2023-10-02 > 2023-10-01
      const targetDate = '2023-10-01';
      const actualDate = '2023-10-02';
      assert.strictEqual(getStatusStyle('Cast', targetDate, actualDate), castLateStyle);
    });

    test('should return on-time style when actual date is same as target date', () => {
      // 2023-10-01 == 2023-10-01
      const targetDate = '2023-10-01';
      const actualDate = '2023-10-01';
      assert.strictEqual(getStatusStyle('Cast', targetDate, actualDate), castOnTimeStyle);
    });

    test('should return on-time style when actual date is before target date', () => {
      // 2023-09-30 < 2023-10-01
      const targetDate = '2023-10-01';
      const actualDate = '2023-09-30';
      assert.strictEqual(getStatusStyle('Cast', targetDate, actualDate), castOnTimeStyle);
    });

    test('should return default cast style when only one date is provided', () => {
       assert.strictEqual(getStatusStyle('Cast', '2023-10-01', null), castDefaultStyle);
       assert.strictEqual(getStatusStyle('Cast', null, '2023-10-01'), castDefaultStyle);
    });

    test('should return fallback style when dates are invalid', () => {
        // Date("invalid") results in Invalid Date, setHours returns NaN.
        // NaN > NaN is false, NaN <= NaN is false.
        // So it hits the final else block.
        assert.strictEqual(getStatusStyle('Cast', 'invalid-date', 'invalid-date'), castFallbackStyle);
    });
  });
});
