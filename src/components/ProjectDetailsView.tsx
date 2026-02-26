import React, { useState, useEffect } from 'react';
import {
  Search, Bell, Settings, Plus, CheckCircle2, Clock,
  Pencil, Save, Calendar, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from '../types';

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

const TeamMemberSelector = React.memo(({ label, role, currentMember, onSelect }: { label: string, role: string, currentMember?: string, onSelect: (name: string) => void }) => {
  const [users, setUsers] = useState<{id: string, name: string}[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && users.length === 0) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users?role=${role}`);
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      </div>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 cursor-pointer transition-all"
      >
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-100 shadow-sm">
          {currentMember ? currentMember.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{currentMember || 'Not assigned'}</p>
        </div>
        <Plus size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto"
          >
            {isLoading ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading...</div>
            ) : users.length > 0 ? (
              users.map(u => (
                <div
                  key={u.id}
                  onClick={() => { onSelect(u.name); setIsOpen(false); }}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors"
                >
                  {u.name}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">No {role} users found</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export const ProjectDetailsView = React.memo(({ project, onBack, onEdit, onPartialUpdate }: { project: Project, onBack: () => void, onEdit: () => void, onPartialUpdate: (field: string, value: string) => void }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Breadcrumbs */}
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
              <h2 className="font-bold text-slate-900">Project Details</h2>
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
          <span>Active Projects</span>
          <span className="text-slate-300">›</span>
          <span className="text-indigo-600">{project.initiative}</span>
        </nav>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-10">
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-4">
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest rounded-full">{project.type}</span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active Report
                </div>
              </div>
              <h1 className="text-5xl font-bold text-slate-900 tracking-tight leading-none">{project.name}</h1>
            </div>
            <button onClick={onEdit} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
              <Pencil size={18} /> Edit Project
            </button>
          </div>

          <div className="grid grid-cols-3 border-t border-slate-100 pt-8 mt-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Code</p>
              <p className="text-xl font-bold text-slate-900">{project.code}</p>
            </div>
            <div className="space-y-1 border-x border-slate-100 px-10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Baseline Date</p>
              <p className="text-xl font-bold text-slate-900">{project.baseline || 'Not set'}</p>
            </div>
            <div className="space-y-1 pl-10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Replanning Date</p>
              <p className="text-xl font-bold text-slate-900">{project.replannedDate || 'No replanning'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-10 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Project Description</h3>
              <button onClick={onEdit} className="text-indigo-600 font-bold text-xs uppercase tracking-widest hover:underline">Update</button>
            </div>
            <p className="text-slate-500 leading-relaxed text-base">
              {project.description || project.report || "No description provided for this project yet."}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-6 rounded-2xl flex items-center gap-4 border border-slate-100">
                <div className="p-3 bg-white rounded-xl shadow-sm"><Search size={20} className="text-indigo-600" /></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</p>
                  <p className="text-sm font-bold text-slate-900">{project.location || 'Remote / General'}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl flex items-center gap-4 border border-slate-100">
                <div className="p-3 bg-white rounded-xl shadow-sm"><CheckCircle2 size={20} className="text-indigo-600" /></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Allocated Budget</p>
                  <p className="text-sm font-bold text-slate-900">{project.budget || 'TBD'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-10 space-y-8">
            <h3 className="text-xl font-bold text-slate-900">Current Status Highlights</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Save size={20} /></div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Phase: {project.phase}</p>
                    <p className="text-xs text-slate-500">Current progress in the delivery cycle</p>
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
                    <p className="text-xs text-slate-500">Updated status of daily operations</p>
                  </div>
                </div>
                <StatusBadge status={project.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-6">
            <h3 className="text-base font-bold text-slate-900">Project Team</h3>
            <div className="space-y-6">
               <TeamMemberSelector
                label="Product Owner"
                role="P.O"
                currentMember={project.po}
                onSelect={(name) => onPartialUpdate('PO', name)}
               />
               <TeamMemberSelector
                label="UX Designer"
                role="UX"
                currentMember={project.ux}
                onSelect={(name) => onPartialUpdate('UX', name)}
               />
               <TeamMemberSelector
                label="QA Engineer"
                role="QA"
                currentMember={project.qa}
                onSelect={(name) => onPartialUpdate('QA', name)}
               />
               <TeamMemberSelector
                label="Lead Developer"
                role="TI"
                currentMember={project.ti}
                onSelect={(name) => onPartialUpdate('TI', name)}
               />
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-6">
            <h3 className="text-base font-bold text-slate-900">Resources</h3>
            <div className="space-y-4">
              <a href="#" className="flex items-center gap-3 text-slate-600 hover:text-indigo-600 transition-colors group">
                <Calendar size={18} className="text-slate-400 group-hover:text-indigo-600" />
                <span className="text-sm font-medium">Infrastructure Guidelines</span>
              </a>
              <a href="#" className="flex items-center gap-3 text-slate-600 hover:text-indigo-600 transition-colors group">
                <Save size={18} className="text-slate-400 group-hover:text-indigo-600" />
                <span className="text-sm font-medium">Shared Drive Folder</span>
              </a>
              <a href="#" className="flex items-center gap-3 text-slate-600 hover:text-indigo-600 transition-colors group">
                <Clock size={18} className="text-slate-400 group-hover:text-indigo-600" />
                <span className="text-sm font-medium">Archive Logs</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
