import React, { useState, useEffect } from 'react';
import { Building2 as Crane, Plus, Search, Trash2, Edit } from 'lucide-react';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function LiftingView({ selectedProject }) {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    planRef: '',
    date: new Date().toISOString().split('T')[0],
    equipment: '',
    subcon: '',
    supervisor: '',
    ptwStatus: 'Pending',
    status: 'Planned',
    safetyNotes: ''
  });

  useEffect(() => {
    if (!selectedProject?.id) return;

    const q = query(collection(db, `artifacts/${selectedProject.id}/lifting`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setOperations(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching lifting operations:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedProject]);

  const handleOpenModal = (operation = null) => {
    if (operation) {
      setFormData(operation);
    } else {
      setFormData({
        id: null,
        planRef: '',
        date: new Date().toISOString().split('T')[0],
        equipment: '',
        subcon: '',
        supervisor: '',
        ptwStatus: 'Pending',
        status: 'Planned',
        safetyNotes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProject?.id) return;

    try {
      const collectionRef = collection(db, `artifacts/${selectedProject.id}/lifting`);
      const payload = {
        planRef: formData.planRef,
        date: formData.date,
        equipment: formData.equipment,
        subcon: formData.subcon,
        supervisor: formData.supervisor,
        ptwStatus: formData.ptwStatus,
        status: formData.status,
        safetyNotes: formData.safetyNotes,
        updatedAt: serverTimestamp()
      };

      if (formData.id) {
        await updateDoc(doc(db, `artifacts/${selectedProject.id}/lifting`, formData.id), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collectionRef, payload);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving lifting operation:", error);
      alert("Failed to save lifting operation");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this operation?")) return;
    try {
      await deleteDoc(doc(db, `artifacts/${selectedProject.id}/lifting`, id));
    } catch (error) {
      console.error("Error deleting lifting operation:", error);
    }
  };

  const filteredData = operations.filter(item =>
    item.planRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.equipment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subcon?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Crane className="text-blue-600 dark:text-blue-400" />
            Lifting Operations
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage lifting plans, equipment, and safety permits</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus size={16} /> New Operation
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search plans, equipment, sub-cons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Plan Ref</th>
                <th className="px-6 py-4 font-semibold">Equipment</th>
                <th className="px-6 py-4 font-semibold">Supervisor</th>
                <th className="px-6 py-4 font-semibold">PTW</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Loading...</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No lifting operations found.</td>
                </tr>
              ) : (
                filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.date}</td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{item.planRef || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.equipment || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.supervisor || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${item.ptwStatus === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {item.ptwStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${item.status === 'Completed' ? 'bg-blue-100 text-blue-700' : item.status === 'Ongoing' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleOpenModal(item)} className="p-1 text-slate-400 hover:text-blue-600 ml-2"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-400 hover:text-red-600 ml-2"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">{formData.id ? 'Edit Operation' : 'New Operation'}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-500">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Plan Ref</label>
                  <input type="text" name="planRef" value={formData.planRef} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Date</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Equipment</label>
                  <input type="text" name="equipment" value={formData.equipment} onChange={handleChange} placeholder="e.g. Mobile Crane 50T" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Supervisor/LE</label>
                  <input type="text" name="supervisor" value={formData.supervisor} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Sub-contractor</label>
                <input type="text" name="subcon" value={formData.subcon} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">PTW Status</label>
                  <select name="ptwStatus" value={formData.ptwStatus} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm">
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Revoked">Revoked</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Operation Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm">
                    <option value="Planned">Planned</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Safety Notes</label>
                <textarea name="safetyNotes" value={formData.safetyNotes} onChange={handleChange} rows="2" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm resize-none"></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
