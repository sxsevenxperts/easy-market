'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

interface Alert {
  id: number;
  tipo: string;
  urgencia: string;
  titulo: string;
  status: string;
  created_at: string;
}

export default function AlertsPanel({ lojaId }: { lojaId: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await apiClient.get(`/alertas/${lojaId}/criticos`);
        setAlerts(response.data.criticos || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [lojaId]);

  const getUrgencyColor = (urgencia: string) => {
    switch (urgencia) {
      case 'alta':
        return 'bg-red-900 text-red-100';
      case 'média':
        return 'bg-yellow-900 text-yellow-100';
      case 'baixa':
        return 'bg-blue-900 text-blue-100';
      default:
        return 'bg-gray-700 text-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aberto':
        return <AlertCircle size={16} className="text-danger" />;
      case 'em_acao':
        return <Clock size={16} className="text-warning" />;
      case 'resolvido':
        return <CheckCircle size={16} className="text-success" />;
      default:
        return null;
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Alertas Críticos</h3>
        <Link href="/alertas" className="text-xs text-accent hover:underline">
          Ver Todos
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-700 rounded skeleton" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">Nenhum alerta crítico</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-3 rounded-lg bg-gray-700 border border-gray-600 hover:border-gray-500 transition-colors"
            >
              <div className="flex items-start gap-3">
                {getStatusIcon(alert.status)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.titulo}</p>
                  <p className="text-xs text-gray-400 mt-1">{alert.tipo}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getUrgencyColor(
                    alert.urgencia
                  )}`}
                >
                  {alert.urgencia}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
