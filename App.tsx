import React, { useState } from 'react';
import { Shield, Activity, Search, Plus, LogOut, Menu, AlertTriangle, UserPlus, X, Save, FileText, ClipboardList, Stethoscope, Microscope, CheckCircle, Eye, Wind, Ear } from 'lucide-react';
import { User, Worker, Role, Exam, MedicalHistoryItem, OrganSystemFinding, HearingData, SpirometryData, VisionData } from './types';
import Dashboard from './components/Dashboard';
import WorkerProfile from './components/WorkerProfile';
import ChatWidget from './components/ChatWidget';
import { generateId } from './utils';

// --- Constants based on the PDF ---

const MEDICAL_HISTORY_QUESTIONS = [
  "آیا سابقه بیماری دارید؟",
  "در صورت ابتلا به بیماری آیا علایم شما در محیط کار تغییر می کند؟",
  "در صورت ابتلا به بیماری آیا همکاران شما علایم مشابه در محل کار دارند؟",
  "در صورت ابتلا به بیماری آیا علایم شما در زمان تعطیلات و مرخصی‌ها تغییر می کند؟",
  "آیا به غذا، دارو یا ماده خاصی حساسیت دارید؟",
  "آیا سابقه بستری در بیمارستان دارید؟",
  "آیا سابقه عمل جراحی دارید؟",
  "آیا سابقه سرطان یا بیماری مزمن در فامیل دارید؟",
  "آیا داروی خاصی مصرف می کنید؟",
  "آیا اکنون سیگار می‌کشید؟",
  "آیا سابقه قبلی مصرف سیگار دارید؟",
  "آیا در اوقات فراغت به ورزش یا سرگرمی خاصی مشغول هستید؟",
  "آیا تاکنون به حادثه شغلی دچار شده اید؟",
  "آیا سابقه غیبت از کار به دلیل بیماری بیش از 3 روز دارید؟",
  "آیا منزل شما در مجاورت مرکز صنعتی قرار دارد؟",
  "آیا سابقه معرفی به کمیسیون پزشکی را دارید؟"
];

const ORGAN_SYSTEMS_CONFIG = {
  general: {
    label: 'عمومی',
    symptoms: ['کاهش وزن', 'کاهش اشتها', 'خستگی مزمن', 'اختلال خواب', 'تعریق زیاد', 'تب'],
    signs: ['وضعیت ظاهری (Ill/Toxic)', 'مخاطات رنگ پریده']
  },
  eyes: {
    label: 'چشم',
    symptoms: ['کاهش بینایی', 'تاری دید', 'خستگی چشم', 'دوبینی', 'سوزش/خارش'],
    signs: ['رفلکس غیرطبیعی', 'قرمزی', 'اسکلرای ایکتریک', 'نیستاگموس']
  },
  skin: {
    label: 'پوست و مو',
    symptoms: ['خارش', 'ریزش مو', 'قرمزی', 'تغییر رنگ', 'زخم مزمن'],
    signs: ['ماکول/پاپول', 'زخم', 'کهیر', 'کلابینگ', 'ریزش مو']
  },
  ent: {
    label: 'گوش، حلق و بینی',
    symptoms: ['کاهش شنوایی', 'وزوز گوش', 'سرگیجه', 'درد گوش', 'خونریزی بینی'],
    signs: ['التهاب پرده تمپان', 'پارگی پرده تمپان', 'سرومن', 'پولیپ بینی']
  },
  lungs: {
    label: 'ریه',
    symptoms: ['سرفه', 'خلط', 'تنگی نفس کوششی', 'خس خس سینه'],
    signs: ['خشونت صدا', 'ویزینگ', 'کراکل', 'تاکی پنه']
  },
  cardio: {
    label: 'قلب و عروق',
    symptoms: ['درد قفسه سینه', 'تپش قلب', 'تنگی نفس شبانه', 'سیانوز'],
    signs: ['S1/S2 غیرطبیعی', 'صدای اضافی', 'آریتمی', 'واریس', 'ادم']
  },
  digestive: {
    label: 'شکم و لگن',
    symptoms: ['تهوع/استفراغ', 'درد شکم', 'سوزش سر دل', 'اسهال/یبوست'],
    signs: ['تندرنس شکمی', 'هپاتومگالی', 'اسپلنومگالی', 'توده شکمی']
  },
  musculoskeletal: {
    label: 'اسکلتی و عضلانی',
    symptoms: ['خشکی مفصل', 'کمر درد', 'درد زانو', 'درد شانه'],
    signs: ['محدودیت حرکتی', 'کاهش قدرت عضلانی', 'اسکولیوز', 'تست SLR مثبت']
  },
  neuro: {
    label: 'سیستم عصبی',
    symptoms: ['سردرد', 'گیجی', 'لرزش', 'اختلال حافظه', 'گزگز اندام'],
    signs: ['رفلکس غیرطبیعی', 'تست رومبرگ مختل', 'ترمور']
  },
  psych: {
    label: 'اعصاب و روان',
    symptoms: ['عصبانیت', 'پرخاشگری', 'اضطراب', 'خلق پایین'],
    signs: ['هذیان', 'توهم', 'اختلال اورینتیشن']
  }
};

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
        hearing: { left: [10, 15, 20, 25, 40, 50], right: [10, 10, 15, 20, 30, 40] }, 
        bp: '130/85', 
        spirometry: { fvc: 4.2, fev1: 2.8, fev1_fvc: 66, pef: 450, interpretation: 'Obstructive' },
        vision: { 
            acuity: { right: { uncorrected: '10/10', corrected: '' }, left: { uncorrected: '9/10', corrected: '' } },
            colorVision: 'Normal', visualField: 'Normal', depthPerception: 'Normal'
        },
        medicalHistory: [],
        organSystems: {},
        labResults: {},
        finalOpinion: { status: 'fit' }
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
        hearing: { left: [5, 5, 10, 10, 10, 15], right: [5, 5, 5, 10, 10, 10] }, 
        bp: '115/75',
        spirometry: { fvc: 3.8, fev1: 3.2, fev1_fvc: 84, pef: 380, interpretation: 'Normal' },
        vision: { 
            acuity: { right: { uncorrected: '10/10', corrected: '' }, left: { uncorrected: '10/10', corrected: '' } },
            colorVision: 'Normal', visualField: 'Normal', depthPerception: 'Normal'
        },
        medicalHistory: [],
        organSystems: {},
        labResults: {},
        finalOpinion: { status: 'fit' }
      }
    ]
  }
];

// Initial Empty State
const INITIAL_NEW_EXAM_STATE: Omit<Exam, 'id' | 'date'> & { nationalId: string } = {
  nationalId: '',
  hearing: { left: [0,0,0,0,0,0], right: [0,0,0,0,0,0] }, // 250, 500, 1000, 2000, 4000, 8000 Hz
  bp: '',
  spirometry: { fvc: 0, fev1: 0, fev1_fvc: 0, pef: 0, interpretation: 'Normal' },
  vision: {
      acuity: { right: { uncorrected: '', corrected: '' }, left: { uncorrected: '', corrected: '' } },
      colorVision: 'Normal',
      visualField: 'Normal',
      depthPerception: ''
  },
  medicalHistory: MEDICAL_HISTORY_QUESTIONS.map((q, idx) => ({ id: idx, question: q, hasCondition: false, description: '' })),
  organSystems: Object.keys(ORGAN_SYSTEMS_CONFIG).reduce((acc, key) => ({
    ...acc,
    [key]: { systemName: key, symptoms: [], signs: [], description: '' }
  }), {}),
  labResults: { wbc: '', rbc: '', hb: '', plt: '', fbs: '', chol: '', tg: '', creatinine: '', alt: '', ast: '' },
  finalOpinion: { status: 'fit', conditions: '', reason: '', recommendations: '' }
};

const AUDIOMETRY_FREQUENCIES = [250, 500, 1000, 2000, 4000, 8000];

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'search' | 'newExam' | 'newWorker'>('dashboard');
  const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showEditWorkerModal, setShowEditWorkerModal] = useState(false);
  const [editWorkerData, setEditWorkerData] = useState({ name: '', department: '', workYears: 0 });

  // New Exam Form State
  const [formStep, setFormStep] = useState<1 | 2 | 3 | 4>(1); 
  const [newExamData, setNewExamData] = useState(INITIAL_NEW_EXAM_STATE);
  const [newWorkerData, setNewWorkerData] = useState({ nationalId: '', name: '', department: '', workYears: '' });

  const handleLogin = (role: Role) => setUser({ role, name: role === 'doctor' ? 'دکتر علوی' : 'مهندس راد' });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const worker = workers.find(w => w.nationalId === searchQuery);
    worker ? setSelectedWorker(worker) : alert('کارگری با این کد ملی یافت نشد.');
  };

  const handleRegisterWorker = () => {
    if (!newWorkerData.nationalId || !newWorkerData.name || !newWorkerData.department) return alert("لطفا تمام فیلدها را پر کنید.");
    if (workers.some(w => w.nationalId === newWorkerData.nationalId)) return alert("این کد ملی قبلا ثبت شده است.");
    const newWorker: Worker = {
        id: Date.now(),
        nationalId: newWorkerData.nationalId,
        name: newWorkerData.name,
        department: newWorkerData.department,
        workYears: Number(newWorkerData.workYears) || 0,
        exams: []
    };
    setWorkers(prev => [...prev, newWorker]);
    alert("پرسنل جدید با موفقیت ثبت شد.");
    setNewWorkerData({ nationalId: '', name: '', department: '', workYears: '' });
    setActiveTab('dashboard'); 
  };

  const handleInitiateSave = () => {
      if (!newExamData.nationalId) return alert("کد ملی الزامی است");
      const workerIndex = workers.findIndex(w => w.nationalId === newExamData.nationalId);
      if (workerIndex === -1) return alert("کارگر یافت نشد. لطفا ابتدا پرونده پرسنلی تشکیل دهید.");
      setShowConfirmDialog(true);
  };

  const handleConfirmSave = () => {
      const workerIndex = workers.findIndex(w => w.nationalId === newExamData.nationalId);
      if (workerIndex === -1) return;
      const newExam: Exam = {
          id: generateId(),
          date: new Date().toISOString().split('T')[0],
          ...newExamData
      };
      const updatedWorkers = [...workers];
      const updatedWorker = { ...updatedWorkers[workerIndex] };
      updatedWorker.exams = [newExam, ...updatedWorker.exams];
      updatedWorkers[workerIndex] = updatedWorker;
      setWorkers(updatedWorkers);
      setShowConfirmDialog(false);
      alert("معاینه با موفقیت ثبت شد");
      setNewExamData(INITIAL_NEW_EXAM_STATE);
      setFormStep(1);
      setActiveTab('dashboard');
  };

  const handleEditClick = () => {
    if (selectedWorker) {
        setEditWorkerData({
            name: selectedWorker.name,
            department: selectedWorker.department,
            workYears: selectedWorker.workYears
        });
        setShowEditWorkerModal(true);
    }
  };

  const handleUpdateWorker = () => {
    if (!selectedWorker) return;
    const updatedWorker = { 
        ...selectedWorker, 
        name: editWorkerData.name, 
        department: editWorkerData.department, 
        workYears: Number(editWorkerData.workYears)
    };
    setWorkers(prev => prev.map(w => w.id === selectedWorker.id ? updatedWorker : w));
    setSelectedWorker(updatedWorker);
    setShowEditWorkerModal(false);
  };

  const toggleOrganItem = (systemKey: string, type: 'symptoms' | 'signs', item: string) => {
    setNewExamData(prev => {
        const system = prev.organSystems[systemKey];
        const list = system[type];
        const newList = list.includes(item) ? list.filter(i => i !== item) : [...list, item];
        return { ...prev, organSystems: { ...prev.organSystems, [systemKey]: { ...system, [type]: newList } } };
    });
  };

  const updateHistory = (index: number, field: 'hasCondition' | 'description', value: any) => {
      setNewExamData(prev => {
          const newHistory = [...prev.medicalHistory];
          newHistory[index] = { ...newHistory[index], [field]: value };
          return { ...prev, medicalHistory: newHistory };
      });
  };

  // Audiometry Helper
  const updateAudiometry = (ear: 'left' | 'right', index: number, value: string) => {
      const numVal = Number(value) || 0;
      setNewExamData(prev => {
          const newArr = [...prev.hearing[ear]];
          newArr[index] = numVal;
          return { ...prev, hearing: { ...prev.hearing, [ear]: newArr } };
      });
  };

  if (!user) {
    // Login Screen (Simplified for brevity as it was already implemented)
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-12 max-w-md w-full border border-white/10 shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-10 text-center">سیستم سلامت شغلی</h1>
          <div className="space-y-4">
            <button onClick={() => handleLogin('doctor')} className="w-full bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-xl font-bold flex justify-between">
              <span>ورود پزشک طب کار</span><Activity/>
            </button>
            <button onClick={() => handleLogin('health_officer')} className="w-full bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-xl font-bold flex justify-between">
              <span>ورود مسئول بهداشت</span><Shield/>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans" dir="rtl">
      {/* Modals & Dialogs */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-white mb-2 text-center">تایید ثبت اطلاعات</h3>
            <div className="flex gap-3 mt-6">
                <button onClick={() => setShowConfirmDialog(false)} className="flex-1 p-2 rounded-xl bg-slate-800 text-slate-300">خیر</button>
                <button onClick={handleConfirmSave} className="flex-1 p-2 rounded-xl bg-emerald-600 text-white font-bold">بله</button>
            </div>
          </div>
        </div>
      )}
      
      {showEditWorkerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between mb-4"><h3 className="text-xl font-bold">ویرایش پرسنل</h3><X onClick={() => setShowEditWorkerModal(false)} className="cursor-pointer"/></div>
            <div className="space-y-4">
                <input value={editWorkerData.name} onChange={(e) => setEditWorkerData({...editWorkerData, name: e.target.value})} className="w-full bg-slate-800 p-3 rounded-lg text-white" placeholder="نام" />
                <input value={editWorkerData.department} onChange={(e) => setEditWorkerData({...editWorkerData, department: e.target.value})} className="w-full bg-slate-800 p-3 rounded-lg text-white" placeholder="واحد" />
                <input type="number" value={editWorkerData.workYears} onChange={(e) => setEditWorkerData({...editWorkerData, workYears: Number(e.target.value)})} className="w-full bg-slate-800 p-3 rounded-lg text-white" placeholder="سابقه" />
                <button onClick={handleUpdateWorker} className="w-full bg-cyan-600 p-3 rounded-xl font-bold text-white mt-4">ذخیره</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4"><Shield className="w-6 h-6 text-cyan-500" /><h1 className="text-xl font-bold text-white">سیستم مدیریت سلامت شغلی</h1></div>
          <button onClick={() => setUser(null)} className="flex items-center gap-2 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-sm"><LogOut className="w-4 h-4" />خروج</button>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-6 py-8 pb-32">
        {!selectedWorker && (
          <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            {[
              { id: 'dashboard', label: 'داشبورد', icon: Activity },
              { id: 'search', label: 'جستجو', icon: Search },
              { id: 'newWorker', label: 'ثبت پرسنل', icon: UserPlus },
              { id: 'newExam', label: 'معاینه جدید', icon: Plus },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <tab.icon className="w-5 h-5" />{tab.label}
              </button>
            ))}
          </div>
        )}

        {selectedWorker ? (
          <WorkerProfile worker={selectedWorker} onBack={() => setSelectedWorker(null)} onEdit={handleEditClick} />
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard workers={workers} />}
            {activeTab === 'search' && (
               <div className="max-w-2xl mx-auto mt-12 text-center bg-slate-800/50 p-10 rounded-2xl border border-white/10">
                  <Search className="w-12 h-12 text-cyan-400 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-white mb-6">جستجوی پرونده پزشکی</h2>
                  <form onSubmit={handleSearch} className="flex gap-3"><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="کد ملی..." className="flex-1 bg-slate-900 border border-white/20 rounded-xl px-6 py-4 text-white text-center" /><button type="submit" className="bg-cyan-500 px-8 py-4 rounded-xl font-bold text-white">جستجو</button></form>
               </div>
            )}
            {activeTab === 'newWorker' && (
                <div className="max-w-2xl mx-auto bg-slate-800/50 p-8 rounded-2xl border border-white/10">
                    <h2 className="text-2xl font-bold text-white mb-6">ثبت پرونده پرسنلی جدید</h2>
                    <div className="space-y-4">
                        <input type="text" className="w-full bg-slate-900 p-3 rounded-lg text-white" placeholder="نام کامل" value={newWorkerData.name} onChange={e => setNewWorkerData({...newWorkerData, name: e.target.value})}/>
                        <input type="text" className="w-full bg-slate-900 p-3 rounded-lg text-white" placeholder="کد ملی" value={newWorkerData.nationalId} onChange={e => setNewWorkerData({...newWorkerData, nationalId: e.target.value})}/>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" className="w-full bg-slate-900 p-3 rounded-lg text-white" placeholder="واحد" value={newWorkerData.department} onChange={e => setNewWorkerData({...newWorkerData, department: e.target.value})}/>
                            <input type="number" className="w-full bg-slate-900 p-3 rounded-lg text-white" placeholder="سابقه (سال)" value={newWorkerData.workYears} onChange={e => setNewWorkerData({...newWorkerData, workYears: e.target.value})}/>
                        </div>
                        <button onClick={handleRegisterWorker} className="w-full bg-blue-600 p-4 rounded-xl font-bold text-white mt-4">ایجاد پرونده</button>
                    </div>
                </div>
            )}
            {activeTab === 'newExam' && (
              <div className="max-w-5xl mx-auto bg-slate-800/50 p-8 rounded-2xl border border-white/10">
                  <div className="flex justify-between border-b border-white/10 pb-6 mb-6">
                      <div className="flex items-center gap-4"><ClipboardList className="w-8 h-8 text-emerald-400" /><h2 className="text-2xl font-bold text-white">فرم معاینات شغلی</h2></div>
                      <div className="flex gap-2">{[1, 2, 3, 4].map(s => <div key={s} className={`w-3 h-3 rounded-full ${formStep >= s ? 'bg-cyan-500' : 'bg-slate-700'}`}></div>)}</div>
                  </div>

                  {formStep === 1 && (
                      <div className="space-y-6">
                          <input type="text" className="w-full bg-slate-900 p-3 rounded-lg text-white" value={newExamData.nationalId} onChange={e => setNewExamData({...newExamData, nationalId: e.target.value})} placeholder="کد ملی پرسنل" />
                          <h3 className="font-bold text-white mb-4">سوابق پزشکی</h3>
                          <div className="border border-white/10 rounded-xl overflow-hidden">
                              <table className="w-full text-sm"><thead className="bg-slate-900"><tr><th className="p-3 text-right text-slate-300">سوال</th><th className="p-3 w-20 text-center text-slate-300">بلی/خیر</th><th className="p-3 text-right text-slate-300">توضیحات</th></tr></thead>
                              <tbody className="divide-y divide-white/5">{newExamData.medicalHistory.map((item, idx) => (
                                  <tr key={idx}><td className="p-3 text-slate-200">{item.question}</td><td className="p-3 text-center"><input type="checkbox" checked={item.hasCondition} onChange={(e) => updateHistory(idx, 'hasCondition', e.target.checked)} className="w-4 h-4"/></td><td className="p-3"><input disabled={!item.hasCondition} type="text" value={item.description} onChange={(e) => updateHistory(idx, 'description', e.target.value)} className="w-full bg-transparent border-b border-white/10 text-white" placeholder="-" /></td></tr>
                              ))}</tbody></table>
                          </div>
                      </div>
                  )}

                  {formStep === 2 && (
                      <div className="space-y-4">
                          <h3 className="font-bold text-white flex gap-2"><Stethoscope className="text-purple-400"/>بررسی سیستم‌های بدن</h3>
                          <div className="grid gap-4">{Object.entries(ORGAN_SYSTEMS_CONFIG).map(([key, config]) => {
                              const sys = newExamData.organSystems[key];
                              return (
                                  <div key={key} className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                      <h4 className="font-bold text-cyan-100 mb-2">{config.label}</h4>
                                      <div className="grid md:grid-cols-2 gap-4">
                                          <div><span className="text-xs text-amber-400 block mb-1">نشانه ها</span><div className="flex flex-wrap gap-2">{config.symptoms.map(s => <label key={s} className="text-xs text-slate-300 flex items-center gap-1"><input type="checkbox" checked={sys?.symptoms.includes(s)} onChange={() => toggleOrganItem(key, 'symptoms', s)}/>{s}</label>)}</div></div>
                                          <div><span className="text-xs text-red-400 block mb-1">علائم</span><div className="flex flex-wrap gap-2">{config.signs.map(s => <label key={s} className="text-xs text-slate-300 flex items-center gap-1"><input type="checkbox" checked={sys?.signs.includes(s)} onChange={() => toggleOrganItem(key, 'signs', s)}/>{s}</label>)}</div></div>
                                      </div>
                                  </div>
                              );
                          })}</div>
                      </div>
                  )}

                  {formStep === 3 && (
                      <div className="space-y-6">
                          <h3 className="font-bold text-white flex gap-2"><Microscope className="text-blue-400"/>پاراکلینیک</h3>
                          
                          {/* Audiometry Grid */}
                          <div className="bg-slate-900/50 p-5 rounded-xl border border-white/5">
                              <h4 className="font-bold text-white mb-4 flex gap-2"><Ear className="w-4 h-4 text-blue-400"/>شنوایی سنجی (Audiometry - dB HL)</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-center text-sm">
                                  <thead>
                                    <tr className="text-slate-400">
                                      <th className="p-2">فرکانس (Hz)</th>
                                      {AUDIOMETRY_FREQUENCIES.map(f => <th key={f} className="p-2">{f}</th>)}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="p-2 text-blue-300 font-bold">گوش چپ (Left)</td>
                                      {AUDIOMETRY_FREQUENCIES.map((f, i) => (
                                        <td key={f} className="p-1"><input type="number" className="w-12 bg-slate-800 border border-white/10 rounded p-1 text-center text-white" value={newExamData.hearing.left[i]} onChange={e => updateAudiometry('left', i, e.target.value)} /></td>
                                      ))}
                                    </tr>
                                    <tr>
                                      <td className="p-2 text-red-300 font-bold">گوش راست (Right)</td>
                                      {AUDIOMETRY_FREQUENCIES.map((f, i) => (
                                        <td key={f} className="p-1"><input type="number" className="w-12 bg-slate-800 border border-white/10 rounded p-1 text-center text-white" value={newExamData.hearing.right[i]} onChange={e => updateAudiometry('right', i, e.target.value)} /></td>
                                      ))}
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                          </div>

                          {/* Vision */}
                          <div className="bg-slate-900/50 p-5 rounded-xl border border-white/5">
                              <h4 className="font-bold text-white mb-4 flex gap-2"><Eye className="w-4 h-4 text-purple-400"/>بینایی سنجی (Optometry)</h4>
                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center bg-white/5 p-2 rounded"><span className="text-xs text-slate-400">چشم راست (اصلاح نشده)</span><input className="w-16 bg-slate-800 text-center rounded text-white" value={newExamData.vision?.acuity.right.uncorrected} onChange={e => setNewExamData({...newExamData, vision: {...newExamData.vision!, acuity: {...newExamData.vision!.acuity, right: {...newExamData.vision!.acuity.right, uncorrected: e.target.value}}}})} placeholder="10/10"/></div>
                                  <div className="flex justify-between items-center bg-white/5 p-2 rounded"><span className="text-xs text-slate-400">چشم راست (با اصلاح)</span><input className="w-16 bg-slate-800 text-center rounded text-white" value={newExamData.vision?.acuity.right.corrected} onChange={e => setNewExamData({...newExamData, vision: {...newExamData.vision!, acuity: {...newExamData.vision!.acuity, right: {...newExamData.vision!.acuity.right, corrected: e.target.value}}}})} placeholder="-"/></div>
                                </div>
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center bg-white/5 p-2 rounded"><span className="text-xs text-slate-400">چشم چپ (اصلاح نشده)</span><input className="w-16 bg-slate-800 text-center rounded text-white" value={newExamData.vision?.acuity.left.uncorrected} onChange={e => setNewExamData({...newExamData, vision: {...newExamData.vision!, acuity: {...newExamData.vision!.acuity, left: {...newExamData.vision!.acuity.left, uncorrected: e.target.value}}}})} placeholder="10/10"/></div>
                                  <div className="flex justify-between items-center bg-white/5 p-2 rounded"><span className="text-xs text-slate-400">چشم چپ (با اصلاح)</span><input className="w-16 bg-slate-800 text-center rounded text-white" value={newExamData.vision?.acuity.left.corrected} onChange={e => setNewExamData({...newExamData, vision: {...newExamData.vision!, acuity: {...newExamData.vision!.acuity, left: {...newExamData.vision!.acuity.left, corrected: e.target.value}}}})} placeholder="-"/></div>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4 mt-4">
                                <div><label className="text-xs text-slate-400 block mb-1">دید رنگ</label><select className="w-full bg-slate-800 text-white rounded p-2" value={newExamData.vision?.colorVision} onChange={e => setNewExamData({...newExamData, vision: {...newExamData.vision!, colorVision: e.target.value as any}})}><option>Normal</option><option>Abnormal</option></select></div>
                                <div><label className="text-xs text-slate-400 block mb-1">میدان بینایی</label><select className="w-full bg-slate-800 text-white rounded p-2" value={newExamData.vision?.visualField} onChange={e => setNewExamData({...newExamData, vision: {...newExamData.vision!, visualField: e.target.value as any}})}><option>Normal</option><option>Abnormal</option></select></div>
                                <div><label className="text-xs text-slate-400 block mb-1">دید عمق</label><input className="w-full bg-slate-800 text-white rounded p-2" value={newExamData.vision?.depthPerception} onChange={e => setNewExamData({...newExamData, vision: {...newExamData.vision!, depthPerception: e.target.value}})} placeholder="ثانیه..."/></div>
                              </div>
                          </div>

                          {/* Spirometry Grid */}
                          <div className="bg-slate-900/50 p-5 rounded-xl border border-white/5">
                              <h4 className="font-bold text-white mb-4 flex gap-2"><Wind className="w-4 h-4 text-emerald-400"/>اسپیرومتری</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div><label className="text-xs text-slate-400 mb-1 block">FVC (L)</label><input type="number" className="w-full bg-slate-800 rounded p-2 text-white" value={newExamData.spirometry.fvc} onChange={e => setNewExamData({...newExamData, spirometry: {...newExamData.spirometry, fvc: Number(e.target.value)}})}/></div>
                                  <div><label className="text-xs text-slate-400 mb-1 block">FEV1 (L)</label><input type="number" className="w-full bg-slate-800 rounded p-2 text-white" value={newExamData.spirometry.fev1} onChange={e => setNewExamData({...newExamData, spirometry: {...newExamData.spirometry, fev1: Number(e.target.value)}})}/></div>
                                  <div><label className="text-xs text-slate-400 mb-1 block">FEV1/FVC %</label><input type="number" className="w-full bg-slate-800 rounded p-2 text-white" value={newExamData.spirometry.fev1_fvc} onChange={e => setNewExamData({...newExamData, spirometry: {...newExamData.spirometry, fev1_fvc: Number(e.target.value)}})}/></div>
                                  <div><label className="text-xs text-slate-400 mb-1 block">PEF</label><input type="number" className="w-full bg-slate-800 rounded p-2 text-white" value={newExamData.spirometry.pef} onChange={e => setNewExamData({...newExamData, spirometry: {...newExamData.spirometry, pef: Number(e.target.value)}})}/></div>
                              </div>
                          </div>
                          
                          <div className="bg-slate-900/50 p-5 rounded-xl border border-white/5">
                              <h4 className="font-bold text-white mb-4">آزمایشات</h4>
                              <div className="grid grid-cols-4 gap-4">
                                  {Object.keys(newExamData.labResults).map(k => <div key={k}><label className="text-xs text-slate-400 uppercase">{k}</label><input className="w-full bg-slate-800 text-white rounded p-1 text-center" value={(newExamData.labResults as any)[k]} onChange={e => setNewExamData({...newExamData, labResults: {...newExamData.labResults, [k]: e.target.value}})}/></div>)}
                              </div>
                          </div>
                      </div>
                  )}

                  {formStep === 4 && (
                      <div className="space-y-6">
                          <h3 className="font-bold text-white flex gap-2"><CheckCircle className="text-emerald-400"/>نظریه نهایی</h3>
                          <div className="grid grid-cols-3 gap-4">
                              {['fit', 'conditional', 'unfit'].map(s => (
                                  <button key={s} onClick={() => setNewExamData({...newExamData, finalOpinion: {...newExamData.finalOpinion, status: s as any}})} className={`p-4 rounded-xl border ${newExamData.finalOpinion.status === s ? 'bg-white/10 border-cyan-500 text-white' : 'bg-slate-900 border-white/10 text-slate-400'}`}>
                                      {s === 'fit' ? 'بلامانع' : s === 'conditional' ? 'مشروط' : 'عدم صلاحیت'}
                                  </button>
                              ))}
                          </div>
                          <textarea className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white h-24" placeholder="توصیه‌ها..." value={newExamData.finalOpinion.recommendations} onChange={e => setNewExamData({...newExamData, finalOpinion: {...newExamData.finalOpinion, recommendations: e.target.value}})}></textarea>
                      </div>
                  )}

                  <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                      {formStep > 1 ? <button onClick={() => setFormStep(prev => Math.max(1, prev - 1) as any)} className="px-6 py-3 bg-slate-700 text-white rounded-xl">مرحله قبل</button> : <div></div>}
                      {formStep < 4 ? <button onClick={() => setFormStep(prev => Math.min(4, prev + 1) as any)} className="px-8 py-3 bg-cyan-600 text-white rounded-xl font-bold">مرحله بعد</button> : <button onClick={handleInitiateSave} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20">ثبت نهایی</button>}
                  </div>
              </div>
            )}
          </>
        )}
      </main>
      <ChatWidget />
    </div>
  );
};

export default App;