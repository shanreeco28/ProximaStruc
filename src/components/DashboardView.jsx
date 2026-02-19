import React from 'react';
import Card from './Card';
import ProjectTimeline from './ProjectTimeline';
import {
  Layers,
  Truck,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Clock,
  Target,
  Hammer,
  FileText
} from 'lucide-react';

const DashboardView = ({ metrics, data, filteredData, selectedProject, setActiveModal, setActiveTab }) => {
  const progressPercentage = metrics.total > 0 ? Math.round((metrics.cast/metrics.total)*100) : 0;
  const today = new Date().toISOString().split('T')[0];
  const overdueCount = data.filter(item =>
    item.castingDate &&
    item.castingDate < today &&
    item.status !== 'Cast'
  ).length;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-soilGreen-900 to-soilGreen-800 rounded-2xl p-6 md:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-soilOrange-500/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-soilGreen-500/10 rounded-full -ml-24 -mb-24"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">Project Dashboard</h1>
              <p className="text-slate-300 text-base">Real-time construction project management & reporting</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg">
                  <p className="text-xs text-slate-300 uppercase tracking-wide">Active Project</p>
                  <p className="text-lg font-bold">{selectedProject?.name}</p>
                </div>
                <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg">
                  <p className="text-xs text-slate-300 uppercase tracking-wide">Today</p>
                  <p className="text-lg font-bold">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setActiveModal('report')}
                className="bg-soilOrange-500 hover:bg-soilOrange-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg text-white"
              >
                <FileText size={18} /> Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          title="Total Scope"
          value={metrics.total}
          icon={Layers}
          subtext="Active casting zones"
          color="slate"
          size="default"
        />
        <Card
          title="Materials Delivered"
          value={metrics.delivered}
          icon={Truck}
          subtext={`${metrics.total > 0 ? Math.round((metrics.delivered/metrics.total)*100) : 0}% coverage`}
          color="amber"
          size="default"
          trend={15}
        />
        <Card
          title="Completed Casts"
          value={metrics.cast}
          icon={CheckCircle2}
          subtext={`${progressPercentage}% overall progress`}
          color="emerald"
          size="default"
          trend={8}
        />
        <Card
          title="Critical Issues"
          value={overdueCount}
          icon={AlertTriangle}
          subtext="Overdue schedules"
          color="red"
          size="default"
        />
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="text-blue-500" size={24} />
              Project Progress Overview
            </h2>
            <button
              onClick={() => setActiveTab('tracker')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              View Details →
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Overall Completion</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-white">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="h-full bg-white/20 animate-pulse"></div>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>{metrics.cast} completed</span>
              <span>{metrics.total} total zones</span>
            </div>
          </div>

          {/* Enhanced Status Breakdown with Visual Indicators */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-all duration-300 group">
              <div className="relative">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
              <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{metrics.cast}</div>
              <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Completed</div>
              {metrics.total > 0 && (
                <div className="mt-2 text-xs text-emerald-500 dark:text-emerald-500">
                  {Math.round((metrics.cast/metrics.total)*100)}% of total
                </div>
              )}
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-300 group">
              <div className="relative">
                <Clock className="w-10 h-10 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">{metrics.pending}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">In Progress</div>
              {metrics.total > 0 && (
                <div className="mt-2 text-xs text-blue-500 dark:text-blue-500">
                  {Math.round((metrics.pending/metrics.total)*100)}% of total
                </div>
              )}
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg border border-amber-200 dark:border-amber-800 hover:shadow-md transition-all duration-300 group">
              <div className="relative">
                <Truck className="w-10 h-10 text-amber-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
              </div>
              <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">{metrics.delivered}</div>
              <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">Materials Ready</div>
              {metrics.total > 0 && (
                <div className="mt-2 text-xs text-amber-500 dark:text-amber-500">
                  {Math.round((metrics.delivered/metrics.total)*100)}% coverage
                </div>
              )}
            </div>
          </div>

          {/* Mini Analytics Chart */}
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Weekly Progress Trend</h4>
            <div className="flex items-end justify-between h-16 gap-2">
              {[65, 78, 82, 75, 90, 85, progressPercentage].map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-500 hover:from-blue-600 hover:to-blue-500"
                    style={{ height: `${value}%` }}
                  />
                  <span className="text-[8px] text-slate-500 dark:text-slate-400">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      {/* Critical Tasks Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={24} />
            Critical Tasks
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {/* Overdue Items */}
          <div className={`p-4 rounded-lg border ${
            overdueCount > 0
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${overdueCount > 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h4 className={`text-base font-bold ${overdueCount > 0 ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                    Overdue Schedules
                  </h4>
                  <span className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>{overdueCount}</span>
                </div>
                <p className={`text-sm ${overdueCount > 0 ? 'text-red-600 dark:text-red-300' : 'text-emerald-600 dark:text-emerald-300'}`}>
                  casting zones {overdueCount > 0 ? 'behind schedule' : 'on schedule'}
                </p>
              </div>
            </div>
          </div>

          {/* Missing BBS */}
          <div className={`p-4 rounded-lg border ${
            data.filter(i => !i.bbs || (Array.isArray(i.bbs) && i.bbs.length === 0)).length > 0
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${data.filter(i => !i.bbs || (Array.isArray(i.bbs) && i.bbs.length === 0)).length > 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
                <Target size={24} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h4 className={`text-base font-bold ${
                    data.filter(i => !i.bbs || (Array.isArray(i.bbs) && i.bbs.length === 0)).length > 0
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}>
                    Missing BBS
                  </h4>
                  <span className={`text-2xl font-bold ${
                    data.filter(i => !i.bbs || (Array.isArray(i.bbs) && i.bbs.length === 0)).length > 0
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}>{data.filter(i => !i.bbs || (Array.isArray(i.bbs) && i.bbs.length === 0)).length}</span>
                </div>
                <p className={`text-sm ${
                  data.filter(i => !i.bbs || (Array.isArray(i.bbs) && i.bbs.length === 0)).length > 0
                    ? 'text-amber-600 dark:text-amber-300'
                    : 'text-emerald-600 dark:text-emerald-300'
                }`}>
                  zones pending BBS assignment
                </p>
              </div>
            </div>
          </div>

          {/* Next Casting */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                <Hammer size={24} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-base font-bold text-blue-700 dark:text-blue-400">Next Casting</h4>
                  {data.filter(i => i.status !== 'Cast' && i.castingDate).sort((a, b) => new Date(a.castingDate) - new Date(b.castingDate))[0] && (
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded">
                      {new Date(data.filter(i => i.status !== 'Cast' && i.castingDate).sort((a, b) => new Date(a.castingDate) - new Date(b.castingDate))[0].castingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
                {data.filter(i => i.status !== 'Cast' && i.castingDate).sort((a, b) => new Date(a.castingDate) - new Date(b.castingDate))[0] ? (
                  <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">
                    {data.filter(i => i.status !== 'Cast' && i.castingDate).sort((a, b) => new Date(a.castingDate) - new Date(b.castingDate))[0].slabId}
                  </p>
                ) : (
                  <p className="text-sm text-blue-600 dark:text-blue-300">No upcoming castings</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
        {/* Project Timeline */}
      <ProjectTimeline filteredData={filteredData} />

      </div>
    </div>
  );
};

export default DashboardView;
