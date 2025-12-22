
import React, { useState, useEffect } from 'react';
import { Trash2, UserPlus, Shield, User, KeyRound, CheckCircle, Edit, Save, X } from 'lucide-react';
import { AuthService } from '../services/authService';
import { User as UserType, Role } from '../types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'health_officer' as Role });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const loaded = AuthService.getUsers();
    setUsers(loaded);
  };

  const resetForm = () => {
      setFormData({ name: '', username: '', password: '', role: 'health_officer' });
      setEditingUserId(null);
      setError('');
  };

  const handleEditClick = (user: UserType) => {
      setEditingUserId(user.id);
      setFormData({
          name: user.name,
          username: user.username,
          password: '', // Password placeholder, empty means no change
          role: user.role
      });
      setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccessMsg('');

      if (!formData.name || !formData.username) {
          setError('لطفا نام و نام کاربری را وارد کنید');
          return;
      }

      if (editingUserId) {
          // Update Mode
          const updates: Partial<UserType> = {
              name: formData.name,
              username: formData.username,
              role: formData.role
          };
          if (formData.password) {
              updates.password = formData.password;
          }

          if (AuthService.updateUser(editingUserId, updates)) {
              loadUsers();
              resetForm();
              setSuccessMsg('کاربر با موفقیت ویرایش شد.');
              setTimeout(() => setSuccessMsg(''), 3000);
          } else {
              setError('نام کاربری تکراری است یا خطایی رخ داده است.');
          }

      } else {
          // Create Mode
          if (!formData.password) {
              setError('رمز عبور برای کاربر جدید الزامی است');
              return;
          }
          const success = AuthService.createUser(formData);
          if (success) {
              loadUsers();
              resetForm();
              setSuccessMsg('کاربر با موفقیت ایجاد شد.');
              setTimeout(() => setSuccessMsg(''), 3000);
          } else {
              setError('نام کاربری تکراری است یا خطایی رخ داده است.');
          }
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
                    <div key={u.id} className={`bg-white dark:bg-slate-800/50 p-4 rounded-xl border flex justify-between items-center shadow-sm dark:shadow-none transition-all ${editingUserId === u.id ? 'border-cyan-500 ring-1 ring-cyan-500' : 'border-slate-200 dark:border-white/5 hover:border-cyan-500/30'}`}>
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
                                onClick={() => handleEditClick(u)} 
                                className="p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                title="ویرایش"
                            >
                                <Edit className="w-5 h-5" />
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

            {/* Add/Edit User Form */}
            <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10 h-fit shadow-xl dark:shadow-none sticky top-24">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {editingUserId ? <Edit className="w-5 h-5 text-blue-500" /> : <UserPlus className="w-5 h-5 text-emerald-500" />}
                        {editingUserId ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}
                    </h3>
                    {editingUserId && (
                        <button onClick={resetForm} className="text-xs text-slate-500 flex items-center gap-1 hover:text-slate-800 dark:hover:text-white">
                            <X className="w-3 h-3" /> انصراف
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>

                    <div>
                         <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">نام کاربری (انگلیسی - جهت ورود)</label>
                         <input 
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:border-emerald-500 outline-none font-sans" 
                            placeholder="username"
                            dir="ltr"
                            value={formData.username}
                            onChange={e => setFormData({...formData, username: e.target.value})}
                        />
                    </div>

                    <div>
                         <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                            {editingUserId ? 'رمز عبور جدید (خالی بگذارید تا تغییر نکند)' : 'رمز عبور'}
                         </label>
                         <input 
                            type="password"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:border-emerald-500 outline-none font-sans" 
                            placeholder={editingUserId ? "بدون تغییر" : "••••••"}
                            dir="ltr"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">نقش کاربری</label>
                        <select 
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:border-emerald-500 outline-none"
                            value={formData.role}
                            onChange={e => setFormData({...formData, role: e.target.value as Role})}
                        >
                            <option value="health_officer">کارشناس بهداشت حرفه‌ای</option>
                            <option value="doctor">پزشک طب کار</option>
                            <option value="manager">مدیر</option>
                            <option value="developer">توسعه‌دهنده</option>
                        </select>
                    </div>

                    {error && <p className="text-red-500 dark:text-red-400 text-xs">{error}</p>}
                    
                    <button type="submit" className={`w-full font-bold py-3 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 ${editingUserId ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'} text-white`}>
                        {editingUserId ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        {editingUserId ? 'ذخیره تغییرات' : 'ثبت کاربر'}
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
};

export default UserManagement;
