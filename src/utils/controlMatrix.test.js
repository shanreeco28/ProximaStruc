import { test } from 'node:test';
import assert from 'node:assert/strict';
import { certificateStatus, controlMatrix, MATRIX_RULES } from './controlMatrix.js';
import { SHEETS, sheetCode, sheetFor } from './sheets.js';

const TODAY = '2026-10-30';
const byId = rows => Object.fromEntries(rows.map(row => [row.id, row]));

test('an empty project reports "no records" for every practice area instead of a clear status', () => {
  const rows = controlMatrix({}, TODAY);
  assert.equal(rows.length, 6);
  for (const row of rows) { assert.equal(row.status, 'none'); assert.equal(row.attention, 0); }
});

test('statuses follow the published rules and only count recorded data', () => {
  const rows = byId(controlMatrix({
    tasks: [{ id: 't1', activity: 'Formwork', status: 'blocked' }, { id: 't2', activity: 'Rebar', status: 'done' }],
    inspections: [{ id: 'R1', stage: 4 }, { id: 'R2', stage: 1 }],
    materials: [{ id: 'm1', status: 'Received' }, { id: 'm2', status: 'Delayed' }],
    diary: [{ id: 'd1', category: 'Delay' }, { id: 'd2', category: 'Safety' }],
    lifts: [{ id: 'p1', status: 'ACTIVE' }, { id: 'p2', status: 'SUSPENDED' }],
    users: [{ id: 'a', systemRole: 'admin', certExpiry: '2026-11-10' }, { id: 'b', systemRole: 'guest', certExpiry: '2027-06-01' }],
  }, TODAY));
  assert.deepEqual([rows.calendar.status, rows.calendar.attention], ['action', 1]);
  assert.deepEqual([rows.inspections.status, rows.inspections.attention, rows.inspections.summary], ['watch', 1, '1 of 2 RFIs closed']);
  assert.deepEqual([rows.materials.status, rows.materials.attention, rows.materials.summary], ['action', 1, '1 of 2 records received']);
  assert.deepEqual([rows.diary.status, rows.diary.attention], ['watch', 1]);
  assert.deepEqual([rows.lifting.status, rows.lifting.attention, rows.lifting.summary], ['watch', 1, '1 of 2 lifting permits active']);
  assert.deepEqual([rows.users.status, rows.users.attention], ['watch', 1]);
});

test('an expired certificate escalates the WSH row to action', () => {
  const rows = byId(controlMatrix({ users: [{ id: 'a', systemRole: 'supervisor', certExpiry: '2026-10-01' }] }, TODAY));
  assert.equal(rows.lifting.status, 'action');
});

test('certificate status treats missing or invalid dates as unrecorded', () => {
  assert.equal(certificateStatus('', TODAY), 'unrecorded');
  assert.equal(certificateStatus('not a date', TODAY), 'unrecorded');
  assert.equal(certificateStatus('2026-10-29', TODAY), 'expired');
  assert.equal(certificateStatus('2026-11-29', TODAY), 'expiring');
  assert.equal(certificateStatus('2026-12-01', TODAY), 'valid');
});

test('every matrix row has a published rule and a registered sheet code', () => {
  for (const row of controlMatrix({}, TODAY)) { assert.ok(MATRIX_RULES[row.id]); assert.ok(SHEETS[row.id]); }
  assert.equal(sheetCode('inspections', 2), 'QA-02.2');
  assert.equal(sheetFor('unknown').code, 'PRJ');
  assert.equal(new Set(Object.values(SHEETS).map(sheet => sheet.code)).size, Object.keys(SHEETS).length);
});
