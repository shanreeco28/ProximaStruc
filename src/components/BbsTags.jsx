import React, { memo } from 'react';
import { AlertTriangle, X, Plus } from 'lucide-react';
import { isCriticalDelay as checkCriticalDelay } from '../utils/dateHelpers';

const BbsTags = memo(({ bbs, castingDate, onEdit, onDelete, onAdd, readOnly }) => {
  let list = Array.isArray(bbs) ? bbs : (bbs ? [bbs] : []);

  return (
    <div className="flex flex-wrap gap-1 justify-end items-center">
      {list.length === 0 && <span className="text-slate-400 dark:text-slate-600 italic text-xs mr-1">Pending</span>}
      {list.map((b, idx) => {
        const isObj = typeof b === 'object' && b !== null;
        const text = isObj ? b.number : b;
        const desc = isObj ? b.description : '';
        const actual = isObj ? b.actualDate : '';
        const isCriticalDelay = checkCriticalDelay(actual, castingDate);
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
      {!readOnly && onAdd && (
        <button
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            title="Add BBS"
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center"
        >
            <Plus size={12} />
        </button>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.bbs === nextProps.bbs &&
    prevProps.castingDate === nextProps.castingDate &&
    prevProps.readOnly === nextProps.readOnly &&
    prevProps.onAdd === nextProps.onAdd
  );
});

export default BbsTags;
