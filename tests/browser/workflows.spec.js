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
    await expect(page.getByRole('heading',{name:/Site Planning/})).toBeVisible();
    await expect(page.getByRole('button',{name:'+ Add activity'})).toHaveCount(['engineer','manager','admin'].includes(role)?1:0);
    await expect(page.getByRole('button',{name:'ADM Admin'})).toHaveCount(role === 'admin'?1:0);
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
  await page.getByRole('button',{name:'Save site entry'}).click();
  await expect(page.getByRole('heading',{name:'Formwork installation'})).toBeVisible();
  await expect(page.getByText('Installed and checked formwork in the eastern work area.')).toBeVisible();
  await open(page,'diary','guest'); await expect(page.getByRole('button',{name:'+ Add site entry'})).toHaveCount(0);
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
  await expect(page.getByText('Not recorded',{exact:true})).toHaveCount(10);
});
test('mobile navigation reaches planning without restoring the removed analytics tab', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await open(page,'diary','engineer');
  await page.getByRole('button',{name:'PLAN Planning'}).click();
  await expect(page.getByRole('heading',{name:/Site Planning/})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('existing main-branch sprint statuses stay visible on the planning board', async ({page}) => {
  await open(page, 'calendar', 'supervisor', '&legacy=1');
  await expect(page.getByRole('region',{name:'In Progress (Sprint)',exact:true}).getByRole('heading',{name:'Existing sprint task'})).toBeVisible();
  await expect(page.getByRole('combobox',{name:'Move Existing sprint task'})).toHaveCount(0);
});
test('five-stage inspections keep creator and RE permissions distinct', async ({page}) => {
  for (const [role,stage,allowed] of [['supervisor',0,true],['engineer',1,false],['RE',1,true],['RTO',1,false],['supervisor',2,true],['manager',3,false],['RE',3,true],['admin',3,true],['guest',0,false]]) {
    await open(page,'inspections',role,`&stage=${stage}`);
    await expect(page.getByRole('button',{name:'Advance Sign-Off →'})).toHaveCount(allowed?1:0);
    if (role === 'RE' && stage === 3) {
      await page.getByRole('button',{name:'Advance Sign-Off →'}).click();
      await expect(page.getByText('✓ Inspection closed')).toBeVisible();
      await page.getByRole('button',{name:/Show Comments & History/}).click();
      await expect(page.getByText('Advanced inspection')).toBeVisible();
    }
  }
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
test('only admins can delete RFIs, and a failed delete preserves the inspection', async ({page}) => {
  await open(page,'inspections','admin','&fail=1');
  await page.getByRole('button',{name:'Edit',exact:true}).click();
  page.once('dialog', dialog=>dialog.accept());
  await page.getByRole('button',{name:'Delete RFI'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText('Test write rejected');
  await open(page,'inspections','supervisor');
  await page.getByRole('button',{name:'Edit',exact:true}).click();
  await expect(page.getByRole('button',{name:'Delete RFI'})).toHaveCount(0);
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
  await expect(page.getByRole('combobox')).toHaveCount(0);
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
