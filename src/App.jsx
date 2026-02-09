import React, { useState, useEffect, useMemo, useRef, useLayoutEffect, memo, useCallback } from 'react';
import DeliveryTags from './components/DeliveryTags';
import CalendarView from './components/CalendarView';
import StatusSelect from './components/StatusSelect';
import {
  LayoutDashboard,
  Truck,
  Layers,
  Calendar as CalendarIcon,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  LogOut,
  FileText,
  Hammer,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Database,
  FileSignature,
  PackagePlus,
  Target,
  Edit2,
  Info,
  BarChart3,
  PieChart,
  Printer,
  TrendingUp,
  Activity,
  User,
  Shield,
  Eye,
  Mail,
  Lock,
  CalendarDays,
  Briefcase,
  Link as LinkIcon,
  UserCog,
  Moon,
  Sun
} from 'lucide-react';

// --- Firebase Imports ---
import {
  onAuthStateChanged,
  signInWithCustomToken,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  updateProfile,
  signOut
} from 'firebase/auth';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  arrayUnion,
  setDoc,
  getDoc
} from 'firebase/firestore';

import { auth, db, appId } from './firebase';
import AppLogo from './components/AppLogo';
import LoginView from './components/LoginView';

/**
 * SB-CasTrack v9.0 (Dark Mode Fix)
 * Features:
 * - Removed wrapper classes that conflicted with Dark Mode
 * - Relies on GlobalStyles for base theme colors
 * - Requires darkMode: 'class' in tailwind.config.js
 */

// --- Global Style Reset Component ---
const GlobalStyles = ({ isDark }) => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; }
    :root {
      font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      font-weight: 400;
      color-scheme: ${isDark ? 'dark' : 'light'};
    }
    html { height: 100%; width: 100%; }
    body {
      margin: 0; display: block !important; place-items: unset !important;
      min-width: 320px; min-height: 100vh; width: 100%;
      /* Base background and text colors handled here */
      background-color: ${isDark ? '#0f172a' : '#f8fafc'};
      color: ${isDark ? '#f1f5f9' : '#0f172a'};
      transition: background-color 0.3s ease, color 0.3s ease;
    }
    #root {
      max-width: none !important; margin: 0 !important; padding: 0 !important;
      text-align: left !important; width: 100% !important; height: 100%; display: block !important;
    }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: ${isDark ? '#1e293b' : '#f1f5f9'}; }
    ::-webkit-scrollbar-thumb { background: ${isDark ? '#475569' : '#cbd5e1'}; borderRadius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: ${isDark ? '#64748b' : '#94a3b8'}; }
    @media print {
      body { background-color: white !important; color: black !important; }
      .no-print { display: none !important; }
      @page { size: A4; margin: 20mm; }
      table { break-inside: auto; }
      tr { break-inside: avoid; page-break-inside: avoid; }
      thead { display: table-header-group; }
    }
  `}</style>
);

// --- Helper Components ---


const Card = ({ title, value, icon: Icon, subtext, color = "blue" }) => (
  <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium mb-1">{title}</p>
      <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
      {subtext && <p className={`text-[10px] md:text-xs mt-2 font-medium ${subtext.includes('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>{subtext}</p>}
    </div>
    <div className={`p-2 md:p-3 rounded-lg bg-${color}-50 dark:bg-slate-700 text-${color}-600 dark:text-${color}-400`}>
      <Icon size={20} className="md:w-6 md:h-6" />
    </div>
  </div>
);


const BbsTags = memo(({ bbs, castingDate, onEdit, onDelete, readOnly }) => {
  let list = Array.isArray(bbs) ? bbs : (bbs ? [bbs] : []);
  if (list.length === 0) return <span className="text-slate-400 dark:text-slate-600 italic text-xs">Pending</span>;
  return (
    <div className="flex flex-wrap gap-1 justify-end">
      {list.map((b, idx) => {
        const isObj = typeof b === 'object' && b !== null;
        const text = isObj ? b.number : b;
        const desc = isObj ? b.description : '';
        const actual = isObj ? b.actualDate : '';
        const isCriticalDelay = castingDate && actual && new Date(actual) > new Date(castingDate);
        let tooltip = `${desc || text}`; if (isObj && b.createdBy) tooltip += `\n(Added by: ${b.createdBy})`;
        return (
          <button key={idx} disabled={readOnly} onClick={(e) => { e.stopPropagation(); onEdit && onEdit(idx); }} title={tooltip} className={`font-mono text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap flex items-center gap-1 transition-colors ${isCriticalDelay ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400'} ${readOnly ? 'cursor-default' : ''}`}>
            {text} {isCriticalDelay && <AlertTriangle size={8} className="text-red-500" />}
            {!readOnly && onDelete && (
                <span onClick={(e) => { e.stopPropagation(); onDelete(idx); }} className="ml-1 hover:text-red-500 rounded-full p-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center">
                    <X size={10} />
                </span>
            )}
          </button>
        );
      })}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.bbs === nextProps.bbs &&
    prevProps.castingDate === nextProps.castingDate &&
    prevProps.readOnly === nextProps.readOnly
  );
});


const MobileNav = ({ activeTab, setActiveTab }) => {
  const tabs = [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'tracker', label: 'Tracker', icon: FileText }, { id: 'calendar', label: 'Calendar', icon: CalendarIcon }];
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-2 pb-safe z-50 shadow-lg flex justify-around items-center no-print">
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-full ${activeTab === tab.id ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-700' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
          <tab.icon size={20} className={activeTab === tab.id ? 'fill-current opacity-20' : ''} /><span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};



// --- Main Application Component ---

export default function App() {
  const [user, setUser] = useState(null); 
  const [authLoading, setAuthLoading] = useState(true);
  const [emailConfirmationNeeded, setEmailConfirmationNeeded] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [activeModal, setActiveModal] = useState(null); 
  const [isDark, setIsDark] = useState(false); // Dark Mode State

  const [editingRemark, setEditingRemark] = useState({ id: null, text: '' });
  const [editingSlabId, setEditingSlabId] = useState({ id: null, text: '' });
  const [editBbsState, setEditBbsState] = useState({ slabId: '', bbsIndex: -1, data: {} });
  const [editCastingState, setEditCastingState] = useState({ id: '', target: '', actual: '' });
  const [profileForm, setProfileForm] = useState({ name: '', designation: '' });

  const [slabForm, setSlabForm] = useState({ zone: '', castingDate: '', remarks: '', status: 'Scheduled', actualCastingDate: '' });
  const [bbsForm, setBbsForm] = useState({ selectedSlabId: '', bbsNumber: '', description: '', targetDate: '', actualDate: '' });
  const [deliveryForm, setDeliveryForm] = useState({ selectedSlabId: '', date: '', description: '' });

  // --- Persistent State ---
  useEffect(() => {
    // 1. Auth Init
    const initAuth = async () => {
      try {
        if (isSignInWithEmailLink(auth, window.location.href)) {
          let email = window.localStorage.getItem('emailForSignIn');
          if (!email) {
            setEmailConfirmationNeeded(true);
            setAuthLoading(false);
            return;
          }
          await signInWithEmailLink(auth, email, window.location.href);
          window.localStorage.removeItem('emailForSignIn');
        } else if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try { await signInWithCustomToken(auth, __initial_auth_token); } catch (err) {}
        }
      } catch (error) { console.error("Auth error:", error); }
    };
    initAuth();
    
    // 2. Load LocalStorage items
    const savedTab = localStorage.getItem('sb-tab');
    if (savedTab) setActiveTab(savedTab);
    const savedTheme = localStorage.getItem('sb-theme');
    if (savedTheme) setIsDark(savedTheme === 'dark');

    // 3. Auth Listener
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid));
          if (userDoc.exists()) {
             const userData = { ...currentUser, ...userDoc.data() };
             setUser(userData);
          } else {
             setUser({ ...currentUser, role: 'guest' }); 
          }
        } catch (e) {
          setUser({ ...currentUser, role: 'guest' });
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Effects ---
  useEffect(() => { if (activeTab) localStorage.setItem('sb-tab', activeTab); }, [activeTab]);
  useEffect(() => { 
    localStorage.setItem('sb-theme', isDark ? 'dark' : 'light'); 
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);
  
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'slabs'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(items);
    });
    return () => unsubscribe();
  }, [user]);

  // --- Handlers ---
  const handleLogout = async () => { await signOut(auth); setUser(null); setActiveTab('dashboard'); };
  const checkAdmin = useCallback(() => { if (user?.role !== 'admin') { alert("Permission Denied: Admin access required."); return false; } return true; }, [user]);

  // Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), { name: profileForm.name, designation: profileForm.designation });
      setUser(prev => ({ ...prev, name: profileForm.name, designation: profileForm.designation }));
      setActiveModal(null);
    } catch (err) { alert(err.message); }
  };
  const openProfileModal = () => { setProfileForm({ name: user.name || '', designation: user.designation || '' }); setActiveModal('profile'); };
  const toggleTheme = () => setIsDark(!isDark);

  // CRUD Handlers
  const handleAddSlab = async (e) => {
    e.preventDefault(); if (!checkAdmin()) return;
    const zoneCode = slabForm.zone.trim().split(/\s+/).map(w => w.charAt(0)).join('').toUpperCase();
    const dateCode = slabForm.castingDate ? slabForm.castingDate.replace(/-/g, '').slice(2) : '000000'; 
    const autoSlabId = `${zoneCode}-${dateCode}`;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'slabs'), { 
        ...slabForm, slabId: autoSlabId, bbs: [], deliveries: [], notes: '', createdAt: new Date().toISOString(), createdBy: user.name 
      });
      setActiveModal(null); setSlabForm({ zone: '', castingDate: '', remarks: '', status: 'Scheduled', actualCastingDate: '' });
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleAssignBBS = async (e) => {
    e.preventDefault(); if (!checkAdmin()) return;
    try { 
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slabs', bbsForm.selectedSlabId), { 
        bbs: arrayUnion({ number: bbsForm.bbsNumber, description: bbsForm.description || '', targetDate: bbsForm.targetDate || '', actualDate: bbsForm.actualDate || '', createdBy: user.name }) 
      }); 
      setActiveModal(null); setBbsForm({ selectedSlabId: '', bbsNumber: '', description: '', targetDate: '', actualDate: '' }); 
    } catch (err) { alert(err.message); }
  };

  const handleAddDelivery = async (e) => {
    e.preventDefault(); if (!checkAdmin()) return;
    try { 
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slabs', deliveryForm.selectedSlabId), { 
        deliveries: arrayUnion({ date: deliveryForm.date, description: deliveryForm.description || 'Batch Delivery', createdBy: user.name }) 
      }); 
      setActiveModal(null); setDeliveryForm({ selectedSlabId: '', date: '', description: '' }); 
    } catch (err) { alert(err.message); }
  };

  const deleteEntry = async (id) => { if (!checkAdmin() || !confirm("Delete record?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slabs', id)); } catch (err) { alert(err.message); } };
  const updateStatus = async (item, newStatus) => { if (!checkAdmin()) return; try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slabs', item.id), { status: newStatus }); } catch (err) { alert(err.message); } };
  const startEditingRemark = (item) => { if(!checkAdmin()) return; setEditingRemark({ id: item.id, text: item.remarks || '' }); };
  const saveRemark = async () => { if (!editingRemark.id) return; try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slabs', editingRemark.id), { remarks: editingRemark.text }); setEditingRemark({ id: null, text: '' }); } catch (err) { alert(err.message); } };
  const startEditingSlabId = (item) => { if(!checkAdmin()) return; setEditingSlabId({ id: item.id, text: item.slabId || '' }); };
  const saveSlabId = async () => { if (!editingSlabId.id) return; try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slabs', editingSlabId.id), { slabId: editingSlabId.text }); setEditingSlabId({ id: null, text: '' }); } catch (err) { alert(err.message); } };
  const handleDeleteBBS = async (slab, bbsIndex) => {
    if (!checkAdmin() || !confirm("Delete this BBS?")) return;
    const updated = [...slab.bbs];
    updated.splice(bbsIndex, 1);
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slabs', slab.id), { bbs: updated });
    } catch (err) { alert(err.message); }
  };
  const initiateEditBBS = useCallback((slab, bbsIndex) => { if (!checkAdmin()) return; const item = slab.bbs[bbsIndex]; setEditBbsState({ slabId: slab.id, bbsIndex, data: typeof item === 'object' ? item : { number: item, description: '' } }); setActiveModal('edit-bbs'); }, [checkAdmin, setEditBbsState, setActiveModal]);
  const handleSaveBbsEdit = async (e) => { e.preventDefault(); if (!checkAdmin()) return; const slab = data.find(d => d.id === editBbsState.slabId); if (!slab) return; const updated = [...slab.bbs]; updated[editBbsState.bbsIndex] = editBbsState.data; try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slabs', editBbsState.slabId), { bbs: updated }); setActiveModal(null); } catch (err) { alert(err.message); } };
  const initiateEditCasting = (item) => { if (!checkAdmin()) return; setEditCastingState({ id: item.id, target: item.castingDate || '', actual: item.actualCastingDate || '' }); setActiveModal('edit-casting'); };
  const handleSaveCastingEdit = async (e) => { e.preventDefault(); if (!checkAdmin()) return; const updates = { castingDate: editCastingState.target, actualCastingDate: editCastingState.actual }; if (editCastingState.actual) updates.status = 'Cast'; try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slabs', editCastingState.id), updates); setActiveModal(null); } catch (err) { alert(err.message); } };

  // --- Metrics ---
  const metrics = useMemo(() => {
    const total = data.length;
    const cast = data.filter(d => d.status === 'Cast').length;
    const delivered = data.filter(d => Array.isArray(d.deliveries) && d.deliveries.length > 0).length;
    const pending = data.filter(d => d.status === 'Scheduled').length;
    let early = 0, onTime = 0, late = 0;
    data.filter(d => d.status === 'Cast' && d.castingDate && d.actualCastingDate).forEach(d => {
      const t = new Date(d.castingDate).getTime(); const a = new Date(d.actualCastingDate).getTime();
      if (a < t) early++; else if (a > t) late++; else onTime++;
    });
    const totalBBS = data.reduce((acc, curr) => acc + (Array.isArray(curr.bbs) ? curr.bbs.length : 0), 0);
    const deliveredBBS = data.reduce((acc, curr) => acc + (Array.isArray(curr.bbs) ? curr.bbs.filter(b => b.actualDate).length : 0), 0);
    return { total, cast, delivered, pending, early, onTime, late, totalBBS, deliveredBBS };
  }, [data]);

  const filteredData = data.filter(item => {
    const textMatch = (item.slabId || '').toLowerCase().includes(searchQuery.toLowerCase()) || (Array.isArray(item.bbs) ? item.bbs.map(b => (typeof b === 'object' ? b.number : b)).join(' ') : '').toLowerCase().includes(searchQuery.toLowerCase()) || (item.zone || '').toLowerCase().includes(searchQuery.toLowerCase());
    let dateMatch = true;
    if (dateFilter.start && dateFilter.end && item.castingDate) {
      const cDate = new Date(item.castingDate);
      const sDate = new Date(dateFilter.start);
      const eDate = new Date(dateFilter.end);
      dateMatch = cDate >= sDate && cDate <= eDate;
    }
    return textMatch && dateMatch;
  });

  const ReportView = () => (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <div><h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2"><BarChart3 className="text-blue-600" /> Executive Project Report</h3><p className="text-xs text-slate-500 mt-1">Generated: {new Date().toLocaleDateString()}</p></div>
          <div className="flex gap-2 no-print"><button aria-label="Print report" onClick={() => window.print()} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors hidden md:block"><Printer size={20} /></button><button aria-label="Close report" onClick={() => setActiveModal(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X size={24} /></button></div>
        </div>
        <div className="overflow-y-auto p-8 space-y-8 print:p-0">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700"><p className="text-xs font-bold text-slate-500 uppercase">Total Scope</p><p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{metrics.total}</p></div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800"><p className="text-xs font-bold text-emerald-600 uppercase">Completed</p><p className="text-3xl font-bold text-emerald-900 dark:text-emerald-400 mt-1">{metrics.cast} <span className="text-sm font-normal">({Math.round((metrics.cast/metrics.total)*100 || 0)}%)</span></p></div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800"><p className="text-xs font-bold text-blue-600 uppercase">Scheduled</p><p className="text-3xl font-bold text-blue-900 dark:text-blue-400 mt-1">{metrics.pending}</p></div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800"><p className="text-xs font-bold text-red-600 uppercase">Delayed / Late</p><p className="text-3xl font-bold text-red-900 dark:text-red-400 mt-1">{metrics.late + data.filter(d => d.status === 'Delayed').length}</p></div>
          </div>
          
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-800/50">
            <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Truck size={18} /> Logistics & BBS Performance</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-3">
                 <p className="text-sm font-bold text-slate-600 dark:text-slate-300">BBS Delivery Status</p>
                 <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1"><span>{metrics.deliveredBBS} Delivered</span><span>{metrics.totalBBS} Total Orders</span></div>
                 <div className="h-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full overflow-hidden"><div style={{ width: `${(metrics.deliveredBBS / Math.max(metrics.totalBBS, 1)) * 100}%` }} className="bg-indigo-500 h-full"></div></div>
                 <p className="text-xs text-right text-indigo-600 dark:text-indigo-400 font-medium">{Math.round((metrics.deliveredBBS / Math.max(metrics.totalBBS, 1)) * 100)}% Fulfilled</p>
               </div>
               <div className="space-y-3">
                 <p className="text-sm font-bold text-slate-600 dark:text-slate-300">HCS Batch Tracking</p>
                 <div className="flex justify-between items-center bg-white dark:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-600"><span className="text-xs text-slate-600 dark:text-slate-300">Zones Fully Delivered</span><span className="font-mono font-bold text-amber-600">{metrics.delivered}</span></div>
                 <div className="flex justify-between items-center bg-white dark:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-600"><span className="text-xs text-slate-600 dark:text-slate-300">Total Batches Logged</span><span className="font-mono font-bold text-slate-800 dark:text-white">{data.reduce((acc, curr) => acc + (curr.deliveries?.length || 0), 0)}</span></div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6"><h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><TrendingUp size={18} /> Schedule Adherence</h4><div className="space-y-4"><div><div className="flex justify-between text-sm mb-1 text-slate-600 dark:text-slate-300"><span>Early Completion</span> <span className="font-bold text-emerald-600">{metrics.early}</span></div><div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div style={{width: `${(metrics.early/metrics.cast)*100 || 0}%`}} className="h-full bg-emerald-500"></div></div></div><div><div className="flex justify-between text-sm mb-1 text-slate-600 dark:text-slate-300"><span>On-Time</span> <span className="font-bold text-slate-600 dark:text-slate-400">{metrics.onTime}</span></div><div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div style={{width: `${(metrics.onTime/metrics.cast)*100 || 0}%`}} className="h-full bg-slate-400"></div></div></div><div><div className="flex justify-between text-sm mb-1 text-slate-600 dark:text-slate-300"><span>Late / Delayed</span> <span className="font-bold text-red-600">{metrics.late}</span></div><div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div style={{width: `${(metrics.late/metrics.cast)*100 || 0}%`}} className="h-full bg-red-500"></div></div></div></div></div>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6"><h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Activity size={18} /> Site Efficiency</h4><div className="space-y-4 text-sm"><div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700 rounded"><span className="text-slate-600 dark:text-slate-300">Pending HCS</span><span className="font-bold text-slate-800 dark:text-white">{metrics.total - metrics.delivered} Zones</span></div><div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700 rounded"><span className="text-slate-600 dark:text-slate-300">Active Issues (Remarks)</span><span className="font-bold text-slate-800 dark:text-white">{data.filter(i => i.remarks).length}</span></div><div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700 rounded"><span className="text-slate-600 dark:text-slate-300">Critical Path Delays</span><span className="font-bold text-red-600">{data.filter(i => i.status === 'Delayed').length}</span></div></div></div>
          </div>
          <div><h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><AlertTriangle size={18} /> Risk Register (Critical Delays)</h4><table className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"><thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase text-slate-500 font-bold"><tr><th className="p-3 text-left">Zone / ID</th><th className="p-3 text-left">Planned Date</th><th className="p-3 text-left">Actual Date</th><th className="p-3 text-left">Remarks / Impact</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700">{data.filter(i => i.status === 'Delayed' || (i.castingDate && i.actualCastingDate && new Date(i.actualCastingDate) > new Date(i.castingDate))).map(item => (<tr key={item.id} className="text-slate-600 dark:text-slate-300"><td className="p-3 font-medium text-slate-800 dark:text-white">{item.slabId} <br/><span className="text-xs text-slate-400 font-normal">{item.zone}</span></td><td className="p-3">{item.castingDate}</td><td className="p-3 text-red-600 font-bold">{item.actualCastingDate || 'Pending'}</td><td className="p-3 italic">{item.remarks || 'No specific remarks'}</td></tr>))}</tbody></table></div>

          <div className="break-before-page"><h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Hammer size={18} /> Casting Schedule</h4><table className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"><thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase text-slate-500 font-bold"><tr><th className="p-3 text-left">Date</th><th className="p-3 text-left">Zone / Level</th><th className="p-3 text-left">Casting ID</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Remarks</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700">{data.slice().sort((a,b) => new Date(a.castingDate || '9999-12-31') - new Date(b.castingDate || '9999-12-31')).map(item => (<tr key={item.id} className="text-slate-600 dark:text-slate-300"><td className="p-3 whitespace-nowrap">{item.castingDate || '-'}</td><td className="p-3 font-medium text-slate-800 dark:text-white">{item.zone}</td><td className="p-3 font-mono text-xs">{item.slabId}</td><td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'Cast' ? 'bg-emerald-100 text-emerald-800' : item.status === 'Delayed' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{item.status}</span></td><td className="p-3 italic text-xs max-w-[200px] truncate">{item.remarks}</td></tr>))}</tbody></table></div>
        </div>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-slate-800 dark:text-white">Project Overview</h2><button onClick={() => setActiveModal('report')} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"><BarChart3 size={18} /> Generate Report</button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Total Casts" value={metrics.total} icon={Layers} subtext="Total scope" color="slate" />
        <Card title="HCS Delivered" value={metrics.delivered} icon={Truck} subtext="Zones with deliveries" color="amber" />
        <Card title="Completed" value={metrics.cast} icon={CheckCircle2} subtext={`${metrics.total > 0 ? Math.round((metrics.cast/metrics.total)*100) : 0}% progress`} color="emerald" />
        <Card title="Pending Logistics" value={metrics.pending} icon={Clock} subtext="Scheduled to Cast" color="blue" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 md:p-6">
          <div className="flex justify-between items-center mb-4 md:mb-6"><h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><CalendarIcon className="text-blue-500" size={20} /> Upcoming Castings</h2><button onClick={() => setActiveTab('calendar')} className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium">View Full Schedule</button></div>
          <div className="space-y-4">{data.filter(i => i.status !== 'Cast' && i.castingDate).sort((a, b) => new Date(a.castingDate) - new Date(b.castingDate)).slice(0, 3).map((item) => (<div key={item.id} className="flex items-center justify-between p-3 md:p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600"><div className="flex items-center gap-3 md:gap-4"><div className="bg-white dark:bg-slate-600 p-2 rounded border border-slate-200 dark:border-slate-500 font-mono text-xs font-bold text-slate-600 dark:text-slate-300 text-center min-w-[40px] md:min-w-[50px]">{new Date(item.castingDate).getDate()}<br/>{new Date(item.castingDate).toLocaleString('default', { month: 'short' }).toUpperCase()}</div><div><h4 className="text-sm md:text-base font-bold text-slate-800 dark:text-white">{item.slabId}</h4><p className="text-xs text-slate-500">{item.zone}</p></div></div><div className="text-right"><div className="text-xs text-slate-400 mb-1 flex justify-end"><BbsTags bbs={item.bbs} castingDate={item.castingDate} /></div><StatusSelect disabled={true} currentStatus={item.status} targetDate={item.castingDate} actualDate={item.actualCastingDate} onChange={() => {}} /></div></div>))}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 md:p-6">
           <div className="flex justify-between items-center mb-4 md:mb-6"><h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><AlertTriangle className="text-amber-500" size={20} /> Alerts</h2></div>
           <div className="space-y-3"><div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg flex items-start gap-3"><AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" /><div><h4 className="text-sm font-bold text-red-700 dark:text-red-400">Missing BBS</h4><p className="text-xs text-red-600 dark:text-red-300 mt-1">{data.filter(i => !i.bbs || (Array.isArray(i.bbs) && i.bbs.length === 0)).length} zones pending BBS.</p></div></div></div>
        </div>
      </div>
    </div>
  );

  const TrackerView = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-2 w-full"><div className="relative w-full md:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm outline-none w-full" /></div><div className="flex items-center gap-2 w-full md:w-auto"><input type="date" value={dateFilter.start} onChange={e => setDateFilter({...dateFilter, start: e.target.value})} className="px-2 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-xs outline-none" /><span className="text-slate-400">-</span><input type="date" value={dateFilter.end} onChange={e => setDateFilter({...dateFilter, end: e.target.value})} className="px-2 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-xs outline-none" />{(dateFilter.start || dateFilter.end) && (<button aria-label="Clear date filter" onClick={() => setDateFilter({start: '', end: ''})} className="text-slate-400 hover:text-red-500"><X size={16}/></button>)}</div></div>
        {user?.role === 'admin' && (<div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto"><button onClick={() => setActiveModal('bbs')} className="col-span-1 flex items-center justify-center gap-1 md:gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors border border-slate-200 dark:border-slate-600"><FileSignature size={16} /><span className="truncate">Assign BBS</span></button><button onClick={() => setActiveModal('delivery')} className="col-span-1 flex items-center justify-center gap-1 md:gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors border border-slate-200 dark:border-slate-600"><PackagePlus size={16} /><span className="truncate">Log HCS</span></button><button onClick={() => setActiveModal('slab')} className="col-span-2 md:col-span-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"><Plus size={18} /> Add Casting</button></div>)}
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-700"><th className="p-4">Casting ID</th><th className="p-4">Zone / Level</th><th className="p-4">Remarks</th><th className="p-4">BBS Number</th><th className="p-4">HCS Delivery</th><th className="p-4">Casting Dates</th><th className="p-4">Status</th>{user?.role === 'admin' && <th className="p-4 text-right">Actions</th>}</tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-700 dark:text-slate-300">
                <td className="p-4 font-bold text-slate-800 dark:text-white align-top" onDoubleClick={() => startEditingSlabId(item)}>{editingSlabId.id === item.id ? (<input autoFocus type="text" className="w-full bg-white dark:bg-slate-800 border border-blue-300 rounded px-2 py-1 text-sm outline-none" value={editingSlabId.text} onChange={(e) => setEditingSlabId({...editingSlabId, text: e.target.value})} onBlur={saveSlabId} onKeyDown={(e) => e.key === 'Enter' && saveSlabId()} />) : (<div className={user?.role==='admin'?'cursor-pointer hover:text-blue-600':''}>{item.slabId}</div>)}</td>
                <td className="p-4 align-top">{item.zone}</td>
                <td className="p-4 align-top max-w-[200px]" onDoubleClick={() => startEditingRemark(item)}>{editingRemark.id === item.id ? (<input autoFocus type="text" className="w-full bg-white dark:bg-slate-800 border border-blue-300 rounded px-2 py-1 text-sm outline-none" value={editingRemark.text} onChange={(e) => setEditingRemark({...editingRemark, text: e.target.value})} onBlur={saveRemark} onKeyDown={(e) => e.key === 'Enter' && saveRemark()} />) : (<div className={`truncate ${user?.role==='admin'?'cursor-pointer hover:text-blue-600':''}`}>{item.remarks || <span className="text-slate-300 italic">--</span>}</div>)}</td>
                <td className="p-4 align-top"><BbsTags bbs={item.bbs} castingDate={item.castingDate} onEdit={(idx) => initiateEditBBS(item, idx)} onDelete={(idx) => handleDeleteBBS(item, idx)} readOnly={user?.role !== 'admin'} /></td>
                <td className="p-4 align-top"><DeliveryTags deliveries={item.deliveries} castingDate={item.castingDate} /></td>
                <td className="p-4 text-slate-600 align-top"><div className="flex flex-col gap-1"><div className="flex items-center gap-2"><Hammer size={14} className="text-slate-400" /> <span className="text-xs text-slate-500">Target:</span> {item.castingDate}</div>{item.actualCastingDate && (<div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> <span className="text-xs text-slate-500">Actual:</span> <span className="font-bold">{item.actualCastingDate}</span></div>)}{user?.role === 'admin' && <button onClick={() => initiateEditCasting(item)} className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-1"><Edit2 size={10} /> Edit Dates</button>}</div></td>
                <td className="p-4 align-top"><StatusSelect disabled={user?.role !== 'admin'} currentStatus={item.status} targetDate={item.castingDate} actualDate={item.actualCastingDate} onChange={(val) => updateStatus(item, val)} /></td>
                {user?.role === 'admin' && <td className="p-4 text-right align-top"><button aria-label="Delete entry" onClick={() => deleteEntry(item.id)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18} /></button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Card View */}
      <div className="md:hidden bg-slate-50 dark:bg-slate-900 p-4 space-y-4">
        {filteredData.map(item => (
          <div key={item.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 relative">
             <div className="flex justify-between items-start mb-3"><div><h3 className="font-bold text-slate-800 dark:text-white">{item.slabId}</h3><p className="text-xs text-slate-500">{item.zone}</p></div><StatusSelect disabled={user?.role !== 'admin'} currentStatus={item.status} targetDate={item.castingDate} actualDate={item.actualCastingDate} onChange={(val) => updateStatus(item, val)} /></div>
             <div className="space-y-3">
                 <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600"><p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Target Casting</p><div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300"><span className="flex items-center gap-2"><Hammer size={14} className="text-emerald-500" /> {item.castingDate}</span>{user?.role === 'admin' && <button aria-label="Edit casting dates" onClick={() => initiateEditCasting(item)} className="text-slate-400 hover:text-blue-600"><Edit2 size={14} /></button>}</div>{item.actualCastingDate && (<div className="flex items-center gap-2 text-sm text-slate-700 mt-1 pl-6"><span className="text-[10px] text-slate-400 uppercase">Actual:</span><span className="font-bold text-emerald-700 dark:text-emerald-400">{item.actualCastingDate}</span></div>)}</div>
                 <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600" onClick={() => startEditingRemark(item)}><p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Remarks (Tap to edit)</p>{editingRemark.id === item.id ? (<input autoFocus type="text" className="w-full bg-white dark:bg-slate-800 border border-blue-300 rounded px-2 py-1 text-xs outline-none" value={editingRemark.text} onChange={(e) => setEditingRemark({...editingRemark, text: e.target.value})} onBlur={saveRemark} onKeyDown={(e) => e.key === 'Enter' && saveRemark()} />) : (<div className="text-xs text-slate-600 dark:text-slate-300 min-h-[1.25rem]">{item.remarks || <span className="text-slate-400 italic">No remarks</span>}</div>)}</div>
                 <div className="grid grid-cols-2 gap-2"><div className="bg-slate-50 dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600"><p className="text-[10px] text-slate-400 uppercase font-bold mb-1">HCS Deliveries</p><DeliveryTags deliveries={item.deliveries} castingDate={item.castingDate} /></div><div className="bg-slate-50 dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600"><p className="text-[10px] text-slate-400 uppercase font-bold mb-1">BBS List</p><BbsTags bbs={item.bbs} castingDate={item.castingDate} onEdit={(idx) => initiateEditBBS(item, idx)} onDelete={(idx) => handleDeleteBBS(item, idx)} readOnly={user?.role !== 'admin'} /></div></div>
             </div>
             {user?.role === 'admin' && (<button aria-label="Delete entry" onClick={() => deleteEntry(item.id)} className="absolute top-4 right-2 text-slate-300 hover:text-red-500 p-2"><X size={16} /></button>)}
          </div>
        ))}
      </div>
    </div>
  );

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-500">Connecting to Cloud...</div>;
  if (!user) return <LoginView initialMode={emailConfirmationNeeded ? 'confirm-email' : 'login'} />;

  return (
    <div className="min-h-screen font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <GlobalStyles isDark={isDark} />
      <nav className="bg-slate-900 text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3"><div className="bg-blue-500 p-1.5 rounded-lg"><AppLogo className="h-8 w-8 text-white" /></div><span className="font-bold text-lg md:text-xl tracking-tight">SB-CasTrack</span></div>
          <div className="hidden md:flex items-center space-x-2">
            {[{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'tracker', label: 'Tracker', icon: FileText }, { id: 'calendar', label: 'Calendar', icon: CalendarIcon }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}><tab.icon size={16} />{tab.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block cursor-pointer" onClick={() => setActiveModal('profile')}>
               <p className="text-sm font-medium text-white">{user.name || user.email}</p>
               <p className="text-[10px] text-slate-400 text-right">{user.designation || 'No Designation'}</p>
             </div>
             <button aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} onClick={toggleTheme} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">{isDark ? <Sun size={20} /> : <Moon size={20} />}</button>
             <button aria-label="Logout" onClick={handleLogout} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"><LogOut size={20} /></button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">{activeTab === 'dashboard' ? DashboardView() : activeTab === 'tracker' ? TrackerView() : <CalendarView data={data} />}</main>
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl md:rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0"><h3 className="font-bold text-lg text-slate-800 dark:text-white">Action</h3><button aria-label="Close modal" onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
            <div className="overflow-y-auto p-6">
               {activeModal === 'slab' && <form onSubmit={handleAddSlab} className="space-y-4"> <div className="grid grid-cols-2 gap-4"> <div className="col-span-2"> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Zone / Level</label> <input required type="text" placeholder="e.g. Zone B Level 6" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={slabForm.zone} onChange={e => setSlabForm({...slabForm, zone: e.target.value})} /> </div> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Target Casting Date</label> <input required type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={slabForm.castingDate} onChange={e => setSlabForm({...slabForm, castingDate: e.target.value})} /> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Remarks</label> <textarea placeholder="Notes..." className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm h-24 resize-none" value={slabForm.remarks} onChange={e => setSlabForm({...slabForm, remarks: e.target.value})} /> </div> <div className="pt-4"> <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg">Create Plan</button> </div> </form>}
               {activeModal === 'bbs' && <form onSubmit={handleAssignBBS} className="space-y-4"> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Select Casting Zone</label> <select required className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none bg-white" value={bbsForm.selectedSlabId} onChange={e => setBbsForm({...bbsForm, selectedSlabId: e.target.value})}> <option value="">-- Choose Zone --</option> {data.map(s => <option key={s.id} value={s.id}>{s.zone} ({s.slabId})</option>)} </select> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">BBS Number</label> <input required type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" value={bbsForm.bbsNumber} onChange={e => setBbsForm({...bbsForm, bbsNumber: e.target.value})} /> </div> <div className="grid grid-cols-2 gap-4"> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Target</label> <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" value={bbsForm.targetDate} onChange={e => setBbsForm({...bbsForm, targetDate: e.target.value})} /> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Actual</label> <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" value={bbsForm.actualDate} onChange={e => setBbsForm({...bbsForm, actualDate: e.target.value})} /> </div> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Desc</label> <input type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" value={bbsForm.description} onChange={e => setBbsForm({...bbsForm, description: e.target.value})} /> </div> <div className="pt-4"> <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg">Assign</button> </div> </form>}
               {activeModal === 'delivery' && <form onSubmit={handleAddDelivery} className="space-y-4"> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Select Zone</label> <select required className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none bg-white" value={deliveryForm.selectedSlabId} onChange={e => setDeliveryForm({...deliveryForm, selectedSlabId: e.target.value})}> <option value="">-- Choose Zone --</option> {data.map(s => <option key={s.id} value={s.id}>{s.slabId}</option>)} </select> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Actual Date</label> <input required type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" value={deliveryForm.date} onChange={e => setDeliveryForm({...deliveryForm, date: e.target.value})} /> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Batch Info</label> <input type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" value={deliveryForm.description} onChange={e => setDeliveryForm({...deliveryForm, description: e.target.value})} /> </div> <div className="pt-4"> <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg">Log Delivery</button> </div> </form>}
               {activeModal === 'edit-bbs' && <form onSubmit={handleSaveBbsEdit} className="space-y-4"> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">BBS Number</label> <input required type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" value={editBbsState.data.number} onChange={e => setEditBbsState({...editBbsState, data: { ...editBbsState.data, number: e.target.value }})} /> </div> <div className="grid grid-cols-2 gap-4"> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Target</label> <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" value={editBbsState.data.targetDate || ''} onChange={e => setEditBbsState({...editBbsState, data: { ...editBbsState.data, targetDate: e.target.value }})} /> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Actual</label> <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" value={editBbsState.data.actualDate || ''} onChange={e => setEditBbsState({...editBbsState, data: { ...editBbsState.data, actualDate: e.target.value }})} /> </div> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Desc</label> <input type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" value={editBbsState.data.description || ''} onChange={e => setEditBbsState({...editBbsState, data: { ...editBbsState.data, description: e.target.value }})} /> </div> <div className="pt-4"> <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">Update</button> </div> </form>}
               {activeModal === 'edit-casting' && <form onSubmit={handleSaveCastingEdit} className="space-y-4"> <div className="grid grid-cols-2 gap-4"> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Target</label> <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" value={editCastingState.target} onChange={e => setEditCastingState({...editCastingState, target: e.target.value})} /> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Actual</label> <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" value={editCastingState.actual} onChange={e => setEditCastingState({...editCastingState, actual: e.target.value})} /> </div> </div> <div className="pt-4"> <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">Save Dates</button> </div> </form>}
               {activeModal === 'profile' && <form onSubmit={handleUpdateProfile} className="space-y-4"> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Name</label> <input type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} /> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Designation</label> <input type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" value={profileForm.designation} onChange={e => setProfileForm({...profileForm, designation: e.target.value})} /> </div> <div className="pt-4"> <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">Save Profile</button> </div> </form>}
               {activeModal === 'report' && <ReportView />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}