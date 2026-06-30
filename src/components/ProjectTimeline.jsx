import React, { useState } from 'react';
import { Activity, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';

// --- Project Timeline View ---
const ProjectTimeline = ({ filteredData }) => {
  const [viewMode, setViewMode] = useState('month'); // month, quarter, project

  const getTimelineData = () => {
    return filteredData
      .filter(item => item.castingDate)
      .sort((a, b) => new Date(a.castingDate) - new Date(b.castingDate))
      .map(item => ({
        ...item,
        startDate: item.castingDate,
        endDate: item.actualCastingDate || item.castingDate,
        delay: item.actualCastingDate && new Date(item.actualCastingDate) > new Date(item.castingDate)
      }));
  };

  const timelineData = getTimelineData();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Activity className="text-zinc-600" size={24} />
          Project Timeline
        </h2>
        <div className="flex gap-2">
          {['month', 'quarter', 'project'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                viewMode === mode
                  ? 'bg-zinc-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="space-y-3">
        {timelineData.map((item) => (
          <div key={item.id} className="relative flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
            {/* Status Indicator */}
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
              item.status === 'Cast'
                ? 'bg-emerald-500'
                : item.status === 'Delayed'
                ? 'bg-red-500'
                : 'bg-blue-500'
            }`} />

            {/* Item Info */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">{item.slabId}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{item.zone}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {item.status}
                  </p>
                  {item.delay && (
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                      Delayed
                    </span>
                  )}
                </div>
              </div>

              {/* Date Range */}
              <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <CalendarIcon size={10} />
                  {item.startDate}
                </span>
                {item.actualCastingDate && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={10} />
                    {item.actualCastingDate}
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-20 md:w-32">
              <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.status === 'Cast'
                      ? 'bg-emerald-500'
                      : item.status === 'Delayed'
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: item.status === 'Cast' ? '100%' : '50%' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectTimeline;
