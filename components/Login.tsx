
import React, { useState } from 'react';
import { User, Lock, LogIn, AlertCircle } from 'lucide-react';
import { AuthService } from '../services/authService';
import { User as UserType } from '../types';

interface Props {
  onLogin: (user: UserType) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
       {/* Background Elements */}
       <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-400/10 dark:bg-cyan-600/20 rounded-full blur-[100px]"></div>
       <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-600/20 rounded-full blur-[100px]"></div>

       <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-500 relative z-10">
          <div className="text-center mb-8">
             <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-cyan-500/30 mb-4">
                 <Lock className="w-8 h-8 text-white" />
             </div>
             <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">ورود به سیستم</h1>
             <p className="text-slate-500 dark:text-slate-400 text-sm">سامانه جامع مدیریت سلامت شغلی</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                 <label className="text-slate-600 dark:text-slate-300 text-xs font-bold mr-1">رمز عبور</label>
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
                 <div className="bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
                     <AlertCircle className="w-4 h-4 shrink-0" />
                     {error}
                 </div>
             )}

             <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-900/20 transition-all flex items-center justify-center gap-2"
             >
                <LogIn className="w-5 h-5" />
                ورود به پنل
             </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-200 dark:border-white/5 pt-4">
              <p className="text-xs text-slate-500">نسخه ۱.۰.۰ | پشتیبانی فنی: ۰۲۱-۸۸۸۸۸۸۸۸</p>
          </div>
       </div>
    </div>
  );
};

export default Login;
