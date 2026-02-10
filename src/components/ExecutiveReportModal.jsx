import React from 'react';
import { BarChart3, Printer, X, Layers, CheckCircle2, Truck, AlertTriangle, Calendar as CalendarIcon, TrendingUp, Activity, Hammer } from 'lucide-react';

const ExecutiveReportModal = ({ selectedProject, user, metrics, data, filteredData, onClose }) => (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm print:bg-white print:static print:block print:p-0 print:h-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] print:shadow-none print:max-h-none print:w-full print:max-w-none print:overflow-visible">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 print:bg-white print:border-b-2 print:border-black">
          <div><h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2 print:text-black"><BarChart3 className="text-blue-600 print:text-black" /> Executive Project Report: {selectedProject?.name}</h3><p className="text-xs text-slate-500 mt-1 print:text-black">Generated: {new Date().toLocaleDateString()}</p></div>
          <div className="flex gap-2 no-print"><button aria-label="Print report" onClick={() => window.print()} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors hidden md:block"><Printer size={20} /></button><button aria-label="Close report" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X size={24} /></button></div>
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

export default ExecutiveReportModal;
