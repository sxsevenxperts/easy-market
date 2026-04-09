'use client';

import { useEffect, useState, useMemo } from 'react';
import { DollarSign, TrendingUp, BarChart3, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useStore } from '@/store/dashboard';

interface CenarioAnalise {
  nome: string;
  descricao: string;
  perda_mensal: number;
  reducao_percentual: number;
  perda_residual: number;
  vendas_resgatadas: number;
  lucro_adicional: number;
  impostos_adicionais: number;
  economia_fiscal_doacao: number;
  custos_descarte: number;
  impacto_total: number;
  impacto_anual: number;
}

interface ConfiguracaoFiscal {
  lucro_operacional_mensal: number;
  margem_media_percentual: number;
  aliquota_ir_efetiva: number;
  aliquota_csll: number;
  icms_estadual: number;
  regime_tributacao: 'lucro_real' | 'lucro_presumido';
  limite_deducao_doacao: number; // 2% do lucro operacional
  economia_icms_conveniada: boolean;
}

export default function PainelAnaliseFiscal() {
  const { loja_id } = useStore();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<ConfiguracaoFiscal>({
    lucro_operacional_mensal: 50000,
    margem_media_percentual: 30,
    aliquota_ir_efetiva: 15,
    aliquota_csll: 9,
    icms_estadual: 7,
    regime_tributacao: 'lucro_real',
    limite_deducao_doacao: 1000, // 2% de 50k
    economia_icms_conveniada: true,
  });
  const [perdaMensual, setPerdaMensual] = useState(10000);
  const [cenarios, setCenarios] = useState<CenarioAnalise[]>([]);
  const [graficoCenarios, setGraficoCenarios] = useState<any[]>([]);

  useEffect(() => {
    const calcularCenarios = () => {
      const cenariosList: CenarioAnalise[] = [];

      // Cenário 1: Status Quo
      const doacao60 = perdaMensual * 0.6;
      const descarte40 = perdaMensual * 0.4;
      const deducaoIRCSLL = Math.min(doacao60 * 0.02, config.limite_deducao_doacao);
      const economiaICSM = config.economia_icms_conveniada ? doacao60 * (config.icms_estadual / 100) : 0;
      const custoDescarte = descarte40 * 0.05;
      const impactoStatusQuo = -(perdaMensual - deducaoIRCSLL - economiaICSM - custoDescarte);

      cenariosList.push({
        nome: 'Status Quo',
        descricao: 'Sem mudanças - aceitar perdas e doações',
        perda_mensal: perdaMensual,
        reducao_percentual: 0,
        perda_residual: perdaMensual,
        vendas_resgatadas: 0,
        lucro_adicional: 0,
        impostos_adicionais: 0,
        economia_fiscal_doacao: deducaoIRCSLL + economiaICSM,
        custos_descarte: custoDescarte,
        impacto_total: impactoStatusQuo,
        impacto_anual: impactoStatusQuo * 12,
      });

      // Cenário 2: Reduzir 25%
      const perdaReduzida25 = perdaMensual * 0.75;
      const vendas25 = perdaMensual * 0.25;
      const lucroBruto25 = vendas25 * (config.margem_media_percentual / 100);
      const impostos25 = lucroBruto25 * ((config.aliquota_ir_efetiva + config.aliquota_csll) / 100);
      const lucroLiquido25 = lucroBruto25 - impostos25;
      const doacao25 = perdaReduzida25 * 0.6;
      const deducao25 = Math.min(doacao25 * 0.02, config.limite_deducao_doacao);
      const economia25 = lucroLiquido25 + deducao25 - (perdaReduzida25 * 0.05);

      cenariosList.push({
        nome: '-25% Perdas',
        descricao: 'Markdown + gestão inteligente',
        perda_mensal: perdaReduzida25,
        reducao_percentual: 25,
        perda_residual: perdaReduzida25,
        vendas_resgatadas: vendas25,
        lucro_adicional: lucroLiquido25,
        impostos_adicionais: impostos25,
        economia_fiscal_doacao: deducao25,
        custos_descarte: perdaReduzida25 * 0.05,
        impacto_total: economia25 - impactoStatusQuo,
        impacto_anual: (economia25 - impactoStatusQuo) * 12,
      });

      // Cenário 3: Reduzir 50%
      const perdaReduzida50 = perdaMensual * 0.5;
      const vendas50 = perdaMensual * 0.5;
      const lucroBruto50 = vendas50 * (config.margem_media_percentual / 100);
      const impostos50 = lucroBruto50 * ((config.aliquota_ir_efetiva + config.aliquota_csll) / 100);
      const lucroLiquido50 = lucroBruto50 - impostos50;
      const doacao50 = perdaReduzida50 * 0.6;
      const deducao50 = Math.min(doacao50 * 0.02, config.limite_deducao_doacao);
      const economia50 = lucroLiquido50 + deducao50 - (perdaReduzida50 * 0.05);

      cenariosList.push({
        nome: '-50% Perdas',
        descricao: 'Implementação completa de estratégias',
        perda_mensal: perdaReduzida50,
        reducao_percentual: 50,
        perda_residual: perdaReduzida50,
        vendas_resgatadas: vendas50,
        lucro_adicional: lucroLiquido50,
        impostos_adicionais: impostos50,
        economia_fiscal_doacao: deducao50,
        custos_descarte: perdaReduzida50 * 0.05,
        impacto_total: economia50 - impactoStatusQuo,
        impacto_anual: (economia50 - impactoStatusQuo) * 12,
      });

      // Cenário 4: Reduzir 75%
      const perdaReduzida75 = perdaMensual * 0.25;
      const vendas75 = perdaMensual * 0.75;
      const lucroBruto75 = vendas75 * (config.margem_media_percentual / 100);
      const impostos75 = lucroBruto75 * ((config.aliquota_ir_efetiva + config.aliquota_csll) / 100);
      const lucroLiquido75 = lucroBruto75 - impostos75;
      const doacao75 = perdaReduzida75 * 0.6;
      const deducao75 = Math.min(doacao75 * 0.02, config.limite_deducao_doacao);
      const economia75 = lucroLiquido75 + deducao75 - (perdaReduzida75 * 0.05);

      cenariosList.push({
        nome: '-75% Perdas',
        descricao: 'Excelência operacional',
        perda_mensal: perdaReduzida75,
        reducao_percentual: 75,
        perda_residual: perdaReduzida75,
        vendas_resgatadas: vendas75,
        lucro_adicional: lucroLiquido75,
        impostos_adicionais: impostos75,
        economia_fiscal_doacao: deducao75,
        custos_descarte: perdaReduzida75 * 0.05,
        impacto_total: economia75 - impactoStatusQuo,
        impacto_anual: (economia75 - impactoStatusQuo) * 12,
      });

      setCenarios(cenariosList);

      // Preparar dados para gráfico
      const dadosGrafico = cenariosList.map(s => ({
        nome: s.nome,
        impacto: s.impacto_total,
        impacto_anual: s.impacto_anual,
      }));
      setGraficoCenarios(dadosGrafico);
    };

    setLoading(false);
    calcularCenarios();
  }, [perdaMensual, config]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="card skeleton h-96" />
      </div>
    );
  }

  const melhorCenario = cenarios.reduce((best, current) =>
    current.impacto_total > best.impacto_total ? current : best
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Análise Fiscal: ROI de Redução de Perdas</h1>
        <p className="text-gray-400 text-sm mt-1">Comparação financeira: reduzir perdas vs aceitar deduções fiscais</p>
      </div>

      {/* Configurações */}
      <div className="card bg-gray-900/50 p-4">
        <h3 className="font-semibold mb-3">Configurações</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Faturamento mensal (R$)</label>
            <input
              type="number"
              value={config.lucro_operacional_mensal}
              onChange={e => setConfig({ ...config, lucro_operacional_mensal: parseFloat(e.target.value) })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Margem média (%)</label>
            <input
              type="number"
              value={config.margem_media_percentual}
              onChange={e => setConfig({ ...config, margem_media_percentual: parseFloat(e.target.value) })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Perda mensal (R$)</label>
            <input
              type="number"
              value={perdaMensual}
              onChange={e => setPerdaMensual(parseFloat(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Regime tributário</label>
            <select
              value={config.regime_tributacao}
              onChange={e => setConfig({ ...config, regime_tributacao: e.target.value as any })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            >
              <option value="lucro_real">Lucro Real</option>
              <option value="lucro_presumido">Lucro Presumido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recomendação */}
      <div className="card bg-green-900/20 border-green-700 p-4">
        <h3 className="font-semibold text-green-300 mb-2">🎯 Recomendação</h3>
        <p className="text-sm text-green-200 mb-2">
          <strong>{melhorCenario.nome}:</strong> {melhorCenario.descricao}
        </p>
        <p className="text-lg font-bold text-green-400">
          Ganho anual: +R$ {melhorCenario.impacto_anual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
        </p>
      </div>

      {/* Gráfico Comparativo */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Impacto Financeiro por Cenário</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={graficoCenarios}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="nome" stroke="#999" />
            <YAxis stroke="#999" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #444' }}
              formatter={value => `R$ ${value.toLocaleString('pt-BR')}`}
            />
            <Legend />
            <Bar dataKey="impacto" fill="#10b981" name="Impacto Mensal" />
            <Bar dataKey="impacto_anual" fill="#3b82f6" name="Impacto Anual" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela Detalhada */}
      <div className="card overflow-hidden">
        <h2 className="text-xl font-bold mb-4 px-4 pt-4">Análise Detalhada</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-900/50">
                <th className="px-4 py-3 text-left font-semibold">Cenário</th>
                <th className="px-4 py-3 text-right font-semibold">Perda Res.</th>
                <th className="px-4 py-3 text-right font-semibold">Vendas</th>
                <th className="px-4 py-3 text-right font-semibold">Lucro Adic.</th>
                <th className="px-4 py-3 text-right font-semibold">Deduções Fisc.</th>
                <th className="px-4 py-3 text-right font-semibold">Impacto</th>
                <th className="px-4 py-3 text-right font-semibold">Anual</th>
              </tr>
            </thead>
            <tbody>
              {cenarios.map((cenario, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-gray-800 ${
                    cenario.nome === melhorCenario.nome ? 'bg-green-900/20' : 'hover:bg-gray-900/50'
                  }`}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{cenario.nome}</p>
                      <p className="text-xs text-gray-500">{cenario.reducao_percentual}% redução</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    R$ {cenario.perda_residual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3 text-right text-green-400">
                    R$ {cenario.vendas_resgatadas.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3 text-right text-green-400 font-bold">
                    +R$ {cenario.lucro_adicional.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3 text-right text-blue-400">
                    R$ {cenario.economia_fiscal_doacao.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        cenario.impacto_total > 0 ? 'text-green-400 font-bold' : 'text-red-400'
                      }
                    >
                      {cenario.impacto_total > 0 ? '+' : ''}
                      R$ {cenario.impacto_total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        cenario.impacto_anual > 0 ? 'text-green-400 font-bold' : 'text-red-400'
                      }
                    >
                      {cenario.impacto_anual > 0 ? '+' : ''}
                      R$ {cenario.impacto_anual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Footer */}
      <div className="card bg-blue-900/20 border-blue-700 p-4">
        <p className="text-sm text-blue-300 mb-2">
          📋 <strong>Nota importante:</strong> Esta análise utiliza dados da Lei 15.224/25 de outubro de 2025:
        </p>
        <ul className="text-xs text-blue-300 space-y-1 ml-4 list-disc">
          <li>Dedução IR/CSLL: até 2% do lucro operacional</li>
          <li>ICMS: Isento se estado aderiu ao Convênio 136/94</li>
          <li>Responsabilidade limitada a dolo (Lei 14.016/2020)</li>
        </ul>
      </div>
    </div>
  );
}
