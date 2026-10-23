import React from 'react';

export default function LiftingView({ lifts, onToggleLift }) {
  return (
    <div className="space-y-6">
      {/* MOM WSH Statutory Telemetry Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 block">
            MOM WSH (Operation of Cranes) Regulations Compliance
          </span>
          <h2 className="text-base font-bold mt-0.5">
            Active Lifting Permit-to-Work (PTW) & Crane Hook-Time Matrix
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
            ANEMOMETER (TC-1): <span className="text-emerald-400 font-bold">14 km/h (SAFE &lt; 36 km/h)</span>
          </div>
          <div className="bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
            ANTI-COLLISION SYSTEM: <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>
        </div>
      </div>

      {/* PTW Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {lifts.map((ptw) => {
          const isActive = ptw.status === 'ACTIVE';
          return (
            <div
              key={ptw.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-300">
                    {ptw.id}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {ptw.status === 'ACTIVE' ? '● PTW AUTHORIZED (PM & WSHO)' : '⏳ AWAITING WSHO ENDORSEMENT'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-3">{ptw.crane}</h3>
                <p className="text-sm text-slate-700 font-medium mt-1">{ptw.loadDescription}</p>

                {/* Load & Radius Specs */}
                <div className="grid grid-cols-3 gap-2 mt-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Zone</span>
                    <span className="font-semibold text-slate-800">{ptw.zone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Working Radius</span>
                    <span className="font-mono font-bold text-slate-900">{ptw.radius}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">MOM LM Cert</span>
                    <span className="font-mono text-emerald-700 font-semibold">{ptw.lmExpiry}</span>
                  </div>
                </div>

                {/* Mandatory MOM Appointed Lifting Team */}
                <div className="mt-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Appointed Lifting Crew (Verified Biometric Check-In)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                      <span className="text-[10px] text-slate-400 font-semibold block">LIFTING SUPERVISOR</span>
                      <span className="font-semibold text-slate-800">{ptw.supervisor}</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                      <span className="text-[10px] text-slate-400 font-semibold block">RIGGER</span>
                      <span className="font-semibold text-slate-800">{ptw.rigger}</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                      <span className="text-[10px] text-slate-400 font-semibold block">SIGNALMAN</span>
                      <span className="font-semibold text-slate-800">{ptw.signalman}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Daily Re-Validation: <strong className="text-slate-800">07:30 HRS</strong>
                </span>
                <button
                  onClick={() => onToggleLift && onToggleLift(ptw.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                    isActive
                      ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {isActive ? 'Suspend Lift (Stop-Work)' : 'Approve & Activate PTW'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
