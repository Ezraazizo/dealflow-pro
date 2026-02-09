import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useStore } from './lib/store';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GoogleCallback from './pages/GoogleCallback';
import './index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useStore();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f1117', color: '#f59e0b', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>DealFlow Pro</div>
          <div style={{ fontSize: 14, color: '#8b8fa3' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const initialize = useStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#181a22',
            color: '#e4e5eb',
            border: '1px solid #2a2d3e',
            fontSize: '13px',
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
