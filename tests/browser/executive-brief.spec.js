import { test, expect } from '@playwright/test';

const openBrief = async page => {
  await page.goto('/tests/browser/harness.html?view=calendar&seed=1');
  await page.getByRole('button', { name: 'Actions', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Generate Executive Brief' }).click();
};

test('the brief checklist chooses which sections are shown and is remembered', async ({ page }) => {
  await openBrief(page);
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('checkbox', { name: /Progress summary/ })).toBeChecked();
  await expect(dialog.getByText('Recorded progress')).toBeVisible();
  await dialog.getByRole('checkbox', { name: /Progress summary/ }).uncheck();
  await expect(dialog.getByText('Recorded progress')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Clear' }).click();
  await expect(dialog.getByText('Select at least one item above to build the brief.')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Print / Export PDF' })).toBeDisabled();
  await dialog.getByRole('checkbox', { name: /Blocked activities/ }).check();
  await dialog.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: 'Actions', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Generate Executive Brief' }).click();
  await expect(page.getByRole('dialog').getByRole('checkbox', { name: /Blocked activities/ })).toBeChecked();
  await expect(page.getByRole('dialog').getByRole('checkbox', { name: /Project Gantt chart/ })).not.toBeChecked();
});

test('an iPhone Home Screen app prints through the share sheet with a PDF', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'standalone', { value: true });
    navigator.canShare = data => !!data?.files?.length;
    navigator.share = async data => { document.body.dataset.shared = `${data.files[0].name}|${data.files[0].type}|${data.files[0].size > 1000}`; };
    window.print = () => { document.body.dataset.printRequested = 'true'; };
  });
  await openBrief(page);
  await page.getByRole('dialog').getByRole('button', { name: 'Print / Share PDF' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-shared', /executive-brief-\d{4}-\d{2}-\d{2}\.pdf\|application\/pdf\|true$/);
  await expect(page.locator('body')).not.toHaveAttribute('data-print-requested', 'true');
});

test('the brief shows each open RFI stage, responsible person, last update and comment, and diary authorship', async ({ page }) => {
  await page.goto('/tests/browser/harness.html?view=calendar&seed=1&status=re_review&thread=1&briefDiary=1');
  await page.getByRole('button', { name: 'Actions', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Generate Executive Brief' }).click();
  const rfis = page.getByRole('dialog').getByRole('region', { name: /Open inspections/ });
  await expect(rfis.getByText('Under RE Review', { exact: true })).toBeVisible();
  await expect(rfis.getByText('Fixture RE (RE)', { exact: true })).toBeVisible();
  await expect(rfis.getByText('2026-11-01 10:15 by Fixture RE')).toBeVisible();
  await expect(rfis.getByText('“Bring the rebar schedule”')).toBeVisible();
  await expect(rfis.getByText('Fixture RE (RE) · 2026-11-01 10:15 · Under RE Review')).toBeVisible();
  const diary = page.getByRole('dialog').getByRole('region', { name: 'Recent diary entries' });
  await expect(diary.getByText('2026-11-02 · 16:20')).toBeVisible();
  await expect(diary.getByText('Fixture Creator', { exact: true })).toBeVisible();
  await expect(diary.getByText('Supervisor to cure slab')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('dialog').getByRole('button', { name: 'Download PDF' }).click();
  expect((await download).suggestedFilename()).toMatch(/^Test-project-executive-brief-\d{4}-\d{2}-\d{2}\.pdf$/);
});
