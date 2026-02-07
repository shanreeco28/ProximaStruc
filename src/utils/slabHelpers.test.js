import { test, describe } from 'node:test';
import assert from 'node:assert';
import { validateZone, generateSlabId } from './slabHelpers.js';

describe('Slab Helpers', () => {
  describe('validateZone', () => {
    test('should validate valid zones', () => {
      assert.strictEqual(validateZone('Zone A'), true);
      assert.strictEqual(validateZone('North West'), true);
      assert.strictEqual(validateZone('B-12'), true);
      assert.strictEqual(validateZone('Zone 1'), true);
    });

    test('should invalidate invalid zones', () => {
      assert.strictEqual(validateZone(''), false);
      assert.strictEqual(validateZone('Zone@A'), false);
      assert.strictEqual(validateZone('<script>'), false);
      assert.strictEqual(validateZone('Zone$'), false);
      assert.strictEqual(validateZone('Zone%'), false);
    });
  });

  describe('generateSlabId', () => {
    test('should generate correct ID for valid input', () => {
      const zone = 'North West';
      const date = '2023-10-27';
      const expectedId = 'NW-231027';
      assert.strictEqual(generateSlabId(zone, date), expectedId);
    });

    test('should generate correct ID for another valid input', () => {
        const zone = 'Zone A';
        const date = '2023-01-01';
        const expectedId = 'ZA-230101';
        assert.strictEqual(generateSlabId(zone, date), expectedId);
    });

    test('should generate correct ID when date is missing', () => {
        const zone = 'Zone A';
        const date = '';
        const expectedId = 'ZA-000000';
        assert.strictEqual(generateSlabId(zone, date), expectedId);
    });

    test('should throw error for invalid zone', () => {
      const zone = 'Zone@A';
      const date = '2023-10-27';
      assert.throws(() => generateSlabId(zone, date), /Invalid zone format/);
    });
  });
});
