'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiClient } from '@/lib/api';

interface SalesData {
  data: string;
  total_faturamento: number;
  total_quantidade: number;
}

export default function SalesChart({ lojaId }: { lojaId: string }) {
  const [data, setData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const response = await apiClient.get(`/relatorios/${lojaId}/vendas?periodo=semanal`);
        const chartData = response.data.dados?.map((item: any) => ({
          data: new Date(item.data).toLocaleDateString('pt-BR'),
          faturamento: item.total_faturamento,
          quantidade: item.total_quantidade,
        })) || [];
        setData(chartData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
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
      <h3 className="text-lg font-bold mb-6">Vendas (Últimos 7 Dias)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="data" stroke="#9ca3af" />
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
          <Line
            type="monotone"
            dataKey="faturamento"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Faturamento (R$)"
          />
          <Line
            type="monotone"
            dataKey="quantidade"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Quantidade (unidades)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
