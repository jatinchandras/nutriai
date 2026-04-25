// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../lib/api.js';
import HelpTip from '../components/HelpTip.jsx';

const ACTIVITY_LEVELS = [
  { value: '1.2',   label: 'Sedentary',        sub: 'Desk job, little to no exercise' },
  { value: '1.375', label: 'Lightly active',    sub: '1–3 days/week exercise' },
  { value: '1.55',  label: 'Moderately active', sub: '3–5 days/week exercise' },
  { value: '1.725', label: 'Very active',        sub: '6–7 days/week hard training' },
  { value: '1.9',   label: 'Extremely active',   sub: 'Athlete or physical job' },
];

const GOALS = [
  { value: '-500', label: 'Lose weight fast',    sub: '−500 kcal/day deficit' },
  { value: '-250', label: 'Lose weight slowly',  sub: '−250 kcal/day deficit' },
  { value: '0',    label: 'Maintain weight',     sub: 'Eat at maintenance' },
  { value: '250',  label: 'Slow muscle gain',    sub: '+250 kcal/day surplus' },
  { value: '500',  label: 'Gain muscle / bulk',  sub: '+500 kcal/day surplus' },
];

function calcTDEE({ age, sex, weight_kg, height_cm, activity_level, goal_adjustment }) {
  if (!age || !weight_kg || !height_cm) return null;
  let bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  bmr += sex === 'male' ? 5 : -161;
  const tdee = Math.round(bmr * (parseFloat(activity_level) || 1.55));
  const target = tdee + (parseInt(goal_adjustment) || 0);
  return { tdee, target };
}

function InputField({ label, tip, children }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>
        {label} {tip && <HelpTip text={tip} />}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)',
  borderRadius: '8px', color: 'var(--text)', fontFamily: 'var(--font-body)',
  fontSize: '14px', padding: '10px 12px', outline: 'none', transition: 'border-color 0.15s',
};

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    age: '', sex: 'male', weight_kg: '', height_cm: '',
    activity_level: '1.55', goal_adjustment: '0', maintenance_calories: '',
  });
  const [computed, setComputed] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.profile.get().then(r => {
      const p = r.profile;
      setForm({
        age:                  p.age              || '',
        sex:                  p.sex              || 'male',
        weight_kg:            p.weight_kg        || '',
        height_cm:            p.height_cm        || '',
        activity_level:       String(p.activity_level  || '1.55'),
        goal_adjustment:      String(p.goal_adjustment || '0'),
        maintenance_calories: p.maintenance_calories || '',
      });
    }).catch(() => {});
  }, []);

  // Live TDEE preview
  useEffect(() => {
    const result = calcTDEE(form);
    setComputed(result);
    if (result) {
      setForm(f => ({ ...f, maintenance_calories: String(result.target) }));
    }
  }, [form.age, form.sex, form.weight_kg, form.height_cm, form.activity_level, form.goal_adjustment]);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.profile.update(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => navigate('/')} style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)', width: '32px', height: '32px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <span style={{ fontFamily: 'var(--font-head)', fontSize: '16px', fontWeight: 600 }}>Profile & Goals</span>
      </nav>

      <div style={{ padding: '20px', maxWidth: '560px', margin: '0 auto' }}>

        {/* USER CARD */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          {user?.user_metadata?.avatar_url
            ? <img src={user.user_metadata.avatar_url} alt="avatar" style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid var(--border2)' }} />
            : <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontSize: '20px', color: 'var(--green)', fontWeight: 700 }}>
                {(user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}
              </div>
          }
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '16px' }}>{user?.user_metadata?.full_name || 'User'}</div>
            <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{user?.email}</div>
          </div>
          <button
            onClick={async () => { await signOut(); navigate('/login'); }}
            style={{ background: 'var(--red-dim)', border: '1px solid rgba(255,82,82,0.2)', color: 'var(--red)', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
          >Sign out</button>
        </div>

        {/* PERSONAL INFO */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>Personal Info</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <InputField label="Age" tip="Used in the Mifflin-St Jeor BMR formula to estimate your base metabolic rate.">
              <input type="number" min="10" max="100" placeholder="e.g. 28" value={form.age} onChange={set('age')} style={inputStyle} onFocus={e => e.target.style.borderColor='var(--green)'} onBlur={e => e.target.style.borderColor='var(--border2)'} />
            </InputField>
            <InputField label="Biological sex" tip="Affects the BMR calculation. Males have a +5 offset, females −161 in the Mifflin-St Jeor formula.">
              <select value={form.sex} onChange={set('sex')} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </InputField>
            <InputField label="Weight (kg)" tip="Used in BMR calculation and MET-based workout calorie estimates. Update this regularly for accuracy.">
              <input type="number" min="30" max="300" step="0.1" placeholder="e.g. 75" value={form.weight_kg} onChange={set('weight_kg')} style={inputStyle} onFocus={e => e.target.style.borderColor='var(--green)'} onBlur={e => e.target.style.borderColor='var(--border2)'} />
            </InputField>
            <InputField label="Height (cm)" tip="Combined with age, sex, and weight to calculate your Basal Metabolic Rate (BMR).">
              <input type="number" min="100" max="250" placeholder="e.g. 175" value={form.height_cm} onChange={set('height_cm')} style={inputStyle} onFocus={e => e.target.style.borderColor='var(--green)'} onBlur={e => e.target.style.borderColor='var(--border2)'} />
            </InputField>
          </div>
        </div>

        {/* ACTIVITY */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Activity Level
            <HelpTip text="Your BMR is multiplied by this factor (PAL) to get your TDEE. Be honest — most people overestimate their activity." />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ACTIVITY_LEVELS.map(({ value, label, sub }) => (
              <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: form.activity_level === value ? 'var(--green-dim)' : 'var(--bg3)', border: `1px solid ${form.activity_level === value ? 'rgba(0,230,118,0.3)' : 'var(--border)'}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s' }}>
                <input type="radio" name="activity" value={value} checked={form.activity_level === value} onChange={set('activity_level')} style={{ accentColor: 'var(--green)' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: form.activity_level === value ? 'var(--green)' : 'var(--text)' }}>{label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{sub}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* GOAL */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Goal
            <HelpTip text="This calorie offset is added to your TDEE. A 500 kcal deficit per day creates roughly 0.5kg of weight loss per week." />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {GOALS.map(({ value, label, sub }) => (
              <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: form.goal_adjustment === value ? 'var(--green-dim)' : 'var(--bg3)', border: `1px solid ${form.goal_adjustment === value ? 'rgba(0,230,118,0.3)' : 'var(--border)'}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s' }}>
                <input type="radio" name="goal" value={value} checked={form.goal_adjustment === value} onChange={set('goal_adjustment')} style={{ accentColor: 'var(--green)' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: form.goal_adjustment === value ? 'var(--green)' : 'var(--text)' }}>{label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{sub}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* TDEE RESULT */}
        {computed && (
          <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(0,230,118,0.2)', borderRadius: 'var(--radius)', padding: '18px', marginBottom: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>Calculated TDEE (maintenance)</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '32px', fontWeight: 700, color: 'var(--green)' }}>{computed.tdee.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>kcal/day</div>
            {computed.target !== computed.tdee && (
              <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text2)' }}>
                With your goal: <strong style={{ color: 'var(--text)' }}>{computed.target.toLocaleString()} kcal/day</strong>
              </div>
            )}
          </div>
        )}

        {/* MANUAL OVERRIDE */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px', marginBottom: '20px' }}>
          <InputField
            label="Override maintenance calories"
            tip="Set this manually if you know your exact maintenance calories from a dietitian or metabolic test. Overrides the TDEE calculation."
          >
            <input
              type="number" min="1000" max="6000"
              placeholder="e.g. 2200 kcal"
              value={form.maintenance_calories}
              onChange={set('maintenance_calories')}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor='var(--green)'}
              onBlur={e => e.target.style.borderColor='var(--border2)'}
            />
          </InputField>
        </div>

        {error && (
          <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(255,82,82,0.2)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'var(--red)', marginBottom: '12px' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{ width: '100%', padding: '14px', background: saved ? 'var(--blue)' : 'var(--green)', color: '#0e0f11', border: 'none', borderRadius: '10px', fontFamily: 'var(--font-head)', fontSize: '15px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, transition: 'all 0.2s', marginBottom: '32px' }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Profile'}
        </button>

      </div>
    </div>
  );
}
