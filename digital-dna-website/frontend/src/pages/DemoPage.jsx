import React, { useEffect } from 'react';
import DemoMode from '../components/DemoMode';

export default function DemoPage() {
  useEffect(() => { document.title = 'Live Demo — Digital DNA'; }, []);

  return (
    <div style={{ paddingTop: 68 }}>
      <div style={{ padding: '48px 32px 24px', textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
        <p style={{ color: '#38bdf8', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>Live Demo</p>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#f8fafc', letterSpacing: '-0.04em', marginBottom: 14 }}>
          See Digital DNA in Action
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.7 }}>
          Simulate a human session or a bot session below. Watch the real-time authenticity score change as the behavioural pattern unfolds.
        </p>
      </div>
      <DemoMode />
    </div>
  );
}
