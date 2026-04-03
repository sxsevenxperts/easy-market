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
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guardar referência da função para evitar re-criação de closure no onerror
  const connectRef = useRef<() => void>(() => {});

  const showNotificationToast = useCallback((notification: Notification) => {
    const icons: Record<Notification['tipo'], string> = {
      alerta_critico: '🚨',
      vencimento: '⏰',
      falta_estoque: '📦',
      desperdicio: '⚠️',
      relatório: '📊',
    };

    const colors: Record<Notification['urgencia'], string> = {
      alta: 'bg-red-600',
      media: 'bg-yellow-600',
      baixa: 'bg-blue-600',
    };

    toast((t) => (
      <div className={`${colors[notification.urgencia]} text-white px-6 py-4 rounded-lg shadow-lg max-w-sm`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{icons[notification.tipo]}</span>
          <div className="flex-1">
            <p className="font-bold text-lg">{notification.titulo}</p>
            <p className="text-sm opacity-90 mt-1">{notification.mensagem}</p>
            <p className="text-xs opacity-75 mt-2">
              {new Date(notification.timestamp).toLocaleTimeString('pt-BR')}
            </p>
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="text-xl opacity-75 hover:opacity-100">
            ✕
          </button>
        </div>
      </div>
    ));
  }, []);

  const connectSSE = useCallback(() => {
    if (!loja_id) return;

    // Fechar conexão anterior se existir
    eventSourceRef.current?.close();

    // EventSource não suporta headers — token enviado como query param
    // O backend deve aceitar ?token= como alternativa ao header Authorization
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const url = token
      ? `/api/v1/notificacoes/${loja_id}/push?token=${encodeURIComponent(token)}`
      : `/api/v1/notificacoes/${loja_id}/push`;

    try {
      eventSourceRef.current = new EventSource(url);

      eventSourceRef.current.onmessage = (event) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          showNotificationToast(notification);
        } catch (err) {
          console.error('[Notifications] Erro ao parsear notificação:', err);
        }
      };

      eventSourceRef.current.onerror = () => {
        eventSourceRef.current?.close();
        // Usar ref para evitar re-criar closure com loja_id desatualizado
        reconnectTimeoutRef.current = setTimeout(() => {
          connectRef.current();
        }, 5000);
      };
    } catch (error) {
      console.error('[Notifications] Erro ao conectar SSE:', error);
    }
  }, [loja_id, showNotificationToast]);

  // Manter ref sincronizada com a versão mais recente de connectSSE
  useEffect(() => {
    connectRef.current = connectSSE;
  }, [connectSSE]);

  useEffect(() => {
    connectSSE();
    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectSSE]);

  const sendNotification = useCallback(
    async (notification: {
      tipo: string;
      titulo: string;
      mensagem: string;
      canais: string[];
      urgencia?: string;
    }) => {
      if (!loja_id) return;
      const response = await apiClient.post('/notificacoes', { loja_id, ...notification });
      return response.data;
    },
    [loja_id]
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    await apiClient.put(`/notificacoes/${notificationId}/marcar-lida`);
  }, []);

  return { sendNotification, markAsRead, connectSSE };
}
