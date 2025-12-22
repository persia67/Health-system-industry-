
import React from 'react';
import { UserCheck, Clock, ArrowRight, Activity, Stethoscope, AlertCircle } from 'lucide-react';
import { Worker } from '../types';

interface Props {
  workers: Worker[];
  onSelectWorker: (worker: Worker) => void;
  onStartExam?: (worker: Worker) => void;
}

interface CardProps {
  worker: Worker;
  type: 'exam' | 'result';
  onSelect: (worker: Worker) => void;
  onStartExam?: (worker: Worker) => void;
}

const Card: React.FC<CardProps> = ({ worker, type, onSelect, onStartExam }) => (
    <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/5 hover:border-cyan-500/30 transition-all flex justify-between items-center group shadow-sm dark:shadow-none">
      <div>
        <h4 className="font-bold text-slate-900 dark:text-white text-lg">{worker.name}</h4>
        <div className="flex gap-3 text-sm text-slate-500 dark:text-slate-400 mt-1">
          <span>کد ملی: {worker.nationalId}</span>
          <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mt-2"></span>
          <span>{worker.department}</span>
        </div>
        {type === 'exam' && worker.healthAssessment && (
             <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2 py-1 rounded inline-block">
                ارجاع توسط بهداشت حرفه‌ای: {worker.healthAssessment.description || 'نیاز به معاینه'}
             </div>
        )}
        {type === 'result' && (
             <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10 px-2 py-1 rounded inline-block">
                منتظر نتیجه ارجاع تخصصی
             </div>
        )}
      </div>
      <div className="flex gap-2">
        {/* Only show Start Exam button for exam type cards and if handler exists */}
        {type === 'exam' && onStartExam && (
            <button 
                onClick={() => onStartExam(worker)}
                className="px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
            >
                <Stethoscope className="w-4 h-4" />
                شروع معاینه
            </button>
        )}
        <button 
            onClick={() => onSelect(worker)}
            className="px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
        >
            <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {type === 'exam' ? 'پروفایل' : 'بررسی'}
        </button>
      </div>
    </div>
);

const DoctorWorklist: React.FC<Props> = ({ workers, onSelectWorker, onStartExam }) => {
  const waitingForExam = workers.filter(w => w.referralStatus === 'waiting_for_doctor');
  const pendingSpecialist = workers.filter(w => w.referralStatus === 'pending_specialist_result');

  return (
    <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Column 1: Waiting Room */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl p-6 min-h-[500px]">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="p-3 bg-cyan-100 dark:bg-cyan-500/20 rounded-xl">
             <Stethoscope className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">لیست انتظار معاینه</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">ارجاع شده توسط کارشناس بهداشت</p>
          </div>
          <span className="mr-auto bg-cyan-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg shadow-cyan-500/20">
            {waitingForExam.length} نفر
          </span>
        </div>

        <div className="space-y-4">
          {waitingForExam.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <UserCheck className="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
              <p className="text-slate-500 dark:text-slate-400">موردی برای نمایش وجود ندارد</p>
            </div>
          ) : (
            waitingForExam.map(w => <Card key={w.id} worker={w} type="exam" onSelect={onSelectWorker} onStartExam={onStartExam} />)
          )}
        </div>
      </div>

      {/* Column 2: Pending Specialist Results */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl p-6 min-h-[500px]">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="p-3 bg-purple-100 dark:bg-purple-500/20 rounded-xl">
             <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">پیگیری ارجاعات تخصصی</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">منتظر ثبت نتیجه متخصص</p>
          </div>
          <span className="mr-auto bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg shadow-purple-500/20">
            {pendingSpecialist.length} نفر
          </span>
        </div>

        <div className="space-y-4">
          {pendingSpecialist.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <Activity className="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
              <p className="text-slate-500 dark:text-slate-400">موردی در انتظار نتیجه نیست</p>
            </div>
          ) : (
            pendingSpecialist.map(w => <Card key={w.id} worker={w} type="result" onSelect={onSelectWorker} />)
          )}
        </div>
      </div>

    </div>
  );
};

export default DoctorWorklist;
