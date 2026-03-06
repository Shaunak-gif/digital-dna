import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const PT = { paddingTop: 80 }; // offset for fixed navbar

const FEATURES = [
  { icon: '⌨️', title: 'Keystroke Dynamics', desc: 'Analyses inter-key intervals, typing rhythm, hesitation patterns and backspace frequency to fingerprint human behaviour.' },
  { icon: '🖱️', title: 'Mouse Biometrics', desc: 'Tracks cursor speed variance, movement naturalness, and click patterns that bots and AI tools cannot faithfully replicate.' },
  { icon: '📋', title: 'Paste Detection', desc: 'Flags suspicious copy-paste volume — a key signal that content was generated externally rather than genuinely authored.' },
  { icon: '⚡', title: 'Real-time Scoring', desc: 'Every session scored live as users type, with a 0–100% Human Authenticity Score and LOW / MEDIUM / HIGH risk label.' },
  { icon: '🤖', title: 'Adversarial Robust', desc: 'Tested against slow-bot, typo-injector, and hybrid evasion strategies. 95.5% detection rate, -66% false positives vs baseline.' },
  { icon: '📊', title: 'Analyst Dashboard', desc: 'Live session logs, hourly risk trends, score distributions, and model drift monitoring for your fraud operations team.' },
];

const STATS = [
  { value: '95.5%', label: 'Detection Rate' },
  { value: '<80ms', label: 'Scoring Latency' },
  { value: '−66%', label: 'False Positives vs Baseline' },
  { value: '20+',  label: 'Behavioural Features' },
];

export default function HomePage() {
  const heroRef = useRef(null);

  useEffect(() => {
    document.title = 'Digital DNA — Human Authenticity Engine';
  }, []);

  return (
    <div style={{ ...PT }}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section ref={heroRef} style={{
        minHeight: '92vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '80px 32px 60px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />
        {/* Glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 400, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(56,189,248,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)', zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 820 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
            borderRadius: 20, padding: '6px 16px', marginBottom: 32,
            fontSize: '0.8rem', fontWeight: 500, color: '#38bdf8',
            letterSpacing: '0.05em',
          }}>
            <span style={{ width: 6, height: 6, background: '#22c55e', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }} />
            BEHAVIOURAL BIOMETRICS · FRAUD DETECTION · FINTECH SECURITY
          </div>

          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            color: '#f8fafc',
            marginBottom: 24,
          }}>
            Detect AI Fraud by How<br />
            <span style={{ color: '#38bdf8' }}>Forms Are Filled</span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: '#64748b',
            lineHeight: 1.7,
            maxWidth: 580,
            margin: '0 auto 40px',
            fontWeight: 300,
          }}>
            Digital DNA scores every KYC session in real time using keystroke dynamics,
            mouse biometrics, and paste behaviour — catching AI-generated fraud that
            content-only scanners miss.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/demo" style={{
              textDecoration: 'none',
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              color: '#fff', fontWeight: 700, fontSize: '0.95rem',
              borderRadius: 8, boxShadow: '0 0 32px rgba(99,102,241,0.35)',
              transition: 'all 0.2s', letterSpacing: '0.01em',
            }}>
              See Live Demo →
            </Link>
            <Link to="/how-it-works" style={{
              textDecoration: 'none',
              padding: '14px 32px',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#94a3b8', fontWeight: 500, fontSize: '0.95rem',
              borderRadius: 8, transition: 'all 0.2s',
            }}>
              How It Works
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', color: '#1e3a5f', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          scroll ↓
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '40px 32px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {STATS.map(({ value, label }, i) => (
            <div key={label} style={{
              textAlign: 'center',
              padding: '20px 24px',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2.2rem', color: '#38bdf8', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
              <div style={{ color: '#475569', fontSize: '0.8rem', marginTop: 8, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEM STATEMENT ────────────────────────────────── */}
      <section style={{ padding: '96px 32px', maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <p style={{ color: '#38bdf8', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 16 }}>The Problem</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', lineHeight: 1.15, color: '#f1f5f9', letterSpacing: '-0.03em', marginBottom: 24 }}>
              AI tools can fill your forms perfectly — that's the threat
            </h2>
            <p style={{ color: '#64748b', lineHeight: 1.8, marginBottom: 16, fontSize: '0.95rem' }}>
              Traditional fraud detection checks <em>what</em> was submitted — ID numbers, addresses, income values. But GPT-4, Claude, and other AI tools can now produce flawless synthetic identities that pass all content checks.
            </p>
            <p style={{ color: '#64748b', lineHeight: 1.8, fontSize: '0.95rem' }}>
              Digital DNA watches <em>how</em> the form is filled. Bots type too fast, too uniformly, and with zero mistakes. Real humans hesitate, correct typos, and pause to think.
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 32 }}>
            {[
              { label: 'Content-Only Scanner', value: 61, color: '#ef4444' },
              { label: 'Logistic Regression', value: 75, color: '#f59e0b' },
              { label: 'Isolation Forest', value: 89, color: '#84cc16' },
              { label: 'Digital DNA (Full)', value: 95, color: '#38bdf8' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{label}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color }}>{value}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 3, transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
            <p style={{ fontSize: '0.75rem', color: '#334155', marginTop: 4, textAlign: 'right' }}>Fraud detection rate comparison</p>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ────────────────────────────────────── */}
      <section style={{ padding: '80px 32px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ color: '#38bdf8', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>Features</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', color: '#f1f5f9', letterSpacing: '-0.03em' }}>
              Every signal, captured and scored
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} style={{
                padding: 28, borderRadius: 10,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(56,189,248,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ fontSize: '1.6rem', marginBottom: 14 }}>{icon}</div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#e2e8f0', marginBottom: 10, letterSpacing: '-0.02em' }}>{title}</h3>
                <p style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS PREVIEW ─────────────────────────────── */}
      <section style={{ padding: '96px 32px', maxWidth: 1240, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ color: '#38bdf8', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>How It Works</p>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', color: '#f1f5f9', letterSpacing: '-0.03em', marginBottom: 56 }}>
          From keypress to risk score in real time
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, position: 'relative' }}>
          {/* Connector line */}
          <div style={{ position: 'absolute', top: 32, left: '12%', right: '12%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.3), transparent)' }} />

          {[
            { step: '01', title: 'Capture', desc: 'JS SDK silently captures keystrokes, mouse, scroll, and paste events from your form.' },
            { step: '02', title: 'Extract', desc: 'Feature extractor computes 20+ behavioural metrics: IKI variance, backspace rate, paste dominance.' },
            { step: '03', title: 'Score', desc: 'Isolation Forest + heuristic engine produces a 0–100% Human Authenticity Score.' },
            { step: '04', title: 'Decide', desc: 'LOW / MEDIUM / HIGH risk label surfaced to your fraud team or automated workflow.' },
          ].map(({ step, title, desc }) => (
            <div key={step} style={{ padding: '0 20px', textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
                background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: '1rem', color: '#38bdf8',
              }}>
                {step}
              </div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#e2e8f0', marginBottom: 10 }}>{title}</h3>
              <p style={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48 }}>
          <Link to="/how-it-works" style={{
            textDecoration: 'none', color: '#38bdf8', fontSize: '0.9rem', fontWeight: 500,
            borderBottom: '1px solid rgba(56,189,248,0.3)', paddingBottom: 2,
          }}>
            Full technical breakdown →
          </Link>
        </div>
      </section>

      {/* ── CTA SECTION ──────────────────────────────────────── */}
      <section style={{
        padding: '96px 32px', textAlign: 'center',
        background: 'linear-gradient(180deg, transparent, rgba(56,189,248,0.04) 50%, transparent)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#f8fafc', letterSpacing: '-0.04em', marginBottom: 20 }}>
          Ready to see it in action?
        </h2>
        <p style={{ color: '#475569', fontSize: '1rem', marginBottom: 40, maxWidth: 440, margin: '0 auto 40px' }}>
          Fill in the live KYC demo form — then see your real behavioural score. No login needed.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/kyc" style={{
            textDecoration: 'none', padding: '15px 36px',
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            color: '#fff', fontWeight: 700, fontSize: '1rem', borderRadius: 8,
            boxShadow: '0 0 40px rgba(99,102,241,0.3)',
          }}>
            Try KYC Form
          </Link>
          <Link to="/dashboard" style={{
            textDecoration: 'none', padding: '15px 36px',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#94a3b8', fontWeight: 500, fontSize: '1rem', borderRadius: 8,
          }}>
            View Dashboard
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          section > div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          section > div > div[style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr 1fr !important; }
          section > div[style*="grid-template-columns: repeat(4, 1fr)"] { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          section > div[style*="grid-template-columns: repeat(4"] { grid-template-columns: 1fr 1fr !important; }
          div[style*="grid-template-columns: repeat(4, 1fr)"] { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
