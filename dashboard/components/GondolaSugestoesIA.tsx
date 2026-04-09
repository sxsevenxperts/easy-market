'use client';
import { Brain, TrendingUp } from 'lucide-react';

interface GondolaSugestoesIAProps {
  produtoAtual: string;
  corredorId: number;
}

// Mock behavioral analysis data
const ANALISE_COMPORTAMENTO: Record<string, Array<{
  produto: string;
  lift: number;
  frequencia: number;
  roi: number;
  diasHistorico: number;
}>> = {
  'Arroz': [
    { produto: 'Feijão 1kg', lift: 1.82, frequencia: 73, roi: 52, diasHistorico: 90 },
    { produto: 'Óleo de Soja 900ml', lift: 1.65, frequencia: 58, roi: 44, diasHistorico: 90 },
    { produto: 'Sal 1kg', lift: 1.34, frequencia: 42, roi: 28, diasHistorico: 90 },
  ],
  'Feijão': [
    { produto: 'Arroz 5kg', lift: 1.85, frequencia: 76, roi: 56, diasHistorico: 90 },
    { produto: 'Óleo de Soja 900ml', lift: 1.68, frequencia: 61, roi: 48, diasHistorico: 90 },
    { produto: 'Caldo de Carne', lift: 1.52, frequencia: 48, roi: 35, diasHistorico: 90 },
  ],
  'Leite': [
    { produto: 'Manteiga 200g', lift: 1.92, frequencia: 81, roi: 64, diasHistorico: 90 },
    { produto: 'Iogurte Natural', lift: 1.71, frequencia: 65, roi: 50, diasHistorico: 90 },
    { produto: 'Queijo Meia Cura', lift: 1.48, frequencia: 52, roi: 40, diasHistorico: 90 },
  ],
  'Café': [
    { produto: 'Açúcar 1kg', lift: 1.58, frequencia: 54, roi: 38, diasHistorico: 90 },
    { produto: 'Leite Integral 1L', lift: 1.45, frequencia: 48, roi: 32, diasHistorico: 90 },
    { produto: 'Pão de Forma 500g', lift: 1.35, frequencia: 40, roi: 28, diasHistorico: 90 },
  ],
};

export default function GondolaSugestoesIA({
  produtoAtual,
  corredorId,
}: GondolaSugestoesIAProps) {
  // Extract category from product name
  const categoria = Object.keys(ANALISE_COMPORTAMENTO).find((cat) =>
    produtoAtual.toLowerCase().includes(cat.toLowerCase())
  );

  const analises = categoria ? ANALISE_COMPORTAMENTO[categoria] : [];

  if (!analises.length) {
    return (
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded text-center text-purple-600 dark:text-purple-400 text-sm">
        Selecione um produto para análise comportamental
      </div>
    );
  }

  // Sort by lift (multiplicative effect)
  const analisesOrdenadas = [...analises].sort((a, b) => b.lift - a.lift);

  return (
    <div className="space-y-3">
      {analisesOrdenadas.map((analise, idx) => (
        <div
          key={idx}
          className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-3 rounded-lg"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                <Brain size={14} className="text-purple-600" />
                {analise.produto}
              </div>
            </div>
            <div className="flex items-center gap-1 bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap ml-2">
              <TrendingUp size={12} />
              {analise.roi}%
            </div>
          </div>

          <div className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
            <div className="flex justify-between">
              <span>Efeito de Proximidade (Lift):</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {analise.lift.toFixed(2)}x
              </span>
            </div>

            <div className="flex justify-between">
              <span>Frequência de Compra Conjunta:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {analise.frequencia}%
              </span>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-purple-200 dark:border-purple-700">
              Baseado em {analise.diasHistorico} dias de histórico de compras
            </div>
          </div>

          <div className="mt-2 p-2 bg-white dark:bg-slate-800 rounded text-xs text-gray-600 dark:text-gray-400">
            <strong>O que significa:</strong> Quando {analise.produto} fica perto de {produtoAtual}, há um aumento de{' '}
            <span className="font-bold">{((analise.lift - 1) * 100).toFixed(0)}%</span> na probabilidade de compra conjunta
          </div>
        </div>
      ))}
    </div>
  );
}
