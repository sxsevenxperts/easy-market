'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/dashboard';
import { apiClient } from '@/lib/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';

interface ReportData {
  data: string;
  faturamento: number;
  quantidade: number;
  ticket_medio: number;
}

interface CategoryData {
  categoria: string;
  faturamento: number;
  quantidade: number;
  percentual: number;
}

interface HourlyData {
  hora: number;
  faturamento: number;
  quantidade: number;
}

interface WasteData {
  produto: string;
  quantidade_perdida: number;
  valor_perdido: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const PERIODS = {
  diario: { label: 'Diário', days: 1 },
  semanal: { label: 'Semanal', days: 7 },
  quinzenal: { label: 'Quinzenal', days: 15 },
  mensal: { label: 'Mensal', days: 30 },
  '90dias': { label: '90 Dias', days: 90 },
  '6meses': { label: '6 Meses', days: 180 },
  '1ano': { label: '1 Ano', days: 365 },
};

export default function RelatoriosPage() {
  const { loja_id } = useStore();
  const [period, setPeriod] = useState('mensal');
  const [reportType, setReportType] = useState('vendas');
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<ReportData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [wasteData, setWasteData] = useState<WasteData[]>([]);
  const [stats, setStats] = useState({
    totalFaturamento: 0,
    totalQuantidade: 0,
    ticketMedio: 0,
    maiorVenda: 0,
    menorVenda: 0,
  });

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);

        // Simulated data - in production would come from API
        if (reportType === 'vendas') {
          const days = PERIODS[period as keyof typeof PERIODS].days;
          const mockSalesData = Array.from({ length: days }, (_, i) => {
            const faturamento = Math.random() * 5000 + 2000;
            const quantidade = Math.random() * 200 + 100;
            return {
              data: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000)
                .toLocaleDateString('pt-BR'),
              faturamento: Math.round(faturamento),
              quantidade: Math.round(quantidade),
              ticket_medio: Math.round(faturamento / quantidade),
            };
          });

          setSalesData(mockSalesData);

          const totalFaturamento = mockSalesData.reduce((sum, d) => sum + d.faturamento, 0);
          const totalQuantidade = mockSalesData.reduce((sum, d) => sum + d.quantidade, 0);
          const vendas = mockSalesData.map((d) => d.faturamento);

          setStats({
            totalFaturamento,
            totalQuantidade,
            ticketMedio: Math.round(totalFaturamento / totalQuantidade),
            maiorVenda: Math.max(...vendas),
            menorVenda: Math.min(...vendas),
          });
        } else if (reportType === 'categoria') {
          const mockCategoryData: CategoryData[] = [
            { categoria: 'Bebidas', faturamento: 8500, quantidade: 320, percentual: 28 },
            { categoria: 'Alimentos', faturamento: 7200, quantidade: 280, percentual: 24 },
            { categoria: 'Higiene', faturamento: 6800, quantidade: 210, percentual: 22 },
            { categoria: 'Limpeza', faturamento: 5300, quantidade: 160, percentual: 17 },
            { categoria: 'Perecíveis', faturamento: 2200, quantidade: 85, percentual: 9 },
          ];

          setCategoryData(mockCategoryData);
          setStats({
            totalFaturamento: mockCategoryData.reduce((sum, d) => sum + d.faturamento, 0),
            totalQuantidade: mockCategoryData.reduce((sum, d) => sum + d.quantidade, 0),
            ticketMedio: 0,
            maiorVenda: Math.max(...mockCategoryData.map((d) => d.faturamento)),
            menorVenda: Math.min(...mockCategoryData.map((d) => d.faturamento)),
          });
        } else if (reportType === 'horarios') {
          const mockHourlyData = Array.from({ length: 24 }, (_, i) => ({
            hora: i,
            faturamento: Math.random() * 1000 + (i >= 8 && i <= 20 ? 500 : 0),
            quantidade: Math.random() * 100 + (i >= 8 && i <= 20 ? 30 : 0),
          }));

          setHourlyData(mockHourlyData);
          setStats({
            totalFaturamento: mockHourlyData.reduce((sum, d) => sum + d.faturamento, 0),
            totalQuantidade: mockHourlyData.reduce((sum, d) => sum + d.quantidade, 0),
            ticketMedio: 0,
            maiorVenda: Math.max(...mockHourlyData.map((d) => d.faturamento)),
            menorVenda: Math.min(...mockHourlyData.map((d) => d.faturamento)),
          });
        } else if (reportType === 'desperdicio') {
          const mockWasteData: WasteData[] = [
            { produto: 'Leite Integral 1L', quantidade_perdida: 12, valor_perdido: 48 },
            { produto: 'Pão Francês', quantidade_perdida: 45, valor_perdido: 67.5 },
            { produto: 'Iogurte Natural', quantidade_perdida: 8, valor_perdido: 32 },
            { produto: 'Queijo Meia Cura', quantidade_perdida: 2, valor_perdido: 40 },
            { produto: 'Ovos Vermelhos', quantidade_perdida: 24, valor_perdido: 36 },
          ];

          setWasteData(mockWasteData);
          setStats({
            totalFaturamento: 0,
            totalQuantidade: mockWasteData.reduce((sum, d) => sum + d.quantidade_perdida, 0),
            ticketMedio: mockWasteData.reduce((sum, d) => sum + d.valor_perdido, 0),
            maiorVenda: Math.max(...mockWasteData.map((d) => d.valor_perdido)),
            menorVenda: Math.min(...mockWasteData.map((d) => d.valor_perdido)),
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (loja_id) {
      fetchReports();
    }
  }, [loja_id, period, reportType]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="card skeleton h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Relatórios</h1>
        <p className="text-gray-400">Análise detalhada de vendas, categorias, horários e desperdício</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
        >
          {Object.entries(PERIODS).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>

        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="px-4 py-2 bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
        >
          <option value="vendas">Vendas</option>
          <option value="categoria">Categorias</option>
          <option value="horarios">Horários</option>
          <option value="desperdicio">Desperdício</option>
        </select>

        <button className="btn btn-primary flex items-center justify-center gap-2">
          <Download size={18} />
          Exportar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <p className="text-sm text-gray-400 mb-2">
            {reportType === 'desperdicio' ? 'Total Perdido' : 'Faturamento Total'}
          </p>
          <p className="text-3xl font-bold">
            {reportType === 'desperdicio'
              ? `R$ ${stats.ticketMedio.toFixed(2)}`
              : `R$ ${stats.totalFaturamento.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {reportType === 'desperdicio' ? 'Período' : 'No período'}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-400 mb-2">
            {reportType === 'desperdicio' ? 'Itens Perdidos' : 'Quantidade de Itens'}
          </p>
          <p className="text-3xl font-bold">{stats.totalQuantidade.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">
            {reportType === 'desperdicio' ? 'Unidades' : 'Vendidas'}
          </p>
        </div>
      </div>

      {/* Charts */}
      {reportType === 'vendas' && salesData.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold mb-6">Evolução de Vendas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
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
              <Legend />
              <Line
                type="monotone"
                dataKey="faturamento"
                stroke="#3b82f6"
                name="Faturamento (R$)"
              />
              <Line
                type="monotone"
                dataKey="quantidade"
                stroke="#10b981"
                name="Quantidade"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {reportType === 'categoria' && categoryData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-bold mb-6">Vendas por Categoria</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ categoria, percentual }) => `${categoria} ${percentual}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="faturamento"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #4b5563',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold mb-6">Detalhes por Categoria</h3>
            <div className="space-y-3">
              {categoryData.map((cat) => (
                <div key={cat.categoria} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                  <div>
                    <p className="text-sm font-medium">{cat.categoria}</p>
                    <p className="text-xs text-gray-400">{cat.quantidade} itens</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      R$ {cat.faturamento.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-gray-400">{cat.percentual}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {reportType === 'horarios' && hourlyData.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold mb-6">Vendas por Hora do Dia</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData}>
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
              <Legend />
              <Bar dataKey="faturamento" fill="#3b82f6" name="Faturamento (R$)" />
              <Bar dataKey="quantidade" fill="#10b981" name="Quantidade" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {reportType === 'desperdicio' && wasteData.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold mb-6">Produtos com Maior Desperdício</h3>
          <div className="space-y-3">
            {wasteData.map((item) => (
              <div key={item.produto} className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{item.produto}</p>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-400">
                      R$ {item.valor_perdido.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">{item.quantidade_perdida} unidades</p>
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${(item.valor_perdido / Math.max(...wasteData.map((d) => d.valor_perdido))) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="card border-l-4 border-blue-500">
        <h3 className="text-lg font-bold mb-4">Insights do Período</h3>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <TrendingUp className="text-green-500 flex-shrink-0" size={20} />
            <p className="text-gray-300">
              Maior venda: <strong>R$ {stats.maiorVenda.toLocaleString('pt-BR', {
                maximumFractionDigits: 2,
              })}</strong>
            </p>
          </div>
          <div className="flex gap-3">
            <TrendingDown className="text-yellow-500 flex-shrink-0" size={20} />
            <p className="text-gray-300">
              Menor venda: <strong>R$ {stats.menorVenda.toLocaleString('pt-BR', {
                maximumFractionDigits: 2,
              })}</strong>
            </p>
          </div>
          {reportType === 'desperdicio' && (
            <div className="flex gap-3">
              <TrendingDown className="text-red-500 flex-shrink-0" size={20} />
              <p className="text-gray-300">
                Desperdício total do período: <strong>R$ {stats.ticketMedio.toFixed(2)}</strong> em{' '}
                {stats.totalQuantidade} itens
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
