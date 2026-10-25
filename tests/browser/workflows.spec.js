import { test, expect } from '@playwright/test';
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
  for (const role of ['guest','supervisor','engineer','manager','admin']) {
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
  await expect(page.getByRole('cell',{name:'Install formwork East'})).toBeVisible();
  await expect(page.locator('[title="2026-10-01 → 2026-10-03 · 0% complete"]')).toBeVisible();
  await page.getByRole('button',{name:'Edit',exact:true}).click();
  await page.getByLabel('Workflow status').selectOption('In progress');
  await page.getByLabel('Measured completion (%)').fill('40');
  await page.getByRole('button',{name:'Save activity',exact:true}).click();
  await expect(page.locator('[title="2026-10-01 → 2026-10-03 · 40% complete"]')).toBeVisible();
  await page.getByRole('button',{name:'RPT Progress'}).click();
  await expect(page.getByText('40.0%',{exact:true})).toBeVisible();
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
test('mobile navigation reaches planning and progress without overflowing the page', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await open(page,'diary','engineer');
  await page.getByRole('button',{name:'PLAN Planning'}).click();
  await expect(page.getByRole('heading',{name:/Site Planning/})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
