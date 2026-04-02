'use client';

import { useState } from 'react';
import { useStore } from '@/store/dashboard';
import GondolaMap from '@/components/GondolaMap';
import { AlertCircle, Save, X } from 'lucide-react';

interface Posicao {
  id: string;
  corredor: number;
  prateleira: number;
  produto_nome?: string;
  produto_sku?: string;
  status: 'ok' | 'ruptura' | 'excesso';
  estoque_atual?: number;
  estoque_minimo?: number;
}

export default function GondolasPage() {
  const { loja_id } = useStore();
  const [corredorSelecionado, setCorredorSelecionado] = useState(1);
  const [posicaoEditando, setPosicaoEditando] = useState<Posicao | null>(null);
  const [showModal, setShowModal] = useState(false);

  const PRODUTOS_DISPONIVEIS = [
    { nome: 'Arroz Tio João 5kg', sku: 'RZ-001' },
    { nome: 'Feijão Carioca 1kg', sku: 'FJ-002' },
    { nome: 'Óleo de Soja 900ml', sku: 'OL-003' },
    { nome: 'Açúcar Cristal 1kg', sku: 'AÇ-004' },
    { nome: 'Sal Refinado 1kg', sku: 'SL-005' },
  ];

  const handleEditPosicao = (posicao: Posicao) => {
    setPosicaoEditando(posicao);
    setShowModal(true);
  };

  const handleSavePosicao = () => {
    // Em produção, aqui faria uma chamada à API
    console.log('Salvando posição:', posicaoEditando);
    setShowModal(false);
    setPosicaoEditando(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestão de Gôndola</h1>
        <p className="text-gray-400">Mapa visual das posições — identifique rupturas e realoque produtos</p>
      </div>

      {/* Filtro de Corredor */}
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4, 5].map(corredor => (
          <button
            key={corredor}
            onClick={() => setCorredorSelecionado(corredor)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              corredorSelecionado === corredor
                ? 'bg-accent text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Corredor {corredor}
          </button>
        ))}
      </div>

      {/* Mapa */}
      <GondolaMap
        lojaId={loja_id}
        corredorSelecionado={corredorSelecionado}
        onEditPosicao={handleEditPosicao}
      />

      {/* Dicas */}
      <div className="card border-l-4 border-blue-500 space-y-3">
        <div className="flex gap-2">
          <AlertCircle className="text-blue-400 flex-shrink-0" size={20} />
          <div>
            <p className="font-medium text-white">Como usar</p>
            <ul className="text-sm text-gray-400 space-y-1 mt-2">
              <li>• Clique em qualquer posição para cadastrar ou editar um produto</li>
              <li>• Posições em vermelho indicam ruptura — repor com urgência</li>
              <li>• Use para planejar layouts e realocar itens de baixo giro</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      {showModal && posicaoEditando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {posicaoEditando.produto_nome ? 'Editar Posição' : 'Nova Posição'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-700 p-3 rounded text-sm">
              <p className="text-gray-300">
                Corredor <strong>{posicaoEditando.corredor}</strong> · Prateleira{' '}
                <strong>
                  {posicaoEditando.prateleira === 3 ? 'Altura' : posicaoEditando.prateleira === 2 ? 'Média' : 'Chão'}
                </strong>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Produto</label>
                <select
                  value={posicaoEditando.produto_sku || ''}
                  onChange={(e) => {
                    const produto = PRODUTOS_DISPONIVEIS.find(p => p.sku === e.target.value);
                    setPosicaoEditando({
                      ...posicaoEditando,
                      produto_sku: e.target.value,
                      produto_nome: produto?.nome,
                    });
                  }}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-accent"
                >
                  <option value="">Selecionar produto</option>
                  {PRODUTOS_DISPONIVEIS.map(p => (
                    <option key={p.sku} value={p.sku}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Estoque Atual</label>
                  <input
                    type="number"
                    value={posicaoEditando.estoque_atual || 0}
                    onChange={(e) => setPosicaoEditando({ ...posicaoEditando, estoque_atual: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mínimo</label>
                  <input
                    type="number"
                    value={posicaoEditando.estoque_minimo || 0}
                    onChange={(e) => setPosicaoEditando({ ...posicaoEditando, estoque_minimo: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={posicaoEditando.status}
                  onChange={(e) => setPosicaoEditando({ ...posicaoEditando, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-accent"
                >
                  <option value="ok">OK</option>
                  <option value="ruptura">Ruptura</option>
                  <option value="excesso">Excesso</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSavePosicao}
                className="btn btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Salvar
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-secondary flex-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
