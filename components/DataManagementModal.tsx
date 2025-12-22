
import React, { useState, useRef } from 'react';
import { X, Upload, Download, RefreshCw, Database, CheckCircle, AlertTriangle, FileJson, Server, FileSpreadsheet, History, Trash2, RotateCcw } from 'lucide-react';
import { Worker } from '../types';
import { StorageService } from '../services/storageService';
import { SyncService } from '../services/syncService';
import { toJalali } from '../utils';
import * as XLSX from 'xlsx';

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
  const historyInputRef = useRef<HTMLInputElement>(null);

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

  const handleImportHistory = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const data = event.target?.result;
              const workbook = XLSX.read(data, { type: 'binary' });
              const sheetName = workbook.SheetNames[0];
              const sheet = workbook.Sheets[sheetName];
              const json: any[] = XLSX.utils.sheet_to_json(sheet);
              
              if (json.length === 0) {
                  setMsg({ type: 'error', text: 'فایل خالی است.' });
                  return;
              }

              // Emit event for parent to handle complex logic
              const customEvent = new CustomEvent('import-history', { detail: json });
              window.dispatchEvent(customEvent);
              
              setMsg({ type: 'success', text: 'فایل سوابق ارسال شد. در حال پردازش...' });
          } catch (error) {
              console.error(error);
              setMsg({ type: 'error', text: 'خطا در خواندن فایل اکسل.' });
          }
      };
      reader.readAsBinaryString(file);
      if (historyInputRef.current) historyInputRef.current.value = '';
  };

  const handleClearHistory = () => {
    if (confirm('آیا اطمینان دارید؟ تمام داده‌های وارد شده از طریق "سوابق معاینات" حذف خواهند شد.')) {
        // Filter out workers created by history import (IDs starting with TEMP-)
        // And filter out exams created by history import (IDs starting with HIST-)
        const cleanedWorkers = workers.filter(w => !String(w.nationalId).startsWith('TEMP-')).map(w => ({
            ...w,
            exams: w.exams.filter(e => !e.id.startsWith('HIST-'))
        }));
        
        onUpdateWorkers(cleanedWorkers);
        setMsg({ type: 'success', text: 'داده‌های سوابق وارد شده با موفقیت حذف شدند.' });
    }
  };

  const handleFactoryReset = () => {
      if (confirm('هشدار جدی: آیا از بازنشانی کامل نرم‌افزار اطمینان دارید؟\n\nتمام پرونده‌ها و اطلاعات پرسنل حذف شده و به حالت اولیه برمی‌گردد. این عملیات غیرقابل بازگشت است.')) {
          const defaultData = StorageService.factoryReset();
          onUpdateWorkers(defaultData);
          setMsg({ type: 'success', text: 'نرم‌افزار با موفقیت ریست شد.' });
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Database className="text-cyan-500 dark:text-cyan-400" />
                    مدیریت داده‌ها و همگام‌سازی
                </h3>
                <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 space-y-8">
                {msg && (
                    <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20'}`}>
                        {msg.type === 'success' ? <CheckCircle className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
                        {msg.text}
                    </div>
                )}

                {/* Import Historical Data */}
                <div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                        <History className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                        ورود سوابق معاینات (فایل اکسل)
                    </h4>
                    <label className="bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-blue-300 p-4 rounded-xl flex items-center justify-between cursor-pointer transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg group-hover:scale-110 transition-transform">
                                <FileSpreadsheet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="text-sm">
                                <div className="font-bold">انتخاب فایل اکسل سوابق (1403)</div>
                                <div className="text-xs opacity-70">فرمت ستون‌ها: نام، فشارخون، پوست (n/an) و...</div>
                            </div>
                        </div>
                        <input 
                            type="file" 
                            accept=".xlsx, .xls" 
                            className="hidden" 
                            ref={historyInputRef}
                            onChange={handleImportHistory}
                        />
                        <Upload className="w-5 h-5 opacity-50 group-hover:opacity-100" />
                    </label>
                </div>

                <div className="h-px bg-slate-200 dark:bg-white/10"></div>

                {/* Local Backup Section */}
                <div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                        <FileJson className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        پشتیبان‌گیری محلی (فایل JSON)
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={handleBackup}
                            className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white p-4 rounded-xl flex flex-col items-center gap-2 transition-all"
                        >
                            <Download className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                            <span className="text-sm">دانلود بکاپ</span>
                        </button>
                        <label className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white p-4 rounded-xl flex flex-col items-center gap-2 transition-all cursor-pointer">
                            <Upload className="w-6 h-6 text-blue-500 dark:text-blue-400" />
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
                </div>
                
                <div className="h-px bg-slate-200 dark:bg-white/10"></div>
                
                {/* Danger Zone */}
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
                     <h4 className="text-sm font-bold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        منطقه خطر (حذف و بازنشانی)
                    </h4>
                    <div className="flex gap-3">
                         <button 
                            onClick={handleClearHistory}
                            className="flex-1 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                            title="حذف فقط داده‌های فایل اکسل اخیر"
                        >
                            <Trash2 className="w-4 h-4" />
                            حذف سوابق (Excel)
                        </button>
                        <button 
                            onClick={handleFactoryReset}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                            title="حذف تمام اطلاعات و بازگشت به تنظیمات کارخانه"
                        >
                            <RotateCcw className="w-4 h-4" />
                            ریست کامل نرم‌افزار
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DataManagementModal;
