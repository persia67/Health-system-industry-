
import React, { useState, useEffect } from 'react';
import { Building, Plus, Trash2, Key, Copy, Check, Users, Building2 } from 'lucide-react';
import { AuthService } from '../services/authService';
import { Organization } from '../types';
import { toJalali } from '../utils';

const OrganizationManagement: React.FC = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [formData, setFormData] = useState({ name: '', contactPerson: '' });
  const [showModal, setShowModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    loadOrgs();
  }, []);

  const loadOrgs = () => {
    setOrgs(AuthService.getOrganizations());
  };

  const handleAdd = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name) return;
      AuthService.addOrganization(formData);
      setFormData({ name: '', contactPerson: '' });
      setShowModal(false);
      loadOrgs();
  };

  const handleDelete = (id: string) => {
      if (confirm('آیا از حذف این سازمان و لایسنس آن اطمینان دارید؟')) {
          AuthService.deleteOrganization(id);
          loadOrgs();
      }
  };

  const handleCopy = (key: string) => {
      navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="text-amber-500" />
                    مدیریت سازمان‌ها و لایسنس
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    تولید کد فعال‌سازی برای مشتریان و شرکت‌های زیرمجموعه
                </p>
            </div>
            <button 
                onClick={() => setShowModal(true)}
                className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 flex items-center gap-2 transition-all"
            >
                <Plus className="w-5 h-5" />
                تعریف سازمان جدید
            </button>
        </div>

        {/* Create Modal */}
        {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">ثبت سازمان جدید</h3>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">نام شرکت / سازمان</label>
                            <input 
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                                placeholder="مثال: شرکت پتروشیمی الف"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">رابط / مسئول (اختیاری)</label>
                            <input 
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                                placeholder="نام مسئول..."
                                value={formData.contactPerson}
                                onChange={e => setFormData({...formData, contactPerson: e.target.value})}
                            />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold">انصراف</button>
                            <button type="submit" className="flex-[2] bg-amber-600 text-white py-3 rounded-xl font-bold">تولید لایسنس و ذخیره</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* List */}
        <div className="grid gap-4">
            {orgs.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">هنوز سازمانی تعریف نشده است.</p>
                </div>
            ) : (
                orgs.map(org => (
                    <div key={org.id} className="bg-white dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-amber-500/30 transition-all shadow-sm">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-500 shrink-0">
                                <Building className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-lg">{org.name}</h4>
                                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {org.contactPerson || '---'}</span>
                                    <span>|</span>
                                    <span>تاریخ ایجاد: {toJalali(org.createdAt)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">کد فعال‌سازی (License Key)</div>
                            <div className="flex items-center gap-2">
                                <code className="bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-lg font-mono text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 select-all">
                                    {org.licenseKey}
                                </code>
                                <button 
                                    onClick={() => handleCopy(org.licenseKey)}
                                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                                    title="کپی"
                                >
                                    {copiedKey === org.licenseKey ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                                </button>
                                <button 
                                    onClick={() => handleDelete(org.id)}
                                    className="p-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"
                                    title="حذف"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );
};

export default OrganizationManagement;
