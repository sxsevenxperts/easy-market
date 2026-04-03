'use client';

import { useEffect, useState, useMemo } from 'react';
import { useStore } from '@/store/dashboard';
import { apiClient } from '@/lib/api';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  TrendingDown,
  Filter,
} from 'lucide-react';

interface Alert {
  id: string;
  tipo: 'desperdicio' | 'falta_estoque' | 'preco_anormal' | 'vencimento_proximo';
  urgencia: 'alta' | 'media' | 'baixa';
  status: 'aberto' | 'em_acao' | 'resolvido';
  descricao: string;
  produto_sku?: string;
  produto_nome?: string;
  valor_roi_estimado?: number;
  data_criacao: string;
  data_resolucao?: string;
}

const alertTypeConfig = {
  desperdicio: {
    label: 'Desperdício',
    color: 'bg-red-100 text-red-800',
    icon: TrendingDown,
  },
  falta_estoque: {
    label: 'Falta de Estoque',
    color: 'bg-orange-100 text-orange-800',
    icon: AlertTriangle,
  },
  preco_anormal: {
    label: 'Preço Anormal',
    color: 'bg-yellow-100 text-yellow-800',
    icon: AlertCircle,
  },
  vencimento_proximo: {
    label: 'Vencimento Próximo',
    color: 'bg-purple-100 text-purple-800',
    icon: Clock,
  },
};

const urgencyConfig = {
  alta: { label: 'Alta', color: 'bg-red-900 text-red-100' },
  media: { label: 'Média', color: 'bg-yellow-900 text-yellow-100' },
  baixa: { label: 'Baixa', color: 'bg-blue-900 text-blue-100' },
};

const statusConfig = {
  aberto: { label: 'Aberto', icon: AlertCircle, color: 'text-red-500' },
  em_acao: { label: 'Em Ação', icon: Clock, color: 'text-yellow-500' },
  resolvido: { label: 'Resolvido', icon: CheckCircle, color: 'text-green-500' },
};

export default function AlertasPage() {
  const { loja_id } = useStore();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [filterUrgencia, setFilterUrgencia] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/alertas/${loja_id}`);
        setAlerts(response.data.alertas || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (loja_id) {
      fetchAlerts();
    }
  }, [loja_id]);

  const filteredAlerts = useMemo(
    () =>
      alerts.filter((alert) => {
        const matchesType = !filterType || alert.tipo === filterType;
        const matchesUrgencia = !filterUrgencia || alert.urgencia === filterUrgencia;
        const matchesStatus = !filterStatus || alert.status === filterStatus;
        return matchesType && matchesUrgencia && matchesStatus;
      }),
    [alerts, filterType, filterUrgencia, filterStatus]
  );

  const alertStats = useMemo(
    () => ({
      total: alerts.length,
      abertos: alerts.filter((a) => a.status === 'aberto').length,
      emAcao: alerts.filter((a) => a.status === 'em_acao').length,
      resolvidos: alerts.filter((a) => a.status === 'resolvido').length,
      totalROI: alerts.reduce((sum, a) => sum + (a.valor_roi_estimado || 0), 0),
    }),
    [alerts]
  );

  const handleStatusChange = async (alertId: string, newStatus: string) => {
    try {
      await apiClient.put(`/alertas/${alertId}`, { status: newStatus });
      setAlerts(
        alerts.map((a) => (a.id === alertId ? { ...a, status: newStatus as any } : a))
      );
      setSelectedAlert(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card skeleton h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Alertas</h1>
        <p className="text-gray-400">Problemas que precisam da sua decisão — comece pelos vermelhos</p>
      </div>

      {/* Atalhos rápidos */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setFilterUrgencia('alta'); setFilterStatus('aberto'); }}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filterUrgencia === 'alta' && filterStatus === 'aberto'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Urgentes agora
        </button>
        <button
          onClick={() => { setFilterType('falta_estoque'); setFilterUrgencia(''); setFilterStatus(''); }}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filterType === 'falta_estoque'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Falta de produto
        </button>
        <button
          onClick={() => { setFilterType('vencimento_proximo'); setFilterUrgencia(''); setFilterStatus(''); }}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filterType === 'vencimento_proximo'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Vencendo em breve
        </button>
        <button
          onClick={() => { setFilterType(''); setFilterUrgencia(''); setFilterStatus(''); }}
          className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
        >
          Ver todos
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-400 mb-2">Total de Alertas</p>
          <p className="text-3xl font-bold">{alertStats.total}</p>
          <p className="text-xs text-gray-500 mt-2">Todos os períodos</p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-400 mb-2">Abertos</p>
          <p className="text-3xl font-bold text-red-400">{alertStats.abertos}</p>
          <p className="text-xs text-red-400 mt-2">Requerem atenção</p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-400 mb-2">Em Ação</p>
          <p className="text-3xl font-bold text-yellow-400">{alertStats.emAcao}</p>
          <p className="text-xs text-yellow-400 mt-2">Sendo processados</p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-400 mb-2">ROI Potencial</p>
          <p className="text-3xl font-bold text-green-400">
            R$ {alertStats.totalROI.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-green-400 mt-2">Se todos resolvidos</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} />
          <h3 className="text-lg font-bold">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
          >
            <option value="">Todos os Tipos</option>
            {Object.entries(alertTypeConfig).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          <select
            value={filterUrgencia}
            onChange={(e) => setFilterUrgencia(e.target.value)}
            className="px-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
          >
            <option value="">Todas as Urgências</option>
            {Object.entries(urgencyConfig).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
          >
            <option value="">Todos os Status</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="card">
        <h3 className="text-lg font-bold mb-6">
          Alertas ({filteredAlerts.length})
        </h3>

        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <AlertCircle size={56} className="mx-auto mb-4 opacity-40" />
            <h4 className="text-lg font-medium mb-2">Nenhum alerta encontrado</h4>
            <p className="text-sm mb-4">
              {alerts.length === 0
                ? 'Sem alertas — sua loja está operando normalmente!'
                : 'Tente ajustar seus filtros para ver mais alertas'}
            </p>
            {alerts.length > 0 && (
              <button
                onClick={() => {
                  setFilterType('');
                  setFilterUrgencia('');
                  setFilterStatus('');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => {
              const TypeIcon = alertTypeConfig[alert.tipo].icon;
              const StatusIcon = statusConfig[alert.status].icon;
              const isExpanded = expandedAlert === alert.id;

              return (
                <div
                  key={alert.id}
                  className="border border-gray-700 rounded-lg p-4 hover:bg-gray-800 transition"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 cursor-pointer" onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}>
                      <TypeIcon className="text-gray-400 mt-1 flex-shrink-0" size={20} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`badge ${alertTypeConfig[alert.tipo].color}`}>
                            {alertTypeConfig[alert.tipo].label}
                          </span>
                          <span className={`badge ${urgencyConfig[alert.urgencia].color}`}>
                            {urgencyConfig[alert.urgencia].label}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <StatusIcon size={14} className={statusConfig[alert.status].color} />
                            {statusConfig[alert.status].label}
                          </span>
                        </div>
                        <p className="text-white font-medium">{alert.descricao}</p>
                        {alert.produto_nome && (
                          <p className="text-sm text-gray-400 mt-1">
                            Produto: <strong>{alert.produto_nome}</strong> ({alert.produto_sku})
                          </p>
                        )}
                      </div>
                    </div>

                    {/* ROI, Date, and Quick Actions */}
                    <div className="flex items-start gap-4 ml-4 flex-shrink-0">
                      <div className="text-right">
                        {alert.valor_roi_estimado && (
                          <p className="text-sm font-bold text-green-400">
                            ROI: R$ {alert.valor_roi_estimado.toLocaleString('pt-BR', {
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(alert.data_criacao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex gap-1">
                        {alert.status === 'aberto' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(alert.id, 'em_acao');
                            }}
                            title="Iniciar Ação"
                            className="p-2 rounded bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-400 transition"
                          >
                            <Clock size={16} />
                          </button>
                        )}
                        {alert.status !== 'resolvido' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(alert.id, 'resolvido');
                            }}
                            title="Marcar como Resolvido"
                            className="p-2 rounded bg-green-900/30 hover:bg-green-900/50 text-green-400 transition"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedAlert(isExpanded ? null : alert.id);
                          }}
                          title={isExpanded ? 'Fechar' : 'Expandir'}
                          className="p-2 rounded bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 transition"
                        >
                          {isExpanded ? '−' : '+'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Criado em</p>
                          <p className="text-white">
                            {new Date(alert.data_criacao).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        {alert.data_resolucao && (
                          <div>
                            <p className="text-gray-400 text-xs mb-1">Resolvido em</p>
                            <p className="text-white">
                              {new Date(alert.data_resolucao).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        )}
                      </div>

                      {alert.status === 'resolvido' && (
                        <div className="text-sm text-green-400 flex items-center gap-2">
                          <CheckCircle size={16} />
                          Alerta resolvido
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="card border-l-4 border-blue-500">
        <h3 className="text-lg font-bold mb-4">Resumo do dia</h3>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <p className="text-gray-300">
              {alertStats.abertos > 0
                ? <>Você tem <strong>{alertStats.abertos} {alertStats.abertos === 1 ? 'alerta aberto' : 'alertas abertos'}</strong> — resolva antes de fechar o turno</>
                : 'Nenhum alerta aberto — dia tranquilo'}
            </p>
          </div>
          <div className="flex gap-3">
            <TrendingDown className="text-yellow-500 flex-shrink-0" size={20} />
            <p className="text-gray-300">
              Resolver tudo hoje pode economizar{' '}
              <strong>
                R${' '}
                {alertStats.totalROI.toLocaleString('pt-BR', {
                  maximumFractionDigits: 0,
                })}
              </strong>
            </p>
          </div>
          {alertStats.emAcao > 0 && (
            <div className="flex gap-3">
              <Clock className="text-blue-500 flex-shrink-0" size={20} />
              <p className="text-gray-300">
                <strong>{alertStats.emAcao} {alertStats.emAcao === 1 ? 'alerta está' : 'alertas estão'} em andamento</strong> — não esqueça de marcar como resolvido
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
