import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { lockModalBackground, trapDialogFocus } from '../utils/modalAccessibility';

export function Field({ label, children, ...props }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}
    {children ? <select aria-label={label} {...props} className="mt-1.5 w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white">{children}</select>
      : <input aria-label={label} {...props} className="mt-1.5 w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm" />}
  </label>;
}
export function SaveForm({ onSave, children, submitLabel = 'Save record', className = 'space-y-4' }) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  return <form className={className} aria-busy={saving} onSubmit={async event => {
    event.preventDefault(); if (saving) return;
    setError(''); setSaving(true);
    try { await onSave(); } catch (error) { setError(error.message || 'Could not save. Please retry.'); }
    finally { setSaving(false); }
  }}><fieldset disabled={saving} className="space-y-4">{children}{error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button disabled={saving} className="button-primary">{saving ? 'Saving…' : submitLabel}</button>
  </fieldset></form>;
}
export function RecordModal({ title, onClose, children, wide = false }) {
  const [portal] = useState(() => document.createElement('div'));
  const dialog = useRef(null), close = useRef(onClose);
  const titleId = useId();
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement;
    portal.setAttribute('data-modal-root', 'true');
    document.body.append(portal);
    const unlock = lockModalBackground(portal);
    const target = dialog.current?.querySelector('input:not([readonly]):not(:disabled), textarea:not(:disabled), select:not(:disabled)') || dialog.current?.querySelector('button:not(:disabled)');
    target?.focus();
    return () => { unlock(); portal.remove(); if (previous?.isConnected) previous.focus(); else document.querySelector('main')?.focus(); };
  }, [portal]);
  return createPortal(<div className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close.current(); }
    trapDialogFocus(event, dialog.current);
  }}><section ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={`dialog-panel bg-white rounded-2xl border border-slate-200 w-full max-h-[90dvh] overflow-auto p-5 sm:p-7 space-y-5 ${wide ? 'max-w-3xl' : 'max-w-2xl'}`}>
    <div className="flex justify-between items-start gap-3 border-b border-slate-200 pb-4"><h2 id={titleId} className="font-bold text-xl text-slate-900">{title}</h2><button type="button" onClick={onClose} className="button-secondary shrink-0">Close</button></div>{children}
  </section></div>, portal);
}
