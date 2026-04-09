'use client';

import { useEffect, useState, useMemo } from 'react';
import { AlertCircle, TrendingDown, Package, DollarSign, Clock, Check } from 'lucide-react';
import { useStore } from '@/store/dashboard';
import { apiClient } from '@/lib/api';

interface ProdutoRisco {
  id: string;
  nome: string;
  sku: string;
  quantidade: number;
  preco_custo: number;
  preco_venda: number;
  data_validade: string;
  dias_para_vencer: number;
  urgencia: 'critico' | 'alto' | 'medio';
  valor_total_risco: number;
  margem_percentual: number;
  recomendacao: {
    acao: 'markdown' | 'bundling' | 'doacao';
    desconto_sugerido: number;
    potencial_recuperacao: number;
    impacto_financeiro: number;
  };
}

interface ResumoPerdasMes {
  total_perdas_mes: number;
  total_recuperado: number;
  total_doado: number;
  economia_fiscal_mes: number;
  produtos_em_risco: number;
}

export default function PainelPerdas() {
  const { loja_id } = useStore();
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState<ProdutoRisco[]>([]);
  const [resumo, setResumo] = useState<ResumoPerdasMes | null>(null);
  const [filtroUrgencia, setFiltroUrgencia] = useState<'todos' | 'critico' | 'alto'>('todos');
  const [acaoAplicada, setAcaoAplicada] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const fetchProdutosRisco = async () => {
      try {
        setLoading(true);
        // TODO: Integrar com API real
        // const response = await apiClient.get(`/estoque/${loja_id}/alertas-perdas`);

        // Dados mockados para demo
        const mockData: ProdutoRisco[] = [
          {
            id: '1',
            nome: 'Iogurte Natural 500g',
            sku: 'YOGN-001',
            quantidade: 24,
            preco_custo: 3.50,
            preco_venda: 5.99,
            data_validade: '2025-04-12',
            dias_para_vencer: 3,
            urgencia: 'critico',
            valor_total_risco: 143.76,
            margem_percentual: 71.14,
            recomendacao: {
              acao: 'markdown',
              desconto_sugerido: 35,
              potencial_recuperacao: 93.44,
              impacto_financeiro: 31.15,
            },
          },
          {
            id: '2',
            nome: 'Pão Francês (kg)',
            sku: 'PAO-001',
            quantidade: 15,
            preco_custo: 4.20,
            preco_venda: 8.50,
            data_validade: '2025-04-10',
            dias_para_vencer: 1,
            urgencia: 'critico',
            valor_total_risco: 127.5,
            margem_percentual: 102.38,
            recomendacao: {
              acao: 'bundling',
              desconto_sugerido: 20,
              potencial_recuperacao: 102.0,
              impacto_financeiro: 23.8,
            },
          },
          {
            id: '3',
            nome: 'Queijo Meia Cura 500g',
            sku: 'QJO-002',
            quantidade: 8,
            preco_custo: 18.50,
            preco_venda: 34.99,
            data_validade: '2025-04-14',
            dias_para_vencer: 5,
            urgencia: 'alto',
            valor_total_risco: 279.92,
            margem_percentual: 89.13,
            recomendacao: {
              acao: 'markdown',
              desconto_sugerido: 15,
              potencial_recuperacao: 237.43,
              impacto_financeiro: 35.60,
            },
          },
          {
            id: '4',
            nome: 'Leite Integral 1L',
            sku: 'LT-001',
            quantidade: 32,
            preco_custo: 3.80,
            preco_venda: 5.90,
            data_validade: '2025-04-16',
            dias_para_vencer: 7,
            urgencia: 'medio',
            valor_total_risco: 188.8,
            margem_percentual: 55.26,
            recomendacao: {
              acao: 'markdown',
              desconto_sugerido: 10,
              potencial_recuperacao: 169.92,
              impacto_financeiro: 12.67,
            },
          },
        ];

        setProdutos(mockData);

        // Calcular resumo
        const totalRisco = mockData.reduce((sum, p) => sum + p.valor_total_risco, 0);
        const totalRecuperavel = mockData.reduce((sum, p) => sum + p.recomendacao.potencial_recuperacao, 0);
        const totalDoacao = totalRisco - totalRecuperavel;
        const economiaFiscal = totalDoacao * 0.02; // 2% de dedução

        setResumo({
          total_perdas_mes: totalRisco,
          total_recuperado: totalRecuperavel,
          total_doado: totalDoacao,
          economia_fiscal_mes: economiaFiscal,
          produtos_em_risco: mockData.length,
        });
      } catch (error) {
        console.error('Erro ao carregar produtos em risco:', error);
      } finally {
        setLoading(false);
      }
    };

    if (loja_id) {
      fetchProdutosRisco();
    }
  }, [loja_id]);

  const produtosFiltrados = useMemo(() => {
    if (filtroUrgencia === 'todos') return produtos;
    if (filtroUrgencia === 'critico') return produtos.filter(p => p.urgencia === 'critico');
    return produtos.filter(p => p.urgencia === 'critico' || p.urgencia === 'alto');
  }, [produtos, filtroUrgencia]);

  const aplicarAcao = (produtoId: string, acao: string) => {
    setAcaoAplicada(prev => ({
      ...prev,
      [produtoId]: true,
    }));
    // TODO: Integrar com API para aplicar ação
    console.log(`Ação '${acao}' aplicada ao produto ${produtoId}`);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="card skeleton h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alertas de Perdas</h1>
          <p className="text-gray-400 text-sm mt-1">Produtos vencendo nos próximos 30 dias</p>
        </div>
      </div>

      {/* Cards de Resumo */}
      {resumo && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card bg-red-900/20 border-red-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Valor em Risco</p>
                <p className="text-2xl font-bold text-red-400">
                  R$ {resumo.total_perdas_mes.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                </p>
              </div>
              <AlertCircle size={32} className="text-red-500 opacity-20" />
            </div>
          </div>

          <div className="card bg-blue-900/20 border-blue-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Potencial Recuperável</p>
                <p className="text-2xl font-bold text-blue-400">
                  R$ {resumo.total_recuperado.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingDown size={32} className="text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="card bg-yellow-900/20 border-yellow-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Para Doação</p>
                <p className="text-2xl font-bold text-yellow-400">
                  R$ {resumo.total_doado.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                </p>
              </div>
              <Package size={32} className="text-yellow-500 opacity-20" />
            </div>
          </div>

          <div className="card bg-green-900/20 border-green-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Economia Fiscal</p>
                <p className="text-2xl font-bold text-green-400">
                  R$ {resumo.economia_fiscal_mes.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign size={32} className="text-green-500 opacity-20" />
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2">
        {(['todos', 'critico', 'alto'] as const).map(nivel => (
          <button
            key={nivel}
            onClick={() => setFiltroUrgencia(nivel)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroUrgencia === nivel
                ? 'bg-accent text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {nivel === 'todos' && 'Todos'}
            {nivel === 'critico' && '🔴 Críticos'}
            {nivel === 'alto' && '🟠 Altos'}
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
                <th className="px-4 py-3 text-left font-semibold">Qtd</th>
                <th className="px-4 py-3 text-left font-semibold">Vence em</th>
                <th className="px-4 py-3 text-right font-semibold">Valor Risco</th>
                <th className="px-4 py-3 text-left font-semibold">Ação</th>
                <th className="px-4 py-3 text-right font-semibold">Impacto</th>
                <th className="px-4 py-3 text-center">Status</th>
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
                  <td className="px-4 py-3">{produto.quantidade} un</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-red-400" />
                      <span className={
                        produto.dias_para_vencer <= 2 ? 'text-red-400 font-bold' :
                        produto.dias_para_vencer <= 5 ? 'text-yellow-400' :
                        'text-gray-400'
                      }>
                        {produto.dias_para_vencer}d
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    R$ {produto.valor_total_risco.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {produto.recomendacao.acao === 'markdown' && (
                        <button
                          onClick={() => aplicarAcao(produto.id, 'markdown')}
                          disabled={acaoAplicada[produto.id]}
                          className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded text-xs hover:bg-blue-900 disabled:opacity-50"
                          title={`Reduzir em ${produto.recomendacao.desconto_sugerido}%`}
                        >
                          -${produto.recomendacao.desconto_sugerido}%
                        </button>
                      )}
                      {produto.recomendacao.acao === 'bundling' && (
                        <button
                          onClick={() => aplicarAcao(produto.id, 'bundling')}
                          disabled={acaoAplicada[produto.id]}
                          className="px-3 py-1 bg-purple-900/50 text-purple-300 rounded text-xs hover:bg-purple-900 disabled:opacity-50"
                        >
                          Bundle
                        </button>
                      )}
                      {produto.recomendacao.acao === 'doacao' && (
                        <button
                          onClick={() => aplicarAcao(produto.id, 'doacao')}
                          disabled={acaoAplicada[produto.id]}
                          className="px-3 py-1 bg-yellow-900/50 text-yellow-300 rounded text-xs hover:bg-yellow-900 disabled:opacity-50"
                        >
                          Doar
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={
                      produto.recomendacao.impacto_financeiro > 30 ? 'text-green-400 font-bold' :
                      'text-green-300'
                    }>
                      +R$ {produto.recomendacao.impacto_financeiro.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {acaoAplicada[produto.id] && (
                      <Check size={18} className="text-green-400 mx-auto" />
                    )}
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
          💡 <strong>Dica:</strong> Produtos em <strong>vermelho</strong> vencem em 1-2 dias. Aplique markdown imediatamente para recuperar até 90% do valor antes de descartar.
        </p>
      </div>
    </div>
  );
}
