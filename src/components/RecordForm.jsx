import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { lockModalBackground, trapDialogFocus } from '../utils/modalAccessibility';

export function Field({ label, children, className = '', ...props }) {
  return <label className={`field-label ${className}`}>{label}
    {children ? <select aria-label={label} {...props} className="field-control">{children}</select>
      : <input aria-label={label} {...props} className="field-control" />}
  </label>;
}
export function TextArea({ label, className = '', ...props }) {
  return <label className={`field-label ${className}`}>{label}<textarea {...props} className="field-control" /></label>;
}
export function SaveForm({ onSave, children, submitLabel = 'Save record', className = 'space-y-4' }) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  return <form className={className} aria-busy={saving} onSubmit={async event => {
    event.preventDefault(); if (saving) return;
    setError(''); setSaving(true);
    try { await onSave(); } catch (error) { setError(error.message || 'Could not save. Please retry.'); }
    finally { setSaving(false); }
  }}><fieldset disabled={saving} className="space-y-5">{children}{error && <p role="alert" className="form-error">{error}</p>}
    <div className="form-actions"><button disabled={saving} className="btn btn-primary">{saving ? 'Saving…' : submitLabel}</button></div>
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
  }}><section ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={`dialog-panel animate-in-scale-in rounded-2xl w-full max-h-[90dvh] overflow-auto ${wide ? 'max-w-3xl' : 'max-w-2xl'}`}>
    <div className="sticky top-0 z-10 flex justify-between items-center gap-3 px-5 sm:px-7 py-4 border-b" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <h2 id={titleId} className="font-semibold text-lg tracking-tight min-w-0">{title}</h2>
      <button type="button" onClick={onClose} className="btn btn-secondary btn-sm shrink-0"><X size={15} aria-hidden="true" />Close</button>
    </div>
    <div className="px-5 sm:px-7 py-5 space-y-5">{children}</div>
  </section></div>, portal);
}
