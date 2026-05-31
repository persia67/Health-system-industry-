
import React, { useState } from 'react';
import { User, Lock, LogIn, AlertCircle, ArrowRight, KeyRound, CheckCircle } from './Icons';
import { AuthService } from '../services/authService';
import { User as UserType } from '../types';
import { theme, baseStyles } from '../styles';

interface Props {
  onLogin: (user: UserType) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('لطفا نام کاربری و رمز عبور را وارد کنید'); return; }
    const user = AuthService.login(username, password);
    if (user) onLogin(user); else setError('نام کاربری یا رمز عبور اشتباه است');
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!username || !recoveryKey || !newPassword) { setError('لطفا تمام فیلدها را پر کنید'); return; }
    const result = AuthService.recoverPassword(username, recoveryKey, newPassword);
    if (result.success) {
        setSuccess(result.message);
        setTimeout(() => { setIsRecoveryMode(false); setSuccess(''); setError(''); setPassword(''); }, 3000);
    } else setError(result.message);
  };

  const containerStyle: React.CSSProperties = {
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      padding: '1rem', direction: 'rtl'
  };

  const cardStyle: React.CSSProperties = {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: '2.5rem', borderRadius: theme.borderRadius.xxl,
      boxShadow: theme.shadows.lg, width: '100%', maxWidth: '400px',
      border: `1px solid ${theme.colors.slate200}`
  };

  const inputGroupStyle: React.CSSProperties = { marginBottom: '1.5rem', position: 'relative' };
  const iconStyle: React.CSSProperties = { position: 'absolute', top: '12px', right: '12px', color: theme.colors.slate400, width: '20px' };
  const inputStyle: React.CSSProperties = {
      width: '100%', padding: '0.8rem 2.5rem 0.8rem 1rem', borderRadius: theme.borderRadius.lg,
      border: `1px solid ${theme.colors.slate300}`, outline: 'none', fontSize: '0.95rem'
  };

  return (
    <div style={containerStyle}>
       <div style={cardStyle}>
          {!isRecoveryMode ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: '64px', height: '64px', background: theme.colors.blue500, borderRadius: '16px', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <Lock style={{ width: '32px', height: '32px' }} />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: theme.colors.slate900 }}>ورود به سیستم</h1>
                </div>

                <form onSubmit={handleLoginSubmit}>
                    <div style={inputGroupStyle}>
                        <User style={iconStyle} />
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} placeholder="نام کاربری..." />
                    </div>
                    <div style={inputGroupStyle}>
                        <Lock style={iconStyle} />
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />
                        <button type="button" onClick={() => { setIsRecoveryMode(true); setError(''); }} style={{ position: 'absolute', left: 0, top: '-20px', fontSize: '0.75rem', color: theme.colors.blue600, background: 'none', border: 'none' }}>فراموشی؟</button>
                    </div>
                    {error && <div style={{ color: theme.colors.red600, fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '5px' }}><AlertCircle /> {error}</div>}
                    <button type="submit" style={{ ...baseStyles.button, width: '100%', backgroundColor: theme.colors.blue600, color: '#fff' }}>
                        <LogIn /> ورود به پنل
                    </button>
                </form>
              </>
          ) : (
              <div>
                <button onClick={() => setIsRecoveryMode(false)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: theme.colors.slate500, fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    <ArrowRight /> بازگشت
                </button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem' }}>بازیابی رمز عبور</h1>
                <form onSubmit={handleRecoverySubmit}>
                    <div style={inputGroupStyle}><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} placeholder="نام کاربری" /></div>
                    <div style={inputGroupStyle}><input type="text" value={recoveryKey} onChange={(e) => setRecoveryKey(e.target.value)} style={inputStyle} placeholder="کد بازیابی" /></div>
                    <div style={inputGroupStyle}><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} placeholder="رمز عبور جدید" /></div>
                    {error && <div style={{ color: theme.colors.red600, fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}
                    {success && <div style={{ color: theme.colors.emerald600, fontSize: '0.85rem', marginBottom: '1rem' }}>{success}</div>}
                    <button type="submit" style={{ ...baseStyles.button, width: '100%', backgroundColor: theme.colors.amber600, color: '#fff' }}>تایید</button>
                </form>
              </div>
          )}
       </div>
    </div>
  );
};

export default Login;
