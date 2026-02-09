import React, { useState, useEffect } from 'react';
import ProjectSelection from './components/ProjectSelection.jsx';
import ProjectApp from './ProjectApp.jsx';

const DEFAULT_PROJECTS = [
  { id: 'tnd4-castrack', name: 'TND4 Project', description: 'TND4 Construction Logistics' },
];

export default function App() {
  const [projects, setProjects] = useState(() => {
    const stored = localStorage.getItem('sb-projects');
    try {
      return stored ? JSON.parse(stored) : DEFAULT_PROJECTS;
    } catch (e) {
      return DEFAULT_PROJECTS;
    }
  });

  const [selectedProject, setSelectedProject] = useState(() => {
    const lastId = localStorage.getItem('sb-last-project');
    if (lastId) {
        const storedProjects = localStorage.getItem('sb-projects');
        const list = storedProjects ? JSON.parse(storedProjects) : DEFAULT_PROJECTS;
        return list.find(p => p.id === lastId) || null;
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem('sb-projects', JSON.stringify(projects));
  }, [projects]);

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    localStorage.setItem('sb-last-project', project.id);
  };

  const handleExitProject = () => {
    setSelectedProject(null);
    localStorage.removeItem('sb-last-project');
  };

  const handleAddProject = (project) => {
    setProjects(prev => [...prev, project]);
  };

  if (selectedProject) {
    return (
      <ProjectApp
        projectId={selectedProject.id}
        onExit={handleExitProject}
      />
    );
  }

  return (
    <ProjectSelection
      projects={projects}
      onSelect={handleSelectProject}
      onAddProject={handleAddProject}
    />
  );
}
