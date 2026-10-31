import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canPlan, canRecordSite, canWrite, dayNumber, projectProgress, scheduleRows, taskConstraints, validateTask, validateMaterial, latestObservation, taskStatus, taskProgress, canAdvanceInspection, canEditInspection, isInspectionClosed, createMemberProfile } from './siteData.js';

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
test('five-stage RFI closure is reflected in planning constraints and chart milestones', () => {
  assert.equal(isInspectionClosed({stage:3}),false); assert.equal(isInspectionClosed({stage:4}),true);
  const task = {inspectionId:'r'};
  assert.equal(taskConstraints(task,{inspections:[{id:'r',stage:3}]}).length,1);
  assert.equal(taskConstraints(task,{inspections:[{id:'r',stage:4}]}).length,0);
  const rows = scheduleRows({inspections:[{id:'r',stage:4,targetCast:'2026-10-02'}]});
  assert.equal(rows[0].detail,'Closed');
});
test('RE reviews and closes RFIs while site creators handle submission steps', () => {
  for (const role of ['admin','manager','engineer','supervisor','RE','RTO','guest']) for (let stage=0;stage<5;stage++) {
    const allowed = stage<4 && (role==='admin' || ([1,3].includes(stage) ? role==='RE' : ['manager','engineer','supervisor'].includes(role)));
    assert.equal(canAdvanceInspection({systemRole:role},{stage}),allowed,`${role} stage ${stage}`);
  }
  assert.equal(canEditInspection({systemRole:'supervisor',email:'a'},{createdBy:'a'}),true);
  assert.equal(canEditInspection({systemRole:'supervisor',email:'a'},{createdBy:'b'}),false);
});
test('registration sync uses supplied identity and never seeds readings, expiry or admin rights', () => {
  const user={email:'Person@example.test',displayName:'Person'};
  const profile=createMemberProfile(user,{designation:'Engineer',birthday:'1990-01-01'},false,'now');
  assert.equal(profile.email,'person@example.test'); assert.equal(profile.role,'Engineer');
  assert.equal(profile.systemRole,'pending'); assert.equal(profile.certExpiry,''); assert.equal(profile.bizSafe,'');
  assert.equal(profile.organization,''); assert.deepEqual(profile.ptwAuthority,[]);
  assert.equal(createMemberProfile(user,{},true).systemRole,'admin');
});
