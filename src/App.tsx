import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  LayoutDashboard, BarChart3, Search, Bell, Settings, Plus,
  AlertCircle, CheckCircle2, Clock, Filter, PauseCircle, ShieldAlert,
  Eye, Pencil, X, Save, Calendar
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

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
    <h3 className="text-slate-500 text-sm font-medium mb-1">{label}</h3>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
  </div>
);

const FormField = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
    {children}
  </div>
);

const inputClass = "w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400";

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
        baseline: row['BASELINE'] || '',
        report: row['REPORT'] || '',
        farol: row['FAROL'] || 'No prazo',
        deliveryDate: row['ENTREGA'] || '',
        replannedDate: row['REPLANEJAMENTO'] || '',
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
    atrasados: projectsData.filter(p => p.farol.toLowerCase().includes('atrasado')).length,
    emAndamento: projectsData.filter(p => p.status === 'Em andamento').length,
    pausados: projectsData.filter(p => p.status === 'Pausado').length,
    impedimento: projectsData.filter(p => p.status === 'Impedimento').length,
    concluidos: projectsData.filter(p => p.status === 'Concluído').length,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Barra Lateral */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden lg:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <h1 className="font-bold text-sm tracking-tight leading-tight">Gestão de Portfólio | TradeUp</h1>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2 mt-4">Navegação</p>
          <SidebarItem icon={LayoutDashboard} label="Visão Geral" active={activeTab === 'Visão Geral'} onClick={() => setActiveTab('Visão Geral')} />
          <SidebarItem icon={BarChart3} label="Análises" active={activeTab === 'Análises'} onClick={() => setActiveTab('Análises')} />
        </nav>
        <div className="p-6 border-t border-slate-100">
          <div className="bg-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-indigo-200">
            <div className="relative z-10">
              <h4 className="text-sm font-bold opacity-80 mb-1">Status Geral</h4>
              <p className="text-2xl font-bold mb-4">{projectsData.length} Projetos</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-20 transform rotate-12"><BarChart3 size={120} /></div>
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
                <StatCard label="PROJETOS ATRASADOS" value={stats.atrasados} icon={AlertCircle} color="bg-rose-500" />
                <StatCard label="PROJETOS EM ANDAMENTO" value={stats.emAndamento} icon={Clock} color="bg-blue-500" />
                <StatCard label="PROJETOS PAUSADOS" value={stats.pausados} icon={PauseCircle} color="bg-amber-500" />
                <StatCard label="PROJETOS EM IMPEDIMENTO" value={stats.impedimento} icon={ShieldAlert} color="bg-slate-500" />
                <StatCard label="PROJETOS CONCLUÍDOS" value={stats.concluidos} icon={CheckCircle2} color="bg-emerald-500" />
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
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400">
                        <th className="px-6 py-4 font-bold">Projeto</th>
                        <th className="px-6 py-4 font-bold">Fase</th>
                        <th className="px-6 py-4 font-bold">Status</th>
                        <th className="px-6 py-4 font-bold">Farol</th>
                        <th className="px-6 py-4 font-bold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProjects.map((project) => (
                        <tr key={project.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-900">{project.name}</p>
                            <p className="text-[10px] text-slate-500">{project.code} | {project.initiative}</p>
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
            <AnalyticsModule projectsData={projectsData} />
          )}
        </div>
      </main>

      {/* Modais de Interação */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6 my-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Novo Projeto</h2>
                <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveProject(newProject, false); }} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    <select value={newProject.baseline} onChange={(e) => setNewProject({...newProject, baseline: e.target.value})} className={inputClass}>
                      <option value="A definir">A definir</option>
                      <option value="26/01/2026">26/01/2026</option>
                    </select>
                  </FormField>

                  <FormField label="Data de Entrega">
                    <input placeholder="DD/MM/AAAA" value={newProject.deliveryDate} onChange={(e) => setNewProject({...newProject, deliveryDate: e.target.value})} className={inputClass} />
                  </FormField>

                  <FormField label="Data Replanejada">
                    <input placeholder="DD/MM/AAAA" value={newProject.replannedDate} onChange={(e) => setNewProject({...newProject, replannedDate: e.target.value})} className={inputClass} />
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
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Editar Projeto</h2>
                <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveProject(editingProject, true); }} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    <select value={editingProject.baseline} onChange={(e) => setEditingProject({...editingProject, baseline: e.target.value})} className={inputClass}>
                      <option value="A definir">A definir</option>
                      <option value="26/01/2026">26/01/2026</option>
                    </select>
                  </FormField>

                  <FormField label="Data de Entrega">
                    <input placeholder="DD/MM/AAAA" value={editingProject.deliveryDate} onChange={(e) => setEditingProject({...editingProject, deliveryDate: e.target.value})} className={inputClass} />
                  </FormField>

                  <FormField label="Data Replanejada">
                    <input placeholder="DD/MM/AAAA" value={editingProject.replannedDate} onChange={(e) => setEditingProject({...editingProject, replannedDate: e.target.value})} className={inputClass} />
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

        {isDetailsOpen && selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
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
