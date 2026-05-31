
import React, { useState, useEffect } from 'react';
import { 
  Shield, Activity, Plus, LogOut, UserPlus, ListChecks, Users, 
  Database, Key, Building2 
} from './components/Icons';
import { User, Worker, Exam, OccupationalHistoryEntry } from './types';
import Dashboard from './components/Dashboard';
import WorkerProfile from './components/WorkerProfile';
import ChatWidget from './components/ChatWidget';
import DoctorWorklist from './components/DoctorWorklist';
import CriticalCasesList from './components/CriticalCasesList';
import WorkerList from './components/WorkerList';
import Login from './components/Login';
import LicenseActivation from './components/LicenseActivation';
import UserManagement from './components/UserManagement';
import OrganizationManagement from './components/OrganizationManagement';
import DataManagementModal from './components/DataManagementModal';
import ThemeToggle from './components/ThemeToggle';
import ExamForm from './components/ExamForm';
import { generateId } from './utils';
import { AuthService } from './services/authService';
import { StorageService } from './services/storageService';
import { FLATTENED_HISTORY_QUESTIONS, ORGAN_SYSTEMS_CONFIG } from './constants';
import * as XLSX from 'xlsx';
import { theme } from './styles';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const INITIAL_NEW_EXAM_STATE: Omit<Exam, 'id' | 'date'> & { nationalId: string } = {
  nationalId: '',
  height: undefined,
  weight: undefined,
  bmi: undefined,
  pulse: undefined,
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
  medicalHistory: FLATTENED_HISTORY_QUESTIONS.map((item) => ({ 
      id: item.id, 
      category: item.category,
      question: item.question, 
      hasCondition: false, 
      description: '' 
  })),
  occupationalHistory: [],
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'worker_list' | 'newExam' | 'newWorker' | 'worklist' | 'critical_list' | 'user_management' | 'org_management'>('dashboard');
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  
  const [workers, setWorkers] = useState<Worker[]>([]); 
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  
  // States for Modals/Forms
  const [newExamData, setNewExamData] = useState(INITIAL_NEW_EXAM_STATE);
  const [newWorkerData, setNewWorkerData] = useState({ nationalId: '', personnelCode: '', name: '', department: '', workYears: '' });
  const [showEditWorkerModal, setShowEditWorkerModal] = useState(false);
  const [editWorkerData, setEditWorkerData] = useState({ name: '', department: '', workYears: 0, personnelCode: '' });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false); // Used in ExamForm logic internally mostly

  useEffect(() => {
    const savedTheme = localStorage.getItem('ohs_theme');
    setIsDark(savedTheme === 'dark');
    if (savedTheme === 'dark') document.body.classList.add('dark');
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('ohs_theme', next ? 'dark' : 'light');
    if (next) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  };

  // Listener for Historical Import
  useEffect(() => {
      const handleImportHistory = (event: CustomEvent) => {
          processHistoricalData(event.detail);
      };
      window.addEventListener('import-history' as any, handleImportHistory as any);
      return () => window.removeEventListener('import-history' as any, handleImportHistory as any);
  }, [workers]);

  const processHistoricalData = (data: any[]) => {
      let newWorkers = [...workers];
      let updatedCount = 0;
      data.forEach((row, index) => {
          const name = row['نام و نام خانوادگی'] || row['نام'];
          if (!name) return;
          let worker = newWorkers.find(w => w.name.includes(name));
          if (!worker) {
              worker = {
                  id: Date.now() + index,
                  name: name,
                  nationalId: `TEMP-${Date.now()}-${index}`,
                  department: 'نامشخص',
                  workYears: 0,
                  referralStatus: 'none',
                  exams: []
              };
              newWorkers.push(worker);
          }
          const exam: Exam = {
              id: `HIST-${Date.now()}-${index}`,
              date: '2024-03-20',
              medicalHistory: [],
              occupationalHistory: [],
              organSystems: {},
              hearing: { left: [0,0,0,0,0,0], right: [0,0,0,0,0,0], speech: { left: { srt: '', sds: '', ucl: '' }, right: { srt: '', sds: '', ucl: '' } }, report: 'Normal' },
              bp: row['فشار خون'] || '',
              spirometry: { fvc: 0, fev1: 0, fev1_fvc: 0, pef: 0, interpretation: 'Normal' },
              vision: { acuity: { right: { uncorrected: '', corrected: '' }, left: { uncorrected: '', corrected: '' } }, colorVision: 'Normal', visualField: 'Normal', depthPerception: '' },
              labResults: {},
              finalOpinion: { status: 'fit' }
          };
          worker.exams.unshift(exam);
          updatedCount++;
      });
      setWorkers(newWorkers);
      alert(`${updatedCount} رکورد اضافه شد.`);
      setShowDataManagement(false);
  };

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
    setWorkers(StorageService.loadWorkers());
    setLastSyncDate(StorageService.getLastSync());
    const license = AuthService.getLicenseInfo();
    setAppState(license.type === 'full' ? 'login' : 'license');
  }, []);

  useEffect(() => {
      if (workers.length > 0) StorageService.saveWorkers(workers);
  }, [workers]);

  const handleSelectApiKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleAuthenticated = (loggedInUser: User) => {
      setUser(loggedInUser);
      setAppState('app');
      setActiveTab(loggedInUser.role === 'doctor' ? 'worklist' : 'dashboard');
  };

  const handleLicenseActivated = () => setAppState('login');

  const handleSaveAssessment = (assessment: any) => {
      if (!selectedWorker) return;
      const updatedWorkers = workers.map(w => w.id === selectedWorker.id ? { ...w, healthAssessment: assessment, referralStatus: assessment.needsDoctorVisit ? 'waiting_for_doctor' as any : 'none' as any } : w);
      setWorkers(updatedWorkers);
      setSelectedWorker(null);
      setShowAssessmentForm(false);
  };

  const handleRegisterWorker = () => {
    if (!newWorkerData.nationalId || !newWorkerData.name) return alert("اطلاعات ناقص است");
    if (workers.some(w => w.nationalId === newWorkerData.nationalId)) return alert("کد ملی تکراری");
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
    setNewWorkerData({ nationalId: '', personnelCode: '', name: '', department: '', workYears: '' });
    setActiveTab('dashboard'); 
  };

  const handleStartExamForWorker = (worker: Worker) => {
      setNewExamData({ ...INITIAL_NEW_EXAM_STATE, nationalId: worker.nationalId });
      setActiveTab('newExam');
  };

  const handleConfirmSaveExam = (data: typeof newExamData) => {
      const workerIndex = workers.findIndex(w => w.nationalId === data.nationalId);
      if (workerIndex === -1) return;
      const newExam: Exam = { id: generateId(), date: new Date().toISOString().split('T')[0], ...data };
      const updatedWorkers = [...workers];
      updatedWorkers[workerIndex].exams = [newExam, ...updatedWorkers[workerIndex].exams];
      updatedWorkers[workerIndex].referralStatus = newExam.finalOpinion.status === 'fit' ? 'none' : 'pending_specialist_result';
      setWorkers(updatedWorkers);
      setNewExamData(INITIAL_NEW_EXAM_STATE);
      setActiveTab('worklist');
  };

  const handleUpdateReferralStatus = (id: number, status: any, note?: string) => {
      setWorkers(prev => prev.map(w => w.id === id ? { ...w, referralStatus: status, specialistFollowUp: note ? { date: new Date().toISOString().split('T')[0], doctorNote: note, result: 'cleared' } : w.specialistFollowUp } : w));
  };

  const handleUpdateWorkerData = (id: number, updatedData: Partial<Worker>) => {
      setWorkers(prev => prev.map(w => w.id === id ? { ...w, ...updatedData } : w));
      if (selectedWorker && selectedWorker.id === id) setSelectedWorker(prev => prev ? { ...prev, ...updatedData } : null);
  };

  if (appState === 'license') return <LicenseActivation onActivated={handleLicenseActivated} />;
  if (appState === 'login' || !user) return <Login onLogin={handleAuthenticated} />;

  const headerStyle: React.CSSProperties = {
    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(8px)',
    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : theme.colors.slate200}`,
    position: 'sticky', top: 0, zIndex: 40, height: '80px',
    display: 'flex', alignItems: 'center', padding: '0 1.5rem', justifyContent: 'space-between'
  };

  const navBtnStyle = (isActive: boolean) => ({
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.75rem 1.5rem', borderRadius: theme.borderRadius.xl,
    fontWeight: 'bold', border: 'none', cursor: 'pointer',
    backgroundColor: isActive ? theme.colors.cyan600 : (isDark ? theme.colors.slate800 : theme.colors.slate200),
    color: isActive ? theme.colors.white : (isDark ? theme.colors.slate400 : theme.colors.slate500),
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: isDark ? theme.colors.slate950 : theme.colors.slate50, color: isDark ? theme.colors.slate100 : theme.colors.slate900, direction: 'rtl', fontFamily: 'Tahoma, sans-serif' }}>
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.5rem', background: `linear-gradient(to bottom right, ${theme.colors.cyan500}, ${theme.colors.blue600})`, borderRadius: theme.borderRadius.lg, color: 'white' }}>
              <Shield />
            </div>
            <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>سیستم مدیریت سلامت شغلی</h1>
                <span style={{ fontSize: '0.75rem', color: theme.colors.cyan600 }}>{user.role} | v{APP_VERSION}</span>
            </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {!hasApiKey && window.aistudio && (
              <button onClick={handleSelectApiKey} style={{ ...navBtnStyle(false), backgroundColor: theme.colors.amber500, color: '#fff' }}>
                <Key /> فعال‌سازی هوش مصنوعی
              </button>
            )}
            <ThemeToggle isDark={isDark} toggle={toggleTheme} />
            <button onClick={() => setShowDataManagement(true)} style={navBtnStyle(false)}>
                <Database /> داده‌ها
            </button>
            <button onClick={() => setAppState('login')} style={{ ...navBtnStyle(false), color: theme.colors.red500 }}>
              <LogOut /> خروج
            </button>
        </div>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {!selectedWorker && !showAssessmentForm && activeTab !== 'newExam' && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {user.role === 'manager' || user.role === 'developer' ? (
                <>
                  <button onClick={() => setActiveTab('dashboard')} style={navBtnStyle(activeTab === 'dashboard')}><Activity /> داشبورد</button>
                  <button onClick={() => setActiveTab('user_management')} style={navBtnStyle(activeTab === 'user_management')}><Users /> کاربران</button>
                  <button onClick={() => setActiveTab('org_management')} style={navBtnStyle(activeTab === 'org_management')}><Building2 /> سازمان‌ها</button>
                  <button onClick={() => setActiveTab('worker_list')} style={navBtnStyle(activeTab === 'worker_list')}><Users /> لیست پرسنل</button>
                </>
            ) : user.role === 'health_officer' ? (
                <>
                  <button onClick={() => setActiveTab('dashboard')} style={navBtnStyle(activeTab === 'dashboard')}><Activity /> داشبورد</button>
                  <button onClick={() => setActiveTab('worker_list')} style={navBtnStyle(activeTab === 'worker_list')}><Users /> لیست پرسنل</button>
                  <button onClick={() => setActiveTab('newWorker')} style={navBtnStyle(activeTab === 'newWorker')}><UserPlus /> ثبت پرسنل</button>
                </>
            ) : (
                <>
                  <button onClick={() => setActiveTab('worklist')} style={navBtnStyle(activeTab === 'worklist')}><ListChecks /> کارتابل</button>
                  <button onClick={() => setActiveTab('worker_list')} style={navBtnStyle(activeTab === 'worker_list')}><Users /> لیست پرسنل</button>
                  <button onClick={() => setActiveTab('newExam')} style={navBtnStyle(activeTab === 'newExam')}><Plus /> معاینه جدید</button>
                </>
            )}
          </div>
        )}

        {activeTab === 'newExam' && <ExamForm initialData={newExamData} workerName={workers.find(w => w.nationalId === newExamData.nationalId)?.name} onSubmit={handleConfirmSaveExam} onCancel={() => { setActiveTab(user.role === 'doctor' ? 'worklist' : 'dashboard'); setNewExamData(INITIAL_NEW_EXAM_STATE); }} />}
        
        {activeTab === 'newWorker' && !selectedWorker && (
             <div style={{ backgroundColor: isDark ? theme.colors.slate800 : theme.colors.white, padding: '1.5rem', borderRadius: theme.borderRadius.xxl, maxWidth: '600px', margin: '0 auto', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : theme.colors.slate200}` }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><UserPlus /> ثبت نام پرسنل جدید</h2>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <input type="text" placeholder="کد ملی" value={newWorkerData.nationalId} onChange={e => setNewWorkerData({...newWorkerData, nationalId: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: theme.borderRadius.lg, border: '1px solid #cbd5e1', backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#fff' : '#000' }} />
                    <input type="text" placeholder="نام و نام خانوادگی" value={newWorkerData.name} onChange={e => setNewWorkerData({...newWorkerData, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: theme.borderRadius.lg, border: '1px solid #cbd5e1', backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#fff' : '#000' }} />
                    <input type="text" placeholder="واحد سازمانی" value={newWorkerData.department} onChange={e => setNewWorkerData({...newWorkerData, department: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: theme.borderRadius.lg, border: '1px solid #cbd5e1', backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#fff' : '#000' }} />
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button onClick={() => setActiveTab('dashboard')} style={{ flex: 1, padding: '0.75rem', borderRadius: theme.borderRadius.lg, border: 'none', backgroundColor: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#fff' : '#334155' }}>انصراف</button>
                        <button onClick={handleRegisterWorker} style={{ flex: 2, padding: '0.75rem', borderRadius: theme.borderRadius.lg, border: 'none', backgroundColor: theme.colors.blue600, color: '#fff', fontWeight: 'bold' }}>ثبت پرسنل</button>
                    </div>
                </div>
             </div>
        )}

        {activeTab === 'worklist' && user.role === 'doctor' && !selectedWorker && <DoctorWorklist workers={workers} onSelectWorker={setSelectedWorker} onStartExam={handleStartExamForWorker} />}
        {activeTab === 'dashboard' && !selectedWorker && user.role !== 'doctor' && <Dashboard workers={workers} onViewCritical={() => setActiveTab('critical_list')} isDark={isDark} onSelectWorker={setSelectedWorker} />}
        {activeTab === 'worker_list' && !selectedWorker && <WorkerList workers={workers} onSelectWorker={setSelectedWorker} onUpdateWorker={handleUpdateWorkerData} onStartExam={user.role === 'doctor' ? handleStartExamForWorker : undefined} />}
        {selectedWorker && !showAssessmentForm && <WorkerProfile worker={selectedWorker} onBack={() => setSelectedWorker(null)} onEdit={() => setShowEditWorkerModal(true)} onUpdateStatus={handleUpdateReferralStatus} isDark={isDark} />}
        {activeTab === 'critical_list' && !selectedWorker && <CriticalCasesList workers={workers} onSelectWorker={setSelectedWorker} onBack={() => setActiveTab('dashboard')} />}
        {activeTab === 'user_management' && (user.role === 'manager' || user.role === 'developer') && <UserManagement />}
        {activeTab === 'org_management' && (user.role === 'manager' || user.role === 'developer') && <OrganizationManagement />}
      </main>
      
      {showDataManagement && <DataManagementModal workers={workers} onUpdateWorkers={setWorkers} onClose={() => setShowDataManagement(false)} lastSync={lastSyncDate} onSyncComplete={(date) => setLastSyncDate(date)} />}
      {user && <ChatWidget />}
    </div>
  );
};

export default App;
