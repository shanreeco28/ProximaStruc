import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getDaysInMonth, getFirstDayOfMonth, isDateAfter } from './dateHelpers.js';

describe('Date Helpers', () => {
  describe('getDaysInMonth', () => {
    test('should return 31 for January', () => {
      const date = new Date(2023, 0, 1); // Jan 1, 2023
      assert.strictEqual(getDaysInMonth(date), 31);
    });

    test('should return 30 for April', () => {
      const date = new Date(2023, 3, 1); // Apr 1, 2023
      assert.strictEqual(getDaysInMonth(date), 30);
    });

    test('should return 28 for February in a non-leap year', () => {
      const date = new Date(2023, 1, 1); // Feb 1, 2023
      assert.strictEqual(getDaysInMonth(date), 28);
    });

    test('should return 29 for February in a leap year', () => {
      const date = new Date(2024, 1, 1); // Feb 1, 2024
      assert.strictEqual(getDaysInMonth(date), 29);
    });

    test('should return 31 for December', () => {
      const date = new Date(2023, 11, 1); // Dec 1, 2023
      assert.strictEqual(getDaysInMonth(date), 31);
    });
  });

  describe('getFirstDayOfMonth', () => {
    test('should return 0 for October 2023 (starts on Sunday)', () => {
      const date = new Date(2023, 9, 1); // Oct 1, 2023
      assert.strictEqual(getFirstDayOfMonth(date), 0);
    });

    test('should return 3 for November 2023 (starts on Wednesday)', () => {
      const date = new Date(2023, 10, 1); // Nov 1, 2023
      assert.strictEqual(getFirstDayOfMonth(date), 3);
    });

    test('should return 1 for January 2024 (starts on Monday)', () => {
      const date = new Date(2024, 0, 1); // Jan 1, 2024
      assert.strictEqual(getFirstDayOfMonth(date), 1);
    });
  });

  describe('isDateAfter', () => {
    test('should return true if first date is after second date', () => {
      assert.strictEqual(isDateAfter('2023-10-28', '2023-10-27'), true);
    });

    test('should return false if first date is before second date', () => {
      assert.strictEqual(isDateAfter('2023-10-26', '2023-10-27'), false);
    });

    test('should return false if dates are equal', () => {
      assert.strictEqual(isDateAfter('2023-10-27', '2023-10-27'), false);
    });

    test('should return false if either date is missing', () => {
      assert.strictEqual(isDateAfter(null, '2023-10-27'), false);
      assert.strictEqual(isDateAfter('2023-10-27', null), false);
      assert.strictEqual(isDateAfter(undefined, undefined), false);
    });
  });
});
