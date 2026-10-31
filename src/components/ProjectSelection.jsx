import React, { useState } from 'react';
import DeleteRecordAction from './DeleteRecordAction';
import { RecordDeletionContext } from '../contexts/RecordDeletionContext';
import { Plus, LogOut, ArrowRight } from 'lucide-react';
import AppLogo from './AppLogo';
import ConstructionIcon from './ConstructionIcon';
import FloatingThemeControl from './FloatingThemeControl';
import AccountControls from './AccountControls';
import ProjectAccessPanel from './ProjectAccessPanel';

// Only the site owner adds or deletes projects and assigns project access; the rules enforce the same.
const ProjectSelection = ({ projects, onSelect, onAdd, onDelete, onLogout, user, isSiteOwner = false, accessControl }) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setError(''); setSaving(true);
    try {
      await onAdd({ name: newProjectName.trim(), id: crypto.randomUUID() });
      setNewProjectName(''); setIsAdding(false);
    } catch (e) { setError(e.message || 'Could not create project.'); }
    finally { setSaving(false); }
  };

  return (
    <main tabIndex={-1} className="project-selection survey-grid min-h-screen flex flex-col">
      <div className="w-full border-b-[1.5px]" style={{ borderColor: 'var(--rule)', background: 'var(--surface)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <AppLogo className="w-8 h-8 shrink-0" />
            <span className="display text-xl font-bold tracking-wide truncate">PROXIMA<span style={{ color: 'var(--accent-text)' }}>STRUC</span></span>
          </div>
          <AccountControls user={user} onLogout={onLogout} />
        </div>
      </div>
      <FloatingThemeControl />

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-24 space-y-8 animate-in-fade-in-up">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5" style={{ borderColor: 'var(--rule)' }}>
          <div>
            <p className="eyebrow" style={{ color: 'var(--accent-text)' }}>Project register</p>
            <h1 className="display text-4xl sm:text-5xl font-semibold uppercase leading-none mt-2">Select Project</h1>
            <p className="text-muted mt-2.5">Welcome back, {user?.name || 'User'}. Choose a workspace to continue.</p>
          </div>
          <span className="flex flex-wrap items-center gap-2">{isSiteOwner && <span className="badge" data-tone="info">Site owner</span>}<span className="badge stamp">{projects.length} project{projects.length === 1 ? '' : 's'} on register</span></span>
        </div>

        {error && <p role="alert" className="form-error">{error}</p>}
        {!isSiteOwner && !projects.length && <p className="empty-state">No projects yet. Projects are created by the site owner.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project, index) => (
            <article key={project.id} className="project-card group">
              <button type="button" onClick={() => onSelect(project)} className="text-left w-full flex-1 flex flex-col">
                <span className="flex items-stretch border-b w-full" style={{ borderColor: 'var(--border-strong)' }}>
                  <span className="flex items-center px-3 py-2 font-mono text-xs font-semibold" style={{ background: 'var(--text)', color: 'var(--surface)' }}>PRJ-{String(index + 1).padStart(2, '0')}</span>
                  <span className="flex-1 flex items-center justify-end gap-2 px-3">{project.ownerId === user?.uid && <span className="badge" data-tone="info">Owner</span>}<ConstructionIcon name="dashboard" size={18} className="text-muted" /></span>
                </span>
                <span className="block p-5 pb-4 flex-1">
                  <h2 className="display text-2xl font-semibold uppercase break-words leading-tight">{project.name}</h2>
                  <span className="block text-xs text-muted font-mono mt-1.5 break-all">ID: {project.id}</span>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--accent-text)' }}>
                    Open Workspace <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
                  </span>
                </span>
              </button>
              {isSiteOwner && onDelete && <div className="px-5 py-2.5 border-t flex justify-end" style={{ borderColor: 'var(--border)' }}>
                <RecordDeletionContext.Provider value={{ user: { email: user.email, uid: user.uid, systemRole: 'admin' }, requests: [], submit: (collection, id, reason) => onDelete(id, reason) }}>
                  <DeleteRecordAction collection="projects" record={project} />
                </RecordDeletionContext.Provider>
              </div>}
            </article>
          ))}

          {isSiteOwner && (isAdding ? (
            <div className="project-card p-5 animate-in-fade-in-up" style={{ borderStyle: 'dashed', borderColor: 'var(--accent)' }}>
              <h3 className="eyebrow mb-4">New Project</h3>
              <form onSubmit={handleAddSubmit} className="space-y-4 flex-1 flex flex-col">
                <label className="field-label">Project Name
                  <input aria-label="Project Name" autoFocus type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="field-control" placeholder="e.g. West Tower" />
                </label>
                <div className="mt-auto grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setIsAdding(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" disabled={!newProjectName.trim() || saving} className="btn btn-primary">Create</button>
                </div>
              </form>
            </div>
          ) : (
            <button onClick={() => setIsAdding(true)} className="project-card-add flex flex-col items-center justify-center gap-3 p-6 min-h-[208px]">
              <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}><Plus size={22} aria-hidden="true" /></span>
              <span className="font-semibold text-sm">Add New Project</span>
            </button>
          ))}
        </div>

        {isSiteOwner && accessControl && <ProjectAccessPanel projects={projects} user={user} {...accessControl} />}

        <div className="flex justify-center pt-4">
          <button onClick={onLogout} className="btn btn-ghost rounded-full px-5" style={{ color: 'var(--danger)' }}>
            <LogOut size={17} aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
};

export default ProjectSelection;
