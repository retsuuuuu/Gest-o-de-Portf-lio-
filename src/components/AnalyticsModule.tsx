import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Project } from '../types';

const AnalyticsCard = ({ title, value, change, isPositive, icon: Icon }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
        <Icon size={20} />
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
        {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {change}
      </div>
    </div>
    <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
  </div>
);

export const AnalyticsModule = ({ projectsData }: { projectsData: Project[] }) => {
  const stats = {
    total: projectsData.length,
    atrasados: projectsData.filter(p => p.farol.toLowerCase().includes('atrasado')).length,
    emAndamento: projectsData.filter(p => p.status === 'Em andamento').length,
    concluidos: projectsData.filter(p => p.status === 'Concluído').length,
  };

  const monthlyData = [
    { name: 'Jan', projetos: 4, concluídos: 2 },
    { name: 'Fev', projetos: 7, concluídos: 3 },
    { name: 'Mar', projetos: 9, concluídos: 5 },
    { name: 'Abr', projetos: 12, concluídos: 8 },
    { name: 'Mai', projetos: projectsData.length, concluídos: stats.concluidos },
  ];

  const phaseData = [
    { name: 'Backlog', value: projectsData.filter(p => p.phase === 'Backlog').length },
    { name: 'Briefing', value: projectsData.filter(p => p.phase === 'Briefing').length },
    { name: 'Desenvolvimento', value: projectsData.filter(p => p.phase === 'Desenvolvimento').length },
    { name: 'Escopo', value: projectsData.filter(p => p.phase === 'Escopo').length },
    { name: 'Homologação', value: projectsData.filter(p => p.phase === 'Homologação Cliente').length },
    { name: 'Protótipo', value: projectsData.filter(p => p.phase === 'Protótipo').length },
    { name: 'Valoração', value: projectsData.filter(p => p.phase === 'Valoração').length },
  ].filter(d => d.value > 0);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-900">Análises de Desempenho</h2>
        <p className="text-slate-500">Visão detalhada e métricas do portfólio de projetos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard title="Total de Projetos" value={stats.total} change="12%" isPositive={true} icon={TrendingUp} />
        <AnalyticsCard title="Em Andamento" value={stats.emAndamento} change="5%" isPositive={true} icon={Clock} />
        <AnalyticsCard title="Taxa de Conclusão" value={`${stats.total ? Math.round((stats.concluidos / stats.total) * 100) : 0}%`} change="8%" isPositive={true} icon={CheckCircle2} />
        <AnalyticsCard title="Projetos Críticos" value={stats.atrasados} change="2%" isPositive={false} icon={AlertCircle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Crescimento do Portfólio</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorProjetos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="projetos" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorProjetos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Distribuição por Fase</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phaseData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                  {phaseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
