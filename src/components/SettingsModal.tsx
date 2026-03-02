import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, User, Bell, Shield, Globe, LogOut, ChevronRight } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const sections = [
    { id: 'profile', label: 'Perfil do Usuário', icon: User, desc: 'Nome, e-mail e foto' },
    { id: 'notifications', label: 'Notificações', icon: Bell, desc: 'Preferências de alerta' },
    { id: 'security', label: 'Segurança', icon: Shield, desc: 'Senha e autenticação' },
    { id: 'language', label: 'Idioma e Região', icon: Globe, desc: 'Português (Brasil)' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                  <Settings size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Configurações</h2>
                  <p className="text-xs text-slate-500">Gerencie sua conta e preferências</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                      <section.icon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{section.label}</p>
                      <p className="text-xs text-slate-500">{section.desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-all" />
                  </button>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button className="w-full flex items-center gap-4 p-4 rounded-2xl text-rose-600 hover:bg-rose-50 transition-all group text-left">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                    <LogOut size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">Sair da Conta</p>
                    <p className="text-xs text-rose-400">Encerrar sessão atual</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
