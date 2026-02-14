import React from 'react';
import { createPortal } from 'react-dom';
import { BarChart3, Printer, X, Calendar as CalendarIcon } from 'lucide-react';

const ExecutiveReportModal = ({ selectedProject, metrics, data, filteredData, onClose }) => {
  // Calculate total delays (completed late + currently delayed status)
  const totalDelayed = metrics.late + data.filter(d => d.status === 'Delayed').length;

  // Sorting and Grouping for Report
  const isRamp = (item) => (item.zone || '').toLowerCase().includes('ramp') || (item.slabId || '').toLowerCase().includes('ramp');

  const sortedData = [...filteredData].sort((a, b) => {
      const dateA = new Date(a.castingDate || '1970-01-01');
      const dateB = new Date(b.castingDate || '1970-01-01');
      return dateB - dateA; // Descending (Latest to Furthest)
  });

  const typicalItems = sortedData.filter(item => !isRamp(item));
  const rampItems = sortedData.filter(item => isRamp(item));

  return (
    <>
      {/* Interactive Web View - Rendered in normal React tree */}
      <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
           <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
               <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                   <BarChart3 className="text-blue-600" /> Executive Project Report
               </h3>
               <div className="flex gap-2">
                   <button onClick={() => window.print()} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors flex items-center gap-2">
                      <Printer size={20} /> <span className="text-sm font-medium">Print Report</span>
                   </button>
                   <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X size={24} /></button>
               </div>
           </div>

           <div className="overflow-y-auto p-8 space-y-8">
              {/* KPI Cards (Web View) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-500 uppercase">Total Scope</p>
                      <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{metrics.total}</p>
                   </div>
                   <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800">
                      <p className="text-xs font-bold text-emerald-600 uppercase">Completed</p>
                      <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-400 mt-1">{metrics.cast}</p>
                   </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                      <p className="text-xs font-bold text-blue-600 uppercase">Scheduled</p>
                      <p className="text-3xl font-bold text-blue-900 dark:text-blue-400 mt-1">{metrics.pending}</p>
                   </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800">
                      <p className="text-xs font-bold text-red-600 uppercase">Delayed / Late</p>
                      <p className="text-3xl font-bold text-red-900 dark:text-red-400 mt-1">{totalDelayed}</p>
                   </div>
              </div>

              {/* Monthly Progress Table (Web View) */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-800/50">
                 <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><CalendarIcon size={18} /> Monthly Progress</h4>
                 <table className="w-full text-sm text-left">
                     <thead className="bg-slate-100 dark:bg-slate-900 text-xs uppercase font-bold text-slate-600 dark:text-slate-300">
                         <tr><th className="p-3">Month</th><th className="p-3 text-right">Planned</th><th className="p-3 text-right">Actual</th><th className="p-3 text-right">Variance</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                         {Object.keys(metrics.monthlyStats).sort().map(key => {
                             const stats = metrics.monthlyStats[key];
                             return (
                                 <tr key={key} className="text-slate-700 dark:text-slate-300">
                                     <td className="p-3 font-medium">{key}</td>
                                     <td className="p-3 text-right">{stats.planned}</td>
                                     <td className="p-3 text-right">{stats.actual}</td>
                                     <td className={`p-3 text-right font-bold ${stats.actual < stats.planned ? 'text-red-600' : 'text-emerald-600'}`}>{stats.actual - stats.planned}</td>
                                 </tr>
                             );
                         })}
                     </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>

      {/* Print Layout View - Rendered via Portal to avoid layout interference */}
      {createPortal(
        <div className="print-portal-root">
          <style>
            {`
              @media print {
                /* Hide the main app container completely */
                #root, .print-hidden {
                  display: none !important;
                }

                /* Ensure the portal content is visible */
                .print-portal-root {
                  display: block !important;
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: auto;
                  z-index: 9999;
                  background: white;
                  color: black;
                }

                /* Reset page layout */
                @page {
                  size: A4;
                  margin: 15mm;
                }

                body, html {
                  background: white !important;
                  height: auto !important;
                  overflow: visible !important;
                }

                /* Reset element styles for print */
                * {
                  -webkit-print-color-adjust: exact;
                  box-shadow: none !important;
                }

                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid black !important; padding: 4px 8px; }
                th { background-color: #f3f4f6 !important; font-weight: bold; }
                .break-inside-avoid { break-inside: avoid; }
                .break-before-page { break-before: page; }
              }

              /* Hide portal content on screen */
              @media screen {
                .print-portal-root {
                  display: none;
                }
              }
            `}
          </style>

          <div className="p-8 font-sans text-black bg-white">
             {/* Header */}
             <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
                <div>
                   <h1 className="text-3xl font-bold uppercase tracking-wide mb-1">Project Status Report</h1>
                   <h2 className="text-xl font-medium">{selectedProject?.name}</h2>
                </div>
                <div className="text-right text-sm leading-relaxed">
                   <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                   <p><strong>Report ID:</strong> RPT-{new Date().toISOString().slice(0,10).replace(/-/g,'')}</p>
                   <p className="font-bold uppercase tracking-widest mt-2">CONFIDENTIAL</p>
                </div>
             </div>

             {/* Executive Summary */}
             <div className="mb-8 break-inside-avoid">
                <h3 className="text-lg font-bold uppercase mb-2 border-b border-black inline-block">1. Executive Summary</h3>
                <table className="w-full border-collapse border border-black text-sm mb-4 mt-2">
                   <thead>
                      <tr className="bg-gray-100">
                         <th className="border border-black p-2 text-left w-1/4">Metric</th>
                         <th className="border border-black p-2 text-right w-1/4">Value</th>
                         <th className="border border-black p-2 text-left w-1/2">Notes</th>
                      </tr>
                   </thead>
                   <tbody>
                      <tr>
                         <td className="border border-black p-2 font-bold">Total Scope</td>
                         <td className="border border-black p-2 text-right">{metrics.total}</td>
                         <td className="border border-black p-2 text-xs italic">Total casting zones tracked</td>
                      </tr>
                      <tr>
                         <td className="border border-black p-2 font-bold">Completed Casts</td>
                         <td className="border border-black p-2 text-right">{metrics.cast}</td>
                         <td className="border border-black p-2 text-xs italic">{Math.round((metrics.cast/metrics.total)*100 || 0)}% completion rate</td>
                      </tr>
                      <tr>
                         <td className="border border-black p-2 font-bold">Pending / Scheduled</td>
                         <td className="border border-black p-2 text-right">{metrics.pending}</td>
                         <td className="border border-black p-2 text-xs italic">Upcoming work</td>
                      </tr>
                       <tr>
                         <td className="border border-black p-2 font-bold text-red-700">Critical Delays</td>
                         <td className="border border-black p-2 text-right font-bold text-red-700">{totalDelayed}</td>
                         <td className="border border-black p-2 text-xs italic text-red-700">Items behind schedule</td>
                      </tr>
                   </tbody>
                </table>
             </div>

             {/* Monthly Progress */}
             <div className="mb-8 break-inside-avoid">
                 <h3 className="text-lg font-bold uppercase mb-2 border-b border-black inline-block">2. Monthly Progress</h3>
                 <table className="w-full border-collapse border border-black text-sm mt-2">
                     <thead>
                         <tr className="bg-gray-100">
                             <th className="border border-black p-2 text-left">Month</th>
                             <th className="border border-black p-2 text-right">Planned</th>
                             <th className="border border-black p-2 text-right">Actual</th>
                             <th className="border border-black p-2 text-right">Variance</th>
                         </tr>
                     </thead>
                     <tbody>
                         {Object.keys(metrics.monthlyStats).sort().map(key => {
                             const stats = metrics.monthlyStats[key];
                             const [y, m] = key.split('-');
                             const label = new Date(y, m-1).toLocaleString('default', { month: 'long', year: 'numeric' });
                             return (
                                 <tr key={key}>
                                     <td className="border border-black p-2">{label}</td>
                                     <td className="border border-black p-2 text-right">{stats.planned}</td>
                                     <td className="border border-black p-2 text-right">{stats.actual}</td>
                                     <td className="border border-black p-2 text-right font-bold">
                                       {stats.actual - stats.planned > 0 ? '+' : ''}{stats.actual - stats.planned}
                                     </td>
                                 </tr>
                             );
                         })}
                     </tbody>
                 </table>
             </div>

             {/* Risk Register */}
             <div className="mb-8 break-inside-avoid">
                <h3 className="text-lg font-bold uppercase mb-2 border-b border-black inline-block">3. Risk Register (Critical Items)</h3>
                <table className="w-full border-collapse border border-black text-xs mt-2">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-2 text-left">Zone / ID</th>
                      <th className="border border-black p-2 text-center">Planned</th>
                      <th className="border border-black p-2 text-center">Actual</th>
                      <th className="border border-black p-2 text-left">Remarks / Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.filter(i => i.status === 'Delayed' || (i.castingDate && i.actualCastingDate && new Date(i.actualCastingDate) > new Date(i.castingDate))).length === 0 ? (
                      <tr><td colSpan="4" className="border border-black p-4 text-center italic">No critical delays reported.</td></tr>
                    ) : (
                      data.filter(i => i.status === 'Delayed' || (i.castingDate && i.actualCastingDate && new Date(i.actualCastingDate) > new Date(i.castingDate))).map(item => (
                        <tr key={item.id}>
                          <td className="border border-black p-2 font-bold">{item.slabId} <br/><span className="font-normal">{item.zone}</span></td>
                          <td className="border border-black p-2 text-center">{item.castingDate}</td>
                          <td className="border border-black p-2 text-center font-bold">{item.actualCastingDate || 'Pending'}</td>
                          <td className="border border-black p-2 italic">{item.remarks || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
             </div>

             {/* Detailed Schedule (Typical Slabs) */}
             <div className="mb-8 break-before-page">
                <h3 className="text-lg font-bold uppercase mb-2 border-b border-black inline-block">4. Detailed Casting Schedule - Typical Slabs</h3>
                <table className="w-full border-collapse border border-black text-xs mt-2">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-1 text-left">Date</th>
                      <th className="border border-black p-1 text-left">Zone</th>
                      <th className="border border-black p-1 text-left">ID</th>
                      <th className="border border-black p-1 text-center">Status</th>
                      <th className="border border-black p-1 text-left">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typicalItems.map(item => (
                      <tr key={item.id}>
                        <td className="border border-black p-1 whitespace-nowrap">{item.castingDate || '-'}</td>
                        <td className="border border-black p-1">{item.zone}</td>
                        <td className="border border-black p-1 font-mono">{item.slabId}</td>
                        <td className="border border-black p-1 text-center">{item.status}</td>
                        <td className="border border-black p-1 italic max-w-[200px] truncate">{item.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>

             {/* Detailed Schedule (Ramp Slabs) */}
             {rampItems.length > 0 && (
                 <div className="mb-8 break-before-page">
                    <h3 className="text-lg font-bold uppercase mb-2 border-b border-black inline-block">5. Detailed Casting Schedule - Ramps</h3>
                    <table className="w-full border-collapse border border-black text-xs mt-2">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-black p-1 text-left">Date</th>
                          <th className="border border-black p-1 text-left">Zone</th>
                          <th className="border border-black p-1 text-left">ID</th>
                          <th className="border border-black p-1 text-center">Status</th>
                          <th className="border border-black p-1 text-left">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rampItems.map(item => (
                          <tr key={item.id}>
                            <td className="border border-black p-1 whitespace-nowrap">{item.castingDate || '-'}</td>
                            <td className="border border-black p-1">{item.zone}</td>
                            <td className="border border-black p-1 font-mono">{item.slabId}</td>
                            <td className="border border-black p-1 text-center">{item.status}</td>
                            <td className="border border-black p-1 italic max-w-[200px] truncate">{item.remarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
             )}

             {/* Signature Block */}
             <div className="mt-16 border-t border-black pt-8 grid grid-cols-2 gap-16 break-inside-avoid">
                <div>
                   <p className="border-b border-black mb-2 pb-8"></p>
                   <p className="text-sm font-bold uppercase">Prepared By</p>
                   <p className="text-xs text-gray-600">Project Manager</p>
                </div>
                <div>
                   <p className="border-b border-black mb-2 pb-8"></p>
                   <p className="text-sm font-bold uppercase">Authorized By</p>
                   <p className="text-xs text-gray-600">Client / Stakeholder</p>
                </div>
             </div>

             <div className="mt-8 text-center text-[10px] uppercase text-gray-500">
                Generated by SB-CasTrack on {new Date().toLocaleString()} | Confidential Internal Document
             </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ExecutiveReportModal;
