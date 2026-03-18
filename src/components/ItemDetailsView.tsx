import React, { useState } from 'react';
import {
  Bell, Settings, Plus, CheckCircle2, Clock,
  Pencil, Save, Calendar, ArrowLeft,
  User, Trash2, Info, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, TeamData } from '../types';

const FormField = React.memo(({ label, children, id }: { label: string, children: React.ReactNode, id?: string }) => (
  <div className="flex flex-col gap-2.5">
    <label htmlFor={id} className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">{label}</label>
    {children}
  </div>
));

const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 font-medium";

export const ItemDetailsView = React.memo(({
  item,
  availableTeam,
  isSaving,
  onBack,
  onEdit,
  onUpdateItem
}: {
  item: Project,
  availableTeam: TeamData,
  isSaving: boolean,
  onBack: () => void,
  onEdit: () => void,
  onUpdateItem: (updates: Partial<Project>) => Promise<void>
}) => {
  const [isAddingResponsible, setIsAddingResponsible] = useState(false);
  const [updatingField, setUpdatingField] = useState<string | null>(null);

  const handleAddResponsible = async (name: string) => {
    setUpdatingField('responsible');
    const current = item.responsible || [];
    if (!current.includes(name)) {
      await onUpdateItem({ responsible: [...current, name] });
    }
    setUpdatingField(null);
    setIsAddingResponsible(false);
  };

  const handleRemoveResponsible = async (name: string) => {
    setUpdatingField('responsible');
    const current = item.responsible || [];
    await onUpdateItem({ responsible: current.filter(r => r !== name) });
    setUpdatingField(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest hover:bg-indigo-50 px-3 py-2 rounded-lg transition-all">
              <ArrowLeft size={16} />
              Voltar ao Projeto
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-2">
              <Info size={20} className="text-indigo-600" />
              <h2 className="font-bold text-slate-900">Detalhes do Item</h2>
            </div>
          </div>
        </div>

        <nav className="flex text-[11px] font-bold uppercase tracking-widest text-slate-400 gap-2 items-center">
          <span>{item.client}</span>
          <span className="text-slate-300">›</span>
          <span>{item.name}</span>
          <span className="text-slate-300">›</span>
          <span className="text-indigo-600">{item.item}</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 sm:p-10 space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest rounded-full">{item.code}</span>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{item.item}</h1>
              </div>
              <button onClick={onEdit} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">
                <Pencil size={16} /> Editar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descrição</p>
                  <p className="text-slate-600 leading-relaxed text-sm bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                    {item.description || "Nenhuma descrição fornecida."}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Observações</p>
                  <p className="text-slate-600 leading-relaxed text-sm bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {item.observation || "Nenhuma observação."}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Início</p>
                    <p className="text-sm font-bold text-slate-900">{item.baseline || '---'}</p>
                  </div>
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Entrega</p>
                    <p className="text-sm font-bold text-indigo-600">{item.deliveryDate || '---'}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Status do Item</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${item.status === 'Concluído' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                    <span className="text-sm font-bold text-slate-700">{item.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Responsáveis</h3>
              <button
                onClick={() => setIsAddingResponsible(true)}
                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                disabled={updatingField === 'responsible'}
              >
                {updatingField === 'responsible' ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <Plus size={16} />}
              </button>
            </div>

            <div className="space-y-3">
              {(item.responsible || []).length > 0 ? (
                (item.responsible || []).map(name => (
                  <div key={name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600 border border-indigo-100">
                        {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-slate-700">{name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveResponsible(name)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Nenhum responsável atrelado.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAddingResponsible && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-6">Atrelar Responsável</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {Object.values(availableTeam).flat().filter(name => !(item.responsible || []).includes(name)).map(name => (
                  <button
                    key={name}
                    onClick={() => handleAddResponsible(name)}
                    className="w-full text-left p-3 hover:bg-indigo-50 rounded-xl text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsAddingResponsible(false)}
                className="w-full mt-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
