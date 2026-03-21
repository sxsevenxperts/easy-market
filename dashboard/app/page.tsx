'use client';

import { useEffect, useState } from 'react';
import { Activity, AlertCircle, Package, TrendingUp } from 'lucide-react';
import DashboardCard from '@/components/DashboardCard';
import SalesChart from '@/components/charts/SalesChart';
import AlertsPanel from '@/components/AlertsPanel';
import InventoryStatus from '@/components/InventoryStatus';
import PredictionChart from '@/components/charts/PredictionChart';
import { useStore } from '@/store/dashboard';
import { apiClient } from '@/lib/api';

export default function DashboardHome() {
  const { loja_id } = useStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/dashboard/${loja_id}`);
        setData(response.data);
      } catch (err) {
        setError('Erro ao carregar dados do dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (loja_id) {
      fetchDashboardData();
    }
  }, [loja_id]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card skeleton h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="alert alert-danger">
          <AlertCircle className="inline mr-2" size={20} />
          {error}
        </div>
      </div>
    );
  }

  const resumo = data?.resumo || {};

  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards */}
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
      <div className="card">
        <h3 className="text-xl font-bold mb-4">Categorias Mais Vendidas</h3>
        <div className="space-y-3">
          {resumo.categorias?.slice(0, 5).map((cat: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-sm">{cat.nome}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full"
                    style={{
                      width: `${(cat.faturamento / (resumo.faturamento || 1)) * 100}%`,
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
    </div>
  );
}
