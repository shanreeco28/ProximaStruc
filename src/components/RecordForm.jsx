import React, { useState } from 'react';

export function Field({ label, children, ...props }) {
  return <label className="block text-xs font-semibold text-slate-600">{label}
    {children ? <select aria-label={label} {...props} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">{children}</select>
      : <input aria-label={label} {...props} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />}
  </label>;
}
export function SaveForm({ onSave, children, submitLabel = 'Save record', className = 'space-y-4' }) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  return <form className={className} onSubmit={async e => {
    e.preventDefault(); setError(''); setSaving(true);
    try { await onSave(); } catch (err) { setError(err.message || 'Could not save. Please retry.'); }
    finally { setSaving(false); }
  }}>{children}{error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button disabled={saving} className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-semibold">{saving ? 'Saving…' : submitLabel}</button>
  </form>;
}
export function RecordModal({ title, onClose, children }) {
  return <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
    <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-auto p-6 space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-bold text-lg">{title}</h3><button type="button" onClick={onClose} className="px-3 py-2 text-slate-600">Close</button></div>{children}
    </div>
  </div>;
}
