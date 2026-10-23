import React from 'react';

export default function ExecutiveReportModal({ onClose, tasks = [], claims = [], weatherLogs = [], materials = [] }) {
  const latestClaim = claims[0]?.certifiedAmount || 1420000;

  const criticalTask = tasks.find(t => t.critical);
  const criticalTaskText = criticalTask
    ? `Critical Path Recovery: Reviewing ${criticalTask.activity} (Variance: ${criticalTask.variance})`
    : `Critical Path Recovery (Zone A L6): Deploying extended shift concrete crew upon RTO sign-off of RFI-STR-104 at 14:00 HRS today.`;

  const delayedMaterial = materials.find(m => m.status.includes('Delay'));
  const delayedMaterialText = delayedMaterial
    ? `Delivery Recovery: Expedited delayed material (${delayedMaterial.id}: ${delayedMaterial.element}).`
    : `NatSteel BBS Delivery Recovery: Expedited 2 delayed beam tags (BBS-L6-045) for tomorrow 08:00 HRS unloading via 50T Mobile Crane.`;

  const latestWeather = weatherLogs[weatherLogs.length - 1];
  const weatherText = latestWeather
    ? `Statutory EOT Notification: ${latestWeather.timeWindow} ${latestWeather.event} logged under ${latestWeather.contractClause}.`
    : `Statutory EOT Notification: 1.5 hours inclement weather / lightning alert logged under PSSCOC Cl. 14.2.`;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-blue-600 font-bold">
              ISO 19650 CDE • Weekly Project Manager Report
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              Contract LC1 — Executive Progress & Statutory Summary
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-bold text-sm px-3 py-1.5 rounded-lg border border-slate-200"
          >
            ✕ Close
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">SPI (Schedule)</span>
            <span className="text-lg font-bold font-mono text-amber-600">0.98 (-2d)</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">CONQUAS 1st-Pass</span>
            <span className="text-lg font-bold font-mono text-emerald-700">94.2%</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Safe Man-Hours</span>
            <span className="text-lg font-bold font-mono text-slate-900">1,140,200</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Latest SOPA Claim</span>
            <span className="text-lg font-bold font-mono text-blue-700">S$ {(latestClaim / 1000000).toFixed(2)}M</span>
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate-700">
          <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
            Key PM Action Items & Mitigation Plan
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>
              <strong>Schedule Risk:</strong> {criticalTaskText}
            </li>
            <li>
              <strong>Material Logistics:</strong> {delayedMaterialText}
            </li>
            <li>
              <strong>Delay Substantiation:</strong> {weatherText}
            </li>
          </ul>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end gap-3 no-print">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-xs"
          >
            Print / Export Official PDF (A4)
          </button>
        </div>
      </div>
    </div>
  );
}
