import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, MapPin, Users, Activity, Plus, FileText, Trash2, Printer } from 'lucide-react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { usePrintMode } from '../hooks/usePrintMode';

// Constants for Dropdowns
const LEVELS = ['Basement', ...Array.from({length: 10}, (_, i) => `L${i+1}`), 'Roof', 'Ramp'];
const ZONES = ['A1', 'A2', 'B1', 'B2-A', 'B2-B', 'C', 'D (Ramp)', 'E (STC 4)'];
const RAMP_LEVELS = Array.from({length: 9}, (_, i) => `Level ${i+1} - Level ${i+2}`);
const RAMP_PARTS = ['Part 1', 'Part 2', 'Part 3'];

const SiteDiaryView = ({ selectedProject, user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState([]);

  // State for form fields
  const [level, setLevel] = useState('L1');
  const [zone, setZone] = useState('A1');
  const [rampLevel, setRampLevel] = useState(RAMP_LEVELS[0]);
  const [rampPart, setRampPart] = useState(RAMP_PARTS[0]);

  const [formData, setFormData] = useState({
    subcon: 'Yizhan Construction',
    activity: '',
    manpower: ''
  });
  const [loading, setLoading] = useState(false);

  usePrintMode(true);

  // Effect to handle Ramp auto-zone logic
  useEffect(() => {
    if (level === 'Ramp') {
        setZone('D (Ramp)');
    } else {
        // If switching away from Ramp, reset zone if it was the forced 'D (Ramp)'
        // or just ensure we have a valid zone.
        // We'll default to 'A1' if the current zone is 'D (Ramp)' to avoid confusion,
        // or keep it if it's a valid manual selection (but 'D (Ramp)' implies Ramp).
        if (zone === 'D (Ramp)') setZone('A1');
    }
  }, [level]);

  useEffect(() => {
    if (!selectedProject?.id || !selectedDate) return;

    const q = query(
      collection(db, 'artifacts', selectedProject.id, 'public', 'data', 'site_diary'),
      where('date', '==', selectedDate)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        items.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
        });
        setEntries(items);
    }, (error) => {
        console.error("Error fetching diary entries:", error);
    });

    return () => unsubscribe();
  }, [selectedProject?.id, selectedDate]);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!selectedProject?.id || !user) return;
    if (!formData.activity) return;

    // Construct Location String
    let locationString = '';
    if (level === 'Ramp') {
        locationString = `${rampLevel} Ramp ${rampPart}`;
    } else {
        locationString = `${level} - Zone ${zone}`;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'artifacts', selectedProject.id, 'public', 'data', 'site_diary'), {
          date: selectedDate,
          location: locationString,
          subcon: formData.subcon || '',
          activity: formData.activity,
          manpower: formData.manpower || '',
          createdBy: user.name || user.email,
          uid: user.uid,
          createdAt: new Date().toISOString()
      });
      // Reset form but keep location selections for quick successive entries
      setFormData({
        subcon: 'Yizhan Construction',
        activity: '',
        manpower: ''
      });
    } catch (err) {
      alert(`Error adding entry: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id) => {
      if (!selectedProject?.id || !confirm("Are you sure you want to delete this entry?")) return;
      try {
          await deleteDoc(doc(db, 'artifacts', selectedProject.id, 'public', 'data', 'site_diary', id));
      } catch (err) {
          alert(`Error deleting entry: ${err.message}`);
      }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0 print:hidden">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 md:p-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
          <FileText className="text-soilOrange-500" /> Site Diary & Daily Reporting
        </h2>

        {/* Date Selection */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
            <div className="relative w-full md:w-auto">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full md:w-auto pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-soilOrange-500"
                />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">
                Viewing report for <span className="font-semibold text-slate-800 dark:text-slate-200">{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Add Entry Form */}
            <div className="lg:col-span-1 space-y-4">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2">Add New Entry</h3>
                <form onSubmit={handleAddEntry} className="space-y-4">
                    {/* Location Dropdowns */}
                    <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Location Selection</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Level</label>
                                <select
                                    className="w-full px-2 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm outline-none"
                                    value={level}
                                    onChange={e => setLevel(e.target.value)}
                                >
                                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Zone</label>
                                <select
                                    className="w-full px-2 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm outline-none disabled:opacity-50"
                                    value={zone}
                                    onChange={e => setZone(e.target.value)}
                                    disabled={level === 'Ramp'}
                                >
                                    {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Ramp Specific Dropdowns */}
                        {level === 'Ramp' && (
                            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div>
                                    <label className="block text-[10px] text-slate-400 mb-1">True Ramp Level</label>
                                    <select
                                        className="w-full px-2 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-xs outline-none"
                                        value={rampLevel}
                                        onChange={e => setRampLevel(e.target.value)}
                                    >
                                        {RAMP_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 mb-1">Ramp Part</label>
                                    <select
                                        className="w-full px-2 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-xs outline-none"
                                        value={rampPart}
                                        onChange={e => setRampPart(e.target.value)}
                                    >
                                        {RAMP_PARTS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                     <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Sub-contractor</label>
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="e.g. Yizhan Construction"
                                className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                value={formData.subcon}
                                onChange={e => setFormData({...formData, subcon: e.target.value})}
                            />
                        </div>
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Activity Description</label>
                        <div className="relative">
                            <Activity className="absolute left-3 top-3 text-slate-400" size={16} />
                            <textarea
                                placeholder="Describe work done..."
                                className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[100px] resize-none"
                                value={formData.activity}
                                onChange={e => setFormData({...formData, activity: e.target.value})}
                                required
                            />
                        </div>
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Manpower / Resources</label>
                        <input
                            type="text"
                            placeholder="e.g. 5 workers, 1 crane"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            value={formData.manpower}
                            onChange={e => setFormData({...formData, manpower: e.target.value})}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-soilOrange-500 hover:bg-soilOrange-600 text-white font-bold py-3 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? 'Saving...' : <><Plus size={18} /> Add Entry</>}
                    </button>
                </form>
            </div>

            {/* Daily Summary List */}
            <div className="lg:col-span-2">
                 <h3 className="font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 flex justify-between items-center">
                    <span className="flex items-center gap-2">Daily Summary
                      <button
                        onClick={handlePrint}
                        className="ml-4 p-1.5 text-slate-500 hover:text-slate-700 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                        title="Print Daily Summary"
                      >
                        <Printer size={14} /> Print
                      </button>
                    </span>
                    <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">{entries.length} Entries</span>
                 </h3>

                 {entries.length === 0 ? (
                     <div className="text-center py-12 text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                         <FileText size={48} className="mx-auto mb-2 opacity-20" />
                         <p>No entries for this date.</p>
                     </div>
                 ) : (
                     <div className="space-y-3">
                         {entries.map(entry => (
                             <div key={entry.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow relative group">
                                 <div className="flex justify-between items-start mb-2">
                                     <div className="flex items-center gap-2 flex-wrap">
                                         <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold px-2 py-1 rounded border border-blue-200 dark:border-blue-800 break-words max-w-[200px] md:max-w-none">
                                             {entry.location}
                                         </span>
                                         {entry.subcon && (
                                             <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                                 <Users size={12} /> {entry.subcon}
                                             </span>
                                         )}
                                     </div>
                                     <div className="text-[10px] text-slate-400 shrink-0 ml-2">
                                         {entry.createdAt && new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                     </div>
                                 </div>
                                 <p className="text-sm text-slate-700 dark:text-slate-300 mb-2 whitespace-pre-wrap break-words">{entry.activity}</p>
                                 {entry.manpower && (
                                     <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded inline-block">
                                         Manpower: <span className="font-semibold text-slate-700 dark:text-slate-200">{entry.manpower}</span>
                                     </div>
                                 )}
                                 <div className="text-[10px] text-slate-400 mt-2 text-right">
                                     Reported by: {entry.createdBy}
                                 </div>

                                 {(user?.role === 'admin' || user?.name === entry.createdBy) && (
                                     <button
                                         onClick={() => handleDeleteEntry(entry.id)}
                                         className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                         title="Delete Entry"
                                     >
                                         <Trash2 size={14} />
                                     </button>
                                 )}
                             </div>
                         ))}
                     </div>
                 )}
            </div>
        </div>
      </div>
    </div>

    {/* Portal-based Print Layout */}
    {createPortal(
      <div className="print-diary-table p-8 font-sans text-black bg-white">
          {/* Header */}
          <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
             <div>
                <h1 className="text-2xl font-bold uppercase tracking-wide mb-1">Daily Site Diary</h1>
                <h2 className="text-lg font-medium">{selectedProject?.name}</h2>
             </div>
             <div className="text-right text-xs leading-relaxed">
                <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Generated By:</strong> {user?.name}</p>
                <p><strong>Total Entries:</strong> {entries.length}</p>
             </div>
          </div>

          {/* Entries Table */}
          {entries.length === 0 ? (
            <div className="border border-black p-8 text-center italic text-sm">
              No diary entries recorded for this date.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="w-24">Location</th>
                  <th className="w-24">Sub-contractor</th>
                  <th>Activity Description</th>
                  <th className="w-24">Manpower</th>
                  <th className="w-24">Reported By</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="break-inside-avoid">
                    <td className="font-bold">{entry.location}</td>
                    <td>{entry.subcon || '-'}</td>
                    <td className="whitespace-pre-wrap">{entry.activity}</td>
                    <td>{entry.manpower || '-'}</td>
                    <td className="italic text-[10px]">{entry.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-black text-center text-[10px] uppercase tracking-widest text-gray-500">
             Generated by SB-CasTrack | Internal Site Record
          </div>
      </div>,
      document.getElementById('print-root')
    )}
    </>
  );
};

export default SiteDiaryView;
