import React, { useState, useEffect } from 'react';
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

import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import LoginView from './components/LoginView';
import ProjectSelection from './components/ProjectSelection';









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

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(() => {
    const saved = localStorage.getItem('sb-selected-project');
    return saved ? JSON.parse(saved) : null;
  });
  const [projects, setProjects] = useState([]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isExecModalOpen, setIsExecModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState('All Zones');

  const [inspections, setInspections] = useState([]);
  const [lifts, setLifts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [claims] = useState([]);
  const [weatherLogs, setWeatherLogs] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [zones, setZones] = useState([]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem('sb-selected-project', JSON.stringify(selectedProject));
    } else {
      localStorage.removeItem('sb-selected-project');
    }
  }, [selectedProject]);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'projects');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      setProjects(projectsData);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const syncUserProfile = async () => {
      if (!user || !selectedProject) return;

      const syncKey = `synced_${user.uid}_${selectedProject.id}`;
      if (sessionStorage.getItem(syncKey)) return;

      try {
        const usersRef = collection(db, `artifacts/${selectedProject.id}/users`);
        const qUser = query(usersRef, where('email', '==', user.email));
        const snapshot = await getDocs(qUser);

        if (snapshot.empty) {
          const tempUserDataStr = localStorage.getItem('temp_user_data');
          const tempUserData = tempUserDataStr ? JSON.parse(tempUserDataStr) : {};

          const allUsersSnapshot = await getDocs(usersRef);
          const isFirstUser = allUsersSnapshot.empty;
          const userRole = isFirstUser ? 'admin' : 'guest';

          const newUserDoc = {
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            role: tempUserData.designation || 'Site Engineer',
            organization: 'Main Contractor',
            category: 'Main Contractor',
            cdePermission: 'Field Contributor (Level 1)',
            statutoryReg: '',
            certExpiry: '2027-12-31',
            bizSafe: 'Pending Verification',
            biometricStatus: 'Active (Provisional Gate Pass)',
            ptwAuthority: ['General Site Access (No PTW)'],
            systemRole: userRole,
            createdAt: new Date().toISOString(),
            birthday: tempUserData.birthday || ''
          };

          const docRef = doc(usersRef);
          await setDoc(docRef, newUserDoc);
        }

        sessionStorage.setItem(syncKey, 'true');
      } catch (e) {
        console.error('Error syncing user profile:', e);
      }
    };

    syncUserProfile();
  }, [user, selectedProject]);

  useEffect(() => {
    if (!selectedProject || !user) return;
    const listeners = [];

    const subscribe = (collectionName, setter) => {
      const q = collection(db, `artifacts/${selectedProject.id}/${collectionName}`);
      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        setter(data);
      });
      listeners.push(unsub);
    };

    subscribe('users', setPersonnel);
    subscribe('tasks', setTasks);
    subscribe('inspections', setInspections);
    subscribe('materials', setMaterials);
    subscribe('weatherLogs', setWeatherLogs);
    subscribe('lifts', setLifts);
    subscribe('zones', setZones);

    return () => {
      listeners.forEach((unsub) => unsub());
    };
  }, [selectedProject, user]);
  
  const currentUser = personnel.find(p => p.email === user?.email);
  const isPrivileged = ['admin', 'manager', 'engineer', 'supervisor'].includes(currentUser?.systemRole);

  const handleAddZone = () => {
    const newZone = window.prompt("Enter new zone name:");
    if (newZone?.trim()) {
      addRecord('zones', { name: newZone.trim() });
    }
  };

  const filterByZone = (arr) => {
    if (selectedZone === 'All Zones') return arr;
    return arr.filter(item => item.zone === selectedZone);
  };

  const addRecord = async (collectionName, record) => {
    if (!selectedProject) return;
    try {
      const recordWithMeta = {
        ...record,
        createdBy: user.email,
        createdAt: new Date().toISOString()
      };

      const docRef = record.id
        ? doc(db, `artifacts/${selectedProject.id}/${collectionName}`, record.id)
        : doc(collection(db, `artifacts/${selectedProject.id}/${collectionName}`));

      await setDoc(docRef, recordWithMeta);
    } catch (e) {
      console.error(`Error adding to ${collectionName}:`, e);
    }
  };

  const updateRecord = async (collectionName, id, updates) => {
    if (!selectedProject) return;
    try {
      await updateDoc(doc(db, `artifacts/${selectedProject.id}/${collectionName}`, id), updates);
    } catch (e) {
      console.error(`Error updating in ${collectionName}:`, e);
    }
  };

  const filteredTasks = filterByZone(tasks);
  const filteredInspections = filterByZone(inspections);
  const filteredMaterials = filterByZone(materials);
  const filteredWeatherLogs = filterByZone(weatherLogs);
  const filteredLifts = filterByZone(lifts);


  const handleAddPersonnel = async (newUser) => {
    if (!selectedProject) return;
    const isFirstUser = personnel.length === 0;
    const userRole = isFirstUser ? 'admin' : 'guest';
    
    const newUserDoc = {
      ...newUser,
      bizSafe: 'Pending Verification',
      biometricStatus: 'Active (Provisional Gate Pass)',
      ptwAuthority: ['General Site Access (No PTW)'],
      cdePermission: 'Field Contributor (Level 1)',
      systemRole: userRole,
      createdAt: new Date().toISOString()
    };
    
    try {
      const docRef = doc(collection(db, `artifacts/${selectedProject.id}/users`));
      await setDoc(docRef, newUserDoc);
    } catch (e) {
      console.error('Error adding personnel:', e);
    }
  };

  const handleToggleBiometricGate = async (id) => {
    if (!selectedProject) return;
    const person = personnel.find(p => p.id === id);
    if (!person) return;
    const isActive = person.biometricStatus.includes('Active');
    const newStatus = isActive ? 'Suspended (Gate Pass Revoked by PM)' : 'Active (Gate Pass Restored)';
    try {
      await updateDoc(doc(db, `artifacts/${selectedProject.id}/users`, id), {
        biometricStatus: newStatus
      });
    } catch (e) {
      console.error('Error updating biometric status:', e);
    }
  };

  const handleUpdatePersonnelRole = async (id, newSystemRole) => {
    if (!selectedProject) return;
    try {
      await updateDoc(doc(db, `artifacts/${selectedProject.id}/users`, id), {
        systemRole: newSystemRole
      });
    } catch (e) {
      console.error('Error updating role:', e);
    }
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

  const pendingInspections = filteredInspections.filter((i) => i.stage < 3).length;
  const delayedMaterials = filteredMaterials.filter((m) => m.status.includes('Delay')).length;
  const activeLifts = filteredLifts.filter((l) => l.status === 'ACTIVE').length;

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


  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;
  }

  if (!user) {
    return <LoginView initialMode="login" />;
  }

  if (!selectedProject) {
    return (
      <ProjectSelection
        projects={projects}
        user={user}
        onSelect={setSelectedProject}
        onAdd={async (newProject) => {
          try {
            await setDoc(doc(db, 'projects', newProject.id), newProject);
          } catch (e) {
            console.error('Error adding project:', e);
          }
        }}
        onDelete={async (id) => {
          try {
            await deleteDoc(doc(db, 'projects', id));
          } catch (e) {
            console.error('Error deleting project:', e);
          }
        }}
        onLogout={() => signOut(auth)}
      />
    );
  }

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
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Active Contract / Zone
            </label>
            {isPrivileged && (
              <button onClick={handleAddZone} className="text-xs text-blue-400 hover:text-blue-300">+</button>
            )}
          </div>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All Zones">All Zones</option>
            {zones.map(z => (
              <option key={z.id} value={z.name}>{z.name}</option>
            ))}
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
            sub={filteredTasks.find(t => t.critical)?.activity || 'On Track'}
            status={filteredTasks.some(t => t.variance.includes('-')) ? 'warning' : 'success'}
            onClick={() => setActiveTab('calendar')}
          />
          <KpiPill
            title="RE / RTO Inspections"
            value={`${filteredInspections.filter(i => i.stage === 3).length} Cleared`}
            sub={`${filteredInspections.filter(i => i.stage < 3).length} Awaiting Sign-off`}
            status={filteredInspections.some(i => i.stage < 3) ? 'neutral' : 'success'}
            onClick={() => setActiveTab('inspections')}
          />
          <KpiPill
            title="Active Lifting / PTWs"
            value={`${filteredLifts.filter(l => l.status === 'ACTIVE').length} Permits`}
            sub="TC-1, TC-2 & 50T Mobile"
            status={filteredLifts.some(l => l.status !== 'ACTIVE') ? 'warning' : 'success'}
            onClick={() => setActiveTab('lifting')}
          />
          <KpiPill
            title="Rebar (BBS) & Concrete"
            value={`${filteredMaterials.length} Deliveries`}
            sub={`${filteredMaterials.filter(m => m.status.includes('Delay')).length} BBS Tags Delayed`}
            status={filteredMaterials.some(m => m.status.includes('Delay')) ? 'danger' : 'success'}
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
              inspections={filteredInspections}
              lifts={filteredLifts}
              materials={filteredMaterials}
              claims={claims}
            />
          )}
          {activeTab === 'calendar' && <CalendarView tasks={filteredTasks} onAdd={(t) => addRecord('tasks', t)} onUpdate={(id, t) => updateRecord('tasks', id, t)} currentUser={currentUser} zones={zones} />}
          {activeTab === 'inspections' && (
            <InspectionsView
              inspections={filteredInspections}
              onUpdateStage={handleUpdateRfiStage}
              onAdd={(t) => addRecord('inspections', t)}
              onUpdate={(id, t) => updateRecord('inspections', id, t)}
              currentUser={currentUser}
              zones={zones}
            />
          )}
          {activeTab === 'lifting' && (
            <LiftingView
              lifts={filteredLifts}
              onToggleLift={handleToggleLift}
              onAdd={(t) => addRecord('lifts', t)}
              onUpdate={(id, t) => updateRecord('lifts', id, t)}
              currentUser={currentUser}
              zones={zones}
            />
          )}
          {activeTab === 'materials' && (
            <MaterialsView
              materials={filteredMaterials}
              onToggleSopa={handleToggleSopa}
              onAdd={(t) => addRecord('materials', t)}
              onUpdate={(id, t) => updateRecord('materials', id, t)}
              currentUser={currentUser}
              zones={zones}
            />
          )}
          {activeTab === 'diary' && (
            <SiteDiaryView
              weatherLogs={filteredWeatherLogs}
              onAddWeatherLog={(l) => addRecord('weatherLogs', l)}
              onUpdate={(id, t) => updateRecord('weatherLogs', id, t)}
              currentUser={currentUser}
              zones={zones}
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
              onUpdatePersonnelRole={handleUpdatePersonnelRole}
              currentUser={currentUser}
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
          tasks={filteredTasks}
          inspections={filteredInspections}
          claims={claims}
          weatherLogs={filteredWeatherLogs}
          materials={filteredMaterials}
        />
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
