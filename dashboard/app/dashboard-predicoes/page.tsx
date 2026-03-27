'use client';
import { useEffect, useState } from 'react';
import { useApiStore } from '@/store/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, Users } from 'lucide-react';

export default function Page() {
  const api = useApiStore();
  const [data, setData] = useState<any>(null);
  const [lojaId] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.fetchPredictionsAnalysis(lojaId, 1);
        setData(res);
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">📊 Predicoes (50 Variações | 90-95% Assertiveness)</h1>
      {data && <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
