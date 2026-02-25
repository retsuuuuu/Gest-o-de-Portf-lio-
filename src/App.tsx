import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  LayoutDashboard, BarChart3, Search, Bell, Settings, Plus,
  AlertCircle, CheckCircle2, Clock, Filter, PauseCircle, ShieldAlert,
  Eye, Pencil, X, Save, Calendar, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from './types';
import { AnalyticsModule } from './components/AnalyticsModule';
import { NotificationsModal } from './components/NotificationsModal';
import { SettingsModal } from './components/SettingsModal';

const API_URL = "https://script.google.com/macros/s/AKfycbxgmfIEBWy3dOKpiWfNwDJR_OmBtr6zipzfLjCR_RIEAoZRRNjT2CxkgAKSNIVfD8kgPg/exec";

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <div onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${active ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}>
    <Icon size={20} />
    <span className="text-sm">{label}</span>
  </div>
);

const StatCard = ({ label, value, icon: Icon, color, onClick }: { label: string, value: string | number, icon: any, color: string, onClick?: () => void }) => (
  <div onClick={onClick} className={`bg-white p-7 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full ${onClick ? 'cursor-pointer hover:border-indigo-200' : ''}`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-xl ${color} shadow-lg shadow-current/10`}>
        <Icon size={22} className="text-white" />
      </div>
    </div>
    <div className="flex-1 flex flex-col justify-between">
      <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2 min-h-[32px] flex items-center leading-tight">{label}</h3>
      <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
    </div>
  </div>
);

const FormField = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <div className="min-h-[20px] flex items-end">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-none">{label}</label>
    </div>
    {children}
  </div>
);

const inputClass = "w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400";

const maskDate = (value: string) => {
  if (!value) return '';
  const v = value.replace(/\D/g, '').slice(0, 8);
  if (v.length >= 5) return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4, 8)}`;
  if (v.length >= 3) return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
  return v;
};

const formatToDDMMYYYY = (dateStr: string) => {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr; // Already formatted
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const getStyles = () => {
    switch (status?.toLowerCase()) {
      case 'em andamento': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'impedimento': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'concluído': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'pausado': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStyles()}`}>{status || 'N/A'}</span>;
};

const FarolIndicator = ({ farol }: { farol: string }) => {
  const getColor = () => {
    const f = farol?.toLowerCase() || '';
    if (f.includes('atrasado')) return 'bg-rose-500';
    if (f === 'no prazo') return 'bg-emerald-500';
    if (f === 'concluído') return 'bg-blue-500';
    return 'bg-amber-500';
  };
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${getColor()}`} />
      <span className="text-xs text-slate-600">{farol || 'N/A'}</span>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('Visão Geral');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [projectsData, setProjectsData] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '', initiative: '', phase: 'Backlog', status: 'Backlog', farol: 'No prazo', baseline: '', report: '', type: 'Estratégico'
  });

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listModalTitle, setListModalTitle] = useState('');
  const [listModalProjects, setListModalProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      const mapped: Project[] = data.map((row: any, i: number) => ({
        id: String(i),
        type: row['TIPO PROJETO'] || '',
        initiative: row['INICIATIVA'] || '',
        code: row['CODIGO PROJETO'] || `C${Math.floor(Math.random() * 90000)}`,
        name: row['PROJETO'] || 'Sem Nome',
        phase: row['FASE'] || 'Backlog',
        status: row['STATUS'] || 'Backlog',
        baseline: formatToDDMMYYYY(row['BASELINE'] || ''),
        report: row['REPORT'] || '',
        farol: row['FAROL'] || 'No prazo',
        deliveryDate: formatToDDMMYYYY(row['ENTREGA'] || ''),
        replannedDate: formatToDDMMYYYY(row['REPLANEJAMENTO'] || ''),
      }));
      setProjectsData(mapped);
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProject = async (projectToSave: Partial<Project>, isEdit: boolean) => {
    setIsSaving(true);
    const code = projectToSave.code || `C${Math.floor(Math.random() * 90000) + 10000}`;
    
    const payload = {
      action: isEdit ? "update" : "create",
      payload: {
        "TIPO PROJETO": projectToSave.type,
        "INICIATIVA": projectToSave.initiative,
        "CODIGO PROJETO": code,
        "PROJETO": projectToSave.name,
        "FASE": projectToSave.phase,
        "STATUS": projectToSave.status,
        "BASELINE": projectToSave.baseline,
        "REPORT": projectToSave.report,
        "FAROL": projectToSave.farol,
        "ENTREGA": projectToSave.deliveryDate,
        "REPLANEJAMENTO": projectToSave.replannedDate
      }
    };

    try {
      // O mode: 'no-cors' é a intervenção cirúrgica para contornar o bloqueio do Google.
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      // Atualização Otimista da Interface
      if (isEdit) {
        setProjectsData(prev => prev.map(p => p.id === projectToSave.id ? { ...p, ...projectToSave } as Project : p));
        setIsEditOpen(false);
      } else {
        const newProj: Project = { ...projectToSave, code, id: Date.now().toString() } as Project;
        setProjectsData(prev => [...prev, newProj]);
        setIsCreateOpen(false);
        setNewProject({ name: '', initiative: '', phase: 'Backlog', status: 'Backlog', farol: 'No prazo', baseline: '', report: '', type: 'Estratégico' });
      }
    } catch (error) {
      console.error("Erro crítico de submissão:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (!window.confirm(`Tem a certeza que deseja eliminar o projeto "${project.name}"?`)) return;

    setIsSaving(true);
    const payload = {
      action: "delete",
      payload: {
        "CODIGO PROJETO": project.code
      }
    };

    try {
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      setProjectsData(prev => prev.filter(p => p.id !== project.id));
    } catch (error) {
      console.error("Erro ao eliminar projeto:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold tracking-widest text-sm uppercase">A sincronizar Base de Dados...</p>
        </div>
      </div>
    );
  }

  const filteredProjects = projectsData.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.initiative.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    atrasados: projectsData.filter(p => (p.farol || '').toLowerCase().includes('atrasado')).length,
    emAndamento: projectsData.filter(p => (p.status || '').toLowerCase() === 'em andamento').length,
    pausados: projectsData.filter(p => (p.status || '').toLowerCase() === 'pausado').length,
    impedimento: projectsData.filter(p => (p.status || '').toLowerCase() === 'impedimento').length,
    concluidos: projectsData.filter(p => (p.status || '').toLowerCase() === 'concluído').length,
  };

  const handleOpenListModal = (title: string, projects: Project[]) => {
    setListModalTitle(title);
    setListModalProjects(projects);
    setIsListModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Barra Lateral */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden lg:flex">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <LayoutDashboard size={24} className="text-white" />
          </div>
          <h1 className="font-bold text-base tracking-tight leading-tight text-slate-900">Portfolio <br/><span className="text-indigo-600">TradeUp</span></h1>
        </div>
        <nav className="flex-1 px-4 space-y-1.5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-3 mt-4">Navegação</p>
          <SidebarItem icon={LayoutDashboard} label="Visão Geral" active={activeTab === 'Visão Geral'} onClick={() => setActiveTab('Visão Geral')} />
          <SidebarItem icon={BarChart3} label="Análises" active={activeTab === 'Análises'} onClick={() => setActiveTab('Análises')} />
        </nav>
        <div className="p-6 border-t border-slate-100">
          <div
            onClick={() => handleOpenListModal("Todos os Projetos", projectsData)}
            className="bg-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-indigo-200 cursor-pointer hover:bg-indigo-700 transition-colors group"
          >
            <div className="relative z-10">
              <h4 className="text-sm font-bold opacity-80 mb-1">Status Geral</h4>
              <p className="text-2xl font-bold mb-4 group-hover:scale-110 transition-transform origin-left">{projectsData.length} Projetos</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-20 transform rotate-12 group-hover:rotate-0 transition-transform duration-500"><BarChart3 size={120} /></div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-bottom border-slate-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Procurar projetos..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsNotificationsOpen(true)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg relative">
              <Bell size={20} /><span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
              <Settings size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {activeTab === 'Visão Geral' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard
                  label="PROJETOS ATRASADOS"
                  value={stats.atrasados}
                  icon={AlertCircle}
                  color="bg-rose-500"
                  onClick={() => handleOpenListModal("Projetos Atrasados", projectsData.filter(p => (p.farol || '').toLowerCase().includes('atrasado')))}
                />
                <StatCard
                  label="PROJETOS EM ANDAMENTO"
                  value={stats.emAndamento}
                  icon={Clock}
                  color="bg-blue-500"
                  onClick={() => handleOpenListModal("Projetos em Andamento", projectsData.filter(p => (p.status || '').toLowerCase() === 'em andamento'))}
                />
                <StatCard
                  label="PROJETOS PAUSADOS"
                  value={stats.pausados}
                  icon={PauseCircle}
                  color="bg-amber-500"
                  onClick={() => handleOpenListModal("Projetos Pausados", projectsData.filter(p => (p.status || '').toLowerCase() === 'pausado'))}
                />
                <StatCard
                  label="PROJETOS EM IMPEDIMENTO"
                  value={stats.impedimento}
                  icon={ShieldAlert}
                  color="bg-slate-500"
                  onClick={() => handleOpenListModal("Projetos em Impedimento", projectsData.filter(p => (p.status || '').toLowerCase() === 'impedimento'))}
                />
                <StatCard
                  label="PROJETOS CONCLUÍDOS"
                  value={stats.concluidos}
                  icon={CheckCircle2}
                  color="bg-emerald-500"
                  onClick={() => handleOpenListModal("Projetos Concluídos", projectsData.filter(p => (p.status || '').toLowerCase() === 'concluído'))}
                />
              </div>

              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Gestão de Projetos</h2>
                    <p className="text-sm text-slate-500">Acompanhe e gira as suas iniciativas</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors">
                      <Plus size={16} /> Novo Projeto
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                        <th className="px-6 py-5 font-bold">Projeto</th>
                        <th className="px-6 py-5 font-bold">Fase</th>
                        <th className="px-6 py-5 font-bold">Status</th>
                        <th className="px-6 py-5 font-bold">Farol</th>
                        <th className="px-6 py-5 font-bold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProjects.map((project) => (
                        <tr key={project.id} className="hover:bg-slate-50/50 transition-colors">
                          <td
                            className="px-6 py-5 cursor-pointer group"
                            onClick={() => { setSelectedProject(project); setIsDetailsOpen(true); }}
                          >
                            <p className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug mb-0.5">{project.name}</p>
                            <p className="text-[11px] text-slate-500 font-medium">{project.code} <span className="mx-1 opacity-30">•</span> {project.initiative}</p>
                          </td>
                          <td className="px-6 py-4"><span className="text-sm text-slate-600">{project.phase}</span></td>
                          <td className="px-6 py-4"><StatusBadge status={project.status} /></td>
                          <td className="px-6 py-4"><FarolIndicator farol={project.farol} /></td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => { setSelectedProject(project); setIsDetailsOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                <Eye size={16} />
                              </button>
                              <button onClick={() => { setEditingProject(project); setIsEditOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                <Pencil size={16} />
                              </button>
                              <button onClick={() => handleDeleteProject(project)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : (
            <AnalyticsModule projectsData={projectsData} onSegmentClick={handleOpenListModal} />
          )}
        </div>
      </main>

      {/* Modais de Interação */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6 my-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Novo Projeto</h2>
                <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveProject(newProject, false); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField label="Nome do Projeto">
                      <input required placeholder="Nome do Projeto" value={newProject.name} onChange={(e) => setNewProject({...newProject, name: e.target.value})} className={inputClass} />
                    </FormField>
                  </div>

                  <div className="md:col-span-2">
                    <FormField label="Iniciativa / Cliente">
                      <input required placeholder="Iniciativa" value={newProject.initiative} onChange={(e) => setNewProject({...newProject, initiative: e.target.value})} className={inputClass} />
                    </FormField>
                  </div>

                  <div className="md:col-span-2">
                    <FormField label="Código do Projeto">
                      <input placeholder="Ex: C00001" value={newProject.code} onChange={(e) => setNewProject({...newProject, code: e.target.value})} className={inputClass} />
                    </FormField>
                  </div>

                  <FormField label="Fase">
                    <select value={newProject.phase} onChange={(e) => setNewProject({...newProject, phase: e.target.value})} className={inputClass}>
                      {['Backlog', 'Briefing', 'Desenvolvimento', 'Escopo', 'Homologação Cliente', 'Concluído', 'Protótipo', 'Valoração'].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </FormField>

                  <FormField label="Status">
                    <select value={newProject.status} onChange={(e) => setNewProject({...newProject, status: e.target.value})} className={inputClass}>
                      {['Backlog', 'Concluído', 'Em andamento', 'Pausado', 'Impedimento'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </FormField>

                  <FormField label="Farol">
                    <select value={newProject.farol} onChange={(e) => setNewProject({...newProject, farol: e.target.value})} className={inputClass}>
                      {['No prazo', 'Atrasado (Cliente)', 'Atrasado (TradeUp)', 'Concluído'].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </FormField>

                  <FormField label="Data Base (Baseline)">
                    <input placeholder="DD/MM/AAAA" value={newProject.baseline} onChange={(e) => setNewProject({...newProject, baseline: maskDate(e.target.value)})} className={inputClass} />
                  </FormField>

                  <FormField label="Data de Entrega">
                    <input placeholder="DD/MM/AAAA" value={newProject.deliveryDate} onChange={(e) => setNewProject({...newProject, deliveryDate: maskDate(e.target.value)})} className={inputClass} />
                  </FormField>

                  <FormField label="Data Replanejada">
                    <input placeholder="DD/MM/AAAA" value={newProject.replannedDate} onChange={(e) => setNewProject({...newProject, replannedDate: maskDate(e.target.value)})} className={inputClass} />
                  </FormField>

                  <div className="md:col-span-2">
                    <FormField label="Report">
                      <textarea rows={3} placeholder="Breve resumo do status..." value={newProject.report} onChange={(e) => setNewProject({...newProject, report: e.target.value})} className={`${inputClass} resize-none`} />
                    </FormField>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsCreateOpen(false)} className="px-6 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-colors">Cancelar</button>
                  <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
                    <Plus size={18} /> {isSaving ? 'A gravar...' : 'Criar Projeto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isEditOpen && editingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6 my-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Editar Projeto</h2>
                <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveProject(editingProject, true); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField label="Nome do Projeto">
                      <input required value={editingProject.name} onChange={(e) => setEditingProject({...editingProject, name: e.target.value})} className={inputClass} />
                    </FormField>
                  </div>

                  <div className="md:col-span-2">
                    <FormField label="Iniciativa / Cliente">
                      <input required value={editingProject.initiative} onChange={(e) => setEditingProject({...editingProject, initiative: e.target.value})} className={inputClass} />
                    </FormField>
                  </div>

                  <div className="md:col-span-2">
                    <FormField label="Código do Projeto">
                      <input required value={editingProject.code} onChange={(e) => setEditingProject({...editingProject, code: e.target.value})} className={inputClass} />
                    </FormField>
                  </div>

                  <FormField label="Fase">
                    <select value={editingProject.phase} onChange={(e) => setEditingProject({...editingProject, phase: e.target.value})} className={inputClass}>
                      {['Backlog', 'Briefing', 'Desenvolvimento', 'Escopo', 'Homologação Cliente', 'Concluído', 'Protótipo', 'Valoração'].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </FormField>

                  <FormField label="Status">
                    <select value={editingProject.status} onChange={(e) => setEditingProject({...editingProject, status: e.target.value})} className={inputClass}>
                      {['Backlog', 'Concluído', 'Em andamento', 'Pausado', 'Impedimento'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </FormField>

                  <FormField label="Farol">
                    <select value={editingProject.farol} onChange={(e) => setEditingProject({...editingProject, farol: e.target.value})} className={inputClass}>
                      {['No prazo', 'Atrasado (Cliente)', 'Atrasado (TradeUp)', 'Concluído'].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </FormField>

                  <FormField label="Data Base (Baseline)">
                    <input placeholder="DD/MM/AAAA" value={editingProject.baseline} onChange={(e) => setEditingProject({...editingProject, baseline: maskDate(e.target.value)})} className={inputClass} />
                  </FormField>

                  <FormField label="Data de Entrega">
                    <input placeholder="DD/MM/AAAA" value={editingProject.deliveryDate} onChange={(e) => setEditingProject({...editingProject, deliveryDate: maskDate(e.target.value)})} className={inputClass} />
                  </FormField>

                  <FormField label="Data Replanejada">
                    <input placeholder="DD/MM/AAAA" value={editingProject.replannedDate} onChange={(e) => setEditingProject({...editingProject, replannedDate: maskDate(e.target.value)})} className={inputClass} />
                  </FormField>

                  <div className="md:col-span-2">
                    <FormField label="Report">
                      <textarea rows={3} value={editingProject.report} onChange={(e) => setEditingProject({...editingProject, report: e.target.value})} className={`${inputClass} resize-none`} />
                    </FormField>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsEditOpen(false)} className="px-6 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-colors">Cancelar</button>
                  <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
                    <Save size={18} /> {isSaving ? 'A gravar...' : 'Gravar Alterações'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isListModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 relative my-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">{listModalTitle}</h2>
                <button onClick={() => setIsListModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {listModalProjects.length > 0 ? (
                  listModalProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => { setSelectedProject(project); setIsDetailsOpen(true); }}
                      className="p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{project.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{project.code}</p>
                        </div>
                        <Eye size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-slate-500 text-sm">Nenhum projeto encontrado nesta categoria.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {isDetailsOpen && selectedProject && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-8 relative">
              <button onClick={() => setIsDetailsOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X size={20}/></button>
              <h2 className="text-2xl font-bold mb-1">{selectedProject.name}</h2>
              <p className="text-sm text-slate-500 mb-6 font-mono">ID: {selectedProject.code}</p>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                  <span className="text-sm font-bold text-slate-500">Status Geral</span>
                  <StatusBadge status={selectedProject.status} />
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                  <span className="text-sm font-bold text-slate-500">Farol (Saúde)</span>
                  <FarolIndicator farol={selectedProject.farol} />
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                  <span className="text-sm font-bold text-slate-500">Iniciativa</span>
                  <span className="text-sm text-slate-900">{selectedProject.initiative}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <span className="text-sm font-bold text-slate-500 block mb-2">Último Report</span>
                  <p className="text-sm text-slate-700">{selectedProject.report || 'Sem report registado.'}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {isNotificationsOpen && <NotificationsModal onClose={() => setIsNotificationsOpen(false)} />}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}
