import React, { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react';
import { getDaysInMonth, getFirstDayOfMonth } from './utils/dateHelpers';
import DeliveryTags from './components/DeliveryTags';
import GhostLine from './components/GhostLine';
import ProjectSelection from './components/ProjectSelection';
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
  RefreshCw
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import {
  getAuth,
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
  getDoc,
  orderBy,
  limit
} from 'firebase/firestore';

const QUERY_LIMIT = 500;

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

// --- Custom Construction Logo ---
const AppLogo = ({ className = "h-10 w-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M16 60V24H32V60" fill="#334155" />
    <path d="M32 60V12H48V60" fill="#475569" />
    <rect x="20" y="28" width="8" height="4" fill="#94a3b8" />
    <rect x="20" y="36" width="8" height="4" fill="#94a3b8" />
    <rect x="20" y="44" width="8" height="4" fill="#94a3b8" />
    <rect x="20" y="52" width="8" height="4" fill="#94a3b8" />
    <rect x="36" y="16" width="8" height="4" fill="#cbd5e1" />
    <rect x="36" y="24" width="8" height="4" fill="#cbd5e1" />
    <rect x="36" y="32" width="8" height="4" fill="#cbd5e1" />
    <rect x="36" y="40" width="8" height="4" fill="#cbd5e1" />
    <rect x="36" y="48" width="8" height="4" fill="#cbd5e1" />
    <rect x="8" y="14" width="20" height="5" rx="1" fill="#1B5E20" stroke="#14532d" strokeWidth="1"/>
    <path d="M18 14L18 4" stroke="#F9A825" strokeWidth="2" />
    <path d="M48 12L48 4L14 4" stroke="#F9A825" strokeWidth="3" strokeLinecap="round" />
    <rect x="48" y="2" width="8" height="6" fill="#b45309" />
    <path d="M2 60H62" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// --- Helper Components ---

const MiniCalendar = ({ date, label, type }) => {
  const [y, m, dNum] = date.split('-').map(Number);
  const d = new Date(y, m - 1, dNum);
  const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();
  const day = dNum;
  const color = type === 'actual' ? 'emerald' : 'blue';
  const headerClass = `bg-${color}-500 text-white text-[10px] font-bold py-0.5 uppercase tracking-wide`;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden w-16 text-center animate-in zoom-in-95 duration-200">
      <div className={headerClass}>{month}</div>
      <div className="text-xl font-bold text-slate-800 dark:text-white py-1">{day}</div>
      <div className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[8px] py-0.5 border-t border-slate-100 dark:border-slate-700 truncate px-1">{label}</div>
    </div>
  );
};

const Card = ({ title, value, icon: IconComponent, subtext, color = "blue", trend = null, size = "default" }) => {
  const sizeClasses = {
    small: "p-3 md:p-4",
    default: "p-4 md:p-6",
    large: "p-5 md:p-7"
  };
  
  const valueSizeClasses = {
    small: "text-lg md:text-xl",
    default: "text-xl md:text-2xl", 
    large: "text-2xl md:text-3xl"
  };

  return (
    <div className={`bg-white dark:bg-slate-800 ${sizeClasses[size]} rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 group relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/20 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-semibold uppercase tracking-wide mb-2 truncate">{title}</p>
            <h3 className={`${valueSizeClasses[size]} font-bold text-slate-800 dark:text-white mb-2 truncate`}>{value}</h3>
            {subtext && (
              <p className={`text-[10px] md:text-xs font-medium ${subtext.includes('+') || subtext.includes('%') ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'} truncate`}>
                {subtext}
              </p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend > 0 ? <ArrowUp size={12} className="text-emerald-500" /> : <ArrowDown size={12} className="text-red-500" />}
                <span className={`text-xs font-medium ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {Math.abs(trend)}% vs last month
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 md:p-4 rounded-xl bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-900/30 dark:to-${color}-800/30 text-${color}-600 dark:text-${color}-400 shadow-sm group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-3`}>
            <IconComponent size={20} className="md:w-6 md:h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusSelect = ({ currentStatus, targetDate, actualDate, onChange, disabled }) => {
  let statusStyle = "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600";
  if (currentStatus === 'Delayed') {
    statusStyle = "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800";
  } else if (currentStatus === 'Cast') {
    if (targetDate && actualDate) {
      const target = new Date(targetDate).setHours(0,0,0,0);
      const actual = new Date(actualDate).setHours(0,0,0,0);
      if (actual > target) statusStyle = "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 font-bold";
      else if (actual < target) statusStyle = "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-bold";
      else statusStyle = "bg-white dark:bg-slate-700 text-slate-700 dark:text-white border-slate-300 dark:border-slate-600";
    } else {
      statusStyle = "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
    }
  }
  return (
    <div className="relative inline-block">
      <select value={currentStatus} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={`appearance-none pl-3 pr-8 py-1 rounded-full text-[10px] md:text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors ${statusStyle} ${disabled ? 'cursor-default opacity-80' : 'cursor-pointer'}`}>
        <option value="Scheduled">Scheduled</option><option value="Cast">Cast</option><option value="Delayed">Delayed</option>
      </select>
      {!disabled && <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />}
    </div>
  );
};

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
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, 
    { id: 'tracker', label: 'Tracker', icon: FileText }, 
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'reports', label: 'Reports', icon: BarChart3 }
  ];
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-700 p-2 pb-safe z-50 shadow-2xl flex justify-around items-center no-print">
      {tabs.map(tab => (
        <button 
          key={tab.id} 
          onClick={() => setActiveTab(tab.id)} 
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 w-full ${
            activeTab === tab.id 
              ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 shadow-md transform scale-105' 
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <tab.icon 
            size={18} 
            className={`transition-all duration-200 ${
              activeTab === tab.id ? 'fill-current text-blue-600 dark:text-blue-400' : ''
            }`} 
          />
          <span className="text-[9px] font-medium leading-tight">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

// --- Tooltips & Ghost Lines ---
const BubbleTooltip = ({ title, content, author, children, onVisible, onHidden, meta }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [show, setShow] = useState(false);
  const timerRef = useRef(null);

  const handleMouseEnter = (e) => {
    if (onVisible) onVisible(meta, false);
    if (!content && !author && !title) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    timerRef.current = setTimeout(() => setShow(true), 2000);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (!content && !author && !title) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ top: rect.top - 8, left: rect.left + rect.width / 2 });

    if (show) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setShow(false);
      if (onHidden) onHidden();
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      setShow(true);
      if (onVisible) onVisible(meta, true);
    }
  };

  const handleMouseLeave = () => { if (timerRef.current) clearTimeout(timerRef.current); setShow(false); if (onHidden) onHidden(); };
  
  return (
    <>
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={handleClick} className="relative w-full cursor-pointer">
        {children}
      </div>
      {show && (
        <div className="fixed z-[9999] bg-slate-800 dark:bg-slate-900 text-white text-[10px] p-2 rounded shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-200 max-w-[200px]" style={{ top: position.top, left: position.left, transform: 'translate(-50%, -100%)' }}>
          <div className="font-bold border-b border-slate-600 pb-1 mb-1 text-white uppercase text-[10px] tracking-wider">{title || "Details"}</div>
          <div className="leading-relaxed text-slate-300">{content}</div>
          {author && <div className="mt-1 pt-1 border-t border-slate-600 text-slate-400 italic text-[8px]">Added by: {author}</div>}
          <div className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-slate-800 dark:border-t-slate-900"></div>
        </div>
      )}
    </>
  );
};


// --- Project Timeline View ---
const ProjectTimeline = ({ filteredData }) => {
  const [viewMode, setViewMode] = useState('month'); // month, quarter, project
  
  const getTimelineData = () => {
    return filteredData
      .filter(item => item.castingDate)
      .sort((a, b) => new Date(a.castingDate) - new Date(b.castingDate))
      .map(item => ({
        ...item,
        startDate: item.castingDate,
        endDate: item.actualCastingDate || item.castingDate,
        delay: item.actualCastingDate && new Date(item.actualCastingDate) > new Date(item.castingDate)
      }));
  };

  const timelineData = getTimelineData();
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Activity className="text-soilGreen-600" size={24} />
          Project Timeline
        </h2>
        <div className="flex gap-2">
          {['month', 'quarter', 'project'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                viewMode === mode
                  ? 'bg-soilGreen-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="space-y-3">
        {timelineData.map((item) => (
          <div key={item.id} className="relative flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
            {/* Status Indicator */}
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
              item.status === 'Cast' 
                ? 'bg-emerald-500' 
                : item.status === 'Delayed' 
                ? 'bg-red-500' 
                : 'bg-blue-500'
            }`} />
            
            {/* Item Info */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">{item.slabId}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{item.zone}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {item.status}
                  </p>
                  {item.delay && (
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                      Delayed
                    </span>
                  )}
                </div>
              </div>
              
              {/* Date Range */}
              <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <CalendarIcon size={10} />
                  {item.startDate}
                </span>
                {item.actualCastingDate && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={10} />
                    {item.actualCastingDate}
                  </span>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-20 md:w-32">
              <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.status === 'Cast' 
                      ? 'bg-emerald-500' 
                      : item.status === 'Delayed' 
                      ? 'bg-red-500' 
                      : 'bg-blue-500'
                  }`}
                  style={{ width: item.status === 'Cast' ? '100%' : '50%' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Report View ---
const ReportView = ({ selectedProject, user, metrics, filteredData }) => {
  const [reportType, setReportType] = useState('summary');
  
  const generateReport = () => {
    const reportData = {
      projectName: selectedProject?.name,
      generatedBy: user?.name,
      generatedAt: new Date().toISOString(),
      reportType,
      metrics,
      data: filteredData
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedProject?.name}-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <FileText className="text-blue-500" size={24} />
          Project Reports
        </h2>
        <div className="flex gap-2">
          <button
            onClick={printReport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <Printer size={16} /> Print
          </button>
          <button
            onClick={generateReport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <FileText size={16} /> Export JSON
          </button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { id: 'summary', label: 'Summary', icon: BarChart3 },
          { id: 'progress', label: 'Progress', icon: TrendingUp },
          { id: 'deliveries', label: 'Deliveries', icon: Truck },
          { id: 'schedule', label: 'Schedule', icon: CalendarIcon }
        ].map(type => (
          <button
            key={type.id}
            onClick={() => setReportType(type.id)}
            className={`p-4 rounded-lg border-2 transition-all ${
              reportType === type.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <type.icon size={24} className="mx-auto mb-2" />
            <div className="text-sm font-medium">{type.label}</div>
          </button>
        ))}
      </div>

      {/* Report Content */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 print:shadow-none">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Project: {selectedProject?.name} | Generated: {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Generated by</p>
              <p className="font-medium text-slate-800 dark:text-white">{user?.name}</p>
            </div>
          </div>
        </div>

        {/* Report Content Based on Type */}
        {reportType === 'summary' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Project Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Zones</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{metrics.total}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Completed</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{metrics.cast}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400">In Progress</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{metrics.pending}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                <p className="text-sm text-amber-600 dark:text-amber-400">Deliveries</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{metrics.delivered}</p>
              </div>
            </div>
          </div>
        )}

        {reportType === 'progress' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Progress Analysis</h3>
            <div className="space-y-4">
              {filteredData.map(item => (
                <div key={item.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">{item.slabId}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{item.zone}</p>
                    </div>
                    <StatusSelect disabled={true} currentStatus={item.status} targetDate={item.castingDate} actualDate={item.actualCastingDate} onChange={() => {}} />
                  </div>
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {item.castingDate && (
                      <p>Target: {item.castingDate} {item.actualCastingDate && `| Actual: ${item.actualCastingDate}`}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {reportType === 'deliveries' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Delivery Log</h3>
            <div className="space-y-4">
              {filteredData.filter(item => Array.isArray(item.deliveries) && item.deliveries.length > 0).map(item => (
                <div key={item.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-2">{item.slabId} - {item.zone}</h4>
                  <div className="space-y-2">
                    {item.deliveries.map((delivery, idx) => (
                      <div key={idx} className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 p-2 rounded">
                        <p><strong>Date:</strong> {delivery.date}</p>
                        <p><strong>Description:</strong> {delivery.description}</p>
                        {delivery.createdBy && <p><strong>Logged by:</strong> {delivery.createdBy}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {reportType === 'schedule' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Schedule Overview</h3>
            <div className="space-y-4">
              {filteredData.filter(item => item.castingDate).sort((a, b) => new Date(a.castingDate) - new Date(b.castingDate)).map(item => (
                <div key={item.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">{item.slabId}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{item.zone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{item.castingDate}</p>
                      <p className="text-xs text-slate-500">{item.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Calendar View ---
const CalendarView = ({ data }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [ghostConnection, setGhostConnection] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [focusedSlabId, setFocusedSlabId] = useState(null);
  const [activeGhosts, setActiveGhosts] = useState([]);
  const [offScreenGhosts, setOffScreenGhosts] = useState({ items: [], rect: null });
  const hoverTimerRef = useRef(null);
  const daysInMonth = getDaysInMonth(currentDate); const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long' }); const year = currentDate.getFullYear();
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleEventHover = (meta, immediate) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (meta && meta.slabId) setFocusedSlabId(meta.slabId);

    const triggerGhost = () => {
        let label = '';
        if (meta.type === 'delivery') label = `HCS Target: ${meta.slabId}`;
        else if (meta.type === 'bbsActual') label = `BBS Target: ${meta.bbsNum}`;
        else if (meta.type === 'castActual') label = `Plan: ${meta.slabId}`;

        const offScreen = [];
        const isOffScreen = (d) => {
             if (!d) return false;
             const [y, m, day] = d.split('-').map(Number);
             const date = new Date(y, m - 1, day);
             return date < new Date(year, currentDate.getMonth(), 1) || date > new Date(year, currentDate.getMonth() + 1, 0);
        };

        if (meta.targetDate && isOffScreen(meta.targetDate)) {
             offScreen.push({ date: meta.targetDate, label: 'Target', type: 'target' });
        }

        if (meta.type === 'castActual' && Array.isArray(meta.bbs)) {
            const ghosts = meta.bbs.map((b, i) => {
              const bObj = typeof b === 'object' ? b : { number: b, actualDate: null };
              if (bObj.actualDate && isOffScreen(bObj.actualDate)) {
                  offScreen.push({ date: bObj.actualDate, label: `BBS ${bObj.number}`, type: 'actual' });
              } else if (bObj.targetDate && !bObj.actualDate && isOffScreen(bObj.targetDate)) {
                  offScreen.push({ date: bObj.targetDate, label: `Plan ${bObj.number}`, type: 'target' });
              }
              return {
                type: 'bbsGhost',
                dateStr: bObj.actualDate,
                label: bObj.number,
                domId: `ghost-bbs-${meta.id}-${i}`,
                tooltipContent: bObj.description || 'BBS Ghost',
                slabId: meta.slabId
              };
            }).filter(g => g.dateStr);
            setActiveGhosts(ghosts);
        }

        const domEl = document.getElementById(meta.domId);
        if (offScreen.length > 0 && domEl) {
            setOffScreenGhosts({ items: offScreen, rect: domEl.getBoundingClientRect() });
        } else {
            setOffScreenGhosts({ items: [], rect: null });
        }

        setGhostConnection({
          targetDate: meta.targetDate,
          actualDate: meta.dateStr,
          label: label,
          endElementId: meta.domId,
          startElementId: `ghost-${meta.id}-${meta.targetDate}`
        });
    };

    if (meta && (meta.targetDate || meta.type === 'castActual')) {
      if (immediate) triggerGhost();
      else hoverTimerRef.current = setTimeout(triggerGhost, 500);
    }
  };
  const clearGhost = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setGhostConnection(null);
    setFocusedSlabId(null);
    setActiveGhosts([]);
    setOffScreenGhosts({ items: [], rect: null });
  };

  const days = []; for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-slate-50/50 dark:bg-slate-900/50 border-b border-r border-slate-100 dark:border-slate-800"></div>);

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
      if (item.castingDate === dateStr) {
        if (item.actualCastingDate === dateStr) {
           dayEvents.push({ type: 'castTargetCompleted', domId: `evt-cast-target-completed-${baseId}`, tooltipContent: item.slabId || 'Completed on Target', author: item.createdBy, ...item });
        } else if (!item.actualCastingDate) {
           dayEvents.push({ type: 'castTarget', domId: `evt-cast-target-${baseId}`, tooltipContent: item.slabId || 'Target Casting', author: item.createdBy, ...item });
        }
      }
      if (item.actualCastingDate === dateStr && item.castingDate !== dateStr) {
        const isLate = item.castingDate && new Date(item.actualCastingDate) > new Date(item.castingDate);
        dayEvents.push({ type: 'castActual', isLate, domId: `evt-cast-actual-${baseId}`, tooltipContent: item.slabId || 'Actual Casting', author: item.createdBy, targetDate: item.castingDate, dateStr: item.actualCastingDate, ...item });
      }
      if (Array.isArray(item.deliveries)) item.deliveries.forEach((d, dIdx) => {
        if (d.date === dateStr) {
          const isLate = item.hcsTargetDate && new Date(d.date) > new Date(item.hcsTargetDate);
          dayEvents.push({ type: 'delivery', isLate, domId: `evt-del-${baseId}-${dIdx}`, ...item, tooltipContent: d.description || 'Batch Delivery', author: d.createdBy, dateStr: d.date, targetDate: item.hcsTargetDate });
        }
      });
      if (!item.actualCastingDate) {
        if (Array.isArray(item.bbs)) item.bbs.forEach((b, bIdx) => {
            const bObj = typeof b === 'object' ? b : { number: b, actualDate: null };
            if (bObj.targetDate === dateStr) {
               if (bObj.actualDate === dateStr) {
                  dayEvents.push({ type: 'bbsTargetCompleted', domId: `evt-bbs-target-completed-${baseId}-${bIdx}`, ...item, bbsNum: bObj.number, tooltipContent: bObj.description || 'BBS Completed on Target', author: bObj.createdBy });
               } else if (!bObj.actualDate) {
                  dayEvents.push({ type: 'bbsTarget', domId: `evt-bbs-target-${baseId}-${bIdx}`, ...item, bbsNum: bObj.number, tooltipContent: bObj.description || 'BBS Target', author: bObj.createdBy, });
               }
            }
            if (bObj.actualDate === dateStr && bObj.targetDate !== dateStr) {
              const isLate = bObj.targetDate && new Date(bObj.actualDate) > new Date(bObj.targetDate);
              dayEvents.push({ type: 'bbsActual', isLate, domId: `evt-bbs-${baseId}-${bIdx}`, ...item, bbsNum: bObj.number, tooltipContent: bObj.description || 'BBS Delivery', author: bObj.createdBy, dateStr: bObj.actualDate, targetDate: bObj.targetDate });
            }
        });
      }
    });

    activeGhosts.forEach(g => { if (g.dateStr === dateStr) dayEvents.push({ ...g, isGhostItem: true }); });
    if (ghostConnection && ghostConnection.targetDate === dateStr && !dayEvents.some(e => e.type === 'ghost' && e.label === ghostConnection.label)) dayEvents.push({ type: 'ghost', domId: ghostConnection.startElementId, label: ghostConnection.label, slabId: focusedSlabId });

    days.push(
      <div id={dayId} key={`day-${day}`} className="h-24 md:h-32 bg-white dark:bg-slate-800 border-b border-r border-slate-100 dark:border-slate-700 p-1 md:p-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group relative overflow-hidden">
        <div className="flex justify-between items-start"><span className={`text-xs md:text-sm font-semibold ${dayEvents.length > 0 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>{day}</span>{dayEvents.length > 0 && <span className="text-[9px] md:text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-1.5 rounded-full">{dayEvents.length}</span>}</div>
        <div className="mt-1 md:mt-2 space-y-0.5 md:space-y-1 overflow-y-auto max-h-[60px] md:max-h-[85px] scrollbar-hide">
          {dayEvents.map((event, idx) => {
            let colorClass = "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600"; let icon = <CheckCircle2 size={8} />; let label = event.slabId;
            if (event.type === 'castTarget') { colorClass = "bg-soilGreen-50 dark:bg-soilGreen-900/30 text-soilGreen-700 dark:text-soilGreen-400 border-soilGreen-500 dark:border-soilGreen-500 border-2 border-dashed"; icon = <Hammer size={8} />; label = `Plan: ${event.slabId}`; }
            else if (event.type === 'castTargetCompleted') { colorClass = "bg-soilGreen-50 dark:bg-soilGreen-900/30 text-soilGreen-700 dark:text-soilGreen-400 border-soilGreen-600 dark:border-soilGreen-500 border-2 border-dashed"; icon = <CheckCircle2 size={8} />; label = `Done: ${event.slabId}`; }
            else if (event.type === 'castActual') { colorClass = event.isLate ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" : "bg-soilGreen-600 text-white border-soilGreen-700"; icon = <CheckCircle2 size={8} />; label = `Done: ${event.slabId}`; }
            else if (event.type === 'delivery') { colorClass = event.isLate ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" : "bg-soilOrange-50 dark:bg-soilOrange-900/30 text-soilOrange-700 dark:text-soilOrange-400 border-soilOrange-100 dark:border-soilOrange-800"; icon = <Truck size={8} />; }
            else if (event.type === 'bbsActual') { colorClass = event.isLate ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" : "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-800"; icon = <Target size={8} />; label = `BBS: ${event.bbsNum}`; }
            else if (event.type === 'bbsTarget') { colorClass = "bg-white dark:bg-slate-800 border-2 border-purple-300 dark:border-purple-600 border-dashed text-purple-400 dark:text-purple-500"; icon = <Target size={8} />; label = `Plan BBS: ${event.bbsNum}`; }
            else if (event.type === 'bbsTargetCompleted') { colorClass = "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-500 dark:border-purple-500 border-2 border-dashed"; icon = <Target size={8} />; label = `BBS Done: ${event.bbsNum}`; }
            else if (event.type === 'ghost') { colorClass = "bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 border-dashed text-slate-400 dark:text-slate-500 z-[15]"; icon = <Target size={8} />; label = event.label; }
            else if (event.type === 'bbsGhost') { colorClass = "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-800 opacity-80 border-dashed"; icon = <Target size={8} />; label = `BBS: ${event.label}`; }

            const isFaded = focusedSlabId && event.slabId !== focusedSlabId;

            // Update: Tooltip displays Zone / Level instead of Slab ID
            return (
              <BubbleTooltip key={`${event.domId || idx}`} title={event.zone || event.label} content={event.tooltipContent} author={event.author} onVisible={handleEventHover} onHidden={clearGhost} meta={event}>
                <div id={event.domId} className={`relative z-20 text-[9px] md:text-[10px] px-1 py-0.5 rounded border truncate flex items-center gap-1 cursor-default transition-opacity duration-300 ${colorClass} ${isFaded ? 'opacity-20' : ''}`}><span className="shrink-0">{icon}</span><span className="truncate">{label}</span>{event.tooltipContent && <Info size={6} className="ml-auto shrink-0 opacity-50" />}</div>
              </BubbleTooltip>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      {offScreenGhosts.items.length > 0 && offScreenGhosts.rect && (
          <div style={{ top: offScreenGhosts.rect.top, left: offScreenGhosts.rect.right + 200 > window.innerWidth ? offScreenGhosts.rect.left - 80 : offScreenGhosts.rect.right + 10 }} className="fixed z-[100] flex flex-col gap-2">
              {offScreenGhosts.items.map((item, i) => <MiniCalendar key={i} date={item.date} label={item.label} type={item.type} />)}
          </div>
      )}
      {ghostConnection && ghostConnection.endElementId && <GhostLine startId={ghostConnection.startElementId} endId={ghostConnection.endElementId} />}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in duration-500 mb-20 md:mb-0 relative">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
          <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><CalendarIcon className="text-blue-500" size={20} /> {monthName} {year}</h2>
          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-48">
               <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
               <input type="text" placeholder="Filter Zone/ID..." value={filterText} onChange={(e) => setFilterText(e.target.value)} className="w-full pl-8 pr-2 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm outline-none" />
               {filterText && <button aria-label="Clear filter" onClick={() => setFilterText('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><X size={14} /></button>}
             </div>
             <div className="flex gap-1">
                <button aria-label="Previous month" onClick={prevMonth} className="p-1.5 md:p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400"><ChevronLeft size={18} /></button><button onClick={() => setCurrentDate(new Date())} className="px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">Today</button><button aria-label="Next month" onClick={nextMonth} className="p-1.5 md:p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400"><ChevronRight size={18} /></button>
             </div>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => <div key={`${d}-${idx}`} className="py-2 text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{d}</div>)}</div>
        <div className="grid grid-cols-7 border-l border-slate-200 dark:border-slate-700">{days}</div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900 flex flex-wrap gap-x-4 gap-y-2 text-[10px] md:text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700"><div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded"></div> Actual HCS</div><div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded"></div> Casting</div><div className="flex items-center gap-2"><div className="w-3 h-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 border-dashed rounded"></div> Target (Ghost)</div><div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded"></div> Late Delivery</div></div>
      </div>
    </>
  );
};

// --- Login View ---
const LoginView = ({ initialMode = 'login', isDark, toggleTheme }) => {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', birthday: '', designation: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleConfirmEmail = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await signInWithEmailLink(auth, formData.email, window.location.href);
      window.localStorage.removeItem('emailForSignIn');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true); setError('');
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      // Auth only - user profile syncs in App
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  const handleEmailLogin = async (e) => { e.preventDefault(); setLoading(true); setError(''); try { await signInWithEmailAndPassword(auth, formData.email, formData.password); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  const handleRegister = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(result.user, { displayName: formData.name });
      // Store temp data to sync later
      localStorage.setItem('temp_user_data', JSON.stringify({ designation: formData.designation, birthday: formData.birthday }));
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  const handleMagicLink = async (e) => { e.preventDefault(); setLoading(true); setError(''); const actionCodeSettings = { url: window.location.href, handleCodeInApp: true }; try { await sendSignInLinkToEmail(auth, formData.email, actionCodeSettings); window.localStorage.setItem('emailForSignIn', formData.email); setMagicSent(true); } catch (err) { setError(err.message); } finally { setLoading(false); } };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
         <button onClick={toggleTheme} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-md text-slate-500 hover:text-blue-500 transition-colors">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
         </button>
      </div>
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
        <div className="bg-slate-900 p-8 text-center"><div className="mx-auto bg-blue-500 w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-lg"><AppLogo className="w-10 h-10 text-white" /></div><h1 className="text-2xl font-bold text-white mt-4">SB-CasTrack</h1><p className="text-slate-400 mt-2">Construction Logistics Management</p></div>
        <div className="p-8 space-y-6">
          {mode === 'login' && (<><form onSubmit={handleEmailLogin} className="space-y-4"><div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email</label><input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" required /></div><div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Password</label><input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" required /></div><button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">{loading ? 'Signing In...' : <><Shield size={18} /> Sign In</>}</button></form><div className="flex items-center gap-2 my-2"><div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div><span className="text-xs text-slate-400">OR</span><div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div></div><button onClick={handleGoogle} className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G" /> Sign in with Google</button><button onClick={() => setMode('magic')} className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"><Mail size={18} /> Sign in via Email Link</button><div className="text-center text-sm text-slate-500 mt-4">Don't have an account? <button onClick={() => setMode('register')} className="text-blue-600 font-bold hover:underline">Register</button></div></>)}
          {mode === 'register' && (<form onSubmit={handleRegister} className="space-y-4"><h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Create Account</h3><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Full Name</label><input name="name" type="text" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" required /></div><div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Birthday</label><input name="birthday" type="date" value={formData.birthday} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" required /></div></div><div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Designation</label><input name="designation" type="text" placeholder="e.g. Site Engineer" value={formData.designation} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" required /></div><div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email</label><input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" required /></div><div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Password</label><input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none text-sm" required /></div><button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">{loading ? 'Creating...' : 'Register Now'}</button><button type="button" onClick={() => setMode('login')} className="w-full text-slate-500 dark:text-slate-400 text-sm hover:text-slate-700">Back to Login</button></form>)}
          {mode === 'magic' && (<div className="space-y-4"><h3 className="text-lg font-bold text-slate-800 dark:text-white">Passwordless Login</h3>{magicSent ? (<div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center"><CheckCircle2 className="mx-auto mb-2" size={32} />Check your email ({formData.email}) for the sign-in link!</div>) : (<form onSubmit={handleMagicLink} className="space-y-4"><p className="text-sm text-slate-500 dark:text-slate-400">Enter your email and we'll send you a link to sign in instantly.</p><div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email</label><input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" required /></div><button type="submit" disabled={loading} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">{loading ? 'Sending...' : 'Send Magic Link'}</button></form>)}<button type="button" onClick={() => setMode('login')} className="w-full text-slate-500 dark:text-slate-400 text-sm hover:text-slate-700">Back to Login</button></div>)}
          {mode === 'confirm-email' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Confirm Email</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Please confirm your email address to complete sign-in.</p>
              <form onSubmit={handleConfirmEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" required />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                  {loading ? 'Verifying...' : 'Complete Sign In'}
                </button>
              </form>
              <button type="button" onClick={() => setMode('login')} className="w-full text-slate-500 dark:text-slate-400 text-sm hover:text-slate-700">Back to Login</button>
            </div>
          )}
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
  const [emailConfirmationNeeded, setEmailConfirmationNeeded] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [activeModal, setActiveModal] = useState(null); 
  const [isDark, setIsDark] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Project Management State
  const [projects, setProjects] = useState(() => {
     const saved = localStorage.getItem('sb-projects');
     return saved ? JSON.parse(saved) : [{ id: 'tnd4-castrack', name: 'TND4 Project' }];
  });
  const [selectedProject, setSelectedProject] = useState(null);

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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Just set the user auth object. Profile syncing happens when project is selected.
        setUser(currentUser);
      } else {
        setUser(null);
        setSelectedProject(null);
      }
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
                const tempData = JSON.parse(localStorage.getItem('temp_user_data') || '{}');
                const newProfile = {
                    name: user.displayName || 'Guest',
                    email: user.email,
                    role: 'guest', // Default role
                    designation: tempData.designation || 'N/A',
                    birthday: tempData.birthday || '',
                    createdAt: new Date().toISOString()
                };
                await setDoc(docRef, newProfile);
                localStorage.removeItem('temp_user_data');
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
  
  // Data Fetching depends on Project
  useEffect(() => {
    if (!user || !selectedProject) return;
    const q = query(collection(db, 'artifacts', selectedProject.id, 'public', 'data', 'slabs'), orderBy('castingDate', 'desc'), limit(QUERY_LIMIT));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(items);
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
      setActiveModal(null); setSlabForm({ zone: '', castingDate: '', remarks: '', status: 'Scheduled', actualCastingDate: '' });
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
  const handleSaveBbsEdit = async (e) => { e.preventDefault(); if (!checkAdmin() || !selectedProject) return; const slab = data.find(d => d.id === editBbsState.slabId); if (!slab) return; const updated = [...slab.bbs]; updated[editBbsState.bbsIndex] = editBbsState.data; try { await updateDoc(doc(db, 'artifacts', selectedProject.id, 'public', 'data', 'slabs', editBbsState.slabId), { bbs: updated }); setActiveModal(null); } catch (err) { alert(err.message); } };
  const initiateEditCasting = (item) => { if (!checkAdmin()) return; setEditCastingState({ id: item.id, target: item.castingDate || '', actual: item.actualCastingDate || '' }); setActiveModal('edit-casting'); };
  const handleSaveCastingEdit = async (e) => { e.preventDefault(); if (!checkAdmin() || !selectedProject) return; const updates = { castingDate: editCastingState.target, actualCastingDate: editCastingState.actual }; if (editCastingState.actual) updates.status = 'Cast'; try { await updateDoc(doc(db, 'artifacts', selectedProject.id, 'public', 'data', 'slabs', editCastingState.id), updates); setActiveModal(null); } catch (err) { alert(err.message); } };

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

  const ReportView = () => (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm print:bg-white print:static print:block print:p-0 print:h-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] print:shadow-none print:max-h-none print:w-full print:max-w-none print:overflow-visible">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 print:bg-white print:border-b-2 print:border-black">
          <div><h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2 print:text-black"><BarChart3 className="text-blue-600 print:text-black" /> Executive Project Report: {selectedProject?.name}</h3><p className="text-xs text-slate-500 mt-1 print:text-black">Generated: {new Date().toLocaleDateString()}</p></div>
          <div className="flex gap-2 no-print"><button aria-label="Print report" onClick={() => window.print()} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors hidden md:block"><Printer size={20} /></button><button aria-label="Close report" onClick={() => setActiveModal(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X size={24} /></button></div>
        </div>
        <div className="overflow-y-auto p-8 space-y-8 print:p-0 print:space-y-4">
          <div className="grid grid-cols-4 gap-4 print:gap-2">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 print:border-black print:bg-white"><p className="text-xs font-bold text-slate-500 uppercase print:text-black">Total Scope</p><p className="text-3xl font-bold text-slate-800 dark:text-white mt-1 print:text-black">{metrics.total}</p></div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800 print:border-black print:bg-white"><p className="text-xs font-bold text-emerald-600 uppercase print:text-black">Completed</p><p className="text-3xl font-bold text-emerald-900 dark:text-emerald-400 mt-1 print:text-black">{metrics.cast} <span className="text-sm font-normal">({Math.round((metrics.cast/metrics.total)*100 || 0)}%)</span></p></div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 print:border-black print:bg-white"><p className="text-xs font-bold text-blue-600 uppercase print:text-black">Scheduled</p><p className="text-3xl font-bold text-blue-900 dark:text-blue-400 mt-1 print:text-black">{metrics.pending}</p></div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800 print:border-black print:bg-white"><p className="text-xs font-bold text-red-600 uppercase print:text-black">Delayed / Late</p><p className="text-3xl font-bold text-red-900 dark:text-red-400 mt-1 print:text-black">{metrics.late + data.filter(d => d.status === 'Delayed').length}</p></div>
          </div>
          
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-800/50 print:bg-white print:border-black print:p-4 print:break-inside-avoid">
             <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 print:text-black"><CalendarIcon size={18} /> Monthly Progress Summary</h4>
             <table className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden print:border-black">
                 <thead className="bg-slate-100 dark:bg-slate-900 print:bg-gray-200 text-xs uppercase font-bold text-slate-600 dark:text-slate-300 print:text-black">
                     <tr>
                         <th className="p-3 text-left">Month</th>
                         <th className="p-3 text-right">Planned Casts</th>
                         <th className="p-3 text-right">Actual Casts</th>
                         <th className="p-3 text-right">Variance</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-700 print:divide-black">
                     {Object.keys(metrics.monthlyStats).sort().map(key => {
                         const stats = metrics.monthlyStats[key];
                         const [y, m] = key.split('-');
                         const label = new Date(y, m-1).toLocaleString('default', { month: 'long', year: 'numeric' });
                         return (
                             <tr key={key} className="text-slate-700 dark:text-slate-300 print:text-black">
                                 <td className="p-3 font-medium">{label}</td>
                                 <td className="p-3 text-right">{stats.planned}</td>
                                 <td className="p-3 text-right">{stats.actual}</td>
                                 <td className={`p-3 text-right font-bold ${stats.actual < stats.planned ? 'text-red-600' : 'text-emerald-600'} print:text-black`}>{stats.actual - stats.planned}</td>
                             </tr>
                         );
                     })}
                 </tbody>
             </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4 print:break-inside-avoid">
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 print:border-black print:p-4"><h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 print:text-black"><TrendingUp size={18} /> Schedule Adherence</h4><div className="space-y-4"><div><div className="flex justify-between text-sm mb-1 text-slate-600 dark:text-slate-300 print:text-black"><span>Early Completion</span> <span className="font-bold text-emerald-600 print:text-black">{metrics.early}</span></div><div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden print:border print:border-black"><div style={{width: `${(metrics.early/metrics.cast)*100 || 0}%`}} className="h-full bg-emerald-500 print:bg-black"></div></div></div><div><div className="flex justify-between text-sm mb-1 text-slate-600 dark:text-slate-300 print:text-black"><span>On-Time</span> <span className="font-bold text-slate-600 dark:text-slate-400 print:text-black">{metrics.onTime}</span></div><div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden print:border print:border-black"><div style={{width: `${(metrics.onTime/metrics.cast)*100 || 0}%`}} className="h-full bg-slate-400 print:bg-gray-400"></div></div></div><div><div className="flex justify-between text-sm mb-1 text-slate-600 dark:text-slate-300 print:text-black"><span>Late / Delayed</span> <span className="font-bold text-red-600 print:text-black">{metrics.late}</span></div><div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden print:border print:border-black"><div style={{width: `${(metrics.late/metrics.cast)*100 || 0}%`}} className="h-full bg-red-500 print:bg-black"></div></div></div></div></div>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 print:border-black print:p-4"><h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 print:text-black"><Activity size={18} /> Site Efficiency</h4><div className="space-y-4 text-sm"><div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700 rounded print:bg-white print:border print:border-black"><span className="text-slate-600 dark:text-slate-300 print:text-black">Pending HCS</span><span className="font-bold text-slate-800 dark:text-white print:text-black">{metrics.total - metrics.delivered} Zones</span></div><div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700 rounded print:bg-white print:border print:border-black"><span className="text-slate-600 dark:text-slate-300 print:text-black">Active Issues (Remarks)</span><span className="font-bold text-slate-800 dark:text-white print:text-black">{data.filter(i => i.remarks).length}</span></div><div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700 rounded print:bg-white print:border print:border-black"><span className="text-slate-600 dark:text-slate-300 print:text-black">Critical Path Delays</span><span className="font-bold text-red-600 print:text-black">{data.filter(i => i.status === 'Delayed').length}</span></div></div></div>
          </div>

          <div className="print:break-inside-avoid"><h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 print:text-black"><AlertTriangle size={18} /> Risk Register (Critical Delays)</h4><table className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden print:border-black"><thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase text-slate-500 font-bold print:bg-gray-200 print:text-black"><tr><th className="p-3 text-left">Zone / ID</th><th className="p-3 text-left">Planned Date</th><th className="p-3 text-left">Actual Date</th><th className="p-3 text-left">Remarks / Impact</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700 print:divide-black">{data.filter(i => i.status === 'Delayed' || (i.castingDate && i.actualCastingDate && new Date(i.actualCastingDate) > new Date(i.castingDate))).map(item => (<tr key={item.id} className="text-slate-600 dark:text-slate-300 print:text-black"><td className="p-3 font-medium text-slate-800 dark:text-white print:text-black">{item.slabId} <br/><span className="text-xs text-slate-400 font-normal print:text-black">{item.zone}</span></td><td className="p-3">{item.castingDate}</td><td className="p-3 text-red-600 font-bold print:text-black">{item.actualCastingDate || 'Pending'}</td><td className="p-3 italic">{item.remarks || 'No specific remarks'}</td></tr>))}</tbody></table></div>

          <div className="print:break-before-page"><h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 print:text-black"><Hammer size={18} /> Casting Schedule</h4><table className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden print:border-black"><thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase text-slate-500 font-bold print:bg-gray-200 print:text-black"><tr><th className="p-3 text-left">Date</th><th className="p-3 text-left">Zone / Level</th><th className="p-3 text-left">Casting ID</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Remarks</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700 print:divide-black">{filteredData.map(item => (<tr key={item.id} className="text-slate-600 dark:text-slate-300 print:text-black"><td className="p-3 whitespace-nowrap">{item.castingDate || '-'}</td><td className="p-3 font-medium text-slate-800 dark:text-white print:text-black">{item.zone}</td><td className="p-3 font-mono text-xs">{item.slabId}</td><td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold print:border print:border-black ${item.status === 'Cast' ? 'bg-emerald-100 text-emerald-800' : item.status === 'Delayed' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{item.status}</span></td><td className="p-3 italic text-xs max-w-[200px] truncate">{item.remarks}</td></tr>))}</tbody></table></div>
        </div>
      </div>
    </div>
  );

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

          {/* Project Timeline */}
        <ProjectTimeline filteredData={filteredData} />

        {/* Critical Tasks Summary */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={24} />
              Critical Tasks
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Overdue Items */}
            <div className={`p-4 rounded-lg border ${
              overdueCount > 0 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
            }`}>
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className={`${overdueCount > 0 ? 'text-red-500' : 'text-emerald-500'} mt-0.5 shrink-0`} />
                <div className="flex-1">
                  <h4 className={`text-sm font-bold ${overdueCount > 0 ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                    Overdue Schedules
                  </h4>
                  <p className={`text-xs mt-1 ${overdueCount > 0 ? 'text-red-600 dark:text-red-300' : 'text-emerald-600 dark:text-emerald-300'}`}>
                    {overdueCount} casting zones {overdueCount > 0 ? 'behind schedule' : 'on schedule'}
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
              <div className="flex items-start gap-3">
                <Target size={20} className={`${
                  data.filter(i => !i.bbs || (Array.isArray(i.bbs) && i.bbs.length === 0)).length > 0 
                    ? 'text-amber-500' 
                    : 'text-emerald-500'
                } mt-0.5 shrink-0`} />
                <div className="flex-1">
                  <h4 className={`text-sm font-bold ${
                    data.filter(i => !i.bbs || (Array.isArray(i.bbs) && i.bbs.length === 0)).length > 0 
                      ? 'text-amber-700 dark:text-amber-400' 
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}>
                    Missing BBS
                  </h4>
                  <p className={`text-xs mt-1 ${
                    data.filter(i => !i.bbs || (Array.isArray(i.bbs) && i.bbs.length === 0)).length > 0 
                      ? 'text-amber-600 dark:text-amber-300' 
                      : 'text-emerald-600 dark:text-emerald-300'
                  }`}>
                    {data.filter(i => !i.bbs || (Array.isArray(i.bbs) && i.bbs.length === 0)).length} zones pending BBS
                  </p>
                </div>
              </div>
            </div>

            {/* Next Casting */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Hammer size={20} className="text-blue-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400">Next Casting</h4>
                  {data.filter(i => i.status !== 'Cast' && i.castingDate).sort((a, b) => new Date(a.castingDate) - new Date(b.castingDate))[0] ? (
                    (() => {
                      const nextCasting = data.filter(i => i.status !== 'Cast' && i.castingDate).sort((a, b) => new Date(a.castingDate) - new Date(b.castingDate))[0];
                      return (
                        <>
                          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">{nextCasting.slabId}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {new Date(nextCasting.castingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </>
                      );
                    })()
                  ) : (
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">No upcoming castings</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  };

  const TrackerView = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-2 w-full"><div className="relative w-full md:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm outline-none w-full" /></div><div className="flex items-center gap-2 w-full md:w-auto"><input type="date" value={dateFilter.start} onChange={e => setDateFilter({...dateFilter, start: e.target.value})} className="px-2 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-xs outline-none" /><span className="text-slate-400">-</span><input type="date" value={dateFilter.end} onChange={e => setDateFilter({...dateFilter, end: e.target.value})} className="px-2 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-xs outline-none" />{(dateFilter.start || dateFilter.end) && (<button aria-label="Clear date filter" onClick={() => setDateFilter({start: '', end: ''})} className="text-slate-400 hover:text-red-500"><X size={16}/></button>)}</div></div>
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
  if (!user) return <LoginView initialMode={emailConfirmationNeeded ? 'confirm-email' : 'login'} isDark={isDark} toggleTheme={toggleTheme} />;
  if (!selectedProject) return <ProjectSelection projects={projects} onSelect={setSelectedProject} onAdd={handleAddProject} onLogout={handleLogout} user={user} />;

  return (
    <div className="min-h-screen font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <nav className="bg-gradient-to-r from-soilGreen-900 via-soilGreen-800 to-soilGreen-900 text-white sticky top-0 z-50 shadow-2xl border-b border-soilGreen-800 print:hidden backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl shadow-lg">
              <AppLogo className="h-8 w-8" />
            </div>
            <div>
              <span className="font-bold text-lg md:text-xl tracking-tight hidden md:block">SB-CasTrack</span>
              <span className="md:hidden font-bold">SB-CT</span>
              <p className="text-xs text-slate-400 hidden md:block">{selectedProject?.name}</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'tracker', label: 'Tracker', icon: FileText },
              { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
              { id: 'reports', label: 'Reports', icon: BarChart3 }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id 
                    ? 'bg-soilOrange-500 text-white shadow-lg transform scale-105'
                    : 'text-soilGreen-100 hover:text-white hover:bg-soilGreen-800/50'
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
              className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-600"
            >
              <RefreshCw size={14} /> Switch Project
            </button>
             <div className="text-right hidden sm:block cursor-pointer group" onClick={() => { setProfileForm({ name: user.name || '', designation: user.designation || '' }); setActiveModal('profile'); }}>
               <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">{user.name || user.email}</p>
               <p className="text-[10px] text-slate-400 text-right">{user.designation || 'No Designation'}</p>
             </div>
            <button 
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} 
              onClick={toggleTheme} 
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              aria-label="Logout" 
              onClick={handleLogout} 
              className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-slate-400 hover:text-red-400"
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
         <CalendarView data={data} />}
      </main>
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm print:hidden">
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
