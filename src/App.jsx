import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Database,
  FileSignature,
  PackagePlus,
  Target,
  Edit2,
  Info // Icon for remarks
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query,
  arrayUnion
} from 'firebase/firestore';

/**
 * SB-CasTrack v3.3 (Auth Fix)
 * Features:
 * - Robust Auth Handling (Fallback to Anonymous if Token Mismatch)
 * - Simplified Status (Scheduled, Cast, Delayed)
 * - Inline Editable Remarks in Tracker
 * - Metric updates based on logic not just status
 */

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDn6tKFPwszxiXOcayglRjl4yTCr7Y2BJo",
  authDomain: "tnd4-castrack.firebaseapp.com",
  projectId: "tnd4-castrack",
  storageBucket: "tnd4-castrack.firebasestorage.app",
  messagingSenderId: "579746948632",
  appId: "1:579746948632:web:8f806ca4c50543a2dbc56d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Using your project ID as the identifier for data paths
const appId = 'tnd4-castrack';

// --- Helper Components ---

const Card = ({ title, value, icon: Icon, subtext, color = "blue" }) => (
  <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-slate-500 text-xs md:text-sm font-medium mb-1">{title}</p>
      <h3 className="text-xl md:text-2xl font-bold text-slate-800">{value}</h3>
      {subtext && <p className={`text-[10px] md:text-xs mt-2 font-medium ${subtext.includes('+') ? 'text-emerald-600' : 'text-slate-400'}`}>{subtext}</p>}
    </div>
    <div className={`p-2 md:p-3 rounded-lg bg-${color}-50 text-${color}-600`}>
      <Icon size={20} className="md:w-6 md:h-6" />
    </div>
  </div>
);

// New Status Select Component
const StatusSelect = ({ currentStatus, onChange }) => {
  const styles = {
    Scheduled: "bg-slate-100 text-slate-600 border-slate-200",
    Cast: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Delayed: "bg-red-50 text-red-700 border-red-200"
  };

  // Fallback for legacy statuses to 'Scheduled' style
  const statusStyle = styles[currentStatus] || styles.Scheduled;

  return (
    <div className="relative inline-block">
      <select 
        value={currentStatus}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none pl-3 pr-8 py-1 rounded-full text-[10px] md:text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${statusStyle}`}
      >
        <option value="Scheduled">Scheduled</option>
        <option value="Cast">Cast</option>
        <option value="Delayed">Delayed</option>
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
    </div>
  );
};

const Badge = ({ status }) => {
  const styles = {
    Scheduled: "bg-slate-100 text-slate-600 border-slate-200",
    Cast: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Delayed: "bg-red-50 text-red-700 border-red-200"
  };
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-medium border ${styles[status] || styles.Scheduled}`}>
      {status}
    </span>
  );
};

const BbsTags = ({ bbs, castingDate, onEdit }) => {
  let list = [];
  if (Array.isArray(bbs)) {
    list = bbs;
  } else if (bbs) {
    list = [bbs];
  }

  if (list.length === 0) return <span className="text-slate-400 italic text-xs">Pending</span>;

  return (
    <div className="flex flex-wrap gap-1 justify-end">
      {list.map((b, idx) => {
        const isObj = typeof b === 'object' && b !== null;
        const text = isObj ? b.number : b;
        const desc = isObj ? b.description : '';
        const target = isObj ? b.targetDate : '';
        const actual = isObj ? b.actualDate : '';

        // CRITICAL CHECK: Is Actual Delivery AFTER Target Casting?
        const isCriticalDelay = castingDate && actual && new Date(actual) > new Date(castingDate);

        let tooltip = `${text}`;
        if (desc) tooltip += `\nDesc: ${desc}`;
        if (target) tooltip += `\nTarget Del: ${target}`;
        if (actual) tooltip += `\nActual Del: ${actual}`;
        if (isCriticalDelay) tooltip += `\n⚠️ DELAYED: Arrived after casting date!`;
        else tooltip += `\n(Click to edit)`;

        return (
          <button 
            key={idx} 
            onClick={(e) => { e.stopPropagation(); onEdit && onEdit(idx); }}
            title={tooltip} 
            className={`font-mono text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap flex items-center gap-1 transition-colors
              ${isCriticalDelay 
                ? 'bg-red-100 text-red-800 border-red-300 font-bold' 
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700'
              }`}
          >
            {text}
            {isCriticalDelay && <AlertTriangle size={8} className="text-red-600" />}
          </button>
        );
      })}
    </div>
  );
};

const DeliveryTags = ({ deliveries, castingDate }) => {
  let list = [];
  if (Array.isArray(deliveries)) {
    list = deliveries;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Actual Deliveries List */}
      {list.length > 0 ? (
        list.map((d, idx) => {
          // CRITICAL CHECK: Is Actual HCS Delivery AFTER Target Casting?
          const isCriticalDelay = castingDate && new Date(d.date) > new Date(castingDate);
          return (
            <div key={idx} className="flex items-center gap-2 text-xs">
               <Truck size={12} className={isCriticalDelay ? "text-red-500" : "text-emerald-500"} />
               <span className={`font-medium ${isCriticalDelay ? "text-red-700 font-bold" : "text-slate-700"}`}>
                 {d.date}
               </span>
               {d.description && <span className="text-[10px] text-slate-400 truncate max-w-[80px]">({d.description})</span>}
               {isCriticalDelay && <span className="text-[8px] text-red-500 font-bold px-1 border border-red-200 rounded bg-red-50">LATE</span>}
            </div>
          );
        })
      ) : (
        <span className="text-slate-300 italic text-[10px] pl-1">No actuals yet</span>
      )}
    </div>
  );
};

// --- Mobile Navigation ---
const MobileNav = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tracker', label: 'Tracker', icon: FileText },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 pb-safe z-50 shadow-lg flex justify-around items-center">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-full ${isActive ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <tab.icon size={20} className={isActive ? 'fill-current opacity-20' : ''} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// --- Calendar Component with 3s Hover Tooltip ---

const DelayedTooltip = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef(null);

  const handleMouseEnter = () => {
    if (!content) return;
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 3000); // 3 seconds delay
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsVisible(false);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave} 
      className="relative w-full"
    >
      {children}
      {isVisible && (
        <div className="absolute z-50 bottom-full left-0 mb-1 w-48 bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className="font-bold border-b border-slate-600 pb-1 mb-1 text-slate-300">Remarks</div>
          {content}
          <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-slate-800"></div>
        </div>
      )}
    </div>
  );
};

const CalendarView = ({ data }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Generate calendar grid
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-slate-50/50 border-b border-r border-slate-100"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Aggregate events for this day
    const dayEvents = [];
    data.forEach(item => {
      // Check Casting Date
      if (item.castingDate === dateStr) {
        dayEvents.push({ type: 'cast', ...item });
      }
      // Check Delivery Array (Actuals)
      if (Array.isArray(item.deliveries)) {
        item.deliveries.forEach(d => {
          if (d.date === dateStr) {
            // Check if late relative to casting
            const isLate = item.castingDate && new Date(d.date) > new Date(item.castingDate);
            dayEvents.push({ type: 'delivery', isLate, ...item, deliveryDesc: d.description });
          }
        });
      }
      // Check BBS Dates
      if (Array.isArray(item.bbs)) {
        item.bbs.forEach(b => {
          if (typeof b === 'object') {
             if (b.actualDate === dateStr) {
               const isLate = item.castingDate && new Date(b.actualDate) > new Date(item.castingDate);
               dayEvents.push({ type: 'bbsActual', isLate, ...item, bbsNum: b.number });
             }
          }
        });
      }
    });

    days.push(
      <div key={`day-${day}`} className="h-24 md:h-32 bg-white border-b border-r border-slate-100 p-1 md:p-2 hover:bg-slate-50 transition-colors group relative overflow-hidden">
        <div className="flex justify-between items-start">
          <span className={`text-xs md:text-sm font-semibold ${dayEvents.length > 0 ? 'text-slate-800' : 'text-slate-400'}`}>{day}</span>
          {dayEvents.length > 0 && <span className="text-[9px] md:text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded-full">{dayEvents.length}</span>}
        </div>
        <div className="mt-1 md:mt-2 space-y-0.5 md:space-y-1 overflow-y-auto max-h-[60px] md:max-h-[85px] scrollbar-hide">
          {dayEvents.map((event, idx) => {
            let colorClass = "bg-slate-100 text-slate-600 border-slate-200";
            let icon = <CheckCircle2 size={8} />;
            let label = event.slabId;

            if (event.type === 'cast') {
               colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
               icon = <Hammer size={8} />;
            } else if (event.type === 'delivery') {
               colorClass = event.isLate ? "bg-red-50 text-red-700 border-red-200" : "bg-blue-50 text-blue-700 border-blue-100";
               icon = <Truck size={8} />;
            } else if (event.type === 'bbsActual') {
               colorClass = event.isLate ? "bg-red-50 text-red-700 border-red-200" : "bg-purple-50 text-purple-700 border-purple-100";
               icon = <Target size={8} />;
               label = `BBS: ${event.bbsNum}`;
            }

            return (
              <DelayedTooltip key={`${event.id}-${idx}`} content={event.remarks}>
                <div 
                  className={`text-[9px] md:text-[10px] px-1 py-0.5 rounded border truncate flex items-center gap-1 cursor-default ${colorClass}`}
                >
                  <span className="shrink-0">{icon}</span>
                  <span className="truncate">{label}</span>
                  {event.remarks && <Info size={6} className="ml-auto shrink-0 opacity-50" />}
                </div>
              </DelayedTooltip>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500 mb-20 md:mb-0">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
          <CalendarIcon className="text-blue-500" size={20} />
          {monthName} {year}
        </h2>
        <div className="flex items-center gap-1 md:gap-2">
          <button onClick={prevMonth} className="p-1.5 md:p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronLeft size={18} /></button>
          <button onClick={() => setCurrentDate(new Date())} className="px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-medium hover:bg-slate-100 rounded-lg text-slate-600">Today</button>
          <button onClick={nextMonth} className="p-1.5 md:p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center border-b border-slate-200 bg-slate-50">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
          <div key={`${d}-${idx}`} className="py-2 text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-l border-slate-200">
        {days}
      </div>
      <div className="p-4 bg-slate-50 flex flex-wrap gap-x-4 gap-y-2 text-[10px] md:text-xs text-slate-500 border-t border-slate-200">
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div> Actual HCS</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-100 border border-emerald-200 rounded"></div> Casting</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div> Late Delivery</div>
      </div>
    </div>
  );
};

// --- Main Application Component ---

export default function App() {
  // State
  const [user, setUser] = useState(null); 
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState(null); // 'slab' | 'bbs' | 'delivery' | 'edit-bbs' | null

  // Remarks Editing State
  const [editingRemark, setEditingRemark] = useState({ id: null, text: '' });

  // Form State
  const [slabForm, setSlabForm] = useState({
    zone: '', castingDate: '', remarks: '', status: 'Scheduled'
  });
  const [bbsForm, setBbsForm] = useState({
    selectedSlabId: '', bbsNumber: '', description: '', targetDate: '', actualDate: ''
  });
  const [deliveryForm, setDeliveryForm] = useState({
    selectedSlabId: '', date: '', description: ''
  });
  // State for Editing BBS
  const [editBbsState, setEditBbsState] = useState({
    slabId: '', bbsIndex: -1, data: {}
  });

  // --- Auth & Data Effects ---

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to sign in with the environment token first (if it exists)
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
             await signInWithCustomToken(auth, __initial_auth_token);
             return; // Success
          } catch (err) {
             console.warn("Custom token auth failed (likely due to project mismatch), falling back to anonymous.", err);
          }
        }
        
        // Fallback: Sign in anonymously
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setAuthLoading(false);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // User state handled manually for UI simulation
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !auth.currentUser) return;

    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'slabs'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setData(items);
    }, (error) => {
      console.error("Data fetch error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // --- Handlers ---

  const handleLogin = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setUser({
      name: formData.get('username') || 'Project Manager',
      role: 'Project Manager'
    });
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('dashboard');
  };

  const handleAddSlab = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    // AUTO-GENERATE CASTING ID: First letter of every word + DATE (YYMMDD)
    const zoneCode = slabForm.zone
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();

    const dateCode = slabForm.castingDate ? slabForm.castingDate.replace(/-/g, '').slice(2) : '000000'; 
    const autoSlabId = `${zoneCode}-${dateCode}`;

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'slabs'), {
        ...slabForm,
        slabId: autoSlabId,
        bbs: [],
        deliveries: [], // Initialize array for batches
        notes: '',
        createdAt: new Date().toISOString()
      });
      setActiveModal(null);
      setSlabForm({ zone: '', castingDate: '', remarks: '', status: 'Scheduled' });
    } catch (err) {
      console.error("Error adding doc:", err);
    }
  };

  const handleAssignBBS = async (e) => {
    e.preventDefault();
    if (!auth.currentUser || !bbsForm.selectedSlabId) return;

    const bbsEntry = {
      number: bbsForm.bbsNumber,
      description: bbsForm.description || '',
      targetDate: bbsForm.targetDate || '',
      actualDate: bbsForm.actualDate || ''
    };

    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slabs', bbsForm.selectedSlabId), {
        bbs: arrayUnion(bbsEntry)
      });
      setActiveModal(null);
      setBbsForm({ selectedSlabId: '', bbsNumber: '', description: '', targetDate: '', actualDate: '' });
    } catch (err) {
      console.error("Error updating BBS:", err);
    }
  };

  const handleAddDelivery = async (e) => {
    e.preventDefault();
    if (!auth.currentUser || !deliveryForm.selectedSlabId) return;

    const deliveryEntry = {
      date: deliveryForm.date,
      description: deliveryForm.description || 'Batch Delivery'
    };

    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slabs', deliveryForm.selectedSlabId), {
        deliveries: arrayUnion(deliveryEntry)
      });
      setActiveModal(null);
      setDeliveryForm({ selectedSlabId: '', date: '', description: '' });
    } catch (err) {
      console.error("Error updating delivery:", err);
    }
  };

  const deleteEntry = async (id) => {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slabs', id));
    } catch (err) {
      console.error("Error deleting doc:", err);
    }
  };

  const updateStatus = async (item, newStatus) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slabs', item.id), {
        status: newStatus
      });
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // --- Inline Remarks Editing ---
  const startEditingRemark = (item) => {
    setEditingRemark({ id: item.id, text: item.remarks || '' });
  };

  const saveRemark = async () => {
    if (!auth.currentUser || !editingRemark.id) return;
    
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slabs', editingRemark.id), {
        remarks: editingRemark.text
      });
      setEditingRemark({ id: null, text: '' });
    } catch (err) {
      console.error("Error updating remark:", err);
    }
  };

  // --- BBS Editing Logic ---
  const initiateEditBBS = (slab, bbsIndex) => {
    const bbsItem = slab.bbs[bbsIndex];
    // Handle both legacy string and new object format
    const bbsData = typeof bbsItem === 'object' ? bbsItem : { number: bbsItem, description: '', targetDate: '', actualDate: '' };
    
    setEditBbsState({
      slabId: slab.id,
      bbsIndex: bbsIndex,
      data: bbsData
    });
    setActiveModal('edit-bbs');
  };

  const handleSaveBbsEdit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    const slab = data.find(d => d.id === editBbsState.slabId);
    if (!slab) return;

    // Create a copy of the BBS array
    const updatedBbsList = [...slab.bbs];
    // Update the specific item
    updatedBbsList[editBbsState.bbsIndex] = editBbsState.data;

    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slabs', editBbsState.slabId), {
        bbs: updatedBbsList
      });
      setActiveModal(null);
    } catch (err) {
      console.error("Error saving BBS edit:", err);
    }
  };

  // --- Metrics & Filter ---

  const metrics = useMemo(() => {
    const total = data.length;
    const cast = data.filter(d => d.status === 'Cast').length;
    // Delivered is now based on whether actual delivery data exists, regardless of status
    const delivered = data.filter(d => Array.isArray(d.deliveries) && d.deliveries.length > 0).length;
    // Pending (Scheduled) is anything not Cast and not Delayed
    const pending = data.filter(d => d.status === 'Scheduled').length;
    return { total, cast, delivered, pending };
  }, [data]);

  const filteredData = data.filter(item => {
    const getBbsSearchString = (val) => {
      if (!val) return '';
      if (Array.isArray(val)) {
        return val.map(v => (typeof v === 'object' ? v.number : v)).join(' ');
      }
      return val;
    };
    const bbsString = getBbsSearchString(item.bbs);
    return (
      (item.slabId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      bbsString.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.zone || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // --- Views ---

  const LoginView = () => (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
        <div className="bg-slate-900 p-8 text-center">
          <div className="mx-auto bg-blue-500 w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <Layers className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">SB-CasTrack</h1>
          <p className="text-slate-400 mt-2">Team Logistics & Scheduling</p>
        </div>
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input 
                name="username" 
                type="text" 
                placeholder="Ex: PM_Admin" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Database size={12} className="text-emerald-600" /> 
                Cloud Sync Enabled (Auto-Save)
              </p>
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 duration-200"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Total Casts" value={metrics.total} icon={Layers} subtext="Total scope" color="slate" />
        <Card title="HCS Delivered" value={metrics.delivered} icon={Truck} subtext="Zones with deliveries" color="amber" />
        <Card title="Completed" value={metrics.cast} icon={CheckCircle2} subtext={`${metrics.total > 0 ? Math.round((metrics.cast/metrics.total)*100) : 0}% progress`} color="emerald" />
        <Card title="Pending Logistics" value={metrics.pending} icon={Clock} subtext="Scheduled to Cast" color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon className="text-blue-500" size={20} />
              Upcoming Castings
            </h2>
            <button 
              onClick={() => setActiveTab('calendar')}
              className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View Full Schedule
            </button>
          </div>
          <div className="space-y-4">
            {data
              .filter(i => i.status !== 'Cast' && i.castingDate)
              .sort((a, b) => new Date(a.castingDate) - new Date(b.castingDate))
              .slice(0, 3)
              .map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 md:p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="bg-white p-2 rounded border border-slate-200 font-mono text-xs font-bold text-slate-600 text-center min-w-[40px] md:min-w-[50px]">
                    {new Date(item.castingDate).getDate()}<br/>
                    {new Date(item.castingDate).toLocaleString('default', { month: 'short' }).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm md:text-base font-bold text-slate-800">{item.slabId}</h4>
                    <p className="text-xs text-slate-500">{item.zone}</p>
                  </div>
                </div>
                <div className="text-right">
                   <div className="text-xs text-slate-400 mb-1 flex justify-end">
                     <BbsTags bbs={item.bbs} castingDate={item.castingDate} />
                   </div>
                   <StatusSelect currentStatus={item.status} onChange={(val) => updateStatus(item, val)} />
                </div>
              </div>
            ))}
            {data.filter(i => i.status !== 'Cast').length === 0 && (
              <div className="text-center py-8 text-slate-400">No upcoming casts scheduled.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} />
              Alerts
            </h2>
          </div>
          <div className="space-y-3">
             <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
                <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-red-700">Missing BBS</h4>
                  <p className="text-xs text-red-600 mt-1">
                    {data.filter(i => !i.bbs || (Array.isArray(i.bbs) && i.bbs.length === 0)).length} zones pending BBS.
                  </p>
                </div>
             </div>
             <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                <Truck size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-blue-700">Recent Updates</h4>
                  <p className="text-xs text-blue-600 mt-1">{metrics.delivered} zones with deliveries.</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const TrackerView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search ID, BBS, or Zone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setActiveModal('bbs')}
            className="col-span-1 flex items-center justify-center gap-1 md:gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors border border-slate-200"
          >
            <FileSignature size={16} /> <span className="truncate">Assign BBS</span>
          </button>
           <button 
            onClick={() => setActiveModal('delivery')}
            className="col-span-1 flex items-center justify-center gap-1 md:gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors border border-slate-200"
          >
            <PackagePlus size={16} /> <span className="truncate">Log HCS</span>
          </button>
          <button 
            onClick={() => setActiveModal('slab')}
            className="col-span-2 md:col-span-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={18} /> Add Casting
          </button>
        </div>
      </div>
      
      {/* Mobile Card View */}
      <div className="md:hidden bg-slate-50 p-4 space-y-4">
        {filteredData.length > 0 ? (
          filteredData.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 relative">
              <div className="flex justify-between items-start mb-3">
                 <div>
                    <h3 className="font-bold text-slate-800">{item.slabId}</h3>
                    <p className="text-xs text-slate-500">{item.zone}</p>
                 </div>
                 <StatusSelect currentStatus={item.status} onChange={(val) => updateStatus(item, val)} />
              </div>
              
              <div className="space-y-3">
                 <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Target Casting</p>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                       <Hammer size={14} className="text-emerald-500" /> {item.castingDate}
                    </div>
                 </div>

                 <div className="bg-slate-50 p-2 rounded border border-slate-100" onClick={() => startEditingRemark(item)}>
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Remarks (Tap to edit)</p>
                    {editingRemark.id === item.id ? (
                      <input 
                        autoFocus
                        type="text" 
                        className="w-full bg-white border border-blue-300 rounded px-2 py-1 text-xs outline-none"
                        value={editingRemark.text}
                        onChange={(e) => setEditingRemark({...editingRemark, text: e.target.value})}
                        onBlur={saveRemark}
                        onKeyDown={(e) => e.key === 'Enter' && saveRemark()}
                      />
                    ) : (
                      <div className="text-xs text-slate-600 min-h-[1.25rem]">{item.remarks || <span className="text-slate-400 italic">No remarks</span>}</div>
                    )}
                 </div>

                 <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">HCS Deliveries</p>
                      <DeliveryTags deliveries={item.deliveries} castingDate={item.castingDate} />
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">BBS List</p>
                      <BbsTags bbs={item.bbs} castingDate={item.castingDate} onEdit={(idx) => initiateEditBBS(item, idx)} />
                    </div>
                 </div>
              </div>
              
              <button 
                onClick={() => deleteEntry(item.id)}
                className="absolute top-4 right-2 text-slate-300 hover:text-red-500 p-2"
              >
                <X size={16} />
              </button>
            </div>
          ))
        ) : (
           <div className="text-center py-10 text-slate-400">No records found.</div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
              <th className="p-4">Casting ID</th>
              <th className="p-4">Zone / Level</th>
              <th className="p-4">Remarks</th>
              <th className="p-4">BBS Number</th>
              <th className="p-4">HCS Delivery</th>
              <th className="p-4">Target Casting</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-800 align-top">{item.slabId}</td>
                  <td className="p-4 text-slate-600 align-top">{item.zone}</td>
                  <td className="p-4 text-slate-600 align-top max-w-[200px]" onDoubleClick={() => startEditingRemark(item)}>
                    {editingRemark.id === item.id ? (
                      <input 
                        autoFocus
                        type="text" 
                        className="w-full bg-white border border-blue-300 rounded px-2 py-1 text-sm outline-none"
                        value={editingRemark.text}
                        onChange={(e) => setEditingRemark({...editingRemark, text: e.target.value})}
                        onBlur={saveRemark}
                        onKeyDown={(e) => e.key === 'Enter' && saveRemark()}
                      />
                    ) : (
                      <div className="truncate cursor-pointer hover:text-blue-600" title="Double click to edit">
                        {item.remarks || <span className="text-slate-300 italic">--</span>}
                      </div>
                    )}
                  </td>
                  <td className="p-4 align-top">
                    <BbsTags bbs={item.bbs} castingDate={item.castingDate} onEdit={(idx) => initiateEditBBS(item, idx)} />
                  </td>
                  <td className="p-4 align-top">
                    <DeliveryTags deliveries={item.deliveries} castingDate={item.castingDate} />
                  </td>
                  <td className="p-4 text-slate-600 align-top">
                     <div className="flex items-center gap-2">
                      <Hammer size={14} className="text-slate-400" />
                      {item.castingDate}
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <StatusSelect currentStatus={item.status} onChange={(val) => updateStatus(item, val)} />
                  </td>
                  <td className="p-4 text-right align-top">
                    <button 
                      onClick={() => deleteEntry(item.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-8 text-center text-slate-400">
                  {data.length === 0 ? "No data yet. Add a casting target to get started." : "No records found matching your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // If loading auth or not logged in
  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500">Connecting to Cloud...</div>;
  if (!user) return <LoginView />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar (Desktop) */}
      <nav className="bg-slate-900 text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-1.5 rounded-lg">
                <Layers size={20} className="text-white" />
              </div>
              <span className="font-bold text-lg md:text-xl tracking-tight">SB-CasTrack</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-2">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'tracker', label: 'Tracker', icon: FileText },
                { id: 'calendar', label: 'Calendar', icon: CalendarIcon }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <div className="flex items-center justify-end gap-1 text-xs text-emerald-400">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
              <button onClick={handleLogout} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'tracker' && <TrackerView />}
        {activeTab === 'calendar' && <CalendarView data={data} />}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* MODALS */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl md:rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-lg text-slate-800">
                {activeModal === 'slab' && 'New Casting Target'}
                {activeModal === 'bbs' && 'Assign BBS Number'}
                {activeModal === 'delivery' && 'Log HCS Delivery Batch'}
                {activeModal === 'edit-bbs' && 'Edit BBS Details'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6">
            {activeModal === 'slab' && (
              /* --- ADD SLAB FORM (No BBS, No Delivery, No HCS Target) --- */
              <form onSubmit={handleAddSlab} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Zone / Level</label>
                    <input required type="text" placeholder="e.g. Zone B Level 6" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                       value={slabForm.zone} onChange={e => setSlabForm({...slabForm, zone: e.target.value})}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Casting ID will be auto-generated from Zone & Date.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Casting Date</label>
                  <input required type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                      value={slabForm.castingDate} onChange={e => setSlabForm({...slabForm, castingDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Remarks</label>
                  <textarea 
                    placeholder="Add special notes, constraints, or weather warnings..." 
                    className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm h-24 resize-none"
                    value={slabForm.remarks}
                    onChange={e => setSlabForm({...slabForm, remarks: e.target.value})}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Visible on Calendar (hover 3s).</p>
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-200 transition-all">
                    Create Casting Plan
                  </button>
                </div>
              </form>
            )}

            {activeModal === 'bbs' && (
              /* --- ASSIGN BBS FORM (Dropdown) --- */
              <form onSubmit={handleAssignBBS} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Casting Zone</label>
                    <div className="relative">
                      <select 
                        required 
                        className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                        value={bbsForm.selectedSlabId}
                        onChange={e => setBbsForm({...bbsForm, selectedSlabId: e.target.value})}
                      >
                        <option value="">-- Choose Zone --</option>
                        {data.map(slab => {
                          const hasBbs = Array.isArray(slab.bbs) ? slab.bbs.length > 0 : !!slab.bbs;
                          return (
                            <option key={slab.id} value={slab.id}>
                              {slab.slabId} — {slab.zone} ({hasBbs ? (Array.isArray(slab.bbs) ? slab.bbs.length : 1) : 0} BBS)
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                 </div>
                 
                 <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Add BBS Number</label>
                  <input required type="text" placeholder="e.g. BBS-A-09" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                     value={bbsForm.bbsNumber} onChange={e => setBbsForm({...bbsForm, bbsNumber: e.target.value})}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">This will be added to the existing list for this zone.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Date (Opt)</label>
                    <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                       value={bbsForm.targetDate} onChange={e => setBbsForm({...bbsForm, targetDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Actual Date (Opt)</label>
                    <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                       value={bbsForm.actualDate} onChange={e => setBbsForm({...bbsForm, actualDate: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description (Optional)</label>
                  <input type="text" placeholder="e.g. Top bars, Shear links" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                     value={bbsForm.description} onChange={e => setBbsForm({...bbsForm, description: e.target.value})}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Visible on mouse hover.</p>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg shadow-lg transition-all">
                    Assign BBS Number
                  </button>
                </div>
              </form>
            )}

            {activeModal === 'delivery' && (
              /* --- ADD DELIVERY FORM (Batch) --- */
              <form onSubmit={handleAddDelivery} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Casting Zone</label>
                    <div className="relative">
                      <select 
                        required 
                        className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                        value={deliveryForm.selectedSlabId}
                        onChange={e => setDeliveryForm({...deliveryForm, selectedSlabId: e.target.value})}
                      >
                        <option value="">-- Choose Zone --</option>
                        {data.map(slab => {
                          const deliveryCount = Array.isArray(slab.deliveries) ? slab.deliveries.length : (slab.deliveryDate ? 1 : 0);
                          return (
                            <option key={slab.id} value={slab.id}>
                              {slab.slabId} — {slab.zone} ({deliveryCount} batches)
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                 </div>
                 
                 <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Actual Delivery Date</label>
                  <input required type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                     value={deliveryForm.date} onChange={e => setDeliveryForm({...deliveryForm, date: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Batch Info / Quantity</label>
                  <input type="text" placeholder="e.g. Batch 1 - 5 slabs" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                     value={deliveryForm.description} onChange={e => setDeliveryForm({...deliveryForm, description: e.target.value})}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Describe this delivery batch.</p>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg shadow-lg transition-all">
                    Log Actual Delivery Batch
                  </button>
                </div>
              </form>
            )}

            {activeModal === 'edit-bbs' && (
              /* --- EDIT BBS FORM --- */
              <form onSubmit={handleSaveBbsEdit} className="space-y-4">
                 <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">BBS Number</label>
                  <input required type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                     value={editBbsState.data.number} 
                     onChange={e => setEditBbsState({
                       ...editBbsState, 
                       data: { ...editBbsState.data, number: e.target.value }
                     })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Date</label>
                    <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                       value={editBbsState.data.targetDate || ''} 
                       onChange={e => setEditBbsState({
                         ...editBbsState, 
                         data: { ...editBbsState.data, targetDate: e.target.value }
                       })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Actual Date</label>
                    <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                       value={editBbsState.data.actualDate || ''} 
                       onChange={e => setEditBbsState({
                         ...editBbsState, 
                         data: { ...editBbsState.data, actualDate: e.target.value }
                       })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                  <input type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                     value={editBbsState.data.description || ''} 
                     onChange={e => setEditBbsState({
                       ...editBbsState, 
                       data: { ...editBbsState.data, description: e.target.value }
                     })}
                  />
                </div>

                <div className="pt-4 flex gap-2">
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2">
                    <Edit2 size={16} /> Update Entry
                  </button>
                </div>
              </form>
            )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}