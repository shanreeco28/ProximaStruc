import React, { useState } from 'react';
// Existing Component Imports from your repository structure
import AppLogo from './components/AppLogo';
import CalendarView from './components/CalendarView';
import InspectionsView from './components/InspectionsView';
import LiftingView from './components/LiftingView';
import MaterialsView from './components/MaterialsView';
import SiteDiaryView from './components/SiteDiaryView';
import ReportView from './components/ReportView';
import UserManagementView from './components/UserManagementView';
import ExecutiveReportModal from './components/ExecutiveReportModal';
import MobileNav from './components/MobileNav';

const NAV_GROUPS = [
  {
    group: 'Executive & Planning',
    items: [
      { id: 'dashboard', label: 'PM Command Center', badge: null },
      { id: 'calendar', label: 'Master Schedule & Lookahead', badge: '3-Wk' },
      { id: 'reports', label: 'Progress & SOPA Analytics', badge: null },
    ],
  },
  {
    group: 'Site Execution & QA/QC',
    items: [
      { id: 'inspections', label: 'RE/RTO Inspections (RFI)', badge: '4 Pending', alert: 'warning' },
      { id: 'materials', label: 'Materials, BBS & DOs', badge: '2 Delayed', alert: 'danger' },
      { id: 'diary', label: 'Statutory Site Diary', badge: 'Today' },
    ],
  },
  {
    group: 'WSH & High-Risk Ops (MOM)',
    items: [
      { id: 'lifting', label: 'Lifting Plan & PTW Matrix', badge: '6 Active', alert: 'success' },
    ],
  },
  {
    group: 'System & Access',
    items: [
      { id: 'users', label: 'Role & Subcon Matrix', badge: null },
    ],
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isExecModalOpen, setIsExecModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState('All Zones');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* 1. ENTERPRISE SIDEBAR (ISO 9241-110 Grouped Navigation) */}
      <aside className="hidden md:flex md:w-72 bg-slate-900 text-slate-100 flex-col border-r border-slate-800 shrink-0">
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <AppLogo className="w-8 h-8" />
            <div>
              <span className="font-bold tracking-tight text-white text-base block leading-none">
                PROXIMA<span className="text-blue-400">STRUC</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
                CDE • SG Enterprise
              </span>
            </div>
          </div>
        </div>

        {/* Active Contract Selector */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
            Active Contract / Zone
          </label>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All Zones">Contract LC1 — All Zones</option>
            <option value="Zone A">Zone A (Tower 1 - Core & Slab)</option>
            <option value="Zone B">Zone B (Podium & Precast)</option>
            <option value="External">External Works & Cut/Fill</option>
          </select>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6" aria-label="Main Project Navigation">
          {NAV_GROUPS.map((section) => (
            <div key={section.group}>
              <h3 className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {section.group}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                        }`}
                      >
                        <span>{item.label}</span>
                        {item.badge && (
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-blue-800 text-blue-100'
                                : item.alert === 'danger'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : item.alert === 'warning'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : item.alert === 'success'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* PM Regulatory Quick-Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400 space-y-1">
          <div className="flex justify-between">
            <span>WSH Incident-Free:</span>
            <span className="font-mono font-bold text-emerald-400">412 Days</span>
          </div>
          <div className="flex justify-between">
            <span>NEA Noise / Dengue:</span>
            <span className="font-mono text-emerald-400">Compliant (68 dB)</span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Statutory & Telemetry Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              {NAV_GROUPS.flatMap((g) => g.items).find((i) => i.id === activeTab)?.label}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              NEA Weather: Fair (31°C) • Lifting Clear
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExecModalOpen(true)}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition"
            >
              <span>Generate Executive Brief</span>
            </button>
          </div>
        </header>

        {/* Persistent PM KPI Ribbon (ISO Progressive Disclosure) */}
        <section
          aria-label="Key Project Metrics"
          className="bg-white border-b border-slate-200 px-4 lg:px-8 py-3 grid grid-cols-2 lg:grid-cols-5 gap-3"
        >
          <KpiPill
            title="Critical Path (SPI)"
            value="0.98 (-2d)"
            sub="Zone A L6 Core Wall"
            status="warning"
            onClick={() => setActiveTab('calendar')}
          />
          <KpiPill
            title="RE / RTO Inspections"
            value="94.2% Pass"
            sub="4 RFIs Awaiting Sign-off"
            status="neutral"
            onClick={() => setActiveTab('inspections')}
          />
          <KpiPill
            title="Active Lifting / PTWs"
            value="6 Permits"
            sub="TC-1, TC-2 & 50T Mobile"
            status="success"
            onClick={() => setActiveTab('lifting')}
          />
          <KpiPill
            title="Rebar (BBS) & Concrete"
            value="142t / 380m³"
            sub="2 BBS Tags Delayed"
            status="danger"
            onClick={() => setActiveTab('materials')}
          />
          <KpiPill
            title="Site Manpower (Biometric)"
            value="318 Pax"
            sub="Main: 42 | Subcon: 276"
            status="neutral"
            onClick={() => setActiveTab('diary')}
          />
        </section>

        {/* Active View Container */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <PMCommandDashboard
              selectedZone={selectedZone}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'inspections' && <InspectionsView />}
          {activeTab === 'lifting' && <LiftingView />}
          {activeTab === 'materials' && <MaterialsView />}
          {activeTab === 'diary' && <SiteDiaryView />}
          {activeTab === 'reports' && <ReportView />}
          {activeTab === 'users' && <UserManagementView />}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden">
          <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>

      {/* Executive Summary / Print Modal */}
      {isExecModalOpen && (
        <ExecutiveReportModal onClose={() => setIsExecModalOpen(false)} />
      )}
    </div>
  );
}

function KpiPill({ title, value, sub, status, onClick }) {
  const statusStyles = {
    success: 'border-l-4 border-l-emerald-500 bg-emerald-50/30',
    warning: 'border-l-4 border-l-amber-500 bg-amber-50/30',
    danger: 'border-l-4 border-l-red-600 bg-red-50/30',
    neutral: 'border-l-4 border-l-blue-600 bg-slate-50/60',
  };

  return (
    <button
      onClick={onClick}
      className={`text-left p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition ${statusStyles[status]}`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </div>
      <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">{value}</div>
      <div className="text-xs text-slate-600 truncate mt-0.5">{sub}</div>
    </button>
  );
}

function PMCommandDashboard({ selectedZone, onNavigate }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Today's Critical Casting & RTO Hold Points */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Structural Hold Points (RE/RTO)
            </h2>
            <button
              onClick={() => onNavigate('inspections')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View All RFIs →
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-900 block">RFI-STR-104: L6 Slab Rebar & Post-Tension</span>
                <span className="text-xs text-slate-600">RTO Inspection @ 14:00 • Target Pour: 16:30</span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-200 text-amber-900">
                AWAITING RTO
              </span>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-900 block">RFI-STR-103: Core Wall CW2 Formwork</span>
                <span className="text-xs text-slate-600">Signed off by RE Tan • Ready for Concrete</span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-200 text-emerald-900">
                APPROVED
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: MOM High-Risk & Lifting PTW Matrix */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              MOM Permit-to-Work & Crane Status
            </h2>
            <button
              onClick={() => onNavigate('lifting')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Manage PTWs →
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="p-3 rounded-lg border border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-900 block">Tower Crane TC-1 (Precast Columns)</span>
                <span className="text-xs text-slate-500">Lifting Sup: Ahamed • Wind: 14 km/h (Safe)</span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">
                PTW ACTIVE
              </span>
            </div>
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-900 block">50T Mobile Crane (Zone B Unloading)</span>
                <span className="text-xs text-red-700">Outrigger Mat Check Pending WSHO Sign-off</span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-200 text-red-900">
                HOLD
              </span>
            </div>
          </div>
        </div>

        {/* Column 3: Commercial / SOPA & Supply Chain Pulse */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              SOPA Progress Claim & BBS Logistics
            </h2>
            <button
              onClick={() => onNavigate('materials')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              BBS & DO Log →
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Progress Claim #14 Cutoff:</span>
              <span className="font-mono font-bold text-slate-900">25 Oct (5 Days)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Verified Structural Cast (Month):</span>
              <span className="font-mono font-bold text-emerald-700">$1,420,000 (92%)</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600">Pending NatSteel BBS Tags:</span>
              <span className="font-mono font-bold text-red-600">2 Tags (L6 Beams)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
