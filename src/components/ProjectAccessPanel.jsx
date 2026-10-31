import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';
import DeleteRecordAction from './DeleteRecordAction';
import { RecordDeletionContext } from '../contexts/RecordDeletionContext';
import { Field, SaveForm } from './RecordForm';
import { sheetCode } from '../utils/sheets';

const ROLE_OPTIONS = [['guest', 'Guest'], ['admin', 'Admin'], ['manager', 'Manager'], ['RE', 'RE'], ['RTO', 'RTO'], ['engineer', 'Engineer'], ['supervisor', 'Supervisor']];
const initialsOf = value => (value || '').split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('') || '?';
const isPending = member => !member.systemRole || member.systemRole === 'pending';

// Site-owner control panel: which accounts can open which project, and with what role.
export default function ProjectAccessPanel({ projects, user, projectId, onProjectChange, members, onGrant, onRoleChange, onRevoke }) {
  const [grant, setGrant] = useState({ email: '', name: '', systemRole: 'guest' });
  const [status, setStatus] = useState(''), [error, setError] = useState(''), [savingId, setSavingId] = useState(null);
  const project = projects.find(p => p.id === projectId);
  const rows = [...members.items].sort((a, b) => Number(isPending(b)) - Number(isPending(a)) || String(a.name || a.email || a.id).localeCompare(String(b.name || b.email || b.id)));
  const pending = rows.filter(isPending).length;
  const deletion = { user: { email: user.email, uid: user.uid, systemRole: 'admin' }, requests: [], submit: async (collection, id, reason) => {
    await onRevoke(projectId, id, reason);
    setStatus('Access removed. The membership snapshot and reason are retained.');
    return 'deleted';
  } };
  const changeRole = async (member, systemRole) => {
    setError(''); setStatus(''); setSavingId(member.id);
    try { await onRoleChange(projectId, member.id, systemRole); setStatus(`${member.name || member.email} is now ${ROLE_OPTIONS.find(([value]) => value === systemRole)[1]} on ${project?.name}.`); }
    catch (e) { setError(e.message || 'Could not change the role.'); }
    finally { setSavingId(null); }
  };

  return <section className="card overflow-hidden" aria-labelledby="project-access-title">
    <div className="card-header items-center">
      <div className="flex items-start gap-3 min-w-0">
        <span className="icon-tile"><KeyRound size={18} aria-hidden="true" /></span>
        <div className="min-w-0"><div className="title-row"><span className="sheet-code">{sheetCode('access')}</span><h2 id="project-access-title" className="card-title">Project access control</h2></div>
          <p className="card-subtitle">Site owner panel. Choose which accounts can open each project and their role. New sign-ups appear here as access requests.</p></div>
      </div>
      {!!projects.length && <Field label="Project" className="w-full sm:w-72" value={projectId || ''} onChange={event => { setStatus(''); setError(''); onProjectChange(event.target.value); }}>
        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </Field>}
    </div>
    {!projects.length ? <div className="card-body"><p className="empty-state">Create a project to assign access.</p></div> : <>
      <div className="card-body space-y-4">
        <p role="status" className={status ? 'text-sm' : 'sr-only'}>{status}</p>
        {(error || members.error) && <p role="alert" className="form-error">{error || members.error}</p>}
        {!!pending && <p data-tone="warning" className="alert">{pending} access request{pending === 1 ? '' : 's'} awaiting a role on {project?.name}.</p>}
        <SaveForm submitLabel="Grant access" onSave={async () => {
          setStatus(''); setError('');
          const result = await onGrant(projectId, grant);
          setStatus(`${grant.email.trim().toLowerCase()} ${result === 'updated' ? 'role updated' : 'can now open'} ${project?.name}.`);
          setGrant({ email: '', name: '', systemRole: 'guest' });
        }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Sign-in email" type="email" required autoComplete="off" value={grant.email} onChange={event => setGrant({ ...grant, email: event.target.value })} />
            <Field label="Name (optional)" value={grant.name} maxLength={120} onChange={event => setGrant({ ...grant, name: event.target.value })} />
            <Field label="Project role" value={grant.systemRole} onChange={event => setGrant({ ...grant, systemRole: event.target.value })}>
              {ROLE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Field>
          </div>
        </SaveForm>
      </div>
      <div className="overflow-x-auto border-t" style={{ borderColor: 'var(--border)' }} role="region" aria-label={`Accounts with access to ${project?.name || 'the project'}`} tabIndex={0}>
        <table className="data-table">
          <thead><tr><th scope="col">Account</th><th scope="col">Project role</th><th scope="col" className="text-right">Access</th></tr></thead>
          <tbody>
            {rows.map(member => {
              const legacy = !member.email || member.id !== member.email.toLowerCase();
              return <tr key={member.id}>
                <td className="min-w-[240px]"><div className="flex items-start gap-3">
                  <span className="avatar mt-0.5" aria-hidden="true">{initialsOf(member.name || member.email)}</span>
                  <div className="min-w-0"><div className="font-semibold break-words">{member.name || member.email || member.id}</div>
                    <div className="text-xs text-muted mt-0.5 break-all">{member.email || 'No sign-in email recorded'}</div>
                    {isPending(member) && <span className="badge mt-1.5" data-tone="warning">Access requested</span>}</div>
                </div></td>
                <td className="min-w-[180px]">
                  {legacy ? <span className="text-xs text-muted">Legacy record. Use Confirm legacy access in the project.</span>
                    : <select aria-label={`Project role for ${member.name || member.email}`} value={member.systemRole || 'pending'} disabled={savingId === member.id} onChange={event => changeRole(member, event.target.value)} className="field-control !mt-0 !w-auto !min-h-[36px] !py-1.5 text-xs">
                      {isPending(member) && <option value="pending" disabled>Access requested</option>}
                      {ROLE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>}
                </td>
                <td className="text-right"><RecordDeletionContext.Provider value={deletion}><DeleteRecordAction collection="users" record={member} /></RecordDeletionContext.Provider></td>
              </tr>;
            })}
            {!rows.length && <tr><td colSpan={3} className="!py-10 text-center text-muted">{members.loading ? 'Loading accounts…' : 'No accounts have access to this project yet.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </>}
  </section>;
}
