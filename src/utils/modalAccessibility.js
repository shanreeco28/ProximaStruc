const locks = new WeakMap();
let count = 0, previousOverflow = '';
export function lockModalBackground(portal) {
  const siblings = [...document.body.children].filter(element => element !== portal && element.tagName !== 'SCRIPT');
  for (const element of siblings) {
    const lock = locks.get(element) || { count: 0, inert: element.inert };
    lock.count++; locks.set(element, lock); element.inert = true;
  }
  if (!count++) { previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
  return () => {
    for (const element of siblings) {
      const lock = locks.get(element);
      if (lock && !--lock.count) { element.inert = lock.inert; locks.delete(element); }
    }
    if (!--count) document.body.style.overflow = previousOverflow;
  };
}
export function trapDialogFocus(event, container) {
  if (event.key !== 'Tab') return;
  const controls = [...container.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], summary, [tabindex="0"]')].filter(element => element.getClientRects().length && !element.closest('[inert]'));
  const first = controls[0], last = controls.at(-1);
  if (!first) { event.preventDefault(); container.focus(); }
  else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}
