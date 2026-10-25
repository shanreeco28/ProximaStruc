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
import MonitoringView from './components/MonitoringView';
import { observationValue } from './utils/monitoring';
import useProjectRecords from './hooks/useProjectRecords';
import { canPlan, canWrite, latestObservation, projectProgress, ROLES } from './utils/siteData';

import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, sendEmailVerification } from 'firebase/auth';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import LoginView from './components/LoginView';
import ProjectSelection from './components/ProjectSelection';









export default function App() {

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(() => {
    const saved = localStorage.getItem('sb-selected-project');
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });
  const [projects, setProjects] = useState([]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isExecModalOpen, setIsExecModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState('All Zones');

  const [operationError, setOperationError] = useState('');
  const records = useProjectRecords(selectedProject?.id, user?.uid);
  const inspections = records.inspections.items;
  const lifts = records.lifts.items;
  const materials = records.materials.items;
  const weatherLogs = records.weatherLogs.items;
  const personnel = records.users.items;
  const tasks = records.tasks.items;
  const zones = records.zones.items;
  const observations = records.monitoring.items;
  const observation = latestObservation(observations);


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

  const liveProject = projects.find(p => p.id === selectedProject?.id);
  const currentUser = liveProject?.ownerId === user?.uid
    ? { email: user?.email, systemRole: 'admin' }
    : user?.emailVerified ? (personnel.find(p => p.id === user.email?.toLowerCase()) || personnel.find(p => p.email?.toLowerCase() === user.email?.toLowerCase())) : undefined;
  const isPrivileged = canPlan(currentUser);
  const isAdmin = currentUser?.systemRole === 'admin';

  const handleAddZone = async () => {
    const newZone = window.prompt("Enter new zone name:");
    if (newZone?.trim()) {
      try { await addRecord('zones', { name: newZone.trim() }); } catch (e) { setOperationError(e.message); }
    }
  };

  const filterByZone = (arr) => {
    if (selectedZone === 'All Zones') return arr;
    return arr.filter(item => item.zone === selectedZone);
  };

  const assertPermission = (collectionName) => {
    if (!selectedProject || !user || !canWrite(currentUser, collectionName)) throw new Error('Your project role does not permit this change.');
  };
  const addRecord = async (collectionName, record) => {
    assertPermission(collectionName);
    if (record.id && (record.id.includes('/') || !record.id.trim())) throw new Error('Record references must be nonempty and cannot contain a slash.');
    const recordWithMeta = { ...record, createdBy: user.email, createdAt: new Date().toISOString() };
    const ref = record.id
      ? doc(db, `artifacts/${selectedProject.id}/${collectionName}`, record.id)
      : doc(collection(db, `artifacts/${selectedProject.id}/${collectionName}`));
    // Creation must never overwrite an existing record with the same reference.
    await runTransaction(db, async transaction => {
      const existing = await transaction.get(ref);
      if (existing.exists()) throw new Error('That reference already exists. Edit the existing record instead.');
      transaction.set(ref, recordWithMeta);
    });
  };
  const updateRecord = async (collectionName, id, updates) => {
    assertPermission(collectionName);
    const { id: ignoredId, createdBy: ignoredCreator, createdAt: ignoredDate, ...fields } = updates;
    void ignoredId; void ignoredCreator; void ignoredDate;
    await updateDoc(doc(db, `artifacts/${selectedProject.id}/${collectionName}`, id), {
      ...fields, updatedBy: user.email, updatedAt: new Date().toISOString()
    });
  };

  const filteredTasks = filterByZone(tasks);
  const filteredInspections = filterByZone(inspections);
  const filteredMaterials = filterByZone(materials);
  const filteredWeatherLogs = filterByZone(weatherLogs);
  const filteredLifts = filterByZone(lifts);


  const handleAddPersonnel = async (newUser) => {
    assertPermission('users');
    const email = newUser.email?.trim().toLowerCase();
    if (!email || email.includes('/')) throw new Error('Enter a valid sign-in email.');
    if (personnel.some(p => p.email?.toLowerCase() === email)) throw new Error('That sign-in email is already registered.');
    await addRecord('users', {
      ...newUser, email, id: email, bizSafe: newUser.bizSafe || '',
      biometricStatus: 'Not recorded', ptwAuthority: [], cdePermission: 'Project member', systemRole: 'guest'
    });
  };
  const handleToggleBiometricGate = async (id) => {
    const person = personnel.find(p => p.id === id);
    if (!person) return;
    try { await updateRecord('users', id, { biometricStatus: person.biometricStatus?.startsWith('Active') ? 'Suspended (manual record)' : 'Active (manual record)' }); }
    catch (e) { setOperationError(e.message); }
  };
  const handleUpdatePersonnelRole = async (id, systemRole) => {
    if (!ROLES.includes(systemRole)) return;
    const person = personnel.find(p => p.id === id);
    if (!person?.email) { setOperationError('This legacy personnel record needs a sign-in email before assigning access.'); return; }
    try {
      assertPermission('users');
      const email = person.email.toLowerCase();
      if (id === email) {
        await updateRecord('users', id, { systemRole });
      } else {
        const legacyRef = doc(db, `artifacts/${selectedProject.id}/users`, id);
        const memberRef = doc(db, `artifacts/${selectedProject.id}/users`, email);
        await runTransaction(db, async transaction => {
          const legacy = await transaction.get(legacyRef);
          const existing = await transaction.get(memberRef);
          if (!legacy.exists()) throw new Error('The legacy record no longer exists. Refresh and retry.');
          if (existing.exists()) throw new Error('A membership already exists for this email. Review that membership instead of overwriting it.');
          const { id: ignored, ...data } = legacy.data(); void ignored;
          if (data.email?.toLowerCase() !== email) throw new Error('The sign-in email changed. Refresh and retry.');
          transaction.set(memberRef, {
            ...data, email, systemRole, migratedFrom: id,
            legacyCreatedBy: data.createdBy || '', legacyCreatedAt: data.createdAt || '',
            createdBy: user.email, createdAt: new Date().toISOString(),
            updatedBy: user.email, updatedAt: new Date().toISOString()
          });
          transaction.delete(legacyRef);
        });
      }
    } catch (e) { setOperationError(e.message); }
  };
  const handleToggleLift = async (id) => {
    const lift = lifts.find(p => p.id === id);
    if (!lift) return;
    try { await updateRecord('lifts', id, { status: lift.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }); }
    catch (e) { setOperationError(e.message); }
  };
  const progress = projectProgress(filteredTasks);

  const pendingInspections = filteredInspections.filter((i) => i.stage < 3).length;
  const delayedMaterials = filteredMaterials.filter((m) => m.status?.includes('Delay')).length;
  const activeLifts = filteredLifts.filter((l) => l.status === 'ACTIVE').length;

  const dynamicNavGroups = [
    {
      group: 'Executive & Planning',
      items: [
        { id: 'dashboard', label: 'PM Command Center', badge: null },
        { id: 'calendar', label: 'Site Planning & Lookahead', badge: null },
        { id: 'reports', label: 'Site Progress & Analytics', badge: null },
      ],
    },
    {
      group: 'Site Execution & QA/QC',
      items: [
        { id: 'inspections', label: 'RE/RTO Inspections (RFI)', badge: pendingInspections > 0 ? `${pendingInspections} Pending` : null, alert: pendingInspections > 0 ? 'warning' : null },
        { id: 'materials', label: 'Materials, BBS & DOs', badge: delayedMaterials > 0 ? `${delayedMaterials} Delayed` : null, alert: delayedMaterials > 0 ? 'danger' : null },
        { id: 'diary', label: 'Site Diary', badge: null },
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
        ...(isAdmin ? [{ id: 'monitoring', label: 'Admin Control Panel', badge: null }] : []),
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
            const ref = doc(db, 'projects', newProject.id);
            await runTransaction(db, async transaction => {
              if ((await transaction.get(ref)).exists()) throw new Error('That project reference already exists.');
              transaction.set(ref, { ...newProject, ownerId: user.uid, createdBy: user.email, createdAt: new Date().toISOString() });
            });
          } catch (e) {
            throw new Error(e.message || 'Could not create project.');
          }
        }}
        onDelete={async (id) => {
          try {
            if (projects.find(p => p.id === id)?.ownerId !== user.uid) throw new Error('Only the project owner can delete the project.');
            await deleteDoc(doc(db, 'projects', id));
          } catch (e) {
            setOperationError(e.message);
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
              Active Project / Zone
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
            <span>Incident-free since:</span>
            <span className="font-mono font-bold text-slate-300">{observationValue(observation, 'incidentFreeSince')}</span>
          </div>
          <div className="flex justify-between">
            <span>Last noise reading:</span>
            <span className="font-mono text-slate-300">{observationValue(observation, 'noise', 'dB(A)')}</span>
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
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Weather: {observationValue(observation, 'weather')}{observation ? ` · ${observation.observedAt.replace('T', ' ')}` : ''}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => { setSelectedProject(null); setSelectedZone('All Zones'); setActiveTab('dashboard'); setOperationError(''); }} className="text-xs text-slate-500">Projects</button>
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
            title="Recorded plan progress"
            value={progress.actual === null ? 'Not recorded' : `${progress.actual.toFixed(1)}%`}
            sub={`${filteredTasks.length} activities · ${filteredTasks.filter(t => t.status === 'Blocked').length} blocked`}
            status="neutral"
            onClick={() => setActiveTab('calendar')}
          />
          <KpiPill
            title="RE / RTO Inspections"
            value={`${filteredInspections.filter(i => i.stage === 3).length} Cleared`}
            sub={`${filteredInspections.filter(i => i.stage < 3).length} Awaiting Sign-off`}
            status={filteredInspections.length && filteredInspections.every(i => i.stage === 3) ? 'success' : 'neutral'}
            onClick={() => setActiveTab('inspections')}
          />
          <KpiPill
            title="Active Lifting / PTWs"
            value={`${filteredLifts.filter(l => l.status === 'ACTIVE').length} Permits`}
            sub={`${filteredLifts.length} permits recorded`}
            status={!filteredLifts.length ? 'neutral' : filteredLifts.some(l => l.status !== 'ACTIVE') ? 'warning' : 'success'}
            onClick={() => setActiveTab('lifting')}
          />
          <KpiPill
            title="Rebar (BBS) & Concrete"
            value={`${filteredMaterials.length} Records`}
            sub={`${filteredMaterials.filter(m => m.status?.includes('Delay')).length} Material Records Delayed`}
            status={filteredMaterials.some(m => m.status?.includes('Delay')) ? 'danger' : 'neutral'}
            onClick={() => setActiveTab('materials')}
          />
          <KpiPill
            title="Site Personnel"
            value={`${personnel.length} registered`}
            sub={`Main: ${personnel.filter(p => p.category === 'Main Contractor').length} | Subcon: ${personnel.filter(p => p.category?.includes('Subcontractor')).length}`}
            status="neutral"
            onClick={() => setActiveTab('users')}
          />
        </section>

        {/* Active View Container */}
        <main key={selectedProject.id} className="flex-1 p-4 lg:p-8 pb-24 md:pb-8 overflow-y-auto">
          {(operationError || Object.values(records).some(r => r.error)) && <div role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{operationError || Object.values(records).find(r => r.error)?.error}<button onClick={() => setOperationError('')} className="ml-3 underline">Dismiss</button></div>}
          {user && !user.emailVerified && liveProject?.ownerId !== user.uid && <p className="mb-4 text-sm text-amber-700">Verify your email to use assigned project access. <button className="underline" onClick={async () => { try { await sendEmailVerification(user); setOperationError('Verification email sent. Follow its link, then sign in again.'); } catch (e) { setOperationError(e.message); } }}>Send verification email</button></p>}
          {!currentUser && <p className="mb-4 text-sm text-slate-500">Project records require an admin-assigned role for your verified sign-in email.</p>}
          {activeTab === 'dashboard' && (
            <PMCommandDashboard
              onNavigate={setActiveTab}
              inspections={filteredInspections}
              lifts={filteredLifts}
              materials={filteredMaterials}
            />
          )}
          {activeTab === 'calendar' && <CalendarView key={selectedProject.id} tasks={filteredTasks} allTasks={tasks} timeline={{ tasks: filteredTasks, inspections: filteredInspections, materials: filteredMaterials, diary: filteredWeatherLogs, lifts: filteredLifts }} inspections={inspections} materials={materials} diary={filteredWeatherLogs} lifts={filteredLifts} onAdd={(t) => addRecord('tasks', t)} onUpdate={(id, t) => updateRecord('tasks', id, t)} currentUser={currentUser} zones={zones} />}
          {activeTab === 'inspections' && (
            <InspectionsView
              inspections={filteredInspections}
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
              observation={observation}
              onAdd={(t) => addRecord('lifts', t)}
              onUpdate={(id, t) => updateRecord('lifts', id, t)}
              currentUser={currentUser}
              zones={zones}
            />
          )}
          {activeTab === 'materials' && (
            <MaterialsView
              materials={filteredMaterials}
              tasks={tasks}
              onAdd={(t) => addRecord('materials', t)}
              onUpdate={(id, t) => updateRecord('materials', id, t)}
              currentUser={currentUser}
              zones={zones}
            />
          )}
          {activeTab === 'diary' && (
            <SiteDiaryView
              weatherLogs={filteredWeatherLogs}
              tasks={tasks}
              observation={observation}
              onAddWeatherLog={(l) => addRecord('weatherLogs', l)}
              onUpdate={(id, t) => updateRecord('weatherLogs', id, t)}
              currentUser={currentUser}
              zones={zones}
            />
          )}
          {activeTab === 'reports' && (
            <ReportView tasks={filteredTasks} inspections={filteredInspections} materials={filteredMaterials} diary={filteredWeatherLogs} lifts={filteredLifts} />
          )}
          {activeTab === 'monitoring' && isAdmin && <MonitoringView key={selectedProject.id} observations={observations} currentUser={currentUser} onAdd={record => addRecord('monitoring', record)} />}
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
          <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin} />
        </div>
      </div>

      {/* Executive Summary / Print Modal */}
      {isExecModalOpen && (
        <ExecutiveReportModal
          onClose={() => setIsExecModalOpen(false)}
          tasks={filteredTasks}
          inspections={filteredInspections}
          projectName={liveProject?.name}
          lifts={filteredLifts}
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

function PMCommandDashboard({ onNavigate, inspections, lifts, materials }) {
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

        {/* Column 3: Site Material & Supply Chain Pulse */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Material Readiness & BBS Logistics
            </h2>
            <button
              onClick={() => onNavigate('materials')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              BBS & DO Log →
            </button>
          </div>
          <div className="space-y-3 text-sm flex-1">
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600">Delayed Materials / BBS:</span>
              <span className="font-mono font-bold text-red-600">
                {materials.filter((m) => m.status?.includes('Delay')).length} Item(s)
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-slate-100 mt-2">
              <span className="text-slate-600">Received material records:</span>
              <span className="font-mono font-bold text-blue-700">
                {materials.filter(r => ['Received', 'Installed', 'Poured'].includes(r.status)).length} / {materials.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
