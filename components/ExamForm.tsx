
import React, { useState, useEffect } from 'react';
import { Save, X, FileText, Activity, Eye, Ear, Wind, Stethoscope, ClipboardList, Beaker, CheckSquare, Search } from 'lucide-react';
import { Exam, MedicalHistoryItem, OrganSystemFinding, HearingData, SpirometryData, VisionData, LabResults, FinalOpinion } from '../types';
import { ORGAN_SYSTEMS_CONFIG } from '../constants';

interface Props {
  initialData: Omit<Exam, 'id' | 'date'> & { nationalId: string };
  workerName?: string;
  onSubmit: (data: Omit<Exam, 'id' | 'date'> & { nationalId: string }) => void;
  onCancel: () => void;
  readOnly?: boolean; // New prop for viewing mode
}

const ExamForm: React.FC<Props> = ({ initialData, workerName, onSubmit, onCancel, readOnly = false }) => {
  const [formData, setFormData] = useState(initialData);
  const [activeSection, setActiveSection] = useState<string>('history');

  // Sync state if initialData changes
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  // Helper to update state deeply
  const updateState = (section: keyof typeof formData, value: any) => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, [section]: value }));
  };

  const handleHistoryChange = (id: number, field: 'hasCondition' | 'description', value: any) => {
    if (readOnly) return;
    const newHistory = formData.medicalHistory.map(h => 
      h.id === id ? { ...h, [field]: value } : h
    );
    updateState('medicalHistory', newHistory);
  };

  const handleOrganChange = (systemKey: string, type: 'symptoms' | 'signs', item: string) => {
    if (readOnly) return;
    
    // Safety fallback if the system key doesn't exist in data
    const currentSystem = formData.organSystems[systemKey] || { 
        systemName: systemKey, 
        symptoms: [], 
        signs: [], 
        description: '' 
    };
    
    const currentList = currentSystem[type] || [];
    
    const newList = currentList.includes(item) 
      ? currentList.filter(i => i !== item) 
      : [...currentList, item];
    
    setFormData(prev => ({
      ...prev,
      organSystems: {
        ...prev.organSystems,
        [systemKey]: { ...currentSystem, [type]: newList }
      }
    }));
  };

  const sections = [
    { id: 'history', label: 'سوابق پزشکی (History)', Icon: ClipboardList },
    { id: 'organs', label: 'معاینات اندامی (Physical Exam)', Icon: Stethoscope },
    { id: 'paraclinical', label: 'پاراکلینیک (Paraclinical)', Icon: Activity },
    { id: 'final', label: 'نظریه نهایی (Final Opinion)', Icon: CheckSquare },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col h-[calc(100vh-100px)]">
      {/* Form Header */}
      <div className={`${readOnly ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-slate-100 dark:bg-slate-800'} p-4 border-b border-slate-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4`}>
        <div className="flex-1 w-full">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                <FileText className={readOnly ? "text-amber-600" : "text-cyan-600"} />
                {readOnly ? 'مرور پرونده سلامت (فقط خواندنی)' : 'فرم معاینات سلامت شغلی (پرونده پزشکی)'}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                    نام شاغل: <span className="font-bold text-slate-800 dark:text-slate-200">{workerName || 'ناشناس / جدید'}</span>
                </span>
                <span className="hidden md:inline">|</span>
                <div className="flex items-center gap-2">
                    <span>کد ملی:</span>
                    {/* Allow editing National ID if it was initially empty (New Exam mode) */}
                    <input 
                        type="text" 
                        value={formData.nationalId}
                        onChange={(e) => setFormData({...formData, nationalId: e.target.value})}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 font-mono text-slate-800 dark:text-slate-200 w-32 focus:border-cyan-500 outline-none disabled:bg-transparent disabled:border-none"
                        placeholder="وارد کنید..."
                        disabled={!!workerName || readOnly} 
                    />
                </div>
            </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button onClick={onCancel} className="flex-1 md:flex-none px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                {readOnly ? 'بستن پرونده' : 'انصراف'}
            </button>
            {!readOnly && (
                <button onClick={() => onSubmit(formData)} className="flex-1 md:flex-none px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20">
                    <Save className="w-4 h-4" /> ثبت نهایی معاینه
                </button>
            )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-slate-50 dark:bg-slate-800/50 border-l border-slate-200 dark:border-white/5 overflow-y-auto hidden md:block">
            <div className="p-4 space-y-2">
                {sections.map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition-all ${activeSection === section.id ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-bold border border-cyan-200 dark:border-cyan-500/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                        <section.Icon className="w-5 h-5" />
                        {section.label}
                    </button>
                ))}
            </div>
            
            {/* Quick Summary Preview */}
            <div className="p-4 mt-4 border-t border-slate-200 dark:border-white/5">
                <h4 className="text-xs font-bold text-slate-500 mb-2">خلاصه وضعیت</h4>
                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between">
                        <span>فشار خون:</span>
                        <span className="font-mono">{formData.bp || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>اسپیرومتری:</span>
                        <span className={`font-bold ${formData.spirometry.interpretation === 'Normal' ? 'text-emerald-500' : 'text-red-500'}`}>{formData.spirometry.interpretation}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth bg-white dark:bg-slate-900" id="exam-form-content">
            <fieldset disabled={readOnly} className="contents">
            
            {/* 1. Medical History */}
            {activeSection === 'history' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">۱. سوابق پزشکی و شغلی (History)</h3>
                    {formData.medicalHistory.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 italic">هیچ سابقه‌ای ثبت نشده است (یا داده وارداتی خلاصه است)</div>
                    ) : (
                        <div className="grid gap-4">
                            {formData.medicalHistory.map((item) => (
                                <div key={item.id} className={`p-4 rounded-xl border transition-colors ${item.hasCondition ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-500/30' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/5'}`}>
                                    <div className="flex items-start gap-3">
                                        <input 
                                            type="checkbox" 
                                            checked={item.hasCondition}
                                            onChange={(e) => handleHistoryChange(item.id, 'hasCondition', e.target.checked)}
                                            className="mt-1 w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 disabled:opacity-50"
                                        />
                                        <div className="flex-1">
                                            <label className="font-medium text-slate-900 dark:text-white cursor-pointer" onClick={() => !readOnly && handleHistoryChange(item.id, 'hasCondition', !item.hasCondition)}>
                                                {item.question}
                                            </label>
                                            {item.hasCondition && (
                                                <input 
                                                    type="text" 
                                                    placeholder="توضیحات تکمیلی (اجباری)..."
                                                    value={item.description}
                                                    onChange={(e) => handleHistoryChange(item.id, 'description', e.target.value)}
                                                    className="mt-3 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:border-red-500 outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 2. Organ Systems */}
            {activeSection === 'organs' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">۲. معاینات اندامی (Physical Examination)</h3>
                        <div className="flex items-center gap-2">
                             <span className="text-sm font-bold text-slate-600 dark:text-slate-300">فشار خون:</span>
                             <input 
                                type="text" 
                                placeholder="120/80" 
                                dir="ltr"
                                value={formData.bp}
                                onChange={(e) => updateState('bp', e.target.value)}
                                className="w-24 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-center font-mono disabled:opacity-70"
                             />
                        </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        {Object.entries(ORGAN_SYSTEMS_CONFIG).map(([key, config]) => {
                            // SAFE ACCESS: Default to empty structure if key is missing
                            const systemData = formData.organSystems[key] || { 
                                systemName: key, 
                                symptoms: [], 
                                signs: [], 
                                description: '' 
                            };
                            return (
                                <div key={key} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
                                    <h4 className="font-bold text-cyan-700 dark:text-cyan-400 mb-3 border-b border-slate-100 dark:border-white/5 pb-2">
                                        {config.label}
                                    </h4>
                                    
                                    <div className="space-y-4">
                                        {/* Symptoms Checkbox List */}
                                        <div>
                                            <span className="text-xs font-bold text-slate-500 mb-2 block">علائم (Symptoms)</span>
                                            <div className="flex flex-wrap gap-2">
                                                {config.symptoms.map(s => (
                                                    <button 
                                                        key={s}
                                                        disabled={readOnly}
                                                        onClick={() => handleOrganChange(key, 'symptoms', s)}
                                                        className={`text-xs px-2 py-1 rounded border transition-colors ${systemData.symptoms?.includes(s) ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/30' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 disabled:opacity-50'}`}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Signs Checkbox List */}
                                        <div>
                                            <span className="text-xs font-bold text-slate-500 mb-2 block">نشانه‌ها (Signs)</span>
                                            <div className="flex flex-wrap gap-2">
                                                {config.signs.map(s => (
                                                    <button 
                                                        key={s}
                                                        disabled={readOnly}
                                                        onClick={() => handleOrganChange(key, 'signs', s)}
                                                        className={`text-xs px-2 py-1 rounded border transition-colors ${systemData.signs?.includes(s) ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 disabled:opacity-50'}`}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <textarea 
                                            placeholder="توضیحات تکمیلی..." 
                                            value={systemData.description}
                                            onChange={(e) => {
                                                const newSystems = { ...formData.organSystems };
                                                // Ensure key exists before setting description
                                                if (!newSystems[key]) {
                                                     newSystems[key] = { systemName: key, symptoms: [], signs: [], description: '' };
                                                }
                                                newSystems[key].description = e.target.value;
                                                updateState('organSystems', newSystems);
                                            }}
                                            className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg p-2 min-h-[60px] disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-600"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 3. Paraclinical */}
            {activeSection === 'paraclinical' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">۳. یافته‌های پاراکلینیک</h3>

                    {/* Spirometry */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Wind className="w-5 h-5 text-blue-500" /> اسپیرومتری
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">FVC (Lit)</label>
                                <input type="number" step="0.01" value={formData.spirometry.fvc} onChange={(e) => updateState('spirometry', {...formData.spirometry, fvc: parseFloat(e.target.value)})} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center disabled:opacity-70" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">FEV1 (Lit)</label>
                                <input type="number" step="0.01" value={formData.spirometry.fev1} onChange={(e) => updateState('spirometry', {...formData.spirometry, fev1: parseFloat(e.target.value)})} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center disabled:opacity-70" />
                            </div>
                             <div>
                                <label className="text-xs text-slate-500 block mb-1">Ratio %</label>
                                <input type="number" value={formData.spirometry.fev1_fvc} onChange={(e) => updateState('spirometry', {...formData.spirometry, fev1_fvc: parseFloat(e.target.value)})} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center disabled:opacity-70" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Interpretation</label>
                                <select 
                                    value={formData.spirometry.interpretation}
                                    onChange={(e) => updateState('spirometry', {...formData.spirometry, interpretation: e.target.value})}
                                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center text-sm disabled:opacity-70"
                                >
                                    <option value="Normal">Normal</option>
                                    <option value="Obstructive">Obstructive</option>
                                    <option value="Restrictive">Restrictive</option>
                                    <option value="Mixed">Mixed</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Audiometry */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Ear className="w-5 h-5 text-purple-500" /> شنوایی سنجی (Audiometry)
                        </h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-center text-sm">
                                <thead>
                                    <tr className="text-slate-500">
                                        <th className="p-2 text-left">Frq (Hz)</th>
                                        <th className="p-2">250</th>
                                        <th className="p-2">500</th>
                                        <th className="p-2">1000</th>
                                        <th className="p-2">2000</th>
                                        <th className="p-2">4000</th>
                                        <th className="p-2">8000</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-white/5">
                                    <tr>
                                        <td className="p-2 font-bold text-blue-600 text-left">Air Left</td>
                                        {formData.hearing.left.map((val, idx) => (
                                            <td key={idx} className="p-1">
                                                <input 
                                                    type="number" 
                                                    value={val}
                                                    onChange={(e) => {
                                                        const newArr = [...formData.hearing.left];
                                                        newArr[idx] = parseInt(e.target.value) || 0;
                                                        updateState('hearing', {...formData.hearing, left: newArr});
                                                    }}
                                                    className="w-12 p-1 text-center border rounded focus:border-blue-500 outline-none bg-slate-50 dark:bg-slate-800 disabled:opacity-70"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="p-2 font-bold text-red-600 text-left">Air Right</td>
                                        {formData.hearing.right.map((val, idx) => (
                                            <td key={idx} className="p-1">
                                                <input 
                                                    type="number" 
                                                    value={val}
                                                    onChange={(e) => {
                                                        const newArr = [...formData.hearing.right];
                                                        newArr[idx] = parseInt(e.target.value) || 0;
                                                        updateState('hearing', {...formData.hearing, right: newArr});
                                                    }}
                                                    className="w-12 p-1 text-center border rounded focus:border-red-500 outline-none bg-slate-50 dark:bg-slate-800 disabled:opacity-70"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <textarea 
                            placeholder="تفسیر اودیومتری..."
                            value={formData.hearing.report}
                            onChange={(e) => updateState('hearing', {...formData.hearing, report: e.target.value})}
                            className="w-full mt-4 p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm disabled:opacity-70"
                        ></textarea>
                    </div>

                    {/* Optometry */}
                    {formData.vision && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5">
                            <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-emerald-500" /> بینایی سنجی (Optometry)
                            </h4>
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <h5 className="text-xs font-bold text-slate-500 mb-2">حدت بینایی (Acuity)</h5>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="space-y-2">
                                            <div className="font-bold text-center mb-1">چشم راست (OD)</div>
                                            <input placeholder="Uncorrected" value={formData.vision.acuity.right.uncorrected} onChange={(e) => updateState('vision', {...formData.vision, acuity: {...formData.vision!.acuity, right: {...formData.vision!.acuity.right, uncorrected: e.target.value}}})} className="w-full p-2 border rounded text-center bg-white dark:bg-slate-900 disabled:opacity-70" />
                                            <input placeholder="Corrected" value={formData.vision.acuity.right.corrected} onChange={(e) => updateState('vision', {...formData.vision, acuity: {...formData.vision!.acuity, right: {...formData.vision!.acuity.right, corrected: e.target.value}}})} className="w-full p-2 border rounded text-center bg-white dark:bg-slate-900 disabled:opacity-70" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="font-bold text-center mb-1">چشم چپ (OS)</div>
                                            <input placeholder="Uncorrected" value={formData.vision.acuity.left.uncorrected} onChange={(e) => updateState('vision', {...formData.vision, acuity: {...formData.vision!.acuity, left: {...formData.vision!.acuity.left, uncorrected: e.target.value}}})} className="w-full p-2 border rounded text-center bg-white dark:bg-slate-900 disabled:opacity-70" />
                                            <input placeholder="Corrected" value={formData.vision.acuity.left.corrected} onChange={(e) => updateState('vision', {...formData.vision, acuity: {...formData.vision!.acuity, left: {...formData.vision!.acuity.left, corrected: e.target.value}}})} className="w-full p-2 border rounded text-center bg-white dark:bg-slate-900 disabled:opacity-70" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">دید رنگ (Color Vision)</label>
                                        <select value={formData.vision.colorVision} onChange={(e) => updateState('vision', {...formData.vision, colorVision: e.target.value})} className="w-full p-2 border rounded bg-white dark:bg-slate-900 disabled:opacity-70"><option>Normal</option><option>Abnormal</option></select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">عمق دید (Depth)</label>
                                        <input value={formData.vision.depthPerception} onChange={(e) => updateState('vision', {...formData.vision, depthPerception: e.target.value})} className="w-full p-2 border rounded bg-white dark:bg-slate-900 disabled:opacity-70" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Labs */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Beaker className="w-5 h-5 text-amber-500" /> آزمایشات (Lab Tests)
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {['wbc', 'rbc', 'hb', 'plt', 'fbs', 'chol', 'tg', 'creatinine', 'alt', 'ast'].map(test => (
                                <div key={test}>
                                    <label className="text-xs text-slate-500 block mb-1 uppercase">{test}</label>
                                    <input 
                                        type="text" 
                                        value={formData.labResults[test as keyof LabResults] || ''}
                                        onChange={(e) => updateState('labResults', {...formData.labResults, [test]: e.target.value})}
                                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center font-mono disabled:opacity-70"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Final Opinion */}
            {activeSection === 'final' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">۴. نظریه نهایی پزشک</h3>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                        <button 
                            disabled={readOnly}
                            onClick={() => updateState('finalOpinion', {...formData.finalOpinion, status: 'fit'})}
                            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${formData.finalOpinion.status === 'fit' ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 scale-105 shadow-xl' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 opacity-70 hover:opacity-100 disabled:opacity-50'}`}
                        >
                            <CheckSquare className="w-8 h-8" />
                            <span className="font-bold">بلامانع (Fit)</span>
                        </button>
                         <button 
                            disabled={readOnly}
                            onClick={() => updateState('finalOpinion', {...formData.finalOpinion, status: 'conditional'})}
                            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${formData.finalOpinion.status === 'conditional' ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 scale-105 shadow-xl' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 opacity-70 hover:opacity-100 disabled:opacity-50'}`}
                        >
                            <Activity className="w-8 h-8" />
                            <span className="font-bold">مشروط (Conditional)</span>
                        </button>
                         <button 
                            disabled={readOnly}
                            onClick={() => updateState('finalOpinion', {...formData.finalOpinion, status: 'unfit'})}
                            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${formData.finalOpinion.status === 'unfit' ? 'bg-red-50 dark:bg-red-500/20 border-red-500 text-red-700 dark:text-red-300 scale-105 shadow-xl' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 opacity-70 hover:opacity-100 disabled:opacity-50'}`}
                        >
                            <X className="w-8 h-8" />
                            <span className="font-bold">عدم صلاحیت (Unfit)</span>
                        </button>
                    </div>

                    <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5">
                        <div>
                            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-2">توصیه‌ها و محدودیت‌ها</label>
                            <textarea 
                                value={formData.finalOpinion.recommendations}
                                onChange={(e) => updateState('finalOpinion', {...formData.finalOpinion, recommendations: e.target.value})}
                                className="w-full h-32 p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 disabled:opacity-70"
                                placeholder="مثال: استفاده از گوشی حفاظتی الزامی است. کار در ارتفاع ممنوع."
                            />
                        </div>
                         <div>
                            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-2">علت (در صورت مشروط یا عدم تناسب)</label>
                            <textarea 
                                value={formData.finalOpinion.reason}
                                onChange={(e) => updateState('finalOpinion', {...formData.finalOpinion, reason: e.target.value})}
                                className="w-full h-20 p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 disabled:opacity-70"
                                placeholder="علت پزشکی..."
                            />
                        </div>
                    </div>
                </div>
            )}
            
            </fieldset>
        </div>
      </div>
    </div>
  );
};

export default ExamForm;
