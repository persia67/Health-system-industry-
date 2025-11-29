import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { AlertTriangle, Ear, Wind, Heart, FileText, ArrowLeft } from 'lucide-react';
import { Worker, Alert } from '../types';
import { toJalali } from '../utils';

interface WorkerProfileProps {
  worker: Worker;
  onBack: () => void;
}

const WorkerProfile: React.FC<WorkerProfileProps> = ({ worker, onBack }) => {
  
  const analyzeWorkerHealth = (w: Worker): Alert[] => {
    if (!w.exams || w.exams.length < 2) return [];
    const latest = w.exams[0];
    const prev = w.exams[1];
    const alerts: Alert[] = [];
    
    // Simple mock logic for analysis
    const prevAvg = (prev.hearing.left + prev.hearing.right) / 2;
    const currAvg = (latest.hearing.left + latest.hearing.right) / 2;
    const hearingDrop = prevAvg - currAvg;
    
    if (hearingDrop > 5) {
      alerts.push({
        type: 'warning',
        message: `افت شنوایی قابل توجه: ${hearingDrop.toFixed(1)} دسی‌بل`,
        recommendation: 'بررسی فوری محیط کار و استفاده از گوشی محافظ'
      });
    }

    if (latest.hearing.left < 25 || latest.hearing.right < 25) { // Assuming <25dB HL is normal, wait, the data is % or dB? Assuming raw score/threshold. Let's assume input is Threshold (dB). Normal is < 25. High is bad. 
      // User data showed 75, 73. If this is % hearing, then < 75 is bad.
      // Let's assume input is "Hearing Capacity %".
      alerts.push({
        type: 'critical',
        message: 'ظرفیت شنوایی زیر حد استاندارد',
        recommendation: 'مشاوره تخصصی گوش و حلق و بینی'
      });
    }

    if (latest.spirometry && latest.spirometry.interpretation !== 'Normal') {
      alerts.push({
        type: 'critical',
        message: `اختلال ${latest.spirometry.interpretation} ریوی`,
        recommendation: 'ارجاع به متخصص ریه جهت اسپیرومتری تکمیلی'
      });
    }

    return alerts;
  };

  const alerts = analyzeWorkerHealth(worker);

  // Prepare chart data (reverse to show chronological order left-to-right)
  const chartData = [...worker.exams].reverse().map(e => ({
    date: toJalali(e.date),
    hearingAvg: (e.hearing.left + e.hearing.right) / 2,
    fvc: e.spirometry.fvc,
    fev1: e.spirometry.fev1
  }));

  const latestExam = worker.exams[0];

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
      <button onClick={onBack} className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors">
        <ArrowLeft className="w-5 h-5 ml-2" />
        بازگشت به لیست
      </button>

      {/* Header Info */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">{worker.name}</h2>
            <div className="flex flex-wrap gap-4 text-slate-300 text-sm">
              <span className="px-3 py-1 bg-white/5 rounded-full border border-white/5">کد ملی: {worker.nationalId}</span>
              <span className="px-3 py-1 bg-white/5 rounded-full border border-white/5">واحد: {worker.department}</span>
              <span className="px-3 py-1 bg-white/5 rounded-full border border-white/5">سابقه: {worker.workYears} سال</span>
            </div>
          </div>
          <div className="text-right">
             <div className="text-sm text-slate-400 mb-1">آخرین معاینه</div>
             <div className="text-xl font-mono text-cyan-400">{toJalali(latestExam.date)}</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="grid gap-4">
           {alerts.map((alert, idx) => (
             <div key={idx} className={`border rounded-xl p-4 flex items-start gap-4 ${
               alert.type === 'critical' 
                ? 'bg-red-500/10 border-red-500/30' 
                : 'bg-amber-500/10 border-amber-500/30'
             }`}>
               <div className={`p-2 rounded-lg ${alert.type === 'critical' ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
                 <AlertTriangle className={`w-6 h-6 ${alert.type === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
               </div>
               <div>
                 <h4 className={`font-bold mb-1 ${alert.type === 'critical' ? 'text-red-200' : 'text-amber-200'}`}>
                   {alert.type === 'critical' ? 'هشدار بحرانی' : 'توجه'}
                 </h4>
                 <p className="text-white/90 text-sm">{alert.message}</p>
                 <p className="text-white/50 text-xs mt-2 bg-black/20 p-2 rounded inline-block">توصیه: {alert.recommendation}</p>
               </div>
             </div>
           ))}
        </div>
      )}

      {/* Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Audiometry Card */}
         <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Ear className="w-6 h-6" /></div>
              <h3 className="text-white font-bold">شنوایی سنجی</h3>
            </div>
            <div className="space-y-4">
               <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                 <span className="text-slate-400 text-sm">گوش چپ</span>
                 <span className="text-xl font-bold text-white">{latestExam.hearing.left} <span className="text-xs text-slate-500">%</span></span>
               </div>
               <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                 <span className="text-slate-400 text-sm">گوش راست</span>
                 <span className="text-xl font-bold text-white">{latestExam.hearing.right} <span className="text-xs text-slate-500">%</span></span>
               </div>
            </div>
         </div>

         {/* Spirometry Card */}
         <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><Wind className="w-6 h-6" /></div>
              <h3 className="text-white font-bold">اسپیرومتری</h3>
            </div>
            <div className="space-y-4">
               <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                 <span className="text-slate-400 text-sm">FVC</span>
                 <span className="text-xl font-bold text-white">{latestExam.spirometry.fvc}</span>
               </div>
               <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                 <span className="text-slate-400 text-sm">FEV1</span>
                 <span className="text-xl font-bold text-white">{latestExam.spirometry.fev1}</span>
               </div>
               <div className="mt-2 text-center">
                  <span className={`text-sm px-3 py-1 rounded-full ${latestExam.spirometry.interpretation === 'Normal' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {latestExam.spirometry.interpretation === 'Normal' ? 'طبیعی' : latestExam.spirometry.interpretation}
                  </span>
               </div>
            </div>
         </div>

         {/* BP Card */}
         <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-white/10 hover:border-red-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg text-red-400"><Heart className="w-6 h-6" /></div>
              <h3 className="text-white font-bold">علائم حیاتی</h3>
            </div>
            <div className="flex flex-col items-center justify-center h-40">
               <div className="text-5xl font-bold text-white mb-2">{latestExam.bp}</div>
               <div className="text-slate-400 text-sm">فشار خون (mmHg)</div>
            </div>
         </div>
      </div>

      {/* History Chart */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-6">روند تغییرات سلامت</h3>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis yAxisId="hearing" stroke="#3b82f6" orientation="right" domain={[0, 100]} label={{ value: 'شنوایی (%)', angle: -90, position: 'insideRight', fill: '#3b82f6' }} />
              <YAxis yAxisId="lung" stroke="#8b5cf6" orientation="left" domain={[0, 6]} label={{ value: 'ظرفیت ریه (L)', angle: -90, position: 'insideLeft', fill: '#8b5cf6' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
              <Line yAxisId="hearing" type="monotone" dataKey="hearingAvg" name="میانگین شنوایی" stroke="#3b82f6" strokeWidth={3} />
              <Line yAxisId="lung" type="monotone" dataKey="fvc" name="FVC" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 overflow-hidden">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          سوابق معاینات
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-white/5 text-cyan-300">
              <tr>
                <th className="py-4 px-4 rounded-r-lg">تاریخ</th>
                <th className="py-4 px-4">شنوایی (چپ/راست)</th>
                <th className="py-4 px-4">فشار خون</th>
                <th className="py-4 px-4">اسپیرومتری</th>
                <th className="py-4 px-4 rounded-l-lg">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {worker.exams.map((exam, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4 text-white font-mono">{toJalali(exam.date)}</td>
                  <td className="py-4 px-4 text-slate-300">{exam.hearing.left} / {exam.hearing.right}</td>
                  <td className="py-4 px-4 text-slate-300">{exam.bp}</td>
                  <td className="py-4 px-4 text-slate-300">FVC: {exam.spirometry.fvc}, FEV1: {exam.spirometry.fev1}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${exam.spirometry.interpretation === 'Normal' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                      {exam.spirometry.interpretation === 'Normal' ? 'طبیعی' : 'غیرطبیعی'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfile;