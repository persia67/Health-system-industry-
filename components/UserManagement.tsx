
import React, { useState, useEffect } from 'react';
import { Trash2, UserPlus, Shield, User } from 'lucide-react';
import { AuthService } from '../services/authService';
import { User as UserType, Role } from '../types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'health_officer' as Role });
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(AuthService.getUsers());
  };

  const handleAddUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUser.name || !newUser.username || !newUser.password) {
          setError('لطفا تمام فیلدها را پر کنید');
          return;
      }
      
      const success = AuthService.createUser(newUser);
      if (success) {
          loadUsers();
          setNewUser({ name: '', username: '', password: '', role: 'health_officer' });
          setError('');
      } else {
          setError('نام کاربری تکراری است');
      }
  };

  const handleDelete = (id: string) => {
      if (confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
          if (AuthService.deleteUser(id)) {
              loadUsers();
          } else {
              alert('امکان حذف مدیر سیستم وجود ندارد');
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
      doctor: 'text-cyan-400 bg-cyan-500/10',
      health_officer: 'text-emerald-400 bg-emerald-500/10',
      manager: 'text-purple-400 bg-purple-500/10',
      developer: 'text-amber-400 bg-amber-500/10'
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Shield className="text-cyan-400" />
            مدیریت کاربران سیستم
        </h2>

        <div className="grid lg:grid-cols-3 gap-8">
            {/* User List */}
            <div className="lg:col-span-2 space-y-4">
                {users.map(u => (
                    <div key={u.id} className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                                <User className="text-slate-400 w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white">{u.name}</h4>
                                <div className="flex gap-2 text-sm mt-1">
                                    <span className="text-slate-400">@{u.username}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${roleColors[u.role] || 'text-slate-400'}`}>
                                        {roleLabels[u.role]}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {u.role !== 'developer' && (
                            <button onClick={() => handleDelete(u.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Add User Form */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/10 h-fit">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-emerald-400" />
                    افزودن کاربر جدید
                </h3>
                <form onSubmit={handleAddUser} className="space-y-4">
                    <input 
                        className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white" 
                        placeholder="نام و نام خانوادگی"
                        value={newUser.name}
                        onChange={e => setNewUser({...newUser, name: e.target.value})}
                    />
                     <input 
                        className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white" 
                        placeholder="نام کاربری (انگلیسی)"
                        value={newUser.username}
                        onChange={e => setNewUser({...newUser, username: e.target.value})}
                    />
                     <input 
                        type="password"
                        className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white" 
                        placeholder="رمز عبور"
                        value={newUser.password}
                        onChange={e => setNewUser({...newUser, password: e.target.value})}
                    />
                    <div>
                        <label className="text-xs text-slate-400 mb-1 block">نقش کاربری</label>
                        <select 
                            className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white"
                            value={newUser.role}
                            onChange={e => setNewUser({...newUser, role: e.target.value as Role})}
                        >
                            <option value="health_officer">کارشناس بهداشت حرفه‌ای</option>
                            <option value="doctor">پزشک طب کار</option>
                            <option value="manager">مدیر</option>
                            <option value="developer">توسعه‌دهنده</option>
                        </select>
                    </div>

                    {error && <p className="text-red-400 text-xs">{error}</p>}
                    
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors">
                        ثبت کاربر
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
};

export default UserManagement;
