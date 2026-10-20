import React, { useState } from 'react';

const DEFAULT_CLAIMS = [
  {
    claimNo: 'PC-14 (Current)',
    period: '26 Sep – 25 Oct 2026',
    claimedAmount: 1485000,
    certifiedAmount: 1420000,
    variationOrders: '+S$ 65,000 (VO-08 Approved)',
    sopaStatus: 'Pending Payment Response (Due 08 Nov)',
    retention: '5% (Capped)',
  },
  {
    claimNo: 'PC-13',
    period: '26 Aug – 25 Sep 2026',
    claimedAmount: 1310000,
    certifiedAmount: 1295000,
    variationOrders: '+S$ 18,500 (VO-07)',
    sopaStatus: 'Paid in Full (Tax Invoice Settled)',
    retention: '5%',
  },
  {
    claimNo: 'PC-12',
    period: '26 Jul – 25 Aug 2026',
    claimedAmount: 1190000,
    certifiedAmount: 1190000,
    variationOrders: 'S$ 0',
    sopaStatus: 'Paid in Full (Tax Invoice Settled)',
    retention: '5%',
  },
];

export default function ReportView({ claims = DEFAULT_CLAIMS }) {
  const [selectedMetric, setSelectedMetric] = useState('commercial');

  return (
    <div className="space-y-6">
      {/* Analytics Mode Switcher */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Commercial SOPA Claims, S-Curve & BCA CONQUAS Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Earned Value Management (EVM) and statutory payment timelines under Singapore SOP Act.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedMetric('commercial')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              selectedMetric === 'commercial'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            SOPA & Cashflow (S-Curve)
          </button>
          <button
            onClick={() => setSelectedMetric('quality')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              selectedMetric === 'quality'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            BCA CONQUAS & WSH Metrics
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase text-slate-400">Contract Sum & VOs</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">S$ 48.20M</div>
          <span className="text-xs text-emerald-700 font-medium">+S$ 1.15M Approved VOs</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase text-slate-400">Cumulative Certified (SOPA)</span>
          <div className="text-xl font-bold font-mono text-blue-700 mt-1">S$ 18.46M (38.3%)</div>
          <span className="text-xs text-slate-500">Planned S-Curve: 39.0% (-0.7%)</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase text-slate-400">Cost Performance (CPI)</span>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">1.03</div>
          <span className="text-xs text-slate-500">Rebar Wastage &lt; 2.8% Target</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase text-slate-400">Liquidated Damages (LD) Risk</span>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">S$ 0 (Mitigated)</div>
          <span className="text-xs text-slate-500">3.5 Days Weather EOT Substantiated</span>
        </div>
      </div>

      {/* SOPA Progress Claim Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Monthly Progress Claim & SOPA Payment Response Ledger
          </h3>
          <span className="text-xs font-mono text-slate-500">
            PSSCOC / SIA Valuation Cycle: 25th of Month
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                <th className="py-3 px-4">Claim Ref</th>
                <th className="py-3 px-4">Valuation Period</th>
                <th className="py-3 px-4">Claimed Amount</th>
                <th className="py-3 px-4">SO Certified</th>
                <th className="py-3 px-4">Variation Orders (VO)</th>
                <th className="py-3 px-4">SOPA Statutory Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {claims.map((c) => (
                <tr key={c.claimNo} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{c.claimNo}</td>
                  <td className="py-3.5 px-4 text-slate-600">{c.period}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-800">
                    S$ {c.claimedAmount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                    S$ {c.certifiedAmount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                    {c.variationOrders}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        c.sopaStatus.includes('Paid')
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {c.sopaStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
