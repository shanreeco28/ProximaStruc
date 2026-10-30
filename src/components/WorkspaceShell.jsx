import React, { useState } from 'react';
import { ChevronRight, CloudSun, Layers, PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react';
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
        <AppLogo className="w-9 h-9 shrink-0" />
        {!collapsed && <div className="min-w-0"><span className="sidebar-wordmark">PROXIMA<span>STRUC</span></span><p className="sidebar-tagline">Construction workspace</p></div>}
      </div>

      <div className={`sidebar-tools flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && <span className="sidebar-section-label text-[11px] font-semibold uppercase tracking-widest">Workspace</span>}
        <button type="button" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed} aria-controls="project-navigation" onClick={toggleSidebar} className="sidebar-toggle flex items-center justify-center">
          {collapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
        </button>
      </div>

      {!collapsed && <div className="sidebar-zone">
        <div className="flex items-center justify-between gap-2 mb-2">
          <label htmlFor="project-zone" className="flex items-center gap-2 text-xs font-semibold"><Layers size={14} aria-hidden="true" />Project zone</label>
          {canAddZone && <button type="button" aria-label="Add project zone" title="Add project zone" onClick={onAddZone} className="sidebar-icon-button"><Plus size={16} aria-hidden="true" /></button>}
        </div>
        <select id="project-zone" value={selectedZone} onChange={event => onZoneChange(event.target.value)} className="zone-select">{zoneOptions}</select>
      </div>}

      <nav id="project-navigation" className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-5" aria-label="Main Project Navigation">{navGroups.map(group => <div key={group.group}>
        {!collapsed && <p className="nav-group-label px-3 mb-1.5 text-[10.5px] font-semibold tracking-widest uppercase">{group.group}</p>}
        <ul className="space-y-0.5">{group.items.map(item => <li key={item.id}>
          <button type="button" aria-current={activeTab === item.id ? 'page' : undefined} aria-label={collapsed ? `${item.label}${item.badge ? `, ${item.badge}` : ''}` : undefined} title={collapsed ? `${item.label}${item.badge ? ` · ${item.badge}` : ''}` : undefined} onClick={() => onNavigate(item.id)} className="project-nav-item w-full flex items-center gap-3 px-3 py-2 text-[13.5px] font-medium">
            <ConstructionIcon name={item.id} size={18} className="shrink-0" />
            {!collapsed && <><span className="text-left flex-1">{item.label}</span>{item.badge && <span data-tone={item.alert} className="nav-count">{item.badge}</span>}</>}
          </button>
        </li>)}</ul>
      </div>)}</nav>

      {!collapsed && <div className="sidebar-observations text-xs space-y-2">
        <p className="eyebrow sidebar-section-label">Latest site record</p>
        <p className="flex justify-between gap-2"><span>Incident-free since</span><span className="obs-value">{observationValue(observation, 'incidentFreeSince')}</span></p>
        <p className="flex justify-between gap-2"><span>Last noise reading</span><span className="obs-value">{observationValue(observation, 'noise', 'dB(A)')}</span></p>
      </div>}
    </aside>

    <div className="flex-1 flex flex-col min-w-0 md:min-h-0">
      <header className="workspace-header px-4 lg:px-8 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="min-w-0 flex-1 flex items-center gap-3">
          <AppLogo className="w-8 h-8 shrink-0 hidden sm:block md:hidden" />
          <div className="min-w-0">
            <p className="header-breadcrumb mb-0.5"><span className="truncate">{project?.name || 'Project workspace'}</span><ChevronRight size={13} aria-hidden="true" /><span className="truncate">{selectedZone}</span></p>
            <h1 className="page-title text-base leading-snug sm:text-xl line-clamp-2 sm:truncate">{pageTitle}</h1>
          </div>
        </div>
        <div className="hidden xl:flex header-meta mr-1" title={observation ? `Observed ${observation.observedAt.replace('T', ' ')}` : undefined}>
          <CloudSun size={15} aria-hidden="true" />
          <span>Weather: {observationValue(observation, 'weather')}</span>
          {observation && <span className="text-muted">· {observation.observedAt.replace('T', ' ')}</span>}
        </div>
        <AccountControls user={user} profile={profile} projectName={project?.name} onSaveProfile={onSaveProfile} onLogout={onLogout} onProjects={onProjects} onExecutiveBrief={onExecutiveBrief} />
      </header>

      <div role="region" aria-label="Project zone selection" className={`compact-zone-controls px-4 lg:px-8 py-2 border-b items-center gap-3 ${collapsed ? 'flex' : 'flex md:hidden'}`} style={{ borderColor: 'var(--border)' }}>
        <label htmlFor="compact-project-zone" className="field-label shrink-0 flex items-center gap-2"><Layers size={14} aria-hidden="true" />Project zone</label>
        <select id="compact-project-zone" value={selectedZone} onChange={event => onZoneChange(event.target.value)} className="field-control !mt-0 min-w-0 flex-1 max-w-64 !py-1.5">{zoneOptions}</select>
        {canAddZone && <button type="button" aria-label="Add project zone" onClick={onAddZone} className="btn btn-ghost btn-icon"><Plus size={16} aria-hidden="true" /></button>}
      </div>

      <div className="workspace-scroll flex-1 min-h-0 min-w-0 md:overflow-y-auto">
        <div className="workspace-inner px-4 lg:px-8 pt-5 lg:pt-6 pb-28 md:pb-10">
          <section aria-label="Key Project Metrics" tabIndex={0} title="Project metrics; scroll horizontally on small screens to view all metrics" className="metrics-ribbon grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">{metrics}</section>
          <main id="main-content" tabIndex={-1} key={project?.id} className="workspace-content mt-6 min-w-0">{children}</main>
        </div>
      </div>

      <div className="md:hidden"><MobileNav activeTab={activeTab} setActiveTab={onNavigate} isAdmin={isAdmin} /></div>
    </div>
    <FloatingThemeControl />
  </div>;
}
