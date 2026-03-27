/**
 * Store Flow Variables Dashboard v2
 * With Period Filtering and Time-Series Charts
 */

// Load dashboard with period filters
async function loadVariablesDashboardWithPeriods() {
  const container = document.getElementById('section-variaveis-fluxo');
  if (!container) return;

  // Show loading state
  container.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <div class="spinner"></div>
      <p>Carregando variáveis de fluxo...</p>
    </div>
  `;

  try {
    // Fetch data
    const response = await fetch('/api/v1/scraper/variables/loja_001?days=365&limit=500');
    const data = await response.json();

    if (!data.sucesso) {
      throw new Error(data.error || 'Erro ao carregar variáveis');
    }

    // Create main container with period filter
    container.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <h2 style="margin: 0 0 1rem 0; font-size: 1.8rem; color: var(--color-primary);">
          📊 Monitoramento de Variáveis de Fluxo
        </h2>
        <p style="color: var(--color-text-secondary); margin: 0.5rem 0 1.5rem 0;">
          50 indicadores em tempo real com histórico e tendências
        </p>
      </div>

      <div id="period-filter-container"></div>
      <div id="dashboard-stats"></div>
      <div id="variables-charts"></div>
    `;

    // Initialize period filter
    const periodFilter = new PeriodFilter('period-filter-container', (dateRange) => {
      updateDashboardWithPeriod(data, dateRange);
    });

    // Load initial data with default period
    updateDashboardWithPeriod(data, periodFilter.getDateRange());

  } catch (error) {
    console.error('[Dashboard] Error:', error);
    container.innerHTML = `
      <div class="error-box">
        <strong>⚠️ Erro ao carregar variáveis</strong>
        <p>${error.message}</p>
        <p><small>Em modo offline, mostrando dados simulados...</small></p>
      </div>
      <div id="period-filter-container"></div>
      ${renderVariablesDashboardMock()}
    `;

    // Initialize period filter even in mock mode
    new PeriodFilter('period-filter-container', () => {});
  }
}

// Update dashboard based on selected period
async function updateDashboardWithPeriod(rawData, dateRange) {
  // Filter data by date range
  let periodData = {};

  // Group data by variable
  Object.entries(rawData.variables || {}).forEach(([varCode, readings]) => {
    periodData[varCode] = filterDataByDateRange(readings, dateRange.startDate, dateRange.endDate);
  });

  // Render statistics
  renderPeriodStatistics(periodData, dateRange);

  // Render variable charts
  renderVariableCharts(periodData, dateRange);
}

// Render period statistics summary
function renderPeriodStatistics(periodData, dateRange) {
  const container = document.getElementById('dashboard-stats');

  // Calculate overall statistics
  let totalReadings = 0;
  let variablesWithData = 0;
  const stats = {};

  Object.entries(periodData).forEach(([varCode, readings]) => {
    if (readings.length > 0) {
      variablesWithData++;
      totalReadings += readings.length;
      stats[varCode] = getPeriodStatistics(readings);
    }
  });

  const avgReadingsPerVar = variablesWithData > 0 ? Math.round(totalReadings / variablesWithData) : 0;

  const html = `
    <div style="
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    ">
      <div style="
        background: rgba(34, 197, 94, 0.1);
        border: 1px solid var(--color-primary);
        border-radius: 8px;
        padding: 1.5rem;
        text-align: center;
      ">
        <div style="font-size: 2.5rem; font-weight: bold; color: var(--color-primary);">
          ${variablesWithData}
        </div>
        <div style="font-size: 0.9rem; color: var(--color-text-secondary); margin-top: 0.5rem;">
          Variáveis Coletadas
        </div>
      </div>

      <div style="
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid #3b82f6;
        border-radius: 8px;
        padding: 1.5rem;
        text-align: center;
      ">
        <div style="font-size: 2.5rem; font-weight: bold; color: #3b82f6;">
          ${totalReadings}
        </div>
        <div style="font-size: 0.9rem; color: var(--color-text-secondary); margin-top: 0.5rem;">
          Leituras Totais
        </div>
      </div>

      <div style="
        background: rgba(168, 85, 247, 0.1);
        border: 1px solid #a855f7;
        border-radius: 8px;
        padding: 1.5rem;
        text-align: center;
      ">
        <div style="font-size: 2.5rem; font-weight: bold; color: #a855f7;">
          ${avgReadingsPerVar}
        </div>
        <div style="font-size: 0.9rem; color: var(--color-text-secondary); margin-top: 0.5rem;">
          Média por Variável
        </div>
      </div>

      <div style="
        background: rgba(249, 115, 22, 0.1);
        border: 1px solid #f97316;
        border-radius: 8px;
        padding: 1.5rem;
        text-align: center;
      ">
        <div style="font-size: 1.5rem; color: #f97316; margin-bottom: 0.3rem;">
          ${dateRange.period === 'daily' ? '📅' : '📊'}
        </div>
        <div style="font-size: 0.9rem; color: var(--color-text-secondary);">
          ${PERIOD_FILTERS[dateRange.period].label.replace(/^[📊📈📉📅]/, '')}
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

// Render charts for each variable
function renderVariableCharts(periodData, dateRange) {
  const container = document.getElementById('variables-charts');

  // Get top variables with most variation
  const topVariables = getTopVariablesByTrend(periodData, 12);

  let html = `
    <div style="margin-bottom: 2rem;">
      <h3 style="margin: 0 0 1.5rem 0; color: var(--color-primary); font-size: 1.3rem;">
        📈 Variáveis com Maior Variação
      </h3>

      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
        gap: 2rem;
      ">
  `;

  topVariables.forEach(variable => {
    const readings = periodData[variable.code] || [];
    const aggregated = aggregateDataByPeriod(readings, dateRange.period, 'average');
    const stats = getPeriodStatistics(readings);

    html += renderVariableChart(variable, aggregated, stats, dateRange);
  });

  html += `
      </div>
    </div>
  `;

  // Add category breakdown
  html += renderCategoryBreakdown(periodData, dateRange);

  container.innerHTML = html;
}

// Render single variable chart
function renderVariableChart(variable, aggregated, stats, dateRange) {
  const sparkline = createSparkline(aggregated, 30);
  const trendIcon = stats.trend > 0 ? '📈' : stats.trend < 0 ? '📉' : '➡️';
  const trendColor = stats.trend > 0 ? '#22c55e' : stats.trend < 0 ? '#ef4444' : '#f59e0b';

  return `
    <div style="
      background: var(--color-bg-panel);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    ">
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 1rem;
      ">
        <div>
          <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; color: var(--color-primary);">
            ${variable.icon} ${variable.name}
          </h4>
          <p style="margin: 0; font-size: 0.85rem; color: var(--color-text-secondary);">
            ${variable.category}
          </p>
        </div>
        <div style="
          text-align: right;
          padding: 0.75rem 1rem;
          background: rgba(34, 197, 94, 0.1);
          border-radius: 6px;
        ">
          <div style="font-size: 1.8rem; font-weight: bold; color: var(--color-primary);">
            ${Math.round(stats.average * 10) / 10}
          </div>
          <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.25rem;">
            Média
          </div>
        </div>
      </div>

      <!-- Sparkline Chart -->
      <div style="
        background: rgba(0, 0, 0, 0.02);
        border: 1px solid var(--color-border);
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
        font-family: 'Courier New', monospace;
        font-size: 1.1rem;
        letter-spacing: 2px;
        color: var(--color-primary);
        overflow-x: auto;
      ">
        ${sparkline}
      </div>

      <!-- Statistics Grid -->
      <div style="
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
      ">
        <div>
          <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-bottom: 0.3rem;">
            Mínimo
          </div>
          <div style="font-size: 1.3rem; font-weight: bold; color: #ef4444;">
            ${Math.round(stats.min * 10) / 10}
          </div>
        </div>
        <div>
          <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-bottom: 0.3rem;">
            Máximo
          </div>
          <div style="font-size: 1.3rem; font-weight: bold; color: #22c55e;">
            ${Math.round(stats.max * 10) / 10}
          </div>
        </div>
        <div>
          <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-bottom: 0.3rem;">
            Mediana
          </div>
          <div style="font-size: 1.3rem; font-weight: bold; color: #3b82f6;">
            ${Math.round(stats.median * 10) / 10}
          </div>
        </div>
        <div>
          <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-bottom: 0.3rem;">
            Leituras
          </div>
          <div style="font-size: 1.3rem; font-weight: bold; color: #a855f7;">
            ${stats.count}
          </div>
        </div>
      </div>

      <!-- Trend Indicator -->
      <div style="
        padding: 1rem;
        background: rgba(${stats.trend > 0 ? '34, 197, 94' : stats.trend < 0 ? '239, 68, 68' : '245, 158, 11'}, 0.1);
        border-left: 4px solid ${trendColor};
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <span style="color: ${trendColor}; font-weight: 600;">
          ${trendIcon} Tendência do Período
        </span>
        <span style="
          font-size: 1.3rem;
          font-weight: bold;
          color: ${trendColor};
        ">
          ${stats.trend > 0 ? '+' : ''}${Math.round(stats.trend * 10) / 10}%
        </span>
      </div>
    </div>
  `;
}

// Category breakdown
function renderCategoryBreakdown(periodData, dateRange) {
  const categories = {
    traffic_footfall: '🚶 Tráfego & Fluxo',
    weather_climate: '🌤️ Clima',
    seasonal_events: '🎊 Sazonalidade',
    economic: '📊 Econômico',
    competitor: '🏪 Competição',
    inventory: '📦 Estoque',
    social: '📱 Digital',
    operations: '⚙️ Operações',
    external: '🌍 Externo',
  };

  let html = `
    <div>
      <h3 style="margin: 2rem 0 1.5rem 0; color: var(--color-primary); font-size: 1.3rem;">
        📂 Resumo por Categoria
      </h3>

      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
      ">
  `;

  Object.entries(categories).forEach(([catKey, catName]) => {
    const catVariables = Object.keys(periodData).filter(varCode =>
      VARIABLE_CATEGORIES[catKey]?.variables?.some(v => v.code === varCode)
    );

    const catReadings = catVariables.reduce((total, varCode) => {
      return total + (periodData[varCode]?.length || 0);
    }, 0);

    const catAvg = catReadings > 0
      ? (catVariables.reduce((sum, varCode) => {
        const stats = getPeriodStatistics(periodData[varCode]);
        return sum + stats.average;
      }, 0) / catVariables.length)
      : 0;

    html += `
      <div style="
        background: var(--color-bg-panel);
        border: 1px solid var(--color-border);
        border-radius: 8px;
        padding: 1.25rem;
        transition: all 0.3s ease;
      "
      onmouseover="this.style.boxShadow='0 4px 12px rgba(34, 197, 94, 0.15)'; this.style.transform='translateY(-2px)';"
      onmouseout="this.style.boxShadow='none'; this.style.transform='translateY(0)';">
        <div style="font-weight: 600; font-size: 1rem; margin-bottom: 0.75rem; color: var(--color-primary);">
          ${catName}
        </div>
        <div style="
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.75rem;
        ">
          <div>
            <div style="font-size: 0.75rem; color: var(--color-text-secondary);">Variáveis</div>
            <div style="font-size: 1.3rem; font-weight: bold; color: var(--color-primary);">
              ${catVariables.length}
            </div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--color-text-secondary);">Leituras</div>
            <div style="font-size: 1.3rem; font-weight: bold; color: #3b82f6;">
              ${catReadings}
            </div>
          </div>
        </div>
        <div style="
          background: rgba(34, 197, 94, 0.1);
          padding: 0.75rem;
          border-radius: 4px;
          text-align: center;
        ">
          <div style="font-size: 0.75rem; color: var(--color-text-secondary); margin-bottom: 0.25rem;">
            Média
          </div>
          <div style="font-size: 1.5rem; font-weight: bold; color: var(--color-primary);">
            ${Math.round(catAvg * 10) / 10}
          </div>
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  return html;
}

// Get top variables by trend variation
function getTopVariablesByTrend(periodData, limit = 12) {
  const variableStats = [];

  Object.entries(VARIABLE_CATEGORIES).forEach(([catKey, category]) => {
    category.variables.forEach(variable => {
      const readings = periodData[variable.code] || [];
      if (readings.length > 0) {
        const stats = getPeriodStatistics(readings);
        const variation = Math.abs(stats.trend);

        variableStats.push({
          ...variable,
          category: category.title,
          trend: stats.trend,
          variation: variation,
          stats: stats,
        });
      }
    });
  });

  return variableStats
    .sort((a, b) => b.variation - a.variation)
    .slice(0, limit);
}

// Mock dashboard
function renderVariablesDashboardMock() {
  return `
    <div id="period-filter-container"></div>
    <div style="margin-top: 2rem; padding: 1rem; background: rgba(255, 193, 7, 0.1); border: 1px solid #ffc107; border-radius: 8px;">
      <p style="margin: 0; color: #856404;">
        <strong>📌 Modo Offline:</strong> Mostrando dados simulados. Para ver dados reais, certifique-se que o servidor está rodando.
      </p>
    </div>
  `;
}

// Export function
window.loadVariablesDashboardWithPeriods = loadVariablesDashboardWithPeriods;
window.updateDashboardWithPeriod = updateDashboardWithPeriod;
