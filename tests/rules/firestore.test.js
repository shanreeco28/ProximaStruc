import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, getDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { createMemberProfile, INSPECTION_STAGES, canAdvanceInspection } from '../../src/utils/siteData.js';
import { synchronizeProjectMembership } from '../../src/services/projectMembership.js';
import { saveOwnProjectProfile } from '../../src/services/personalProfile.js';
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
test('verified new registrations can read and create only their own guest profile',async()=>{
  const db=client('newcomer');
  const ref=doc(db,'artifacts/p/users/newcomer@example.test');
  await assertSucceeds(getDoc(ref));
  const profile=createMemberProfile({email:'newcomer@example.test',displayName:'New person'},{designation:'Site supervisor'},false,'2026-10-26');
  await assertFails(setDoc(ref,{...profile,systemRole:'admin'}));
  await assertFails(setDoc(ref,{...profile,certExpiry:'2028-12-31'}));
  await assertSucceeds(synchronizeProjectMembership(db,{email:'newcomer@example.test',uid:'newcomer',displayName:'New person'},'p','owner',{designation:'Site supervisor'}));
  await assertFails(updateDoc(ref,{systemRole:'admin',...changed('newcomer')}));
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
test('five-stage RFI transitions enforce the same role matrix as the interface',async()=>{
  for(const role of ['admin','manager','engineer','supervisor','guest','RE','RTO']) for(let stage=0;stage<4;stage++) {
    const path=`artifacts/p/inspections/transition-${role}-${stage}`;
    await seed(path,{stage,history:[],comments:[],...audit('supervisor@example.test')});
    const entry={email:`${role}@example.test`,user:role,role,timestamp:'2026-10-26',action:`Advanced to ${INSPECTION_STAGES[stage+1]}`};
    const result=updateDoc(doc(client(role),path),{stage:stage+1,history:[entry],...changed(role)});
    await (canAdvanceInspection({systemRole:role},{stage})?assertSucceeds(result):assertFails(result));
  }
});
test('RFIs cannot skip stages, forge discussion identity or erase existing history',async()=>{
  const path='artifacts/p/inspections/history';
  const previous={email:'admin@example.test',user:'Admin',role:'admin',timestamp:'2026-10-25',action:`Advanced to ${INSPECTION_STAGES[1]}`};
  await seed(path,{stage:1,history:[previous],comments:[],...audit('supervisor@example.test')});
  const entry={email:'RE@example.test',user:'RE',role:'RE',timestamp:'2026-10-26',action:`Advanced to ${INSPECTION_STAGES[2]}`};
  await assertFails(updateDoc(doc(client('RE'),path),{stage:4,history:[previous,entry],...changed('RE')}));
  await assertFails(updateDoc(doc(client('RE'),path),{stage:2,history:[entry],...changed('RE')}));
  await assertSucceeds(updateDoc(doc(client('RE'),path),{stage:2,history:[previous,entry],...changed('RE')}));
  const comment={email:'RTO@example.test',user:'RTO',role:'RTO',text:'Observation',timestamp:'2026-10-26'};
  await assertSucceeds(updateDoc(doc(client('RTO'),path),{comments:arrayUnion(comment),...changed('RTO')}));
  await assertFails(updateDoc(doc(client('guest'),path),{comments:arrayUnion({...comment,text:'Forged'}),...changed('guest')}));
  await assertFails(updateDoc(doc(client('RTO'),path),{comments:[],...changed('RTO')}));
});
test('inspection metadata edits cannot overwrite discussion or bypass stage permissions',async()=>{
  const path='artifacts/p/inspections/creator-edit';
  await seed(path,{stage:0,history:[],comments:[],element:'Slab',...audit('supervisor@example.test')});
  await assertSucceeds(updateDoc(doc(client('supervisor'),path),{element:'Updated slab',...changed('supervisor')}));
  await assertFails(updateDoc(doc(client('manager'),path),{element:'Other creator',...changed('manager')}));
  await assertFails(updateDoc(doc(client('supervisor'),path),{stage:4,...changed('supervisor')}));
  await assertFails(updateDoc(doc(client('RE'),path),{element:'Reviewer edit',...changed('RE')}));
  await assertFails(deleteDoc(doc(client('supervisor'),path)));
  await assertSucceeds(deleteDoc(doc(client('admin'),path)));
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
