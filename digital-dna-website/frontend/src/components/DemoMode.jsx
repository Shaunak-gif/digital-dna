import React, { useState, useEffect, useRef, useCallback } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/behavioral';

// ─── Typing simulator helpers ───────────────────────────────────────────────

function generateHumanEvents(text, startOffset = 0) {
  const events = [];
  let t = startOffset;
  let lastT = null;

  for (let i = 0; i < text.length; i++) {
    // Human IKI: normal distribution ~280ms, high variance
    const baseIKI = 200 + Math.random() * 300;
    // Occasional thinking pause
    const pause = Math.random() < 0.08 ? Math.random() * 2000 : 0;
    t += baseIKI + pause;
    const iki = lastT ? t - lastT : null;
    events.push({ t: Math.round(t), type: 'keydown', key: 'CHAR', code: 'KeyA', iki, target: 'INPUT', fieldName: 'field' });
    lastT = t;

    // Occasional typo + backspace
    if (Math.random() < 0.08 && i < text.length - 1) {
      t += 120 + Math.random() * 100;
      events.push({ t: Math.round(t), type: 'keydown', key: 'CHAR', code: 'KeyZ', iki: t - lastT, target: 'INPUT', fieldName: 'field' });
      lastT = t;
      t += 200 + Math.random() * 150;
      events.push({ t: Math.round(t), type: 'keydown', key: 'Backspace', code: 'Backspace', iki: t - lastT, target: 'INPUT', fieldName: 'field' });
      lastT = t;
      t += 150 + Math.random() * 100;
      events.push({ t: Math.round(t), type: 'keydown', key: 'Backspace', code: 'Backspace', iki: t - lastT, target: 'INPUT', fieldName: 'field' });
      lastT = t;
    }
  }

  // Mouse movements scattered throughout
  for (let m = 0; m < 15; m++) {
    events.push({
      t: Math.round(startOffset + Math.random() * (t - startOffset)),
      type: 'mouse_path_segment',
      path: Array.from({ length: 10 }, (_, j) => ({
        t: m * 1000 + j * 50,
        x: 200 + Math.random() * 800,
        y: 200 + Math.random() * 500,
        speed: 50 + Math.random() * 200
      }))
    });
  }

  // Scroll events
  for (let s = 0; s < 6; s++) {
    events.push({ t: Math.round(startOffset + Math.random() * t), type: 'scroll', scrollY: s * 120, delta: 80 });
  }

  return { events, endT: t };
}

function generateBotEvents(text) {
  const events = [];
  // Bot pastes everything at once
  events.push({ t: 800, type: 'paste', length: text.length, wordCount: text.split(' ').length, fieldName: 'field' });
  // A few uniform keystrokes
  for (let i = 0; i < 12; i++) {
    events.push({ t: 1000 + i * 38, type: 'keydown', key: 'CHAR', code: 'KeyA', iki: 38, target: 'INPUT', fieldName: 'field' });
  }
  // Second paste
  events.push({ t: 2200, type: 'paste', length: 180, wordCount: 30, fieldName: 'field' });
  // Almost no mouse movement
  events.push({
    t: 500, type: 'mouse_path_segment',
    path: Array.from({ length: 5 }, (_, j) => ({ t: j * 50, x: 400, y: 300 + j * 2, speed: 380 + j }))
  });
  return events;
}

// ─── Score card component ────────────────────────────────────────────────────

const ScoreCard = ({ result, type, visible }) => {
  if (!visible || !result) return null;
  const isHuman = type === 'human';
  const score = (result.authenticity_score * 100).toFixed(1);

  return (
    <div style={{
      animation: 'slideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      background: isHuman
        ? 'linear-gradient(135deg, #0d2b1a 0%, #0a3d20 100%)'
        : 'linear-gradient(135deg, #2b0d0d 0%, #3d1010 100%)',
      border: `1px solid ${isHuman ? '#22c55e40' : '#ef444440'}`,
      borderRadius: 16,
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow effect */}
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 120, height: 120,
        borderRadius: '50%',
        background: isHuman ? '#22c55e20' : '#ef444420',
        filter: 'blur(30px)',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: '0.7rem', letterSpacing: 3, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>
            {isHuman ? '🧑 Human Session' : '🤖 Bot / AI Session'}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontFamily: 'monospace' }}>
            {result.session_id?.slice(0, 12)}...
          </div>
        </div>
        <div style={{
          background: isHuman ? '#22c55e' : '#ef4444',
          color: 'white', borderRadius: 8, padding: '6px 14px',
          fontSize: '0.75rem', fontWeight: 800, letterSpacing: 1
        }}>
          {result.risk_level}
        </div>
      </div>

      {/* Big score */}
      <div style={{
        fontSize: '4rem', fontWeight: 900, lineHeight: 1,
        color: isHuman ? '#4ade80' : '#f87171',
        marginBottom: 4, fontFamily: "'Courier New', monospace"
      }}>
        {score}<span style={{ fontSize: '1.5rem', opacity: 0.7 }}>%</span>
      </div>
      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 20 }}>
        Human Authenticity Score
      </div>

      {/* Feature grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          ['Avg Keystroke Gap', result.features?.avg_iki ? `${result.features.avg_iki.toFixed(0)}ms` : 'N/A'],
          ['IKI Variance', result.features?.iki_variance ? result.features.iki_variance.toFixed(0) : 'N/A'],
          ['Backspace Rate', result.features?.backspace_rate != null ? `${(result.features.backspace_rate * 100).toFixed(1)}%` : 'N/A'],
          ['Paste Events', result.features?.paste_count ?? 0],
          ['Typing Natural.', result.features?.typing_naturalness != null ? `${(result.features.typing_naturalness * 100).toFixed(0)}%` : 'N/A'],
          ['Mouse Natural.', result.features?.mouse_naturalness != null ? `${(result.features.mouse_naturalness * 100).toFixed(0)}%` : 'N/A'],
        ].map(([label, value]) => (
          <div key={label} style={{
            background: '#ffffff08', borderRadius: 8, padding: '8px 12px',
            border: '1px solid #ffffff10'
          }}>
            <div style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 14, padding: '10px 14px', background: '#ffffff08',
        borderRadius: 8, fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic',
        borderLeft: `3px solid ${isHuman ? '#22c55e' : '#ef4444'}`
      }}>
        {result.reason}
      </div>
    </div>
  );
};

// ─── Step indicator ───────────────────────────────────────────────────────────

const Step = ({ num, label, status }) => {
  const colors = { done: '#22c55e', active: '#3b82f6', pending: '#334155' };
  const color = colors[status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.75rem', fontWeight: 800, color: 'white',
        transition: 'all 0.3s', flexShrink: 0,
        boxShadow: status === 'active' ? `0 0 12px ${color}` : 'none'
      }}>
        {status === 'done' ? '✓' : num}
      </div>
      <span style={{
        fontSize: '0.82rem', color: status === 'pending' ? '#475569' : '#e2e8f0',
        fontWeight: status === 'active' ? 600 : 400, transition: 'all 0.3s'
      }}>{label}</span>
    </div>
  );
};

// ─── Animated typing display ──────────────────────────────────────────────────

const TypingDisplay = ({ text, speed = 60, active }) => {
  const [displayed, setDisplayed] = useState('');
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!active) { setDisplayed(''); setIdx(0); return; }
    if (idx >= text.length) return;
    const t = setTimeout(() => {
      setDisplayed(prev => prev + text[idx]);
      setIdx(i => i + 1);
    }, speed + Math.random() * 80);
    return () => clearTimeout(t);
  }, [idx, text, speed, active]);

  return (
    <span style={{ fontFamily: 'monospace', color: '#4ade80' }}>
      {displayed}<span style={{ animation: 'blink 1s infinite', opacity: idx < text.length ? 1 : 0 }}>|</span>
    </span>
  );
};

// ─── Main Demo Component ──────────────────────────────────────────────────────

const DemoMode = () => {
  const [phase, setPhase] = useState('idle'); // idle | running | done
  const [step, setStep] = useState(0);
  const [log, setLog] = useState([]);
  const [humanResult, setHumanResult] = useState(null);
  const [botResult, setBotResult] = useState(null);
  const [humanVisible, setHumanVisible] = useState(false);
  const [botVisible, setBotVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeField, setActiveField] = useState(null);
  const [fieldTexts, setFieldTexts] = useState({});
  const [botFieldTexts, setBotFieldTexts] = useState({});
  const logRef = useRef(null);

  const addLog = useCallback((msg, type = 'info') => {
    setLog(prev => [...prev, { msg, type, t: Date.now() }]);
    setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 50);
  }, []);

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const runDemo = useCallback(async () => {
    setPhase('running');
    setStep(0);
    setLog([]);
    setHumanResult(null);
    setBotResult(null);
    setHumanVisible(false);
    setBotVisible(false);
    setFieldTexts({});
    setBotFieldTexts({});
    setProgress(0);

    const humanSessionId = `demo-human-${Date.now()}`;
    const botSessionId = `demo-bot-${Date.now()}`;

    const humanFields = {
      fullName: 'Sarah Jane Mitchell',
      dob: '15 March 1990',
      email: 'sarah.mitchell@gmail.com',
      phone: '+44 7912 345678',
      address: '47 Oakwood Avenue, Manchester, M14 5BQ',
      govId: 'P12345678A',
      income: 'Senior Software Engineer at TechCorp UK Ltd. Primary income from monthly salary of £5,800 net. Additional freelance consulting income of approximately £1,200 per month.'
    };

    // ── PHASE 1: Human Session ──────────────────────────────────────────────
    setStep(1);
    addLog('▶  Starting human behavioral simulation...', 'system');
    await sleep(500);

    addLog('⌨️  Simulating natural typing with IKI variance, pauses, typos...', 'info');

    let allHumanEvents = [];
    let offset = 0;
    const fieldEntries = Object.entries(humanFields);

    for (let i = 0; i < fieldEntries.length; i++) {
      const [field, text] = fieldEntries[i];
      setActiveField(field);
      addLog(`  → Typing field: ${field}`, 'detail');
      setProgress(Math.round((i / fieldEntries.length) * 35));

      // Animate field text
      for (let c = 0; c <= text.length; c++) {
        setFieldTexts(prev => ({ ...prev, [field]: text.slice(0, c) }));
        await sleep(30 + Math.random() * 50);
      }

      const { events, endT } = generateHumanEvents(text, offset);
      allHumanEvents = [...allHumanEvents, ...events];
      offset = endT + 2000;
      await sleep(300);
    }

    setActiveField(null);
    setProgress(40);
    addLog(`✅  Generated ${allHumanEvents.length} behavioral events over ${(offset / 1000).toFixed(0)}s`, 'success');
    await sleep(400);

    // Send events
    setStep(2);
    addLog('📡  Sending events to backend API...', 'info');

    try {
      const resp = await fetch(`${API}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: humanSessionId,
          form_id: 'kyc-form-demo',
          is_final: true,
          session_duration: offset,
          events: allHumanEvents
        })
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      addLog('✅  Events ingested successfully', 'success');
    } catch (e) {
      addLog(`⚠️  Backend offline — using mock score for demo (${e.message})`, 'warn');
    }

    setProgress(55);
    await sleep(600);

    // Get score
    setStep(3);
    addLog('🧠  Running ML feature extraction + Isolation Forest scoring...', 'info');
    await sleep(800);

    let humanScore;
    try {
      const scoreResp = await fetch(`${API}/score/${humanSessionId}`);
      if (scoreResp.ok) {
        humanScore = await scoreResp.json();
        addLog(`✅  Score computed: ${(humanScore.authenticity_score * 100).toFixed(1)}% — ${humanScore.risk_level}`, 'success');
      } else throw new Error('Not found');
    } catch {
      // Mock score for offline demo
      humanScore = {
        session_id: humanSessionId,
        authenticity_score: 0.78 + Math.random() * 0.15,
        anomaly_probability: 0.08 + Math.random() * 0.14,
        risk_level: 'LOW',
        reason: 'Session exhibits natural human behavioral patterns. High IKI variance, natural correction behavior, and organic mouse movement detected.',
        features: {
          avg_iki: 285 + Math.random() * 80,
          iki_variance: 18000 + Math.random() * 8000,
          backspace_rate: 0.08 + Math.random() * 0.06,
          paste_count: 0,
          typing_naturalness: 0.72 + Math.random() * 0.2,
          mouse_naturalness: 0.65 + Math.random() * 0.2,
        }
      };
      addLog(`✅  Score computed (mock): ${(humanScore.authenticity_score * 100).toFixed(1)}% — ${humanScore.risk_level}`, 'success');
    }

    setHumanResult(humanScore);
    setProgress(60);
    await sleep(300);
    setHumanVisible(true);
    await sleep(1000);

    // ── PHASE 2: Bot Session ──────────────────────────────────────────────
    setStep(4);
    addLog('', 'spacer');
    addLog('▶  Starting AI/bot behavioral simulation...', 'system');
    await sleep(500);

    addLog('🤖  Simulating bot: bulk paste, uniform IKI, no corrections...', 'info');
    setProgress(65);

    const botText = 'Alex Thompson, 22 Jan 1988, alex.thompson@protonmail.com, +447700900123, 12 City Road London EC1V 2NX, D87654321, Crypto trading and investment portfolio management generating approximately £8,000 monthly passive income';

    // Bot pastes everything instantly
    for (const [field, text] of Object.entries(humanFields)) {
      setBotFieldTexts(prev => ({ ...prev, [field]: text }));
      await sleep(80);
    }

    const botEvents = generateBotEvents(botText);
    addLog(`✅  Generated ${botEvents.length} bot events (8.2s session)`, 'success');
    setProgress(72);
    await sleep(400);

    setStep(5);
    addLog('📡  Sending bot session to backend API...', 'info');

    try {
      const resp = await fetch(`${API}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: botSessionId,
          form_id: 'kyc-form-demo',
          is_final: true,
          session_duration: 8200,
          events: botEvents
        })
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      addLog('✅  Events ingested successfully', 'success');
    } catch (e) {
      addLog(`⚠️  Backend offline — using mock score for demo`, 'warn');
    }

    setProgress(82);
    await sleep(600);

    setStep(6);
    addLog('🧠  Running ML scoring on bot session...', 'info');
    await sleep(800);

    let botScore;
    try {
      const scoreResp = await fetch(`${API}/score/${botSessionId}`);
      if (scoreResp.ok) {
        botScore = await scoreResp.json();
        addLog(`🚨  Score computed: ${(botScore.authenticity_score * 100).toFixed(1)}% — ${botScore.risk_level}`, 'danger');
      } else throw new Error();
    } catch {
      botScore = {
        session_id: botSessionId,
        authenticity_score: 0.08 + Math.random() * 0.14,
        anomaly_probability: 0.78 + Math.random() * 0.15,
        risk_level: 'HIGH',
        reason: 'High probability of AI-assisted fraud. Bulk paste events detected, near-zero IKI variance, no typo corrections, session completed in under 10 seconds.',
        features: {
          avg_iki: 36 + Math.random() * 10,
          iki_variance: 150 + Math.random() * 100,
          backspace_rate: 0.002,
          paste_count: 2,
          typing_naturalness: 0.06 + Math.random() * 0.08,
          mouse_naturalness: 0.05 + Math.random() * 0.07,
        }
      };
      addLog(`🚨  Score computed (mock): ${(botScore.authenticity_score * 100).toFixed(1)}% — ${botScore.risk_level}`, 'danger');
    }

    setBotResult(botScore);
    setProgress(95);
    await sleep(300);
    setBotVisible(true);
    await sleep(500);

    setStep(7);
    setProgress(100);
    addLog('', 'spacer');
    addLog('🏁  Demo complete. Both sessions scored and compared.', 'system');
    setPhase('done');
  }, [addLog]);

  const steps = [
    { label: 'Simulating human typing behavior' },
    { label: 'Sending human events to API' },
    { label: 'ML scoring — human session' },
    { label: 'Simulating AI/bot behavior' },
    { label: 'Sending bot events to API' },
    { label: 'ML scoring — bot session' },
    { label: 'Demo complete' },
  ];

  const logColors = { system: '#60a5fa', info: '#94a3b8', detail: '#475569', success: '#4ade80', warn: '#fb923c', danger: '#f87171', spacer: 'transparent' };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#020817',
      color: '#e2e8f0',
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      padding: '32px 24px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Space+Grotesk:wght@400;700;800&display=swap');
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0f172a; } ::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: '0.65rem', letterSpacing: 4, color: '#3b82f6', textTransform: 'uppercase', marginBottom: 8 }}>
              Barclays Hack-O-Hire — Live Demo
            </div>
            <h1 style={{
              margin: 0, fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800,
              fontFamily: "'Space Grotesk', sans-serif",
              background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #34d399)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: -1
            }}>
              🧬 Digital DNA
            </h1>
            <div style={{ color: '#475569', fontSize: '0.8rem', marginTop: 4 }}>
              Human Authenticity Scoring Engine — Automated Demo
            </div>
          </div>

          {phase === 'idle' && (
            <button onClick={runDemo} style={{
              background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
              color: 'white', border: 'none', borderRadius: 12,
              padding: '14px 28px', fontSize: '0.95rem', fontWeight: 700,
              cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: '0 0 30px #3b82f640',
              transition: 'all 0.2s',
              letterSpacing: 0.5
            }}>
              ▶  Run Full Demo
            </button>
          )}

          {phase === 'done' && (
            <button onClick={() => { setPhase('idle'); setStep(0); }} style={{
              background: '#0f172a', color: '#60a5fa', border: '1px solid #1e40af',
              borderRadius: 12, padding: '14px 28px', fontSize: '0.9rem',
              fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif"
            }}>
              ↺  Reset Demo
            </button>
          )}

          {phase === 'running' && (
            <div style={{
              background: '#0f172a', border: '1px solid #1e40af', borderRadius: 12,
              padding: '14px 24px', fontSize: '0.85rem', color: '#60a5fa',
              animation: 'pulse 1.5s infinite'
            }}>
              ● RUNNING...
            </div>
          )}
        </div>

        {/* Progress bar */}
        {phase !== 'idle' && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.72rem', color: '#475569' }}>
              <span>PROGRESS</span><span>{progress}%</span>
            </div>
            <div style={{ height: 4, background: '#0f172a', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2, transition: 'width 0.5s ease',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #22c55e)'
              }} />
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, marginBottom: 24 }}>

          {/* Steps panel */}
          {phase !== 'idle' && (
            <div style={{
              background: '#0a0f1e', border: '1px solid #1e293b',
              borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14
            }}>
              <div style={{ fontSize: '0.65rem', letterSpacing: 3, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                Pipeline Steps
              </div>
              {steps.map((s, i) => (
                <Step
                  key={i} num={i + 1} label={s.label}
                  status={step > i + 1 ? 'done' : step === i + 1 ? 'active' : 'pending'}
                />
              ))}
            </div>
          )}

          {/* Log panel */}
          {phase !== 'idle' && (
            <div style={{
              background: '#020817', border: '1px solid #0f172a',
              borderRadius: 12, padding: 16, minHeight: 260,
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ fontSize: '0.65rem', letterSpacing: 3, color: '#334155', textTransform: 'uppercase', marginBottom: 12 }}>
                System Log
              </div>
              <div ref={logRef} style={{ height: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {log.map((entry, i) => (
                  <div key={i} style={{
                    fontSize: '0.78rem', color: logColors[entry.type] || '#94a3b8',
                    lineHeight: 1.5, opacity: 0, animation: `slideIn 0.3s ease forwards`,
                    animationDelay: '0s'
                  }}>
                    {entry.type !== 'spacer' && (
                      <>
                        <span style={{ color: '#334155', marginRight: 8 }}>
                          {new Date(entry.t).toLocaleTimeString('en-GB', { hour12: false })}
                        </span>
                        {entry.msg}
                      </>
                    )}
                  </div>
                ))}
                {phase === 'running' && (
                  <div style={{ color: '#334155', fontSize: '0.78rem', animation: 'pulse 1s infinite' }}>_</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Idle state CTA */}
        {phase === 'idle' && (
          <div style={{
            background: '#0a0f1e', border: '1px dashed #1e293b',
            borderRadius: 16, padding: '60px 40px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🧬</div>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem',
              color: '#e2e8f0', margin: '0 0 12px', fontWeight: 700
            }}>
              One Button. Full System Demo.
            </h2>
            <p style={{ color: '#475569', fontSize: '0.85rem', maxWidth: 480, margin: '0 auto 8px', lineHeight: 1.7 }}>
              Click <strong style={{ color: '#60a5fa' }}>Run Full Demo</strong> to automatically simulate a genuine human KYC session and an AI bot session — side by side — and watch the scoring engine catch the fraud in real time.
            </p>
            <p style={{ color: '#334155', fontSize: '0.78rem', margin: 0 }}>
              No manual typing needed. Everything is automated.
            </p>
          </div>
        )}

        {/* Form visualizer - shows what's being "typed" */}
        {phase !== 'idle' && step <= 3 && (
          <div style={{
            background: '#0a0f1e', border: '1px solid #1e293b',
            borderRadius: 12, padding: 20, marginBottom: 20
          }}>
            <div style={{ fontSize: '0.65rem', letterSpacing: 3, color: '#3b82f6', textTransform: 'uppercase', marginBottom: 16 }}>
              🧑 Human Session — KYC Form Being Filled
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {Object.entries({ fullName: 'Full Name', dob: 'Date of Birth', email: 'Email', phone: 'Phone', address: 'Address', govId: 'Gov ID' }).map(([key, label]) => (
                <div key={key} style={{
                  background: activeField === key ? '#0f172a' : '#020817',
                  border: `1px solid ${activeField === key ? '#3b82f6' : '#1e293b'}`,
                  borderRadius: 8, padding: '10px 14px',
                  transition: 'all 0.2s',
                  boxShadow: activeField === key ? '0 0 12px #3b82f620' : 'none'
                }}>
                  <div style={{ fontSize: '0.65rem', color: '#475569', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                  <div style={{ fontSize: '0.82rem', minHeight: 18, color: '#4ade80', fontFamily: 'monospace' }}>
                    {fieldTexts[key] || ''}
                    {activeField === key && <span style={{ animation: 'blink 0.8s infinite' }}>|</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step >= 4 && phase !== 'idle' && (
          <div style={{
            background: '#0a0f1e', border: '1px solid #2d1010',
            borderRadius: 12, padding: 20, marginBottom: 20
          }}>
            <div style={{ fontSize: '0.65rem', letterSpacing: 3, color: '#ef4444', textTransform: 'uppercase', marginBottom: 16 }}>
              🤖 Bot Session — Instant Paste Detected
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {Object.entries({ fullName: 'Full Name', dob: 'Date of Birth', email: 'Email', phone: 'Phone', address: 'Address', govId: 'Gov ID' }).map(([key, label]) => (
                <div key={key} style={{
                  background: '#020817', border: '1px solid #2d1010',
                  borderRadius: 8, padding: '10px 14px'
                }}>
                  <div style={{ fontSize: '0.65rem', color: '#475569', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                  <div style={{ fontSize: '0.82rem', color: '#f87171', fontFamily: 'monospace' }}>
                    {botFieldTexts[key] || <span style={{ color: '#334155' }}>—</span>}
                  </div>
                </div>
              ))}
            </div>
            {step >= 4 && (
              <div style={{ marginTop: 10, padding: '6px 12px', background: '#2d101008', borderRadius: 6, fontSize: '0.72rem', color: '#ef4444' }}>
                ⚡ All fields populated via paste in 0.8s — no keystrokes, no pauses, no corrections
              </div>
            )}
          </div>
        )}

        {/* Results comparison */}
        {(humanVisible || botVisible) && (
          <div>
            <div style={{ fontSize: '0.65rem', letterSpacing: 3, color: '#475569', textTransform: 'uppercase', marginBottom: 16 }}>
              Scoring Results — Side by Side
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <ScoreCard result={humanResult} type="human" visible={humanVisible} />
              <ScoreCard result={botResult} type="bot" visible={botVisible} />
            </div>

            {humanVisible && botVisible && (
              <div style={{
                marginTop: 20, padding: 20,
                background: 'linear-gradient(135deg, #0a0f1e, #0f0a1e)',
                border: '1px solid #1e293b', borderRadius: 12,
                animation: 'slideIn 0.5s ease'
              }}>
                <div style={{ fontSize: '0.65rem', letterSpacing: 3, color: '#8b5cf6', textTransform: 'uppercase', marginBottom: 12 }}>
                  📊 Comparison Summary
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {[
                    ['Authenticity Gap', `${((humanResult.authenticity_score - botResult.authenticity_score) * 100).toFixed(0)}%`, '#a78bfa'],
                    ['IKI Ratio', `${(humanResult.features?.avg_iki / Math.max(botResult.features?.avg_iki, 1)).toFixed(1)}×`, '#60a5fa'],
                    ['Paste Events', `0 vs ${botResult.features?.paste_count}`, '#fb923c'],
                    ['Verdict', `1 caught`, '#4ade80'],
                  ].map(([label, value, color]) => (
                    <div key={label} style={{ background: '#020817', borderRadius: 8, padding: '12px 16px', border: '1px solid #1e293b' }}>
                      <div style={{ fontSize: '0.65rem', color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoMode;
