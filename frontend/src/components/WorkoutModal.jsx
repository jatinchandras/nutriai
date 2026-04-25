// src/components/WorkoutModal.jsx
import { useState } from 'react';
import { api } from '../lib/api.js';
import s from './Modal.module.css';

export default function WorkoutModal({ onClose, onAdd }) {
  const [input, setInput] = useState('');
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleEstimate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setEstimate(null);
    try {
      const res = await api.workout.estimate(input.trim());
      setEstimate(res.estimate);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!estimate) return;
    setSaving(true);
    try {
      const res = await api.workout.save({
        name: estimate.name,
        description: input.trim(),
        calories_burned: estimate.calories_burned,
        duration_minutes: estimate.duration_minutes,
        confidence: estimate.confidence,
        ai_note: estimate.note,
      });
      onAdd(res.entry);
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !estimate) handleEstimate();
  };

  return (
    <div className={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modal}>
        <div className={s.handle} />

        <div className={s.header}>
          <span className={s.icon} style={{ background: 'var(--blue-dim)' }}>🏃</span>
          <div>
            <h2 className={s.title}>Log Workout</h2>
            <p className={s.subtitle}>Describe your session — AI estimates calories burned</p>
          </div>
        </div>

        <div className={s.tip} style={{ borderLeftColor: 'var(--blue)' }}>
          <strong style={{ color: 'var(--blue)' }}>💡 Best results:</strong> Use smartwatch data (HR, pace, duration).<br />
          <em>e.g. "45 min run, avg HR 158bpm, pace 5:30/km" or "40 min HIIT, felt very intense"</em>
        </div>

        <textarea
          className={s.textarea}
          value={input}
          onChange={(e) => { setInput(e.target.value); setEstimate(null); }}
          onKeyDown={handleKey}
          placeholder="e.g. 30 min weight training (chest & triceps) + 20 min moderate treadmill jog..."
          rows={4}
          autoFocus
          disabled={loading || saving}
        />
        <p className={s.hint}>Tip: Cmd+Enter to estimate</p>

        {error && <div className={s.error}>{error}</div>}

        {estimate && (
          <div className={s.result}>
            <div className={s.resultHeader}>
              <span className={s.aiBadge} style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>
                AI ESTIMATE
              </span>
              <span className={s.confidence}>
                {estimate.confidence === 'high' ? '✓ High confidence'
                  : estimate.confidence === 'medium' ? '~ Medium confidence'
                  : '⚠ Low — add more detail for better results'}
              </span>
            </div>

            <p className={s.resultName}>{estimate.name}</p>

            <div className={s.macroGrid}>
              <div className={s.macroBox} style={{ gridColumn: 'span 2' }}>
                <div className={s.macroVal} style={{ color: 'var(--blue)', fontSize: '28px' }}>
                  {Math.round(estimate.calories_burned)}
                </div>
                <div className={s.macroLabel}>Calories Burned</div>
              </div>
              <div className={s.macroBox} style={{ gridColumn: 'span 2' }}>
                <div className={s.macroVal} style={{ color: 'var(--text)' }}>
                  {Math.round(estimate.duration_minutes)} min
                </div>
                <div className={s.macroLabel}>Duration</div>
              </div>
            </div>

            {estimate.note && (
              <p className={s.aiNote}>💬 {estimate.note}</p>
            )}
          </div>
        )}

        <div className={s.actions}>
          {!estimate ? (
            <button
              className={s.btnPrimary}
              onClick={handleEstimate}
              disabled={loading || !input.trim()}
            >
              {loading ? <LoadingDots /> : '✦ Estimate with AI'}
            </button>
          ) : (
            <button
              className={s.btnPrimary}
              style={{ background: 'var(--blue)', color: '#0e0f11' }}
              onClick={handleAdd}
              disabled={saving}
            >
              {saving ? <LoadingDots /> : '+ Add to Today\'s Log'}
            </button>
          )}
          <button className={s.btnCancel} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: '5px', height: '5px',
          background: 'currentColor',
          borderRadius: '50%',
          animation: `bounce 1s infinite ${i * 0.15}s`,
        }} />
      ))}
    </span>
  );
}
