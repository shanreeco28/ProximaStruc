import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Trash2, Edit } from 'lucide-react';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function MaterialsView({ selectedProject }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    materialName: '',
    doNumber: '',
    masRef: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    qcStatus: 'Pending'
  });

  useEffect(() => {
    if (!selectedProject?.id) return;

    const q = query(collection(db, `artifacts/${selectedProject.id}/materials`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setMaterials(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching materials:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedProject]);

  const handleOpenModal = (material = null) => {
    if (material) {
      setFormData(material);
    } else {
      setFormData({
        id: null,
        materialName: '',
        doNumber: '',
        masRef: '',
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        qcStatus: 'Pending'
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
      const collectionRef = collection(db, `artifacts/${selectedProject.id}/materials`);
      const payload = {
        materialName: formData.materialName,
        doNumber: formData.doNumber,
        masRef: formData.masRef,
        quantity: formData.quantity,
        date: formData.date,
        qcStatus: formData.qcStatus,
        updatedAt: serverTimestamp()
      };

      if (formData.id) {
        await updateDoc(doc(db, `artifacts/${selectedProject.id}/materials`, formData.id), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collectionRef, payload);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving material:", error);
      alert("Failed to save material");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this material record?")) return;
    try {
      await deleteDoc(doc(db, `artifacts/${selectedProject.id}/materials`, id));
    } catch (error) {
      console.error("Error deleting material:", error);
    }
  };

  const filteredData = materials.filter(item =>
    item.materialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.doNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.masRef?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Package className="text-blue-600 dark:text-blue-400" />
            Material Tracking
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Log incoming materials, Delivery Orders, and QC Status</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Log Material
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search materials, DOs, MAS..."
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
                <th className="px-6 py-4 font-semibold">Material</th>
                <th className="px-6 py-4 font-semibold">DO Number</th>
                <th className="px-6 py-4 font-semibold">MAS Ref</th>
                <th className="px-6 py-4 font-semibold">Quantity</th>
                <th className="px-6 py-4 font-semibold">QC Status</th>
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
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No materials logged.</td>
                </tr>
              ) : (
                filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.date}</td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{item.materialName || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.doNumber || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.masRef || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.quantity || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.qcStatus === 'Accepted' ? 'bg-green-100 text-green-700' :
                        item.qcStatus === 'Rejected' ? 'bg-red-100 text-red-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {item.qcStatus}
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
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">{formData.id ? 'Edit Material' : 'Log Material'}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-500">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Material Name/Type</label>
                  <input type="text" name="materialName" value={formData.materialName} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">DO / Receipt No</label>
                  <input type="text" name="doNumber" value={formData.doNumber} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">MAS Ref</label>
                  <input type="text" name="masRef" value={formData.masRef} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Quantity / Unit</label>
                  <input type="text" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="e.g. 50 pallets" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Date Received</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">QC Inspection Status</label>
                <select name="qcStatus" value={formData.qcStatus} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm">
                  <option value="Pending">Pending Testing/Review</option>
                  <option value="Accepted">Accepted / Passed</option>
                  <option value="Rejected">Rejected</option>
                </select>
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
