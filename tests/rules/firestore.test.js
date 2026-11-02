import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, getDoc, deleteDoc, arrayUnion, serverTimestamp, Timestamp, Bytes } from 'firebase/firestore';
import { createMemberProfile, canAdvanceInspection, RFI_STATUSES, RFI_TRANSITIONS } from '../../src/utils/siteData.js';
import { createInspection, advanceInspection, removeInspectionFile, attachInspectionFile, readInspectionFile } from '../../src/services/inspections.js';
import { synchronizeProjectMembership } from '../../src/services/projectMembership.js';
import { submitRecordDeletion, reviewRecordDeletion } from '../../src/services/recordDeletion.js';
import { saveOwnProjectProfile } from '../../src/services/personalProfile.js';
import { grantProjectAccess, setProjectAccessRole, revokeProjectAccess } from '../../src/services/projectAccess.js';
let env;
const project='demo-proximastruc';
const audit = email => ({createdBy:email,createdAt:'2026-01-01T00:00:00Z'});
const task = email => ({activity:'Test activity',zone:'East',owner:'Team',startDate:'2026-10-01',endDate:'2026-10-03',progress:0,status:'Backlog',...audit(email)});
const client = (role,verified=true) => env.authenticatedContext(role,{email:`${role}@example.test`,email_verified:verified}).firestore();
before(async () => {
  env=await initializeTestEnvironment({projectId:project,firestore:{host:'127.0.0.1',port:8085,rules:await readFile('firestore.rules','utf8')}});
  await env.withSecurityRulesDisabled(async ctx => {
    const db=ctx.firestore();
    await setDoc(doc(db,'projects/p'),{name:'Test project',ownerId:'owner'});
    await setDoc(doc(db,'projects/other'),{name:'Other project',ownerId:'otherOwner'});
    await setDoc(doc(db,'siteOwners/siteowner'),{note:'Designated in the Firebase Console'});
    for(const role of ['admin','manager','engineer','supervisor','guest','RE','RTO']) await setDoc(doc(db,`artifacts/p/users/${role.toLowerCase()}@example.test`),{email:`${role}@example.test`,systemRole:role});
    await setDoc(doc(db,'artifacts/p/tasks/existing'),task('admin@example.test'));
  });
});
after(async()=>{await env?.cleanup();});
for(const role of ['admin','manager','engineer','supervisor','guest','RE','RTO']) {
  test(`${role}: planning write permission`,async()=>{
    const result=setDoc(doc(client(role),`artifacts/p/tasks/${role}`),task(`${role}@example.test`));
    await (['admin','manager','engineer'].includes(role)?assertSucceeds(result):assertFails(result));
  });
  test(`${role}: diary and material write permission`,async()=>{
    const db=client(role), email=`${role}@example.test`;
    const check=['admin','manager','engineer','supervisor'].includes(role)?assertSucceeds:assertFails;
    await check(setDoc(doc(db,`artifacts/p/weatherLogs/${role}`),{details:'Recorded site activity',...audit(email)}));
    await check(setDoc(doc(db,`artifacts/p/materials/${role}`),{type:'Delivery Order',reference:'DO',quantity:2,unit:'t',status:'Ordered',...audit(email)}));
  });
  test(`${role}: only admins confirm readings or assign roles`,async()=>{
    const db=client(role),email=`${role}@example.test`, check=role === 'admin'?assertSucceeds:assertFails;
    await check(setDoc(doc(db,`artifacts/p/monitoring/${role}`),{noise:65,confirmedBy:email,confirmedAt:'2026-01-01',...audit(email)}));
    await check(setDoc(doc(db,`artifacts/p/users/invite-${role}@example.test`),{email:`invite-${role}@example.test`,systemRole:'engineer',...audit(email)}));
  });
}
test('only the site owner can create projects, using the expected workspace fields',async()=>{
  await assertFails(setDoc(doc(client('creator'),'projects/created'),{name:'New workspace',id:'created',ownerId:'creator',...audit('creator@example.test')}));
  await assertFails(setDoc(doc(client('admin'),'projects/created'),{name:'New workspace',id:'created',ownerId:'admin',...audit('admin@example.test')}));
  const db=client('siteowner'),base={name:'New workspace',id:'created',ownerId:'siteowner',...audit('siteowner@example.test')};
  await assertFails(setDoc(doc(db,'projects/created'),{...base,extra:'x'.repeat(10)}));
  await assertFails(setDoc(doc(db,'projects/created'),{...base,name:''}));
  await assertFails(setDoc(doc(db,'projects/created'),{...base,id:'someone-else'}));
  await assertSucceeds(setDoc(doc(db,'projects/created'),base));
});
test('project creator can bootstrap admin, but cannot take over an existing project',async()=>{
  const db=client('owner');
  await assertSucceeds(setDoc(doc(db,'artifacts/p/monitoring/owner'),{weather:'Rain',confirmedBy:'owner@example.test',confirmedAt:'2026-01-01',...audit('owner@example.test')}));
  await assertFails(updateDoc(doc(db,'projects/other'),{ownerId:'owner'}));
  await assertFails(setDoc(doc(db,'projects/forged'),{ownerId:'somebodyElse',...audit('owner@example.test')}));
});
test('unverified, unauthenticated and unrelated accounts cannot use member privileges',async()=>{
  await assertFails(setDoc(doc(client('admin',false),'artifacts/p/tasks/unverified'),task('admin@example.test')));
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'artifacts/p/tasks/existing')));
  await assertFails(setDoc(doc(client('outsider'),'artifacts/p/tasks/outsider'),task('outsider@example.test')));
  await assertFails(getDoc(doc(client('admin'),'artifacts/other/tasks/existing')));
});
test('guest cannot self-promote or overwrite planning data',async()=>{
  const db=client('guest');
  await assertFails(updateDoc(doc(db,'artifacts/p/users/guest@example.test'),{systemRole:'admin',updatedBy:'guest@example.test',updatedAt:'2026-10-01'}));
  await assertFails(updateDoc(doc(db,'artifacts/p/tasks/existing'),{progress:100,status:'Done',updatedBy:'guest@example.test',updatedAt:'2026-10-01'}));
});
test('planner updates persist only valid progress and preserve creator audit',async()=>{
  const db=client('engineer');
  await assertSucceeds(updateDoc(doc(db,'artifacts/p/tasks/existing'),{progress:30,status:'In progress',updatedBy:'engineer@example.test',updatedAt:'2026-10-01'}));
  await assertFails(updateDoc(doc(db,'artifacts/p/tasks/existing'),{progress:120,updatedBy:'engineer@example.test',updatedAt:'2026-10-01'}));
  await assertFails(updateDoc(doc(db,'artifacts/p/tasks/existing'),{createdBy:'engineer@example.test',updatedBy:'engineer@example.test',updatedAt:'2026-10-01'}));
});
test('observation confirmations cannot be silently overwritten',async()=>{
  await assertFails(updateDoc(doc(client('admin'),'artifacts/p/monitoring/admin'),{noise:1,updatedBy:'admin@example.test',updatedAt:'2026-10-01'}));
});

const changed = role => ({updatedBy:`${role}@example.test`,updatedAt:'2026-10-26T00:00:00Z'});
const seed = async (path, data) => env.withSecurityRulesDisabled(ctx=>setDoc(doc(ctx.firestore(),path),data));
test('verified new registrations can read and create only their own pending access request',async()=>{
  const db=client('newcomer');
  const ref=doc(db,'artifacts/p/users/newcomer@example.test');
  await assertSucceeds(getDoc(ref));
  const profile=createMemberProfile({email:'newcomer@example.test',displayName:'New person'},{designation:'Site supervisor'},false,'2026-10-26');
  await assertFails(setDoc(ref,{...profile,systemRole:'admin'}));
  await assertFails(setDoc(ref,{...profile,systemRole:'guest'}));
  await assertFails(setDoc(ref,{...profile,certExpiry:'2028-12-31'}));
  await assertSucceeds(synchronizeProjectMembership(db,{email:'newcomer@example.test',uid:'newcomer',displayName:'New person'},'p','owner',{designation:'Site supervisor'}));
  await assertFails(updateDoc(ref,{systemRole:'admin',...changed('newcomer')}));
  await assertFails(updateDoc(ref,{systemRole:'guest',...changed('newcomer')}));
  await assertFails(getDoc(doc(db,'artifacts/p/tasks/existing')));
  await assertFails(getDoc(doc(db,'artifacts/p/users/admin@example.test')));
  await assertFails(updateDoc(doc(db,'artifacts/p/inspections/any'),{comments:arrayUnion({text:'Hi'}),...changed('newcomer')}));
  await assertSucceeds(updateDoc(doc(client('admin'),'artifacts/p/users/newcomer@example.test'),{systemRole:'guest',...changed('admin')}));
  await assertSucceeds(getDoc(doc(db,'artifacts/p/tasks/existing')));
  await assertFails(setDoc(doc(db,'artifacts/p/users/someoneelse@example.test'),{...profile,email:'someoneelse@example.test'}));
  await assertFails(getDoc(doc(client('unknown'),'artifacts/p/users/admin@example.test')));
  const unverifiedProfile=createMemberProfile({email:'unverified-new@example.test'}, {},false,'2026-10-26');
  await assertFails(setDoc(doc(client('unverified-new',false),'artifacts/p/users/unverified-new@example.test'),unverifiedProfile));
});
test('registration sync preserves existing invited roles instead of replacing them',async()=>{
  await seed('artifacts/p/users/invited@example.test',{email:'invited@example.test',systemRole:'engineer',organization:'Inviting company',...audit('admin@example.test')});
  const db=client('invited'),ref=doc(db,'artifacts/p/users/invited@example.test');
  await assertSucceeds(synchronizeProjectMembership(db,{email:'invited@example.test',uid:'invited'},'p','owner'));
  const result=(await getDoc(ref)).data();
  if(result.systemRole !== 'engineer' || result.organization !== 'Inviting company') throw new Error('Existing invitation was overwritten.');
});
test('manager organisation edits cannot change access roles or other personnel details',async()=>{
  const path='artifacts/p/users/organisation-person@example.test';
  await seed(path,{email:'organisation-person@example.test',systemRole:'guest',name:'Person',organization:'Original',...audit('admin@example.test')});
  await assertSucceeds(updateDoc(doc(client('manager'),path),{organization:'Updated',...changed('manager')}));
  await assertFails(updateDoc(doc(client('manager'),path),{organization:'Other',systemRole:'admin',...changed('manager')}));
  await assertFails(updateDoc(doc(client('manager'),path),{name:'Changed',...changed('manager')}));
  await assertFails(updateDoc(doc(client('engineer'),path),{organization:'Changed',...changed('engineer')}));
  await assertSucceeds(updateDoc(doc(client('admin'),path),{organization:'Admin update',...changed('admin')}));
});
const rfiUser = role => ({email:`${role}@example.test`,name:role,systemRole:role});
const rfiDetails = {zone:'Zone A',discipline:'Structural',element:'Level 2 slab',rtoName:'',reName:'',targetCast:'2026-11-10',bbsLinked:''};
const createRfi = (role,details=rfiDetails,status='draft') => createInspection(client(role),{projectId:'p',projectName:'Test project',currentUser:rfiUser(role),email:`${role}@example.test`,details,status});
const historyText = status => Object.values(RFI_TRANSITIONS).find(t=>t.to===status)?.history || 'none';
const historyEntry = (role,status) => ({email:`${role}@example.test`,user:role,role,timestamp:'2026-10-26',action:historyText(status)});
const FILE_ID='0b5c1d2e-aaaa-bbbb-cccc-000000000001';
const attachment = (role,extra={}) => ({fileId:FILE_ID,name:'Inspection.pdf',size:2048,chunks:1,contentType:'application/pdf',category:'Inspection file',uploadedBy:`${role}@example.test`,uploadedAt:'2026-10-26',...extra});
const chunk = (role,rfiId,extra={}) => ({rfiId,fileId:FILE_ID,index:0,total:1,data:Bytes.fromUint8Array(new Uint8Array(2048).fill(37)),createdBy:`${role}@example.test`,createdAt:'2026-10-26',...extra});
const pdfFile = (size,name='Inspection.pdf') => { const bytes=new Uint8Array(size); bytes.set([37,80,68,70]); return Object.assign(new Blob([bytes],{type:'application/pdf'}),{name}); };

test('only engineers, managers and admins raise RFIs, numbered Project_Zone-Discipline-###',async()=>{
  for(const role of ['supervisor','RE','RTO','guest']) await assertFails(createInspection(client(role),{projectId:'p',projectName:'Test project',currentUser:{...rfiUser(role),systemRole:'engineer'},email:`${role}@example.test`,details:{...rfiDetails,zone:`Role ${role}`}}));
  assert.equal(await createRfi('engineer'),'Test project_Zone A-STR-001');
  assert.equal(await createRfi('manager',rfiDetails,'opened'),'Test project_Zone A-STR-002');
  assert.equal(await createRfi('admin',{...rfiDetails,discipline:'Architectural'}),'Test project_Zone A-AR-001');
  assert.equal(await createRfi('engineer',{...rfiDetails,discipline:'M&E Sleeve / Conduit',zone:'Zone B'}),'Test project_Zone B-ME-001');
  const saved=(await getDoc(doc(client('guest'),'artifacts/p/inspections/Test project_Zone A-STR-002'))).data();
  assert.equal(saved.status,'opened'); assert.equal(saved.rfiNumber,2); assert.deepEqual(saved.attachments,[]);
  // Deleted numbers are not reused because the counter only moves forward.
  await assertSucceeds(deleteDoc(doc(client('admin'),'artifacts/p/inspections/Test project_Zone A-STR-002')));
  assert.equal(await createRfi('engineer'),'Test project_Zone A-STR-003');
});
test('RFI references and counters cannot be forged or rewound',async()=>{
  const db=client('engineer'), base={...rfiDetails,status:'draft',history:[],comments:[],attachments:[],...audit('engineer@example.test')};
  await assertFails(setDoc(doc(db,'artifacts/p/inspections/Forged_Zone A-STR-900'),{...base,rfiPrefix:'Forged_Zone A-STR',rfiNumber:900}));
  await assertFails(setDoc(doc(db,'artifacts/p/inspections/Custom reference'),{...base,rfiPrefix:'Custom',rfiNumber:1}));
  await assertFails(setDoc(doc(db,'artifacts/p/inspections/Test project_Zone A-STR-001'),{...base,stage:0}));
  await assertFails(setDoc(doc(db,'artifacts/p/rfiCounters/Test project_Zone A-STR'),{last:1,lastId:'Test project_Zone A-STR-001',...audit('engineer@example.test'),...changed('engineer')}));
  await assertFails(deleteDoc(doc(client('admin'),'artifacts/p/rfiCounters/Test project_Zone A-STR')));
  const counter=(await getDoc(doc(client('guest'),'artifacts/p/rfiCounters/Test project_Zone A-STR'))).data();
  assert.equal(counter.last,3);
});
test('seven-stage RFI transitions enforce the same role matrix as the interface',async()=>{
  for(const role of ['admin','manager','engineer','supervisor','guest','RE','RTO']) for(const {id:status} of RFI_STATUSES) {
    const path=`artifacts/p/inspections/transition-${role}-${status}`;
    await seed(path,{status,history:[],comments:[],attachments:[],...audit('engineer@example.test')});
    const next=RFI_TRANSITIONS[status]?.to || 'closed';
    const result=updateDoc(doc(client(role),path),{status:next,history:[historyEntry(role,next)],...changed(role)});
    await (canAdvanceInspection({systemRole:role},{status})?assertSucceeds(result):assertFails(result));
  }
});
test('legacy five-stage RFIs continue through the new workflow',async()=>{
  const path='artifacts/p/inspections/legacy-rfi';
  await seed(path,{stage:2,history:[],comments:[],...audit('supervisor@example.test')});
  await assertFails(advanceInspection(client('engineer'),{projectId:'p',id:'legacy-rfi',expectedStatus:'site_inspection',currentUser:{...rfiUser('engineer'),systemRole:'RTO'},email:'engineer@example.test'}));
  await assertSucceeds(advanceInspection(client('RTO'),{projectId:'p',id:'legacy-rfi',expectedStatus:'site_inspection',currentUser:rfiUser('RTO'),email:'RTO@example.test'}));
  assert.equal((await getDoc(doc(client('guest'),path))).data().status,'next_work');
  await seed('artifacts/p/inspections/legacy-closed',{stage:4,history:[],comments:[],...audit('supervisor@example.test')});
  await assertFails(updateDoc(doc(client('admin'),'artifacts/p/inspections/legacy-closed'),{status:'closed',history:[historyEntry('admin','closed')],...changed('admin')}));
});
test('RFIs cannot skip stages, forge discussion identity or erase existing history',async()=>{
  const path='artifacts/p/inspections/history';
  const previous=historyEntry('engineer','re_review');
  await seed(path,{status:'re_review',history:[previous],comments:[],attachments:[],...audit('engineer@example.test')});
  const entry=historyEntry('RE','site_inspection');
  await assertFails(updateDoc(doc(client('RE'),path),{status:'closed',history:[previous,historyEntry('RE','closed')],...changed('RE')}));
  await assertFails(updateDoc(doc(client('RE'),path),{status:'site_inspection',history:[entry],...changed('RE')}));
  await assertFails(updateDoc(doc(client('RE'),path),{status:'site_inspection',history:[previous,{...entry,role:'admin'}],...changed('RE')}));
  await assertFails(updateDoc(doc(client('RE'),path),{status:'site_inspection',history:[previous,{...entry,action:'Approved'}],...changed('RE')}));
  await assertSucceeds(updateDoc(doc(client('RE'),path),{status:'site_inspection',history:[previous,entry],...changed('RE')}));
  const comment={email:'RTO@example.test',user:'RTO',role:'RTO',text:'Observation',timestamp:'2026-10-26'};
  await assertSucceeds(updateDoc(doc(client('RTO'),path),{comments:arrayUnion(comment),...changed('RTO')}));
  await assertFails(updateDoc(doc(client('guest'),path),{comments:arrayUnion({...comment,text:'Forged'}),...changed('guest')}));
  await assertFails(updateDoc(doc(client('RTO'),path),{comments:[],...changed('RTO')}));
});
test('PDF chunks are written only by engineers/managers/admins before RE submission',async()=>{
  const id='chunk-rfi', path=`artifacts/p/inspections/${id}`, chunkPath=`artifacts/p/rfiFileChunks/${FILE_ID}_0`;
  await seed(path,{status:'draft',history:[],comments:[],attachments:[],...audit('engineer@example.test')});
  for(const role of ['supervisor','RE','RTO','guest']) await assertFails(setDoc(doc(client(role),chunkPath),chunk(role,id)));
  await assertFails(setDoc(doc(client('engineer'),chunkPath),chunk('engineer',id,{data:Bytes.fromUint8Array(new Uint8Array(921601))})));
  await assertFails(setDoc(doc(client('engineer'),chunkPath),chunk('engineer',id,{index:1})));
  await assertFails(setDoc(doc(client('engineer'),chunkPath),chunk('engineer',id,{data:'not bytes'})));
  await assertFails(setDoc(doc(client('engineer'),chunkPath),chunk('manager',id)));
  await assertSucceeds(setDoc(doc(client('engineer'),chunkPath),chunk('engineer',id)));
  await assertFails(setDoc(doc(client('engineer'),chunkPath),chunk('engineer',id,{createdAt:'changed'})));
  await assertSucceeds(getDoc(doc(client('guest'),chunkPath)));
  await seed('artifacts/p/inspections/submitted-rfi',{status:'re_review',history:[],comments:[],attachments:[],...audit('engineer@example.test')});
  await assertFails(setDoc(doc(client('engineer'),`artifacts/p/rfiFileChunks/${FILE_ID.replace('0001','0009')}_0`),chunk('engineer','submitted-rfi',{fileId:FILE_ID.replace('0001','0009')})));
});
test('PDF links require a complete upload and lock after RE submission',async()=>{
  const id='attach-rfi', path=`artifacts/p/inspections/${id}`;
  await seed(path,{status:'draft',history:[],comments:[],attachments:[],element:'Slab',...audit('engineer@example.test')});
  // No chunks yet: the link is refused.
  await assertFails(updateDoc(doc(client('manager'),path),{attachments:[attachment('manager')],...changed('manager')}));
  await seed(`artifacts/p/rfiFileChunks/${FILE_ID}_0`,chunk('manager',id));
  await assertFails(updateDoc(doc(client('RE'),path),{attachments:[attachment('RE')],...changed('RE')}));
  await assertFails(updateDoc(doc(client('manager'),path),{attachments:[attachment('manager',{chunks:2})],...changed('manager')}));
  await assertFails(updateDoc(doc(client('manager'),path),{attachments:[attachment('manager',{size:921601})],...changed('manager')}));
  await assertFails(updateDoc(doc(client('manager'),path),{attachments:[attachment('manager',{contentType:'image/png'})],...changed('manager')}));
  await assertFails(updateDoc(doc(client('engineer'),path),{attachments:[attachment('manager')],...changed('engineer')}));
  await assertSucceeds(updateDoc(doc(client('manager'),path),{attachments:[attachment('manager')],...changed('manager')}));
  // The full service path: a 2 MB PDF is split into three chunks, linked and read back intact.
  await assertSucceeds(attachInspectionFile(client('engineer'),{projectId:'p',id,file:pdfFile(2_000_000,'Drawing.pdf'),category:'Reference',currentUser:rfiUser('engineer'),email:'engineer@example.test'}));
  const linked=(await getDoc(doc(client('guest'),path))).data().attachments;
  assert.equal(linked.length,2); assert.equal(linked[1].chunks,3); assert.equal(linked[1].size,2_000_000);
  const blob=await readInspectionFile(client('RTO'),{projectId:'p',attachment:linked[1]});
  assert.equal(blob.size,2_000_000); assert.deepEqual([...new Uint8Array(await blob.arrayBuffer()).slice(0,4)],[37,80,68,70]);
  // Another engineer cannot unlink or delete a file they neither uploaded nor own; the RFI creator can.
  await seed('artifacts/p/users/engineer2@example.test',{email:'engineer2@example.test',systemRole:'engineer'});
  await assertFails(updateDoc(doc(client('engineer2'),path),{attachments:[linked[1]],...changed('engineer2')}));
  await assertFails(deleteDoc(doc(client('engineer2'),`artifacts/p/rfiFileChunks/${FILE_ID}_0`)));
  await assertSucceeds(removeInspectionFile(client('engineer'),{projectId:'p',id,fileId:FILE_ID,currentUser:rfiUser('engineer'),email:'engineer@example.test'}));
  assert.equal((await getDoc(doc(client('guest'),`artifacts/p/rfiFileChunks/${FILE_ID}_0`))).exists(),false);
  await assertSucceeds(advanceInspection(client('engineer'),{projectId:'p',id,expectedStatus:'draft',currentUser:rfiUser('engineer'),email:'engineer@example.test'}));
  await assertSucceeds(advanceInspection(client('manager'),{projectId:'p',id,expectedStatus:'opened',currentUser:rfiUser('manager'),email:'manager@example.test'}));
  // After RE submission the list and the stored chunks are locked, even for admins.
  await assertFails(updateDoc(doc(client('engineer'),path),{attachments:[],...changed('engineer')}));
  await assertFails(deleteDoc(doc(client('engineer'),`artifacts/p/rfiFileChunks/${linked[1].fileId}_0`)));
  await assertFails(deleteDoc(doc(client('admin'),`artifacts/p/rfiFileChunks/${linked[1].fileId}_1`)));
});
test('inspection metadata edits cannot overwrite discussion, renumber RFIs or bypass stage permissions',async()=>{
  const path='artifacts/p/inspections/creator-edit';
  await seed(path,{status:'draft',rfiPrefix:'Test project_Zone A-STR',rfiNumber:50,zone:'Zone A',discipline:'Structural',history:[],comments:[],attachments:[],element:'Slab',...audit('engineer@example.test')});
  await assertSucceeds(updateDoc(doc(client('engineer'),path),{element:'Updated slab',...changed('engineer')}));
  await assertFails(updateDoc(doc(client('engineer'),path),{zone:'Zone B',...changed('engineer')}));
  await assertFails(updateDoc(doc(client('manager'),path),{element:'Other creator',...changed('manager')}));
  await assertFails(updateDoc(doc(client('engineer'),path),{status:'closed',...changed('engineer')}));
  await assertFails(updateDoc(doc(client('RE'),path),{element:'Reviewer edit',...changed('RE')}));
  await assertFails(deleteDoc(doc(client('engineer'),path)));
  await assertSucceeds(deleteDoc(doc(client('admin'),path)));
  await seed('artifacts/p/inspections/legacy-edit',{stage:0,history:[],comments:[],element:'Slab',zone:'East',...audit('engineer@example.test')});
  await assertSucceeds(updateDoc(doc(client('engineer'),'artifacts/p/inspections/legacy-edit'),{zone:'West',...changed('engineer')}));
});

test('every project role can save their own personal fields without changing assigned access',async()=>{
  for(const role of ['admin','manager','engineer','supervisor','guest','RE','RTO']) {
    const db=client(role), email=`${role}@example.test`;
    await assertSucceeds(saveOwnProjectProfile(db,{email},'p',{name:`Updated ${role}`,role:'Job title',phone:'+65 6123 4567',birthday:'1990-01-01',systemRole:'admin'}));
    const saved=(await getDoc(doc(db,`artifacts/p/users/${email.toLowerCase()}`))).data();
    assert.equal(saved.name,`Updated ${role}`);assert.equal(saved.role,'Job title');assert.equal(saved.systemRole,role);
  }
});
test('self profile edits cannot alter identities, permissions, organisation, certificates or another member',async()=>{
  const db=client('guest'),ref=doc(db,'artifacts/p/users/guest@example.test');
  for(const fields of [{systemRole:'admin'},{email:'other@example.test'},{organization:'Changed company'},{certExpiry:'2029-01-01'},{cdePermission:'Admin'},{ptwAuthority:['Approve PTW']},{createdBy:'guest@example.test'}]) {
    await assertFails(updateDoc(ref,{...fields,...changed('guest')}));
  }
  await assertFails(updateDoc(doc(db,'artifacts/p/users/engineer@example.test'),{name:'Changed by someone else',...changed('guest')}));
  await assertFails(updateDoc(doc(client('guest',false),'artifacts/p/users/guest@example.test'),{name:'Unverified change',...changed('guest')}));
});

const actor = role => ({uid:role,email:`${role}@example.test`,systemRole:role});
test('creators request deletion, independent managers verify it, and history survives',async()=>{
  const path='artifacts/p/materials/verified-do';
  await seed(path,{reference:'DO-verified',createdBy:'engineer@example.test',createdAt:'2026-10-27'});
  const db=client('engineer');
  await assertFails(deleteDoc(doc(db,path)));
  await assertSucceeds(submitRecordDeletion(db,'p',actor('engineer'),'materials','verified-do','Duplicate delivery order'));
  assert.equal((await getDoc(doc(db,path))).exists(),true);
  await assertFails(deleteDoc(doc(client('manager'),path)));
  await assertSucceeds(reviewRecordDeletion(client('manager'),'p',actor('manager'),'materials:verified-do',true,'Checked duplicate against site log'));
  assert.equal((await getDoc(doc(client('admin'),path))).exists(),false);
  const request=(await getDoc(doc(client('admin'),'artifacts/p/deletionRequests/materials:verified-do'))).data();
  assert.equal(request.status,'approved');assert.equal(request.requestedByUid,'engineer');assert.equal(request.reviewedByUid,'manager');assert.equal(request.history.length,2);
  await assertFails(deleteDoc(doc(client('admin'),'artifacts/p/deletionRequests/materials:verified-do')));
});
test('manager creators cannot approve themselves or directly delete their own records',async()=>{
  await seed('artifacts/p/tasks/manager-own',{activity:'Manager activity',createdBy:'manager@example.test'});
  await assertSucceeds(submitRecordDeletion(client('manager'),'p',actor('manager'),'tasks','manager-own','Duplicate activity'));
  await assertFails(deleteDoc(doc(client('manager'),'artifacts/p/tasks/manager-own')));
  await assert.rejects(reviewRecordDeletion(client('manager'),'p',actor('manager'),'tasks:manager-own',true,'Self approval'));
  await assertSucceeds(reviewRecordDeletion(client('admin'),'p',actor('admin'),'tasks:manager-own',true,'Verified by admin'));
});
test('rejection preserves records and resubmission preserves prior decision history',async()=>{
  await seed('artifacts/p/lifts/rejected-ptw',{crane:'Crane test',createdBy:'supervisor@example.test'});
  await submitRecordDeletion(client('supervisor'),'p',actor('supervisor'),'lifts','rejected-ptw','Wrong permit');
  await reviewRecordDeletion(client('manager'),'p',actor('manager'),'lifts:rejected-ptw',false,'Still required for site record');
  assert.equal((await getDoc(doc(client('admin'),'artifacts/p/lifts/rejected-ptw'))).exists(),true);
  await submitRecordDeletion(client('supervisor'),'p',actor('supervisor'),'lifts','rejected-ptw','Confirmed duplicate after review');
  const request=(await getDoc(doc(client('admin'),'artifacts/p/deletionRequests/lifts:rejected-ptw'))).data();
  assert.equal(request.status,'pending');assert.equal(request.history.length,3);assert.equal(request.history[1].status,'rejected');
});
test('edited records cannot be deleted using a stale approved snapshot',async()=>{
  const path='artifacts/p/materials/changed-do';
  await seed(path,{reference:'Original DO',createdBy:'engineer@example.test'});
  await submitRecordDeletion(client('engineer'),'p',actor('engineer'),'materials','changed-do','Duplicate');
  await seed(path,{reference:'Corrected DO',createdBy:'engineer@example.test'});
  await assert.rejects(reviewRecordDeletion(client('manager'),'p',actor('manager'),'materials:changed-do',true,'Verified'),/changed/);
  assert.equal((await getDoc(doc(client('admin'),path))).data().reference,'Corrected DO');
  await reviewRecordDeletion(client('manager'),'p',actor('manager'),'materials:changed-do',false,'Record changed; request again');
});
test('non-creators cannot request deletion or bypass review through forged requests',async()=>{
  const path='artifacts/p/tasks/not-own';
  await seed(path,{activity:'Other person activity',createdBy:'engineer@example.test'});
  await assert.rejects(submitRecordDeletion(client('guest'),'p',actor('guest'),'tasks','not-own','Remove'),/only/);
  await submitRecordDeletion(client('engineer'),'p',actor('engineer'),'tasks','not-own','Duplicate');
  const ref=doc(client('engineer'),'artifacts/p/deletionRequests/tasks:not-own');
  await assertFails(updateDoc(ref,{status:'approved',reviewedByUid:'engineer'}));
  await assertFails(updateDoc(ref,{targetId:'existing'}));
  await assertFails(updateDoc(ref,{history:[]}));
  await assertFails(deleteDoc(doc(client('guest'),path)));
  await assertFails(updateDoc(doc(client('manager'),'artifacts/p/deletionRequests/tasks:not-own'),{status:'approved'}));
});
test('admins can directly delete all operational record types, with confirmation history',async()=>{
  for(const collection of ['tasks','materials','lifts','inspections','weatherLogs','users','zones','monitoring']) {
    await seed(`artifacts/p/${collection}/admin-delete`,{name:`${collection} record`,createdBy:'engineer@example.test'});
    await assertSucceeds(submitRecordDeletion(client('admin'),'p',actor('admin'),collection,'admin-delete','Admin verified duplicate'));
    assert.equal((await getDoc(doc(client('admin'),`artifacts/p/${collection}/admin-delete`))).exists(),false);
    assert.equal((await getDoc(doc(client('admin'),`artifacts/p/deletionRequests/${collection}:admin-delete`))).data().status,'deleted');
  }
});

test('forged admin actors and correctly shaped approvals without deletion cannot bypass verification',async()=>{
  const path='artifacts/p/tasks/forged-approval';
  await seed(path,{activity:'Verified target',createdBy:'engineer@example.test'});
  await assert.rejects(submitRecordDeletion(client('manager'),'p',{...actor('manager'),systemRole:'admin'},'tasks','forged-approval','Forged direct delete'));
  await submitRecordDeletion(client('engineer'),'p',actor('engineer'),'tasks','forged-approval','Duplicate');
  const ref=doc(client('manager'),'artifacts/p/deletionRequests/tasks:forged-approval');
  const request=(await getDoc(ref)).data();
  await assertFails(updateDoc(ref,{status:'approved',reviewedBy:'manager@example.test',reviewedByUid:'manager',reviewedAt:serverTimestamp(),reviewReason:'No deletion in this transaction',history:[...request.history,{status:'approved',by:'manager@example.test',byUid:'manager',at:Timestamp.now(),reason:'No deletion in this transaction'}]}));
  assert.equal((await getDoc(doc(client('admin'),path))).exists(),true);
});
test('site owner project deletion retains linked site data and verification history',async()=>{
  await seed('projects/project-delete',{name:'Project',ownerId:'admin',createdBy:'admin@example.test'});
  await seed('artifacts/project-delete/tasks/retained',{activity:'Retained site record',createdBy:'engineer@example.test'});
  await assert.rejects(submitRecordDeletion(client('admin'),'project-delete',actor('admin'),'projects','project-delete','Project owner, not site owner'));
  await assertFails(deleteDoc(doc(client('admin'),'projects/project-delete')));
  await assert.rejects(submitRecordDeletion(client('engineer'),'project-delete',actor('engineer'),'projects','project-delete','Request instead'));
  await assertSucceeds(submitRecordDeletion(client('siteowner'),'project-delete',{...actor('siteowner'),systemRole:'admin'},'projects','project-delete','Close duplicate workspace entry'));
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    assert.equal((await getDoc(doc(db,'projects/project-delete'))).exists(),false);
    assert.equal((await getDoc(doc(db,'artifacts/project-delete/tasks/retained'))).exists(),true);
    assert.equal((await getDoc(doc(db,'artifacts/project-delete/deletionRequests/projects:project-delete'))).data().status,'deleted');
  });
});
test('site owner designation can only be read by its own account and never written from the app',async()=>{
  await assertSucceeds(getDoc(doc(client('siteowner'),'siteOwners/siteowner')));
  await assertFails(getDoc(doc(client('admin'),'siteOwners/siteowner')));
  await assertSucceeds(getDoc(doc(client('admin'),'siteOwners/admin')));
  await assertFails(setDoc(doc(client('admin'),'siteOwners/admin'),{note:'Self-promotion'}));
  await assertFails(setDoc(doc(client('owner'),'siteOwners/owner'),{}));
  await assertFails(deleteDoc(doc(client('siteowner'),'siteOwners/siteowner')));
  await assertFails(setDoc(doc(client('siteowner'),'siteOwners/admin'),{}));
});
test('site owner assigns, changes and removes access in any project',async()=>{
  const db=client('siteowner'),owner={email:'siteowner@example.test',uid:'siteowner'};
  await assertSucceeds(getDoc(doc(db,'artifacts/other/users/anyone@example.test')));
  await assert.rejects(grantProjectAccess(client('admin'),actor('admin'),'other',{email:'assigned@example.test',systemRole:'engineer'}));
  assert.equal(await grantProjectAccess(db,owner,'other',{email:' Assigned@Example.test ',name:'Assigned person',systemRole:'engineer'}),'created');
  await assertSucceeds(setDoc(doc(client('assigned'),'artifacts/other/tasks/assigned'),task('assigned@example.test')));
  await synchronizeProjectMembership(client('requester'),{email:'requester@example.test',uid:'requester'},'other','otherOwner');
  await assertFails(getDoc(doc(client('requester'),'artifacts/other/tasks/assigned')));
  assert.equal(await grantProjectAccess(db,owner,'other',{email:'requester@example.test',systemRole:'supervisor'}),'updated');
  await assertSucceeds(getDoc(doc(client('requester'),'artifacts/other/tasks/assigned')));
  await assertSucceeds(setProjectAccessRole(db,owner,'other','assigned@example.test','guest'));
  await assertFails(setDoc(doc(client('assigned'),'artifacts/other/tasks/assigned-again'),task('assigned@example.test')));
  await assert.rejects(setProjectAccessRole(db,owner,'other','assigned@example.test','pending'),/role/);
  await assertSucceeds(revokeProjectAccess(db,owner,'other','assigned@example.test','Left the project'));
  await assertFails(getDoc(doc(client('assigned'),'artifacts/other/tasks/assigned')));
  await env.withSecurityRulesDisabled(async context=>{
    const request=(await getDoc(doc(context.firestore(),'artifacts/other/deletionRequests/users:assigned@example.test'))).data();
    assert.equal(request.status,'deleted'); assert.equal(request.targetSnapshot.systemRole,'guest'); assert.equal(request.reason,'Left the project');
  });
});
test('site owner opening a project acts as admin without joining its roster',async()=>{
  const db=client('siteowner');
  await assertSucceeds(setDoc(doc(db,'artifacts/other/monitoring/siteowner'),{noise:60,confirmedBy:'siteowner@example.test',confirmedAt:'2026-01-01',...audit('siteowner@example.test')}));
  await assertSucceeds(updateDoc(doc(db,'projects/other'),{name:'Renamed by site owner'}));
  await assertFails(updateDoc(doc(db,'projects/other'),{ownerId:'siteowner'}));
});
