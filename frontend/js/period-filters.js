/**
 * Period Filter System
 * Provides date range filtering for all charts and dashboards
 * Periods: Diário, Semanal, Quinzenal, Mensal, Anual
 */

const PERIOD_FILTERS = {
  daily: {
    label: '📅 Diário',
    days: 1,
    format: 'HH:mm',
    aggregation: 'hourly',
  },
  weekly: {
    label: '📊 Semanal',
    days: 7,
    format: 'ddd',
    aggregation: 'daily',
  },
  biweekly: {
    label: '📈 Quinzenal',
    days: 14,
    format: 'DD/MM',
    aggregation: 'daily',
  },
  monthly: {
    label: '📉 Mensal',
    days: 30,
    format: 'DD/MM',
    aggregation: 'daily',
  },
  annual: {
    label: '📊 Anual',
    days: 365,
    format: 'MMM',
    aggregation: 'weekly',
  },
};

class PeriodFilter {
  constructor(containerId, onChangeCallback) {
    this.containerId = containerId;
    this.onChangeCallback = onChangeCallback;
    this.currentPeriod = 'monthly';
    this.startDate = this.getStartDate('monthly');
    this.endDate = new Date();
    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const html = `
      <div style="
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        padding: 1rem;
        background: rgba(34, 197, 94, 0.05);
        border-radius: 8px;
        border: 1px solid rgba(34, 197, 94, 0.1);
        margin-bottom: 1.5rem;
        align-items: center;
      ">
        <span style="
          font-weight: 600;
          color: var(--color-primary);
          font-size: 0.95rem;
        ">🗓️ Período:</span>

        ${Object.entries(PERIOD_FILTERS).map(([key, config]) => `
          <button
            class="period-filter-btn period-${key}"
            data-period="${key}"
            style="
              padding: 0.6rem 1.2rem;
              border: 2px solid ${this.currentPeriod === key ? 'var(--color-primary)' : 'rgba(34, 197, 94, 0.2)'};
              background: ${this.currentPeriod === key ? 'rgba(34, 197, 94, 0.15)' : 'transparent'};
              color: ${this.currentPeriod === key ? 'var(--color-primary)' : 'var(--color-text-secondary)'};
              border-radius: 6px;
              cursor: pointer;
              font-weight: ${this.currentPeriod === key ? '700' : '500'};
              font-size: 0.9rem;
              transition: all 0.3s ease;
            "
            onmouseover="this.style.borderColor='var(--color-primary)'; this.style.backgroundColor='rgba(34, 197, 94, 0.1)';"
            onmouseout="this.style.borderColor='${this.currentPeriod === key ? 'var(--color-primary)' : 'rgba(34, 197, 94, 0.2)'}'; this.style.backgroundColor='${this.currentPeriod === key ? 'rgba(34, 197, 94, 0.15)' : 'transparent'}';"
          >
            ${config.label}
          </button>
        `).join('')}

        <div style="
          margin-left: auto;
          font-size: 0.85rem;
          color: var(--color-text-secondary);
          padding: 0.5rem 1rem;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 6px;
        ">
          <span id="period-range-label">
            ${this.formatDateRange(this.startDate, this.endDate)}
          </span>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  attachEventListeners() {
    document.querySelectorAll('.period-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const period = e.target.dataset.period;
        this.setPeriod(period);
      });
    });
  }

  setPeriod(period) {
    this.currentPeriod = period;
    this.startDate = this.getStartDate(period);
    this.endDate = new Date();
    this.render();
    this.attachEventListeners();

    // Call callback with new date range
    if (this.onChangeCallback) {
      this.onChangeCallback({
        period: period,
        startDate: this.startDate,
        endDate: this.endDate,
        config: PERIOD_FILTERS[period],
      });
    }
  }

  getStartDate(period) {
    const now = new Date();
    const days = PERIOD_FILTERS[period]?.days || 30;
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return start;
  }

  formatDateRange(start, end) {
    const formatOptions = {
      month: 'short',
      day: 'numeric',
    };

    if (this.currentPeriod === 'daily') {
      return `Hoje · ${this.formatTime(end)}`;
    } else if (this.currentPeriod === 'annual') {
      return `${start.getFullYear()} (12 meses)`;
    } else {
      return `${start.toLocaleDateString('pt-BR', formatOptions)} a ${end.toLocaleDateString('pt-BR', formatOptions)}`;
    }
  }

  formatTime(date) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  getDateRange() {
    return {
      startDate: this.startDate,
      endDate: this.endDate,
      period: this.currentPeriod,
    };
  }
}

/**
 * Data Aggregation Functions
 * Aggregate data based on period
 */

function aggregateDataByPeriod(data, period, aggregationFunc = 'average') {
  const config = PERIOD_FILTERS[period];
  if (!config) return data;

  const aggregated = {};

  data.forEach(point => {
    const date = new Date(point.timestamp || point.collected_at);
    let key;

    switch (config.aggregation) {
      case 'hourly':
        key = `${date.getHours()}:00`;
        break;
      case 'daily':
        key = date.toLocaleDateString('pt-BR');
        break;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toLocaleDateString('pt-BR');
        break;
      default:
        key = date.toLocaleDateString('pt-BR');
    }

    if (!aggregated[key]) {
      aggregated[key] = {
        key,
        values: [],
        count: 0,
        timestamp: date,
      };
    }

    aggregated[key].values.push(parseFloat(point.variable_value || point.value || 0));
    aggregated[key].count++;
  });

  // Apply aggregation function
  return Object.values(aggregated).map(item => ({
    key: item.key,
    timestamp: item.timestamp,
    value: calculateAggregation(item.values, aggregationFunc),
    min: Math.min(...item.values),
    max: Math.max(...item.values),
    avg: item.values.reduce((a, b) => a + b, 0) / item.values.length,
    count: item.count,
  })).sort((a, b) => a.timestamp - b.timestamp);
}

function calculateAggregation(values, func) {
  if (values.length === 0) return 0;

  switch (func.toLowerCase()) {
    case 'average':
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'count':
      return values.length;
    case 'median':
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    default:
      return values.reduce((a, b) => a + b, 0) / values.length;
  }
}

/**
 * Filter data by date range
 */
function filterDataByDateRange(data, startDate, endDate) {
  return data.filter(item => {
    const itemDate = new Date(item.timestamp || item.collected_at);
    return itemDate >= startDate && itemDate <= endDate;
  });
}

/**
 * Get statistics for period
 */
function getPeriodStatistics(data, aggregationFunc = 'average') {
  if (data.length === 0) {
    return {
      average: 0,
      min: 0,
      max: 0,
      median: 0,
      count: 0,
      trend: 0,
    };
  }

  const values = data.map(d => parseFloat(d.value || d.variable_value || 0));

  // Calculate trend (first half vs second half)
  const midpoint = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, midpoint);
  const secondHalf = values.slice(midpoint);
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length || 0;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length || 0;
  const trend = ((avgSecond - avgFirst) / avgFirst) * 100 || 0;

  return {
    average: calculateAggregation(values, 'average'),
    min: Math.min(...values),
    max: Math.max(...values),
    median: calculateAggregation(values, 'median'),
    count: values.length,
    trend: trend, // Percentage change
  };
}

/**
 * Create sparkline for period (simple ASCII visualization)
 */
function createSparkline(data, width = 20) {
  if (data.length === 0) return '─'.repeat(width);

  const values = data.map(d => d.value || d.variable_value || 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const blocks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  const step = Math.ceil(values.length / width);

  let sparkline = '';
  for (let i = 0; i < values.length; i += step) {
    const normalized = (values[i] - min) / range;
    const blockIndex = Math.floor(normalized * (blocks.length - 1));
    sparkline += blocks[blockIndex];
  }

  return sparkline.padEnd(width, '▁');
}

// Export for use
window.PeriodFilter = PeriodFilter;
window.aggregateDataByPeriod = aggregateDataByPeriod;
window.filterDataByDateRange = filterDataByDateRange;
window.getPeriodStatistics = getPeriodStatistics;
window.createSparkline = createSparkline;
window.PERIOD_FILTERS = PERIOD_FILTERS;
