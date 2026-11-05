// Executive brief: the sections a user can tick, and the recorded data each one shows. The same
// structure feeds the on-screen preview, browser printing and the generated PDF.
import { projectProgress, isInspectionClosed, inspectionStatusLabel, taskStatus, scheduleRows, today, creatorName } from './siteData.js';
import { formatDateTime, rfiLastComment, rfiLastUpdate, rfiResponsible } from './rfiStages.js';

export const BRIEF_SECTIONS = [
  { id: 'summary', label: 'Progress summary', hint: 'Recorded vs planned progress, RFIs cleared, site entries' },
  { id: 'gantt', label: 'Project Gantt chart', hint: 'Activities and dated site milestones' },
  { id: 'blocked', label: 'Blocked activities', hint: 'Activities marked blocked and their blockers' },
  { id: 'materials', label: 'Delayed / rejected materials', hint: 'Material records needing follow-up' },
  { id: 'inspections', label: 'Open inspections (RFIs)', hint: 'Current stage, person responsible, last update and last comment' },
  { id: 'lifting', label: 'Lifting permits', hint: 'Active and recorded lifting permits' },
  { id: 'diary', label: 'Recent diary entries', hint: 'Latest five records: date, time, creator and follow-up' },
];
export const BRIEF_SECTION_IDS = BRIEF_SECTIONS.map(s => s.id);
export const BRIEF_STORAGE_KEY = 'proximastruc-brief-sections';

/** Keeps only known section ids, in the canonical order; anything unreadable falls back to every section. */
export function normaliseBriefSections(value) {
  if (!Array.isArray(value)) return [...BRIEF_SECTION_IDS];
  return BRIEF_SECTION_IDS.filter(id => value.includes(id));
}

/** An open RFI as the brief shows it: where it is, who must act and its latest activity. */
export function briefInspection(rfi, people = []) {
  const last = rfiLastUpdate(rfi, people);
  const comment = rfiLastComment(rfi, people);
  return {
    id: rfi.id,
    element: rfi.element || 'Element not recorded',
    stage: inspectionStatusLabel(rfi),
    responsible: rfiResponsible(rfi, people),
    lastUpdated: last ? `${formatDateTime(last.timestamp)}${last.by ? ` by ${last.by}` : ''}` : 'Not recorded',
    lastComment: comment ? { text: comment.text, meta: `${comment.by}${comment.role ? ` (${comment.role})` : ''} · ${formatDateTime(comment.timestamp) || 'time not recorded'} · ${comment.stage}` } : null,
  };
}

const diaryMoment = entry => `${entry.date || ''} ${entry.time || entry.timeWindow || ''}`.trim() || entry.createdAt || '';
export function briefDiaryEntry(entry, people = []) {
  return {
    id: entry.id,
    date: entry.date || 'Date not recorded',
    time: entry.time || entry.timeWindow || 'Time not recorded',
    title: entry.title || entry.event || 'Site record',
    details: entry.details || entry.impact || '',
    createdBy: creatorName(entry, people) || 'Not recorded',
    followUp: entry.action?.trim() || 'None recorded',
  };
}

export function buildBrief({ projectName, tasks = [], inspections = [], diary = [], materials = [], lifts = [], people = [], date = today() }) {
  const { actual, planned } = projectProgress(tasks, date);
  const recentDiary = [...diary].sort((a, b) => diaryMoment(b).localeCompare(diaryMoment(a))).slice(0, 5);
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
    openInspections: inspections.filter(i => !isInspectionClosed(i)).map(i => briefInspection(i, people)),
    lifting: `${lifts.filter(l => l.status === 'ACTIVE').length} active of ${lifts.length} recorded.`,
    diary: recentDiary.map(d => briefDiaryEntry(d, people)),
    schedule: scheduleRows({ tasks, inspections, materials, diary, lifts }),
  };
}

export const BRIEF_NOTE = 'Progress is duration-weighted across activities with valid planned dates. Times are site time (SGT). Missing records do not establish compliance or clearance.';
