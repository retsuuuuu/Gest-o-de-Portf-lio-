import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { 
  LayoutDashboard, BarChart3, Search, Bell, Settings, Plus,
  AlertCircle, CheckCircle2, Clock, Filter, PauseCircle, ShieldAlert,
  Eye, Pencil, X, Save, Calendar, Trash2, ArrowLeft
} from 'lucide-react';
import { useUser, SignedIn, SignedOut, SignIn, UserButton } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, TeamData } from './types';
import { ALL_PHASES, ALL_STATUS, ALL_FAROL } from './constants';
import { isPastDate } from './utils';

// Lazy load heavy components
const AnalyticsModule = lazy(() => import('./components/AnalyticsModule').then(m => ({ default: m.AnalyticsModule })));
const NotificationsModal = lazy(() => import('./components/NotificationsModal').then(m => ({ default: m.NotificationsModal })));
const SettingsModal = lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));
const ProjectDetailsView = lazy(() => import('./components/ProjectDetailsView').then(m => ({ default: m.ProjectDetailsView })));

const API_URL = "https://script.google.com/macros/s/AKfycbyv5qevsFfNZMQkgPTu2mQyxNRPTyrYrk-rbtx21SZsA_k3Qcbn43e-NspniNjooKh7VQ/exec";

const SidebarItem = React.memo(({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <div onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${active ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}>
    <Icon size={20} />
    <span className="text-sm">{label}</span>
  </div>
));

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
    <div className="space-y-3 relative" ref={containerRef}>
      <label className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-base font-medium flex justify-between items-center cursor-pointer hover:border-indigo-200 transition-all"
      >
        <span className="truncate max-w-[150px]">
          {selected.includes('Todos') ? `Todos (${options.length - 1})` : selected.join(', ')}
        </span>
        <Filter size={16} className="text-slate-400" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl p-4 max-h-64 overflow-y-auto custom-scrollbar"
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

const StatCard = React.memo(({ label, value, icon: Icon, color, onClick }: { label: string, value: string | number, icon: any, color: string, onClick?: () => void }) => (
  <div onClick={onClick} className={`bg-white p-7 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full ${onClick ? 'cursor-pointer hover:border-indigo-200' : ''}`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-xl ${color} shadow-lg shadow-current/10`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
    <div className="flex-1 flex flex-col justify-between">
      <h3 className="text-slate-500 text-[13px] font-bold uppercase tracking-wider mb-2 min-h-[32px] flex items-center leading-tight">{label}</h3>
      <p className="text-5xl font-extrabold text-slate-900 tracking-tight">{value}</p>
    </div>
  </div>
));

const FormField = React.memo(({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <div className="min-h-[24px] flex items-end">
      <label className="text-[13px] font-bold text-slate-600 uppercase tracking-wider leading-none">{label}</label>
    </div>
    {children}
  </div>
));

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

const StatusBadge = React.memo(({ status }: { status: string }) => {
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
});

const FarolIndicator = React.memo(({ farol }: { farol: string }) => {
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
});

export default function App() {
  const { user } = useUser();

  const initUserRole = useCallback(async (userId: string) => {
    try {
      await fetch('/api/init-user-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
    } catch (e) {
      console.error("Erro ao inicializar role do usuário:", e);
    }
  }, []);

  useEffect(() => {
    if (user && !user.publicMetadata?.role) {
      initUserRole(user.id);
    }
  }, [user, initUserRole]);

  const applyProjectRules = useCallback((proj: Partial<Project>) => {
    const next = { ...proj };

    // Regra 1: Data de Entrega preenchida -> Concluído
    if (next.deliveryDate && next.deliveryDate.length === 10) {
      next.status = 'Concluído';
      next.phase = 'Concluído';
      next.farol = 'Concluído';
      return next;
    }

    // Regra 2: Data Base (Baseline) menor que hoje e não concluído -> Atrasado
    if (next.status !== 'Concluído' && next.baseline && next.baseline.length === 10) {
      if (isPastDate(next.baseline)) {
        next.farol = 'Atrasado';
      }
    }

    return next;
  }, []);

  const [view, setView] = useState<'dashboard' | 'detalhes'>('dashboard');
  const [activeTab, setActiveTab] = useState('Visão Geral');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>(['Todos']);
  const [farolFilter, setFarolFilter] = useState<string[]>(['Todos']);
  const [clientFilter, setClientFilter] = useState<string[]>(['Todos']);
  
  const [projectsData, setProjectsData] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('tradeup_projects_cache');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [teamData, setTeamData] = useState<TeamData>(() => {
    try {
      const saved = localStorage.getItem('tradeup_team_cache');
      return saved ? JSON.parse(saved) : { "P.O": [], "UX": [], "QA": [], "TI": [] };
    } catch {
      return { "P.O": [], "UX": [], "QA": [], "TI": [] };
    }
  });

  const [isLoading, setIsLoading] = useState(() => {
    try {
      return !localStorage.getItem('tradeup_projects_cache');
    } catch {
      return true;
    }
  });
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '', initiative: '', client: '', phase: 'Backlog', status: 'Backlog', farol: 'No prazo', baseline: '', report: '', type: 'Estratégico'
  });

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listModalTitle, setListModalTitle] = useState('');
  const [listModalProjects, setListModalProjects] = useState<Project[]>([]);

  const fetchProjects = useCallback(async () => {
    setFetchError(null);
    setIsFetching(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(API_URL, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const projects = Array.isArray(data) ? data : data.projetos || [];
      const team = data.equipeDisponivel || { "P.O": [], "UX": [], "QA": [], "TI": [] };

      const mapped: Project[] = projects.map((row: any, i: number) => ({
        id: String(i),
        type: row['TIPO PROJETO'] || '',
        initiative: row['INICIATIVA'] || '',
        client: row['Cliente'] || row['CLIENTE'] || '',
        code: row['CODIGO PROJETO'] || `C${Math.floor(Math.random() * 90000)}`,
        name: row['PROJETO'] || 'Sem Nome',
        phase: row['FASE'] || 'Backlog',
        status: row['STATUS'] || 'Backlog',
        baseline: formatToDDMMYYYY(row['BASELINE'] || ''),
        report: row['REPORT'] || '',
        farol: row['FAROL'] || 'No prazo',
        deliveryDate: formatToDDMMYYYY(row['ENTREGA'] || ''),
        replannedDate: formatToDDMMYYYY(row['REPLANEJAMENTO'] || ''),
        description: row['DESCRIPTION'] || '',
        po: row['PO'] || row['P.O'] || '',
        ux: row['UX'] || '',
        qa: row['QA'] || '',
        ti: row['TI'] || '',
      }));

      setProjectsData(mapped);
      setTeamData(team);
      localStorage.setItem('tradeup_projects_cache', JSON.stringify(mapped));
      localStorage.setItem('tradeup_team_cache', JSON.stringify(team));
    } catch (error: any) {
      console.error("Erro ao carregar dados", error);
      if (error.name === 'AbortError') {
        setFetchError("A ligação expirou. Por favor, verifique a sua internet.");
      } else {
        setFetchError("Não foi possível carregar os dados. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSaveProject = useCallback(async (projectToSave: Partial<Project>, isEdit: boolean) => {
    setIsSaving(true);
    const code = projectToSave.code || `C${Math.floor(Math.random() * 90000) + 10000}`;
    
    const payload = {
      action: isEdit ? "update" : "create",
      payload: {
        "TIPO PROJETO": projectToSave.type,
        "INICIATIVA": projectToSave.initiative,
        "CLIENTE": projectToSave.client,
        "CODIGO PROJETO": code,
        "PROJETO": projectToSave.name,
        "FASE": projectToSave.phase,
        "STATUS": projectToSave.status,
        "BASELINE": projectToSave.baseline,
        "REPORT": projectToSave.report,
        "FAROL": projectToSave.farol,
        "ENTREGA": projectToSave.deliveryDate,
        "REPLANEJAMENTO": projectToSave.replannedDate,
        "DESCRIPTION": projectToSave.description
      }
    };

    try {
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (isEdit) {
        setProjectsData(prev => prev.map(p => p.id === projectToSave.id ? { ...p, ...projectToSave, code } as Project : p));
        setIsEditOpen(false);
      } else {
        const newProj: Project = { ...projectToSave, code, id: Date.now().toString() } as Project;
        setProjectsData(prev => [...prev, newProj]);
        setIsCreateOpen(false);
        setNewProject({ name: '', initiative: '', client: '', phase: 'Backlog', status: 'Backlog', farol: 'No prazo', baseline: '', report: '', type: 'Estratégico' });
      }
    } catch (error) {
      console.error("Erro crítico de submissão:", error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handlePartialUpdate = useCallback(async (projectCode: string, field: string, value: string) => {
    setIsSaving(true);
    const payload = {
      action: "update",
      payload: {
        "CODIGO PROJETO": projectCode,
        [field]: value
      }
    };

    try {
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      const fieldKey = field.toLowerCase().replace('.', '') as keyof Project;
      setProjectsData(prev => prev.map(p => p.code === projectCode ? { ...p, [fieldKey]: value } : p));
      setSelectedProject(prev => prev?.code === projectCode ? { ...prev, [fieldKey]: value } : prev);
      return true;
    } catch (error) {
      console.error("Erro no update parcial:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleRegisterMember = useCallback(async (name: string, role: string) => {
    setIsSaving(true);
    const payload = {
      action: "addProfessional",
      payload: { "NOME": name, "FUNCAO": role }
    };

    try {
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      setTeamData(prev => {
        const newTeam = { ...prev };
        const roleKey = role as keyof TeamData;
        if (newTeam[roleKey] && !newTeam[roleKey].includes(name)) {
          newTeam[roleKey] = [...newTeam[roleKey], name];
        }
        localStorage.setItem('tradeup_team_cache', JSON.stringify(newTeam));
        return newTeam;
      });
    } catch (error) {
      console.error("Erro ao registrar membro:", error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleDeleteProject = useCallback(async (project: Project) => {
    if (!window.confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?`)) return;

    setIsSaving(true);
    setDeletingProjectId(project.id);
    const payload = {
      action: "delete",
      payload: { "CODIGO PROJETO": project.code }
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
      console.error("Erro ao excluir projeto:", error);
    } finally {
      setIsSaving(false);
      setDeletingProjectId(null);
    }
  }, []);

  const filteredProjects = useMemo(() => projectsData.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.initiative.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  ), [projectsData, searchQuery]);

  const uniqueClients = useMemo(() => {
    const clients = new Set(projectsData.map(p => p.client).filter(Boolean));
    return ['Todos', ...Array.from(clients).sort()];
  }, [projectsData]);

  const filteredData = useMemo(() => {
    return projectsData.filter(p => {
      const matchesSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.initiative.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter.includes('Todos') || statusFilter.includes(p.status);
      const matchesFarol = farolFilter.includes('Todos') || farolFilter.includes(p.farol);
      const matchesClient = clientFilter.includes('Todos') || clientFilter.includes(p.client);

      return matchesSearch && matchesStatus && matchesFarol && matchesClient;
    });
  }, [projectsData, searchQuery, statusFilter, farolFilter, clientFilter]);

  const stats = useMemo(() => {
    if (!filteredData.length) return { atrasados: 0, emAndamento: 0, pausados: 0, impedimento: 0, concluidos: 0 };
    return {
      atrasados: filteredData.filter(p => (p.farol || '').toLowerCase().includes('atrasado')).length,
      emAndamento: filteredData.filter(p => (p.status || '').toLowerCase() === 'em andamento').length,
      pausados: filteredData.filter(p => (p.status || '').toLowerCase() === 'pausado').length,
      impedimento: filteredData.filter(p => (p.status || '').toLowerCase() === 'impedimento').length,
      concluidos: filteredData.filter(p => (p.status || '').toLowerCase() === 'concluído').length,
    };
  }, [filteredData]);

  const handleOpenListModal = useCallback((title: string, projects: Project[]) => {
    setListModalTitle(title);
    setListModalProjects(projects);
    setIsListModalOpen(true);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <div className="space-y-6 max-w-xs">
          {!fetchError ? (
            <div className="space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-500 font-bold tracking-widest text-[10px] uppercase leading-tight">Sincronizando Banco de Dados...</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <AlertCircle size={24} />
              </div>
              <p className="text-slate-900 font-bold">{fetchError}</p>
              <button
                onClick={() => { setIsLoading(true); fetchProjects(); }}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100"
              >
                Tentar novamente
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <SignIn />
        </div>
      </SignedOut>
      <SignedIn>
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
          {/* Barra Lateral */}
          <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden lg:flex">
        <div className="p-4 sm:p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <LayoutDashboard size={24} className="text-white" />
          </div>
          <h1 className="font-bold text-base tracking-tight leading-tight text-slate-900">Portfolio <br/><span className="text-indigo-600">TradeUp</span></h1>
        </div>
        <nav className="flex-1 px-4 space-y-1.5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-3 mt-4">Navegação</p>
          <SidebarItem icon={LayoutDashboard} label="Visão Geral" active={view === 'dashboard' && activeTab === 'Visão Geral'} onClick={() => { setView('dashboard'); setActiveTab('Visão Geral'); }} />
          <SidebarItem icon={BarChart3} label="Análises" active={view === 'dashboard' && activeTab === 'Análises'} onClick={() => { setView('dashboard'); setActiveTab('Análises'); }} />
        </nav>
        <div className="p-6 border-t border-slate-100">
          <div
            onClick={() => handleOpenListModal("Projetos Filtrados", filteredData)}
            className="bg-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-indigo-200 cursor-pointer hover:bg-indigo-700 transition-colors group"
          >
            <div className="relative z-10">
              <h4 className="text-sm font-bold opacity-80 mb-1">Status Geral</h4>
              <p className="text-2xl font-bold mb-4 group-hover:scale-110 transition-transform origin-left">{filteredData.length} Projetos</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-20 transform rotate-12 group-hover:rotate-0 transition-transform duration-500"><BarChart3 size={120} /></div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-bottom border-slate-200 flex items-center justify-between px-4 sm:px-8 z-10">
          <div className="flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Pesquisar projetos..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {(isSaving || isFetching) && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full animate-pulse">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" />
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Sincronizando...</span>
              </div>
            )}
            <button onClick={() => setIsNotificationsOpen(true)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg relative">
              <Bell size={20} /><span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
              <Settings size={20} />
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">
          {view === 'detalhes' && selectedProject ? (
            <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-[400px]"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}>
              <ProjectDetailsView
                project={selectedProject}
                availableTeam={teamData}
                isSaving={isSaving}
                onBack={() => setView('dashboard')}
                onEdit={() => { setEditingProject(selectedProject); setIsEditOpen(true); }}
                onPartialUpdate={(field, value) => handlePartialUpdate(selectedProject.code, field, value)}
                onRegisterMember={handleRegisterMember}
              />
            </Suspense>
          ) : activeTab === 'Visão Geral' ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <motion.div
                    animate={stats.atrasados > 0 ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={`h-full rounded-2xl transition-all ${stats.atrasados > 0 ? 'ring-4 ring-rose-500 ring-offset-4 shadow-[0_0_30px_rgba(244,63,94,0.4)]' : ''}`}
                >
                  <StatCard label="PROJETOS ATRASADOS" value={stats.atrasados} icon={AlertCircle} color="bg-rose-500" onClick={() => handleOpenListModal("Projetos Atrasados", filteredData.filter(p => (p.farol || '').toLowerCase().includes('atrasado')))} />
                </motion.div>
                <StatCard label="PROJETOS EM ANDAMENTO" value={stats.emAndamento} icon={Clock} color="bg-blue-500" onClick={() => handleOpenListModal("Projetos em Andamento", filteredData.filter(p => (p.status || '').toLowerCase() === 'em andamento'))} />
                <StatCard label="PROJETOS PAUSADOS" value={stats.pausados} icon={PauseCircle} color="bg-amber-500" onClick={() => handleOpenListModal("Projetos Pausados", filteredData.filter(p => (p.status || '').toLowerCase() === 'pausado'))} />
                <StatCard label="PROJETOS EM IMPEDIMENTO" value={stats.impedimento} icon={ShieldAlert} color="bg-slate-500" onClick={() => handleOpenListModal("Projetos em Impedimento", filteredData.filter(p => (p.status || '').toLowerCase() === 'impedimento'))} />
                <StatCard label="PROJETOS CONCLUÍDOS" value={stats.concluidos} icon={CheckCircle2} color="bg-emerald-500" onClick={() => handleOpenListModal("Projetos Concluídos", filteredData.filter(p => (p.status || '').toLowerCase() === 'concluído'))} />
              </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <MultiSelect label="Status" options={['Todos', ...ALL_STATUS]} selected={statusFilter} onChange={setStatusFilter} />
                  <MultiSelect label="Farol" options={['Todos', ...ALL_FAROL]} selected={farolFilter} onChange={setFarolFilter} />
                  <MultiSelect label="Cliente" options={uniqueClients} selected={clientFilter} onChange={setClientFilter} />
                </div>

              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                  <div>
                      <h2 className="text-2xl font-bold text-slate-900">Gestão de Projetos</h2>
                      <p className="text-base text-slate-500 font-medium">Acompanhe e gerencie suas iniciativas</p>
                  </div>
                  <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors">
                    <Plus size={16} /> Novo Projeto
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-[13px] uppercase tracking-wider text-slate-500">
                        <th className="px-8 py-6 font-bold">Projeto</th>
                        <th className="px-8 py-6 font-bold">Fase</th>
                        <th className="px-8 py-6 font-bold">Status</th>
                        <th className="px-8 py-6 font-bold">Farol</th>
                        <th className="px-8 py-6 font-bold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredData.map((project) => (
                        <tr key={project.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6 cursor-pointer group" onClick={() => { setSelectedProject(project); setView('detalhes'); }}>
                            <p className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-1">{project.name}</p>
                            <p className="text-[13px] text-slate-500 font-semibold uppercase tracking-wide">{project.code} <span className="mx-2 opacity-30">•</span> {project.client || project.initiative}</p>
                          </td>
                          <td className="px-8 py-6 text-base font-medium text-slate-600">{project.phase}</td>
                          <td className="px-8 py-6"><StatusBadge status={project.status} /></td>
                          <td className="px-8 py-6"><FarolIndicator farol={project.farol} /></td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => { setEditingProject(project); setIsEditOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={16} /></button>
                              <button onClick={() => handleDeleteProject(project)} disabled={deletingProjectId === project.id} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-50">
                                {deletingProjectId === project.id ? <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={16} />}
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
            <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-[400px]"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}>
              <AnalyticsModule projectsData={projectsData} onSegmentClick={handleOpenListModal} />
            </Suspense>
          )}
        </div>
      </main>

      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-4 sm:p-6 my-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Novo Projeto</h2>
                <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full"><X size={24} /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveProject(newProject, false); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField label="Nome do Projeto"><input required placeholder="Nome do Projeto" value={newProject.name} onChange={(e) => setNewProject({...newProject, name: e.target.value})} className={inputClass} /></FormField>
                  </div>
                  <FormField label="Iniciativa"><input required placeholder="Iniciativa" value={newProject.initiative} onChange={(e) => setNewProject({...newProject, initiative: e.target.value})} className={inputClass} /></FormField>
                  <FormField label="Cliente"><input required placeholder="Cliente" value={newProject.client} onChange={(e) => setNewProject({...newProject, client: e.target.value})} className={inputClass} /></FormField>
                  <div className="md:col-span-2">
                    <FormField label="Código do Projeto"><input placeholder="Ex: C00001" value={newProject.code} onChange={(e) => setNewProject({...newProject, code: e.target.value})} className={inputClass} /></FormField>
                  </div>
                  <FormField label="Status">
                    <select value={newProject.status} onChange={(e) => {
                      const status = e.target.value;
                      let phase = newProject.phase;
                      if (status === 'Backlog') phase = 'Backlog';
                      else if (status === 'Concluído') phase = 'Concluído';
                      else if (phase === 'Backlog' || phase === 'Concluído') phase = 'Briefing';
                      setNewProject(applyProjectRules({...newProject, status, phase}));
                    }} className={inputClass}>
                      {ALL_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Fase">
                    <select value={newProject.phase} onChange={(e) => setNewProject({...newProject, phase: e.target.value})} disabled={newProject.status === 'Backlog' || newProject.status === 'Concluído'} className={inputClass}>
                      {ALL_PHASES.filter(f => {
                        if (newProject.status === 'Backlog') return f === 'Backlog';
                        if (newProject.status === 'Concluído') return f === 'Concluído';
                        return f !== 'Backlog' && f !== 'Concluído';
                      }).map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Farol">
                    <select value={newProject.farol} onChange={(e) => setNewProject({...newProject, farol: e.target.value})} className={inputClass}>{ALL_FAROL.map(f => <option key={f} value={f}>{f}</option>)}</select>
                  </FormField>
                  <FormField label="Data Base (Baseline)"><input placeholder="DD/MM/AAAA" value={newProject.baseline} onChange={(e) => setNewProject(applyProjectRules({...newProject, baseline: maskDate(e.target.value)}))} className={inputClass} /></FormField>
                  <FormField label="Data Replanejada"><input placeholder="DD/MM/AAAA" value={newProject.replannedDate} onChange={(e) => setNewProject({...newProject, replannedDate: maskDate(e.target.value)})} className={inputClass} /></FormField>
                  <FormField label="Data de Entrega"><input placeholder="DD/MM/AAAA" value={newProject.deliveryDate} onChange={(e) => setNewProject(applyProjectRules({...newProject, deliveryDate: maskDate(e.target.value)}))} className={inputClass} /></FormField>
                  <div className="md:col-span-2">
                    <FormField label="Descrição do Projeto"><textarea rows={3} placeholder="Descrição detalhada do projeto..." value={newProject.description} onChange={(e) => setNewProject({...newProject, description: e.target.value})} className={`${inputClass} resize-none`} /></FormField>
                  </div>
                  <div className="md:col-span-2">
                    <FormField label="Relatório (Status Resumido)"><textarea rows={2} placeholder="Breve resumo do status..." value={newProject.report} onChange={(e) => setNewProject({...newProject, report: e.target.value})} className={`${inputClass} resize-none`} /></FormField>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsCreateOpen(false)} className="px-6 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-colors">Cancelar</button>
                  <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 min-w-[160px]">
                    {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={18} />}
                    {isSaving ? 'Salvando...' : 'Criar Projeto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isEditOpen && editingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-4 sm:p-6 my-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Editar Projeto</h2>
                <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full"><X size={24} /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveProject(editingProject, true); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField label="Nome do Projeto"><input required value={editingProject.name} onChange={(e) => setEditingProject({...editingProject, name: e.target.value})} className={inputClass} /></FormField>
                  </div>
                  <FormField label="Iniciativa"><input required value={editingProject.initiative} onChange={(e) => setEditingProject({...editingProject, initiative: e.target.value})} className={inputClass} /></FormField>
                  <FormField label="Cliente"><input required value={editingProject.client} onChange={(e) => setEditingProject({...editingProject, client: e.target.value})} className={inputClass} /></FormField>
                  <div className="md:col-span-2">
                    <FormField label="Código do Projeto"><input required value={editingProject.code} onChange={(e) => setEditingProject({...editingProject, code: e.target.value})} className={inputClass} /></FormField>
                  </div>
                  <FormField label="Status">
                    <select value={editingProject.status} onChange={(e) => {
                      const status = e.target.value;
                      let phase = editingProject.phase;
                      if (status === 'Backlog') phase = 'Backlog';
                      else if (status === 'Concluído') phase = 'Concluído';
                      else if (phase === 'Backlog' || phase === 'Concluído') phase = 'Briefing';
                      setEditingProject(applyProjectRules({...editingProject, status, phase}) as Project);
                    }} className={inputClass}>{ALL_STATUS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                  </FormField>
                  <FormField label="Fase">
                    <select value={editingProject.phase} onChange={(e) => setEditingProject({...editingProject, phase: e.target.value})} disabled={editingProject.status === 'Backlog' || editingProject.status === 'Concluído'} className={inputClass}>
                      {ALL_PHASES.filter(f => {
                        if (editingProject.status === 'Backlog') return f === 'Backlog';
                        if (editingProject.status === 'Concluído') return f === 'Concluído';
                        return f !== 'Backlog' && f !== 'Concluído';
                      }).map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Farol">
                    <select value={editingProject.farol} onChange={(e) => setEditingProject({...editingProject, farol: e.target.value})} className={inputClass}>{ALL_FAROL.map(f => <option key={f} value={f}>{f}</option>)}</select>
                  </FormField>
                  <FormField label="Data Base (Baseline)"><input placeholder="DD/MM/AAAA" value={editingProject.baseline} onChange={(e) => setEditingProject(applyProjectRules({...editingProject, baseline: maskDate(e.target.value)}) as Project)} className={inputClass} /></FormField>
                  <FormField label="Data Replanejada"><input placeholder="DD/MM/AAAA" value={editingProject.replannedDate} onChange={(e) => setEditingProject({...editingProject, replannedDate: maskDate(e.target.value)})} className={inputClass} /></FormField>
                  <FormField label="Data de Entrega"><input placeholder="DD/MM/AAAA" value={editingProject.deliveryDate} onChange={(e) => setEditingProject(applyProjectRules({...editingProject, deliveryDate: maskDate(e.target.value)}) as Project)} className={inputClass} /></FormField>
                  <div className="md:col-span-2">
                    <FormField label="Descrição do Projeto"><textarea rows={3} value={editingProject.description} onChange={(e) => setEditingProject({...editingProject, description: e.target.value})} className={`${inputClass} resize-none`} /></FormField>
                  </div>
                  <div className="md:col-span-2">
                    <FormField label="Relatório (Status Resumido)"><textarea rows={2} value={editingProject.report} onChange={(e) => setEditingProject({...editingProject, report: e.target.value})} className={`${inputClass} resize-none`} /></FormField>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsEditOpen(false)} className="px-6 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-colors">Cancelar</button>
                  <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 min-w-[180px]">
                    {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
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
                <button onClick={() => setIsListModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full"><X size={24} /></button>
              </div>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {listModalProjects.length > 0 ? listModalProjects.map((project) => (
                  <div key={project.id} onClick={() => { setSelectedProject(project); setView('detalhes'); setIsListModalOpen(false); }} className="p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all cursor-pointer group">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{project.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{project.code}</p>
                      </div>
                    </div>
                  </div>
                )) : <p className="text-center py-8 text-slate-500 text-sm">Nenhum projeto encontrado nesta categoria.</p>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Suspense fallback={
        (isNotificationsOpen || isSettingsOpen) ? (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-[2px]">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : null
      }>
        <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </Suspense>
        </div>
      </SignedIn>
    </>
  );
}
