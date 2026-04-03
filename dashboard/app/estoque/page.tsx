'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/dashboard';
import { apiClient } from '@/lib/api';
import { TrendingUp, TrendingDown, AlertTriangle, Search } from 'lucide-react';

interface Product {
  sku: string;
  nome: string;
  categoria: string;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo: number;
  preco_venda: number;
  status_estoque: string;
  dias_para_vencer?: number;
  sell_in_rate?: number; // unidades/dia entrada
  sell_out_rate?: number; // unidades/dia saída
}

export default function EstoquePage() {
  const { loja_id } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/inventario/${loja_id}/produtos`);
        setProducts(response.data.produtos || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (loja_id) {
      fetchInventory();
    }
  }, [loja_id]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterStatus || product.status_estoque === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'critico':
        return 'bg-red-900 text-red-100';
      case 'excesso':
        return 'bg-blue-900 text-blue-100';
      case 'normal':
        return 'bg-green-900 text-green-100';
      case 'sem_estoque':
        return 'bg-red-900 text-red-100';
      default:
        return 'bg-gray-700 text-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'critico':
        return 'Crítico';
      case 'excesso':
        return 'Excesso';
      case 'normal':
        return 'Normal';
      case 'sem_estoque':
        return 'Sem Estoque';
      default:
        return status;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Estoque</h1>
        <p className="text-gray-400">Produtos com baixo estoque aparecem primeiro — ação imediata em vermelho</p>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
        >
          <option value="">Todos os Status</option>
          <option value="normal">Normal</option>
          <option value="critico">Crítico</option>
          <option value="excesso">Excesso</option>
          <option value="sem_estoque">Sem Estoque</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-400 mb-2">Total de Produtos</p>
          <p className="text-3xl font-bold">{products.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-400 mb-2">Estoque Crítico</p>
          <p className="text-3xl font-bold text-warning">
            {products.filter((p) => p.status_estoque === 'critico').length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-400 mb-2">Sem Estoque</p>
          <p className="text-3xl font-bold text-danger">
            {products.filter((p) => p.status_estoque === 'sem_estoque').length}
          </p>
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-700">
            <tr className="text-gray-400">
              <th className="text-left py-3 px-4">SKU</th>
              <th className="text-left py-3 px-4">Produto</th>
              <th className="text-left py-3 px-4">Categoria</th>
              <th className="text-center py-3 px-4">Estoque Atual</th>
              <th className="text-center py-3 px-4">Mín/Máx</th>
              <th className="text-center py-3 px-4">Entrada/dia</th>
              <th className="text-center py-3 px-4">Saída/dia</th>
              <th className="text-center py-3 px-4">Status</th>
              <th className="text-center py-3 px-4">Preço</th>
              <th className="text-center py-3 px-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin">⏳</div>
                    <span>Carregando inventário...</span>
                  </div>
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <AlertTriangle size={48} className="opacity-40" />
                    <div>
                      <h4 className="text-lg font-medium mb-1">Nenhum produto encontrado</h4>
                      <p className="text-sm">
                        {products.length === 0
                          ? 'Nenhum produto no inventário'
                          : 'Tente ajustar sua busca ou filtros'}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.sku} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-gray-400">{product.sku}</td>
                  <td className="py-3 px-4 font-medium">{product.nome}</td>
                  <td className="py-3 px-4 text-gray-400">{product.categoria}</td>
                  <td className="py-3 px-4 text-center font-bold">{product.estoque_atual}</td>
                  <td className="py-3 px-4 text-center text-gray-400">
                    {product.estoque_minimo}/{product.estoque_maximo}
                  </td>
                  {/* Sell-In Rate */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp size={16} className="text-info" />
                      <span className="font-medium">{product.sell_in_rate?.toFixed(1) || '-'}</span>
                    </div>
                  </td>
                  {/* Sell-Out Rate */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingDown size={16} className="text-accent" />
                      <span className="font-medium">{product.sell_out_rate?.toFixed(1) || '-'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(product.status_estoque)}`}>
                      {getStatusLabel(product.status_estoque)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-medium">
                    R$ {product.preco_venda?.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {product.status_estoque === 'critico' && (
                        <button
                          title="Repor Estoque"
                          className="p-1.5 rounded bg-orange-900/30 hover:bg-orange-900/50 text-orange-400 transition"
                        >
                          <TrendingUp size={16} />
                        </button>
                      )}
                      <button
                        title="Ver Detalhes"
                        className="p-1.5 rounded bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 transition"
                      >
                        📋
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="card">
        <h3 className="font-bold mb-3">Legenda</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 mb-2">
              <strong>Entrada/dia:</strong> Unidades recebidas por dia (reposição)
            </p>
            <p className="text-gray-400">
              <strong>Saída/dia:</strong> Unidades vendidas por dia (giro)
            </p>
          </div>
          <div>
            <p className="text-gray-400 mb-2">
              <strong>Taxa de Rotação:</strong> Sell-Out ÷ Estoque Médio
            </p>
            <p className="text-gray-400">
              <strong>Dias de Estoque:</strong> Estoque Atual ÷ Sell-Out Diário
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
