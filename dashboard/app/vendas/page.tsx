'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/dashboard';
import { apiClient } from '@/lib/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, ShoppingCart, Package, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';

interface VendaDiaria {
  data: string;
  faturamento: number;
  quantidade: number;
  ticket_medio: number;
}

interface VendasData {
  resumo: {
    faturamento_total: number;
    transacoes_total: number;
    ticket_medio: number;
    variacao_percentual: number;
  };
  vendas_diarias: VendaDiaria[];
}

export default function VendasPage() {
  const { loja_id } = useStore();
  const [data, setData] = useState<VendasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d'>('7d');

  const fetchVendas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/relatorios/${loja_id}/vendas?periodo=${periodo}`);
      setData(response.data);
    } catch {
      setError('Não foi possível carregar os dados de vendas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loja_id) fetchVendas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loja_id, periodo]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="card skeleton h-28" />)}
        </div>
        <div className="card skeleton h-72" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle size={48} className="text-red-400 opacity-80" />
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-1">Erro ao carregar vendas</h2>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
        <button
          onClick={fetchVendas}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      </div>
    );
  }

  const resumo = data?.resumo;
  const vendas = data?.vendas_diarias ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart size={32} />
            Vendas
          </h1>
          <p className="text-gray-400 mt-1">Acompanhe o desempenho de vendas da sua loja</p>
        </div>

        {/* Filtro de período */}
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                periodo === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-400">Faturamento Total</p>
            <DollarSign size={20} className="text-green-400" />
          </div>
          <p className="text-3xl font-bold text-green-400">
            R$ {(resumo?.faturamento_total ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          {resumo?.variacao_percentual !== undefined && (
            <p className={`text-xs mt-2 flex items-center gap-1 ${resumo.variacao_percentual >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              <TrendingUp size={12} />
              {resumo.variacao_percentual >= 0 ? '+' : ''}{resumo.variacao_percentual.toFixed(1)}% vs período anterior
            </p>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-400">Transações</p>
            <Package size={20} className="text-blue-400" />
          </div>
          <p className="text-3xl font-bold">
            {(resumo?.transacoes_total ?? 0).toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-gray-500 mt-2">Pedidos processados</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-400">Ticket Médio</p>
            <TrendingUp size={20} className="text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-purple-400">
            R$ {(resumo?.ticket_medio ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-2">Por transação</p>
        </div>
      </div>

      {/* Gráfico de faturamento */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-6">Faturamento Diário</h2>
        {vendas.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={vendas}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="data"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickFormatter={(v) => new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: 8 }}
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento']}
                labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
              />
              <Line
                type="monotone"
                dataKey="faturamento"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
            <ShoppingCart size={40} className="opacity-40" />
            <p className="text-sm">Nenhum dado de venda para o período selecionado</p>
          </div>
        )}
      </div>
    </div>
  );
}
