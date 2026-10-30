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
    <p className="text-sm text-muted">Personal details for {projectName || 'this project'}. Your job title does not change your access permissions.</p>
    <form className="space-y-4" onSubmit={async event => {
      event.preventDefault(); if (saving) return;
      setError(''); setSaving(true);
      try { await onSave(personalProfileUpdates(form)); onClose(); }
      catch (error) { setError(error.message || 'Could not save your profile. Please retry.'); }
      finally { setSaving(false); }
    }}>
      <fieldset disabled={saving} className="space-y-5">
        <div className="form-grid">
          <Field label="Full name" autoComplete="name" required maxLength={120} value={form.name} onChange={change('name')} />
          <Field label="Sign-in email" type="email" readOnly value={user.email || ''} />
          <Field label="Job title" autoComplete="organization-title" maxLength={120} value={form.role} onChange={change('role')} />
          <Field label="Contact phone" type="tel" autoComplete="tel" maxLength={40} value={form.phone} onChange={change('phone')} />
          <Field label="Birthday" type="date" autoComplete="bday" max={today()} value={form.birthday} onChange={change('birthday')} />
        </div>
        <p className="form-hint">Sign-in email and project access are managed separately by your account and project admin.</p>
        {error && <p role="alert" className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="button" onClick={close} className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary">{saving ? 'Saving…' : 'Save profile'}</button>
        </div>
      </fieldset>
    </form>
  </RecordModal>;
}
