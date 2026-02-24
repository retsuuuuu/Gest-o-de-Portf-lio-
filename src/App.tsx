import React, { useState } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  BarChart3, 
  Search, 
  Bell, 
  Settings, 
  Plus, 
  MoreVertical,
  ChevronRight,
  Star,
  Heart,
  ThumbsUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  PauseCircle,
  ShieldAlert,
  Eye,
  Pencil,
  X,
  Save,
  Info,
  Calendar,
  FileText,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PROJECTS } from './constants';
import { Project } from './types';
import { AnalyticsModule } from './components/AnalyticsModule';
import { NotificationsModal } from './components/NotificationsModal';
import { SettingsModal } from './components/SettingsModal';

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${active ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
  >
    <Icon size={20} />
    <span className="text-sm">{label}</span>
  </div>
);

const StatCard = ({ label, value, change, icon: Icon, color }: { label: string, value: string | number, change?: string, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      {change && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {change}
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-medium mb-1">{label}</h3>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const getStyles = () => {
    switch (status.toLowerCase()) {
      case 'em andamento': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'impedimento': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'concluído': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'backlog': return 'bg-slate-50 text-slate-600 border-slate-100';
      case 'pausado': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStyles()}`}>
      {status}
    </span>
  );
};

const FarolIndicator = ({ farol }: { farol: string }) => {
  const getColor = () => {
    const f = farol.toLowerCase();
    if (f.includes('atrasado')) return 'bg-rose-500';
    if (f === 'no prazo') return 'bg-emerald-500';
    if (f === 'concluído') return 'bg-blue-500';
    return 'bg-amber-500';
  };
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${getColor()}`} />
      <span className="text-xs text-slate-600">{farol}</span>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('Visão Geral');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    initiative: '',
    phase: 'Backlog',
    status: 'Backlog',
    farol: 'No prazo',
    baseline: '',
    deliveryDate: '',
    replannedDate: '',
    report: '',
    type: 'Dash',
    code: `C${Math.floor(Math.random() * 90000) + 10000}`
  });

  const formatDateMask = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 8);
    if (v.length >= 5) return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
    if (v.length >= 3) return `${v.slice(0, 2)}/${v.slice(2)}`;
    return v;
  };

  const handleOpenDetails = (project: Project) => {
    setSelectedProject(project);
    setIsDetailsOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject({ ...project });
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would update the PROJECTS array or call an API
    // For this demo, we'll just close the modal
    setIsEditOpen(false);
    setEditingProject(null);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would add the new project to the list
    setIsCreateOpen(false);
    // Reset form
    setNewProject({
      name: '',
      initiative: '',
      phase: 'Backlog',
      status: 'Backlog',
      farol: 'No prazo',
      baseline: '',
      deliveryDate: '',
      replannedDate: '',
      report: '',
      type: 'Dash',
      code: `C${Math.floor(Math.random() * 90000) + 10000}`
    });
  };

  const filteredProjects = PROJECTS.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.initiative.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    atrasados: PROJECTS.filter(p => p.farol.toLowerCase().includes('atrasado')).length,
    emAndamento: PROJECTS.filter(p => p.status === 'Em andamento').length,
    pausados: PROJECTS.filter(p => p.status === 'Pausado').length,
    impedimento: PROJECTS.filter(p => p.status === 'Impedimento').length,
    concluidos: PROJECTS.filter(p => p.status === 'Concluído').length,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden lg:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <h1 className="font-bold text-sm tracking-tight leading-tight">Gestão de Portfólio | TradeUp</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2 mt-4">Navegação</p>
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Visão Geral" 
            active={activeTab === 'Visão Geral'} 
            onClick={() => setActiveTab('Visão Geral')}
          />
          <SidebarItem 
            icon={BarChart3} 
            label="Análises" 
            active={activeTab === 'Análises'} 
            onClick={() => setActiveTab('Análises')}
          />
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="bg-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-indigo-200">
            <div className="relative z-10">
              <h4 className="text-sm font-bold opacity-80 mb-1">Status Geral</h4>
              <p className="text-2xl font-bold mb-4">{PROJECTS.length} Projetos</p>
              <button className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-all backdrop-blur-sm">
                Gerar Relatório
              </button>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-20 transform rotate-12">
              <BarChart3 size={120} />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-bottom border-slate-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar projetos, clientes..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors relative"
            >
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Settings size={20} />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-none mb-1">Jairo Oliveira</p>
                <p className="text-[10px] text-slate-500 leading-none">Gerente de Projetos</p>
              </div>
              <img 
                src="https://picsum.photos/seed/jairo/100/100" 
                alt="User" 
                className="w-8 h-8 rounded-full border border-slate-200"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {activeTab === 'Visão Geral' ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard label="PROJETOS ATRASADOS" value={stats.atrasados} icon={AlertCircle} color="bg-rose-500" />
                <StatCard label="PROJETOS EM ANDAMENTO" value={stats.emAndamento} icon={Clock} color="bg-blue-500" />
                <StatCard label="PROJETOS PAUSADOS" value={stats.pausados} icon={PauseCircle} color="bg-amber-500" />
                <StatCard label="PROJETOS EM IMPEDIMENTO" value={stats.impedimento} icon={ShieldAlert} color="bg-slate-500" />
                <StatCard label="PROJETOS CONCLUÍDOS" value={stats.concluidos} icon={CheckCircle2} color="bg-emerald-500" />
              </div>

              {/* Status Chart Section */}
              <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Visão por Status</h2>
                    <p className="text-sm text-slate-500">Distribuição quantitativa de projetos</p>
                  </div>
                  <div className="flex gap-2">
                    {Object.entries(stats).map(([key, value]) => {
                      const displayNames: Record<string, string> = {
                        atrasados: 'Atrasados',
                        emAndamento: 'Em Andamento',
                        pausados: 'Pausados',
                        impedimento: 'Impedimento',
                        concluidos: 'Concluídos'
                      };
                      return (
                        <div key={key} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                          <div className={`w-2 h-2 rounded-full ${
                            key === 'atrasados' ? 'bg-rose-500' :
                            key === 'emAndamento' ? 'bg-blue-500' :
                            key === 'pausados' ? 'bg-amber-500' :
                            key === 'impedimento' ? 'bg-slate-500' :
                            'bg-emerald-500'
                          }`} />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {displayNames[key] || key}: {value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="h-[400px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          padding: '12px'
                        }}
                      />
                      <Pie
                        data={[
                          { name: 'Atrasados', value: stats.atrasados, color: '#f43f5e' },
                          { name: 'Em Andamento', value: stats.emAndamento, color: '#3b82f6' },
                          { name: 'Pausados', value: stats.pausados, color: '#f59e0b' },
                          { name: 'Impedimento', value: stats.impedimento, color: '#64748b' },
                          { name: 'Concluídos', value: stats.concluidos, color: '#10b981' },
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={120}
                        outerRadius={160}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { color: '#f43f5e' },
                          { color: '#3b82f6' },
                          { color: '#f59e0b' },
                          { color: '#64748b' },
                          { color: '#10b981' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-5xl font-bold text-slate-900">{PROJECTS.length}</span>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-2">Projetos Totais</span>
                  </div>
                </div>
              </section>

              {/* Project Management Table */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Gestão de Projetos</h2>
                    <p className="text-sm text-slate-500">Acompanhe e gerencie suas iniciativas em andamento</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                      <Filter size={16} />
                      Filtrar
                    </button>
                    <button 
                      onClick={() => setIsCreateOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                    >
                      <Plus size={16} />
                      Novo Projeto
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          CLIENTE
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          PROJETO
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          FASE
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          STATUS
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          FAROL
                        </th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProjects.map((project) => (
                        <motion.tr 
                          key={project.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-700">{project.initiative}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{project.name}</p>
                              <span className="text-[10px] font-mono text-slate-400">
                                {project.code}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                              <span className="text-sm text-slate-600">{project.phase}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={project.status} />
                          </td>
                          <td className="px-6 py-4">
                            <FarolIndicator farol={project.farol} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleOpenDetails(project)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Ver Detalhes"
                              >
                                <Eye size={16} />
                              </button>
                              <button 
                                onClick={() => handleOpenEdit(project)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Editar Projeto"
                              >
                                <Pencil size={16} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {filteredProjects.length === 0 && (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search size={24} className="text-slate-300" />
                    </div>
                    <h3 className="text-slate-900 font-bold">Nenhum projeto encontrado</h3>
                    <p className="text-slate-500 text-sm">Tente ajustar sua busca ou filtros</p>
                  </div>
                )}
              </section>

              {/* Bottom Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900">Atividade Recente</h2>
                    <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider">Ver Tudo</button>
                  </div>
                  <div className="space-y-6">
                    {[
                      { title: 'Transição de fase Projeto Alpha', desc: 'Movido de Design para Desenvolvimento', time: '2H ATRÁS', icon: ChevronRight, color: 'bg-indigo-100 text-indigo-600' },
                      { title: 'Novo Cliente Adicionado', desc: 'Cliente D adicionado ao sistema', time: '5H ATRÁS', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600' },
                      { title: 'Atualização do Sistema', desc: 'Backup mensal concluído com sucesso', time: 'ONTEM', icon: Clock, color: 'bg-blue-100 text-blue-600' },
                    ].map((activity, i) => (
                      <div key={i} className="flex gap-4 relative">
                        {i !== 2 && <div className="absolute left-5 top-10 bottom-0 w-px bg-slate-100" />}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                          <activity.icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-bold text-slate-900 truncate">{activity.title}</h4>
                            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap ml-4">{activity.time}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{activity.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Project Health Overview */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-6">Saúde do Projeto</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-sm text-slate-600">No prazo</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {PROJECTS.filter(p => p.farol.toLowerCase() === 'no prazo').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-sm text-slate-600">Atrasado</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {PROJECTS.filter(p => p.farol.toLowerCase().includes('atrasado')).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-sm text-slate-600">Concluído</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {PROJECTS.filter(p => p.farol.toLowerCase() === 'concluído').length}
                      </span>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progresso Geral</span>
                        <span className="text-xs font-bold text-indigo-600">78%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: '78%' }} />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </>
          ) : (
            <AnalyticsModule />
          )}
        </div>

        {/* Project Details Modal */}
        <AnimatePresence>
          {isDetailsOpen && selectedProject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                      <Info size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Detalhes do Projeto</h2>
                      <p className="text-xs text-slate-500">Informações completas e status atual</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsDetailsOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <section>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Identificação</label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                            <Briefcase size={16} />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Nome do Projeto</p>
                            <p className="text-sm font-bold text-slate-900">{selectedProject.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                            <FileText size={16} />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Código / ID</p>
                            <p className="text-sm font-mono font-bold text-slate-900">{selectedProject.code}</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Cliente & Iniciativa</label>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                          <Users size={16} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Iniciativa</p>
                          <p className="text-sm font-bold text-slate-900">{selectedProject.initiative}</p>
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="space-y-6">
                    <section>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Status & Progresso</label>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-xs text-slate-500">Fase Atual</span>
                          <span className="text-xs font-bold text-indigo-600">{selectedProject.phase}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-xs text-slate-500">Status</span>
                          <StatusBadge status={selectedProject.status} />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-xs text-slate-500">Farol</span>
                          <FarolIndicator farol={selectedProject.farol} />
                        </div>
                      </div>
                    </section>

                    <section>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Cronograma</label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                            <Calendar size={16} />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Data Base (Baseline)</p>
                            <p className="text-sm font-bold text-slate-900">{selectedProject.baseline || 'Não definida'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                            <Calendar size={16} />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Data de Entrega</p>
                            <p className="text-sm font-bold text-slate-900">{selectedProject.deliveryDate || 'Não definida'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                            <Calendar size={16} />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Data Replanejada</p>
                            <p className="text-sm font-bold text-slate-900">{selectedProject.replannedDate || 'Não definida'}</p>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="md:col-span-2">
                    <section className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity size={16} className="text-indigo-600" />
                        <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Último Report / Atualização</label>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed italic">
                        "{selectedProject.report || 'Nenhuma atualização detalhada registrada para este projeto até o momento.'}"
                      </p>
                    </section>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button 
                    onClick={() => setIsDetailsOpen(false)}
                    className="px-6 py-2 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Fechar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Project Modal */}
        <AnimatePresence>
          {isEditOpen && editingProject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                      <Pencil size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Editar Projeto</h2>
                      <p className="text-xs text-slate-500">Atualize as informações do projeto</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsEditOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveEdit} className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Nome do Projeto</label>
                      <input 
                        type="text" 
                        required
                        value={editingProject.name}
                        onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Iniciativa / Cliente</label>
                      <input 
                        type="text" 
                        required
                        value={editingProject.initiative}
                        onChange={(e) => setEditingProject({...editingProject, initiative: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Fase</label>
                      <select 
                        value={editingProject.phase}
                        onChange={(e) => setEditingProject({...editingProject, phase: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      >
                        {['Backlog', 'Briefing', 'Desenvolvimento', 'Escopo', 'Homologação Cliente', 'Concluído', 'Protótipo', 'Valoração'].map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Status</label>
                      <select 
                        value={editingProject.status}
                        onChange={(e) => setEditingProject({...editingProject, status: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      >
                        {['Backlog', 'Concluído', 'Em andamento', 'Pausado', 'Impedimento'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Farol</label>
                      <select 
                        value={editingProject.farol}
                        onChange={(e) => setEditingProject({...editingProject, farol: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      >
                        {['No prazo', 'Atrasado (Cliente)', 'Atrasado (TradeUp)', 'Concluído'].map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Data Base (Baseline)</label>
                      <input 
                        type="text" 
                        placeholder="DD/MM/AAAA"
                        value={editingProject.baseline}
                        onChange={(e) => setEditingProject({...editingProject, baseline: formatDateMask(e.target.value)})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Data de Entrega</label>
                      <input 
                        type="text" 
                        placeholder="DD/MM/AAAA"
                        value={editingProject.deliveryDate || ''}
                        onChange={(e) => setEditingProject({...editingProject, deliveryDate: formatDateMask(e.target.value)})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Data Replanejada</label>
                      <input 
                        type="text" 
                        placeholder="DD/MM/AAAA"
                        value={editingProject.replannedDate || ''}
                        onChange={(e) => setEditingProject({...editingProject, replannedDate: formatDateMask(e.target.value)})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Report</label>
                      <textarea 
                        value={editingProject.report}
                        onChange={(e) => setEditingProject({...editingProject, report: e.target.value})}
                        rows={3}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsEditOpen(false)}
                      className="px-6 py-2 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
                    >
                      <Save size={16} />
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Create Project Modal */}
        <AnimatePresence>
          {isCreateOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                      <Plus size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Novo Projeto</h2>
                      <p className="text-xs text-slate-500">Preencha os dados para criar um novo projeto</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsCreateOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateProject} className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Nome do Projeto</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Dashboard de Vendas"
                        value={newProject.name}
                        onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Iniciativa / Cliente</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Cliente Alpha"
                        value={newProject.initiative}
                        onChange={(e) => setNewProject({...newProject, initiative: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Fase</label>
                      <select 
                        value={newProject.phase}
                        onChange={(e) => setNewProject({...newProject, phase: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      >
                        {['Backlog', 'Briefing', 'Desenvolvimento', 'Escopo', 'Homologação Cliente', 'Concluído', 'Protótipo', 'Valoração'].map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Status</label>
                      <select 
                        value={newProject.status}
                        onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      >
                        {['Backlog', 'Concluído', 'Em andamento', 'Pausado', 'Impedimento'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Farol</label>
                      <select 
                        value={newProject.farol}
                        onChange={(e) => setNewProject({...newProject, farol: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      >
                        {['No prazo', 'Atrasado (Cliente)', 'Atrasado (TradeUp)', 'Concluído'].map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Data Base (Baseline)</label>
                      <input 
                        type="text" 
                        placeholder="DD/MM/AAAA"
                        value={newProject.baseline}
                        onChange={(e) => setNewProject({...newProject, baseline: formatDateMask(e.target.value)})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Report Inicial</label>
                      <textarea 
                        placeholder="Descreva o status inicial do projeto..."
                        value={newProject.report}
                        onChange={(e) => setNewProject({...newProject, report: e.target.value})}
                        rows={3}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsCreateOpen(false)}
                      className="px-6 py-2 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-2 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
                    >
                      <Plus size={16} />
                      Criar Projeto
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <NotificationsModal 
          isOpen={isNotificationsOpen} 
          onClose={() => setIsNotificationsOpen(false)} 
        />
        
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      </main>
    </div>
  );
}
