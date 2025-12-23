
import { Worker } from '../types';
import * as XLSX from 'xlsx';
import { SecurityService } from './securityService';

const WORKERS_KEY = 'ohs_workers_data_secure_v3'; // Changed key to force migration/reset
const LAST_SYNC_KEY = 'ohs_last_sync_time';

// Default Mock Data
const INITIAL_MOCK_DATA: Worker[] = [
  {
    id: 1,
    nationalId: '0123456789',
    personnelCode: '9001',
    name: 'علی احمدی',
    department: 'وان مذاب',
    workYears: 8,
    referralStatus: 'waiting_for_doctor',
    healthAssessment: {
        date: '2025-02-01',
        officerName: 'مهندس راد',
        hazards: { noise: true, dust: false, chemicals: true, ergonomics: false, radiation: false, biological: false },
        ppeStatus: 'moderate',
        description: 'مواجهه با بخارات اسیدی. شکایت از سوزش چشم.',
        needsDoctorVisit: true
    },
    exams: [
      { 
        id: '101',
        date: '2025-01-15', 
        hearing: { 
            left: [10, 15, 20, 25, 40, 50], 
            right: [10, 10, 15, 20, 30, 40],
            speech: { left: { srt: '15', sds: '96' }, right: { srt: '10', sds: '100' } },
            report: 'افت شنوایی خفیف در فرکانس‌های بالا گوش چپ مشاهده شد.'
        }, 
        bp: '130/85', 
        spirometry: { fvc: 4.2, fev1: 2.8, fev1_fvc: 66, pef: 450, interpretation: 'Obstructive' },
        vision: { 
            acuity: { right: { uncorrected: '10/10', corrected: '' }, left: { uncorrected: '9/10', corrected: '' } },
            colorVision: 'Normal', visualField: 'Normal', depthPerception: 'Normal'
        },
        medicalHistory: [],
        organSystems: {
            general: { systemName: 'general', symptoms: [], signs: [], description: '' },
            eyes: { systemName: 'eyes', symptoms: [], signs: [], description: '' },
            skin: { systemName: 'skin', symptoms: [], signs: [], description: '' },
            ent: { systemName: 'ent', symptoms: [], signs: [], description: '' },
            lungs: { systemName: 'lungs', symptoms: [], signs: [], description: '' },
            cardio: { systemName: 'cardio', symptoms: [], signs: [], description: '' },
            digestive: { systemName: 'digestive', symptoms: [], signs: [], description: '' },
            musculoskeletal: { systemName: 'musculoskeletal', symptoms: [], signs: [], description: '' },
            neuro: { systemName: 'neuro', symptoms: [], signs: [], description: '' },
            psych: { systemName: 'psych', symptoms: [], signs: [], description: '' }
        },
        labResults: {},
        finalOpinion: { status: 'fit' }
      }
    ]
  }
];

export const StorageService = {
    // Load workers from local storage (Encrypted)
    loadWorkers: (): Worker[] => {
        try {
            const encryptedData = localStorage.getItem(WORKERS_KEY);
            if (encryptedData) {
                const decrypted = SecurityService.decrypt<Worker[]>(encryptedData);
                return decrypted || [];
            }
            // If empty, initialize with mock data and save it
            const initialEncrypted = SecurityService.encrypt(INITIAL_MOCK_DATA);
            localStorage.setItem(WORKERS_KEY, initialEncrypted);
            return INITIAL_MOCK_DATA;
        } catch (e) {
            console.error("Failed to load data", e);
            return [];
        }
    },

    // Save workers to local storage (Encrypted)
    saveWorkers: (workers: Worker[]) => {
        try {
            const encrypted = SecurityService.encrypt(workers);
            localStorage.setItem(WORKERS_KEY, encrypted);
        } catch (e) {
            console.error("Failed to save data", e);
        }
    },

    // Create a JSON backup file (Full Data)
    createBackup: (workers: Worker[]) => {
        // We export plain JSON for backup so user can use it, but import verifies structure
        const dataStr = JSON.stringify(workers, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `OHS_Backup_Full_${new Date().toISOString().slice(0, 10)}.json`;
        link.href = url;
        link.click();
    },

    // Export to Excel (Report format)
    exportToExcel: (workers: Worker[]) => {
        const rows = workers.map(w => {
            const lastExam = w.exams.length > 0 ? w.exams[0] : null;
            return {
                'نام و نام خانوادگی': w.name,
                'کد ملی': w.nationalId,
                'کد پرسنلی': w.personnelCode || '-',
                'واحد سازمانی': w.department,
                'سابقه کار (سال)': w.workYears,
                'وضعیت ارجاع': w.referralStatus === 'none' ? 'نرمال' : (w.referralStatus === 'waiting_for_doctor' ? 'منتظر معاینه' : 'منتظر متخصص'),
                'تاریخ آخرین معاینه': lastExam ? lastExam.date : '-',
                'وضعیت نهایی': lastExam ? (lastExam.finalOpinion.status === 'fit' ? 'بلامانع' : (lastExam.finalOpinion.status === 'conditional' ? 'مشروط' : 'عدم صلاحیت')) : '-',
                'فشار خون': lastExam ? lastExam.bp : '-',
                'تفسیر اسپیرومتری': lastExam ? lastExam.spirometry.interpretation : '-',
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Workers List");
        
        const wscols = [
            {wch: 20}, {wch: 15}, {wch: 15}, {wch: 20}, {wch: 10}, 
            {wch: 20}, {wch: 15}, {wch: 15}, {wch: 10}, {wch: 20}
        ];
        worksheet['!cols'] = wscols;

        XLSX.writeFile(workbook, `OHS_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    },

    restoreBackup: (file: File): Promise<Worker[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target?.result as string);
                    if (Array.isArray(json) && (json.length === 0 || (json[0].id && json[0].nationalId))) {
                        // Encrypt immediately upon restore
                        const encrypted = SecurityService.encrypt(json);
                        localStorage.setItem(WORKERS_KEY, encrypted);
                        resolve(json);
                    } else {
                        reject("Invalid file format");
                    }
                } catch (e) {
                    reject("Failed to parse JSON");
                }
            };
            reader.readAsText(file);
        });
    },

    factoryReset: (): Worker[] => {
        localStorage.removeItem(WORKERS_KEY);
        const encrypted = SecurityService.encrypt(INITIAL_MOCK_DATA);
        localStorage.setItem(WORKERS_KEY, encrypted);
        return INITIAL_MOCK_DATA;
    },
    
    getLastSync: (): string | null => {
        return localStorage.getItem(LAST_SYNC_KEY);
    },
    
    setLastSync: (date: string) => {
        localStorage.setItem(LAST_SYNC_KEY, date);
    }
};
