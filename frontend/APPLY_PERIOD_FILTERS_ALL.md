# Apply Period Filters to All Dashboards

## Overview

Apply the same period filtering system (Diário, Semanal, Quinzenal, Mensal, Anual) to all existing dashboards.

---

## 🎯 Dashboards to Update

1. **Taxa de Perdas** - Product loss breakdown
2. **Previsão IA** - Sales forecasts
3. **Cross-Sell** - Product correlations
4. **Clientes** - Customer metrics
5. **Base Clientes** - Customer base analysis
6. **RFM** - Customer segmentation
7. **Estoque** - Inventory status
8. **Alertas** - Alert monitoring
9. **Relatórios** - General reports

---

## 📊 Implementation Pattern

### For Each Dashboard:

```javascript
// 1. Add period filter container at top
<div id="period-filter-DASHBOARD_NAME"></div>

// 2. Initialize period filter in loadSection()
const periodFilter = new PeriodFilter(
  'period-filter-DASHBOARD_NAME',
  (dateRange) => {
    loadDashboardData(dateRange);
  }
);

// 3. Modify data loading function
async function loadDashboardData(dateRange) {
  // Fetch data
  // Filter by dateRange.startDate and dateRange.endDate
  // Aggregate by dateRange.period
  // Render with new data
}
```

---

## 📈 Taxa de Perdas Dashboard

### Update in `app.js`:

```javascript
case 'perdas':
  document.getElementById('section-perdas').style.display = 'block';
  previousSection = lastSection;
  
  // Initialize period filter
  const perdasFilter = new PeriodFilter('perdas-period-filter', (dateRange) => {
    loadPerdasWithPeriod(dateRange);
  });
  
  // Load initial data
  loadPerdasWithPeriod(perdasFilter.getDateRange());
  break;
```

### New function in `app.js`:

```javascript
async function loadPerdasWithPeriod(dateRange) {
  // Get loss data
  const data = await fetch(
    `/api/v1/perdas?start=${dateRange.startDate.toISOString()}&end=${dateRange.endDate.toISOString()}`
  ).then(r => r.json());
  
  // Aggregate by period
  const aggregated = aggregateDataByPeriod(data.perdas, dateRange.period, 'sum');
  
  // Render tables
  renderTabelaPerdasIndividual(aggregated);
  renderTabelaPerdasSetorial(aggregated);
  
  // Show period info
  updatePeriodInfo('Perdas', dateRange);
}
```

### Add to HTML:

```html
<div id="section-perdas" class="main-section" style="display: none;">
  <div class="section-header">
    <h1>📉 Taxa de Perdas por Período</h1>
  </div>
  
  <!-- Add period filter -->
  <div id="perdas-period-filter"></div>
  
  <!-- Existing content -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
    <div id="perdas-individual-table"></div>
    <div id="perdas-setorial-table"></div>
  </div>
</div>
```

---

## 📊 Previsão IA Dashboard

### Update in `app.js`:

```javascript
case 'previsao-ia':
  document.getElementById('section-previsao-ia').style.display = 'block';
  previousSection = lastSection;
  
  const forecastFilter = new PeriodFilter('forecast-period-filter', (dateRange) => {
    loadForecastWithPeriod(dateRange);
  });
  
  loadForecastWithPeriod(forecastFilter.getDateRange());
  break;
```

### New function:

```javascript
async function loadForecastWithPeriod(dateRange) {
  // Fetch forecast data
  const data = await fetch(
    `/api/v1/previsao?start=${dateRange.startDate.toISOString()}&end=${dateRange.endDate.toISOString()}`
  ).then(r => r.json());
  
  // Get actual sales for comparison
  const actual = await fetch(
    `/api/v1/vendas?start=${dateRange.startDate.toISOString()}&end=${dateRange.endDate.toISOString()}`
  ).then(r => r.json());
  
  // Aggregate
  const forecastAgg = aggregateDataByPeriod(data.forecast, dateRange.period);
  const actualAgg = aggregateDataByPeriod(actual.vendas, dateRange.period, 'sum');
  
  // Calculate accuracy (MAPE)
  const mape = calculateMAPE(forecastAgg, actualAgg);
  
  // Render
  renderForecastChart(forecastAgg, actualAgg, mape, dateRange);
}
```

### Chart function:

```javascript
function renderForecastChart(forecast, actual, mape, dateRange) {
  const container = document.getElementById('forecast-chart');
  
  let html = `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="margin: 0 0 0.5rem 0; color: var(--color-primary);">
        Acurácia (MAPE): ${mape.toFixed(2)}%
      </h3>
      <div style="
        height: 300px;
        background: var(--color-bg-panel);
        border: 1px solid var(--color-border);
        border-radius: 8px;
        padding: 1rem;
      ">
        <!-- Add chart library (Chart.js, Recharts, etc.) -->
        ${renderLineChart(forecast, actual, dateRange)}
      </div>
    </div>
    
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: rgba(34, 197, 94, 0.1);">
          <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--color-primary);">Data</th>
          <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid var(--color-primary);">Previsão</th>
          <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid var(--color-primary);">Real</th>
          <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid var(--color-primary);">Erro %</th>
        </tr>
      </thead>
      <tbody>
        ${forecast.map((f, i) => {
          const actual_val = actual[i]?.value || 0;
          const error = ((f.value - actual_val) / actual_val) * 100;
          return `
            <tr style="border-bottom: 1px solid var(--color-border);">
              <td style="padding: 0.75rem;">${f.key}</td>
              <td style="padding: 0.75rem; text-align: right;">${Math.round(f.value)}</td>
              <td style="padding: 0.75rem; text-align: right;">${Math.round(actual_val)}</td>
              <td style="padding: 0.75rem; text-align: right; color: ${error > 0 ? '#ef4444' : '#22c55e'};">
                ${error > 0 ? '+' : ''}${error.toFixed(1)}%
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
  
  container.innerHTML = html;
}
```

---

## 🛍️ Cross-Sell Dashboard

### Apply same pattern:

```javascript
case 'cross-sell':
  const crossFilter = new PeriodFilter('cross-period-filter', (dateRange) => {
    loadCrossSellWithPeriod(dateRange);
  });
  loadCrossSellWithPeriod(crossFilter.getDateRange());
  break;

async function loadCrossSellWithPeriod(dateRange) {
  // Fetch combination frequency data
  const data = await fetch(
    `/api/v1/cross-sell?start=${dateRange.startDate}&end=${dateRange.endDate}`
  ).then(r => r.json());
  
  // Filter by period
  const filtered = filterDataByDateRange(data.combinations, dateRange.startDate, dateRange.endDate);
  
  // Calculate metrics
  const metrics = filtered.map(combo => ({
    ...combo,
    support: (combo.frequency / filtered.length) * 100,
    trend: combo.recent_frequency / combo.frequency,
  }));
  
  renderCrossSellTable(metrics.sort((a, b) => b.support - a.support));
}
```

---

## 👥 Clientes Dashboard

```javascript
case 'clientes':
  const clientFilter = new PeriodFilter('client-period-filter', (dateRange) => {
    loadClientesWithPeriod(dateRange);
  });
  loadClientesWithPeriod(clientFilter.getDateRange());
  break;

async function loadClientesWithPeriod(dateRange) {
  // Fetch customer data
  const data = await fetch(
    `/api/v1/clientes?start=${dateRange.startDate}&end=${dateRange.endDate}`
  ).then(r => r.json());
  
  // Aggregate metrics
  const stats = {
    newCustomers: data.clientes.filter(c => 
      new Date(c.first_purchase) >= dateRange.startDate
    ).length,
    
    activeCustomers: data.clientes.filter(c => 
      new Date(c.last_purchase) >= dateRange.startDate
    ).length,
    
    churnedCustomers: data.clientes.filter(c => 
      new Date(c.last_purchase) < dateRange.startDate && 
      new Date(c.last_purchase) > new Date(dateRange.startDate.getTime() - 60*24*60*60*1000)
    ).length,
    
    averageTicket: data.clientes.reduce((sum, c) => sum + c.avg_ticket, 0) / data.clientes.length,
    
    totalRevenue: data.clientes.reduce((sum, c) => sum + c.total_spent, 0),
  };
  
  renderClientesMetrics(stats, dateRange);
}
```

---

## 📦 Estoque Dashboard

```javascript
case 'estoque':
  const stockFilter = new PeriodFilter('stock-period-filter', (dateRange) => {
    loadEstoqueWithPeriod(dateRange);
  });
  loadEstoqueWithPeriod(stockFilter.getDateRange());
  break;

async function loadEstoqueWithPeriod(dateRange) {
  const data = await fetch(
    `/api/v1/inventario?start=${dateRange.startDate}&end=${dateRange.endDate}`
  ).then(r => r.json());
  
  // Calculate turn rate and metrics over period
  const inventory = data.inventario.map(item => {
    const units_sold = calculateUnitsSold(item.sku, dateRange);
    const turn_rate = units_sold / item.stock_atual;
    
    return {
      ...item,
      units_sold,
      turn_rate,
      health: getTurnRateHealth(turn_rate),
      days_stock = item.stock_atual / (units_sold / getDaysInPeriod(dateRange)),
    };
  });
  
  renderEstoqueTable(inventory);
}
```

---

## 🔔 Alertas Dashboard

```javascript
case 'alertas':
  const alertFilter = new PeriodFilter('alert-period-filter', (dateRange) => {
    loadAlertsWithPeriod(dateRange);
  });
  loadAlertsWithPeriod(alertFilter.getDateRange());
  break;

async function loadAlertsWithPeriod(dateRange) {
  const data = await fetch(
    `/api/v1/alertas?start=${dateRange.startDate}&end=${dateRange.endDate}`
  ).then(r => r.json());
  
  // Aggregate by type and severity
  const aggregated = {
    total: data.alertas.length,
    resolved: data.alertas.filter(a => a.status === 'resolved').length,
    pending: data.alertas.filter(a => a.status === 'pending').length,
    byType: {},
    bySeverity: {},
  };
  
  renderAlertsSummary(aggregated, dateRange);
  renderAlertsTimeline(data.alertas, dateRange);
}
```

---

## 📊 Relatórios Dashboard

```javascript
case 'relatorios':
  const reportFilter = new PeriodFilter('report-period-filter', (dateRange) => {
    loadRelatoriosWithPeriod(dateRange);
  });
  loadRelatoriosWithPeriod(reportFilter.getDateRange());
  break;

async function loadRelatoriosWithPeriod(dateRange) {
  // Fetch all metrics
  const [vendas, perdas, clientes, estoque] = await Promise.all([
    fetch(`/api/v1/vendas?start=${dateRange.startDate}&end=${dateRange.endDate}`).then(r => r.json()),
    fetch(`/api/v1/perdas?start=${dateRange.startDate}&end=${dateRange.endDate}`).then(r => r.json()),
    fetch(`/api/v1/clientes?start=${dateRange.startDate}&end=${dateRange.endDate}`).then(r => r.json()),
    fetch(`/api/v1/inventario?start=${dateRange.startDate}&end=${dateRange.endDate}`).then(r => r.json()),
  ]);
  
  // Generate comprehensive report
  renderComprehensiveReport({
    vendas: aggregateDataByPeriod(vendas.vendas, dateRange.period, 'sum'),
    perdas: aggregateDataByPeriod(perdas.perdas, dateRange.period, 'sum'),
    clientes: clientes.clientes,
    estoque: estoque.inventario,
  }, dateRange);
}
```

---

## 🎯 Generic Implementation Template

Use this template for any dashboard:

```javascript
// 1. In case statement
case 'dashboard-name':
  const filter = new PeriodFilter('dashboard-filter-container', (dateRange) => {
    loadDashboardData(dateRange);
  });
  loadDashboardData(filter.getDateRange());
  break;

// 2. New loading function
async function loadDashboardData(dateRange) {
  try {
    // Fetch data with date range
    const data = await fetch(
      `/api/v1/endpoint?start=${dateRange.startDate.toISOString()}&end=${dateRange.endDate.toISOString()}`
    ).then(r => r.json());
    
    // Filter by date range
    const filtered = filterDataByDateRange(data.items, dateRange.startDate, dateRange.endDate);
    
    // Aggregate by period
    const aggregated = aggregateDataByPeriod(filtered, dateRange.period, 'sum');
    
    // Get statistics
    const stats = getPeriodStatistics(aggregated);
    
    // Render
    renderDashboard(aggregated, stats, dateRange);
  } catch (error) {
    console.error('Error:', error);
  }
}

// 3. HTML container
<div id="dashboard-filter-container"></div>
```

---

## ⚡ Quick Checklist

For each dashboard:

- [ ] Add `<div id="DASHBOARD-period-filter"></div>` to HTML
- [ ] Initialize `new PeriodFilter()` in `loadSection()` case
- [ ] Create `loadDASHBOARDWithPeriod(dateRange)` function
- [ ] Use `filterDataByDateRange()` to filter data
- [ ] Use `aggregateDataByPeriod()` to aggregate
- [ ] Use `getPeriodStatistics()` for stats
- [ ] Render with new aggregated data
- [ ] Test all 5 periods

---

## 🚀 Implementation Order

1. **Priority 1** (Most important):
   - Taxa de Perdas (already showing loss data)
   - Previsão IA (forecasts need period context)

2. **Priority 2** (Important):
   - Cross-Sell (product combinations)
   - Clientes (customer metrics)
   - Estoque (inventory turnover)

3. **Priority 3** (Nice to have):
   - Base Clientes (customer details)
   - RFM (segmentation analysis)
   - Alertas (alert history)
   - Relatórios (comprehensive reports)

---

## 📈 Expected Benefits

✅ Better trend analysis
✅ Compare different periods
✅ Identify seasonal patterns
✅ Track performance improvements
✅ More informed decision making
✅ Historical data visibility

---

## 🎓 Testing

Test each dashboard with:
1. **Diário** - Today's data
2. **Semanal** - Last 7 days
3. **Quinzenal** - Last 14 days
4. **Mensal** - Last 30 days
5. **Anual** - Last 365 days

Verify:
- ✅ Data filters correctly
- ✅ Charts update
- ✅ Statistics calculate
- ✅ Trends show
- ✅ UI responsive

---

**Ready to implement? Start with Taxa de Perdas and Previsão IA!** 📊

