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
  inspections: [
    { id: 'RFI-1', element: 'Column C4', status: 're_review', reName: 'Jane Lim', createdBy: 'eng@example.test', createdAt: '2026-11-02T01:00:00.000Z',
      history: [{ user: 'Eng Person', role: 'engineer', action: 'Submitted for RE review', timestamp: '2026-11-03T02:00:00.000Z' }],
      comments: [
        { user: 'Eng Person', role: 'engineer', text: 'Ready', timestamp: '2026-11-02T03:00:00.000Z' },
        { user: 'Jane Lim', role: 'RE', text: 'Cover blocks missing at C4', stage: 're_review', timestamp: '2026-11-03T09:45:00.000Z' },
      ],
      updatedBy: 'jane@example.test', updatedAt: '2026-11-03T09:45:00.000Z' },
    { id: 'RFI-2', element: 'Pile cap', status: 'closed' },
  ],
  materials: [{ id: 'm1', reference: 'DO-1', element: 'Concrete', status: 'Delayed', deliveryDate: '2026-11-02' }, { id: 'm2', reference: 'DO-2', element: 'Rebar', status: 'Received' }],
  lifts: [{ id: 'l1', status: 'ACTIVE' }, { id: 'l2', status: 'SUSPENDED' }],
  diary: [{ id: 'd1', date: '2026-11-01', time: '07:30', title: 'Rain', details: 'Stopped works', createdBy: 'sam@example.test', createdByName: 'Sam Tan', action: 'Supervisor to pump out pit' }],
};
const people = [{ id: 'eng@example.test', email: 'eng@example.test', name: 'Eng Person' }];

test('brief sections keep known ids in canonical order and default to everything', () => {
  assert.deepEqual(normaliseBriefSections(null), BRIEF_SECTION_IDS);
  assert.deepEqual(normaliseBriefSections('bad'), BRIEF_SECTION_IDS);
  assert.deepEqual(normaliseBriefSections(['diary', 'unknown', 'summary']), ['summary', 'diary']);
  assert.deepEqual(normaliseBriefSections([]), []);
});

test('brief content is built only from recorded data', () => {
  const brief = buildBrief({ ...records, people });
  assert.equal(brief.projectName, 'Tower B');
  assert.deepEqual(brief.blocked, ['Slab (Awaiting RE)']);
  assert.deepEqual(brief.materials, ['DO-1: Concrete (Delayed)']);
  assert.equal(brief.openInspections.length, 1);
  assert.deepEqual(brief.openInspections[0], {
    id: 'RFI-1', element: 'Column C4', stage: 'Under RE Review', responsible: 'Jane Lim (RE)',
    lastUpdated: '2026-11-03 17:45 by Jane Lim',
    lastComment: { text: 'Cover blocks missing at C4', meta: 'Jane Lim (RE) · 2026-11-03 17:45 · Under RE Review' },
  });
  assert.equal(brief.lifting, '1 active of 2 recorded.');
  assert.equal(brief.metrics.find(([label]) => label === 'RFIs cleared')[1], '1/2');
  assert.deepEqual(brief.diary[0], { id: 'd1', date: '2026-11-01', time: '07:30', title: 'Rain', details: 'Stopped works', createdBy: 'Sam Tan', followUp: 'Supervisor to pump out pit' });
  assert.equal(buildBrief({ ...records, diary: [{ id: 'd2', title: 'Legacy', createdBy: 'eng@example.test' }], people }).diary[0].createdBy, 'Eng Person');
  assert.equal(buildBrief({ ...records, diary: [{ id: 'd3', title: 'Note' }] }).diary[0].followUp, 'None recorded');
  assert.ok(brief.schedule.length >= 3);
  assert.equal(buildBrief({ date: '2026-11-04' }).projectName, 'Selected project');
});

test('brief PDF is generated for the selected sections', async () => {
  const brief = buildBrief(records);
  const blob = await createBriefPdf(brief, ['summary', 'gantt', 'blocked', 'inspections', 'diary']);
  const head = new TextDecoder().decode((await blob.arrayBuffer()).slice(0, 5));
  assert.equal(head, '%PDF-');
  assert.equal(briefFileName(brief), 'Tower-B-executive-brief-2026-11-04.pdf');
});
