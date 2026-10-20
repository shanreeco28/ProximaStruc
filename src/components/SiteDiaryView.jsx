import React, { useState } from 'react';

export default function SiteDiaryView() {
  const [weatherLogs, setWeatherLogs] = useState([
    {
      id: 1,
      timeWindow: '13:40 – 15:10 (1.5 hrs)',
      event: 'NEA Heavy Rain & Lightning Risk Alert (Cat 1)',
      impact: 'Tower Crane TC-1 & TC-2 lifting suspended; Zone A L6 open slab rebar tying halted.',
      contractClause: 'PSSCOC Cl. 14.2 (Weather EOT Record)',
    },
  ]);

  const [newTime, setNewTime] = useState('');
  const [newImpact, setNewImpact] = useState('');

  const handleAddDelay = (e) => {
    e.preventDefault();
    if (!newTime || !newImpact) return;
    setWeatherLogs([
      ...weatherLogs,
      {
        id: Date.now(),
        timeWindow: newTime,
        event: 'Inclement Weather / Lightning Alert',
        impact: newImpact,
        contractClause: 'PSSCOC Cl. 14.2 (Weather EOT Record)',
      },
    ]);
    setNewTime('');
    setNewImpact('');
  };

  return (
    <div className="space-y-6">
      {/* NEA & MOM Statutory Environmental Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase text-slate-400">NEA Boundary Noise (1hr Leq)</span>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">68.4 dB(A)</div>
          <span className="text-xs text-slate-500">Limit: 75 dB(A) (07:00–19:00)</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase text-slate-400">PUB / NEA ECM Silt Trap TSS</span>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">32 mg/L</div>
          <span className="text-xs text-slate-500">Legal Discharge Limit: &lt; 50 mg/L</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase text-slate-400">NEA Dengue & Fogging Cycle</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">Cleared (ECO)</div>
          <span className="text-xs text-slate-500">Weekly Vector Audit Signed Off</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase text-slate-400">Biometric Turnstile Headcount</span>
          <div className="text-xl font-bold font-mono text-blue-700 mt-1">318 Pax</div>
          <span className="text-xs text-slate-500">MainCon: 42 • Subcon: 276</span>
        </div>
      </div>

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
