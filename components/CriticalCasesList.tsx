import React from 'react';
import { ArrowRight, AlertTriangle, FileText, Activity, Stethoscope } from 'lucide-react';
import { Worker } from '../types';

interface Props {
  workers: Worker[];
  onSelectWorker: (worker: Worker) => void;
  onBack: () => void;
}

const CriticalCasesList: React.FC<Props> = ({ workers, onSelectWorker, onBack }) => {
  const criticalCases = workers.filter(w => {
    const lastExam = w.exams[0];
    const isReferred = w.referralStatus !== 'none';
    
    // Condition 1: Active Referral Workflow
    if (isReferred) return true;
    
    // Condition 2: Health Issues (if not already referred)
    if (!lastExam) return false;
    
    const avgLeft = lastExam.hearing.left.length > 0 
      ? lastExam.hearing.left.reduce((a, b) => a + b, 0) / lastExam.hearing.left.length 
      : 0;
    const avgRight = lastExam.hearing.right.length > 0 
      ? lastExam.hearing.right.reduce((a, b) => a + b, 0) / lastExam.hearing.right.length 
      : 0;

    const hasHearingIssue = avgLeft > 25 || avgRight > 25;
    const hasSpiroIssue = lastExam.spirometry.interpretation !== 'Normal';
    const hasUnfitStatus = lastExam.finalOpinion.status !== 'fit';

    return hasHearingIssue || hasSpiroIssue || hasUnfitStatus;
  });

  return (
    <div className="animate-in slide-in-from-right-8 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
            <ArrowRight className="w-6 h-6" />
        </button>
        <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="text-red-500" />
                لیست موارد نیازمند پیگیری
            </h2>
            <p className="text-slate-400 text-sm">شامل ارجاعات فعال و پرونده‌های دارای نتایج غیرطبیعی</p>
        </div>
      </div>

      <div className="grid gap-4">
        {criticalCases.length === 0 ? (
            <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-white/5 border-dashed">
                <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">هیچ مورد بحرانی یا نیازمند پیگیری یافت نشد.</p>
            </div>
        ) : (
            criticalCases.map(worker => {
                const lastExam = worker.exams[0];
                return (
                    <div key={worker.id} className="bg-slate-800/80 p-6 rounded-2xl border border-white/5 hover:border-red-500/30 transition-all group flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-white">{worker.name}</h3>
                                <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded">کد ملی: {worker.nationalId}</span>
                                <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded">{worker.department}</span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mt-3">
                                {worker.referralStatus === 'waiting_for_doctor' && (
                                    <span className="bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-lg text-sm border border-cyan-500/20 flex items-center gap-1">
                                        <Stethoscope className="w-3 h-3" /> منتظر معاینه پزشک
                                    </span>
                                )}
                                {worker.referralStatus === 'pending_specialist_result' && (
                                    <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-lg text-sm border border-purple-500/20 flex items-center gap-1">
                                        <Activity className="w-3 h-3" /> منتظر نتیجه متخصص
                                    </span>
                                )}
                                {lastExam && lastExam.spirometry.interpretation !== 'Normal' && (
                                    <span className="bg-red-500/10 text-red-400 px-3 py-1 rounded-lg text-sm border border-red-500/20">
                                        اسپیرومتری: {lastExam.spirometry.interpretation}
                                    </span>
                                )}
                                {lastExam && lastExam.finalOpinion.status !== 'fit' && (
                                    <span className="bg-orange-500/10 text-orange-400 px-3 py-1 rounded-lg text-sm border border-orange-500/20">
                                        وضعیت: {lastExam.finalOpinion.status === 'conditional' ? 'مشروط' : 'عدم صلاحیت'}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={() => onSelectWorker(worker)}
                            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-black/20 flex items-center gap-2 whitespace-nowrap"
                        >
                            <FileText className="w-4 h-4" />
                            بررسی پرونده و پیگیری
                        </button>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};

export default CriticalCasesList;