import React from 'react';

const LOOKAHEAD_TASKS = [
  {
    wbs: 'WBS-1.4.2',
    activity: 'Zone A • L6 Core Wall & Slab Casting (G40)',
    baseline: '20 Oct 2026',
    forecast: '20 Oct 2026',
    variance: '0d (On Track)',
    rfiStatus: '1 Pending RTO (RFI-STR-104)',
    critical: true,
  },
  {
    wbs: 'WBS-1.4.3',
    activity: 'Zone A • L7 Vertical Column Rebar & Formwork',
    baseline: '22 Oct 2026',
    forecast: '24 Oct 2026',
    variance: '-2d (BBS Delay)',
    rfiStatus: 'Drafting',
    critical: true,
  },
  {
    wbs: 'WBS-2.1.5',
    activity: 'Zone B • Podium Precast Beam Installation',
    baseline: '25 Oct 2026',
    forecast: '25 Oct 2026',
    variance: '0d (On Track)',
    rfiStatus: 'Cleared (RFI-STR-103)',
    critical: false,
  },
];

export default function CalendarView() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Master Programme & 3-Week Rolling Lookahead (CPM)
          </h2>
          <p className="text-xs text-slate-500">
            Critical Path Method (CPM) tracking synced with RE/RTO Hold Points and BBS Deliveries.
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200">
          ● Critical Path Filter Active
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
              <th className="py-3 px-4">WBS Code</th>
              <th className="py-3 px-4">Activity & Zone</th>
              <th className="py-3 px-4">Baseline Target</th>
              <th className="py-3 px-4">Live Forecast</th>
              <th className="py-3 px-4">Schedule Variance</th>
              <th className="py-3 px-4">Linked RFI Gate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {LOOKAHEAD_TASKS.map((t) => (
              <tr key={t.wbs} className="hover:bg-slate-50">
                <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{t.wbs}</td>
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    {t.critical && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded">
                        CPM
                      </span>
                    )}
                    {t.activity}
                  </div>
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-600">{t.baseline}</td>
                <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{t.forecast}</td>
                <td className="py-3.5 px-4 font-mono">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      t.variance.includes('-')
                        ? 'bg-red-100 text-red-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {t.variance}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">{t.rfiStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
