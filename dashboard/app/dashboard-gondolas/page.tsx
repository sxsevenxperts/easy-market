'use client';

import { useState } from 'react';
import { AlertCircle, Grid3X3, TrendingUp, Brain, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface Posicao {
  id: string;
  corredor: number;
  prateleira: 'Altura' | 'Média' | 'Chão';
  produto_nome?: string;
  estoque_atual?: number;
  estoque_minimo?: number;
  status: 'ok' | 'ruptura' | 'excesso';
}

const PRODUTOS = [
  'Arroz 5kg',
  'Feijão 1kg',
  'Óleo de Soja 900ml',
  'Sal 1kg',
  'Açúcar 1kg',
];

export default function GondolasPage() {
  const toast = useToast();
  const [corredorSelecionado, setCorredorSelecionado] = useState(1);
  const [posicaoEditando, setPosicaoEditando] = useState<Posicao | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [usarIA, setUsarIA] = useState(false);

  // Atalhos de teclado
  useKeyboardShortcuts([
    {
      key: 'Escape',
      callback: () => {
        if (showModal) {
          setShowModal(false);
          setPosicaoEditando(null);
        }
      },
    },
  ]);

  const [formData, setFormData] = useState({
    produto: '',
    estoque_atual: '',
    estoque_minimo: '',
  });

  // TODO: substituir por fetch da API — /otimizacao-gondolas/layout/:lojaId
  // Mock temporário para demonstração visual
  const posicoes: Posicao[] = [
    { id: '1', corredor: 1, prateleira: 'Altura', produto_nome: 'Arroz 5kg', estoque_atual: 12, estoque_minimo: 5, status: 'ok' },
    { id: '2', corredor: 1, prateleira: 'Média', produto_nome: 'Feijão 1kg', estoque_atual: 0, estoque_minimo: 3, status: 'ruptura' },
    { id: '3', corredor: 1, prateleira: 'Chão', produto_nome: 'Óleo', estoque_atual: 25, estoque_minimo: 8, status: 'excesso' },
  ];

  const handleEditarPosicao = (pos: Posicao) => {
    setPosicaoEditando(pos);
    setFormData({
      produto: pos.produto_nome || '',
      estoque_atual: pos.estoque_atual?.toString() || '',
      estoque_minimo: pos.estoque_minimo?.toString() || '',
    });
    setShowModal(true);
  };

  const handleFechar = () => {
    setShowModal(false);
    setPosicaoEditando(null);
  };

  const handleSalvar = () => {
    console.log('Salvando:', formData);
    toast.success(`Posição salva com sucesso!`);
    handleFechar();
  };

  const posicoesPorPrateleira = {
    Altura: posicoes.filter(p => p.prateleira === 'Altura' && p.corredor === corredorSelecionado),
    Média: posicoes.filter(p => p.prateleira === 'Média' && p.corredor === corredorSelecionado),
    Chão: posicoes.filter(p => p.prateleira === 'Chão' && p.corredor === corredorSelecionado),
  };

  const statusColors = {
    ok: 'bg-green-100 border-green-300 text-green-900',
    ruptura: 'bg-red-100 border-red-300 text-red-900',
    excesso: 'bg-blue-100 border-blue-300 text-blue-900',
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Grid3X3 size={32} />
          Otimização de Gôndolas
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Visualize e otimize a disposição de produtos com sugestões de upsell e cross-sell
        </p>
      </div>

      {/* Botões de Corredores */}
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4, 5].map(corredor => (
          <button
            key={corredor}
            onClick={() => setCorredorSelecionado(corredor)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              corredorSelecionado === corredor
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-300'
            }`}
          >
            Corredor {corredor}
          </button>
        ))}
      </div>

      {/* Mapa Visual */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-slate-700">
        <h2 className="text-xl font-semibold mb-4">Mapa Visual - Corredor {corredorSelecionado}</h2>
        <div className="space-y-4">
          {(['Altura', 'Média', 'Chão'] as const).map(prateleira => (
            <div key={prateleira}>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prateleira {prateleira}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {Array(5).fill(null).map((_, idx) => {
                  const pos = posicoesPorPrateleira[prateleira]?.[idx];
                  const isEmpty = !pos || !pos.produto_nome;
                  return (
                    <button
                      key={idx}
                      onClick={() => pos && handleEditarPosicao(pos)}
                      className={`p-3 rounded border-2 text-sm text-center cursor-pointer transition-all ${
                        isEmpty
                          ? 'bg-gray-50 dark:bg-slate-700 border-dashed border-gray-300 dark:border-slate-600'
                          : `${statusColors[pos!.status]}`
                      }`}
                    >
                      <div className="font-bold truncate">{pos?.produto_nome || '—'}</div>
                      <div className="text-xs mt-1">{pos?.estoque_atual || 0} un</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alertas */}
      {posicoes.some(p => p.status === 'ruptura') && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-400">Rupturas Detectadas</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Existem produtos sem estoque que precisam reposição urgente
            </p>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && posicaoEditando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                Editar Posição - Corredor {posicaoEditando.corredor} / {posicaoEditando.prateleira}
              </h2>
              <button onClick={handleFechar} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Produto</label>
                <select
                  value={formData.produto}
                  onChange={(e) => setFormData({ ...formData, produto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
                >
                  <option value="">Selecione</option>
                  {PRODUTOS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Estoque Atual</label>
                  <input
                    type="number"
                    value={formData.estoque_atual}
                    onChange={(e) => setFormData({ ...formData, estoque_atual: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    value={formData.estoque_minimo}
                    onChange={(e) => setFormData({ ...formData, estoque_minimo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={18} className="text-blue-600" />
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300">Sugestões</h3>
                  <button
                    onClick={() => setUsarIA(!usarIA)}
                    className={`ml-auto px-2 py-1 rounded text-xs font-medium ${
                      usarIA
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-300 dark:bg-slate-600 text-gray-800 dark:text-white'
                    }`}
                  >
                    {usarIA ? '🤖 IA' : '📋 Padrão'}
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  {usarIA ? (
                    <>
                      <div className="flex justify-between">
                        <span>Feijão 1kg - Lift: <strong>1.82x</strong></span>
                        <span className="text-green-600 font-bold">+R$52/sem</span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        73% de co-compra baseado em 90 dias de histórico
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Feijão 1kg</span>
                        <span className="text-green-600 font-bold">+R$45/sem</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Óleo de Soja</span>
                        <span className="text-green-600 font-bold">+R$38/sem</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSalvar}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium"
                >
                  Salvar
                </button>
                <button
                  onClick={handleFechar}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-slate-700 text-gray-800 dark:text-white py-2 rounded-lg font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
