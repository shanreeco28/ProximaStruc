import React, { useState, useRef, useEffect } from 'react';

const BubbleTooltip = ({ title, content, author, children, onVisible, onHidden, meta }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [show, setShow] = useState(false);
  const timerRef = useRef(null);
  const triggerRef = useRef(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    }
  };

  useEffect(() => {
    if (show) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition, true);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition, true);
      };
    }
  }, [show]);

  const handleMouseEnter = () => {
    if (onVisible) onVisible(meta, false);
    if (!content && !author && !title) return;
    updatePosition();
    timerRef.current = setTimeout(() => setShow(true), 2000);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (!content && !author && !title) return;
    updatePosition();

    if (show) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setShow(false);
      if (onHidden) onHidden();
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      setShow(true);
      if (onVisible) onVisible(meta, true);
    }
  };

  const handleMouseLeave = () => { if (timerRef.current) clearTimeout(timerRef.current); setShow(false); if (onHidden) onHidden(); };

  return (
    <>
      <div ref={triggerRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={handleClick} className="relative w-full cursor-pointer">
        {children}
      </div>
      {show && (
        <div className="fixed z-[9999] bg-slate-800 dark:bg-slate-900 text-white text-[10px] p-2 rounded shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-200 max-w-[200px]" style={{ top: position.top, left: position.left, transform: 'translate(-50%, -100%)' }}>
          <div className="font-bold border-b border-slate-600 pb-1 mb-1 text-white uppercase text-[10px] tracking-wider">{title || "Details"}</div>
          <div className="leading-relaxed text-slate-300">{content}</div>
          {author && <div className="mt-1 pt-1 border-t border-slate-600 text-slate-400 italic text-[8px]">Added by: {author}</div>}
          <div className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-slate-800 dark:border-t-slate-900"></div>
        </div>
      )}
    </>
  );
};

export default BubbleTooltip;
