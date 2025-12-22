
import { Worker } from '../types';
import * as XLSX from 'xlsx';

const WORKERS_KEY = 'ohs_workers_data_v1';
const LAST_SYNC_KEY = 'ohs_last_sync_time';

// Default Mock Data (Used only if storage is empty)
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
        organSystems: {},
        labResults: {},
        finalOpinion: { status: 'fit' }
      }
    ]
  },
  {
    id: 2,
    nationalId: '9876543210',
    personnelCode: '9002',
    name: 'مریم کریمی',
    department: 'کنترل کیفیت',
    workYears: 4,
    referralStatus: 'none',
    exams: [
      { 
        id: '201',
        date: '2025-01-20', 
        hearing: { 
            left: [5, 5, 10, 10, 10, 15], 
            right: [5, 5, 5, 10, 10, 10],
            speech: { left: { srt: '5', sds: '100' }, right: { srt: '5', sds: '100' } },
            report: 'شنوایی نرمال.'
        }, 
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

export const StorageService = {
    // Load workers from local storage
    loadWorkers: (): Worker[] => {
        try {
            const data = localStorage.getItem(WORKERS_KEY);
            if (data) {
                return JSON.parse(data);
            }
            // If empty, initialize with mock data and save it
            localStorage.setItem(WORKERS_KEY, JSON.stringify(INITIAL_MOCK_DATA));
            return INITIAL_MOCK_DATA;
        } catch (e) {
            console.error("Failed to load data", e);
            return [];
        }
    },

    // Save workers to local storage
    saveWorkers: (workers: Worker[]) => {
        try {
            localStorage.setItem(WORKERS_KEY, JSON.stringify(workers));
        } catch (e) {
            console.error("Failed to save data", e);
        }
    },

    // Create a JSON backup file (Full Data)
    createBackup: (workers: Worker[]) => {
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
        // Flatten data for Excel
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
        
        // Fix column widths approximately
        const wscols = [
            {wch: 20}, {wch: 15}, {wch: 15}, {wch: 20}, {wch: 10}, 
            {wch: 20}, {wch: 15}, {wch: 15}, {wch: 10}, {wch: 20}
        ];
        worksheet['!cols'] = wscols;

        XLSX.writeFile(workbook, `OHS_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    },

    // Import a JSON backup file
    restoreBackup: (file: File): Promise<Worker[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target?.result as string);
                    // Simple validation: check if it's an array and has id/nationalId
                    if (Array.isArray(json) && (json.length === 0 || (json[0].id && json[0].nationalId))) {
                        // Update Local Storage immediately
                        localStorage.setItem(WORKERS_KEY, JSON.stringify(json));
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

    // Factory Reset: Clears workers data and resets to initial mock
    factoryReset: (): Worker[] => {
        localStorage.removeItem(WORKERS_KEY);
        // Note: We deliberately do NOT clear users or license info to prevent lockout
        localStorage.setItem(WORKERS_KEY, JSON.stringify(INITIAL_MOCK_DATA));
        return INITIAL_MOCK_DATA;
    },
    
    getLastSync: (): string | null => {
        return localStorage.getItem(LAST_SYNC_KEY);
    },
    
    setLastSync: (date: string) => {
        localStorage.setItem(LAST_SYNC_KEY, date);
    }
};
