import { Buffer } from 'node:buffer';
import { test, expect } from '@playwright/test';
const errorsByPage = new WeakMap();
test.beforeEach(async ({page}) => { const errors=[]; errorsByPage.set(page,errors); page.on('pageerror',error=>errors.push(error.message)); });
test.afterEach(async ({page}) => { expect(errorsByPage.get(page)).toEqual([]); });
const open = (page, view='calendar', role='admin', suffix='') => page.goto(`/tests/browser/harness.html?view=${view}&role=${role}${suffix}`);
const fillActivity = async page => {
  await page.getByRole('button',{name:'+ Add activity'}).click();
  await page.getByLabel('Activity',{exact:true}).fill('Install formwork');
  await page.getByLabel('Zone',{exact:true}).selectOption('East');
  await page.getByLabel('Responsible person / trade').fill('Formwork team');
  await page.getByLabel('Planned start').fill('2026-10-01');
  await page.getByLabel('Planned finish').fill('2026-10-03');
};
test('planning role matrix and admin-only control panel', async ({page}) => {
  for (const role of ['guest','supervisor','engineer','manager','admin','RE','RTO']) {
    await open(page,'calendar',role);
    await expect(page.getByRole('heading',{name:'Site Planning',level:2})).toBeVisible();
    await expect(page.getByRole('button',{name:'+ Add activity'})).toHaveCount(['engineer','manager','admin'].includes(role)?1:0);
    await expect(page.getByRole('navigation',{name:'Main Project Navigation'}).getByRole('button',{name:'Admin Control Panel',exact:true})).toHaveCount(role === 'admin'?1:0);
    await open(page,'monitoring',role);
    await expect(page.getByRole('heading',{name:'Admin site observations'})).toHaveCount(role === 'admin'?1:0);
  }
});
test('activity save, edit and Gantt refresh from recorded data', async ({page}) => {
  await open(page); await fillActivity(page);
  await page.getByRole('button',{name:'Save activity',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Install formwork'})).toBeVisible();
  await expect(page.getByRole('region',{name:'Lookahead (Backlog)',exact:true}).getByRole('heading',{name:'Install formwork'})).toBeVisible();
  await expect(page.locator('[title="2026-10-01 → 2026-10-03 · 0% complete"]')).toBeVisible();
  await page.getByRole('button',{name:'Edit',exact:true}).click();
  await page.getByLabel('Workflow status').selectOption('in_progress');
  await page.getByLabel('Measured completion (%)').fill('40');
  await page.getByRole('button',{name:'Save activity',exact:true}).click();
  await expect(page.locator('[title="2026-10-01 → 2026-10-03 · 40% complete"]')).toBeVisible();
  await expect(page.getByRole('region',{name:'In Progress (Sprint)',exact:true}).getByRole('heading',{name:'Install formwork'})).toBeVisible();
  await expect(page.getByText('40.0%',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'RPT Progress'})).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(/SOPA|S\$|cashflow/i);
});
test('failed write retains form and does not add a phantom activity', async ({page}) => {
  await open(page,'calendar','engineer','&fail=1'); await fillActivity(page);
  await page.getByRole('button',{name:'Save activity',exact:true}).click();
  await expect(page.getByRole('alert')).toHaveText('Test write rejected');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByLabel('Activity',{exact:true})).toHaveValue('Install formwork');
});
test('supervisor records a general diary entry and guests cannot add entries', async ({page}) => {
  await open(page,'diary','supervisor');
  await page.getByRole('button',{name:'+ Add site entry'}).click();
  await page.getByLabel('Event date').fill('2026-01-01');
  await page.getByLabel('Event time').fill('09:00');
  await page.getByLabel('Category',{exact:true}).last().selectOption('Work progress');
  await page.getByLabel('Zone',{exact:true}).selectOption('East');
  await page.getByLabel('Title / activity').fill('Formwork installation');
  await page.getByLabel('What happened on site').fill('Installed and checked formwork in the eastern work area.');
  await page.getByRole('button',{name:'Submit site entry'}).click();
  await expect(page.getByRole('heading',{name:'Formwork installation'})).toBeVisible();
  await expect(page.getByText('Installed and checked formwork in the eastern work area.')).toBeVisible();
  await open(page,'diary','guest'); await expect(page.getByRole('button',{name:'+ Add site entry'})).toHaveCount(0);
});
// A small valid PNG is enough to exercise the in-browser resize to JPEG.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7ljmRAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==','base64');
test('engineers save a diary draft with photos, then submit it and the photos lock', async ({page}) => {
  await open(page,'diary','engineer');
  await page.getByRole('button',{name:'+ Add site entry'}).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button',{name:'Save as draft'}).click();
  await expect(dialog.getByRole('alert')).toHaveText('Enter a title to save the draft.');
  await dialog.getByLabel('Title / activity').fill('Slab pour preparation');
  await dialog.getByLabel('Add site photos').setInputFiles([{name:'pour-1.png',mimeType:'image/png',buffer:PNG},{name:'pour-2.png',mimeType:'image/png',buffer:PNG}]);
  await expect(dialog.getByText('Site photos (2/10)')).toBeVisible();
  await expect(dialog.getByRole('img',{name:'pour-1.jpg (not yet uploaded)'})).toBeVisible();
  await dialog.getByRole('button',{name:'Remove pour-2.jpg'}).click();
  await expect(dialog.getByText('Site photos (1/10)')).toBeVisible();
  await dialog.getByRole('button',{name:'Save as draft'}).click();
  await expect(page.getByRole('status').filter({hasText:'Draft saved with 1 new photo'})).toBeVisible();
  const item = page.getByRole('listitem').filter({has:page.getByRole('heading',{name:'Slab pour preparation'})});
  await expect(item.getByText('Draft',{exact:true})).toBeVisible();
  await item.getByRole('button',{name:'View photo 1 of 1: pour-1.jpg'}).click();
  await expect(page.getByRole('dialog').getByRole('img',{name:'Photo 1 of 1: pour-1.jpg'})).toBeVisible();
  await page.getByRole('dialog').getByRole('button',{name:'Close'}).click();

  await page.getByLabel('Status',{exact:true}).selectOption('Submitted');
  await expect(page.getByText('No diary entries for this selection.')).toBeVisible();
  await page.getByLabel('Status',{exact:true}).selectOption('Drafts');
  await page.getByRole('button',{name:'Continue draft Slab pour preparation'}).click();
  await dialog.getByRole('button',{name:'Submit site entry'}).click();
  // Submitting uses the browser's required-field checks; only "Save as draft" skips them.
  expect(await dialog.getByLabel('Event date').evaluate(el => el.validity.valueMissing)).toBe(true);
  await expect(page.getByRole('heading',{name:'Slab pour preparation'})).toBeVisible();
  await dialog.getByLabel('Event date').fill('2026-01-01');
  await dialog.getByLabel('Event time').fill('07:30');
  await dialog.getByLabel('Category',{exact:true}).selectOption('Work progress');
  await dialog.getByLabel('Zone',{exact:true}).selectOption('East');
  await dialog.getByLabel('What happened on site').fill('Rebar checked and formwork cleaned before the pour.');
  await dialog.getByRole('button',{name:'Submit site entry'}).click();
  await expect(page.getByRole('status').filter({hasText:'Site entry submitted.'})).toBeVisible();
  await page.getByLabel('Status',{exact:true}).selectOption('Submitted');
  await expect(item.getByText('Draft',{exact:true})).toHaveCount(0);
  await item.getByRole('button',{name:'Edit Slab pour preparation'}).click();
  await expect(dialog.getByText('Locked after submission')).toBeVisible();
  await expect(dialog.getByLabel('Add site photos')).toHaveCount(0);
  await expect(dialog.getByRole('button',{name:'Remove pour-1.jpg'})).toHaveCount(0);
  await expect(dialog.getByRole('button',{name:'Save as draft'})).toHaveCount(0);
  await dialog.getByRole('button',{name:'Save site entry'}).click();
  await expect(page.getByRole('status').filter({hasText:'Site entry updated.'})).toBeVisible();
});
test('diary drafts are visible to the site team only', async ({page}) => {
  for (const role of ['guest','RE','RTO','supervisor','engineer','manager','admin']) {
    await open(page,'diary',role,'&diaryDraft=1');
    await expect(page.getByRole('heading',{name:'Submitted note'})).toBeVisible();
    const team = ['supervisor','engineer','manager','admin'].includes(role);
    await expect(page.getByRole('heading',{name:'Unfinished note'})).toHaveCount(team?1:0);
    await expect(page.getByLabel('Status',{exact:true})).toHaveCount(team?1:0);
  }
});
test('BBS and concrete traceability are type-specific, and receiving needs a DO', async ({page}) => {
  await open(page,'materials','supervisor');
  await page.getByRole('button',{name:'+ Add material record'}).click();
  await page.getByLabel('Record type').selectOption('BBS');
  await page.getByLabel('Tag / batch / record reference').fill('TEST-BBS');
  await page.getByLabel('Zone',{exact:true}).selectOption('East');
  await page.getByLabel('Element / material description').fill('Beam rebar');
  await page.getByLabel('Supplier / batching plant').fill('Test supplier');
  await page.getByLabel('Quantity',{exact:true}).fill('2');
  await page.getByLabel('Unit (t, kg, m³, pieces…)').fill('t');
  await page.getByLabel('Required delivery date').fill('2026-10-01');
  await page.getByLabel('Drawing & revision').fill('D1 rev 2');
  await page.getByLabel('Bar mark',{exact:true}).fill('B1');
  await page.getByLabel('Diameter (mm)').fill('16');
  await page.getByLabel('Cutting length (mm)').fill('6000');
  await page.getByLabel('Number of bars').fill('20');
  await page.getByLabel('Site status').selectOption('Received');
  await page.getByRole('button',{name:'Save material record'}).click();
  await expect(page.getByRole('alert')).toContainText('delivery order reference');
  await page.getByLabel('DO number / receipt reference').fill('TEST-DO');
  await page.getByLabel('Actual receipt date').fill('2026-10-01');
  await page.getByRole('button',{name:'Save material record'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('cell',{name:'TEST-BBS BBS'})).toBeVisible();
  await page.getByRole('button',{name:'+ Add material record'}).click();
  await page.getByLabel('Record type').selectOption('Concrete');
  await expect(page.getByLabel('Mix grade')).toBeVisible();
  await expect(page.getByLabel('Drawing & revision')).toHaveCount(0);
});
test('admin confirms observations without pre-filled readings', async ({page}) => {
  await open(page,'monitoring');
  await expect(page.getByLabel('Boundary noise (dB(A))')).toHaveValue('');
  await page.getByLabel('Observed at (local time)').fill('2026-01-01T09:00');
  await page.getByLabel('Source / inspection reference').fill('Boundary meter log');
  await page.getByLabel('Boundary noise (dB(A))').fill('65.2');
  await page.getByRole('button',{name:'Confirm observations'}).click();
  await expect(page.getByRole('status')).toHaveText('Observations confirmed.');
  await expect(page.getByText('65.2 dB(A)',{exact:true})).toBeVisible();
  await expect(page.locator('dl').getByText('Not recorded',{exact:true})).toHaveCount(10);
});
test('mobile navigation reaches planning without restoring the removed analytics tab', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await open(page,'diary','engineer');
  await page.getByRole('button',{name:'Planning',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Site Planning',level:2})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('existing main-branch sprint statuses stay visible on the planning board', async ({page}) => {
  await open(page, 'calendar', 'supervisor', '&legacy=1');
  await expect(page.getByRole('region',{name:'In Progress (Sprint)',exact:true}).getByRole('heading',{name:'Existing sprint task'})).toBeVisible();
  await expect(page.getByRole('combobox',{name:'Move Existing sprint task'})).toHaveCount(0);
});
test('RFI steps follow engineer/manager → RE → RTO → engineer/manager → RE ownership', async ({page}) => {
  for (const [role,status,label] of [['engineer','draft','Open RFI'],['supervisor','draft',null],['guest','draft',null],['manager','opened','Submit for RE review'],['RE','opened',null],
    ['RE','re_review','Allow site inspection'],['engineer','re_review',null],['RTO','re_review',null],['RTO','site_inspection','Allow next work'],['RE','site_inspection',null],
    ['manager','next_work','Apply for RFI closure'],['RTO','next_work',null],['RE','closure_applied','Approve RFI closure'],['engineer','closure_applied',null],['admin','closure_applied','Approve RFI closure']]) {
    await open(page,'inspections',role,`&status=${status}`);
    await expect(page.getByRole('heading',{name:'Test slab',exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:/ →$/})).toHaveCount(label?1:0);
    if (label) await expect(page.getByRole('button',{name:`${label} →`})).toBeVisible();
  }
  await open(page,'inspections','RE','&stage=1');
  await expect(page.getByRole('button',{name:'Allow site inspection →'})).toBeVisible();
});
test('admin walks an RFI from draft to closed with audit history', async ({page}) => {
  await open(page,'inspections','admin');
  for (const label of ['Open RFI','Submit for RE review','Allow site inspection','Allow next work','Apply for RFI closure','Approve RFI closure']) {
    await page.getByRole('button',{name:`${label} →`}).click();
  }
  await expect(page.getByText('✓ RFI closed')).toBeVisible();
  await expect(page.getByRole('list',{name:'TEST-RFI review stages'}).getByRole('listitem')).toHaveCount(7);
  await page.getByRole('button',{name:/Show Comments & History/}).click();
  for (const text of ['Opened RFI','Submitted for RE review','RE allowed site inspection (RTO)','RTO allowed next work','Applied for RFI closure','RE approved closure — RFI closed'])
    await expect(page.getByText(text,{exact:true})).toBeVisible();
});
test('engineers draft RFIs with automatic references and attach PDFs before RE submission', async ({page}) => {
  await open(page,'inspections','supervisor');
  await expect(page.getByRole('button',{name:'+ Add RFI'})).toHaveCount(0);
  await open(page,'inspections','engineer','&email=engineer@example.test');
  await page.getByRole('button',{name:'+ Add RFI'}).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('RFI ID')).toHaveText('Select a zone and discipline');
  await dialog.getByLabel('Zone',{exact:true}).selectOption('East');
  await dialog.getByLabel('Discipline').selectOption('Structural');
  await expect(dialog.getByLabel('RFI ID')).toHaveText('Test project_East-STR-001');
  await dialog.getByLabel('Discipline').selectOption('Architectural');
  await expect(dialog.getByLabel('RFI ID')).toHaveText('Test project_East-AR-001');
  await dialog.getByLabel('Element',{exact:true}).fill('Level 3 wall');
  await dialog.getByLabel('Target cast').fill('');
  await dialog.getByRole('button',{name:/Open RFI/}).click();
  await expect(dialog.getByRole('alert')).toContainText('target cast date');
  await dialog.getByRole('button',{name:'Save as draft'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const id = 'Test project_East-AR-001';
  const card = page.getByRole('article').filter({hasText:id});
  await expect(card.locator('.badge',{hasText:/^Draft$/})).toBeVisible();
  await page.getByLabel(`Upload PDF to ${id}`).setInputFiles({name:'notes.txt',mimeType:'text/plain',buffer:Buffer.from('x')});
  await expect(page.getByRole('alert')).toContainText('Only PDF files');
  await page.getByLabel(`Document type for ${id}`).selectOption('Reference');
  await page.getByLabel(`Upload PDF to ${id}`).setInputFiles([{name:'Drawing A-101.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4')},{name:'Checklist.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4')}]);
  await expect(page.getByRole('status').filter({hasText:'2 PDFs attached'})).toBeVisible();
  await expect(card.getByText('Drawing A-101.pdf')).toBeVisible();
  await card.getByRole('button',{name:'Remove Checklist.pdf'}).click();
  await expect(card.getByText('Checklist.pdf')).toHaveCount(0);
  await card.getByRole('button',{name:'Open Drawing A-101.pdf'}).click();
  await expect(page.getByText('Opened Drawing A-101.pdf')).toBeVisible();
  await card.getByRole('button',{name:'Edit'}).click();
  await page.getByRole('dialog').getByLabel('Target cast').fill('2026-11-20');
  await expect(page.getByRole('dialog').getByLabel('RFI ID')).toHaveText(id);
  await page.getByRole('dialog').getByRole('button',{name:/Save RFI/}).click();
  await card.getByRole('button',{name:'Open RFI →'}).click();
  await card.getByRole('button',{name:'Submit for RE review →'}).click();
  await expect(card.locator('.badge',{hasText:/^Under RE Review$/})).toBeVisible();
  await expect(page.getByLabel(`Upload PDF to ${id}`)).toHaveCount(0);
  await expect(card.getByRole('button',{name:'Remove Drawing A-101.pdf'})).toHaveCount(0);
  await expect(card.getByText('Locked after RE submission')).toBeVisible();
  await expect(card.getByText('Awaiting RE')).toBeVisible();
});
test('RTO comments persist and rejected comments retain the input', async ({page}) => {
  await open(page,'inspections','RTO');
  await page.getByRole('button',{name:/Show Comments & History/}).click();
  await page.getByLabel('Comment on TEST-RFI').fill('Site inspection observation');
  await page.getByRole('button',{name:'Send',exact:true}).click();
  await expect(page.getByText('Site inspection observation',{exact:true})).toBeVisible();
  await expect(page.getByLabel('Comment on TEST-RFI')).toHaveValue('');
  await open(page,'inspections','RTO','&fail=1');
  await page.getByRole('button',{name:/Show Comments & History/}).click();
  await page.getByLabel('Comment on TEST-RFI').fill('Keep this comment');
  await page.getByRole('button',{name:'Send',exact:true}).click();
  await expect(page.getByRole('alert')).toHaveText('Test write rejected');
  await expect(page.getByLabel('Comment on TEST-RFI')).toHaveValue('Keep this comment');
});
test('admins delete RFIs directly while creators request independent verification', async ({page}) => {
  await open(page,'inspections','admin','&fail=1');
  await page.getByRole('button',{name:'Delete Test slab',exact:true}).click();
  await page.getByLabel('Reason for deletion').fill('Duplicate RFI');
  await page.getByRole('button',{name:'Delete record',exact:true}).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText('Test write rejected');
  await expect(page.getByRole('heading',{name:'Test slab',exact:true})).toHaveCount(1);
  await open(page,'inspections','supervisor');
  await expect(page.getByRole('button',{name:'Request deletion of Test slab',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Delete Test slab',exact:true})).toHaveCount(0);
});
test('organisation editing preserves upstream manager access and removes gate controls', async ({page}) => {
  await open(page,'users','manager');
  await page.getByLabel('Organisation for Test member').fill('Updated organisation');
  await page.getByLabel('Organisation for Test member').blur();
  await expect(page.getByLabel('Organisation for Test member')).toHaveValue('Updated organisation');
  await expect(page.getByRole('columnheader',{name:/Access Record/})).toHaveCount(0);
  await open(page,'users','manager','&fail=1');
  await page.getByLabel('Organisation for Test member').fill('Failed organisation');
  await page.getByLabel('Organisation for Test member').blur();
  await expect(page.getByRole('alert')).toHaveText('Test write rejected');
  await expect(page.getByLabel('Organisation for Test member')).toHaveValue('Original organisation');
  await open(page,'users','engineer');
  await expect(page.getByLabel('Organisation for Test member')).toHaveCount(0);
});

test('header actions dropdown opens both existing actions and supports keyboard dismissal', async ({page}) => {
  await open(page,'account','guest');
  await expect(page.getByRole('menuitem')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Edit profile',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Log out',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Actions',exact:true}).focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem',{name:'Projects',exact:true})).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem',{name:'Generate Executive Brief'})).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Actions',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Actions',exact:true}).click();
  await page.getByRole('menuitem',{name:'Projects',exact:true}).click();
  await expect(page.getByRole('status')).toHaveText('Project selection opened');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await page.getByRole('button',{name:'Actions',exact:true}).click();
  await page.getByRole('menuitem',{name:'Generate Executive Brief'}).click();
  await expect(page.getByRole('status')).toHaveText('Executive brief opened');
  await page.getByRole('button',{name:'Actions',exact:true}).click();
  await page.getByRole('heading',{name:'RE/RTO Inspections (RFI)'}).click();
  await expect(page.getByRole('menu')).toHaveCount(0);
});
test('personal profile saves and reopens without exposing email or access editing', async ({page}) => {
  await open(page,'account','guest');
  await page.getByRole('button',{name:'Edit profile',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Edit profile'})).toBeVisible();
  await expect(page.getByLabel('Sign-in email')).toHaveAttribute('readonly','');
  await expect(page.getByLabel('Full name')).toBeFocused();
  await page.getByLabel('Full name').fill('Updated person');
  await page.getByLabel('Job title').fill('Site supervisor');
  await page.getByLabel('Contact phone').fill('+65 6123 4567');
  await page.getByLabel('Birthday',{exact:true}).fill('1990-01-01');
  await page.getByRole('button',{name:'Save profile'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button',{name:'Edit profile',exact:true}).click();
  await expect(page.getByLabel('Full name')).toHaveValue('Updated person');
  await expect(page.getByLabel('Job title')).toHaveValue('Site supervisor');
  await expect(page.getByLabel('Contact phone')).toHaveValue('+65 6123 4567');
  await expect(page.getByRole('dialog').getByRole('combobox')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'Edit profile',exact:true})).toBeFocused();
});
test('failed profile saves and logout keep the current account usable', async ({page}) => {
  await open(page,'account','guest','&fail=1');
  await page.getByRole('button',{name:'Edit profile',exact:true}).click();
  await page.getByLabel('Full name').fill('Keep this edit');
  await page.getByRole('button',{name:'Save profile'}).click();
  await expect(page.getByRole('alert')).toHaveText('Test write rejected');
  await expect(page.getByLabel('Full name')).toHaveValue('Keep this edit');
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.getByRole('button',{name:'Log out',exact:true}).click();
  await expect(page.getByRole('alert')).toHaveText('Could not log out. Please try again.');
  await expect(page.getByRole('button',{name:'Log out',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Actions',exact:true}).click();
  await expect(page.getByRole('menu')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
test('mobile account controls fit the header and logout dispatches', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await open(page,'account');
  await page.getByRole('button',{name:'Actions',exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Log out',exact:true}).click();
  await expect(page.getByRole('status')).toHaveText('Logged out');
});
test('site owner controls projects and assigns project access from project selection', async ({page}) => {
  await open(page,'projects','admin','&siteOwner=false');
  await expect(page.getByRole('heading',{name:'Select Project'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Add New Project'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:/^Delete /})).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Project access control'})).toHaveCount(0);

  await open(page,'projects');
  await expect(page.getByText('Site owner',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Add New Project'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Delete Test project'})).toBeVisible();
  const panel = page.getByRole('region',{name:'Project access control'});
  await expect(panel.getByText('1 access request awaiting a role on Test project.')).toBeVisible();
  await panel.getByLabel('Project role for New requester').selectOption('supervisor');
  await expect(panel.getByRole('status')).toHaveText('New requester is now Supervisor on Test project.');
  await expect(panel.getByText('access request awaiting')).toHaveCount(0);

  await panel.getByLabel('Project',{exact:true}).selectOption('second-project');
  await expect(panel.getByText('No accounts have access to this project yet.')).toBeVisible();
  await panel.getByLabel('Sign-in email').fill('Engineer@Example.test');
  await panel.getByLabel('Project role',{exact:true}).selectOption('engineer');
  await panel.getByRole('button',{name:'Grant access'}).click();
  await expect(panel.getByRole('status')).toHaveText('engineer@example.test can now open Second project.');
  await expect(panel.getByLabel('Project role for engineer@example.test')).toHaveValue('engineer');

  await panel.getByRole('button',{name:'Delete engineer@example.test'}).click();
  await page.getByRole('dialog').getByLabel('Reason for deletion').fill('Left the project');
  await page.getByRole('dialog').getByRole('button',{name:'Delete record'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(panel.getByText('No accounts have access to this project yet.')).toBeVisible();
  await expect(panel.getByRole('status')).toHaveText('Access removed. The membership snapshot and reason are retained.');
});
test('failed access changes keep the form and show an error', async ({page}) => {
  await open(page,'projects','admin','&fail=1');
  const panel = page.getByRole('region',{name:'Project access control'});
  await panel.getByLabel('Sign-in email').fill('someone@example.test');
  await panel.getByRole('button',{name:'Grant access'}).click();
  await expect(panel.getByRole('alert')).toHaveText('Test write rejected');
  await expect(panel.getByLabel('Sign-in email')).toHaveValue('someone@example.test');
});
