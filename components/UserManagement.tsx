
import React, { useState, useEffect } from 'react';
import { Trash2, UserPlus, Shield, User, KeyRound, CheckCircle } from 'lucide-react';
import { AuthService } from '../services/authService';
import { User as UserType, Role } from '../types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'health_officer' as Role });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const loaded = AuthService.getUsers();
    setUsers(loaded);
  };

  const handleAddUser = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccessMsg('');

      if (!newUser.name || !newUser.username || !newUser.password) {
          setError('لطفا تمام فیلدها را پر کنید');
          return;
      }
      
      const success = AuthService.createUser(newUser);
      if (success) {
          loadUsers();
          setNewUser({ name: '', username: '', password: '', role: 'health_officer' });
          setSuccessMsg('کاربر با موفقیت ایجاد شد.');
          setTimeout(() => setSuccessMsg(''), 3000);
      } else {
          setError('نام کاربری تکراری است یا خطایی رخ داده است.');
      }
  };

  const handleDelete = (id: string) => {
      if (confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
          if (AuthService.deleteUser(id)) {
              loadUsers();
              setSuccessMsg('کاربر حذف شد.');
              setTimeout(() => setSuccessMsg(''), 3000);
          } else {
              alert('امکان حذف مدیر سیستم وجود ندارد یا کاربر یافت نشد.');
          }
      }
  };

  const handleResetPassword = (id: string, name: string) => {
      const newPass = prompt(`لطفا رمز عبور جدید برای "${name}" را وارد کنید:`);
      if (newPass) {
          if(AuthService.resetPassword(id, newPass)) {
            alert('رمز عبور با موفقیت تغییر کرد.');
          } else {
            alert('خطا در تغییر رمز عبور.');
          }
      }
  };

  const roleLabels: Record<string, string> = {
      doctor: 'پزشک طب کار',
      health_officer: 'کارشناس بهداشت',
      manager: 'مدیر',
      developer: 'توسعه‌دهنده'
  };

  const roleColors: Record<string, string> = {
      doctor: 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-500/10',
      health_officer: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10',
      manager: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10',
      developer: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10'
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Shield className="text-cyan-500 dark:text-cyan-400" />
            مدیریت کاربران سیستم
        </h2>

        <div className="grid lg:grid-cols-3 gap-8">
            {/* User List */}
            <div className="lg:col-span-2 space-y-4">
                {users.length === 0 && (
                    <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-white/10 text-slate-500">
                        کاربری یافت نشد.
                    </div>
                )}
                {users.map(u => (
                    <div key={u.id} className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/5 flex justify-between items-center shadow-sm dark:shadow-none transition-all hover:border-cyan-500/30">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                <User className="text-slate-500 dark:text-slate-400 w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">{u.name}</h4>
                                <div className="flex gap-2 text-sm mt-1">
                                    <span className="text-slate-500 dark:text-slate-400">@{u.username}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${roleColors[u.role] || 'text-slate-500 dark:text-slate-400'}`}>
                                        {roleLabels[u.role]}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleResetPassword(u.id, u.name)} 
                                className="p-2 text-amber-500 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/10 rounded-lg transition-colors"
                                title="تغییر رمز عبور"
                            >
                                <KeyRound className="w-5 h-5" />
                            </button>
                            {u.role !== 'developer' && (
                                <button 
                                    onClick={() => handleDelete(u.id)} 
                                    className="p-2 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="حذف کاربر"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add User Form */}
            <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10 h-fit shadow-xl dark:shadow-none sticky top-24">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                    افزودن کاربر جدید
                </h3>
                <form onSubmit={handleAddUser} className="space-y-4">
                    {successMsg && (
                        <div className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 p-3 rounded-lg text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> {successMsg}
                        </div>
                    )}

                    <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">نام و نام خانوادگی (نمایش در سیستم)</label>
                        <input 
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:border-emerald-500 outline-none" 
                            placeholder="مثال: دکتر علوی"
                            value={newUser.name}
                            onChange={e => setNewUser({...newUser, name: e.target.value})}
                        />
                    </div>

                    <div>
                         <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">نام کاربری (انگلیسی - جهت ورود)</label>
                         <input 
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:border-emerald-500 outline-none font-sans" 
                            placeholder="username"
                            dir="ltr"
                            value={newUser.username}
                            onChange={e => setNewUser({...newUser, username: e.target.value})}
                        />
                    </div>

                    <div>
                         <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">رمز عبور</label>
                         <input 
                            type="password"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:border-emerald-500 outline-none font-sans" 
                            placeholder="••••••"
                            dir="ltr"
                            value={newUser.password}
                            onChange={e => setNewUser({...newUser, password: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">نقش کاربری</label>
                        <select 
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:border-emerald-500 outline-none"
                            value={newUser.role}
                            onChange={e => setNewUser({...newUser, role: e.target.value as Role})}
                        >
                            <option value="health_officer">کارشناس بهداشت حرفه‌ای</option>
                            <option value="doctor">پزشک طب کار</option>
                            <option value="manager">مدیر</option>
                            <option value="developer">توسعه‌دهنده</option>
                        </select>
                    </div>

                    {error && <p className="text-red-500 dark:text-red-400 text-xs">{error}</p>}
                    
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-900/20">
                        ثبت کاربر
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
};

export default UserManagement;
