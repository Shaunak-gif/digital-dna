import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const PT = { paddingTop: 120 };

const SIGNALS = [
  { icon: '⌨️', name: 'Inter-Key Interval (IKI)', human: '150–600ms, high variance', bot: '<80ms, robotic uniformity', weight: 'HIGH' },
  { icon: '🔄', name: 'IKI Variance', human: 'σ² > 5,000 — natural rhythm', bot: 'σ² < 500 — machine-like', weight: 'HIGH' },
  { icon: '⌫', name: 'Backspace Rate', human: '5–20% of keystrokes', bot: '~0% — no typos', weight: 'HIGH' },
  { icon: '📋', name: 'Paste Events', human: '0–1 per session', bot: '3–6+ large pastes', weight: 'HIGH' },
  { icon: '✏️', name: 'Edit Bursts', human: 'Many correction sequences', bot: 'Near zero', weight: 'MEDIUM' },
  { icon: '🖱️', name: 'Mouse Speed Variance', human: 'High — organic paths', bot: 'Uniform — linear paths', weight: 'MEDIUM' },
  { icon: '⏱️', name: 'Session Duration', human: '1–5 minutes', bot: '<30 seconds', weight: 'MEDIUM' },
  { icon: '🌊', name: 'Typing Burst Ratio', human: '<10% ultra-fast keys', bot: '>50% burst typing', weight: 'MEDIUM' },
];

export default function HowItWorksPage() {
  useEffect(() => { document.title = 'How It Works — Digital DNA'; }, []);

  return (
    <div style={PT}>

      {/* Header */}
      <section style={{ padding: '80px 32px 60px', textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
        <p style={{ color: '#38bdf8', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 16 }}>Technical Overview</p>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3.2rem)', letterSpacing: '-0.04em', color: '#f8fafc', lineHeight: 1.1, marginBottom: 20 }}>
          How Digital DNA Works
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.8, fontWeight: 300 }}>
          A four-stage pipeline that transforms raw keystrokes into a fraud risk verdict — all within the time it takes the user to click Submit.
        </p>
      </section>

      {/* Pipeline stages */}
      <section style={{ padding: '0 32px 80px', maxWidth: 1000, margin: '0 auto' }}>
        {[
          {
            n: '01', title: 'Capture', color: '#0ea5e9',
            desc: 'A lightweight JavaScript SDK (<4KB) is embedded in your form page. It silently attaches event listeners that record:',
            items: ['Keystroke timestamps (keydown/keyup)', 'Mouse movement paths, speed, clicks', 'Scroll events and field focus/blur', 'Copy, cut, and paste events with byte length'],
            code: `sdk.start('kyc-form');  // attach listeners
// SDK auto-flushes every 5s and on form submit`
          },
          {
            n: '02', title: 'Feature Extraction', color: '#8b5cf6',
            desc: 'The raw event stream is processed by the Python backend into 20+ behavioural features:',
            items: ['IKI mean, variance, std deviation, skewness', 'Backspace rate, burst typing ratio', 'Paste count, paste volume, paste dominance', 'Edit bursts, mouse speed variance, session duration'],
            code: `features = extract_features(events, session_ms)
# → {avg_iki: 312, iki_variance: 18400,
#    backspace_rate: 0.11, paste_count: 0, ...}`
          },
          {
            n: '03', title: 'ML Scoring', color: '#10b981',
            desc: 'Features are passed to a trained Isolation Forest anomaly detector, with a heuristic fallback when no model file is present:',
            items: ['Isolation Forest trained on 2,000 synthetic human sessions', 'Anomaly score converted to 0–1 probability', 'Heuristic rules as fallback (8 signal checks)', 'LSTM sequence model available for IKI time-series'],
            code: `score = scorer.score(features)
# → {authenticity_score: 0.87,
#    risk_level: "LOW",
#    reason: "Natural typing rhythm..."}`
          },
          {
            n: '04', title: 'Risk Decision', color: '#f59e0b',
            desc: 'The score is stored in PostgreSQL and returned to your system as a structured risk verdict:',
            items: ['LOW  → authenticity ≥ 60% — pass through', 'MEDIUM → 30–60% — flag for manual review', 'HIGH → < 30% — block or escalate', 'Full feature breakdown available for audit'],
            code: `GET /api/behavioral/score/{session_id}
# → risk_level, authenticity_score,
#    anomaly_probability, features{}`
          },
        ].map(({ n, title, color, desc, items, code }) => (
          <div key={n} style={{
            display: 'grid', gridTemplateColumns: '80px 1fr',
            gap: 32, marginBottom: 56, alignItems: 'start',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: `${color}15`, border: `1px solid ${color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
              fontSize: '1.1rem', color, flexShrink: 0,
            }}>{n}</div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '28px 32px' }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.3rem', color: '#f1f5f9', marginBottom: 12, letterSpacing: '-0.02em' }}>
                <span style={{ color }}>Stage {n}</span> — {title}
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 16 }}>{desc}</p>
              <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
                {items.map(i => <li key={i} style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 2 }}>{i}</li>)}
              </ul>
              <pre style={{
                background: '#020509', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8, padding: '14px 18px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.8rem', color: '#64748b', overflowX: 'auto', lineHeight: 1.6,
              }}>{code}</pre>
            </div>
          </div>
        ))}
      </section>

      {/* Signal table */}
      <section style={{ padding: '0 32px 80px', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.6rem', color: '#f1f5f9', marginBottom: 32, letterSpacing: '-0.03em' }}>
          Behavioural Signals Reference
        </h2>
        <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Signal', 'Human Pattern', 'Bot / AI Pattern', 'Weight'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: '#475569', fontWeight: 600, fontFamily: "'Syne', sans-serif", fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SIGNALS.map(({ icon, name, human, bot, weight }, i) => (
                <tr key={name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '14px 20px', color: '#e2e8f0' }}><span style={{ marginRight: 8 }}>{icon}</span>{name}</td>
                  <td style={{ padding: '14px 20px', color: '#22c55e', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>{human}</td>
                  <td style={{ padding: '14px 20px', color: '#ef4444', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>{bot}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      background: weight === 'HIGH' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                      color: weight === 'HIGH' ? '#ef4444' : '#f59e0b',
                      borderRadius: 4, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700,
                    }}>{weight}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '60px 32px 100px', textAlign: 'center' }}>
        <p style={{ color: '#475569', marginBottom: 24, fontSize: '0.95rem' }}>Ready to test it on your own typing?</p>
        <Link to="/demo" style={{
          textDecoration: 'none', padding: '14px 32px',
          background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
          color: '#fff', fontWeight: 700, fontSize: '0.95rem', borderRadius: 8,
          boxShadow: '0 0 28px rgba(99,102,241,0.3)',
        }}>
          Try the Live Demo →
        </Link>
      </section>
    </div>
  );
}
