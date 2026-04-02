'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Plus, Edit2 } from 'lucide-react';

interface Posicao {
  id: string;
  corredor: number;
  prateleira: number; // 1=chão, 2=média, 3=altura
  produto_nome?: string;
  produto_sku?: string;
  status: 'ok' | 'ruptura' | 'excesso';
  estoque_atual?: number;
  estoque_minimo?: number;
}

interface GondolaMapProps {
  lojaId: string;
  corredorSelecionado?: number;
  onEditPosicao?: (posicao: Posicao) => void;
}

export default function GondolaMap({ lojaId, corredorSelecionado = 1, onEditPosicao }: GondolaMapProps) {
  const [posicoes, setPosicoes] = useState<Posicao[]>([]);
  const [loading, setLoading] = useState(true);

  const CORREDORES = [1, 2, 3, 4, 5];
  const PRATELEIRAS = [
    { numero: 3, label: 'Altura' },
    { numero: 2, label: 'Média' },
    { numero: 1, label: 'Chão' },
  ];

  useEffect(() => {
    // Mock data - em produção viria da API
    const mockData: Posicao[] = [
      { id: '1', corredor: 1, prateleira: 3, produto_nome: 'Arroz Tio João 5kg', produto_sku: 'RZ-001', status: 'ok', estoque_atual: 15, estoque_minimo: 5 },
      { id: '2', corredor: 1, prateleira: 2, produto_nome: 'Feijão Carioca 1kg', produto_sku: 'FJ-002', status: 'ruptura', estoque_atual: 0, estoque_minimo: 3 },
      { id: '3', corredor: 1, prateleira: 1, status: 'ok' },
      { id: '4', corredor: 2, prateleira: 3, produto_nome: 'Óleo de Soja 900ml', produto_sku: 'OL-003', status: 'ok', estoque_atual: 8, estoque_minimo: 5 },
      { id: '5', corredor: 2, prateleira: 2, status: 'ok' },
      { id: '6', corredor: 2, prateleira: 1, status: 'ok' },
    ];
    setPosicoes(mockData);
    setLoading(false);
  }, [lojaId]);

  const getPosicaoParaCorredorEPrateleira = (corredor: number, prateleira: number) => {
    return posicoes.find(p => p.corredor === corredor && p.prateleira === prateleira);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ruptura':
        return 'bg-red-900 border-red-500';
      case 'excesso':
        return 'bg-blue-900 border-blue-500';
      default:
        return 'bg-gray-700 border-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'ruptura') return <AlertCircle size={16} className="text-red-400" />;
    return null;
  };

  const corredorAtual = corredorSelecionado || 1;
  const posicoesCorredor = posicoes.filter(p => p.corredor === corredorAtual);
  const rupturasCorredor = posicoesCorredor.filter(p => p.status === 'ruptura').length;

  if (loading) {
    return <div className="h-64 bg-gray-700 rounded animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      {/* Status do Corredor */}
      {rupturasCorredor > 0 && (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-400" size={20} />
            <div>
              <p className="font-medium text-red-300">
                {rupturasCorredor} {rupturasCorredor === 1 ? 'posição em ruptura' : 'posições em ruptura'}
              </p>
              <p className="text-sm text-red-400">Corredor {corredorAtual}</p>
            </div>
          </div>
        </div>
      )}

      {/* Mapa Visual de Gôndola */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Corredor {corredorAtual}</h3>
          <span className="text-sm text-gray-400">Vista frontal</span>
        </div>

        {/* Grades de Prateleiras */}
        <div className="space-y-3">
          {PRATELEIRAS.map(prat => (
            <div key={prat.numero}>
              <div className="text-xs text-gray-400 mb-2">{prat.label}</div>
              <div className="grid grid-cols-5 gap-2">
                {CORREDORES.map(corredor => {
                  const posicao = getPosicaoParaCorredorEPrateleira(corredor, prat.numero);
                  const isCurrentCorredor = corredor === corredorAtual;

                  return (
                    <button
                      key={`${corredor}-${prat.numero}`}
                      onClick={() => onEditPosicao?.(posicao || { id: `new-${corredor}-${prat.numero}`, corredor, prateleira: prat.numero, status: 'ok' })}
                      className={`
                        relative p-3 rounded-lg border-2 transition-all
                        ${isCurrentCorredor ? 'ring-2 ring-accent ring-offset-2 ring-offset-gray-800' : ''}
                        ${posicao ? getStatusColor(posicao.status) : 'bg-gray-800 border-gray-700 hover:border-gray-500'}
                        cursor-pointer hover:shadow-lg
                      `}
                    >
                      {posicao ? (
                        <div className="text-left">
                          {getStatusIcon(posicao.status)}
                          <p className="text-xs font-semibold text-white truncate mt-1">
                            {posicao.produto_nome ? posicao.produto_nome.substring(0, 12) : '–'}
                          </p>
                          <p className="text-xs text-gray-300">{posicao.estoque_atual || 0} un</p>
                        </div>
                      ) : (
                        <div className="text-gray-500 text-center">
                          <Plus size={16} className="mx-auto mb-1" />
                          <p className="text-xs">Vazio</p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legenda */}
        <div className="flex gap-4 text-sm pt-4 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-700 border border-gray-600 rounded" />
            <span className="text-gray-400">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-900 border border-red-500 rounded" />
            <span className="text-gray-400">Ruptura</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-900 border border-blue-500 rounded" />
            <span className="text-gray-400">Excesso</span>
          </div>
        </div>
      </div>
    </div>
  );
}
