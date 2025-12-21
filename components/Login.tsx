
import React, { useState } from 'react';
import { User, Lock, LogIn, AlertCircle, ArrowRight, KeyRound, CheckCircle } from 'lucide-react';
import { AuthService } from '../services/authService';
import { User as UserType } from '../types';

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
    
    if (!username || !password) {
        setError('لطفا نام کاربری و رمز عبور را وارد کنید');
        return;
    }

    const user = AuthService.login(username, password);
    if (user) {
        onLogin(user);
    } else {
        setError('نام کاربری یا رمز عبور اشتباه است');
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username || !recoveryKey || !newPassword) {
        setError('لطفا تمام فیلدها را پر کنید');
        return;
    }

    const result = AuthService.recoverPassword(username, recoveryKey, newPassword);
    if (result.success) {
        setSuccess(result.message);
        setTimeout(() => {
            setIsRecoveryMode(false);
            setSuccess('');
            setError('');
            setPassword('');
        }, 3000);
    } else {
        setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
       {/* Background Elements */}
       <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-400/10 dark:bg-cyan-600/20 rounded-full blur-[100px]"></div>
       <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-600/20 rounded-full blur-[100px]"></div>

       <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-500 relative z-10">
          
          {!isRecoveryMode ? (
              <>
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-cyan-500/30 mb-4 transition-transform hover:scale-110">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">ورود به سیستم</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">سامانه جامع مدیریت سلامت شغلی</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-slate-600 dark:text-slate-300 text-xs font-bold mr-1">نام کاربری</label>
                        <div className="relative">
                            <User className="absolute right-3 top-3 w-5 h-5 text-slate-400 dark:text-slate-500" />
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3 pr-10 pl-4 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                placeholder="نام کاربری..."
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center mr-1">
                            <label className="text-slate-600 dark:text-slate-300 text-xs font-bold">رمز عبور</label>
                            <button 
                                type="button" 
                                onClick={() => { setIsRecoveryMode(true); setError(''); setSuccess(''); }}
                                className="text-cyan-600 dark:text-cyan-400 text-[10px] hover:underline"
                            >
                                فراموشی رمز عبور؟
                            </button>
                        </div>
                        <div className="relative">
                            <Lock className="absolute right-3 top-3 w-5 h-5 text-slate-400 dark:text-slate-500" />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3 pr-10 pl-4 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-900/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <LogIn className="w-5 h-5" />
                        ورود به پنل
                    </button>
                </form>
              </>
          ) : (
              <div className="animate-in slide-in-from-left-4 duration-300">
                <button 
                    onClick={() => setIsRecoveryMode(false)}
                    className="flex items-center gap-1 text-slate-500 hover:text-cyan-600 text-xs mb-6 transition-colors"
                >
                    <ArrowRight className="w-4 h-4" />
                    بازگشت به ورود
                </button>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-amber-900/20 mb-4">
                        <KeyRound className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">بازیابی رمز عبور</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">لطفا اطلاعات زیر را برای بازنشانی رمز وارد کنید</p>
                </div>

                <form onSubmit={handleRecoverySubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-slate-600 dark:text-slate-300 text-[10px] font-bold mr-1">نام کاربری</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                            placeholder="نام کاربری شما..."
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-slate-600 dark:text-slate-300 text-[10px] font-bold mr-1">کد بازیابی (Master Key)</label>
                        <input 
                            type="text" 
                            value={recoveryKey}
                            onChange={(e) => setRecoveryKey(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono text-sm"
                            placeholder="کد لایسنس یا کد مدیریت..."
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-slate-600 dark:text-slate-300 text-[10px] font-bold mr-1">رمز عبور جدید</label>
                        <input 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg text-xs flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            {success}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-900/20 transition-all"
                    >
                        بازنشانی و ثبت رمز جدید
                    </button>
                </form>
              </div>
          )}

          <div className="mt-8 text-center border-t border-slate-200 dark:border-white/5 pt-4">
              <p className="text-xs text-slate-500">نسخه ۲.۱.۰ | پشتیبانی فنی: ۰۲۱-۸۸۸۸۸۸۸۸</p>
              {isRecoveryMode && (
                  <p className="text-[9px] text-slate-400 mt-2">کد بازیابی دمو: OHS-RECOVERY-2025</p>
              )}
          </div>
       </div>
    </div>
  );
};

export default Login;
