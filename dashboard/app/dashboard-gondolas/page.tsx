'use client';
import { useState } from 'react';
import { X, Grid3X3, AlertCircle } from 'lucide-react';
import GondolaMap from '@/components/GondolaMap';
import GondolaSugestoes from '@/components/GondolaSugestoes';
import GondolaSugestoesIA from '@/components/GondolaSugestoesIA';

const PRODUTOS_DISPONIVEIS = [
  'Arroz 5kg',
  'Feijão 1kg',
  'Óleo de Soja 900ml',
  'Sal 1kg',
  'Açúcar 1kg',
  'Café 500g',
  'Leite Integral 1L',
  'Manteiga 200g',
  'Pão de Forma 500g',
];

export default function DashboardGondolas() {
  const [selectedCorredor, setSelectedCorredor] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPosicao, setSelectedPosicao] = useState<{
    corredor: number;
    prateleira: string;
    index: number;
  } | null>(null);
  const [usarIA, setUsarIA] = useState(false);

  const [formData, setFormData] = useState({
    produto: '',
    estoque_atual: '',
    estoque_minimo: '',
    status: 'ok',
  });

  const handlePosicaoClick = (corredor: number, prateleira: string, index: number) => {
    setSelectedPosicao({ corredor, prateleira, index });
    setFormData({
      produto: `Posição ${prateleira} - Item ${index + 1}`,
      estoque_atual: Math.floor(Math.random() * 50 + 10).toString(),
      estoque_minimo: '5',
      status: 'ok',
    });
    setIsModalOpen(true);
  };

  const handleFecharModal = () => {
    setIsModalOpen(false);
    setSelectedPosicao(null);
  };

  const handleSalvarPosicao = () => {
    console.log('Salvando posição:', selectedPosicao, formData);
    handleFecharModal();
  };

  return (
    <div className="p-8 bg-white dark:bg-slate-950 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 dark:text-white">
          <Grid3X3 className="inline mr-2" />
          Otimização de Gôndolas
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Visualize e otimize a disposição de produtos nas prateleiras com sugestões de upsell e cross-sell
        </p>
      </div>

      {/* Filtro de Corredores */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {[1, 2, 3, 4, 5].map((corredor) => (
          <button
            key={corredor}
            onClick={() => setSelectedCorredor(corredor)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCorredor === corredor
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
            }`}
          >
            Corredor {corredor}
          </button>
        ))}
      </div>

      {/* Mapa de Gôndola */}
      <div className="mb-8 bg-gray-50 dark:bg-slate-900 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Mapa Visual - Corredor {selectedCorredor}</h2>
        <GondolaMap
          corredor={selectedCorredor}
          onPosicaoClick={handlePosicaoClick}
        />
      </div>

      {/* Modal de Edição */}
      {isModalOpen && selectedPosicao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b dark:border-slate-700">
              <h2 className="text-2xl font-bold dark:text-white">
                Editar Posição - Corredor {selectedPosicao.corredor} / {selectedPosicao.prateleira}
              </h2>
              <button
                onClick={handleFecharModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-8">
                {/* Left: Form */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 dark:text-white">Informações da Posição</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Produto
                      </label>
                      <select
                        value={formData.produto}
                        onChange={(e) => setFormData({ ...formData, produto: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                      >
                        <option value="">Selecione um produto</option>
                        {PRODUTOS_DISPONIVEIS.map((prod) => (
                          <option key={prod} value={prod}>
                            {prod}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estoque Atual
                      </label>
                      <input
                        type="number"
                        value={formData.estoque_atual}
                        onChange={(e) => setFormData({ ...formData, estoque_atual: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estoque Mínimo
                      </label>
                      <input
                        type="number"
                        value={formData.estoque_minimo}
                        onChange={(e) => setFormData({ ...formData, estoque_minimo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                      >
                        <option value="ok">OK</option>
                        <option value="ruptura">Ruptura</option>
                        <option value="excesso">Excesso</option>
                      </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSalvarPosicao}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={handleFecharModal}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Suggestions */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold dark:text-white">Sugestões</h3>
                    <button
                      onClick={() => setUsarIA(!usarIA)}
                      className={`ml-auto px-3 py-1 rounded text-sm font-medium transition-colors ${
                        usarIA
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-300 dark:bg-slate-700 text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-slate-600'
                      }`}
                    >
                      {usarIA ? '🤖 IA Ativa' : '📋 Padrão'}
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {usarIA ? (
                      <GondolaSugestoesIA
                        produtoAtual={formData.produto}
                        corredorId={selectedPosicao.corredor}
                      />
                    ) : (
                      <GondolaSugestoes produtoAtual={formData.produto} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
