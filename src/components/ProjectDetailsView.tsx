import React, { useState, useEffect } from 'react';
import {
  Bell, Settings, Plus, CheckCircle2, Clock,
  Pencil, Save, Calendar, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, TeamData } from '../types';

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
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStyles()}`}>{status || 'N/D'}</span>;
});

const TeamMemberSelector = React.memo(({ label, role, currentMember, onSelect, availableMembers = [] }: { label: string, role: string, currentMember?: string, onSelect: (name: string) => Promise<any>, availableMembers?: string[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSelect = async (name: string) => {
    if (name === currentMember) {
      setIsOpen(false);
      return;
    }
    setIsUpdating(true);
    try {
      await onSelect(name);
    } finally {
      setIsUpdating(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      </div>
      <div
        onClick={() => !isUpdating && setIsOpen(!isOpen)}
        className={`flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 transition-all ${isUpdating ? 'opacity-70 cursor-wait' : 'hover:border-indigo-200 cursor-pointer'}`}
      >
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-100 shadow-sm relative overflow-hidden">
          {isUpdating ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            currentMember ? currentMember.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">
            {isUpdating ? 'Atualizando...' : (currentMember || 'Não atribuído')}
          </p>
        </div>
        {!isUpdating && <Plus size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-45' : ''}`} />}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto custom-scrollbar"
          >
            {availableMembers.length > 0 ? (
              availableMembers.map(name => (
                <div
                  key={name}
                  onClick={() => handleSelect(name)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors"
                >
                  {name}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">Nenhum profissional ({role}) encontrado</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export const ProjectDetailsView = React.memo(({ project, availableTeam, isSaving, onBack, onEdit, onPartialUpdate, onRegisterMember }: { project: Project, availableTeam: TeamData, isSaving: boolean, onBack: () => void, onEdit: () => void, onPartialUpdate: (field: string, value: string) => Promise<any>, onRegisterMember: (name: string, role: string) => void }) => {
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('UX');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemberName.trim()) {
      onRegisterMember(newMemberName, newMemberRole);
      setNewMemberName('');
      setIsAddingMember(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest hover:bg-indigo-50 px-3 py-2 rounded-lg transition-all">
              <ArrowLeft size={16} />
              Dashboard
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} className="text-indigo-600" />
              <h2 className="font-bold text-slate-900">Detalhes do Projeto</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><Bell size={20}/></button>
            <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><Settings size={20}/></button>
          </div>
        </div>

        <nav className="flex text-[11px] font-bold uppercase tracking-widest text-slate-400 gap-2 items-center">
          <span>Workspace</span>
          <span className="text-slate-300">›</span>
          <span>Projetos Ativos</span>
          <span className="text-slate-300">›</span>
          <span className="text-indigo-600">{project.initiative}</span>
        </nav>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-10">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-0 mb-8">
            <div className="space-y-4">
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest rounded-full">{project.type}</span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Relatório Ativo
                </div>
              </div>
              <h1 className="text-2xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight sm:leading-none">{project.name}</h1>
            </div>
            <button onClick={onEdit} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
              <Pencil size={18} /> Editar Projeto
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 border-t border-slate-100 pt-8 mt-4 gap-6 md:gap-0">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Código</p>
              <p className="text-xl font-bold text-slate-900">{project.code}</p>
            </div>
            <div className="space-y-1 md:border-x md:border-slate-100 md:px-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</p>
              <p className="text-xl font-bold text-slate-900 truncate" title={project.client}>{project.client || 'N/A'}</p>
            </div>
            <div className="space-y-1 md:border-x md:border-slate-100 md:px-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Baseline</p>
              <p className="text-xl font-bold text-slate-900">{project.baseline || '---'}</p>
            </div>
            <div className="space-y-1 md:border-x md:border-slate-100 md:px-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Replan.</p>
              <p className="text-xl font-bold text-slate-900">{project.replannedDate || '---'}</p>
            </div>
            <div className="space-y-1 md:pl-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entrega</p>
              <p className="text-xl font-bold text-slate-900">{project.deliveryDate || '---'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-5 sm:p-10 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Descrição do Projeto</h3>
              <button onClick={onEdit} className="text-indigo-600 font-bold text-xs uppercase tracking-widest hover:underline">Atualizar</button>
            </div>
            <p className="text-slate-500 leading-relaxed text-base">
              {project.description || "Nenhuma descrição fornecida para este projeto ainda."}
            </p>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-5 sm:p-10 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Status Report</h3>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Clock size={20} />
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <p className="text-slate-700 leading-relaxed text-base whitespace-pre-wrap">
                {project.report || "Nenhum relatório de status disponível no momento."}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-10 space-y-8">
            <h3 className="text-xl font-bold text-slate-900">Destaques do Status Atual</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Save size={20} /></div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Fase: {project.phase}</p>
                    <p className="text-xs text-slate-500">Progresso atual no ciclo de entrega</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: project.status === 'Concluído' ? '100%' : '65%' }} />
                   </div>
                   <CheckCircle2 size={20} className={project.status === 'Concluído' ? "text-emerald-500" : "text-slate-300"} />
                </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Clock size={20} /></div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Status: {project.status}</p>
                    <p className="text-xs text-slate-500">Status atualizado das operações diárias</p>
                  </div>
                </div>
                <StatusBadge status={project.status} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Equipe do Projeto</h3>
              <button
                onClick={() => setIsAddingMember(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-100 transition-colors"
              >
                <Plus size={12} />
                Adicionar novo
              </button>
            </div>
            <div className="space-y-6">
               <TeamMemberSelector
                label="Product Owner"
                role="P.O"
                currentMember={project.po}
                availableMembers={availableTeam["P.O"]}
                onSelect={(name) => onPartialUpdate('PO', name)}
               />
               <TeamMemberSelector
                label="UX Designer"
                role="UX"
                currentMember={project.ux}
                availableMembers={availableTeam["UX"]}
                onSelect={(name) => onPartialUpdate('UX', name)}
               />
               <TeamMemberSelector
                label="QA Engineer"
                role="QA"
                currentMember={project.qa}
                availableMembers={availableTeam["QA"]}
                onSelect={(name) => onPartialUpdate('QA', name)}
               />
               <TeamMemberSelector
                label="Lead Developer"
                role="TI"
                currentMember={project.ti}
                availableMembers={availableTeam["TI"]}
                onSelect={(name) => onPartialUpdate('TI', name)}
               />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAddingMember && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Registrar profissional</h2>
                <button onClick={() => setIsAddingMember(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full">
                  <ArrowLeft size={20} className="rotate-90" />
                </button>
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome Completo</label>
                  <input
                    autoFocus
                    required
                    placeholder="Ex: João Silva"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Função / Cargo</label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  >
                    <option value="P.O">Product Owner (P.O)</option>
                    <option value="UX">UX Designer</option>
                    <option value="QA">QA Engineer</option>
                    <option value="TI">Lead Developer (TI)</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddingMember(false)}
                    className="flex-1 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {isSaving ? 'Registrando...' : 'Registrar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
