
import React, { useState } from 'react';
import { Shield, Save, CheckSquare, AlertTriangle, CheckCircle, XCircle, Sparkles, Loader2, ListChecks, Square } from 'lucide-react';
import { Worker, HealthAssessment } from '../types';
import { createChatSession, sendMessageToGemini } from '../services/geminiService';

interface Props {
  worker: Worker;
  onSave: (assessment: HealthAssessment) => void;
  onCancel: () => void;
}

const HAZARD_CATEGORIES = {
    'عوامل فیزیکی': [
        { k: 'noise', l: 'صدا (Noise)' },
        { k: 'vibration', l: 'ارتعاش (Vibration)' },
        { k: 'heat', l: 'گرما / استرس حرارتی' },
        { k: 'cold', l: 'سرما' },
        { k: 'lighting', l: 'روشنایی نامناسب' },
        { k: 'radiation_ion', l: 'پرتوهای یونیزان' },
        { k: 'radiation_non', l: 'پرتوهای غیر یونیزان' },
    ],
    'عوامل شیمیایی': [
        { k: 'dust', l: 'گرد و غبار (Dust)' },
        { k: 'fumes', l: 'فیوم جوشکاری/فلزات' },
        { k: 'solvents', l: 'حلال‌ها و بخارات' },
        { k: 'gases', l: 'گازهای سمی' },
        { k: 'acids', l: 'اسیدها و بازها' },
    ],
    'عوامل ارگونومیک': [
        { k: 'lifting', l: 'حمل بار سنگین' },
        { k: 'posture', l: 'پوسچر نامناسب' },
        { k: 'repetitive', l: 'کار تکراری' },
        { k: 'static', l: 'کار ایستاده/نشسته مداوم' },
    ],
    'عوامل بیولوژیک و روانی': [
        { k: 'biological', l: 'ویروس/باکتری/قارچ' },
        { k: 'shift_work', l: 'نوبت کاری/شب کاری' },
        { k: 'stress', l: 'استرس شغلی' },
    ]
};

const HealthOfficerAssessment: React.FC<Props> = ({ worker, onSave, onCancel }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [data, setData] = useState<HealthAssessment>({
    date: new Date().toISOString().split('T')[0],
    officerName: 'مهندس راد', 
    hazards: {}, // Will be populated dynamically
    ppeStatus: 'good',
    description: '',
    needsDoctorVisit: false,
  });

  const handleHazardToggle = (key: string) => {
    setData(prev => ({
      ...prev,
      hazards: { ...prev.hazards, [key]: !prev.hazards[key] }
    }));
  };

  const handleBulkAction = (action: 'all' | 'none') => {
      const newHazards: Record<string, boolean> = {};
      Object.values(HAZARD_CATEGORIES).flat().forEach(item => {
          newHazards[item.k] = action === 'all';
      });
      setData(prev => ({ ...prev, hazards: newHazards }));
  };

  const handleAIAnalysis = async () => {
      setIsAnalyzing(true);
      try {
          const selectedHazards = Object.entries(data.hazards)
            .filter(([_, v]) => v)
            .map(([k, _]) => {
                // Find label
                for (const cat of Object.values(HAZARD_CATEGORIES)) {
                    const found = cat.find(i => i.k === k);
                    if (found) return found.l;
                }
                return k;
            })
            .join(', ');

          const prompt = `
          به عنوان دستیار هوشمند بهداشت حرفه‌ای، برای کارگری با مشخصات زیر:
          شغل/واحد: ${worker.department}
          عوامل زیان‌آور شناسایی شده: ${selectedHazards || 'مورد خاصی انتخاب نشده'}
          توضیحات تکمیلی کارشناس: ${data.description}

          لطفا:
          1. تجهیزات حفاظت فردی (PPE) پیشنهادی دقیق را لیست کن.
          2. اگر نکته ایمنی خاصی وجود دارد، کوتاه بنویس.
          پاسخ کوتاه و کاربردی باشد.
          `;

          const session = createChatSession();
          const response = await sendMessageToGemini(session, prompt);
          setData(prev => ({
              ...prev,
              description: prev.description + '\n\n--- پیشنهاد هوشمند ---\n' + response
          }));

      } catch (error) {
          alert('خطا در ارتباط با هوش مصنوعی');
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleSubmit = () => {
    onSave(data);
  };

  const ppeOptions = [
    { 
        value: 'good', 
        label: 'مطلوب', 
        activeColor: 'text-emerald-400', 
        activeBg: 'bg-emerald-500/20', 
        activeBorder: 'border-emerald-500/50',
        dotColor: 'bg-emerald-500',
        Icon: CheckCircle 
    },
    { 
        value: 'moderate', 
        label: 'متوسط / نیاز آموزش', 
        activeColor: 'text-amber-400', 
        activeBg: 'bg-amber-500/20', 
        activeBorder: 'border-amber-500/50',
        dotColor: 'bg-amber-500',
        Icon: AlertTriangle 
    },
    { 
        value: 'poor', 
        label: 'نامطلوب', 
        activeColor: 'text-red-400', 
        activeBg: 'bg-red-500/20', 
        activeBorder: 'border-red-500/50',
        dotColor: 'bg-red-500',
        Icon: XCircle 
    }
  ];

  return (
    <div className="max-w-4xl mx-auto bg-slate-800/50 p-8 rounded-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
        <Shield className="w-8 h-8 text-emerald-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">فرم ارزیابی سلامت شغلی و ایمنی</h2>
          <p className="text-slate-400 text-sm">کارشناس بهداشت حرفه‌ای: {worker.name} - {worker.department}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Hazards */}
        <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-lg">عوامل زیان‌آور محیط کار</h3>
              <div className="flex gap-2">
                  <button onClick={() => handleBulkAction('none')} className="text-xs flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-300 transition-colors">
                      <Square className="w-3 h-3" /> هیچکدام
                  </button>
                  <button onClick={() => handleBulkAction('all')} className="text-xs flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-300 transition-colors">
                      <ListChecks className="w-3 h-3" /> انتخاب همه
                  </button>
              </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(HAZARD_CATEGORIES).map(([category, items]) => (
                  <div key={category} className="space-y-2">
                      <h4 className="text-cyan-400 text-sm font-bold border-b border-white/5 pb-1 mb-2">{category}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {items.map((item) => (
                        <label key={item.k} className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${data.hazards[item.k] ? 'bg-cyan-900/40 border-cyan-500/50' : 'bg-slate-800 border-transparent hover:bg-slate-700'}`}>
                            <input 
                            type="checkbox" 
                            checked={!!data.hazards[item.k]} 
                            onChange={() => handleHazardToggle(item.k)}
                            className="w-4 h-4 rounded border-slate-500 text-cyan-500 focus:ring-cyan-500"
                            />
                            <span className="text-xs text-slate-200">{item.l}</span>
                        </label>
                        ))}
                      </div>
                  </div>
              ))}
          </div>
        </div>

        {/* PPE & Description */}
        <div className="grid md:grid-cols-2 gap-4">
           <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
              <h3 className="text-white font-bold mb-3">وضعیت استفاده از PPE</h3>
              <div className="flex flex-col gap-2">
                {ppeOptions.map((opt) => {
                    const isSelected = data.ppeStatus === opt.value;
                    return (
                        <button
                            key={opt.value}
                            onClick={() => setData({ ...data, ppeStatus: opt.value as any })}
                            className={`
                                relative flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group
                                ${isSelected 
                                    ? `${opt.activeBg} ${opt.activeBorder} ${opt.activeColor} shadow-lg shadow-black/10` 
                                    : 'bg-slate-800 border-transparent text-slate-400 hover:bg-slate-750'}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <opt.Icon className={`w-5 h-5 transition-transform ${isSelected ? 'scale-110' : 'group-hover:scale-110 opacity-70'}`} />
                                <span className="font-bold text-sm">{opt.label}</span>
                            </div>
                            {isSelected && (
                                <div className={`w-2.5 h-2.5 rounded-full ${opt.dotColor} shadow-[0_0_10px_currentColor] animate-pulse`}></div>
                            )}
                        </button>
                    );
                })}
              </div>
           </div>
           
           <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer h-full ${data.needsDoctorVisit ? 'bg-red-500/10 border-red-500 animate-pulse' : 'bg-slate-800 border-slate-600 hover:border-slate-500'}`}>
                 <input 
                    type="checkbox" 
                    checked={data.needsDoctorVisit} 
                    onChange={(e) => setData({...data, needsDoctorVisit: e.target.checked})}
                    className="w-6 h-6 rounded border-slate-500 text-red-500 focus:ring-red-500"
                 />
                 <div>
                    <span className={`block font-bold text-lg mb-1 ${data.needsDoctorVisit ? 'text-red-400' : 'text-slate-300'}`}>ارجاع به پزشک طب کار</span>
                    <span className="text-xs text-slate-500 block leading-relaxed">در صورت مشاهده علائم مشکوک یا نیاز به معاینات دقیق‌تر، این گزینه را فعال کنید.</span>
                 </div>
              </label>
           </div>
        </div>

        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="text-slate-300 text-sm">توضیحات تکمیلی کارشناس</label>
                <button 
                    onClick={handleAIAnalysis}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg transition-colors shadow-lg shadow-purple-900/20 disabled:opacity-50"
                >
                    {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                    تحلیل هوشمند و پیشنهاد PPE
                </button>
            </div>
          <textarea 
            className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-white h-32 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all placeholder-slate-600 leading-relaxed"
            placeholder="توضیحات در مورد مواجهه، حوادث احتمالی یا شکایات پرسنل..."
            value={data.description}
            onChange={(e) => setData({...data, description: e.target.value})}
          ></textarea>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button onClick={onCancel} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors">
            انصراف
          </button>
          <button onClick={handleSubmit} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all">
            <Save className="w-5 h-5" />
            ثبت ارزیابی
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthOfficerAssessment;
