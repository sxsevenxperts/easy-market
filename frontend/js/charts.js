/**
 * Easy Market — Chart Rendering Functions
 * Uses Chart.js with dark theme
 */

const CHART_COLORS = {
  blue:    '#3b82f6',
  cyan:    '#06b6d4',
  purple:  '#8b5cf6',
  pink:    '#ec4899',
  orange:  '#f97316',
  green:   '#22c55e',
  yellow:  '#eab308',
  red:     '#ef4444',
  teal:    '#14b8a6',
  indigo:  '#6366f1',
};

const CHART_DEFAULTS = {
  color: '#94a3b8',
  borderColor: '#2d3f55',
  backgroundColor: '#1e293b',
};

// Apply global Chart.js defaults for dark theme
function applyChartDefaults() {
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.borderColor = '#2d3f55';
  Chart.defaults.font.family = "'Inter', -apple-system, sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.plugins.legend.labels.color = '#94a3b8';
  Chart.defaults.plugins.tooltip.backgroundColor = '#1e293b';
  Chart.defaults.plugins.tooltip.borderColor = '#2d3f55';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.titleColor = '#f1f5f9';
  Chart.defaults.plugins.tooltip.bodyColor = '#94a3b8';
  Chart.defaults.plugins.tooltip.padding = 10;
}

// Registry to destroy old charts before re-rendering
const chartRegistry = {};

function destroyChart(id) {
  if (chartRegistry[id]) {
    chartRegistry[id].destroy();
    delete chartRegistry[id];
  }
}

// --- 1. Forecast Line Chart ---
function renderPrevisaoChart(canvasId, data) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const labels = data.labels || ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const previstos = data.previstos || [42000, 38000, 45000, 51000, 47000, 63000, 55000];
  const reais = data.reais || [40000, 39500, 43000, 52000, 46000, 61000, null];

  chartRegistry[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Previsto',
          data: previstos,
          borderColor: CHART_COLORS.cyan,
          backgroundColor: 'rgba(6,182,212,0.08)',
          borderWidth: 2,
          pointBackgroundColor: CHART_COLORS.cyan,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Realizado',
          data: reais,
          borderColor: CHART_COLORS.green,
          backgroundColor: 'rgba(34,197,94,0.05)',
          borderWidth: 2,
          pointBackgroundColor: CHART_COLORS.green,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false,
          tension: 0.4,
          spanGaps: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'index', intersect: false },
      },
      scales: {
        x: {
          grid: { color: '#1e293b' },
          ticks: { color: '#64748b' },
        },
        y: {
          grid: { color: '#1a2540' },
          ticks: {
            color: '#64748b',
            callback: v => 'R$ ' + (v / 1000).toFixed(0) + 'k',
          },
        },
      },
    },
  });
}

// --- 2. Perdas Doughnut Chart ---
function renderPerdasChart(canvasId, data) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const labels = data.labels || ['Validade', 'Avaria', 'Furto', 'Erro Registro', 'Outros'];
  const values = data.values || [38, 22, 18, 12, 10];
  const colors = [CHART_COLORS.red, CHART_COLORS.orange, CHART_COLORS.yellow, CHART_COLORS.blue, CHART_COLORS.purple];

  chartRegistry[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors.map(c => c + 'cc'),
        borderColor: colors,
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'right',
          labels: { padding: 14, usePointStyle: true, pointStyleWidth: 10 },
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed}%`,
          },
        },
      },
    },
  });
}

// --- 3. RFM Bar Chart ---
function renderRFMChart(canvasId, data) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const segments = data.segments || ['VIP', 'Leais', 'Potencial', 'Em Risco', 'Inativos'];
  const counts   = data.counts   || [142, 389, 231, 198, 87];
  const colors = [
    CHART_COLORS.yellow, CHART_COLORS.blue,
    CHART_COLORS.cyan, CHART_COLORS.orange, CHART_COLORS.red,
  ];

  chartRegistry[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: segments,
      datasets: [{
        label: 'Clientes',
        data: counts,
        backgroundColor: colors.map(c => c + '80'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.parsed.y} clientes` },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748b' } },
        y: { grid: { color: '#1a2540' }, ticks: { color: '#64748b' } },
      },
    },
  });
}

// --- 4. Anomalia Bar Chart ---
function renderAnomaliaChart(canvasId, data) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const types  = data.types  || ['Preço', 'Vendas', 'Estoque', 'Margem', 'Frequência'];
  const critico = data.critico || [2, 1, 3, 1, 0];
  const alto    = data.alto    || [3, 4, 2, 5, 2];
  const medio   = data.medio   || [5, 6, 4, 3, 7];

  chartRegistry[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: types,
      datasets: [
        {
          label: 'Crítico',
          data: critico,
          backgroundColor: CHART_COLORS.red + '80',
          borderColor: CHART_COLORS.red,
          borderWidth: 2,
          borderRadius: 4,
        },
        {
          label: 'Alto',
          data: alto,
          backgroundColor: CHART_COLORS.orange + '80',
          borderColor: CHART_COLORS.orange,
          borderWidth: 2,
          borderRadius: 4,
        },
        {
          label: 'Médio',
          data: medio,
          backgroundColor: CHART_COLORS.yellow + '80',
          borderColor: CHART_COLORS.yellow,
          borderWidth: 2,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { color: '#64748b' } },
        y: { stacked: true, grid: { color: '#1a2540' }, ticks: { color: '#64748b' } },
      },
    },
  });
}

// --- 5. Dashboard Sales Area Chart ---
function renderDashSalesChart(canvasId) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const semana = [38200, 41500, 39800, 44200, 52100, 67300, 48900];
  const anterior = [35000, 40000, 38500, 42000, 49000, 65000, 46000];

  chartRegistry[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Esta semana',
          data: semana,
          borderColor: CHART_COLORS.blue,
          backgroundColor: 'rgba(59,130,246,0.10)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
        },
        {
          label: 'Semana anterior',
          data: anterior,
          borderColor: '#334155',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderDash: [5, 4],
          fill: false,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'index', intersect: false },
      },
      scales: {
        x: { grid: { color: '#1a2540' }, ticks: { color: '#64748b' } },
        y: {
          grid: { color: '#1a2540' },
          ticks: { color: '#64748b', callback: v => 'R$' + (v/1000).toFixed(0) + 'k' },
        },
      },
    },
  });
}

// --- 6. Dashboard Category Doughnut ---
function renderDashCategoryChart(canvasId) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  chartRegistry[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Bebidas', 'FLV', 'Padaria', 'Mercearia', 'Laticínios', 'Outros'],
      datasets: [{
        data: [24, 18, 15, 22, 12, 9],
        backgroundColor: [
          CHART_COLORS.blue + 'cc', CHART_COLORS.green + 'cc',
          CHART_COLORS.yellow + 'cc', CHART_COLORS.cyan + 'cc',
          CHART_COLORS.purple + 'cc', CHART_COLORS.orange + 'cc',
        ],
        borderColor: '#0f172a',
        borderWidth: 3,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '58%',
      plugins: {
        legend: { position: 'right', labels: { padding: 12, usePointStyle: true } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` } },
      },
    },
  });
}

// Initialize global defaults when script loads
applyChartDefaults();
