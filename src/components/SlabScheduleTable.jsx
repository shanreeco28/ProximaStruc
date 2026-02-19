import React from 'react';

const SlabScheduleTable = ({ title, data }) => {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold uppercase mb-2 border-b border-black inline-block">{title}</h3>
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
          {data.map(item => (
            <tr key={item.id}>
              <td className="border border-black p-1 whitespace-nowrap">{item.probableCastingDate || item.castingDate || '-'}</td>
              <td className="border border-black p-1">{item.zone}</td>
              <td className="border border-black p-1 font-mono">{item.slabId}</td>
              <td className="border border-black p-1 text-center">{item.status}</td>
              <td className="border border-black p-1 italic max-w-[200px] truncate">{item.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SlabScheduleTable;
