import React, { useState } from 'react';
import {
  Search,
  Plus,
  X,
  FileSignature,
  PackagePlus,
  ArrowUp,
  ArrowDown,
  Hammer,
  CheckCircle2,
  Edit2
} from 'lucide-react';
import BbsTags from './BbsTags';
import DeliveryTags from './DeliveryTags';
import StatusSelect from './StatusSelect';

const TrackerView = ({
  filteredData,
  searchQuery,
  setSearchQuery,
  dateFilter,
  setDateFilter,
  user,
  sortConfig,
  onSort,
  onUpdateSlab,
  onDeleteSlab,
  onAssignBBS,
  onAssignDelivery,
  onAddCasting,
  onEditBBS,
  onDeleteBBS,
  onAddBBS,
  onEditCasting
}) => {
  const [trackerSubTab, setTrackerSubTab] = useState('standard');
  const [editingRemark, setEditingRemark] = useState({ id: null, text: '' });
  const [editingSlabId, setEditingSlabId] = useState({ id: null, text: '' });

  const checkAdmin = () => {
    if (user?.role !== 'admin') {
       alert("Permission Denied: Admin access required.");
       return false;
    }
    return true;
  };

  const startEditingRemark = (item) => {
    if(!checkAdmin()) return;
    setEditingRemark({ id: item.id, text: item.remarks || '' });
  };

  const saveRemark = async () => {
    if (!editingRemark.id) return;
    await onUpdateSlab(editingRemark.id, { remarks: editingRemark.text });
    setEditingRemark({ id: null, text: '' });
  };

  const startEditingSlabId = (item) => {
    if(!checkAdmin()) return;
    setEditingSlabId({ id: item.id, text: item.slabId || '' });
  };

  const saveSlabId = async () => {
    if (!editingSlabId.id) return;
    await onUpdateSlab(editingSlabId.id, { slabId: editingSlabId.text });
    setEditingSlabId({ id: null, text: '' });
  };

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
        {user?.role === 'admin' && (<div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto"><button onClick={onAssignBBS} className="col-span-1 flex items-center justify-center gap-1 md:gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors border border-slate-200 dark:border-slate-600"><FileSignature size={16} /><span className="truncate">Assign BBS</span></button><button onClick={onAssignDelivery} className="col-span-1 flex items-center justify-center gap-1 md:gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors border border-slate-200 dark:border-slate-600"><PackagePlus size={16} /><span className="truncate">Log HCS</span></button><button onClick={onAddCasting} className="col-span-2 md:col-span-1 flex items-center justify-center gap-2 bg-soilOrange-500 hover:bg-soilOrange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"><Plus size={18} /> Add Casting</button></div>)}
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group" onClick={() => onSort('slabId')}>
                      <div className="flex items-center gap-1">Casting ID {sortConfig.key === 'slabId' && (sortConfig.direction === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</div>
                  </th>
                  <th className="p-4">Zone / Level</th>
                  <th className="p-4">Remarks</th>
                  <th className="p-4">BBS Number</th>
                  <th className="p-4">HCS Delivery</th>
                  <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group" onClick={() => onSort('castingDate')}>
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
                <td className="p-4 align-top"><BbsTags bbs={item.bbs} castingDate={item.castingDate} onEdit={(idx) => onEditBBS(item, idx)} onDelete={(idx) => onDeleteBBS(item, idx)} onAdd={() => onAddBBS(item)} readOnly={user?.role !== 'admin'} /></td>
                <td className="p-4 align-top"><DeliveryTags deliveries={item.deliveries} castingDate={item.castingDate} /></td>
                <td className="p-4 text-slate-600 align-top"><div className="flex flex-col gap-1"><div className="flex items-center gap-2"><Hammer size={14} className="text-slate-400" /> <span className="text-xs text-slate-500">Target:</span> {item.castingDate}</div>{item.actualCastingDate && (<div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> <span className="text-xs text-slate-500">Actual:</span> <span className="font-bold">{item.actualCastingDate}</span></div>)}{user?.role === 'admin' && <button onClick={() => onEditCasting(item)} className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-1"><Edit2 size={10} /> Edit Dates</button>}</div></td>
                <td className="p-4 align-top"><StatusSelect disabled={user?.role !== 'admin'} currentStatus={item.status} targetDate={item.castingDate} actualDate={item.actualCastingDate} onChange={(val) => onUpdateSlab(item.id, { status: val })} /></td>
                {user?.role === 'admin' && <td className="p-4 text-right align-top"><button aria-label="Delete entry" onClick={() => onDeleteSlab(item.id)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18} /></button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Card View */}
      <div className="md:hidden bg-slate-50 dark:bg-slate-900 p-4 space-y-4">
        {displayData.map(item => (
          <div key={item.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 relative overflow-hidden">
             <div className="flex justify-between items-start mb-3"><div><h3 className="font-bold text-slate-800 dark:text-white truncate">{item.slabId}</h3><p className="text-xs text-slate-500 truncate">{item.zone}</p></div><StatusSelect disabled={user?.role !== 'admin'} currentStatus={item.status} targetDate={item.castingDate} actualDate={item.actualCastingDate} onChange={(val) => onUpdateSlab(item.id, { status: val })} /></div>
             <div className="space-y-3">
                 <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600"><p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Target Casting</p><div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300"><span className="flex items-center gap-2"><Hammer size={14} className="text-emerald-500" /> {item.castingDate}</span>{user?.role === 'admin' && <button aria-label="Edit casting dates" onClick={() => onEditCasting(item)} className="text-slate-400 hover:text-blue-600"><Edit2 size={14} /></button>}</div>{item.actualCastingDate && (<div className="flex items-center gap-2 text-sm text-slate-700 mt-1 pl-6"><span className="text-[10px] text-slate-400 uppercase">Actual:</span><span className="font-bold text-emerald-700 dark:text-emerald-400">{item.actualCastingDate}</span></div>)}</div>
                 <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600" onClick={() => startEditingRemark(item)}><p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Remarks (Tap to edit)</p>{editingRemark.id === item.id ? (<input autoFocus type="text" className="w-full bg-white dark:bg-slate-800 border border-blue-300 rounded px-2 py-1 text-xs outline-none" value={editingRemark.text} onChange={(e) => setEditingRemark({...editingRemark, text: e.target.value})} onBlur={saveRemark} onKeyDown={(e) => e.key === 'Enter' && saveRemark()} />) : (<div className="text-xs text-slate-600 dark:text-slate-300 min-h-[1.25rem] break-words">{item.remarks || <span className="text-slate-400 italic">No remarks</span>}</div>)}</div>
                 <div className="grid grid-cols-2 gap-2"><div className="bg-slate-50 dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600"><p className="text-[10px] text-slate-400 uppercase font-bold mb-1">HCS Deliveries</p><DeliveryTags deliveries={item.deliveries} castingDate={item.castingDate} /></div><div className="bg-slate-50 dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600"><p className="text-[10px] text-slate-400 uppercase font-bold mb-1">BBS List</p><BbsTags bbs={item.bbs} castingDate={item.castingDate} onEdit={(idx) => onEditBBS(item, idx)} onDelete={(idx) => onDeleteBBS(item, idx)} onAdd={() => onAddBBS(item)} readOnly={user?.role !== 'admin'} /></div></div>
             </div>
             {user?.role === 'admin' && (<button aria-label="Delete entry" onClick={() => onDeleteSlab(item.id)} className="absolute top-4 right-2 text-slate-300 hover:text-red-500 p-2"><X size={16} /></button>)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrackerView;
