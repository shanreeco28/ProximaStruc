import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canPlan, canRecordSite, canWrite, dayNumber, projectProgress, scheduleRows, taskConstraints, validateTask, validateMaterial, latestObservation, taskStatus, taskProgress, canAdvanceInspection, canEditInspection, isInspectionClosed, createMemberProfile, inspectionStatus, inspectionStatusLabel, isInspectionOpen, nextInspectionTransition, RFI_STATUSES, canManageInspectionFiles, canRemoveInspectionFile, validateRfiFile, rfiPrefix, formatRfiId, highestRfiNumber, rfiIdSegment, diaryStatus, isDiaryDraft, recordedDiaryEntries, diaryEntryProblem, validateDiaryPhotoSource, canManageDiaryPhotos, canRemoveDiaryPhoto, DIARY_PHOTO_MAX, creatorName, personName, canRejectInspection, canResolveRejectedInspection, canRollbackClosedInspection, rfiRollbackTargets, isInspectionRejected, isInspectionClosedRejected, inspectionStatusIndex, rfiReasonProblem } from './siteData.js';

test('role permissions deny unknown users, protect admin observations, and separate planning from site records', () => {
  for (const role of ['admin','manager','engineer','supervisor','guest','RE','RTO',undefined]) {
    const u = { systemRole: role };
    assert.equal(canPlan(u), ['admin','manager','engineer'].includes(role));
    assert.equal(canRecordSite(u), ['admin','manager','engineer','supervisor'].includes(role));
    assert.equal(canWrite(u,'monitoring'), role === 'admin');
    assert.equal(canWrite(u,'users'), role === 'admin');
    assert.equal(canWrite(u,'unknown'), false);
    assert.equal(canWrite(u,'tasks'), canPlan(u));
    assert.equal(canWrite(u,'weatherLogs'), canRecordSite(u));
  }
});
test('missing data does not generate a default progress value or schedule', () => {
  assert.deepEqual(projectProgress([]), { dated: [], actual: null, planned: null });
  assert.deepEqual(scheduleRows({}), []);
  assert.equal(latestObservation([]), null);
  assert.equal(dayNumber('2026-02-30'), null);
});
test('progress weights inclusive duration and excludes legacy or invalid dates', () => {
  const tasks = [{ startDate:'2026-10-01', endDate:'2026-10-02', progress:50 }, { startDate:'2026-10-03', endDate:'2026-10-08', status:'Done' }, { startDate:'invalid', progress:90 }];
  const result = projectProgress(tasks, '2026-10-02');
  assert.equal(result.actual, 87.5); assert.equal(result.planned, 25); assert.equal(result.dated.length, 2);
  assert.equal(projectProgress(tasks,'2026-09-30').planned, 0);
  assert.equal(projectProgress(tasks,'2026-10-09').planned, 100);
});
test('Gantt includes each dated site source and excludes invalid records', () => {
  const rows = scheduleRows({ tasks:[{id:'a',startDate:'2026-10-01',endDate:'2026-10-03',progress:25}], inspections:[{id:'r',targetCast:'2026-10-02',stage:3}], materials:[{id:'m',deliveryDate:'2026-10-02'}], diary:[{id:'d',date:'2026-10-03'}], lifts:[{id:'l',date:'2026-10-04'}, {id:'bad',date:'tomorrow'}] });
  assert.equal(rows.length, 5); assert.equal(rows[0].progress, 25); assert.equal(rows.at(-1).kind,'Lifting');
});
test('linked constraints are calculated across inspections, materials and predecessors', () => {
  const task = {predecessorId:'p',inspectionId:'r',materialId:'m'};
  assert.equal(taskConstraints(task).length,3);
  assert.deepEqual(taskConstraints(task,{tasks:[{id:'p',status:'Done'}],inspections:[{id:'r',stage:4}],materials:[{id:'m',status:'Received'}]}), []);
});
test('task validation rejects inverted dates, invalid completion and circular dependencies', () => {
  const t = {id:'a',activity:'Slab',zone:'East',owner:'Team',startDate:'2026-10-01',endDate:'2026-10-03',progress:0};
  assert.equal(validateTask(t),'');
  assert.match(validateTask({...t,endDate:'2026-09-30'}),/dates/);
  assert.match(validateTask({...t,progress:101}),/Progress/);
  assert.match(validateTask({...t,predecessorId:'b'},[{id:'b',predecessorId:'a'}]),/cycle/);
});
test('materials require real traceability and receipt details', () => {
  const m = {type:'BBS',reference:'Tag',element:'Beam',supplier:'Supplier',zone:'East',quantity:5,unit:'t',deliveryDate:'2026-10-01',status:'Planned',drawingRef:'D1 rev1',barMark:'B1',barDiameter:'16',cuttingLength:'6000',barCount:'20'};
  assert.equal(validateMaterial(m),'');
  assert.match(validateMaterial({...m,barMark:''}),/BBS/);
  assert.match(validateMaterial({...m,status:'Received'}),/receipt date/);
  assert.equal(validateMaterial({...m,status:'Received',doNumber:'DO1',actualDate:'2026-10-02'}),'');
  assert.match(validateMaterial({...m,type:'Concrete'}),/mix grade/);
  assert.match(validateMaterial({...m,type:'Delivery Order'}),/delivery order/);
  assert.match(validateMaterial({...m,quantity:0}),/positive/);
});
test('only confirmed observations are selected by observed date, without mutating history', () => {
  const data=[{id:'old',observedAt:'2026-10-01',confirmedAt:'2026-10-05'},{id:'new',observedAt:'2026-10-02',confirmedAt:'2026-10-02'},{id:'draft',observedAt:'2026-10-03'}];
  assert.equal(latestObservation(data).id,'new');assert.equal(data[0].id,'old');
});

test('both persisted planning status formats retain completion and board placement', () => {
  for (const status of ['done', 'Done']) { assert.equal(taskProgress({status}),100); assert.equal(taskStatus({status}),'done'); }
  assert.equal(taskStatus({status:'in_progress'}),'in_progress');
  assert.equal(taskStatus({status:'In progress'}),'in_progress');
  assert.equal(taskStatus({status:'Blocked'}),'blocked');
});
test('RFI closure is reflected in planning constraints and chart milestones, including legacy records', () => {
  assert.equal(isInspectionClosed({stage:3}),false); assert.equal(isInspectionClosed({stage:4}),true);
  assert.equal(isInspectionClosed({status:'closure_applied'}),false); assert.equal(isInspectionClosed({status:'closed'}),true);
  const task = {inspectionId:'r'};
  assert.equal(taskConstraints(task,{inspections:[{id:'r',status:'next_work'}]}).length,1);
  assert.equal(taskConstraints(task,{inspections:[{id:'r',status:'closed'}]}).length,0);
  assert.equal(taskConstraints(task,{inspections:[{id:'r',stage:4}]}).length,0);
  const rows = scheduleRows({inspections:[{id:'r',status:'closed',targetCast:'2026-10-02'}]});
  assert.equal(rows[0].detail,'Closed');
});
test('legacy five-stage records map onto the seven-stage RFI workflow', () => {
  assert.deepEqual([0,1,2,3,4].map(stage=>inspectionStatus({stage})),['opened','re_review','site_inspection','closure_applied','closed']);
  assert.equal(inspectionStatus({stage:9}),null); assert.equal(inspectionStatusLabel({}),'Stage not recorded');
  assert.equal(inspectionStatus({stage:1,status:'next_work'}),'next_work');
  assert.equal(isInspectionOpen({status:'draft'}),false); assert.equal(isInspectionOpen({status:'re_review'}),true);
});
test('RFI sequence: engineers/managers raise, submit and apply for closure; RE reviews and closes; RTO allows next work', () => {
  const expected = { draft:'site', opened:'site', re_review:'RE', site_inspection:'RTO', next_work:'site', closure_applied:'RE', closed:null };
  assert.deepEqual(RFI_STATUSES.map(s=>s.id),Object.keys(expected));
  assert.deepEqual(RFI_STATUSES.slice(0,-1).map(s=>nextInspectionTransition({status:s.id}).to),RFI_STATUSES.slice(1).map(s=>s.id));
  for (const role of ['admin','manager','engineer','supervisor','RE','RTO','guest']) for (const [status,actor] of Object.entries(expected)) {
    const allowed = actor !== null && (role==='admin' || (actor==='site' ? ['manager','engineer'].includes(role) : role===actor));
    assert.equal(canAdvanceInspection({systemRole:role},{status}),allowed,`${role} ${status}`);
  }
  assert.equal(canEditInspection({systemRole:'engineer',email:'a'},{createdBy:'a'}),true);
  assert.equal(canEditInspection({systemRole:'engineer',email:'a'},{createdBy:'b'}),false);
  assert.equal(canEditInspection({systemRole:'supervisor',email:'a'},{createdBy:'a'}),false);
});
test('PDFs can be attached only before RE submission and removed by the uploader, creator or admin', () => {
  const engineer = {systemRole:'engineer',email:'e'};
  for (const status of ['draft','opened']) assert.equal(canManageInspectionFiles(engineer,{status}),true);
  for (const status of ['re_review','site_inspection','next_work','closure_applied','closed']) assert.equal(canManageInspectionFiles(engineer,{status}),false);
  assert.equal(canManageInspectionFiles({systemRole:'RE'},{status:'draft'}),false);
  const rfi = {status:'draft',createdBy:'c'};
  assert.equal(canRemoveInspectionFile(engineer,rfi,{uploadedBy:'e'}),true);
  assert.equal(canRemoveInspectionFile(engineer,rfi,{uploadedBy:'x'}),false);
  assert.equal(canRemoveInspectionFile({systemRole:'manager',email:'c'},rfi,{uploadedBy:'x'}),true);
  assert.equal(validateRfiFile({name:'a.pdf',type:'application/pdf',size:10}),'');
  assert.match(validateRfiFile({name:'a.docx',type:'application/msword',size:10}),/PDF/);
  assert.match(validateRfiFile({name:'a.pdf',type:'application/pdf',size:10*1024*1024+1}),/10 MB/);
  assert.equal(validateRfiFile({name:'a.pdf',type:'application/pdf',size:10*1024*1024}),'');
  assert.match(validateRfiFile({name:'a.pdf',type:'application/pdf',size:10},20),/up to 20/);
});
test('RFI references follow Project Name_Zone-Discipline-###', () => {
  assert.equal(rfiPrefix('Marina Tower','Zone A','Structural'),'Marina Tower_Zone A-STR');
  assert.equal(rfiPrefix('Marina Tower','Zone A','Architectural'),'Marina Tower_Zone A-AR');
  assert.equal(rfiPrefix('Marina Tower','Zone A','M&E Sleeve / Conduit'),'Marina Tower_Zone A-ME');
  assert.equal(rfiPrefix('Marina Tower','','Structural'),''); assert.equal(rfiPrefix('Marina Tower','Zone A','Other'),'');
  assert.equal(rfiIdSegment('  Block 1/2   Podium '),'Block 1-2 Podium');
  assert.equal(formatRfiId('P_Z-STR',7),'P_Z-STR-007'); assert.equal(formatRfiId('P_Z-STR',1234),'P_Z-STR-1234');
  assert.equal(highestRfiNumber(['P_Z-STR-002','P_Z-STR-011','P_Z-AR-050','P_Z-STR-draft','legacy'],'P_Z-STR'),11);
});
test('registration sync uses supplied identity and never seeds readings, expiry or admin rights', () => {
  const user={email:'Person@example.test',displayName:'Person'};
  const profile=createMemberProfile(user,{designation:'Engineer',birthday:'1990-01-01'},false,'now');
  assert.equal(profile.email,'person@example.test'); assert.equal(profile.role,'Engineer');
  assert.equal(profile.systemRole,'pending'); assert.equal(profile.certExpiry,''); assert.equal(profile.bizSafe,'');
  assert.equal(profile.organization,''); assert.deepEqual(profile.ptwAuthority,[]);
  assert.equal(createMemberProfile(user,{},true).systemRole,'admin');
});

test('diary drafts are kept out of recorded entries; entries without a status count as submitted', () => {
  assert.equal(diaryStatus({}), 'submitted');
  assert.equal(diaryStatus({ status: 'draft' }), 'draft');
  assert.equal(isDiaryDraft({ status: 'submitted' }), false);
  assert.deepEqual(recordedDiaryEntries([{ id: 'a', status: 'draft' }, { id: 'b' }, { id: 'c', status: 'submitted' }]).map(e => e.id), ['b', 'c']);
});
test('diary drafts need only a title; submission needs every required field and no future date', () => {
  const full = { date: '2026-01-02', time: '09:00', category: 'Work progress', zone: 'East', title: 'Formwork', details: 'Installed' };
  assert.equal(diaryEntryProblem({ title: '  ' }, 'draft', '2026-01-05'), 'Enter a title to save the draft.');
  assert.equal(diaryEntryProblem({ title: 'Formwork' }, 'draft', '2026-01-05'), '');
  assert.match(diaryEntryProblem({ title: 'Formwork' }, 'submitted', '2026-01-05'), /Complete the date/);
  assert.equal(diaryEntryProblem(full, 'submitted', '2026-01-05'), '');
  assert.match(diaryEntryProblem({ ...full, date: '2026-01-06' }, 'draft', '2026-01-05'), /have occurred/);
});
test('diary photos accept images within limits and are managed only while the entry is a draft', () => {
  assert.equal(validateDiaryPhotoSource({ name: 'site.jpg', type: 'image/jpeg', size: 1000 }), '');
  assert.equal(validateDiaryPhotoSource({ name: 'IMG_1.HEIC', type: '', size: 1000 }), '');
  assert.equal(validateDiaryPhotoSource({ name: 'notes.pdf', type: 'application/pdf', size: 1000 }), 'Only image files can be attached.');
  assert.equal(validateDiaryPhotoSource({ name: 'empty.png', type: 'image/png', size: 0 }), 'The selected photo is empty.');
  assert.equal(validateDiaryPhotoSource({ name: 'huge.jpg', type: 'image/jpeg', size: 31 * 1024 * 1024 }), 'Photos must be 30 MB or smaller.');
  assert.match(validateDiaryPhotoSource({ name: 'site.jpg', type: 'image/jpeg', size: 1000 }, DIARY_PHOTO_MAX), /up to 10 photos/);
  const draft = { status: 'draft', createdBy: 'creator@x' }, photo = { uploadedBy: 'uploader@x' };
  for (const role of ['admin', 'manager', 'engineer', 'supervisor']) {
    assert.equal(canManageDiaryPhotos({ systemRole: role }), true);
    assert.equal(canManageDiaryPhotos({ systemRole: role }, draft), true);
    assert.equal(canManageDiaryPhotos({ systemRole: role }, { status: 'submitted' }), false);
    assert.equal(canManageDiaryPhotos({ systemRole: role }, {}), false);
  }
  for (const role of ['guest', 'RE', 'RTO']) assert.equal(canManageDiaryPhotos({ systemRole: role }, draft), false);
  assert.equal(canRemoveDiaryPhoto({ systemRole: 'supervisor', email: 'uploader@x' }, draft, photo), true);
  assert.equal(canRemoveDiaryPhoto({ systemRole: 'engineer', email: 'creator@x' }, draft, photo), true);
  assert.equal(canRemoveDiaryPhoto({ systemRole: 'admin', email: 'other@x' }, draft, photo), true);
  assert.equal(canRemoveDiaryPhoto({ systemRole: 'manager', email: 'other@x' }, draft, photo), false);
  assert.equal(canRemoveDiaryPhoto({ systemRole: 'admin', email: 'other@x' }, { status: 'submitted' }, photo), false);
});
test('records show the name of the person who created them', () => {
  const people = [{ id: 'eng@example.test', email: 'eng@example.test', name: 'Aisha Tan' }, { id: 'legacy', email: 'Old@Example.test', name: '  ' }];
  assert.equal(creatorName({ createdBy: 'eng@example.test', createdByName: 'Aisha T.' }, people), 'Aisha T.');
  assert.equal(creatorName({ createdBy: 'ENG@example.test' }, people), 'Aisha Tan');
  assert.equal(creatorName({ createdBy: 'old@example.test' }, people), 'old@example.test');
  assert.equal(creatorName({ createdBy: 'gone@example.test', createdByName: ' ' }, people), 'gone@example.test');
  assert.equal(creatorName({}, people), '');
  assert.equal(personName('', people), '');
});
test('the RE or RTO rejects at their own stage; engineers/managers roll back or close; only the site owner reopens closed RFIs', () => {
  const as = systemRole => ({ systemRole, email: `${systemRole}@example.test` });
  for (const [status, who] of [['re_review', 'RE'], ['site_inspection', 'RTO'], ['closure_applied', 'RE']]) {
    for (const role of ['guest', 'supervisor', 'engineer', 'manager', 'RE', 'RTO', 'admin']) {
      assert.equal(canRejectInspection(as(role), { status }), role === who || role === 'admin', `${role} at ${status}`);
    }
  }
  for (const status of ['draft', 'opened', 'next_work', 'closed', 'rejected']) assert.equal(canRejectInspection(as('admin'), { status }), false);
  const rejected = { status: 'rejected', rejectedFrom: 'site_inspection' };
  assert.equal(isInspectionRejected(rejected), true);
  assert.equal(inspectionStatus(rejected), 'rejected');
  assert.equal(inspectionStatusLabel(rejected), 'Rejected at Site Inspection (RTO)');
  assert.equal(inspectionStatusIndex(rejected), 3);
  assert.equal(isInspectionOpen(rejected), true);
  assert.equal(nextInspectionTransition(rejected), null);
  assert.deepEqual(rfiRollbackTargets(rejected), ['opened', 're_review', 'site_inspection']);
  assert.deepEqual(rfiRollbackTargets({ status: 'rejected', rejectedFrom: 're_review' }), ['opened', 're_review']);
  for (const role of ['engineer', 'manager', 'admin']) assert.equal(canResolveRejectedInspection(as(role), rejected), true);
  for (const role of ['guest', 'supervisor', 'RE', 'RTO']) assert.equal(canResolveRejectedInspection(as(role), rejected), false);
  assert.equal(canResolveRejectedInspection(as('engineer'), { status: 'site_inspection' }), false);
  // Closed after rejection: closed, but never cleared, so a linked hold point stays unresolved.
  const closedRejected = { id: 'R', status: 'closed', rejectedFrom: 're_review' };
  assert.equal(isInspectionClosedRejected(closedRejected), true);
  assert.equal(isInspectionClosed(closedRejected), false);
  assert.equal(isInspectionOpen(closedRejected), false);
  assert.equal(inspectionStatusLabel(closedRejected), 'Closed (rejected)');
  assert.deepEqual(taskConstraints({ inspectionId: 'R' }, { inspections: [closedRejected] }), ['Inspection not cleared']);
  assert.deepEqual(taskConstraints({ inspectionId: 'R' }, { inspections: [{ id: 'R', status: 'closed' }] }), []);
  for (const closed of [{ status: 'closed' }, closedRejected, { stage: 4 }]) {
    assert.equal(canRollbackClosedInspection({ systemRole: 'admin', siteOwner: true }, closed), true);
    assert.equal(canRollbackClosedInspection(as('admin'), closed), false);
    assert.deepEqual(rfiRollbackTargets(closed), ['opened', 're_review', 'site_inspection', 'next_work', 'closure_applied']);
  }
  assert.equal(canRollbackClosedInspection({ systemRole: 'admin', siteOwner: true }, { status: 'closure_applied' }), false);
  assert.deepEqual(rfiRollbackTargets({ status: 'next_work' }), []);
  assert.equal(rfiReasonProblem('  '), 'Enter a reason.');
  assert.equal(rfiReasonProblem('Cover insufficient'), '');
  assert.match(rfiReasonProblem('x'.repeat(2001)), /under 2000/);
});

test('gantt window pads two weeks either side of the recorded dates', async () => {
  const { ganttWindow, dayNumber } = await import('./siteData.js');
  assert.equal(ganttWindow([]), null);
  const w = ganttWindow([{ start: '2026-03-10', end: '2026-03-20' }, { start: '2026-03-05', end: '2026-03-05' }, { start: '2026-04-02', end: '2026-04-30' }], { at: '2026-04-01' });
  assert.equal(w.startIso, '2026-02-19');
  assert.equal(w.endIso, '2026-05-14');
  assert.equal(w.span, dayNumber('2026-05-14') - dayNumber('2026-02-19') + 1);
  assert.deepEqual(w.months.map(m => m.key), ['2026-02', '2026-03', '2026-04', '2026-05']);
  assert.ok(Math.abs(w.months.reduce((s, m) => s + m.width, 0) - 100) < 1e-9);
  assert.ok(w.weeks.every(k => new Date(`${k.iso}T00:00:00Z`).getUTCDay() === 1));
  assert.equal(w.weeks[0].iso, '2026-02-23');
  const bar = w.position('2026-03-05');
  assert.ok(bar.left > 0 && bar.width > 0 && bar.left + bar.width < 100);
  assert.equal(w.today.iso, '2026-04-01');
  assert.equal(ganttWindow([{ start: '2026-03-10', end: '2026-03-20' }], { at: '2027-01-01' }).today, null);
});
