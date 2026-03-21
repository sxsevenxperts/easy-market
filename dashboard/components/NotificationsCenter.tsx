'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/dashboard';
import { apiClient } from '@/lib/api';
import { Bell, X, Check } from 'lucide-react';

interface Notification {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'alerta_critico' | 'vencimento' | 'falta_estoque' | 'desperdicio' | 'relatório';
  urgencia: 'alta' | 'media' | 'baixa';
  status: 'criada' | 'lida' | 'deletada';
  data_criacao: string;
  data_leitura?: string;
}

export default function NotificationsCenter() {
  const { loja_id } = useStore();
  const markAsRead = async (id: string) => {
    await apiClient.put(`/notificacoes/${id}/marcar-lida`).catch(console.error);
  };
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  // Carregar notificações
  const fetchNotifications = async () => {
    if (!loja_id) return;

    try {
      setLoading(true);
      const response = await apiClient.get(`/notificacoes/${loja_id}?limite=20`);
      setNotifications(response.data.notificacoes);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Recarregar a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [loja_id]);

  const unreadCount = notifications.filter((n) => n.status !== 'lida').length;

  const getUrgencyColor = (urgencia: string) => {
    switch (urgencia) {
      case 'alta':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'media':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'baixa':
        return 'border-l-4 border-blue-500 bg-blue-50';
      default:
        return 'border-l-4 border-gray-500 bg-gray-50';
    }
  };

  const getTypeIcon = (tipo: string) => {
    const icons = {
      alerta_critico: '🚨',
      vencimento: '⏰',
      falta_estoque: '📦',
      desperdicio: '⚠️',
      relatório: '📊',
    };
    return icons[tipo as keyof typeof icons] || '📢';
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, status: 'lida' } : n))
    );
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await apiClient.delete(`/notificacoes/${notificationId}`);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  return (
    <>
      {/* Notification Bell in Header */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 hover:bg-gray-700 rounded-lg transition"
        title="Notificações"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div className="absolute right-0 top-16 w-96 bg-white shadow-2xl rounded-lg z-50 max-h-96 flex flex-col">
          {/* Header */}
          <div className="bg-gray-100 px-6 py-4 border-b flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Notificações ({unreadCount})</h3>
            <button
              onClick={() => setShowPanel(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                Carregando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                Nenhuma notificação
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition ${getUrgencyColor(notification.urgencia)}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getTypeIcon(notification.tipo)}</span>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-gray-900 text-sm">
                              {notification.titulo}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {notification.mensagem}
                            </p>
                          </div>

                          {notification.status !== 'lida' && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="flex-shrink-0 text-blue-500 hover:text-blue-700"
                              title="Marcar como lida"
                            >
                              <Check size={16} />
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.data_criacao).toLocaleString('pt-BR')}
                        </p>

                        {notification.status === 'lida' && notification.data_leitura && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Lida em {new Date(notification.data_leitura).toLocaleTimeString('pt-BR')}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-red-600 transition"
                        title="Deletar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="bg-gray-50 px-6 py-3 border-t">
              <a
                href="/alertas"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Ver todos os alertas →
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );
}
