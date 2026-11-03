import { test, expect } from '@playwright/test';

// Phones, tablets and the installed (Add to Home Screen) app. Desktop layouts are covered by the other suites.
const VIEWS = ['dashboard', 'calendar', 'materials', 'inspections', 'diary', 'lifting', 'users', 'monitoring', 'projects'];
const SCREENS = [
  ['small phone', { width: 320, height: 568 }],
  ['phone', { width: 390, height: 844 }],
  ['large phone', { width: 430, height: 932 }],
  ['phone in landscape', { width: 844, height: 390 }],
  ['tablet', { width: 768, height: 1024 }],
  ['tablet in landscape', { width: 1024, height: 768 }],
];
const open = (page, view, suffix = '') => page.goto(`/tests/browser/harness.html?view=${view}&seed=1${suffix}`);

// Boxes and text that run past the screen edge or are cut off by a clipping container. Content inside
// sideways-scrolling regions (tables, the metrics ribbon, the planning board) is meant to scroll and is skipped.
const layoutFaults = page => page.evaluate(() => {
  const width = document.documentElement.clientWidth;
  const faults = [];
  const label = el => `${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 3).join('.')} "${(el.textContent || '').trim().slice(0, 40)}"`;
  const bounds = el => {
    let left = 0, right = width;
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const style = getComputedStyle(a);
      if (['auto', 'scroll'].includes(style.overflowX)) return null;
      if (style.position === 'fixed') break;
      if (['hidden', 'clip'].includes(style.overflowX)) { const box = a.getBoundingClientRect(); left = Math.max(left, box.left); right = Math.min(right, box.right); }
    }
    return { left, right };
  };
  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest('svg') && !(el instanceof SVGSVGElement)) continue;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || el.closest('#print-root')) continue;
    const box = el.getBoundingClientRect();
    if (!box.width || !box.height || (style.position === 'absolute' && box.width <= 1)) continue;
    const limit = bounds(el);
    if (limit && (box.left < limit.left - 1 || box.right > limit.right + 1)) faults.push(`box ${label(el)}`);
  }
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!node.nodeValue.trim() || !parent || parent.closest('#print-root, svg, option, [hidden]')) continue;
    const style = getComputedStyle(parent);
    if (style.display === 'none' || style.visibility === 'hidden' || style.textOverflow === 'ellipsis' || style.webkitLineClamp !== 'none') continue;
    if (style.position === 'absolute' && parent.getBoundingClientRect().width <= 1) continue; // screen-reader text
    const range = document.createRange(); range.selectNodeContents(node);
    const box = range.getBoundingClientRect(), limit = bounds(parent);
    if (box.width && limit && (box.left < limit.left - 1 || box.right > limit.right + 1)) faults.push(`text "${node.nodeValue.trim().slice(0, 40)}"`);
  }
  return faults;
});

for (const [name, viewport] of SCREENS) {
  test.describe(`${name} (${viewport.width}×${viewport.height})`, () => {
    test.use({ viewport, isMobile: true, hasTouch: true });
    test('every view fits the screen', async ({ page }) => {
      for (const view of VIEWS) {
        await open(page, view);
        await page.locator('main').first().waitFor();
        expect.soft(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${view}: sideways scroll`).toBe(0);
        expect.soft(await layoutFaults(page), `${view}: content off screen or cut off`).toEqual([]);
        if (view === 'projects') continue;
        const title = await page.locator('.workspace-header h1').boundingBox();
        expect.soft(title.width, `${view}: page title width`).toBeGreaterThanOrEqual(110);
        const nav = page.getByRole('navigation', { name: 'Mobile Field Navigation' });
        if (await nav.isVisible()) expect.soft(await nav.evaluate(el => el.scrollWidth <= el.clientWidth), `${view}: tab bar scrolls`).toBe(true);
      }
    });
  });
}

test.describe('phone tab bar', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test('sections that do not fit are listed under More, which closes with Escape', async ({ page }) => {
    await open(page, 'diary', '&role=admin');
    const nav = page.getByRole('navigation', { name: 'Mobile Field Navigation' });
    const more = nav.getByRole('button', { name: 'More', exact: true });
    for (const tab of ['Command', 'RFI / RTO', 'Lift PTW', 'BBS / DO', 'Diary']) await expect(nav.getByRole('button', { name: tab, exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Diary', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    await more.click();
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    await nav.getByRole('button', { name: 'Admin', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Admin site observations' })).toBeVisible();
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    await expect(more).toHaveAttribute('data-active', 'true');
    await more.click();
    await expect(nav.getByRole('button', { name: 'Admin', exact: true })).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Escape');
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    await expect(more).toBeFocused();
  });

  test('profile editing moves into the Actions menu and returns focus there', async ({ page }) => {
    await open(page, 'calendar');
    await expect(page.getByRole('button', { name: 'Edit profile', exact: true })).toHaveCount(0);
    const actions = page.getByRole('button', { name: 'Actions', exact: true });
    await actions.click();
    await page.getByRole('menuitem', { name: 'Edit profile' }).click();
    await expect(page.getByRole('dialog', { name: 'Edit profile' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(actions).toBeFocused();
  });
});

test.describe('phone in landscape without a notch', () => {
  test.use({ viewport: { width: 740, height: 360 }, isMobile: true, hasTouch: true });
  test('shows every section in the tab bar', async ({ page }) => {
    await open(page, 'dashboard', '&role=admin');
    const nav = page.getByRole('navigation', { name: 'Mobile Field Navigation' });
    for (const tab of ['Command', 'RFI / RTO', 'Lift PTW', 'BBS / DO', 'Diary', 'Access', 'Planning', 'Admin']) await expect(nav.getByRole('button', { name: tab, exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'More', exact: true })).toHaveCount(0);
  });
});

// Safe-area insets as iOS reports them for a Home Screen app (opaque status bar). Chromium-only emulation.
const withInsets = async (page, insets) => {
  try { await (await page.context().newCDPSession(page)).send('Emulation.setSafeAreaInsetsOverride', { insets }); return true; } catch { return false; }
};

test.describe('iPhone in landscape (notch and home indicator)', () => {
  test.use({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
  test('content clears the notch and the sheet register stays usable', async ({ page }) => {
    test.skip(!await withInsets(page, { top: 0, right: 47, bottom: 21, left: 47 }), 'Safe-area emulation is not available in this browser.');
    await open(page, 'dashboard');
    const zone = await page.getByRole('combobox', { name: 'Project zone' }).boundingBox();
    expect(zone.x).toBeGreaterThanOrEqual(47);
    const logout = await page.getByRole('button', { name: 'Log out', exact: true }).boundingBox();
    expect(logout.x + logout.width).toBeLessThanOrEqual(844 - 47);
    const sheetRegister = page.getByRole('navigation', { name: 'Main Project Navigation' });
    expect((await sheetRegister.boundingBox()).height).toBeGreaterThan(200);
    await sheetRegister.getByRole('button', { name: 'Site Diary', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Daily site diary' })).toBeVisible();
  });
});

test.describe('iPhone in portrait (home indicator)', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test('tab bar buttons sit above the home indicator', async ({ page }) => {
    test.skip(!await withInsets(page, { top: 0, right: 0, bottom: 34, left: 0 }), 'Safe-area emulation is not available in this browser.');
    await open(page, 'dashboard');
    const command = await page.getByRole('navigation', { name: 'Mobile Field Navigation' }).getByRole('button', { name: 'Command', exact: true }).boundingBox();
    expect(command.y + command.height).toBeLessThanOrEqual(844 - 34);
  });
});

test('installed app keeps the opaque status bar and safe-area viewport', async ({ page }) => {
  await page.goto('/');
  const meta = name => page.locator(`meta[name="${name}"]`).getAttribute('content');
  expect(await meta('viewport')).toContain('viewport-fit=cover');
  expect(await meta('apple-mobile-web-app-capable')).toBe('yes');
  expect(await meta('mobile-web-app-capable')).toBe('yes');
  expect(await meta('apple-mobile-web-app-status-bar-style')).toBe('default');
  expect(await meta('apple-mobile-web-app-title')).toBe('ProximaStruc');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/icons/apple-touch-icon.png');
});
