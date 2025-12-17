
import React, { useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Bar } from 'recharts';
import { AlertTriangle, Ear, Wind, Heart, FileText, ArrowLeft, Activity, Edit, Eye, TrendingUp, FileDown, Loader2, Info, CheckCircle, Shield, X, Calendar } from 'lucide-react';
import { Worker, Alert, OrganSystemFinding, ReferralStatus, Exam } from '../types';
import { toJalali } from '../utils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface WorkerProfileProps {
  worker: Worker;
  onBack: () => void;
  onEdit: () => void;
  onUpdateStatus?: (id: number, status: ReferralStatus, note?: string) => void;
  isDark: boolean;
}

const SYSTEM_LABELS: Record<string, string> = {
  general: 'عمومی',
  eyes: 'چشم',
  skin: 'پوست و مو',
  ent: 'گوش، حلق و بینی',
  lungs: 'ریه',
  cardio: 'قلب و عروق',
  digestive: 'شکم و لگن',
  musculoskeletal: 'اسکلتی و عضلانی',
  neuro: 'سیستم عصبی',
  psych: 'اعصاب و روان'
};

const WorkerProfile: React.FC<WorkerProfileProps> = ({ worker, onBack, onEdit, onUpdateStatus, isDark }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showSpecialistModal, setShowSpecialistModal] = useState(false);
  const [specialistNote, setSpecialistNote] = useState('');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null); // State for viewing history details
  const printRef = useRef<HTMLDivElement>(null);
  
  const analyzeSpirometry = (fvc: number, fev1: number) => {
    const ratio = fvc > 0 ? (fev1 / fvc) * 100 : 0;
    let result = 'Normal';
    let color = 'text-emerald-500 dark:text-emerald-400';
    let badgeBg = 'bg-emerald-100 dark:bg-emerald-500/20';
    let explanation = 'عملکرد ریوی در محدوده طبیعی قرار دارد.';
    let details = 'نتایج اسپیرومتری نشان‌دهنده عملکرد طبیعی ریه است. نسبت FEV1/FVC و ظرفیت حیاتی (FVC) در محدوده نرمال قرار دارند.';

    const isObstructive = ratio < 70;
    const isRestrictive = fvc < 3.5; // Demo threshold

    if (isObstructive && isRestrictive) {
      result = 'Mixed';
      color = 'text-red-500 dark:text-red-400';
      badgeBg = 'bg-red-100 dark:bg-red-500/20';
      explanation = `الگوی ترکیبی (Mixed)`;
      details = 'نتایج نشان‌دهنده الگوی ترکیبی (انسدادی و محدودکننده) است. کاهش همزمان نسبت FEV1/FVC و ظرفیت حیاتی (FVC) مشاهده می‌شود که می‌تواند ناشی از وجود همزمان بیماری‌های انسدادی و محدودکننده باشد.';
    } else if (isObstructive) {
      result = 'Obstructive';
      color = 'text-orange-500 dark:text-orange-400';
      badgeBg = 'bg-orange-100 dark:bg-orange-500/20';
      explanation = `الگوی انسدادی (Obstructive)`;
      details = 'نتایج نشان‌دهنده الگوی انسدادی است (FEV1/FVC < 70%). این الگو معمولاً با بیماری‌هایی مانند آسم، برونشیت مزمن یا آمفیزم مرتبط است که در آن راه‌های هوایی باریک شده و بازدم دشوار می‌شود.';
    } else if (isRestrictive) {
      result = 'Restrictive';
      color = 'text-amber-500 dark:text-amber-400';
      badgeBg = 'bg-amber-100 dark:bg-amber-500/20';
      explanation = `الگوی محدودکننده (Restrictive)`;
      details = 'نتایج نشان‌دهنده الگوی محدودکننده است (FVC کاهش یافته). این حالت نشان‌دهنده کاهش حجم ریه است که می‌تواند ناشی از بیماری‌های بافت ریه (مانند فیبروز) یا محدودیت‌های قفسه سینه باشد.';
    }

    return { result, explanation, details, ratio: ratio.toFixed(0), color, badgeBg };
  };

  const latestExam = worker.exams[0];
  const baseExam = worker.exams[worker.exams.length - 1]; // First exam (Baseline)
  
  const spiroStatus = latestExam ? analyzeSpirometry(latestExam.spirometry.fvc, latestExam.spirometry.fev1) : null;

  const handleGeneratePDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);

    try {
        const pages = printRef.current.querySelectorAll('.print-page');
        if (pages.length === 0) return;

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i] as HTMLElement;
            const canvas = await html2canvas(page, { 
                scale: 2, 
                useCORS: true, 
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                logging: false
            });
            
            const imgData = canvas.toDataURL('image/png');
            
            if (i > 0) {
                pdf.addPage();
            }
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }

        pdf.save(`Health_Report_${worker.nationalId}_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (error) {
        console.error("PDF Generation failed", error);
        alert("خطا در ایجاد فایل گزارش");
    } finally {
        setIsGeneratingPdf(false);
    }
  };
  
  const handleResolveReferral = () => {
      if (onUpdateStatus) {
          onUpdateStatus(worker.id, 'none', specialistNote);
          setShowSpecialistModal(false);
      }
  };

  // --- CHART DATA PREPARATION ---

  // 1. Single Audiogram (Latest) for top card - Categorical X-Axis
  const audiogramData = latestExam ? [
      { hz: '250', left: latestExam.hearing.left[0], right: latestExam.hearing.right[0] },
      { hz: '500', left: latestExam.hearing.left[1], right: latestExam.hearing.right[1] },
      { hz: '1k', left: latestExam.hearing.left[2], right: latestExam.hearing.right[2] },
      { hz: '2k', left: latestExam.hearing.left[3], right: latestExam.hearing.right[3] },
      { hz: '4k', left: latestExam.hearing.left[4], right: latestExam.hearing.right[4] },
      { hz: '8k', left: latestExam.hearing.left[5], right: latestExam.hearing.right[5] },
  ] : [];

  // Helper to generate data for the selected exam modal
  const getExamAudiogramData = (exam: Exam) => [
      { hz: '250', left: exam.hearing.left[0], right: exam.hearing.right[0] },
      { hz: '500', left: exam.hearing.left[1], right: exam.hearing.right[1] },
      { hz: '1k', left: exam.hearing.left[2], right: exam.hearing.right[2] },
      { hz: '2k', left: exam.hearing.left[3], right: exam.hearing.right[3] },
      { hz: '4k', left: exam.hearing.left[4], right: exam.hearing.right[4] },
      { hz: '8k', left: exam.hearing.left[5], right: exam.hearing.right[5] },
  ];

  // 2. Comparative Audiogram (Baseline vs Current) - Numeric/Log X-Axis (20Hz - 20000Hz)
  const frequencies = [20, 250, 500, 1000, 2000, 4000, 8000, 20000];
  const freqMap: Record<number, number> = { 250:0, 500:1, 1000:2, 2000:3, 4000:4, 8000:5 };
  
  const comparisonAudiogramData = frequencies.map(f => {
      const idx = freqMap[f];
      const hasData = idx !== undefined;
      return {
          hz: f,
          l_curr: (hasData && latestExam) ? latestExam.hearing.left[idx] : null,
          r_curr: (hasData && latestExam) ? latestExam.hearing.right[idx] : null,
          l_base: (hasData && baseExam) ? baseExam.hearing.left[idx] : null,
          r_base: (hasData && baseExam) ? baseExam.hearing.right[idx] : null,
      };
  });

  // 3. Spirometry Trend (Time based)
  const spiroTrendData = worker.exams.map(exam => ({
    date: new Date(exam.date).getTime(),
    dateLabel: toJalali(exam.date),
    fvc: exam.spirometry.fvc,
    fev1: exam.spirometry.fev1,
    ratio: exam.spirometry.fev1_fvc,
  })).sort((a, b) => a.date - b.date);

  // Chart Theme Colors
  const chartTextColor = isDark ? '#94a3b8' : '#475569';
  const chartGridColor = isDark ? '#ffffff10' : '#00000010';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#cbd5e1';
  const tooltipText = isDark ? '#fff' : '#1e293b';

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
      
      {/* Specialist Result Modal */}
      {showSpecialistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-md w-full">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">ثبت نتیجه ارجاع تخصصی</h3>
                <textarea 
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white h-32 mb-4 focus:outline-none focus:border-cyan-500"
                    placeholder="نتیجه معاینه متخصص و نظر نهایی..."
                    value={specialistNote}
                    onChange={(e) => setSpecialistNote(e.target.value)}
                />
                <div className="flex gap-3">
                    <button onClick={() => setShowSpecialistModal(false)} className="flex-1 p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">انصراف</button>
                    <button onClick={handleResolveReferral} className="flex-1 p-2 rounded-xl bg-emerald-600 text-white font-bold">تایید و خروج از لیست پیگیری</button>
                </div>
            </div>
        </div>
      )}

      {/* Exam Details Modal */}
      {selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 p-4 flex justify-between items-center z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">جزئیات معاینه</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">تاریخ: {toJalali(selectedExam.date)}</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedExam(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Charts Row */}
                    <div className="grid md:grid-cols-2 gap-6">
                         {/* Audiometry */}
                         <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Ear className="w-4 h-4"/> شنوایی سنجی</h4>
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={getExamAudiogramData(selectedExam)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                                    <XAxis dataKey="hz" stroke={chartTextColor} tick={{fill: chartTextColor, fontSize: 10}} />
                                    <YAxis reversed domain={[0, 100]} stroke={chartTextColor} tick={{fill: chartTextColor, fontSize: 10}} />
                                    <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }} />
                                    <Line type="monotone" dataKey="left" stroke="#3b82f6" strokeWidth={2} dot={{r: 3}} />
                                    <Line type="monotone" dataKey="right" stroke="#ef4444" strokeWidth={2} dot={{r: 3}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                <p><strong>گزارش:</strong> {selectedExam.hearing.report || '---'}</p>
                            </div>
                         </div>

                         {/* Spirometry */}
                         <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Wind className="w-4 h-4"/> اسپیرومتری</h4>
                            {(() => {
                                const analysis = analyzeSpirometry(selectedExam.spirometry.fvc, selectedExam.spirometry.fev1);
                                return (
                                    <div className="space-y-4">
                                        <div className={`p-3 rounded-lg border ${analysis.badgeBg} border-transparent`}>
                                            <div className={`font-bold ${analysis.color}`}>{analysis.result}</div>
                                            <div className="text-xs mt-1 opacity-80">{analysis.explanation}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-center">
                                            <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-white/10">
                                                <div className="text-[10px] text-slate-500">FVC</div>
                                                <div className="font-bold">{selectedExam.spirometry.fvc}</div>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-white/10">
                                                <div className="text-[10px] text-slate-500">FEV1</div>
                                                <div className="font-bold">{selectedExam.spirometry.fev1}</div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}
                         </div>
                    </div>

                    {/* Systems & Lab */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Activity className="w-4 h-4"/> یافته‌های بالینی</h4>
                            <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                                {Object.values(selectedExam.organSystems).some((sys: any) => sys.symptoms.length > 0 || sys.signs.length > 0) ? (
                                    Object.entries(selectedExam.organSystems).map(([key, val]) => {
                                        const sys = val as OrganSystemFinding;
                                        if (sys.symptoms.length === 0 && sys.signs.length === 0) return null;
                                        return (
                                            <div key={key} className="text-xs p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-white/10">
                                                <strong className="text-slate-700 dark:text-slate-300 block mb-1">{SYSTEM_LABELS[key] || key}</strong>
                                                <span className="text-slate-500 dark:text-slate-400">
                                                    {sys.symptoms.length > 0 && `علائم: ${sys.symptoms.join(', ')} `}
                                                    {sys.signs.length > 0 && `نشانه‌ها: ${sys.signs.join(', ')}`}
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-xs text-slate-500 text-center py-4">مورد غیرطبیعی گزارش نشده است.</div>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                             <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> نظریه نهایی</h4>
                             <div className={`p-3 rounded-lg text-center mb-3 ${selectedExam.finalOpinion.status === 'fit' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                                 <div className="font-bold text-lg">
                                     {selectedExam.finalOpinion.status === 'fit' ? 'بلامانع' : selectedExam.finalOpinion.status === 'conditional' ? 'مشروط' : 'عدم صلاحیت'}
                                 </div>
                             </div>
                             {selectedExam.finalOpinion.recommendations && (
                                 <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-white/10">
                                     <strong>توصیه:</strong> {selectedExam.finalOpinion.recommendations}
                                 </div>
                             )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button onClick={onBack} className="flex items-center text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors group">
            <ArrowLeft className="w-5 h-5 ml-2 group-hover:-translate-x-1 transition-transform" />
            بازگشت
        </button>
        
        <div className="flex gap-3">
            {worker.referralStatus === 'pending_specialist_result' && onUpdateStatus && (
                <button 
                    onClick={() => setShowSpecialistModal(true)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-purple-900/20"
                >
                    <CheckCircle className="w-4 h-4" />
                    ثبت نتیجه ارجاع تخصصی
                </button>
            )}
            
            {latestExam && (
                <button 
                    onClick={handleGeneratePDF}
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                >
                    {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileDown className="w-4 h-4" />}
                    دانلود گزارش جامع
                </button>
            )}
        </div>
      </div>

      {/* Health Officer Assessment Banner (If exists) */}
      {worker.healthAssessment && (
        <div className="bg-gradient-to-r from-amber-50 to-white dark:from-slate-800 dark:to-slate-800/50 rounded-2xl p-6 border border-amber-300 dark:border-amber-500/30 relative overflow-hidden shadow-lg dark:shadow-none">
            <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
            <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-xl shrink-0"><Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" /></div>
                <div className="flex-1">
                    <h3 className="text-slate-900 dark:text-white font-bold mb-1">ارزیابی ایمنی و بهداشت (کارشناس)</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">تاریخ: {toJalali(worker.healthAssessment.date)} | کارشناس: {worker.healthAssessment.officerName}</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {Object.entries(worker.healthAssessment.hazards).map(([key, val]) => val && (
                            <span key={key} className="px-2 py-1 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded text-xs border border-amber-200 dark:border-amber-500/20">{key}</span>
                        ))}
                    </div>
                    {worker.healthAssessment.description && <p className="text-slate-700 dark:text-slate-300 text-sm bg-white dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-transparent">{worker.healthAssessment.description}</p>}
                </div>
            </div>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-200 dark:border-white/10 relative overflow-hidden shadow-xl dark:shadow-none">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{worker.name}</h2>
                <button onClick={onEdit} className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-cyan-600 dark:text-cyan-400 transition-colors"><Edit className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-wrap gap-4 text-slate-600 dark:text-slate-300 text-sm">
              <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10">کد ملی: {worker.nationalId}</span>
              <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10">واحد: {worker.department}</span>
              <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10">سابقه کار: {worker.workYears} سال</span>
            </div>
          </div>
          
          <div className="flex gap-2">
             <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold ${worker.referralStatus !== 'none' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                {worker.referralStatus !== 'none' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                {worker.referralStatus === 'waiting_for_doctor' ? 'منتظر معاینه پزشک' : worker.referralStatus === 'pending_specialist_result' ? 'منتظر نتیجه متخصص' : 'وضعیت نرمال'}
             </div>
          </div>
        </div>
      </div>

      {/* --- Printable Content Starts Here --- */}
      <div ref={printRef} className="space-y-6">
          
        {/* Page 1: Clinical Data */}
        <div className="print-page space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Audiometry Chart (Standard View) */}
                <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-none">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Ear className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    شنوایی سنجی (آخرین معاینه)
                    </h3>
                </div>
                
                {latestExam ? (
                    <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={audiogramData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                        <XAxis dataKey="hz" stroke={chartTextColor} tick={{fill: chartTextColor}} />
                        <YAxis reversed domain={[0, 100]} label={{ value: 'dB HL', angle: -90, position: 'insideLeft', fill: chartTextColor }} stroke={chartTextColor} tick={{fill: chartTextColor}} />
                        <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }} />
                        <Legend />
                        <Line type="monotone" dataKey="left" name="گوش چپ" stroke="#3b82f6" strokeWidth={3} dot={{r: 5}} />
                        <Line type="monotone" dataKey="right" name="گوش راست" stroke="#ef4444" strokeWidth={3} dot={{r: 5}} />
                        </LineChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-white/5">
                            <span className="text-blue-500 dark:text-blue-400 font-bold block mb-1">گوش چپ</span>
                            <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <div>SRT: {latestExam.hearing.speech?.left.srt || '-'}</div>
                                <div>SDS: {latestExam.hearing.speech?.left.sds || '-'}%</div>
                                <div>UCL: {latestExam.hearing.speech?.left.ucl || '-'}</div>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-white/5">
                            <span className="text-red-500 dark:text-red-400 font-bold block mb-1">گوش راست</span>
                            <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <div>SRT: {latestExam.hearing.speech?.right.srt || '-'}</div>
                                <div>SDS: {latestExam.hearing.speech?.right.sds || '-'}%</div>
                                <div>UCL: {latestExam.hearing.speech?.right.ucl || '-'}</div>
                            </div>
                        </div>
                    </div>
                    {latestExam.hearing.report && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-100 dark:border-blue-500/20 text-xs text-blue-800 dark:text-blue-200">
                            <strong>گزارش ادیولوژی:</strong> {latestExam.hearing.report}
                        </div>
                    )}
                    </div>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-400">داده‌ای موجود نیست</div>
                )}
                </div>

                {/* Spirometry */}
                <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-none">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Wind className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                    اسپیرومتری
                </h3>
                {latestExam && spiroStatus ? (
                    <div>
                        <div className={`p-4 rounded-xl border mb-6 ${spiroStatus.badgeBg} border-transparent`}>
                            <div className={`text-xl font-bold ${spiroStatus.color} mb-1`}>{spiroStatus.result}</div>
                            <div className="text-slate-700 dark:text-slate-300 font-medium mb-1">{spiroStatus.explanation}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{spiroStatus.details}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl text-center border border-slate-200 dark:border-white/5">
                                <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">FVC (Lit)</div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">{latestExam.spirometry.fvc}</div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl text-center border border-slate-200 dark:border-white/5">
                                <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">FEV1 (Lit)</div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">{latestExam.spirometry.fev1}</div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl text-center border border-slate-200 dark:border-white/5">
                                <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">Ratio %</div>
                                <div className={`text-2xl font-bold ${Number(spiroStatus.ratio) < 70 ? 'text-red-500' : 'text-emerald-500'}`}>{spiroStatus.ratio}%</div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl text-center border border-slate-200 dark:border-white/5">
                                <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">PEF</div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">{latestExam.spirometry.pef}</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-400">داده‌ای موجود نیست</div>
                )}
                </div>
            </div>

            {/* Organ Systems & Vision */}
            {latestExam && (
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-none">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Activity className="text-purple-500" /> معاینات سیستمیک</h3>
                        <div className="space-y-3">
                             {Object.entries(latestExam.organSystems).map(([key, val]) => {
                                 const sys = val as OrganSystemFinding;
                                 const hasIssue = sys.symptoms.length > 0 || sys.signs.length > 0;
                                 return (
                                     <div key={key} className={`p-3 rounded-lg border ${hasIssue ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' : 'bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-white/5'}`}>
                                         <div className="flex justify-between items-center mb-1">
                                             <span className={`font-bold text-sm ${hasIssue ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>{SYSTEM_LABELS[key] || key}</span>
                                             {hasIssue ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-emerald-500 opacity-50" />}
                                         </div>
                                         {hasIssue && (
                                             <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                                                 {sys.symptoms.length > 0 && <div><strong>علائم:</strong> {sys.symptoms.join(', ')}</div>}
                                                 {sys.signs.length > 0 && <div><strong>نشانه:</strong> {sys.signs.join(', ')}</div>}
                                             </div>
                                         )}
                                     </div>
                                 );
                             })}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Vision */}
                        {latestExam.vision && (
                             <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-none">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Eye className="text-cyan-500" /> بینایی سنجی</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg">
                                        <div className="text-slate-500 dark:text-slate-400 text-xs">حدت بینایی (چپ)</div>
                                        <div className="font-bold text-slate-900 dark:text-white">{latestExam.vision.acuity.left.corrected || latestExam.vision.acuity.left.uncorrected}</div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg">
                                        <div className="text-slate-500 dark:text-slate-400 text-xs">حدت بینایی (راست)</div>
                                        <div className="font-bold text-slate-900 dark:text-white">{latestExam.vision.acuity.right.corrected || latestExam.vision.acuity.right.uncorrected}</div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg">
                                        <div className="text-slate-500 dark:text-slate-400 text-xs">دید رنگ</div>
                                        <div className={`font-bold ${latestExam.vision.colorVision === 'Normal' ? 'text-emerald-500' : 'text-red-500'}`}>{latestExam.vision.colorVision}</div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg">
                                        <div className="text-slate-500 dark:text-slate-400 text-xs">میدان بینایی</div>
                                        <div className={`font-bold ${latestExam.vision.visualField === 'Normal' ? 'text-emerald-500' : 'text-red-500'}`}>{latestExam.vision.visualField}</div>
                                    </div>
                                </div>
                             </div>
                        )}
                        
                        {/* Final Opinion */}
                        <div className={`rounded-2xl p-6 border shadow-lg dark:shadow-none ${latestExam.finalOpinion.status === 'fit' ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20' : latestExam.finalOpinion.status === 'conditional' ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20' : 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20'}`}>
                            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${latestExam.finalOpinion.status === 'fit' ? 'text-emerald-700 dark:text-emerald-400' : latestExam.finalOpinion.status === 'conditional' ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'}`}>
                                {latestExam.finalOpinion.status === 'fit' ? <CheckCircle /> : <AlertTriangle />}
                                نظریه نهایی: {latestExam.finalOpinion.status === 'fit' ? 'بلامانع' : latestExam.finalOpinion.status === 'conditional' ? 'مشروط' : 'عدم صلاحیت'}
                            </h3>
                            {latestExam.finalOpinion.recommendations && (
                                <div className="text-sm bg-white dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300">
                                    <strong>توصیه‌ها:</strong> {latestExam.finalOpinion.recommendations}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Page 2: Trends & History */}
        <div className="print-page grid grid-cols-1 gap-6">
             {/* Trends */}
             <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-none">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                    روند سلامت در طول زمان
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Comparative Audiogram (Full Spectrum) */}
                    <div className="h-[250px]">
                        <h4 className="text-xs text-center text-slate-500 dark:text-slate-400 mb-2">روند تغییرات شنوایی (مقایسه اولین و آخرین معاینه)</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={comparisonAudiogramData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                                {/* Log Scale for Frequency 20Hz - 20000Hz */}
                                <XAxis 
                                    dataKey="hz" 
                                    type="number" 
                                    scale="log" 
                                    domain={[20, 20000]} 
                                    ticks={[20, 250, 500, 1000, 2000, 4000, 8000, 20000]}
                                    tickFormatter={(tick) => tick >= 1000 ? (tick/1000) + 'k' : tick}
                                    stroke={chartTextColor} 
                                    tick={{fill: chartTextColor}} 
                                    fontSize={10} 
                                />
                                <YAxis 
                                    reversed 
                                    domain={[0, 100]} 
                                    label={{ value: 'dB HL', angle: -90, position: 'insideLeft', fill: chartTextColor, fontSize: 10 }}
                                    stroke={chartTextColor} 
                                    tick={{fill: chartTextColor}} 
                                    fontSize={10} 
                                />
                                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }} />
                                <Legend wrapperStyle={{fontSize: '10px'}} />
                                
                                {/* Latest Exam */}
                                <Line type="monotone" dataKey="l_curr" name="چپ (فعلی)" stroke="#3b82f6" strokeWidth={2} dot={{r: 3}} connectNulls />
                                <Line type="monotone" dataKey="r_curr" name="راست (فعلی)" stroke="#ef4444" strokeWidth={2} dot={{r: 3}} connectNulls />
                                
                                {/* Base Exam (Dashed) */}
                                <Line type="monotone" dataKey="l_base" name="چپ (پایه)" stroke="#93c5fd" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls />
                                <Line type="monotone" dataKey="r_base" name="راست (پایه)" stroke="#fca5a5" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Spirometry Trend */}
                    <div className="h-[250px]">
                        <h4 className="text-xs text-center text-slate-500 dark:text-slate-400 mb-2">روند ظرفیت ریوی (FVC & FEV1)</h4>
                         <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={spiroTrendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                                <XAxis dataKey="dateLabel" stroke={chartTextColor} tick={{fill: chartTextColor}} fontSize={10} />
                                <YAxis yAxisId="left" stroke={chartTextColor} tick={{fill: chartTextColor}} fontSize={10} />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke={chartTextColor} tick={{fill: chartTextColor}} fontSize={10} />
                                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }} />
                                <Legend wrapperStyle={{fontSize: '10px'}} />
                                <Bar yAxisId="left" dataKey="fvc" name="FVC" fill="#10b981" barSize={20} />
                                <Bar yAxisId="left" dataKey="fev1" name="FEV1" fill="#059669" barSize={20} />
                                <Line yAxisId="right" type="monotone" dataKey="ratio" name="Ratio %" stroke="#f59e0b" strokeWidth={2} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
             </div>
             
             {/* Exam History Table */}
             <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-none overflow-hidden">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">تاریخچه معاینات</h3>
                 <div className="overflow-x-auto">
                     <table className="w-full text-sm">
                         <thead className="bg-slate-100 dark:bg-slate-900">
                             <tr>
                                 <th className="p-3 text-right text-slate-600 dark:text-slate-300">تاریخ</th>
                                 <th className="p-3 text-right text-slate-600 dark:text-slate-300">نتیجه نهایی</th>
                                 <th className="p-3 text-right text-slate-600 dark:text-slate-300">اسپیرومتری</th>
                                 <th className="p-3 text-right text-slate-600 dark:text-slate-300">شنوایی</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                             {worker.exams.map(exam => (
                                 <tr 
                                    key={exam.id} 
                                    onClick={() => setSelectedExam(exam)}
                                    className="text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                                    title="برای مشاهده جزئیات کلیک کنید"
                                 >
                                     <td className="p-3 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{toJalali(exam.date)}</td>
                                     <td className="p-3">
                                         <span className={`px-2 py-0.5 rounded text-xs ${exam.finalOpinion.status === 'fit' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'}`}>
                                             {exam.finalOpinion.status === 'fit' ? 'بلامانع' : exam.finalOpinion.status === 'conditional' ? 'مشروط' : 'عدم صلاحیت'}
                                         </span>
                                     </td>
                                     <td className="p-3">{exam.spirometry.interpretation}</td>
                                     <td className="p-3 truncate max-w-[200px]">{exam.hearing.report || '-'}</td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
                 <p className="text-xs text-slate-400 mt-2 text-center">برای مشاهده جزئیات کامل، روی ردیف مورد نظر کلیک کنید.</p>
             </div>
        </div>

      </div>
    </div>
  );
};

export default WorkerProfile;
