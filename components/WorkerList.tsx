
import React, { useState } from 'react';
import { Search, Filter, FileText, User, Users } from 'lucide-react';
import { Worker, ReferralStatus } from '../types';

interface Props {
  workers: Worker[];
  onSelectWorker: (worker: Worker) => void;
}

const WorkerList: React.FC<Props> = ({ workers, onSelectWorker }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ReferralStatus | 'all'>('all');

  const filteredWorkers = workers.filter(w => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = w.name.toLowerCase().includes(term) || w.nationalId.includes(term);
    const matchesStatus = filterStatus === 'all' || w.referralStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusLabels: Record<string, string> = {
      none: 'نرمال',
      waiting_for_doctor: 'منتظر معاینه پزشک',
      pending_specialist_result: 'منتظر نتیجه متخصص'
  };

  const statusStyles: Record<string, string> = {
      none: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
      waiting_for_doctor: 'bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20',
      pending_specialist_result: 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20'
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header & Filters */}
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10 mb-6 shadow-sm dark:shadow-none">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-500" />
                    لیست جامع پرسنل
                </h2>
                
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="جستجو نام یا کد ملی..." 
                            className="w-full md:w-64 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="relative">
                        <Filter className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                        <select 
                            className="w-full md:w-48 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white appearance-none cursor-pointer"
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value as any)}
                        >
                            <option value="all">همه وضعیت‌ها</option>
                            <option value="none">نرمال</option>
                            <option value="waiting_for_doctor">منتظر معاینه پزشک</option>
                            <option value="pending_specialist_result">منتظر نتیجه متخصص</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        {/* List */}
        <div className="grid gap-4">
            {filteredWorkers.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-white/10">
                    موردی یافت نشد.
                </div>
            ) : (
                filteredWorkers.map(worker => (
                    <div key={worker.id} className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-blue-500/30 transition-all shadow-sm dark:shadow-none">
                        <div className="flex items-center gap-4 flex-1 w-full">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center shrink-0">
                                <User className="w-6 h-6 text-slate-500 dark:text-slate-300" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-900 dark:text-white text-lg">{worker.name}</h4>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-1 text-slate-500 dark:text-slate-400">
                                    <span>کد ملی: <span className="font-mono">{worker.nationalId}</span></span>
                                    <span className="hidden md:inline text-slate-300 dark:text-slate-600">|</span>
                                    <span>واحد: {worker.department}</span>
                                    <span className="hidden md:inline text-slate-300 dark:text-slate-600">|</span>
                                    <span>سابقه: {worker.workYears} سال</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-row-reverse md:flex-row items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 dark:border-white/5 pt-3 md:pt-0">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${statusStyles[worker.referralStatus] || 'bg-slate-100 text-slate-600'}`}>
                                {statusLabels[worker.referralStatus] || worker.referralStatus}
                            </span>
                            <button 
                                onClick={() => onSelectWorker(worker)}
                                className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                            >
                                <FileText className="w-4 h-4" />
                                پرونده
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );
};

export default WorkerList;
