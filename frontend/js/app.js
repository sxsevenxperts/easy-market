/**
 * Smart Market - Frontend Application Logic
 * Retail Intelligence Platform with Textual Insights
 */

const API_BASE = window.location.port === '3001' ? 'http://localhost:3000/api/v1' : window.location.origin + '/api/v1';
let currentSection = 'dashboard';
let previousSection = 'dashboard';
let currentStore = 'loja_001';

function voltarSecao() {
  loadSection(previousSection || 'dashboard');
}

/**
 * Initialize Application
 */
document.addEventListener('DOMContentLoaded', () => {
  // Ler token e loja_id da URL (redirecionado após login)
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get('token');
  const urlLojaId = urlParams.get('loja_id');
  if (urlToken) {
    localStorage.setItem('sm_token', urlToken);
    // Limpar params da URL sem recarregar
    window.history.replaceState({}, '', window.location.pathname);
  }
  if (urlLojaId) {
    currentStore = urlLojaId;
    const sel = document.getElementById('storeSelect');
    if (sel) sel.value = urlLojaId;
  }

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

// ====================================================================
// SUB-PANEL NAVIGATION
// ====================================================================

/**
 * Show a sub-panel and hide the matching content div
 */
function showSubPanel(panelId) {
  var panel = document.getElementById(panelId);
  if (!panel) return;
  // Determine the parent section and its main content div
  var section = panel.closest('.section-page');
  if (section) {
    var contentDiv = section.querySelector('[id^="content-"]');
    if (contentDiv) contentDiv.style.display = 'none';
    var loadingDiv = section.querySelector('[id^="loading-"]');
    if (loadingDiv) loadingDiv.style.display = 'none';
  }
  panel.classList.add('active');
  window.scrollTo(0, 0);
}

/**
 * Hide a sub-panel and restore the matching content div
 */
function hideSubPanel(panelId) {
  var panel = document.getElementById(panelId);
  if (!panel) return;
  panel.classList.remove('active');
  var section = panel.closest('.section-page');
  if (section) {
    var contentDiv = section.querySelector('[id^="content-"]');
    if (contentDiv) contentDiv.style.display = '';
  }
  window.scrollTo(0, 0);
}

// ====================================================================
// ESTOQUE — SKU Full List
// ====================================================================

var skuMockData = [
  { sku: 'SKU-0001', produto: 'Refrigerante Cola 2L',        categoria: 'Bebidas',    estoque: 5,   minimo: 30,  custo: 3.80,  venda: 6.50,  margem: 41.5, giro: 4,  status: 'critico' },
  { sku: 'SKU-0002', produto: 'Leite Integral 1L',           categoria: 'Laticinios', estoque: 8,   minimo: 50,  custo: 3.20,  venda: 4.99,  margem: 35.9, giro: 5,  status: 'critico' },
  { sku: 'SKU-0003', produto: 'Pao Frances (kg)',             categoria: 'Padaria',    estoque: 3,   minimo: 20,  custo: 4.50,  venda: 8.00,  margem: 43.8, giro: 1,  status: 'vencendo' },
  { sku: 'SKU-0004', produto: 'Cerveja Lata 350ml',          categoria: 'Bebidas',    estoque: 12,  minimo: 60,  custo: 2.80,  venda: 4.50,  margem: 37.8, giro: 7,  status: 'baixo' },
  { sku: 'SKU-0005', produto: 'Iogurte Natural 170g',        categoria: 'Laticinios', estoque: 4,   minimo: 25,  custo: 1.90,  venda: 3.49,  margem: 45.6, giro: 3,  status: 'vencendo' },
  { sku: 'SKU-0006', produto: 'Arroz Tipo 1 5kg',            categoria: 'Alimentos',  estoque: 87,  minimo: 40,  custo: 14.00, venda: 22.90, margem: 38.9, giro: 12, status: 'ok' },
  { sku: 'SKU-0007', produto: 'Feijao Preto 1kg',            categoria: 'Alimentos',  estoque: 54,  minimo: 30,  custo: 4.20,  venda: 6.99,  margem: 39.9, giro: 10, status: 'ok' },
  { sku: 'SKU-0008', produto: 'Oleo de Soja 900ml',          categoria: 'Alimentos',  estoque: 66,  minimo: 25,  custo: 5.10,  venda: 8.49,  margem: 39.9, giro: 8,  status: 'ok' },
  { sku: 'SKU-0009', produto: 'Acucar Cristal 2kg',          categoria: 'Alimentos',  estoque: 112, minimo: 50,  custo: 4.80,  venda: 7.49,  margem: 35.9, giro: 9,  status: 'ok' },
  { sku: 'SKU-0010', produto: 'Macarrao Espaguete 500g',     categoria: 'Alimentos',  estoque: 95,  minimo: 40,  custo: 2.50,  venda: 4.29,  margem: 41.7, giro: 11, status: 'ok' },
  { sku: 'SKU-0011', produto: 'Molho de Tomate 340g',        categoria: 'Alimentos',  estoque: 78,  minimo: 35,  custo: 1.80,  venda: 3.29,  margem: 45.3, giro: 10, status: 'ok' },
  { sku: 'SKU-0012', produto: 'Manteiga com Sal 200g',       categoria: 'Laticinios', estoque: 18,  minimo: 20,  custo: 4.60,  venda: 7.99,  margem: 42.4, giro: 6,  status: 'baixo' },
  { sku: 'SKU-0013', produto: 'Queijo Mussarela 500g',       categoria: 'Frios',      estoque: 22,  minimo: 15,  custo: 9.50,  venda: 16.90, margem: 43.8, giro: 7,  status: 'ok' },
  { sku: 'SKU-0014', produto: 'Presunto Fatiado 200g',       categoria: 'Frios',      estoque: 9,   minimo: 12,  custo: 7.80,  venda: 13.90, margem: 43.9, giro: 5,  status: 'vencendo' },
  { sku: 'SKU-0015', produto: 'Frango Inteiro Resfriado (kg)',categoria: 'Frios',      estoque: 35,  minimo: 20,  custo: 9.90,  venda: 15.90, margem: 37.7, giro: 8,  status: 'ok' },
  { sku: 'SKU-0016', produto: 'Banana Prata (kg)',            categoria: 'Hortifruti', estoque: 42,  minimo: 30,  custo: 1.80,  venda: 3.99,  margem: 54.9, giro: 3,  status: 'ok' },
  { sku: 'SKU-0017', produto: 'Tomate (kg)',                  categoria: 'Hortifruti', estoque: 28,  minimo: 20,  custo: 2.50,  venda: 5.49,  margem: 54.5, giro: 4,  status: 'ok' },
  { sku: 'SKU-0018', produto: 'Alface Crespa (un)',           categoria: 'Hortifruti', estoque: 6,   minimo: 15,  custo: 1.20,  venda: 2.49,  margem: 51.8, giro: 2,  status: 'vencendo' },
  { sku: 'SKU-0019', produto: 'Laranja Pera (kg)',            categoria: 'Hortifruti', estoque: 55,  minimo: 25,  custo: 1.90,  venda: 3.99,  margem: 52.4, giro: 5,  status: 'ok' },
  { sku: 'SKU-0020', produto: 'Sabao em Po 1kg',             categoria: 'Higiene',    estoque: 74,  minimo: 30,  custo: 4.20,  venda: 7.99,  margem: 47.4, giro: 14, status: 'ok' },
  { sku: 'SKU-0021', produto: 'Shampoo 400ml',               categoria: 'Higiene',    estoque: 48,  minimo: 20,  custo: 5.50,  venda: 10.99, margem: 49.9, giro: 18, status: 'ok' },
  { sku: 'SKU-0022', produto: 'Papel Higienico 12 rolos',    categoria: 'Higiene',    estoque: 63,  minimo: 25,  custo: 8.90,  venda: 14.99, margem: 40.6, giro: 12, status: 'ok' },
  { sku: 'SKU-0023', produto: 'Detergente Liq. 500ml',       categoria: 'Higiene',    estoque: 91,  minimo: 35,  custo: 1.50,  venda: 2.99,  margem: 49.5, giro: 15, status: 'ok' },
  { sku: 'SKU-0024', produto: 'Agua Mineral 1.5L',           categoria: 'Bebidas',    estoque: 144, minimo: 60,  custo: 1.20,  venda: 2.49,  margem: 51.8, giro: 6,  status: 'ok' },
  { sku: 'SKU-0025', produto: 'Suco de Laranja 1L',          categoria: 'Bebidas',    estoque: 32,  minimo: 20,  custo: 3.80,  venda: 6.99,  margem: 45.6, giro: 9,  status: 'ok' },
  { sku: 'SKU-0026', produto: 'Iogurte Morango 170g',        categoria: 'Laticinios', estoque: 7,   minimo: 25,  custo: 1.90,  venda: 3.49,  margem: 45.6, giro: 3,  status: 'vencendo' },
  { sku: 'SKU-0027', produto: 'Queijo Minas Frescal 500g',   categoria: 'Laticinios', estoque: 11,  minimo: 12,  custo: 8.50,  venda: 15.90, margem: 46.5, giro: 4,  status: 'baixo' },
  { sku: 'SKU-0028', produto: 'Cafe Torrado Moido 500g',     categoria: 'Alimentos',  estoque: 85,  minimo: 40,  custo: 7.20,  venda: 12.99, margem: 44.6, giro: 10, status: 'ok' },
  { sku: 'SKU-0029', produto: 'Biscoito Recheado 130g',      categoria: 'Alimentos',  estoque: 120, minimo: 50,  custo: 1.60,  venda: 2.99,  margem: 46.5, giro: 8,  status: 'ok' },
  { sku: 'SKU-0030', produto: 'Cenoura (kg)',                 categoria: 'Hortifruti', estoque: 19,  minimo: 15,  custo: 2.00,  venda: 3.99,  margem: 49.9, giro: 3,  status: 'ok' },
  { sku: 'SKU-0031', produto: 'Batata Inglesa (kg)',          categoria: 'Hortifruti', estoque: 45,  minimo: 20,  custo: 2.30,  venda: 4.49,  margem: 48.8, giro: 5,  status: 'ok' },
  { sku: 'SKU-0032', produto: 'Linguica Defumada 500g',      categoria: 'Frios',      estoque: 14,  minimo: 10,  custo: 8.20,  venda: 14.90, margem: 44.9, giro: 7,  status: 'ok' },
  { sku: 'SKU-0033', produto: 'Mortadela Fatiada 200g',      categoria: 'Frios',      estoque: 6,   minimo: 10,  custo: 5.80,  venda: 9.99,  margem: 41.9, giro: 5,  status: 'critico' },
  { sku: 'SKU-0034', produto: 'Sabonete Barra 90g',          categoria: 'Higiene',    estoque: 200, minimo: 60,  custo: 0.90,  venda: 1.99,  margem: 54.8, giro: 20, status: 'ok' },
  { sku: 'SKU-0035', produto: 'Energetico 250ml',            categoria: 'Bebidas',    estoque: 38,  minimo: 24,  custo: 3.20,  venda: 5.99,  margem: 46.6, giro: 11, status: 'ok' },
  { sku: 'SKU-0036', produto: 'Farinha de Trigo 1kg',        categoria: 'Alimentos',  estoque: 67,  minimo: 30,  custo: 3.10,  venda: 5.49,  margem: 43.5, giro: 9,  status: 'ok' },
  { sku: 'SKU-0037', produto: 'Extrato de Tomate 340g',      categoria: 'Alimentos',  estoque: 88,  minimo: 40,  custo: 1.50,  venda: 2.79,  margem: 46.2, giro: 12, status: 'ok' },
  { sku: 'SKU-0038', produto: 'Creme de Leite 200g',         categoria: 'Laticinios', estoque: 41,  minimo: 20,  custo: 2.30,  venda: 4.29,  margem: 46.4, giro: 8,  status: 'ok' },
  { sku: 'SKU-0039', produto: 'Maionese Cremosa 500g',       categoria: 'Alimentos',  estoque: 33,  minimo: 15,  custo: 5.40,  venda: 9.49,  margem: 43.1, giro: 10, status: 'ok' },
  { sku: 'SKU-0040', produto: 'Refrigerante Guarana 2L',     categoria: 'Bebidas',    estoque: 10,  minimo: 30,  custo: 3.60,  venda: 6.29,  margem: 42.8, giro: 4,  status: 'baixo' },
];

function mostrarSKUs() {
  loadSection('skus');
}

function loadSKUs() {
  renderSKUTable(skuMockData);
  document.getElementById('skuCount').textContent = skuMockData.length + ' SKUs exibidos';
}

function renderSKUTable(data) {
  var tbody = document.getElementById('skuFullBody');
  if (!tbody) return;
  var statusLabels = { ok: 'Normal', baixo: 'Baixo Estoque', critico: 'Critico', vencendo: 'Vencendo' };
  var statusColors = { ok: 'var(--color-success)', baixo: 'var(--color-warning)', critico: 'var(--color-danger)', vencendo: '#f97316' };
  tbody.innerHTML = data.map(function(s) {
    return '<tr>' +
      '<td style="font-family:monospace; font-size:0.8rem;">' + s.sku + '</td>' +
      '<td>' + s.produto + '</td>' +
      '<td style="color:var(--color-text-dim);">' + s.categoria + '</td>' +
      '<td class="' + (s.estoque <= s.minimo ? 'text-red' : 'text-green') + '">' + s.estoque + '</td>' +
      '<td>' + s.minimo + '</td>' +
      '<td>' + fmtCurrency(s.custo) + '</td>' +
      '<td>' + fmtCurrency(s.venda) + '</td>' +
      '<td>' + s.margem.toFixed(1) + '%</td>' +
      '<td>' + s.giro + ' dias</td>' +
      '<td><span style="color:' + (statusColors[s.status] || 'var(--color-text-dim)') + '; font-weight:600;">' + (statusLabels[s.status] || s.status) + '</span></td>' +
      '</tr>';
  }).join('');
  var countEl = document.getElementById('skuCount');
  if (countEl) countEl.textContent = data.length + ' SKUs exibidos';
}

function filtrarSKUs() {
  var search = (document.getElementById('skuSearch').value || '').toLowerCase();
  var categoria = document.getElementById('skuCategoria').value;
  var status = document.getElementById('skuStatus').value;
  var filtered = skuMockData.filter(function(s) {
    var matchSearch = !search || s.produto.toLowerCase().includes(search) || s.sku.toLowerCase().includes(search);
    var matchCat = !categoria || s.categoria === categoria;
    var matchStatus = !status || s.status === status;
    return matchSearch && matchCat && matchStatus;
  });
  renderSKUTable(filtered);
}

// ====================================================================
// PERDAS — Multi-unit toggle + tabs
// ====================================================================

var unidadePerda = 'pct';

function setUnidadePerda(unit, btn) {
  unidadePerda = unit;
  document.querySelectorAll('.metric-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');

  // Highlight active column headers
  var colMap = { pct: ['col-pct', 'scol-pct'], kg: ['col-kg', 'scol-kg'], brl: ['col-brl', 'scol-brl'] };
  ['col-pct','col-kg','col-brl','scol-pct','scol-kg','scol-brl'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.color = '';
  });
  var activeIds = colMap[unit] || [];
  activeIds.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.color = 'var(--color-primary)';
  });

  // Highlight triple KPI values
  document.querySelectorAll('.perda-metric-val').forEach(function(el) { el.classList.remove('highlight'); });
  var valId = { pct: 'perdas-taxa-pct', kg: 'perdas-taxa-kg', brl: 'perdas-taxa-brl' }[unit];
  var valEl = document.getElementById(valId);
  if (valEl) valEl.classList.add('highlight');
}

function switchPerdasTab(tab, btn) {
  document.querySelectorAll('.perdas-tab-view').forEach(function(el) { el.classList.remove('active'); });
  var target = document.getElementById('perdas-tab-' + tab);
  if (target) target.classList.add('active');
  document.querySelectorAll('#perdasTabs .filter-tab').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
}

// ====================================================================
// CROSS-SELL — Criar Combo
// ====================================================================

var comboProducts = [
  { nome: 'Cerveja Lata 350ml',        preco: 4.50,  margem: 37.8 },
  { nome: 'Gelo 5kg',                  preco: 8.99,  margem: 52.0 },
  { nome: 'Pao Frances (kg)',           preco: 8.00,  margem: 43.8 },
  { nome: 'Manteiga com Sal 200g',      preco: 7.99,  margem: 42.4 },
  { nome: 'Macarrao Espaguete 500g',    preco: 4.29,  margem: 41.7 },
  { nome: 'Molho de Tomate 340g',       preco: 3.29,  margem: 45.3 },
  { nome: 'Refrigerante Cola 2L',       preco: 6.50,  margem: 41.5 },
  { nome: 'Salgadinho 100g',           preco: 3.99,  margem: 48.0 },
  { nome: 'Cafe Torrado Moido 500g',   preco: 12.99, margem: 44.6 },
  { nome: 'Acucar Cristal 2kg',        preco: 7.49,  margem: 35.9 },
  { nome: 'Leite Integral 1L',         preco: 4.99,  margem: 35.9 },
  { nome: 'Iogurte Natural 170g',      preco: 3.49,  margem: 45.6 },
  { nome: 'Queijo Mussarela 500g',     preco: 16.90, margem: 43.8 },
  { nome: 'Presunto Fatiado 200g',     preco: 13.90, margem: 43.9 },
  { nome: 'Frango Inteiro (kg)',        preco: 15.90, margem: 37.7 },
  { nome: 'Arroz Tipo 1 5kg',          preco: 22.90, margem: 38.9 },
  { nome: 'Feijao Preto 1kg',          preco: 6.99,  margem: 39.9 },
  { nome: 'Oleo de Soja 900ml',        preco: 8.49,  margem: 39.9 },
  { nome: 'Banana Prata (kg)',          preco: 3.99,  margem: 54.9 },
  { nome: 'Tomate (kg)',                preco: 5.49,  margem: 54.5 },
  { nome: 'Agua Mineral 1.5L',         preco: 2.49,  margem: 51.8 },
  { nome: 'Suco de Laranja 1L',        preco: 6.99,  margem: 45.6 },
  { nome: 'Energetico 250ml',          preco: 5.99,  margem: 46.6 },
  { nome: 'Biscoito Recheado 130g',    preco: 2.99,  margem: 46.5 },
  { nome: 'Sabao em Po 1kg',           preco: 7.99,  margem: 47.4 },
  { nome: 'Papel Higienico 12 rolos',  preco: 14.99, margem: 40.6 },
  { nome: 'Farinha de Trigo 1kg',      preco: 5.49,  margem: 43.5 },
  { nome: 'Maionese Cremosa 500g',     preco: 9.49,  margem: 43.1 },
  { nome: 'Creme de Leite 200g',       preco: 4.29,  margem: 46.4 },
  { nome: 'Extrato de Tomate 340g',    preco: 2.79,  margem: 46.2 },
];

var combosAtivos = [
  { combo: 'Cerveja + Gelo', desconto: '15%', posicao: 'Entrada da Loja',    validade: '30/03/2026', vendas: 284, receita_extra: 'R$ 1.240,00', status: 'Ativo' },
  { combo: 'Pao + Manteiga', desconto: '10%', posicao: 'Setor do Produto A',  validade: '31/03/2026', vendas: 192, receita_extra: 'R$ 680,00',   status: 'Ativo' },
  { combo: 'Macarrao + Molho', desconto: '12%', posicao: 'Corredor Principal', validade: '28/03/2026', vendas: 145, receita_extra: 'R$ 490,00',   status: 'Ativo' },
  { combo: 'Refrigerante + Salgadinho', desconto: '8%', posicao: 'Ponta de Gondola', validade: '25/03/2026', vendas: 98, receita_extra: 'R$ 310,00', status: 'Expirando' },
];

function populateComboDropdowns() {
  var opts = comboProducts.map(function(p, i) {
    return '<option value="' + i + '">' + p.nome + ' — R$ ' + p.preco.toFixed(2) + '</option>';
  }).join('');
  var selA = document.getElementById('combo-prod-a');
  var selB = document.getElementById('combo-prod-b');
  if (selA) selA.innerHTML = opts;
  if (selB) {
    selB.innerHTML = opts;
    selB.selectedIndex = 1;
  }
}

function abrirCriarCombo(prodA, prodB, lift) {
  loadSection('criar-combo');
  setTimeout(() => initCriarCombo(prodA, prodB, lift), 50);
}

function loadCriarCombo() {
  initCriarCombo('', '', null);
}

function initCriarCombo(prodA, prodB, lift) {
  populateComboDropdowns();

  // Pre-select products if provided
  if (prodA && prodB) {
    var selA = document.getElementById('combo-prod-a');
    var selB = document.getElementById('combo-prod-b');
    if (selA) {
      for (var i = 0; i < selA.options.length; i++) {
        if (selA.options[i].text.toLowerCase().includes(prodA.toLowerCase())) {
          selA.selectedIndex = i;
          break;
        }
      }
    }
    if (selB) {
      for (var j = 0; j < selB.options.length; j++) {
        if (selB.options[j].text.toLowerCase().includes(prodB.toLowerCase())) {
          selB.selectedIndex = j;
          break;
        }
      }
    }
  }

  // Default validade to 7 days from now
  var dt = new Date();
  dt.setDate(dt.getDate() + 7);
  var valEl = document.getElementById('combo-validade');
  if (valEl) valEl.value = dt.toISOString().split('T')[0];

  atualizarPreviewCombo(lift);
  renderCombosAtivos();
}

function atualizarPreviewCombo(liftHint) {
  var selA = document.getElementById('combo-prod-a');
  var selB = document.getElementById('combo-prod-b');
  var descontoEl = document.getElementById('combo-desconto');
  if (!selA || !selB) return;

  var idxA = parseInt(selA.value) || 0;
  var idxB = parseInt(selB.value) || 1;
  var desconto = parseFloat(descontoEl ? descontoEl.value : 10) || 10;

  var prodA = comboProducts[idxA] || comboProducts[0];
  var prodB = comboProducts[idxB] || comboProducts[1];

  var lift = liftHint || (1.5 + Math.random() * 2.0).toFixed(1);
  lift = parseFloat(lift);
  var aumentoA = Math.round(lift * 18);
  var aumentoB = Math.round(lift * 14);
  var receitaExtra = Math.round((prodA.preco + prodB.preco) * (1 - desconto / 100) * lift * 42);
  var margemComDesconto = ((prodA.margem + prodB.margem) / 2 - desconto / 2).toFixed(1);
  var roi = ((receitaExtra * 12) / 500).toFixed(0);

  const previewBody = document.getElementById('combo-preview-body');
  if (previewBody) {
    previewBody.innerHTML = `
      <div class="combo-preview-card">
        <div class="preview-row"><span>Lift esperado</span><span class="text-green">${lift}x</span></div>
        <div class="preview-row"><span>Aumento em vendas de ${prodA.nome}</span><span class="text-green">+${aumentoA}%</span></div>
        <div class="preview-row"><span>Aumento em vendas de ${prodB.nome}</span><span class="text-green">+${aumentoB}%</span></div>
        <div class="preview-row"><span>Receita adicional est./mes</span><span class="text-green">${fmtCurrency(receitaExtra)}</span></div>
        <div class="preview-row"><span>Margem com desconto</span><span>${margemComDesconto}%</span></div>
        <div class="preview-row"><span>ROI estimado anual</span><span class="text-green">${roi}x</span></div>
      </div>
      <div class="insight-card" style="margin-top:1rem;">
        <h3><i class="fas fa-lightbulb"></i> Analise do Par</h3>
        <ul class="insight-list">
          <li>Par <strong>${prodA.nome}</strong> + <strong>${prodB.nome}</strong> tem alta afinidade de compra conjunta.</li>
          <li class="success">Com desconto de ${desconto}% o combo ainda mantem margem de ${margemComDesconto}%.</li>
          <li class="trend">Lift de ${lift}x indica que clientes que compram o produto A tem ${lift}x mais chance de comprar B.</li>
          <li class="action">Receita adicional estimada de ${fmtCurrency(receitaExtra)}/mes com o combo ativo — ROI de ${roi}x ao ano.</li>
        </ul>
      </div>`;
  }
}

function renderCombosAtivos() {
  var tbody = document.getElementById('combosAtivosBody');
  if (!tbody) return;
  var saved = [];
  try { saved = JSON.parse(localStorage.getItem('sm_combos') || '[]'); } catch(e) {}
  var all = combosAtivos.concat(saved);
  tbody.innerHTML = all.map(function(c) {
    var statusColor = c.status === 'Ativo' ? 'var(--color-success)' : c.status === 'Expirando' ? 'var(--color-warning)' : 'var(--color-text-dim)';
    return '<tr>' +
      '<td><strong>' + c.combo + '</strong></td>' +
      '<td class="text-green">' + c.desconto + '</td>' +
      '<td style="color:var(--color-text-dim);">' + c.posicao + '</td>' +
      '<td>' + c.validade + '</td>' +
      '<td>' + (c.vendas || 0) + ' un</td>' +
      '<td class="text-green">' + c.receita_extra + '</td>' +
      '<td><span style="color:' + statusColor + '; font-weight:600;">' + c.status + '</span></td>' +
      '</tr>';
  }).join('');
}

function salvarCombo() {
  var selA = document.getElementById('combo-prod-a');
  var selB = document.getElementById('combo-prod-b');
  if (!selA || !selB) return;
  var prodA = comboProducts[parseInt(selA.value) || 0];
  var prodB = comboProducts[parseInt(selB.value) || 1];
  var desconto = document.getElementById('combo-desconto').value + '%';
  var posicao = document.getElementById('combo-posicao').value;
  var validade = document.getElementById('combo-validade').value || '';
  var obs = document.getElementById('combo-obs').value;

  // Format validade to pt-BR
  var validadeFmt = validade ? validade.split('-').reverse().join('/') : '—';

  var novoCombo = {
    combo: prodA.nome + ' + ' + prodB.nome,
    desconto: desconto,
    posicao: posicao,
    validade: validadeFmt,
    vendas: 0,
    receita_extra: 'R$ 0,00',
    status: 'Ativo',
    obs: obs
  };

  var saved = [];
  try { saved = JSON.parse(localStorage.getItem('sm_combos') || '[]'); } catch(e) {}
  saved.push(novoCombo);
  localStorage.setItem('sm_combos', JSON.stringify(saved));

  showToast('Combo salvo com sucesso!', 'success');
  renderCombosAtivos();
}

/**
 * Load Section
 */
function loadSection(section) {
  if (section !== currentSection) previousSection = currentSection;
  currentSection = section;

  // Update navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.section === section) {
      item.classList.add('active');
    }
  });

  // Hide all sections and close any open sub-panels
  document.querySelectorAll('.section-page').forEach(el => {
    el.classList.remove('active');
  });
  document.querySelectorAll('.sub-panel.active').forEach(function(panel) {
    panel.classList.remove('active');
    // Restore content div inline style if needed
    var section = panel.closest('.section-page');
    if (section) {
      var contentDiv = section.querySelector('[id^="content-"]');
      if (contentDiv) contentDiv.style.display = '';
    }
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
    skus: { title: 'Inventario Completo', sub: 'Todos os SKUs cadastrados — busca, filtro e status' },
    'criar-combo': { title: 'Criar Combo Promocional', sub: 'Configure pares de produtos e calcule o impacto esperado' },
    'plano-perdas': { title: 'Plano de Reducao de Perdas', sub: 'Checklist de acoes sugeridas pela IA para reduzir a taxa de perdas' },
    'plano-faturamento': { title: 'Plano de Crescimento', sub: 'Checklist de acoes para aumentar o faturamento da loja' },
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
    skus: loadSKUs,
    'criar-combo': loadCriarCombo,
    'plano-perdas': loadPlanoPerdas,
    'plano-faturamento': loadPlanoFaturamento,
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
    const token = localStorage.getItem('sm_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch(`${API_BASE}${endpoint}`, { headers });
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

    const alertasVal = kpis.alertas_ativos ?? (Array.isArray(kpis.alertas) ? kpis.alertas.length : kpis.alertas) ?? 3;
    document.getElementById('kpi-alertas').textContent = alertasVal;

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
var perdasIndividualData = [
  { produto: 'Pao Frances (kg)',       categoria: 'Padaria',    perda_pct: 8.5, perda_kg: 42.5, perda_brl: 680, motivo: 'Vencimento',     status: 'critico' },
  { produto: 'Iogurte Morango 170g',   categoria: 'Laticinios', perda_pct: 6.2, perda_kg: 31.0, perda_brl: 420, motivo: 'Vencimento',     status: 'critico' },
  { produto: 'Banana Prata (kg)',       categoria: 'Hortifruti', perda_pct: 5.8, perda_kg: 87.0, perda_brl: 350, motivo: 'Amadurecimento', status: 'alto' },
  { produto: 'Presunto Fatiado 200g',  categoria: 'Frios',      perda_pct: 4.1, perda_kg: 12.3, perda_brl: 310, motivo: 'Vencimento',     status: 'alto' },
  { produto: 'Tomate (kg)',             categoria: 'Hortifruti', perda_pct: 3.9, perda_kg: 65.0, perda_brl: 280, motivo: 'Avaria',         status: 'medio' },
  { produto: 'Queijo Minas 500g',      categoria: 'Laticinios', perda_pct: 3.5, perda_kg: 17.5, perda_brl: 260, motivo: 'Vencimento',     status: 'medio' },
  { produto: 'Leite UHT 1L',           categoria: 'Laticinios', perda_pct: 2.8, perda_kg: 56.0, perda_brl: 196, motivo: 'Vencimento',     status: 'medio' },
  { produto: 'Frango Inteiro (kg)',     categoria: 'Frios',      perda_pct: 2.2, perda_kg: 22.0, perda_brl: 418, motivo: 'Vencimento',     status: 'medio' },
  { produto: 'Alface Crespa (un)',      categoria: 'Hortifruti', perda_pct: 4.5, perda_kg: 18.0, perda_brl: 81,  motivo: 'Murcha/Avaria',  status: 'alto' },
  { produto: 'Macarrao 500g',          categoria: 'Alimentos',  perda_pct: 1.2, perda_kg: 30.0, perda_brl: 120, motivo: 'Embalagem',      status: 'baixo' },
  { produto: 'Cerveja Lata 350ml',     categoria: 'Bebidas',    perda_pct: 0.8, perda_kg: 8.0,  perda_brl: 56,  motivo: 'Quebra',         status: 'baixo' },
  { produto: 'Manteiga 200g',          categoria: 'Laticinios', perda_pct: 1.9, perda_kg: 9.5,  perda_brl: 95,  motivo: 'Vencimento',     status: 'baixo' },
];

var perdasSetorialData = [
  { categoria: 'Padaria',    produtos_afetados: 8,  taxa_pct: 6.8, volume_kg: 145.2, valor_brl: 1700, motivo_principal: 'Vencimento diario', tendencia: 'alta' },
  { categoria: 'Laticinios', produtos_afetados: 12, taxa_pct: 4.3, volume_kg: 114.0, valor_brl: 1200, motivo_principal: 'Vencimento',        tendencia: 'queda' },
  { categoria: 'Hortifruti', produtos_afetados: 15, taxa_pct: 4.7, volume_kg: 312.0, valor_brl: 890,  motivo_principal: 'Amadurecimento',    tendencia: 'estavel' },
  { categoria: 'Frios',      produtos_afetados: 6,  taxa_pct: 3.2, volume_kg: 54.0,  valor_brl: 620,  motivo_principal: 'Vencimento',        tendencia: 'queda' },
  { categoria: 'Bebidas',    produtos_afetados: 3,  taxa_pct: 0.9, volume_kg: 24.0,  valor_brl: 440,  motivo_principal: 'Quebra',            tendencia: 'estavel' },
  { categoria: 'Alimentos',  produtos_afetados: 4,  taxa_pct: 1.1, volume_kg: 68.0,  valor_brl: 195,  motivo_principal: 'Embalagem',         tendencia: 'estavel' },
  { categoria: 'Higiene',    produtos_afetados: 2,  taxa_pct: 0.4, volume_kg: 6.0,   valor_brl: 105,  motivo_principal: 'Avaria',            tendencia: 'estavel' },
];

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

    // Triple KPI values
    const tPct = document.getElementById('perdas-taxa-pct');
    const tKg = document.getElementById('perdas-taxa-kg');
    const tBrl = document.getElementById('perdas-taxa-brl');
    if (tPct) tPct.textContent = fmtPct(taxa);
    if (tKg) tKg.textContent = '847 kg';
    if (tBrl) tBrl.textContent = fmtCurrency(valorPerdido);

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
    const porCategoria = data.por_categoria || perdasSetorialData.map(function(s) {
      return { categoria: s.categoria, valor: s.valor_brl };
    });
    renderPerdasChart(
      porCategoria.map(c => c.categoria || c.nome),
      porCategoria.map(c => c.valor || c.total)
    );

    // Individual table
    renderTabelaPerdasIndividual();

    // Setorial table
    renderTabelaPerdasSetorial();

    loading.style.display = 'none';
    content.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading perdas:', error);
    loading.style.display = 'none';
    content.classList.remove('hidden');
    // Render with mock data anyway
    renderTabelaPerdasIndividual();
    renderTabelaPerdasSetorial();
  }
}

function renderTabelaPerdasIndividual() {
  var tbody = document.getElementById('perdasIndividualBody');
  if (!tbody) return;
  var statusColor = function(s) {
    return s === 'critico' ? 'var(--color-danger)' : s === 'alto' ? 'var(--color-warning)' : s === 'medio' ? 'var(--color-primary)' : 'var(--color-text-dim)';
  };
  tbody.innerHTML = perdasIndividualData.map(function(p, i) {
    var isHighPct = unidadePerda === 'pct';
    var isHighKg  = unidadePerda === 'kg';
    var isHighBrl = unidadePerda === 'brl';
    return '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td>' + p.produto + '</td>' +
      '<td style="color:var(--color-text-dim);">' + p.categoria + '</td>' +
      '<td class="text-red" style="' + (isHighPct ? 'font-weight:700;' : 'opacity:0.7;') + '">' + p.perda_pct + '%</td>' +
      '<td style="' + (isHighKg ? 'font-weight:700; color:var(--color-warning);' : 'opacity:0.7;') + '">' + p.perda_kg + ' kg</td>' +
      '<td style="' + (isHighBrl ? 'font-weight:700; color:var(--color-danger);' : 'opacity:0.7;') + '">' + fmtCurrency(p.perda_brl) + '</td>' +
      '<td style="color:var(--color-text-dim);">' + p.motivo + '</td>' +
      '<td><span style="color:' + statusColor(p.status) + '; font-weight:600;">' + p.status + '</span></td>' +
      '</tr>';
  }).join('');
}

function renderTabelaPerdasSetorial() {
  var tbody = document.getElementById('perdasSetorialBody');
  if (!tbody) return;
  var trendClass = function(t) {
    return 'tendencia-' + (t || 'estavel');
  };
  var trendIcon = function(t) {
    return t === 'alta' ? '\u2191' : t === 'queda' ? '\u2193' : '\u2192';
  };
  tbody.innerHTML = perdasSetorialData.map(function(s) {
    var isHighPct = unidadePerda === 'pct';
    var isHighKg  = unidadePerda === 'kg';
    var isHighBrl = unidadePerda === 'brl';
    return '<tr>' +
      '<td><strong>' + s.categoria + '</strong></td>' +
      '<td>' + s.produtos_afetados + '</td>' +
      '<td style="' + (isHighPct ? 'font-weight:700; color:var(--color-danger);' : 'opacity:0.7;') + '">' + s.taxa_pct + '%</td>' +
      '<td style="' + (isHighKg ? 'font-weight:700; color:var(--color-warning);' : 'opacity:0.7;') + '">' + s.volume_kg + ' kg</td>' +
      '<td style="' + (isHighBrl ? 'font-weight:700; color:var(--color-danger);' : 'opacity:0.7;') + '">' + fmtCurrency(s.valor_brl) + '</td>' +
      '<td style="color:var(--color-text-dim);">' + s.motivo_principal + '</td>' +
      '<td><span class="' + trendClass(s.tendencia) + '">' + trendIcon(s.tendencia) + ' ' + s.tendencia + '</span></td>' +
      '</tr>';
  }).join('');
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
        <td><button class="btn btn-primary" style="padding:4px 12px; font-size:0.75rem;" onclick="abrirCriarCombo('${p.produto_a}', '${p.produto_b}', ${p.lift})">Criar Combo</button></td>
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
// PLANO DE REDUCAO DE PERDAS — Checklist Interativo
// ====================================================================

const planoPerdaItems = [
  {
    categoria: 'Controle de Validade',
    cor: '#ef4444',
    icone: 'fa-calendar-xmark',
    acoes: [
      { id: 'pp1',  texto: 'Implantar rotina FIFO rigorosa em todos os setores (Primeiro que Vence, Primeiro que Sai)', impacto: 'Alto', economia: 'R$ 820/mes' },
      { id: 'pp2',  texto: 'Criar etiquetas de alerta coloridas para produtos com validade em menos de 5 dias', impacto: 'Alto', economia: 'R$ 480/mes' },
      { id: 'pp3',  texto: 'Estabelecer contagem fisica de vencimentos toda segunda e quinta-feira', impacto: 'Medio', economia: 'R$ 310/mes' },
      { id: 'pp4',  texto: 'Aplicar desconto progressivo: 20% com 3 dias, 40% com 1 dia de validade', impacto: 'Alto', economia: 'R$ 640/mes' },
    ]
  },
  {
    categoria: 'Gestao de Estoque',
    cor: '#f59e0b',
    icone: 'fa-boxes-stacked',
    acoes: [
      { id: 'pp5',  texto: 'Negociar lotes menores de Laticinios com fornecedor para reduzir excedente', impacto: 'Alto', economia: 'R$ 520/mes' },
      { id: 'pp6',  texto: 'Cadastrar estoque minimo e maximo para todos os 1.543 SKUs no sistema', impacto: 'Medio', economia: 'R$ 280/mes' },
      { id: 'pp7',  texto: 'Implementar pedido automatico baseado em giro medio de estoque por produto', impacto: 'Alto', economia: 'R$ 730/mes' },
      { id: 'pp8',  texto: 'Reduzir estoque de seguranca de Padaria para max 4 horas de producao', impacto: 'Medio', economia: 'R$ 390/mes' },
    ]
  },
  {
    categoria: 'Padaria e Hortifruti',
    cor: '#22c55e',
    icone: 'fa-wheat-awn',
    acoes: [
      { id: 'pp9',  texto: 'Calcular producao de paes por horario baseado no historico de vendas por turno', impacto: 'Muito Alto', economia: 'R$ 950/mes' },
      { id: 'pp10', texto: 'Implantar mini-promocao "Fim do Dia" para paes nao vendidos apos 18h', impacto: 'Alto', economia: 'R$ 420/mes' },
      { id: 'pp11', texto: 'Controlar temperatura de camara fria de Hortifruti 3x ao dia com registro', impacto: 'Medio', economia: 'R$ 260/mes' },
      { id: 'pp12', texto: 'Receber Hortifruti em dias alternados para reducao de estoque parado', impacto: 'Alto', economia: 'R$ 340/mes' },
    ]
  },
  {
    categoria: 'Monitoramento e Alertas',
    cor: '#3b82f6',
    icone: 'fa-bell',
    acoes: [
      { id: 'pp13', texto: 'Ativar alertas automaticos no sistema para estoque proximo do vencimento', impacto: 'Medio', economia: 'R$ 190/mes' },
      { id: 'pp14', texto: 'Gerar relatorio semanal de perdas por categoria com responsavel identificado', impacto: 'Medio', economia: 'R$ 150/mes' },
      { id: 'pp15', texto: 'Capacitar equipe: treinamento mensal de 30min sobre controle de perdas', impacto: 'Alto', economia: 'R$ 400/mes' },
      { id: 'pp16', texto: 'Estabelecer meta mensal de perda por setor e bonificar equipe ao atingir', impacto: 'Alto', economia: 'R$ 700/mes' },
    ]
  }
];

function loadPlanoPerdas() {
  const container = document.getElementById('plano-perdas-cols');
  if (!container) return;
  const saved = getSavedChecklist('plano_perdas');
  container.innerHTML = planoPerdaItems.map(grupo => `
    <div class="plano-grupo">
      <div class="plano-grupo-header" style="border-left-color:${grupo.cor};">
        <i class="fas ${grupo.icone}" style="color:${grupo.cor};"></i>
        <span>${grupo.categoria}</span>
      </div>
      <div class="plano-acoes">
        ${grupo.acoes.map(a => {
          const checked = saved.includes(a.id);
          return `
            <div class="plano-item ${checked ? 'done' : ''}" id="pi-${a.id}">
              <label class="plano-check-label">
                <input type="checkbox" class="plano-check" data-id="${a.id}" data-plan="plano_perdas" ${checked ? 'checked' : ''} onchange="togglePlanoItem(this, 'pp-progress-bar', 'pp-progress-pct', 'pp-concluidas', 'pp-total', planoPerdaItems)" />
                <span class="plano-texto">${a.texto}</span>
              </label>
              <div class="plano-meta">
                <span class="plano-impacto" style="color:${a.impacto === 'Muito Alto' ? '#ef4444' : a.impacto === 'Alto' ? '#f59e0b' : '#22c55e'};">${a.impacto}</span>
                <span class="plano-economia">${a.economia}</span>
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>`).join('');

  atualizarProgressoPlano('pp-progress-bar', 'pp-progress-pct', 'pp-concluidas', 'pp-total', planoPerdaItems, 'plano_perdas');
}

// ====================================================================
// PLANO DE CRESCIMENTO DE FATURAMENTO — Checklist Interativo
// ====================================================================

const planoFaturamentoItems = [
  {
    categoria: 'Cross-Sell e Combos',
    cor: '#22c55e',
    icone: 'fa-cart-plus',
    acoes: [
      { id: 'pf1',  texto: 'Criar os top 3 combos sugeridos pela IA (Cerveja+Gelo, Pao+Manteiga, Macarrao+Molho)', impacto: 'Muito Alto', potencial: '+R$ 3.200/mes' },
      { id: 'pf2',  texto: 'Reposicionar Salgadinhos ao lado de Refrigerantes em todos os corredores', impacto: 'Alto', potencial: '+R$ 1.100/mes' },
      { id: 'pf3',  texto: 'Treinar equipe de caixa para sugerir complemento baseado nos pares de cross-sell', impacto: 'Alto', potencial: '+R$ 1.800/mes' },
      { id: 'pf4',  texto: 'Criar display "Leve Junto" nas 5 principais associacoes de produto', impacto: 'Medio', potencial: '+R$ 900/mes' },
    ]
  },
  {
    categoria: 'Reativacao de Clientes',
    cor: '#3b82f6',
    icone: 'fa-users',
    acoes: [
      { id: 'pf5',  texto: 'Enviar campanha WhatsApp para 890 clientes em risco com cupom de 15% de desconto', impacto: 'Muito Alto', potencial: '+R$ 8.900/mes' },
      { id: 'pf6',  texto: 'Criar programa de fidelidade para os 120 clientes Campeoes (cashback de 3%)', impacto: 'Alto', potencial: '+R$ 2.100/mes' },
      { id: 'pf7',  texto: 'Enviar oferta de segunda compra para 580 clientes Potenciais (cadastrados ha menos de 60 dias)', impacto: 'Alto', potencial: '+R$ 3.480/mes' },
      { id: 'pf8',  texto: 'Criar pesquisa de satisfacao para 1.200 clientes perdidos e oferecer cupom de retorno', impacto: 'Medio', potencial: '+R$ 2.400/mes' },
    ]
  },
  {
    categoria: 'Gestao por Categoria',
    cor: '#f59e0b',
    icone: 'fa-chart-bar',
    acoes: [
      { id: 'pf9',  texto: 'Ampliar mix de Bebidas para dias quentes: agua de coco, isotonicos, sucos gelados', impacto: 'Alto', potencial: '+R$ 1.600/mes' },
      { id: 'pf10', texto: 'Criar secao de produtos premium ao lado dos itens mais vendidos (up-sell)', impacto: 'Medio', potencial: '+R$ 1.200/mes' },
      { id: 'pf11', texto: 'Implantar precificacao dinamica: aumentar margem de itens com alta demanda e baixa elasticidade', impacto: 'Alto', potencial: '+R$ 2.200/mes' },
      { id: 'pf12', texto: 'Adicionar opcao de delivery para ampliar base de clientes sem aumento de estrutura fisica', impacto: 'Muito Alto', potencial: '+R$ 4.500/mes' },
    ]
  },
  {
    categoria: 'Operacao e Experiencia',
    cor: '#a855f7',
    icone: 'fa-star',
    acoes: [
      { id: 'pf13', texto: 'Melhorar sinalizacao de ofertas na loja com cartazes padronizados e bem posicionados', impacto: 'Medio', potencial: '+R$ 780/mes' },
      { id: 'pf14', texto: 'Criar roteiro semanal de pontas de gondola baseado nas analises de cross-sell', impacto: 'Alto', potencial: '+R$ 1.500/mes' },
      { id: 'pf15', texto: 'Implantar checkout express para compras de ate 10 itens e reduzir abandono', impacto: 'Medio', potencial: '+R$ 620/mes' },
      { id: 'pf16', texto: 'Coletar dados de e-mail e WhatsApp de todos os clientes no PDV para base de marketing', impacto: 'Alto', potencial: '+R$ 1.800/mes' },
    ]
  }
];

function loadPlanoFaturamento() {
  const container = document.getElementById('plano-faturamento-cols');
  if (!container) return;
  const saved = getSavedChecklist('plano_faturamento');
  container.innerHTML = planoFaturamentoItems.map(grupo => `
    <div class="plano-grupo">
      <div class="plano-grupo-header" style="border-left-color:${grupo.cor};">
        <i class="fas ${grupo.icone}" style="color:${grupo.cor};"></i>
        <span>${grupo.categoria}</span>
      </div>
      <div class="plano-acoes">
        ${grupo.acoes.map(a => {
          const checked = saved.includes(a.id);
          return `
            <div class="plano-item ${checked ? 'done' : ''}" id="pi-${a.id}">
              <label class="plano-check-label">
                <input type="checkbox" class="plano-check" data-id="${a.id}" data-plan="plano_faturamento" ${checked ? 'checked' : ''} onchange="togglePlanoItem(this, 'pf-progress-bar', 'pf-progress-pct', 'pf-concluidas', 'pf-total', planoFaturamentoItems)" />
                <span class="plano-texto">${a.texto}</span>
              </label>
              <div class="plano-meta">
                <span class="plano-impacto" style="color:${a.impacto === 'Muito Alto' ? '#22c55e' : a.impacto === 'Alto' ? '#f59e0b' : '#3b82f6'};">${a.impacto}</span>
                <span class="plano-economia" style="color:var(--color-success);">${a.potencial}</span>
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>`).join('');

  atualizarProgressoPlano('pf-progress-bar', 'pf-progress-pct', 'pf-concluidas', 'pf-total', planoFaturamentoItems, 'plano_faturamento');
}

function getSavedChecklist(key) {
  try { return JSON.parse(localStorage.getItem('sm_checklist_' + key) || '[]'); } catch(e) { return []; }
}

function togglePlanoItem(checkbox, barId, pctId, doneId, totalId, items) {
  const plan = checkbox.dataset.plan;
  const id = checkbox.dataset.id;
  const saved = getSavedChecklist(plan);
  const itemEl = document.getElementById('pi-' + id);
  if (checkbox.checked) {
    if (!saved.includes(id)) saved.push(id);
    if (itemEl) itemEl.classList.add('done');
  } else {
    const idx = saved.indexOf(id);
    if (idx > -1) saved.splice(idx, 1);
    if (itemEl) itemEl.classList.remove('done');
  }
  localStorage.setItem('sm_checklist_' + plan, JSON.stringify(saved));
  atualizarProgressoPlano(barId, pctId, doneId, totalId, items, plan);
}

function atualizarProgressoPlano(barId, pctId, doneId, totalId, items, plan) {
  const total = items.reduce((acc, g) => acc + g.acoes.length, 0);
  const saved = getSavedChecklist(plan);
  const done = saved.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const bar = document.getElementById(barId);
  const pctEl = document.getElementById(pctId);
  const doneEl = document.getElementById(doneId);
  const totalEl = document.getElementById(totalId);
  if (bar) bar.style.width = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';
  if (doneEl) doneEl.textContent = done;
  if (totalEl) totalEl.textContent = total;
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
