/**
 * Smart Market - Chart.js Rendering Functions
 */

const chartInstances = {};

/**
 * Dashboard Sales Chart
 */
function renderDashSalesChart() {
  const ctx = document.getElementById('dashSalesChart');
  if (!ctx) return;

  if (chartInstances.dashSales) {
    chartInstances.dashSales.destroy();
  }

  chartInstances.dashSales = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'],
      datasets: [{
        label: 'Vendas',
        data: [8200, 9400, 7800, 10500, 11200, 12800, 10600],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#1e40af',
        pointRadius: 5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(148, 163, 184, 0.1)',
          },
          ticks: {
            color: '#94a3b8',
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#94a3b8',
          },
        },
      },
    },
  });
}

/**
 * Dashboard Category Distribution
 */
function renderDashCategoryChart() {
  const ctx = document.getElementById('dashCategoryChart');
  if (!ctx) return;

  if (chartInstances.dashCategory) {
    chartInstances.dashCategory.destroy();
  }

  chartInstances.dashCategory = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Alimentos', 'Bebidas', 'Laticínios', 'Higiene', 'Outros'],
      datasets: [{
        data: [28, 22, 18, 20, 12],
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
        ],
        borderColor: '#1e293b',
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#e2e8f0',
            padding: 15,
          },
        },
      },
    },
  });
}

/**
 * Forecast Chart
 */
function renderForecastChart() {
  const ctx = document.getElementById('forecastChart');
  if (!ctx) return;

  if (chartInstances.forecast) {
    chartInstances.forecast.destroy();
  }

  const days = Array.from({ length: 30 }, (_, i) => `Dia ${i + 1}`);
  const predicted = Array.from({ length: 30 }, () => Math.floor(Math.random() * 5000 + 8000));
  const actual = Array.from({ length: 30 }, () => Math.floor(Math.random() * 5000 + 8000));

  chartInstances.forecast = new Chart(ctx, {
    type: 'line',
    data: {
      labels: days,
      datasets: [
        {
          label: 'Previsto',
          data: predicted,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
        },
        {
          label: 'Real',
          data: actual,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#e2e8f0',
          },
        },
      },
      scales: {
        y: {
          grid: {
            color: 'rgba(148, 163, 184, 0.1)',
          },
          ticks: {
            color: '#94a3b8',
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#94a3b8',
          },
        },
      },
    },
  });
}

/**
 * Perdas Chart
 */
function renderPerdasChart() {
  const ctx = document.getElementById('perdasChart');
  if (!ctx) return;

  if (chartInstances.perdas) {
    chartInstances.perdas.destroy();
  }

  chartInstances.perdas = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Alimentos', 'Bebidas', 'Laticínios', 'Higiene', 'Padaria'],
      datasets: [{
        label: 'Perdas (%)',
        data: [3.2, 1.8, 2.5, 1.2, 4.1],
        backgroundColor: [
          '#ef4444',
          '#f97316',
          '#f59e0b',
          '#eab308',
          '#84cc16',
        ],
        borderRadius: 6,
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(148, 163, 184, 0.1)',
          },
          ticks: {
            color: '#94a3b8',
          },
        },
        y: {
          ticks: {
            color: '#94a3b8',
          },
        },
      },
    },
  });
}

/**
 * RFM Distribution Chart
 */
function renderRFMChart() {
  const ctx = document.getElementById('rfmChart');
  if (!ctx) return;

  if (chartInstances.rfm) {
    chartInstances.rfm.destroy();
  }

  chartInstances.rfm = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Recência', 'Frequência', 'Valor', 'Fidelidade', 'Engajamento'],
      datasets: [{
        label: 'VIP',
        data: [90, 85, 92, 88, 86],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
      },
      {
        label: 'Regular',
        data: [65, 60, 58, 62, 60],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
      },
      {
        label: 'Em Risco',
        data: [35, 40, 38, 35, 32],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#e2e8f0',
          },
        },
      },
      scales: {
        r: {
          grid: {
            color: 'rgba(148, 163, 184, 0.2)',
          },
          ticks: {
            color: '#94a3b8',
            backdropColor: 'transparent',
          },
        },
      },
    },
  });
}

/**
 * Anomaly Chart
 */
function renderAnomaliaChart() {
  const ctx = document.getElementById('anomaliaChart');
  if (!ctx) return;

  if (chartInstances.anomalia) {
    chartInstances.anomalia.destroy();
  }

  chartInstances.anomalia = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Crítica', 'Alta', 'Média', 'Baixa'],
      datasets: [{
        label: 'Anomalias',
        data: [2, 3, 5, 8],
        backgroundColor: [
          '#ef4444',
          '#f97316',
          '#f59e0b',
          '#eab308',
        ],
        borderRadius: 6,
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(148, 163, 184, 0.1)',
          },
          ticks: {
            color: '#94a3b8',
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#94a3b8',
          },
        },
      },
    },
  });
}
