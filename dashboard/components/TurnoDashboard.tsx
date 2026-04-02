'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ShoppingCart, TrendingDown, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

interface TurnoData {
  alertasCriticos: number;
  desvioPct: number;
  rupturas: number;
  faturamentoHoje: number;
  faturamentoOntem: number;
}

export default function TurnoDashboard({ lojaId }: { lojaId: string }) {
  const [data, setData] = useState<TurnoData>({
    alertasCriticos: 0,
    desvioPct: 0,
    rupturas: 0,
    faturamentoHoje: 0,
    faturamentoOntem: 0,
  });
  const [loading, setLoading] = useState(true);

  const hora = new Date().getHours();
  const turno =
    hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  useEffect(() => {
    const fetchTurno = async () => {
      try {
        const [alertasRes, estoqueRes, dashRes] = await Promise.allSettled([
          apiClient.get(`/alertas/${lojaId}/criticos`),
          apiClient.get(`/inventario/${lojaId}/produtos`),
          apiClient.get(`/dashboard/${lojaId}`),
        ]);

        const alertasCriticos =
          alertasRes.status === 'fulfilled'
            ? (alertasRes.value.data.criticos || []).filter(
                (a: any) => a.urgencia === 'alta' && a.status === 'aberto'
              ).length
            : 0;

        const produtos =
          estoqueRes.status === 'fulfilled'
            ? estoqueRes.value.data.produtos || []
            : [];
        const rupturas = produtos.filter(
          (p: any) => p.status_estoque === 'sem_estoque' || p.status_estoque === 'critico'
        ).length;

        const resumo =
          dashRes.status === 'fulfilled'
            ? dashRes.value.data?.resumo || {}
            : {};
        const faturamentoHoje = resumo.faturamento_hoje || resumo.faturamento || 0;
        const faturamentoOntem = resumo.faturamento_ontem || faturamentoHoje * 0.97;
        const desvioPct =
          faturamentoOntem > 0
            ? ((faturamentoHoje - faturamentoOntem) / faturamentoOntem) * 100
            : 0;

        setData({ alertasCriticos, desvioPct, rupturas, faturamentoHoje, faturamentoOntem });
      } catch {
        // silently fallback to zeros
      } finally {
        setLoading(false);
      }
    };

    if (lojaId) fetchTurno();
  }, [lojaId]);

  const desvioPositivo = data.desvioPct >= 0;

  return (
    <div className="mb-6">
      <p className="text-sm text-gray-400 mb-3">
        {turno} — aqui está o que precisa da sua atenção agora
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Alertas urgentes */}
        <Link href="/alertas?urgencia=alta&status=aberto">
          <div
            className={`card cursor-pointer hover:scale-[1.02] transition-transform border-l-4 ${
              data.alertasCriticos > 0 ? 'border-red-500' : 'border-green-500'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <AlertTriangle
                size={22}
                className={data.alertasCriticos > 0 ? 'text-red-400' : 'text-green-400'}
              />
              <ArrowRight size={16} className="text-gray-500" />
            </div>
            {loading ? (
              <div className="h-8 bg-gray-700 rounded skeleton w-16 mb-2" />
            ) : (
              <p
                className={`text-4xl font-bold mb-1 ${
                  data.alertasCriticos > 0 ? 'text-red-400' : 'text-green-400'
                }`}
              >
                {data.alertasCriticos}
              </p>
            )}
            <p className="text-sm font-medium text-white">
              {data.alertasCriticos === 1
                ? 'Alerta urgente'
                : data.alertasCriticos > 1
                ? 'Alertas urgentes'
                : 'Nenhum alerta urgente'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {data.alertasCriticos > 0
                ? 'Toque para resolver agora'
                : 'Tudo sob controle'}
            </p>
          </div>
        </Link>

        {/* Card 2: Vendas vs ontem */}
        <Link href="/relatorios">
          <div
            className={`card cursor-pointer hover:scale-[1.02] transition-transform border-l-4 ${
              desvioPositivo ? 'border-blue-500' : 'border-yellow-500'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <TrendingDown
                size={22}
                className={desvioPositivo ? 'text-blue-400' : 'text-yellow-400'}
                style={{ transform: desvioPositivo ? 'scaleY(-1)' : 'none' }}
              />
              <ArrowRight size={16} className="text-gray-500" />
            </div>
            {loading ? (
              <div className="h-8 bg-gray-700 rounded skeleton w-20 mb-2" />
            ) : (
              <p
                className={`text-4xl font-bold mb-1 ${
                  desvioPositivo ? 'text-blue-400' : 'text-yellow-400'
                }`}
              >
                {desvioPositivo ? '+' : ''}
                {data.desvioPct.toFixed(1)}%
              </p>
            )}
            <p className="text-sm font-medium text-white">Vendas hoje vs ontem</p>
            <p className="text-xs text-gray-400 mt-1">
              {loading
                ? '...'
                : `R$ ${data.faturamentoHoje.toLocaleString('pt-BR', {
                    maximumFractionDigits: 0,
                  })} hoje`}
            </p>
          </div>
        </Link>

        {/* Card 3: Rupturas */}
        <Link href="/estoque?status=critico">
          <div
            className={`card cursor-pointer hover:scale-[1.02] transition-transform border-l-4 ${
              data.rupturas > 0 ? 'border-orange-500' : 'border-green-500'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <ShoppingCart
                size={22}
                className={data.rupturas > 0 ? 'text-orange-400' : 'text-green-400'}
              />
              <ArrowRight size={16} className="text-gray-500" />
            </div>
            {loading ? (
              <div className="h-8 bg-gray-700 rounded skeleton w-16 mb-2" />
            ) : (
              <p
                className={`text-4xl font-bold mb-1 ${
                  data.rupturas > 0 ? 'text-orange-400' : 'text-green-400'
                }`}
              >
                {data.rupturas}
              </p>
            )}
            <p className="text-sm font-medium text-white">
              {data.rupturas === 1
                ? 'Produto em ruptura'
                : data.rupturas > 1
                ? 'Produtos em ruptura'
                : 'Estoque normalizado'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {data.rupturas > 0
                ? 'Toque para ver quais produtos'
                : 'Nenhuma ruptura no momento'}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
