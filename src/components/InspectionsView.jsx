import React, { useState } from 'react';
import { RecordModal } from './RecordForm';
import DeleteRecordAction from './DeleteRecordAction';


import { INSPECTION_STAGES as STAGES, canRecordSite, canAdvanceInspection, canEditInspection, canCommentInspection, isInspectionClosed } from '../utils/siteData';

const emptyForm = () => ({ id: '', zone: '', discipline: '', element: '', rtoName: '', reName: '', targetCast: '', bbsLinked: '' });

export default function InspectionsView({ inspections, onAdd, onUpdate, onAdvance, onComment, currentUser, zones }) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterDiscipline, setFilterDiscipline] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRfi, setEditingRfi] = useState(null);
  const [formData, setFormData] = useState(emptyForm());

  const [commentInputs, setCommentInputs] = useState({});
  const [expandedRfi, setExpandedRfi] = useState(null);

  const isPrivileged = canRecordSite(currentUser);

  const handleAdvance = async (id) => {
    const item = inspections.find(i => i.id === id);
    if (!canAdvanceInspection(currentUser, item) || saving) return;
    setSaving(true); setError('');
    try { await onAdvance(id, item.stage); } catch (e) { setError(e.message); } finally { setSaving(false); }
  };
  const handleAddComment = async id => {
    const text = commentInputs[id]?.trim();
    if (!text || saving || !canCommentInspection(currentUser)) return;
    setSaving(true); setError('');
    try { await onComment(id, text); setCommentInputs(prev => ({ ...prev, [id]: '' })); }
    catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const handleOpenModal = (rfi = null) => {
    if (rfi) {
      setEditingRfi(rfi);
      setFormData(Object.fromEntries(Object.keys(emptyForm()).map(key => [key, rfi[key] || ''])));
    } else {
      setEditingRfi(null);
      setFormData(emptyForm());
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async e => {
    e.preventDefault(); if (!isPrivileged || editingRfi && !canEditInspection(currentUser, editingRfi)) return;
    setSaving(true); setError('');
    try {
      if (editingRfi) await onUpdate(editingRfi.id, formData);
      else await onAdd({ ...formData, stage: 0, history: [], comments: [] });
      setIsModalOpen(false);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
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
            Track five-stage RFI review and closure. Linked planning hold points remain unresolved until the inspection is Closed.
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
          const isCleared = isInspectionClosed(rfi);
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
                  {!isCleared && canAdvanceInspection(currentUser, rfi) ? (
                    <button
                      disabled={saving} onClick={() => handleAdvance(rfi.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-xs transition"
                    >
                      Advance Sign-Off →
                    </button>
                  ) : isCleared ? (
                    <span className="px-3.5 py-2 rounded-lg font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      ✓ Inspection closed
                    </span>
                  ) : <span className="text-xs text-slate-500">Awaiting authorised stage review</span>}
                  <DeleteRecordAction collection="inspections" record={rfi} />
                  {canEditInspection(currentUser, rfi) && (
                    <button
                      onClick={() => handleOpenModal(rfi)}
                      className="ml-2 px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {/* 5-Stage ISO 19650 / BCA Stepper */}
              <div className="mt-4 grid grid-cols-5 gap-2">
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

              {/* Comments & History Section */}
              <div className="mt-4 border-t border-slate-100 pt-4">
                <button
                  onClick={() => setExpandedRfi(expandedRfi === rfi.id ? null : rfi.id)}
                  className="text-xs font-bold text-blue-600 hover:underline mb-2"
                >
                  {expandedRfi === rfi.id ? 'Hide Comments & History' : `Show Comments & History (${(rfi.comments?.length || 0) + (rfi.history?.length || 0)})`}
                </button>

                {expandedRfi === rfi.id && (
                  <div className="space-y-4 mt-3">
                    <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                      {[...(rfi.history || []).map(h => ({ ...h, type: 'history' })), ...(rfi.comments || []).map(c => ({ ...c, type: 'comment' }))]
                        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                        .map((item, idx) => (
                          <div key={idx} className={`p-3 rounded-lg text-xs ${item.type === 'history' ? 'bg-slate-50 border border-slate-200 text-slate-500' : 'bg-blue-50 border border-blue-100 text-slate-800'}`}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold">{item.user} <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 ml-1">{item.role}</span></span>
                              <span className="text-[10px] opacity-70">{new Date(item.timestamp).toLocaleString()}</span>
                            </div>
                            <div>{item.type === 'history' ? <span className="italic">{item.action}</span> : item.text}</div>
                          </div>
                      ))}
                      {(!rfi.history?.length && !rfi.comments?.length) && <div className="text-xs text-slate-400 italic">No comments or history yet.</div>}
                    </div>

                    {canCommentInspection(currentUser) && <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        aria-label={`Comment on ${rfi.id}`} placeholder="Add a comment..."
                        value={commentInputs[rfi.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [rfi.id]: e.target.value }))}
                        className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                        onKeyDown={(e) => { if(e.key === 'Enter') handleAddComment(rfi.id); }}
                      />
                      <button
                        disabled={saving} onClick={() => handleAddComment(rfi.id)}
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition"
                      >
                        Send
                      </button>
                    </div>}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {isModalOpen && <RecordModal title={editingRfi ? 'Edit RFI' : 'Add RFI'} onClose={() => { if (!saving) setIsModalOpen(false); }}>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {error && <p role="alert" className="text-red-700">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">RFI ID</label>
                  <input aria-label="RFI ID" required disabled={!!editingRfi} type="text" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Zone</label>
                  <select aria-label="Zone" required value={formData.zone} onChange={e => setFormData({...formData, zone: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2">
                    <option value="" disabled>Select Zone</option>
                    {zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Discipline</label>
                  <select aria-label="Discipline" required value={formData.discipline} onChange={e => setFormData({...formData, discipline: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2">
                    <option value="">Select discipline</option>
                    <option value="Structural">Structural</option>
                    <option value="M&E Sleeve / Conduit">M&E Sleeve / Conduit</option>
                    <option value="Architectural">Architectural</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Element</label>
                  <input aria-label="Element" required type="text" value={formData.element} onChange={e => setFormData({...formData, element: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Assigned RTO</label>
                  <input aria-label="Assigned RTO" type="text" value={formData.rtoName} onChange={e => setFormData({...formData, rtoName: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Assigned RE</label>
                  <input aria-label="Assigned RE" type="text" value={formData.reName} onChange={e => setFormData({...formData, reName: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Target Cast</label>
                  <input aria-label="Target cast" required type="date" value={formData.targetCast} onChange={e => setFormData({...formData, targetCast: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Linked BBS</label>
                  <input aria-label="Linked BBS" type="text" value={formData.bbsLinked} onChange={e => setFormData({...formData, bbsLinked: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">Cancel</button>
                  <button disabled={saving} type="submit" className="px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold text-white">Save RFI</button>
                </div>
              </div>
            </form>
      </RecordModal>}
    </div>
  );
}
