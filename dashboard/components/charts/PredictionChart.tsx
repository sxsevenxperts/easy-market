'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { apiClient } from '@/lib/api';

interface PredictionData {
  hora: number;
  quantidade_esperada: number;
  intervalo_confianca: [number, number];
  confianca_percentual: number;
}

export default function PredictionChart({ lojaId }: { lojaId: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        // Mock data for now (in production, fetch from /api/v1/previsoes/...)
        const mockData = Array.from({ length: 24 }, (_, i) => ({
          hora: `${i + 1}h`,
          real: Math.random() * 500 + 200,
          previsto: Math.random() * 500 + 200,
          minimo: Math.random() * 300 + 100,
          maximo: Math.random() * 600 + 300,
        }));
        setData(mockData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [lojaId]);

  if (loading) {
    return (
      <div className="card">
        <div className="h-80 bg-gray-700 rounded skeleton" />
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-bold mb-6">Previsão vs Real (24h)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrevisto" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Area
            type="monotone"
            dataKey="previsto"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorPrevisto)"
            name="Previsto"
          />
          <Area
            type="monotone"
            dataKey="real"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorReal)"
            name="Real"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
