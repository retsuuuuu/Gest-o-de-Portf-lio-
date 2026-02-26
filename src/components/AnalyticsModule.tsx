import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
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
import { ALL_PHASES, ALL_STATUS, ALL_FAROL } from '../constants';

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

export const AnalyticsModule = ({ projectsData, onSegmentClick }: { projectsData: Project[], onSegmentClick: (title: string, projects: Project[]) => void }) => {
  const stats = {
    total: projectsData.length,
    atrasados: projectsData.filter(p => (p.farol || '').toLowerCase().includes('atrasado')).length,
    emAndamento: projectsData.filter(p => (p.status || '').toLowerCase() === 'em andamento').length,
    concluidos: projectsData.filter(p => (p.status || '').toLowerCase() === 'concluído').length,
  };

  const statusData = ALL_STATUS.map(s => ({
    name: s,
    value: projectsData.filter(p => (p.status || '').toLowerCase() === s.toLowerCase()).length
  })).filter(d => d.value > 0);

  const farolData = ALL_FAROL.map(f => ({
    name: f,
    value: projectsData.filter(p => (p.farol || '').toLowerCase() === f.toLowerCase()).length
  })).filter(d => d.value > 0);

  const phaseData = ALL_PHASES.map(ph => ({
    name: ph,
    value: projectsData.filter(p => (p.phase || '').toLowerCase() === ph.toLowerCase()).length
  })).filter(d => d.value > 0);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-900">Análises de Desempenho</h2>
        <p className="text-slate-500">Visão detalhada e métricas do portfólio de projetos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => onSegmentClick("Todos os Projetos", projectsData)} className="cursor-pointer transition-transform hover:scale-[1.02]">
          <AnalyticsCard title="Total de Projetos" value={stats.total} change="Atual" isPositive={true} icon={TrendingUp} />
        </div>
        <div onClick={() => onSegmentClick("Projetos em Andamento", projectsData.filter(p => (p.status || '').toLowerCase() === 'em andamento'))} className="cursor-pointer transition-transform hover:scale-[1.02]">
          <AnalyticsCard title="Em Andamento" value={stats.emAndamento} change="Ativos" isPositive={true} icon={Clock} />
        </div>
        <div onClick={() => onSegmentClick("Projetos Concluídos", projectsData.filter(p => (p.status || '').toLowerCase() === 'concluído'))} className="cursor-pointer transition-transform hover:scale-[1.02]">
          <AnalyticsCard title="Taxa de Conclusão" value={`${stats.total ? Math.round((stats.concluidos / stats.total) * 100) : 0}%`} change="Média" isPositive={true} icon={CheckCircle2} />
        </div>
        <div onClick={() => onSegmentClick("Projetos Críticos (Atrasados)", projectsData.filter(p => (p.farol || '').toLowerCase().includes('atrasado')))} className="cursor-pointer transition-transform hover:scale-[1.02]">
          <AnalyticsCard title="Projetos Críticos" value={stats.atrasados} change="Alerta" isPositive={false} icon={AlertCircle} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Distribuição por Status</h3>
          <div className="h-80 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  onClick={(data) => onSegmentClick(`Projetos: ${data.name}`, projectsData.filter(p => (p.status || '').toLowerCase() === data.name.toLowerCase()))}
                  className="cursor-pointer"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="outline-none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
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
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                  barSize={30}
                  onClick={(data) => onSegmentClick(`Fase: ${data.name}`, projectsData.filter(p => (p.phase || '').toLowerCase() === data.name.toLowerCase()))}
                  className="cursor-pointer"
                >
                  {phaseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="outline-none" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Saúde do Portfólio (Farol)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={farolData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  barSize={60}
                  onClick={(data) => onSegmentClick(`Farol: ${data.name}`, projectsData.filter(p => (p.farol || '').toLowerCase() === data.name.toLowerCase()))}
                  className="cursor-pointer"
                >
                  {farolData.map((entry, index) => {
                    let color = '#10b981'; // No prazo
                    if (entry.name.includes('Atrasado (Cliente)')) color = '#f43f5e';
                    if (entry.name.includes('Atrasado (TradeUp)')) color = '#fb7185';
                    if (entry.name === 'Concluído') color = '#3b82f6';
                    return <Cell key={`cell-${index}`} fill={color} className="outline-none" />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
