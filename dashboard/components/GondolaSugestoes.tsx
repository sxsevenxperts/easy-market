'use client';
import { TrendingUp } from 'lucide-react';

interface GondolaSugestoesProps {
  produtoAtual: string;
}

// Category-based complementary products
const SUGESTOES_POR_CATEGORIA: Record<string, Array<{
  produto: string;
  roi: number;
  categoria: string;
  conversao: number;
}>> = {
  'Arroz': [
    { produto: 'Feijão 1kg', roi: 45, categoria: 'Alimentos Básicos', conversao: 0.62 },
    { produto: 'Óleo de Soja 900ml', roi: 38, categoria: 'Óleos e Gorduras', conversao: 0.58 },
    { produto: 'Sal 1kg', roi: 25, categoria: 'Temperos', conversao: 0.45 },
  ],
  'Feijão': [
    { produto: 'Arroz 5kg', roi: 50, categoria: 'Alimentos Básicos', conversao: 0.65 },
    { produto: 'Óleo de Soja 900ml', roi: 40, categoria: 'Óleos e Gorduras', conversao: 0.60 },
    { produto: 'Caldo de Carne', roi: 28, categoria: 'Condimentos', conversao: 0.48 },
  ],
  'Leite': [
    { produto: 'Manteiga 200g', roi: 55, categoria: 'Laticínios', conversao: 0.70 },
    { produto: 'Queijo Meia Cura', roi: 48, categoria: 'Laticínios', conversao: 0.62 },
    { produto: 'Iogurte Natural', roi: 35, categoria: 'Laticínios', conversao: 0.52 },
  ],
  'Café': [
    { produto: 'Açúcar 1kg', roi: 32, categoria: 'Adoçantes', conversao: 0.58 },
    { produto: 'Leite Integral 1L', roi: 28, categoria: 'Laticínios', conversao: 0.52 },
    { produto: 'Pão de Forma 500g', roi: 25, categoria: 'Panificados', conversao: 0.48 },
  ],
};

export default function GondolaSugestoes({ produtoAtual }: GondolaSugestoesProps) {
  // Extract category from product name
  const categoria = Object.keys(SUGESTOES_POR_CATEGORIA).find((cat) =>
    produtoAtual.toLowerCase().includes(cat.toLowerCase())
  );

  const sugestoes = categoria ? SUGESTOES_POR_CATEGORIA[categoria] : [];

  if (!sugestoes.length) {
    return (
      <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded text-center text-gray-600 dark:text-gray-400 text-sm">
        Selecione um produto para ver sugestões
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sugestoes.map((sugestao, idx) => (
        <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="font-semibold text-blue-900 dark:text-blue-300">{sugestao.produto}</div>
              <div className="text-xs text-blue-700 dark:text-blue-400">{sugestao.categoria}</div>
            </div>
            <div className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
              <TrendingUp size={12} />
              R${sugestao.roi}/sem
            </div>
          </div>
          <div className="text-xs text-gray-700 dark:text-gray-300">
            <div>Taxa de Conversão: <span className="font-semibold">{(sugestao.conversao * 100).toFixed(0)}%</span></div>
            <div className="mt-1">Impacto esperado quando colocado próximo ao {produtoAtual}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
