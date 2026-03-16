import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Shield, Users, Mail, Briefcase, AlertTriangle } from 'lucide-react';

const UserManagementView = ({ selectedProject, user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedProject || user?.role !== 'admin') {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'artifacts', selectedProject.id, 'users'),
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(items);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedProject, user]);

  const handleRoleChange = async (userId, newRole) => {
    if (user?.role !== 'admin' || !selectedProject) return;
    try {
      await updateDoc(doc(db, 'artifacts', selectedProject.id, 'users', userId), { role: newRole });
    } catch (err) {
      alert(`Error updating role: ${err.message}`);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400">You must be an admin to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">User Management</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage roles and permissions for {selectedProject?.name}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold border-y border-slate-200 dark:border-slate-700">
                <th className="p-4">Name</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Designation</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500 italic">No users found for this project.</td>
                </tr>
              ) : (
                users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="p-4 font-medium text-slate-800 dark:text-white">
                    {u.name || 'Unknown User'}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      {u.email}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Briefcase size={14} className="text-slate-400" />
                      {u.designation || 'N/A'}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      u.role === 'admin'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {u.role === 'admin' && <Shield size={12} />}
                      {u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Guest'}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <select
                      value={u.role || 'guest'}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={u.id === user.uid} // Prevent removing own admin rights
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="guest">Guest</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagementView;