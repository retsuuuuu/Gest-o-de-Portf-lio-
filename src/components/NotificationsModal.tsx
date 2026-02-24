import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Check, Clock, AlertCircle, Info } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'success';
  read: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Projeto Atrasado',
    message: 'O projeto "Dashboard de Vendas" ultrapassou a data de entrega prevista.',
    time: '10 min atrás',
    type: 'warning',
    read: false,
  },
  {
    id: '2',
    title: 'Nova Atualização',
    message: 'Jairo Oliveira atualizou o status do projeto "Migração Cloud".',
    time: '1 hora atrás',
    type: 'info',
    read: false,
  },
  {
    id: '3',
    title: 'Projeto Concluído',
    message: 'O projeto "App Mobile" foi marcado como concluído com sucesso.',
    time: '3 horas atrás',
    type: 'success',
    read: true,
  },
];

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden pointer-events-auto mt-16"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">Notificações</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative ${!notification.read ? 'bg-indigo-50/30' : ''}`}
                    >
                      {!notification.read && (
                        <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-600 rounded-full" />
                      )}
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          notification.type === 'warning' ? 'bg-rose-100 text-rose-600' :
                          notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {notification.type === 'warning' ? <AlertCircle size={16} /> :
                           notification.type === 'success' ? <Check size={16} /> :
                           <Info size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 mb-1">{notification.title}</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed mb-2">{notification.message}</p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                            <Clock size={10} />
                            {notification.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-slate-400">Nenhuma notificação no momento.</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <button 
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
              >
                Marcar todas como lidas
              </button>
            </div>
          </motion.div>
          <div 
            className="fixed inset-0 -z-10 pointer-events-auto" 
            onClick={onClose} 
          />
        </div>
      )}
    </AnimatePresence>
  );
};
