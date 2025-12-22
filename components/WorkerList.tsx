
import React, { useState } from 'react';
import { Search, Filter, FileText, User, Users, Edit, X, Save, CheckCircle2, Stethoscope, Clock, AlertCircle, PlusCircle, ArrowUpDown, Download, FileSpreadsheet } from 'lucide-react';
import { Worker, ReferralStatus } from '../types';
import { StorageService } from '../services/storageService';

interface Props {
  workers: Worker[];
  onSelectWorker: (worker: Worker) => void;
  onUpdateWorker: (id: number, updatedData: Partial<Worker>) => void;
  onStartExam?: (worker: Worker) => void;
}

type SortField = 'name' | 'department' | 'personnelCode' | 'none';

const WorkerList: React.FC<Props> = ({ workers, onSelectWorker, onUpdateWorker, onStartExam }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ReferralStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [tempData, setTempData] = useState({ name: '', department: '', workYears: 0, personnelCode: '' });

  // Filtering Logic
  const filteredWorkers = workers.filter(w => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = w.name.toLowerCase().includes(term) || w.nationalId.includes(term) || (w.personnelCode && w.personnelCode.includes(term));
    const matchesStatus = filterStatus === 'all' || w.referralStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Sorting Logic
  const sortedWorkers = [...filteredWorkers].sort((a, b) => {
      if (sortField === 'none') return 0;

      let valA = '';
      let valB = '';

      if (sortField === 'name') {
          valA = a.name;
          valB = b.name;
      } else if (sortField === 'department') {
          valA = a.department;
          valB = b.department;
      } else if (sortField === 'personnelCode') {
          valA = a.personnelCode || '';
          valB = b.personnelCode || '';
      }

      return sortDirection === 'asc' ? valA.localeCompare(valB, 'fa') : valB.localeCompare(valA, 'fa');
  });

  const handleSort = (field: SortField) => {
      if (sortField === field) {
          // Toggle direction
          setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
          setSortField(field);
          setSortDirection('asc');
      }
  };

  const handleEditClick = (e: React.MouseEvent, worker: Worker) => {
    e.stopPropagation();
    setEditingWorker(worker);
    setTempData({
        name: worker.name,
        department: worker.department,
        workYears: worker.workYears,
        personnelCode: worker.personnelCode || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingWorker) {
        onUpdateWorker(editingWorker.id, {
            name: tempData.name,
            department: tempData.department,
            workYears: tempData.workYears,
            personnelCode: tempData.personnelCode
        });
        setIsEditModalOpen(false);
        setEditingWorker(null);
    }
  };

  const handleExportExcel = () => {
      StorageService.exportToExcel(sortedWorkers);
  };

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
      none: { 
          label: 'نرمال', 
          color: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
          icon: CheckCircle2
      },
      waiting_for_doctor: { 
          label: 'منتظر معاینه پزشک', 
          color: 'bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20',
          icon: Stethoscope
      },
      pending_specialist_result: { 
          label: 'منتظر نتیجه متخصص', 
          color: 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
          icon: Clock
      }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Internal Edit Modal */}
        {isEditModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Edit className="w-5 h-5 text-blue-500" />
                            ویرایش اطلاعات پرسنل
                        </h3>
                        <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">نام و نام خانوادگی</label>
                            <input 
                                type="text" 
                                value={tempData.name} 
                                onChange={(e) => setTempData({...tempData, name: e.target.value})} 
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">کد پرسنلی</label>
                            <input 
                                type="text" 
                                value={tempData.personnelCode} 
                                onChange={(e) => setTempData({...tempData, personnelCode: e.target.value})} 
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">واحد سازمانی</label>
                            <input 
                                type="text" 
                                value={tempData.department} 
                                onChange={(e) => setTempData({...tempData, department: e.target.value})} 
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">سابقه کار (سال)</label>
                            <input 
                                type="number" 
                                value={tempData.workYears} 
                                onChange={(e) => setTempData({...tempData, workYears: Number(e.target.value)})} 
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button 
                            onClick={() => setIsEditModalOpen(false)} 
                            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition-colors"
                        >
                            انصراف
                        </button>
                        <button 
                            onClick={handleSaveEdit}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            ذخیره تغییرات
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Header & Filters */}
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10 mb-6 shadow-sm dark:shadow-none">
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-500" />
                    لیست جامع پرسنل
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded-full">{sortedWorkers.length} نفر</span>
                </h2>
                
                <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto items-center">
                    {/* Sort Controls */}
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                        <button 
                            onClick={() => handleSort('name')} 
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${sortField === 'name' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                        >
                            نام {sortField === 'name' && <ArrowUpDown className="w-3 h-3" />}
                        </button>
                        <button 
                            onClick={() => handleSort('personnelCode')} 
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${sortField === 'personnelCode' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                        >
                            کد پرسنلی {sortField === 'personnelCode' && <ArrowUpDown className="w-3 h-3" />}
                        </button>
                        <button 
                            onClick={() => handleSort('department')} 
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${sortField === 'department' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                        >
                            واحد {sortField === 'department' && <ArrowUpDown className="w-3 h-3" />}
                        </button>
                    </div>

                    <div className="w-px h-8 bg-slate-200 dark:bg-white/10 hidden md:block"></div>

                    <div className="relative w-full md:w-auto">
                        <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="جستجو نام، کد ملی، کد پرسنلی..." 
                            className="w-full md:w-64 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="relative w-full md:w-auto">
                        <Filter className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                        <select 
                            className="w-full md:w-40 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white appearance-none cursor-pointer"
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value as ReferralStatus | 'all')}
                        >
                            <option value="all">همه وضعیت‌ها</option>
                            <option value="none">نرمال</option>
                            <option value="waiting_for_doctor">منتظر معاینه</option>
                            <option value="pending_specialist_result">منتظر متخصص</option>
                        </select>
                    </div>

                    <button 
                        onClick={handleExportExcel}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        خروجی اکسل
                    </button>
                </div>
            </div>
        </div>

        {/* List */}
        <div className="grid gap-4">
            {sortedWorkers.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-white/10">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    موردی یافت نشد.
                </div>
            ) : (
                sortedWorkers.map(worker => {
                    const config = statusConfig[worker.referralStatus] || statusConfig.none;
                    const StatusIcon = config.icon;
                    
                    return (
                        <div key={worker.id} className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-blue-500/30 transition-all shadow-sm dark:shadow-none group">
                            <div className="flex items-center gap-4 flex-1 w-full text-right">
                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center shrink-0">
                                    <User className="w-6 h-6 text-slate-500 dark:text-slate-300" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">{worker.name}</h4>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-1 text-slate-500 dark:text-slate-400">
                                        <span>کد ملی: <span className="font-mono">{worker.nationalId}</span></span>
                                        <span className="hidden md:inline text-slate-300 dark:text-slate-600">|</span>
                                        {worker.personnelCode && (
                                            <>
                                                <span>کد پرسنلی: <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{worker.personnelCode}</span></span>
                                                <span className="hidden md:inline text-slate-300 dark:text-slate-600">|</span>
                                            </>
                                        )}
                                        <span>واحد: {worker.department}</span>
                                        <span className="hidden md:inline text-slate-300 dark:text-slate-600">|</span>
                                        <span>سابقه: {worker.workYears} سال</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-row-reverse md:flex-row items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 dark:border-white/5 pt-3 md:pt-0">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${config.color} transition-all`}>
                                    <StatusIcon className="w-3.5 h-3.5" />
                                    <span>{config.label}</span>
                                </div>
                                
                                <div className="flex gap-2">
                                    {onStartExam && (
                                        <button 
                                            onClick={() => onStartExam(worker)}
                                            className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg transition-colors flex items-center gap-2"
                                            title="شروع معاینه"
                                        >
                                            <PlusCircle className="w-4 h-4" />
                                            <span className="text-sm font-bold hidden lg:inline">معاینه</span>
                                        </button>
                                    )}
                                    <button 
                                        onClick={(e) => handleEditClick(e, worker)}
                                        className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                                        title="ویرایش اطلاعات پایه"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => onSelectWorker(worker)}
                                        className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                                    >
                                        <FileText className="w-4 h-4" />
                                        پرونده
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
  );
};

export default WorkerList;
