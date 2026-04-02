'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/dashboard';
import { apiClient } from '@/lib/api';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface Prediction {
  hora: number;
  quantidade_esperada: number;
  intervalo_confianca: [number, number];
  confianca_percentual: number;
  modelos: {
    prophet: number;
    xgboost: number;
  };
}

export default function PrevisõesPage() {
  const { loja_id } = useStore();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Bebidas');
  const [period, setPeriod] = useState('24h');

  const categories = ['Bebidas', 'Alimentos', 'Higiene', 'Limpeza', 'Perecíveis'];

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        setLoading(true);
        // Mock data - em produção, viria da API
        const mockData = Array.from({ length: 24 }, (_, i) => ({
          hora: i + 1,
          quantidade_esperada: Math.random() * 500 + 200,
          intervalo_confianca: [
            Math.random() * 300 + 100,
            Math.random() * 600 + 300,
          ] as [number, number],
          confianca_percentual: Math.random() * 20 + 80,
          modelos: {
            prophet: Math.random() * 500 + 200,
            xgboost: Math.random() * 500 + 200,
          },
        }));
        setPredictions(mockData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (loja_id) {
      fetchPredictions();
    }
  }, [loja_id, selectedCategory, period]);

  const avgConfidence =
    predictions.length > 0
      ? (
          predictions.reduce((sum, p) => sum + p.confianca_percentual, 0) /
          predictions.length
        ).toFixed(1)
      : 0;

  const predictionData = predictions.map((p) => ({
    hora: `${p.hora}h`,
    previsto: Math.round(p.quantidade_esperada),
    minimo: Math.round(p.intervalo_confianca[0]),
    maximo: Math.round(p.intervalo_confianca[1]),
    confianca: p.confianca_percentual.toFixed(0),
  }));

  const modelComparison = predictions.map((p) => ({
    hora: `${p.hora}h`,
    Prophet: Math.round(p.modelos.prophet),
    XGBoost: Math.round(p.modelos.xgboost),
    Ensemble: Math.round(p.quantidade_esperada),
  }));

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card skeleton h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Previsão de Vendas</h1>
        <p className="text-gray-400">
          O que o sistema espera vender — e em quais horários
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
        >
          <option value="6h">6 Horas</option>
          <option value="24h">24 Horas</option>
          <option value="7d">7 Dias</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-400 mb-2">Certeza da Previsão</p>
          <p className="text-3xl font-bold">{avgConfidence}%</p>
          <p className="text-xs text-green-400 mt-2">
            {Number(avgConfidence) >= 85 ? 'Alta certeza' : Number(avgConfidence) >= 70 ? 'Certeza moderada' : 'Baixa certeza'}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-400 mb-2">Itens Esperados / Hora</p>
          <p className="text-3xl font-bold">
            {predictions.length > 0
              ? Math.round(
                  predictions.reduce((sum, p) => sum + p.quantidade_esperada, 0) /
                    predictions.length
                )
              : 0}
          </p>
          <p className="text-xs text-blue-400 mt-2">Média no período selecionado</p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-400 mb-2">Margem de Segurança</p>
          <p className="text-sm font-semibold text-white">
            {predictions.length > 0
              ? Math.round(predictions[0].intervalo_confianca[0])
              : 0}{' '}
            a{' '}
            {predictions.length > 0
              ? Math.round(predictions[0].intervalo_confianca[1])
              : 0}{' '}
            itens
          </p>
          <p className="text-xs text-purple-400 mt-2">Faixa esperada de vendas</p>
        </div>
      </div>

      {/* Prediction Chart */}
      <div className="card">
        <h3 className="text-lg font-bold mb-6">Previsão por Hora</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={predictionData}>
            <defs>
              <linearGradient id="colorPrevisto" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="hora" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #4b5563',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#fff' }}
            />
            <Area
              type="monotone"
              dataKey="previsto"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorPrevisto)"
              name="Previsto"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Model Comparison */}
      <div className="card">
        <h3 className="text-lg font-bold mb-6">Validação da Previsão</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={modelComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="hora" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #4b5563',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="Prophet" name="Análise Histórica" fill="#3b82f6" />
            <Bar dataKey="XGBoost" name="Padrão de Consumo" fill="#10b981" />
            <Bar dataKey="Ensemble" name="Resultado Final" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Confidence by Hour */}
      <div className="card">
        <h3 className="text-lg font-bold mb-6">Certeza hora a hora</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {predictions.slice(0, 12).map((p, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-gray-700 rounded">
              <span className="text-sm font-medium">{p.hora + 1}h</span>
              <div className="flex-1 mx-4 bg-gray-600 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${p.confianca_percentual}%`,
                  }}
                />
              </div>
              <span className="text-sm font-bold w-12 text-right">
                {p.confianca_percentual.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="card border-l-4 border-blue-500">
        <h3 className="text-lg font-bold mb-4">O que fazer agora</h3>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <TrendingUp className="text-green-500 flex-shrink-0" size={20} />
            <p className="text-gray-300">
              Espera-se aumento de <strong>15-20%</strong> nas vendas hoje à tarde — verifique se o estoque cobre a demanda
            </p>
          </div>
          <div className="flex gap-3">
            <AlertCircle className="text-yellow-500 flex-shrink-0" size={20} />
            <p className="text-gray-300">
              Duas análises mostram divergência de <strong>8%</strong> — monitore as vendas nas próximas horas
            </p>
          </div>
          <div className="flex gap-3">
            <TrendingDown className="text-blue-500 flex-shrink-0" size={20} />
            <p className="text-gray-300">
              Previsão com <strong>{avgConfidence}% de certeza</strong> — pode planejar reposição com segurança
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
