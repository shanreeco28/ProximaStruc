import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { RecordModal } from './RecordForm';
import DeleteRecordAction from './DeleteRecordAction';
import { today } from '../utils/siteData';
import { sheetCode } from '../utils/sheets';

const CATEGORIES = ['All', 'Main Contractor', 'Consultant / RE / RTO', 'Specialist Subcontractor'];
const initialsOf = value => (value || '').split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('') || '?';

function FormField({ label, ariaLabel, className = '', children }) {
  return <label className={`field-label ${className}`}>{label}{React.cloneElement(children, { 'aria-label': ariaLabel === false ? undefined : ariaLabel || label, className: `field-control ${children.props.className || ''}` })}</label>;
}

export default function UserManagementView({ users, onAddPersonnel, onUpdatePersonnelRole, onUpdatePersonnelOrganization, currentUser }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const isAdmin = currentUser?.systemRole === 'admin';
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [organizationSaving, setOrganizationSaving] = useState(null);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
    organization: '',
    category: 'Main Contractor',
    cdePermission: 'Field Contributor (Level 2 - Internal QC)',
    statutoryReg: '',
    certExpiry: '',
    bizSafe: '',
  });

  // Check if cert is expired or expiring within 30 days
  const getCertStatus = (expiryDateStr) => {
    const currentDate = new Date(`${today()}T00:00:00Z`);
    if (!expiryDateStr || !Number.isFinite(Date.parse(expiryDateStr))) return { label: 'NOT RECORDED', tone: undefined };
    const exp = new Date(expiryDateStr);
    const diffDays = Math.ceil((exp - currentDate) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'EXPIRED', tone: 'danger' };
    if (diffDays <= 30) return { label: `EXPIRING (${diffDays}d)`, tone: 'warning' };
    return { label: 'VALID', tone: 'success' };
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setError(''); setSaving(true);
    try {
      await onAddPersonnel(newUser);
      setIsAddModalOpen(false);
      setNewUser({ name: '', email: '', role: '', organization: '', category: 'Main Contractor', statutoryReg: '', certExpiry: '', bizSafe: '' });
    } catch (e) { setError(e.message || 'Could not register personnel.'); }
    finally { setSaving(false); }
  };

  const filteredPersonnel = users.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.organization || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.statutoryReg || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const expiring = users.filter(p => getCertStatus(p.certExpiry).label.startsWith('EXPIRING')).length;
  const expired = users.filter(p => getCertStatus(p.certExpiry).label === 'EXPIRED').length;
  const field = key => e => setNewUser({ ...newUser, [key]: e.target.value });

  return (
    <div className="space-y-6">
      {error && !isAddModalOpen && <p role="alert" className="form-error">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="stat-tile"><span className="eyebrow">Registered Personnel</span><span className="stat-value">{users.length} Personnel</span><span className="text-xs text-muted">Project membership records</span></div>
        <div className="stat-tile"><span className="eyebrow">Assigned RE / RTO</span><span className="stat-value">{users.filter(p => ['RE', 'RTO'].includes(p.systemRole)).length} assigned</span><span className="text-xs text-muted">Based on admin-assigned project roles</span></div>
        <div className="stat-tile" data-tone={expired ? 'danger' : expiring ? 'warning' : undefined}><span className="eyebrow">MOM WSH & CSOC Alerts</span><span className="stat-value">{expiring} Expiring · {expired} Expired</span><span className="text-xs text-muted">Recorded certificate alerts</span></div>
        <div className="stat-tile"><span className="eyebrow">Subcontractor bizSAFE Records</span><span className="stat-value">{users.filter(p => p.category === 'Specialist Subcontractor' && p.bizSafe).length} recorded</span><span className="text-xs text-muted">Subcontractors with bizSAFE details</span></div>
      </div>

      <div className="card overflow-hidden">
        <div className="card-header items-center">
          <div className="min-w-0"><div className="title-row"><span className="sheet-code">{sheetCode('users', 1)}</span><h2 className="card-title">Project personnel & access</h2></div><p className="card-subtitle">Organisations, statutory registrations and admin-assigned system roles.</p></div>
          {isAdmin && <button onClick={() => { setError(''); setIsAddModalOpen(true); }} className="btn btn-primary">+ Register Site Personnel / Subcon</button>}
        </div>
        <div className="px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="chip-group" role="group" aria-label="Personnel filters">
            {CATEGORIES.map((cat) => <button key={cat} type="button" aria-pressed={selectedCategory === cat} onClick={() => setSelectedCategory(cat)} className="chip">{cat}</button>)}
          </div>
          <div className="relative w-full lg:w-80">
            <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted" />
            <input type="search" aria-label="Search personnel" placeholder="Search name, IES/WSQ reg, subcon…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="field-control !mt-0 pl-9" />
          </div>
        </div>
        <div className="overflow-x-auto border-t" style={{ borderColor: 'var(--border)' }} role="region" aria-label="UserManagement records" tabIndex={0}>
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Personnel & Role</th>
                <th scope="col">Organization & bizSAFE</th>
                <th scope="col">ISO 19650 CDE Authority & Sign-Off</th>
                <th scope="col">Recorded Certificate</th>
                <th scope="col">Record action</th>
                {isAdmin && <th scope="col" className="text-right">System Role</th>}
              </tr>
            </thead>
            <tbody>
              {filteredPersonnel.map((person) => {
                const certBadge = getCertStatus(person.certExpiry);
                return (
                  <tr key={person.id}>
                    <td className="min-w-[240px]">
                      <div className="flex items-start gap-3">
                        <span className="avatar mt-0.5" aria-hidden="true">{initialsOf(person.name || person.email)}</span>
                        <div className="min-w-0">
                          <div className="font-semibold">{person.name}</div>
                          <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--accent-text)' }}>{person.role}</div>
                          <div className="text-xs text-muted mt-0.5 break-all">{person.email || 'No sign-in email recorded'}</div>
                          <span className="ref-tag mt-1.5 !text-[10.5px]">{person.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="min-w-[200px]">
                      {['admin', 'manager'].includes(currentUser?.systemRole) ? <input
                        key={`${person.id}-${person.organization || ''}`} aria-label={`Organisation for ${person.name || person.email}`}
                        defaultValue={person.organization || ''} disabled={organizationSaving === person.id}
                        onBlur={async e => {
                          const input = e.currentTarget;
                          const value = input.value.trim();
                          if (value === (person.organization || '')) return;
                          setOrganizationSaving(person.id); setError('');
                          try { await onUpdatePersonnelOrganization(person.id, value); }
                          catch (e) { input.value = person.organization || ''; setError(e.message || 'Could not update organisation.'); }
                          finally { setOrganizationSaving(null); }
                        }} className="field-control !mt-0 !min-h-[36px] !py-1.5 font-semibold" />
                        : <div className="font-semibold">{person.organization || 'Not recorded'}</div>}
                      {person.bizSafe && <span className="badge badge-square mt-1.5">{person.bizSafe}</span>}
                    </td>
                    <td className="min-w-[200px]">
                      <div className="text-xs font-semibold">{person.cdePermission}</div>
                      <div className="flex flex-wrap gap-1 mt-1.5">{(person.ptwAuthority || []).map((auth) => <span key={auth} className="badge" data-tone="info">{auth}</span>)}</div>
                    </td>
                    <td className="min-w-[180px]">
                      <div className="font-mono text-xs font-semibold">{person.statutoryReg}</div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="badge badge-square" data-tone={certBadge.tone}>{certBadge.label}</span>
                        <span className="text-xs text-muted tabular">Exp: {person.certExpiry}</span>
                      </div>
                    </td>
                    <td><DeleteRecordAction collection="users" record={person} /></td>
                    {isAdmin && (
                      <td className="text-right">
                        <select
                          aria-label={`System role for ${person.name || person.email}`}
                          value={person.systemRole || 'guest'}
                          onChange={(e) => onUpdatePersonnelRole && onUpdatePersonnelRole(person.id, e.target.value)}
                          className="field-control !mt-0 !w-auto !min-h-[36px] !py-1.5 text-xs"
                        >
                          <option value="guest">Guest</option>
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="RE">RE</option>
                          <option value="RTO">RTO</option>
                          <option value="engineer">Engineer</option>
                          <option value="supervisor">Supervisor</option>
                        </select>
                        {person.email && person.id !== person.email.toLowerCase() && <button className="link-action block ml-auto mt-1" onClick={() => onUpdatePersonnelRole(person.id, person.systemRole || 'guest')}>Confirm legacy access</button>}
                      </td>
                    )}
                  </tr>
                );
              })}
              {!filteredPersonnel.length && <tr><td colSpan={isAdmin ? 6 : 5} className="!py-10 text-center text-muted">No personnel match this selection.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && isAdmin && <RecordModal title="Register Site Personnel / Appointed Subcontractor" onClose={() => { if (!saving) setIsAddModalOpen(false); }}>
        <form onSubmit={handleFormSubmit} className="space-y-5">
          {error && <p role="alert" className="form-error">{error}</p>}
          <div className="form-grid">
            <FormField label="Sign-in email" ariaLabel={false}><input type="email" required value={newUser.email} onChange={field('email')} /></FormField>
            <FormField label="bizSAFE details (if recorded)" ariaLabel={false}><input value={newUser.bizSafe} onChange={field('bizSafe')} /></FormField>
            <FormField label="Full Name (As per FIN / NRIC)" className="sm:col-span-2"><input type="text" required value={newUser.name} onChange={field('name')} placeholder="e.g. Mohd Faizal Bin Rahman" /></FormField>
            <FormField label="Project Role"><input type="text" required value={newUser.role} onChange={field('role')} placeholder="e.g. Lifting Supervisor / RTO" /></FormField>
            <FormField label="Category"><select value={newUser.category} onChange={field('category')}><option value="Main Contractor">Main Contractor</option><option value="Consultant / RE / RTO">Consultant / RE / RTO</option><option value="Specialist Subcontractor">Specialist Subcontractor</option></select></FormField>
            <FormField label="Company / Subcontractor Name" className="sm:col-span-2"><input type="text" required value={newUser.organization} onChange={field('organization')} placeholder="e.g. Progressive Builders Pte Ltd" /></FormField>
            <FormField label="MOM / BCA / WSQ Cert No."><input type="text" required value={newUser.statutoryReg} onChange={field('statutoryReg')} placeholder="e.g. WSQ-LS-9012 / IES RTO" /></FormField>
            <FormField label="CSOC / Cert Expiry Date"><input type="date" required value={newUser.certExpiry} onChange={field('certExpiry')} className="font-mono" /></FormField>
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving…' : 'Register personnel'}</button>
          </div>
        </form>
      </RecordModal>}
    </div>
  );
}
