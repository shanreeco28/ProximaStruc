import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const audit=async page=>new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']).analyze();
for(const view of ['dashboard','calendar','materials','inspections','diary','lifting','users','monitoring','projects']) {
  test(`${view}: accessibility and responsive reflow`,async({page})=>{
    await page.goto(`/tests/browser/harness.html?view=${view}&seed=1`);
    const result=await audit(page);
    expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
    if(view==='projects'){await page.evaluate(()=>document.documentElement.classList.add('dark'));await expect(page.getByRole('main')).toHaveCSS('background-color','rgb(15, 23, 42)');const dark=await audit(page);expect(dark.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);}
    await page.setViewportSize({width:320,height:844});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    const mobile=await audit(page);expect(mobile.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
  });
}
test('record dialogs trap focus, close with Escape, restore focus and have accessible forms',async({page})=>{
  await page.goto('/tests/browser/harness.html?view=materials&seed=1');
  const trigger=page.getByRole('button',{name:'+ Add material record'});
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const result=await audit(page);expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  await page.getByRole('button',{name:'Save material record'}).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button',{name:'Close',exact:true})).toBeFocused();
  await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
});

test('account and executive brief dialogs keep accessible names, contrast and focus',async({page})=>{
  await page.goto('/tests/browser/harness.html?view=calendar');
  await page.getByRole('button',{name:'Edit profile',exact:true}).click();
  let result=await audit(page);expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Actions',exact:true}).click();
  await page.getByRole('menuitem',{name:'Generate Executive Brief'}).click();
  result=await audit(page);expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
  await page.evaluate(()=>{window.print=()=>{document.body.dataset.printRequested='true';};});
  await page.getByRole('button',{name:'Print / Export PDF'}).click();
  await expect(page.locator('body')).toHaveAttribute('data-print-requested','true');
});
test('login and registration retain accessible form labels and controls',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Sign In',exact:true}).waitFor();
  let result=await audit(page);expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
  await page.getByRole('button',{name:'Use dark theme'}).click();
  result=await audit(page);expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
  await page.getByRole('button',{name:'Register',exact:true}).click();
  result=await audit(page);expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
});

test('deletion request review and confirmation remain accessible',async({page})=>{
  await page.goto('/tests/browser/harness.html?view=deletions&role=engineer&seed=1');
  await page.getByRole('button',{name:'Request deletion of Existing sprint task'}).click();
  await page.getByLabel('Reason for deletion').fill('Duplicate site activity');
  await page.getByRole('button',{name:'Submit deletion request'}).click();
  await page.getByLabel('Test reviewer account').selectOption('manager');
  let result=await audit(page);expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
  await page.getByRole('button',{name:'Verify & delete',exact:true}).click();
  result=await audit(page);expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
});

test('skip navigation and every mobile metric remain reachable by keyboard',async({page})=>{
  await page.setViewportSize({width:320,height:844});
  await page.goto('/tests/browser/harness.html?view=calendar&seed=1');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link',{name:'Skip to project content'})).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await page.getByRole('region',{name:'Key Project Metrics',exact:true}).focus();
  for(let index=0;index<5;index++)await page.keyboard.press('Tab');
  const lastMetric=page.getByRole('region',{name:'Key Project Metrics',exact:true}).getByRole('button').last();
  await expect(lastMetric).toBeFocused();await expect(lastMetric).toBeInViewport();
});
