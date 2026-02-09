import React, { useState } from 'react';
import { Plus, Layout, ArrowRight } from 'lucide-react';
import AppLogo from './AppLogo';

export default function ProjectSelection({ projects, onSelect, onAddProject }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newProject, setNewProject] = useState({ id: '', name: '', description: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newProject.id && newProject.name) {
      onAddProject(newProject);
      setNewProject({ id: '', name: '', description: '' });
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10">
        <div className="inline-block p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-lg mb-4">
            <AppLogo className="w-16 h-16" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Select Project</h1>
        <p className="text-slate-500 dark:text-slate-400">Choose a project workspace to continue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onSelect(project)}
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all text-left group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="text-blue-500" />
            </div>
            <div className="w-12 h-12 bg-blue-50 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
              <Layout size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{project.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{project.description || 'No description'}</p>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs text-slate-400">
                <span className="font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">ID: {project.id}</span>
            </div>
          </button>
        ))}

        <button
          onClick={() => setIsAdding(true)}
          className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 gap-2 min-h-[200px]"
        >
          <Plus size={32} />
          <span className="font-medium">Add New Project</span>
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Create New Project</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg outline-none dark:bg-slate-700 dark:text-white"
                  placeholder="e.g. Riverside Tower A"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project ID</label>
                <input
                  type="text"
                  required
                  value={newProject.id}
                  onChange={(e) => setNewProject({ ...newProject, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg outline-none font-mono text-sm dark:bg-slate-700 dark:text-white"
                  placeholder="e.g. riverside-tower-a"
                />
                <p className="text-[10px] text-slate-400 mt-1">Used in database paths. Unique, lowercase, no spaces.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                <input
                  type="text"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg outline-none dark:bg-slate-700 dark:text-white"
                  placeholder="Optional description"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
