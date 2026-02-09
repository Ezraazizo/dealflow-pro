import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, fullName);
        toast.success('Account created! Check your email to confirm.');
      } else {
        await signIn(email, password);
        navigate('/');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0f1117', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{
        width: 420, background: '#181a22', border: '1px solid #2a2d3e',
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid #2a2d3e', textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>DealFlow Pro</h1>
          <p style={{ fontSize: 14, color: '#8b8fa3' }}>Real Estate Pipeline Manager</p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isSignUp && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#5c5f73' }}>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={isSignUp}
                style={{
                  background: '#1e2030', border: '1px solid #2a2d3e', borderRadius: 6,
                  padding: '10px 12px', color: '#e4e5eb', fontSize: 14, outline: 'none',
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#5c5f73' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                background: '#1e2030', border: '1px solid #2a2d3e', borderRadius: 6,
                padding: '10px 12px', color: '#e4e5eb', fontSize: 14, outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#5c5f73' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                background: '#1e2030', border: '1px solid #2a2d3e', borderRadius: 6,
                padding: '10px 12px', color: '#e4e5eb', fontSize: 14, outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#f59e0b', color: '#000', border: 'none', borderRadius: 6,
              padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              opacity: loading ? 0.7 : 1, marginTop: 8,
            }}
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              style={{
                background: 'none', border: 'none', color: '#8b8fa3',
                fontSize: 13, cursor: 'pointer', textDecoration: 'underline',
              }}
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
