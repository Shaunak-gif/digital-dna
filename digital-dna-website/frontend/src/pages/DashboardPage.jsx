import React, { useEffect } from 'react';
import Dashboard from '../components/Dashboard';

export default function DashboardPage() {
  useEffect(() => { document.title = 'Analyst Dashboard — Digital DNA'; }, []);

  return (
    <div style={{ paddingTop: 68 }}>
      <div style={{ padding: '48px 32px 16px', maxWidth: 1240, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ color: '#38bdf8', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Fraud Intelligence</p>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', color: '#f8fafc', letterSpacing: '-0.04em' }}>
            Analyst Dashboard
          </h1>
          <p style={{ color: '#475569', marginTop: 8, fontSize: '0.9rem' }}>
            Real-time session monitoring, risk trends, model benchmarks, drift detection and adversarial robustness testing.
          </p>
        </div>
        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: '6px 16px', fontSize: '0.8rem', color: '#22c55e', fontWeight: 600 }}>
          ● LIVE
        </div>
      </div>
      <Dashboard />
    </div>
  );
}
