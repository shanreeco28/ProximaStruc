import React from 'react';

const SlabTable = ({ title, data }) => {
  if (!data) return null;

  return (
    <>
      <h4 className="font-bold uppercase mb-2 mt-4">{title}</h4>
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
          {data.map(item => (
            <tr key={item.id} className="break-inside-avoid">
              <td className="border border-black p-2 font-bold">{item.slabId}</td>
              <td className="border border-black p-2">{item.zone}</td>
              <td className="border border-black p-2 text-center">{item.status}</td>
              <td className="border border-black p-2 text-center">{item.probableCastingDate || item.castingDate || '-'}</td>
              <td className="border border-black p-2 text-center">{item.actualCastingDate || '-'}</td>
              <td className="border border-black p-2 max-w-[200px] truncate">{item.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default SlabTable;
