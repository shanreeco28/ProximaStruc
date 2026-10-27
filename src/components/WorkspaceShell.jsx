import React from 'react';
import { CalendarRange, ClipboardCheck, LayoutDashboard, Layers, NotebookPen, Package, Settings2, ShieldCheck, Users } from 'lucide-react';
import AppLogo from './AppLogo';
import AccountControls from './AccountControls';
import MobileNav from './MobileNav';
import { observationValue } from '../utils/monitoring';

const ICONS = { dashboard: LayoutDashboard, calendar: CalendarRange, inspections: ClipboardCheck, materials: Package, diary: NotebookPen, lifting: ShieldCheck, users: Users, monitoring: Settings2 };
export default function WorkspaceShell({ project, navGroups, activeTab, onNavigate, zones, selectedZone, onZoneChange, onAddZone, canAddZone, observation, user, profile, isAdmin, onSaveProfile, onLogout, onProjects, onExecutiveBrief, metrics, children }) {
  const pageTitle = navGroups.flatMap(group => group.items).find(item => item.id === activeTab)?.label || 'Project workspace';
  return <div className="app-shell min-h-screen md:h-dvh md:overflow-hidden bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans antialiased">
    <a href="#main-content" className="skip-link">Skip to project content</a>
    <aside className="project-sidebar hidden md:flex md:w-72 shrink-0 flex-col bg-slate-900 text-slate-100" aria-label="Project sidebar">
      <div className="px-6 py-6 border-b border-slate-700/60"><div className="flex items-center gap-3"><AppLogo className="w-9 h-9" /><div><span className="text-lg font-bold tracking-tight text-white">PROXIMA<span className="text-blue-300">STRUC</span></span><p className="text-xs text-slate-300 mt-0.5">Site delivery workspace</p></div></div></div>
      <div className="p-5 border-b border-slate-700/60"><div className="flex items-center justify-between gap-2 mb-2"><label htmlFor="project-zone" className="flex items-center gap-2 text-xs font-semibold text-slate-200"><Layers size={15} aria-hidden="true" />Project zone</label>{canAddZone && <button aria-label="Add project zone" title="Add project zone" onClick={onAddZone} className="rounded-lg px-3 text-blue-200 hover:bg-slate-800">+</button>}</div><select id="project-zone" value={selectedZone} onChange={event=>onZoneChange(event.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white"><option value="All Zones">All Zones</option>{zones.map(zone=><option key={zone.id} value={zone.name}>{zone.name}</option>)}</select></div>
      <nav className="flex-1 min-h-0 overflow-y-auto p-3 space-y-6" aria-label="Main Project Navigation">{navGroups.map(group=><div key={group.group}><p className="px-3 mb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-300">{group.group}</p><ul className="space-y-1">{group.items.map(item=>{
        const Icon = ICONS[item.id] || Layers;
        return <li key={item.id}><button aria-current={activeTab===item.id?'page':undefined} onClick={()=>onNavigate(item.id)} className={`project-nav-item w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab===item.id?'bg-blue-600 text-white shadow-sm':'text-slate-200 hover:bg-slate-800 hover:text-white'}`}><Icon size={18} aria-hidden="true" className="shrink-0"/><span className="text-left flex-1">{item.label}</span>{item.badge && <span data-tone={item.alert} className="nav-count rounded-md px-2 py-1 text-[11px] font-semibold">{item.badge}</span>}</button></li>;
      })}</ul></div>)}</nav>
      <div className="p-5 border-t border-slate-700/60 text-xs text-slate-300 space-y-2"><p className="flex justify-between gap-2"><span>Incident-free since</span><span className="font-semibold">{observationValue(observation,'incidentFreeSince')}</span></p><p className="flex justify-between gap-2"><span>Last noise reading</span><span className="font-semibold">{observationValue(observation,'noise','dB(A)')}</span></p></div>
    </aside>
    <div className="flex-1 flex flex-col min-w-0 md:min-h-0">
      <header className="workspace-header bg-white border-b border-slate-200 px-4 lg:px-8 py-4 flex items-center justify-between gap-3 shrink-0">
        <div className="min-w-0 flex-1"><p className="text-xs text-slate-600 truncate mb-1">{project?.name || 'Project workspace'} <span aria-hidden="true">/</span> {selectedZone}</p><h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">{pageTitle}</h1></div>
        <div className="hidden xl:block text-xs text-slate-600 max-w-64 mr-3"><p className="font-semibold">Weather: {observationValue(observation,'weather')}</p>{observation && <p>Observed {observation.observedAt.replace('T',' ')}</p>}</div>
        <AccountControls user={user} profile={profile} projectName={project?.name} onSaveProfile={onSaveProfile} onLogout={onLogout} onProjects={onProjects} onExecutiveBrief={onExecutiveBrief}/>
      </header>
      <section aria-label="Key Project Metrics" tabIndex={0} title="Project metrics; scroll horizontally on small screens to view all metrics" className="metrics-ribbon bg-white border-b border-slate-200 px-4 lg:px-8 py-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 shrink-0">{metrics}</section>
      <main id="main-content" tabIndex={-1} key={project?.id} className="workspace-content flex-1 min-h-0 min-w-0 p-4 lg:p-8 pb-28 md:pb-8 overflow-y-auto">{children}</main>
      <div className="md:hidden"><MobileNav activeTab={activeTab} setActiveTab={onNavigate} isAdmin={isAdmin}/></div>
    </div>
  </div>;
}
