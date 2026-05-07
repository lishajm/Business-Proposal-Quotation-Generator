import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Admin emails that are allowed to login via this page
const ADMIN_EMAILS = ['admin@gmail.com'];

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await apiLogin({ ...form, role: 'admin' });
      login(data.token, data.user);
      toast.success(`Welcome, ${data.user.name}!`);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  const focusStyle = (e) => {
    e.target.style.borderColor = 'rgba(159,122,234,0.8)';
    e.target.style.background = 'rgba(255,255,255,0.1)';
  };
  const blurStyle = (e) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.18)';
    e.target.style.background = 'rgba(255,255,255,0.07)';
  };

  return (
    <div style={styles.page}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />

      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={styles.logoText}>BPQG Admin</span>
        </div>

        <div style={styles.adminBadge}>
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="10" cy="10" r="9" stroke="rgba(159,122,234,0.8)" strokeWidth="1.5"/>
            <path d="M10 6v5l3 2" stroke="rgba(159,122,234,0.8)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Restricted Access — Admins Only
        </div>

        <h1 style={styles.title}>Admin Portal</h1>
        <p style={styles.subtitle}>Sign in with your admin credentials</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldWrap}>
            <label style={styles.label}>Admin Email</label>
            <div style={styles.inputWrap}>
              <svg style={styles.inputIcon} viewBox="0 0 20 20" fill="none">
                <path d="M2 5l8 5 8-5M2 5h16v12H2V5z" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={styles.input}
                placeholder="Admin email address"
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>
          </div>

          <div style={styles.fieldWrap}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrap}>
              <svg style={styles.inputIcon} viewBox="0 0 20 20" fill="none">
                <rect x="3" y="9" width="14" height="10" rx="2" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
                <path d="M7 9V6a3 3 0 016 0v3" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={styles.input}
                placeholder="Enter password"
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
                  <path d="M1 10s3.6-7 9-7 9 7 9 7-3.6 7-9 7-9-7-9-7z" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5"/>
                  <circle cx="10" cy="10" r="3" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5"/>
                </svg>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.btn, opacity: loading ? 0.75 : 1, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 6 }}
            onMouseEnter={e => { if (!loading) { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 10px 30px rgba(159,122,234,0.55)'; }}}
            onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 18px rgba(159,122,234,0.35)'; }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <span style={styles.spinner} /> Signing in...
              </span>
            ) : 'Admin Sign In'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes float1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(28px,-22px) scale(1.06)}}
        @keyframes float2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-22px,28px) scale(1.06)}}
        @keyframes float3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(14px,14px) scale(0.94)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        input::placeholder{color:rgba(255,255,255,0.25);}
        input{caret-color:#9f7aea;}
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0d0d1a 0%, #1a1033 50%, #2d1b69 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20, fontFamily: "'Inter', -apple-system, sans-serif",
    position: 'relative', overflow: 'hidden',
  },
  blob1: { position: 'absolute', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(159,122,234,0.22), transparent 70%)', top: '-110px', left: '-110px', animation: 'float1 9s ease-in-out infinite' },
  blob2: { position: 'absolute', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,29,149,0.3), transparent 70%)', bottom: '-90px', right: '-90px', animation: 'float2 11s ease-in-out infinite' },
  blob3: { position: 'absolute', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,0.25), transparent 70%)', top: '35%', right: '12%', animation: 'float3 13s ease-in-out infinite' },
  card: { width: '100%', maxWidth: 430, position: 'relative', zIndex: 10, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)', border: '1px solid rgba(159,122,234,0.2)', borderRadius: 24, padding: '38px 38px 34px', boxShadow: '0 28px 56px rgba(0,0,0,0.5)', animation: 'slideUp 0.5s ease forwards' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 },
  logoIcon: { width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #9f7aea, #6b46c1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(159,122,234,0.4)' },
  logoText: { fontSize: 20, fontWeight: 700, color: 'white', letterSpacing: '1px' },
  adminBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(159,122,234,0.12)', border: '1px solid rgba(159,122,234,0.3)', borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 600, color: 'rgba(196,167,255,0.9)', letterSpacing: '0.3px', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 700, color: 'white', margin: '0 0 6px' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '0 0 24px', lineHeight: 1.6 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: 7 },
  label: { fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.65)' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 14, width: 17, height: 17, pointerEvents: 'none', zIndex: 1 },
  input: { width: '100%', padding: '13px 44px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 12, color: 'white', fontSize: 14, outline: 'none', transition: 'border-color 0.25s, background 0.25s', boxSizing: 'border-box', appearance: 'none', WebkitAppearance: 'none' },
  eyeBtn: { position: 'absolute', right: 14, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
  btn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #9f7aea, #6b46c1)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 600, letterSpacing: '0.3px', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 18px rgba(159,122,234,0.35)' },
  spinner: { width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' },
};
