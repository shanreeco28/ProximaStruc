import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DeliveryTags from './components/DeliveryTags';
import GhostLine from './components/GhostLine';
import ProjectSelection from './components/ProjectSelection';
import AppLogo from './components/AppLogo';
import Card from './components/Card';
import StatusSelect from './components/StatusSelect';
import BbsTags from './components/BbsTags';
import BubbleTooltip from './components/BubbleTooltip';
import MiniCalendar from './components/MiniCalendar';
import MobileNav from './components/MobileNav';
import ProjectTimeline from './components/ProjectTimeline';
import CalendarView from './components/CalendarView';
import SiteDiaryView from './components/SiteDiaryView';
import LoginView from './components/LoginView';
import ReportView from './components/ReportView';
import ExecutiveReportModal from './components/ExecutiveReportModal';
import { auth, db } from './firebase';

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
  ChevronDown,
  X,
  ChevronLeft,
  ChevronRight,
  FileSignature,
  PackagePlus,
  Target,
  Edit2,
  Info,
  BarChart3,
  Printer,
  TrendingUp,
  Activity,
  Shield,
  Mail,
  Moon,
  Sun,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  BookOpen
} from 'lucide-react';

// --- Firebase Imports ---
import {
  onAuthStateChanged,
  signInWithCustomToken,
  isSignInWithEmailLink,
  signInWithEmailLink,
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
  getDoc,
  orderBy,
  limit
} from 'firebase/firestore';

const QUERY_LIMIT = 500;

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
  const [isDark, setIsDark] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [trackerSubTab, setTrackerSubTab] = useState('standard');
  const [tempRegisterData, setTempRegisterData] = useState(null);

  // Project Management State
  const [projects, setProjects] = useState(() => {
     const saved = localStorage.getItem('sb-projects');
     return saved ? JSON.parse(saved) : [{ id: 'tnd4-castrack', name: 'TND4 Project' }];
  });
  const [selectedProject, setSelectedProject] = useState(null);

  const [editingRemark, setEditingRemark] = useState({ id: null, text: '' });
  const [editingSlabId, setEditingSlabId] = useState({ id: null, text: '' });
  const [editBbsState, setEditBbsState] = useState({ slabId: '', bbsIndex: -1, data: {} });
  const [editCastingState, setEditCastingState] = useState({ id: '', target: '', probable: '', actual: '' });
  const [profileForm, setProfileForm] = useState({ name: '', designation: '' });

  const [slabForm, setSlabForm] = useState({ zone: '', castingDate: '', probableCastingDate: '', remarks: '', status: 'Scheduled', actualCastingDate: '' });
  const [bbsForm, setBbsForm] = useState({ selectedSlabId: '', bbsNumber: '', description: '', targetDate: '', actualDate: '' });
  const [deliveryForm, setDeliveryForm] = useState({ selectedSlabId: '', date: '', description: '' });

  // --- Persistent State ---
  useEffect(() => {
    const initAuth = async () => {
      if (import.meta.env.DEV) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('test_mode') === 'true') {
           console.log("Test Mode Activated");
           setUser({ uid: 'test-user', email: 'test@example.com', name: 'Test User', role: 'admin' });
           setSelectedProject({ id: 'tnd4-castrack', name: 'TND4 Project' });
           setAuthLoading(false);
           return;
        }
      }

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
        } else if (typeof window !== 'undefined' && (window).__initial_auth_token && (window).__initial_auth_token) {
          try { await signInWithCustomToken(auth, (window).__initial_auth_token); } catch (err) {
            console.log('Custom token sign in failed:', err);
          }
        }
      } catch (error) { console.error("Auth error:", error); } finally { setAuthLoading(false); }
    };
    initAuth();
    
    // Load simple local storage
    const savedTab = localStorage.getItem('sb-tab');
    if (savedTab) setActiveTab(savedTab);
    const savedTheme = localStorage.getItem('sb-theme');
    if (savedTheme) setIsDark(savedTheme === 'dark');

    // Auth Listener
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('test_mode') === 'true') {
        return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Just set the user auth object. Profile syncing happens when project is selected.
        setUser(currentUser);
      } else {
        setUser(null);
        setSelectedProject(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Project Sync Effect ---
  useEffect(() => {
    localStorage.setItem('sb-projects', JSON.stringify(projects));
  }, [projects]);

  // --- Sync User Profile when Project Selected ---
  useEffect(() => {
    if (!user || !selectedProject) return;

    const syncProfile = async () => {
        const docRef = doc(db, 'artifacts', selectedProject.id, 'users', user.uid);
        try {
            const userDoc = await getDoc(docRef);
            if (userDoc.exists()) {
                setUser(prev => ({ ...prev, ...userDoc.data() }));
            } else {
                // Create profile if missing
                let tempData = tempRegisterData || {};

                // Fallback for legacy / reload
                const localData = localStorage.getItem('temp_user_data');
                if (localData) {
                    try {
                        const parsed = JSON.parse(localData);
                        tempData = { ...parsed, ...tempData };
                        localStorage.removeItem('temp_user_data');
                    } catch (e) { console.error(e); }
                }

                const newProfile = {
                    name: user.displayName || 'Guest',
                    email: user.email,
                    role: 'guest', // Default role
                    designation: tempData.designation || 'N/A',
                    birthday: tempData.birthday || '',
                    createdAt: new Date().toISOString()
                };
                await setDoc(docRef, newProfile);
                setTempRegisterData(null);
                setUser(prev => ({ ...prev, ...newProfile }));
            }
        } catch (err) {
            console.error("Error syncing profile:", err);
            // Fallback to guest if offline or error
            setUser(prev => ({ ...prev, role: 'guest' }));
        }
    };
    syncProfile();
  }, [user?.uid, selectedProject?.id]); // eslint-disable-line react-hooks/exhaustive-deps


  useEffect(() => { if (activeTab) localStorage.setItem('sb-tab', activeTab); }, [activeTab]);
  useEffect(() => { 
    localStorage.setItem('sb-theme', isDark ? 'dark' : 'light'); 
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeModal) {
        setActiveModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal]);
  
  // Data Fetching depends on Project
  useEffect(() => {
    if (!user || !selectedProject) return;

    const q = query(
      collection(db, 'artifacts', selectedProject.id, 'public', 'data', 'slabs'),
      orderBy('castingDate', 'desc'),
      limit(QUERY_LIMIT)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(items);
    }, (error) => {
       console.error("Error fetching data:", error);
       if (import.meta.env.DEV) console.log("Snapshot error", error);
    });
    return () => unsubscribe();
  }, [user?.uid, selectedProject?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Handlers ---
  const handleLogout = async () => {
      await signOut(auth);
      setUser(null);
      setSelectedProject(null);
      setActiveTab('dashboard');
  };
  const checkAdmin = useCallback(() => { if (user?.role !== 'admin') { alert("Permission Denied: Admin access required."); return false; } return true; }, [user]);
  const toggleTheme = () => setIsDark(!isDark);

  // Sorting
  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Project Handlers
  const handleAddProject = (newProj) => {
      if (projects.some(p => p.id === newProj.id)) {
          alert('Project ID already exists.');
          return;
      }
      setProjects([...projects, newProj]);
  };

  // Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await updateDoc(doc(db, 'artifacts', selectedProject.id, 'users', user.uid), { name: profileForm.name, designation: profileForm.designation });
      setUser(prev => ({ ...prev, name: profileForm.name, designation: profileForm.designation }));
      setActiveModal(null);
    } catch (err) { alert(err.message); }
  };


  // CRUD Handlers (Updated to use selectedProject.id)
  const handleAddSlab = async (e) => {
    e.preventDefault(); if (!checkAdmin() || !selectedProject) return;
    const zoneCode = slabForm.zone.trim().split(/\s+/).map(w => w.charAt(0)).join('').toUpperCase();
    const dateCode = slabForm.castingDate ? slabForm.castingDate.replace(/-/g, '').slice(2) : '000000'; 
    const autoSlabId = `${zoneCode}-${dateCode}`;
    try {
      await addDoc(collection(db, 'artifacts', selectedProject.id, 'public', 'data', 'slabs'), {
        ...slabForm, slabId: autoSlabId, bbs: [], deliveries: [], notes: '', createdAt: new Date().toISOString(), createdBy: user.name 
      });
      setActiveModal(null); setSlabForm({ zone: '', castingDate: '', probableCastingDate: '', remarks: '', status: 'Scheduled', actualCastingDate: '' });
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleAssignBBS = async (e) => {
    e.preventDefault(); if (!checkAdmin() || !selectedProject) return;
    try { 
      await updateDoc(doc(db, 'artifacts', selectedProject.id, 'public', 'data', 'slabs', bbsForm.selectedSlabId), {
        bbs: arrayUnion({ number: bbsForm.bbsNumber, description: bbsForm.description || '', targetDate: bbsForm.targetDate || '', actualDate: bbsForm.actualDate || '', createdBy: user.name }) 
      }); 
      setActiveModal(null); setBbsForm({ selectedSlabId: '', bbsNumber: '', description: '', targetDate: '', actualDate: '' }); 
    } catch (err) { alert(err.message); }
  };

  const handleAddDelivery = async (e) => {
    e.preventDefault(); if (!checkAdmin() || !selectedProject) return;
    try { 
      await updateDoc(doc(db, 'artifacts', selectedProject.id, 'public', 'data', 'slabs', deliveryForm.selectedSlabId), {
        deliveries: arrayUnion({ date: deliveryForm.date, description: deliveryForm.description || 'Batch Delivery', createdBy: user.name }) 
      }); 
      setActiveModal(null); setDeliveryForm({ selectedSlabId: '', date: '', description: '' }); 
    } catch (err) { alert(err.message); }
  };

  const deleteEntry = async (id) => { if (!checkAdmin() || !selectedProject || !confirm("Delete record?")) return; try { await deleteDoc(doc(db, 'artifacts', selectedProject.id, 'public', 'data', 'slabs', id)); } catch (err) { alert(err.message); } };
  const updateStatus = async (item, newStatus) => { if (!checkAdmin() || !selectedProject) return; try { await updateDoc(doc(db, 'artifacts', selectedProject.id, 'public', 'data', 'slabs', item.id), { status: newStatus }); } catch (err) { alert(err.message); } };
  const startEditingRemark = (item) => { if(!checkAdmin()) return; setEditingRemark({ id: item.id, text: item.remarks || '' }); };
  const saveRemark = async () => { if (!editingRemark.id || !selectedProject) return; try { await updateDoc(doc(db, 'artifacts', selectedProject.id, 'public', 'data', 'slabs', editingRemark.id), { remarks: editingRemark.text }); setEditingRemark({ id: null, text: '' }); } catch (err) { alert(err.message); } };
  const startEditingSlabId = (item) => { if(!checkAdmin()) return; setEditingSlabId({ id: item.id, text: item.slabId || '' }); };
  const saveSlabId = async () => { if (!editingSlabId.id || !selectedProject) return; try { await updateDoc(doc(db, 'artifacts', selectedProject.id, 'public', 'data', 'slabs', editingSlabId.id), { slabId: editingSlabId.text }); setEditingSlabId({ id: null, text: '' }); } catch (err) { alert(err.message); } };
  const handleDeleteBBS = async (slab, bbsIndex) => {
    if (!checkAdmin() || !selectedProject || !confirm("Delete this BBS?")) return;
    const updated = [...slab.bbs];
    updated.splice(bbsIndex, 1);
    try {
      await updateDoc(doc(db, 'artifacts', selectedProject.id, 'public', 'data', 'slabs', slab.id), { bbs: updated });
    } catch (err) { alert(err.message); }
  };
  const initiateEditBBS = useCallback((slab, bbsIndex) => { if (!checkAdmin()) return; const item = slab.bbs[bbsIndex]; setEditBbsState({ slabId: slab.id, bbsIndex, data: typeof item === 'object' ? item : { number: item, description: '' } }); setActiveModal('edit-bbs'); }, [checkAdmin, setEditBbsState, setActiveModal]);
  const initiateAddBBS = useCallback((item) => {
    if (!checkAdmin()) return;
    setBbsForm({ selectedSlabId: item.id, bbsNumber: '', description: '', targetDate: '', actualDate: '' });
    setActiveModal('bbs');
  }, [checkAdmin, setBbsForm, setActiveModal]);

  const handleCalendarAssignBbs = useCallback((date) => {
    if (!checkAdmin()) return;
    setBbsForm({ selectedSlabId: '', bbsNumber: '', description: '', targetDate: date, actualDate: '' });
    setActiveModal('bbs');
  }, [checkAdmin, setBbsForm, setActiveModal]);

  const handleCalendarAssignCasting = useCallback((date) => {
    if (!checkAdmin()) return;
    setSlabForm({ zone: '', castingDate: date, probableCastingDate: '', remarks: '', status: 'Scheduled', actualCastingDate: '' });
    setActiveModal('slab');
  }, [checkAdmin, setSlabForm, setActiveModal]);

  const handleCalendarAssignDelivery = useCallback((date) => {
    if (!checkAdmin()) return;
    setDeliveryForm({ selectedSlabId: '', date: date, description: '' });
    setActiveModal('delivery');
  }, [checkAdmin, setDeliveryForm, setActiveModal]);

  const handleSaveBbsEdit = async (e) => { e.preventDefault(); if (!checkAdmin() || !selectedProject) return; const slab = data.find(d => d.id === editBbsState.slabId); if (!slab) return; const updated = [...slab.bbs]; updated[editBbsState.bbsIndex] = editBbsState.data; try { await updateDoc(doc(db, 'artifacts', selectedProject.id, 'public', 'data', 'slabs', editBbsState.slabId), { bbs: updated }); setActiveModal(null); } catch (err) { alert(err.message); } };
  const initiateEditCasting = (item) => { if (!checkAdmin()) return; setEditCastingState({ id: item.id, target: item.castingDate || '', probable: item.probableCastingDate || '', actual: item.actualCastingDate || '' }); setActiveModal('edit-casting'); };
  const handleSaveCastingEdit = async (e) => { e.preventDefault(); if (!checkAdmin() || !selectedProject) return; const updates = { castingDate: editCastingState.target, probableCastingDate: editCastingState.probable, actualCastingDate: editCastingState.actual }; if (editCastingState.actual) updates.status = 'Cast'; try { await updateDoc(doc(db, 'artifacts', selectedProject.id, 'public', 'data', 'slabs', editCastingState.id), updates); setActiveModal(null); } catch (err) { alert(err.message); } };

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

    // Monthly Summary Calculation
    const monthlyStats = {};
    data.forEach(d => {
        const targetD = d.castingDate ? new Date(d.castingDate) : null;
        const actualD = d.actualCastingDate ? new Date(d.actualCastingDate) : null;

        if (targetD) {
            const k = `${targetD.getFullYear()}-${String(targetD.getMonth()+1).padStart(2,'0')}`;
            if (!monthlyStats[k]) monthlyStats[k] = { planned: 0, actual: 0 };
            monthlyStats[k].planned++;
        }
        if (actualD) {
            const k = `${actualD.getFullYear()}-${String(actualD.getMonth()+1).padStart(2,'0')}`;
            if (!monthlyStats[k]) monthlyStats[k] = { planned: 0, actual: 0 };
            monthlyStats[k].actual++;
        }
    });

    return { total, cast, delivered, pending, early, onTime, late, totalBBS, deliveredBBS, monthlyStats };
  }, [data]);

  const filteredData = useMemo(() => {
    let result = data.filter(item => {
        const textMatch = (item.slabId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (Array.isArray(item.bbs) ? item.bbs.map(b => (typeof b === 'object' ? b.number : b)).join(' ') : '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.zone || '').toLowerCase().includes(searchQuery.toLowerCase());
        let dateMatch = true;
        if (dateFilter.start && dateFilter.end && item.castingDate) {
            const cDate = new Date(item.castingDate);
            const sDate = new Date(dateFilter.start);
            const eDate = new Date(dateFilter.end);
            dateMatch = cDate >= sDate && cDate <= eDate;
        }
        return textMatch && dateMatch;
    });

    if (sortConfig.key) {
        result.sort((a, b) => {
            const valA = a[sortConfig.key] || '';
            const valB = b[sortConfig.key] || '';
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return result;
  }, [data, searchQuery, dateFilter, sortConfig]);

  const DashboardView = () => {
    const progressPercentage = metrics.total > 0 ? Math.round((metrics.cast/metrics.total)*100) : 0;
    const today = new Date().toISOString().split('T')[0];
    const overdueCount = data.filter(item => 
      item.castingDate && 
      item.castingDate < today && 
      item.status !== 'Cast'
    ).length;
    
    return (
      <div className="space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-soilGreen-900 to-soilGreen-800 rounded-2xl p-6 md:p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-soilOrange-500/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-soilGreen-500/10 rounded-full -ml-24 -mb-24"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">Project Dashboard</h1>
                <p className="text-slate-300 text-base">Real-time construction project management & reporting</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg">
                    <p className="text-xs text-slate-300 uppercase tracking-wide">Active Project</p>
                    <p className="text-lg font-bold">{selectedProject?.name}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg">
                    <p className="text-xs text-slate-300 uppercase tracking-wide">Today</p>
                    <p className="text-lg font-bold">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setActiveModal('report')}
                  className="bg-soilOrange-500 hover:bg-soilOrange-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg text-white"
                >
                  <FileText size={18} /> Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card 
            title="Total Scope" 
            value={metrics.total} 
            icon={Layers} 
            subtext="Active casting zones" 
            color="slate"
            size="default"
          />
          <Card 
            title="Materials Delivered" 
            value={metrics.delivered} 
            icon={Truck} 
            subtext={`${metrics.total > 0 ? Math.round((metrics.delivered/metrics.total)*100) : 0}% coverage`}
            color="amber"
            size="default"
            trend={15}
          />
          <Card 
            title="Completed Casts" 
            value={metrics.cast} 
            icon={CheckCircle2} 
            subtext={`${progressPercentage}% overall progress`}
            color="emerald"
            size="default"
            trend={8}
          />
          <Card 
            title="Critical Issues" 
            value={overdueCount} 
            icon={AlertTriangle} 
            subtext="Overdue schedules"
            color="red"
            size="default"
          />
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <TrendingUp className="text-blue-500" size={24} />
                Project Progress Overview
              </h2>
              <button 
                onClick={() => setActiveTab('tracker')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                View Details →
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Overall Completion</span>
                <span className="text-2xl font-bold text-slate-800 dark:text-white">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="h-full bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>{metrics.cast} completed</span>
                <span>{metrics.total} total zones</span>
              </div>
            </div>

            {/* Enhanced Status Breakdown with Visual Indicators */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-all duration-300 group">
                <div className="relative">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
                <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{metrics.cast}</div>
                <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Completed</div>
                {metrics.total > 0 && (
                  <div className="mt-2 text-xs text-emerald-500 dark:text-emerald-500">
                    {Math.round((metrics.cast/metrics.total)*100)}% of total
                  </div>
                )}
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-300 group">
                <div className="relative">
                  <Clock className="w-10 h-10 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">{metrics.pending}</div>
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">In Progress</div>
                {metrics.total > 0 && (
                  <div className="mt-2 text-xs text-blue-500 dark:text-blue-500">
                    {Math.round((metrics.pending/metrics.total)*100)}% of total
                  </div>
                )}
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg border border-amber-200 dark:border-amber-800 hover:shadow-md transition-all duration-300 group">
                <div className="relative">
                  <Truck className="w-10 h-10 text-amber-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                </div>
                <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">{metrics.delivered}</div>
                <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">Materials Ready</div>
                {metrics.total > 0 && (
                  <div className="mt-2 text-xs text-amber-500 dark:text-amber-500">
                    {Math.round((metrics.delivered/metrics.total)*100)}% coverage
                  </div>
                )}
              </div>
            </div>

            {/* Mini Analytics Chart */}
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Weekly Progress Trend</h4>
              <div className="flex items-end justify-between h-16 gap-2">
                {[65, 78, 82, 75, 90, 85, progressPercentage].map((value, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-500 hover:from-blue-600 hover:to-blue-500"
                      style={{ height: `${value}%` }}
                    />
                    <span className="text-[8px] text-slate-500 dark:text-slate-400">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        {/* Critical Tasks Summary */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={24} />
              Critical Tasks
            </h2>
          </div>
          
          <div className="flex flex-col gap-4">
            {/* Overdue Items */}
            <div className={`p-4 rounded-lg border ${
              overdueCount > 0 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${overdueCount > 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className={`text-base font-bold ${overdueCount > 0 ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                      Overdue Schedules
                    </h4>
                    <span className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>{overdueCount}</span>
                  </div>
                  <p className={`text-sm ${overdueCount > 0 ? 'text-red-600 dark:text-red-300' : 'text-emerald-600 dark:text-emerald-300'}`}>
                    casting zones {overdueCount > 0 ? 'behind schedule' : 'on schedule'}
                  </p>
                </div>
              </div>
            </div>

            {/* Missing BBS */}
            <div className={`p-4 rounded-lg border ${
              data.filter(i => !i.bbs || (Array.isArray(i.bbs) && i.bbs.length === 0)).length > 0 
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' 
                : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${data.filter(i => !i.bbs || (Array.isArray(i.bbs) && i.bbs.length === 0)).length > 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
                  <Target size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className={`text-base font-bold ${
                      data.filter(i => !i.bbs || (Array.isArray(i.bbs) && i.bbs.length === 0)).length > 0
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}>
                      Missing BBS
                    </h4>
                    <span className={`text-2xl font-bold ${
                      data.filter(i => !i.bbs || (Array.isArray(i.bbs) && i.bbs.length === 0)).length > 0
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}>{data.filter(i => !i.bbs || (Array.isArray(i.bbs) && i.bbs.length === 0)).length}</span>
                  </div>
                  <p className={`text-sm ${
                    data.filter(i => !i.bbs || (Array.isArray(i.bbs) && i.bbs.length === 0)).length > 0 
                      ? 'text-amber-600 dark:text-amber-300' 
                      : 'text-emerald-600 dark:text-emerald-300'
                  }`}>
                    zones pending BBS assignment
                  </p>
                </div>
              </div>
            </div>

            {/* Next Casting */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                  <Hammer size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-base font-bold text-blue-700 dark:text-blue-400">Next Casting</h4>
                    {data.filter(i => i.status !== 'Cast' && i.castingDate).sort((a, b) => new Date(a.castingDate) - new Date(b.castingDate))[0] && (
                      <span className="text-sm font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded">
                        {new Date(data.filter(i => i.status !== 'Cast' && i.castingDate).sort((a, b) => new Date(a.castingDate) - new Date(b.castingDate))[0].castingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  {data.filter(i => i.status !== 'Cast' && i.castingDate).sort((a, b) => new Date(a.castingDate) - new Date(b.castingDate))[0] ? (
                    <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">
                      {data.filter(i => i.status !== 'Cast' && i.castingDate).sort((a, b) => new Date(a.castingDate) - new Date(b.castingDate))[0].slabId}
                    </p>
                  ) : (
                    <p className="text-sm text-blue-600 dark:text-blue-300">No upcoming castings</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
          {/* Project Timeline */}
        <ProjectTimeline filteredData={filteredData} />

        </div>
      </div>
    );
  };

  const TrackerView = () => {
    const displayData = filteredData.filter(item => {
      const isRamp = (item.zone || '').toLowerCase().includes('ramp') || (item.slabId || '').toLowerCase().includes('ramp');
      return trackerSubTab === 'ramp' ? isRamp : !isRamp;
    });

    return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col xl:flex-row items-center gap-2 w-full">
            <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600">
                <button
                    onClick={() => setTrackerSubTab('standard')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    trackerSubTab === 'standard'
                        ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                    Standard Slabs
                </button>
                <button
                    onClick={() => setTrackerSubTab('ramp')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    trackerSubTab === 'ramp'
                        ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                    Ramp Tracker
                </button>
            </div>
            <div className="relative w-full md:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm outline-none w-full" /></div>
            <div className="flex items-center gap-2 w-full md:w-auto"><input type="date" value={dateFilter.start} onChange={e => setDateFilter({...dateFilter, start: e.target.value})} className="px-2 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-xs outline-none" /><span className="text-slate-400">-</span><input type="date" value={dateFilter.end} onChange={e => setDateFilter({...dateFilter, end: e.target.value})} className="px-2 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-xs outline-none" />{(dateFilter.start || dateFilter.end) && (<button aria-label="Clear date filter" onClick={() => setDateFilter({start: '', end: ''})} className="text-slate-400 hover:text-red-500"><X size={16}/></button>)}</div>
        </div>
        {user?.role === 'admin' && (<div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto"><button onClick={() => setActiveModal('bbs')} className="col-span-1 flex items-center justify-center gap-1 md:gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors border border-slate-200 dark:border-slate-600"><FileSignature size={16} /><span className="truncate">Assign BBS</span></button><button onClick={() => setActiveModal('delivery')} className="col-span-1 flex items-center justify-center gap-1 md:gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors border border-slate-200 dark:border-slate-600"><PackagePlus size={16} /><span className="truncate">Log HCS</span></button><button onClick={() => setActiveModal('slab')} className="col-span-2 md:col-span-1 flex items-center justify-center gap-2 bg-soilOrange-500 hover:bg-soilOrange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"><Plus size={18} /> Add Casting</button></div>)}
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group" onClick={() => handleSort('slabId')}>
                      <div className="flex items-center gap-1">Casting ID {sortConfig.key === 'slabId' && (sortConfig.direction === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</div>
                  </th>
                  <th className="p-4">Zone / Level</th>
                  <th className="p-4">Remarks</th>
                  <th className="p-4">BBS Number</th>
                  <th className="p-4">HCS Delivery</th>
                  <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group" onClick={() => handleSort('castingDate')}>
                      <div className="flex items-center gap-1">Casting Dates {sortConfig.key === 'castingDate' && (sortConfig.direction === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</div>
                  </th>
                  <th className="p-4">Status</th>
                  {user?.role === 'admin' && <th className="p-4 text-right">Actions</th>}
              </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
            {displayData.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-700 dark:text-slate-300">
                <td className="p-4 font-bold text-slate-800 dark:text-white align-top" onDoubleClick={() => startEditingSlabId(item)}>{editingSlabId.id === item.id ? (<input autoFocus type="text" className="w-full bg-white dark:bg-slate-800 border border-blue-300 rounded px-2 py-1 text-sm outline-none" value={editingSlabId.text} onChange={(e) => setEditingSlabId({...editingSlabId, text: e.target.value})} onBlur={saveSlabId} onKeyDown={(e) => e.key === 'Enter' && saveSlabId()} />) : (<div className={user?.role==='admin'?'cursor-pointer hover:text-blue-600':''}>{item.slabId}</div>)}</td>
                <td className="p-4 align-top">{item.zone}</td>
                <td className="p-4 align-top max-w-[200px]" onDoubleClick={() => startEditingRemark(item)}>{editingRemark.id === item.id ? (<input autoFocus type="text" className="w-full bg-white dark:bg-slate-800 border border-blue-300 rounded px-2 py-1 text-sm outline-none" value={editingRemark.text} onChange={(e) => setEditingRemark({...editingRemark, text: e.target.value})} onBlur={saveRemark} onKeyDown={(e) => e.key === 'Enter' && saveRemark()} />) : (<div className={`truncate ${user?.role==='admin'?'cursor-pointer hover:text-blue-600':''}`}>{item.remarks || <span className="text-slate-300 italic">--</span>}</div>)}</td>
                <td className="p-4 align-top"><BbsTags bbs={item.bbs} castingDate={item.castingDate} onEdit={(idx) => initiateEditBBS(item, idx)} onDelete={(idx) => handleDeleteBBS(item, idx)} onAdd={() => initiateAddBBS(item)} readOnly={user?.role !== 'admin'} /></td>
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
        {displayData.map(item => (
          <div key={item.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 relative overflow-hidden">
             <div className="flex justify-between items-start mb-3"><div><h3 className="font-bold text-slate-800 dark:text-white truncate">{item.slabId}</h3><p className="text-xs text-slate-500 truncate">{item.zone}</p></div><StatusSelect disabled={user?.role !== 'admin'} currentStatus={item.status} targetDate={item.castingDate} actualDate={item.actualCastingDate} onChange={(val) => updateStatus(item, val)} /></div>
             <div className="space-y-3">
                 <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600"><p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Target Casting</p><div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300"><span className="flex items-center gap-2"><Hammer size={14} className="text-emerald-500" /> {item.castingDate}</span>{user?.role === 'admin' && <button aria-label="Edit casting dates" onClick={() => initiateEditCasting(item)} className="text-slate-400 hover:text-blue-600"><Edit2 size={14} /></button>}</div>{item.actualCastingDate && (<div className="flex items-center gap-2 text-sm text-slate-700 mt-1 pl-6"><span className="text-[10px] text-slate-400 uppercase">Actual:</span><span className="font-bold text-emerald-700 dark:text-emerald-400">{item.actualCastingDate}</span></div>)}</div>
                 <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600" onClick={() => startEditingRemark(item)}><p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Remarks (Tap to edit)</p>{editingRemark.id === item.id ? (<input autoFocus type="text" className="w-full bg-white dark:bg-slate-800 border border-blue-300 rounded px-2 py-1 text-xs outline-none" value={editingRemark.text} onChange={(e) => setEditingRemark({...editingRemark, text: e.target.value})} onBlur={saveRemark} onKeyDown={(e) => e.key === 'Enter' && saveRemark()} />) : (<div className="text-xs text-slate-600 dark:text-slate-300 min-h-[1.25rem] break-words">{item.remarks || <span className="text-slate-400 italic">No remarks</span>}</div>)}</div>
                 <div className="grid grid-cols-2 gap-2"><div className="bg-slate-50 dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600"><p className="text-[10px] text-slate-400 uppercase font-bold mb-1">HCS Deliveries</p><DeliveryTags deliveries={item.deliveries} castingDate={item.castingDate} /></div><div className="bg-slate-50 dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600"><p className="text-[10px] text-slate-400 uppercase font-bold mb-1">BBS List</p><BbsTags bbs={item.bbs} castingDate={item.castingDate} onEdit={(idx) => initiateEditBBS(item, idx)} onDelete={(idx) => handleDeleteBBS(item, idx)} onAdd={() => initiateAddBBS(item)} readOnly={user?.role !== 'admin'} /></div></div>
             </div>
             {user?.role === 'admin' && (<button aria-label="Delete entry" onClick={() => deleteEntry(item.id)} className="absolute top-4 right-2 text-slate-300 hover:text-red-500 p-2"><X size={16} /></button>)}
          </div>
        ))}
      </div>
    </div>
  );
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-500">Connecting to Cloud...</div>;
  if (!user) return <LoginView initialMode={emailConfirmationNeeded ? 'confirm-email' : 'login'} isDark={isDark} toggleTheme={toggleTheme} onRegisterData={setTempRegisterData} />;
  if (!selectedProject) return <ProjectSelection projects={projects} onSelect={setSelectedProject} onAdd={handleAddProject} onLogout={handleLogout} user={user} />;

  return (
    <div className="min-h-screen font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300 bg-fixed bg-cover bg-center print:!bg-none print:!bg-white" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop')" }}>
      <div className="fixed inset-0 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-[2px] z-0 pointer-events-none print:hidden"></div>
      <div className="relative z-10">
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-800 dark:text-white sticky top-0 z-50 shadow-sm border-b border-slate-200/50 dark:border-slate-700/50 print:hidden transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl shadow-lg">
              <AppLogo className="h-8 w-8" />
            </div>
            <div>
              <span className="font-bold text-lg md:text-xl tracking-tight hidden md:block text-slate-800 dark:text-white">SB-CasTrack</span>
              <span className="md:hidden font-bold text-slate-800 dark:text-white">SB-CT</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">{selectedProject?.name}</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'tracker', label: 'Tracker', icon: FileText },
              { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
              { id: 'site-diary', label: 'Site Diary', icon: BookOpen },
              { id: 'reports', label: 'Reports', icon: BarChart3 }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id 
                    ? 'bg-soilOrange-500 text-white shadow-lg transform scale-105'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveModal('report')} 
              className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-md"
            >
              <FileText size={14} /> Quick Report
            </button>
            <button 
              onClick={() => setSelectedProject(null)} 
              className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            >
              <RefreshCw size={14} /> Switch Project
            </button>
             <div className="text-right hidden sm:block cursor-pointer group" onClick={() => { setProfileForm({ name: user.name || '', designation: user.designation || '' }); setActiveModal('profile'); }}>
               <p className="text-sm font-medium text-slate-800 dark:text-white group-hover:text-soilOrange-500 transition-colors">{user.name || user.email}</p>
               <p className="text-[10px] text-slate-500 dark:text-slate-400 text-right">{user.designation || 'No Designation'}</p>
             </div>
            <button 
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} 
              onClick={toggleTheme} 
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-300"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              aria-label="Logout" 
              onClick={handleLogout} 
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {activeTab === 'dashboard' ? DashboardView() : 
         activeTab === 'tracker' ? TrackerView() : 
         activeTab === 'reports' ? <ReportView selectedProject={selectedProject} user={user} metrics={metrics} filteredData={filteredData} /> : 
         activeTab === 'site-diary' ? <SiteDiaryView selectedProject={selectedProject} user={user} locations={data} /> :
         <CalendarView
            data={data}
            onAssignBBS={handleCalendarAssignBbs}
            onAssignCasting={handleCalendarAssignCasting}
            onAssignDelivery={handleCalendarAssignDelivery}
            onEditSlab={initiateEditCasting}
            onEditBBS={initiateEditBBS}
         />}
      </main>
      </div>
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Root-level Report Modal */}
      {activeModal === 'report' && (
        <ExecutiveReportModal
          selectedProject={selectedProject}
          user={user}
          metrics={metrics}
          data={data}
          filteredData={filteredData}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Generic Modal Wrapper for other modals */}
      {activeModal && activeModal !== 'report' && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl md:rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0"><h3 className="font-bold text-lg text-slate-800 dark:text-white">Action</h3><button aria-label="Close modal" onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
            <div className="overflow-y-auto p-6">
               {activeModal === 'slab' && <form onSubmit={handleAddSlab} className="space-y-4"> <div className="grid grid-cols-2 gap-4"> <div className="col-span-2"> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Zone / Level</label> <input required type="text" placeholder="e.g. Zone B Level 6" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={slabForm.zone} onChange={e => setSlabForm({...slabForm, zone: e.target.value})} /> </div> </div> <div className="grid grid-cols-2 gap-4"> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Target Casting Date</label> <input required type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={slabForm.castingDate} onChange={e => setSlabForm({...slabForm, castingDate: e.target.value})} /> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Probable Casting Date</label> <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={slabForm.probableCastingDate} onChange={e => setSlabForm({...slabForm, probableCastingDate: e.target.value})} /> </div> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Remarks</label> <textarea placeholder="Notes..." className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm h-24 resize-none" value={slabForm.remarks} onChange={e => setSlabForm({...slabForm, remarks: e.target.value})} /> </div> <div className="pt-4"> <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg">Create Plan</button> </div> </form>}
               {activeModal === 'bbs' && <form onSubmit={handleAssignBBS} className="space-y-4"> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Select Casting Zone</label> <select required className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none bg-white" value={bbsForm.selectedSlabId} onChange={e => setBbsForm({...bbsForm, selectedSlabId: e.target.value})}> <option value="">-- Choose Zone --</option> {data.map(s => <option key={s.id} value={s.id}>{s.zone} ({s.slabId})</option>)} </select> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">BBS Number</label> <input required type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" value={bbsForm.bbsNumber} onChange={e => setBbsForm({...bbsForm, bbsNumber: e.target.value})} /> </div> <div className="grid grid-cols-2 gap-4"> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Target</label> <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" value={bbsForm.targetDate} onChange={e => setBbsForm({...bbsForm, targetDate: e.target.value})} /> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Actual</label> <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" value={bbsForm.actualDate} onChange={e => setBbsForm({...bbsForm, actualDate: e.target.value})} /> </div> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Desc</label> <input type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" value={bbsForm.description} onChange={e => setBbsForm({...bbsForm, description: e.target.value})} /> </div> <div className="pt-4"> <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg">Assign</button> </div> </form>}
               {activeModal === 'delivery' && <form onSubmit={handleAddDelivery} className="space-y-4"> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Select Zone</label> <select required className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none bg-white" value={deliveryForm.selectedSlabId} onChange={e => setDeliveryForm({...deliveryForm, selectedSlabId: e.target.value})}> <option value="">-- Choose Zone --</option> {data.map(s => <option key={s.id} value={s.id}>{s.slabId}</option>)} </select> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Actual Date</label> <input required type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" value={deliveryForm.date} onChange={e => setDeliveryForm({...deliveryForm, date: e.target.value})} /> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Batch Info</label> <input type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" value={deliveryForm.description} onChange={e => setDeliveryForm({...deliveryForm, description: e.target.value})} /> </div> <div className="pt-4"> <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg">Log Delivery</button> </div> </form>}
               {activeModal === 'edit-bbs' && <form onSubmit={handleSaveBbsEdit} className="space-y-4"> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">BBS Number</label> <input required type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" value={editBbsState.data.number} onChange={e => setEditBbsState({...editBbsState, data: { ...editBbsState.data, number: e.target.value }})} /> </div> <div className="grid grid-cols-2 gap-4"> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Target</label> <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" value={editBbsState.data.targetDate || ''} onChange={e => setEditBbsState({...editBbsState, data: { ...editBbsState.data, targetDate: e.target.value }})} /> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Actual</label> <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" value={editBbsState.data.actualDate || ''} onChange={e => setEditBbsState({...editBbsState, data: { ...editBbsState.data, actualDate: e.target.value }})} /> </div> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Desc</label> <input type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" value={editBbsState.data.description || ''} onChange={e => setEditBbsState({...editBbsState, data: { ...editBbsState.data, description: e.target.value }})} /> </div> <div className="pt-4"> <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">Update</button> </div> </form>}
               {activeModal === 'edit-casting' && <form onSubmit={handleSaveCastingEdit} className="space-y-4"> <div className="grid grid-cols-2 gap-4"> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Target</label> <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" value={editCastingState.target} onChange={e => setEditCastingState({...editCastingState, target: e.target.value})} /> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Probable</label> <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" value={editCastingState.probable} onChange={e => setEditCastingState({...editCastingState, probable: e.target.value})} /> </div> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Actual</label> <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" value={editCastingState.actual} onChange={e => setEditCastingState({...editCastingState, actual: e.target.value})} /> </div> <div className="pt-4"> <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">Save Dates</button> </div> </form>}
               {activeModal === 'profile' && <form onSubmit={handleUpdateProfile} className="space-y-4"> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Name</label> <input type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} /> </div> <div> <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Designation</label> <input type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" value={profileForm.designation} onChange={e => setProfileForm({...profileForm, designation: e.target.value})} /> </div> <div className="pt-4"> <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">Save Profile</button> </div> </form>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
