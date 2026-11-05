import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRfiReport, commentStage, formatDateTime, historyStageOf, rfiLastComment, rfiLastUpdate, rfiResponsible, rfiStageLog } from './rfiStages.js';
import { createRfiPdf, rfiFileName } from './rfiPdf.js';

const at = hour => `2026-11-0${Math.floor(hour / 24) + 1}T${String(hour % 24).padStart(2, '0')}:00:00.000Z`;
const rfi = {
  id: 'Tower_East-STR-001', element: 'Slab L3', zone: 'East', discipline: 'Structural', status: 'site_inspection', reName: 'Jane Lim',
  createdBy: 'eng@example.test', createdByName: 'Eng Person', createdAt: at(0),
  history: [
    { user: 'Eng Person', role: 'engineer', action: 'Opened RFI', timestamp: at(1) },
    { user: 'Eng Person', role: 'engineer', action: 'Submitted for RE review', timestamp: at(2) },
    { user: 'Jane Lim', role: 'RE', action: 'Rejected at Under RE Review', reason: 'Cover short', timestamp: at(3) },
    { user: 'Eng Person', role: 'engineer', action: 'Rolled back to Under RE Review', reason: 'Rectified', timestamp: at(5) },
    { user: 'Jane Lim', role: 'RE', action: 'RE allowed site inspection (RTO)', timestamp: at(6) },
  ],
  comments: [
    { user: 'Eng Person', role: 'engineer', text: 'Drafting', timestamp: at(0) },               // legacy: no stage, draft by time
    { user: 'Site Sup', role: 'supervisor', text: 'Rebar fixed', timestamp: at(4) },          // legacy: while rejected
    { user: 'Jane Lim', role: 'RE', text: 'Checked', stage: 're_review', timestamp: at(5) },  // recorded stage wins
    { user: 'RTO Ong', role: 'RTO', text: 'Inspecting at 3pm', stage: 'site_inspection', timestamp: at(7) },
  ],
};

test('history actions map back to the stage they moved the RFI into', () => {
  assert.equal(historyStageOf({ action: 'Opened RFI' }), 'opened');
  assert.equal(historyStageOf({ action: 'RE approved closure — RFI closed' }), 'closed');
  assert.equal(historyStageOf({ action: 'Rejected at Site Inspection (RTO)' }), 'rejected');
  assert.equal(historyStageOf({ action: 'Site owner rolled back to Closure Applied' }), 'closure_applied');
  assert.equal(historyStageOf({ action: 'Closed rejected RFI' }), 'closed');
  assert.equal(historyStageOf({ action: 'Something else' }), null);
});

test('comments are separated by stage, with who updated each stage', () => {
  const log = rfiStageLog(rfi);
  assert.deepEqual(log.map(s => s.id), ['draft', 'opened', 're_review', 'site_inspection', 'rejected']);
  const byId = Object.fromEntries(log.map(s => [s.id, s]));
  assert.deepEqual(byId.draft.comments.map(c => c.text), ['Drafting']);
  assert.equal(byId.draft.updates[0].action, 'Created RFI as draft');
  assert.equal(byId.draft.updates[0].by, 'Eng Person');
  assert.deepEqual(byId.rejected.comments.map(c => c.text), ['Rebar fixed']);
  assert.equal(byId.rejected.updates[0].reason, 'Cover short');
  assert.deepEqual(byId.re_review.updates.map(u => u.action), ['Submitted for RE review', 'Rolled back to Under RE Review']);
  assert.deepEqual(byId.re_review.comments.map(c => c.text), ['Checked']);
  assert.equal(byId.site_inspection.current, true);
  assert.deepEqual(byId.site_inspection.comments.map(c => `${c.by}|${c.role}|${c.when}`), ['RTO Ong|RTO|2026-11-01 15:00']);
  assert.equal(byId.site_inspection.updates[0].by, 'Jane Lim');
});

test('a new RFI shows its current stage even before any update or comment', () => {
  const log = rfiStageLog({ id: 'X', status: 'draft' });
  assert.deepEqual(log.map(s => [s.id, s.current, s.updates.length, s.comments.length]), [['draft', true, 0, 0]]);
  assert.equal(commentStage({ timestamp: 'bad' }, [{ stage: 'opened', from: -Infinity }]), 'opened');
});

test('responsible person, last update and last comment come from the current stage and records', () => {
  assert.equal(rfiResponsible(rfi), 'RTO on duty');
  assert.equal(rfiResponsible({ ...rfi, status: 're_review' }), 'Jane Lim (RE)');
  assert.equal(rfiResponsible({ ...rfi, status: 'closure_applied', reName: '' }), 'RE (not assigned)');
  assert.equal(rfiResponsible({ ...rfi, status: 'next_work' }), 'Eng Person (Engineer / Manager)');
  assert.equal(rfiResponsible({ status: 'rejected', rejectedFrom: 're_review', createdBy: 'a@example.test' }, [{ id: 'a@example.test', name: 'Ana' }]), 'Ana (Engineer / Manager): roll back or close');
  assert.equal(rfiResponsible({ status: 'closed' }), 'None: RFI closed');
  assert.deepEqual(rfiLastUpdate(rfi), { timestamp: at(7), by: 'RTO Ong' });
  assert.deepEqual(rfiLastUpdate({ updatedAt: at(9), updatedBy: 'x@example.test' }, [{ id: 'x@example.test', name: 'Xin' }]), { timestamp: at(9), by: 'Xin' });
  assert.equal(rfiLastUpdate({}), null);
  assert.deepEqual(rfiLastComment(rfi), { text: 'Inspecting at 3pm', by: 'RTO Ong', role: 'RTO', timestamp: at(7), stage: 'Site Inspection (RTO)' });
  assert.equal(rfiLastComment({ comments: [] }), null);
  assert.equal(formatDateTime('2026-11-05T06:30:00.000Z'), '2026-11-05 14:30');
  assert.equal(formatDateTime('nope'), '');
});

test('a printable RFI report and PDF are built from the recorded RFI', async () => {
  const report = buildRfiReport(rfi, { projectName: 'Tower', printedAt: at(8) });
  assert.equal(report.stage, 'Site Inspection (RTO)');
  assert.equal(report.printedAt, '2026-11-01 16:00');
  assert.ok(report.details.some(([label, value]) => label === 'Responsible now' && value === 'RTO on duty'));
  assert.equal(report.stages.length, 5);
  const blob = await createRfiPdf(report);
  assert.equal(new TextDecoder().decode((await blob.arrayBuffer()).slice(0, 5)), '%PDF-');
  assert.equal(rfiFileName(report), 'Tower_East-STR-001-rfi.pdf');
});
