import React from 'react';
import { isInspectionClosed } from '../utils/siteData';

export default function PMCommandDashboard({ onNavigate, inspections, lifts, materials }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Today's Critical Casting & RTO Hold Points */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Structural Hold Points (RE/RTO)
            </h2>
            <button
              onClick={() => onNavigate('inspections')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View All RFIs →
            </button>
          </div>
          <div className="space-y-3 text-sm flex-1 overflow-y-auto max-h-[300px]">
            {inspections.map((rfi) => (
              <div
                key={rfi.id}
                className={`p-3 rounded-lg border flex justify-between items-center ${
                  isInspectionClosed(rfi)
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div>
                  <span className="font-semibold text-slate-900 block">{rfi.id}: {rfi.element}</span>
                  <span className="text-xs text-slate-600">Target Pour: {rfi.targetCast || 'Not recorded'}</span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    isInspectionClosed(rfi)
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {isInspectionClosed(rfi) ? 'APPROVED' : 'AWAITING CLOSURE'}
                </span>
              </div>
            ))}
            {inspections.length === 0 && (
              <div className="text-slate-500 text-center py-4">No active RFIs.</div>
            )}
          </div>
        </div>

        {/* Column 2: MOM High-Risk & Lifting PTW Matrix */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              MOM Permit-to-Work & Crane Status
            </h2>
            <button
              onClick={() => onNavigate('lifting')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Manage PTWs →
            </button>
          </div>
          <div className="space-y-3 text-sm flex-1 overflow-y-auto max-h-[300px]">
            {lifts.map((ptw) => (
              <div
                key={ptw.id}
                className={`p-3 rounded-lg border flex justify-between items-center ${
                  ptw.status === 'ACTIVE'
                    ? 'border-slate-200'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div>
                  <span className="font-semibold text-slate-900 block">{ptw.crane}</span>
                  <span className={`text-xs ${ptw.status === 'ACTIVE' ? 'text-slate-500' : 'text-red-700'}`}>
                    Wind: {ptw.windSpeed || 'Not recorded'} • Radius: {ptw.radius || 'Not recorded'}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    ptw.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-200 text-red-900'
                  }`}
                >
                  {ptw.status === 'ACTIVE' ? 'PTW ACTIVE' : 'HOLD'}
                </span>
              </div>
            ))}
            {lifts.length === 0 && (
              <div className="text-slate-500 text-center py-4">No active PTWs.</div>
            )}
          </div>
        </div>

        {/* Column 3: Site Material & Supply Chain Pulse */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Material Readiness & BBS Logistics
            </h2>
            <button
              onClick={() => onNavigate('materials')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              BBS & DO Log →
            </button>
          </div>
          <div className="space-y-3 text-sm flex-1">
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600">Delayed Materials / BBS:</span>
              <span className="font-mono font-bold text-red-600">
                {materials.filter((m) => m.status?.includes('Delay')).length} Item(s)
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-slate-100 mt-2">
              <span className="text-slate-600">Received material records:</span>
              <span className="font-mono font-bold text-blue-700">
                {materials.filter(r => ['Received', 'Installed', 'Poured'].includes(r.status)).length} / {materials.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
