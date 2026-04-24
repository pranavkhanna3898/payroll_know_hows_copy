import { useEffect, useRef, useState } from 'react';

let mermaidPromise = null;

export default function Mermaid({ chart }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!chart) return;
    
    let isMounted = true;

    if (!mermaidPromise) {
      mermaidPromise = import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs')
        .then(m => {
          m.default.initialize({
            startOnLoad: false,
            theme: 'default',
            flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
            sequence: { useMaxWidth: true, showSequenceNumbers: true }
          });
          return m.default;
        }).catch(err => {
          console.error("Failed to load Mermaid:", err);
          return null;
        });
    }

    mermaidPromise.then(mermaid => {
      if (!isMounted) return;
      if (!mermaid) {
        setError(true);
        return;
      }
      
      if (containerRef.current) {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        mermaid.render(id, chart)
          .then(({ svg }) => {
            if (containerRef.current && isMounted) {
              containerRef.current.innerHTML = svg;
              setError(false);
            }
          })
          .catch(err => {
            console.error("Mermaid render error:", err);
            if (isMounted) setError(true);
          });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return <div style={{ color: '#ef4444', padding: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>Failed to render diagram.</div>;
  }

  return (
    <div 
      className="mermaid-container" 
      ref={containerRef} 
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        margin: '20px 0', 
        padding: '20px', 
        background: '#fff', 
        border: '1px solid #e2e8f0', 
        borderRadius: '8px',
        overflowX: 'auto',
        minHeight: '100px'
      }} 
    />
  );
}
