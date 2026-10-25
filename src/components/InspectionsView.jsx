import React, { useState } from 'react';


const STAGES = ['Draft', 'MainCon QC Pass', 'Submitted to RTO', 'Cleared to Cast'];

export default function InspectionsView({ inspections, onAdd, onUpdate, currentUser, zones }) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterDiscipline, setFilterDiscipline] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRfi, setEditingRfi] = useState(null);
  const [formData, setFormData] = useState({
    id: '', zone: '', discipline: 'Structural', element: '', rtoName: '', reName: '', targetCast: '', stage: 0, conquasScore: 'Pending', bbsLinked: ''
  });

  const isPrivileged = ['admin', 'manager', 'engineer'].includes(currentUser?.systemRole);

  const handleAdvance = async (id) => {
    if (!isPrivileged || saving) return;
    const item = inspections.find((i) => i.id === id);
    if (item && item.stage < 3) {
      setSaving(true); setError('');
      try { await onUpdate(item.id, { stage: item.stage + 1 }); } catch (e) { setError(e.message); } finally { setSaving(false); }
    }
  };

  const handleOpenModal = (rfi = null) => {
    if (rfi) {
      setEditingRfi(rfi);
      setFormData(rfi);
    } else {
      setEditingRfi(null);
      setFormData({ id: '', zone: '', discipline: 'Structural', element: '', rtoName: '', reName: '', targetCast: '', stage: 0, conquasScore: 'Pending', bbsLinked: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); if (!isPrivileged) return;
    setError(''); setSaving(true);
    try {
      if (editingRfi) await onUpdate(editingRfi.id, formData);
      else await onAdd(formData);
      setIsModalOpen(false);
    } catch (e) { setError(e.message || 'Could not save inspection.'); }
    finally { setSaving(false); }
  };


  const filtered = filterDiscipline === 'All'
    ? inspections
    : inspections.filter((i) => i.discipline === filterDiscipline);

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {/* Header & Filter Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            BCA Statutory & RE/RTO Inspection Matrix (RFI)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track inspection clearance and link hold points to site planning activities.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
          {isPrivileged && (
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg px-4 py-2 transition"
            >
              + Add RFI
            </button>
          )}
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
                  {rfi.stage < 3 && isPrivileged ? (
                    <button
                      disabled={saving} onClick={() => handleAdvance(rfi.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-xs transition"
                    >
                      Advance Sign-Off →
                    </button>
                  ) : (
                    <span className="px-3.5 py-2 rounded-lg font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      {rfi.stage === 3 ? '✓ Inspection cleared' : 'Awaiting sign-off'}
                    </span>
                  )}
                  {(currentUser?.systemRole === 'admin' || (isPrivileged && rfi.createdBy === currentUser?.email)) && (
                    <button
                      onClick={() => handleOpenModal(rfi)}
                      className="ml-2 px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                    >
                      Edit
                    </button>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-xl">
            <h3 className="text-lg font-bold mb-4">{editingRfi ? 'Edit RFI' : 'Add RFI'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {error && <p role="alert" className="text-red-700">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">RFI ID</label>
                  <input required disabled={!!editingRfi} type="text" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Zone</label>
                  <select required value={formData.zone} onChange={e => setFormData({...formData, zone: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2">
                    <option value="" disabled>Select Zone</option>
                    {zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Discipline</label>
                  <select required value={formData.discipline} onChange={e => setFormData({...formData, discipline: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2">
                    <option value="Structural">Structural</option>
                    <option value="M&E Sleeve / Conduit">M&E Sleeve / Conduit</option>
                    <option value="Architectural">Architectural</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Element</label>
                  <input required type="text" value={formData.element} onChange={e => setFormData({...formData, element: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Assigned RTO</label>
                  <input type="text" value={formData.rtoName} onChange={e => setFormData({...formData, rtoName: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Assigned RE</label>
                  <input type="text" value={formData.reName} onChange={e => setFormData({...formData, reName: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Target Cast</label>
                  <input required type="date" value={formData.targetCast} onChange={e => setFormData({...formData, targetCast: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Linked BBS</label>
                  <input type="text" value={formData.bbsLinked} onChange={e => setFormData({...formData, bbsLinked: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">Cancel</button>
                <button disabled={saving} type="submit" className="px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold text-white">Save RFI</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
