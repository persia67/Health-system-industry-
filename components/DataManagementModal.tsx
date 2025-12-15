
import React, { useState, useRef } from 'react';
import { X, Upload, Download, RefreshCw, Database, CheckCircle, AlertTriangle, FileJson, Server } from 'lucide-react';
import { Worker } from '../types';
import { StorageService } from '../services/storageService';
import { SyncService } from '../services/syncService';
import { toJalali } from '../utils';

interface Props {
  workers: Worker[];
  onUpdateWorkers: (workers: Worker[]) => void;
  onClose: () => void;
  lastSync: string | null;
  onSyncComplete: (date: string) => void;
}

const DataManagementModal: React.FC<Props> = ({ workers, onUpdateWorkers, onClose, lastSync, onSyncComplete }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = () => {
      StorageService.createBackup(workers);
      setMsg({ type: 'success', text: 'فایل پشتیبان با موفقیت دانلود شد.' });
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (confirm('آیا مطمئن هستید؟ با این کار تمام اطلاعات فعلی با اطلاعات فایل جایگزین می‌شود.')) {
          StorageService.restoreBackup(file)
            .then(data => {
                onUpdateWorkers(data);
                setMsg({ type: 'success', text: 'اطلاعات با موفقیت بازیابی شد.' });
            })
            .catch(() => {
                setMsg({ type: 'error', text: 'فایل نامعتبر است.' });
            });
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSync = async () => {
      setIsSyncing(true);
      setMsg(null);
      try {
          const result = await SyncService.syncWithServer(workers);
          if (result.success && result.timestamp) {
              onSyncComplete(result.timestamp);
              setMsg({ type: 'success', text: result.message });
          }
      } catch (e) {
          setMsg({ type: 'error', text: 'خطا در برقراری ارتباط با سرور' });
      } finally {
          setIsSyncing(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Database className="text-cyan-400" />
                    مدیریت داده‌ها و همگام‌سازی
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 space-y-8">
                {msg && (
                    <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {msg.type === 'success' ? <CheckCircle className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
                        {msg.text}
                    </div>
                )}

                {/* Server Sync Section */}
                <div>
                    <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                        <Server className="w-4 h-4 text-purple-400" />
                        وضعیت سرور مرکزی
                    </h4>
                    <div className="bg-slate-800 rounded-xl p-4 border border-white/5 flex justify-between items-center">
                        <div>
                            <div className="text-xs text-slate-400 mb-1">آخرین همگام‌سازی</div>
                            <div className="font-mono text-white text-sm">
                                {lastSync ? toJalali(lastSync) + ' ' + new Date(lastSync).toLocaleTimeString('fa-IR') : 'هرگز'}
                            </div>
                        </div>
                        <button 
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                        >
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'در حال سینک...' : 'همگام‌سازی'}
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">
                        * داده‌های وارد شده توسط پزشک به سرور واحد ایمنی و بهداشت ارسال می‌شود.
                    </p>
                </div>

                <div className="h-px bg-white/10"></div>

                {/* Local Backup Section */}
                <div>
                    <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                        <FileJson className="w-4 h-4 text-emerald-400" />
                        پشتیبان‌گیری محلی (فایل)
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={handleBackup}
                            className="bg-slate-800 hover:bg-slate-700 border border-white/10 text-white p-4 rounded-xl flex flex-col items-center gap-2 transition-all"
                        >
                            <Download className="w-6 h-6 text-emerald-400" />
                            <span className="text-sm">دانلود بکاپ</span>
                        </button>
                        <label className="bg-slate-800 hover:bg-slate-700 border border-white/10 text-white p-4 rounded-xl flex flex-col items-center gap-2 transition-all cursor-pointer">
                            <Upload className="w-6 h-6 text-blue-400" />
                            <span className="text-sm">بازیابی بکاپ</span>
                            <input 
                                type="file" 
                                accept=".json" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleRestore}
                            />
                        </label>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">
                        * در صورت قطعی شبکه، می‌توانید فایل بکاپ را به صورت دستی منتقل کنید.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DataManagementModal;
