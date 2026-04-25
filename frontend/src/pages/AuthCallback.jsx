// src/pages/AuthCallback.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase handles the token exchange from the URL hash/query params automatically.
    // We just wait for the session to be set, then redirect.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/', { replace: true });
      } else if (event === 'SIGNED_OUT') {
        navigate('/login', { replace: true });
      }
    });

    // Fallback: check immediately in case session is already ready
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/', { replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0e0f11',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        width: '40px', height: '40px',
        border: '3px solid rgba(255,255,255,0.1)',
        borderTopColor: '#00e676',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#8b8f9a', fontSize: '14px' }}>Signing you in…</p>
    </div>
  );
}
