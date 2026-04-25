// src/pages/Login.jsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoDot} />
          NutriAI
        </div>
        <h1 style={styles.headline}>Track smarter,<br />eat better.</h1>
        <p style={styles.sub}>
          AI-powered calorie and macro tracking.<br />
          Describe your food — we handle the maths.
        </p>

        <button
          style={{ ...styles.googleBtn, opacity: loading ? 0.6 : 1 }}
          onClick={handleSignIn}
          disabled={loading}
        >
          {!loading && (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
          )}
          {loading ? 'Redirecting...' : 'Continue with Google'}
        </button>

        {error && <p style={styles.error}>{error}</p>}

        <p style={styles.legal}>
          By signing in you agree to our{' '}
          <a href="#" style={styles.link}>Terms</a> and{' '}
          <a href="#" style={styles.link}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0e0f11',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    background: '#16181c',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '20px',
    padding: '48px 40px',
    maxWidth: '420px',
    width: '100%',
    textAlign: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '20px',
    fontWeight: '700',
    color: '#00e676',
    marginBottom: '32px',
    letterSpacing: '-0.5px',
  },
  logoDot: {
    width: '8px',
    height: '8px',
    background: '#00e676',
    borderRadius: '50%',
  },
  headline: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '32px',
    fontWeight: '700',
    color: '#f0f2f5',
    marginBottom: '12px',
    lineHeight: '1.2',
    letterSpacing: '-0.5px',
  },
  sub: {
    fontSize: '15px',
    color: '#8b8f9a',
    lineHeight: '1.6',
    marginBottom: '36px',
  },
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    padding: '14px',
    background: '#ffffff',
    color: '#1a1a1a',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  error: {
    marginTop: '12px',
    fontSize: '13px',
    color: '#ff5252',
  },
  legal: {
    marginTop: '20px',
    fontSize: '12px',
    color: '#565a66',
    lineHeight: '1.5',
  },
  link: {
    color: '#8b8f9a',
  },
};
