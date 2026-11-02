import { before, after, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';
let env;
const pdf = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52]);
const meta = role => ({ contentType: 'application/pdf', customMetadata: { uploadedBy: `${role}@example.test` } });
const storage = (role, verified = true) => env.authenticatedContext(role, { email: `${role}@example.test`, email_verified: verified }).storage();
const path = name => `projects/p/inspections/Test project_Zone A-STR-001/${name}`;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-proximastruc',
    firestore: { host: '127.0.0.1', port: 8085, rules: await readFile('firestore.rules', 'utf8') },
    storage: { host: '127.0.0.1', port: 9199, rules: await readFile('storage.rules', 'utf8') },
  });
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'projects/p'), { name: 'Test project', ownerId: 'owner' });
    await setDoc(doc(db, 'siteOwners/siteowner'), { note: 'Console' });
    for (const role of ['admin', 'manager', 'engineer', 'supervisor', 'guest', 'RE', 'RTO', 'pending']) await setDoc(doc(db, `artifacts/p/users/${role.toLowerCase()}@example.test`), { email: `${role}@example.test`, systemRole: role });
  });
});
after(async () => { await env?.cleanup(); });
test('engineers, managers, admins and the site owner upload RFI PDFs', async () => {
  for (const role of ['engineer', 'manager', 'admin', 'siteowner']) await assertSucceeds(uploadBytes(ref(storage(role), path(`0b5c1d2e-aaaa-bbbb-cccc-${role.padEnd(12, '0').slice(0, 12)}.pdf`)), pdf, meta(role)));
  for (const role of ['supervisor', 'guest', 'RE', 'RTO', 'pending', 'stranger']) await assertFails(uploadBytes(ref(storage(role), path(`0b5c1d2e-aaaa-bbbb-cccc-${role.padEnd(12, '0').slice(0, 12)}.pdf`)), pdf, meta(role)));
  await assertFails(uploadBytes(ref(storage('engineer', false), path('0b5c1d2e-aaaa-bbbb-cccc-unverified00.pdf')), pdf, meta('engineer')));
});
test('only PDFs with honest uploader metadata and safe names are accepted', async () => {
  await assertFails(uploadBytes(ref(storage('engineer'), path('0b5c1d2e-aaaa-bbbb-cccc-000000000010.pdf')), pdf, { contentType: 'image/png', customMetadata: { uploadedBy: 'engineer@example.test' } }));
  await assertFails(uploadBytes(ref(storage('engineer'), path('0b5c1d2e-aaaa-bbbb-cccc-000000000011.pdf')), pdf, meta('manager')));
  await assertFails(uploadBytes(ref(storage('engineer'), path('report.exe')), pdf, meta('engineer')));
  await assertFails(uploadBytes(ref(storage('engineer'), 'other/place.pdf'), pdf, meta('engineer')));
});
test('members read PDFs; uploads cannot be overwritten or deleted', async () => {
  const name = path('0b5c1d2e-aaaa-bbbb-cccc-engineer0000.pdf');
  for (const role of ['guest', 'RE', 'RTO', 'supervisor']) await assertSucceeds(getBytes(ref(storage(role), name)));
  await assertFails(getBytes(ref(storage('pending'), name)));
  await assertFails(getBytes(ref(storage('stranger'), name)));
  await assertFails(uploadBytes(ref(storage('engineer'), name), pdf, meta('engineer')));
  await assertFails(deleteObject(ref(storage('admin'), name)));
});
