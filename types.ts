export type Role = 'doctor' | 'health_officer';

export interface User {
  role: Role;
  name: string;
}

// Audiometry frequencies: 250, 500, 1000, 2000, 4000, 8000 Hz
export interface HearingData {
  left: number[];  // Array of 6 values corresponding to frequencies
  right: number[]; // Array of 6 values corresponding to frequencies
  averageLeft?: number; // Calculated average
  averageRight?: number; // Calculated average
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
  
  // Section 4: History
  medicalHistory: MedicalHistoryItem[];
  
  // Section 5: Organ Systems
  organSystems: Record<string, OrganSystemFinding>;
  
  // Section 6 & 7: Paraclinical
  hearing: HearingData;
  vision?: VisionData; // New Vision Section
  bp: string; // "120/80"
  spirometry: SpirometryData;
  labResults: LabResults;
  
  // Section 9: Final Opinion
  finalOpinion: FinalOpinion;
}

export interface Worker {
  id: number;
  nationalId: string;
  name: string;
  department: string;
  workYears: number;
  exams: Exam[];
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