// Executive brief: the sections a user can tick, and the recorded data each one shows. The same
// structure feeds the on-screen preview, browser printing and the generated PDF.
import { projectProgress, isInspectionClosed, inspectionStatusLabel, taskStatus, scheduleRows, today } from './siteData.js';

export const BRIEF_SECTIONS = [
  { id: 'summary', label: 'Progress summary', hint: 'Recorded vs planned progress, RFIs cleared, site entries' },
  { id: 'gantt', label: 'Project Gantt chart', hint: 'Activities and dated site milestones' },
  { id: 'blocked', label: 'Blocked activities', hint: 'Activities marked blocked and their blockers' },
  { id: 'materials', label: 'Delayed / rejected materials', hint: 'Material records needing follow-up' },
  { id: 'inspections', label: 'Open inspections (RFIs)', hint: 'RFIs not yet closed, with status' },
  { id: 'lifting', label: 'Lifting permits', hint: 'Active and recorded lifting permits' },
  { id: 'diary', label: 'Recent diary entries', hint: 'Latest five site diary records' },
];
export const BRIEF_SECTION_IDS = BRIEF_SECTIONS.map(s => s.id);
export const BRIEF_STORAGE_KEY = 'proximastruc-brief-sections';

/** Keeps only known section ids, in the canonical order; anything unreadable falls back to every section. */
export function normaliseBriefSections(value) {
  if (!Array.isArray(value)) return [...BRIEF_SECTION_IDS];
  return BRIEF_SECTION_IDS.filter(id => value.includes(id));
}

export function buildBrief({ projectName, tasks = [], inspections = [], diary = [], materials = [], lifts = [], date = today() }) {
  const { actual, planned } = projectProgress(tasks, date);
  const recentDiary = [...diary].sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || '')).slice(0, 5);
  return {
    projectName: projectName || 'Selected project',
    date,
    metrics: [
      ['Recorded progress', actual === null ? 'Not recorded' : `${actual.toFixed(1)}%`],
      ['Planned progress', planned === null ? 'Not recorded' : `${planned.toFixed(1)}%`],
      ['RFIs cleared', `${inspections.filter(i => isInspectionClosed(i)).length}/${inspections.length}`],
      ['Site entries', String(diary.length)],
    ],
    blocked: tasks.filter(t => taskStatus(t) === 'blocked').map(t => `${t.activity || t.wbs || t.id}${t.blocker ? ` (${t.blocker})` : ''}`),
    materials: materials.filter(m => ['Delayed', 'Rejected'].includes(m.status)).map(m => `${m.reference || m.id}: ${m.element || 'Element not recorded'} (${m.status})`),
    openInspections: inspections.filter(i => !isInspectionClosed(i)).map(i => `${i.id}: ${i.element || 'Element not recorded'} (${inspectionStatusLabel(i)})`),
    lifting: `${lifts.filter(l => l.status === 'ACTIVE').length} active of ${lifts.length} recorded.`,
    diary: recentDiary.map(d => ({ id: d.id, date: d.date || 'Date not recorded', title: d.title || d.event || 'Site record', details: d.details || d.impact || '' })),
    schedule: scheduleRows({ tasks, inspections, materials, diary, lifts }),
  };
}

export const BRIEF_NOTE = 'Progress is duration-weighted across activities with valid planned dates. Missing records do not establish compliance or clearance.';
