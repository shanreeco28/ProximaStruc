// Isolated component fixture; never imported by the production app or connected to Firebase.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import CalendarView from '../../src/components/CalendarView';
import MaterialsView from '../../src/components/MaterialsView';
import SiteDiaryView from '../../src/components/SiteDiaryView';
import MonitoringView from '../../src/components/MonitoringView';
import InspectionsView from '../../src/components/InspectionsView';
import UserManagementView from '../../src/components/UserManagementView';
import MobileNav from '../../src/components/MobileNav';
import '../../src/index.css';

export default function Harness() {
  const query = new URLSearchParams(window.location.search);
  const role = query.get('role') || 'admin';
  const [view, setView] = useState(query.get('view') || 'calendar');
  const [data, setData] = useState(() => ({
    tasks: query.get('legacy') ? [{ id: 'legacy', activity: 'Existing sprint task', status: 'in_progress', zone: 'East' }] : [],
    materials: [], diary: [], observations: [],
    inspections: [{ id: 'TEST-RFI', element: 'Test slab', discipline: 'Structural', zone: 'East', createdBy: 'fixture@example.test', stage: Number(query.get('stage') || 0), comments: [], history: [] }],
    users: [{id:'person@example.test',email:'person@example.test',name:'Test member',systemRole:'guest',organization:'Original organisation'}],
  }));
  const currentUser = { email: 'fixture@example.test', systemRole: role };
  const add = key => async value => {
    if (query.get('fail')) throw new Error('Test write rejected');
    setData(prev => ({...prev, [key]: [...prev[key], {...value, id:crypto.randomUUID(), createdBy:currentUser.email}]}));
  };
  const update = key => async (id, value) => {
    if (query.get('fail')) throw new Error('Test write rejected');
    setData(prev => ({...prev,[key]:prev[key].map(r=>r.id === id ? {...r,...value} : r)}));
  };
  const common = { currentUser, zones:[{id:'east',name:'East'}], tasks:data.tasks };
  return <main className="p-5 pb-24 bg-slate-50 min-h-screen">
    {view === 'calendar' && <CalendarView {...common} onAdd={add('tasks')} onUpdate={update('tasks')} materials={data.materials} diary={data.diary} inspections={data.inspections} />}
    {view === 'materials' && <MaterialsView {...common} materials={data.materials} onAdd={add('materials')} onUpdate={update('materials')} />}
    {view === 'diary' && <SiteDiaryView {...common} weatherLogs={data.diary} onAddWeatherLog={add('diary')} onUpdate={update('diary')} />}
    {view === 'monitoring' && <MonitoringView {...common} observations={data.observations} onAdd={add('observations')} />}
    {view === 'inspections' && <InspectionsView {...common} inspections={data.inspections} onAdd={add('inspections')} onUpdate={update('inspections')}
      onAdvance={async (id, stage) => update('inspections')(id, {stage:stage + 1,history:[{user:currentUser.email,role,action:'Advanced inspection',timestamp:new Date().toISOString()}]})}
      onComment={async (id, text) => update('inspections')(id,{comments:[{user:currentUser.email,role,text,timestamp:new Date().toISOString()}]})}
      onDelete={async id => { if(query.get('fail')) throw new Error('Test write rejected');setData(prev=>({...prev,inspections:prev.inspections.filter(r=>r.id!==id)})); }} />}
    {view === 'users' && <UserManagementView currentUser={currentUser} users={data.users} onAddPersonnel={add('users')} onUpdatePersonnelRole={(id,systemRole)=>update('users')(id,{systemRole})} onUpdatePersonnelOrganization={(id,organization)=>update('users')(id,{organization})} />}
    <MobileNav activeTab={view} setActiveTab={setView} isAdmin={role === 'admin'} />
  </main>;
}
createRoot(document.getElementById('root')).render(<Harness />);
