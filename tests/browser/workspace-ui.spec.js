import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const open = (page, view, suffix = '') => page.goto(`/tests/browser/harness.html?view=${view}&seed=1${suffix}`);
const darkMode = async page => {
  await page.getByRole('button', { name: 'Actions', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Dark mode', exact: true }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
};

test('collapsed sidebar preserves named navigation, zone access and the saved preference', async ({ page }) => {
  await open(page, 'materials');
  const sidebar = page.getByRole('complementary', { name: 'Project sidebar' });
  const expanded = await sidebar.boundingBox();
  await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Expand sidebar', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await expect.poll(async () => (await sidebar.boundingBox()).width).toBeLessThan(expanded.width / 2);
  await expect(page.getByLabel('Project zone', { exact: true })).toBeVisible();
  const diary = sidebar.getByRole('button', { name: 'Site Diary', exact: true });
  await diary.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Daily site diary' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Expand sidebar', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Expand sidebar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Collapse sidebar', exact: true })).toHaveAttribute('aria-expanded', 'true');
});

test('theme shortcut hides after 15 idle seconds, resets on activity and remains available from Actions', async ({ page }) => {
  await page.clock.install();
  await open(page, 'materials');
  const shortcut = page.locator('.theme-shortcut');
  await expect(shortcut).toBeVisible();
  await page.clock.runFor(14000);
  await page.mouse.move(600, 400);
  await page.clock.runFor(14000);
  await expect(shortcut).toBeVisible();
  await page.clock.runFor(1001);
  await expect(shortcut).toBeHidden();
  await darkMode(page);
  await expect(shortcut).toBeVisible();
  await expect(shortcut).toHaveAccessibleName('Use light theme');
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(shortcut).toHaveAccessibleName('Use light theme');
  await page.getByRole('heading', { level: 1 }).click();
  await shortcut.click();
  await page.clock.runFor(15001);
  await expect(shortcut).toBeHidden();
  await page.keyboard.press('Tab');
  await shortcut.focus();
  await page.clock.runFor(16000);
  await expect(shortcut).toBeVisible();
  await expect(shortcut).toBeFocused();
});

test('theme preference carries into login and the floating control is only shown after login', async ({ page }) => {
  await open(page, 'materials');
  await darkMode(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.locator('.theme-shortcut')).toHaveCount(0);
  await page.getByRole('button', { name: 'Use light theme' }).click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
});

test('materials search is case insensitive and combines with type filters without changing records', async ({ page }) => {
  await open(page, 'materials', '&role=guest');
  const search = page.getByRole('searchbox', { name: 'Search materials' });
  await search.fill('SUPPLIER east');
  await expect(page.getByRole('cell', { name: 'DO-001 Delivery Order' })).toBeVisible();
  await page.getByRole('button', { name: 'BBS', exact: true }).click();
  await expect(page.getByText('No material records for this selection.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear search materials' }).click();
  await expect(search).toBeFocused();
  await expect(page.getByText('No material records for this selection.')).toBeVisible();
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await search.fill('DO-001 2026-10-01');
  await expect(page.getByRole('cell', { name: 'DO-001 Delivery Order' })).toBeVisible();
  await search.fill('missing-reference');
  await expect(page.getByRole('status')).toHaveText('0 of 1 records');
  await search.fill('');
  await expect(page.getByRole('status')).toHaveText('1 of 1 records');
});

test('RFI search combines reference and zone with the discipline filter and a clear empty state', async ({ page }) => {
  await open(page, 'inspections');
  const search = page.getByRole('searchbox', { name: 'Search RFIs' });
  await search.fill('test-rfi EAST');
  await expect(page.getByRole('heading', { name: 'Test slab', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'M&E Sleeve / Conduit', exact: true }).click();
  await expect(page.getByText('No RFI records for this selection.')).toBeVisible();
  await page.getByRole('button', { name: 'Structural', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Test slab', exact: true })).toBeVisible();
  await search.fill('unmatched');
  await expect(page.getByText('No RFI records for this selection.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear search rfis' }).click();
  await expect(page.getByRole('heading', { name: 'Test slab', exact: true })).toBeVisible();
});

test('diary search handles accents, details and combined date/category filters', async ({ page }) => {
  await open(page, 'diary');
  for (const [date, category, title, details] of [
    ['2026-01-01', 'Work progress', 'Crème finish', 'Formwork checked at the east slab'],
    ['2026-01-02', 'Safety', 'Edge protection', 'Handrails checked at the east slab'],
  ]) {
    await page.getByRole('button', { name: '+ Add site entry', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Event date').fill(date);
    await dialog.getByLabel('Event time').fill('09:00');
    await dialog.getByLabel('Category', { exact: true }).selectOption(category);
    await dialog.getByLabel('Zone', { exact: true }).selectOption('East');
    await dialog.getByLabel('Title / activity').fill(title);
    await dialog.getByLabel('What happened on site').fill(details);
    await dialog.getByRole('button', { name: 'Save site entry' }).click();
  }
  const search = page.getByRole('searchbox', { name: 'Search site diary' });
  await search.fill('creme');
  await expect(page.getByRole('heading', { name: 'Crème finish' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Edge protection' })).toHaveCount(0);
  await search.fill('east slab');
  await page.getByLabel('Category', { exact: true }).selectOption('Safety');
  await expect(page.getByRole('heading', { name: 'Edge protection' })).toBeVisible();
  await page.getByLabel('Date filter').fill('2026-01-01');
  await expect(page.getByText('No diary entries for this selection.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear date', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Edge protection' })).toBeVisible();
  await page.getByLabel('Category', { exact: true }).selectOption('All');
  await expect(page.getByRole('status')).toHaveText('2 of 2 records');
});

for (const view of ['dashboard', 'calendar', 'materials', 'inspections', 'diary', 'lifting', 'users', 'monitoring', 'projects']) {
  test(`${view}: dark theme contrast and mobile reflow`, async ({ page }) => {
    await open(page, view);
    await darkMode(page);
    const audit = async () => {
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }))).toEqual([]);
    };
    await audit();
    await page.setViewportSize({ width: 320, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await audit();
    if (view !== 'projects') {
      const shortcut = await page.locator('.theme-shortcut').boundingBox();
      const nav = await page.getByRole('navigation', { name: 'Mobile Field Navigation' }).boundingBox();
      expect(shortcut.y + shortcut.height).toBeLessThanOrEqual(nav.y);
    }
  });
}

test('material and profile dialogs retain contrast in dark mode', async ({ page }) => {
  await open(page, 'materials');
  await darkMode(page);
  for (const name of ['+ Add material record', 'Edit profile']) {
    await page.getByRole('button', { name, exact: true }).click();
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }))).toEqual([]);
    await page.keyboard.press('Escape');
  }
});
