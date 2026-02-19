import React from 'react';
import { Truck } from 'lucide-react';
import { isDateAfter } from '../utils/dateHelpers';

const DeliveryTags = ({ deliveries, castingDate }) => {
  let list = Array.isArray(deliveries) ? deliveries : [];
  return (
    <div className="flex flex-col gap-1.5">
      {list.length > 0 ? list.map((d, idx) => {
          const isCriticalDelay = castingDate && isDateAfter(d.date, castingDate);
          return (
            <div key={idx} className="flex items-center gap-2 text-xs" title={d.description + (d.createdBy ? ` (By: ${d.createdBy})` : '')}>
               <Truck size={12} className={isCriticalDelay ? "text-red-500" : "text-emerald-500"} />
               <span className={`font-medium ${isCriticalDelay ? "text-red-700 dark:text-red-400 font-bold" : "text-slate-700 dark:text-slate-300"}`}>{d.date}</span>
               {isCriticalDelay && <span className="text-[8px] text-red-500 dark:text-red-400 font-bold px-1 border border-red-200 dark:border-red-800 rounded bg-red-50 dark:bg-red-900/30">LATE</span>}
            </div>
          );
        }) : <span className="text-slate-300 dark:text-slate-600 italic text-[10px] pl-1">No actuals yet</span>}
    </div>
  );
};

export default DeliveryTags;
