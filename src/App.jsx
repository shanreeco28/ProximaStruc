import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
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
  UserCog // Icon for profile edit
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
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
  getFirestore, 
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

/**
 * SB-CasTrack v6.0
 * Features:
 * - BBS & Logistics Reporting Visualization
 * - Profile Editing (Name/Designation)
 * - "Added By" Attribution in Tooltips
 * - Calendar-specific Filtering
 * - Full Auth & Role Management
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
const appId = 'tnd4-castrack';

// --- Global Style Reset ---
const GlobalStyles = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; }
    :root { font-family: Inter, system-ui, sans-serif; line-height: 1.5; color-scheme: light; }
    html, body, #root { height: 100%; width: 100%; margin: 0; padding: 0; }
    body { background-color: #f8fafc; color: #0f172a; }
    @media print { body { background-color: white; } .no-print { display: none !important; } }
  `}</style>
);

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

const StatusSelect = ({ currentStatus, targetDate, actualDate, onChange, disabled }) => {
  let statusStyle = "bg-slate-100 text-slate-600 border-slate-200"; 
  if (currentStatus === 'Delayed') statusStyle = "bg-red-50 text-red-700 border-red-200";
  else if (currentStatus === 'Cast') {
    if (targetDate && actualDate) {
      const t = new Date(targetDate).setHours(0,0,0,0);
      const a = new Date(actualDate).setHours(0,0,0,0);
      statusStyle = a > t ? "bg-red-50 text-red-700 border-red-200 font-bold" : a < t ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold" : "bg-white text-slate-700 border-slate-300"; 
    } else statusStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  return (
    <div className="relative inline-block">
      <select value={currentStatus} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={`appearance-none pl-3 pr-8 py-1 rounded-full text-[10px] md:text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${statusStyle} ${disabled ? 'cursor-default opacity-80' : 'cursor-pointer'}`}>
        <option value="Scheduled">Scheduled</option><option value="Cast">Cast</option><option value="Delayed">Delayed</option>
      </select>
      {!disabled && <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />}
    </div>
  );
};

const BbsTags = ({ bbs, castingDate, onEdit, readOnly }) => {
  let list = Array.isArray(bbs) ? bbs : (bbs ? [bbs] : []);
  if (list.length === 0) return <span className="text-slate-400 italic text-xs">Pending</span>;
  return (
    <div className="flex flex-wrap gap-1 justify-end">
      {list.map((b, idx) => {
        const isObj = typeof b === 'object' && b !== null;
        const text = isObj ? b.number : b;
        const desc = isObj ? b.description : '';
        const actual = isObj ? b.actualDate : '';
        const isCriticalDelay = castingDate && actual && new Date(actual) > new Date(castingDate);
        return (
          <button key={idx} disabled={readOnly} onClick={(e) => { e.stopPropagation(); onEdit && onEdit(idx); }} title={desc || text} className={`font-mono text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap flex items-center gap-1 transition-colors ${isCriticalDelay ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700'} ${readOnly ? 'cursor-default' : ''}`}>
            {text} {isCriticalDelay && <AlertTriangle size={8} className="text-red-500" />}
          </button>
        );
      })}
    </div>
  );
};

const DeliveryTags = ({ deliveries, castingDate }) => {
  let list = Array.isArray(deliveries) ? deliveries : [];
  return (
    <div className="flex flex-col gap-1.5">
      {list.length > 0 ? list.map((d, idx) => {
          const isCriticalDelay = castingDate && new Date(d.date) > new Date(castingDate);
          return (
            <div key={idx} className="flex items-center gap-2 text-xs" title={d.description}>
               <Truck size={12} className={isCriticalDelay ? "text-red-500" : "text-emerald-500"} />
               <span className={`font-medium ${isCriticalDelay ? "text-red-700 font-bold" : "text-slate-700"}`}>{d.date}</span>
               {isCriticalDelay && <span className="text-[8px] text-red-500 font-bold px-1 border border-red-200 rounded bg-red-50">LATE</span>}
            </div>
          );
        }) : <span className="text-slate-300 italic text-[10px] pl-1">No actuals yet</span>}
    </div>
  );
};

const MobileNav = ({ activeTab, setActiveTab }) => {
  const tabs = [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'tracker', label: 'Tracker', icon: FileText }, { id: 'calendar', label: 'Calendar', icon: CalendarIcon }];
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 pb-safe z-50 shadow-lg flex justify-around items-center no-print">
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-full ${activeTab === tab.id ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}>
          <tab.icon size={20} className={activeTab === tab.id ? 'fill-current opacity-20' : ''} /><span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

// --- Tooltips & Ghost Lines ---
const BubbleTooltip = ({ content, author, children, onVisible, onHidden, meta }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [show, setShow] = useState(false);
  const timerRef = useRef(null);
  const handleMouseEnter = (e) => {
    if (onVisible) onVisible(meta);
    if (!content && !author) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    timerRef.current = setTimeout(() => setShow(true), 2000); 
  };
  const handleMouseLeave = () => { if (timerRef.current) clearTimeout(timerRef.current); setShow(false); if (onHidden) onHidden(); };
  return (
    <><div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="relative w-full">{children}</div>{show && (
      <div className="fixed z-[9999] bg-slate-800 text-white text-[10px] p-2 rounded shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-200 max-w-[200px]" style={{ top: position.top, left: position.left, transform: 'translate(-50%, -100%)' }}>
        <div className="font-bold border-b border-slate-600 pb-1 mb-1 text-slate-300 uppercase text-[9px] tracking-wider">Details</div>
        <div className="leading-relaxed">{content}</div>
        {author && <div className="mt-1 pt-1 border-t border-slate-600 text-slate-400 italic text-[8px]">Added by: {author}</div>}
        <div className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-slate-800"></div>
      </div>
    )}</>
  );
};

const GhostLine = ({ startId, endId }) => {
  const [coords, setCoords] = useState(null);
  useEffect(() => {
    if (!startId || !endId) return;
    const update = () => {
      const s = document.getElementById(startId); const e = document.getElementById(endId);
      if (s && e) {
        const sr = s.getBoundingClientRect(); const er = e.getBoundingClientRect();
        const x1 = sr.left + sr.width/2; const y1 = sr.top + sr.height/2;
        let x2 = er.left + er.width/2; let y2 = er.top + er.height/2;
        if (er.top > sr.bottom + 5) y2 = er.top; else if (er.bottom < sr.top - 5) y2 = er.bottom; else { y2 = y1; x2 = x1 < x2 ? er.left : er.right; }
        setCoords({ x1, y1, x2, y2 });
      }
    };
    update(); window.addEventListener('scroll', update, true); window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update); };
  }, [startId, endId]);
  if (!coords) return null;
  const d = `M ${coords.x1} ${coords.y1} L ${coords.x2} ${coords.y1} L ${coords.x2} ${coords.y2}`;
  return (
    <svg className="fixed inset-0 pointer-events-none z-[10]" style={{ width: '100%', height: '100%' }}>
      <defs><marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#dc2626" /></marker></defs>
      <path d={d} fill="none" stroke="#dc2626" strokeWidth="2" markerEnd="url(#arrowhead)" className="drop-shadow-sm opacity-80" /><circle cx={coords.x1} cy={coords.y1} r="3" fill="#dc2626" className="drop-shadow-sm" />
    </svg>
  );
};

// --- Calendar View ---
const CalendarView = ({ data }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [ghostConnection, setGhostConnection] = useState(null); 
  const [filterText, setFilterText] = useState(''); // Calendar specific filter
  const hoverTimerRef = useRef(null); 
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const daysInMonth = getDaysInMonth(currentDate); const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long' }); const year = currentDate.getFullYear();
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  
  const handleEventHover = (meta) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (meta && meta.targetDate && (meta.type === 'castActual' || ((meta.type === 'delivery' || meta.type === 'bbsActual') && meta.isLate))) {
      hoverTimerRef.current = setTimeout(() => {
        let label = '';
        if (meta.type === 'delivery') label = `HCS Target: ${meta.slabId}`;
        else if (meta.type === 'bbsActual') label = `BBS Target: ${meta.bbsNum}`;
        else if (meta.type === 'castActual') label = `Plan: ${meta.slabId}`;
        setGhostConnection({ targetDate: meta.targetDate, actualDate: meta.dateStr, label, endElementId: meta.domId, startElementId: `ghost-${meta.id}-${meta.targetDate}` });
      }, 2000);
    }
  };
  const clearGhost = () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); setGhostConnection(null); };

  const days = []; for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-slate-50/50 border-b border-r border-slate-100"></div>);
  
  // Filter data for calendar
  const filteredData = data.filter(item => 
    !filterText || 
    item.slabId.toLowerCase().includes(filterText.toLowerCase()) || 
    item.zone.toLowerCase().includes(filterText.toLowerCase())
  );

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayId = `cal-day-${dateStr}`; const dayEvents = [];
    filteredData.forEach((item, itemIdx) => {
      const baseId = `${item.id}-${itemIdx}`;
      // Casting Target - pass item.createdBy
      if (item.castingDate === dateStr) { 
        if (!item.actualCastingDate) dayEvents.push({ type: 'castTarget', domId: `evt-cast-target-${baseId}`, tooltipContent: item.remarks || 'Target Casting', author: item.createdBy, ...item }); 
      }
      // Casting Actual
      if (item.actualCastingDate === dateStr) { 
        const isLate = item.castingDate && new Date(item.actualCastingDate) > new Date(item.castingDate); 
        dayEvents.push({ type: 'castActual', isLate, domId: `evt-cast-actual-${baseId}`, tooltipContent: item.remarks || 'Actual Casting', author: item.createdBy, targetDate: item.castingDate, dateStr: item.actualCastingDate, ...item }); 
      }
      // HCS Delivery - pass d.createdBy
      if (Array.isArray(item.deliveries)) item.deliveries.forEach((d, dIdx) => { 
        if (d.date === dateStr) { 
          const isLate = item.hcsTargetDate && new Date(d.date) > new Date(item.hcsTargetDate); 
          dayEvents.push({ type: 'delivery', isLate, domId: `evt-del-${baseId}-${dIdx}`, ...item, tooltipContent: d.description || 'Batch Delivery', author: d.createdBy, dateStr: d.date, targetDate: item.hcsTargetDate }); 
        } 
      });
      // BBS Delivery - pass b.createdBy
      if (Array.isArray(item.bbs)) item.bbs.forEach((b, bIdx) => { 
        if (typeof b === 'object' && b.actualDate === dateStr) { 
          const isLate = b.targetDate && new Date(b.actualDate) > new Date(b.targetDate); 
          dayEvents.push({ type: 'bbsActual', isLate, domId: `evt-bbs-${baseId}-${bIdx}`, ...item, bbsNum: b.number, tooltipContent: b.description || 'BBS Delivery', author: b.createdBy, dateStr: b.actualDate, targetDate: b.targetDate }); 
        } 
      });
    });
    if (ghostConnection && ghostConnection.targetDate === dateStr && !dayEvents.some(e => e.type === 'ghost' && e.label === ghostConnection.label)) dayEvents.push({ type: 'ghost', domId: ghostConnection.startElementId, label: ghostConnection.label });
    
    days.push(
      <div id={dayId} key={`day-${day}`} className="h-24 md:h-32 bg-white border-b border-r border-slate-100 p-1 md:p-2 hover:bg-slate-50 transition-colors group relative overflow-hidden">
        <div className="flex justify-between items-start"><span className={`text-xs md:text-sm font-semibold ${dayEvents.length > 0 ? 'text-slate-800' : 'text-slate-400'}`}>{day}</span>{dayEvents.length > 0 && <span className="text-[9px] md:text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded-full">{dayEvents.length}</span>}</div>
        <div className="mt-1 md:mt-2 space-y-0.5 md:space-y-1 overflow-y-auto max-h-[60px] md:max-h-[85px] scrollbar-hide">
          {dayEvents.map((event, idx) => {
            let colorClass = "bg-slate-100 text-slate-600 border-slate-200"; let icon = <CheckCircle2 size={8} />; let label = event.slabId;
            if (event.type === 'castTarget') { colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100"; icon = <Hammer size={8} />; label = `Plan: ${event.slabId}`; } 
            else if (event.type === 'castActual') { colorClass = event.isLate ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-500 text-white border-emerald-600"; icon = <CheckCircle2 size={8} />; label = `Done: ${event.slabId}`; } 
            else if (event.type === 'delivery') { colorClass = event.isLate ? "bg-red-50 text-red-700 border-red-200" : "bg-blue-50 text-blue-700 border-blue-100"; icon = <Truck size={8} />; } 
            else if (event.type === 'bbsActual') { colorClass = event.isLate ? "bg-red-50 text-red-700 border-red-200" : "bg-purple-50 text-purple-700 border-purple-100"; icon = <Target size={8} />; label = `BBS: ${event.bbsNum}`; } 
            else if (event.type === 'ghost') { colorClass = "bg-white border-2 border-slate-300 border-dashed text-slate-400 z-[15]"; icon = <Target size={8} />; label = event.label; }
            return (
              <BubbleTooltip key={`${event.domId || idx}`} content={event.tooltipContent} author={event.author} onVisible={handleEventHover} onHidden={clearGhost} meta={event}>
                <div id={event.domId} className={`relative z-20 text-[9px] md:text-[10px] px-1 py-0.5 rounded border truncate flex items-center gap-1 cursor-default ${colorClass}`}><span className="shrink-0">{icon}</span><span className="truncate">{label}</span>{event.tooltipContent && <Info size={6} className="ml-auto shrink-0 opacity-50" />}</div>
              </BubbleTooltip>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500 mb-20 md:mb-0 relative">
        {ghostConnection && ghostConnection.endElementId && <GhostLine startId={ghostConnection.startElementId} endId={ghostConnection.endElementId} />}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2"><CalendarIcon className="text-blue-500" size={20} /> {monthName} {year}</h2>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-48">
               <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
               <input 
                 type="text" 
                 placeholder="Filter Zone/ID..." 
                 value={filterText}
                 onChange={(e) => setFilterText(e.target.value)}
                 className="w-full pl-8 pr-2 py-1.5 border border-slate-300 rounded-lg text-sm outline-none"
               />
               {filterText && <button onClick={() => setFilterText('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><X size={14} /></button>}
             </div>
             <div className="flex gap-1">
                <button onClick={prevMonth} className="p-1.5 md:p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronLeft size={18} /></button><button onClick={() => setCurrentDate(new Date())} className="px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-medium hover:bg-slate-100 rounded-lg text-slate-600">Today</button><button onClick={nextMonth} className="p-1.5 md:p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronRight size={18} /></button>
             </div>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center border-b border-slate-200 bg-slate-50">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => <div key={`${d}-${idx}`} className="py-2 text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider">{d}</div>)}</div>
        <div className="grid grid-cols-7 border-l border-slate-200">{days}</div>
        <div className="p-4 bg-slate-50 flex flex-wrap gap-x-4 gap-y-2 text-[10px] md:text-xs text-slate-500 border-t border-slate-200"><div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div> Actual HCS</div><div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-100 border border-emerald-200 rounded"></div> Casting</div><div className="flex items-center gap-2"><div className="w-3 h-3 bg-white border border-slate-300 border-dashed rounded"></div> Target (Ghost)</div><div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div> Late Delivery</div></div>
      </div>
    </>
  );
};

// --- Login View ---
const LoginView = ({ onLogin }) => {
  const [mode, setMode] = useState('login'); 
  const [formData, setFormData] = useState({ email: '', password: '', name: '', birthday: '', designation: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleGoogle = async () => {
    setLoading(true); setError('');
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const userDoc = await getDoc(doc(db, 'artifacts', appId, 'users', result.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'artifacts', appId, 'users', result.user.uid), {
          name: result.user.displayName, email: result.user.email, role: 'guest', designation: 'N/A', createdAt: new Date().toISOString()
        });
      }
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  const handleEmailLogin = async (e) => { e.preventDefault(); setLoading(true); setError(''); try { await signInWithEmailAndPassword(auth, formData.email, formData.password); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  const handleRegister = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(result.user, { displayName: formData.name });
      await setDoc(doc(db, 'artifacts', appId, 'users', result.user.uid), { name: formData.name, email: formData.email, birthday: formData.birthday, designation: formData.designation, role: 'guest', createdAt: new Date().toISOString() });
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  const handleMagicLink = async (e) => { e.preventDefault(); setLoading(true); setError(''); const actionCodeSettings = { url: window.location.href, handleCodeInApp: true }; try { await sendSignInLinkToEmail(auth, formData.email, actionCodeSettings); window.localStorage.setItem('emailForSignIn', formData.email); setMagicSent(true); } catch (err) { setError(err.message); } finally { setLoading(false); } };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
        <div className="bg-slate-900 p-8 text-center"><div className="mx-auto bg-blue-500 w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-lg"><Layers className="text-white" size={32} /></div><h1 className="text-2xl font-bold text-white">SB-CasTrack</h1><p className="text-slate-400 mt-2">Construction Logistics Management</p></div>
        <div className="p-8 space-y-6">
          {mode === 'login' && (<><form onSubmit={handleEmailLogin} className="space-y-4"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label><input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none" required /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label><input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none" required /></div><button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">{loading ? 'Signing In...' : <><Shield size={18} /> Sign In</>}</button></form><div className="flex items-center gap-2 my-2"><div className="h-px bg-slate-200 flex-1"></div><span className="text-xs text-slate-400">OR</span><div className="h-px bg-slate-200 flex-1"></div></div><button onClick={handleGoogle} className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G" /> Sign in with Google</button><button onClick={() => setMode('magic')} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"><Mail size={18} /> Sign in via Email Link</button><div className="text-center text-sm text-slate-500 mt-4">Don't have an account? <button onClick={() => setMode('register')} className="text-blue-600 font-bold hover:underline">Register</button></div></>)}
          {mode === 'register' && (<form onSubmit={handleRegister} className="space-y-4"><h3 className="text-lg font-bold text-slate-800 mb-2">Create Account</h3><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label><input name="name" type="text" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" required /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Birthday</label><input name="birthday" type="date" value={formData.birthday} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" required /></div></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Designation</label><input name="designation" type="text" placeholder="e.g. Site Engineer" value={formData.designation} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" required /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label><input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" required /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label><input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" required /></div><button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">{loading ? 'Creating...' : 'Register Now'}</button><button type="button" onClick={() => setMode('login')} className="w-full text-slate-500 text-sm hover:text-slate-700">Back to Login</button></form>)}
          {mode === 'magic' && (<div className="space-y-4"><h3 className="text-lg font-bold text-slate-800">Passwordless Login</h3>{magicSent ? (<div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center"><CheckCircle2 className="mx-auto mb-2" size={32} />Check your email ({formData.email}) for the sign-in link!</div>) : (<form onSubmit={handleMagicLink} className="space-y-4"><p className="text-sm text-slate-500">Enter your email and we'll send you a link to sign in instantly.</p><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label><input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none" required /></div><button type="submit" disabled={loading} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">{loading ? 'Sending...' : 'Send Magic Link'}</button></form>)}<button type="button" onClick={() => setMode('login')} className="w-full text-slate-500 text-sm hover:text-slate-700">Back to Login</button></div>)}
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">{error}</div>}
        </div>
      </div>
    </div>
  );
};

// --- Main Application Component ---

export default function App() {
  const [user, setUser] = useState(null); 
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [activeModal, setActiveModal] = useState(null); 

  const [editingRemark, setEditingRemark] = useState({ id: null, text: '' });
  const [editBbsState, setEditBbsState] = useState({ slabId: '', bbsIndex: -1, data: {} });
  const [editCastingState, setEditCastingState] = useState({ id: '', target: '', actual: '' });
  // Profile edit state
  const [profileForm, setProfileForm] = useState({ name: '', designation: '' });

  const [slabForm, setSlabForm] = useState({ zone: '', castingDate: '', remarks: '', status: 'Scheduled', actualCastingDate: '' });
  const [bbsForm, setBbsForm] = useState({ selectedSlabId: '', bbsNumber: '', description: '', targetDate: '', actualDate: '' });
  const [deliveryForm, setDeliveryForm] = useState({ selectedSlabId: '', date: '', description: '' });

  // --- Auth & Persistent State ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isSignInWithEmailLink(auth, window.location.href)) {
          let email = window.localStorage.getItem('emailForSignIn');
          if (!email) email = window.prompt('Please provide your email for confirmation');
          await signInWithEmailLink(auth, email, window.location.href);
          window.localStorage.removeItem('emailForSignIn');
        } else if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try { await signInWithCustomToken(auth, __initial_auth_token); } catch (err) {}
        } else {
          // If no user, stay signed out until login (removed auto-anon for this version to force login screen)
        }
      } catch (error) { console.error("Auth error:", error); } finally { setAuthLoading(false); }
    };
    initAuth();
    
    // Auth Listener with Profile Sync
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid));
          if (userDoc.exists()) {
             const userData = { ...currentUser, ...userDoc.data() };
             setUser(userData);
             localStorage.setItem('sb-user', JSON.stringify(userData));
          } else {
             setUser({ ...currentUser, role: 'guest' }); 
          }
        } catch (e) {
          setUser({ ...currentUser, role: 'guest' });
        }
      } else {
        setUser(null);
        localStorage.removeItem('sb-user');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedTab = localStorage.getItem('sb-tab');
    if (savedTab) setActiveTab(savedTab);
  }, []);

  useEffect(() => { if (activeTab) localStorage.setItem('sb-tab', activeTab); }, [activeTab]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'slabs'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(items);
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => { await signOut(auth); };
  const checkAdmin = () => { if (user?.role !== 'admin') { alert("Permission Denied: Admin access required."); return false; } return true; };

  // --- Update Profile ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), {
        name: profileForm.name,
        designation: profileForm.designation
      });
      // Force local update (listener will catch it too, but this is immediate)
      setUser(prev => ({ ...prev, name: profileForm.name, designation: profileForm.designation }));
      setActiveModal(null);
    } catch (err) { alert(err.message); }
  };
  const openProfileModal = () => {
    setProfileForm({ name: user.name || '', designation: user.designation || '' });
    setActiveModal('profile');
  };

  // --- CRUD Handlers ---
  const handleAddSlab = async (e) => {
    e.preventDefault(); if (!checkAdmin()) return;
    const zoneCode = slabForm.zone.trim().split(/\s+/).map(w => w.charAt(0)).join('').toUpperCase();
    const dateCode = slabForm.castingDate ? slabForm.castingDate.replace(/-/g, '').slice(2) : '000000'; 
    const autoSlabId = `${zoneCode}-${dateCode}`;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'slabs'), { 
        ...slabForm, slabId: autoSlabId, bbs: [], deliveries: [], notes: '', 
        createdAt: new Date().toISOString(), createdBy: user.name // Add attribution
      });
      setActiveModal(null); setSlabForm({ zone: '', castingDate: '', remarks: '', status: 'Scheduled', actualCastingDate: '' });
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleAssignBBS = async (e) => {
    e.preventDefault(); if (!checkAdmin()) return;
    try { 
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slabs', bbsForm.selectedSlabId), { 
        bbs: arrayUnion({ 
          number: bbsForm.bbsNumber, 
          description: bbsForm.description || '', 
          targetDate: bbsForm.targetDate || '', 
          actualDate: bbsForm.actualDate || '',
          createdBy: user.name 
        }) 
      }); 
      setActiveModal(null); setBbsForm({ selectedSlabId: '', bbsNumber: '', description: '', targetDate: '', actualDate: '' }); 
    } catch (err) { alert(err.message); }
  };

  const handleAddDelivery = async (e) => {
    e.preventDefault(); if (!checkAdmin()) return;
    try { 
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slabs', deliveryForm.selectedSlabId), { 
        deliveries: arrayUnion({ 
          date: deliveryForm.date, 
          description: deliveryForm.description || 'Batch Delivery',
          createdBy: user.name 
        }) 
      }); 
      setActiveModal(null); setDeliveryForm({ selectedSlabId: '', date: '', description: '' }); 
    } catch (err) { alert(err.message); }
  };

  const deleteEntry = async (id) => { if (!checkAdmin() || !confirm("Delete record?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slabs', id)); } catch (err) { alert(err.message); } };
  const updateStatus = async (item, newStatus) => { if (!checkAdmin()) return; try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slabs', item.id), { status: newStatus }); } catch (err) { alert(err.message); } };
  const startEditingRemark = (item) => { if(!checkAdmin()) return; setEditingRemark({ id: item.id, text: item.remarks || '' }); };
  const saveRemark = async () => { if (!editingRemark.id) return; try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slabs', editingRemark.id), { remarks: editingRemark.text }); setEditingRemark({ id: null, text: '' }); } catch (err) { alert(err.message); } };
  const initiateEditBBS = (slab, bbsIndex) => { if (!checkAdmin()) return; const item = slab.bbs[bbsIndex]; setEditBbsState({ slabId: slab.id, bbsIndex, data: typeof item === 'object' ? item : { number: item, description: '' } }); setActiveModal('edit-bbs'); };
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
    // New Metrics for Report
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div><h3 className="font-bold text-xl text-slate-800 flex items-center gap-2"><BarChart3 className="text-blue-600" /> Project Status & Logistics Report</h3><p className="text-xs text-slate-500 mt-1">Generated: {new Date().toLocaleDateString()}</p></div>
          <div className="flex gap-2 no-print"><button onClick={() => window.print()} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full transition-colors hidden md:block"><Printer size={20} /></button><button onClick={() => setActiveModal(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X size={24} /></button></div>
        </div>
        <div className="overflow-y-auto p-8 space-y-8 print:p-0">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200"><p className="text-xs font-bold text-slate-500 uppercase">Total Scope</p><p className="text-3xl font-bold text-slate-800 mt-1">{metrics.total}</p></div>
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100"><p className="text-xs font-bold text-emerald-600 uppercase">Completed</p><p className="text-3xl font-bold text-emerald-900 mt-1">{metrics.cast} <span className="text-sm font-normal">({Math.round((metrics.cast/metrics.total)*100 || 0)}%)</span></p></div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100"><p className="text-xs font-bold text-blue-600 uppercase">Scheduled</p><p className="text-3xl font-bold text-blue-900 mt-1">{metrics.pending}</p></div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-100"><p className="text-xs font-bold text-red-600 uppercase">Delayed / Late</p><p className="text-3xl font-bold text-red-900 mt-1">{metrics.late + data.filter(d => d.status === 'Delayed').length}</p></div>
          </div>
          
          {/* Enhanced Logistics Section */}
          <div className="border rounded-xl p-6 bg-slate-50/50">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Truck size={18} /> Logistics & BBS Performance</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-3">
                 <p className="text-sm font-bold text-slate-600">BBS Delivery Status</p>
                 <div className="flex justify-between text-xs text-slate-500 mb-1">
                   <span>{metrics.deliveredBBS} Delivered</span>
                   <span>{metrics.totalBBS} Total Orders</span>
                 </div>
                 <div className="h-3 bg-white border border-slate-200 rounded-full overflow-hidden">
                   <div style={{ width: `${(metrics.deliveredBBS / Math.max(metrics.totalBBS, 1)) * 100}%` }} className="bg-indigo-500 h-full"></div>
                 </div>
                 <p className="text-xs text-right text-indigo-600 font-medium">{Math.round((metrics.deliveredBBS / Math.max(metrics.totalBBS, 1)) * 100)}% Fulfilled</p>
               </div>
               
               <div className="space-y-3">
                 <p className="text-sm font-bold text-slate-600">HCS Batch Tracking</p>
                 <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                    <span className="text-xs">Zones Fully Delivered</span>
                    <span className="font-mono font-bold text-amber-600">{metrics.delivered}</span>
                 </div>
                 <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                    <span className="text-xs">Total Batches Logged</span>
                    <span className="font-mono font-bold text-slate-800">{data.reduce((acc, curr) => acc + (curr.deliveries?.length || 0), 0)}</span>
                 </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border rounded-xl p-6"><h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={18} /> Schedule Adherence</h4><div className="space-y-4"><div><div className="flex justify-between text-sm mb-1"><span>Early Completion</span> <span className="font-bold text-emerald-600">{metrics.early}</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div style={{width: `${(metrics.early/metrics.cast)*100 || 0}%`}} className="h-full bg-emerald-500"></div></div></div><div><div className="flex justify-between text-sm mb-1"><span>On-Time</span> <span className="font-bold text-slate-600">{metrics.onTime}</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div style={{width: `${(metrics.onTime/metrics.cast)*100 || 0}%`}} className="h-full bg-slate-400"></div></div></div><div><div className="flex justify-between text-sm mb-1"><span>Late / Delayed</span> <span className="font-bold text-red-600">{metrics.late}</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div style={{width: `${(metrics.late/metrics.cast)*100 || 0}%`}} className="h-full bg-red-500"></div></div></div></div></div>
            <div className="border rounded-xl p-6"><h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity size={18} /> Site Efficiency</h4><div className="space-y-4 text-sm"><div className="flex justify-between items-center p-2 bg-slate-50 rounded"><span>Pending HCS</span><span className="font-bold">{metrics.total - metrics.delivered} Zones</span></div><div className="flex justify-between items-center p-2 bg-slate-50 rounded"><span>Active Issues (Remarks)</span><span className="font-bold">{data.filter(i => i.remarks).length}</span></div><div className="flex justify-between items-center p-2 bg-slate-50 rounded"><span>Critical Path Delays</span><span className="font-bold text-red-600">{data.filter(i => i.status === 'Delayed').length}</span></div></div></div>
          </div>
          <div><h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><AlertTriangle size={18} /> Risk Register (Critical Delays)</h4><table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden"><thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold"><tr><th className="p-3 text-left">Zone / ID</th><th className="p-3 text-left">Planned Date</th><th className="p-3 text-left">Actual Date</th><th className="p-3 text-left">Remarks / Impact</th></tr></thead><tbody className="divide-y divide-slate-100">{data.filter(i => i.status === 'Delayed' || (i.castingDate && i.actualCastingDate && new Date(i.actualCastingDate) > new Date(i.castingDate))).map(item => (<tr key={item.id}><td className="p-3 font-medium text-slate-800">{item.slabId} <br/><span className="text-xs text-slate-400 font-normal">{item.zone}</span></td><td className="p-3 text-slate-600">{item.castingDate}</td><td className="p-3 text-red-600 font-bold">{item.actualCastingDate || 'Pending'}</td><td className="p-3 text-slate-500 italic">{item.remarks || 'No specific remarks'}</td></tr>))}</tbody></table></div>
        </div>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-slate-800">Project Overview</h2><button onClick={() => setActiveModal('report')} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"><BarChart3 size={18} /> Generate Report</button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Total Casts" value={metrics.total} icon={Layers} subtext="Total scope" color="slate" />
        <Card title="HCS Delivered" value={metrics.delivered} icon={Truck} subtext="Zones with deliveries" color="amber" />
        <Card title="Completed" value={metrics.cast} icon={CheckCircle2} subtext={`${metrics.total > 0 ? Math.round((metrics.cast/metrics.total)*100) : 0}% progress`} color="emerald" />
        <Card title="Pending Logistics" value={metrics.pending} icon={Clock} subtext="Scheduled to Cast" color="blue" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
          <div className="flex justify-between items-center mb-4 md:mb-6"><h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2"><CalendarIcon className="text-blue-500" size={20} /> Upcoming Castings</h2><button onClick={() => setActiveTab('calendar')} className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium">View Full Schedule</button></div>
          <div className="space-y-4">{data.filter(i => i.status !== 'Cast' && i.castingDate).sort((a, b) => new Date(a.castingDate) - new Date(b.castingDate)).slice(0, 3).map((item) => (<div key={item.id} className="flex items-center justify-between p-3 md:p-4 bg-slate-50 rounded-lg border border-slate-100"><div className="flex items-center gap-3 md:gap-4"><div className="bg-white p-2 rounded border border-slate-200 font-mono text-xs font-bold text-slate-600 text-center min-w-[40px] md:min-w-[50px]">{new Date(item.castingDate).getDate()}<br/>{new Date(item.castingDate).toLocaleString('default', { month: 'short' }).toUpperCase()}</div><div><h4 className="text-sm md:text-base font-bold text-slate-800">{item.slabId}</h4><p className="text-xs text-slate-500">{item.zone}</p></div></div><div className="text-right"><div className="text-xs text-slate-400 mb-1 flex justify-end"><BbsTags bbs={item.bbs} castingDate={item.castingDate} /></div><StatusSelect disabled={true} currentStatus={item.status} targetDate={item.castingDate} actualDate={item.actualCastingDate} onChange={() => {}} /></div></div>))}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
           <div className="flex justify-between items-center mb-4 md:mb-6"><h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2"><AlertTriangle className="text-amber-500" size={20} /> Alerts</h2></div>
           <div className="space-y-3"><div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3"><AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" /><div><h4 className="text-sm font-bold text-red-700">Missing BBS</h4><p className="text-xs text-red-600 mt-1">{data.filter(i => !i.bbs || (Array.isArray(i.bbs) && i.bbs.length === 0)).length} zones pending BBS.</p></div></div></div>
        </div>
      </div>
    </div>
  );

  const TrackerView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row items-center gap-2 w-full"><div className="relative w-full md:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none w-full" /></div><div className="flex items-center gap-2 w-full md:w-auto"><input type="date" value={dateFilter.start} onChange={e => setDateFilter({...dateFilter, start: e.target.value})} className="px-2 py-2 border border-slate-300 rounded-lg text-xs outline-none" /><span className="text-slate-400">-</span><input type="date" value={dateFilter.end} onChange={e => setDateFilter({...dateFilter, end: e.target.value})} className="px-2 py-2 border border-slate-300 rounded-lg text-xs outline-none" />{(dateFilter.start || dateFilter.end) && (<button onClick={() => setDateFilter({start: '', end: ''})} className="text-slate-400 hover:text-red-500"><X size={16}/></button>)}</div></div>
        {/* Admin Buttons */}
        {user?.role === 'admin' && (<div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto"><button onClick={() => setActiveModal('bbs')} className="col-span-1 flex items-center justify-center gap-1 md:gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors border border-slate-200"><FileSignature size={16} /><span className="truncate">Assign BBS</span></button><button onClick={() => setActiveModal('delivery')} className="col-span-1 flex items-center justify-center gap-1 md:gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors border border-slate-200"><PackagePlus size={16} /><span className="truncate">Log HCS</span></button><button onClick={() => setActiveModal('slab')} className="col-span-2 md:col-span-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"><Plus size={18} /> Add Casting</button></div>)}
      </div>
      {/* Table & Cards logic */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200"><th className="p-4">Casting ID</th><th className="p-4">Zone / Level</th><th className="p-4">Remarks</th><th className="p-4">BBS Number</th><th className="p-4">HCS Delivery</th><th className="p-4">Casting Dates</th><th className="p-4">Status</th>{user?.role === 'admin' && <th className="p-4 text-right">Actions</th>}</tr></thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-slate-800 align-top">{item.slabId}</td>
                <td className="p-4 text-slate-600 align-top">{item.zone}</td>
                <td className="p-4 text-slate-600 align-top max-w-[200px]" onDoubleClick={() => startEditingRemark(item)}>{editingRemark.id === item.id ? (<input autoFocus type="text" className="w-full bg-white border border-blue-300 rounded px-2 py-1 text-sm outline-none" value={editingRemark.text} onChange={(e) => setEditingRemark({...editingRemark, text: e.target.value})} onBlur={saveRemark} onKeyDown={(e) => e.key === 'Enter' && saveRemark()} />) : (<div className={`truncate ${user?.role==='admin'?'cursor-pointer hover:text-blue-600':''}`}>{item.remarks || <span className="text-slate-300 italic">--</span>}</div>)}</td>
                <td className="p-4 align-top"><BbsTags bbs={item.bbs} castingDate={item.castingDate} onEdit={(idx) => initiateEditBBS(item, idx)} readOnly={user?.role !== 'admin'} /></td>
                <td className="p-4 align-top"><DeliveryTags deliveries={item.deliveries} castingDate={item.castingDate} /></td>
                <td className="p-4 text-slate-600 align-top"><div className="flex flex-col gap-1"><div className="flex items-center gap-2"><Hammer size={14} className="text-slate-400" /> <span className="text-xs text-slate-500">Target:</span> {item.castingDate}</div>{item.actualCastingDate && (<div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> <span className="text-xs text-slate-500">Actual:</span> <span className="font-bold">{item.actualCastingDate}</span></div>)}{user?.role === 'admin' && <button onClick={() => initiateEditCasting(item)} className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-1"><Edit2 size={10} /> Edit Dates</button>}</div></td>
                <td className="p-4 align-top"><StatusSelect disabled={user?.role !== 'admin'} currentStatus={item.status} targetDate={item.castingDate} actualDate={item.actualCastingDate} onChange={(val) => updateStatus(item, val)} /></td>
                {user?.role === 'admin' && <td className="p-4 text-right align-top"><button onClick={() => deleteEntry(item.id)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18} /></button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Card View */}
      <div className="md:hidden bg-slate-50 p-4 space-y-4">
        {filteredData.map(item => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 relative">
             <div className="flex justify-between items-start mb-3"><div><h3 className="font-bold text-slate-800">{item.slabId}</h3><p className="text-xs text-slate-500">{item.zone}</p></div><StatusSelect disabled={user?.role !== 'admin'} currentStatus={item.status} targetDate={item.castingDate} actualDate={item.actualCastingDate} onChange={(val) => updateStatus(item, val)} /></div>
             <div className="space-y-3">
                 <div className="bg-slate-50 p-2 rounded border border-slate-100"><p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Target Casting</p><div className="flex items-center justify-between text-sm text-slate-700"><span className="flex items-center gap-2"><Hammer size={14} className="text-emerald-500" /> {item.castingDate}</span>{user?.role === 'admin' && <button onClick={() => initiateEditCasting(item)} className="text-slate-400 hover:text-blue-600"><Edit2 size={14} /></button>}</div>{item.actualCastingDate && (<div className="flex items-center gap-2 text-sm text-slate-700 mt-1 pl-6"><span className="text-[10px] text-slate-400 uppercase">Actual:</span><span className="font-bold text-emerald-700">{item.actualCastingDate}</span></div>)}</div>
                 <div className="bg-slate-50 p-2 rounded border border-slate-100" onClick={() => startEditingRemark(item)}><p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Remarks (Tap to edit)</p>{editingRemark.id === item.id ? (<input autoFocus type="text" className="w-full bg-white border border-blue-300 rounded px-2 py-1 text-xs outline-none" value={editingRemark.text} onChange={(e) => setEditingRemark({...editingRemark, text: e.target.value})} onBlur={saveRemark} onKeyDown={(e) => e.key === 'Enter' && saveRemark()} />) : (<div className="text-xs text-slate-600 min-h-[1.25rem]">{item.remarks || <span className="text-slate-400 italic">No remarks</span>}</div>)}</div>
                 <div className="grid grid-cols-2 gap-2"><div className="bg-slate-50 p-2 rounded border border-slate-100"><p className="text-[10px] text-slate-400 uppercase font-bold mb-1">HCS Deliveries</p><DeliveryTags deliveries={item.deliveries} castingDate={item.castingDate} /></div><div className="bg-slate-50 p-2 rounded border border-slate-100"><p className="text-[10px] text-slate-400 uppercase font-bold mb-1">BBS List</p><BbsTags bbs={item.bbs} castingDate={item.castingDate} onEdit={(idx) => initiateEditBBS(item, idx)} readOnly={user?.role !== 'admin'} /></div></div>
             </div>
             {user?.role === 'admin' && (<button onClick={() => deleteEntry(item.id)} className="absolute top-4 right-2 text-slate-300 hover:text-red-500 p-2"><X size={16} /></button>)}
          </div>
        ))}
      </div>
    </div>
  );

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500">Connecting to Cloud...</div>;
  if (!user) return <LoginView onLogin={(role) => { /* handled inside LoginView now */ }} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <GlobalStyles />
      <nav className="bg-slate-900 text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3"><div className="bg-blue-500 p-1.5 rounded-lg"><Layers size={20} className="text-white" /></div><span className="font-bold text-lg md:text-xl tracking-tight">SB-CasTrack</span></div>
          <div className="hidden md:flex items-center space-x-2">
            {[{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'tracker', label: 'Tracker', icon: FileText }, { id: 'calendar', label: 'Calendar', icon: CalendarIcon }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}><tab.icon size={16} />{tab.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block cursor-pointer" onClick={() => setActiveModal('profile')}>
               <p className="text-sm font-medium text-white">{user.name || user.email}</p>
               <p className="text-[10px] text-slate-400 text-right">{user.designation || 'No Designation'}</p>
               <div className="flex items-center justify-end gap-1 text-xs text-emerald-400"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>{user.role === 'admin' ? 'Admin Access' : 'Guest Mode'}</div>
             </div>
             <button onClick={handleLogout} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"><LogOut size={20} /></button>
          </div>
        </div>
      </nav>
      {/* FIX: Call internal views as functions () instead of components < /> to prevent remounting/focus loss */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {activeTab === 'dashboard' ? DashboardView() : activeTab === 'tracker' ? TrackerView() : <CalendarView data={data} />}
      </main>
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl md:rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0"><h3 className="font-bold text-lg text-slate-800">Action</h3><button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
            <div className="overflow-y-auto p-6">
               {activeModal === 'slab' && <form onSubmit={handleAddSlab} className="space-y-4"> <div className="grid grid-cols-2 gap-4"> <div className="col-span-2"> <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Zone / Level</label> <input required type="text" placeholder="e.g. Zone B Level 6" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={slabForm.zone} onChange={e => setSlabForm({...slabForm, zone: e.target.value})} /> </div> </div> <div> <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Casting Date</label> <input required type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={slabForm.castingDate} onChange={e => setSlabForm({...slabForm, castingDate: e.target.value})} /> </div> <div> <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Remarks</label> <textarea placeholder="Notes..." className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg outline-none text-sm h-24 resize-none" value={slabForm.remarks} onChange={e => setSlabForm({...slabForm, remarks: e.target.value})} /> </div> <div className="pt-4"> <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg">Create Plan</button> </div> </form>}
               {activeModal === 'bbs' && <form onSubmit={handleAssignBBS} className="space-y-4"> <div> <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Casting Zone</label> <select required className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg outline-none bg-white" value={bbsForm.selectedSlabId} onChange={e => setBbsForm({...bbsForm, selectedSlabId: e.target.value})}> <option value="">-- Choose Zone --</option> {data.map(s => <option key={s.id} value={s.id}>{s.slabId}</option>)} </select> </div> <div> <label className="block text-xs font-bold text-slate-500 uppercase mb-1">BBS Number</label> <input required type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg outline-none" value={bbsForm.bbsNumber} onChange={e => setBbsForm({...bbsForm, bbsNumber: e.target.value})} /> </div> <div className="grid grid-cols-2 gap-4"> <div> <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target</label> <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg outline-none text-sm" value={bbsForm.targetDate} onChange={e => setBbsForm({...bbsForm, targetDate: e.target.value})} /> </div> <div> <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Actual</label> <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg outline-none text-sm" value={bbsForm.actualDate} onChange={e => setBbsForm({...bbsForm, actualDate: e.target.value})} /> </div> </div> <div> <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Desc</label> <input type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg outline-none" value={bbsForm.description} onChange={e => setBbsForm({...bbsForm, description: e.target.value})} /> </div> <div className="pt-4"> <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg">Assign</button> </div> </form>}
               {activeModal === 'delivery' && <form onSubmit={handleAddDelivery} className="space-y-4"> <div> <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Zone</label> <select required className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg outline-none bg-white" value={deliveryForm.selectedSlabId} onChange={e => setDeliveryForm({...deliveryForm, selectedSlabId: e.target.value})}> <option value="">-- Choose Zone --</option> {data.map(s => <option key={s.id} value={s.id}>{s.slabId}</option>)} </select> </div> <div> <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Actual Date</label> <input required type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg outline-none text-sm" value={deliveryForm.date} onChange={e => setDeliveryForm({...deliveryForm, date: e.target.value})} /> </div> <div> <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Batch Info</label> <input type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg outline-none" value={deliveryForm.description} onChange={e => setDeliveryForm({...deliveryForm, description: e.target.value})} /> </div> <div className="pt-4"> <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg">Log Delivery</button> </div> </form>}
               {activeModal === 'edit-bbs' && <form onSubmit={handleSaveBbsEdit} className="space-y-4"> <div> <label className="block text-xs font-bold text-slate-500 uppercase mb-1">BBS Number</label> <input required type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg outline-none" value={editBbsState.data.number} onChange={e => setEditBbsState({...editBbsState, data: { ...editBbsState.data, number: e.target.value }})} /> </div> <div className="grid grid-cols-2 gap-4"> <div> <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target</label> <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg outline-none text-sm" value={editBbsState.data.targetDate || ''} onChange={e => setEditBbsState({...editBbsState, data: { ...editBbsState.data, targetDate: e.target.value }})} /> </div> <div> <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Actual</label> <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg outline-none text-sm" value={editBbsState.data.actualDate || ''} onChange={e => setEditBbsState({...editBbsState, data: { ...editBbsState.data, actualDate: e.target.value }})} /> </div> </div> <div> <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Desc</label> <input type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg outline-none" value={editBbsState.data.description || ''} onChange={e => setEditBbsState({...editBbsState, data: { ...editBbsState.data, description: e.target.value }})} /> </div> <div className="pt-4"> <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">Update</button> </div> </form>}
               {activeModal === 'edit-casting' && <form onSubmit={handleSaveCastingEdit} className="space-y-4"> <div className="grid grid-cols-2 gap-4"> <div> <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target</label> <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg outline-none text-sm" value={editCastingState.target} onChange={e => setEditCastingState({...editCastingState, target: e.target.value})} /> </div> <div> <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Actual</label> <input type="date" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg outline-none text-sm" value={editCastingState.actual} onChange={e => setEditCastingState({...editCastingState, actual: e.target.value})} /> </div> </div> <div className="pt-4"> <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">Save Dates</button> </div> </form>}
               {activeModal === 'profile' && <form onSubmit={handleUpdateProfile} className="space-y-4"> <div> <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label> <input type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg outline-none" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} /> </div> <div> <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Designation</label> <input type="text" className="w-full px-3 py-3 md:py-2 border border-slate-300 rounded-lg outline-none" value={profileForm.designation} onChange={e => setProfileForm({...profileForm, designation: e.target.value})} /> </div> <div className="pt-4"> <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">Save Profile</button> </div> </form>}
               {activeModal === 'report' && ReportView()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}