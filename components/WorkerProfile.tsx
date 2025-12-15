import React, { useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Bar } from 'recharts';
import { AlertTriangle, Ear, Wind, Heart, FileText, ArrowLeft, Activity, Edit, Eye, TrendingUp, FileDown, Loader2, Info, CheckCircle, Shield } from 'lucide-react';
import { Worker, Alert, OrganSystemFinding, ReferralStatus } from '../types';
import { toJalali } from '../utils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface WorkerProfileProps {
  worker: Worker;
  onBack: () => void;
  onEdit: () => void;
  onUpdateStatus?: (id: number, status: ReferralStatus, note?: string) => void;
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

const WorkerProfile: React.FC<WorkerProfileProps> = ({ worker, onBack, onEdit, onUpdateStatus }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showSpecialistModal, setShowSpecialistModal] = useState(false);
  const [specialistNote, setSpecialistNote] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  
  const analyzeSpirometry = (fvc: number, fev1: number) => {
    const ratio = fvc > 0 ? (fev1 / fvc) * 100 : 0;
    let result = 'Normal';
    let color = 'text-emerald-400';
    let badgeBg = 'bg-emerald-500/20';
    let explanation = 'عملکرد ریوی در محدوده طبیعی قرار دارد.';
    let details = 'نتایج اسپیرومتری نشان‌دهنده عملکرد طبیعی ریه است. نسبت FEV1/FVC و ظرفیت حیاتی (FVC) در محدوده نرمال قرار دارند.';

    const isObstructive = ratio < 70;
    const isRestrictive = fvc < 3.5; // Demo threshold

    if (isObstructive && isRestrictive) {
      result = 'Mixed';
      color = 'text-red-400';
      badgeBg = 'bg-red-500/20';
      explanation = `الگوی ترکیبی (Mixed)`;
      details = 'نتایج نشان‌دهنده الگوی ترکیبی (انسدادی و محدودکننده) است. کاهش همزمان نسبت FEV1/FVC و ظرفیت حیاتی (FVC) مشاهده می‌شود که می‌تواند ناشی از وجود همزمان بیماری‌های انسدادی و محدودکننده باشد.';
    } else if (isObstructive) {
      result = 'Obstructive';
      color = 'text-orange-400';
      badgeBg = 'bg-orange-500/20';
      explanation = `الگوی انسدادی (Obstructive)`;
      details = 'نتایج نشان‌دهنده الگوی انسدادی است (FEV1/FVC < 70%). این الگو معمولاً با بیماری‌هایی مانند آسم، برونشیت مزمن یا آمفیزم مرتبط است که در آن راه‌های هوایی باریک شده و بازدم دشوار می‌شود.';
    } else if (isRestrictive) {
      result = 'Restrictive';
      color = 'text-amber-400';
      badgeBg = 'bg-amber-500/20';
      explanation = `الگوی محدودکننده (Restrictive)`;
      details = 'نتایج نشان‌دهنده الگوی محدودکننده است (FVC کاهش یافته). این حالت نشان‌دهنده کاهش حجم ریه است که می‌تواند ناشی از بیماری‌های بافت ریه (مانند فیبروز) یا محدودیت‌های قفسه سینه باشد.';
    }

    return { result, explanation, details, ratio: ratio.toFixed(0), color, badgeBg };
  };

  const latestExam = worker.exams[0];
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
            // Use html2canvas on each page div
            const canvas = await html2canvas(page, { 
                scale: 2, 
                useCORS: true, 
                backgroundColor: '#ffffff',
                logging: false
            });
            
            const imgData = canvas.toDataURL('image/png');
            
            if (i > 0) {
                pdf.addPage();
            }
            // Fit to A4
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

  // Prepare Audiogram Data
  const audiogramData = latestExam ? [
      { hz: '250', left: latestExam.hearing.left[0], right: latestExam.hearing.right[0] },
      { hz: '500', left: latestExam.hearing.left[1], right: latestExam.hearing.right[1] },
      { hz: '1k', left: latestExam.hearing.left[2], right: latestExam.hearing.right[2] },
      { hz: '2k', left: latestExam.hearing.left[3], right: latestExam.hearing.right[3] },
      { hz: '4k', left: latestExam.hearing.left[4], right: latestExam.hearing.right[4] },
      { hz: '8k', left: latestExam.hearing.left[5], right: latestExam.hearing.right[5] },
  ] : [];

  const historyData = worker.exams.map(exam => {
    const avgLeft = exam.hearing.left.length > 0 ? exam.hearing.left.reduce((a, b) => a + b, 0) / exam.hearing.left.length : 0;
    const avgRight = exam.hearing.right.length > 0 ? exam.hearing.right.reduce((a, b) => a + b, 0) / exam.hearing.right.length : 0;
    return {
      date: new Date(exam.date).getTime(),
      dateLabel: toJalali(exam.date),
      left: Math.round(avgLeft * 10) / 10,
      right: Math.round(avgRight * 10) / 10,
    };
  }).sort((a, b) => a.date - b.date);

  // Prepare Spirometry Trend Data
  const spiroTrendData = worker.exams.map(exam => ({
    date: new Date(exam.date).getTime(),
    dateLabel: toJalali(exam.date),
    fvc: exam.spirometry.fvc,
    fev1: exam.spirometry.fev1,
    ratio: exam.spirometry.fev1_fvc,
  })).sort((a, b) => a.date - b.date);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
      
      {/* Specialist Result Modal */}
      {showSpecialistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full">
                <h3 className="text-xl font-bold text-white mb-4">ثبت نتیجه ارجاع تخصصی</h3>
                <textarea 
                    className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white h-32 mb-4"
                    placeholder="نتیجه معاینه متخصص و نظر نهایی..."
                    value={specialistNote}
                    onChange={(e) => setSpecialistNote(e.target.value)}
                />
                <div className="flex gap-3">
                    <button onClick={() => setShowSpecialistModal(false)} className="flex-1 p-2 rounded-xl bg-slate-700 text-slate-300">انصراف</button>
                    <button onClick={handleResolveReferral} className="flex-1 p-2 rounded-xl bg-emerald-600 text-white font-bold">تایید و خروج از لیست پیگیری</button>
                </div>
            </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button onClick={onBack} className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors group">
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
        <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-amber-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
            <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/20 rounded-xl shrink-0"><Shield className="w-6 h-6 text-amber-400" /></div>
                <div className="flex-1">
                    <h3 className="text-white font-bold mb-1">ارزیابی ایمنی و بهداشت (کارشناس)</h3>
                    <p className="text-slate-400 text-sm mb-3">تاریخ: {toJalali(worker.healthAssessment.date)} | کارشناس: {worker.healthAssessment.officerName}</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {Object.entries(worker.healthAssessment.hazards).map(([key, val]) => val && (
                            <span key={key} className="px-2 py-1 bg-amber-500/10 text-amber-300 rounded text-xs border border-amber-500/20">{key}</span>
                        ))}
                    </div>
                    {worker.healthAssessment.description && <p className="text-slate-300 text-sm bg-slate-900/50 p-3 rounded-lg">{worker.healthAssessment.description}</p>}
                </div>
            </div>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10 relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-white">{worker.name}</h2>
                <button onClick={onEdit} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-cyan-400"><Edit className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-wrap gap-4 text-slate-300 text-sm">
              <span className="px-3 py-1 bg-white/5 rounded-full border border-white/5 flex items-center gap-2">
                <FileText className="w-3 h-3 text-cyan-400"/> کد ملی: {worker.nationalId}
              </span>
              <span className="px-3 py-1 bg-white/5 rounded-full border border-white/5 flex items-center gap-2">
                <Activity className="w-3 h-3 text-cyan-400"/> واحد: {worker.department}
              </span>
            </div>
          </div>
          <div className="text-right bg-slate-900/50 p-3 rounded-xl border border-white/5">
             <div className="text-xs text-slate-400 mb-1">آخرین نوبت معاینه</div>
             <div className="text-xl font-mono text-cyan-400 font-bold">{latestExam ? toJalali(latestExam.date) : '-'}</div>
          </div>
        </div>
      </div>

      {!latestExam || !spiroStatus ? (
         <div className="bg-slate-800/30 border border-white/10 border-dashed rounded-2xl p-12 text-center">
             <h3 className="text-xl font-bold text-white mb-2">پرونده پزشکی خالی است</h3>
         </div>
      ) : (
        <>
        {/* Interactive UI Details (Charts, Tables) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Audiogram Card */}
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-white/10 lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Ear className="w-6 h-6" /></div>
                    <h3 className="text-white font-bold">شنوایی سنجی (Audiometry - Latest)</h3>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="h-[250px] w-full bg-white/5 rounded-xl p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={audiogramData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis dataKey="hz" stroke="#94a3b8" label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -5, fill: '#94a3b8' }} />
                                <YAxis reversed domain={[0, 120]} stroke="#94a3b8" label={{ value: 'Hearing Level (dB HL)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                                <Legend />
                                <Line type="monotone" dataKey="left" name="گوش چپ (Left)" stroke="#3b82f6" strokeWidth={2} dot={{r: 4, fill: '#3b82f6'}} />
                                <Line type="monotone" dataKey="right" name="گوش راست (Right)" stroke="#f43f5e" strokeWidth={2} dot={{r: 4, fill: '#f43f5e'}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Vision & Vitals Card */}
            <div className="space-y-6">
                <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><Eye className="w-6 h-6" /></div>
                        <h3 className="text-white font-bold">بینایی (Vision)</h3>
                    </div>
                    {latestExam.vision ? (
                         <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-slate-400">حدت بینایی (چپ/راست)</span>
                                <span className="text-white font-mono">{latestExam.vision.acuity.left.uncorrected} / {latestExam.vision.acuity.right.uncorrected}</span>
                            </div>
                             <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-slate-400">دید رنگ</span>
                                <span className={`font-bold ${latestExam.vision.colorVision === 'Normal' ? 'text-emerald-400' : 'text-red-400'}`}>{latestExam.vision.colorVision}</span>
                            </div>
                        </div>
                    ) : <span className="text-slate-500 text-sm">داده موجود نیست</span>}
                </div>
            </div>
            
            {/* Spirometry Trend Chart */}
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-white/10 lg:col-span-3">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><TrendingUp className="w-6 h-6" /></div>
                    <h3 className="text-white font-bold">روند تغییرات اسپیرومتری (Spirometry Trends)</h3>
                </div>
                <div className="h-[300px] w-full bg-white/5 rounded-xl p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={spiroTrendData} margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis 
                          dataKey="dateLabel" 
                          stroke="#94a3b8"
                          tick={{fill: '#94a3b8'}}
                        />
                        <YAxis 
                          yAxisId="left"
                          label={{ value: 'Volume (L)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} 
                          stroke="#94a3b8"
                          tick={{fill: '#94a3b8'}}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          domain={[0, 100]}
                          label={{ value: 'Ratio (%)', angle: 90, position: 'insideRight', fill: '#94a3b8' }} 
                          stroke="#94a3b8"
                          tick={{fill: '#94a3b8'}}
                        />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="fvc" name="FVC (L)" fill="#10b981" barSize={20} radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="fev1" name="FEV1 (L)" fill="#3b82f6" barSize={20} radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="ratio" name="Ratio (FEV1/FVC %)" stroke="#f59e0b" strokeWidth={3} dot={{r: 4}} />
                      </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Spirometry Table */}
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-white/10 lg:col-span-3">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><Wind className="w-6 h-6" /></div>
                    <h3 className="text-white font-bold">جدول نتایج اسپیرومتری</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center">
                        <thead className="bg-white/5 text-slate-300">
                            <tr>
                                <th className="p-3">تاریخ</th>
                                <th className="p-3">FVC (L)</th>
                                <th className="p-3">FEV1 (L)</th>
                                <th className="p-3">FEV1/FVC %</th>
                                <th className="p-3">PEF</th>
                                <th className="p-3">تفسیر</th>
                            </tr>
                        </thead>
                        <tbody className="text-white divide-y divide-white/5">
                            {worker.exams.map((exam, idx) => {
                                const status = analyzeSpirometry(exam.spirometry.fvc, exam.spirometry.fev1);
                                return (
                                    <tr key={idx}>
                                        <td className="p-3 font-mono text-cyan-300">{toJalali(exam.date)}</td>
                                        <td className="p-3">{exam.spirometry.fvc}</td>
                                        <td className="p-3">{exam.spirometry.fev1}</td>
                                        <td className="p-3">{exam.spirometry.fev1_fvc} %</td>
                                        <td className="p-3">{exam.spirometry.pef}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs ${status.badgeBg} ${status.color}`}>{status.result}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

             {/* Spirometry Interpretation Card */}
            {latestExam && (
              <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-white/10 lg:col-span-3">
                 <div className="flex flex-col md:flex-row items-start gap-4">
                    <div className={`p-3 rounded-xl ${spiroStatus.badgeBg} ${spiroStatus.color} shrink-0`}>
                        <Activity className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-white font-bold text-lg mb-2">تفسیر نتایج اسپیرومتری (آخرین معاینه)</h3>
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${spiroStatus.color.replace('text-', 'border-')} ${spiroStatus.badgeBg}`}>
                                {spiroStatus.result}
                            </span>
                             <span className="text-slate-400 text-sm font-mono">
                                FVC: {latestExam.spirometry.fvc} L
                            </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed text-sm">
                            {spiroStatus.details}
                        </p>
                    </div>
                 </div>
              </div>
            )}
        </div>
        
        {/* --- HIDDEN MULTI-PAGE PRINT LAYOUT --- */}
        <div 
            ref={printRef}
            style={{ 
                position: 'fixed', 
                top: '-10000px', 
                left: '-10000px' 
            }}
        >
            {/* PAGE 1: HEALTH OFFICER ASSESSMENT */}
            <div className="print-page relative" style={{ width: '210mm', height: '297mm', backgroundColor: 'white', color: 'black', padding: '15mm', direction: 'rtl', fontFamily: 'Vazirmatn' }}>
                 {/* Header */}
                 <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-center">
                    <div className="flex items-center gap-2"><Shield size={40}/> <span className="font-bold text-lg">Health System</span></div>
                    <div className="text-center">
                        <h1 className="text-xl font-black">فرم ارزیابی عوامل زیان‌آور و بهداشت حرفه‌ای</h1>
                        <h2 className="text-sm">Occupational Health & Hygiene Assessment</h2>
                    </div>
                    <div className="text-xs font-mono">{toJalali(new Date().toISOString())}</div>
                 </div>

                 {/* Patient Info */}
                 <div className="bg-slate-100 p-4 rounded-xl border border-slate-300 mb-6">
                    <h3 className="font-bold border-b border-slate-300 pb-2 mb-3">مشخصات پرسنل</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>نام و نام خانوادگی: <span className="font-bold">{worker.name}</span></div>
                        <div>کد ملی: <span className="font-bold font-mono">{worker.nationalId}</span></div>
                        <div>واحد: <span className="font-bold">{worker.department}</span></div>
                        <div>سابقه: <span className="font-bold">{worker.workYears} سال</span></div>
                    </div>
                 </div>

                 {/* Hazards */}
                 <div className="mb-6">
                     <h3 className="font-bold mb-3">۱. عوامل زیان‌آور محیط کار (Hazards)</h3>
                     {worker.healthAssessment ? (
                        <div className="grid grid-cols-3 gap-3">
                            {Object.entries(worker.healthAssessment.hazards).map(([k, v]) => (
                                <div key={k} className={`p-2 border rounded flex items-center gap-2 ${v ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
                                    <div className={`w-4 h-4 rounded-full ${v ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                    <span className="text-sm font-bold uppercase">{k}</span>
                                </div>
                            ))}
                        </div>
                     ) : <div className="p-4 border border-dashed text-center text-slate-500">ارزیابی ثبت نشده است</div>}
                 </div>

                 {/* PPE */}
                 <div className="mb-6">
                    <h3 className="font-bold mb-3">۲. وضعیت وسایل حفاظت فردی (PPE)</h3>
                    {worker.healthAssessment ? (
                        <div className="p-4 border rounded bg-slate-50">
                            <span className="font-bold">وضعیت کلی: </span>
                            <span className={`px-3 py-1 rounded text-white text-sm ${worker.healthAssessment.ppeStatus === 'good' ? 'bg-green-600' : worker.healthAssessment.ppeStatus === 'moderate' ? 'bg-amber-500' : 'bg-red-600'}`}>
                                {worker.healthAssessment.ppeStatus === 'good' ? 'مطلوب' : worker.healthAssessment.ppeStatus === 'moderate' ? 'متوسط/نیاز آموزش' : 'نامطلوب'}
                            </span>
                        </div>
                    ) : <div className="p-4 border border-dashed text-center text-slate-500">---</div>}
                 </div>

                 {/* Description */}
                 <div className="mb-8">
                     <h3 className="font-bold mb-3">۳. توضیحات کارشناس</h3>
                     <div className="border rounded p-4 h-32 bg-slate-50 text-sm leading-relaxed">
                         {worker.healthAssessment?.description || 'توضیحات تکمیلی ثبت نشده است.'}
                     </div>
                 </div>

                 {/* Health Officer Signature */}
                 <div className="absolute bottom-10 left-10 w-64 border-t border-black pt-2 text-center">
                     <div className="font-bold text-sm">مهر و امضاء کارشناس بهداشت حرفه‌ای</div>
                     <div className="text-xs text-slate-500 mt-1">{worker.healthAssessment?.officerName || '---'}</div>
                     <div className="h-20"></div> {/* Space for signature */}
                 </div>
            </div>

            {/* PAGE 2: CLINICAL EXAM (PART 1) */}
            <div className="print-page relative" style={{ width: '210mm', height: '297mm', backgroundColor: 'white', color: 'black', padding: '15mm', direction: 'rtl', fontFamily: 'Vazirmatn' }}>
                 <div className="border-b-2 border-black pb-4 mb-6 text-center">
                    <h1 className="text-xl font-black">پرونده پزشکی سلامت شغلی (بخش اول)</h1>
                    <h2 className="text-sm">Clinical Examination - Part 1</h2>
                 </div>

                 {/* Medical History */}
                 <div className="mb-6">
                     <h3 className="font-bold bg-slate-100 p-2 rounded mb-2">۴. سوابق پزشکی (Medical History)</h3>
                     <table className="w-full text-xs border-collapse border border-slate-300">
                         <thead>
                             <tr className="bg-slate-50"><th className="border p-1 text-right">سوال</th><th className="border p-1 w-10">وضعیت</th><th className="border p-1">توضیحات</th></tr>
                         </thead>
                         <tbody>
                             {latestExam.medicalHistory.filter(h => h.hasCondition).length > 0 ? (
                                 latestExam.medicalHistory.filter(h => h.hasCondition).map(h => (
                                     <tr key={h.id}><td className="border p-1">{h.question}</td><td className="border p-1 text-center font-bold text-red-600">بله</td><td className="border p-1">{h.description}</td></tr>
                                 ))
                             ) : (
                                 <tr><td colSpan={3} className="border p-4 text-center text-slate-500">هیچ سابقه بیماری ذکر نشد.</td></tr>
                             )}
                         </tbody>
                     </table>
                 </div>

                 {/* Organ Systems */}
                 <div className="mb-6">
                     <h3 className="font-bold bg-slate-100 p-2 rounded mb-2">۵. معاینه اندام‌ها (Organ Systems)</h3>
                     <div className="grid grid-cols-2 gap-4">
                        {(Object.values(latestExam.organSystems) as OrganSystemFinding[]).filter(sys => sys.symptoms.length > 0 || sys.signs.length > 0).length > 0 ? (
                             (Object.values(latestExam.organSystems) as OrganSystemFinding[]).filter(sys => sys.symptoms.length > 0 || sys.signs.length > 0).map((sys, idx) => (
                                 <div key={idx} className="border border-red-300 bg-red-50 p-2 rounded">
                                     <div className="font-bold text-sm text-red-800">{SYSTEM_LABELS[sys.systemName]}</div>
                                     <div className="text-xs mt-1"><span className="font-semibold">علائم:</span> {sys.symptoms.join(', ')}</div>
                                     <div className="text-xs"><span className="font-semibold">نشانه‌ها:</span> {sys.signs.join(', ')}</div>
                                 </div>
                             ))
                        ) : (
                            <div className="col-span-2 p-4 border border-green-300 bg-green-50 rounded text-center text-green-800 font-bold">معاینه فیزیکی تمامی اندام‌ها نرمال ارزیابی شد.</div>
                        )}
                     </div>
                 </div>

                 {/* Vitals */}
                 <div className="grid grid-cols-2 gap-6">
                     <div className="border p-4 rounded">
                         <h3 className="font-bold mb-2 text-sm">علائم حیاتی</h3>
                         <div className="flex justify-between text-sm"><span>فشار خون:</span> <span className="font-mono font-bold">{latestExam.bp} mmHg</span></div>
                     </div>
                     <div className="border p-4 rounded">
                         <h3 className="font-bold mb-2 text-sm">بینایی سنجی</h3>
                         <div className="text-xs space-y-1">
                             <div className="flex justify-between"><span>حدت (چپ/راست):</span> <span className="font-mono">{latestExam.vision?.acuity.left.uncorrected} / {latestExam.vision?.acuity.right.uncorrected}</span></div>
                             <div className="flex justify-between"><span>دید رنگ:</span> <span>{latestExam.vision?.colorVision}</span></div>
                         </div>
                     </div>
                 </div>
            </div>

            {/* PAGE 3: PARACLINICAL & FINAL OPINION */}
            <div className="print-page relative" style={{ width: '210mm', height: '297mm', backgroundColor: 'white', color: 'black', padding: '15mm', direction: 'rtl', fontFamily: 'Vazirmatn' }}>
                 <div className="border-b-2 border-black pb-4 mb-6 text-center">
                    <h1 className="text-xl font-black">پرونده پزشکی سلامت شغلی (بخش دوم)</h1>
                    <h2 className="text-sm">Paraclinical Tests & Final Opinion</h2>
                 </div>

                 {/* Audiometry */}
                 <div className="mb-6 border border-slate-300 p-4 rounded">
                     <h3 className="font-bold mb-4 flex items-center gap-2"><Ear size={16}/> ۶. شنوایی سنجی (Audiometry)</h3>
                     
                     {/* Render the chart again for print */}
                     <div style={{ width: '100%', height: '200px', direction: 'ltr' }}>
                        <ResponsiveContainer>
                            <LineChart data={audiogramData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="hz" />
                                <YAxis reversed domain={[0, 120]} />
                                <Legend />
                                <Line type="monotone" dataKey="left" stroke="#3b82f6" strokeWidth={2} name="Left" isAnimationActive={false} dot={{r:3}} />
                                <Line type="monotone" dataKey="right" stroke="#f43f5e" strokeWidth={2} name="Right" isAnimationActive={false} dot={{r:3}} />
                            </LineChart>
                        </ResponsiveContainer>
                     </div>

                     <div className="flex gap-4 mt-4">
                         <table className="w-1/2 text-xs border-collapse border border-slate-300 text-center">
                            <thead className="bg-slate-100"><tr><th className="border p-1">Hz</th>{audiogramData.map(d => <th key={d.hz} className="border p-1">{d.hz}</th>)}</tr></thead>
                            <tbody>
                                <tr><td className="border font-bold">L</td>{audiogramData.map(d => <td key={d.hz} className="border">{d.left}</td>)}</tr>
                                <tr><td className="border font-bold">R</td>{audiogramData.map(d => <td key={d.hz} className="border">{d.right}</td>)}</tr>
                            </tbody>
                         </table>
                         <div className="w-1/2 border border-slate-300 p-2 text-xs">
                             <div className="font-bold mb-1">تفسیر (Report):</div>
                             {latestExam.hearing.report || '---'}
                         </div>
                     </div>
                 </div>

                 {/* Spirometry */}
                 <div className="mb-6 border border-slate-300 p-4 rounded">
                     <h3 className="font-bold mb-2 flex items-center gap-2"><Wind size={16}/> ۷. اسپیرومتری (Spirometry)</h3>
                     
                     {/* PRINTABLE SPIROMETRY CHART */}
                     <div style={{ width: '100%', height: '180px', direction: 'ltr', marginBottom: '15px' }}>
                        <ResponsiveContainer>
                            <ComposedChart data={spiroTrendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="dateLabel" />
                                <YAxis yAxisId="left" label={{ value: 'Vol (L)', angle: -90, position: 'insideLeft' }} />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} label={{ value: '%', angle: 90, position: 'insideRight' }} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="fvc" name="FVC" fill="#10b981" barSize={15} isAnimationActive={false} />
                                <Bar yAxisId="left" dataKey="fev1" name="FEV1" fill="#3b82f6" barSize={15} isAnimationActive={false} />
                                <Line yAxisId="right" type="monotone" dataKey="ratio" name="Ratio %" stroke="#f59e0b" strokeWidth={2} isAnimationActive={false} dot={{r:3}} />
                            </ComposedChart>
                        </ResponsiveContainer>
                     </div>

                     <div className="flex justify-between items-center bg-slate-50 p-2 rounded text-sm mb-2">
                        <span>FVC: <b className="font-mono">{latestExam.spirometry.fvc}</b></span>
                        <span>FEV1: <b className="font-mono">{latestExam.spirometry.fev1}</b></span>
                        <span>Ratio: <b className="font-mono">{latestExam.spirometry.fev1_fvc}%</b></span>
                        <span className={`px-2 py-0.5 rounded text-white ${spiroStatus.result === 'Normal' ? 'bg-green-600' : 'bg-red-500'}`}>{spiroStatus.result}</span>
                     </div>
                 </div>

                 {/* Final Opinion */}
                 <div className="mt-auto mb-10 border-2 border-black rounded-xl p-6 bg-slate-50">
                    <h3 className="font-black text-lg mb-4 text-center border-b border-slate-300 pb-2">۸. نظریه نهایی پزشک (Final Opinion)</h3>
                    <div className="flex justify-center gap-8 mb-6">
                        <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 border-2 border-black rounded-full ${latestExam.finalOpinion.status === 'fit' ? 'bg-black' : ''}`}></div>
                            <span className="font-bold">بلامانع (Fit)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 border-2 border-black rounded-full ${latestExam.finalOpinion.status === 'conditional' ? 'bg-black' : ''}`}></div>
                            <span className="font-bold">مشروط (Conditional)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 border-2 border-black rounded-full ${latestExam.finalOpinion.status === 'unfit' ? 'bg-black' : ''}`}></div>
                            <span className="font-bold">عدم صلاحیت (Unfit)</span>
                        </div>
                    </div>
                    <div>
                        <span className="font-bold text-sm block mb-1">توصیه‌ها / محدودیت‌ها:</span>
                        <p className="text-sm border-b border-dotted border-slate-400 pb-1">{latestExam.finalOpinion.recommendations || '---'}</p>
                    </div>
                 </div>

                 {/* Doctor Signature */}
                 <div className="absolute bottom-10 left-10 w-64 border-t border-black pt-2 text-center">
                     <div className="font-bold text-sm">مهر و امضاء پزشک متخصص طب کار</div>
                     <div className="h-24"></div> 
                 </div>
                 
                 {/* Worker Signature */}
                 <div className="absolute bottom-10 right-10 w-64 border-t border-black pt-2 text-center">
                     <div className="font-bold text-sm">امضاء و اثر انگشت شاغل</div>
                     <div className="h-24"></div> 
                 </div>
            </div>
        </div>
        </>
      )}
    </div>
  );
};

export default WorkerProfile;