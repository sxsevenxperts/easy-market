#!/usr/bin/env node

const PptxGenJS = require('pptxgenjs');

// Criar apresentação
const prs = new PptxGenJS();

// Configurar dimensões padrão (10x7.5 polegadas - 16:9)
prs.defineLayout({ name: 'BLANK', width: 10, height: 7.5 });

// Paleta de cores
const COLORS = {
  primary: '2C5F2D',      // Verde escuro (cana)
  secondary: '97BC62',    // Verde limão
  accent: '2F3C7E',       // Azul marinho
  light: 'F5F5F5',        // Creme/branco
  dark: '1A1A1A',         // Preto
  white: 'FFFFFF'
};

// Função para adicionar slide com título
function addTitleSlide(title, subtitle, bgColor = COLORS.primary) {
  const slide = prs.addSlide();
  slide.background = { color: bgColor };
  
  slide.addText(title, {
    x: 0.5, y: 2.5,
    w: 9, h: 1.5,
    fontSize: 54,
    bold: true,
    color: COLORS.white,
    align: 'left',
    fontFace: 'Arial'
  });
  
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5, y: 4.1,
      w: 9, h: 1,
      fontSize: 28,
      color: COLORS.secondary,
      align: 'left',
      fontFace: 'Arial'
    });
  }
  
  slide.addText('Seven Xperts | CNPJ 32.794.007/0001-19', {
    x: 0.5, y: 6.8,
    w: 9, h: 0.4,
    fontSize: 12,
    color: COLORS.light,
    align: 'right',
    fontFace: 'Arial'
  });
}

// Função para slide de conteúdo
function addContentSlide(title, content) {
  const slide = prs.addSlide();
  slide.background = { color: COLORS.white };
  
  // Header com título
  slide.addShape(prs.ShapeType.rect, {
    x: 0, y: 0,
    w: 10, h: 0.8,
    fill: { color: COLORS.primary }
  });
  
  slide.addText(title, {
    x: 0.5, y: 0.15,
    w: 9, h: 0.5,
    fontSize: 32,
    bold: true,
    color: COLORS.white,
    align: 'left'
  });
  
  // Conteúdo
  let yPos = 1.2;
  content.forEach((item) => {
    if (item.type === 'heading') {
      slide.addText(item.text, {
        x: 0.5, y: yPos,
        w: 9, h: 0.4,
        fontSize: 18,
        bold: true,
        color: COLORS.accent,
        align: 'left'
      });
      yPos += 0.5;
    } else if (item.type === 'bullet') {
      slide.addText('• ' + item.text, {
        x: 1, y: yPos,
        w: 8.5, h: 0.35,
        fontSize: 14,
        color: COLORS.dark,
        align: 'left'
      });
      yPos += 0.45;
    } else if (item.type === 'stat') {
      slide.addShape(prs.ShapeType.rect, {
        x: 0.5, y: yPos,
        w: 2.8, h: 0.8,
        fill: { color: COLORS.secondary }
      });
      slide.addText(item.value, {
        x: 0.5, y: yPos + 0.1,
        w: 2.8, h: 0.4,
        fontSize: 24,
        bold: true,
        color: COLORS.white,
        align: 'center'
      });
      slide.addText(item.label, {
        x: 0.5, y: yPos + 0.45,
        w: 2.8, h: 0.25,
        fontSize: 11,
        color: COLORS.dark,
        align: 'center'
      });
      yPos += 1;
    }
  });
}

// ============================================
// SLIDE 1: Capa
// ============================================
addTitleSlide(
  '🏪 Smart Market',
  'Inteligência de Varejo para Supermercados e Padarias'
);

// ============================================
// SLIDE 2: O Problema
// ============================================
addContentSlide('O Problema do Varejo', [
  { type: 'heading', text: 'Desafios Atuais' },
  { type: 'bullet', text: 'Taxa de perdas por obsolescência: 3-4% do faturamento' },
  { type: 'bullet', text: 'Produtos deixam de ser vendidos sem visibilidade' },
  { type: 'bullet', text: 'Previsões imprecisas (±15% de erro)' },
  { type: 'bullet', text: 'Oportunidades de cross-sell não identificadas (5% realizado)' },
  { type: 'bullet', text: 'Decisões baseadas em intuição, não em dados' },
  { type: 'bullet', text: 'Impacto de eventos externos não monitorado' }
]);

// ============================================
// SLIDE 3: A Solução Smart Market
// ============================================
const slide3 = prs.addSlide();
slide3.background = { color: COLORS.white };

slide3.addShape(prs.ShapeType.rect, {
  x: 0, y: 0,
  w: 10, h: 0.8,
  fill: { color: COLORS.primary }
});

slide3.addText('A Solução: Smart Market v3.0', {
  x: 0.5, y: 0.15,
  w: 9, h: 0.5,
  fontSize: 32,
  bold: true,
  color: COLORS.white
});

// Grid de 4 itens
const items = [
  { title: '50 Variáveis', desc: 'Monitoramento de clima, economia, eventos, concorrentes' },
  { title: 'Previsões EMA', desc: 'Precisão ±5% com ajustes por dia da semana' },
  { title: 'RFM Analysis', desc: 'Segmentação de clientes (Premium, Regular, Risco)' },
  { title: 'Anomalias', desc: 'Detecção automática com Z-score' }
];

let xPos = 0.5;
let yPos = 1.3;
items.forEach((item, idx) => {
  if (idx === 2) {
    xPos = 0.5;
    yPos = 4.2;
  }
  
  slide3.addShape(prs.ShapeType.rect, {
    x: xPos, y: yPos,
    w: 4.4, h: 2.5,
    fill: { color: COLORS.light },
    line: { color: COLORS.secondary, width: 2 }
  });
  
  slide3.addText(item.title, {
    x: xPos + 0.2, y: yPos + 0.2,
    w: 4, h: 0.4,
    fontSize: 18,
    bold: true,
    color: COLORS.primary
  });
  
  slide3.addText(item.desc, {
    x: xPos + 0.2, y: yPos + 0.7,
    w: 4, h: 1.5,
    fontSize: 12,
    color: COLORS.dark,
    align: 'left'
  });
  
  xPos += 4.8;
});

// ============================================
// SLIDE 4: 50 Variáveis Monitoradas
// ============================================
addContentSlide('50 Variáveis em Tempo Real', [
  { type: 'stat', value: '9', label: 'Categorias' },
  { type: 'heading', text: 'Categorias de Dados' },
  { type: 'bullet', text: '🌤️ Clima: temperatura, precipitação, umidade, índice UV' },
  { type: 'bullet', text: '💹 Economia: inflação, taxa de juros, desemprego, PIB' },
  { type: 'bullet', text: '📅 Eventos: feriados, festividades (Carnaval, Black Friday, Natal)' },
  { type: 'bullet', text: '🏪 Concorrentes: promoções, produtos novos, preços' },
  { type: 'bullet', text: '📦 Inventário: estoque, rotatividade, produtos obsoletos' },
  { type: 'bullet', text: '👥 Social: trends, memes, comportamento de rede' }
]);

// ============================================
// SLIDE 5: Como Reduz Taxa de Perdas
// ============================================
const slide5 = prs.addSlide();
slide5.background = { color: COLORS.white };

slide5.addShape(prs.ShapeType.rect, {
  x: 0, y: 0,
  w: 10, h: 0.8,
  fill: { color: COLORS.primary }
});

slide5.addText('Como Reduz Taxa de Perdas', {
  x: 0.5, y: 0.15,
  w: 9, h: 0.5,
  fontSize: 32,
  bold: true,
  color: COLORS.white
});

// Processo visual
const steps = [
  { num: '1', title: 'Detecta Saída', desc: 'Identifica produtos sem venda por 7+ dias' },
  { num: '2', title: 'Analisa Causas', desc: 'Clima ruim? Competidor? Preço alto?' },
  { num: '3', title: 'Recomenda Ação', desc: 'Promoção, realocação ou desconto' },
  { num: '4', title: 'Executa', desc: 'Implementar ação recomendada' }
];

let xStart = 0.5;
steps.forEach((step, idx) => {
  // Número do passo
  slide5.addShape(prs.ShapeType.ellipse, {
    x: xStart, y: 1.2,
    w: 0.6, h: 0.6,
    fill: { color: COLORS.secondary }
  });
  
  slide5.addText(step.num, {
    x: xStart, y: 1.2,
    w: 0.6, h: 0.6,
    fontSize: 20,
    bold: true,
    color: COLORS.white,
    align: 'center',
    valign: 'middle'
  });
  
  // Título e descrição
  slide5.addText(step.title, {
    x: xStart, y: 2.0,
    w: 2.3, h: 0.35,
    fontSize: 14,
    bold: true,
    color: COLORS.primary,
    align: 'center'
  });
  
  slide5.addText(step.desc, {
    x: xStart, y: 2.4,
    w: 2.3, h: 0.8,
    fontSize: 11,
    color: COLORS.dark,
    align: 'center'
  });
  
  // Seta
  if (idx < steps.length - 1) {
    slide5.addText('→', {
      x: xStart + 2.35, y: 1.35,
      w: 0.3, h: 0.3,
      fontSize: 24,
      color: COLORS.secondary,
      align: 'center'
    });
  }
  
  xStart += 2.35;
});

// Resultado
slide5.addShape(prs.ShapeType.rect, {
  x: 1, y: 3.8,
  w: 8, h: 1.2,
  fill: { color: '#E8F5E9' },
  line: { color: COLORS.secondary, width: 2 }
});

slide5.addText('Resultado: Redução de 3-4% para <1% em taxa de perdas', {
  x: 1.3, y: 4.1,
  w: 7.4, h: 0.7,
  fontSize: 16,
  bold: true,
  color: COLORS.primary,
  align: 'center',
  valign: 'middle'
});

// ============================================
// SLIDE 6: Como Eleva Receita
// ============================================
addContentSlide('Como Eleva Receita', [
  { type: 'heading', text: 'Três Estratégias Principais' },
  { type: 'bullet', text: '📈 Cross-Sell Inteligente: +18-22% (pão + queijo, carne + vinho)' },
  { type: 'bullet', text: '⬆️ Up-Sell Efetivo: +12-15% (produtos premium para clientes Premium)' },
  { type: 'bullet', text: '🎯 Segmentação RFM: atender cada cliente com a estratégia correta' },
  { type: 'heading', text: 'Exemplo Prático' },
  { type: 'bullet', text: 'Cliente João Silva (Premium): compra carne toda semana' },
  { type: 'bullet', text: 'Sistema identifica: "João + Carne = oportunidade de Queijo/Vinho"' },
  { type: 'bullet', text: 'Treinamento do caixa: "Temos queijo artesanal que combina"' },
  { type: 'bullet', text: 'Resultado: +R$ 50-100 por semana por cliente' }
]);

// ============================================
// SLIDE 7: Análises Disponíveis
// ============================================
const slide7 = prs.addSlide();
slide7.background = { color: COLORS.white };

slide7.addShape(prs.ShapeType.rect, {
  x: 0, y: 0,
  w: 10, h: 0.8,
  fill: { color: COLORS.primary }
});

slide7.addText('Análises Preditivas Disponíveis', {
  x: 0.5, y: 0.15,
  w: 9, h: 0.5,
  fontSize: 32,
  bold: true,
  color: COLORS.white
});

const analyses = [
  { icon: '📊', title: 'Previsão de Vendas', desc: 'EMA com ajustes por dia da semana, MAPE ±5%' },
  { icon: '🔍', title: 'Taxa de Saída', desc: 'Produtos parados em dias/kg/R$ por unidade e setor' },
  { icon: '👤', title: 'RFM Segmentation', desc: 'Clientes Premium, Regular, Em Risco' },
  { icon: '📈', title: 'Cross/Up-sell', desc: 'Pares de produtos + preço ideal de sugestão' },
  { icon: '⚠️', title: 'Anomalias', desc: 'Desvios automáticos (Z-score > 3)' },
  { icon: '📅', title: 'Períodos', desc: 'Diário, Semanal, Quinzenal, Mensal, Anual' }
];

let row = 0;
let col = 0;
analyses.forEach((analysis) => {
  const xPos = 0.5 + (col * 4.8);
  const yPos = 1.2 + (row * 2.2);
  
  slide7.addShape(prs.ShapeType.rect, {
    x: xPos, y: yPos,
    w: 4.4, h: 1.8,
    fill: { color: COLORS.light },
    line: { color: COLORS.secondary, width: 1 }
  });
  
  slide7.addText(analysis.icon, {
    x: xPos + 0.2, y: yPos + 0.1,
    w: 0.4, h: 0.4,
    fontSize: 20
  });
  
  slide7.addText(analysis.title, {
    x: xPos + 0.7, y: yPos + 0.1,
    w: 3.5, h: 0.4,
    fontSize: 13,
    bold: true,
    color: COLORS.primary
  });
  
  slide7.addText(analysis.desc, {
    x: xPos + 0.2, y: yPos + 0.6,
    w: 4, h: 1,
    fontSize: 10,
    color: COLORS.dark
  });
  
  col++;
  if (col === 2) {
    col = 0;
    row++;
  }
});

// ============================================
// SLIDE 8: Dashboard - Funcionalidades
// ============================================
addContentSlide('Dashboard Executivo', [
  { type: 'heading', text: '📱 Interface Intuitiva' },
  { type: 'bullet', text: '🎨 Design elegante com paleta verde cana e limão' },
  { type: 'bullet', text: '📊 Gráficos com período filtrável (Dia/Semana/Mês/Ano)' },
  { type: 'bullet', text: '🔍 Busca avançada para encontrar eventos e variáveis' },
  { type: 'bullet', text: '📈 Sparklines ASCII para visualização rápida' },
  { type: 'bullet', text: '⌨️ Navegação por teclado (↓↑ Enter Esc)' },
  { type: 'heading', text: '⚡ Performance' },
  { type: 'bullet', text: 'Search < 50ms | Filtros < 200ms | Carregamento < 2s' }
]);

// ============================================
// SLIDE 9: Resultados Esperados (3 meses)
// ============================================
const slide9 = prs.addSlide();
slide9.background = { color: COLORS.white };

slide9.addShape(prs.ShapeType.rect, {
  x: 0, y: 0,
  w: 10, h: 0.8,
  fill: { color: COLORS.primary }
});

slide9.addText('Resultados Esperados (3 meses)', {
  x: 0.5, y: 0.15,
  w: 9, h: 0.5,
  fontSize: 32,
  bold: true,
  color: COLORS.white
});

// Comparação antes/depois
const before_after = [
  { metric: 'Precisão Vendas', before: '±15%', after: '±5%', impact: '3x melhor' },
  { metric: 'Taxa de Perdas', before: '3-4%', after: '<1%', impact: '70% redução' },
  { metric: 'Cross-sell', before: '5%', after: '18-22%', impact: '4x aumento' },
  { metric: 'Tendências ID', before: 'Manual', after: 'Automática', impact: 'Contínuo' }
];

let tableY = 1.3;
before_after.forEach((row) => {
  // Métrica
  slide9.addText(row.metric, {
    x: 0.5, y: tableY,
    w: 2.5, h: 0.4,
    fontSize: 12,
    bold: true,
    color: COLORS.dark
  });
  
  // Antes
  slide9.addText(row.before, {
    x: 3.2, y: tableY,
    w: 1.5, h: 0.4,
    fontSize: 12,
    color: COLORS.dark,
    align: 'center'
  });
  
  // Depois
  slide9.addShape(prs.ShapeType.rect, {
    x: 4.9, y: tableY,
    w: 1.8, h: 0.4,
    fill: { color: COLORS.secondary }
  });
  
  slide9.addText(row.after, {
    x: 4.9, y: tableY,
    w: 1.8, h: 0.4,
    fontSize: 12,
    bold: true,
    color: COLORS.white,
    align: 'center'
  });
  
  // Impacto
  slide9.addText(row.impact, {
    x: 7, y: tableY,
    w: 2.5, h: 0.4,
    fontSize: 12,
    color: COLORS.accent,
    bold: true
  });
  
  tableY += 0.55;
});

// ============================================
// SLIDE 10: ROI - Investimento e Retorno
// ============================================
const slide10 = prs.addSlide();
slide10.background = { color: COLORS.white };

slide10.addShape(prs.ShapeType.rect, {
  x: 0, y: 0,
  w: 10, h: 0.8,
  fill: { color: COLORS.primary }
});

slide10.addText('ROI - Investimento e Retorno', {
  x: 0.5, y: 0.15,
  w: 9, h: 0.5,
  fontSize: 32,
  bold: true,
  color: COLORS.white
});

// Cálculos para loja média
slide10.addText('Supermercado Médio (1000m² • Faturamento: R$ 120k/mês)', {
  x: 0.5, y: 1.0,
  w: 9, h: 0.3,
  fontSize: 14,
  bold: true,
  color: COLORS.primary
});

slide10.addShape(prs.ShapeType.rect, {
  x: 0.5, y: 1.5,
  w: 4.4, h: 1.5,
  fill: { color: '#FFEBEE' },
  line: { color: '#E85D7F', width: 2 }
});

slide10.addText('Investimento Inicial', {
  x: 0.7, y: 1.65,
  w: 4, h: 0.3,
  fontSize: 14,
  bold: true,
  color: '#C62828'
});

slide10.addText('Server: R$ 5.000\nIntegração: R$ 2.000\nTreinamento: R$ 1.500\n\nTOTAL: R$ 8.500', {
  x: 0.7, y: 2.0,
  w: 4, h: 0.9,
  fontSize: 12,
  color: COLORS.dark
});

slide10.addShape(prs.ShapeType.rect, {
  x: 5.1, y: 1.5,
  w: 4.4, h: 1.5,
  fill: { color: '#E8F5E9' },
  line: { color: COLORS.secondary, width: 2 }
});

slide10.addText('Retorno Mensal (Mês 1)', {
  x: 5.3, y: 1.65,
  w: 4, h: 0.3,
  fontSize: 14,
  bold: true,
  color: COLORS.primary
});

slide10.addText('Redução Perdas: +R$ 4.000\nCross-sell: +R$ 3.600\nUp-sell: +R$ 2.160\n\nTOTAL: +R$ 9.760/mês', {
  x: 5.3, y: 2.0,
  w: 4, h: 0.9,
  fontSize: 12,
  color: COLORS.dark,
  bold: true
});

slide10.addShape(prs.ShapeType.rect, {
  x: 1, y: 3.3,
  w: 8, h: 0.9,
  fill: { color: COLORS.secondary }
});

slide10.addText('🎯 Payback: 25 dias | Lucro Anual: R$ 107.560', {
  x: 1.2, y: 3.45,
  w: 7.6, h: 0.6,
  fontSize: 18,
  bold: true,
  color: COLORS.white,
  align: 'center',
  valign: 'middle'
});

// ============================================
// SLIDE 11: Integração com PDV
// ============================================
addContentSlide('Integração Perfeita com PDV', [
  { type: 'heading', text: '🔗 Suporta Principais PDVs' },
  { type: 'bullet', text: 'Microvix, Técnapolis, SAT Fiscal, PAF/ECF e Custom APIs' },
  { type: 'bullet', text: 'Sincronização automática a cada 5 minutos' },
  { type: 'bullet', text: 'Dados em tempo real: vendas, estoque, clientes' },
  { type: 'heading', text: '💾 Armazenamento Seguro' },
  { type: 'bullet', text: 'PostgreSQL local ou Supabase cloud' },
  { type: 'bullet', text: 'Backup automático de 24 em 24 horas' },
  { type: 'bullet', text: 'Histórico completo de 24 meses' }
]);

// ============================================
// SLIDE 12: Casos de Uso Reais
// ============================================
const slide12 = prs.addSlide();
slide12.background = { color: COLORS.white };

slide12.addShape(prs.ShapeType.rect, {
  x: 0, y: 0,
  w: 10, h: 0.8,
  fill: { color: COLORS.primary }
});

slide12.addText('Casos de Uso: Exemplo Prático', {
  x: 0.5, y: 0.15,
  w: 9, h: 0.5,
  fontSize: 32,
  bold: true,
  color: COLORS.white
});

// Caso 1
slide12.addShape(prs.ShapeType.rect, {
  x: 0.5, y: 1.1,
  w: 4.4, h: 2.1,
  fill: { color: COLORS.light },
  line: { color: COLORS.secondary, width: 2 }
});

slide12.addText('Caso: Chuva Forte', {
  x: 0.7, y: 1.2,
  w: 4, h: 0.3,
  fontSize: 14,
  bold: true,
  color: COLORS.primary
});

slide12.addText('Ontem choveu • Vendas caíram 15%\n\nSistema:  "Desvio -15%, esperado -25% por chuva"\n\nResultado: ✅ Melhor que esperado', {
  x: 0.7, y: 1.6,
  w: 4, h: 1.3,
  fontSize: 11,
  color: COLORS.dark
});

// Caso 2
slide12.addShape(prs.ShapeType.rect, {
  x: 5.1, y: 1.1,
  w: 4.4, h: 2.1,
  fill: { color: COLORS.light },
  line: { color: COLORS.secondary, width: 2 }
});

slide12.addText('Caso: Black Friday', {
  x: 5.3, y: 1.2,
  w: 4, h: 0.3,
  fontSize: 14,
  bold: true,
  color: COLORS.primary
});

slide12.addText('Sistema identifica Black Friday 15 dias antes\n\nAções: aumento estoque, combo preparado\n\nResultado: +40% de vendas esperadas', {
  x: 5.3, y: 1.6,
  w: 4, h: 1.3,
  fontSize: 11,
  color: COLORS.dark
});

// Caso 3
slide12.addShape(prs.ShapeType.rect, {
  x: 0.5, y: 3.4,
  w: 4.4, h: 2.1,
  fill: { color: COLORS.light },
  line: { color: COLORS.secondary, width: 2 }
});

slide12.addText('Caso: Estoque Morto', {
  x: 0.7, y: 3.5,
  w: 4, h: 0.3,
  fontSize: 14,
  bold: true,
  color: COLORS.primary
});

slide12.addText('Bolo de chocolate: 30 dias sem venda\n\nSistema sugere: promoção -20%\n\nResultado: +8 unidades vendidas/dia', {
  x: 0.7, y: 3.9,
  w: 4, h: 1.3,
  fontSize: 11,
  color: COLORS.dark
});

// Caso 4
slide12.addShape(prs.ShapeType.rect, {
  x: 5.1, y: 3.4,
  w: 4.4, h: 2.1,
  fill: { color: COLORS.light },
  line: { color: COLORS.secondary, width: 2 }
});

slide12.addText('Caso: Cross-sell', {
  x: 5.3, y: 3.5,
  w: 4, h: 0.3,
  fontSize: 14,
  bold: true,
  color: COLORS.primary
});

slide12.addText('Cliente compra carne (frequência: semanal)\n\nSugestão: "Queijo artesanal combina"\n\nResultado: +15% ticket médio', {
  x: 5.3, y: 3.9,
  w: 4, h: 1.3,
  fontSize: 11,
  color: COLORS.dark
});

// ============================================
// SLIDE 13: Tipos de Plano
// ============================================
addContentSlide('Planos de Assinatura', [
  { type: 'heading', text: '💰 Básico - R$ 299/mês' },
  { type: 'bullet', text: 'Até 1 loja • 50 SKUs • Dashboard básico' },
  { type: 'heading', text: '⭐ Profissional - R$ 799/mês' },
  { type: 'bullet', text: 'Até 5 lojas • 5.000 SKUs • RFM + Anomalias + API' },
  { type: 'heading', text: '🚀 Enterprise - Contato' },
  { type: 'bullet', text: 'Ilimitado • Suporte 24/7 • Custom dev • Consultoria' }
]);

// ============================================
// SLIDE 14: Implementação
// ============================================
addContentSlide('Implementação em Passos', [
  { type: 'bullet', text: '📋 Pré-instalação: Documentação, diagnosticar internet, backups' },
  { type: 'bullet', text: '🔧 Setup: Instalar server, configurar PDV, banco de dados' },
  { type: 'bullet', text: '📚 Treinamento: Gerente (4h), Operacional (2h), TI (8h)' },
  { type: 'bullet', text: '✅ Go-live: Monitoramento primeiro mês, ajustes' },
  { type: 'bullet', text: '📈 Otimização: Acompanhamento contínuo de resultados' },
  { type: 'heading', text: 'Timeline Típico: 15-20 dias' }
]);

// ============================================
// SLIDE 15: Fundamentações Científicas
// ============================================
addContentSlide('Fundamentações Científicas', [
  { type: 'bullet', text: '📊 EMA (Exponential Moving Average): método padrão em time-series' },
  { type: 'bullet', text: '🔢 Z-Score: detecção estatística de anomalias (|z| > 3 = 99.7% confiança)' },
  { type: 'bullet', text: '📈 RFM Segmentation: modelo de Pareto (80/20) comprovado em varejo' },
  { type: 'bullet', text: '📉 MAPE (Mean Absolute Percentage Error): métrica standard de precisão' },
  { type: 'bullet', text: '🔄 Correlação: análise de relação entre variáveis e vendas' },
  { type: 'heading', text: 'Resultado: Sistema baseado em ciência de dados, não intuição' }
]);

// ============================================
// SLIDE 16: Comparativo com Concorrência
// ============================================
const slide16 = prs.addSlide();
slide16.background = { color: COLORS.white };

slide16.addShape(prs.ShapeType.rect, {
  x: 0, y: 0,
  w: 10, h: 0.8,
  fill: { color: COLORS.primary }
});

slide16.addText('Por que Smart Market?', {
  x: 0.5, y: 0.15,
  w: 9, h: 0.5,
  fontSize: 32,
  bold: true,
  color: COLORS.white
});

const comparison = [
  { feature: '50 Variáveis Integradas', sm: '✅', competitors: '❌' },
  { feature: 'Previsão EMA ±5%', sm: '✅', competitors: '±15%' },
  { feature: 'Taxa Saída Automática', sm: '✅', competitors: '❌' },
  { feature: 'RFM Segmentation', sm: '✅', competitors: '❌' },
  { feature: 'Search Avançada', sm: '✅', competitors: '❌' },
  { feature: 'Interface Intuitiva', sm: '✅', competitors: '❌' }
];

let compY = 1.2;
comparison.forEach((row) => {
  slide16.addText(row.feature, {
    x: 0.5, y: compY,
    w: 4.5, h: 0.35,
    fontSize: 12,
    color: COLORS.dark
  });
  
  slide16.addText(row.sm, {
    x: 5.2, y: compY,
    w: 2, h: 0.35,
    fontSize: 14,
    bold: true,
    color: COLORS.primary,
    align: 'center'
  });
  
  slide16.addText(row.competitors, {
    x: 7.3, y: compY,
    w: 2, h: 0.35,
    fontSize: 12,
    color: '999999',
    align: 'center'
  });
  
  compY += 0.5;
});

// ============================================
// SLIDE 17: Próximos Passos
// ============================================
addContentSlide('Próximos Passos', [
  { type: 'stat', value: '1', label: 'Agendar demo online' },
  { type: 'heading', text: 'Chamamos você para:' },
  { type: 'bullet', text: '📹 Demo ao vivo (30 min) - ver sistema funcionando' },
  { type: 'bullet', text: '📝 Discussão de plano (20 min) - customizar para sua loja' },
  { type: 'bullet', text: '💬 Q&A (10 min) - tirar dúvidas técnicas e comerciais' },
  { type: 'heading', text: 'Resultado: Proposta personalizada em 48h' }
]);

// ============================================
// SLIDE 18: Contato e Fechamento
// ============================================
const slide18 = prs.addSlide();
slide18.background = { color: COLORS.primary };

slide18.addText('Pronto para Transformar seu Varejo?', {
  x: 0.5, y: 1.5,
  w: 9, h: 0.7,
  fontSize: 44,
  bold: true,
  color: COLORS.white,
  align: 'center'
});

slide18.addShape(prs.ShapeType.rect, {
  x: 2, y: 2.5,
  w: 6, h: 0.8,
  fill: { color: COLORS.secondary }
});

slide18.addText('Contate-nos Agora', {
  x: 2, y: 2.5,
  w: 6, h: 0.8,
  fontSize: 28,
  bold: true,
  color: COLORS.white,
  align: 'center',
  valign: 'middle'
});

slide18.addText('📧 suporte@sevenxperts.com.br\n☎️  (11) 3000-0000\n💬 WhatsApp: (11) 99999-0000', {
  x: 1, y: 3.7,
  w: 8, h: 1,
  fontSize: 18,
  color: COLORS.light,
  align: 'center'
});

slide18.addText('Seven Xperts CNPJ 32.794.007/0001-19', {
  x: 0.5, y: 6.8,
  w: 9, h: 0.4,
  fontSize: 14,
  color: COLORS.light,
  align: 'center'
});

// ============================================
// Salvar apresentação
// ============================================
prs.writeFile({ fileName: '/Users/sergioponte/easy-market/SMART_MARKET_PRESENTATION.pptx' });

console.log('✅ Apresentação criada com sucesso!');
console.log('📍 Arquivo: /Users/sergioponte/easy-market/SMART_MARKET_PRESENTATION.pptx');
