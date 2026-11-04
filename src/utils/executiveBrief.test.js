import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BRIEF_SECTION_IDS, buildBrief, normaliseBriefSections } from './executiveBrief.js';
import { briefFileName, createBriefPdf } from './briefPdf.js';

const records = {
  projectName: 'Tower B', date: '2026-11-04',
  tasks: [
    { id: 't1', activity: 'Piling', status: 'done', startDate: '2026-10-01', endDate: '2026-10-10', progress: 100 },
    { id: 't2', activity: 'Slab', status: 'blocked', blocker: 'Awaiting RE', startDate: '2026-11-01', endDate: '2026-11-20', progress: 0 },
  ],
  inspections: [{ id: 'RFI-1', element: 'Column C4', status: 'opened' }, { id: 'RFI-2', element: 'Pile cap', status: 'closed' }],
  materials: [{ id: 'm1', reference: 'DO-1', element: 'Concrete', status: 'Delayed', deliveryDate: '2026-11-02' }, { id: 'm2', reference: 'DO-2', element: 'Rebar', status: 'Received' }],
  lifts: [{ id: 'l1', status: 'ACTIVE' }, { id: 'l2', status: 'SUSPENDED' }],
  diary: [{ id: 'd1', date: '2026-11-01', title: 'Rain', details: 'Stopped works' }],
};

test('brief sections keep known ids in canonical order and default to everything', () => {
  assert.deepEqual(normaliseBriefSections(null), BRIEF_SECTION_IDS);
  assert.deepEqual(normaliseBriefSections('bad'), BRIEF_SECTION_IDS);
  assert.deepEqual(normaliseBriefSections(['diary', 'unknown', 'summary']), ['summary', 'diary']);
  assert.deepEqual(normaliseBriefSections([]), []);
});

test('brief content is built only from recorded data', () => {
  const brief = buildBrief(records);
  assert.equal(brief.projectName, 'Tower B');
  assert.deepEqual(brief.blocked, ['Slab (Awaiting RE)']);
  assert.deepEqual(brief.materials, ['DO-1: Concrete (Delayed)']);
  assert.equal(brief.openInspections.length, 1);
  assert.match(brief.openInspections[0], /^RFI-1: Column C4/);
  assert.equal(brief.lifting, '1 active of 2 recorded.');
  assert.equal(brief.metrics.find(([label]) => label === 'RFIs cleared')[1], '1/2');
  assert.equal(brief.diary[0].title, 'Rain');
  assert.ok(brief.schedule.length >= 3);
  assert.equal(buildBrief({ date: '2026-11-04' }).projectName, 'Selected project');
});

test('brief PDF is generated for the selected sections', async () => {
  const brief = buildBrief(records);
  const blob = await createBriefPdf(brief, ['summary', 'gantt', 'blocked']);
  const head = new TextDecoder().decode((await blob.arrayBuffer()).slice(0, 5));
  assert.equal(head, '%PDF-');
  assert.equal(briefFileName(brief), 'Tower-B-executive-brief-2026-11-04.pdf');
});
