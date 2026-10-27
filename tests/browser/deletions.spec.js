import { test, expect } from '@playwright/test';
const open=(page,role='engineer',suffix='')=>page.goto(`/tests/browser/harness.html?view=deletions&role=${role}&seed=1${suffix}`);
test('creators keep records until independent manager verification',async({page})=>{
  await open(page);
  await page.getByLabel('Record type for deletion').selectOption('materials');
  await page.getByRole('button',{name:'Request deletion of DO-001'}).click();
  await page.getByLabel('Reason for deletion').fill('Duplicate delivery order');
  await page.getByRole('button',{name:'Submit deletion request'}).click();
  await expect(page.getByRole('button',{name:'Deletion pending for DO-001'})).toBeDisabled();
  await page.getByLabel('Test reviewer account').selectOption('manager');
  await page.getByRole('button',{name:'Verify & delete',exact:true}).click();
  await page.getByLabel('Verification notes').fill('Checked duplicate with site register');
  await page.getByRole('button',{name:'Confirm verified deletion'}).click();
  await expect(page.getByText('approved',{exact:true})).toBeVisible();
  await expect(page.getByText('No records of this type.')).toBeVisible();
});
test('managers cannot verify their own requests; rejection keeps the record',async({page})=>{
  await open(page,'manager');
  await page.getByRole('button',{name:'Request deletion of Existing sprint task'}).click();
  await page.getByLabel('Reason for deletion').fill('Duplicate activity');
  await page.getByRole('button',{name:'Submit deletion request'}).click();
  await expect(page.getByText('Another admin or manager must verify your request.')).toBeVisible();
  await expect(page.getByRole('button',{name:'Verify & delete',exact:true})).toHaveCount(0);
  await page.getByLabel('Test reviewer account').selectOption('admin');
  await page.getByRole('button',{name:'Reject request',exact:true}).click();
  await page.getByLabel('Verification notes').fill('Keep this activity in the schedule');
  await page.getByRole('button',{name:'Confirm rejection'}).click();
  await expect(page.getByText('rejected',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Delete Existing sprint task'})).toBeVisible();
});
test('other users have no delete or request controls for records they did not create',async({page})=>{
  await open(page,'guest','&email=other@example.test');
  await expect(page.getByRole('button',{name:/Request deletion of|^Delete /})).toHaveCount(0);
});
test('admin direct deletion requires a reason and failed deletion keeps the record',async({page})=>{
  await open(page,'admin','&fail=1');
  await page.getByLabel('Record type for deletion').selectOption('lifts');
  await page.getByRole('button',{name:'Delete Crane PTW'}).click();
  await page.getByLabel('Reason for deletion').fill('Duplicate permit');
  await page.getByRole('button',{name:'Delete record',exact:true}).click();
  await expect(page.getByRole('alert')).toHaveText('Test write rejected');
  await expect(page.getByLabel('Reason for deletion')).toHaveValue('Duplicate permit');
});
