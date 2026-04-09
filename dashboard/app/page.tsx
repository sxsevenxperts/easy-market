'use client';

import { useEffect, useState } from 'react';
import { Activity, Package, TrendingUp, Target, UserPlus, LogOut, WifiOff } from 'lucide-react';
import DashboardCard from '@/components/DashboardCard';
import SalesChart from '@/components/charts/SalesChart';
import AlertsPanel from '@/components/AlertsPanel';
import InventoryStatus from '@/components/InventoryStatus';
import PredictionChart from '@/components/charts/PredictionChart';
import TurnoDashboard from '@/components/TurnoDashboard';
import { useStore } from '@/store/dashboard';
import { apiClient } from '@/lib/api';

// Dados de demonstração exibidos enquanto os PDVs e balanças não estão conectados
const DEMO_DATA: DashboardData = {
  resumo: {
    faturamento: 48320.5,
    transacoes: 312,
    itens_vendidos: 1874,
    categorias: [
      { nome: 'Alimentos', faturamento: 18500 },
      { nome: 'Bebidas', faturamento: 12400 },
      { nome: 'Higiene', faturamento: 8200 },
      { nome: 'Limpeza', faturamento: 5600 },
      { nome: 'Perecíveis', faturamento: 3620.5 },
    ],
  },
  fidelidade: {
    total_clientes: 1240,
    taxa_fidelidade_media_percentual: 68.4,
    clientes_ativos: 847,
    ltv_medio: 320.5,
  },
  movimento_clientes: {
    taxa_novos_percentual: 12.3,
    novos_clientes: 38,
    taxa_churn_percentual: 4.1,
    churn_clientes: 13,
  },
};

interface DashboardData {
  resumo: {
    faturamento: number;
    transacoes: number;
    itens_vendidos: number;
    categorias?: Array<{ nome: string; faturamento: number }>;
  };
  fidelidade: {
    total_clientes: number;
    taxa_fidelidade_media_percentual: number;
    clientes_ativos: number;
    ltv_medio: number;
  };
  movimento_clientes: {
    taxa_novos_percentual: number;
    novos_clientes: number;
    taxa_churn_percentual: number;
    churn_clientes: number;
  };
}

export default function DashboardHome() {
  const { loja_id } = useStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/dashboard/${loja_id}`);
      setData(response.data);
      setIsDemo(false);
    } catch {
      // PDVs/balanças não conectados — exibir dados de demonstração
      setData(DEMO_DATA);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loja_id) {
      fetchDashboardData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loja_id]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card skeleton h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card skeleton h-64" />
          <div className="card skeleton h-64" />
        </div>
      </div>
    );
  }

  const resumo = data?.resumo || {};
  const fidelidade = data?.fidelidade || {};
  const movimento = data?.movimento_clientes || {};

  return (
    <div className="p-6 space-y-6">
      {/* Banner modo demonstração */}
      {isDemo && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-900/30 border border-blue-700/50 rounded-lg text-blue-300 text-sm">
          <WifiOff size={16} className="flex-shrink-0" />
          <span>
            <strong>Dados de demonstração</strong> — os dados reais serão exibidos após a conexão com os PDVs e balanças.
          </span>
          <button
            onClick={fetchDashboardData}
            className="ml-auto text-xs underline hover:no-underline whitespace-nowrap"
          >
            Atualizar
          </button>
        </div>
      )}

      {/* Tela de Turno — 3 cliques */}
      <TurnoDashboard lojaId={loja_id} />

      {/* KPI Cards - Vendas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Faturamento"
          value={`R$ ${(resumo.faturamento || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
          })}`}
          subtitle="Últimos 7 dias"
          icon={<TrendingUp className="text-success" size={24} />}
          trend="+12.5%"
        />

        <DashboardCard
          title="Transações"
          value={resumo.transacoes || 0}
          subtitle="Pedidos processados"
          icon={<Activity className="text-info" size={24} />}
          trend="+8.2%"
        />

        <DashboardCard
          title="Itens Vendidos"
          value={(resumo.itens_vendidos || 0).toLocaleString()}
          subtitle="Unidades totais"
          icon={<Package className="text-accent" size={24} />}
          trend="+5.1%"
        />

        <DashboardCard
          title="Ticket Médio"
          value={`R$ ${((resumo.faturamento || 0) / (resumo.transacoes || 1)).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
          })}`}
          subtitle="Por transação"
          icon={<TrendingUp className="text-warning" size={24} />}
          trend="+3.8%"
        />
      </div>

      {/* KPI Cards - Fidelidade e LTV */}
      {fidelidade.total_clientes > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard
            title="Taxa de Fidelidade"
            value={`${(fidelidade.taxa_fidelidade_media_percentual || 0).toFixed(1)}%`}
            subtitle={`${fidelidade.clientes_ativos || 0} clientes ativos`}
            icon={<Target className="text-success" size={24} />}
            trend=""
          />

          <DashboardCard
            title="LTV Médio"
            value={`R$ ${(fidelidade.ltv_medio || 0).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
            })}`}
            subtitle="Lifetime Value"
            icon={<TrendingUp className="text-accent" size={24} />}
            trend=""
          />

          <DashboardCard
            title="Clientes Novos"
            value={`${(movimento.taxa_novos_percentual || 0).toFixed(1)}%`}
            subtitle={`${movimento.novos_clientes || 0} novos`}
            icon={<UserPlus className="text-info" size={24} />}
            trend=""
          />

          <DashboardCard
            title="Taxa de Churn"
            value={`${(movimento.taxa_churn_percentual || 0).toFixed(1)}%`}
            subtitle={`${movimento.churn_clientes || 0} clientes`}
            icon={<LogOut className="text-danger" size={24} />}
            trend=""
          />
        </div>
      ) : (
        <div className="card bg-blue-900/20 border-blue-700 p-4">
          <p className="text-sm text-blue-300">
            ℹ️ Dados de fidelidade e LTV estarão disponíveis após a primeira sincronização de clientes via PDV.
          </p>
        </div>
      )}

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart lojaId={loja_id} />
        </div>

        <div>
          <AlertsPanel lojaId={loja_id} />
        </div>
      </div>

      {/* Predictions & Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PredictionChart lojaId={loja_id} />
        </div>

        <div>
          <InventoryStatus lojaId={loja_id} />
        </div>
      </div>

      {/* Top Categories */}
      {resumo.categorias && resumo.categorias.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Categorias Mais Vendidas</h3>
          <div className="space-y-3">
            {resumo.categorias.slice(0, 5).map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm">{cat.nome}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full"
                      style={{
                        width: `${((cat.faturamento || 0) / (resumo.faturamento || 1) * 100).toFixed(1)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-400 w-12 text-right">
                    {((cat.faturamento / (resumo.faturamento || 1)) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
