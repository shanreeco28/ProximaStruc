import React, { useState } from 'react';

const DEFAULT_PERSONNEL = [
  {
    id: 'USR-001',
    name: 'Shan Reeco Socorro',
    role: 'Project Manager / Lead PE',
    organization: 'Main Contractor (Project LC1)',
    category: 'Main Contractor',
    cdePermission: 'CDE Approver (Level 4 - Final Authority)',
    statutoryReg: 'MWSHCS Certified • PM PTW Signatory',
    certExpiry: '2028-10-15',
    bizSafe: 'bizSAFE Star',
    biometricStatus: 'Active (Gate A & B)',
    ptwAuthority: ['Approve High-Risk PTW', 'Close RFI', 'Certify SOPA Claim'],
  },
  {
    id: 'USR-002',
    name: 'Er. Tan Wei Ming',
    role: 'Resident Engineer (RE - C&S)',
    organization: 'QP(S) Consultant Team',
    category: 'Consultant / RE / RTO',
    cdePermission: 'Statutory Reviewer (Level 3 - Hold Point Sign-off)',
    statutoryReg: 'IES/ACES RE #4092',
    certExpiry: '2027-06-30',
    bizSafe: 'N/A (QP Rep)',
    biometricStatus: 'Active (All Zones)',
    ptwAuthority: ['Approve Structural RFI', 'Issue Site Memo'],
  },
  {
    id: 'USR-003',
    name: 'Lim Kah Heng',
    role: 'Resident Technical Officer (RTO)',
    organization: 'QP(S) Consultant Team',
    category: 'Consultant / RE / RTO',
    cdePermission: 'Statutory Inspector (Level 3 - RFI Inspection)',
    statutoryReg: 'IES/ACES RTO #8814',
    certExpiry: '2027-04-12',
    bizSafe: 'N/A (QP Rep)',
    biometricStatus: 'Active (All Zones)',
    ptwAuthority: ['Inspect Rebar / Formwork', 'Witness Cube Test'],
  },
  {
    id: 'USR-004',
    name: 'Rajan Subramaniam',
    role: 'Workplace Safety & Health Officer (WSHO)',
    organization: 'Main Contractor (WSH Dept)',
    category: 'Main Contractor',
    cdePermission: 'Statutory Endorser (Level 3 - WSH & Environmental)',
    statutoryReg: 'MOM WSHO Reg #WSH-2910 • NEA ECO',
    certExpiry: '2027-09-01',
    bizSafe: 'bizSAFE Star',
    biometricStatus: 'Active (All Zones)',
    ptwAuthority: ['Endorse Lifting PTW', 'Issue Stop-Work Order', 'NEA Vector Sign-off'],
  },
  {
    id: 'USR-005',
    name: 'Ahamed Rasheed',
    role: 'Appointed Lifting Supervisor',
    organization: 'Apex Precast & Rigging Pte Ltd',
    category: 'Specialist Subcontractor',
    cdePermission: 'Field Contributor (Level 1 - PTW Applicant)',
    statutoryReg: 'WSQ Lifting Sup #LS-8821 • CSOC Valid',
    certExpiry: '2026-11-05', // Expiring soon warning
    bizSafe: 'bizSAFE Level 4',
    biometricStatus: 'Active (Zone A & B)',
    ptwAuthority: ['Apply Lifting PTW', 'Daily Crane Pre-Check'],
  },
  {
    id: 'USR-006',
    name: 'David Chen',
    role: 'Subcon Site Manager (Rebar & Formwork)',
    organization: 'JinBuilders Structural Pte Ltd',
    category: 'Specialist Subcontractor',
    cdePermission: 'Field Contributor (Level 1 - RFI Prep & BBS)',
    statutoryReg: 'BCSS Certified • CoreTrade Sup',
    certExpiry: '2026-10-18', // Expired example
    bizSafe: 'bizSAFE Level 3',
    biometricStatus: 'Suspended (Cert Renewal Pending)',
    ptwAuthority: ['Submit Internal QC', 'Log BBS Delivery'],
  },
];

const CATEGORIES = ['All', 'Main Contractor', 'Consultant / RE / RTO', 'Specialist Subcontractor'];

export default function UserManagementView({ users = DEFAULT_PERSONNEL, onUpdateUser }) {
  const [personnel, setPersonnel] = useState(users);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    role: 'Site Engineer',
    organization: '',
    category: 'Main Contractor',
    cdePermission: 'Field Contributor (Level 2 - Internal QC)',
    statutoryReg: '',
    certExpiry: '2027-12-31',
    bizSafe: 'bizSAFE Star',
  });

  // Check if cert is expired or expiring within 30 days
  const getCertStatus = (expiryDateStr) => {
    const today = new Date('2026-10-20');
    const exp = new Date(expiryDateStr);
    const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'EXPIRED', style: 'bg-red-100 text-red-900 border-red-300' };
    if (diffDays <= 30) return { label: `EXPIRING (${diffDays}d)`, style: 'bg-amber-100 text-amber-900 border-amber-300' };
    return { label: 'VALID', style: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
  };

  const toggleBiometricGate = (id) => {
    setPersonnel((prev) =>
      prev.map((person) => {
        if (person.id !== id) return person;
        const isSuspended = person.biometricStatus.includes('Suspended');
        const updated = {
          ...person,
          biometricStatus: isSuspended
            ? 'Active (All Zones)'
            : 'Suspended (PM Override)',
        };
        if (onUpdateUser) onUpdateUser(updated);
        return updated;
      })
    );
  };

  const handleAddPersonnel = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.organization) return;
    const created = {
      ...newUser,
      id: `USR-00${personnel.length + 1}`,
      biometricStatus: 'Active (All Zones)',
      ptwAuthority: ['Submit RFI', 'Apply PTW'],
    };
    setPersonnel([created, ...personnel]);
    setIsAddModalOpen(false);
    setNewUser({
      name: '',
      role: 'Site Engineer',
      organization: '',
      category: 'Main Contractor',
      cdePermission: 'Field Contributor (Level 2 - Internal QC)',
      statutoryReg: '',
      certExpiry: '2027-12-31',
      bizSafe: 'bizSAFE Star',
    });
  };

  const filteredPersonnel = personnel.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.statutoryReg.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* 1. Statutory & Access Control Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Authorized CDE Users
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {personnel.length} Personnel
          </div>
          <span className="text-xs text-slate-500">ISO 19650 Role-Based Matrix</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Accredited RE / RTO (BCA)
          </span>
          <div className="text-2xl font-bold font-mono text-blue-700 mt-1">
            2 Active
          </div>
          <span className="text-xs text-slate-500">IES / ACES Registry Verified</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            MOM WSH & CSOC Alerts
          </span>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
            1 Expiring • 1 Expired
          </div>
          <span className="text-xs text-red-600 font-semibold">Auto-Gate Lockout Enabled</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Subcon bizSAFE Compliance
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            100% (&ge; Lvl 3)
          </div>
          <span className="text-xs text-slate-500">MOM WSH Council Requirement</span>
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
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg shadow-xs transition shrink-0"
          >
            + Register Site Personnel / Subcon
          </button>
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
                <th className="py-3.5 px-4">MOM / BCA Statutory Cert</th>
                <th className="py-3.5 px-4">Biometric Turnstile Access</th>
                <th className="py-3.5 px-4 text-right">PM Gate Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPersonnel.map((person) => {
                const certBadge = getCertStatus(person.certExpiry);
                const isGateActive = person.biometricStatus.includes('Active');

                return (
                  <tr key={person.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                          {person.id}
                        </span>
                        <span className="font-bold text-slate-900">{person.name}</span>
                      </div>
                      <div className="text-xs font-semibold text-blue-700 mt-1">{person.role}</div>
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
                        {person.ptwAuthority.map((auth) => (
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
                      <button
                        onClick={() => toggleBiometricGate(person.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          isGateActive
                            ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {isGateActive ? 'Revoke Gate Pass' : 'Restore Gate Pass'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modal to Register New Personnel / Subcontractor */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5">
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

            <form onSubmit={handleAddPersonnel} className="space-y-4 text-sm">
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
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700"
                >
                  Authorize & Sync Turnstile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
