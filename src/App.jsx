import React, { useState, useEffect } from 'react';
// Existing Component Imports from your repository structure
import WorkspaceShell from './components/WorkspaceShell';
import PMCommandDashboard from './components/PMCommandDashboard';
import { RecordDeletionContext } from './contexts/RecordDeletionContext';
import DeletionReviewPanel from './components/DeletionReviewPanel';
import { submitRecordDeletion, reviewRecordDeletion } from './services/recordDeletion';
import { isDeletionReviewer } from './utils/deletions';
import { saveOwnProjectProfile } from './services/personalProfile';
import CalendarView from './components/CalendarView';
import InspectionsView from './components/InspectionsView';
import LiftingView from './components/LiftingView';
import MaterialsView from './components/MaterialsView';
import SiteDiaryView from './components/SiteDiaryView';
import UserManagementView from './components/UserManagementView';
import ExecutiveReportModal from './components/ExecutiveReportModal';
import MonitoringView from './components/MonitoringView';
import useProjectRecords from './hooks/useProjectRecords';
import useSelfRegistration from './hooks/useSelfRegistration';
import { canPlan, canWrite, latestObservation, projectProgress, ROLES, canAdvanceInspection, canEditInspection, canCommentInspection, isInspectionClosed, INSPECTION_STAGES, taskStatus } from './utils/siteData';

import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, sendEmailVerification, updateProfile } from 'firebase/auth';
import { collection, onSnapshot, doc, updateDoc, runTransaction, arrayUnion } from 'firebase/firestore';
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
  const [deletionStatus, setDeletionStatus] = useState('');
  const liveProject = projects.find(p => p.id === selectedProject?.id);
  const registration = useSelfRegistration(user, liveProject?.id, liveProject?.ownerId);
  const records = useProjectRecords(registration.ready ? selectedProject?.id : null, user?.uid);
  const inspections = records.inspections.items;
  const lifts = records.lifts.items;
  const materials = records.materials.items;
  const weatherLogs = records.weatherLogs.items;
  const personnel = records.users.items;
  const tasks = records.tasks.items;
  const zones = records.zones.items;
  const observations = records.monitoring.items;
  const deletionRequests = records.deletionRequests.items;
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

  const ownProfile = personnel.find(p => p.id === user?.email?.toLowerCase());
  const currentUser = liveProject?.ownerId === user?.uid
    ? { email: user?.email, name: ownProfile?.name || user?.displayName || user?.email, systemRole: 'admin' }
    : user?.emailVerified ? (personnel.find(p => p.id === user.email?.toLowerCase()) || personnel.find(p => p.email?.toLowerCase() === user.email?.toLowerCase())) : undefined;
  const isPrivileged = canPlan(currentUser);
  const isAdmin = currentUser?.systemRole === 'admin';

  const handleSaveProfile = async values => {
    const updates = await saveOwnProjectProfile(db, user, selectedProject.id, values);
    try { await updateProfile(user, { displayName: updates.name }); }
    catch { throw new Error('Your project profile was saved, but your account name could not be updated. Retry to finish saving.'); }
  };
  const handleLogout = async () => {
    await signOut(auth);
    setSelectedProject(null); setSelectedZone('All Zones'); setActiveTab('dashboard');
    setIsExecModalOpen(false); setOperationError('');
    localStorage.removeItem('sb-selected-project');
    localStorage.removeItem('temp_user_data');
  };

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
    if (collectionName === 'inspections' && !canEditInspection(currentUser, inspections.find(r => r.id === id))) throw new Error('Only the creator or an admin can edit this inspection.');
    if (collectionName === 'inspections' && ['stage', 'comments', 'history'].some(key => key in updates)) throw new Error('Use the inspection workflow to change its stage or discussion.');
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
  const handleUpdatePersonnelOrganization = async (id, organization) => {
    if (!['admin', 'manager'].includes(currentUser?.systemRole)) throw new Error('Only admins and managers can edit organisations.');
    await updateDoc(doc(db, `artifacts/${selectedProject.id}/users`, id), {
      organization: organization.trim(), updatedBy: user.email, updatedAt: new Date().toISOString()
    });
  };
  const handleAdvanceInspection = async (id, expectedStage) => {
    const ref = doc(db, `artifacts/${selectedProject.id}/inspections`, id);
    await runTransaction(db, async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error('This inspection no longer exists.');
      const inspection = snapshot.data();
      if (inspection.stage !== expectedStage) throw new Error('The inspection changed. Review its current stage and retry.');
      if (!canAdvanceInspection(currentUser, inspection)) throw new Error('Your role cannot advance this inspection stage.');
      const timestamp = new Date().toISOString();
      transaction.update(ref, {
        stage: inspection.stage + 1,
        history: [...(inspection.history || []), { action: `Advanced to ${INSPECTION_STAGES[inspection.stage + 1]}`, user: currentUser.name || user.email, email: user.email, role: currentUser.systemRole, timestamp }],
        updatedBy: user.email, updatedAt: timestamp
      });
    });
  };
  const handleCommentInspection = async (id, text) => {
    if (!canCommentInspection(currentUser) || !text.trim()) throw new Error('Enter a comment using an assigned project account.');
    const timestamp = new Date().toISOString();
    await updateDoc(doc(db, `artifacts/${selectedProject.id}/inspections`, id), {
      comments: arrayUnion({ user: currentUser.name || user.email, email: user.email, role: currentUser.systemRole, text: text.trim(), timestamp }),
      updatedBy: user.email, updatedAt: timestamp
    });
  };
  const handleToggleLift = async (id) => {
    const lift = lifts.find(p => p.id === id);
    if (!lift) return;
    try { await updateRecord('lifts', id, { status: lift.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }); }
    catch (e) { setOperationError(e.message); }
  };
  const progress = projectProgress(filteredTasks);

  const pendingInspections = filteredInspections.filter(i => !isInspectionClosed(i)).length;
  const delayedMaterials = filteredMaterials.filter((m) => m.status?.includes('Delay')).length;
  const activeLifts = filteredLifts.filter((l) => l.status === 'ACTIVE').length;

  const dynamicNavGroups = [
    {
      group: 'Executive & Planning',
      items: [
        { id: 'dashboard', label: 'PM Command Center', badge: null },
        { id: 'calendar', label: 'Site Planning', badge: null },
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
        { id: 'users', label: 'Role & Subcon Matrix', badge: isDeletionReviewer(currentUser) && deletionRequests.some(request => request.status === 'pending') ? `${deletionRequests.filter(request => request.status === 'pending').length} Review` : null },
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
        onDelete={async (id, reason) => {
          if (projects.find(project => project.id === id)?.ownerId !== user.uid) throw new Error('Open the project as an admin to delete it.');
          await submitRecordDeletion(db, id, { uid: user.uid, email: user.email, systemRole: 'admin' }, 'projects', id, reason);
        }}
        onLogout={handleLogout}
      />
    );
  }

  const deletionContext = {
    user: { ...currentUser, uid: user.uid }, requests: deletionRequests,
    records: { tasks, materials, lifts, inspections, weatherLogs, users: personnel, zones, monitoring: observations, projects: liveProject ? [liveProject] : [] },
    submit: async (collection, id, reason) => {
      const status = await submitRecordDeletion(db, selectedProject.id, { ...currentUser, uid: user.uid }, collection, id, reason);
      setDeletionStatus(status === 'pending' ? 'Deletion requested. The record remains available until verification.' : 'Record deleted. Verification history retained.');
      if (collection === 'projects' && status === 'deleted') { setSelectedProject(null); setSelectedZone('All Zones'); setActiveTab('dashboard'); }
      if (collection === 'zones' && status === 'deleted' && zones.find(zone=>zone.id===id)?.name === selectedZone) setSelectedZone('All Zones');
      return status;
    },
    review: async (key, approve, reason) => {
      const request = deletionRequests.find(request=>request.id===key);
      await reviewRecordDeletion(db, selectedProject.id, { ...currentUser, uid: user.uid }, key, approve, reason);
      setDeletionStatus(approve ? 'Deletion verified. The reviewed record was deleted.' : 'Deletion request rejected. The record remains available.');
      if (approve && request?.targetCollection === 'projects') { setSelectedProject(null); setSelectedZone('All Zones'); setActiveTab('dashboard'); }
      if (approve && request?.targetCollection === 'zones' && zones.find(zone=>zone.id===request.targetId)?.name === selectedZone) setSelectedZone('All Zones');
    },
  };
  return (
    <RecordDeletionContext.Provider value={deletionContext}>
    <WorkspaceShell project={liveProject} navGroups={dynamicNavGroups} activeTab={activeTab} onNavigate={setActiveTab}
      zones={zones} selectedZone={selectedZone} onZoneChange={setSelectedZone} onAddZone={handleAddZone} canAddZone={isPrivileged}
      observation={observation} user={user} profile={ownProfile} isAdmin={isAdmin} onSaveProfile={handleSaveProfile} onLogout={handleLogout}
      onProjects={() => { setSelectedProject(null); setSelectedZone('All Zones'); setActiveTab('dashboard'); setOperationError(''); setIsExecModalOpen(false); }}
      onExecutiveBrief={() => setIsExecModalOpen(true)} metrics={<>
          <KpiPill
            title="Recorded plan progress"
            value={progress.actual === null ? 'Not recorded' : `${progress.actual.toFixed(1)}%`}
            sub={`${filteredTasks.length} activities · ${filteredTasks.filter(t => taskStatus(t) === 'blocked').length} blocked`}
            status="neutral"
            onClick={() => setActiveTab('calendar')}
          />
          <KpiPill
            title="RE / RTO Inspections"
            value={`${filteredInspections.filter(i => isInspectionClosed(i)).length} Cleared`}
            sub={`${filteredInspections.filter(i => !isInspectionClosed(i)).length} Awaiting Sign-off`}
            status={filteredInspections.length && filteredInspections.every(i => isInspectionClosed(i)) ? 'success' : 'neutral'}
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
      </>}>
          <p role="status" className="sr-only">{deletionStatus}</p>
          {(operationError || registration.error || Object.values(records).some(r => r.error)) && <div role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{operationError || registration.error || Object.values(records).find(r => r.error)?.error}<button onClick={() => setOperationError('')} className="ml-3 underline">Dismiss</button></div>}
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
              onAdvance={handleAdvanceInspection}
              onComment={handleCommentInspection}
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
          {activeTab === 'monitoring' && isAdmin && <MonitoringView key={selectedProject.id} observations={observations} currentUser={currentUser} onAdd={record => addRecord('monitoring', record)} />}
          {activeTab === 'users' && (
            <div className="space-y-6"><UserManagementView
              users={personnel}
              onAddPersonnel={handleAddPersonnel}
              onUpdatePersonnelRole={handleUpdatePersonnelRole}
              onUpdatePersonnelOrganization={handleUpdatePersonnelOrganization}
              currentUser={currentUser}
            /><DeletionReviewPanel /></div>
          )}
    </WorkspaceShell>
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
    </RecordDeletionContext.Provider>
  );
}

function KpiPill({ title, value, sub, status, onClick }) {
  const statusStyles = {
    success: 'bg-white border-t-2 border-t-emerald-600',
    warning: 'bg-white border-t-2 border-t-amber-600',
    danger: 'bg-white border-t-2 border-t-red-600',
    neutral: 'bg-white',
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
