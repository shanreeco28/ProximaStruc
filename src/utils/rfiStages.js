// RFI stage records: who moved an RFI into each stage, the comments made while it sat there, who is
// responsible now and its latest activity. Shared by the RFI page, the printable RFI and the executive brief.
import {
  RFI_CLOSE_REJECTED_HISTORY, RFI_STATUSES, RFI_TRANSITIONS, creatorName, inspectionStatus, inspectionStatusLabel,
  isInspectionClosedRejected, personName, rfiStatusLabel,
} from './siteData.js';

/** Workflow stages in order, plus the rejected holding stage (rectification: roll back or close). */
export const RFI_STAGE_GROUPS = [
  ...RFI_STATUSES.map((status, index) => ({ id: status.id, label: status.label, number: index + 1 })),
  { id: 'rejected', label: 'Rejected', number: null },
];
const STAGE_IDS = RFI_STAGE_GROUPS.map(stage => stage.id);
export const isRfiStage = value => STAGE_IDS.includes(value);
export const rfiStageLabel = id => id === 'rejected' ? 'Rejected' : rfiStatusLabel(id);

const SGT_DATE = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit' });
const SGT_TIME = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Singapore', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
/** "2026-11-05 14:30" in site time (Singapore), or '' when the value is not a valid date. */
export function formatDateTime(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? `${SGT_DATE.format(date)} ${SGT_TIME.format(date)}` : '';
}
const time = value => { const t = value ? new Date(value).getTime() : NaN; return Number.isNaN(t) ? null : t; };

/** The stage an audit-history entry moved the RFI into, read from its recorded action text. */
export function historyStageOf(entry) {
  const action = entry?.action || '';
  const transition = Object.values(RFI_TRANSITIONS).find(t => t.history === action);
  if (transition) return transition.to;
  if (action.startsWith('Rejected at ')) return 'rejected';
  if (action === RFI_CLOSE_REJECTED_HISTORY) return 'closed';
  const rolledBack = /^(?:Site owner rolled|Rolled) back to (.+)$/.exec(action);
  if (rolledBack) return RFI_STATUSES.find(s => s.label === rolledBack[1])?.id || null;
  return null;
}

const actorName = (entry, people) => entry?.user || personName(entry?.email, people) || 'Not recorded';

/**
 * Stage timeline from the audit history: [{ stage, from }] in time order. The first stage is where the RFI was
 * created (a draft when its first recorded step opened it); without history it is the current stage.
 */
function stageTimeline(rfi) {
  const history = (rfi.history || []).map(entry => ({ entry, stage: historyStageOf(entry), at: time(entry.timestamp) }))
    .filter(item => item.stage);
  const first = history[0];
  const initial = !first ? inspectionStatus(rfi) || 'draft' : first.stage === 'opened' ? 'draft' : 'opened';
  return [{ stage: initial, from: -Infinity }, ...history.map(item => ({ stage: item.stage, from: item.at ?? -Infinity }))];
}

/** The stage a comment belongs to: the stage recorded with it, otherwise the stage the RFI was at when it was posted. */
export function commentStage(comment, timeline) {
  if (isRfiStage(comment?.stage)) return comment.stage;
  const at = time(comment?.timestamp);
  if (at === null) return timeline[timeline.length - 1].stage;
  let stage = timeline[0].stage;
  for (const step of timeline) if (step.from <= at) stage = step.stage;
  return stage;
}

/**
 * Comments and stage updates grouped by stage, in workflow order. Each group lists who moved the RFI into that
 * stage (and when, with any reason) and the comments posted while it was at that stage. Only stages the RFI has
 * reached, or that hold comments, are returned; the current stage is always included and flagged.
 */
export function rfiStageLog(rfi, people = []) {
  const current = inspectionStatus(rfi) || 'draft';
  const timeline = stageTimeline(rfi);
  const groups = Object.fromEntries(RFI_STAGE_GROUPS.map(stage => [stage.id, { ...stage, current: stage.id === current, updates: [], comments: [] }]));
  if (rfi.createdAt || rfi.createdBy || rfi.createdByName) {
    groups[timeline[0].stage].updates.push({
      kind: 'created', action: timeline[0].stage === 'draft' ? 'Created RFI as draft' : 'Created and opened RFI',
      by: creatorName(rfi, people) || 'Not recorded', role: '', timestamp: rfi.createdAt || '', reason: '',
    });
  }
  for (const entry of rfi.history || []) {
    const stage = historyStageOf(entry) || current;
    groups[stage].updates.push({ kind: 'history', action: entry.action || 'Stage updated', by: actorName(entry, people), role: entry.role || '', timestamp: entry.timestamp || '', reason: entry.reason || '' });
  }
  for (const comment of rfi.comments || []) {
    groups[commentStage(comment, timeline)].comments.push({ by: actorName(comment, people), role: comment.role || '', text: comment.text || '', timestamp: comment.timestamp || '' });
  }
  const byTime = (a, b) => (time(a.timestamp) ?? 0) - (time(b.timestamp) ?? 0);
  const ordered = items => [...items].sort(byTime).map(item => ({ ...item, when: formatDateTime(item.timestamp) }));
  return RFI_STAGE_GROUPS.map(stage => groups[stage.id])
    .filter(group => group.current || group.updates.length || group.comments.length)
    .map(group => ({ ...group, updates: ordered(group.updates), comments: ordered(group.comments) }));
}

/** Who must act next on the RFI, from its current stage. */
export function rfiResponsible(rfi, people = []) {
  const status = inspectionStatus(rfi);
  const raiser = creatorName(rfi, people);
  const site = raiser ? `${raiser} (Engineer / Manager)` : 'Engineer / Manager';
  if (status === 'closed') return isInspectionClosedRejected(rfi) ? 'None: closed as rejected' : 'None: RFI closed';
  if (status === 're_review' || status === 'closure_applied') return rfi.reName?.trim() ? `${rfi.reName.trim()} (RE)` : 'RE (not assigned)';
  if (status === 'site_inspection') return 'RTO on duty';
  if (status === 'rejected') return `${site}: roll back or close`;
  return status ? site : 'Not recorded';
}

/** Latest recorded activity on the RFI: { timestamp, by }. */
export function rfiLastUpdate(rfi, people = []) {
  const candidates = [
    ...(rfi.history || []).map(entry => ({ timestamp: entry.timestamp, by: actorName(entry, people) })),
    ...(rfi.comments || []).map(comment => ({ timestamp: comment.timestamp, by: actorName(comment, people) })),
    { timestamp: rfi.updatedAt, by: personName(rfi.updatedBy, people) },
    { timestamp: rfi.createdAt, by: creatorName(rfi, people) },
  ].filter(item => time(item.timestamp) !== null);
  // Named entries come first, so on a tie (a stage change also stamps updatedAt) the person's name wins.
  return candidates.reduce((latest, item) => !latest || time(item.timestamp) > time(latest.timestamp) ? item : latest, null);
}

/** The most recent comment with the stage it was filed under, or null. */
export function rfiLastComment(rfi, people = []) {
  const comments = rfi.comments || [];
  if (!comments.length) return null;
  const timeline = stageTimeline(rfi);
  const latest = comments.reduce((last, comment) => !last || (time(comment.timestamp) ?? -Infinity) >= (time(last.timestamp) ?? -Infinity) ? comment : last, null);
  return { text: latest.text || '', by: actorName(latest, people), role: latest.role || '', timestamp: latest.timestamp || '', stage: rfiStageLabel(commentStage(latest, timeline)) };
}

/** Everything a printed RFI shows: its details, where it stands now and the stage-by-stage record. */
export function buildRfiReport(rfi, { people = [], projectName = '', printedAt = new Date().toISOString() } = {}) {
  const last = rfiLastUpdate(rfi, people);
  const rtoEntry = [...(rfi.history || [])].reverse().find(h => h.action === RFI_TRANSITIONS.site_inspection.history);
  return {
    id: rfi.id,
    projectName: projectName || 'Selected project',
    element: rfi.element || 'Element not recorded',
    stage: inspectionStatusLabel(rfi),
    responsible: rfiResponsible(rfi, people),
    printedAt: formatDateTime(printedAt),
    details: [
      ['Discipline', rfi.discipline || 'Not recorded'],
      ['Zone', rfi.zone || 'Not recorded'],
      ['Current stage', inspectionStatusLabel(rfi)],
      ['Responsible now', rfiResponsible(rfi, people)],
      ['Assigned RE', rfi.reName || 'Not recorded'],
      ['RTO site inspection', rtoEntry ? `${actorName(rtoEntry, people)} · ${formatDateTime(rtoEntry.timestamp)}` : 'Not yet carried out'],
      ['Target concrete pour', rfi.targetCast || 'Not recorded'],
      ['Linked BBS', rfi.bbsLinked || 'Not recorded'],
      ['Created by', `${creatorName(rfi, people) || 'Not recorded'}${rfi.createdAt ? ` · ${formatDateTime(rfi.createdAt)}` : ''}`],
      ['Last updated', last ? `${formatDateTime(last.timestamp)}${last.by ? ` by ${last.by}` : ''}` : 'Not recorded'],
    ],
    attachments: (rfi.attachments || []).map(file => `${file.name || 'document.pdf'} (${file.category || 'PDF'})`),
    stages: rfiStageLog(rfi, people),
  };
}
