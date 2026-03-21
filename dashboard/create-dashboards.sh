#!/bin/bash

# Criar todos os 5 dashboards em paralelo

# Dashboard Predicoes
cat > app/dashboard-predicoes/page.tsx << 'EOF'
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
        setData(res.data);
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
EOF

# Dashboard Perdas
cat > app/dashboard-perdas/page.tsx << 'EOF'
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
        const res = await api.fetchLossRate(lojaId);
        setData(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">📉 Taxa de Perda (Redução Estratégica)</h1>
      {data && <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
EOF

# Dashboard Gondolas
cat > app/dashboard-gondolas/page.tsx << 'EOF'
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
        const res = await api.fetchGondolaComplete(lojaId);
        setData(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">🏪 Otimizacao de Gondolas</h1>
      {data && <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
EOF

# Dashboard Compras
cat > app/dashboard-compras/page.tsx << 'EOF'
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
EOF

# Dashboard Seguranca
cat > app/dashboard-seguranca/page.tsx << 'EOF'
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
        const res = await api.fetchSecurityConfig(lojaId);
        setData(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">🛡️ Configuracao de Seguranca (Taxa Customizavel)</h1>
      {data && <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
EOF

echo "✅ 5 Dashboards criados!"
