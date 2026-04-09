'use client';

import { useEffect, useState, useMemo } from 'react';
import { TrendingUp, BarChart3, Target, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '@/store/dashboard';

interface ProdutoPerformance {
  id: string;
  nome: string;
  sku: string;
  vendas_ultimos_7_dias: number;
  vendas_ultimos_30_dias: number;
  valor_medio_ticket: number;
  margem_percentual: number;
  velocidade_venda: number; // dias para vender estoque
  tendencia: 'crescente' | 'estavel' | 'decrescente';
  recomendacao: string;
  potencial_crescimento: number;
}

interface DadosGrafico {
  dia: string;
  vendas: number;
  ticket_medio: number;
}

export default function PainelInteligenciaVendas() {
  const { loja_id } = useStore();
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState<ProdutoPerformance[]>([]);
  const [graficoDados, setGraficoDados] = useState<DadosGrafico[]>([]);
  const [filtroPerformance, setFiltroPerformance] = useState<'top' | 'oportunidade' | 'risco'>('top');

  useEffect(() => {
    const fetchDados = async () => {
      try {
        setLoading(true);

        // Mock data
        const mockProdutos: ProdutoPerformance[] = [
          {
            id: '1',
            nome: 'Leite Integral 1L',
            sku: 'LT-001',
            vendas_ultimos_7_dias: 156,
            vendas_ultimos_30_dias: 612,
            valor_medio_ticket: 5.90,
            margem_percentual: 55,
            velocidade_venda: 3,
            tendencia: 'crescente',
            recomendacao: 'Top seller - manter estoque elevado',
            potencial_crescimento: 12,
          },
          {
            id: '2',
            nome: 'Iogurte Natural 500g',
            sku: 'YOGN-001',
            vendas_ultimos_7_dias: 89,
            vendas_ultimos_30_dias: 298,
            valor_medio_ticket: 5.99,
            margem_percentual: 71,
            velocidade_venda: 5,
            tendencia: 'crescente',
            recomendacao: 'Alta margem - aumentar visibilidade',
            potencial_crescimento: 28,
          },
          {
            id: '3',
            nome: 'Pão Francês (kg)',
            sku: 'PAO-001',
            vendas_ultimos_7_dias: 201,
            vendas_ultimos_30_dias: 756,
            valor_medio_ticket: 8.50,
            margem_percentual: 102,
            velocidade_venda: 2,
            tendencia: 'estavel',
            recomendacao: 'Produto estratégico - bundlar com outros',
            potencial_crescimento: 8,
          },
          {
            id: '4',
            nome: 'Queijo Meia Cura 500g',
            sku: 'QJO-002',
            vendas_ultimos_7_dias: 23,
            vendas_ultimos_30_dias: 78,
            valor_medio_ticket: 34.99,
            margem_percentual: 89,
            velocidade_venda: 12,
            tendencia: 'decrescente',
            recomendacao: 'Oportunidade - criar bundle com produtos complementares',
            potencial_crescimento: 45,
          },
          {
            id: '5',
            nome: 'Cereal 500g',
            sku: 'CER-001',
            vendas_ultimos_7_dias: 34,
            vendas_ultimos_30_dias: 112,
            valor_medio_ticket: 12.50,
            margem_percentual: 42,
            velocidade_venda: 15,
            tendencia: 'decrescente',
            recomendacao: 'Risco de estoque obsoleto - reduzir quantidade',
            potencial_crescimento: -20,
          },
        ];

        setProdutos(mockProdutos);

        // Mock gráfico
        const mockGrafico: DadosGrafico[] = [
          { dia: '01', vendas: 14200, ticket_medio: 28.5 },
          { dia: '02', vendas: 15100, ticket_medio: 29.2 },
          { dia: '03', vendas: 13800, ticket_medio: 27.8 },
          { dia: '04', vendas: 16400, ticket_medio: 31.5 },
          { dia: '05', vendas: 17200, ticket_medio: 32.1 },
          { dia: '06', vendas: 18900, ticket_medio: 34.2 },
          { dia: '07', vendas: 21300, ticket_medio: 38.5 },
        ];

        setGraficoDados(mockGrafico);
      } catch (error) {
        console.error('Erro ao carregar inteligência de vendas:', error);
      } finally {
        setLoading(false);
      }
    };

    if (loja_id) {
      fetchDados();
    }
  }, [loja_id]);

  const produtosFiltrados = useMemo(() => {
    switch (filtroPerformance) {
      case 'top':
        return produtos
          .sort((a, b) => b.vendas_ultimos_7_dias - a.vendas_ultimos_7_dias)
          .slice(0, 5);
      case 'oportunidade':
        return produtos
          .filter(p => p.tendencia === 'decrescente' || p.velocidade_venda > 8)
          .sort((a, b) => b.potencial_crescimento - a.potencial_crescimento);
      case 'risco':
        return produtos
          .filter(p => p.velocidade_venda > 10 || p.margem_percentual < 30)
          .sort((a, b) => b.velocidade_venda - a.velocidade_venda);
      default:
        return produtos;
    }
  }, [produtos, filtroPerformance]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card skeleton h-80" />
          <div className="card skeleton h-80" />
        </div>
      </div>
    );
  }

  const vendastotal = graficoDados.reduce((sum, d) => sum + d.vendas, 0);
  const ticketMedio = (vendastotal / graficoDados.length / 1000).toFixed(2);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Inteligência de Vendas</h1>
        <p className="text-gray-400 text-sm mt-1">Análise de performance e oportunidades de crescimento</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-green-900/20 border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Faturamento (7d)</p>
              <p className="text-2xl font-bold text-green-400">
                R$ {(vendastotal / 1000).toFixed(1)}k
              </p>
            </div>
            <TrendingUp size={32} className="text-green-500 opacity-20" />
          </div>
        </div>

        <div className="card bg-blue-900/20 border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Ticket Médio</p>
              <p className="text-2xl font-bold text-blue-400">R$ {ticketMedio}</p>
            </div>
            <Target size={32} className="text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="card bg-purple-900/20 border-purple-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Oportunidades</p>
              <p className="text-2xl font-bold text-purple-400">
                {produtos.filter(p => p.tendencia === 'decrescente').length}
              </p>
            </div>
            <Zap size={32} className="text-purple-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Gráfico de Vendas */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Tendência de Faturamento (últimos 7 dias)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={graficoDados}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="dia" stroke="#999" />
            <YAxis stroke="#999" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #444' }}
              formatter={value => `R$ ${value.toLocaleString('pt-BR')}`}
            />
            <Line type="monotone" dataKey="vendas" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {(['top', 'oportunidade', 'risco'] as const).map(filtro => (
          <button
            key={filtro}
            onClick={() => setFiltroPerformance(filtro)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroPerformance === filtro
                ? 'bg-accent text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {filtro === 'top' && '⭐ Top Sellers'}
            {filtro === 'oportunidade' && '📈 Oportunidades'}
            {filtro === 'risco' && '⚠️ Risco'}
          </button>
        ))}
      </div>

      {/* Tabela de Produtos */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-900/50">
                <th className="px-4 py-3 text-left font-semibold">Produto</th>
                <th className="px-4 py-3 text-right font-semibold">Vendas (7d)</th>
                <th className="px-4 py-3 text-right font-semibold">Margem</th>
                <th className="px-4 py-3 text-right font-semibold">Vel. Venda</th>
                <th className="px-4 py-3 text-left font-semibold">Tendência</th>
                <th className="px-4 py-3 text-left font-semibold">Recomendação</th>
                <th className="px-4 py-3 text-right font-semibold">Potencial</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.map(produto => (
                <tr key={produto.id} className="border-b border-gray-800 hover:bg-gray-900/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{produto.nome}</p>
                      <p className="text-xs text-gray-500">{produto.sku}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-green-400">
                    {produto.vendas_ultimos_7_dias} un
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={
                      produto.margem_percentual > 70 ? 'text-green-400 font-bold' :
                      produto.margem_percentual > 40 ? 'text-green-300' :
                      'text-yellow-400'
                    }>
                      {produto.margem_percentual}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={
                      produto.velocidade_venda <= 3 ? 'text-green-400' :
                      produto.velocidade_venda <= 8 ? 'text-yellow-400' :
                      'text-red-400'
                    }>
                      {produto.velocidade_venda}d
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={
                      produto.tendencia === 'crescente' ? 'text-green-400 font-bold' :
                      produto.tendencia === 'estavel' ? 'text-gray-400' :
                      'text-red-400'
                    }>
                      {produto.tendencia === 'crescente' && '📈'}
                      {produto.tendencia === 'estavel' && '➡️'}
                      {produto.tendencia === 'decrescente' && '📉'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {produto.recomendacao}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={
                      produto.potencial_crescimento > 0 ? 'text-green-400 font-bold' :
                      'text-red-400'
                    }>
                      {produto.potencial_crescimento > 0 ? '+' : ''}{produto.potencial_crescimento}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Footer */}
      <div className="card bg-blue-900/20 border-blue-700 p-4">
        <p className="text-sm text-blue-300">
          💡 <strong>Dica:</strong> Use as oportunidades listadas para criar <strong>bundles</strong> de produtos complementares e aumentar o ticket médio.
        </p>
      </div>
    </div>
  );
}
