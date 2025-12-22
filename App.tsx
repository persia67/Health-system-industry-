import React, { useState, useEffect } from 'react';
import { Shield, Activity, Search, Plus, LogOut, AlertTriangle, UserPlus, X, Save, FileText, ClipboardList, Stethoscope, Microscope, CheckCircle, Eye, Wind, Ear, ListChecks, Info, UploadCloud, FileSpreadsheet, Users, Sparkles, Loader2, Square, Database, RefreshCw, Key } from 'lucide-react';
import { User, Worker, Role, Exam, MedicalHistoryItem, OrganSystemFinding, HearingData, SpirometryData, VisionData, HealthAssessment, ReferralStatus } from './types';
import Dashboard from './components/Dashboard';
import WorkerProfile from './components/WorkerProfile';
import ChatWidget from './components/ChatWidget';
import HealthOfficerAssessment from './components/HealthOfficerAssessment';
import DoctorWorklist from './components/DoctorWorklist';
import CriticalCasesList from './components/CriticalCasesList';
import WorkerList from './components/WorkerList';
import Login from './components/Login';
import LicenseActivation from './components/LicenseActivation';
import UserManagement from './components/UserManagement';
import DataManagementModal from './components/DataManagementModal';
import ThemeToggle from './components/ThemeToggle';
import { generateId, toJalali } from './utils';
import { AuthService } from './services/authService';
import { StorageService } from './services/storageService';

// AI Studio global helpers types
declare global {
  // Define AIStudio interface to ensure identical modifiers and matching types across declarations
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // Making aistudio optional to match potential external declarations and avoid modifier mismatch
    aistudio?: AIStudio;
  }
}

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

const APP_VERSION = "۲.۱.۰";

const App = () => {
  const [appState, setAppState] = useState<'license' | 'login' | 'app'>('license');
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'worker_list' | 'newExam' | 'newWorker' | 'worklist' | 'critical_list' | 'user_management'>('dashboard');
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  
  const [workers, setWorkers] = useState<Worker[]>([]); 
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('ohs_theme') as 'light'|'dark') || 'dark';
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ohs_theme', theme);
  }, [theme]);

  // Check for API Key on mount
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkKey();
  }, [appState]);

  useEffect(() => {
    AuthService.init();
    const loadedWorkers = StorageService.loadWorkers();
    setWorkers(loadedWorkers);
    const savedSync = StorageService.getLastSync();
    setLastSyncDate(savedSync);
    const license = AuthService.getLicenseInfo();
    if (license.type === 'full') {
        setAppState('login');
    } else {
        setAppState('license');
    }
  }, []);

  useEffect(() => {
      if (workers.length > 0) {
          StorageService.saveWorkers(workers);
      }
  }, [workers]);

  const handleSelectApiKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true); // Assume success per guidelines
    }
  };

  const handleAuthenticated = (loggedInUser: User) => {
      setUser(loggedInUser);
      setAppState('app');
      if (loggedInUser.role === 'doctor') setActiveTab('worklist');
      else if (loggedInUser.role === 'health_officer') setActiveTab('dashboard');
      else setActiveTab('dashboard');
  };

  const handleLicenseActivated = () => {
      setAppState('login');
  };

  const handleSaveAssessment = (assessment: HealthAssessment) => {
      if (!selectedWorker) return;
      const updatedWorkers = workers.map(w => {
          if (w.id === selectedWorker.id) {
              return {
                  ...w,
                  healthAssessment: assessment,
                  referralStatus: assessment.needsDoctorVisit ? 'waiting_for_doctor' as ReferralStatus : 'none' as ReferralStatus
              };
          }
          return w;
      });
      setWorkers(updatedWorkers);
      setSelectedWorker(null);
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
          const lines = text.split('\n');
          const newWorkers: Worker[] = [];
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
      
      // Referral Logic Update:
      // If status is 'fit', set referralStatus to 'none'.
      // If status is 'conditional' or 'unfit', set referralStatus to 'pending_specialist_result'.
      if (newExam.finalOpinion.status === 'fit') {
         worker.referralStatus = 'none';
      } else if (newExam.finalOpinion.status === 'conditional' || newExam.finalOpinion.status === 'unfit') {
         worker.referralStatus = 'pending_specialist_result';
      }

      updatedWorkers[workerIndex] = worker;
      setWorkers(updatedWorkers);
      setShowConfirmDialog(false);
      alert("معاینه با موفقیت ثبت شد");
      setNewExamData(INITIAL_NEW_EXAM_STATE);
      setFormStep(1);
      setActiveTab('worklist');
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

  const handleUpdateWorkerData = (id: number, updatedData: Partial<Worker>) => {
      setWorkers(prev => prev.map(w => w.id === id ? { ...w, ...updatedData } : w));
      if (selectedWorker && selectedWorker.id === id) {
          setSelectedWorker(prev => prev ? { ...prev, ...updatedData } : null);
      }
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
    handleUpdateWorkerData(selectedWorker.id, {
        name: editWorkerData.name,
        department: editWorkerData.department,
        workYears: Number(editWorkerData.workYears)
    });
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
          const findings = newExamData.medicalHistory.filter(h => h.hasCondition).map(h => h.question).join(', ');
          const prompt = `
            به عنوان متخصص طب کار، با توجه به داده‌های زیر یک توصیه نامه کوتاه (Recommendations) برای کارگر بنویس:
            اسپیرومتری: FVC=${newExamData.spirometry.fvc}, FEV1=${newExamData.spirometry.fev1}, تفسیر=${newExamData.spirometry.interpretation}
            شنوایی سنجی: ${newExamData.hearing.report || 'بدون گزارش خاص'}
            سابقه پزشکی: ${findings || 'بدون سابقه'}
            معاینه بالینی: ${(Object.values(newExamData.organSystems) as OrganSystemFinding[]).filter(sys => sys.signs.length > 0).map(sys => sys.systemName + ': ' + sys.signs.join(',')).join('; ') || 'نرمال'}
            
            فقط توصیه‌های کاربردی و خلاصه برای بخش "Final Opinion" بنویس.
          `;
          
          const { createChatSession, sendMessageToGemini } = await import('./services/geminiService');
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

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showEditWorkerModal, setShowEditWorkerModal] = useState(false);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [editWorkerData, setEditWorkerData] = useState({ name: '', department: '', workYears: 0 });
  const [formStep, setFormStep] = useState<1 | 2 | 3 | 4>(1); 
  const [newExamData, setNewExamData] = useState(INITIAL_NEW_EXAM_STATE);
  const [newWorkerData, setNewWorkerData] = useState({ nationalId: '', name: '', department: '', workYears: '' });

  if (appState === 'license') {
      return <LicenseActivation onActivated={handleLicenseActivated} />;
  }

  if (appState === 'login' || !user) {
      return <Login onLogin={handleAuthenticated} />;
  }

  const renderNav = () => {
      const baseNav = (
          <button onClick={() => setActiveTab('worker_list')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'worker_list' ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}><Users className="w-5 h-5" />لیست پرسنل</button>
      );
      if (user.role === 'manager' || user.role === 'developer') {
          return (
              <>
                <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}><Activity className="w-5 h-5" />داشبورد کل</button>
                <button onClick={() => setActiveTab('user_management')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'user_management' ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}><Users className="w-5 h-5" />مدیریت کاربران</button>
                {baseNav}
              </>
          );
      }
      if (user.role === 'health_officer') {
          return (
              <>
                <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}><Activity className="w-5 h-5" />داشبورد</button>
                {baseNav}
                <button onClick={() => setActiveTab('newWorker')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'newWorker' ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}><UserPlus className="w-5 h-5" />ثبت پرسنل</button>
              </>
          );
      } else {
           return (
              <>
                <button onClick={() => setActiveTab('worklist')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'worklist' ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}><ListChecks className="w-5 h-5" />کارتابل پزشک</button>
                {baseNav}
                <button onClick={() => setActiveTab('newExam')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'newExam' ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}><Plus className="w-5 h-5" />معاینه جدید</button>
              </>
          );
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300" dir="rtl">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 sticky top-0 z-40 transition-colors duration-300">
        <div className="container mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">سیستم مدیریت سلامت شغلی</h1>
                  <span className="text-[10px] md:text-xs text-cyan-600 dark:text-cyan-300 flex items-center gap-1">
                    {user.role === 'doctor' ? 'پنل پزشک متخصص طب کار' : 
                     user.role === 'health_officer' ? 'پنل کارشناس بهداشت حرفه‌ای' :
                     user.role === 'manager' ? 'پنل مدیریت' : 'پنل توسعه‌دهنده'}
                    <span className="opacity-50">|</span>
                    <span className="bg-slate-100 dark:bg-white/5 px-1.5 rounded">نسخه {APP_VERSION}</span>
                  </span>
              </div>
          </div>
          <div className="flex items-center gap-4">
              {!hasApiKey && window.aistudio && (
                <button 
                  onClick={handleSelectApiKey}
                  className="flex items-center gap-2 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 px-3 py-2 rounded-lg text-sm font-bold animate-pulse"
                >
                  <Key className="w-4 h-4" />
                  فعال‌سازی هوش مصنوعی
                </button>
              )}
              <ThemeToggle isDark={isDark} toggle={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} />
              <button 
                onClick={() => setShowDataManagement(true)}
                className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5 transition-all px-3 py-2 rounded-lg text-sm"
              >
                  <Database className="w-4 h-4" />
                  <span className="hidden md:inline">داده‌ها و همگام‌سازی</span>
              </button>
              <button onClick={() => setAppState('login')} className="flex items-center gap-2 text-red-500 dark:text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors px-4 py-2 rounded-lg text-sm"><LogOut className="w-4 h-4" />خروج</button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 pb-32">
        {!selectedWorker && !showAssessmentForm && (
          <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            {renderNav()}
          </div>
        )}
        {activeTab === 'dashboard' && !selectedWorker && user.role !== 'doctor' && <Dashboard workers={workers} onViewCritical={() => setActiveTab('critical_list')} isDark={isDark} />}
        {activeTab === 'worklist' && user.role === 'doctor' && !selectedWorker && <DoctorWorklist workers={workers} onSelectWorker={setSelectedWorker} />}
        {activeTab === 'worker_list' && !selectedWorker && <WorkerList workers={workers} onSelectWorker={setSelectedWorker} onUpdateWorker={handleUpdateWorkerData} />}
        {selectedWorker && !showAssessmentForm && <WorkerProfile worker={selectedWorker} onBack={() => setSelectedWorker(null)} onEdit={handleEditClick} onUpdateStatus={handleUpdateReferralStatus} isDark={isDark} />}
        {activeTab === 'critical_list' && !selectedWorker && <CriticalCasesList workers={workers} onSelectWorker={setSelectedWorker} onBack={() => setActiveTab('dashboard')} />}
        {activeTab === 'user_management' && (user.role === 'manager' || user.role === 'developer') && <UserManagement />}
      </main>
      
      {showDataManagement && (
          <DataManagementModal 
            workers={workers} 
            onUpdateWorkers={setWorkers} 
            onClose={() => setShowDataManagement(false)} 
            lastSync={lastSyncDate}
            onSyncComplete={(date) => setLastSyncDate(date)}
          />
      )}

      {user && <ChatWidget />}
    </div>
  );
};

export default App;