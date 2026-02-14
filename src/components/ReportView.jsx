import React, { useState } from 'react';
import { FileText, Printer, BarChart3, TrendingUp, Truck, Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import StatusSelect from './StatusSelect';

// --- Report View (Tab) ---
const ReportView = ({ selectedProject, user, metrics, filteredData }) => {
  const [reportType, setReportType] = useState('summary');
  const [showPreview, setShowPreview] = useState(false);

  // Sorting and Grouping Helper
  const isRamp = (item) => (item.zone || '').toLowerCase().includes('ramp') || (item.slabId || '').toLowerCase().includes('ramp');

  const getSortedData = (data) => {
      return [...data].sort((a, b) => {
          const dateA = new Date(a.castingDate || '1970-01-01');
          const dateB = new Date(b.castingDate || '1970-01-01');
          return dateA - dateB; // Ascending
      });
  };

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

  // Prepare data for "schedule" view
  const scheduleData = getSortedData(filteredData.filter(item => item.castingDate));
  const typicalSchedule = scheduleData.filter(item => !isRamp(item));
  const rampSchedule = scheduleData.filter(item => isRamp(item));

  return (
    <div className="space-y-6">
      {/* --- Interactive Web View --- */}
      <div className={showPreview ? 'hidden' : 'print:hidden space-y-6'}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="text-blue-500" size={24} />
            Project Reports
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <Printer size={16} /> Preview Print
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

        {/* Web Report Content */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Project: {selectedProject?.name} | Generated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Existing Web Content Rendering */}
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
            <div className="space-y-4">
              {filteredData.map(item => (
                <div key={item.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{item.slabId}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{item.zone}</p>
                    {item.castingDate && (
                      <p className="text-xs text-slate-500 mt-1">Target: {item.castingDate}</p>
                    )}
                  </div>
                  <StatusSelect disabled={true} currentStatus={item.status} targetDate={item.castingDate} actualDate={item.actualCastingDate} onChange={() => {}} />
                </div>
              ))}
            </div>
          )}

          {reportType === 'deliveries' && (
             <div className="space-y-4">
              {filteredData.filter(item => Array.isArray(item.deliveries) && item.deliveries.length > 0).map(item => (
                <div key={item.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-2">{item.slabId} - {item.zone}</h4>
                  <div className="space-y-2">
                    {item.deliveries.map((delivery, idx) => (
                      <div key={idx} className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 p-2 rounded">
                        <p><strong>Date:</strong> {delivery.date}</p>
                        <p><strong>Description:</strong> {delivery.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

           {reportType === 'schedule' && (
            <div className="space-y-8">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-4">Typical Slabs</h3>
                <div className="space-y-4">
                  {typicalSchedule.map(item => (
                    <div key={item.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex justify-between items-center">
                      <div>
                          <h4 className="font-bold text-slate-800 dark:text-white">{item.slabId}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{item.zone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-800 dark:text-white">{item.castingDate}</p>
                          <p className="text-xs text-slate-500">{item.status}</p>
                        </div>
                    </div>
                  ))}
                </div>
              </div>

              {rampSchedule.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white mb-4">Ramp Slabs</h3>
                  <div className="space-y-4">
                    {rampSchedule.map(item => (
                      <div key={item.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-white">{item.slabId}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{item.zone}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-800 dark:text-white">{item.castingDate}</p>
                            <p className="text-xs text-slate-500">{item.status}</p>
                          </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- Print / Preview Layout --- */}
      <div className={`${showPreview ? 'block' : 'hidden print:block'} bg-white text-black min-h-screen print:min-h-0 print:h-auto p-8 print:p-0 max-w-[210mm] mx-auto`}>
         {/* Preview Controls */}
         <div className="print:hidden mb-8 flex justify-between items-center bg-slate-100 p-4 rounded-lg border border-slate-200">
            <button
              onClick={() => setShowPreview(false)}
              className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium transition-colors"
            >
              <ArrowLeft size={20} /> Back to Dashboard
            </button>
            <button
              onClick={printReport}
              className="flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors font-bold shadow-md"
            >
              <Printer size={20} /> Print Report
            </button>
         </div>

         {/* Report Header */}
         <div className="border-b-2 border-black pb-4 mb-8">
            <div className="flex justify-between items-end">
               <div>
                  <h1 className="text-4xl font-bold uppercase tracking-wider mb-2">{selectedProject?.name}</h1>
                  <p className="text-xl uppercase tracking-widest font-light">{reportType} Report</p>
               </div>
               <div className="text-right text-sm leading-relaxed">
                  <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                  <p><strong>Generated By:</strong> {user?.name}</p>
                  <p><strong>Total Records:</strong> {filteredData.length}</p>
               </div>
            </div>
         </div>

         {/* Metrics Summary Table */}
         <div className="mb-8">
            <h3 className="text-lg font-bold uppercase mb-2 border-b border-black inline-block">Executive Summary</h3>
            <table className="w-full border-collapse border border-black text-sm mt-2">
               <thead>
                  <tr className="bg-gray-100">
                     <th className="border border-black p-2 text-center w-1/4">Total Scope</th>
                     <th className="border border-black p-2 text-center w-1/4">Completed</th>
                     <th className="border border-black p-2 text-center w-1/4">In Progress</th>
                     <th className="border border-black p-2 text-center w-1/4">Deliveries</th>
                  </tr>
               </thead>
               <tbody>
                  <tr>
                     <td className="border border-black p-3 text-center text-xl font-bold">{metrics.total}</td>
                     <td className="border border-black p-3 text-center text-xl font-bold">{metrics.cast}</td>
                     <td className="border border-black p-3 text-center text-xl font-bold">{metrics.pending}</td>
                     <td className="border border-black p-3 text-center text-xl font-bold">{metrics.delivered}</td>
                  </tr>
               </tbody>
            </table>
         </div>

         {/* Main Data Table */}
         <div className="mb-8">
            <h3 className="text-lg font-bold uppercase mb-2 border-b border-black inline-block">Detailed Data</h3>

            {reportType === 'summary' && (
                <div className="border border-black p-4 text-sm">
                   <p className="italic text-center">Refer to Executive Summary for high-level metrics. Select 'Progress' or 'Schedule' for detailed item lists.</p>
                </div>
            )}

            {(reportType === 'progress' || reportType === 'schedule') && (
               <>
                 {/* Typical Slabs */}
                 <h4 className="font-bold uppercase mb-2 mt-4">Typical Slabs</h4>
                 <table className="w-full border-collapse border border-black text-xs mb-6">
                    <thead>
                       <tr className="bg-gray-100">
                          <th className="border border-black p-2 text-left">Casting ID</th>
                          <th className="border border-black p-2 text-left">Zone / Level</th>
                          <th className="border border-black p-2 text-center">Status</th>
                          <th className="border border-black p-2 text-center">Target Date</th>
                          <th className="border border-black p-2 text-center">Actual Date</th>
                          <th className="border border-black p-2 text-left">Remarks</th>
                       </tr>
                    </thead>
                    <tbody>
                       {/* Note: filtering happens here again if reportType is progress/schedule, but reusing 'scheduleData' logic requires extraction */}
                       {(reportType === 'schedule' ? typicalSchedule : filteredData.filter(i => !isRamp(i))).map(item => (
                          <tr key={item.id} className="break-inside-avoid">
                             <td className="border border-black p-2 font-bold">{item.slabId}</td>
                             <td className="border border-black p-2">{item.zone}</td>
                             <td className="border border-black p-2 text-center">{item.status}</td>
                             <td className="border border-black p-2 text-center">{item.castingDate || '-'}</td>
                             <td className="border border-black p-2 text-center">{item.actualCastingDate || '-'}</td>
                             <td className="border border-black p-2 max-w-[200px] truncate">{item.remarks}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>

                 {/* Ramp Slabs */}
                 {(reportType === 'schedule' ? rampSchedule : filteredData.filter(i => isRamp(i))).length > 0 && (
                   <>
                     <h4 className="font-bold uppercase mb-2 mt-4">Ramp Slabs</h4>
                     <table className="w-full border-collapse border border-black text-xs">
                        <thead>
                           <tr className="bg-gray-100">
                              <th className="border border-black p-2 text-left">Casting ID</th>
                              <th className="border border-black p-2 text-left">Zone / Level</th>
                              <th className="border border-black p-2 text-center">Status</th>
                              <th className="border border-black p-2 text-center">Target Date</th>
                              <th className="border border-black p-2 text-center">Actual Date</th>
                              <th className="border border-black p-2 text-left">Remarks</th>
                           </tr>
                        </thead>
                        <tbody>
                           {(reportType === 'schedule' ? rampSchedule : filteredData.filter(i => isRamp(i))).map(item => (
                              <tr key={item.id} className="break-inside-avoid">
                                 <td className="border border-black p-2 font-bold">{item.slabId}</td>
                                 <td className="border border-black p-2">{item.zone}</td>
                                 <td className="border border-black p-2 text-center">{item.status}</td>
                                 <td className="border border-black p-2 text-center">{item.castingDate || '-'}</td>
                                 <td className="border border-black p-2 text-center">{item.actualCastingDate || '-'}</td>
                                 <td className="border border-black p-2 max-w-[200px] truncate">{item.remarks}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                   </>
                 )}
               </>
            )}

            {reportType === 'deliveries' && (
                <table className="w-full border-collapse border border-black text-xs">
                  <thead>
                     <tr className="bg-gray-100">
                        <th className="border border-black p-2 text-left">Casting ID</th>
                        <th className="border border-black p-2 text-left">Zone</th>
                        <th className="border border-black p-2 text-center">Delivery Date</th>
                        <th className="border border-black p-2 text-left">Description</th>
                        <th className="border border-black p-2 text-left">Logged By</th>
                     </tr>
                  </thead>
                  <tbody>
                     {filteredData
                        .filter(item => Array.isArray(item.deliveries) && item.deliveries.length > 0)
                        .flatMap(item => item.deliveries.map((d, idx) => ({ ...d, slabId: item.slabId, zone: item.zone, id: item.id + idx })))
                        .map((delivery, idx) => (
                           <tr key={idx} className="break-inside-avoid">
                              <td className="border border-black p-2 font-bold">{delivery.slabId}</td>
                              <td className="border border-black p-2">{delivery.zone}</td>
                              <td className="border border-black p-2 text-center">{delivery.date}</td>
                              <td className="border border-black p-2">{delivery.description}</td>
                              <td className="border border-black p-2">{delivery.createdBy || '-'}</td>
                           </tr>
                        ))
                     }
                  </tbody>
               </table>
            )}
         </div>

         {/* Footer */}
         <div className="mt-8 pt-4 border-t border-black text-center text-[10px] uppercase tracking-widest">
            Generated by SB-CasTrack | Confidential Internal Report
         </div>
      </div>
    </div>
  );
};

export default ReportView;
