// Practice-area control matrix. Every status is derived from recorded project data using the
// rules below; nothing is estimated, forecast or filled in. "No records" is a status of its own.
import { isInspectionClosed, projectProgress, taskStatus } from './siteData.js';

export const MATRIX_RULES = {
  calendar: 'Action when any activity is marked blocked.',
  inspections: 'Watch while any RFI is not yet closed.',
  materials: 'Action when any material record is delayed or rejected.',
  diary: 'Watch when delay events have been recorded.',
  lifting: 'Action on an expired personnel certificate; watch when one expires within 30 days.',
  users: 'Watch while any member has no assigned project role.',
};

const DAY = 86400000;
export function certificateStatus(expiry, today) {
  if (!expiry || !Number.isFinite(Date.parse(expiry))) return 'unrecorded';
  const days = Math.ceil((Date.parse(expiry) - Date.parse(`${today}T00:00:00Z`)) / DAY);
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'valid';
}

const row = (id, total, attention, status, summary, attentionLabel) => ({
  id, total, attention, attentionLabel, summary,
  status: total === 0 ? 'none' : status,
});

export function controlMatrix({ tasks = [], inspections = [], materials = [], diary = [], lifts = [], users = [] }, today) {
  const blocked = tasks.filter(t => taskStatus(t) === 'blocked').length;
  const progress = projectProgress(tasks).actual;
  const openRfis = inspections.filter(i => !isInspectionClosed(i)).length;
  const delayedMaterials = materials.filter(m => ['Delayed', 'Rejected'].includes(m.status)).length;
  const received = materials.filter(m => ['Received', 'Installed', 'Poured'].includes(m.status)).length;
  const delayEvents = diary.filter(d => d.category === 'Delay').length;
  const activePermits = lifts.filter(l => l.status === 'ACTIVE').length;
  const certs = users.map(u => certificateStatus(u.certExpiry, today));
  const expired = certs.filter(s => s === 'expired').length;
  const expiring = certs.filter(s => s === 'expiring').length;
  const unassigned = users.filter(u => !u.systemRole || ['guest', 'pending'].includes(u.systemRole)).length;
  return [
    row('calendar', tasks.length, blocked, blocked ? 'action' : 'clear',
      `${tasks.length} activities · ${progress === null ? 'progress not recorded' : `${progress.toFixed(1)}% recorded progress`}`, 'blocked'),
    row('inspections', inspections.length, openRfis, openRfis ? 'watch' : 'clear',
      `${inspections.length - openRfis} of ${inspections.length} RFIs closed`, 'open'),
    row('materials', materials.length, delayedMaterials, delayedMaterials ? 'action' : 'clear',
      `${received} of ${materials.length} records received`, 'delayed / rejected'),
    row('diary', diary.length, delayEvents, delayEvents ? 'watch' : 'clear',
      `${diary.length} site entries recorded`, 'delay events'),
    row('lifting', lifts.length + users.length, expired + expiring, expired ? 'action' : expiring ? 'watch' : 'clear',
      `${activePermits} of ${lifts.length} lifting permits active`, 'certificate alerts'),
    row('users', users.length, unassigned, unassigned ? 'watch' : 'clear',
      `${users.length} registered project members`, 'without role'),
  ];
}

export const STATUS_LABEL = { clear: 'Clear', watch: 'Watch', action: 'Action', none: 'No records' };
export const STATUS_TONE = { clear: 'success', watch: 'warning', action: 'danger', none: undefined };
