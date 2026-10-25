import { before, after, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
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
    for(const role of ['admin','manager','engineer','supervisor','guest']) await setDoc(doc(db,`artifacts/p/users/${role}@example.test`),{email:`${role}@example.test`,systemRole:role});
    await setDoc(doc(db,'artifacts/p/tasks/existing'),task('admin@example.test'));
  });
});
after(async()=>{await env?.cleanup();});
for(const role of ['admin','manager','engineer','supervisor','guest']) {
  test(`${role}: planning write permission`,async()=>{
    const result=setDoc(doc(client(role),`artifacts/p/tasks/${role}`),task(`${role}@example.test`));
    await (['admin','manager','engineer'].includes(role)?assertSucceeds(result):assertFails(result));
  });
  test(`${role}: diary and material write permission`,async()=>{
    const db=client(role), email=`${role}@example.test`;
    const check=role === 'guest'?assertFails:assertSucceeds;
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
