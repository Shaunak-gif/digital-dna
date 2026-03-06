import React from 'react';
import { Link } from 'react-router-dom';

const COL = {
  fontFamily: "'Syne', sans-serif",
  fontWeight: 700,
  fontSize: '0.75rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#475569',
  marginBottom: 16,
};

const ITEM = {
  display: 'block',
  color: '#64748b',
  textDecoration: 'none',
  fontSize: '0.875rem',
  marginBottom: 10,
  transition: 'color 0.2s',
};

export default function Footer() {
  return (
    <footer style={{
      background: '#020509',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      padding: '64px 32px 32px',
      marginTop: 0,
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 56 }}>

          {/* Brand column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: '1.4rem' }}>🧬</span>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#f8fafc', letterSpacing: '-0.03em' }}>
                Digital<span style={{ color: '#38bdf8' }}>DNA</span>
              </span>
            </div>
            <p style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.7, maxWidth: 280 }}>
              Behavioural biometrics that detect AI-assisted fraud by analysing how forms are filled — not just what is written.
            </p>
            <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
              {['GitHub', 'LinkedIn', 'Docs'].map(label => (
                <a key={label} href="#" style={{ ...ITEM, marginBottom: 0, padding: '6px 14px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, fontSize: '0.8rem' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                >{label}</a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <p style={COL}>Product</p>
            {[
              ['/', 'Home'],
              ['/how-it-works', 'How It Works'],
              ['/demo', 'Live Demo'],
              ['/kyc', 'KYC Form'],
              ['/dashboard', 'Dashboard'],
            ].map(([to, label]) => (
              <Link key={to} to={to} style={ITEM}
                onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
              >{label}</Link>
            ))}
          </div>

          {/* Technology */}
          <div>
            <p style={COL}>Technology</p>
            {['Isolation Forest', 'LSTM Classifier', 'Keystroke Dynamics', 'Mouse Biometrics', 'Real-time Scoring'].map(l => (
              <span key={l} style={{ ...ITEM, cursor: 'default' }}>{l}</span>
            ))}
          </div>

          {/* Use Cases */}
          <div>
            <p style={COL}>Use Cases</p>
            {['KYC Verification', 'Loan Applications', 'Account Opening', 'Fund Transfers', 'Insurance Claims'].map(l => (
              <span key={l} style={{ ...ITEM, cursor: 'default' }}>{l}</span>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ color: '#334155', fontSize: '0.8rem' }}>
            © {new Date().getFullYear()} Digital DNA. Built for fraud prevention research.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy Policy', 'Terms of Service', 'API Docs'].map(l => (
              <a key={l} href="#" style={{ color: '#334155', fontSize: '0.8rem', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#64748b'}
                onMouseLeave={e => e.currentTarget.style.color = '#334155'}
              >{l}</a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          footer > div > div:first-child { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
