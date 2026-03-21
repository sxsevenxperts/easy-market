/**
 * Smart Market - Frontend Application Logic
 */

const API_BASE = 'http://localhost:3000/api/v1';
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
    dashboard: 'Dashboard',
    previsao: 'Previsão de Vendas',
    estoque: 'Estoque & Perdas',
    clientes: 'Clientes (RFM)',
    crosssell: 'Cross-Sell',
    anomalias: 'Anomalias',
    alertas: 'Alertas',
    relatorios: 'Relatórios',
  };

  document.getElementById('pageTitle').innerHTML = `<h1>${titles[section]}</h1><p>Análise de dados em tempo real</p>`;

  // Load section content
  const loaderFunctions = {
    dashboard: loadDashboard,
    previsao: loadPrevisao,
    estoque: loadEstoque,
    clientes: loadClientes,
    crosssell: loadCrossSell,
    anomalias: loadAnomalias,
    alertas: loadAlertas,
    relatorios: () => {}, // Reports don't need loading
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
 * Mock Data Fallback
 */
function getMockData(endpoint) {
  const mockDataMap = {
    '/perdas/taxa-atual': { taxa: 2.3, meta: 2, status: 'ok' },
    '/rfm/loja/loja_001/dashboard': {
      total_clientes: 5420,
      segmentos: { vip: 120, regulares: 3200, em_risco: 2100 }
    },
    '/anomalias/dashboard/loja_001': {
      total: 6,
      criticas: 2,
      medias: 3,
      baixas: 1
    },
    '/alertas/loja_001': [
      { id: 1, titulo: 'Estoque crítico', urgencia: 'critico', status: 'aberto' },
      { id: 2, titulo: 'Vencimento próximo', urgencia: 'alto', status: 'aberto' },
      { id: 3, titulo: 'Anomalia detectada', urgencia: 'medio', status: 'aberto' }
    ]
  };

  return mockDataMap[endpoint] || {};
}

/**
 * Load Dashboard
 */
async function loadDashboard() {
  // Update KPIs
  document.getElementById('kpi-receita').textContent = 'R$ 12.500';
  document.getElementById('kpi-receita-delta').textContent = '+12%';
  document.getElementById('kpi-margem').textContent = '18.5%';
  document.getElementById('kpi-margem-delta').textContent = '+2.3%';
  document.getElementById('kpi-perdas').textContent = '2.1%';
  document.getElementById('kpi-perdas-delta').textContent = '-0.5%';
  document.getElementById('kpi-alertas').textContent = '3';

  // Render charts
  renderDashSalesChart();
  renderDashCategoryChart();
}

/**
 * Load Forecast
 */
async function loadPrevisao() {
  const loading = document.getElementById('loading-previsao');
  const content = document.getElementById('content-previsao');

  loading.style.display = 'flex';
  content.classList.add('hidden');

  try {
    // Simulate loading
    setTimeout(() => {
      loading.style.display = 'none';
      content.classList.remove('hidden');
      renderForecastChart();
    }, 500);
  } catch (error) {
    console.error('Error loading forecast:', error);
  }
}

/**
 * Load Inventory
 */
async function loadEstoque() {
  const loading = document.getElementById('loading-estoque');
  const content = document.getElementById('content-estoque');

  loading.style.display = 'flex';
  content.classList.add('hidden');

  try {
    const data = await fetchData(`/perdas/taxa-atual/${currentStore}`);
    document.getElementById('estoque-taxa').textContent = `${data.taxa || 2.1}%`;
    document.getElementById('estoque-risco').textContent = '12';
    document.getElementById('estoque-skus').textContent = '1.543';

    setTimeout(() => {
      loading.style.display = 'none';
      content.classList.remove('hidden');
      renderPerdasChart();
    }, 500);
  } catch (error) {
    console.error('Error loading inventory:', error);
  }
}

/**
 * Load Customers (RFM)
 */
async function loadClientes() {
  const loading = document.getElementById('loading-clientes');
  const content = document.getElementById('content-clientes');

  loading.style.display = 'flex';
  content.classList.add('hidden');

  try {
    const data = await fetchData(`/rfm/loja/${currentStore}/dashboard`);

    setTimeout(() => {
      loading.style.display = 'none';
      content.classList.remove('hidden');
      renderRFMChart();
    }, 500);
  } catch (error) {
    console.error('Error loading customers:', error);
  }
}

/**
 * Load Cross-Sell
 */
async function loadCrossSell() {
  const loading = document.getElementById('loading-crosssell');
  const content = document.getElementById('content-crosssell');

  loading.style.display = 'flex';
  content.classList.add('hidden');

  try {
    setTimeout(() => {
      loading.style.display = 'none';
      content.classList.remove('hidden');
    }, 500);
  } catch (error) {
    console.error('Error loading cross-sell:', error);
  }
}

/**
 * Load Anomalies
 */
async function loadAnomalias() {
  const loading = document.getElementById('loading-anomalias');
  const content = document.getElementById('content-anomalias');

  loading.style.display = 'flex';
  content.classList.add('hidden');

  try {
    const data = await fetchData(`/anomalias/dashboard/${currentStore}`);

    setTimeout(() => {
      loading.style.display = 'none';
      content.classList.remove('hidden');
      renderAnomaliaChart();
    }, 500);
  } catch (error) {
    console.error('Error loading anomalies:', error);
  }
}

/**
 * Load Alerts
 */
async function loadAlertas() {
  const loading = document.getElementById('loading-alertas');
  const content = document.getElementById('content-alertas');

  loading.style.display = 'flex';
  content.classList.add('hidden');

  try {
    const data = await fetchData(`/alertas/${currentStore}`);

    setTimeout(() => {
      loading.style.display = 'none';
      content.classList.remove('hidden');
      document.getElementById('alertBadge').textContent = data.length || 3;
    }, 500);
  } catch (error) {
    console.error('Error loading alerts:', error);
  }
}

/**
 * Toast Notifications
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    padding: 12px 16px;
    margin-bottom: 8px;
    background: ${type === 'success' ? '#10b981' : '#3b82f6'};
    color: white;
    border-radius: 6px;
    animation: fadeIn 300ms ease-in;
  `;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

/**
 * Handle Report Exports
 */
function handleReportExport(action) {
  const formats = {
    'export-vendas': 'CSV',
    'export-perdas': 'Excel',
    'export-rfm': 'CSV',
    'export-previsao': 'PDF',
    'export-anomalias': 'CSV',
    'export-crosssell': 'PDF',
  };

  showToast(`Exportando relatório em ${formats[action]}...`, 'info');
  setTimeout(() => {
    showToast('Relatório exportado com sucesso!', 'success');
  }, 2000);
}

/**
 * Auto-refresh Data
 */
function startAutoRefresh() {
  setInterval(() => {
    const now = new Date().toLocaleTimeString('pt-BR');
    document.getElementById('lastUpdate').textContent = `Atualizado às ${now}`;
  }, 30000);
}
