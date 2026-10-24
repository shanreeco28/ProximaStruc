import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
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
import LoginView from './components/LoginView';

const DEFAULT_RFIS = [
  {
    id: 'RFI-STR-104',
    zone: 'Zone A • L6 Core & Slab',
    discipline: 'Structural',
    element: 'Post-Tension Tendon & Bottom Rebar',
    rtoName: 'RTO Lim K.H.',
    reName: 'RE Tan W.M.',
    targetCast: '2026-10-20 16:30',
    stage: 2,
    conquasScore: 'Pending',
    bbsLinked: 'BBS-L6-042 (Verified)',
  },
  {
    id: 'RFI-MEP-089',
    zone: 'Zone A • L6 Core & Slab',
    discipline: 'M&E Sleeve / Conduit',
    element: 'Cast-in Sanitary & Electrical Sleeves',
    rtoName: 'RTO Rajendran',
    reName: 'RE Tan W.M.',
    targetCast: '2026-10-20 16:30',
    stage: 3,
    conquasScore: 'Pass (First-Time)',
    bbsLinked: 'N/A',
  },
  {
    id: 'RFI-STR-103',
    zone: 'Zone B • Podium L3',
    discipline: 'Structural',
    element: 'Core Wall CW2 Pre-Close Formwork',
    rtoName: 'RTO Lim K.H.',
    reName: 'RE Tan W.M.',
    targetCast: '2026-10-21 10:00',
    stage: 3,
    conquasScore: '96.5% (CONQUAS)',
    bbsLinked: 'BBS-CW2-019 (Verified)',
  },
];

const DEFAULT_LIFTS = [
  {
    id: 'PTW-LIFT-204',
    crane: 'Tower Crane TC-1 (Luffing 12T)',
    lmExpiry: '2027-03-14 (Valid)',
    zone: 'Zone A • L6 Core',
    loadDescription: 'Precast Staircase Flight PSF-6A (4.2 Tonnes)',
    radius: '28m (72% SWL)',
    supervisor: 'Ahamed R. (WSQ-8821)',
    rigger: 'Velu M. (WSQ-4410)',
    signalman: 'Hossain K. (WSQ-3109)',
    windSpeed: '14 km/h',
    status: 'ACTIVE',
  },
  {
    id: 'PTW-LIFT-205',
    crane: '50T Mobile Crane (Kato)',
    lmExpiry: '2026-12-01 (Valid)',
    zone: 'Zone B • Holding Bay',
    loadDescription: 'NatSteel Rebar Bundles Unloading (2.8 Tonnes)',
    radius: '14m (55% SWL)',
    supervisor: 'Suresh P. (WSQ-7712)',
    rigger: 'Rahman A. (WSQ-2901)',
    signalman: 'Kumar S. (WSQ-5582)',
    windSpeed: '16 km/h',
    status: 'PENDING_WSHO',
  },
];

const DEFAULT_MATERIALS = [
  {
    id: 'BBS-L6-042',
    type: 'Rebar (BBS)',
    supplier: 'NatSteel Holdings',
    element: 'Zone A • L6 Slab & Drop Panels (T16, T20, T25)',
    quantity: '48.5 Tonnes',
    doNumber: 'DO-NS-88412',
    deliverySlot: 'Delivered • Yard Bay 2',
    craneSlot: 'TC-1 Booked (Completed)',
    sopaClaimable: true,
    sopaValue: 67900,
    status: 'Installed & Cast-Ready',
  },
  {
    id: 'CONC-L6-011',
    type: 'Ready-Mix Concrete',
    supplier: 'Pan-United Concrete (G40 Pump Mix)',
    element: 'Zone A • L6 Core Wall & Slab Pour',
    quantity: '210.0 m³',
    doNumber: 'Batch Pre-Order #410',
    deliverySlot: 'Today 16:30 (12 Trucks Staggered)',
    craneSlot: 'Placing Boom PB-1',
    sopaClaimable: false,
    sopaValue: 33600,
    status: 'Awaiting RTO Clearance',
  },
  {
    id: 'BBS-L6-045',
    type: 'Rebar (BBS)',
    supplier: 'NatSteel Holdings',
    element: 'Zone B • L4 Perimeter Beams',
    quantity: '22.0 Tonnes',
    doNumber: 'Pending Dispatch',
    deliverySlot: 'Delayed (+1 Day)',
    craneSlot: '50T Mobile Crane (Hold)',
    sopaClaimable: false,
    sopaValue: 30800,
    status: 'Fabrication Delay',
  },
];

const DEFAULT_CLAIMS = [
  {
    claimNo: 'PC-14 (Current)',
    period: '26 Sep – 25 Oct 2026',
    claimedAmount: 1485000,
    certifiedAmount: 1420000,
    variationOrders: '+S$ 65,000 (VO-08 Approved)',
    sopaStatus: 'Pending Payment Response (Due 08 Nov)',
    retention: '5% (Capped)',
  },
  {
    claimNo: 'PC-13',
    period: '26 Aug – 25 Sep 2026',
    claimedAmount: 1310000,
    certifiedAmount: 1295000,
    variationOrders: '+S$ 18,500 (VO-07)',
    sopaStatus: 'Paid in Full (Tax Invoice Settled)',
    retention: '5%',
  },
  {
    claimNo: 'PC-12',
    period: '26 Jul – 25 Aug 2026',
    claimedAmount: 1190000,
    certifiedAmount: 1190000,
    variationOrders: 'S$ 0',
    sopaStatus: 'Paid in Full (Tax Invoice Settled)',
    retention: '5%',
  },
];

const DEFAULT_WEATHER_LOGS = [
  {
    id: 1,
    timeWindow: '13:40 – 15:10 (1.5 hrs)',
    event: 'NEA Heavy Rain & Lightning Risk Alert (Cat 1)',
    impact: 'Tower Crane TC-1 & TC-2 lifting suspended; Zone A L6 open slab rebar tying halted.',
    contractClause: 'PSSCOC Cl. 14.2 (Weather EOT Record)',
  },
];

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
    certExpiry: '2026-11-05',
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
    certExpiry: '2026-10-18',
    bizSafe: 'bizSAFE Level 3',
    biometricStatus: 'Suspended (Cert Renewal Pending)',
    ptwAuthority: ['Submit Internal QC', 'Log BBS Delivery'],
  },
];

const LOOKAHEAD_TASKS = [
  {
    wbs: 'WBS-1.4.2',
    activity: 'Zone A • L6 Core Wall & Slab Casting (G40)',
    baseline: '20 Oct 2026',
    forecast: '20 Oct 2026',
    variance: '0d (On Track)',
    rfiStatus: '1 Pending RTO (RFI-STR-104)',
    critical: true,
  },
  {
    wbs: 'WBS-1.4.3',
    activity: 'Zone A • L7 Vertical Column Rebar & Formwork',
    baseline: '22 Oct 2026',
    forecast: '24 Oct 2026',
    variance: '-2d (BBS Delay)',
    rfiStatus: 'Drafting',
    critical: true,
  },
  {
    wbs: 'WBS-2.1.5',
    activity: 'Zone B • Podium Precast Beam Installation',
    baseline: '25 Oct 2026',
    forecast: '25 Oct 2026',
    variance: '0d (On Track)',
    rfiStatus: 'Cleared (RFI-STR-103)',
    critical: false,
  },
];

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

function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();
  const [isExecModalOpen, setIsExecModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState('All Zones');

  const [inspections, setInspections] = useState(DEFAULT_RFIS);
  const [lifts, setLifts] = useState(DEFAULT_LIFTS);
  const [materials, setMaterials] = useState(DEFAULT_MATERIALS);
  const [claims] = useState(DEFAULT_CLAIMS);
  const [weatherLogs, setWeatherLogs] = useState(DEFAULT_WEATHER_LOGS);
  const [personnel, setPersonnel] = useState(DEFAULT_PERSONNEL);
  const [tasks] = useState(LOOKAHEAD_TASKS);

  const handleAddWeatherLog = (newLog) => {
    setWeatherLogs((prev) => [...prev, { ...newLog, id: Date.now() }]);
  };

  const handleAddPersonnel = (newUser) => {
    setPersonnel((prev) => [
      ...prev,
      {
        ...newUser,
        id: `USR-${String(prev.length + 1).padStart(3, '0')}`,
        bizSafe: 'Pending Verification',
        biometricStatus: 'Active (Provisional Gate Pass)',
        ptwAuthority: ['General Site Access (No PTW)'],
        cdePermission: 'Field Contributor (Level 1)',
      },
    ]);
  };

  const handleToggleBiometricGate = (id) => {
    setPersonnel((prev) =>
      prev.map((person) => {
        if (person.id !== id) return person;
        const isActive = person.biometricStatus.includes('Active');
        return {
          ...person,
          biometricStatus: isActive ? 'Suspended (Gate Pass Revoked by PM)' : 'Active (Gate Pass Restored)',
        };
      })
    );
  };

  const handleToggleSopa = (id) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, sopaClaimable: !m.sopaClaimable } : m))
    );
  };

  const handleUpdateRfiStage = (updatedRfi) => {
    setInspections((prev) =>
      prev.map((rfi) => (rfi.id === updatedRfi.id ? updatedRfi : rfi))
    );
  };

  const handleToggleLift = (id) => {
    setLifts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = p.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        return { ...p, status: next };
      })
    );
  };

  const pendingInspections = inspections.filter((i) => i.stage < 3).length;
  const delayedMaterials = materials.filter((m) => m.status.includes('Delay')).length;
  const activeLifts = lifts.filter((l) => l.status === 'ACTIVE').length;

  const dynamicNavGroups = [
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
        { id: 'inspections', label: 'RE/RTO Inspections (RFI)', badge: pendingInspections > 0 ? `${pendingInspections} Pending` : null, alert: pendingInspections > 0 ? 'warning' : null },
        { id: 'materials', label: 'Materials, BBS & DOs', badge: delayedMaterials > 0 ? `${delayedMaterials} Delayed` : null, alert: delayedMaterials > 0 ? 'danger' : null },
        { id: 'diary', label: 'Statutory Site Diary', badge: 'Today' },
      ],
    },
    {
      group: 'WSH & High-Risk Ops (MOM)',
      items: [
        { id: 'lifting', label: 'Lifting Plan & PTW Matrix', badge: activeLifts > 0 ? `${activeLifts} Active` : null, alert: activeLifts > 0 ? 'success' : null },
      ],
    },
    {
      group: 'System & Access',
      items: [
        { id: 'users', label: 'Role & Subcon Matrix', badge: null },
      ],
    },
  ];

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
          {dynamicNavGroups.map((section) => (
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
              {dynamicNavGroups.flatMap((g) => g.items).find((i) => i.id === activeTab)?.label}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              NEA Weather: Fair (31°C) • Lifting Clear
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition"
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">Log In / Sign Up</span>
              <span className="sm:hidden">Log In</span>
            </button>
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
            sub={tasks.find(t => t.critical)?.activity || 'On Track'}
            status={tasks.some(t => t.variance.includes('-')) ? 'warning' : 'success'}
            onClick={() => setActiveTab('calendar')}
          />
          <KpiPill
            title="RE / RTO Inspections"
            value={`${inspections.filter(i => i.stage === 3).length} Cleared`}
            sub={`${inspections.filter(i => i.stage < 3).length} Awaiting Sign-off`}
            status={inspections.some(i => i.stage < 3) ? 'neutral' : 'success'}
            onClick={() => setActiveTab('inspections')}
          />
          <KpiPill
            title="Active Lifting / PTWs"
            value={`${lifts.filter(l => l.status === 'ACTIVE').length} Permits`}
            sub="TC-1, TC-2 & 50T Mobile"
            status={lifts.some(l => l.status !== 'ACTIVE') ? 'warning' : 'success'}
            onClick={() => setActiveTab('lifting')}
          />
          <KpiPill
            title="Rebar (BBS) & Concrete"
            value={`${materials.length} Deliveries`}
            sub={`${materials.filter(m => m.status.includes('Delay')).length} BBS Tags Delayed`}
            status={materials.some(m => m.status.includes('Delay')) ? 'danger' : 'success'}
            onClick={() => setActiveTab('materials')}
          />
          <KpiPill
            title="Site Manpower (Biometric)"
            value={`${personnel.filter(p => p.biometricStatus.includes('Active')).length} Pax`}
            sub={`Main: ${personnel.filter(p => p.category === 'Main Contractor').length} | Subcon: ${personnel.filter(p => p.category.includes('Subcontractor')).length}`}
            status="neutral"
            onClick={() => setActiveTab('users')}
          />
        </section>

        {/* Active View Container */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <PMCommandDashboard
              onNavigate={setActiveTab}
              inspections={inspections}
              lifts={lifts}
              materials={materials}
              claims={claims}
            />
          )}
          {activeTab === 'calendar' && <CalendarView tasks={tasks} />}
          {activeTab === 'inspections' && (
            <InspectionsView
              inspections={inspections}
              onUpdateStage={handleUpdateRfiStage}
            />
          )}
          {activeTab === 'lifting' && (
            <LiftingView
              lifts={lifts}
              onToggleLift={handleToggleLift}
            />
          )}
          {activeTab === 'materials' && (
            <MaterialsView
              materials={materials}
              onToggleSopa={handleToggleSopa}
            />
          )}
          {activeTab === 'diary' && (
            <SiteDiaryView
              weatherLogs={weatherLogs}
              onAddWeatherLog={handleAddWeatherLog}
            />
          )}
          {activeTab === 'reports' && (
            <ReportView claims={claims} />
          )}
          {activeTab === 'users' && (
            <UserManagementView
              users={personnel}
              onAddPersonnel={handleAddPersonnel}
              onToggleBiometricGate={handleToggleBiometricGate}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden">
          <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>

      {/* Executive Summary / Print Modal */}
      {isExecModalOpen && (
        <ExecutiveReportModal
          onClose={() => setIsExecModalOpen(false)}
          tasks={tasks}
          inspections={inspections}
          claims={claims}
          weatherLogs={weatherLogs}
          materials={materials}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/*" element={<MainApp />} />
      <Route path="/login" element={<LoginView />} />
    </Routes>
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

function PMCommandDashboard({ onNavigate, inspections, lifts, materials, claims }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Today's Critical Casting & RTO Hold Points */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col">
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
          <div className="space-y-3 text-sm flex-1 overflow-y-auto max-h-[300px]">
            {inspections.map((rfi) => (
              <div
                key={rfi.id}
                className={`p-3 rounded-lg border flex justify-between items-center ${
                  rfi.stage === 3
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div>
                  <span className="font-semibold text-slate-900 block">{rfi.id}: {rfi.element}</span>
                  <span className="text-xs text-slate-600">Target Pour: {rfi.targetCast}</span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    rfi.stage === 3
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {rfi.stage === 3 ? 'APPROVED' : 'AWAITING RTO'}
                </span>
              </div>
            ))}
            {inspections.length === 0 && (
              <div className="text-slate-500 text-center py-4">No active RFIs.</div>
            )}
          </div>
        </div>

        {/* Column 2: MOM High-Risk & Lifting PTW Matrix */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col">
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
          <div className="space-y-3 text-sm flex-1 overflow-y-auto max-h-[300px]">
            {lifts.map((ptw) => (
              <div
                key={ptw.id}
                className={`p-3 rounded-lg border flex justify-between items-center ${
                  ptw.status === 'ACTIVE'
                    ? 'border-slate-200'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div>
                  <span className="font-semibold text-slate-900 block">{ptw.crane}</span>
                  <span className={`text-xs ${ptw.status === 'ACTIVE' ? 'text-slate-500' : 'text-red-700'}`}>
                    Wind: {ptw.windSpeed} • Radius: {ptw.radius}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    ptw.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-200 text-red-900'
                  }`}
                >
                  {ptw.status === 'ACTIVE' ? 'PTW ACTIVE' : 'HOLD'}
                </span>
              </div>
            ))}
            {lifts.length === 0 && (
              <div className="text-slate-500 text-center py-4">No active PTWs.</div>
            )}
          </div>
        </div>

        {/* Column 3: Commercial / SOPA & Supply Chain Pulse */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col">
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
          <div className="space-y-3 text-sm flex-1">
            {claims[0] && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Current Claim ({claims[0].claimNo}):</span>
                  <span className="font-mono font-bold text-slate-900">{claims[0].period.split('–')[1]?.trim() || 'Next Cutoff'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Verified Structural Cast:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    S$ {claims[0].certifiedAmount.toLocaleString()}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600">Delayed Materials / BBS:</span>
              <span className="font-mono font-bold text-red-600">
                {materials.filter((m) => m.status.includes('Delay')).length} Item(s)
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-slate-100 mt-2">
              <span className="text-slate-600">Total SOPA Claimable in View:</span>
              <span className="font-mono font-bold text-blue-700">
                S$ {materials.filter(r => r.sopaClaimable).reduce((acc, r) => acc + r.sopaValue, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
