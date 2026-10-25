import React, { useState } from 'react';
import { today } from '../utils/siteData';


const CATEGORIES = ['All', 'Main Contractor', 'Consultant / RE / RTO', 'Specialist Subcontractor'];

export default function UserManagementView({ users, onAddPersonnel, onToggleBiometricGate, onUpdatePersonnelRole, currentUser }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const isAdmin = currentUser?.systemRole === 'admin';
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // New user form state
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
    if (!expiryDateStr || !Number.isFinite(Date.parse(expiryDateStr))) return { label: 'NOT RECORDED', style: 'bg-slate-100 text-slate-600' };
    const exp = new Date(expiryDateStr);
    const diffDays = Math.ceil((exp - currentDate) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'EXPIRED', style: 'bg-red-100 text-red-900 border-red-300' };
    if (diffDays <= 30) return { label: `EXPIRING (${diffDays}d)`, style: 'bg-amber-100 text-amber-900 border-amber-300' };
    return { label: 'VALID', style: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
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

  return (
    <div className="space-y-6">
      {/* 1. Statutory & Access Control Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Registered Personnel
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {users.length} Personnel
          </div>
          <span className="text-xs text-slate-500">Project membership records</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Consultant Certificates
          </span>
          <div className="text-2xl font-bold font-mono text-blue-700 mt-1">
            {users.filter(p => p.category === 'Consultant / RE / RTO' && p.statutoryReg && getCertStatus(p.certExpiry).label === 'VALID').length} with current certs
          </div>
          <span className="text-xs text-slate-500">Based on recorded certificate details</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            MOM WSH & CSOC Alerts
          </span>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
            {users.filter(p => getCertStatus(p.certExpiry).label.startsWith('EXPIRING')).length} Expiring · {users.filter(p => getCertStatus(p.certExpiry).label === 'EXPIRED').length} Expired
          </div>
          <span className="text-xs text-red-600 font-semibold">Recorded certificate alerts</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Subcontractor bizSAFE Records
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {users.filter(p => p.category === 'Specialist Subcontractor' && p.bizSafe).length} recorded
          </div>
          <span className="text-xs text-slate-500">Subcontractors with bizSAFE details</span>
        </div>
      </div>

      {/* 2. Filter, Search & Onboarding Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="search"
            placeholder="Search name, IES/WSQ reg, subcon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-slate-300 rounded-lg px-3.5 py-2 text-xs sm:text-sm min-w-[240px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isAdmin && <button
            onClick={() => { setError(''); setIsAddModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg shadow-xs transition shrink-0"
          >
            + Register Site Personnel / Subcon
          </button>}
        </div>
      </div>

      {/* 3. Enterprise RBAC & Statutory Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                <th className="py-3.5 px-4">Personnel & Role</th>
                <th className="py-3.5 px-4">Organization & bizSAFE</th>
                <th className="py-3.5 px-4">ISO 19650 CDE Authority & Sign-Off</th>
                <th className="py-3.5 px-4">Recorded Certificate</th>
                <th className="py-3.5 px-4">Manual Access Record</th>
                <th className="py-3.5 px-4 text-right">Admin Access Record</th>
                {currentUser?.systemRole === 'admin' && <th className="py-3.5 px-4 text-right">System Role</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPersonnel.map((person) => {
                const certBadge = getCertStatus(person.certExpiry);
                const isGateActive = person.biometricStatus?.startsWith('Active');

                return (
                  <tr key={person.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                          {person.id}
                        </span>
                        <span className="font-bold text-slate-900">{person.name}</span>
                      </div>
                      <div className="text-xs font-semibold text-blue-700 mt-1">{person.role}</div><div className="text-xs text-slate-500">{person.email || 'No sign-in email recorded'}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800">{person.organization}</div>
                      <span className="inline-block mt-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {person.bizSafe}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-xs font-bold text-slate-900">{person.cdePermission}</div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(person.ptwAuthority || []).map((auth) => (
                          <span
                            key={auth}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200"
                          >
                            {auth}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-mono text-xs font-semibold text-slate-800">
                        {person.statutoryReg}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${certBadge.style}`}
                        >
                          {certBadge.label}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          Exp: {person.certExpiry}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isGateActive
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-red-100 text-red-900 border border-red-300'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isGateActive ? 'bg-emerald-600' : 'bg-red-600'
                          }`}
                        />
                        {person.biometricStatus}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      {isAdmin && <button
                        onClick={() => onToggleBiometricGate && onToggleBiometricGate(person.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          isGateActive
                            ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {isGateActive ? 'Mark Suspended' : 'Mark Active'}
                      </button>}
                    </td>
                    {currentUser?.systemRole === 'admin' && (
                      <td className="py-4 px-4 text-right">
                        <select
                          value={person.systemRole || 'guest'}
                          onChange={(e) => onUpdatePersonnelRole && onUpdatePersonnelRole(person.id, e.target.value)}
                          className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="guest">Guest</option>
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="engineer">Engineer</option>
                          <option value="supervisor">Supervisor</option>
                        </select>
                        {person.email && person.id !== person.email.toLowerCase() && <button className="block mt-1 text-blue-700 text-xs" onClick={() => onUpdatePersonnelRole(person.id, person.systemRole || 'guest')}>Confirm legacy access</button>}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modal to Register New Personnel / Subcontractor */}
      {isAddModalOpen && isAdmin && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Register Site Personnel / Appointed Subcontractor
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-sm">
              {error && <p role="alert" className="text-red-700">{error}</p>}
              <label className="block text-xs font-semibold">Sign-in email<input type="email" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2" /></label>
              <label className="block text-xs font-semibold">bizSAFE details (if recorded)<input value={newUser.bizSafe} onChange={e => setNewUser({ ...newUser, bizSafe: e.target.value })} className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2" /></label>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Full Name (As per FIN / NRIC)
                </label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Mohd Faizal Bin Rahman"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Project Role
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    placeholder="e.g. Lifting Supervisor / RTO"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Category
                  </label>
                  <select
                    value={newUser.category}
                    onChange={(e) => setNewUser({ ...newUser, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  >
                    <option value="Main Contractor">Main Contractor</option>
                    <option value="Consultant / RE / RTO">Consultant / RE / RTO</option>
                    <option value="Specialist Subcontractor">Specialist Subcontractor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Company / Subcontractor Name
                </label>
                <input
                  type="text"
                  required
                  value={newUser.organization}
                  onChange={(e) => setNewUser({ ...newUser, organization: e.target.value })}
                  placeholder="e.g. Progressive Builders Pte Ltd"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    MOM / BCA / WSQ Cert No.
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.statutoryReg}
                    onChange={(e) => setNewUser({ ...newUser, statutoryReg: e.target.value })}
                    placeholder="e.g. WSQ-LS-9012 / IES RTO"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    CSOC / Cert Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newUser.certExpiry}
                    onChange={(e) => setNewUser({ ...newUser, certExpiry: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={saving}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700"
                >
                  {saving ? 'Saving…' : 'Register personnel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
