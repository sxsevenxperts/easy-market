'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

interface InventoryProduct {
  sku: string;
  nome: string;
  estoque_atual: number;
  estoque_minimo: number;
  sell_in_rate: number; // unidades/dia entrada
  sell_out_rate: number; // unidades/dia saída
}

export default function InventoryStatus({ lojaId }: { lojaId: string }) {
  const [inventory, setInventory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await apiClient.get(`/inventario/${lojaId}`);
        setInventory(response.data.resumo_estoque);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [lojaId]);

  if (loading) {
    return (
      <div className="card">
        <div className="h-48 bg-gray-700 rounded skeleton" />
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Status de Estoque</h3>
        <Link href="/estoque" className="text-xs text-accent hover:underline">
          Detalhes
        </Link>
      </div>

      <div className="space-y-4">
        {/* Total Products */}
        <div className="p-3 bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-400 mb-1">Total de Produtos</p>
          <p className="text-2xl font-bold">{inventory?.total_produtos || 0}</p>
        </div>

        {/* Total Stock Value */}
        <div className="p-3 bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-400 mb-1">Valor Total em Estoque</p>
          <p className="text-xl font-bold">
            R$ {(inventory?.valor_total_estoque || 0).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>

        {/* Low Stock Alert */}
        {inventory?.produtos_estoque_baixo > 0 && (
          <div className="p-3 bg-yellow-900 border border-yellow-700 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} className="text-yellow-400" />
              <p className="text-xs font-medium text-yellow-400">Estoque Crítico</p>
            </div>
            <p className="text-sm text-yellow-100">{inventory.produtos_estoque_baixo} produtos abaixo do mínimo</p>
          </div>
        )}

        {/* Perishables Count */}
        <div className="p-3 bg-blue-900 border border-blue-700 rounded-lg">
          <p className="text-xs text-blue-400 mb-1">Produtos Perecíveis</p>
          <p className="text-lg font-bold text-blue-100">{inventory?.produtos_pereciveis || 0}</p>
        </div>
      </div>
    </div>
  );
}
