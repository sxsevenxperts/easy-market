'use client';

import { TrendingUp, AlertCircle } from 'lucide-react';

interface Sugestao {
  tipo: 'upsell' | 'cross-sell';
  produto_nome: string;
  produto_sku: string;
  motivo: string;
  impacto_receita_semanal: number;
  taxa_conversao_esperada: number;
}

interface GondolaSuestoesProps {
  produtoAtual?: {
    nome: string;
    sku: string;
    categoria: string;
  };
  localizacao: {
    corredor: number;
    prateleira: number;
  };
}

export default function GondolaSugestoes({ produtoAtual, localizacao }: GondolaSuestoesProps) {
  // Base de dados de sugestões por produto
  const sugestoesPorCategoria: Record<string, Sugestao[]> = {
    arroz: [
      {
        tipo: 'cross-sell',
        produto_nome: 'Feijão Carioca 1kg',
        produto_sku: 'FJ-002',
        motivo: 'Arroz + Feijão é a dupla mais vendida — aumenta ticket',
        impacto_receita_semanal: 180,
        taxa_conversao_esperada: 0.68,
      },
      {
        tipo: 'cross-sell',
        produto_nome: 'Óleo de Soja 900ml',
        produto_sku: 'OL-003',
        motivo: 'Clientes que compram arroz frequentemente compram óleo',
        impacto_receita_semanal: 125,
        taxa_conversao_esperada: 0.54,
      },
      {
        tipo: 'upsell',
        produto_nome: 'Arroz Tipo 1 10kg',
        produto_sku: 'RZ-010',
        motivo: 'Clientes de volume — maior margem',
        impacto_receita_semanal: 220,
        taxa_conversao_esperada: 0.32,
      },
    ],
    oleo: [
      {
        tipo: 'cross-sell',
        produto_nome: 'Arroz Tio João 5kg',
        produto_sku: 'RZ-001',
        motivo: 'Pair natural — óleo se vende junto com arroz',
        impacto_receita_semanal: 150,
        taxa_conversao_esperada: 0.65,
      },
      {
        tipo: 'upsell',
        produto_nome: 'Azeite Extra Virgem 500ml',
        produto_sku: 'AZ-005',
        motivo: 'Premium — quem compra óleo comum pode pagar mais em gourmet',
        impacto_receita_semanal: 280,
        taxa_conversao_esperada: 0.22,
      },
    ],
    feijao: [
      {
        tipo: 'cross-sell',
        produto_nome: 'Arroz Tio João 5kg',
        produto_sku: 'RZ-001',
        motivo: 'Combinação essencial — dupla de ouro',
        impacto_receita_semanal: 175,
        taxa_conversao_esperada: 0.7,
      },
      {
        tipo: 'cross-sell',
        produto_nome: 'Sal Refinado 1kg',
        produto_sku: 'SL-005',
        motivo: 'Ingredientes básicos frequentemente comprados juntos',
        impacto_receita_semanal: 95,
        taxa_conversao_esperada: 0.48,
      },
    ],
  };

  // Detectar categoria do produto atual
  const categoria = produtoAtual?.categoria?.toLowerCase() || '';
  const sugestoes = sugestoesPorCategoria[categoria] || [];

  if (sugestoes.length === 0) {
    return null;
  }

  // Ordenar por impacto de receita
  const sugestoesOrdenadas = [...sugestoes].sort(
    (a, b) => b.impacto_receita_semanal - a.impacto_receita_semanal
  );

  const totalImpacto = sugestoesOrdenadas.reduce((sum, s) => sum + s.impacto_receita_semanal, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-4 bg-green-900/20 border border-green-700 rounded-lg">
        <TrendingUp className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="font-semibold text-green-300">
            Oportunidade: +R$ {totalImpacto}/semana na gôndola {localizacao.corredor}
          </p>
          <p className="text-sm text-green-400 mt-1">
            Realocando produtos estrategicamente nesta posição
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-300">Produtos sugeridos</h4>

        {sugestoesOrdenadas.map((sugestao, idx) => (
          <div
            key={sugestao.produto_sku}
            className="p-3 bg-gray-700 rounded-lg border border-gray-600 hover:border-green-600 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      sugestao.tipo === 'upsell'
                        ? 'bg-purple-900/50 text-purple-300'
                        : 'bg-blue-900/50 text-blue-300'
                    }`}
                  >
                    {sugestao.tipo === 'upsell' ? 'Upsell' : 'Cross-sell'}
                  </span>
                  <span className="text-xs text-gray-500">#{idx + 1} Prioridade</span>
                </div>
                <p className="font-medium text-white text-sm">{sugestao.produto_nome}</p>
                <p className="text-xs text-gray-400 mt-1">{sugestao.motivo}</p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-bold text-green-400 text-sm">
                  +R$ {sugestao.impacto_receita_semanal}
                </p>
                <p className="text-xs text-gray-400">/semana</p>
                <p className="text-xs text-gray-500 mt-1">
                  {(sugestao.taxa_conversao_esperada * 100).toFixed(0)}% conversão
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dica */}
      <div className="flex gap-2 text-xs text-gray-400 p-2 bg-gray-800 rounded">
        <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
        <p>
          Dica: Colocar produtos complementares próximos aumenta o ticket médio por cliente em até
          22%
        </p>
      </div>
    </div>
  );
}
