import React, { useEffect, useRef, useState } from 'react';
import BehaviorCaptureSDK from '../utils/behaviorCapture';

const KYCForm = ({ onSubmit }) => {
  const sdkRef = useRef(null);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', dob: '', email: '', phone: '',
    address: '', govId: '', incomeSource: ''
  });

  useEffect(() => {
    sdkRef.current = new BehaviorCaptureSDK({
      apiEndpoint: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/behavioral'
    });
    sdkRef.current.start('kyc-form');

    return () => sdkRef.current?.stop();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    sdkRef.current.stop();
    try {
      const scoreData = await sdkRef.current.getScore();
      setScore(scoreData);
      onSubmit?.({ formData, score: scoreData });
    } finally {
      setLoading(false);
    }
  };

  const riskColor = score
    ? score.risk_level === 'HIGH' ? '#ef4444'
      : score.risk_level === 'MEDIUM' ? '#f59e0b' : '#22c55e'
    : '#6b7280';

  return (
    <div className="kyc-form-wrapper">
      <form id="kyc-form" onSubmit={handleSubmit} className="kyc-form">
        <h2>Identity Verification (KYC)</h2>
        <p className="subtitle">Monitored session — behavioral analysis active</p>

        <div className="form-grid">
          {[
            { label: 'Full Legal Name', name: 'fullName', type: 'text', placeholder: 'John Michael Doe' },
            { label: 'Date of Birth', name: 'dob', type: 'date' },
            { label: 'Email Address', name: 'email', type: 'email', placeholder: 'john@example.com' },
            { label: 'Phone Number', name: 'phone', type: 'tel', placeholder: '+44 7700 900000' },
            { label: 'Residential Address', name: 'address', type: 'text', placeholder: '123 High Street, London' },
            { label: 'Government ID Number', name: 'govId', type: 'text', placeholder: 'Passport / NIN / DL' },
          ].map(({ label, name, type, placeholder }) => (
            <div className="form-group" key={name}>
              <label htmlFor={name}>{label}</label>
              <input
                id={name}
                name={name}
                type={type}
                placeholder={placeholder}
                value={formData[name]}
                onChange={e => setFormData(p => ({ ...p, [name]: e.target.value }))}
                required
              />
            </div>
          ))}

          <div className="form-group full-width">
            <label htmlFor="incomeSource">Source of Income / Funds</label>
            <textarea
              id="incomeSource"
              name="incomeSource"
              rows={3}
              placeholder="Describe your primary source of income..."
              value={formData.incomeSource}
              onChange={e => setFormData(p => ({ ...p, incomeSource: e.target.value }))}
              required
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Analyzing...' : 'Submit KYC Application'}
        </button>

        {score && (
          <div className="score-panel" style={{ borderColor: riskColor }}>
            <div className="score-header">
              <span>Human Authenticity Score</span>
              <span className="score-badge" style={{ background: riskColor }}>
                {score.risk_level}
              </span>
            </div>
            <div className="score-value" style={{ color: riskColor }}>
              {(score.authenticity_score * 100).toFixed(1)}%
            </div>
            <div className="score-details">
              <div>Anomaly Probability: <strong>{(score.anomaly_probability * 100).toFixed(1)}%</strong></div>
              <div>Typing Naturalness: <strong>{(score.features?.typing_naturalness * 100).toFixed(1)}%</strong></div>
              <div>Mouse Naturalness: <strong>{(score.features?.mouse_naturalness * 100).toFixed(1)}%</strong></div>
              <div>Paste Events: <strong>{score.features?.paste_count}</strong></div>
              <div>Backspace Rate: <strong>{(score.features?.backspace_rate * 100).toFixed(1)}%</strong></div>
            </div>
            <p className="score-reason">{score.reason}</p>
          </div>
        )}
      </form>

      <style>{`
        .kyc-form-wrapper { max-width: 700px; margin: 0 auto; padding: 24px; font-family: system-ui, sans-serif; }
        .kyc-form { background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        h2 { margin: 0 0 4px; color: #1e293b; font-size: 1.5rem; }
        .subtitle { color: #64748b; font-size: 0.85rem; margin-bottom: 24px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full-width { grid-column: 1 / -1; }
        label { font-size: 0.85rem; font-weight: 600; color: #374151; }
        input, textarea { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
        input:focus, textarea:focus { border-color: #3b82f6; }
        .submit-btn { margin-top: 20px; width: 100%; padding: 14px; background: #1e40af; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .submit-btn:hover { background: #1d4ed8; }
        .submit-btn:disabled { background: #94a3b8; cursor: not-allowed; }
        .score-panel { margin-top: 24px; border: 2px solid; border-radius: 10px; padding: 20px; }
        .score-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-weight: 600; color: #1e293b; }
        .score-badge { padding: 4px 12px; border-radius: 20px; color: white; font-size: 0.8rem; font-weight: 700; }
        .score-value { font-size: 2.5rem; font-weight: 800; margin: 8px 0; }
        .score-details { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.85rem; color: #475569; margin: 12px 0; }
        .score-reason { font-size: 0.85rem; color: #64748b; font-style: italic; margin: 0; }
      `}</style>
    </div>
  );
};

export default KYCForm;
