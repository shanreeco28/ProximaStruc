import React, { useState } from 'react';
import { Layers, PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react';
import AppLogo from './AppLogo';
import ConstructionIcon from './ConstructionIcon';
import AccountControls from './AccountControls';
import FloatingThemeControl from './FloatingThemeControl';
import MobileNav from './MobileNav';
import { observationValue } from '../utils/monitoring';
import { sheetCode, sheetFor } from '../utils/sheets';
import { today } from '../utils/siteData';

export default function WorkspaceShell({ project, navGroups, activeTab, onNavigate, zones, selectedZone, onZoneChange, onAddZone, canAddZone, observation, user, profile, isAdmin, onSaveProfile, onLogout, onProjects, onExecutiveBrief, metrics, children }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('proxima-sidebar-collapsed') === 'true'; } catch { return false; }
  });
  const pageTitle = navGroups.flatMap(group => group.items).find(item => item.id === activeTab)?.label || 'Project workspace';
  const sheet = sheetFor(activeTab);
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
        {!collapsed && <div className="min-w-0"><span className="sidebar-wordmark">PROXIMA<span>STRUC</span></span><p className="sidebar-tagline">Project control · Construction</p></div>}
      </div>

      <div className={`sidebar-tools flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && <span className="sidebar-section-label text-[10.5px] font-semibold uppercase">Sheet register</span>}
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
        {!collapsed && <p className="nav-group-label px-1 mb-1.5 text-[10px] font-semibold tracking-widest uppercase">{group.group}</p>}
        <ul className="space-y-px">{group.items.map(item => <li key={item.id}>
          <button type="button" aria-current={activeTab === item.id ? 'page' : undefined} aria-label={collapsed ? `${item.label}${item.badge ? `, ${item.badge}` : ''}` : undefined} title={collapsed ? `${sheetCode(item.id)} · ${item.label}${item.badge ? ` · ${item.badge}` : ''}` : undefined} onClick={() => onNavigate(item.id)} className="project-nav-item w-full flex items-center gap-2 px-2.5 py-2 text-[13.5px] font-medium">
            {collapsed ? <ConstructionIcon name={item.id} size={18} className="shrink-0" />
              : <><span className="nav-code" aria-hidden="true">{sheetCode(item.id)}</span><span className="text-left flex-1">{item.label}</span>{item.badge && <span data-tone={item.alert} className="nav-count">{item.badge}</span>}</>}
          </button>
        </li>)}</ul>
      </div>)}</nav>

      {!collapsed && <div className="sidebar-observations text-xs space-y-2">
        <p className="sidebar-section-label text-[10px] font-semibold uppercase">Latest site record</p>
        <p className="flex justify-between gap-2"><span>Incident-free since</span><span className="obs-value">{observationValue(observation, 'incidentFreeSince')}</span></p>
        <p className="flex justify-between gap-2"><span>Last noise reading</span><span className="obs-value">{observationValue(observation, 'noise', 'dB(A)')}</span></p>
        <p className="pt-2 text-[10.5px] leading-snug">Practice areas: ISO 21502 terms · Information: ISO 19650 naming</p>
      </div>}
    </aside>

    <div className="flex-1 flex flex-col min-w-0 md:min-h-0">
      <header className="workspace-header flex items-stretch shrink-0">
        <div className="tb-cell tb-code flex flex-col"><span className="tb-label">Sheet</span><span className="tb-code-value">{sheet.code}</span></div>
        <div className="flex-1 min-w-0 flex flex-col justify-center px-4 lg:px-6 py-2">
          <p className="tb-area">{sheet.area}</p>
          <h1 className="page-title text-lg leading-tight sm:text-xl 2xl:text-2xl line-clamp-2">{pageTitle}</h1>
        </div>
        <div className="tb-cell hidden lg:flex flex-col max-w-[220px]"><span className="tb-label">Project</span><span className="tb-value" title={project?.name}>{project?.name || 'Project workspace'}</span></div>
        <div className="tb-cell hidden lg:flex flex-col max-w-[180px]"><span className="tb-label">Zone</span><span className="tb-value">{selectedZone}</span></div>
        <div className="tb-cell hidden 2xl:flex flex-col max-w-[220px]" title={observation ? `Observed ${observation.observedAt.replace('T', ' ')}` : undefined}><span className="tb-label">Weather · last record</span><span className="tb-value">{observationValue(observation, 'weather')}</span></div>
        <div className="tb-cell hidden min-[1800px]:flex flex-col"><span className="tb-label">Date</span><span className="tb-value font-mono">{today()}</span></div>
        <div className="tb-cell flex items-center pl-2 pr-3 sm:pl-3 sm:pr-4">
          <AccountControls user={user} profile={profile} projectName={project?.name} onSaveProfile={onSaveProfile} onLogout={onLogout} onProjects={onProjects} onExecutiveBrief={onExecutiveBrief} />
        </div>
      </header>

      <div role="region" aria-label="Project zone selection" className={`compact-zone-controls px-4 lg:px-8 py-2 border-b items-center gap-3 ${collapsed ? 'flex' : 'flex md:hidden'}`}>
        <label htmlFor="compact-project-zone" className="field-label shrink-0 flex items-center gap-2"><Layers size={14} aria-hidden="true" />Project zone</label>
        <select id="compact-project-zone" value={selectedZone} onChange={event => onZoneChange(event.target.value)} className="field-control !mt-0 min-w-0 flex-1 max-w-64 !py-1.5">{zoneOptions}</select>
        {canAddZone && <button type="button" aria-label="Add project zone" onClick={onAddZone} className="btn btn-ghost btn-icon"><Plus size={16} aria-hidden="true" /></button>}
      </div>

      <div className="workspace-scroll survey-grid flex-1 min-h-0 min-w-0 md:overflow-y-auto">
        <div className="workspace-inner px-4 lg:px-8 pt-5 lg:pt-6 pb-28 md:pb-10">
          <section aria-label="Key Project Metrics" tabIndex={0} title="Project metrics; scroll horizontally on small screens to view all metrics" className="metrics-ribbon">{metrics}</section>
          <main id="main-content" tabIndex={-1} key={project?.id} className="workspace-content mt-6 min-w-0">{children}</main>
        </div>
      </div>

      <div className="md:hidden"><MobileNav activeTab={activeTab} setActiveTab={onNavigate} isAdmin={isAdmin} /></div>
    </div>
    <FloatingThemeControl />
  </div>;
}
