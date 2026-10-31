export const PLANNING_ROLES = ['admin', 'manager', 'engineer'];
export const SITE_ROLES = [...PLANNING_ROLES, 'supervisor'];
export const ROLES = ['guest', 'supervisor', 'engineer', 'manager', 'RE', 'RTO', 'admin'];
export const canPlan = user => PLANNING_ROLES.includes(user?.systemRole);
export const canRecordSite = user => SITE_ROLES.includes(user?.systemRole);
export const canWrite = (user, collection) => collection === 'monitoring' || collection === 'users'
  ? user?.systemRole === 'admin'
  : collection === 'weatherLogs' || collection === 'materials'
    ? canRecordSite(user) : collection === 'inspections' ? canRecordSite(user) : ['tasks', 'zones', 'lifts'].includes(collection) && canPlan(user);
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const dayNumber = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const n = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === value ? n / 86400000 : null;
};
export const percent = value => Math.min(100, Math.max(0, Number(value) || 0));
export const recorded = value => value !== '' && value !== undefined && value !== null;
export function latestObservation(observations) {
  return [...observations].filter(o => o.confirmedAt && o.observedAt).sort((a, b) => b.observedAt.localeCompare(a.observedAt) || b.confirmedAt.localeCompare(a.confirmedAt))[0] || null;
}
export function taskProgress(task) {
  return taskStatus(task) === 'done' ? 100 : percent(task.progress);
}
export function projectProgress(tasks, at = today()) {
  const dated = tasks.filter(t => dayNumber(t.startDate) !== null && dayNumber(t.endDate) !== null && t.endDate >= t.startDate);
  const weight = t => Math.max(1, dayNumber(t.endDate) - dayNumber(t.startDate) + 1);
  const total = dated.reduce((s, t) => s + weight(t), 0);
  const current = dayNumber(at);
  return {
    dated,
    actual: total ? dated.reduce((s, t) => s + taskProgress(t) * weight(t), 0) / total : null,
    planned: total && current !== null ? dated.reduce((s, t) => s + Math.min(1, Math.max(0, (current - dayNumber(t.startDate) + 1) / weight(t))) * 100 * weight(t), 0) / total : null,
  };
}
export function taskConstraints(task, { inspections = [], materials = [], tasks = [] } = {}) {
  const issues = [];
  if (task.predecessorId) {
    const predecessor = tasks.find(t => t.id === task.predecessorId);
    if (!predecessor || taskProgress(predecessor) < 100) issues.push('Predecessor incomplete');
  }
  if (task.inspectionId) {
    const rfi = inspections.find(i => i.id === task.inspectionId);
    if (!isInspectionClosed(rfi)) issues.push('Inspection not cleared');
  }
  if (task.materialId) {
    const m = materials.find(m => m.id === task.materialId);
    if (!m || !['Received', 'Installed', 'Poured'].includes(m.status)) issues.push('Material not received');
  }
  if (task.blocker) issues.push(task.blocker);
  return issues;
}
export function scheduleRows({ tasks = [], inspections = [], materials = [], diary = [], lifts = [] }) {
  return [
    ...tasks.map(t => ({ id: `task-${t.id}`, label: t.activity || t.wbs || t.id, start: t.startDate, end: t.endDate, progress: taskProgress(t), kind: 'Activity', detail: `${t.zone || 'No zone'} · ${t.status || 'Not recorded'}` })),
    ...inspections.map(i => ({ id: `rfi-${i.id}`, label: i.element || i.id, start: i.targetCast?.slice(0, 10), kind: 'Inspection', detail: isInspectionClosed(i) ? 'Closed' : 'Pending' })),
    ...materials.flatMap(m => [
      ...(m.deliveryDate ? [{ id: `material-target-${m.id}`, label: m.reference || m.id, start: m.deliveryDate, kind: `${m.type || 'Material'} delivery target`, detail: m.status || 'Not recorded' }] : []),
      ...(m.actualDate ? [{ id: `material-receipt-${m.id}`, label: m.reference || m.id, start: m.actualDate, kind: `${m.type || 'Material'} receipt`, detail: m.status || 'Not recorded' }] : []),
    ]),
    ...diary.map(d => ({ id: `diary-${d.id}`, label: d.title || d.event || 'Site record', start: d.date, kind: 'Diary', detail: d.category || 'Site activity' })),
    ...lifts.map(l => ({ id: `lift-${l.id}`, label: l.crane || l.id, start: l.date, kind: 'Lifting', detail: l.status || 'Not recorded' })),
  ].filter(r => dayNumber(r.start) !== null && (!r.end || dayNumber(r.end) !== null && r.end >= r.start))
    .map(r => ({ ...r, end: r.end || r.start })).sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
}
export function validateTask(task, tasks = []) {
  if (!task.activity?.trim() || !task.zone || !task.owner?.trim()) return 'Enter an activity, zone and responsible person.';
  if (dayNumber(task.startDate) === null || dayNumber(task.endDate) === null || task.endDate < task.startDate) return 'Enter valid dates with finish on or after start.';
  if (task.progress === '' || !Number.isFinite(Number(task.progress)) || Number(task.progress) < 0 || Number(task.progress) > 100) return 'Progress must be between 0 and 100.';
  const visited = new Set([task.id]);
  let next = task.predecessorId;
  while (next) {
    if (visited.has(next)) return 'Activity dependencies cannot contain a cycle.';
    visited.add(next);
    next = tasks.find(t => t.id === next)?.predecessorId;
  }
  return '';
}
export function validateMaterial(item) {
  if (!item.type || !item.reference?.trim() || !item.element?.trim() || !item.supplier?.trim() || !item.zone) return 'Enter the record type, reference, element, supplier and zone.';
  if (!Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0 || !item.unit?.trim()) return 'Enter a positive quantity and unit.';
  if (dayNumber(item.deliveryDate) === null) return 'Enter a valid required delivery date.';
  if (['Received', 'Installed', 'Poured'].includes(item.status) && (!item.doNumber?.trim() || dayNumber(item.actualDate) === null)) return 'Received records need a delivery order reference and actual receipt date.';
  if (item.type === 'BBS' && (!item.drawingRef?.trim() || !item.barMark?.trim() || Number(item.barDiameter) <= 0 || !Number.isFinite(Number(item.barDiameter)) || Number(item.cuttingLength) <= 0 || !Number.isFinite(Number(item.cuttingLength)) || Number(item.barCount) <= 0 || !Number.isInteger(Number(item.barCount)))) return 'BBS records need a drawing/revision, bar mark, positive diameter, cutting length and whole bar count.';
  if (item.status === 'Poured' && item.type !== 'Concrete' || item.status === 'Installed' && item.type !== 'BBS') return 'Select a status appropriate for the record type.';
  if (item.actualDate && (dayNumber(item.actualDate) === null || item.actualDate > today())) return 'Actual receipt date must be a valid date on or before today.';
  if (item.type === 'Concrete' && (!item.grade?.trim() || !item.pourLocation?.trim())) return 'Concrete records need a mix grade and pour location.';
  if (item.type === 'Concrete' && ['Received', 'Poured'].includes(item.status) && !item.batchTicket?.trim()) return 'Received concrete needs a batch ticket for traceability.';
  if (item.type === 'Delivery Order' && !item.doNumber?.trim()) return 'Enter the delivery order reference.';
  return '';
}

// Read both the existing board statuses and records created by the monitoring branch.
export const TASK_STATUSES = [
  ['lookahead', 'Lookahead (Backlog)'], ['make_ready', 'Make-Ready'],
  ['in_progress', 'In Progress (Sprint)'], ['blocked', 'Blocked'], ['done', 'Done'],
];
export function taskStatus(task) {
  const legacy = { Backlog: 'lookahead', Ready: 'make_ready', 'In progress': 'in_progress', Blocked: 'blocked', Done: 'done' };
  return legacy[task.status] || (TASK_STATUSES.some(([id]) => id === task.status) ? task.status : 'lookahead');
}
export const INSPECTION_STAGES = ['Created (Creator)', 'Under RE Review (RE)', 'Site Inspection (Creator)', 'Applying for Closure (RE)', 'Closed'];
export const isInspectionClosed = inspection => inspection?.stage === 4;
export function canAdvanceInspection(user, inspection) {
  if (!inspection || !Number.isInteger(inspection.stage) || inspection.stage < 0 || inspection.stage >= 4) return false;
  if (user?.systemRole === 'admin') return true;
  if ([1, 3].includes(inspection.stage)) return user?.systemRole === 'RE';
  return canRecordSite(user);
}
export const canEditInspection = (user, inspection) => user?.systemRole === 'admin'
  || canRecordSite(user) && inspection?.createdBy === user?.email;
export const canCommentInspection = user => ROLES.includes(user?.systemRole);
export function createMemberProfile(user, details = {}, isOwner = false, timestamp = new Date().toISOString()) {
  return {
    name: user.displayName || user.email, email: user.email.toLowerCase(),
    role: typeof details.designation === 'string' ? details.designation : '',
    birthday: typeof details.birthday === 'string' ? details.birthday : '',
    organization: '', category: '', statutoryReg: '', certExpiry: '', bizSafe: '',
    cdePermission: 'Project member', ptwAuthority: [], systemRole: isOwner ? 'admin' : 'pending',
    createdBy: user.email, createdAt: timestamp,
  };
}
