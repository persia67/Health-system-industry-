export type Role = 'doctor' | 'health_officer';

export interface User {
  role: Role;
  name: string;
}

export interface HearingData {
  left: number;
  right: number;
}

export interface SpirometryData {
  fvc: number;
  fev1: number;
  interpretation: 'Normal' | 'Obstructive' | 'Restrictive' | 'Mixed';
}

export interface Exam {
  id: string;
  date: string;
  hearing: HearingData;
  bp: string; // "120/80"
  spirometry: SpirometryData;
  notes?: string;
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
