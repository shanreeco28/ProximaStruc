import React, { useState } from 'react';
import { Briefcase, ArrowRight, Plus, X, Save } from 'lucide-react';

const ProjectSelection = ({ projects, onSelect, onAddProject }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', id: '' });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (newProject.name && newProject.id) {
      onAddProject(newProject);
      setNewProject({ name: '', id: '' });
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 animate-in fade-in duration-500">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4">Select Project</h1>
          <p className="text-slate-500 dark:text-slate-400">Choose a project to continue to the dashboard.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelect(project)}
              className="group relative flex flex-col items-start p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left w-full outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="p-3 bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-xl mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Briefcase size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {project.name}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Project ID: <span className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{project.id}</span>
              </p>

              <div className="mt-auto flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                Open Dashboard <ArrowRight size={16} className="ml-1" />
              </div>
            </button>
          ))}

          {/* Add Project Card */}
          {isAdding ? (
            <form onSubmit={handleAddSubmit} className="flex flex-col p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-blue-500 dark:border-blue-400 shadow-lg relative animate-in zoom-in-95 duration-200">
               <button type="button" onClick={() => setIsAdding(false)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><X size={20} /></button>
               <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">New Project</h3>
               <div className="space-y-4 flex-1">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project Name</label>
                   <input autoFocus type="text" required placeholder="e.g. Skyline Tower" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project ID (Unique)</label>
                   <input type="text" required placeholder="e.g. skyline-v1" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono" value={newProject.id} onChange={e => setNewProject({...newProject, id: e.target.value.toLowerCase().replace(/\s+/g, '-')})} />
                 </div>
               </div>
               <button type="submit" className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2"><Save size={16} /> Create Project</button>
            </form>
          ) : (
            <button onClick={() => setIsAdding(true)} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 dark:text-slate-500 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800/50 hover:text-blue-500 dark:hover:text-blue-400 transition-all cursor-pointer group outline-none focus:ring-2 focus:ring-blue-500">
               <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:bg-blue-100 dark:group-hover:bg-slate-700 transition-colors">
                 <Plus size={24} />
               </div>
               <span className="text-sm font-medium">Add New Project</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectSelection;
