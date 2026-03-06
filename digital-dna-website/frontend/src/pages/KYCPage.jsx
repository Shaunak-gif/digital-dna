import React, { useEffect } from 'react';
import KYCForm from '../components/KYCForm';

export default function KYCPage() {
  useEffect(() => { document.title = 'KYC Demo Form — Digital DNA'; }, []);

  return (
    <div style={{ paddingTop: 68, background: '#04080f', minHeight: '100vh' }}>
      <div style={{ padding: '56px 32px 24px', textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
        <p style={{ color: '#38bdf8', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>Live KYC Form</p>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#f8fafc', letterSpacing: '-0.04em', marginBottom: 14 }}>
          Fill This Form — We'll Score Your Behaviour
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
          This is a demonstration KYC form with behavioural monitoring active. Fill it naturally, then submit to see your Human Authenticity Score. No data is stored or shared.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          {['🔒 No data stored', '🧬 Behaviour monitored', '⚡ Instant score'].map(t => (
            <span key={t} style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 20, padding: '4px 14px', fontSize: '0.8rem', color: '#38bdf8' }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 32px 80px' }}>
        <KYCForm onSubmit={(data) => {
          if (data.score?.risk_level === 'HIGH') {
            console.warn('High risk session detected:', data.score);
          }
        }} />
      </div>
    </div>
  );
}
