import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { 
  LayoutDashboard, BarChart3, Search, Bell, Settings, Plus,
  AlertCircle, CheckCircle2, Clock, Filter, PauseCircle, ShieldAlert,
  Eye, Pencil, X, Save, Calendar, Trash2, ArrowLeft,
  Info, Star, Heart, ThumbsUp, ChevronRight
} from 'lucide-react';
import * as Clerk from '@clerk/clerk-react';

const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';

const useUser = BYPASS_AUTH
  ? () => ({ user: { id: 'dev_user', publicMetadata: { role: 'admin' } }, isLoaded: true })
  : Clerk.useUser;

const SignedIn = BYPASS_AUTH ? ({ children }: any) => <>{children}</> : Clerk.SignedIn;
const SignedOut = BYPASS_AUTH ? ({ children }: any) => null : Clerk.SignedOut;
const SignIn = Clerk.SignIn;
const UserButton = BYPASS_AUTH
  ? () => <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-200 shadow-sm">DEV</div>
  : Clerk.UserButton;
import { motion, AnimatePresence } from 'motion/react';
import { Project, TeamData } from './types';
import { ALL_PHASES, ALL_STATUS, ALL_FAROL } from './constants';
import { isPastDate } from './utils';

// Lazy load heavy components
const AnalyticsModule = lazy(() => import('./components/AnalyticsModule').then(m => ({ default: m.AnalyticsModule })));
const NotificationsModal = lazy(() => import('./components/NotificationsModal').then(m => ({ default: m.NotificationsModal })));
const SettingsModal = lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));
const ProjectDetailsView = lazy(() => import('./components/ProjectDetailsView').then(m => ({ default: m.ProjectDetailsView })));

const API_URL = "https://script.google.com/macros/s/AKfycbx1ofHix_y221y3oPdnAVstf2XLOuGaJiAeOPGKGvDh7d9M7JsPtBrXxgakTntJOYAXhg/exec";

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
    <div className="relative group/filter" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-extrabold text-slate-600 cursor-pointer hover:border-indigo-400 hover:text-indigo-600 shadow-sm transition-all"
      >
        <Filter size={11} className="text-slate-500 group-hover/filter:text-indigo-500" />
        <span className="truncate max-w-[80px]">
          {selected.includes('Todos') ? label : selected.join(', ')}
        </span>
        <ChevronRight size={10} className={`text-slate-300 transition-transform ${isOpen ? 'rotate-90 text-indigo-400' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 top-full right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl p-4 min-w-[180px] max-h-64 overflow-y-auto custom-scrollbar"
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

const StatCard = React.memo(({ label, value, icon: Icon, color, onClick, variant = 'light', delayedCount = 0 }: { label: string, value: string | number, icon: any, color: string, onClick?: () => void, variant?: 'light' | 'rose', delayedCount?: number }) => (
  <div
    onClick={onClick}
    className={`p-4 rounded-2xl transition-all flex flex-col h-full relative group
      ${variant === 'rose'
        ? 'bg-rose-50 shadow-sm'
        : 'bg-white border border-slate-100 shadow-sm hover:border-indigo-200'}
      ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${variant === 'rose' ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
          <Icon size={16} />
        </div>
        <h3 className={`${variant === 'rose' ? 'text-rose-800' : 'text-slate-500'} text-[10px] font-black uppercase tracking-wider`}>{label}</h3>
      </div>
    </div>

    <div className="flex items-end justify-between mt-auto">
      <p className={`text-4xl font-semibold ${variant === 'rose' ? 'text-rose-600' : 'text-slate-900'} tracking-tight leading-none`}>{value}</p>
      {delayedCount > 0 && (
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded-md text-[9px] font-black border border-rose-200 animate-pulse">
          <Clock size={10} strokeWidth={3} />
          {delayedCount}
        </div>
      )}
    </div>
  </div>
));

const FormField = React.memo(({ label, children, id }: { label: string, children: React.ReactNode, id?: string }) => (
  <div className="flex flex-col gap-2.5">
    <label htmlFor={id} className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">{label}</label>
    {children}
  </div>
));

const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 font-medium";

const PriorityIcon = React.memo(({ priority }: { priority: string }) => {
  switch (priority) {
    case 'Star': return <Star size={14} className="text-amber-400 fill-amber-400" />;
    case 'Heart': return <Heart size={14} className="text-rose-400 fill-rose-400" />;
    case 'Like': return <ThumbsUp size={14} className="text-blue-400 fill-blue-400" />;
    default: return null;
  }
});

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

const getClientBrandStyles = (client: string, isExpanded: boolean) => {
  const c = client.toUpperCase();

  if (!isExpanded) {
    return {
      banner: 'bg-white border border-slate-100 hover:border-indigo-200 shadow-slate-100',
      text: 'text-slate-900 group-hover:text-indigo-600',
      subtext: 'text-slate-400',
      indicator: 'bg-slate-200 group-hover:bg-indigo-400',
      badge: 'bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600'
    };
  }

  if (c.includes('CLARO')) return {
    banner: 'bg-red-600 shadow-red-200/50',
    text: 'text-white',
    subtext: 'text-red-100',
    indicator: 'bg-white',
    badge: 'bg-white/20 text-white border-white/30'
  };
  if (c.includes('TIM')) return {
    banner: 'bg-blue-950 shadow-blue-200/50',
    text: 'text-white',
    subtext: 'text-blue-300',
    indicator: 'bg-blue-500',
    badge: 'bg-white/10 text-white border-white/20'
  };
  if (c.includes('VAREJO')) return {
    banner: 'bg-yellow-400 shadow-yellow-100',
    text: 'text-yellow-950',
    subtext: 'text-yellow-900/60',
    indicator: 'bg-yellow-700',
    badge: 'bg-yellow-950/10 text-yellow-950 border-yellow-950/20'
  };

  return {
    banner: 'bg-slate-900 shadow-slate-200/50',
    text: 'text-white',
    subtext: 'text-slate-400',
    indicator: 'bg-indigo-500',
    badge: 'bg-indigo-600 text-white border-indigo-500/30'
  };
};

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
  const [activeSubTab, setActiveSubTab] = useState<'Ativos' | 'Backlog'>('Ativos');
  const [rawProjetos, setRawProjetos] = useState<any[]>([]);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
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
    name: '', initiative: '', client: '', phase: 'Backlog', status: 'Backlog', farol: 'No prazo', baseline: '', report: '', type: 'Estratégico', priority: 'Normal'
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
      const hierarchicalProjects = data.projetos || [];
      const team = data.equipeDisponivel || { "P.O": [], "UX": [], "QA": [], "TI": [] };

      setRawProjetos(hierarchicalProjects);

      const flattened: Project[] = [];
      hierarchicalProjects.forEach((p: any) => {
        if (p.itens && Array.isArray(p.itens)) {
          p.itens.forEach((row: any, i: number) => {
            flattened.push({
              id: `${p.projeto}-${i}-${row['Item']}`,
              type: row['TIPO PROJETO'] || '',
              initiative: row['INICIATIVA'] || '',
              client: row['Cliente'] || row['CLIENTE'] || '',
              code: row['CODIGO PROJETO'] || '',
              name: row['PROJETO'] || p.projeto || 'Sem Nome',
              item: row['Item'] || '',
              equipe: row['Equipe'] || '',
              phase: row['FASE'] || 'Backlog',
              status: row['STATUS'] || 'Backlog',
              baseline: formatToDDMMYYYY(row['Data de Início'] || row['DATA DE INÍCIO'] || row['Data de Inicio'] || row['DATA DE INICIO'] || row['BASELINE'] || ''),
              report: row['REPORT'] || '',
              farol: row['FAROL'] || 'No prazo',
              deliveryDate: formatToDDMMYYYY(row['ENTREGA'] || ''),
              replannedDate: formatToDDMMYYYY(row['REPLANEJAMENTO'] || ''),
              description: row['DESCRIPTION'] || '',
              po: row['PO'] || row['P.O'] || '',
              ux: row['UX'] || '',
              qa: row['QA'] || '',
              ti: row['TI'] || '',
            });
          });
        }
      });

      setProjectsData(flattened);
      setTeamData(team);
      localStorage.setItem('tradeup_projects_cache', JSON.stringify(flattened));
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
    const code = projectToSave.code;
    
    const payload = {
      action: isEdit ? "update" : "create",
      payload: {
        "TIPO PROJETO": projectToSave.type,
        "INICIATIVA": projectToSave.initiative,
        "CLIENTE": projectToSave.client,
        "CODIGO PROJETO": code,
        "PROJETO": projectToSave.name,
        "Item": projectToSave.item,
        "Equipe": projectToSave.equipe,
        "FASE": projectToSave.phase,
        "STATUS": projectToSave.status,
        "Data de Início": projectToSave.baseline,
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
        setNewProject({ name: '', initiative: '', client: '', phase: 'Backlog', status: 'Backlog', farol: 'No prazo', baseline: '', report: '', type: 'Estratégico', priority: 'Normal' });
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
    if (!window.confirm(`Tem certeza que deseja excluir o item "${project.item}" do projeto "${project.name}"?`)) return;

    setIsSaving(true);
    setDeletingProjectId(project.id);
    const payload = {
      action: "delete",
      payload: {
        "CODIGO PROJETO": project.code,
        "PROJETO": project.name,
        "Item": project.item
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
        p.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.equipe.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.initiative.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter.includes('Todos') || statusFilter.includes(p.status);
      const matchesFarol = farolFilter.includes('Todos') || farolFilter.includes(p.farol);
      const matchesClient = clientFilter.includes('Todos') || clientFilter.includes(p.client);

      return matchesSearch && matchesStatus && matchesFarol && matchesClient;
    });
  }, [projectsData, searchQuery, statusFilter, farolFilter, clientFilter]);

  const toggleClient = useCallback((client: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(client)) next.delete(client);
      else next.add(client);
      return next;
    });
  }, []);

  const toggleProject = useCallback((projectKey: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectKey)) next.delete(projectKey);
      else next.add(projectKey);
      return next;
    });
  }, []);

  const stats = useMemo(() => {
    // Excluir Backlog das estatísticas para evitar deturpação
    const activeProjects = filteredData.filter(p => (p.status || '').toLowerCase() !== 'backlog');

    if (!activeProjects.length) return { atrasados: 0, emAndamento: 0, pausados: 0, impedimento: 0, concluidos: 0, delayedPerStatus: { emAndamento: 0, pausados: 0, impedimento: 0, concluidos: 0 } };

    const atrasados = activeProjects.filter(p => (p.farol || '').toLowerCase().includes('atrasado'));
    const countDelayedByStatus = (status: string) =>
      atrasados.filter(p => (p.status || '').toLowerCase() === status.toLowerCase()).length;

    return {
      atrasados: atrasados.length,
      emAndamento: activeProjects.filter(p => (p.status || '').toLowerCase() === 'em andamento').length,
      pausados: activeProjects.filter(p => (p.status || '').toLowerCase() === 'pausado').length,
      impedimento: activeProjects.filter(p => (p.status || '').toLowerCase() === 'impedimento').length,
      concluidos: activeProjects.filter(p => (p.status || '').toLowerCase() === 'concluído').length,
      delayedPerStatus: {
        emAndamento: countDelayedByStatus('em andamento'),
        pausados: countDelayedByStatus('pausado'),
        impedimento: countDelayedByStatus('impedimento'),
        concluidos: countDelayedByStatus('concluído')
      }
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

  const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === 'true';

  const MainContent = () => (
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
                    onClick={() => handleOpenListModal("Status Geral do Portfólio", filteredData)}
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
                allProjects={projectsData}
                availableTeam={teamData}
                isSaving={isSaving}
                onBack={() => setView('dashboard')}
                onEdit={() => { setEditingProject(selectedProject); setIsEditOpen(true); }}
                onProjectClick={(p) => setSelectedProject(p)}
                onPartialUpdate={(field, value) => handlePartialUpdate(selectedProject.code, field, value)}
                onRegisterMember={handleRegisterMember}
              />
            </Suspense>
          ) : activeTab === 'Visão Geral' ? (
            <>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 w-fit mb-6">
                <button
                  onClick={() => setActiveSubTab('Ativos')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'Ativos' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                >
                  Projetos em Andamento
                </button>
                <button
                  onClick={() => setActiveSubTab('Backlog')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'Backlog' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                >
                  Backlog
                </button>
              </div>

              <div className="space-y-4">
                <div className="w-full">
                {activeSubTab === 'Ativos' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
                    <motion.div
                        animate={stats.atrasados > 0 ? { scale: [1, 1.02, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="h-full rounded-2xl transition-all"
                    >
                        <StatCard
                          label="ATRASADOS"
                          value={stats.atrasados}
                          icon={AlertCircle}
                          color="text-rose-600"
                          variant="rose"
                          onClick={() => handleOpenListModal("Projetos Atrasados", filteredData.filter(p =>
                            (p.farol || '').toLowerCase().includes('atrasado') &&
                            (p.status || '').toLowerCase() !== 'backlog'
                          ))}
                        />
                    </motion.div>
                    <StatCard label="EM ANDAMENTO" value={stats.emAndamento} delayedCount={stats.delayedPerStatus.emAndamento} icon={Clock} color="text-blue-600" onClick={() => handleOpenListModal("Projetos em Andamento", filteredData.filter(p => (p.status || '').toLowerCase() === 'em andamento'))} />
                    <StatCard label="PAUSADOS" value={stats.pausados} delayedCount={stats.delayedPerStatus.pausados} icon={PauseCircle} color="text-amber-600" onClick={() => handleOpenListModal("Projetos Pausados", filteredData.filter(p => (p.status || '').toLowerCase() === 'pausado'))} />
                    <StatCard label="IMPEDIMENTOS" value={stats.impedimento} delayedCount={stats.delayedPerStatus.impedimento} icon={ShieldAlert} color="text-slate-600" onClick={() => handleOpenListModal("Projetos em Impedimento", filteredData.filter(p => (p.status || '').toLowerCase() === 'impedimento'))} />
                    <StatCard label="CONCLUÍDOS" value={stats.concluidos} delayedCount={stats.delayedPerStatus.concluidos} icon={CheckCircle2} color="text-emerald-600" onClick={() => handleOpenListModal("Projetos Concluídos", filteredData.filter(p => (p.status || '').toLowerCase() === 'concluído'))} />
                  </div>
                  ) : (
                    <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                          <LayoutDashboard size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-1">Backlog do Portfólio</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Iniciativas aguardando priorização</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-2xl font-black text-rose-600 tracking-tighter leading-none">
                            {filteredData.filter(p => (p.status || '').toLowerCase() === 'backlog' && (p.farol || '').toLowerCase().includes('atrasado')).length}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Atrasados</p>
                        </div>
                        <div className="w-px h-8 bg-slate-100" />
                        <div className="text-right">
                          <p className="text-2xl font-black text-indigo-600 tracking-tighter leading-none">
                            {filteredData.filter(p => (p.status || '').toLowerCase() === 'backlog').length}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end items-center gap-4">
                  <MultiSelect label="Status" options={['Todos', ...ALL_STATUS]} selected={statusFilter} onChange={setStatusFilter} />
                  <MultiSelect label="Farol" options={['Todos', ...ALL_FAROL]} selected={farolFilter} onChange={setFarolFilter} />
                  <MultiSelect label="Cliente" options={uniqueClients} selected={clientFilter} onChange={setClientFilter} />
                </div>
              </div>

              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Portfólio de Clientes</h2>
                    <p className="text-sm text-slate-500 font-medium">Visualização organizada por organização e iniciativa</p>
                  </div>
                  <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                    <Plus size={18} /> Novo Projeto
                  </button>
                </div>

                <div className="space-y-8">
                  {Object.entries(
                    filteredData.reduce((acc, p) => {
                      const client = p.client || 'Outros / Interno';
                      const status = (p.status || '').toLowerCase();
                      const isBacklog = status === 'backlog';

                      if ((activeSubTab === 'Backlog' && isBacklog) || (activeSubTab === 'Ativos' && !isBacklog)) {
                        if (!acc[client]) acc[client] = {};
                        if (!acc[client][p.name]) acc[client][p.name] = [];
                        acc[client][p.name].push(p);
                      }
                      return acc;
                    }, {} as Record<string, Record<string, Project[]>>)
                  ).sort(([a], [b]) => a.localeCompare(b)).map(([client, clientProjects]) => {
                    const totalItems = Object.values(clientProjects).flat().length;
                    const isClientExpanded = expandedClients.has(client);
                    const brand = getClientBrandStyles(client, isClientExpanded);
                    return (
                    <div key={client} className="space-y-4 pt-4 first:pt-2">
                      <div
                        onClick={() => toggleClient(client)}
                        className={`flex items-center justify-between px-6 py-4 rounded-[2rem] shadow-lg transition-all cursor-pointer relative overflow-hidden group mx-2 ${brand.banner}`}
                      >
                        <div className="flex items-center gap-5 relative z-10">
                          <div className={`w-1.5 h-10 rounded-full transition-all duration-500 ${brand.indicator} ${isClientExpanded ? 'scale-y-110' : ''}`} />
                          <div>
                            <h3 className={`text-xl font-black tracking-tight uppercase leading-none mb-1 transition-colors ${brand.text}`}>{client}</h3>
                            <p className={`text-[10px] font-bold uppercase tracking-[0.3em] leading-none transition-colors ${brand.subtext}`}>Organização Parceira</p>
                          </div>
                          <div className={`ml-6 px-4 py-1.5 rounded-2xl text-[10px] font-black shadow-lg border transition-all ${brand.badge}`}>
                            {totalItems} ITENS
                          </div>
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                          <ChevronRight className={`transition-transform duration-500 ${isClientExpanded ? 'rotate-90' : ''} ${isClientExpanded || brand.banner.includes('bg-') ? 'text-white' : 'text-slate-300 group-hover:text-indigo-400'}`} size={24} />
                        </div>
                      </div>

                      <AnimatePresence>
                        {isClientExpanded && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-4 px-4">
                            {Object.entries(clientProjects).sort(([a], [b]) => a.localeCompare(b)).map(([projectName, items]) => {
                              const projectKey = `${client}-${projectName}`;
                              const isProjectExpanded = expandedProjects.has(projectKey);
                              return (
                                <div key={projectName} className="space-y-2">
                                  <div
                                    onClick={() => toggleProject(projectKey)}
                                    className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer hover:border-indigo-200 transition-all group"
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-slate-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        <LayoutDashboard size={20} />
                                      </div>
                                      <div>
                                        <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{projectName}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{items.length} Itens atrelados</p>
                                      </div>
                                    </div>
                                    <ChevronRight className={`text-slate-300 transition-transform duration-300 ${isProjectExpanded ? 'rotate-90 text-indigo-600' : ''}`} size={20} />
                                  </div>

                                  <AnimatePresence>
                                    {isProjectExpanded && (
                                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pl-6 space-y-3">
                                        <div className="bg-slate-50/50 rounded-[2rem] p-4 border border-slate-100 shadow-inner">
                                          <div className="hidden md:grid grid-cols-12 gap-2 px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100/50 mb-2">
                                            <div className="col-span-6">Item</div>
                                            <div className="col-span-1 text-center">Fase</div>
                                            <div className="col-span-2 text-center">Status</div>
                                            <div className="col-span-1 text-center">Farol</div>
                                            <div className="col-span-2 text-center">Datas</div>
                                          </div>

                                          {items.map((project: Project) => (
                                            <div
                                              key={project.id}
                                              onClick={() => { setSelectedProject(project); setView('detalhes'); }}
                                              className="bg-white px-8 py-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer group relative overflow-hidden mb-3 last:mb-0"
                                            >
                                              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                                                <div className="md:col-span-6 space-y-3 min-w-0 pr-6">
                                                  <h4 className="text-[14px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug break-words">{project.item}</h4>
                                                  <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-[9px] font-black px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded-md border border-slate-100 uppercase tracking-wider">{project.code}</span>
                                                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider truncate max-w-[100px]">{project.equipe}</span>
                                                      {project.priority && project.priority !== 'Normal' && <PriorityIcon priority={project.priority} />}
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                      <button onClick={(e) => { e.stopPropagation(); setEditingProject(project); setIsEditOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Pencil size={14} /></button>
                                                      <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteProject(project); }}
                                                        disabled={deletingProjectId === project.id}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                      >
                                                        {deletingProjectId === project.id ? <div className="w-3 h-3 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={14} />}
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>

                                                <div className="md:col-span-1 text-center hidden md:flex items-center justify-center">
                                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">{project.phase}</p>
                                                </div>
                                                <div className="md:col-span-2 flex justify-center">
                                                  <p className="md:hidden text-[9px] font-bold text-slate-400 uppercase mb-1">Status</p>
                                                  <StatusBadge status={project.status} />
                                                </div>
                                                <div className="md:col-span-1 flex justify-center">
                                                  <p className="md:hidden text-[9px] font-bold text-slate-400 uppercase mb-1">Farol</p>
                                                  <FarolIndicator farol={project.farol} />
                                                </div>

                                                <div className="md:col-span-2 flex items-center justify-center">
                                                  <div className="flex flex-col items-center">
                                                    <p className="md:hidden text-[9px] font-bold text-slate-400 uppercase mb-1">Datas</p>
                                                    <div className="flex flex-col items-center gap-0.5 text-[10px] font-bold">
                                                      <span className="text-slate-400">{project.baseline || '---'}</span>
                                                      <span className="text-indigo-600/60">{project.deliveryDate || project.replannedDate || '---'}</span>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                              {project.farol.toLowerCase().includes('atrasado') && (
                                                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )})}
                  {filteredData.length === 0 && (
                    <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
                      <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Search size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhum projeto encontrado</h3>
                      <p className="text-slate-500 max-w-xs mx-auto">Tente ajustar seus filtros ou pesquisar por outro termo.</p>
                    </div>
                  )}
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-10 my-8">
              <div className="flex justify-between items-center mb-10 shrink-0">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-1">Novo Registro</h2>
                  <div className="h-1 w-12 bg-indigo-600 rounded-full" />
                </div>
                <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 p-3 hover:bg-slate-50 rounded-2xl transition-all"><X size={24} /></button>
              </div>
              <div className="overflow-y-auto max-h-[65vh] pr-4 -mr-4 custom-scrollbar">
              <form onSubmit={(e) => { e.preventDefault(); handleSaveProject(newProject, false); }} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="md:col-span-2">
                    <FormField label="Projeto Pai" id="create-project-name">
                      <select
                        id="create-project-name"
                        required
                        className={`${inputClass} bg-white shadow-sm border-slate-200 focus:border-indigo-500`}
                        value={newProject.name}
                        onChange={(e) => {
                          const projectName = e.target.value;
                          const found = rawProjetos.find(p => p.projeto === projectName);
                          setNewProject({
                            ...newProject,
                            name: projectName,
                            item: '', // Reset item selection
                            client: found?.itens?.[0]?.['Cliente'] || '',
                            initiative: found?.itens?.[0]?.['INICIATIVA'] || '',
                          });
                        }}
                      >
                        <option value="">Selecione um projeto...</option>
                        {rawProjetos.map(p => <option key={p.projeto} value={p.projeto}>{p.projeto}</option>)}
                      </select>
                    </FormField>
                  </div>

                  <div className="md:col-span-2">
                    <FormField label="Item / Entregável" id="create-project-item">
                      <select
                        id="create-project-item"
                        required
                        disabled={!newProject.name}
                        className={`${inputClass} bg-white shadow-sm border-slate-200 focus:border-indigo-500 disabled:bg-slate-50`}
                        value={newProject.item}
                        onChange={(e) => {
                          const itemStr = e.target.value;
                          const parent = rawProjetos.find(p => p.projeto === newProject.name);
                          const itemData = parent?.itens?.find((i: any) => i.Item === itemStr);
                          if (itemData) {
                            setNewProject({
                              ...newProject,
                              item: itemStr,
                              code: itemData['CODIGO PROJETO'] || '',
                              initiative: itemData['INICIATIVA'] || '',
                              client: itemData['Cliente'] || '',
                              equipe: itemData['Equipe'] || '',
                              status: itemData['STATUS'] || 'Backlog',
                              phase: itemData['FASE'] || 'Backlog',
                              farol: itemData['FAROL'] || 'No prazo',
                              baseline: formatToDDMMYYYY(itemData['Data de Início'] || itemData['DATA DE INÍCIO'] || itemData['Data de Inicio'] || itemData['DATA DE INICIO'] || itemData['BASELINE'] || ''),
                              deliveryDate: formatToDDMMYYYY(itemData['ENTREGA'] || ''),
                            });
                          }
                        }}
                      >
                        <option value="">Selecione um item...</option>
                        {rawProjetos.find(p => p.projeto === newProject.name)?.itens?.map((i: any) => (
                          <option key={i.Item} value={i.Item}>{i.Item}</option>
                        ))}
                      </select>
                    </FormField>
                  </div>
                  <FormField label="Código do Projeto" id="create-project-code"><input id="create-project-code" disabled value={newProject.code} className={`${inputClass} opacity-50 bg-slate-100`} /></FormField>
                  <FormField label="Equipe" id="create-project-team"><input id="create-project-team" disabled value={newProject.equipe} className={`${inputClass} opacity-50 bg-slate-100`} /></FormField>
                  <FormField label="Iniciativa" id="create-project-initiative"><input id="create-project-initiative" required placeholder="Iniciativa" value={newProject.initiative} onChange={(e) => setNewProject({...newProject, initiative: e.target.value})} className={inputClass} /></FormField>
                  <FormField label="Cliente" id="create-project-client"><input id="create-project-client" required placeholder="Cliente" value={newProject.client} onChange={(e) => setNewProject({...newProject, client: e.target.value})} className={inputClass} /></FormField>
                  <FormField label="Tipo de Projeto" id="create-project-type">
                    <select id="create-project-type" value={newProject.type} onChange={(e) => setNewProject({...newProject, type: e.target.value})} className={inputClass}>
                      <option value="Estratégico">Estratégico</option>
                      <option value="Tático">Tático</option>
                      <option value="Operacional">Operacional</option>
                    </select>
                  </FormField>
                  <FormField label="Prioridade" id="create-project-priority">
                    <select id="create-project-priority" value={newProject.priority} onChange={(e) => setNewProject({...newProject, priority: e.target.value as any})} className={inputClass}>
                      <option value="Normal">Normal</option>
                      <option value="Star">Star (Alta)</option>
                      <option value="Heart">Heart (Média)</option>
                      <option value="Like">Like (Baixa)</option>
                    </select>
                  </FormField>
                  <FormField label="Status" id="create-project-status">
                    <select id="create-project-status" value={newProject.status} onChange={(e) => {
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
                  <FormField label="Fase" id="create-project-phase">
                    <select id="create-project-phase" value={newProject.phase} onChange={(e) => setNewProject({...newProject, phase: e.target.value})} disabled={newProject.status === 'Backlog' || newProject.status === 'Concluído'} className={inputClass}>
                      {ALL_PHASES.filter(f => {
                        if (newProject.status === 'Backlog') return f === 'Backlog';
                        if (newProject.status === 'Concluído') return f === 'Concluído';
                        return f !== 'Backlog' && f !== 'Concluído';
                      }).map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Farol" id="create-project-farol">
                    <select id="create-project-farol" value={newProject.farol} onChange={(e) => setNewProject({...newProject, farol: e.target.value})} className={inputClass}>{ALL_FAROL.map(f => <option key={f} value={f}>{f}</option>)}</select>
                  </FormField>
                  <FormField label="Data Replanejada" id="create-project-replanned"><input id="create-project-replanned" placeholder="DD/MM/AAAA" value={newProject.replannedDate} onChange={(e) => setNewProject({...newProject, replannedDate: maskDate(e.target.value)})} className={inputClass} /></FormField>
                  <div className="grid grid-cols-2 gap-x-8 md:col-span-2">
                    <FormField label="Data de Início" id="create-project-start"><input id="create-project-start" placeholder="DD/MM/AAAA" value={newProject.baseline} onChange={(e) => setNewProject(applyProjectRules({...newProject, baseline: maskDate(e.target.value)}))} className={inputClass} /></FormField>
                    <FormField label="Data de Entrega" id="create-project-delivery"><input id="create-project-delivery" placeholder="DD/MM/AAAA" value={newProject.deliveryDate} onChange={(e) => setNewProject(applyProjectRules({...newProject, deliveryDate: maskDate(e.target.value)}))} className={inputClass} /></FormField>
                  </div>
                  <div className="md:col-span-2">
                    <FormField label="Descrição do Projeto" id="create-project-desc"><textarea id="create-project-desc" rows={4} placeholder="Descrição detalhada do projeto..." value={newProject.description} onChange={(e) => setNewProject({...newProject, description: e.target.value})} className={`${inputClass} resize-none`} /></FormField>
                  </div>
                  <div className="md:col-span-2">
                    <FormField label="Relatório (Status Resumido)" id="create-project-report"><textarea id="create-project-report" rows={3} placeholder="Breve resumo do status..." value={newProject.report} onChange={(e) => setNewProject({...newProject, report: e.target.value})} className={`${inputClass} resize-none`} /></FormField>
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-4 pb-4">
                  <button type="button" onClick={() => setIsCreateOpen(false)} className="px-6 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-colors">Cancelar</button>
                  <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 min-w-[160px]">
                    {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={18} />}
                    {isSaving ? 'Salvando...' : 'Criar Projeto'}
                  </button>
                </div>
              </form>
              </div>
            </motion.div>
          </div>
        )}

        {isEditOpen && editingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-10 my-8">
              <div className="flex justify-between items-center mb-10 shrink-0">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-1">Editar Registro</h2>
                  <div className="h-1 w-12 bg-indigo-600 rounded-full" />
                </div>
                <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600 p-3 hover:bg-slate-50 rounded-2xl transition-all"><X size={24} /></button>
              </div>
              <div className="overflow-y-auto max-h-[65vh] pr-4 -mr-4 custom-scrollbar">
              <form onSubmit={(e) => { e.preventDefault(); handleSaveProject(editingProject, true); }} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="md:col-span-2">
                    <FormField label="Projeto Pai" id="edit-project-name"><input id="edit-project-name" disabled value={editingProject.name} className={`${inputClass} opacity-50 bg-slate-100`} /></FormField>
                  </div>
                  <div className="md:col-span-2">
                    <FormField label="Item / Entregável" id="edit-project-item"><input id="edit-project-item" disabled value={editingProject.item} className={`${inputClass} opacity-50 bg-slate-100`} /></FormField>
                  </div>
                  <FormField label="Código do Projeto" id="edit-project-code"><input id="edit-project-code" required value={editingProject.code} onChange={(e) => setEditingProject({...editingProject, code: e.target.value})} className={inputClass} /></FormField>
                  <FormField label="Equipe" id="edit-project-team"><input id="edit-project-team" value={editingProject.equipe} onChange={(e) => setEditingProject({...editingProject, equipe: e.target.value})} className={inputClass} /></FormField>
                  <FormField label="Iniciativa" id="edit-project-initiative"><input id="edit-project-initiative" required value={editingProject.initiative} onChange={(e) => setEditingProject({...editingProject, initiative: e.target.value})} className={inputClass} /></FormField>
                  <FormField label="Cliente" id="edit-project-client"><input id="edit-project-client" required value={editingProject.client} onChange={(e) => setEditingProject({...editingProject, client: e.target.value})} className={inputClass} /></FormField>
                  <FormField label="Tipo de Projeto" id="edit-project-type">
                    <select id="edit-project-type" value={editingProject.type} onChange={(e) => setEditingProject({...editingProject, type: e.target.value})} className={inputClass}>
                      <option value="Estratégico">Estratégico</option>
                      <option value="Tático">Tático</option>
                      <option value="Operacional">Operacional</option>
                    </select>
                  </FormField>
                  <FormField label="Prioridade" id="edit-project-priority">
                    <select id="edit-project-priority" value={editingProject.priority} onChange={(e) => setEditingProject({...editingProject, priority: e.target.value as any})} className={inputClass}>
                      <option value="Normal">Normal</option>
                      <option value="Star">Star (Alta)</option>
                      <option value="Heart">Heart (Média)</option>
                      <option value="Like">Like (Baixa)</option>
                    </select>
                  </FormField>
                  <FormField label="Status" id="edit-project-status">
                    <select id="edit-project-status" value={editingProject.status} onChange={(e) => {
                      const status = e.target.value;
                      let phase = editingProject.phase;
                      if (status === 'Backlog') phase = 'Backlog';
                      else if (status === 'Concluído') phase = 'Concluído';
                      else if (phase === 'Backlog' || phase === 'Concluído') phase = 'Briefing';
                      setEditingProject(applyProjectRules({...editingProject, status, phase}) as Project);
                    }} className={inputClass}>{ALL_STATUS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                  </FormField>
                  <FormField label="Fase" id="edit-project-phase">
                    <select id="edit-project-phase" value={editingProject.phase} onChange={(e) => setEditingProject({...editingProject, phase: e.target.value})} disabled={editingProject.status === 'Backlog' || editingProject.status === 'Concluído'} className={inputClass}>
                      {ALL_PHASES.filter(f => {
                        if (editingProject.status === 'Backlog') return f === 'Backlog';
                        if (editingProject.status === 'Concluído') return f === 'Concluído';
                        return f !== 'Backlog' && f !== 'Concluído';
                      }).map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Farol" id="edit-project-farol">
                    <select id="edit-project-farol" value={editingProject.farol} onChange={(e) => setEditingProject({...editingProject, farol: e.target.value})} className={inputClass}>{ALL_FAROL.map(f => <option key={f} value={f}>{f}</option>)}</select>
                  </FormField>
                  <FormField label="Data Replanejada" id="edit-project-replanned"><input id="edit-project-replanned" placeholder="DD/MM/AAAA" value={editingProject.replannedDate} onChange={(e) => setEditingProject({...editingProject, replannedDate: maskDate(e.target.value)})} className={inputClass} /></FormField>
                  <div className="grid grid-cols-2 gap-x-8 md:col-span-2">
                    <FormField label="Data de Início" id="edit-project-start"><input id="edit-project-start" placeholder="DD/MM/AAAA" value={editingProject.baseline} onChange={(e) => setEditingProject(applyProjectRules({...editingProject, baseline: maskDate(e.target.value)}) as Project)} className={inputClass} /></FormField>
                    <FormField label="Data de Entrega" id="edit-project-delivery"><input id="edit-project-delivery" placeholder="DD/MM/AAAA" value={editingProject.deliveryDate} onChange={(e) => setEditingProject(applyProjectRules({...editingProject, deliveryDate: maskDate(e.target.value)}) as Project)} className={inputClass} /></FormField>
                  </div>
                  <div className="md:col-span-2">
                    <FormField label="Descrição do Projeto" id="edit-project-desc"><textarea id="edit-project-desc" rows={4} value={editingProject.description} onChange={(e) => setEditingProject({...editingProject, description: e.target.value})} className={`${inputClass} resize-none`} /></FormField>
                  </div>
                  <div className="md:col-span-2">
                    <FormField label="Relatório (Status Resumido)" id="edit-project-report"><textarea id="edit-project-report" rows={3} value={editingProject.report} onChange={(e) => setEditingProject({...editingProject, report: e.target.value})} className={`${inputClass} resize-none`} /></FormField>
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-4 pb-4">
                  <button type="button" onClick={() => setIsEditOpen(false)} className="px-6 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-colors">Cancelar</button>
                  <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 min-w-[180px]">
                    {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
              </div>
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
                        <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{project.item}</p>
                        <p className="text-xs text-slate-400 font-medium">{project.name} • {project.code}</p>
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
  );

  return (
    <>
      {bypassAuth ? (
        <MainContent />
      ) : (
        <>
          <SignedOut>
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
              <SignIn />
            </div>
          </SignedOut>
          <SignedIn>
            <MainContent />
          </SignedIn>
        </>
      )}
    </>
  );
}
