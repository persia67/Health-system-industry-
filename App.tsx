
import React, { useState, useEffect } from 'react';
import { Shield, Activity, Search, Plus, LogOut, AlertTriangle, UserPlus, X, Save, FileText, ClipboardList, Stethoscope, Microscope, CheckCircle, Eye, Wind, Ear, ListChecks, Info, UploadCloud, FileSpreadsheet, Users, Sparkles, Loader2, Square, Database, RefreshCw, Key } from 'lucide-react';
import { User, Worker, Role, Exam, MedicalHistoryItem, OrganSystemFinding, HearingData, SpirometryData, VisionData, HealthAssessment, ReferralStatus, FinalOpinion } from './types';
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
import ExamForm from './components/ExamForm';
import { generateId, toJalali } from './utils';
import { AuthService } from './services/authService';
import { StorageService } from './services/storageService';
import { MEDICAL_HISTORY_QUESTIONS, ORGAN_SYSTEMS_CONFIG } from './constants';
import * as XLSX from 'xlsx';

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

const APP_VERSION = "۲.۳.۰";

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

  // Listener for Historical Import Event from Modal
  useEffect(() => {
      const handleImportHistory = (event: CustomEvent) => {
          const json = event.detail;
          processHistoricalData(json);
      };
      
      window.addEventListener('import-history' as any, handleImportHistory as any);
      return () => {
          window.removeEventListener('import-history' as any, handleImportHistory as any);
      };
  }, [workers]);

  const processHistoricalData = (data: any[]) => {
      let updatedCount = 0;
      let newWorkers = [...workers];
      
      data.forEach((row, index) => {
          const name = row['نام و نام خانوادگی'] || row['نام'];
          if (!name) return;

          // Find worker by name (fuzzy match)
          let worker = newWorkers.find(w => w.name.includes(name) || name.includes(w.name));
          
          // If worker doesn't exist, create a placeholder one? For now, only update existing or create minimal.
          // Let's create minimal if not exists, using index as ID base
          if (!worker) {
              worker = {
                  id: Date.now() + index,
                  name: name,
                  nationalId: `TEMP-${Date.now()}-${index}`, // Placeholder
                  department: 'نامشخص',
                  workYears: 0,
                  referralStatus: 'none',
                  exams: []
              };
              newWorkers.push(worker);
          }

          // Construct Exam Object
          const exam: Exam = {
              id: `HIST-${Date.now()}-${index}`,
              date: '2024-03-20', // Default approx for 1403 start, or convert current date
              medicalHistory: [],
              organSystems: {},
              hearing: { 
                  left: [0,0,0,0,0,0], right: [0,0,0,0,0,0], 
                  speech: { left: { srt: '', sds: '' }, right: { srt: '', sds: '' } },
                  report: row['تست گوش'] && row['تست گوش'].toLowerCase().includes('an') ? 'غیرنرمال (طبق سوابق)' : 'نرمال'
              },
              bp: row['فشار خون'] || '',
              spirometry: { 
                  fvc: 0, fev1: 0, fev1_fvc: 0, pef: 0, 
                  interpretation: row['تست تنفس'] && row['تست تنفس'].toLowerCase().includes('an') ? 'Obstructive' : 'Normal' 
              },
              vision: {
                  acuity: { right: { uncorrected: '', corrected: '' }, left: { uncorrected: '', corrected: '' } },
                  colorVision: 'Normal', visualField: 'Normal',
                  depthPerception: row['اپتو متری'] && row['اپتو متری'].toLowerCase().includes('an') ? 'Abnormal' : 'Normal'
              },
              labResults: {},
              finalOpinion: {
                  status: row['کد نظر پزشک'] == 2 ? 'conditional' : 'fit',
                  recommendations: row['نظر پزشک'] || ''
              }
          };

          // Map Organs
          const mapOrgan = (colName: string, sysKey: string) => {
              const val = row[colName];
              const isAbnormal = val && (val.toLowerCase().trim() === 'an' || val.includes('غیر'));
              return {
                  systemName: sysKey,
                  symptoms: [],
                  signs: [],
                  description: isAbnormal ? 'غیرنرمال (طبق سوابق پرونده)' : 'نرمال'
              };
          };

          exam.organSystems = {
              skin: mapOrgan('پوست', 'skin'),
              eyes: mapOrgan('چشم', 'eyes'),
              ent: mapOrgan('گوش حلق بینی', 'ent'),
              cardio: mapOrgan('قلب', 'cardio'),
              lungs: mapOrgan('ریه', 'lungs'),
              digestive: mapOrgan('شکم', 'digestive'),
              musculoskeletal: mapOrgan('عضلات اسکلتی', 'musculoskeletal'),
              neuro: mapOrgan('اعصاب', 'neuro'),
              psych: mapOrgan('روان', 'psych'),
              // Handling extras by appending to closest systems
              general: {
                   systemName: 'general', symptoms: [], signs: [], 
                   description: (row['ادراری تناسلی'] && row['ادراری تناسلی'].includes('an') ? 'ادراری تناسلی: غیرنرمال. ' : '') + 
                                (row['گردن'] && row['گردن'].includes('an') ? 'گردن: غیرنرمال.' : '')
              }
          };

          // Add exam to worker
          // Check if exam already exists (duplicate check by date roughly?)
          // We just append for now
          worker.exams.unshift(exam);
          
          // Update worker status based on this exam if it's the latest
          if (exam.finalOpinion.status !== 'fit') {
              worker.referralStatus = 'pending_specialist_result';
          }

          updatedCount++;
      });

      setWorkers(newWorkers);
      alert(`${updatedCount} رکورد سابقه با موفقیت پردازش و به پرونده‌ها اضافه شد.`);
      setShowDataManagement(false);
  };

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
        personnelCode: newWorkerData.personnelCode,
        name: newWorkerData.name,
        department: newWorkerData.department,
        workYears: Number(newWorkerData.workYears) || 0,
        referralStatus: 'none',
        exams: []
    };
    setWorkers(prev => [...prev, newWorker]);
    alert("پرسنل جدید با موفقیت ثبت شد.");
    setNewWorkerData({ nationalId: '', personnelCode: '', name: '', department: '', workYears: '' });
    setActiveTab('dashboard'); 
  };
  
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
              
              const newWorkers: Worker[] = [];
              let addedCount = 0;

              json.forEach((row, index) => {
                  // Flexible mapping for different column names
                  const name = row['Name'] || row['نام'] || row['نام و نام خانوادگی'];
                  const nationalId = row['NationalID'] || row['کد ملی'] || row['کدملی'];
                  const personnelCode = row['PersonnelCode'] || row['کد پرسنلی'] || row['شماره پرسنلی'];
                  const department = row['Department'] || row['واحد'] || row['بخش'];
                  const workYears = row['WorkYears'] || row['سابقه'] || 0;

                  if (name && nationalId) {
                       const nidStr = String(nationalId);
                       if (!workers.some(w => w.nationalId === nidStr) && !newWorkers.some(w => w.nationalId === nidStr)) {
                           newWorkers.push({
                               id: Date.now() + index,
                               name: String(name).trim(),
                               nationalId: nidStr.trim(),
                               personnelCode: personnelCode ? String(personnelCode).trim() : undefined,
                               department: department ? String(department).trim() : 'نامشخص',
                               workYears: Number(workYears) || 0,
                               referralStatus: 'none',
                               exams: []
                           });
                           addedCount++;
                       }
                  }
              });

              if (addedCount > 0) {
                  setWorkers(prev => [...prev, ...newWorkers]);
                  alert(`${addedCount} پرسنل با موفقیت اضافه شدند.`);
                  setActiveTab('dashboard');
              } else {
                  alert("هیچ رکورد جدیدی یافت نشد. ممکن است کد ملی تکراری باشد یا فایل خالی است.");
              }

          } catch (error) {
              console.error("Import Error:", error);
              alert("خطا در خواندن فایل. لطفا مطمئن شوید فایل اکسل معتبر است.");
          }
      };
      reader.readAsBinaryString(file);
  };

  // Called from Doctor Worklist "Start Exam" button
  const handleStartExamForWorker = (worker: Worker) => {
      setNewExamData({
          ...INITIAL_NEW_EXAM_STATE,
          nationalId: worker.nationalId
      });
      setActiveTab('newExam');
  };

  const handleConfirmSaveExam = (data: typeof newExamData) => {
      const workerIndex = workers.findIndex(w => w.nationalId === data.nationalId);
      if (workerIndex === -1) return alert("کارگر با این کد ملی یافت نشد. لطفا ابتدا در لیست پرسنل ثبت نام کنید.");
      const newExam: Exam = {
          id: generateId(),
          date: new Date().toISOString().split('T')[0],
          ...data
      };
      const updatedWorkers = [...workers];
      const worker = { ...updatedWorkers[workerIndex] };
      worker.exams = [newExam, ...worker.exams];
      
      // Referral Logic Update:
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
            workYears: selectedWorker.workYears,
            personnelCode: selectedWorker.personnelCode || ''
        });
        setShowEditWorkerModal(true);
    }
  };

  const handleUpdateWorker = () => {
    if (!selectedWorker) return;
    handleUpdateWorkerData(selectedWorker.id, {
        name: editWorkerData.name,
        department: editWorkerData.department,
        workYears: Number(editWorkerData.workYears),
        personnelCode: editWorkerData.personnelCode
    });
    setShowEditWorkerModal(false);
  };

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showEditWorkerModal, setShowEditWorkerModal] = useState(false);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [editWorkerData, setEditWorkerData] = useState({ name: '', department: '', workYears: 0, personnelCode: '' });
  const [newExamData, setNewExamData] = useState(INITIAL_NEW_EXAM_STATE);
  const [newWorkerData, setNewWorkerData] = useState({ nationalId: '', personnelCode: '', name: '', department: '', workYears: '' });

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
        {!selectedWorker && !showAssessmentForm && activeTab !== 'newExam' && (
          <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            {renderNav()}
          </div>
        )}
        
        {/* VIEW: New Exam Form (Full Page) */}
        {activeTab === 'newExam' && (
            <ExamForm 
                initialData={newExamData}
                workerName={workers.find(w => w.nationalId === newExamData.nationalId)?.name}
                onSubmit={handleConfirmSaveExam}
                onCancel={() => {
                    setActiveTab(user.role === 'doctor' ? 'worklist' : 'dashboard');
                    setNewExamData(INITIAL_NEW_EXAM_STATE);
                }}
            />
        )}
        
        {/* VIEW: New Worker Registration */}
        {activeTab === 'newWorker' && !selectedWorker && (
             <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10 max-w-2xl mx-auto shadow-xl">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <UserPlus className="w-6 h-6 text-blue-500" />
                    ثبت نام پرسنل جدید
                </h2>
                <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2 block">کد ملی</label>
                            <input 
                                type="text" 
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 focus:border-cyan-500 outline-none text-slate-900 dark:text-white"
                                value={newWorkerData.nationalId}
                                onChange={(e) => setNewWorkerData({...newWorkerData, nationalId: e.target.value})}
                                placeholder="کد ملی 10 رقمی..."
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2 block">کد پرسنلی</label>
                            <input 
                                type="text" 
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 focus:border-cyan-500 outline-none text-slate-900 dark:text-white"
                                value={newWorkerData.personnelCode}
                                onChange={(e) => setNewWorkerData({...newWorkerData, personnelCode: e.target.value})}
                                placeholder="کد پرسنلی..."
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2 block">نام و نام خانوادگی</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 focus:border-cyan-500 outline-none text-slate-900 dark:text-white"
                            value={newWorkerData.name}
                            onChange={(e) => setNewWorkerData({...newWorkerData, name: e.target.value})}
                            placeholder="مثال: علی محمدی"
                        />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2 block">واحد سازمانی</label>
                            <input 
                                type="text" 
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 focus:border-cyan-500 outline-none text-slate-900 dark:text-white"
                                value={newWorkerData.department}
                                onChange={(e) => setNewWorkerData({...newWorkerData, department: e.target.value})}
                                placeholder="مثال: تولید، اداری..."
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2 block">سابقه کار (سال)</label>
                            <input 
                                type="number" 
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 focus:border-cyan-500 outline-none text-slate-900 dark:text-white"
                                value={newWorkerData.workYears}
                                onChange={(e) => setNewWorkerData({...newWorkerData, workYears: e.target.value})}
                                placeholder="0"
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 py-4 my-2 border-t border-b border-slate-200 dark:border-white/10">
                        <div className="flex-1 h-px bg-slate-200 dark:bg-white/10"></div>
                        <span className="text-xs text-slate-400">یا بارگذاری گروهی</span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-white/10"></div>
                    </div>

                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-500" />
                        <span className="text-slate-600 dark:text-slate-300">انتخاب فایل اکسل (XLSX)</span>
                        <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportFile} className="hidden" />
                    </label>
                    
                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setActiveTab('dashboard')} className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-white py-3 rounded-xl font-bold transition-colors">انصراف</button>
                        <button onClick={handleRegisterWorker} className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all">ثبت پرسنل</button>
                    </div>
                </div>
             </div>
        )}

        {/* VIEW: Doctor Worklist */}
        {activeTab === 'worklist' && user.role === 'doctor' && !selectedWorker && (
            <DoctorWorklist 
                workers={workers} 
                onSelectWorker={setSelectedWorker} 
                onStartExam={handleStartExamForWorker}
            />
        )}
        
        {/* VIEW: Dashboards & Lists */}
        {activeTab === 'dashboard' && !selectedWorker && user.role !== 'doctor' && (
            <Dashboard 
                workers={workers} 
                onViewCritical={() => setActiveTab('critical_list')} 
                isDark={isDark} 
                onSelectWorker={setSelectedWorker} // Pass the handler
            />
        )}
        {activeTab === 'worker_list' && !selectedWorker && (
            <WorkerList 
                workers={workers} 
                onSelectWorker={setSelectedWorker} 
                onUpdateWorker={handleUpdateWorkerData} 
                onStartExam={user.role === 'doctor' ? handleStartExamForWorker : undefined}
            />
        )}
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
