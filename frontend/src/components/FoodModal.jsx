// src/components/FoodModal.jsx
import { useState } from 'react';
import { api } from '../lib/api.js';
import s from './Modal.module.css';

export default function FoodModal({ onClose, onAdd }) {
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
      const res = await api.food.estimate(input.trim());
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
      const res = await api.food.save({
        name: estimate.name,
        description: input.trim(),
        calories: estimate.calories,
        protein_g: estimate.protein_g,
        carbs_g: estimate.carbs_g,
        fat_g: estimate.fat_g,
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
          <span className={s.icon} style={{ background: 'var(--green-dim)' }}>🍽</span>
          <div>
            <h2 className={s.title}>Log Food</h2>
            <p className={s.subtitle}>Describe what you ate — AI estimates the macros</p>
          </div>
        </div>

        <div className={s.tip}>
          <strong>💡 Best results:</strong> Include portion sizes and weights.<br />
          <em>e.g. "200g grilled chicken, 1 cup cooked rice, 1 tbsp olive oil, side salad"</em>
        </div>

        <textarea
          className={s.textarea}
          value={input}
          onChange={(e) => { setInput(e.target.value); setEstimate(null); }}
          onKeyDown={handleKey}
          placeholder="e.g. 2 scrambled eggs with 2 slices wholegrain toast, 15g butter, 200ml whole milk..."
          rows={4}
          autoFocus
          disabled={loading || saving}
        />
        <p className={s.hint}>Tip: Cmd+Enter to estimate</p>

        {error && <div className={s.error}>{error}</div>}

        {estimate && (
          <div className={s.result}>
            <div className={s.resultHeader}>
              <span className={s.aiBadge} style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
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
              <div className={s.macroBox}>
                <div className={s.macroVal} style={{ color: 'var(--green)' }}>{Math.round(estimate.calories)}</div>
                <div className={s.macroLabel}>Calories</div>
              </div>
              <div className={s.macroBox}>
                <div className={s.macroVal} style={{ color: 'var(--blue)' }}>{Number(estimate.protein_g).toFixed(1)}g</div>
                <div className={s.macroLabel}>Protein</div>
              </div>
              <div className={s.macroBox}>
                <div className={s.macroVal} style={{ color: 'var(--amber)' }}>{Number(estimate.carbs_g).toFixed(1)}g</div>
                <div className={s.macroLabel}>Carbs</div>
              </div>
              <div className={s.macroBox}>
                <div className={s.macroVal} style={{ color: 'var(--purple)' }}>{Number(estimate.fat_g).toFixed(1)}g</div>
                <div className={s.macroLabel}>Fat</div>
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
              {saving ? <LoadingDots /> : "+ Add to Today's Log"}
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
