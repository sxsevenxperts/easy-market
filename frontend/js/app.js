/**
 * Smart Market - Frontend Application Logic
 * Retail Intelligence Platform with Textual Insights
 */

const API_BASE = window.location.port === '3001' ? 'http://localhost:3000/api/v1' : window.location.origin + '/api/v1';
let currentSection = 'dashboard';
let currentStore = 'loja_001';

/**
 * Initialize Application
 */
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  loadSection('dashboard');
  startAutoRefresh();
});

/**
 * Initialize Event Listeners
 */
function initializeEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      loadSection(section);
    });
  });

  // Store selector
  document.getElementById('storeSelect').addEventListener('change', (e) => {
    currentStore = e.target.value;
    loadSection(currentSection);
  });

  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', () => {
    loadSection(currentSection);
    showToast('Dados atualizados', 'success');
  });

  // Sidebar toggle (mobile)
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('active');
  });

  document.getElementById('topbarMenuBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('active');
  });

  // Report cards
  document.querySelectorAll('.report-card').forEach(card => {
    card.addEventListener('click', () => {
      const action = card.dataset.action;
      handleReportExport(action);
    });
  });
}

/**
 * Load Section
 */
function loadSection(section) {
  currentSection = section;

  // Update navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.section === section) {
      item.classList.add('active');
    }
  });

  // Hide all sections
  document.querySelectorAll('.section-page').forEach(el => {
    el.classList.remove('active');
  });

  // Show selected section
  const sectionEl = document.getElementById(`section-${section}`);
  if (sectionEl) {
    sectionEl.classList.add('active');
  }

  // Update page title
  const titles = {
    dashboard: { title: 'Dashboard', sub: 'Visao geral em tempo real' },
    previsao: { title: 'Previsao Inteligente', sub: 'Analise preditiva com IA estatistica' },
    estoque: { title: 'Gestao de Estoque', sub: 'Controle de inventario e reposicao' },
    perdas: { title: 'Controle de Perdas', sub: 'Rastreamento e reducao de desperdicio' },
    clientes: { title: 'Segmentacao RFM', sub: 'Analise de comportamento de clientes' },
    'base-clientes': { title: 'Base de Clientes', sub: 'Novos clientes, LTV e produtos mais comprados' },
    crosssell: { title: 'Cross-Sell Intelligence', sub: 'Oportunidades de venda cruzada' },
    anomalias: { title: 'Deteccao de Anomalias', sub: 'Identificacao de padroes atipicos' },
    alertas: { title: 'Central de Alertas', sub: 'Notificacoes e acoes pendentes' },
    clima: { title: 'Impacto Climatico', sub: 'Correlacao clima x vendas' },
    shelf: { title: 'Shelf Intelligence', sub: 'Posicionamento e ROI de gondola' },
    relatorios: { title: 'Relatorios', sub: 'Exportacao e analises periodicas' },
    config: { title: 'Configuracoes', sub: 'Perfil da loja, assinatura e sistema' }
  };

  const t = titles[section] || { title: section, sub: '' };
  document.getElementById('pageTitle').innerHTML = `<h1>${t.title}</h1><p>${t.sub}</p>`;

  // Load section content
  const loaderFunctions = {
    dashboard: loadDashboard,
    previsao: loadPrevisao,
    estoque: loadEstoque,
    perdas: loadPerdas,
    clientes: loadClientes,
    'base-clientes': loadBaseClientes,
    crosssell: loadCrossSell,
    anomalias: loadAnomalias,
    alertas: loadAlertas,
    clima: loadClima,
    shelf: loadShelf,
    config: loadConfig,
    relatorios: () => {},
  };

  if (loaderFunctions[section]) {
    loaderFunctions[section]();
  }
}

/**
 * Fetch Data with Error Handling
 */
async function fetchData(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('API call failed, using mock data:', error);
    return getMockData(endpoint);
  }
}

/**
 * Render an error card with retry button
 */
function renderError(containerId, message) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="card" style="border-color: var(--color-danger);">
      <div class="card-body" style="text-align:center; padding:2rem;">
        <i class="fas fa-exclamation-circle" style="font-size:2.5rem; color:var(--color-danger); margin-bottom:1rem;"></i>
        <h3 style="color:var(--color-text); margin-bottom:0.5rem;">Erro ao carregar dados</h3>
        <p style="color:var(--color-text-dim); margin-bottom:1rem;">${message || 'O backend pode estar offline.'}</p>
        <button class="btn btn-primary" onclick="loadSection(currentSection)"><i class="fas fa-rotate-right"></i> Tentar novamente</button>
      </div>
    </div>`;
}

/**
 * Render insight card HTML
 */
function renderInsightCard(insights, title) {
  if (!insights || !insights.length) return '';
  const items = insights.map(ins => {
    let cls = '';
    const lower = (typeof ins === 'string' ? ins : '').toLowerCase();
    if (lower.includes('alerta') || lower.includes('risco') || lower.includes('cuidado') || lower.includes('atenc')) cls = 'warning';
    else if (lower.includes('positiv') || lower.includes('cresci') || lower.includes('aument') || lower.includes('super')) cls = 'success';
    else if (lower.includes('recomen') || lower.includes('sugest') || lower.includes('acao') || lower.includes('implementar')) cls = 'action';
    else if (lower.includes('tendenc') || lower.includes('trend') || lower.includes('evolu')) cls = 'trend';
    return `<li class="${cls}">${ins}</li>`;
  }).join('');
  return `
    <div class="insight-card">
      <h3><i class="fas fa-lightbulb"></i> ${title || 'Insights & Analise'}</h3>
      <ul class="insight-list">${items}</ul>
    </div>`;
}

/**
 * Format currency
 */
function fmtCurrency(val) {
  if (val == null) return 'R$ --';
  return 'R$ ' + Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(val) {
  if (val == null) return '--%';
  return Number(val).toFixed(1) + '%';
}

// ====================================================================
// DASHBOARD
// ====================================================================
async function loadDashboard() {
  try {
    const data = await fetchData(`/dashboard/${currentStore}`);

    // KPIs
    const kpis = data.kpis || data;
    document.getElementById('kpi-receita').textContent = fmtCurrency(kpis.receita_hoje || kpis.receita || 12450);
    const recDelta = kpis.receita_delta || kpis.variacao_receita || '+12.5%';
    const recDeltaEl = document.getElementById('kpi-receita-delta');
    recDeltaEl.textContent = typeof recDelta === 'number' ? (recDelta >= 0 ? '+' : '') + recDelta + '%' : recDelta;
    recDeltaEl.className = 'kpi-delta ' + (String(recDelta).includes('-') ? 'negative' : 'positive');

    document.getElementById('kpi-margem').textContent = fmtPct(kpis.margem_media || kpis.margem || 18.5);
    const mDelta = kpis.margem_delta || '+2.3%';
    const mDeltaEl = document.getElementById('kpi-margem-delta');
    mDeltaEl.textContent = typeof mDelta === 'number' ? fmtPct(mDelta) : mDelta;

    document.getElementById('kpi-perdas').textContent = fmtPct(kpis.taxa_perdas || kpis.perdas || 2.1);
    const pDelta = kpis.perdas_delta || '-0.5%';
    const pDeltaEl = document.getElementById('kpi-perdas-delta');
    pDeltaEl.textContent = typeof pDelta === 'number' ? fmtPct(pDelta) : pDelta;

    document.getElementById('kpi-alertas').textContent = kpis.alertas_ativos || kpis.alertas || 3;

    // KPI descriptive texts
    const kpiTextos = kpis.textos || data.textos || {};
    addKpiTexto('kpi-receita', kpiTextos.receita || 'Receita acumulada do dia com base nas vendas finalizadas no PDV.');
    addKpiTexto('kpi-margem', kpiTextos.margem || 'Margem media ponderada considerando custo e preco de venda.');
    addKpiTexto('kpi-perdas', kpiTextos.perdas || 'Taxa de perdas inclui vencidos, avarias e quebra operacional.');
    addKpiTexto('kpi-alertas', kpiTextos.alertas || 'Alertas que precisam de atencao imediata da equipe.');

    // Insights
    const insightsContainer = document.getElementById('dashboard-insights');
    if (insightsContainer) {
      const insights = data.insights || [
        'Receita 12.5% acima da media dos ultimos 7 dias - tendencia de alta se mantem desde segunda-feira.',
        'Categoria Bebidas lidera vendas com 28% do faturamento, puxada por temperaturas acima de 30 graus.',
        'Taxa de perdas caiu 0.5pp em relacao a semana anterior - acoes de controle de validade estao funcionando.',
        'Tres alertas ativos exigem atencao: 2 de estoque critico e 1 anomalia de preco detectada.',
        'Recomendacao: reforcar estoque de Refrigerantes e Cervejas para o fim de semana.'
      ];
      insightsContainer.innerHTML = renderInsightCard(insights, 'Insights do Dia');
    }

    // Charts
    const vendas7d = data.vendas_7_dias || data.vendas_7d;
    if (vendas7d) {
      const labels = vendas7d.map(v => v.dia || v.label || v.data);
      const values = vendas7d.map(v => v.valor || v.total || v.vendas);
      renderDashSalesChart(labels, values);
    } else {
      renderDashSalesChart(['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'], [8200, 9400, 7800, 10500, 11200, 12800, 10600]);
    }

    const mix = data.mix_categorias || data.categorias;
    if (mix) {
      const labels = mix.map(m => m.categoria || m.nome || m.label);
      const values = mix.map(m => m.percentual || m.valor || m.total);
      renderDashCategoryChart(labels, values);
    } else {
      renderDashCategoryChart(['Alimentos', 'Bebidas', 'Laticinios', 'Higiene', 'Outros'], [28, 22, 18, 20, 12]);
    }

  } catch (err) {
    console.error('Dashboard error:', err);
    // Use mock anyway
    document.getElementById('kpi-receita').textContent = 'R$ 12.450,00';
    document.getElementById('kpi-margem').textContent = '18.5%';
    document.getElementById('kpi-perdas').textContent = '2.1%';
    document.getElementById('kpi-alertas').textContent = '3';
    renderDashSalesChart(['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'], [8200, 9400, 7800, 10500, 11200, 12800, 10600]);
    renderDashCategoryChart(['Alimentos', 'Bebidas', 'Laticinios', 'Higiene', 'Outros'], [28, 22, 18, 20, 12]);
  }
}

function addKpiTexto(kpiId, text) {
  const el = document.getElementById(kpiId);
  if (!el) return;
  const parent = el.closest('.kpi-body');
  if (!parent) return;
  let textoEl = parent.querySelector('.kpi-texto');
  if (!textoEl) {
    textoEl = document.createElement('span');
    textoEl.className = 'kpi-texto';
    parent.appendChild(textoEl);
  }
  textoEl.textContent = text;
}

// ====================================================================
// PREVISAO
// ====================================================================
async function loadPrevisao() {
  const loading = document.getElementById('loading-previsao');
  const content = document.getElementById('content-previsao');
  loading.style.display = 'flex';
  content.classList.add('hidden');

  try {
    const data = await fetchData(`/previsao/${currentStore}`);

    // Forecast cards
    const forecasts = data.previsoes || data;
    const amanha = forecasts.amanha || { valor: 13200, texto: 'Esperamos alta de 5% puxada pelo fluxo de meio de semana e promocoes ativas em Bebidas.' };
    const semana = forecasts.semana || { valor: 89500, texto: 'Projecao semanal considera sazonalidade e eventos locais. Fim de semana deve concentrar 40% das vendas.' };
    const mes = forecasts.mes || { valor: 385000, texto: 'Tendencia mensal positiva. Categoria Alimentos deve liderar com 35% do faturamento total previsto.' };

    const forecastCards = document.getElementById('forecastCards');
    forecastCards.innerHTML = `
      <div class="forecast-card">
        <div class="forecast-label">Amanha</div>
        <div class="forecast-valor">${fmtCurrency(amanha.valor)}</div>
        <div class="forecast-texto">${amanha.texto}</div>
      </div>
      <div class="forecast-card">
        <div class="forecast-label">Proxima Semana</div>
        <div class="forecast-valor">${fmtCurrency(semana.valor)}</div>
        <div class="forecast-texto">${semana.texto}</div>
      </div>
      <div class="forecast-card">
        <div class="forecast-label">Proximo Mes</div>
        <div class="forecast-valor">${fmtCurrency(mes.valor)}</div>
        <div class="forecast-texto">${mes.texto}</div>
      </div>`;

    // Assertividade badge
    const assertividade = data.assertividade || 91.2;
    const badgeContainer = document.getElementById('previsao-assertividade');
    if (badgeContainer) {
      badgeContainer.innerHTML = `
        <div class="assertividade-badge"><i class="fas fa-bullseye"></i> Assertividade: ${assertividade}%</div>`;
    }

    // Metodologia
    const metodoContainer = document.getElementById('previsao-metodologia');
    if (metodoContainer) {
      metodoContainer.innerHTML = `
        <div class="metodologia">${data.metodologia || 'Modelo hibrido: media movel ponderada + regressao com sazonalidade + ajuste por eventos. Treinado com 12 meses de historico, recalculado diariamente.'}</div>`;
    }

    // Insights
    const insightsContainer = document.getElementById('previsao-insights');
    if (insightsContainer) {
      const insights = data.insights || [
        'A assertividade do modelo se manteve acima de 90% nas ultimas 4 semanas consecutivas.',
        'Categoria Padaria apresenta maior desvio (8.3%) - considere ajustar estoque manualmente.',
        'Vendas de sabado tem crescido 3% ao mes - modelo ja incorporou essa tendencia.',
        'Recomendacao: aumentar pedido de Laticinios em 15% para proxima semana (tendencia de alta).'
      ];
      insightsContainer.innerHTML = renderInsightCard(insights, 'Analise Preditiva');
    }

    // Chart
    const curva = data.curva || data.historico;
    if (curva && curva.length) {
      const labels = curva.map(c => c.dia || c.data || c.label);
      const previsto = curva.map(c => c.previsto);
      const realizado = curva.map(c => c.realizado || c.real);
      renderForecastChart(labels, previsto, realizado);
    } else {
      const days = Array.from({ length: 14 }, (_, i) => `Dia ${i + 1}`);
      const base = [8200, 9400, 7800, 10500, 11200, 12800, 10600, 8800, 9200, 10100, 11500, 12200, 9800, 10400];
      const previsto = base.map(v => v + Math.floor(Math.random() * 500 - 250));
      renderForecastChart(days, base, previsto);
    }

    // Table
    const categorias = data.por_categoria || data.categorias || [
      { categoria: 'Alimentos', previsto: 32500, realizado: 31800, desvio: -2.2, assertividade: 97.8 },
      { categoria: 'Bebidas', previsto: 24100, realizado: 25200, desvio: 4.6, assertividade: 95.4 },
      { categoria: 'Laticinios', previsto: 18200, realizado: 16700, desvio: -8.3, assertividade: 91.7 },
      { categoria: 'Higiene', previsto: 15800, realizado: 16100, desvio: 1.9, assertividade: 98.1 },
      { categoria: 'Padaria', previsto: 12400, realizado: 11500, desvio: -7.3, assertividade: 92.7 },
    ];
    const tbody = document.querySelector('#forecastTable tbody');
    tbody.innerHTML = categorias.map(c => `
      <tr>
        <td>${c.categoria}</td>
        <td>${fmtCurrency(c.previsto)}</td>
        <td>${fmtCurrency(c.realizado)}</td>
        <td class="${c.desvio >= 0 ? 'text-green' : 'text-red'}">${c.desvio >= 0 ? '+' : ''}${c.desvio}%</td>
        <td><span class="assertividade-badge" style="font-size:0.75rem; padding:2px 8px;">${c.assertividade}%</span></td>
      </tr>`).join('');

    loading.style.display = 'none';
    content.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading forecast:', error);
    loading.style.display = 'none';
    content.classList.remove('hidden');
    renderError('content-previsao', 'Falha ao carregar previsoes.');
  }
}

// ====================================================================
// ESTOQUE
// ====================================================================
async function loadEstoque() {
  const loading = document.getElementById('loading-estoque');
  const content = document.getElementById('content-estoque');
  loading.style.display = 'flex';
  content.classList.add('hidden');

  try {
    const data = await fetchData(`/estoque/${currentStore}`);

    const totalSkus = data.total_skus || data.total || 1543;
    const baixoEstoque = data.baixo_estoque_count || (data.baixo_estoque && data.baixo_estoque.length) || 18;
    const vencendo = data.vencendo_count || (data.vencendo && data.vencendo.length) || 7;

    document.getElementById('estoque-skus').textContent = totalSkus.toLocaleString('pt-BR');
    document.getElementById('estoque-risco').textContent = baixoEstoque;
    document.getElementById('estoque-taxa').textContent = vencendo + ' itens';
    document.getElementById('estoque-taxa-meta').textContent = 'vencendo em 7 dias';

    // Insights
    const insightsContainer = document.getElementById('estoque-insights');
    if (insightsContainer) {
      const insights = data.insights || [
        `${baixoEstoque} produtos estao com estoque abaixo do minimo e precisam de reposicao urgente.`,
        `${vencendo} itens vencem nos proximos 7 dias - priorize promocoes para evitar perdas.`,
        'Categoria Laticinios concentra 45% dos itens proximos ao vencimento.',
        'Recomendacao: negociar com fornecedor lotes menores de Iogurtes para reduzir desperdicio.',
        'Giro de estoque medio esta em 8.2 dias - dentro da meta de 10 dias.'
      ];
      insightsContainer.innerHTML = renderInsightCard(insights, 'Analise de Estoque');
    }

    // Tables
    const baixoEstoqueList = data.baixo_estoque || [
      { produto: 'Refrigerante Cola 2L', estoque: 5, minimo: 30, categoria: 'Bebidas' },
      { produto: 'Leite Integral 1L', estoque: 8, minimo: 50, categoria: 'Laticinios' },
      { produto: 'Pao Frances (kg)', estoque: 3, minimo: 20, categoria: 'Padaria' },
      { produto: 'Cerveja Lata 350ml', estoque: 12, minimo: 60, categoria: 'Bebidas' },
      { produto: 'Iogurte Natural 170g', estoque: 4, minimo: 25, categoria: 'Laticinios' },
    ];

    const tbodyBaixo = document.querySelector('#estoqueBaixoTable tbody');
    if (tbodyBaixo) {
      tbodyBaixo.innerHTML = baixoEstoqueList.map((p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${p.produto || p.nome}</td>
          <td class="text-red">${p.estoque || p.quantidade}</td>
          <td>${p.minimo || p.estoque_minimo}</td>
          <td>${p.categoria}</td>
          <td><span style="color:var(--color-danger); font-weight:600;">Critico</span></td>
        </tr>`).join('');
    }

    const vencendoList = data.vencendo || [
      { produto: 'Iogurte Morango 170g', validade: '2026-03-23', dias_restantes: 2, categoria: 'Laticinios' },
      { produto: 'Presunto Fatiado 200g', validade: '2026-03-24', dias_restantes: 3, categoria: 'Frios' },
      { produto: 'Pao de Forma Integral', validade: '2026-03-25', dias_restantes: 4, categoria: 'Padaria' },
      { produto: 'Queijo Minas 500g', validade: '2026-03-26', dias_restantes: 5, categoria: 'Laticinios' },
    ];

    const tbodyVenc = document.querySelector('#estoqueVencTable tbody');
    if (tbodyVenc) {
      tbodyVenc.innerHTML = vencendoList.map((p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${p.produto || p.nome}</td>
          <td>${p.validade}</td>
          <td class="${p.dias_restantes <= 3 ? 'text-red' : 'text-yellow'}">${p.dias_restantes} dias</td>
          <td>${p.categoria}</td>
        </tr>`).join('');
    }

    loading.style.display = 'none';
    content.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading estoque:', error);
    loading.style.display = 'none';
    content.classList.remove('hidden');
  }
}

// ====================================================================
// PERDAS
// ====================================================================
async function loadPerdas() {
  const loading = document.getElementById('loading-perdas');
  const content = document.getElementById('content-perdas');
  loading.style.display = 'flex';
  content.classList.add('hidden');

  try {
    const data = await fetchData(`/perdas/relatorio/${currentStore}`);

    const taxa = data.taxa_atual || data.taxa || 2.3;
    const meta = data.meta || 2.0;
    const valorPerdido = data.valor_perdido || data.total || 4850;

    document.getElementById('perdas-taxa').textContent = fmtPct(taxa);
    document.getElementById('perdas-meta').textContent = `Meta: < ${meta}%`;
    document.getElementById('perdas-valor').textContent = fmtCurrency(valorPerdido);
    document.getElementById('perdas-total').textContent = data.total_itens || 47;

    // Insights
    const insightsContainer = document.getElementById('perdas-insights');
    if (insightsContainer) {
      const insights = data.insights || [
        `Taxa de perdas atual (${taxa}%) esta ${taxa > meta ? 'acima' : 'dentro'} da meta de ${meta}%.`,
        'Padaria e responsavel por 35% de todas as perdas, principalmente por vencimento de paes frescos.',
        'Perdas com Laticinios reduziram 18% apos implementacao do FIFO rigoroso na semana passada.',
        'Sugestao: implementar desconto progressivo para itens com menos de 3 dias de validade.',
        'Custo de perdas equivale a 2.3% do faturamento - cada 0.1pp de reducao economiza R$ 210/mes.'
      ];
      insightsContainer.innerHTML = renderInsightCard(insights, 'Analise de Perdas');
    }

    // Chart
    const porCategoria = data.por_categoria || [
      { categoria: 'Padaria', valor: 1700 },
      { categoria: 'Laticinios', valor: 1200 },
      { categoria: 'Hortifruti', valor: 890 },
      { categoria: 'Frios', valor: 620 },
      { categoria: 'Bebidas', valor: 440 },
    ];
    renderPerdasChart(
      porCategoria.map(c => c.categoria || c.nome),
      porCategoria.map(c => c.valor || c.total)
    );

    // Table
    const produtosCriticos = data.produtos_criticos || data.produtos || [
      { produto: 'Pao Frances (kg)', perda_pct: 8.5, valor: 680, motivo: 'Vencimento', status: 'critico' },
      { produto: 'Iogurte Morango 170g', perda_pct: 6.2, valor: 420, motivo: 'Vencimento', status: 'critico' },
      { produto: 'Banana Prata (kg)', perda_pct: 5.8, valor: 350, motivo: 'Amadurecimento', status: 'alto' },
      { produto: 'Presunto Fatiado 200g', perda_pct: 4.1, valor: 310, motivo: 'Vencimento', status: 'alto' },
      { produto: 'Tomate (kg)', perda_pct: 3.9, valor: 280, motivo: 'Avaria', status: 'medio' },
      { produto: 'Queijo Minas 500g', perda_pct: 3.5, valor: 260, motivo: 'Vencimento', status: 'medio' },
    ];

    const tbody = document.querySelector('#perdasProdTable tbody');
    if (tbody) {
      tbody.innerHTML = produtosCriticos.map((p, i) => {
        const statusColor = p.status === 'critico' ? 'var(--color-danger)' : p.status === 'alto' ? 'var(--color-warning)' : 'var(--color-primary)';
        return `
          <tr>
            <td>${i + 1}</td>
            <td>${p.produto || p.nome}</td>
            <td class="text-red">${p.perda_pct}%</td>
            <td>${fmtCurrency(p.valor)}</td>
            <td>${p.motivo}</td>
            <td><span style="color:${statusColor}; font-weight:600;">${p.status}</span></td>
          </tr>`;
      }).join('');
    }

    loading.style.display = 'none';
    content.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading perdas:', error);
    loading.style.display = 'none';
    content.classList.remove('hidden');
  }
}

// ====================================================================
// CLIENTES RFM
// ====================================================================
async function loadClientes() {
  const loading = document.getElementById('loading-clientes');
  const content = document.getElementById('content-clientes');
  loading.style.display = 'flex';
  content.classList.add('hidden');

  try {
    const data = await fetchData(`/rfm/loja/${currentStore}/dashboard`);

    const segments = data.segmentos || data;
    const campeoes = segments.campeoes || segments.vip || { count: 120, texto: 'Compradores frequentes de alto valor. Mantenha com programa de fidelidade e ofertas exclusivas.' };
    const leais = segments.leais || segments.regulares || { count: 340, texto: 'Clientes consistentes com boa frequencia. Incentive aumento de ticket medio com cross-sell.' };
    const potenciais = segments.potenciais || { count: 580, texto: 'Compraram recentemente mas sem recorrencia. Envie lembretes e ofertas de segunda compra.' };
    const emRisco = segments.em_risco || { count: 890, texto: 'Diminuiram frequencia nos ultimos 30 dias. Acione campanha de reativacao urgente.' };
    const perdidos = segments.perdidos || { count: 1200, texto: 'Sem compras ha mais de 60 dias. Considere ofertas agressivas ou pesquisa de satisfacao.' };

    const segContainer = document.getElementById('rfmSegments');
    segContainer.innerHTML = `
      <div class="segment-grid">
        <div class="segment-card campeoes">
          <div class="segment-count text-green">${typeof campeoes === 'object' ? campeoes.count : campeoes}</div>
          <div class="segment-label">Campeoes</div>
          <div class="segment-texto">${typeof campeoes === 'object' ? campeoes.texto : 'Clientes de maior valor e frequencia.'}</div>
        </div>
        <div class="segment-card leais">
          <div class="segment-count" style="color:#3b82f6;">${typeof leais === 'object' ? leais.count : leais}</div>
          <div class="segment-label">Leais</div>
          <div class="segment-texto">${typeof leais === 'object' ? leais.texto : 'Clientes com boa frequencia de compra.'}</div>
        </div>
        <div class="segment-card potenciais">
          <div class="segment-count" style="color:#f59e0b;">${typeof potenciais === 'object' ? potenciais.count : potenciais}</div>
          <div class="segment-label">Potenciais</div>
          <div class="segment-texto">${typeof potenciais === 'object' ? potenciais.texto : 'Potencial de crescimento identificado.'}</div>
        </div>
        <div class="segment-card em-risco">
          <div class="segment-count text-red">${typeof emRisco === 'object' ? emRisco.count : emRisco}</div>
          <div class="segment-label">Em Risco</div>
          <div class="segment-texto">${typeof emRisco === 'object' ? emRisco.texto : 'Clientes com queda de frequencia.'}</div>
        </div>
        <div class="segment-card perdidos">
          <div class="segment-count" style="color:#6b7280;">${typeof perdidos === 'object' ? perdidos.count : perdidos}</div>
          <div class="segment-label">Perdidos</div>
          <div class="segment-texto">${typeof perdidos === 'object' ? perdidos.texto : 'Clientes inativos ha mais de 60 dias.'}</div>
        </div>
      </div>`;

    // Insights
    const insightsContainer = document.getElementById('clientes-insights');
    if (insightsContainer) {
      const insights = data.insights || [
        'Base de clientes ativos: 3.130 (excluindo perdidos). Crescimento de 4% no ultimo mes.',
        '890 clientes em risco representam potencial de R$ 45.000/mes - reativacao urgente recomendada.',
        'Campeoes respondem por 38% do faturamento total apesar de serem apenas 4% da base.',
        'Sugestao: criar programa "Volte a Comprar" com cupom de 15% para segmento Em Risco.',
        'Ticket medio dos Leais subiu 8% apos implementacao de sugestoes cross-sell no caixa.'
      ];
      insightsContainer.innerHTML = renderInsightCard(insights, 'Analise de Segmentacao');
    }

    // Chart
    const segCounts = [
      typeof campeoes === 'object' ? campeoes.count : campeoes,
      typeof leais === 'object' ? leais.count : leais,
      typeof potenciais === 'object' ? potenciais.count : potenciais,
      typeof emRisco === 'object' ? emRisco.count : emRisco,
      typeof perdidos === 'object' ? perdidos.count : perdidos,
    ];
    renderRFMChart(['Campeoes', 'Leais', 'Potenciais', 'Em Risco', 'Perdidos'], segCounts);

    // Table
    const topClientes = data.top_clientes || [
      { cliente: 'Maria Silva', recencia: 1, frequencia: 28, valor: 'R$ 4.200', segmento: 'Campeao' },
      { cliente: 'Joao Santos', recencia: 2, frequencia: 22, valor: 'R$ 3.800', segmento: 'Campeao' },
      { cliente: 'Ana Costa', recencia: 3, frequencia: 18, valor: 'R$ 2.950', segmento: 'Leal' },
      { cliente: 'Pedro Lima', recencia: 1, frequencia: 15, valor: 'R$ 2.400', segmento: 'Leal' },
      { cliente: 'Carla Souza', recencia: 5, frequencia: 12, valor: 'R$ 1.800', segmento: 'Potencial' },
    ];

    const tbody = document.querySelector('#clientesTable tbody');
    tbody.innerHTML = topClientes.map(c => `
      <tr>
        <td>${c.cliente || c.nome}</td>
        <td>${c.recencia} dias</td>
        <td>${c.frequencia}x</td>
        <td>${typeof c.valor === 'number' ? fmtCurrency(c.valor) : c.valor}</td>
        <td><span style="color:${c.segmento === 'Campeao' ? 'var(--color-success)' : c.segmento === 'Leal' ? 'var(--color-primary)' : 'var(--color-warning)'}; font-weight:600;">${c.segmento}</span></td>
      </tr>`).join('');

    loading.style.display = 'none';
    content.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading customers:', error);
    loading.style.display = 'none';
    content.classList.remove('hidden');
  }
}

// ====================================================================
// CROSS-SELL
// ====================================================================
async function loadCrossSell() {
  const loading = document.getElementById('loading-crosssell');
  const content = document.getElementById('content-crosssell');
  loading.style.display = 'flex';
  content.classList.add('hidden');

  try {
    const data = await fetchData(`/cross-sell/${currentStore}/pares`);

    const pares = data.pares || data || [
      { produto_a: 'Cerveja Lata 350ml', produto_b: 'Gelo 5kg', suporte: 0.18, confianca: 0.72, lift: 3.4, texto: 'Altissima correlacao - considere display conjunto na entrada da loja.' },
      { produto_a: 'Pao Frances', produto_b: 'Manteiga 200g', suporte: 0.22, confianca: 0.65, lift: 2.8, texto: 'Par classico de cafe da manha. Posicione proximo no corredor de padaria.' },
      { produto_a: 'Macarrao 500g', produto_b: 'Molho de Tomate', suporte: 0.15, confianca: 0.58, lift: 2.5, texto: 'Combo refeicao - crie oferta "Leve Junto" com desconto de 10%.' },
      { produto_a: 'Refrigerante 2L', produto_b: 'Salgadinho 100g', suporte: 0.12, confianca: 0.52, lift: 2.2, texto: 'Associacao forte em compras de fim de semana. Destaque em ponta de gondola.' },
      { produto_a: 'Cafe 500g', produto_b: 'Acucar 1kg', suporte: 0.20, confianca: 0.48, lift: 1.9, texto: 'Par basico de despensa. Alta frequencia mas lift moderado.' },
    ];

    // Top pairs as visual cards
    const crossList = document.getElementById('crossSellList');
    crossList.innerHTML = pares.slice(0, 5).map(p => `
      <div class="anomaly-card" style="border-left-color: var(--color-success);">
        <div class="anomaly-header">
          <strong style="color:var(--color-text);">${p.produto_a} + ${p.produto_b}</strong>
          <span class="assertividade-badge" style="font-size:0.75rem; padding:2px 8px;">Lift: ${p.lift}</span>
        </div>
        <div class="anomaly-descricao">${p.texto || 'Par com alta afinidade de compra conjunta.'}</div>
        <div style="display:flex; gap:1rem; margin-top:0.5rem;">
          <span style="font-size:0.8rem; color:var(--color-text-dim);">Suporte: ${(p.suporte * 100).toFixed(1)}%</span>
          <span style="font-size:0.8rem; color:var(--color-text-dim);">Confianca: ${(p.confianca * 100).toFixed(1)}%</span>
        </div>
      </div>`).join('');

    // Insights
    const insightsContainer = document.getElementById('crosssell-insights');
    if (insightsContainer) {
      const insights = data.insights || [
        'Cerveja + Gelo e o par mais forte com lift de 3.4 - posicionamento conjunto pode aumentar vendas em 25%.',
        'Pares de cafe da manha (Pao + Manteiga) tem maior suporte: 22% dos clientes compram juntos.',
        'Oportunidade: criar combos promocionais com os top 3 pares pode gerar R$ 3.200/mes adicional.',
        'Recomendacao: reposicionar Salgadinhos proximo aos Refrigerantes baseado nos dados de afinidade.',
        'Analise mostra 12 pares com lift acima de 2.0 - todos sao candidatos a promocao conjunta.'
      ];
      insightsContainer.innerHTML = renderInsightCard(insights, 'Oportunidades Cross-Sell');
    }

    // Table
    const tbody = document.querySelector('#crossSellTable tbody');
    tbody.innerHTML = pares.map(p => `
      <tr>
        <td>${p.produto_a}</td>
        <td>${p.produto_b}</td>
        <td>${(p.suporte * 100).toFixed(1)}%</td>
        <td><strong>${p.lift}</strong></td>
        <td>${(p.confianca * 100).toFixed(1)}%</td>
        <td><button class="btn btn-primary" style="padding:4px 12px; font-size:0.75rem;">Criar Combo</button></td>
      </tr>`).join('');

    loading.style.display = 'none';
    content.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading cross-sell:', error);
    loading.style.display = 'none';
    content.classList.remove('hidden');
  }
}

// ====================================================================
// ANOMALIAS
// ====================================================================
async function loadAnomalias() {
  const loading = document.getElementById('loading-anomalias');
  const content = document.getElementById('content-anomalias');
  loading.style.display = 'flex';
  content.classList.add('hidden');

  try {
    const data = await fetchData(`/anomalias/dashboard/${currentStore}`);

    const total = data.total || 18;
    const criticas = data.criticas || 3;
    const altas = data.altas || 7;
    const medias = data.medias || 8;

    // KPIs
    const kpiGrid = document.getElementById('anomaliaKpis');
    kpiGrid.innerHTML = `
      <div class="kpi-card kpi-card-wide">
        <div class="kpi-icon kpi-red"><i class="fas fa-triangle-exclamation"></i></div>
        <div class="kpi-body">
          <span class="kpi-label">Total de Anomalias</span>
          <span class="kpi-value">${total}</span>
          <span class="kpi-texto">Desvios identificados nos ultimos 7 dias pelo motor de deteccao.</span>
        </div>
      </div>
      <div class="kpi-card kpi-card-wide">
        <div class="kpi-icon kpi-orange"><i class="fas fa-bolt"></i></div>
        <div class="kpi-body">
          <span class="kpi-label">Criticas</span>
          <span class="kpi-value text-red">${criticas}</span>
          <span class="kpi-texto">Anomalias que exigem acao imediata para evitar perdas financeiras.</span>
        </div>
      </div>
      <div class="kpi-card kpi-card-wide">
        <div class="kpi-icon kpi-yellow"><i class="fas fa-exclamation"></i></div>
        <div class="kpi-body">
          <span class="kpi-label">Altas Prioridade</span>
          <span class="kpi-value" style="color:var(--color-warning);">${altas}</span>
          <span class="kpi-texto">Devem ser analisadas nas proximas 24 horas pela equipe de gestao.</span>
        </div>
      </div>`;

    // Insights
    const insightsContainer = document.getElementById('anomalias-insights');
    if (insightsContainer) {
      const insights = data.insights || [
        `${criticas} anomalias criticas detectadas - todas relacionadas a desvios de preco e estoque.`,
        'Produto "Cerveja Premium 600ml" teve queda de 40% nas vendas sem justificativa aparente.',
        'Pico anomalo de vendas de Guarda-Chuva detectado - correlacao com previsao de chuva forte.',
        'Recomendacao: investigar divergencia de estoque em Frios - sistema aponta 15 unidades a menos.',
        'O motor de deteccao identificou padroes sazonais que explicam 60% das anomalias de media prioridade.'
      ];
      insightsContainer.innerHTML = renderInsightCard(insights, 'Analise de Anomalias');
    }

    // Anomaly cards
    const anomalias = data.anomalias || data.lista || [
      { produto: 'Cerveja Premium 600ml', tipo: 'Queda de Vendas', severidade: 'critica', desvio: '-40%', descricao: 'Vendas cairam 40% sem alteracao de preco ou estoque. Possivel problema de posicionamento ou concorrencia.', sugestao: 'Verificar preco da concorrencia e posicao na gondola. Considerar promocao relampago.' },
      { produto: 'Guarda-Chuva Compacto', tipo: 'Pico de Vendas', severidade: 'alta', desvio: '+280%', descricao: 'Vendas subiram 280% acima da media. Correlacao com previsao meteorologica de chuva forte.', sugestao: 'Reabastecer estoque rapidamente. Considerar display na entrada da loja.' },
      { produto: 'Frios Diversos', tipo: 'Divergencia Estoque', severidade: 'critica', desvio: '-15 un', descricao: 'Sistema aponta 15 unidades a menos do que o inventario fisico deveria ter.', sugestao: 'Realizar contagem fisica imediata. Verificar cameras de seguranca do setor.' },
      { produto: 'Sorvete 2L', tipo: 'Pico de Vendas', severidade: 'alta', desvio: '+85%', descricao: 'Alta de 85% em vendas - temperatura de 36 graus explicam parcialmente o pico.', sugestao: 'Manter estoque reforçado enquanto calor persistir. Negociar lote extra com fornecedor.' },
    ];

    const anomaliasContainer = document.getElementById('anomalias-cards');
    if (anomaliasContainer) {
      anomaliasContainer.innerHTML = anomalias.map(a => `
        <div class="anomaly-card ${a.severidade}">
          <div class="anomaly-header">
            <strong style="color:var(--color-text);">${a.produto}</strong>
            <span style="font-size:0.8rem; color:${a.severidade === 'critica' ? 'var(--color-danger)' : 'var(--color-warning)'}; font-weight:600; text-transform:uppercase;">${a.severidade}</span>
          </div>
          <div style="font-size:0.8rem; color:var(--color-text-dim); margin-bottom:0.25rem;">${a.tipo} | Desvio: ${a.desvio}</div>
          <div class="anomaly-descricao">${a.descricao}</div>
          <div class="anomaly-sugestao">Sugestao: ${a.sugestao}</div>
        </div>`).join('');
    }

    // Chart
    renderAnomaliaChart(
      ['Critica', 'Alta', 'Media'],
      [criticas, altas, medias]
    );

    // Table
    const tbody = document.querySelector('#anomaliasTable tbody');
    if (tbody) {
      tbody.innerHTML = anomalias.map(a => `
        <tr>
          <td>${a.produto}</td>
          <td>${a.tipo}</td>
          <td class="${String(a.desvio).includes('-') ? 'text-red' : 'text-green'}">${a.desvio}</td>
          <td><span style="color:${a.severidade === 'critica' ? 'var(--color-danger)' : a.severidade === 'alta' ? 'var(--color-warning)' : 'var(--color-primary)'}; font-weight:600;">${a.severidade}</span></td>
          <td>${a.data || 'Hoje'}</td>
        </tr>`).join('');
    }

    loading.style.display = 'none';
    content.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading anomalies:', error);
    loading.style.display = 'none';
    content.classList.remove('hidden');
  }
}

// ====================================================================
// ALERTAS
// ====================================================================
async function loadAlertas() {
  const loading = document.getElementById('loading-alertas');
  const content = document.getElementById('content-alertas');
  loading.style.display = 'flex';
  content.classList.add('hidden');

  try {
    const data = await fetchData(`/alertas/${currentStore}`);
    const alertas = Array.isArray(data) ? data : (data.alertas || [
      { id: 1, titulo: 'Estoque critico: Refrigerante Cola 2L', urgencia: 'critico', status: 'aberto', descricao: 'Apenas 5 unidades em estoque. Minimo configurado: 30 unidades. Reposicao urgente necessaria.', acao: 'Fazer pedido emergencial ao fornecedor.' },
      { id: 2, titulo: 'Vencimento proximo: 7 itens em Laticinios', urgencia: 'alto', status: 'aberto', descricao: 'Iogurtes e queijos vencem nos proximos 3 dias. Valor em risco: R$ 420.', acao: 'Aplicar desconto progressivo e destacar em promocoes.' },
      { id: 3, titulo: 'Anomalia de preco: Cerveja Premium', urgencia: 'medio', status: 'aberto', descricao: 'Queda de 40% nas vendas sem alteracao de preco. Concorrencia pode ter baixado preco.', acao: 'Verificar precos da concorrencia e ajustar se necessario.' },
    ]);

    document.getElementById('alertBadge').textContent = alertas.length;

    const alertsList = document.getElementById('alertsList');
    alertsList.innerHTML = alertas.map(a => {
      const colors = { critico: 'var(--color-danger)', alto: 'var(--color-warning)', medio: 'var(--color-primary)' };
      const icons = { critico: 'fa-circle-exclamation', alto: 'fa-triangle-exclamation', medio: 'fa-info-circle' };
      return `
        <div class="anomaly-card ${a.urgencia === 'critico' ? 'critica' : a.urgencia}" data-filter="${a.urgencia}">
          <div class="anomaly-header">
            <span style="display:flex; align-items:center; gap:0.5rem;">
              <i class="fas ${icons[a.urgencia] || 'fa-bell'}" style="color:${colors[a.urgencia]};"></i>
              <strong style="color:var(--color-text);">${a.titulo}</strong>
            </span>
            <span style="font-size:0.75rem; color:${colors[a.urgencia]}; font-weight:600; text-transform:uppercase;">${a.urgencia}</span>
          </div>
          <div class="anomaly-descricao">${a.descricao || ''}</div>
          ${a.acao ? `<div class="anomaly-sugestao">Acao recomendada: ${a.acao}</div>` : ''}
        </div>`;
    }).join('');

    // Filter tabs
    document.querySelectorAll('#alertTabs .filter-tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('#alertTabs .filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const filter = tab.dataset.filter;
        alertsList.querySelectorAll('.anomaly-card').forEach(card => {
          if (filter === 'all' || card.dataset.filter === filter) {
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        });
      };
    });

    loading.style.display = 'none';
    content.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading alerts:', error);
    loading.style.display = 'none';
    content.classList.remove('hidden');
  }
}

// ====================================================================
// BASE DE CLIENTES — Novos Clientes, LTV e Produtos Mais Comprados
// ====================================================================
async function loadBaseClientes() {
  const loading = document.getElementById('loading-base-clientes');
  const content = document.getElementById('content-base-clientes');
  if (!loading || !content) return;
  loading.style.display = 'flex';
  content.classList.add('hidden');

  try {
    // Mock data (replace with API call when endpoint available)
    const novosClientes = [
      { nome: 'Amanda Ferreira',    cadastro: '22/03/2026', canal: 'App',       primeira_compra: 'R$ 87,50',  ltv: 'R$ 87,50',    segmento: 'Potencial' },
      { nome: 'Bruno Carvalho',     cadastro: '21/03/2026', canal: 'PDV',       primeira_compra: 'R$ 124,30', ltv: 'R$ 124,30',   segmento: 'Potencial' },
      { nome: 'Claudia Menezes',    cadastro: '20/03/2026', canal: 'WhatsApp',  primeira_compra: 'R$ 210,00', ltv: 'R$ 210,00',   segmento: 'Potencial' },
      { nome: 'Diego Rocha',        cadastro: '19/03/2026', canal: 'PDV',       primeira_compra: 'R$ 56,80',  ltv: 'R$ 56,80',    segmento: 'Potencial' },
      { nome: 'Elaine Souza',       cadastro: '18/03/2026', canal: 'App',       primeira_compra: 'R$ 340,00', ltv: 'R$ 480,00',   segmento: 'Leal' },
      { nome: 'Fernando Lima',      cadastro: '16/03/2026', canal: 'PDV',       primeira_compra: 'R$ 98,40',  ltv: 'R$ 289,60',   segmento: 'Leal' },
      { nome: 'Gabriela Teixeira',  cadastro: '14/03/2026', canal: 'WhatsApp',  primeira_compra: 'R$ 175,20', ltv: 'R$ 521,40',   segmento: 'Leal' },
      { nome: 'Henrique Pinto',     cadastro: '12/03/2026', canal: 'App',       primeira_compra: 'R$ 62,10',  ltv: 'R$ 62,10',    segmento: 'Potencial' },
      { nome: 'Isabela Duarte',     cadastro: '10/03/2026', canal: 'PDV',       primeira_compra: 'R$ 450,00', ltv: 'R$ 1.280,00', segmento: 'Campeao' },
      { nome: 'Joao Victor Nunes',  cadastro: '05/03/2026', canal: 'App',       primeira_compra: 'R$ 88,90',  ltv: 'R$ 325,00',   segmento: 'Leal' },
    ];

    const ltvRanking = [
      { nome: 'Maria Silva',        desde: 'Jan/2024', visitas: 128, ticket_medio: 'R$ 156,25', ltv: 'R$ 20.000,00', segmento: 'Campeao' },
      { nome: 'Joao Santos',        desde: 'Mar/2024', visitas: 112, ticket_medio: 'R$ 142,86', ltv: 'R$ 16.000,00', segmento: 'Campeao' },
      { nome: 'Ana Costa',          desde: 'Jun/2024', visitas: 89,  ticket_medio: 'R$ 120,34', ltv: 'R$ 10.710,00', segmento: 'Leal' },
      { nome: 'Pedro Lima',         desde: 'Ago/2024', visitas: 74,  ticket_medio: 'R$ 133,11', ltv: 'R$ 9.850,00',  segmento: 'Leal' },
      { nome: 'Carla Souza',        desde: 'Set/2024', visitas: 62,  ticket_medio: 'R$ 148,39', ltv: 'R$ 9.200,00',  segmento: 'Leal' },
      { nome: 'Isabela Duarte',     desde: 'Mar/2026', visitas: 8,   ticket_medio: 'R$ 160,00', ltv: 'R$ 1.280,00',  segmento: 'Campeao' },
      { nome: 'Roberto Andrade',    desde: 'Nov/2024', visitas: 51,  ticket_medio: 'R$ 112,55', ltv: 'R$ 5.740,00',  segmento: 'Leal' },
      { nome: 'Fernanda Castro',    desde: 'Jan/2025', visitas: 44,  ticket_medio: 'R$ 125,00', ltv: 'R$ 5.500,00',  segmento: 'Leal' },
      { nome: 'Lucas Oliveira',     desde: 'Fev/2025', visitas: 39,  ticket_medio: 'R$ 130,77', ltv: 'R$ 5.100,00',  segmento: 'Potencial' },
      { nome: 'Patricia Mendes',    desde: 'Mar/2025', visitas: 36,  ticket_medio: 'R$ 122,22', ltv: 'R$ 4.400,00',  segmento: 'Leal' },
    ];

    const produtosMaisComprados = [
      { produto: 'Refrigerante Cola 2L',   categoria: 'Bebidas',    unidades: 2840, receita: 'R$ 18.460,00', pct: '8.2%' },
      { produto: 'Pao Frances (kg)',        categoria: 'Padaria',    unidades: 2215, receita: 'R$ 13.290,00', pct: '5.9%' },
      { produto: 'Leite Integral 1L',       categoria: 'Laticinios', unidades: 1980, receita: 'R$ 9.900,00',  pct: '4.4%' },
      { produto: 'Arroz Tipo 1 5kg',        categoria: 'Alimentos',  unidades: 1640, receita: 'R$ 32.800,00', pct: '14.6%' },
      { produto: 'Cerveja Lata 350ml',      categoria: 'Bebidas',    unidades: 1520, receita: 'R$ 10.640,00', pct: '4.7%' },
      { produto: 'Feijao Preto 1kg',        categoria: 'Alimentos',  unidades: 1380, receita: 'R$ 8.280,00',  pct: '3.7%' },
      { produto: 'Iogurte Natural 170g',    categoria: 'Laticinios', unidades: 1210, receita: 'R$ 4.235,00',  pct: '1.9%' },
      { produto: 'Manteiga com Sal 200g',   categoria: 'Laticinios', unidades: 1080, receita: 'R$ 7.560,00',  pct: '3.4%' },
      { produto: 'Sabao em Po 1kg',         categoria: 'Higiene',    unidades: 980,  receita: 'R$ 6.860,00',  pct: '3.1%' },
      { produto: 'Acucar Cristal 2kg',      categoria: 'Alimentos',  unidades: 920,  receita: 'R$ 4.600,00',  pct: '2.0%' },
    ];

    // KPIs
    document.getElementById('bc-novos').textContent = novosClientes.length;
    document.getElementById('bc-novos-delta').textContent = '+18% vs mes anterior';
    document.getElementById('bc-ltv-medio').textContent = 'R$ 3.847,00';
    document.getElementById('bc-ltv-max').textContent = 'R$ 20.000,00';
    document.getElementById('bc-ltv-max-nome').textContent = 'Maria Silva';
    document.getElementById('bc-top-produto').textContent = produtosMaisComprados[0].produto;
    document.getElementById('bc-top-unidades').textContent = produtosMaisComprados[0].unidades + ' unidades no mes';

    // Novos Clientes Table
    const tbodyNovos = document.querySelector('#bcNovosTable tbody');
    if (tbodyNovos) {
      tbodyNovos.innerHTML = novosClientes.map((c, i) => {
        const segColor = c.segmento === 'Campeao' ? 'var(--color-success)' : c.segmento === 'Leal' ? '#3b82f6' : 'var(--color-warning)';
        return `<tr>
          <td>${i + 1}</td>
          <td>${c.nome}</td>
          <td>${c.cadastro}</td>
          <td><span style="font-size:0.75rem; padding:2px 8px; border-radius:4px; background:rgba(34,197,94,0.1); color:var(--color-primary-light);">${c.canal}</span></td>
          <td>${c.primeira_compra}</td>
          <td class="text-green">${c.ltv}</td>
          <td><span style="color:${segColor}; font-weight:600;">${c.segmento}</span></td>
        </tr>`;
      }).join('');
    }

    // LTV Ranking Table
    const tbodyLtv = document.querySelector('#bcLtvTable tbody');
    if (tbodyLtv) {
      tbodyLtv.innerHTML = ltvRanking.map((c, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
        const segColor = c.segmento === 'Campeao' ? 'var(--color-success)' : c.segmento === 'Leal' ? '#3b82f6' : 'var(--color-warning)';
        return `<tr>
          <td>${medal}</td>
          <td>${c.nome}</td>
          <td style="color:var(--color-text-dim);">${c.desde}</td>
          <td>${c.visitas}x</td>
          <td>${c.ticket_medio}</td>
          <td class="text-green" style="font-weight:700;">${c.ltv}</td>
          <td><span style="color:${segColor}; font-weight:600;">${c.segmento}</span></td>
        </tr>`;
      }).join('');
    }

    // Produtos Mais Comprados Table
    const tbodyProd = document.querySelector('#bcProdTable tbody');
    if (tbodyProd) {
      tbodyProd.innerHTML = produtosMaisComprados.map((p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${p.produto}</td>
          <td style="color:var(--color-text-dim);">${p.categoria}</td>
          <td>${p.unidades.toLocaleString('pt-BR')}</td>
          <td class="text-green">${p.receita}</td>
          <td><span class="assertividade-badge" style="font-size:0.75rem; padding:2px 8px;">${p.pct}</span></td>
        </tr>`).join('');
    }

    // Period selectors
    document.getElementById('bcProdPeriodo').addEventListener('change', (e) => {
      showToast(`Filtrando produtos por: ${e.target.options[e.target.selectedIndex].text}`, 'info');
    });
    document.getElementById('bcNovosPeriodo').addEventListener('change', (e) => {
      showToast(`Filtrando novos clientes por: ${e.target.options[e.target.selectedIndex].text}`, 'info');
    });

    // Insights
    const insightsEl = document.getElementById('base-clientes-insights');
    if (insightsEl) {
      insightsEl.innerHTML = renderInsightCard([
        '10 novos clientes adquiridos em marco — crescimento de 18% em relacao a fevereiro.',
        'LTV medio de R$ 3.847 esta 12% acima da meta trimestral de R$ 3.400.',
        'Maria Silva lidera o ranking de LTV com R$ 20.000 acumulados desde jan/2024 (128 visitas).',
        'Refrigerante Cola 2L e o produto mais comprado do mes — considere garantir estoque para o fim de semana.',
        'Arroz Tipo 1 5kg lidera em receita (R$ 32.800) apesar do menor volume de unidades — alto ticket.',
        'Recomendacao: clientes Potenciais (cadastrados recentemente) devem receber oferta de segunda compra com desconto de 10%.',
        'Canal App trouxe 40% dos novos clientes do mes — considere investir em push notifications.'
      ], 'Analise — Base de Clientes');
    }

    loading.style.display = 'none';
    content.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading base clientes:', error);
    loading.style.display = 'none';
    content.classList.remove('hidden');
  }
}

// ====================================================================
// CLIMA (Demo)
// ====================================================================
function loadClima() {
  // Static content already in HTML, nothing to load
}

// ====================================================================
// SHELF (Demo)
// ====================================================================
function loadShelf() {
  // Static content already in HTML, nothing to load
}

// ====================================================================
// CONFIG — Perfil da Loja, Assinatura, Sistema
// ====================================================================
function loadConfig() {
  // Wire up config tab switching
  const tabs = document.querySelectorAll('[data-config-tab]');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.configTab;
      ['perfil', 'assinatura', 'sistema'].forEach(id => {
        const el = document.getElementById(`config-tab-${id}`);
        if (el) el.style.display = id === target ? '' : 'none';
      });
    });
  });

  // Load saved profile from localStorage
  carregarPerfil();
}

function salvarPerfil() {
  const campos = ['razao-social', 'nome-fantasia', 'cnpj', 'segmento', 'num-lojas',
    'faturamento', 'responsavel', 'cargo', 'email', 'telefone', 'cidade', 'endereco'];
  const perfil = {};
  campos.forEach(c => {
    const el = document.getElementById(`cfg-${c}`);
    if (el) perfil[c] = el.value;
  });
  localStorage.setItem('sm_perfil_loja', JSON.stringify(perfil));
  showToast('Perfil salvo com sucesso!', 'success');
}

function carregarPerfil() {
  try {
    const raw = localStorage.getItem('sm_perfil_loja');
    if (!raw) return;
    const perfil = JSON.parse(raw);
    Object.entries(perfil).forEach(([k, v]) => {
      const el = document.getElementById(`cfg-${k}`);
      if (el) el.value = v;
    });
  } catch (e) {
    // ignore
  }
}

// ====================================================================
// TOAST
// ====================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    padding: 12px 16px;
    margin-bottom: 8px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 6px;
    animation: fadeIn 300ms ease-in;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ====================================================================
// REPORT EXPORT
// ====================================================================
function handleReportExport(action) {
  const formats = {
    'export-vendas': 'CSV',
    'export-perdas': 'Excel',
    'export-rfm': 'CSV',
    'export-previsao': 'PDF',
    'export-anomalias': 'CSV',
    'export-crosssell': 'PDF',
  };
  showToast(`Exportando relatorio em ${formats[action]}...`, 'info');
  setTimeout(() => {
    showToast('Relatorio exportado com sucesso!', 'success');
  }, 2000);
}

// ====================================================================
// AUTO REFRESH
// ====================================================================
function startAutoRefresh() {
  setInterval(() => {
    const now = new Date().toLocaleTimeString('pt-BR');
    document.getElementById('lastUpdate').textContent = `Atualizado as ${now}`;
  }, 30000);
}

// ====================================================================
// MOCK DATA
// ====================================================================
function getMockData(endpoint) {
  if (endpoint.includes('/dashboard/')) {
    return {
      kpis: {
        receita_hoje: 12450, receita_delta: '+12.5%',
        margem_media: 18.5, margem_delta: '+2.3%',
        taxa_perdas: 2.1, perdas_delta: '-0.5%',
        alertas_ativos: 3,
        textos: {
          receita: 'Receita acumulada do dia com base nas vendas finalizadas no PDV.',
          margem: 'Margem media ponderada considerando custo e preco de venda.',
          perdas: 'Taxa de perdas inclui vencidos, avarias e quebra operacional.',
          alertas: 'Alertas que precisam de atencao imediata da equipe.'
        }
      },
      insights: [
        'Receita 12.5% acima da media dos ultimos 7 dias - tendencia de alta se mantem desde segunda-feira.',
        'Categoria Bebidas lidera vendas com 28% do faturamento, puxada por temperaturas acima de 30 graus.',
        'Taxa de perdas caiu 0.5pp em relacao a semana anterior - acoes de controle de validade estao funcionando.',
        'Tres alertas ativos exigem atencao: 2 de estoque critico e 1 anomalia de preco detectada.',
        'Recomendacao: reforcar estoque de Refrigerantes e Cervejas para o fim de semana.'
      ],
      vendas_7_dias: [
        { dia: 'Seg', valor: 8200 }, { dia: 'Ter', valor: 9400 }, { dia: 'Qua', valor: 7800 },
        { dia: 'Qui', valor: 10500 }, { dia: 'Sex', valor: 11200 }, { dia: 'Sab', valor: 12800 }, { dia: 'Dom', valor: 10600 }
      ],
      mix_categorias: [
        { categoria: 'Alimentos', percentual: 28 }, { categoria: 'Bebidas', percentual: 22 },
        { categoria: 'Laticinios', percentual: 18 }, { categoria: 'Higiene', percentual: 20 }, { categoria: 'Outros', percentual: 12 }
      ]
    };
  }

  if (endpoint.includes('/previsao/')) {
    return {
      previsoes: {
        amanha: { valor: 13200, texto: 'Esperamos alta de 5% puxada pelo fluxo de meio de semana e promocoes ativas em Bebidas.' },
        semana: { valor: 89500, texto: 'Projecao semanal considera sazonalidade e eventos locais. Fim de semana deve concentrar 40% das vendas.' },
        mes: { valor: 385000, texto: 'Tendencia mensal positiva. Categoria Alimentos deve liderar com 35% do faturamento total previsto.' }
      },
      assertividade: 91.2,
      metodologia: 'Modelo hibrido: media movel ponderada + regressao com sazonalidade + ajuste por eventos. Treinado com 12 meses de historico, recalculado diariamente.',
      insights: [
        'A assertividade do modelo se manteve acima de 90% nas ultimas 4 semanas consecutivas.',
        'Categoria Padaria apresenta maior desvio (8.3%) - considere ajustar estoque manualmente.',
        'Vendas de sabado tem crescido 3% ao mes - modelo ja incorporou essa tendencia.',
        'Recomendacao: aumentar pedido de Laticinios em 15% para proxima semana (tendencia de alta).'
      ],
      por_categoria: [
        { categoria: 'Alimentos', previsto: 32500, realizado: 31800, desvio: -2.2, assertividade: 97.8 },
        { categoria: 'Bebidas', previsto: 24100, realizado: 25200, desvio: 4.6, assertividade: 95.4 },
        { categoria: 'Laticinios', previsto: 18200, realizado: 16700, desvio: -8.3, assertividade: 91.7 },
        { categoria: 'Higiene', previsto: 15800, realizado: 16100, desvio: 1.9, assertividade: 98.1 },
        { categoria: 'Padaria', previsto: 12400, realizado: 11500, desvio: -7.3, assertividade: 92.7 }
      ]
    };
  }

  if (endpoint.includes('/estoque/')) {
    return {
      total_skus: 1543, baixo_estoque_count: 18, vencendo_count: 7,
      insights: [
        '18 produtos estao com estoque abaixo do minimo e precisam de reposicao urgente.',
        '7 itens vencem nos proximos 7 dias - priorize promocoes para evitar perdas.',
        'Categoria Laticinios concentra 45% dos itens proximos ao vencimento.',
        'Recomendacao: negociar com fornecedor lotes menores de Iogurtes para reduzir desperdicio.',
        'Giro de estoque medio esta em 8.2 dias - dentro da meta de 10 dias.'
      ],
      baixo_estoque: [
        { produto: 'Refrigerante Cola 2L', estoque: 5, minimo: 30, categoria: 'Bebidas' },
        { produto: 'Leite Integral 1L', estoque: 8, minimo: 50, categoria: 'Laticinios' },
        { produto: 'Pao Frances (kg)', estoque: 3, minimo: 20, categoria: 'Padaria' },
        { produto: 'Cerveja Lata 350ml', estoque: 12, minimo: 60, categoria: 'Bebidas' },
        { produto: 'Iogurte Natural 170g', estoque: 4, minimo: 25, categoria: 'Laticinios' }
      ],
      vencendo: [
        { produto: 'Iogurte Morango 170g', validade: '2026-03-23', dias_restantes: 2, categoria: 'Laticinios' },
        { produto: 'Presunto Fatiado 200g', validade: '2026-03-24', dias_restantes: 3, categoria: 'Frios' },
        { produto: 'Pao de Forma Integral', validade: '2026-03-25', dias_restantes: 4, categoria: 'Padaria' },
        { produto: 'Queijo Minas 500g', validade: '2026-03-26', dias_restantes: 5, categoria: 'Laticinios' }
      ]
    };
  }

  if (endpoint.includes('/perdas/')) {
    return {
      taxa_atual: 2.3, meta: 2.0, valor_perdido: 4850, total_itens: 47,
      insights: [
        'Taxa de perdas atual (2.3%) esta acima da meta de 2.0%.',
        'Padaria e responsavel por 35% de todas as perdas, principalmente por vencimento de paes frescos.',
        'Perdas com Laticinios reduziram 18% apos implementacao do FIFO rigoroso na semana passada.',
        'Sugestao: implementar desconto progressivo para itens com menos de 3 dias de validade.',
        'Custo de perdas equivale a 2.3% do faturamento - cada 0.1pp de reducao economiza R$ 210/mes.'
      ],
      por_categoria: [
        { categoria: 'Padaria', valor: 1700 }, { categoria: 'Laticinios', valor: 1200 },
        { categoria: 'Hortifruti', valor: 890 }, { categoria: 'Frios', valor: 620 }, { categoria: 'Bebidas', valor: 440 }
      ],
      produtos_criticos: [
        { produto: 'Pao Frances (kg)', perda_pct: 8.5, valor: 680, motivo: 'Vencimento', status: 'critico' },
        { produto: 'Iogurte Morango 170g', perda_pct: 6.2, valor: 420, motivo: 'Vencimento', status: 'critico' },
        { produto: 'Banana Prata (kg)', perda_pct: 5.8, valor: 350, motivo: 'Amadurecimento', status: 'alto' },
        { produto: 'Presunto Fatiado 200g', perda_pct: 4.1, valor: 310, motivo: 'Vencimento', status: 'alto' },
        { produto: 'Tomate (kg)', perda_pct: 3.9, valor: 280, motivo: 'Avaria', status: 'medio' },
        { produto: 'Queijo Minas 500g', perda_pct: 3.5, valor: 260, motivo: 'Vencimento', status: 'medio' }
      ]
    };
  }

  if (endpoint.includes('/rfm/')) {
    return {
      segmentos: {
        campeoes: { count: 120, texto: 'Compradores frequentes de alto valor. Mantenha com programa de fidelidade e ofertas exclusivas.' },
        leais: { count: 340, texto: 'Clientes consistentes com boa frequencia. Incentive aumento de ticket medio com cross-sell.' },
        potenciais: { count: 580, texto: 'Compraram recentemente mas sem recorrencia. Envie lembretes e ofertas de segunda compra.' },
        em_risco: { count: 890, texto: 'Diminuiram frequencia nos ultimos 30 dias. Acione campanha de reativacao urgente.' },
        perdidos: { count: 1200, texto: 'Sem compras ha mais de 60 dias. Considere ofertas agressivas ou pesquisa de satisfacao.' }
      },
      insights: [
        'Base de clientes ativos: 3.130 (excluindo perdidos). Crescimento de 4% no ultimo mes.',
        '890 clientes em risco representam potencial de R$ 45.000/mes - reativacao urgente recomendada.',
        'Campeoes respondem por 38% do faturamento total apesar de serem apenas 4% da base.',
        'Sugestao: criar programa "Volte a Comprar" com cupom de 15% para segmento Em Risco.',
        'Ticket medio dos Leais subiu 8% apos implementacao de sugestoes cross-sell no caixa.'
      ],
      top_clientes: [
        { cliente: 'Maria Silva', recencia: 1, frequencia: 28, valor: 'R$ 4.200', segmento: 'Campeao' },
        { cliente: 'Joao Santos', recencia: 2, frequencia: 22, valor: 'R$ 3.800', segmento: 'Campeao' },
        { cliente: 'Ana Costa', recencia: 3, frequencia: 18, valor: 'R$ 2.950', segmento: 'Leal' },
        { cliente: 'Pedro Lima', recencia: 1, frequencia: 15, valor: 'R$ 2.400', segmento: 'Leal' },
        { cliente: 'Carla Souza', recencia: 5, frequencia: 12, valor: 'R$ 1.800', segmento: 'Potencial' }
      ]
    };
  }

  if (endpoint.includes('/anomalias/')) {
    return {
      total: 18, criticas: 3, altas: 7, medias: 8,
      insights: [
        '3 anomalias criticas detectadas - todas relacionadas a desvios de preco e estoque.',
        'Produto "Cerveja Premium 600ml" teve queda de 40% nas vendas sem justificativa aparente.',
        'Pico anomalo de vendas de Guarda-Chuva detectado - correlacao com previsao de chuva forte.',
        'Recomendacao: investigar divergencia de estoque em Frios - sistema aponta 15 unidades a menos.',
        'O motor de deteccao identificou padroes sazonais que explicam 60% das anomalias de media prioridade.'
      ],
      anomalias: [
        { produto: 'Cerveja Premium 600ml', tipo: 'Queda de Vendas', severidade: 'critica', desvio: '-40%', descricao: 'Vendas cairam 40% sem alteracao de preco ou estoque.', sugestao: 'Verificar preco da concorrencia e posicao na gondola.' },
        { produto: 'Guarda-Chuva Compacto', tipo: 'Pico de Vendas', severidade: 'alta', desvio: '+280%', descricao: 'Vendas subiram 280% acima da media.', sugestao: 'Reabastecer estoque rapidamente.' },
        { produto: 'Frios Diversos', tipo: 'Divergencia Estoque', severidade: 'critica', desvio: '-15 un', descricao: 'Sistema aponta 15 unidades a menos do que esperado.', sugestao: 'Realizar contagem fisica imediata.' },
        { produto: 'Sorvete 2L', tipo: 'Pico de Vendas', severidade: 'alta', desvio: '+85%', descricao: 'Alta de 85% em vendas por temperatura elevada.', sugestao: 'Manter estoque reforcado enquanto calor persistir.' }
      ]
    };
  }

  if (endpoint.includes('/cross-sell/')) {
    return {
      pares: [
        { produto_a: 'Cerveja Lata 350ml', produto_b: 'Gelo 5kg', suporte: 0.18, confianca: 0.72, lift: 3.4, texto: 'Altissima correlacao - considere display conjunto.' },
        { produto_a: 'Pao Frances', produto_b: 'Manteiga 200g', suporte: 0.22, confianca: 0.65, lift: 2.8, texto: 'Par classico de cafe da manha.' },
        { produto_a: 'Macarrao 500g', produto_b: 'Molho de Tomate', suporte: 0.15, confianca: 0.58, lift: 2.5, texto: 'Combo refeicao.' },
        { produto_a: 'Refrigerante 2L', produto_b: 'Salgadinho 100g', suporte: 0.12, confianca: 0.52, lift: 2.2, texto: 'Associacao forte em fim de semana.' },
        { produto_a: 'Cafe 500g', produto_b: 'Acucar 1kg', suporte: 0.20, confianca: 0.48, lift: 1.9, texto: 'Par basico de despensa.' }
      ],
      insights: [
        'Cerveja + Gelo e o par mais forte com lift de 3.4.',
        'Pares de cafe da manha (Pao + Manteiga) tem maior suporte: 22%.',
        'Oportunidade: criar combos promocionais com os top 3 pares pode gerar R$ 3.200/mes adicional.',
        'Recomendacao: reposicionar Salgadinhos proximo aos Refrigerantes.',
        'Analise mostra 12 pares com lift acima de 2.0.'
      ]
    };
  }

  if (endpoint.includes('/alertas/')) {
    return [
      { id: 1, titulo: 'Estoque critico: Refrigerante Cola 2L', urgencia: 'critico', status: 'aberto', descricao: 'Apenas 5 unidades em estoque. Minimo configurado: 30 unidades.', acao: 'Fazer pedido emergencial ao fornecedor.' },
      { id: 2, titulo: 'Vencimento proximo: 7 itens em Laticinios', urgencia: 'alto', status: 'aberto', descricao: 'Iogurtes e queijos vencem nos proximos 3 dias. Valor em risco: R$ 420.', acao: 'Aplicar desconto progressivo.' },
      { id: 3, titulo: 'Anomalia de preco: Cerveja Premium', urgencia: 'medio', status: 'aberto', descricao: 'Queda de 40% nas vendas sem alteracao de preco.', acao: 'Verificar precos da concorrencia.' }
    ];
  }

  return {};
}
