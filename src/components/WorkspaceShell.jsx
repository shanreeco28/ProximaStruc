import React, { useState } from 'react';
import { Layers, PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react';
import AppLogo from './AppLogo';
import ConstructionIcon from './ConstructionIcon';
import AccountControls from './AccountControls';
import FloatingThemeControl from './FloatingThemeControl';
import MobileNav from './MobileNav';
import { observationValue } from '../utils/monitoring';

export default function WorkspaceShell({ project, navGroups, activeTab, onNavigate, zones, selectedZone, onZoneChange, onAddZone, canAddZone, observation, user, profile, isAdmin, onSaveProfile, onLogout, onProjects, onExecutiveBrief, metrics, children }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('proxima-sidebar-collapsed') === 'true'; } catch { return false; }
  });
  const pageTitle = navGroups.flatMap(group => group.items).find(item => item.id === activeTab)?.label || 'Project workspace';
  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('proxima-sidebar-collapsed', String(next)); } catch { /* Keep the current session usable. */ }
  };
  const zoneOptions = <><option value="All Zones">All Zones</option>{zones.map(zone => <option key={zone.id} value={zone.name}>{zone.name}</option>)}</>;
  return <div className={`app-shell min-h-screen md:h-dvh md:overflow-hidden flex flex-col md:flex-row font-sans antialiased ${collapsed ? 'sidebar-collapsed' : ''}`}>
    <a href="#main-content" className="skip-link">Skip to project content</a>
    <aside id="project-sidebar" className="project-sidebar hidden md:flex shrink-0 flex-col" aria-label="Project sidebar">
      <div className="sidebar-brand flex items-center gap-3">
        <AppLogo className="w-10 h-10 shrink-0" />
        {!collapsed && <div><span className="text-base font-bold tracking-tight">PROXIMA<span className="text-blue-600">STRUC</span></span><p className="text-xs text-slate-500 mt-0.5">Construction workspace</p></div>}
      </div>
      <div className={`sidebar-tools flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Workspace</span>}
        <button type="button" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed} aria-controls="project-navigation" onClick={toggleSidebar} className="sidebar-toggle flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100">
          {collapsed ? <PanelLeftOpen size={19} aria-hidden="true" /> : <PanelLeftClose size={19} aria-hidden="true" />}
        </button>
      </div>
      {!collapsed && <div className="sidebar-zone">
        <div className="flex items-center justify-between gap-2 mb-2"><label htmlFor="project-zone" className="flex items-center gap-2 text-xs font-semibold text-slate-600"><Layers size={15} aria-hidden="true" />Project zone</label>{canAddZone && <button type="button" aria-label="Add project zone" title="Add project zone" onClick={onAddZone} className="w-10 rounded-lg text-blue-700 hover:bg-slate-100 flex items-center justify-center"><Plus size={16} aria-hidden="true" /></button>}</div>
        <select id="project-zone" value={selectedZone} onChange={event => onZoneChange(event.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm">{zoneOptions}</select>
      </div>}
      <nav id="project-navigation" className="flex-1 min-h-0 overflow-y-auto p-3 space-y-6" aria-label="Main Project Navigation">{navGroups.map(group => <div key={group.group}>
        {!collapsed && <p className="nav-group-label px-3 mb-2 text-[10px] font-semibold tracking-widest uppercase text-slate-500">{group.group}</p>}
        <ul className="space-y-1">{group.items.map(item => <li key={item.id}>
          <button type="button" aria-current={activeTab === item.id ? 'page' : undefined} aria-label={collapsed ? `${item.label}${item.badge ? `, ${item.badge}` : ''}` : undefined} title={collapsed ? `${item.label}${item.badge ? ` · ${item.badge}` : ''}` : undefined} onClick={() => onNavigate(item.id)} className="project-nav-item w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors">
            <ConstructionIcon name={item.id} size={20} className="shrink-0" />
            {!collapsed && <><span className="text-left flex-1">{item.label}</span>{item.badge && <span data-tone={item.alert} className="nav-count rounded-md px-1.5 py-1 text-[10px] font-semibold">{item.badge}</span>}</>}
          </button>
        </li>)}</ul>
      </div>)}</nav>
      {!collapsed && <div className="sidebar-observations text-xs text-slate-500 space-y-2"><p className="flex justify-between gap-2"><span>Incident-free since</span><span className="font-medium">{observationValue(observation, 'incidentFreeSince')}</span></p><p className="flex justify-between gap-2"><span>Last noise reading</span><span className="font-medium">{observationValue(observation, 'noise', 'dB(A)')}</span></p></div>}
    </aside>
    <div className="flex-1 flex flex-col min-w-0 md:min-h-0">
      <header className="workspace-header px-4 lg:px-8 py-4 flex items-center justify-between gap-3 shrink-0">
        <div className="min-w-0 flex-1"><p className="text-xs text-slate-500 truncate mb-1">{project?.name || 'Project workspace'} <span aria-hidden="true" className="mx-1">/</span> {selectedZone}</p><h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">{pageTitle}</h1></div>
        <div className="hidden xl:block text-xs text-slate-600 max-w-64 mr-3"><p>Weather: {observationValue(observation, 'weather')}</p>{observation && <p className="text-slate-500 mt-1">Observed {observation.observedAt.replace('T', ' ')}</p>}</div>
        <AccountControls user={user} profile={profile} projectName={project?.name} onSaveProfile={onSaveProfile} onLogout={onLogout} onProjects={onProjects} onExecutiveBrief={onExecutiveBrief} />
      </header>
      <div role="region" aria-label="Project zone selection" className={`compact-zone-controls px-4 lg:px-8 py-2 border-b border-slate-200 items-center gap-3 ${collapsed ? 'flex' : 'flex md:hidden'}`}>
        <label htmlFor="compact-project-zone" className="text-xs font-semibold text-slate-600 shrink-0">Project zone</label>
        <select id="compact-project-zone" value={selectedZone} onChange={event => onZoneChange(event.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm min-w-0 flex-1 max-w-64">{zoneOptions}</select>
        {canAddZone && <button type="button" aria-label="Add project zone" onClick={onAddZone} className="w-10 rounded-lg flex items-center justify-center text-blue-700 hover:bg-slate-100"><Plus size={16} aria-hidden="true" /></button>}
      </div>
      <section aria-label="Key Project Metrics" tabIndex={0} title="Project metrics; scroll horizontally on small screens to view all metrics" className="metrics-ribbon px-4 lg:px-8 py-5 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 shrink-0">{metrics}</section>
      <main id="main-content" tabIndex={-1} key={project?.id} className="workspace-content flex-1 min-h-0 min-w-0 px-4 lg:px-8 pt-2 pb-28 md:pb-8 overflow-y-auto">{children}</main>
      <div className="md:hidden"><MobileNav activeTab={activeTab} setActiveTab={onNavigate} isAdmin={isAdmin} /></div>
    </div>
    <FloatingThemeControl />
  </div>;
}
