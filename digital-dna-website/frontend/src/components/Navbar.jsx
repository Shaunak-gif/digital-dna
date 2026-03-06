import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/demo',         label: 'Live Demo' },
  { to: '/kyc',          label: 'Try KYC' },
  { to: '/dashboard',    label: 'Dashboard' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const navStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
    height: 68,
    background: scrolled ? 'rgba(4,8,15,0.92)' : 'transparent',
    backdropFilter: scrolled ? 'blur(16px)' : 'none',
    borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
    transition: 'all 0.35s ease',
  };

  return (
    <>
      <header style={navStyle}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 32px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>🧬</span>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.03em', color: '#f8fafc' }}>
              Digital<span style={{ color: '#38bdf8' }}>DNA</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} style={({ isActive }) => ({
                textDecoration: 'none',
                padding: '7px 16px',
                borderRadius: 6,
                fontSize: '0.875rem',
                fontWeight: 500,
                letterSpacing: '0.01em',
                color: isActive ? '#f8fafc' : '#94a3b8',
                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                transition: 'all 0.2s',
                border: '1px solid transparent',
              })}
              onMouseEnter={e => { e.currentTarget.style.color = '#f8fafc'; }}
              onMouseLeave={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.color = '#94a3b8'; }}
              >
                {label}
              </NavLink>
            ))}

            {/* CTA button */}
            <Link to="/demo" style={{
              textDecoration: 'none',
              marginLeft: 8,
              padding: '8px 20px',
              borderRadius: 6,
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#fff',
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              boxShadow: '0 0 20px rgba(99,102,241,0.3)',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}>
              Try Free →
            </Link>
          </nav>

          {/* Hamburger */}
          <button onClick={() => setOpen(o => !o)} aria-label="Toggle menu" style={{
            display: 'none', background: 'none', border: '1px solid rgba(255,255,255,0.12)',
            color: '#94a3b8', width: 38, height: 38, borderRadius: 6, fontSize: '1.1rem',
            cursor: 'pointer', alignItems: 'center', justifyContent: 'center',
          }} id="hamburger">
            {open ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Mobile dropdown */}
      {open && (
        <div style={{
          position: 'fixed', top: 68, left: 0, right: 0, zIndex: 9998,
          background: 'rgba(4,8,15,0.98)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '8px 0 16px',
        }}>
          {[{ to: '/', label: 'Home' }, ...LINKS].map(({ to, label }) => (
            <Link key={to} to={to} style={{
              display: 'block', padding: '13px 32px',
              textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500,
              color: pathname === to ? '#38bdf8' : '#94a3b8',
              borderLeft: pathname === to ? '2px solid #38bdf8' : '2px solid transparent',
            }}>
              {label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 720px) {
          nav { display: none !important; }
          #hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
}
