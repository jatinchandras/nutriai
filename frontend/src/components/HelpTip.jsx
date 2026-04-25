// src/components/HelpTip.jsx
import { useState, useRef, useEffect } from 'react';

export default function HelpTip({ text }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        aria-label="More information"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '16px', height: '16px',
          borderRadius: '50%',
          border: '1px solid var(--text3)',
          color: 'var(--text3)',
          fontSize: '9px',
          fontWeight: '700',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: 'transparent',
          flexShrink: 0,
          transition: 'border-color 0.15s, color 0.15s',
          lineHeight: 1,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--blue)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--text3)'; e.currentTarget.style.color = 'var(--text3)'; }}
      >
        ?
      </button>
      {open && (
        <span style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg4)',
          border: '1px solid var(--border2)',
          borderRadius: '8px',
          padding: '9px 11px',
          fontSize: '12px',
          color: 'var(--text2)',
          width: '220px',
          lineHeight: '1.5',
          zIndex: 50,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
          whiteSpace: 'normal',
          textAlign: 'left',
          fontFamily: 'var(--font-body)',
          fontWeight: 400,
        }}>
          {text}
        </span>
      )}
    </span>
  );
}
