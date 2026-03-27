/**
 * Smart Market - Chart.js Rendering Functions
 * All functions accept data parameters for real data rendering
 */

const chartInstances = {};

const chartColors = {
  primary: '#3b82f6',
  primaryBg: 'rgba(59, 130, 246, 0.1)',
  success: '#10b981',
  successBg: 'rgba(16, 185, 129, 0.1)',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  orange: '#f97316',
  grid: 'rgba(148, 163, 184, 0.1)',
  tick: '#94a3b8',
  label: '#e2e8f0',
  border: '#1e293b',
};

const defaultScales = {
  y: {
    beginAtZero: true,
    grid: { color: chartColors.grid },
    ticks: { color: chartColors.tick },
  },
  x: {
    grid: { display: false },
    ticks: { color: chartColors.tick },
  },
};

/**
 * Dashboard Sales Chart (line)
 */
function renderDashSalesChart(labels, values) {
  const ctx = document.getElementById('dashSalesChart');
  if (!ctx) return;
  if (chartInstances.dashSales) chartInstances.dashSales.destroy();

  labels = labels || ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
  values = values || [8200, 9400, 7800, 10500, 11200, 12800, 10600];

  chartInstances.dashSales = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Vendas (R$)',
        data: values,
        borderColor: chartColors.primary,
        backgroundColor: chartColors.primaryBg,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: chartColors.primary,
        pointBorderColor: '#1e40af',
        pointRadius: 5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: defaultScales,
    },
  });
}

/**
 * Dashboard Category Distribution (doughnut)
 */
function renderDashCategoryChart(labels, values) {
  const ctx = document.getElementById('dashCategoryChart');
  if (!ctx) return;
  if (chartInstances.dashCategory) chartInstances.dashCategory.destroy();

  labels = labels || ['Alimentos', 'Bebidas', 'Laticinios', 'Higiene', 'Outros'];
  values = values || [28, 22, 18, 20, 12];

  chartInstances.dashCategory = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [chartColors.primary, chartColors.success, chartColors.warning, chartColors.danger, chartColors.purple],
        borderColor: chartColors.border,
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: chartColors.label, padding: 15 } },
      },
    },
  });
}

/**
 * Forecast Chart (line with 2 datasets)
 */
function renderForecastChart(labels, previsto, realizado) {
  const ctx = document.getElementById('forecastChart');
  if (!ctx) return;
  if (chartInstances.forecast) chartInstances.forecast.destroy();

  labels = labels || Array.from({ length: 14 }, (_, i) => `Dia ${i + 1}`);
  previsto = previsto || Array.from({ length: 14 }, () => Math.floor(Math.random() * 5000 + 8000));
  realizado = realizado || Array.from({ length: 14 }, () => Math.floor(Math.random() * 5000 + 8000));

  chartInstances.forecast = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Previsto',
          data: previsto,
          borderColor: chartColors.primary,
          backgroundColor: chartColors.primaryBg,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
        },
        {
          label: 'Realizado',
          data: realizado,
          borderColor: chartColors.success,
          backgroundColor: chartColors.successBg,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: chartColors.label } } },
      scales: {
        y: { grid: { color: chartColors.grid }, ticks: { color: chartColors.tick } },
        x: { grid: { display: false }, ticks: { color: chartColors.tick } },
      },
    },
  });
}

/**
 * Perdas Chart (horizontal bar)
 */
function renderPerdasChart(categories, values) {
  const ctx = document.getElementById('perdasChart');
  if (!ctx) return;
  if (chartInstances.perdas) chartInstances.perdas.destroy();

  categories = categories || ['Padaria', 'Laticinios', 'Hortifruti', 'Frios', 'Bebidas'];
  values = values || [1700, 1200, 890, 620, 440];

  chartInstances.perdas = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [{
        label: 'Perdas (R$)',
        data: values,
        backgroundColor: [chartColors.danger, chartColors.orange, chartColors.warning, '#eab308', chartColors.success],
        borderRadius: 6,
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: chartColors.grid }, ticks: { color: chartColors.tick } },
        y: { ticks: { color: chartColors.tick } },
      },
    },
  });
}

/**
 * RFM Distribution Chart (bar)
 */
function renderRFMChart(segments, counts) {
  const ctx = document.getElementById('rfmChart');
  if (!ctx) return;
  if (chartInstances.rfm) chartInstances.rfm.destroy();

  segments = segments || ['Campeoes', 'Leais', 'Potenciais', 'Em Risco', 'Perdidos'];
  counts = counts || [120, 340, 580, 890, 1200];

  chartInstances.rfm = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: segments,
      datasets: [{
        label: 'Clientes',
        data: counts,
        backgroundColor: [chartColors.success, chartColors.primary, chartColors.warning, chartColors.danger, '#6b7280'],
        borderRadius: 6,
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: defaultScales,
    },
  });
}

/**
 * Anomalia Chart (bar)
 */
function renderAnomaliaChart(types, counts) {
  const ctx = document.getElementById('anomaliaChart');
  if (!ctx) return;
  if (chartInstances.anomalia) chartInstances.anomalia.destroy();

  types = types || ['Critica', 'Alta', 'Media', 'Baixa'];
  counts = counts || [2, 3, 5, 8];

  chartInstances.anomalia = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: types,
      datasets: [{
        label: 'Anomalias',
        data: counts,
        backgroundColor: [chartColors.danger, chartColors.orange, chartColors.warning, '#eab308'],
        borderRadius: 6,
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: defaultScales,
    },
  });
}
