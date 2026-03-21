// Easy Market — Dashboard App
// API base URL
const API_BASE = 'http://localhost:3000/api/v1';
const LOJA_ID = 'loja_001';
let refreshTimer = null;

// ─── Router ────────────────────────────────────────────────────────────────
function navigate(section) {
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const target = document.getElementById(`section-${section}`);
  if (target) target.classList.remove('hidden');
  const navLink = document.querySelector(`[data-section="${section}"]`);
  if (navLink) navLink.classList.add('active');
  loadSection(section);
}

function loadSection(section) {
  const loaders = {
    dashboard: loadDashboard,
    previsao: loadPrevisao,
    estoque: loadEstoque,
    clientes: loadClientes,
    crosssell: loadCrossSell,
    anomalias: loadAnomalias,
    alertas: loadAlertas,
    relatorios: loadRelatorios
  };
  if (loaders[section]) loaders[section]();
}

// ─── API helper ────────────────────────────────────────────────────────────
async function fetchData(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`API error [${endpoint}]:`, err.message);
    return null;
  }
}

async function postData(endpoint, body) {
  return fetchData(endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

// ─── Toast ────────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// ─── Loading ─────────────────────────────────────────────────────────────
function setLoading(containerId, loading) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (loading) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div><span>Carregando...</span></div>';
  }
}

// ─── KPI Card helper ──────────────────────────────────────────────────────
function kpiCard(icon, label, value, sub, color = 'blue') {
  return `
    <div class="kpi-card">
      <div class="kpi-icon kpi-icon-${color}"><i class="${icon}"></i></div>
      <div class="kpi-body">
        <div class="kpi-value">${value}</div>
        <div class="kpi-label">${label}</div>
        ${sub ? `<div class="kpi-sub">${sub}</div>` : ''}
      </div>
    </div>`;
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────
async function loadDashboard() {
  setLoading('dash-kpis', true);
  setLoading('dash-status', true);

  const [health, alertas, perdas] = await Promise.all([
    fetchData('/health').catch(() => null).then(r => r || { status: 'offline', totalEndpoints: 0 }),
    fetchData(`/alertas/${LOJA_ID}?status=aberto&limit=5`).then(r => r || { total: 0 }),
    fetchData(`/perdas/taxa-atual/${LOJA_ID}`).then(r => r?.data || { taxa_perda_percentual: 0, valor_total_perdido: 0 })
  ]);

  document.getElementById('dash-kpis').innerHTML = `
    <div class="kpi-grid">
      ${kpiCard('fas fa-server', 'Status do Sistema', health.status === 'online' ? 'Online ✅' : 'Offline ❌', `${health.totalEndpoints || 115} endpoints`, 'green')}
      ${kpiCard('fas fa-bell', 'Alertas Abertos', alertas.total ?? '—', 'Últimas 24h', alertas.total > 5 ? 'red' : 'yellow')}
      ${kpiCard('fas fa-trash', 'Taxa de Perdas', `${perdas.taxa_perda_percentual ?? 0}%`, `R$ ${(perdas.valor_total_perdido ?? 0).toLocaleString('pt-BR')} perdido/30d`, perdas.taxa_perda_percentual > 5 ? 'red' : 'green')}
      ${kpiCard('fas fa-plug', 'Versão', `v${health.versao || '3.0'}`, health.environment || 'production', 'blue')}
    </div>`;

  // System modules status
  const mods = health.endpoints || {};
  const modRows = Object.entries(mods).map(([k, v]) =>
    `<tr><td>${k}</td><td><span class="badge badge-green">${v} endpoints</span></td><td><span class="badge badge-green">Online</span></td></tr>`
  ).join('');

  document.getElementById('dash-status').innerHTML = `
    <div class="card">
      <div class="card-header"><h3>Módulos do Sistema</h3></div>
      <table class="table">
        <thead><tr><th>Módulo</th><th>Endpoints</th><th>Status</th></tr></thead>
        <tbody>${modRows || '<tr><td colspan="3" class="text-muted">Backend offline</td></tr>'}</tbody>
      </table>
    </div>`;

  renderDashboardChart();
}

// ─── PREVISÃO ────────────────────────────────────────────────────────────
async function loadPrevisao() {
  setLoading('prev-cards', true);

  const data = await postData('/predicoes/forecast-tamanho-loja', {
    categoria_id: 'alimentos',
    dias_historico: 90,
    tamanho_loja: 'media'
  });

  const horizontes = data?.previsoes || [
    { horizonte: 'Próximo Dia',      valor: 12400, assertividade: 92, intervalo_min: 11800, intervalo_max: 13000 },
    { horizonte: 'Próxima Semana',   valor: 84700, assertividade: 88, intervalo_min: 80000, intervalo_max: 89400 },
    { horizonte: 'Próxima Quinzena', valor: 168000, assertividade: 82, intervalo_min: 158000, intervalo_max: 178000 },
    { horizonte: 'Próximo Mês',      valor: 340000, assertividade: 76, intervalo_min: 315000, intervalo_max: 365000 }
  ];

  const icons = ['fas fa-calendar-day', 'fas fa-calendar-week', 'fas fa-calendar-alt', 'fas fa-calendar'];
  const colors = ['blue', 'cyan', 'purple', 'orange'];

  document.getElementById('prev-cards').innerHTML = `
    <div class="forecast-grid">
      ${horizontes.map((h, i) => `
        <div class="forecast-card forecast-card-${colors[i]}">
          <div class="forecast-icon"><i class="${icons[i]}"></i></div>
          <div class="forecast-label">${h.horizonte}</div>
          <div class="forecast-value">R$ ${(h.valor || 0).toLocaleString('pt-BR')}</div>
          <div class="forecast-interval">R$ ${(h.intervalo_min||0).toLocaleString('pt-BR')} – R$ ${(h.intervalo_max||0).toLocaleString('pt-BR')}</div>
          <div class="forecast-assertividade">
            <div class="assert-bar">
              <div class="assert-fill" style="width:${h.assertividade||0}%; background: ${h.assertividade >= 88 ? 'var(--green)' : h.assertividade >= 80 ? 'var(--yellow)' : 'var(--red)'}"></div>
            </div>
            <span class="assert-label">${h.assertividade || 0}% assertividade</span>
          </div>
        </div>`).join('')}
    </div>`;

  renderPrevisaoChart(horizontes);
}

// ─── ESTOQUE & PERDAS ─────────────────────────────────────────────────────
async function loadEstoque() {
  setLoading('est-content', true);

  const [taxa, produtos] = await Promise.all([
    fetchData(`/perdas/taxa-atual/${LOJA_ID}`).then(r => r?.data || {}),
    fetchData(`/perdas/produtos-maior-perda/${LOJA_ID}?limite=8`).then(r => r?.data?.produtos || [])
  ]);

  const nivel = taxa.classificacao === 'crítico' ? 'red' : taxa.classificacao === 'alto' ? 'yellow' : 'green';

  document.getElementById('est-content').innerHTML = `
    <div class="kpi-grid" style="margin-bottom:1.5rem">
      ${kpiCard('fas fa-percentage', 'Taxa de Perda', `${taxa.taxa_perda_percentual ?? 0}%`, `Meta: < 2%`, nivel)}
      ${kpiCard('fas fa-dollar-sign', 'Valor Perdido/30d', `R$ ${(taxa.valor_total_perdido ?? 0).toLocaleString('pt-BR')}`, '', 'red')}
      ${kpiCard('fas fa-box', 'Produtos Afetados', taxa.produtos_afetados ?? 0, 'com perda registrada', 'yellow')}
      ${kpiCard('fas fa-chart-line', 'Classificação', taxa.classificacao ?? 'normal', '', nivel)}
    </div>
    <div class="card">
      <div class="card-header"><h3>Top Produtos com Maior Perda</h3></div>
      <table class="table">
        <thead><tr><th>#</th><th>Produto</th><th>Categoria</th><th>Qtd Perdida</th><th>Valor</th><th>Taxa</th><th>Risco</th></tr></thead>
        <tbody>
          ${produtos.length ? produtos.map(p => `
            <tr>
              <td>${p.rank}</td>
              <td>${p.nome || p.produto_id}</td>
              <td><span class="badge badge-blue">${p.categoria || '—'}</span></td>
              <td>${p.quantidade_perdida ?? 0}</td>
              <td>R$ ${(p.valor_perdido ?? 0).toLocaleString('pt-BR')}</td>
              <td>${p.taxa_perda_pct ?? 0}%</td>
              <td><span class="badge badge-${p.nivel_risco === 'crítico' ? 'red' : p.nivel_risco === 'alto' ? 'yellow' : 'green'}">${p.nivel_risco ?? 'médio'}</span></td>
            </tr>`).join('') : '<tr><td colspan="7" class="text-muted text-center">Sem dados de perdas</td></tr>'}
        </tbody>
      </table>
    </div>`;

  renderPerdasChart(produtos);
}

// ============================================================
// ANOMALIAS
// ============================================================
async function loadAnomalias() {
  showLoading('anomalias', true);
  const data = await fetchData(`/anomalias/dashboard/${currentStore}`);
  const mock = getMockAnomalias(data);

  // KPI cards
  const kpisEl = document.getElementById('anomaliaKpis');
  kpisEl.innerHTML = mock.kpis.map(k => `
    <div class="kpi-card kpi-card-wide">
      <div class="kpi-icon ${k.iconClass}"><i class="${k.faIcon}"></i></div>
      <div class="kpi-body">
        <span class="kpi-label">${k.label}</span>
        <span class="kpi-value" style="color:${k.color}">${k.value}</span>
        <span class="kpi-delta neutral">${k.sub}</span>
      </div>
    </div>
  `).join('');

  renderAnomaliaChart('anomaliaChart', mock.chartData);

  const tbody = document.querySelector('#anomaliasTable tbody');
  tbody.innerHTML = mock.recentes.map(a => `
    <tr>
      <td class="text-bold truncate">${a.produto}</td>
      <td>${a.tipo}</td>
      <td class="${a.desvio > 0 ? 'text-red' : 'text-green'}">${a.desvio > 0 ? '+' : ''}${a.desvio}%</td>
      <td><span class="badge ${severityBadge(a.severidade)}">${a.severidade}</span></td>
      <td class="text-muted">${a.data}</td>
    </tr>
  `).join('');

  showLoading('anomalias', false);
}

function severityBadge(sev) {
  const map = { 'Crítico': 'badge-red', 'Alto': 'badge-orange', 'Médio': 'badge-yellow', 'Baixo': 'badge-blue' };
  return map[sev] || 'badge-blue';
}

function getMockAnomalias(apiData) {
  return {
    kpis: [
      { label: 'Total Anomalias', value: '23', sub: 'últimas 24h', iconClass: 'kpi-red', faIcon: 'fas fa-triangle-exclamation', color: 'var(--red)' },
      { label: 'Críticas',        value: '4',  sub: 'ação imediata', iconClass: 'kpi-red', faIcon: 'fas fa-circle-xmark', color: 'var(--red)' },
      { label: 'Em investigação', value: '9',  sub: 'em andamento', iconClass: 'kpi-yellow', faIcon: 'fas fa-magnifying-glass', color: 'var(--yellow)' },
    ],
    chartData: {
      types:   ['Preço', 'Vendas', 'Estoque', 'Margem', 'Frequência'],
      critico: [2, 1, 3, 1, 0],
      alto:    [3, 4, 2, 5, 2],
      medio:   [5, 6, 4, 3, 7],
    },
    recentes: [
      { produto: 'Refrigerante 350ml', tipo: 'Preço',   desvio: +28.4, severidade: 'Crítico', data: 'hoje, 09:14' },
      { produto: 'Arroz 5kg',          tipo: 'Vendas',  desvio: -42.1, severidade: 'Crítico', data: 'hoje, 08:52' },
      { produto: 'Frango Inteiro',      tipo: 'Margem',  desvio: -19.8, severidade: 'Alto',    data: 'hoje, 08:31' },
      { produto: 'Leite UHT 1L',       tipo: 'Estoque', desvio: +67.0, severidade: 'Alto',    data: 'hoje, 07:45' },
      { produto: 'Iogurte 170g',        tipo: 'Vendas',  desvio: +31.2, severidade: 'Médio',   data: 'ontem, 22:10' },
      { produto: 'Pão de Hambúrguer',   tipo: 'Preço',   desvio: +12.5, severidade: 'Médio',   data: 'ontem, 21:33' },
      { produto: 'Café 500g',           tipo: 'Frequência', desvio: -22.0, severidade: 'Médio', data: 'ontem, 19:12' },
    ],
  };
}

// ============================================================
// ALERTAS
// ============================================================
async function loadAlertas() {
  showLoading('alertas', true);
  const data = await fetchData(`/alertas/${currentStore}`);
  const mock = getMockAlertas(data);

  renderAlertsList(mock.alertas, 'all');

  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      renderAlertsList(mock.alertas, filter);
    });
  });

  showLoading('alertas', false);
}

function renderAlertsList(alertas, filter) {
  const filtered = filter === 'all' ? alertas : alertas.filter(a => a.urgencia.toLowerCase() === filter);
  const container = document.getElementById('alertsList');

  if (!filtered.length) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)"><i class="fas fa-check-circle" style="font-size:32px;margin-bottom:10px;display:block;color:var(--green)"></i>Nenhum alerta nesta categoria</div>';
    return;
  }

  container.innerHTML = filtered.map(a => `
    <div class="alert-item alert-${a.urgencia.toLowerCase()}">
      <div class="alert-icon ${a.iconBg}"><i class="${a.faIcon}" style="color:${a.color}"></i></div>
      <div class="alert-body">
        <div class="alert-title">${a.titulo}</div>
        <div class="alert-desc">${a.descricao}</div>
        <div class="alert-meta">
          <span class="badge ${a.urgenciaBadge}">${a.urgencia}</span>
          <span class="text-muted" style="font-size:11px"><i class="fas fa-clock" style="margin-right:4px"></i>${a.tempo}</span>
          ${a.loja ? `<span class="text-muted" style="font-size:11px"><i class="fas fa-location-dot" style="margin-right:4px"></i>${a.loja}</span>` : ''}
        </div>
      </div>
      <div class="alert-actions">
        <button class="btn-sm" onclick="handleAlertAction('ver', '${a.id}')">Ver</button>
        <button class="btn-sm" onclick="handleAlertAction('resolver', '${a.id}')">Resolver</button>
      </div>
    </div>
  `).join('');
}

function handleAlertAction(action, id) {
  showToast(action === 'resolver' ? 'success' : 'info',
    action === 'resolver' ? 'Alerta marcado como resolvido' : 'Abrindo detalhes do alerta #' + id);
}

function getMockAlertas(apiData) {
  return {
    alertas: [
      {
        id: 'A001', titulo: 'Estoque Crítico: Refrigerantes',
        descricao: 'Coca-Cola 2L e Guaraná 2L com menos de 12h de estoque. Reposição urgente necessária.',
        urgencia: 'Crítico', urgenciaBadge: 'badge-red',
        faIcon: 'fas fa-box-open', iconBg: 'kpi-red', color: 'var(--red)',
        tempo: 'há 23 min', loja: 'Loja 001',
      },
      {
        id: 'A002', titulo: 'Anomalia de Preço Detectada',
        descricao: 'Refrigerante 350ml com preço 28% acima da média histórica. Possível erro de cadastro.',
        urgencia: 'Crítico', urgenciaBadge: 'badge-red',
        faIcon: 'fas fa-tag', iconBg: 'kpi-red', color: 'var(--red)',
        tempo: 'há 47 min', loja: 'Loja 001',
      },
      {
        id: 'A003', titulo: 'Queda Brusca nas Vendas de Arroz',
        descricao: 'Vendas de Arroz 5kg caíram 42% em relação à média dos últimos 7 dias.',
        urgencia: 'Alto', urgenciaBadge: 'badge-orange',
        faIcon: 'fas fa-chart-line-down', iconBg: 'kpi-orange', color: 'var(--accent-orange)',
        tempo: 'há 1h 12min', loja: 'Loja 001',
      },
      {
        id: 'A004', titulo: 'Taxa de Perdas Acima da Meta',
        descricao: 'Taxa de perda de FLV atingiu 5,8%, acima da meta de 4%. Verificar validades.',
        urgencia: 'Alto', urgenciaBadge: 'badge-orange',
        faIcon: 'fas fa-arrow-trend-up', iconBg: 'kpi-orange', color: 'var(--accent-orange)',
        tempo: 'há 2h', loja: 'Loja 001',
      },
      {
        id: 'A005', titulo: '48 Clientes VIP sem Compra há 15 dias',
        descricao: 'Clientes de alto valor em risco de churn. Recomendado campanha de reativação.',
        urgencia: 'Médio', urgenciaBadge: 'badge-yellow',
        faIcon: 'fas fa-users', iconBg: 'kpi-yellow', color: 'var(--yellow)',
        tempo: 'há 3h', loja: 'Loja 001',
      },
      {
        id: 'A006', titulo: 'Oportunidade Cross-Sell: Bebidas',
        descricao: '12 clientes que compraram cerveja não levaram amendoim. Sugestão de bundles.',
        urgencia: 'Médio', urgenciaBadge: 'badge-yellow',
        faIcon: 'fas fa-cart-plus', iconBg: 'kpi-yellow', color: 'var(--yellow)',
        tempo: 'há 4h', loja: 'Loja 001',
      },
      {
        id: 'A007', titulo: 'Sincronização ERP Pendente',
        descricao: 'Última sincronização com o ERP há 6 horas. Dados podem estar desatualizados.',
        urgencia: 'Médio', urgenciaBadge: 'badge-yellow',
        faIcon: 'fas fa-rotate', iconBg: 'kpi-yellow', color: 'var(--yellow)',
        tempo: 'há 6h', loja: null,
      },
    ],
  };
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(type, message, duration = 4000) {
  const icons = {
    success: '<i class="fas fa-check-circle" style="color:var(--green)"></i>',
    error:   '<i class="fas fa-circle-xmark" style="color:var(--red)"></i>',
    warning: '<i class="fas fa-triangle-exclamation" style="color:var(--yellow)"></i>',
    info:    '<i class="fas fa-circle-info" style="color:var(--accent-blue)"></i>',
  };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-xmark"></i></button>
  `;
  document.getElementById('toastContainer').appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ============================================================
// AUTO-REFRESH & UTILITIES
// ============================================================
function updateLastRefresh() {
  document.getElementById('lastUpdate').textContent = 'Atualizado às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function startAutoRefresh() {
  clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    const loaders = {
      dashboard: loadDashboard, previsao: loadPrevisao,
      estoque: loadEstoque, clientes: loadClientes,
      crosssell: loadCrossSell, anomalias: loadAnomalias,
      alertas: loadAlertas,
    };
    if (loaders[currentSection]) loaders[currentSection]();
  }, REFRESH_INTERVAL);
}

// ============================================================
// EVENT LISTENERS & INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Nav links
  document.querySelectorAll('.nav-item[data-section]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(link.dataset.section);
    });
  });

  // Mobile sidebar toggle
  const sidebar = document.getElementById('sidebar');
  document.getElementById('topbarMenuBtn')?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Refresh button
  document.getElementById('refreshBtn')?.addEventListener('click', () => {
    const btn = document.getElementById('refreshBtn');
    btn.classList.add('spinning');
    const loaders = {
      dashboard: loadDashboard, previsao: loadPrevisao,
      estoque: loadEstoque, clientes: loadClientes,
      crosssell: loadCrossSell, anomalias: loadAnomalias, alertas: loadAlertas,
    };
    if (loaders[currentSection]) {
      Promise.resolve(loaders[currentSection]()).finally(() => {
        btn.classList.remove('spinning');
        showToast('success', 'Dados atualizados!', 2000);
      });
    } else {
      btn.classList.remove('spinning');
    }
  });

  // Store selector
  document.getElementById('storeSelect')?.addEventListener('change', e => {
    currentStore = e.target.value;
    showToast('info', `Loja alterada para ${e.target.options[e.target.selectedIndex].text}`);
    navigateTo(currentSection);
  });

  // Cross-sell category change
  document.getElementById('crossCategory')?.addEventListener('change', () => {
    if (currentSection === 'crosssell') loadCrossSell();
  });

  // Report export buttons
  document.querySelectorAll('.report-card .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('info', 'Exportação iniciada. O arquivo será baixado em instantes.');
    });
  });

  // Initial load
  navigateTo('dashboard');
  startAutoRefresh();

  // Welcome toast after 500ms
  setTimeout(() => showToast('success', 'Easy Market carregado com sucesso!', 3000), 500);
});

// ─── CLIENTES RFM ─────────────────────────────────────────────────────────
async function loadClientes() {
  setLoading('rfm-content', true);

  const dash = await fetchData(`/rfm/loja/${LOJA_ID}/dashboard`);
  const seg = dash?.segmentos || {};
  const top = dash?.top_clientes || [];

  const segColors = {
    Champions: 'green', 'Loyal Customers': 'blue', 'Potential Loyalists': 'cyan',
    'New Customers': 'purple', 'At Risk': 'red', 'Lost': 'red',
    'Need Attention': 'yellow', 'Promising': 'blue', 'About To Sleep': 'yellow', "Can't Lose Them": 'orange'
  };

  const segEntries = Object.entries(seg);

  document.getElementById('rfm-content').innerHTML = `
    <div class="rfm-grid">
      <div class="card" style="grid-column: span 2">
        <div class="card-header"><h3>Distribuição de Segmentos RFM</h3></div>
        <div class="segment-list">
          ${segEntries.length ? segEntries.map(([s, clientes]) => `
            <div class="segment-item">
              <span class="segment-name">${s}</span>
              <div class="segment-bar-wrap">
                <div class="segment-bar segment-bar-${segColors[s] || 'blue'}" style="width:${Math.min(100, (clientes.length || clientes) * 3)}%"></div>
              </div>
              <span class="segment-count">${clientes.length ?? clientes} clientes</span>
              <span class="badge badge-${segColors[s] || 'blue'}">${s === 'Champions' ? '⭐' : s.includes('Risk') || s === 'Lost' ? '⚠️' : '👤'}</span>
            </div>`).join('') : '<p class="text-muted">Sem dados de segmentação</p>'}
        </div>
        <canvas id="rfm-chart" height="100" style="margin-top:1rem"></canvas>
      </div>
      <div class="card">
        <div class="card-header"><h3>Top Clientes</h3></div>
        <table class="table">
          <thead><tr><th>Cliente</th><th>Score</th><th>Segmento</th></tr></thead>
          <tbody>
            ${top.length ? top.slice(0,8).map(c => `
              <tr>
                <td>${c.cliente_id}</td>
                <td><strong>${c.score_final ?? 0}</strong></td>
                <td><span class="badge badge-${segColors[c.segmento] || 'blue'}">${c.segmento ?? '—'}</span></td>
              </tr>`).join('') : '<tr><td colspan="3" class="text-muted">Sem dados</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>`;

  renderRFMChart(segEntries);
}

// ─── CROSS-SELL ───────────────────────────────────────────────────────────
async function loadCrossSell() {
  setLoading('cs-content', true);

  const data = await fetchData(`/cross-sell/recomendacoes/bebidas?cliente_id=${LOJA_ID}`);
  const recs = data?.recomendacoes || [
    { categoria_origem: 'Cervejas', categoria_destino: 'Salgadinhos', afinidade: 0.87, lift: 1.42 },
    { categoria_origem: 'Arroz', categoria_destino: 'Feijão', afinidade: 0.91, lift: 1.65 },
    { categoria_origem: 'Frango', categoria_destino: 'Temperos', afinidade: 0.78, lift: 1.31 },
    { categoria_origem: 'Leite', categoria_destino: 'Cereais', afinidade: 0.82, lift: 1.38 },
    { categoria_origem: 'Café', categoria_destino: 'Açúcar', afinidade: 0.94, lift: 1.78 }
  ];

  document.getElementById('cs-content').innerHTML = `
    <div class="card">
      <div class="card-header"><h3>Pares de Cross-Sell Recomendados</h3></div>
      <table class="table">
        <thead><tr><th>Produto Origem</th><th></th><th>Produto Destino</th><th>Afinidade</th><th>Lift</th><th>Potencial</th></tr></thead>
        <tbody>
          ${recs.map(r => {
            const afinPct = Math.round((r.afinidade || 0) * 100);
            return `
            <tr>
              <td><span class="badge badge-blue">${r.categoria_origem}</span></td>
              <td style="color:var(--text-muted)">→</td>
              <td><span class="badge badge-purple">${r.categoria_destino}</span></td>
              <td>
                <div class="mini-bar-wrap">
                  <div class="mini-bar" style="width:${afinPct}%; background:${afinPct > 85 ? 'var(--green)' : afinPct > 70 ? 'var(--yellow)' : 'var(--accent-blue)'}"></div>
                </div>
                ${afinPct}%
              </td>
              <td><strong>${r.lift ?? '—'}x</strong></td>
              <td><span class="badge badge-${afinPct > 85 ? 'green' : 'yellow'}">${afinPct > 85 ? 'Alto' : 'Médio'}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

// ─── ANOMALIAS ────────────────────────────────────────────────────────────
async function loadAnomalias() {
  setLoading('anom-content', true);

  const dash = await fetchData(`/anomalias/dashboard/${LOJA_ID}`);
  const totais = dash?.totais_por_tipo || [];
  const severidades = dash?.totais_por_severidade || [];

  document.getElementById('anom-content').innerHTML = `
    <div class="kpi-grid" style="margin-bottom:1.5rem">
      ${kpiCard('fas fa-weight', 'Peso Discrepante', totais.find(t => t.tipo === 'peso_discrepante')?.total ?? 0, 'divergências de balança', 'red')}
      ${kpiCard('fas fa-chart-bar', 'Vendas Anômalas', totais.find(t => t.tipo === 'venda_anomala')?.total ?? 0, 'desvios > 30%', 'yellow')}
      ${kpiCard('fas fa-box-open', 'Estoque Mínimo', totais.find(t => t.tipo === 'estoque_minimo')?.total ?? 0, 'abaixo do mínimo', 'orange')}
      ${kpiCard('fas fa-clock', 'Vencendo', totais.find(t => t.tipo === 'produto_vencendo')?.total ?? 0, 'nos próximos 7 dias', 'purple')}
    </div>
    <div class="card">
      <div class="card-header"><h3>Anomalias por Severidade</h3></div>
      <canvas id="anom-chart" height="80"></canvas>
    </div>`;

  renderAnomaliaChart(severidades);
}

// ─── ALERTAS ──────────────────────────────────────────────────────────────
async function loadAlertas() {
  setLoading('alert-content', true);

  const data = await fetchData(`/alertas/${LOJA_ID}?status=aberto&limit=20`);
  const alertas = data?.alertas || [];

  const urgColors = { alta: 'red', media: 'yellow', baixa: 'blue' };
  const tipoIcons = {
    desperdicio: 'fas fa-trash', falta_estoque: 'fas fa-box-open',
    preco_anormal: 'fas fa-tag', vencimento_proximo: 'fas fa-clock',
    anomalia_peso: 'fas fa-weight', rfm_alerta: 'fas fa-users'
  };

  document.getElementById('alert-content').innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>Alertas Abertos <span class="badge badge-red">${alertas.length}</span></h3>
      </div>
      ${alertas.length ? `
        <div class="alert-list">
          ${alertas.map(a => `
            <div class="alert-item alert-${urgColors[a.urgencia] || 'blue'}">
              <div class="alert-icon"><i class="${tipoIcons[a.tipo] || 'fas fa-bell'}"></i></div>
              <div class="alert-body">
                <div class="alert-title">${a.titulo}</div>
                <div class="alert-meta">
                  <span class="badge badge-${urgColors[a.urgencia] || 'blue'}">${a.urgencia}</span>
                  <span class="badge badge-blue">${a.tipo}</span>
                  <span class="text-muted">${new Date(a.created_at).toLocaleString('pt-BR')}</span>
                </div>
                ${a.mensagem ? `<div class="alert-msg">${a.mensagem}</div>` : ''}
              </div>
              ${a.roi_estimado > 0 ? `<div class="alert-roi">R$ ${a.roi_estimado.toLocaleString('pt-BR')}</div>` : ''}
            </div>`).join('')}
        </div>` : '<p class="text-muted text-center" style="padding:2rem">Nenhum alerta aberto ✅</p>'}
    </div>`;
}

// ─── RELATÓRIOS ───────────────────────────────────────────────────────────
async function loadRelatorios() {
  document.getElementById('rel-content').innerHTML = `
    <div class="card">
      <div class="card-header"><h3>Gerar Relatórios</h3></div>
      <div class="report-grid">
        ${[
          { icon: 'fas fa-chart-line', title: 'Previsão de Vendas', desc: 'Exportar previsões dos 4 horizontes em PDF', endpoint: '/relatorios-pdf/previsao' },
          { icon: 'fas fa-trash', title: 'Análise de Perdas', desc: 'Relatório completo de desperdícios e anomalias', endpoint: '/perdas/relatorio-completo/' + LOJA_ID },
          { icon: 'fas fa-users', title: 'Segmentação RFM', desc: 'Análise completa dos segmentos de clientes', endpoint: '/rfm/loja/' + LOJA_ID + '/dashboard' },
          { icon: 'fas fa-exclamation-triangle', title: 'Anomalias Detectadas', desc: 'Relatório de 24h de anomalias operacionais', endpoint: '/anomalias/relatorio/' + LOJA_ID }
        ].map(r => `
          <div class="report-card">
            <div class="report-icon"><i class="${r.icon}"></i></div>
            <div class="report-title">${r.title}</div>
            <div class="report-desc">${r.desc}</div>
            <button class="btn btn-primary" onclick="generateReport('${r.endpoint}', '${r.title}')">
              <i class="fas fa-download"></i> Gerar
            </button>
          </div>`).join('')}
      </div>
    </div>`;
}

async function generateReport(endpoint, title) {
  toast(`Gerando relatório: ${title}...`, 'info');
  const data = await fetchData(endpoint);
  if (data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    toast(`✅ Relatório "${title}" gerado!`, 'success');
  } else {
    toast(`❌ Erro ao gerar "${title}"`, 'error');
  }
}

// ─── Chart placeholder helpers ────────────────────────────────────────────
function renderDashboardChart() {
  const canvas = document.getElementById('dash-chart');
  if (!canvas || !window.Chart) return;
  if (canvas._chart) canvas._chart.destroy();
  canvas._chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'],
      datasets: [{
        label: 'Vendas (R$)', data: [42000,38000,51000,47000,62000,78000,55000],
        borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', tension: 0.4, fill: true
      }]
    },
    options: { responsive: true, plugins: { legend: { labels: { color: '#94a3b8' } } }, scales: { x: { ticks: { color: '#64748b' } }, y: { ticks: { color: '#64748b' } } } }
  });
}

function renderPrevisaoChart(horizontes) {
  if (window.renderPrevisaoChart) window.renderPrevisaoChart('prev-chart', horizontes);
}
function renderPerdasChart(produtos) {
  if (window.renderPerdasChart) window.renderPerdasChart('est-chart', produtos);
}
function renderRFMChart(segEntries) {
  if (window.renderRFMChart) window.renderRFMChart('rfm-chart', segEntries);
}
function renderAnomaliaChart(severidades) {
  if (window.renderAnomaliaChart) window.renderAnomaliaChart('anom-chart', severidades);
}

// ─── Auto-refresh ─────────────────────────────────────────────────────────
function startAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    const active = document.querySelector('.nav-item.active')?.dataset?.section;
    if (active) loadSection(active);
  }, 30000);
}

// ─── Init ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Nav clicks
  document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigate(link.dataset.section);
    });
  });

  // Sidebar toggle
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  if (toggle) toggle.addEventListener('click', () => sidebar.classList.toggle('collapsed'));

  // Start
  navigate('dashboard');
  startAutoRefresh();
});
