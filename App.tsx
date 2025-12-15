
import React, { useState, useEffect } from 'react';
import { Shield, Activity, Search, Plus, LogOut, AlertTriangle, UserPlus, X, Save, FileText, ClipboardList, Stethoscope, Microscope, CheckCircle, Eye, Wind, Ear, ListChecks, Info, UploadCloud, FileSpreadsheet, Users, Sparkles, Loader2, Square, Database, RefreshCw } from 'lucide-react';
import { User, Worker, Role, Exam, MedicalHistoryItem, OrganSystemFinding, HearingData, SpirometryData, VisionData, HealthAssessment, ReferralStatus } from './types';
import Dashboard from './components/Dashboard';
import WorkerProfile from './components/WorkerProfile';
import ChatWidget from './components/ChatWidget';
import HealthOfficerAssessment from './components/HealthOfficerAssessment';
import DoctorWorklist from './components/DoctorWorklist';
import CriticalCasesList from './components/CriticalCasesList';
import Login from './components/Login';
import LicenseActivation from './components/LicenseActivation';
import UserManagement from './components/UserManagement';
import DataManagementModal from './components/DataManagementModal';
import { generateId, toJalali } from './utils';
import { AuthService } from './services/authService';
import { StorageService } from './services/storageService';
import { createChatSession, sendMessageToGemini } from './services/geminiService';

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

// Initial Empty State
const INITIAL_NEW_EXAM_STATE: Omit<Exam, 'id' | 'date'> & { nationalId: string } = {
  nationalId: '',
  hearing: { 
      left: [0,0,0,0,0,0], 
      right: [0,0,0,0,0,0],
      speech: { 
        left: { srt: '', sds: '', ucl: '' }, 
        right: { srt: '', sds: '', ucl: '' } 
      },
      report: ''
  }, 
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
  const [appState, setAppState] = useState<'license' | 'login' | 'app'>('license');
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'search' | 'newExam' | 'newWorker' | 'worklist' | 'critical_list' | 'user_management'>('dashboard');
  
  // Data State - Initialized from Storage
  const [workers, setWorkers] = useState<Worker[]>([]); 
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false);
  
  // Modals / Dialogs state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showEditWorkerModal, setShowEditWorkerModal] = useState(false);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false); // For Health Officer
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [editWorkerData, setEditWorkerData] = useState({ name: '', department: '', workYears: 0 });

  // New Exam Form State
  const [formStep, setFormStep] = useState<1 | 2 | 3 | 4>(1); 
  const [newExamData, setNewExamData] = useState(INITIAL_NEW_EXAM_STATE);
  const [newWorkerData, setNewWorkerData] = useState({ nationalId: '', name: '', department: '', workYears: '' });

  // Load Data on Mount
  useEffect(() => {
    // 1. Initialize Auth Service (Seed data)
    AuthService.init();

    // 2. Load Workers from LocalStorage
    const loadedWorkers = StorageService.loadWorkers();
    setWorkers(loadedWorkers);
    
    // 3. Load Last Sync
    const savedSync = StorageService.getLastSync();
    setLastSyncDate(savedSync);

    // 4. Check License
    const license = AuthService.getLicenseInfo();
    if (license.isActive) {
        setAppState('login');
    } else {
        setAppState('license');
    }
  }, []);

  // Persistence Effect: Save to storage whenever workers change
  useEffect(() => {
      if (workers.length > 0) {
          StorageService.saveWorkers(workers);
      }
  }, [workers]);

  const handleAuthenticated = (loggedInUser: User) => {
      setUser(loggedInUser);
      setAppState('app');
      
      // Default view based on role
      if (loggedInUser.role === 'doctor') setActiveTab('worklist');
      else if (loggedInUser.role === 'health_officer') setActiveTab('dashboard');
      else setActiveTab('dashboard'); // Manager/Developer
  };

  const handleLicenseActivated = () => {
      setAppState('login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const worker = workers.find(w => w.nationalId === searchQuery);
    worker ? setSelectedWorker(worker) : alert('کارگری با این کد ملی یافت نشد.');
  };

  // Workflow: Health Officer Saves Assessment
  const handleSaveAssessment = (assessment: HealthAssessment) => {
      if (!selectedWorker) return;
      const updatedWorkers = workers.map(w => {
          if (w.id === selectedWorker.id) {
              return {
                  ...w,
                  healthAssessment: assessment,
                  // If doctor visit needed, add to doctor's list
                  referralStatus: assessment.needsDoctorVisit ? 'waiting_for_doctor' as ReferralStatus : 'none' as ReferralStatus
              };
          }
          return w;
      });
      setWorkers(updatedWorkers);
      setSelectedWorker(null); // Return to view
      setShowAssessmentForm(false);
      alert("ارزیابی با موفقیت ثبت شد.");
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
        referralStatus: 'none',
        exams: []
    };
    setWorkers(prev => [...prev, newWorker]);
    alert("پرسنل جدید با موفقیت ثبت شد.");
    setNewWorkerData({ nationalId: '', name: '', department: '', workYears: '' });
    setActiveTab('dashboard'); 
  };
  
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const text = event.target?.result as string;
          // Basic CSV Parsing (Assumes Header: Name,NationalID,Department,WorkYears)
          const lines = text.split('\n');
          const newWorkers: Worker[] = [];
          
          // Skip header, start from index 1
          for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (line) {
                  const [name, nationalId, department, workYears] = line.split(',');
                  if (name && nationalId) {
                      if (!workers.some(w => w.nationalId === nationalId.trim()) && !newWorkers.some(w => w.nationalId === nationalId.trim())) {
                          newWorkers.push({
                              id: Date.now() + i,
                              name: name.trim(),
                              nationalId: nationalId.trim(),
                              department: department?.trim() || 'نامشخص',
                              workYears: Number(workYears) || 0,
                              referralStatus: 'none',
                              exams: []
                          });
                      }
                  }
              }
          }
          
          if (newWorkers.length > 0) {
              setWorkers(prev => [...prev, ...newWorkers]);
              alert(`${newWorkers.length} پرسنل با موفقیت اضافه شدند.`);
              setActiveTab('dashboard');
          } else {
              alert("هیچ رکورد معتبری یافت نشد یا همه رکوردها تکراری بودند.");
          }
      };
      reader.readAsText(file);
  };

  const handleInitiateSaveExam = () => {
      if (!newExamData.nationalId) return alert("کد ملی الزامی است");
      const workerIndex = workers.findIndex(w => w.nationalId === newExamData.nationalId);
      if (workerIndex === -1) return alert("کارگر یافت نشد. لطفا ابتدا پرونده پرسنلی تشکیل دهید.");
      setShowConfirmDialog(true);
  };

  const handleConfirmSaveExam = () => {
      const workerIndex = workers.findIndex(w => w.nationalId === newExamData.nationalId);
      if (workerIndex === -1) return;
      
      const newExam: Exam = {
          id: generateId(),
          date: new Date().toISOString().split('T')[0],
          ...newExamData
      };

      const updatedWorkers = [...workers];
      const worker = { ...updatedWorkers[workerIndex] };
      worker.exams = [newExam, ...worker.exams];
      
      // Referral Logic for Doctor
      if (newExam.finalOpinion.status === 'unfit' || newExam.finalOpinion.status === 'conditional') {
         // Automatically flag for specialist if unfit/conditional (simplified logic)
         worker.referralStatus = 'pending_specialist_result';
      } else {
         worker.referralStatus = 'none'; // Clears "waiting_for_doctor" status
      }

      updatedWorkers[workerIndex] = worker;
      setWorkers(updatedWorkers);
      setShowConfirmDialog(false);
      alert("معاینه با موفقیت ثبت شد");
      setNewExamData(INITIAL_NEW_EXAM_STATE);
      setFormStep(1);
      setActiveTab('worklist'); // Doctor returns to worklist
  };

  const handleUpdateReferralStatus = (id: number, status: ReferralStatus, note?: string) => {
      setWorkers(prev => prev.map(w => {
          if (w.id === id) {
              return { 
                  ...w, 
                  referralStatus: status,
                  specialistFollowUp: note ? {
                      date: new Date().toISOString().split('T')[0],
                      doctorNote: note,
                      result: 'cleared'
                  } : w.specialistFollowUp
              };
          }
          return w;
      }));
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

  // --- Helper Functions for Exam Form ---
  const toggleOrganItem = (systemKey: string, type: 'symptoms' | 'signs', item: string) => {
    setNewExamData(prev => {
        const system = prev.organSystems[systemKey];
        const list = system[type];
        const newList = list.includes(item) ? list.filter(i => i !== item) : [...list, item];
        return { ...prev, organSystems: { ...prev.organSystems, [systemKey]: { ...system, [type]: newList } } };
    });
  };

  const clearOrganSystem = (systemKey: string) => {
      setNewExamData(prev => ({
          ...prev,
          organSystems: {
              ...prev.organSystems,
              [systemKey]: { ...prev.organSystems[systemKey], symptoms: [], signs: [] }
          }
      }));
  };

  const updateHistory = (index: number, field: 'hasCondition' | 'description', value: any) => {
      setNewExamData(prev => {
          const newHistory = [...prev.medicalHistory];
          newHistory[index] = { ...newHistory[index], [field]: value };
          return { ...prev, medicalHistory: newHistory };
      });
  };

  const clearMedicalHistory = () => {
      setNewExamData(prev => ({
          ...prev,
          medicalHistory: prev.medicalHistory.map(h => ({ ...h, hasCondition: false, description: '' }))
      }));
  };

  const updateAudiometry = (ear: 'left' | 'right', index: number, value: string) => {
      const numVal = Number(value) || 0;
      setNewExamData(prev => {
          const newArr = [...prev.hearing[ear]];
          newArr[index] = numVal;
          return { ...prev, hearing: { ...prev.hearing, [ear]: newArr } };
      });
  };

  const handleGenerateRecommendation = async () => {
      setIsGeneratingRecommendation(true);
      try {
          // Construct prompt from available data
          const findings = newExamData.medicalHistory.filter(h => h.hasCondition).map(h => h.question).join(', ');
          const prompt = `
            به عنوان متخصص طب کار، با توجه به داده‌های زیر یک توصیه نامه کوتاه (Recommendations) برای کارگر بنویس:
            اسپیرومتری: FVC=${newExamData.spirometry.fvc}, FEV1=${newExamData.spirometry.fev1}, تفسیر=${newExamData.spirometry.interpretation}
            شنوایی سنجی: ${newExamData.hearing.report || 'بدون گزارش خاص'}
            سابقه پزشکی: ${findings || 'بدون سابقه'}
            معاینه بالینی: ${(Object.values(newExamData.organSystems) as OrganSystemFinding[]).filter(sys => sys.signs.length > 0).map(sys => sys.systemName + ': ' + sys.signs.join(',')).join('; ') || 'نرمال'}
            
            فقط توصیه‌های کاربردی و خلاصه برای بخش "Final Opinion" بنویس.
          `;
          
          const session = createChatSession();
          const response = await sendMessageToGemini(session, prompt);
          setNewExamData(prev => ({
              ...prev,
              finalOpinion: { ...prev.finalOpinion, recommendations: response }
          }));

      } catch (e) {
          alert("خطا در ارتباط با هوش مصنوعی");
      } finally {
          setIsGeneratingRecommendation(false);
      }
  };

  // --- MAIN RENDER LOGIC ---

  if (appState === 'license') {
      return <LicenseActivation onActivated={handleLicenseActivated} />;
  }

  if (appState === 'login' || !user) {
      return <Login onLogin={handleAuthenticated} />;
  }

  // --- Doctor Views vs Health Officer vs Manager Logic ---
  const renderNav = () => {
      const baseNav = (
          <button onClick={() => setActiveTab('search')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'search' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}><Search className="w-5 h-5" />جستجو</button>
      );

      if (user.role === 'manager' || user.role === 'developer') {
          return (
              <>
                <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}><Activity className="w-5 h-5" />داشبورد کل</button>
                <button onClick={() => setActiveTab('user_management')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'user_management' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}><Users className="w-5 h-5" />مدیریت کاربران</button>
                {baseNav}
              </>
          );
      }

      if (user.role === 'health_officer') {
          return (
              <>
                <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}><Activity className="w-5 h-5" />داشبورد</button>
                {baseNav}
                <button onClick={() => setActiveTab('newWorker')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'newWorker' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}><UserPlus className="w-5 h-5" />ثبت پرسنل</button>
              </>
          );
      } else {
          // Doctor
           return (
              <>
                <button onClick={() => setActiveTab('worklist')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'worklist' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}><ListChecks className="w-5 h-5" />کارتابل پزشک</button>
                {baseNav}
                <button onClick={() => setActiveTab('newExam')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'newExam' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}><Plus className="w-5 h-5" />معاینه جدید</button>
              </>
          );
      }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans" dir="rtl">
      
      {/* Confirm Save Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-white mb-2 text-center">تایید ثبت اطلاعات</h3>
            <div className="flex gap-3 mt-6">
                <button onClick={() => setShowConfirmDialog(false)} className="flex-1 p-2 rounded-xl bg-slate-800 text-slate-300">خیر</button>
                <button onClick={handleConfirmSaveExam} className="flex-1 p-2 rounded-xl bg-emerald-600 text-white font-bold">بله</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Worker Modal */}
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

      {/* Data Management Modal */}
      {showDataManagement && (
          <DataManagementModal 
            workers={workers}
            onUpdateWorkers={setWorkers}
            onClose={() => setShowDataManagement(false)}
            lastSync={lastSyncDate}
            onSyncComplete={(date) => setLastSyncDate(date)}
          />
      )}

      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                  <h1 className="text-xl font-bold text-white">سیستم مدیریت سلامت شغلی</h1>
                  <span className="text-xs text-cyan-300">
                    {user.role === 'doctor' ? 'پنل پزشک متخصص طب کار' : 
                     user.role === 'health_officer' ? 'پنل کارشناس بهداشت حرفه‌ای' :
                     user.role === 'manager' ? 'پنل مدیریت' : 'پنل توسعه‌دهنده'}
                  </span>
              </div>
          </div>
          <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowDataManagement(true)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 hover:border-white/20 transition-all px-3 py-2 rounded-lg text-sm"
              >
                  <Database className="w-4 h-4" />
                  <span className="hidden md:inline">داده‌ها و همگام‌سازی</span>
                  {lastSyncDate ? (
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  ) : (
                      <span className="flex h-2 w-2 rounded-full bg-amber-500"></span>
                  )}
              </button>
              
              <div className="hidden md:block text-sm text-slate-400 border-l border-white/10 pl-4 ml-2">کاربر: <span className="text-white font-bold">{user.name}</span></div>
              <button onClick={() => setAppState('login')} className="flex items-center gap-2 text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors px-4 py-2 rounded-lg text-sm"><LogOut className="w-4 h-4" />خروج</button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-6 py-8 pb-32">
        {/* Navigation Tabs (Only if no worker selected) */}
        {!selectedWorker && !showAssessmentForm && (
          <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            {renderNav()}
          </div>
        )}

        {/* --- Health Officer Assessment Form --- */}
        {showAssessmentForm && selectedWorker && (
           <HealthOfficerAssessment 
                worker={selectedWorker}
                onSave={handleSaveAssessment}
                onCancel={() => setShowAssessmentForm(false)}
           />
        )}

        {/* --- User Management (Manager/Dev only) --- */}
        {activeTab === 'user_management' && (user.role === 'manager' || user.role === 'developer') && (
            <UserManagement />
        )}

        {/* --- Worker Profile View --- */}
        {!showAssessmentForm && selectedWorker ? (
          <div>
              {/* Context Actions for Health Officer */}
              {user.role === 'health_officer' && (
                  <div className="mb-6 flex justify-end">
                      <button 
                        onClick={() => setShowAssessmentForm(true)}
                        className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-900/20 flex items-center gap-2"
                      >
                          <ClipboardList className="w-5 h-5" />
                          تکمیل فرم ارزیابی بهداشت و ایمنی
                      </button>
                  </div>
              )}
              {/* Context Actions for Doctor */}
              {user.role === 'doctor' && (
                  <div className="mb-6 flex justify-end">
                      <button 
                        onClick={() => {
                            setNewExamData({...INITIAL_NEW_EXAM_STATE, nationalId: selectedWorker.nationalId});
                            setSelectedWorker(null);
                            setActiveTab('newExam');
                        }}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-cyan-900/20 flex items-center gap-2"
                      >
                          <Plus className="w-5 h-5" />
                          ثبت معاینه جدید
                      </button>
                  </div>
              )}

              <WorkerProfile 
                worker={selectedWorker} 
                onBack={() => setSelectedWorker(null)} 
                onEdit={handleEditClick}
                onUpdateStatus={handleUpdateReferralStatus} 
              />
          </div>
        ) : !showAssessmentForm && activeTab !== 'user_management' && (
          <>
            {/* Dashboard: Health Officer/Manager/Dev */}
            {activeTab === 'dashboard' && (user.role !== 'doctor') && (
                <Dashboard 
                    workers={workers} 
                    onViewCritical={() => setActiveTab('critical_list')}
                />
            )}
            
            {/* Critical Cases List */}
            {activeTab === 'critical_list' && (user.role !== 'doctor') && (
                <CriticalCasesList 
                    workers={workers}
                    onSelectWorker={(w) => setSelectedWorker(w)}
                    onBack={() => setActiveTab('dashboard')}
                />
            )}

            {/* Worklist: Doctor Only */}
            {activeTab === 'worklist' && user.role === 'doctor' && (
                <DoctorWorklist 
                    workers={workers} 
                    onSelectWorker={(w) => setSelectedWorker(w)} 
                />
            )}

            {/* Search */}
            {activeTab === 'search' && (
               <div className="max-w-2xl mx-auto mt-12 text-center bg-slate-800/50 p-10 rounded-2xl border border-white/10">
                  <Search className="w-12 h-12 text-cyan-400 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-white mb-6">جستجوی پرونده پزشکی</h2>
                  <form onSubmit={handleSearch} className="flex gap-3"><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="کد ملی..." className="flex-1 bg-slate-900 border border-white/20 rounded-xl px-6 py-4 text-white text-center" /><button type="submit" className="bg-cyan-500 px-8 py-4 rounded-xl font-bold text-white">جستجو</button></form>
               </div>
            )}

            {/* New Worker: Health Officer Only */}
            {activeTab === 'newWorker' && user.role === 'health_officer' && (
                <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
                    {/* Manual Entry */}
                    <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/10">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><UserPlus className="w-5 h-5 text-cyan-400"/> ثبت دستی پرسنل</h2>
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

                    {/* Excel Import */}
                    <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
                        <div className="mb-4 bg-emerald-500/10 p-4 rounded-full"><FileSpreadsheet className="w-12 h-12 text-emerald-400" /></div>
                        <h2 className="text-xl font-bold text-white mb-2">ورود گروهی (Excel/CSV)</h2>
                        <p className="text-slate-400 text-sm mb-6">فایل باید شامل ستون‌های: Name, NationalID, Department, WorkYears باشد.</p>
                        
                        <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all">
                            <UploadCloud className="w-5 h-5" />
                            انتخاب فایل CSV
                            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                        </label>
                        <div className="mt-4 text-xs text-slate-500">
                             فرمت نمونه: علی رضایی, 1234567890, تولید, 5
                        </div>
                    </div>
                </div>
            )}

            {/* New Exam Form: Doctor Only */}
            {activeTab === 'newExam' && user.role === 'doctor' && (
              <div className="max-w-5xl mx-auto bg-slate-800/50 p-8 rounded-2xl border border-white/10">
                  <div className="flex justify-between border-b border-white/10 pb-6 mb-6">
                      <div className="flex items-center gap-4"><ClipboardList className="w-8 h-8 text-emerald-400" /><h2 className="text-2xl font-bold text-white">فرم معاینات شغلی</h2></div>
                      <div className="flex gap-2">{[1, 2, 3, 4].map(s => <div key={s} className={`w-3 h-3 rounded-full ${formStep >= s ? 'bg-cyan-500' : 'bg-slate-700'}`}></div>)}</div>
                  </div>

                  {formStep === 1 && (
                      <div className="space-y-6">
                          <input type="text" className="w-full bg-slate-900 p-3 rounded-lg text-white" value={newExamData.nationalId} onChange={e => setNewExamData({...newExamData, nationalId: e.target.value})} placeholder="کد ملی پرسنل" />
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="font-bold text-white">سوابق پزشکی</h3>
                              <button onClick={clearMedicalHistory} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-300 transition-colors flex items-center gap-1">
                                  <Square className="w-3 h-3" /> هیچکدام (بدون سابقه)
                              </button>
                          </div>
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
                                      <div className="flex justify-between items-start mb-2">
                                          <h4 className="font-bold text-cyan-100">{config.label}</h4>
                                          <button onClick={() => clearOrganSystem(key)} className="text-[10px] bg-slate-800 hover:bg-emerald-600 hover:text-white px-2 py-1 rounded transition-colors">
                                              نرمال
                                          </button>
                                      </div>
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
                          
                          {/* Audiometry Grid (Air Conduction) */}
                          <div className="bg-slate-900/50 p-5 rounded-xl border border-white/5">
                              <h4 className="font-bold text-white mb-4 flex gap-2"><Ear className="w-4 h-4 text-blue-400"/>شنوایی سنجی (Pure Tone Audiometry - dB HL)</h4>
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
                          
                          {/* Speech Audiometry & Report */}
                          <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-slate-900/50 p-5 rounded-xl border border-white/5">
                                    <h4 className="font-bold text-white mb-4 text-sm">Speech Audiometry</h4>
                                    <table className="w-full text-center text-sm">
                                        <thead>
                                            <tr className="text-slate-400 text-xs">
                                                <th className="p-2">Ear</th>
                                                <th className="p-2">SRT (dB)</th>
                                                <th className="p-2">SDS (%)</th>
                                                <th className="p-2">UCL</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            <tr>
                                                <td className="p-2 font-bold text-blue-400">Left</td>
                                                <td className="p-1"><input className="w-16 bg-slate-800 rounded p-1 text-center text-white" value={newExamData.hearing.speech?.left.srt} onChange={e => setNewExamData({...newExamData, hearing: {...newExamData.hearing, speech: {...newExamData.hearing.speech, left: {...newExamData.hearing.speech.left, srt: e.target.value}}}})}/></td>
                                                <td className="p-1"><input className="w-16 bg-slate-800 rounded p-1 text-center text-white" value={newExamData.hearing.speech?.left.sds} onChange={e => setNewExamData({...newExamData, hearing: {...newExamData.hearing, speech: {...newExamData.hearing.speech, left: {...newExamData.hearing.speech.left, sds: e.target.value}}}})}/></td>
                                                <td className="p-1"><input className="w-16 bg-slate-800 rounded p-1 text-center text-white" value={newExamData.hearing.speech?.left.ucl} onChange={e => setNewExamData({...newExamData, hearing: {...newExamData.hearing, speech: {...newExamData.hearing.speech, left: {...newExamData.hearing.speech.left, ucl: e.target.value}}}})}/></td>
                                            </tr>
                                            <tr>
                                                <td className="p-2 font-bold text-red-400">Right</td>
                                                <td className="p-1"><input className="w-16 bg-slate-800 rounded p-1 text-center text-white" value={newExamData.hearing.speech?.right.srt} onChange={e => setNewExamData({...newExamData, hearing: {...newExamData.hearing, speech: {...newExamData.hearing.speech, right: {...newExamData.hearing.speech.right, srt: e.target.value}}}})}/></td>
                                                <td className="p-1"><input className="w-16 bg-slate-800 rounded p-1 text-center text-white" value={newExamData.hearing.speech?.right.sds} onChange={e => setNewExamData({...newExamData, hearing: {...newExamData.hearing, speech: {...newExamData.hearing.speech, right: {...newExamData.hearing.speech.right, sds: e.target.value}}}})}/></td>
                                                <td className="p-1"><input className="w-16 bg-slate-800 rounded p-1 text-center text-white" value={newExamData.hearing.speech?.right.ucl} onChange={e => setNewExamData({...newExamData, hearing: {...newExamData.hearing, speech: {...newExamData.hearing.speech, right: {...newExamData.hearing.speech.right, ucl: e.target.value}}}})}/></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="bg-slate-900/50 p-5 rounded-xl border border-white/5">
                                    <h4 className="font-bold text-white mb-4 text-sm">Audiology Report</h4>
                                    <textarea 
                                        className="w-full h-32 bg-slate-800 border border-white/10 rounded-lg p-3 text-white text-sm"
                                        placeholder="تفسیر نتایج شنوایی سنجی..."
                                        value={newExamData.hearing.report}
                                        onChange={e => setNewExamData({...newExamData, hearing: {...newExamData.hearing, report: e.target.value}})}
                                    ></textarea>
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
                          
                          <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm text-slate-300">توصیه‌ها / محدودیت‌ها</label>
                                <button 
                                    onClick={handleGenerateRecommendation}
                                    disabled={isGeneratingRecommendation}
                                    className="flex items-center gap-2 text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg transition-colors shadow-lg shadow-purple-900/20 disabled:opacity-50"
                                >
                                    {isGeneratingRecommendation ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                                    تولید توصیه با AI
                                </button>
                            </div>
                            <textarea className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white h-24" placeholder="توصیه‌ها..." value={newExamData.finalOpinion.recommendations} onChange={e => setNewExamData({...newExamData, finalOpinion: {...newExamData.finalOpinion, recommendations: e.target.value}})}></textarea>
                          </div>
                          
                          <div className="text-sm text-slate-400 bg-slate-800/50 p-3 rounded">
                              <Info className="w-4 h-4 inline-block ml-1" />
                              در صورتی که وضعیت را مشروط یا عدم صلاحیت انتخاب کنید، پرونده به صورت خودکار در لیست پیگیری ارجاع تخصصی قرار خواهد گرفت.
                          </div>
                      </div>
                  )}

                  <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                      {formStep > 1 ? <button onClick={() => setFormStep(prev => Math.max(1, prev - 1) as any)} className="px-6 py-3 bg-slate-700 text-white rounded-xl">مرحله قبل</button> : <div></div>}
                      {formStep < 4 ? <button onClick={() => setFormStep(prev => Math.min(4, prev + 1) as any)} className="px-8 py-3 bg-cyan-600 text-white rounded-xl font-bold">مرحله بعد</button> : <button onClick={handleInitiateSaveExam} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20">ثبت نهایی</button>}
                  </div>
              </div>
            )}
          </>
        )}
      </main>
      
      {/* Show Chat only when logged in */}
      {user && <ChatWidget />}
    </div>
  );
};

export default App;
