import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, X } from 'lucide-react';
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

const MultiSelect = React.memo(({ label, options, selected, onChange }: { label: string, options: string[], selected: string[], onChange: (vals: string[]) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (opt: string) => {
    if (opt === 'Todos') {
      onChange(['Todos']);
      return;
    }
    const next = selected.includes(opt)
      ? selected.filter(s => s !== opt)
      : [...selected.filter(s => s !== 'Todos'), opt];
    onChange(next.length === 0 ? ['Todos'] : next);
  };

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium flex justify-between items-center cursor-pointer hover:border-indigo-200 transition-all"
      >
        <span className="truncate max-w-[120px]">
          {selected.includes('Todos') ? 'Todos' : selected.join(', ')}
        </span>
        <Filter size={14} className="text-slate-400" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl p-3 max-h-64 overflow-y-auto custom-scrollbar min-w-[200px]"
          >
            {options.map(opt => (
              <label key={opt} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggleOption(opt)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">{opt}</span>
              </label>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

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

export const AnalyticsModule = ({ projectsData, onSegmentClick }: { projectsData: Project[], onSegmentClick?: (title: string, projects: Project[]) => void }) => {
  const [statusFilter, setStatusFilter] = useState<string[]>(['Todos']);
  const [farolFilter, setFarolFilter] = useState<string[]>(['Todos']);
  const [clientFilter, setClientFilter] = useState<string[]>(['Todos']);

  const ALL_STATUS = ['Backlog', 'Concluído', 'Em andamento', 'Pausado', 'Impedimento'];
  const ALL_FAROL = ['No prazo', 'Atrasado (Cliente)', 'Atrasado (TradeUp)', 'Concluído', 'Atrasado'];
  const uniqueClients = useMemo(() => {
    const clients = new Set(projectsData.map(p => p.client).filter(Boolean));
    return ['Todos', ...Array.from(clients).sort()];
  }, [projectsData]);

  const filteredAnalyticsData = useMemo(() => {
    return projectsData.filter(p => {
      const matchesStatus = statusFilter.includes('Todos') || statusFilter.includes(p.status);
      const matchesFarol = farolFilter.includes('Todos') || farolFilter.includes(p.farol);
      const matchesClient = clientFilter.includes('Todos') || clientFilter.includes(p.client);
      return matchesStatus && matchesFarol && matchesClient;
    });
  }, [projectsData, statusFilter, farolFilter, clientFilter]);

  const stats = useMemo(() => ({
    total: filteredAnalyticsData.length,
    atrasados: filteredAnalyticsData.filter(p => (p.farol || '').toLowerCase().includes('atrasado')).length,
    emAndamento: filteredAnalyticsData.filter(p => (p.status || '').toLowerCase() === 'em andamento').length,
    concluidos: filteredAnalyticsData.filter(p => (p.status || '').toLowerCase() === 'concluído').length,
  }), [filteredAnalyticsData]);

  const statusData = useMemo(() => [
    { name: 'Backlog', value: filteredAnalyticsData.filter(p => p.status === 'Backlog').length, projects: filteredAnalyticsData.filter(p => p.status === 'Backlog') },
    { name: 'Em andamento', value: filteredAnalyticsData.filter(p => p.status === 'Em andamento').length, projects: filteredAnalyticsData.filter(p => p.status === 'Em andamento') },
    { name: 'Pausado', value: filteredAnalyticsData.filter(p => p.status === 'Pausado').length, projects: filteredAnalyticsData.filter(p => p.status === 'Pausado') },
    { name: 'Impedimento', value: filteredAnalyticsData.filter(p => p.status === 'Impedimento').length, projects: filteredAnalyticsData.filter(p => p.status === 'Impedimento') },
    { name: 'Concluído', value: filteredAnalyticsData.filter(p => p.status === 'Concluído').length, projects: filteredAnalyticsData.filter(p => p.status === 'Concluído') },
  ].filter(d => d.value > 0), [filteredAnalyticsData]);

  const farolData = useMemo(() => [
    { name: 'No prazo', value: filteredAnalyticsData.filter(p => p.farol === 'No prazo').length, projects: filteredAnalyticsData.filter(p => p.farol === 'No prazo') },
    { name: 'Atrasado', value: filteredAnalyticsData.filter(p => (p.farol || '').toLowerCase().includes('atrasado')).length, projects: filteredAnalyticsData.filter(p => (p.farol || '').toLowerCase().includes('atrasado')) },
    { name: 'Concluído', value: filteredAnalyticsData.filter(p => p.farol === 'Concluído').length, projects: filteredAnalyticsData.filter(p => p.farol === 'Concluído') },
  ].filter(d => d.value > 0), [filteredAnalyticsData]);

  const phaseData = useMemo(() => [
    { name: 'Backlog', value: filteredAnalyticsData.filter(p => p.phase === 'Backlog').length, projects: filteredAnalyticsData.filter(p => p.phase === 'Backlog') },
    { name: 'Briefing', value: filteredAnalyticsData.filter(p => p.phase === 'Briefing').length, projects: filteredAnalyticsData.filter(p => p.phase === 'Briefing') },
    { name: 'Desenvolvimento', value: filteredAnalyticsData.filter(p => p.phase === 'Desenvolvimento').length, projects: filteredAnalyticsData.filter(p => p.phase === 'Desenvolvimento') },
    { name: 'Escopo', value: filteredAnalyticsData.filter(p => p.phase === 'Escopo').length, projects: filteredAnalyticsData.filter(p => p.phase === 'Escopo') },
    { name: 'Homologação', value: filteredAnalyticsData.filter(p => p.phase === 'Homologação Cliente').length, projects: filteredAnalyticsData.filter(p => p.phase === 'Homologação Cliente') },
    { name: 'Protótipo', value: filteredAnalyticsData.filter(p => p.phase === 'Protótipo').length, projects: filteredAnalyticsData.filter(p => p.phase === 'Protótipo') },
    { name: 'Valoração', value: filteredAnalyticsData.filter(p => p.phase === 'Valoração').length, projects: filteredAnalyticsData.filter(p => p.phase === 'Valoração') },
  ].filter(d => d.value > 0), [filteredAnalyticsData]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#64748b', '#8b5cf6', '#ec4899'];

  const handleChartClick = (data: any, title: string) => {
    if (onSegmentClick && data && data.activePayload && data.activePayload[0]) {
      const segment = data.activePayload[0].payload;
      onSegmentClick(`${title}: ${segment.name}`, segment.projects);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-slate-900">Análises Quantitativas</h2>
          <p className="text-slate-500">Visão numérica e distribuição do portfólio de projetos</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <MultiSelect label="Status" options={['Todos', ...ALL_STATUS]} selected={statusFilter} onChange={setStatusFilter} />
          <MultiSelect label="Farol" options={['Todos', ...ALL_FAROL]} selected={farolFilter} onChange={setFarolFilter} />
          <MultiSelect label="Cliente" options={uniqueClients} selected={clientFilter} onChange={setClientFilter} />
          <button
            onClick={() => { setStatusFilter(['Todos']); setFarolFilter(['Todos']); setClientFilter(['Todos']); }}
            className="self-end mb-1 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
            title="Limpar Filtros"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard title="Total de Projetos" value={stats.total} change="---" isPositive={true} icon={TrendingUp} />
        <AnalyticsCard title="Em Andamento" value={stats.emAndamento} change="---" isPositive={true} icon={Clock} />
        <AnalyticsCard title="Taxa de Conclusão" value={`${stats.total ? Math.round((stats.concluidos / stats.total) * 100) : 0}%`} change="---" isPositive={true} icon={CheckCircle2} />
        <AnalyticsCard title="Projetos Atrasados" value={stats.atrasados} change="---" isPositive={false} icon={AlertCircle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Distribuição por Status</h3>
          <div className="h-80 w-full">
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
                  onClick={(data) => onSegmentClick?.(`Status: ${data.name}`, data.projects)}
                  cursor="pointer"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
             {statusData.map((entry, index) => (
               <div key={entry.name} className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                 <span className="text-xs font-medium text-slate-600">{entry.name} ({entry.value})</span>
               </div>
             ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Distribuição por Farol</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={farolData} onClick={(data) => handleChartClick(data, 'Farol')}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {farolData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name.toLowerCase().includes('atrasado') ? '#f43f5e' : entry.name === 'No prazo' ? '#10b981' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Distribuição por Fase</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phaseData} margin={{ left: 40 }} onClick={(data) => handleChartClick(data, 'Fase')}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={50}>
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
