import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateMetrics } from './metrics.js';

describe('Metrics Calculation', () => {
    test('should return zero metrics for empty data', () => {
        const result = calculateMetrics([]);
        assert.deepStrictEqual(result, {
            total: 0,
            cast: 0,
            delivered: 0,
            pending: 0,
            early: 0,
            onTime: 0,
            late: 0,
            totalBBS: 0,
            deliveredBBS: 0,
            monthlyStats: {}
        });
    });

    test('should count statuses correctly', () => {
        const data = [
            { status: 'Cast', deliveries: [], bbs: [] },
            { status: 'Scheduled', deliveries: [], bbs: [] },
            { status: 'Cast', deliveries: [], bbs: [] }
        ];
        const result = calculateMetrics(data);
        assert.strictEqual(result.total, 3);
        assert.strictEqual(result.cast, 2);
        assert.strictEqual(result.pending, 1);
    });

    test('should count delivered items correctly', () => {
        const data = [
            { deliveries: [{ id: 1 }] },
            { deliveries: [] },
            { deliveries: null }, // potential edge case
            { deliveries: undefined } // potential edge case
        ];
        const result = calculateMetrics(data);
        assert.strictEqual(result.delivered, 1);
    });

    test('should calculate BBS metrics correctly', () => {
        const data = [
            { bbs: [{ actualDate: '2023-01-01' }, { actualDate: null }] },
            { bbs: [] },
            { bbs: [{ actualDate: '2023-01-02' }] },
            { bbs: null }
        ];
        const result = calculateMetrics(data);
        assert.strictEqual(result.totalBBS, 3);
        assert.strictEqual(result.deliveredBBS, 2);
    });

    test('should calculate early, onTime, and late casts correctly', () => {
        const data = [
            {
                status: 'Cast',
                castingDate: '2023-01-10',
                actualCastingDate: '2023-01-09' // Early
            },
            {
                status: 'Cast',
                castingDate: '2023-01-10',
                actualCastingDate: '2023-01-10' // On Time
            },
            {
                status: 'Cast',
                castingDate: '2023-01-10',
                actualCastingDate: '2023-01-11' // Late
            },
            {
                status: 'Scheduled', // Not Cast, should be ignored
                castingDate: '2023-01-10',
                actualCastingDate: '2023-01-09'
            }
        ];
        const result = calculateMetrics(data);
        assert.strictEqual(result.early, 1);
        assert.strictEqual(result.onTime, 1);
        assert.strictEqual(result.late, 1);
    });

    test('should calculate monthly stats correctly', () => {
        const data = [
            { castingDate: '2023-01-15', actualCastingDate: null },
            { castingDate: '2023-01-20', actualCastingDate: '2023-02-05' },
            { castingDate: null, actualCastingDate: '2023-02-10' }
        ];
        const result = calculateMetrics(data);

        // 2023-01: 2 planned (Jan 15, Jan 20), 0 actual
        // 2023-02: 0 planned, 2 actual (Feb 5, Feb 10)

        assert.deepStrictEqual(result.monthlyStats['2023-01'], { planned: 2, actual: 0 });
        assert.deepStrictEqual(result.monthlyStats['2023-02'], { planned: 0, actual: 2 });
    });
});
