import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Activity, Save, Trash2, Plus, FileText } from 'lucide-react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const SiteDiaryView = ({ selectedProject, user, locations }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({
    location: '',
    subcon: '',
    activity: '',
    manpower: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedProject?.id || !selectedDate) return;

    const q = query(
      collection(db, 'artifacts', selectedProject.id, 'public', 'data', 'site_diary'),
      where('date', '==', selectedDate),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEntries(items);
    }, (error) => {
        console.error("Error fetching diary entries:", error);
    });

    return () => unsubscribe();
  }, [selectedProject?.id, selectedDate]);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!selectedProject?.id || !user) return;
    if (!formData.location || !formData.activity) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'artifacts', selectedProject.id, 'public', 'data', 'site_diary'), {
          date: selectedDate,
          location: formData.location,
          subcon: formData.subcon || '',
          activity: formData.activity,
          manpower: formData.manpower || '',
          createdBy: user.name || user.email,
          uid: user.uid,
          createdAt: new Date().toISOString()
      });
      setFormData({
        location: '',
        subcon: '',
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
          <FileText className="text-soilOrange-500" /> Site Diary & Daily Reporting
        </h2>

        {/* Date Selection */}
        <div className="flex items-center gap-4 mb-8">
            <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-soilOrange-500"
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
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Location / Zone</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                list="locations-list"
                                type="text"
                                placeholder="Select or type location..."
                                className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                value={formData.location}
                                onChange={e => setFormData({...formData, location: e.target.value})}
                                required
                            />
                            <datalist id="locations-list">
                                {locations && locations.map((loc, idx) => (
                                    <option key={idx} value={loc.zone || loc.slabId} />
                                ))}
                            </datalist>
                        </div>
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Sub-contractor</label>
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="e.g. Acme Corp"
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
                        className="w-full bg-soilOrange-500 hover:bg-soilOrange-600 text-white font-bold py-2 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? 'Saving...' : <><Plus size={18} /> Add Entry</>}
                    </button>
                </form>
            </div>

            {/* Daily Summary List */}
            <div className="lg:col-span-2">
                 <h3 className="font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 flex justify-between items-center">
                    <span>Daily Summary</span>
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
                                     <div className="flex items-center gap-2">
                                         <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold px-2 py-1 rounded border border-blue-200 dark:border-blue-800">
                                             {entry.location}
                                         </span>
                                         {entry.subcon && (
                                             <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                                 <Users size={12} /> {entry.subcon}
                                             </span>
                                         )}
                                     </div>
                                     <div className="text-[10px] text-slate-400">
                                         {entry.createdAt && new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                     </div>
                                 </div>
                                 <p className="text-sm text-slate-700 dark:text-slate-300 mb-2 whitespace-pre-wrap">{entry.activity}</p>
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
  );
};

export default SiteDiaryView;
