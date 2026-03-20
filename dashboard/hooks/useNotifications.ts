import { useEffect, useCallback, useRef } from 'react';
import { useStore } from '@/store/dashboard';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'alerta_critico' | 'vencimento' | 'falta_estoque' | 'desperdicio' | 'relatório';
  urgencia: 'alta' | 'media' | 'baixa';
  timestamp: string;
}

export function useNotifications() {
  const { loja_id } = useStore();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Conectar ao Server-Sent Events para push notifications
  const connectSSE = useCallback(() => {
    if (!loja_id) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      eventSourceRef.current = new EventSource(
        `/api/v1/notificacoes/${loja_id}/push`
      );

      eventSourceRef.current.onmessage = (event) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          showNotificationToast(notification);
        } catch (err) {
          console.error('Erro ao parsear notificação:', err);
        }
      };

      eventSourceRef.current.onerror = () => {
        console.log('[Notifications] SSE connection error, reconectando...');
        eventSourceRef.current?.close();

        // Tentar reconectar em 5 segundos
        reconnectTimeoutRef.current = setTimeout(() => {
          connectSSE();
        }, 5000);
      };
    } catch (error) {
      console.error('[Notifications] Erro ao conectar SSE:', error);
    }
  }, [loja_id]);

  // Mostrar notificação como toast
  const showNotificationToast = useCallback((notification: Notification) => {
    const icons = {
      alerta_critico: '🚨',
      vencimento: '⏰',
      falta_estoque: '📦',
      desperdicio: '⚠️',
      relatório: '📊',
    };

    const colors = {
      alta: 'bg-red-600',
      media: 'bg-yellow-600',
      baixa: 'bg-blue-600',
    };

    const icon = icons[notification.tipo];
    const bgColor = colors[notification.urgencia];

    toast((t) => (
      <div
        className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg max-w-sm`}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">{icon}</span>
          <div className="flex-1">
            <p className="font-bold text-lg">{notification.titulo}</p>
            <p className="text-sm opacity-90 mt-1">{notification.mensagem}</p>
            <p className="text-xs opacity-75 mt-2">
              {new Date(notification.timestamp).toLocaleTimeString('pt-BR')}
            </p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-xl opacity-75 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      </div>
    ));
  }, []);

  // Buscar notificações recentes ao montar
  const fetchRecentNotifications = useCallback(async () => {
    if (!loja_id) return;

    try {
      const response = await apiClient.get(`/notificacoes/${loja_id}?limite=5`);
      // Não mostrar notificações antigas como toast, apenas novas via SSE
    } catch (error) {
      console.error('Erro ao buscar notificações recentes:', error);
    }
  }, [loja_id]);

  // Efeito para conectar ao SSE e fazer fetch inicial
  useEffect(() => {
    connectSSE();
    fetchRecentNotifications();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectSSE, fetchRecentNotifications]);

  // Enviar notificação (manual)
  const sendNotification = useCallback(
    async (notification: {
      tipo: string;
      titulo: string;
      mensagem: string;
      canais: string[];
      urgencia?: string;
    }) => {
      if (!loja_id) return;

      try {
        const response = await apiClient.post(`/notificacoes`, {
          loja_id,
          ...notification,
        });

        return response.data;
      } catch (error) {
        console.error('Erro ao enviar notificação:', error);
        throw error;
      }
    },
    [loja_id]
  );

  // Marcar como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await apiClient.put(`/notificacoes/${notificationId}/marcar-lida`);
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  }, []);

  return {
    sendNotification,
    markAsRead,
    connectSSE,
  };
}
