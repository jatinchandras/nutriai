import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import AuthCallback from './pages/AuthCallback.jsx';

function Spinner() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0e0f11',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      fontFamily: 'sans-serif',
    }}>
      <div style={{
        width: '48px', height: '48px',
        border: '4px solid rgba(0,230,118,0.3)',
        borderTopColor: '#00e676',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#00e676', fontSize: '16px' }}>NutriAI loading…</p>
      <p style={{ color: '#565a66', fontSize: '12px' }}>Connecting to Supabase…</p>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  console.log('ProtectedRoute — loading:', loading, 'user:', !!user);
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  console.log('PublicRoute — loading:', loading, 'user:', !!user);
  if (loading) return <Spinner />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  console.log('App rendering');
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
