// Isolated component fixture; never imported by the production app or connected to Firebase.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import CalendarView from '../../src/components/CalendarView';
import MaterialsView from '../../src/components/MaterialsView';
import SiteDiaryView from '../../src/components/SiteDiaryView';
import MonitoringView from '../../src/components/MonitoringView';
import ReportView from '../../src/components/ReportView';
import MobileNav from '../../src/components/MobileNav';
import '../../src/index.css';

export default function Harness() {
  const query = new URLSearchParams(window.location.search);
  const role = query.get('role') || 'admin';
  const [view, setView] = useState(query.get('view') || 'calendar');
  const [data, setData] = useState({ tasks: [], materials: [], diary: [], observations: [] });
  const currentUser = { email: 'fixture@example.test', systemRole: role };
  const add = key => async value => {
    if (query.get('fail')) throw new Error('Test write rejected');
    setData(prev => ({...prev, [key]: [...prev[key], {...value, id:crypto.randomUUID(), createdBy:currentUser.email}]}));
  };
  const update = key => async (id, value) => {
    if (query.get('fail')) throw new Error('Test write rejected');
    setData(prev => ({...prev,[key]:prev[key].map(r=>r.id === id ? {...r,...value} : r)}));
  };
  const common = { currentUser, zones:[{id:'east',name:'East'}],tasks:data.tasks };
  return <main className="p-5 pb-24 bg-slate-50 min-h-screen">
    {view === 'calendar' && <CalendarView {...common} onAdd={add('tasks')} onUpdate={update('tasks')} materials={data.materials} diary={data.diary} />}
    {view === 'materials' && <MaterialsView {...common} materials={data.materials} onAdd={add('materials')} onUpdate={update('materials')} />}
    {view === 'diary' && <SiteDiaryView {...common} weatherLogs={data.diary} onAddWeatherLog={add('diary')} onUpdate={update('diary')} observation={data.observations.at(-1)} />}
    {view === 'monitoring' && <MonitoringView {...common} observations={data.observations} onAdd={add('observations')} />}
    {view === 'reports' && <ReportView tasks={data.tasks} materials={data.materials} diary={data.diary} />}
    <MobileNav activeTab={view} setActiveTab={setView} isAdmin={role === 'admin'} />
  </main>;
}
createRoot(document.getElementById('root')).render(<Harness />);
