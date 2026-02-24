import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import Sidebar from './components/layout/Sidebar';
import ChatWidget from './components/ChatWidget';

import { lazy, Suspense } from 'react';

// Lazy loaded pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Upload = lazy(() => import('./pages/Upload'));
const MyPolicies = lazy(() => import('./pages/MyPolicies'));
const PolicyViewer = lazy(() => import('./pages/PolicyViewer'));
const Chatbot = lazy(() => import('./pages/Chatbot'));
const Analytics = lazy(() => import('./pages/Analytics'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

// Loading component
const PageLoader = () => (
  <div style={{
    minHeight: '80vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)'
  }}>
    <div className="spinner" />
    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
      Loading PolicyMitr...
    </p>
  </div>
);

import './index.css';

// Layout with sidebar for authenticated pages
function DashboardLayout({ user }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Ambient Background Lights */}
      <div className="bg-glow-wrapper">
        <div className="bg-glow bg-glow-1"></div>
        <div className="bg-glow bg-glow-2"></div>
      </div>

      <Sidebar user={user} />
      <main className="main-content">
        <Outlet />
      </main>
      <ChatWidget />
    </div>
  );
}

// Protected route wrapper
function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user || null);
        // if (session?.user) fetchProfile(session.user.id);
      })
      .catch((err) => {
        console.warn('Supabase session error:', err);
      })
      .finally(() => {
        setLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      // RLS issue on profiles table causes 500 error - disabled for now
      // if (session?.user) fetchProfile(session.user.id);
      // else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) setProfile(data);
    } catch (err) {
      // console.warn('Profile fetch error:', err);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-dark)',
      }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
          },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage user={user} />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />

          {/* Protected Routes (with Sidebar layout) */}
          <Route
            element={
              <ProtectedRoute user={user}>
                <DashboardLayout user={profile || { email: user?.email }} />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/policies" element={<MyPolicies />} />
            <Route path="/policy/:id" element={<PolicyViewer />} />
            <Route path="/chat" element={<Chatbot />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
