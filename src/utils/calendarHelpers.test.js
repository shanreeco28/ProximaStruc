import { test, describe } from 'node:test';
import assert from 'node:assert';
import { groupEventsByDate } from './calendarHelpers.js';

describe('groupEventsByDate', () => {
  test('should correctly group completed slab events', () => {
    const data = [{
      id: '1',
      slabId: 'Slab-1',
      actualCastingDate: '2023-10-05',
      castingDate: '2023-10-05',
      probableCastingDate: null,
      createdBy: 'User'
    }];

    const result = groupEventsByDate(data);
    const events = result.get('2023-10-05');

    assert.strictEqual(events.length, 1);
    assert.strictEqual(events[0].type, 'castTargetCompleted');
    assert.strictEqual(events[0].dateStr, '2023-10-05');
  });

  test('should correctly group late completed slab events', () => {
    const data = [{
      id: '2',
      slabId: 'Slab-2',
      actualCastingDate: '2023-10-10',
      castingDate: '2023-10-05',
      probableCastingDate: null,
      createdBy: 'User'
    }];

    const result = groupEventsByDate(data);
    const events = result.get('2023-10-10');

    assert.strictEqual(events.length, 1);
    assert.strictEqual(events[0].type, 'castActual');
    assert.strictEqual(events[0].isLate, true);
    assert.strictEqual(result.has('2023-10-05'), false); // No event on target date if completed late
  });

  test('should correctly group ongoing/target slab events', () => {
    const data = [{
      id: '3',
      slabId: 'Slab-3',
      actualCastingDate: null,
      castingDate: '2023-10-15',
      probableCastingDate: '2023-10-16',
      status: 'Ongoing',
      createdBy: 'User'
    }];

    const result = groupEventsByDate(data);
    const events = result.get('2023-10-16'); // Effective target is probable

    assert.strictEqual(events.length, 1);
    assert.strictEqual(events[0].type, 'castTargetOngoing');
    assert.strictEqual(events[0].isProbable, true);
  });

  test('should correctly group delivery events', () => {
    const data = [{
      id: '4',
      slabId: 'Slab-4',
      deliveries: [{ date: '2023-10-20', description: 'Del' }],
      hcsTargetDate: '2023-10-19',
      createdBy: 'User'
    }];

    const result = groupEventsByDate(data);
    const events = result.get('2023-10-20');

    assert.strictEqual(events.length, 1);
    assert.strictEqual(events[0].type, 'delivery');
    assert.strictEqual(events[0].isLate, true);
  });

  test('should correctly group BBS events', () => {
    const data = [{
      id: '5',
      slabId: 'Slab-5',
      actualCastingDate: null,
      bbs: [
        { number: 'BBS-1', targetDate: '2023-10-25', actualDate: null },
        { number: 'BBS-2', targetDate: '2023-10-26', actualDate: '2023-10-27' }
      ],
      createdBy: 'User'
    }];

    const result = groupEventsByDate(data);

    const targetEvents = result.get('2023-10-25');
    assert.strictEqual(targetEvents.length, 1);
    assert.strictEqual(targetEvents[0].type, 'bbsTarget');

    const actualEvents = result.get('2023-10-27');
    assert.strictEqual(actualEvents.length, 1);
    assert.strictEqual(actualEvents[0].type, 'bbsActual');
    assert.strictEqual(actualEvents[0].isLate, true);

    // Target for BBS-2 should NOT be present because logic implies distinct handling
    // Original: if (bObj.targetDate === dateStr) { if (bObj.actualDate === dateStr) ... else if (!bObj.actualDate) ... }
    // Since actualDate exists and differs, no event on target date.
    assert.strictEqual(result.has('2023-10-26'), false);
  });
});
