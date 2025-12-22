
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { Users, FileText, AlertTriangle, TrendingUp, Activity, ArrowLeft, Eye, Ear, Wind, Heart, X, Stethoscope, ArrowRight } from 'lucide-react';
import { Worker } from '../types';

interface DashboardProps {
  workers: Worker[];
  onViewCritical: () => void;
  isDark: boolean;
  onSelectWorker?: (worker: Worker) => void;
}

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'];

const Dashboard: React.FC<DashboardProps> = ({ workers, onViewCritical, isDark, onSelectWorker }) => {
  const [selectedDisease, setSelectedDisease] = useState<{title: string, list: Worker[]} | null>(null);

  // Aggregate stats
  const totalWorkers = workers.length;
  const totalExams = workers.reduce((acc, w) => acc + w.exams.length, 0);
  const criticalCases = workers.filter(w => w.referralStatus !== 'none').length;
  
  const avgHealth = 82; // Mocked for now

  // --- Analytical Logic ---
  
  const diseaseStats = useMemo(() => {
    const stats = {
        vision: [] as Worker[],
        hearing: [] as Worker[],
        respiratory: [] as Worker[],
        metabolic: [] as Worker[]
    };

    workers.forEach(w => {
        const exam = w.exams[0];
        if (!exam) return;

        // Vision: Glasses recommended or Abnormal acuity
        const hasVisionIssue = 
            (exam.vision && (
                exam.vision.acuity.left.corrected || exam.vision.acuity.right.corrected ||
                exam.vision.colorVision === 'Abnormal'
            )) || 
            (exam.finalOpinion.recommendations && exam.finalOpinion.recommendations.includes('عینک'));
        
        if (hasVisionIssue) stats.vision.push(w);

        // Hearing: Avg > 25dB
        const avgLeft = exam.hearing.left.length > 0 ? exam.hearing.left.reduce((a, b) => a + b, 0) / exam.hearing.left.length : 0;
        const avgRight = exam.hearing.right.length > 0 ? exam.hearing.right.reduce((a, b) => a + b, 0) / exam.hearing.right.length : 0;
        if (avgLeft > 25 || avgRight > 25) stats.hearing.push(w);

        // Respiratory: Not Normal
        if (exam.spirometry.interpretation !== 'Normal') stats.respiratory.push(w);

        // Metabolic (Simple heuristic based on BP or final opinion keywords)
        const [sys, dia] = exam.bp.split('/').map(n => parseInt(n));
        const hasBP = sys > 140 || dia > 90;
        const hasMetabolicKeyword = exam.finalOpinion.reason && (
            exam.finalOpinion.reason.includes('دیابت') || 
            exam.finalOpinion.reason.includes('فشار') || 
            exam.finalOpinion.reason.includes('چربی')
        );
        if (hasBP || hasMetabolicKeyword) stats.metabolic.push(w);
    });

    return [
        { name: 'مشکلات بینایی', count: stats.vision.length, list: stats.vision, fill: '#06b6d4', icon: Eye },
        { name: 'افت شنوایی', count: stats.hearing.length, list: stats.hearing, fill: '#ec4899', icon: Ear },
        { name: 'تنفسی (ریه)', count: stats.respiratory.length, list: stats.respiratory, fill: '#10b981', icon: Wind },
        { name: 'متابولیک/فشارخون', count: stats.metabolic.length, list: stats.metabolic, fill: '#f59e0b', icon: Heart },
    ];
  }, [workers]);

  const departmentData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    workers.forEach(w => {
      counts[w.department] = (counts[w.department] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [workers]);

  const examTrendData = [
    { name: 'فروردین', exams: 12, issues: 2 },
    { name: 'اردیبهشت', exams: 18, issues: 3 },
    { name: 'خرداد', exams: 15, issues: 1 },
    { name: 'تیر', exams: 25, issues: 5 },
    { name: 'مرداد', exams: 20, issues: 2 },
    { name: 'شهریور', exams: 30, issues: 4 },
  ];

  const StatCard = ({ icon: Icon, title, value, colorClass, onClick, clickable }: any) => (
    <div 
        onClick={onClick}
        className={`rounded-2xl p-6 border border-white/10 dark:border-white/10 backdrop-blur-md bg-gradient-to-br ${colorClass} shadow-xl transform transition-all ${clickable ? 'cursor-pointer hover:scale-105 hover:shadow-2xl ring-2 ring-white/10 hover:ring-white/30' : 'hover:scale-[1.02]'}`}
    >
      <div className="flex justify-between items-start">
          <Icon className="w-10 h-10 text-white/80 mb-4" />
          {clickable && <div className="bg-white/20 p-1 rounded-full"><ArrowLeft className="w-4 h-4 text-white rotate-45" /></div>}
      </div>
      <div className="text-4xl font-bold text-white mb-1">{value}</div>
      <p className="text-white/90 font-medium text-sm">{title}</p>
    </div>
  );

  const chartTextColor = isDark ? '#94a3b8' : '#475569';
  const chartGridColor = isDark ? '#ffffff10' : '#00000010';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#cbd5e1';
  const tooltipText = isDark ? '#fff' : '#1e293b';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      {/* Drill Down Modal */}
      {selectedDisease && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95">
                  <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Activity className="text-blue-500" />
                          لیست پرسنل: {selectedDisease.title}
                      </h3>
                      <button onClick={() => setSelectedDisease(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                          <X className="w-5 h-5 text-slate-500" />
                      </button>
                  </div>
                  <div className="overflow-y-auto p-4 space-y-2">
                      {selectedDisease.list.length === 0 ? (
                          <div className="text-center py-10 text-slate-500">موردی یافت نشد.</div>
                      ) : (
                          selectedDisease.list.map(w => (
                              <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 hover:border-blue-500/50 transition-all">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                                          {w.name.charAt(0)}
                                      </div>
                                      <div>
                                          <div className="font-bold text-slate-900 dark:text-white text-sm">{w.name}</div>
                                          <div className="text-xs text-slate-500">{w.department} | کد: {w.personnelCode || '-'}</div>
                                      </div>
                                  </div>
                                  {onSelectWorker && (
                                      <button 
                                          onClick={() => {
                                              onSelectWorker(w);
                                              setSelectedDisease(null);
                                          }}
                                          className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                                      >
                                          مشاهده پرونده <ArrowRight className="w-3 h-3" />
                                      </button>
                                  )}
                              </div>
                          ))
                      )}
                  </div>
                  <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl text-center text-xs text-slate-500">
                      تعداد کل: {selectedDisease.list.length} نفر
                  </div>
              </div>
          </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Users} 
          title="کل پرسنل" 
          value={totalWorkers} 
          colorClass="from-blue-600 to-cyan-600" 
        />
        <StatCard 
          icon={FileText} 
          title="معاینات انجام شده" 
          value={totalExams} 
          colorClass="from-emerald-600 to-teal-600" 
        />
        <StatCard 
          icon={AlertTriangle} 
          title="موارد نیازمند پیگیری" 
          value={criticalCases} 
          colorClass="from-orange-600 to-red-600"
          onClick={onViewCritical}
          clickable={true}
        />
        <StatCard 
          icon={TrendingUp} 
          title="میانگین شاخص سلامت" 
          value={`${avgHealth}%`} 
          colorClass="from-purple-600 to-pink-600" 
        />
      </div>

      {/* Disease Analysis Section */}
      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-red-500" />
            تحلیل وضعیت بیماری‌ها (کلیک برای جزئیات)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {diseaseStats.map((stat, idx) => (
                  <button 
                      key={idx}
                      onClick={() => setSelectedDisease({ title: stat.name, list: stat.list })}
                      className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
                  >
                      <div className="p-3 rounded-full mb-3" style={{ backgroundColor: `${stat.fill}20`, color: stat.fill }}>
                          <stat.icon className="w-6 h-6" />
                      </div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1 group-hover:scale-110 transition-transform">
                          {stat.count}
                      </div>
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{stat.name}</div>
                      <div className="mt-2 text-[10px] text-slate-400">مشاهده لیست پرسنل</div>
                  </button>
              ))}
          </div>
          <div className="h-[200px] w-full mt-6">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={diseaseStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                      <XAxis dataKey="name" stroke={chartTextColor} tick={{fontSize: 10}} />
                      <YAxis stroke={chartTextColor} />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }} 
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {diseaseStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                  </BarChart>
               </ResponsiveContainer>
          </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Trend Chart */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
            روند معاینات ماهانه
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={examTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis dataKey="name" stroke={chartTextColor} tick={{fill: chartTextColor}} />
                <YAxis stroke={chartTextColor} tick={{fill: chartTextColor}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }}
                  itemStyle={{ color: tooltipText }}
                />
                <Legend />
                <Line type="monotone" dataKey="exams" name="تعداد معاینات" stroke="#06b6d4" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="issues" name="موارد غیرنرمال" stroke="#f43f5e" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            توزیع پرسنل در واحدها
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
