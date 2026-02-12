import React from 'react';
import { BarChart3, Printer, X, Layers, CheckCircle2, Truck, AlertTriangle, Calendar as CalendarIcon, TrendingUp, Activity, Hammer } from 'lucide-react';

const ExecutiveReportModal = ({ selectedProject, metrics, data, filteredData, onClose }) => (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm print:bg-white print:static print:block print:p-0 print:h-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] print:shadow-none print:max-h-none print:w-full print:max-w-none print:overflow-visible">
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 print:bg-white print:border-b-2 print:border-black print:pb-4">
          <div className="w-full">
            <div className="flex justify-between items-center print:border-b print:border-black print:pb-2 print:mb-2">
               <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2 print:text-black print:text-2xl print:uppercase print:tracking-wide">
                 <BarChart3 className="text-blue-600 print:text-black" /> Executive Project Report
               </h3>
               <div className="hidden print:block text-right">
                  <span className="text-xs text-slate-500 print:text-black uppercase font-bold">Confidential</span>
               </div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm font-bold text-slate-700 print:text-black mt-1">Project: {selectedProject?.name}</p>
                <p className="text-xs text-slate-500 print:text-black">Generated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 no-print ml-4"><button aria-label="Print report" onClick={() => window.print()} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors hidden md:block"><Printer size={20} /></button><button aria-label="Close report" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X size={24} /></button></div>
        </div>

        {/* Content Section */}
        <div className="overflow-y-auto p-8 space-y-8 print:p-0 print:pt-4 print:space-y-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4 print:gap-4">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 print:bg-white print:border print:border-black">
              <p className="text-xs font-bold text-slate-500 uppercase print:text-black">Total Scope</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1 print:text-black">{metrics.total}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800 print:bg-white print:border print:border-black">
              <p className="text-xs font-bold text-emerald-600 uppercase print:text-black">Completed</p>
              <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-400 mt-1 print:text-black">{metrics.cast} <span className="text-sm font-normal">({Math.round((metrics.cast/metrics.total)*100 || 0)}%)</span></p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 print:bg-white print:border print:border-black">
              <p className="text-xs font-bold text-blue-600 uppercase print:text-black">Scheduled</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-400 mt-1 print:text-black">{metrics.pending}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800 print:bg-white print:border print:border-black">
              <p className="text-xs font-bold text-red-600 uppercase print:text-black">Delayed / Late</p>
              <p className="text-3xl font-bold text-red-900 dark:text-red-400 mt-1 print:text-black">{metrics.late + data.filter(d => d.status === 'Delayed').length}</p>
            </div>
          </div>

          {/* Monthly Progress Table */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-800/50 print:bg-white print:border print:border-black print:p-0 print:rounded-none">
             <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 print:text-black print:mb-2 print:border-b print:border-black print:pb-1"><CalendarIcon size={18} /> Monthly Progress Summary</h4>
             <table className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden print:border print:border-black print:rounded-none">
                 <thead className="bg-slate-100 dark:bg-slate-900 print:bg-gray-100 text-xs uppercase font-bold text-slate-600 dark:text-slate-300 print:text-black border-b print:border-black">
                     <tr>
                         <th className="p-3 text-left print:p-2 border-r print:border-black">Month</th>
                         <th className="p-3 text-right print:p-2 border-r print:border-black">Planned Casts</th>
                         <th className="p-3 text-right print:p-2 border-r print:border-black">Actual Casts</th>
                         <th className="p-3 text-right print:p-2">Variance</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-700 print:divide-black">
                     {Object.keys(metrics.monthlyStats).sort().map(key => {
                         const stats = metrics.monthlyStats[key];
                         const [y, m] = key.split('-');
                         const label = new Date(y, m-1).toLocaleString('default', { month: 'long', year: 'numeric' });
                         return (
                             <tr key={key} className="text-slate-700 dark:text-slate-300 print:text-black border-b print:border-black">
                                 <td className="p-3 font-medium print:p-2 border-r print:border-black">{label}</td>
                                 <td className="p-3 text-right print:p-2 border-r print:border-black">{stats.planned}</td>
                                 <td className="p-3 text-right print:p-2 border-r print:border-black">{stats.actual}</td>
                                 <td className={`p-3 text-right font-bold ${stats.actual < stats.planned ? 'text-red-600' : 'text-emerald-600'} print:text-black print:p-2`}>
                                   {stats.actual - stats.planned > 0 ? '+' : ''}{stats.actual - stats.planned}
                                 </td>
                             </tr>
                         );
                     })}
                 </tbody>
             </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4 print:break-inside-avoid">
            {/* Schedule Adherence - Keep Colors for Bars */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 print:border print:border-black print:p-4">
              <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 print:text-black print:mb-2 print:border-b print:border-black print:pb-1"><TrendingUp size={18} /> Schedule Adherence</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1 text-slate-600 dark:text-slate-300 print:text-black"><span>Early Completion</span> <span className="font-bold text-emerald-600 print:text-black">{metrics.early}</span></div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden print:border print:border-black print:bg-white"><div style={{width: `${(metrics.early/metrics.cast)*100 || 0}%`}} className="h-full bg-emerald-500 print:bg-emerald-500"></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1 text-slate-600 dark:text-slate-300 print:text-black"><span>On-Time</span> <span className="font-bold text-slate-600 dark:text-slate-400 print:text-black">{metrics.onTime}</span></div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden print:border print:border-black print:bg-white"><div style={{width: `${(metrics.onTime/metrics.cast)*100 || 0}%`}} className="h-full bg-slate-400 print:bg-slate-400"></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1 text-slate-600 dark:text-slate-300 print:text-black"><span>Late / Delayed</span> <span className="font-bold text-red-600 print:text-black">{metrics.late}</span></div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden print:border print:border-black print:bg-white"><div style={{width: `${(metrics.late/metrics.cast)*100 || 0}%`}} className="h-full bg-red-500 print:bg-red-500"></div></div>
                </div>
              </div>
            </div>

            {/* Site Efficiency */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 print:border print:border-black print:p-4">
              <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 print:text-black print:mb-2 print:border-b print:border-black print:pb-1"><Activity size={18} /> Site Efficiency</h4>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700 rounded print:bg-white print:border-b print:border-black print:rounded-none">
                  <span className="text-slate-600 dark:text-slate-300 print:text-black">Pending HCS</span><span className="font-bold text-slate-800 dark:text-white print:text-black">{metrics.total - metrics.delivered} Zones</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700 rounded print:bg-white print:border-b print:border-black print:rounded-none">
                  <span className="text-slate-600 dark:text-slate-300 print:text-black">Active Issues (Remarks)</span><span className="font-bold text-slate-800 dark:text-white print:text-black">{data.filter(i => i.remarks).length}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700 rounded print:bg-white print:border-b print:border-black print:rounded-none">
                  <span className="text-slate-600 dark:text-slate-300 print:text-black">Critical Path Delays</span><span className="font-bold text-red-600 print:text-black">{data.filter(i => i.status === 'Delayed').length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="print:break-inside-avoid">
            <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 print:text-black print:mb-2 print:border-b print:border-black print:pb-1"><AlertTriangle size={18} /> Risk Register (Critical Delays)</h4>
            <table className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden print:border print:border-black print:rounded-none">
              <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase text-slate-500 font-bold print:bg-gray-100 print:text-black border-b print:border-black">
                <tr><th className="p-3 text-left print:p-2 border-r print:border-black">Zone / ID</th><th className="p-3 text-left print:p-2 border-r print:border-black">Planned Date</th><th className="p-3 text-left print:p-2 border-r print:border-black">Actual Date</th><th className="p-3 text-left print:p-2">Remarks / Impact</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 print:divide-black">
                {data.filter(i => i.status === 'Delayed' || (i.castingDate && i.actualCastingDate && new Date(i.actualCastingDate) > new Date(i.castingDate))).map(item => (
                  <tr key={item.id} className="text-slate-600 dark:text-slate-300 print:text-black border-b print:border-black">
                    <td className="p-3 font-medium text-slate-800 dark:text-white print:text-black print:p-2 border-r print:border-black">{item.slabId} <br/><span className="text-xs text-slate-400 font-normal print:text-black">{item.zone}</span></td>
                    <td className="p-3 print:p-2 border-r print:border-black">{item.castingDate}</td>
                    <td className="p-3 text-red-600 font-bold print:text-black print:p-2 border-r print:border-black">{item.actualCastingDate || 'Pending'}</td>
                    <td className="p-3 italic print:p-2">{item.remarks || 'No specific remarks'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="print:break-before-page">
            <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 print:text-black print:mb-2 print:border-b print:border-black print:pb-1"><Hammer size={18} /> Casting Schedule</h4>
            <table className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden print:border print:border-black print:rounded-none">
              <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase text-slate-500 font-bold print:bg-gray-100 print:text-black border-b print:border-black">
                <tr><th className="p-3 text-left print:p-2 border-r print:border-black">Date</th><th className="p-3 text-left print:p-2 border-r print:border-black">Zone / Level</th><th className="p-3 text-left print:p-2 border-r print:border-black">Casting ID</th><th className="p-3 text-left print:p-2 border-r print:border-black">Status</th><th className="p-3 text-left print:p-2">Remarks</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 print:divide-black">
                {filteredData.map(item => (
                  <tr key={item.id} className="text-slate-600 dark:text-slate-300 print:text-black border-b print:border-black">
                    <td className="p-3 whitespace-nowrap print:p-2 border-r print:border-black">{item.castingDate || '-'}</td>
                    <td className="p-3 font-medium text-slate-800 dark:text-white print:text-black print:p-2 border-r print:border-black">{item.zone}</td>
                    <td className="p-3 font-mono text-xs print:p-2 border-r print:border-black">{item.slabId}</td>
                    <td className="p-3 print:p-2 border-r print:border-black">
                      <span className={`px-2 py-1 rounded text-xs font-bold print:border print:border-black print:bg-white print:text-black ${item.status === 'Cast' ? 'bg-emerald-100 text-emerald-800' : item.status === 'Delayed' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{item.status}</span>
                    </td>
                    <td className="p-3 italic text-xs max-w-[200px] truncate print:p-2 print:whitespace-normal print:max-w-none">{item.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
);

export default ExecutiveReportModal;
