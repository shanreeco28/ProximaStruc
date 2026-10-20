import React, { useState } from 'react';

const DEFAULT_MATERIALS = [
  {
    id: 'BBS-L6-042',
    type: 'Rebar (BBS)',
    supplier: 'NatSteel Holdings',
    element: 'Zone A • L6 Slab & Drop Panels (T16, T20, T25)',
    quantity: '48.5 Tonnes',
    doNumber: 'DO-NS-88412',
    deliverySlot: 'Delivered • Yard Bay 2',
    craneSlot: 'TC-1 Booked (Completed)',
    sopaClaimable: true,
    sopaValue: 67900,
    status: 'Installed & Cast-Ready',
  },
  {
    id: 'CONC-L6-011',
    type: 'Ready-Mix Concrete',
    supplier: 'Pan-United Concrete (G40 Pump Mix)',
    element: 'Zone A • L6 Core Wall & Slab Pour',
    quantity: '210.0 m³',
    doNumber: 'Batch Pre-Order #410',
    deliverySlot: 'Today 16:30 (12 Trucks Staggered)',
    craneSlot: 'Placing Boom PB-1',
    sopaClaimable: false,
    sopaValue: 33600,
    status: 'Awaiting RTO Clearance',
  },
  {
    id: 'BBS-L6-045',
    type: 'Rebar (BBS)',
    supplier: 'NatSteel Holdings',
    element: 'Zone B • L4 Perimeter Beams',
    quantity: '22.0 Tonnes',
    doNumber: 'Pending Dispatch',
    deliverySlot: 'Delayed (+1 Day)',
    craneSlot: '50T Mobile Crane (Hold)',
    sopaClaimable: false,
    sopaValue: 30800,
    status: 'Fabrication Delay',
  },
];

export default function MaterialsView({ materials = DEFAULT_MATERIALS }) {
  const [rows, setRows] = useState(materials);

  const toggleSopaClaim = (id) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, sopaClaimable: !r.sopaClaimable } : r))
    );
  };

  const totalClaimable = rows
    .filter((r) => r.sopaClaimable)
    .reduce((acc, r) => acc + r.sopaValue, 0);

  return (
    <div className="space-y-6">
      {/* SOPA Valuation & Supply Chain Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase text-slate-400">
            Verified Material for Progress Claim #14 (SOPA)
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            S$ {totalClaimable.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500">Auto-synced with QS Monthly Valuation</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase text-slate-400">
            Concrete Cube Testing (7-Day / 28-Day)
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">100% Pass</div>
          <span className="text-xs text-slate-500">Last Batch: G45 Core Wall (52.4 MPa @ 28d)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase text-slate-400">
            Active BBS Tags Dispatched
          </span>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">14 / 16 Tags</div>
          <span className="text-xs text-red-600 font-medium">2 Tags Delayed (Zone B Beams)</span>
        </div>
      </div>

      {/* Materials & BBS Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            BBS Rebar Tags, Concrete Batching & Delivery Orders (DO)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                <th className="py-3 px-4">Tag / Batch ID</th>
                <th className="py-3 px-4">Element & Supplier</th>
                <th className="py-3 px-4">Qty & DO Ref</th>
                <th className="py-3 px-4">Logistics & Crane Slot</th>
                <th className="py-3 px-4">Site Status</th>
                <th className="py-3 px-4 text-right">SOPA Claim Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {item.id}
                    <span className="block text-[11px] font-sans font-normal text-slate-500">
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{item.element}</div>
                    <div className="text-xs text-slate-500">{item.supplier}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <div className="font-bold text-slate-900">{item.quantity}</div>
                    <div className="text-xs text-slate-500">{item.doNumber}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <div className="font-semibold text-slate-800">{item.deliverySlot}</div>
                    <div className="text-slate-500">{item.craneSlot}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.status.includes('Delay')
                          ? 'bg-red-100 text-red-800'
                          : item.status.includes('Ready')
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => toggleSopaClaim(item.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                        item.sopaClaimable
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {item.sopaClaimable
                        ? `✓ Claimed (S$${item.sopaValue.toLocaleString()})`
                        : `Include (S$${item.sopaValue.toLocaleString()})`}
                    </button>
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
