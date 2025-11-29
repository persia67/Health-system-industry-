import React, { useState } from 'react';
import { Shield, Activity, Search, Plus, LogOut, Menu } from 'lucide-react';
import { User, Worker, Role } from './types';
import Dashboard from './components/Dashboard';
import WorkerProfile from './components/WorkerProfile';
import ChatWidget from './components/ChatWidget';
import { generateId } from './utils';

// Mock Data
const INITIAL_WORKERS: Worker[] = [
  {
    id: 1,
    nationalId: '0123456789',
    name: 'علی احمدی',
    department: 'وان مذاب',
    workYears: 8,
    exams: [
      { 
        id: '101',
        date: '2025-01-15', 
        hearing: { left: 75, right: 73 }, 
        bp: '130/85', 
        spirometry: { fvc: 4.2, fev1: 2.8, interpretation: 'Obstructive' }
      },
      { 
        id: '102',
        date: '2024-07-10', 
        hearing: { left: 78, right: 76 }, 
        bp: '125/82', 
        spirometry: { fvc: 4.3, fev1: 3.0, interpretation: 'Normal' }
      }
    ]
  },
  {
    id: 2,
    nationalId: '9876543210',
    name: 'مریم کریمی',
    department: 'کنترل کیفیت',
    workYears: 4,
    exams: [
      { 
        id: '201',
        date: '2025-01-20', 
        hearing: { left: 98, right: 97 }, 
        bp: '115/75',
        spirometry: { fvc: 3.8, fev1: 3.2, interpretation: 'Normal' }
      }
    ]
  }
];

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'search' | 'newExam'>('dashboard');
  const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  // New Exam Form State
  const [newExamData, setNewExamData] = useState({
      nationalId: '',
      bpSys: '',
      bpDia: '',
      hearLeft: '',
      hearRight: '',
      fvc: '',
      fev1: ''
  });

  const handleLogin = (role: Role) => {
    setUser({ 
      role, 
      name: role === 'doctor' ? 'دکتر علوی' : 'مهندس راد' 
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const worker = workers.find(w => w.nationalId === searchQuery);
    if (worker) {
      setSelectedWorker(worker);
    } else {
      alert('کارگری با این کد ملی یافت نشد.');
    }
  };

  const handleSaveExam = () => {
      // Basic validation
      if (!newExamData.nationalId) return alert("کد ملی الزامی است");
      
      const workerIndex = workers.findIndex(w => w.nationalId === newExamData.nationalId);
      
      if (workerIndex === -1) {
          alert("کارگر یافت نشد. لطفا ابتدا پرونده پرسنلی تشکیل دهید.");
          return;
      }

      const newExam = {
          id: generateId(),
          date: new Date().toISOString().split('T')[0],
          hearing: {
              left: Number(newExamData.hearLeft) || 0,
              right: Number(newExamData.hearRight) || 0
          },
          bp: `${newExamData.bpSys}/${newExamData.bpDia}`,
          spirometry: {
              fvc: Number(newExamData.fvc) || 0,
              fev1: Number(newExamData.fev1) || 0,
              interpretation: 'Normal' // Simplification for demo
          }
      };

      const updatedWorkers = [...workers];
      // Type assertion safe here as we checked index
      const updatedWorker = { ...updatedWorkers[workerIndex] };
      updatedWorker.exams = [newExam as any, ...updatedWorker.exams]; // Typescript casting for demo simplicity
      updatedWorkers[workerIndex] = updatedWorker;

      setWorkers(updatedWorkers);
      alert("معاینه با موفقیت ثبت شد");
      setNewExamData({ nationalId: '', bpSys: '', bpDia: '', hearLeft: '', hearRight: '', fvc: '', fev1: '' });
      setActiveTab('dashboard');
  };

  // Login Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>
        
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-12 max-w-md w-full border border-white/10 shadow-2xl z-10">
          <div className="text-center mb-10">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">سیستم سلامت شغلی</h1>
            <p className="text-slate-400">لطفا نقش کاربری خود را انتخاب کنید</p>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => handleLogin('doctor')}
              className="group w-full bg-slate-700 hover:bg-slate-600 border border-white/5 hover:border-cyan-500/50 text-white p-4 rounded-xl font-bold transition-all flex items-center justify-between"
            >
              <span>ورود پزشک طب کار</span>
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                 <Activity className="w-4 h-4" />
              </div>
            </button>
            <button
              onClick={() => handleLogin('health_officer')}
              className="group w-full bg-slate-700 hover:bg-slate-600 border border-white/5 hover:border-purple-500/50 text-white p-4 rounded-xl font-bold transition-all flex items-center justify-between"
            >
              <span>ورود مسئول بهداشت</span>
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                 <Shield className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans" dir="rtl">
      {/* Navigation */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">سیستم مدیریت سلامت شغلی</h1>
              <p className="text-cyan-400 text-xs mt-0.5 font-mono">{user.name}</p>
            </div>
          </div>
          <button
            onClick={() => setUser(null)}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            خروج
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 pb-32">
        {/* Tabs */}
        {!selectedWorker && (
          <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            {[
              { id: 'dashboard', label: 'داشبورد', icon: Activity },
              { id: 'search', label: 'جستجوی پرونده', icon: Search },
              { id: 'newExam', label: 'معاینه جدید', icon: Plus },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/20 scale-105'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* View Logic */}
        {selectedWorker ? (
          <WorkerProfile worker={selectedWorker} onBack={() => setSelectedWorker(null)} />
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard workers={workers} />}
            
            {activeTab === 'search' && (
              <div className="max-w-2xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-10 border border-white/10 text-center">
                  <div className="bg-slate-700/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">جستجوی پرونده پزشکی</h2>
                  <p className="text-slate-400 mb-8">برای مشاهده سوابق و تحلیل سلامت، کد ملی پرسنل را وارد کنید</p>
                  
                  <form onSubmit={handleSearch} className="flex gap-3 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="کد ملی (مثال: 0123456789)"
                      className="flex-1 bg-slate-900/80 border border-white/20 rounded-xl px-6 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-center tracking-widest"
                    />
                    <button
                      type="submit"
                      className="bg-cyan-500 hover:bg-cyan-400 text-white px-8 py-4 rounded-xl font-bold transition-colors shadow-lg shadow-cyan-900/20"
                    >
                      جستجو
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'newExam' && (
              <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                    <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/10">
                        <div className="bg-emerald-500/20 p-3 rounded-xl">
                            <Plus className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">ثبت معاینه ادواری جدید</h2>
                            <p className="text-slate-400 text-sm">لطفا اطلاعات را با دقت وارد کنید. تحلیل‌ها بصورت خودکار انجام می‌شوند.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                             <label className="block text-slate-400 text-sm mb-2">کد ملی پرسنل</label>
                             <input 
                                type="text" 
                                className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none"
                                placeholder="کد ملی را وارد کنید..."
                                value={newExamData.nationalId}
                                onChange={e => setNewExamData({...newExamData, nationalId: e.target.value})}
                             />
                        </div>

                        {/* Cardiovascular */}
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                قلبی - عروقی
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">فشار سیستول</label>
                                    <input type="number" className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white" 
                                      value={newExamData.bpSys} onChange={e => setNewExamData({...newExamData, bpSys: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">فشار دیاستول</label>
                                    <input type="number" className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white" 
                                      value={newExamData.bpDia} onChange={e => setNewExamData({...newExamData, bpDia: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Audiometry */}
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                شنوایی سنجی (Avg dB)
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">گوش چپ</label>
                                    <input type="number" className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white" 
                                      value={newExamData.hearLeft} onChange={e => setNewExamData({...newExamData, hearLeft: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">گوش راست</label>
                                    <input type="number" className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white" 
                                      value={newExamData.hearRight} onChange={e => setNewExamData({...newExamData, hearRight: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Spirometry */}
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5 md:col-span-2">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                اسپیرومتری
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">FVC (Liters)</label>
                                    <input type="number" className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white" 
                                      value={newExamData.fvc} onChange={e => setNewExamData({...newExamData, fvc: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">FEV1 (Liters)</label>
                                    <input type="number" className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white" 
                                      value={newExamData.fev1} onChange={e => setNewExamData({...newExamData, fev1: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleSaveExam}
                        className="w-full mt-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.01]"
                    >
                        ثبت نهایی و تحلیل داده‌ها
                    </button>
                 </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default App;