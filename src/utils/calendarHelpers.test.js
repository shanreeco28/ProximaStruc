import { test } from 'node:test';
import assert from 'node:assert';
import { isDateOffScreen, calculateGhostData } from './calendarHelpers.js';

test('isDateOffScreen', async (t) => {
  const currentDate = new Date(2023, 10, 15); // November 2023

  await t.test('returns false for date inside month', () => {
    assert.strictEqual(isDateOffScreen('2023-11-15', currentDate), false);
    assert.strictEqual(isDateOffScreen('2023-11-01', currentDate), false);
    assert.strictEqual(isDateOffScreen('2023-11-30', currentDate), false);
  });

  await t.test('returns true for date outside month', () => {
    assert.strictEqual(isDateOffScreen('2023-10-31', currentDate), true);
    assert.strictEqual(isDateOffScreen('2023-12-01', currentDate), true);
  });
});

test('calculateGhostData', async (t) => {
  const currentDate = new Date(2023, 10, 15); // November 2023

  await t.test('returns empty defaults for invalid input', () => {
    const result = calculateGhostData(null, currentDate);
    assert.deepStrictEqual(result, { connections: [], offScreen: [], activeGhosts: [] });
  });

  await t.test('Casting Actual with Original Target', () => {
    const meta = {
      type: 'castActual',
      domId: 'actual-1',
      id: '1',
      dateStr: '2023-11-20',
      originalTargetDate: '2023-11-10', // inside month
      slabId: 'Slab-1'
    };
    const result = calculateGhostData(meta, currentDate);
    assert.strictEqual(result.connections.length, 1);
    assert.strictEqual(result.connections[0].targetDate, '2023-11-10');
    assert.strictEqual(result.connections[0].label, 'Target');
    assert.strictEqual(result.connections[0].endElementId, 'actual-1');
  });

  await t.test('Casting Actual with Off-screen Target', () => {
    const meta = {
      type: 'castActual',
      domId: 'actual-1',
      id: '1',
      dateStr: '2023-11-20',
      originalTargetDate: '2023-10-20', // outside month
      slabId: 'Slab-1'
    };
    const result = calculateGhostData(meta, currentDate);
    assert.strictEqual(result.connections.length, 0);
    assert.strictEqual(result.offScreen.length, 1);
    assert.strictEqual(result.offScreen[0].date, '2023-10-20');
    assert.strictEqual(result.offScreen[0].label, 'Target');
  });

  await t.test('Delivery with Target', () => {
      const meta = {
          type: 'delivery',
          domId: 'del-1',
          id: '1',
          dateStr: '2023-11-25',
          targetDate: '2023-11-20',
          slabId: 'Slab-1'
      };
      const result = calculateGhostData(meta, currentDate);
      assert.strictEqual(result.connections.length, 1);
      assert.strictEqual(result.connections[0].targetDate, '2023-11-20');
      assert.strictEqual(result.connections[0].label, 'HCS Target: Slab-1');
  });

  await t.test('BBS Ghosts', () => {
      const meta = {
          type: 'castActual',
          id: '1',
          dateStr: '2023-11-20',
          slabId: 'Slab-1',
          bbs: [
              { number: 'BBS-1', targetDate: '2023-11-15' }, // inside
              { number: 'BBS-2', targetDate: '2023-12-05' }  // outside
          ]
      };
      const result = calculateGhostData(meta, currentDate);
      assert.strictEqual(result.activeGhosts.length, 2);

      const bbsInside = result.activeGhosts.find(g => g.label === 'BBS-1');
      assert.ok(bbsInside);
      assert.strictEqual(bbsInside.isTarget, true);

      const bbsOutside = result.activeGhosts.find(g => g.label === 'BBS-2');
      assert.ok(bbsOutside);

      // Check offScreen
      const off = result.offScreen.find(o => o.label === 'Plan BBS-2');
      assert.ok(off);
  });
});
