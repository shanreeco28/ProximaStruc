import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateMetrics } from './metricsHelpers.js';

describe('Metrics Helpers', () => {
  test('should return zeros for empty data', () => {
    const data = [];
    const expected = {
      total: 0,
      cast: 0,
      delivered: 0,
      pending: 0,
      early: 0,
      onTime: 0,
      late: 0,
      totalBBS: 0,
      deliveredBBS: 0
    };
    assert.deepStrictEqual(calculateMetrics(data), expected);
  });

  test('should count statuses correctly', () => {
    const data = [
      { status: 'Cast' },
      { status: 'Scheduled' },
      { status: 'Cast' },
      { status: 'Delayed' }
    ];
    const metrics = calculateMetrics(data);
    assert.strictEqual(metrics.total, 4);
    assert.strictEqual(metrics.cast, 2);
    assert.strictEqual(metrics.pending, 1);
  });

  test('should count delivered items', () => {
    const data = [
      { deliveries: [{ date: '2023-01-01' }] },
      { deliveries: [] },
      { deliveries: null }
    ];
    const metrics = calculateMetrics(data);
    assert.strictEqual(metrics.delivered, 1);
  });

  test('should calculate casting timeliness', () => {
    const data = [
      {
        status: 'Cast',
        castingDate: '2023-01-05',
        actualCastingDate: '2023-01-04' // Early
      },
      {
        status: 'Cast',
        castingDate: '2023-01-05',
        actualCastingDate: '2023-01-06' // Late
      },
      {
        status: 'Cast',
        castingDate: '2023-01-05',
        actualCastingDate: '2023-01-05' // On Time
      },
      {
        status: 'Scheduled', // Should be ignored
        castingDate: '2023-01-05',
        actualCastingDate: '2023-01-06'
      }
    ];
    const metrics = calculateMetrics(data);
    assert.strictEqual(metrics.early, 1);
    assert.strictEqual(metrics.late, 1);
    assert.strictEqual(metrics.onTime, 1);
  });

  test('should calculate BBS metrics', () => {
    const data = [
      { bbs: ['BBS-1', 'BBS-2'] }, // 2 total, 0 delivered (strings don't have actualDate)
      { bbs: [{ number: 'BBS-3', actualDate: '2023-01-01' }] }, // 1 total, 1 delivered
      { bbs: [{ number: 'BBS-4' }] }, // 1 total, 0 delivered
      { bbs: null } // Should be handled gracefully
    ];
    const metrics = calculateMetrics(data);
    assert.strictEqual(metrics.totalBBS, 4);
    assert.strictEqual(metrics.deliveredBBS, 1);
  });
});
