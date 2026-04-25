// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { useLogs } from '../hooks/useLogs.js'
import { api } from '../lib/api.js'
import FoodModal from '../components/FoodModal.jsx'
import WorkoutModal from '../components/WorkoutModal.jsx'
import HelpTip from '../components/HelpTip.jsx'
import {
  usePWAInstall,
  useOnlineStatus,
  useLaunchAction
} from '../hooks/usePWA.js'

const TODAY = new Date().toISOString().split('T')[0];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function fmt(n) { return Math.round(n).toLocaleString(); }

function CalorieRing({ eaten, burned, goal }) {
  const foodPct  = Math.min(eaten  / (goal || 2000), 1);
  const workPct  = Math.min(burned / (goal || 2000), 1);
  const outerC   = 2 * Math.PI * 46; // r=46
  const innerC   = 2 * Math.PI * 36; // r=36
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx="55" cy="55" r="46" fill="none" stroke="var(--bg3)" strokeWidth="10"/>
      <circle cx="55" cy="55" r="46" fill="none" stroke="var(--green)" strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={outerC}
        strokeDashoffset={outerC - outerC * foodPct}
        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
      />
      <circle cx="55" cy="55" r="36" fill="none" stroke="var(--bg3)" strokeWidth="7"/>
      <circle cx="55" cy="55" r="36" fill="none" stroke="var(--blue)" strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={innerC}
        strokeDashoffset={innerC - innerC * workPct}
        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  );
}

function MacroBar({ value, goal, color }) {
  const pct = Math.min((value / (goal || 1)) * 100, 100);
  return (
    <div style={{ height: '5px', background: 'var(--bg4)', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: color,
        borderRadius: '3px',
        transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  );
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { foodLogs, workoutLogs, totals, loading, addFood, addWorkout, deleteFood, deleteWorkout } = useLogs(TODAY);
  const [profile, setProfile] = useState(null);
  const [showFood, setShowFood] = useState(false);
  const [showWorkout, setShowWorkout] = useState(false);
  const { canInstall, promptInstall } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const launchAction = useLaunchAction();

  // Handle manifest shortcuts: ?action=food / ?action=workout
  useEffect(() => {
    if (launchAction === 'food') setShowFood(true);
    if (launchAction === 'workout') setShowWorkout(true);
  }, [launchAction]);

  useEffect(() => {
    api.profile.get().then(r => setProfile(r.profile)).catch(() => {});
  }, []);

  const maintenance = profile?.maintenance_calories || 2000;
  const proteinGoal = profile?.protein_goal_g || 150;
  const carbsGoal   = profile?.carbs_goal_g   || 200;
  const fatGoal     = profile?.fat_goal_g      || 67;
  const deficit     = (maintenance - totals.calories) + totals.burned;
  const remaining   = maintenance - totals.calories + totals.burned;

  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || '';

  const allLogs = [
    ...foodLogs.map(e => ({ ...e, type: 'food' })),
    ...workoutLogs.map(e => ({ ...e, type: 'workout' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>

      {/* OFFLINE BANNER */}
      {!isOnline && (
        <div style={{ background: '#3a2a00', borderBottom: '1px solid var(--amber)', padding: '8px 18px', fontSize: '13px', color: 'var(--amber)', textAlign: 'center' }}>
          ⚡ You're offline — your logs are saved and will sync when you reconnect
        </div>
      )}

      {/* INSTALL BANNER */}
      {canInstall && (
        <div style={{ background: 'var(--green-dim)', borderBottom: '1px solid rgba(0,230,118,0.2)', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--green)' }}>📲 Install NutriAI on your device for the best experience</span>
          <button onClick={promptInstall} style={{ background: 'var(--green)', color: '#0e0f11', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Install App
          </button>
        </div>
      )}

      {/* NAV */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px',
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: 700, color: 'var(--green)', letterSpacing: '-0.5px' }}>
          <div style={{ width: '8px', height: '8px', background: 'var(--green)', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
          NutriAI
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{dateLabel}</span>
          {user?.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              alt="avatar"
              style={{ width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', border: '2px solid var(--border2)' }}
              onClick={() => navigate('/profile')}
            />
          )}
          <button
            onClick={() => navigate('/profile')}
            style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)', width: '32px', height: '32px', borderRadius: '8px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >⚙</button>
        </div>
      </nav>

      <div style={{ padding: '16px', maxWidth: '640px', margin: '0 auto' }}>

        {/* GREETING */}
        <div className="fade-up" style={{ marginBottom: '18px' }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '22px', fontWeight: 600, marginBottom: '2px' }}>
            {greeting()}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text2)' }}>Here's your nutrition snapshot for today</p>
        </div>

        {/* CALORIE RING CARD */}
        <div className="fade-up" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px', marginBottom: '12px', display: 'flex', gap: '18px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
            <CalorieRing eaten={totals.calories} burned={totals.burned} goal={maintenance} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '22px', fontWeight: 700, lineHeight: 1 }}>{fmt(totals.calories)}</div>
              <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>consumed</div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-head)', fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>
              Daily Calories
              <HelpTip text="Outer green ring = food eaten vs your goal. Inner blue ring = workout calories. Aim to keep the green ring from hitting 100%." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: '🟢 Eaten',     val: `${fmt(totals.calories)} kcal`,  col: 'var(--green)' },
                { label: '🔵 Burned',    val: `${fmt(totals.burned)} kcal`,    col: 'var(--blue)'  },
                { label: '🎯 Goal',      val: `${fmt(maintenance)} kcal`,      col: 'var(--text)'  },
                { label: '📊 Remaining', val: `${fmt(remaining)} kcal`,        col: remaining < 0 ? 'var(--red)' : 'var(--amber)' },
              ].map(({ label, val, col }) => (
                <div key={label} style={{ background: 'var(--bg3)', borderRadius: '8px', padding: '8px 10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: '14px', fontWeight: 600, color: col }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MACROS */}
        <div className="fade-up" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '14px' }}>Macronutrients</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            {[
              { name: 'Protein', val: totals.protein, goal: proteinGoal, unit: 'g', color: 'var(--blue)',   tip: 'Builds & repairs muscle. ~1.6g/kg body weight is a good target. 4 kcal per gram.' },
              { name: 'Carbs',   val: totals.carbs,   goal: carbsGoal,   unit: 'g', color: 'var(--amber)',  tip: 'Your primary energy source. Fuels your brain and muscles. 4 kcal per gram.' },
              { name: 'Fat',     val: totals.fat,     goal: fatGoal,     unit: 'g', color: 'var(--purple)', tip: 'Essential for hormones and vitamins. Healthy fats from nuts, fish, olive oil. 9 kcal per gram.' },
            ].map(({ name, val, goal, unit, color, tip }) => (
              <div key={name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color }}>
                    {name} <HelpTip text={tip} />
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color }}>{Number(val).toFixed(1)}{unit}</div>
                </div>
                <MacroBar value={val} goal={goal} color={color} />
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '3px' }}>of {goal}{unit}</div>
              </div>
            ))}
          </div>
        </div>

        {/* NET DEFICIT */}
        <div className="fade-up" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 500, color: 'var(--text2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Net Calorie Deficit
            <HelpTip text={`Deficit = (Maintenance − Food) + Workout burned. Formula: (${fmt(maintenance)} − ${fmt(totals.calories)}) + ${fmt(totals.burned)} = ${fmt(deficit)} kcal. ~500 kcal deficit/day ≈ 0.5kg/week loss.`} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontFamily: 'var(--font-head)', fontSize: '34px', fontWeight: 700, color: deficit >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(Math.abs(deficit))}</span>
                <span style={{ fontSize: '14px', color: 'var(--text2)' }}>kcal</span>
              </div>
              <code style={{ fontSize: '11px', color: 'var(--text3)', background: 'var(--bg4)', padding: '2px 7px', borderRadius: '4px' }}>
                ({fmt(maintenance)} − {fmt(totals.calories)}) + {fmt(totals.burned)}
              </code>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              fontSize: '12px', fontWeight: 600, padding: '5px 10px', borderRadius: '6px',
              background: deficit >= 0 ? 'var(--green-dim)' : 'var(--red-dim)',
              color: deficit >= 0 ? 'var(--green)' : 'var(--red)',
            }}>
              {deficit > 200 ? '↓ In deficit' : deficit < 0 ? '↑ In surplus' : '✓ On track'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            {[
              { label: 'Maintenance', val: `${fmt(maintenance)} kcal`, col: 'var(--text)' },
              { label: 'Food in',     val: `−${fmt(totals.calories)} kcal`, col: 'var(--red)'  },
              { label: 'Workout out', val: `+${fmt(totals.burned)} kcal`,   col: 'var(--blue)' },
            ].map(({ label, val, col }, i) => (
              <div key={label} style={{ flex: 1, paddingLeft: i > 0 ? '16px' : 0, borderLeft: i > 0 ? '1px solid var(--border)' : 'none', marginLeft: i > 0 ? '16px' : 0 }}>
                <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '3px' }}>{label}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: col }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          {[
            { label: 'Log Food', sub: 'AI macro estimator', icon: '🍽', col: 'var(--green)', bg: 'var(--green-dim)', onClick: () => setShowFood(true) },
            { label: 'Log Workout', sub: 'AI calorie estimator', icon: '🏃', col: 'var(--blue)', bg: 'var(--blue-dim)', onClick: () => setShowWorkout(true) },
          ].map(({ label, sub, icon, col, bg, onClick }) => (
            <button key={label} onClick={onClick} style={{
              background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)',
              padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
              textAlign: 'left', transition: 'all 0.15s', fontFamily: 'var(--font-body)',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = col; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '1px' }}>{label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{sub}</div>
              </div>
            </button>
          ))}
        </div>

        {/* LOG */}
        <div className="fade-up" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px', marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '14px' }}>Today's Log</div>

          {loading && <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text3)', fontSize: '13px' }}>Loading…</div>}

          {!loading && allLogs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: '13px' }}>
              Nothing logged yet — add your first meal or workout above!
            </div>
          )}

          {allLogs.map(entry => (
            <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}
              className="log-entry"
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: entry.type === 'food' ? 'var(--green-dim)' : 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
                {entry.type === 'food' ? '🍽' : '🏃'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
                  {entry.type === 'food'
                    ? `P:${Number(entry.protein_g).toFixed(0)}g  C:${Number(entry.carbs_g).toFixed(0)}g  F:${Number(entry.fat_g).toFixed(0)}g`
                    : `Workout · ${entry.duration_minutes || '?'} min`
                  }
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '15px', fontWeight: 600, color: entry.type === 'food' ? 'var(--green)' : 'var(--blue)' }}>
                  {entry.type === 'food' ? '+' : '-'}{fmt(entry.type === 'food' ? entry.calories : entry.calories_burned)}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text3)' }}>kcal</div>
              </div>
              <button
                onClick={() => entry.type === 'food' ? deleteFood(entry.id) : deleteWorkout(entry.id)}
                style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)'; }}
              >✕</button>
            </div>
          ))}
        </div>
      </div>

      {showFood    && <FoodModal    onClose={() => setShowFood(false)}    onAdd={e => { addFood(e);    }} />}
      {showWorkout && <WorkoutModal onClose={() => setShowWorkout(false)} onAdd={e => { addWorkout(e); }} />}
    </div>
  );
}
