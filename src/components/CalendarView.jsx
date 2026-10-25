import React, { useState } from 'react';

const COLUMNS = [
  { id: 'lookahead', title: 'Lookahead (Backlog)' },
  { id: 'make_ready', title: 'Make-Ready' },
  { id: 'in_progress', title: 'In Progress (Sprint)' },
  { id: 'done', title: 'Done' }
];

export default function CalendarView({ tasks, onUpdate, currentUser }) {
  const isPrivileged = ['admin', 'manager', 'engineer', 'supervisor'].includes(currentUser?.systemRole);

  const handleStatusChange = (taskId, newStatus) => {
    if (onUpdate) onUpdate(taskId, { status: newStatus });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Micro-schedule and Look Ahead
          </h2>
          <p className="text-xs text-slate-500">
            Lean-agile project management dashboard for scheduling works.
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200">
          ● Sprint / Lookahead Active
        </span>
      </div>

      <div className="p-5 overflow-x-auto flex-1 bg-slate-50/50">
        <div className="flex gap-4 min-w-[800px] h-full items-start">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => (t.status || 'lookahead') === col.id);
            return (
              <div key={col.id} className="flex-1 min-w-[250px] bg-slate-100 rounded-xl p-3 border border-slate-200 flex flex-col max-h-[70vh]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-xs font-bold uppercase text-slate-700">{col.title}</h3>
                  <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{colTasks.length}</span>
                </div>

                <div className="space-y-3 overflow-y-auto flex-1 pr-1 pb-2">
                  {colTasks.map(t => (
                    <div key={t.id || t.wbs} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm cursor-default hover:border-blue-300 transition">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">{t.wbs}</span>
                        {t.critical && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-100 text-red-700 border border-red-200 rounded">
                            SPRINT
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 leading-tight mb-2">{t.activity}</h4>

                      <div className="space-y-1.5 mb-3">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Baseline:</span>
                          <span className="font-mono text-slate-700">{t.baseline}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Forecast:</span>
                          <span className="font-mono font-bold text-slate-900">{t.forecast}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100">
                          <span className="text-slate-500">Variance:</span>
                          <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                            t.variance.includes('-') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {t.variance}
                          </span>
                        </div>
                      </div>

                      {t.rfiStatus && (
                        <div className="mb-3 text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 flex items-center gap-1.5">
                          <span className="font-bold">RFI:</span> {t.rfiStatus}
                        </div>
                      )}

                      {isPrivileged && (
                        <select
                          value={t.status || 'lookahead'}
                          onChange={(e) => handleStatusChange(t.id, e.target.value)}
                          className="w-full text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-500 transition"
                        >
                          {COLUMNS.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
