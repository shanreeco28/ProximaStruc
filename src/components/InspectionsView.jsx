import React, { useState } from 'react';

const DEFAULT_RFIS = [
  {
    id: 'RFI-STR-104',
    zone: 'Zone A • L6 Core & Slab',
    discipline: 'Structural',
    element: 'Post-Tension Tendon & Bottom Rebar',
    rtoName: 'RTO Lim K.H.',
    reName: 'RE Tan W.M.',
    targetCast: '2026-10-20 16:30',
    stage: 2, // 0: Draft, 1: Internal QC, 2: Awaiting RTO, 3: Approved to Cast
    conquasScore: 'Pending',
    bbsLinked: 'BBS-L6-042 (Verified)',
  },
  {
    id: 'RFI-MEP-089',
    zone: 'Zone A • L6 Core & Slab',
    discipline: 'M&E Sleeve / Conduit',
    element: 'Cast-in Sanitary & Electrical Sleeves',
    rtoName: 'RTO Rajendran',
    reName: 'RE Tan W.M.',
    targetCast: '2026-10-20 16:30',
    stage: 3,
    conquasScore: 'Pass (First-Time)',
    bbsLinked: 'N/A',
  },
  {
    id: 'RFI-STR-103',
    zone: 'Zone B • Podium L3',
    discipline: 'Structural',
    element: 'Core Wall CW2 Pre-Close Formwork',
    rtoName: 'RTO Lim K.H.',
    reName: 'RE Tan W.M.',
    targetCast: '2026-10-21 10:00',
    stage: 3,
    conquasScore: '96.5% (CONQUAS)',
    bbsLinked: 'BBS-CW2-019 (Verified)',
  },
];

const STAGES = ['Draft', 'MainCon QC Pass', 'Submitted to RTO', 'Cleared to Cast'];

export default function InspectionsView({ inspections = DEFAULT_RFIS, onUpdateStage }) {
  const [items, setItems] = useState(inspections);
  const [filterDiscipline, setFilterDiscipline] = useState('All');

  const handleAdvance = (id) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id && item.stage < 3) {
          const updated = { ...item, stage: item.stage + 1 };
          if (onUpdateStage) onUpdateStage(updated);
          return updated;
        }
        return item;
      })
    );
  };

  const filtered = filterDiscipline === 'All'
    ? items
    : items.filter((i) => i.discipline === filterDiscipline);

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            BCA Statutory & RE/RTO Inspection Matrix (RFI)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Structural pours remain locked until Structural, M&E, and Archi RFIs reach Stage 4 (Cleared to Cast).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['All', 'Structural', 'M&E Sleeve / Conduit'].map((disc) => (
            <button
              key={disc}
              onClick={() => setFilterDiscipline(disc)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                filterDiscipline === disc
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {disc}
            </button>
          ))}
        </div>
      </div>

      {/* Inspection Cards */}
      <div className="space-y-4">
        {filtered.map((rfi) => {
          const isCleared = rfi.stage === 3;
          return (
            <div
              key={rfi.id}
              className={`bg-white rounded-xl border p-5 transition ${
                isCleared ? 'border-emerald-300' : 'border-amber-300'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-900 text-white">
                      {rfi.id}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200">
                      {rfi.discipline}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{rfi.zone}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-2">{rfi.element}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block uppercase text-[10px] font-semibold">Assigned RTO / RE</span>
                    <span className="font-semibold text-slate-800">{rfi.rtoName} / {rfi.reName}</span>
                  </div>
                  <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block uppercase text-[10px] font-semibold">Target Concrete Pour</span>
                    <span className="font-mono font-bold text-slate-900">{rfi.targetCast}</span>
                  </div>
                  {rfi.stage < 3 ? (
                    <button
                      onClick={() => handleAdvance(rfi.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-xs transition"
                    >
                      Advance Sign-Off →
                    </button>
                  ) : (
                    <span className="px-3.5 py-2 rounded-lg font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      ✓ CAST PERMITTED
                    </span>
                  )}
                </div>
              </div>

              {/* 4-Stage ISO 19650 / BCA Stepper */}
              <div className="mt-4 grid grid-cols-4 gap-2">
                {STAGES.map((label, idx) => {
                  const completed = idx <= rfi.stage;
                  const current = idx === rfi.stage;
                  return (
                    <div
                      key={label}
                      className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                        completed
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      } ${current ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                          completed ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="truncate">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
