'use client';
import { AlertCircle } from 'lucide-react';

interface GondolaMapProps {
  corredor: number;
  onPosicaoClick: (corredor: number, prateleira: string, index: number) => void;
}

const STATUS_COLORS = {
  ok: 'bg-green-100 border-green-300',
  ruptura: 'bg-red-100 border-red-300',
  excesso: 'bg-blue-100 border-blue-300',
  vazio: 'bg-gray-100 border-gray-300',
};

const PRATELEIRAS = ['Altura', 'Média', 'Chão'];
const POSICOES_POR_CORREDOR = 5;

export default function GondolaMap({
  corredor,
  onPosicaoClick,
}: GondolaMapProps) {
  // Mock data - products at each position
  const posicoes = Array(POSICOES_POR_CORREDOR)
    .fill(null)
    .map((_, idx) => ({
      index: idx,
      altura: {
        produto: idx === 0 ? 'Arroz 5kg' : idx === 2 ? 'Óleo' : null,
        estoque: Math.floor(Math.random() * 50 + 10),
        status: idx === 0 ? 'ok' : idx === 2 ? 'ruptura' : 'vazio',
      },
      media: {
        produto: idx === 1 ? 'Feijão 1kg' : idx === 3 ? 'Sal' : null,
        estoque: Math.floor(Math.random() * 50 + 10),
        status: idx === 1 ? 'ok' : idx === 3 ? 'ok' : 'vazio',
      },
      chao: {
        produto: idx === 4 ? 'Açúcar' : idx === 2 ? 'Café' : null,
        estoque: Math.floor(Math.random() * 50 + 10),
        status: idx === 4 ? 'excesso' : idx === 2 ? 'ok' : 'vazio',
      },
    }));

  // Group ruptures by prateleira
  const rupturasPorPrateleira = PRATELEIRAS.map((prat) => {
    const rupturas = posicoes.filter(
      (p) => p[prat.toLowerCase() as keyof typeof p]?.status === 'ruptura'
    );
    return { prateleira: prat, count: rupturas.length };
  });

  return (
    <div className="space-y-6">
      {/* Grid Visual */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600">
        <div className="space-y-4">
          {PRATELEIRAS.map((prateleira) => (
            <div key={prateleira}>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Prateleira {prateleira}
              </div>
              <div className="grid grid-cols-5 gap-3">
                {posicoes.map((posicao) => {
                  const posData = posicao[prateleira.toLowerCase() as keyof typeof posicao];
                  const statusColor = STATUS_COLORS[posData?.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.vazio;

                  return (
                    <button
                      key={`${prateleira}-${posicao.index}`}
                      onClick={() => onPosicaoClick(corredor, prateleira, posicao.index)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${statusColor}`}
                    >
                      <div className="text-xs font-bold text-gray-800 truncate">
                        {posData?.produto || '—'}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {posData?.estoque || 0} un
                      </div>
                      {posData?.status === 'ruptura' && (
                        <AlertCircle className="w-4 h-4 mt-1 text-red-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumo de Rupturas */}
      {rupturasPorPrateleira.some((r) => r.count > 0) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800 dark:text-red-400">Rupturas Detectadas</h3>
          </div>
          <div className="text-sm text-red-700 dark:text-red-300 space-y-1">
            {rupturasPorPrateleira
              .filter((r) => r.count > 0)
              .map((r) => (
                <div key={r.prateleira}>
                  • Prateleira {r.prateleira}: {r.count} posição(ões) sem estoque
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
