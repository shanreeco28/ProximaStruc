import React, { useState } from 'react';

const DEFAULT_USERS = [
  {
    id: 'USR-01',
    name: 'Shan Reeco Socorro',
    role: 'Project Lead / Site Engineering',
    organization: 'Main Contractor (China Jingye)',
    statutoryReg: 'MWSHCS Certified • CoreTrade',
    cdePermission: 'Full CDE Admin & PTW Authorizer',
    status: 'Active',
  },
  {
    id: 'USR-02',
    name: 'Er. Tan Wei Ming',
    role: 'Resident Engineer (RE)',
    organization: 'C&S Consultant (QP(S) Representative)',
    statutoryReg: 'IES / ACES Accredited RE',
    cdePermission: 'RFI Final Sign-Off & Cast Clearance',
    status: 'Active',
  },
  {
    id: 'USR-03',
    name: 'Lim Kah Heng',
    role: 'Resident Technical Officer (RTO)',
    organization: 'C&S Consultant',
    statutoryReg: 'BCA Accredited RTO',
    cdePermission: 'RFI Stage 3 Inspection Sign-Off',
    status: 'Active',
  },
  {
    id: 'USR-04',
    name: 'Razak Bin Ahmad',
    role: 'Workplace Safety & Health Officer (WSHO)',
    organization: 'Main Contractor EHS Dept',
    statutoryReg: 'MOM Registered WSHO / ECO',
    cdePermission: 'PTW Endorsement & Stop-Work Authority',
    status: 'Active',
  },
];

export default function UserManagementView({ users = DEFAULT_USERS }) {
  const [roster, setRoster] = useState(users);
  const [search, setSearch] = useState('');

  const filtered = roster.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase()) ||
      u.organization.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            ISO 19650 CDE Role, Consultant (RE/RTO) & Subcontractor Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based access control (RBAC) governing RFI sign-offs, MOM PTW endorsements, and SOPA claims.
          </p>
        </div>
        <input
          type="search"
          placeholder="Search personnel, role, or QP org..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-72"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr class
