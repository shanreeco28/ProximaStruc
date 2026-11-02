import React, { useState } from 'react';
import { Field, RecordModal } from './RecordForm';
import { PASSWORD, primaryProvider } from '../utils/authProviders';

const CONFIRM_WORD = 'DELETE';
const providerLabel = { 'google.com': 'Google', 'apple.com': 'Apple' };

export default function DeleteAccountDialog({ user, onDelete, onClose }) {
  const provider = primaryProvider(user);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const close = () => { if (!deleting) onClose(); };
  const ready = confirmText.trim().toUpperCase() === CONFIRM_WORD && (provider !== PASSWORD || password);
  return <RecordModal title="Delete account" onClose={close}>
    <div className="space-y-3 text-sm">
      <p>This permanently deletes the ProximaStruc account for <strong>{user.email}</strong>. You cannot undo it.</p>
      <ul className="list-disc pl-5 space-y-1 text-muted">
        <li>Your sign-in account is deleted and you are signed out on every device.</li>
        <li>Your personal profile (name, job title, phone, birthday) and project access are removed from every project.</li>
        <li>Site records you created stay in each project with your email as the creator, because they form the project's audit trail.</li>
        <li>If you own a project, ask the site owner to assign a new owner first.</li>
      </ul>
    </div>
    <form className="space-y-4" onSubmit={async event => {
      event.preventDefault(); if (deleting || !ready) return;
      setError(''); setDeleting(true);
      try { await onDelete({ password }); }
      catch (err) {
        const message = String(err?.message || err || '');
        setError(/cancel|error 1001/i.test(message) ? 'Sign-in confirmation was cancelled. Your account was not deleted.'
          : /wrong-password|invalid-credential/.test(message) ? 'That password is incorrect.'
          : message || 'Could not delete your account. Please retry.');
        setDeleting(false);
      }
    }}>
      <fieldset disabled={deleting} className="space-y-4">
        {provider === PASSWORD
          ? <Field label="Current password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} />
          : <p className="form-hint">You will be asked to confirm with {providerLabel[provider] || 'your sign-in provider'}.</p>}
        <Field label={`Type ${CONFIRM_WORD} to confirm`} autoComplete="off" autoCapitalize="characters" required value={confirmText} onChange={event => setConfirmText(event.target.value)} />
        {error && <p role="alert" className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="button" onClick={close} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={!ready} className="btn btn-danger-soft">{deleting ? 'Deleting…' : 'Delete account'}</button>
        </div>
      </fieldset>
    </form>
  </RecordModal>;
}
