import React, { useState, useEffect } from 'react';

const GhostLine = ({ startId, endId }) => {
  const [coords, setCoords] = useState(null);
  useEffect(() => {
    if (!startId || !endId) return;
    const update = () => {
      const s = document.getElementById(startId); const e = document.getElementById(endId);
      if (s && e) {
        const sr = s.getBoundingClientRect(); const er = e.getBoundingClientRect();
        const x1 = sr.left + sr.width/2; const y1 = sr.top + sr.height/2;
        let x2 = er.left + er.width/2; let y2 = er.top + er.height/2;
        if (er.top > sr.bottom + 5) y2 = er.top; else if (er.bottom < sr.top - 5) y2 = er.bottom; else { y2 = y1; x2 = x1 < x2 ? er.left : er.right; }
        setCoords({ x1, y1, x2, y2 });
      }
    };
    update(); window.addEventListener('scroll', update, true); window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update); };
  }, [startId, endId]);
  if (!coords) return null;
  const d = `M ${coords.x1} ${coords.y1} L ${coords.x2} ${coords.y1} L ${coords.x2} ${coords.y2}`;
  return (
    <svg className="fixed inset-0 pointer-events-none z-[10]" style={{ width: '100%', height: '100%' }}>
      <defs><marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#dc2626" /></marker></defs>
      <path d={d} fill="none" stroke="#dc2626" strokeWidth="2" markerEnd="url(#arrowhead)" className="drop-shadow-sm opacity-80" /><circle cx={coords.x1} cy={coords.y1} r="3" fill="#dc2626" className="drop-shadow-sm" />
    </svg>
  );
};

export default GhostLine;
