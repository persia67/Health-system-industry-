import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { Users, FileText, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { Worker } from '../types';

interface DashboardProps {
  workers: Worker[];
}

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'];

const Dashboard: React.FC<DashboardProps> = ({ workers }) => {
  // Aggregate stats
  const totalWorkers = workers.length;
  const totalExams = workers.reduce((acc, w) => acc + w.exams.length, 0);
  const criticalCases = workers.filter(w => {
    const lastExam = w.exams[0];
    if (!lastExam) return false;
    return lastExam.hearing.left < 25 || lastExam.hearing.right < 25 || lastExam.spirometry.interpretation !== 'Normal';
  }).length;
  
  const avgHealth = 82; // Mocked for now

  // Data for Charts
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

  const StatCard = ({ icon: Icon, title, value, colorClass }: any) => (
    <div className={`rounded-2xl p-6 border border-white/10 backdrop-blur-md bg-gradient-to-br ${colorClass} shadow-xl transform transition-all hover:scale-[1.02]`}>
      <Icon className="w-10 h-10 text-white/80 mb-4" />
      <div className="text-4xl font-bold text-white mb-1">{value}</div>
      <p className="text-white/90 font-medium text-sm">{title}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
        />
        <StatCard 
          icon={TrendingUp} 
          title="میانگین شاخص سلامت" 
          value={`${avgHealth}%`} 
          colorClass="from-purple-600 to-pink-600" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Trend Chart */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            روند معاینات ماهانه
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={examTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
                <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="exams" name="تعداد معاینات" stroke="#06b6d4" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="issues" name="موارد غیرنرمال" stroke="#f43f5e" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
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
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Compliance Bars */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4">شاخص های انطباق (Compliance)</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-white mb-2 text-sm font-medium">
                <span>استاندارد HSE</span>
                <span className="text-emerald-400">85/90</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-green-400 h-3 rounded-full transition-all duration-1000" style={{width: '94%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-white mb-2 text-sm font-medium">
                <span>استاندارد OSHA</span>
                <span className="text-amber-400">78/85</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-yellow-400 h-3 rounded-full transition-all duration-1000" style={{width: '92%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-white mb-2 text-sm font-medium">
                <span>ISO 45001</span>
                <span className="text-cyan-400">92/95</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-400 h-3 rounded-full transition-all duration-1000" style={{width: '97%'}}></div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;