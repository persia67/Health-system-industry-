
export type Role = 'doctor' | 'health_officer' | 'manager' | 'developer';

export interface User {
  id: string;
  username: string;
  password?: string; // Optional for when listing users securely
  role: Role;
  name: string;
  createdAt: string;
}

export interface LicenseInfo {
  isActive: boolean;
  type: 'trial' | 'full';
  activationDate: string;
  trialDaysRemaining?: number;
  serialKey?: string;
}

// Audiometry frequencies: 250, 500, 1000, 2000, 4000, 8000 Hz
export interface HearingData {
  left: number[];  // Array of 6 values corresponding to frequencies (Air Conduction)
  right: number[]; // Array of 6 values corresponding to frequencies (Air Conduction)
  
  // New fields based on the uploaded form
  speech: {
    left: { srt: string; sds: string; ucl?: string };
    right: { srt: string; sds: string; ucl?: string };
  };
  report: string; // Audiology Report text box
}

export interface SpirometryData {
  fvc: number;      // Value
  fvcPred?: number; // % Predicted
  fev1: number;     // Value
  fev1Pred?: number; // % Predicted
  fev1_fvc: number; // Ratio %
  pef: number;      // Peak Expiratory Flow
  interpretation: 'Normal' | 'Obstructive' | 'Restrictive' | 'Mixed';
}

export interface VisionData {
  acuity: {
    right: { uncorrected: string; corrected: string };
    left: { uncorrected: string; corrected: string };
  };
  colorVision: 'Normal' | 'Abnormal';
  visualField: 'Normal' | 'Abnormal';
  depthPerception: string;
}

export interface MedicalHistoryItem {
  id: number;
  category: string; // Added category for grouping
  question: string;
  hasCondition: boolean;
  description: string;
}

export interface OrganSystemFinding {
  systemName: string; // e.g., 'Respiratory', 'Cardiac'
  symptoms: string[]; // Checked symptoms
  signs: string[];    // Checked signs
  description: string;
}

export interface LabResults {
  wbc?: string;
  rbc?: string;
  hb?: string;
  plt?: string;
  fbs?: string;
  chol?: string;
  tg?: string;
  creatinine?: string;
  alt?: string;
  ast?: string;
}

export interface FinalOpinion {
  status: 'fit' | 'conditional' | 'unfit';
  conditions?: string;
  reason?: string;
  recommendations?: string;
}

export interface Exam {
  id: string;
  date: string;
  
  // Vital Signs
  height?: number; // cm
  weight?: number; // kg
  bmi?: number;
  pulse?: number;
  bp: string; // "120/80"

  // Section 4: History
  medicalHistory: MedicalHistoryItem[];
  
  // Section 5: Organ Systems
  organSystems: Record<string, OrganSystemFinding>;
  
  // Section 6 & 7: Paraclinical
  hearing: HearingData;
  vision?: VisionData; // New Vision Section
  spirometry: SpirometryData;
  labResults: LabResults;
  
  // Section 9: Final Opinion
  finalOpinion: FinalOpinion;
}

// New Interface for Health Officer Form
export interface HealthAssessment {
  date: string;
  officerName: string;
  hazards: Record<string, boolean>; // Changed to dynamic record for flexibility
  ppeStatus: 'good' | 'moderate' | 'poor';
  description: string;
  needsDoctorVisit: boolean;
}

export interface SpecialistFollowUp {
  date: string;
  doctorNote: string;
  result: 'cleared' | 'permanent_restriction' | 'observation';
}

export type ReferralStatus = 'none' | 'waiting_for_doctor' | 'pending_specialist_result';

export interface Worker {
  id: number;
  nationalId: string;
  personnelCode?: string; // Added field
  name: string;
  department: string;
  workYears: number;
  exams: Exam[];
  
  // Workflow fields
  healthAssessment?: HealthAssessment;
  referralStatus: ReferralStatus;
  specialistFollowUp?: SpecialistFollowUp;
}

export interface Alert {
  type: 'critical' | 'warning' | 'info';
  message: string;
  recommendation: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
