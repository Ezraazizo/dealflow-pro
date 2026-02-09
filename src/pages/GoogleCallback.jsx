import { useEffect, useState } from 'react';
import { GmailAPI } from '../lib/gmailAPI';
import { Loader, Check, AlertTriangle } from 'lucide-react';

export default function GoogleCallback() {
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [error, setError] = useState(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Check for error in URL
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get('error');
      
      if (urlError) {
        throw new Error(urlError === 'access_denied' ? 'Access was denied' : urlError);
      }

      // Handle the OAuth callback
      await GmailAPI.handleAuthCallback();
      
      setStatus('success');
      
      // Redirect back to app after short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      
    } catch (err) {
      console.error('Auth callback error:', err);
      setStatus('error');
      setError(err.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f1117',
      color: '#e4e5eb',
    }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        {status === 'processing' && (
          <>
            <Loader size={48} style={{ marginBottom: 24, color: '#f59e0b', animation: 'spin 1s linear infinite' }} />
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Connecting Gmail...</h2>
            <p style={{ color: '#8b8fa3' }}>Please wait while we complete the connection.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(16,185,129,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <Check size={32} color="#10b981" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Gmail Connected!</h2>
            <p style={{ color: '#8b8fa3' }}>Redirecting you back to DealFlow Pro...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(220,38,38,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <AlertTriangle size={32} color="#dc2626" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Connection Failed</h2>
            <p style={{ color: '#8b8fa3', marginBottom: 24 }}>{error || 'Something went wrong'}</p>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '12px 24px',
                background: '#f59e0b',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back to DealFlow Pro
            </button>
          </>
        )}
      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
