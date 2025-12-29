
import React, { useRef, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Bar, AreaChart, Area, ReferenceLine } from 'recharts';
import { AlertTriangle, Ear, Wind, Heart, FileText, ArrowLeft, Activity, Edit, Eye, TrendingUp, FileDown, Loader2, Info, CheckCircle, Shield, X, Calendar, Activity as CurveIcon, History, Stethoscope, Briefcase } from 'lucide-react';
import { Worker, Alert, OrganSystemFinding, ReferralStatus, Exam, SpirometryData } from '../types';
import { toJalali } from '../utils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ExamForm from './ExamForm';

interface WorkerProfileProps {
  worker: Worker;
  onBack: () => void;
  onEdit: () => void;
  onUpdateStatus?: (id: number, status: ReferralStatus, note?: string) => void;
  isDark: boolean;
}

const WorkerProfile: React.FC<WorkerProfileProps> = ({ worker, onBack, onEdit, onUpdateStatus, isDark }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showSpecialistModal, setShowSpecialistModal] = useState(false);
  const [specialistNote, setSpecialistNote] = useState('');
  const [viewingExam, setViewingExam] = useState<Exam | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  
  // Helper to generate a Flow-Volume Loop curve for the chart
  const generateSpiroLoopData = (spiro: SpirometryData, isPredicted = false) => {
    const points = [];
    const fvc = isPredicted ? (spiro.fvc * 1.1) : spiro.fvc;
    const pef = isPredicted ? (spiro.pef * 1.1 || 8) : (spiro.pef || 6);
    const interpretation = spiro.interpretation;

    // Peak flow typically occurs at ~15% of FVC
    const vPef = fvc * 0.15;
    
    // 1. Ascending limb (from 0 to PEF)
    for (let v = 0; v <= vPef; v += vPef / 5) {
      points.push({
        volume: v,
        flow: (pef * Math.sin((v / vPef) * (Math.PI / 2))).toFixed(2)
      });
    }

    // 2. Descending limb (from PEF to FVC)
    const steps = 15;
    for (let i = 1; i <= steps; i++) {
      const v = vPef + (i * (fvc - vPef) / steps);
      const x = (v - vPef) / (fvc - vPef); // normalized distance from PEF to FVC (0 to 1)
      
      let flow;
      if (!isPredicted && interpretation === 'Obstructive') {
        flow = pef * Math.pow(1 - x, 2); 
      } else if (!isPredicted && interpretation === 'Restrictive') {
        flow = pef * (1 - x);
      } else {
        flow = pef * (1 - Math.pow(x, 0.8));
      }
      
      points.push({
        volume: parseFloat(v.toFixed(2)),
        flow: Math.max(0, parseFloat(flow.toFixed(2)))
      });
    }

    return points;
  };

  const analyzeSpirometry = (fvc: number, fev1: number) => {
    const ratio = fvc > 0 ? (fev1 / fvc) * 100 : 0;
    let result = 'Normal';
    let color = 'text-emerald-500 dark:text-emerald-400';
    let badgeBg = 'bg-emerald-100 dark:bg-emerald-500/20';

    const isObstructive = ratio < 70;
    const isRestrictive = fvc < 3.5;

    if (isObstructive && isRestrictive) {
      result = 'Mixed';
    } else if (isObstructive) {
      result = 'Obstructive';
    } else if (isRestrictive) {
      result = 'Restrictive';
    }

    return { result, ratio: ratio.toFixed(0), color, badgeBg };
  };

  const latestExam = worker.exams[0];
  const spiroStatus = latestExam ? analyzeSpirometry(latestExam.spirometry.fvc, latestExam.spirometry.fev1) : null;

  const flowVolumeData = useMemo(() => {
    if (!latestExam) return [];
    const measured = generateSpiroLoopData(latestExam.spirometry, false);
    const predicted = generateSpiroLoopData(latestExam.spirometry, true);
    
    return measured.map((m, i) => ({
        volume: m.volume,
        measured: m.flow,
        predicted: predicted[i]?.flow || 0
    }));
  }, [latestExam]);

  const handleGeneratePDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    try {
        const pages = printRef.current.querySelectorAll('.print-page');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i] as HTMLElement;
            const canvas = await html2canvas(page, { scale: 2, useCORS: true, backgroundColor: isDark ? '#0f172a' : '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }
        pdf.save(`Report_${worker.nationalId}.pdf`);
    } catch (error) { console.error(error); } finally { setIsGeneratingPdf(false); }
  };
  
  const handleResolveReferral = () => {
      if (onUpdateStatus) {
          onUpdateStatus(worker.id, 'none', specialistNote);
          setShowSpecialistModal(false);
      }
  };

  const audiogramData = latestExam ? [
      { hz: '250', left: latestExam.hearing.left[0], right: latestExam.hearing.right[0] },
      { hz: '500', left: latestExam.hearing.left[1], right: latestExam.hearing.right[1] },
      { hz: '1k', left: latestExam.hearing.left[2], right: latestExam.hearing.right[2] },
      { hz: '2k', left: latestExam.hearing.left[3], right: latestExam.hearing.right[3] },
      { hz: '4k', left: latestExam.hearing.left[4], right: latestExam.hearing.right[4] },
      { hz: '8k', left: latestExam.hearing.left[5], right: latestExam.hearing.right[5] },
  ] : [];

  const comparisonAudiogramData = [250, 500, 1000, 2000, 4000, 8000].map((f, idx) => ({
      hz: f,
      l_curr: latestExam ? latestExam.hearing.left[idx] : null,
      r_curr: latestExam ? latestExam.hearing.right[idx] : null,
  }));

  const spiroTrendData = worker.exams.map(exam => ({
    dateLabel: toJalali(exam.date),
    fvc: exam.spirometry.fvc,
    fev1: exam.spirometry.fev1,
    ratio: exam.spirometry.fev1_fvc,
  })).reverse();

  const chartTextColor = isDark ? '#94a3b8' : '#475569';
  const chartGridColor = isDark ? '#ffffff10' : '#00000010';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#cbd5e1';

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
      
      {/* View Exam Modal */}
      {viewingExam && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="w-full max-w-6xl max-h-[95vh] overflow-hidden rounded-2xl">
                 <ExamForm 
                    initialData={{...viewingExam, nationalId: worker.nationalId}} 
                    workerName={worker.name}
                    onSubmit={() => {}} // No-op
                    onCancel={() => setViewingExam(null)}
                    readOnly={true}
                 />
             </div>
        </div>
      )}

      {showSpecialistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-md w-full">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">ثبت نتیجه ارجاع تخصصی</h3>
                <textarea 
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white h-32 mb-4 focus:outline-none"
                    placeholder="نتیجه معاینه متخصص..."
                    value={specialistNote}
                    onChange={(e) => setSpecialistNote(e.target.value)}
                />
                <div className="flex gap-3">
                    <button onClick={() => setShowSpecialistModal(false)} className="flex-1 p-2 rounded-xl bg-slate-200 dark:bg-slate-700">انصراف</button>
                    <button onClick={handleResolveReferral} className="flex-1 p-2 rounded-xl bg-emerald-600 text-white font-bold">تایید</button>
                </div>
            </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button onClick={onBack} className="flex items-center text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors group">
            <ArrowLeft className="w-5 h-5 ml-2 group-hover:-translate-x-1 transition-transform" />
            بازگشت
        </button>
        <div className="flex gap-3">
            {worker.referralStatus === 'pending_specialist_result' && onUpdateStatus && (
                <button onClick={() => setShowSpecialistModal(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold">ثبت نتیجه ارجاع</button>
            )}
            <button onClick={handleGeneratePDF} disabled={isGeneratingPdf} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold">
                {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileDown className="w-4 h-4" />}
                دانلود گزارش
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-200 dark:border-white/10 shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{worker.name}</h2>
            <div className="flex gap-4 text-slate-500 text-sm">
              <span>کد ملی: {worker.nationalId}</span>
              <span>واحد: {worker.department}</span>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 ${worker.referralStatus !== 'none' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {worker.referralStatus !== 'none' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            {worker.referralStatus === 'waiting_for_doctor' ? 'منتظر پزشک' : worker.referralStatus === 'pending_specialist_result' ? 'منتظر متخصص' : 'نرمال'}
          </div>
        </div>
      </div>

      <div ref={printRef} className="space-y-6">
        <div className="print-page space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Audiometry Section */}
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Ear className="w-5 h-5 text-blue-500" />
                        شنوایی سنجی
                    </h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={audiogramData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                                <XAxis dataKey="hz" stroke={chartTextColor} />
                                <YAxis reversed domain={[0, 100]} stroke={chartTextColor} />
                                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }} />
                                <Legend />
                                <Line type="monotone" dataKey="left" name="گوش چپ" stroke="#3b82f6" strokeWidth={3} dot={{r: 5}} />
                                <Line type="monotone" dataKey="right" name="گوش راست" stroke="#ef4444" strokeWidth={3} dot={{r: 5}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* FLOW-VOLUME LOOP CHART */}
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-5">
                        <CurveIcon className="w-24 h-24" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Wind className="w-5 h-5 text-emerald-500" />
                        منحنی جریان-حجم (Flow-Volume Loop)
                    </h3>
                    <div className="h-[280px] w-full bg-slate-50/50 dark:bg-slate-900/20 rounded-xl p-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={flowVolumeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                                <XAxis 
                                    dataKey="volume" 
                                    type="number" 
                                    domain={[0, 7]} 
                                    label={{ value: 'Volume (L)', position: 'insideBottomRight', offset: -5, fill: chartTextColor, fontSize: 10 }}
                                    stroke={chartTextColor}
                                    tick={{fontSize: 10}}
                                />
                                <YAxis 
                                    domain={[0, 12]} 
                                    label={{ value: 'Flow (L/s)', angle: -90, position: 'insideLeft', fill: chartTextColor, fontSize: 10 }}
                                    stroke={chartTextColor}
                                    tick={{fontSize: 10}}
                                />
                                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, fontSize: '10px' }} />
                                <Legend iconType="plainUnderline" wrapperStyle={{fontSize: '11px', paddingTop: '10px'}} />
                                <Line type="monotone" dataKey="predicted" name="Predicted (نرمال)" stroke={isDark ? '#94a3b8' : '#cbd5e1'} strokeDasharray="5 5" dot={false} strokeWidth={1} />
                                <Line type="monotone" dataKey="measured" name="PRE (اندازه‌گیری)" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Occupational History Display */}
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-500" />
                سوابق شغلی و مواجهه قبلی
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {latestExam?.occupationalHistory && latestExam.occupationalHistory.length > 0 ? (
                  latestExam.occupationalHistory.map((entry) => (
                    <div key={entry.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 rounded-bl-lg">
                        {entry.years} سال سابقه
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">{entry.company}</h4>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{entry.jobTitle}</p>
                      <div className="mt-3 p-2 bg-white dark:bg-slate-800 rounded border border-slate-100 dark:border-white/5">
                        <span className="text-[10px] text-slate-500 block mb-1">عوامل زیان‌آور:</span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{entry.hazards || 'موردی ذکر نشده'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-6 text-center text-slate-400 italic text-sm">سابقه شغلی قبلی ثبت نشده است.</div>
                )}
              </div>
            </div>

            {/* Health Trends Section */}
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    روند سلامت در طول زمان
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="h-[200px]">
                        <h4 className="text-xs text-center text-slate-500 mb-2">تغییرات شنوایی</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={comparisonAudiogramData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                                <XAxis dataKey="hz" stroke={chartTextColor} tick={{fontSize: 10}} />
                                <YAxis reversed domain={[0, 100]} stroke={chartTextColor} tick={{fontSize: 10}} />
                                <Line type="monotone" dataKey="l_curr" name="چپ" stroke="#3b82f6" strokeWidth={2} dot={{r: 3}} />
                                <Line type="monotone" dataKey="r_curr" name="راست" stroke="#ef4444" strokeWidth={2} dot={{r: 3}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="h-[200px]">
                        <h4 className="text-xs text-center text-slate-500 mb-2">روند ظرفیت ریوی</h4>
                         <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={spiroTrendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                                <XAxis dataKey="dateLabel" stroke={chartTextColor} tick={{fontSize: 10}} />
                                <YAxis stroke={chartTextColor} tick={{fontSize: 10}} />
                                <Bar dataKey="fvc" name="FVC" fill="#10b981" barSize={12} />
                                <Bar dataKey="fev1" name="FEV1" fill="#059669" barSize={12} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="h-[200px]">
                        <h4 className="text-xs text-center text-slate-500 mb-2">روند نسبت FEV1/FVC</h4>
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={spiroTrendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                                <XAxis dataKey="dateLabel" stroke={chartTextColor} tick={{fontSize: 10}} />
                                <YAxis domain={[0, 100]} stroke={chartTextColor} tick={{fontSize: 10}} />
                                <Line type="monotone" dataKey="ratio" name="نسبت" stroke="#f59e0b" strokeWidth={3} dot={{r: 4}} />
                                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
             </div>
        </div>

        {/* History List Section */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" />
                تاریخچه معاینات و مراجعات
            </h3>
            
            <div className="space-y-3">
                {worker.exams.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">هیچ سابقه‌ای ثبت نشده است.</div>
                ) : (
                    worker.exams.map((exam, index) => (
                        <div key={exam.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-blue-500/30 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-full text-blue-600 dark:text-blue-400">
                                    <Stethoscope className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white text-lg">
                                        {index === 0 ? 'معاینه ادواری (آخرین)' : 'معاینه ادواری / سابقه'}
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                                        <Calendar className="w-3 h-3" />
                                        تاریخ: {toJalali(exam.date)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                <div className="text-center md:text-right">
                                    <div className="text-xs text-slate-500 mb-1">نتیجه نهایی</div>
                                    <span className={`font-bold px-3 py-1 rounded-lg text-sm ${
                                        exam.finalOpinion.status === 'fit' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                        exam.finalOpinion.status === 'conditional' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                                        'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                                    }`}>
                                        {exam.finalOpinion.status === 'fit' ? 'بلامانع' : exam.finalOpinion.status === 'conditional' ? 'مشروط' : 'عدم صلاحیت'}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => setViewingExam(exam)}
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-lg text-sm font-bold transition-colors"
                                >
                                    مشاهده جزئیات
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfile;
