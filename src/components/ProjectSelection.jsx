import React, { useState } from 'react';
import { Briefcase, Plus, LogOut, ArrowRight, Building, CheckCircle2, Trash2 } from 'lucide-react';

const ProjectSelection = ({ projects, onSelect, onAdd, onDelete, onLogout, user }) => {
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-4xl space-y-8 animate-in fade-in zoom-in-95 duration-500">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg mb-4">
             <Building className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Select Project</h1>
          <p className="text-slate-500 dark:text-slate-400">Welcome back, {user?.name || 'User'}. Choose a workspace to continue.</p>
        </div>

        {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelect(project)}
              className="group relative flex flex-col items-start p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 hover:shadow-xl text-left w-full"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Briefcase size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {project.name}
              </h3>
              <p className="text-xs text-slate-400 font-mono mb-4">ID: {project.id}</p>

              <div className="mt-auto flex items-center text-sm font-medium text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Open Workspace <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Actions (Delete & Active Indicator) */}
              <div className="absolute top-4 right-4 flex gap-2">
                {project.ownerId === user?.uid && onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete project "${project.name}"?`)) {
                        onDelete(project.id);
                      }
                    }}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">
                  <CheckCircle2 size={20} />
                </div>
              </div>
            </button>
          ))}

          {/* Add Project Card */}
          {isAdding ? (
            <div className="flex flex-col p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 animate-in fade-in duration-300">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase mb-4">New Project</h3>
              <form onSubmit={handleAddSubmit} className="space-y-4 flex-1 flex flex-col">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Project Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. West Tower"
                  />
                </div>
                <div className="mt-auto grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newProjectName.trim() || saving}
                    className="px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 min-h-[200px]"
            >
              <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center mb-3">
                <Plus size={24} />
              </div>
              <span className="font-medium text-sm">Add New Project</span>
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-center pt-8">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProjectSelection;
