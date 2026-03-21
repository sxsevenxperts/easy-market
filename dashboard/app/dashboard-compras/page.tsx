'use client';
import { useEffect, useState } from 'react';
import { useApiStore } from '@/store/api';

export default function Page() {
  const api = useApiStore();
  const [data, setData] = useState<any>(null);
  const [lojaId] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.fetchPurchaseAnalysis(lojaId);
        setData(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">📦 Otimizacao de Compras (EOQ + Gordura)</h1>
      {data && <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
