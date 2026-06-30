import React, { useState, useEffect } from 'react';
import { FileCheck, Plus, Search, Filter, Trash2, Edit } from 'lucide-react';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function InspectionsView({ selectedProject }) {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    rfiRef: '',
    area: '',
    trade: '',
    subcon: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Draft',
    remarks: ''
  });

  useEffect(() => {
    if (!selectedProject?.id) return;

    const q = query(collection(db, `artifacts/${selectedProject.id}/inspections`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by date descending
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setInspections(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching inspections:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedProject]);

  const handleOpenModal = (inspection = null) => {
    if (inspection) {
      setFormData(inspection);
    } else {
      setFormData({
        id: null,
        rfiRef: '',
        area: '',
        trade: '',
        subcon: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Draft',
        remarks: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProject?.id) return;

    try {
      const collectionRef = collection(db, `artifacts/${selectedProject.id}/inspections`);
      const payload = {
        rfiRef: formData.rfiRef,
        area: formData.area,
        trade: formData.trade,
        subcon: formData.subcon,
        date: formData.date,
        status: formData.status,
        remarks: formData.remarks,
        updatedAt: serverTimestamp()
      };

      if (formData.id) {
        await updateDoc(doc(db, `artifacts/${selectedProject.id}/inspections`, formData.id), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collectionRef, payload);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving inspection:", error);
      alert("Failed to save inspection");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this inspection?")) return;
    try {
      await deleteDoc(doc(db, `artifacts/${selectedProject.id}/inspections`, id));
    } catch (error) {
      console.error("Error deleting inspection:", error);
    }
  };

  const filteredData = inspections.filter(item =>
    item.rfiRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subcon?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.trade?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileCheck className="text-blue-600 dark:text-blue-400" />
            Inspections & QA/QC
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage RFIs, RE/RTO inspections, and quality checks</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus size={16} /> New Inspection
        </button>
      </div>

      {/* Filters/Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search RFIs, areas, trades, sub-cons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">RFI Ref</th>
                <th className="px-6 py-4 font-semibold">Area/Work</th>
                <th className="px-6 py-4 font-semibold">Trade</th>
                <th className="px-6 py-4 font-semibold">Sub-con</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex justify-center mb-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                    Loading inspections...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No inspections found. Create one to get started.
                  </td>
                </tr>
              ) : (
                filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.date}</td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{item.rfiRef || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.area || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.trade || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.subcon || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        item.status === 'Passed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        item.status === 'Failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        item.status === 'Submitted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleOpenModal(item)} className="p-1 text-slate-400 hover:text-blue-600 transition-colors" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-400 hover:text-red-600 transition-colors ml-2" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {formData.id ? 'Edit Inspection' : 'New Inspection'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">×</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">RFI Ref</label>
                  <input type="text" name="rfiRef" value={formData.rfiRef} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" placeholder="e.g. RFI-STR-001" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Date</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Area / Description of Work</label>
                <input type="text" name="area" value={formData.area} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" placeholder="e.g. Level 1 Slab Zone A" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Trade</label>
                  <input type="text" name="trade" value={formData.trade} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" placeholder="e.g. Structural, M&E" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Sub-contractor</label>
                  <input type="text" name="subcon" value={formData.subcon} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm">
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted (Pending Inspection)</option>
                  <option value="Passed">Passed</option>
                  <option value="Failed">Failed (Rectification Req)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Remarks / Non-compliance Issues</label>
                <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows="3" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm resize-none"></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  Save Inspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
