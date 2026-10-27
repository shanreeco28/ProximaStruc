import React, { useState } from 'react';
import { Field, RecordModal } from './RecordForm';
import { personalProfileUpdates } from '../utils/profile';
import { today } from '../utils/siteData';

export default function ProfileEditor({ user, profile, projectName, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    name: user.displayName || profile.name || '', role: profile.role || '',
    phone: profile.phone || '', birthday: profile.birthday || '',
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const change = key => event => setForm(prev => ({ ...prev, [key]: event.target.value }));
  const close = () => { if (!saving) onClose(); };
  return <RecordModal title="Edit profile" onClose={close}>
    <p className="text-sm text-slate-500">Personal details for {projectName || 'this project'}. Your job title does not change your access permissions.</p>
    <form className="space-y-4" onSubmit={async event => {
      event.preventDefault(); if (saving) return;
      setError(''); setSaving(true);
      try { await onSave(personalProfileUpdates(form)); onClose(); }
      catch (error) { setError(error.message || 'Could not save your profile. Please retry.'); }
      finally { setSaving(false); }
    }}>
      <fieldset disabled={saving} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" autoComplete="name" required maxLength={120} value={form.name} onChange={change('name')} />
          <Field label="Sign-in email" type="email" readOnly value={user.email || ''} />
          <Field label="Job title" autoComplete="organization-title" maxLength={120} value={form.role} onChange={change('role')} />
          <Field label="Contact phone" type="tel" autoComplete="tel" maxLength={40} value={form.phone} onChange={change('phone')} />
          <Field label="Birthday" type="date" autoComplete="bday" max={today()} value={form.birthday} onChange={change('birthday')} />
        </div>
        <p className="text-xs text-slate-500">Sign-in email and project access are managed separately by your account and project admin.</p>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={close} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold disabled:opacity-50">{saving ? 'Saving…' : 'Save profile'}</button>
        </div>
      </fieldset>
    </form>
  </RecordModal>;
}
