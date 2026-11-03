export const PLANNING_ROLES = ['admin', 'manager', 'engineer'];
export const SITE_ROLES = [...PLANNING_ROLES, 'supervisor'];
export const ROLES = ['guest', 'supervisor', 'engineer', 'manager', 'RE', 'RTO', 'admin'];
export const canPlan = user => PLANNING_ROLES.includes(user?.systemRole);
export const canRecordSite = user => SITE_ROLES.includes(user?.systemRole);
export const canWrite = (user, collection) => collection === 'monitoring' || collection === 'users'
  ? user?.systemRole === 'admin'
  : collection === 'weatherLogs' || collection === 'materials'
    ? canRecordSite(user) : collection === 'inspections' ? canRaiseRfi(user) : ['tasks', 'zones', 'lifts'].includes(collection) && canPlan(user);
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
    ...inspections.map(i => ({ id: `rfi-${i.id}`, label: i.element || i.id, start: i.targetCast?.slice(0, 10), kind: 'Inspection', detail: isInspectionClosed(i) ? 'Closed' : inspectionStatusLabel(i) })),
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
// RFI workflow: Draft → Opened → RE review → RTO site inspection → next work allowed → closure applied → closed.
export const RFI_RAISER_ROLES = PLANNING_ROLES;
export const canRaiseRfi = user => RFI_RAISER_ROLES.includes(user?.systemRole);
export const RFI_STATUSES = [
  { id: 'draft', label: 'Draft', owner: 'Engineer / Manager' },
  { id: 'opened', label: 'Opened', owner: 'Engineer / Manager' },
  { id: 're_review', label: 'Under RE Review', owner: 'RE' },
  { id: 'site_inspection', label: 'Site Inspection (RTO)', owner: 'RTO' },
  { id: 'next_work', label: 'Next Work Allowed', owner: 'Engineer / Manager' },
  { id: 'closure_applied', label: 'Closure Applied', owner: 'RE' },
  { id: 'closed', label: 'Closed', owner: '' },
];
export const INSPECTION_STAGES = RFI_STATUSES.map(s => s.label);
// Each transition: who may perform it, the button label and the audit-history text (mirrored in firestore.rules).
export const RFI_TRANSITIONS = {
  draft: { to: 'opened', actor: 'site', action: 'Open RFI', history: 'Opened RFI' },
  opened: { to: 're_review', actor: 'site', action: 'Submit for RE review', history: 'Submitted for RE review' },
  re_review: { to: 'site_inspection', actor: 'RE', action: 'Allow site inspection', history: 'RE allowed site inspection (RTO)' },
  site_inspection: { to: 'next_work', actor: 'RTO', action: 'Allow next work', history: 'RTO allowed next work' },
  next_work: { to: 'closure_applied', actor: 'site', action: 'Apply for RFI closure', history: 'Applied for RFI closure' },
  closure_applied: { to: 'closed', actor: 'RE', action: 'Approve RFI closure', history: 'RE approved closure — RFI closed' },
};
// Records from the earlier five-stage workflow stored a numeric `stage`; map them onto the current statuses.
const LEGACY_STAGE_STATUS = ['opened', 're_review', 'site_inspection', 'closure_applied', 'closed'];
export function inspectionStatus(inspection) {
  if (RFI_STATUSES.some(s => s.id === inspection?.status)) return inspection.status;
  return Number.isInteger(inspection?.stage) ? LEGACY_STAGE_STATUS[inspection.stage] || null : null;
}
export const inspectionStatusIndex = inspection => RFI_STATUSES.findIndex(s => s.id === inspectionStatus(inspection));
export const inspectionStatusLabel = inspection => RFI_STATUSES.find(s => s.id === inspectionStatus(inspection))?.label || 'Stage not recorded';
export const isInspectionClosed = inspection => inspectionStatus(inspection) === 'closed';
export const isInspectionDraft = inspection => inspectionStatus(inspection) === 'draft';
export const isInspectionOpen = inspection => !!inspectionStatus(inspection) && !['draft', 'closed'].includes(inspectionStatus(inspection));
export const nextInspectionTransition = inspection => RFI_TRANSITIONS[inspectionStatus(inspection)] || null;
export function canAdvanceInspection(user, inspection) {
  const transition = nextInspectionTransition(inspection);
  if (!transition) return false;
  if (user?.systemRole === 'admin') return true;
  return transition.actor === 'site' ? canRaiseRfi(user) : user?.systemRole === transition.actor;
}
export const canEditInspection = (user, inspection) => user?.systemRole === 'admin'
  || canRaiseRfi(user) && inspection?.createdBy === user?.email;
// PDFs can be attached while the RFI is a draft or opened, i.e. before it is submitted for RE review.
export const canManageInspectionFiles = (user, inspection) => canRaiseRfi(user) && ['draft', 'opened'].includes(inspectionStatus(inspection));
export const canRemoveInspectionFile = (user, inspection, file) => canManageInspectionFiles(user, inspection)
  && (user?.systemRole === 'admin' || inspection?.createdBy === user?.email || file?.uploadedBy === user?.email);
export const RFI_FILE_CATEGORIES = ['Inspection file', 'Reference'];
// PDFs are stored inside Firestore (free Spark plan) as binary chunks below the 1 MiB document limit.
export const RFI_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const RFI_CHUNK_BYTES = 900 * 1024;
export const RFI_MAX_CHUNKS = Math.ceil(RFI_MAX_FILE_BYTES / RFI_CHUNK_BYTES);
export const RFI_MAX_FILES = 20;
export function validateRfiFile(file, existingCount = 0) {
  if (!file) return 'Choose a PDF file.';
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name || '')) return 'Only PDF files can be attached.';
  if (!file.size) return 'The selected PDF is empty.';
  if (file.size > RFI_MAX_FILE_BYTES) return 'PDFs must be 10 MB or smaller.';
  if (existingCount >= RFI_MAX_FILES) return `An RFI can hold up to ${RFI_MAX_FILES} PDFs.`;
  return '';
}

// Automatic RFI references: <Project Name>_<Zone>-<Discipline code>-### (e.g. Marina Tower_Zone A-STR-001).
export const RFI_DISCIPLINES = [
  { name: 'Structural', code: 'STR' },
  { name: 'Architectural', code: 'AR' },
  { name: 'M&E Sleeve / Conduit', code: 'ME' },
];
export const disciplineCode = discipline => RFI_DISCIPLINES.find(d => d.name === discipline)?.code || '';
// Firestore/Storage path segments cannot hold slashes; keep names readable but strip unsafe characters.
export const rfiIdSegment = value => String(value || '').normalize('NFKC').replace(/[^\p{L}\p{N} ._()&+-]+/gu, '-').replace(/\s+/g, ' ').trim();
export function rfiPrefix(projectName, zone, discipline) {
  const project = rfiIdSegment(projectName), zoneName = rfiIdSegment(zone), code = disciplineCode(discipline);
  return project && zoneName && code ? `${project}_${zoneName}-${code}` : '';
}
export const formatRfiId = (prefix, number) => `${prefix}-${String(number).padStart(3, '0')}`;
export function highestRfiNumber(ids, prefix) {
  return ids.reduce((max, id) => {
    if (typeof id !== 'string' || !id.startsWith(`${prefix}-`)) return max;
    const seq = id.slice(prefix.length + 1);
    return /^\d{3,6}$/.test(seq) ? Math.max(max, Number(seq)) : max;
  }, 0);
}
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
