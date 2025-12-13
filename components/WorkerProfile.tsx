import React, { useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Legend } from 'recharts';
import { AlertTriangle, Ear, Wind, Heart, FileText, ArrowLeft, Activity, Edit, Eye, TrendingUp, FileDown, Loader2 } from 'lucide-react';
import { Worker, Alert } from '../types';
import { toJalali } from '../utils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface WorkerProfileProps {
  worker: Worker;
  onBack: () => void;
  onEdit: () => void;
}

const WorkerProfile: React.FC<WorkerProfileProps> = ({ worker, onBack, onEdit }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  const analyzeSpirometry = (fvc: number, fev1: number) => {
    const ratio = fvc > 0 ? (fev1 / fvc) * 100 : 0;
    let result = 'Normal';
    let color = 'text-emerald-400';
    let badgeBg = 'bg-emerald-500/20';
    let explanation = 'عملکرد ریوی در محدوده طبیعی قرار دارد.';

    const isObstructive = ratio < 70;
    const isRestrictive = fvc < 3.5; // Demo threshold

    if (isObstructive && isRestrictive) {
      result = 'Mixed';
      color = 'text-red-400';
      badgeBg = 'bg-red-500/20';
      explanation = `الگوی ترکیبی (Mixed)`;
    } else if (isObstructive) {
      result = 'Obstructive';
      color = 'text-orange-400';
      badgeBg = 'bg-orange-500/20';
      explanation = `الگوی انسدادی (Obstructive)`;
    } else if (isRestrictive) {
      result = 'Restrictive';
      color = 'text-amber-400';
      badgeBg = 'bg-amber-500/20';
      explanation = `الگوی محدودکننده (Restrictive)`;
    }

    return { result, explanation, ratio: ratio.toFixed(0), color, badgeBg };
  };

  const latestExam = worker.exams[0];
  const spiroStatus = latestExam ? analyzeSpirometry(latestExam.spirometry.fvc, latestExam.spirometry.fev1) : null;

  const handleGeneratePDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);

    try {
        const element = printRef.current;
        // Make sure images/fonts are loaded
        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Health_Report_${worker.nationalId}_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (error) {
        console.error("PDF Generation failed", error);
        alert("خطا در ایجاد فایل گزارش");
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  // Prepare Audiogram Data (Latest Exam)
  const audiogramData = latestExam ? [
      { hz: '250', left: latestExam.hearing.left[0], right: latestExam.hearing.right[0] },
      { hz: '500', left: latestExam.hearing.left[1], right: latestExam.hearing.right[1] },
      { hz: '1k', left: latestExam.hearing.left[2], right: latestExam.hearing.right[2] },
      { hz: '2k', left: latestExam.hearing.left[3], right: latestExam.hearing.right[3] },
      { hz: '4k', left: latestExam.hearing.left[4], right: latestExam.hearing.right[4] },
      { hz: '8k', left: latestExam.hearing.left[5], right: latestExam.hearing.right[5] },
  ] : [];

  // Prepare History Data for Scatter Plot (Hearing Averages)
  const historyData = worker.exams.map(exam => {
    // Calculate Pure Tone Average (PTA) or simple average
    const avgLeft = exam.hearing.left.length > 0 
        ? exam.hearing.left.reduce((a, b) => a + b, 0) / exam.hearing.left.length 
        : 0;
    const avgRight = exam.hearing.right.length > 0 
        ? exam.hearing.right.reduce((a, b) => a + b, 0) / exam.hearing.right.length 
        : 0;
    
    return {
      date: new Date(exam.date).getTime(),
      dateLabel: toJalali(exam.date),
      left: Math.round(avgLeft * 10) / 10,
      right: Math.round(avgRight * 10) / 10,
    };
  }).sort((a, b) => a.date - b.date);

  // Custom Tooltip for Scatter Plot
  const ScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-white/10 p-3 rounded-lg shadow-xl text-sm">
          <p className="text-slate-400 mb-2">{data.dateLabel}</p>
          <div className="flex gap-4">
             <div className="flex items-center gap-1 text-blue-400">
                 <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                 <span>چپ: {data.left} dB</span>
             </div>
             <div className="flex items-center gap-1 text-red-400">
                 <span className="w-2 h-2 rounded-full bg-red-400"></span>
                 <span>راست: {data.right} dB</span>
             </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors group">
            <ArrowLeft className="w-5 h-5 ml-2 group-hover:-translate-x-1 transition-transform" />
            بازگشت به لیست
        </button>
        
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
        {/* Detail Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Audiogram Card (Latest) */}
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-white/10 lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Ear className="w-6 h-6" /></div>
                    <h3 className="text-white font-bold">شنوایی سنجی (Audiogram - Latest)</h3>
                </div>
                <div className="h-[300px] w-full bg-white/5 rounded-xl p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={audiogramData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis dataKey="hz" stroke="#94a3b8" label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -5, fill: '#94a3b8' }} />
                            {/* Inverted Y Axis for Hearing Loss */}
                            <YAxis reversed domain={[0, 120]} stroke="#94a3b8" label={{ value: 'Hearing Level (dB HL)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                            <Legend />
                            <Line type="monotone" dataKey="left" name="گوش چپ (Left)" stroke="#3b82f6" strokeWidth={2} dot={{r: 4, fill: '#3b82f6'}} />
                            <Line type="monotone" dataKey="right" name="گوش راست (Right)" stroke="#f43f5e" strokeWidth={2} dot={{r: 4, fill: '#f43f5e'}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Vision & Vitals */}
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
                            <div className="flex justify-between">
                                <span className="text-slate-400">میدان بینایی</span>
                                <span className={`font-bold ${latestExam.vision.visualField === 'Normal' ? 'text-emerald-400' : 'text-red-400'}`}>{latestExam.vision.visualField}</span>
                            </div>
                        </div>
                    ) : <span className="text-slate-500 text-sm">داده موجود نیست</span>}
                </div>

                <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-500/20 rounded-lg text-red-400"><Heart className="w-6 h-6" /></div>
                        <h3 className="text-white font-bold">علائم حیاتی</h3>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-mono font-bold text-white mb-1">{latestExam.bp}</div>
                        <div className="text-slate-400 text-xs">فشار خون (mmHg)</div>
                    </div>
                </div>
            </div>
            
            {/* Hearing History Scatter Plot */}
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-white/10 lg:col-span-3">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400"><TrendingUp className="w-6 h-6" /></div>
                    <h3 className="text-white font-bold">روند تغییرات شنوایی در طول زمان (Hearing History)</h3>
                </div>
                <div className="h-[300px] w-full bg-white/5 rounded-xl p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis 
                          type="number" 
                          dataKey="date" 
                          name="Date" 
                          domain={['auto', 'auto']}
                          tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString('fa-IR')}
                          stroke="#94a3b8"
                        />
                        <YAxis 
                          type="number" 
                          dataKey="left" 
                          name="Hearing Level" 
                          reversed 
                          label={{ value: 'Avg Hearing Level (dB)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} 
                          stroke="#94a3b8"
                        />
                        <Tooltip content={<ScatterTooltip />} />
                        <Legend />
                        <Scatter name="گوش چپ (Avg Left)" data={historyData} fill="#3b82f6" shape="circle" />
                        <Scatter name="گوش راست (Avg Right)" data={historyData} fill="#f43f5e" shape="triangle" />
                      </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Spirometry Table */}
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-white/10 lg:col-span-3">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><Wind className="w-6 h-6" /></div>
                    <h3 className="text-white font-bold">نتایج اسپیرومتری (Spirometry)</h3>
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

        </div>

        {/* Hidden Printable Report Template */}
        <div 
            style={{ 
                position: 'fixed', 
                top: '-10000px', 
                left: '-10000px',
                width: '210mm', // A4 Width
                minHeight: '297mm',
                backgroundColor: 'white',
                color: 'black',
                padding: '20mm',
                fontFamily: 'Vazirmatn, sans-serif',
                direction: 'rtl'
            }} 
            ref={printRef}
        >
            {/* Header */}
            <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-center">
                <div className="text-right">
                    <h1 className="text-xl font-bold mb-1">مرکز تخصصی طب کار و بیماری‌های شغلی</h1>
                    <p className="text-sm text-gray-600">گزارش پرونده سلامت شغلی</p>
                </div>
                <div className="text-left">
                    <div className="text-sm font-mono">تاریخ گزارش: {toJalali(new Date().toISOString())}</div>
                    <div className="text-sm font-mono mt-1">شماره پرونده: {worker.id}</div>
                </div>
            </div>

            {/* Section 1: Personal Info */}
            <div className="mb-6">
                <h3 className="text-lg font-bold border-r-4 border-black pr-2 mb-3 bg-gray-100 p-1">مشخصات فردی</h3>
                <div className="grid grid-cols-2 gap-4 text-sm border border-gray-300 p-4 rounded">
                    <div><span className="font-bold ml-2">نام و نام خانوادگی:</span>{worker.name}</div>
                    <div><span className="font-bold ml-2">کد ملی:</span>{worker.nationalId}</div>
                    <div><span className="font-bold ml-2">واحد سازمانی:</span>{worker.department}</div>
                    <div><span className="font-bold ml-2">سابقه کار:</span>{worker.workYears} سال</div>
                    <div><span className="font-bold ml-2">تاریخ معاینه:</span>{toJalali(latestExam.date)}</div>
                    <div><span className="font-bold ml-2">نوع معاینه:</span>ادواری</div>
                </div>
            </div>

            {/* Section 2: Vitals & Vision */}
            <div className="mb-6 grid grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-bold border-r-4 border-black pr-2 mb-3 bg-gray-100 p-1">علائم حیاتی</h3>
                    <div className="border border-gray-300 p-4 rounded text-sm">
                        <div className="flex justify-between mb-2">
                            <span>فشار خون:</span>
                            <span className="font-mono font-bold">{latestExam.bp} mmHg</span>
                        </div>
                    </div>
                </div>
                <div>
                     <h3 className="text-lg font-bold border-r-4 border-black pr-2 mb-3 bg-gray-100 p-1">بینایی سنجی</h3>
                     <div className="border border-gray-300 p-4 rounded text-sm">
                        {latestExam.vision ? (
                            <>
                            <div className="flex justify-between mb-1"><span>حدت دید (چپ):</span> <span className="font-mono">{latestExam.vision.acuity.left.uncorrected}</span></div>
                            <div className="flex justify-between mb-1"><span>حدت دید (راست):</span> <span className="font-mono">{latestExam.vision.acuity.right.uncorrected}</span></div>
                            <div className="flex justify-between"><span>دید رنگ:</span> <span>{latestExam.vision.colorVision}</span></div>
                            </>
                        ) : 'ثبت نشده'}
                     </div>
                </div>
            </div>

            {/* Section 3: Audiometry */}
            <div className="mb-6">
                <h3 className="text-lg font-bold border-r-4 border-black pr-2 mb-3 bg-gray-100 p-1">شنوایی سنجی (Audiometry - dB HL)</h3>
                <table className="w-full text-sm border-collapse border border-gray-400 text-center">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-400 p-1">گوش / فرکانس</th>
                            <th className="border border-gray-400 p-1">250 Hz</th>
                            <th className="border border-gray-400 p-1">500 Hz</th>
                            <th className="border border-gray-400 p-1">1000 Hz</th>
                            <th className="border border-gray-400 p-1">2000 Hz</th>
                            <th className="border border-gray-400 p-1">4000 Hz</th>
                            <th className="border border-gray-400 p-1">8000 Hz</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-gray-400 p-1 font-bold">چپ (Left)</td>
                            {latestExam.hearing.left.map((v, i) => <td key={i} className="border border-gray-400 p-1">{v}</td>)}
                        </tr>
                         <tr>
                            <td className="border border-gray-400 p-1 font-bold">راست (Right)</td>
                            {latestExam.hearing.right.map((v, i) => <td key={i} className="border border-gray-400 p-1">{v}</td>)}
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Section 4: Spirometry */}
            <div className="mb-6">
                 <h3 className="text-lg font-bold border-r-4 border-black pr-2 mb-3 bg-gray-100 p-1">اسپیرومتری (Spirometry)</h3>
                 <table className="w-full text-sm border-collapse border border-gray-400 text-center">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-400 p-2">FVC (L)</th>
                            <th className="border border-gray-400 p-2">FEV1 (L)</th>
                            <th className="border border-gray-400 p-2">FEV1/FVC %</th>
                            <th className="border border-gray-400 p-2">PEF</th>
                            <th className="border border-gray-400 p-2">تفسیر</th>
                        </tr>
                    </thead>
                     <tbody>
                        <tr>
                            <td className="border border-gray-400 p-2">{latestExam.spirometry.fvc}</td>
                            <td className="border border-gray-400 p-2">{latestExam.spirometry.fev1}</td>
                            <td className="border border-gray-400 p-2">{latestExam.spirometry.fev1_fvc}</td>
                            <td className="border border-gray-400 p-2">{latestExam.spirometry.pef}</td>
                            <td className="border border-gray-400 p-2 font-bold">{spiroStatus.result}</td>
                        </tr>
                     </tbody>
                 </table>
            </div>

            {/* Section 5: History Summary */}
            <div className="mb-6">
                <h3 className="text-lg font-bold border-r-4 border-black pr-2 mb-3 bg-gray-100 p-1">خلاصه سوابق پزشکی</h3>
                <div className="border border-gray-300 p-4 rounded text-sm min-h-[60px]">
                    {latestExam.medicalHistory.filter(h => h.hasCondition).length > 0 ? (
                        <ul className="list-disc list-inside">
                            {latestExam.medicalHistory.filter(h => h.hasCondition).map(h => (
                                <li key={h.id}>{h.question}: {h.description}</li>
                            ))}
                        </ul>
                    ) : (
                        <span className="text-gray-500">مورد قابل توجهی ثبت نشده است.</span>
                    )}
                </div>
            </div>

            {/* Section 6: Final Opinion */}
            <div className="mb-10">
                <h3 className="text-lg font-bold border-r-4 border-black pr-2 mb-3 bg-gray-100 p-1">نظریه نهایی پزشک</h3>
                <div className="border-2 border-black p-4 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                        <div className={`p-2 border ${latestExam.finalOpinion.status === 'fit' ? 'bg-black text-white font-bold' : 'border-gray-300'}`}>بلامانع</div>
                        <div className={`p-2 border ${latestExam.finalOpinion.status === 'conditional' ? 'bg-black text-white font-bold' : 'border-gray-300'}`}>مشروط</div>
                        <div className={`p-2 border ${latestExam.finalOpinion.status === 'unfit' ? 'bg-black text-white font-bold' : 'border-gray-300'}`}>عدم صلاحیت</div>
                    </div>
                    <div className="text-sm">
                        <p className="font-bold mb-1">توصیه ها و محدودیت ها:</p>
                        <p className="min-h-[40px]">{latestExam.finalOpinion.recommendations || 'ندارد'}</p>
                    </div>
                </div>
            </div>

            {/* Signatures */}
            <div className="flex justify-between mt-12 pt-8 border-t border-gray-300">
                <div className="text-center w-1/3">
                    <p className="font-bold mb-8">امضاء و اثر انگشت شاغل</p>
                    <div className="border-b border-gray-400 w-32 mx-auto"></div>
                </div>
                <div className="text-center w-1/3">
                    <p className="font-bold mb-8">مهر و امضاء پزشک متخصص طب کار</p>
                    <div className="border-b border-gray-400 w-32 mx-auto"></div>
                </div>
            </div>
            
            <div className="text-center text-xs text-gray-400 mt-12">
                این گزارش توسط سیستم هوشمند مدیریت سلامت شغلی ایجاد شده است.
            </div>
        </div>
        </>
      )}
    </div>
  );
};

export default WorkerProfile;