import { test } from 'node:test';
import assert from 'node:assert';
import { isRamp, sortSlabsByDate } from './slabHelpers.js';

test('isRamp identifies ramps correctly', () => {
  assert.strictEqual(isRamp({ zone: 'Ramp Area', slabId: 'S1' }), true);
  assert.strictEqual(isRamp({ zone: 'Zone A', slabId: 'Ramp-01' }), true);
  assert.strictEqual(isRamp({ zone: 'Zone A', slabId: 'S1' }), false);
  assert.strictEqual(isRamp({}), false);
});

test('sortSlabsByDate sorts by probable date then target date', () => {
  const data = [
    { id: 1, castingDate: '2023-10-10' },
    { id: 2, castingDate: '2023-10-05', probableCastingDate: '2023-10-12' },
    { id: 3, castingDate: '2023-10-01' },
  ];

  const sorted = sortSlabsByDate(data);

  assert.strictEqual(sorted[0].id, 3); // 2023-10-01
  assert.strictEqual(sorted[1].id, 1); // 2023-10-10
  assert.strictEqual(sorted[2].id, 2); // 2023-10-12 (probable overrides 2023-10-05)
});

test('sortSlabsByDate handles missing dates', () => {
    const data = [
        { id: 1, castingDate: '2023-10-10' },
        { id: 2 },
    ];
    const sorted = sortSlabsByDate(data);
    assert.strictEqual(sorted[0].id, 2); // 1970-01-01
    assert.strictEqual(sorted[1].id, 1); // 2023-10-10
});
