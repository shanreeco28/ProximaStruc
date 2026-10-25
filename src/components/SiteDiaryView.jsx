import React, { useState } from 'react';

export default function SiteDiaryView({ weatherLogs, onAddWeatherLog }) {
  const [newTime, setNewTime] = useState('');
  const [newImpact, setNewImpact] = useState('');

  const handleAddDelay = (e) => {
    e.preventDefault();
    if (!newTime || !newImpact) return;

    onAddWeatherLog && onAddWeatherLog({
      timeWindow: newTime,
      event: 'Inclement Weather / Lightning Alert',
      impact: newImpact,
      contractClause: 'PSSCOC Cl. 14.2 (Weather EOT Record)',
    });

    setNewTime('');
    setNewImpact('');
  };

  return (
    <div className="space-y-6">
      {/* Contractual Weather & EOT Substantiation Logger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Contemporaneous Weather & Stop-Work Log (EOT Defense)
            </h2>
            <p className="text-xs text-slate-500">
              Timestamped records for Architect / SO verification under SIA / PSSCOC forms of contract.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddDelay} className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <input
            type="text"
            placeholder="Time Window (e.g. 15:30 - 16:45)"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Affected Critical Path Activity & Zone..."
            value={newImpact}
            onChange={(e) => setNewImpact(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg px-4 py-2 transition"
          >
            + Log Statutory Delay Event
          </button>
        </form>

        <div className="divide-y divide-slate-200 border-t border-slate-200 pt-2">
          {weatherLogs.map((log) => (
            <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
              <div>
                <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-xs mr-2">
                  {log.timeWindow}
                </span>
                <span className="font-semibold text-slate-900">{log.event}</span>
                <p className="text-xs text-slate-600 mt-1">{log.impact}</p>
              </div>
              <span className="font-mono text-xs text-slate-500 shrink-0">{log.contractClause}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
