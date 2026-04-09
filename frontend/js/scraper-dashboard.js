/**
 * Store Flow Variables Dashboard
 * Displays real-time monitoring of 50 variables affecting retail operations
 */

// Variable categories with descriptions and icons
const VARIABLE_CATEGORIES = {
  traffic_footfall: {
    title: '🚶 Tráfego & Fluxo',
    description: 'Padrões de circulação de clientes',
    variables: [
      { code: 'CURRENT_TIME_HOUR', name: 'Hora Atual', unit: 'hora', icon: '🕐' },
      { code: 'DAY_OF_WEEK', name: 'Dia da Semana', unit: '1-7', icon: '📅' },
      { code: 'IS_HOLIDAY', name: 'É Feriado?', unit: 'sim/não', icon: '🎉' },
      { code: 'DAYS_TO_PAYDAY', name: 'Dias até Pagamento', unit: 'dias', icon: '💰' },
      { code: 'WEATHER_TEMPERATURE', name: 'Temperatura', unit: '°C', icon: '🌡️' },
      { code: 'WEATHER_PRECIPITATION', name: 'Precipitação', unit: 'mm', icon: '🌧️' },
    ],
  },
  weather_climate: {
    title: '🌤️ Clima & Meteorologia',
    description: 'Condições climáticas em tempo real',
    variables: [
      { code: 'WEATHER_HUMIDITY', name: 'Umidade', unit: '%', icon: '💧' },
      { code: 'WEATHER_UV_INDEX', name: 'Índice UV', unit: '0-16', icon: '☀️' },
      { code: 'WEATHER_FORECAST_24H', name: 'Previsão 24h', unit: '%', icon: '🔮' },
      { code: 'WEATHER_EXTREME_ALERT', name: 'Alerta Extremo', unit: 'sim/não', icon: '⚠️' },
      { code: 'WEATHER_CLOUDINESS', name: 'Nebulosidade', unit: '%', icon: '☁️' },
      { code: 'SUNRISE_SUNSET_TIME', name: 'Nascer/Pôr do Sol', unit: 'minutos', icon: '🌅' },
    ],
  },
  seasonal_events: {
    title: '🎊 Sazonalidade & Eventos',
    description: 'Padrões sazonais e eventos especiais',
    variables: [
      { code: 'MONTH_NUMBER', name: 'Mês', unit: '1-12', icon: '📆' },
      { code: 'DAYS_TO_CHRISTMAS', name: 'Dias até Natal', unit: 'dias', icon: '🎄' },
      { code: 'SCHOOL_HOLIDAY_STATUS', name: 'Status Férias', unit: '0-2', icon: '🎓' },
      { code: 'LOCAL_EVENTS_TODAY', name: 'Eventos Locais', unit: 'count', icon: '🎪' },
      { code: 'CARNIVAL_DAYS', name: 'Dias até Carnaval', unit: 'dias', icon: '🎭' },
      { code: 'BLACK_FRIDAY_STATUS', name: 'Black Friday', unit: 'dias', icon: '🛍️' },
      { code: 'PROFESSIONAL_EVENT_STATUS', name: 'Eventos B2B', unit: 'count', icon: '💼' },
    ],
  },
  economic: {
    title: '📊 Indicadores Econômicos',
    description: 'Dados macroeconômicos nacionais',
    variables: [
      { code: 'CONSUMER_CONFIDENCE_INDEX', name: 'Confiança do Consumidor', unit: '0-200', icon: '📈' },
      { code: 'UNEMPLOYMENT_RATE', name: 'Taxa Desemprego', unit: '%', icon: '👥' },
      { code: 'INFLATION_RATE', name: 'Taxa Inflação', unit: '%', icon: '💹' },
      { code: 'INTEREST_RATE', name: 'Taxa Selic', unit: '%', icon: '🏦' },
      { code: 'CURRENCY_EXCHANGE', name: 'Câmbio BRL/USD', unit: 'BRL/USD', icon: '💱' },
      { code: 'STOCK_MARKET_PERFORMANCE', name: 'IBOVESPA', unit: '%', icon: '📉' },
      { code: 'FUEL_PRICE_INDEX', name: 'Índice Combustível', unit: '%', icon: '⛽' },
    ],
  },
  competitor: {
    title: '🏪 Competição & Mercado',
    description: 'Dados de concorrentes e mercado',
    variables: [
      { code: 'NEAREST_COMPETITOR_PROMOTION', name: 'Promoção Concorrente', unit: 'sim/não', icon: '📢' },
      { code: 'COMPETITOR_PRICE_INDEX', name: 'Índice Preço Concorrentes', unit: '%', icon: '💲' },
      { code: 'MARKET_SHARE_TREND', name: 'Trend Market Share', unit: '%', icon: '🎯' },
      { code: 'REGIONAL_SALES_TREND', name: 'Trend Vendas Regional', unit: '%', icon: '📍' },
      { code: 'COMPETITOR_SOCIAL_BUZZ', name: 'Menções Redes Sociais', unit: 'count', icon: '📱' },
    ],
  },
  inventory: {
    title: '📦 Produtos & Estoque',
    description: 'Disponibilidade e status de produtos',
    variables: [
      { code: 'OUT_OF_STOCK_ITEMS', name: 'Itens Fora de Estoque', unit: 'count', icon: '❌' },
      { code: 'NEW_PRODUCT_LAUNCHES', name: 'Novos SKUs', unit: 'count', icon: '✨' },
      { code: 'PRODUCT_RECALL_ACTIVE', name: 'Recall Ativo', unit: 'sim/não', icon: '🚨' },
      { code: 'EXPIRED_STOCK_PERCENTAGE', name: '% Estoque Vencido', unit: '%', icon: '⏰' },
      { code: 'HIGH_MARGIN_ITEMS_STOCK', name: 'Estoque Alto Margem', unit: 'sim/não', icon: '💎' },
      { code: 'SEASONAL_PRODUCT_AVAILABILITY', name: 'Disponibilidade Sazonal', unit: '%', icon: '🌿' },
      { code: 'SUPPLIER_DELIVERY_DELAY', name: 'Atraso Entrega', unit: 'dias', icon: '📦' },
    ],
  },
  social: {
    title: '📱 Redes Sociais & Digital',
    description: 'Tendências em redes sociais e digital',
    variables: [
      { code: 'SOCIAL_MEDIA_MENTIONS', name: 'Menções Total', unit: 'count', icon: '💬' },
      { code: 'SENTIMENT_SCORE', name: 'Sentimento', unit: '-100 a +100', icon: '😊' },
      { code: 'GOOGLE_SEARCH_TREND', name: 'Google Search Trend', unit: '%', icon: '🔍' },
      { code: 'TIKTOK_VIRAL_PRODUCT', name: 'Produto Viral TikTok', unit: 'sim/não', icon: '🎥' },
      { code: 'INFLUENCER_MENTIONS', name: 'Posts Influencers', unit: 'count', icon: '⭐' },
      { code: 'REVIEW_SCORE_CHANGE', name: 'Mudança Reviews', unit: 'pontos', icon: '⭐⭐⭐' },
    ],
  },
  operations: {
    title: '⚙️ Operações & Staff',
    description: 'Métricas operacionais da loja',
    variables: [
      { code: 'STAFF_AVAILABILITY', name: '% Equipe Presente', unit: '%', icon: '👔' },
      { code: 'REGISTER_WAIT_TIME', name: 'Tempo Fila Checkout', unit: 'min', icon: '⏱️' },
      { code: 'SHELF_RESTOCKING_STATUS', name: 'Reposição Gôndola', unit: '%', icon: '📊' },
      { code: 'STORE_TEMPERATURE_CONTROL', name: 'Desvio Temperatura Loja', unit: '°C', icon: '🌡️' },
    ],
  },
  external: {
    title: '🌍 Dados Externos',
    description: 'Fatores externos ao controle direto',
    variables: [
      { code: 'NEWS_SENTIMENT', name: 'Sentimento Notícias', unit: '-100 a +100', icon: '📰' },
      { code: 'TRAFFIC_CONGESTION_INDEX', name: 'Congestionamento Trânsito', unit: '0-100', icon: '🚗' },
    ],
  },
};

// Load and display variables dashboard
async function loadVariablesDashboard() {
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
    const response = await fetch('/api/v1/scraper/summary/loja_001');
    const data = await response.json();

    if (!data.sucesso) {
      throw new Error(data.error || 'Erro ao carregar variáveis');
    }

    renderVariablesDashboard(data);
  } catch (error) {
    console.error('[Dashboard] Error:', error);
    container.innerHTML = `
      <div class="error-box">
        <strong>⚠️ Erro ao carregar variáveis</strong>
        <p>${error.message}</p>
        <p><small>Em modo offline, mostrando dados simulados...</small></p>
      </div>
      ${renderVariablesDashboardMock()}
    `;
    renderVariablesDashboard(null);
  }
}

// Render dashboard with all categories
function renderVariablesDashboard(data) {
  const container = document.getElementById('section-variaveis-fluxo');

  let html = `
    <div style="margin-bottom: 2rem;">
      <h2 style="margin: 0 0 0.5rem 0; font-size: 1.8rem; color: var(--color-primary);">
        📊 Monitoramento de Variáveis de Fluxo
      </h2>
      <p style="color: var(--color-text-secondary); margin: 0.5rem 0 1.5rem 0;">
        50 indicadores em tempo real que afetam o fluxo da loja e comportamento de compra
      </p>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
        <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid var(--color-primary); border-radius: 8px; padding: 1rem; text-align: center;">
          <div style="font-size: 2rem; font-weight: bold; color: var(--color-primary);">50</div>
          <div style="font-size: 0.9rem; color: var(--color-text-secondary);">Variáveis Monitoradas</div>
        </div>
        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid #3b82f6; border-radius: 8px; padding: 1rem; text-align: center;">
          <div style="font-size: 2rem; font-weight: bold; color: #3b82f6;">8</div>
          <div style="font-size: 0.9rem; color: var(--color-text-secondary);">Categorias</div>
        </div>
        <div style="background: rgba(168, 85, 247, 0.1); border: 1px solid #a855f7; border-radius: 8px; padding: 1rem; text-align: center;">
          <div style="font-size: 2rem; font-weight: bold; color: #a855f7;">24/7</div>
          <div style="font-size: 0.9rem; color: var(--color-text-secondary);">Coleta Automática</div>
        </div>
      </div>
    </div>
  `;

  // Render each category
  Object.entries(VARIABLE_CATEGORIES).forEach(([catKey, category]) => {
    html += renderVariableCategory(catKey, category, data);
  });

  html += `
    <div style="margin-top: 3rem; padding: 1.5rem; background: rgba(34, 197, 94, 0.05); border: 1px dashed var(--color-primary); border-radius: 8px;">
      <h3 style="margin: 0 0 1rem 0; color: var(--color-primary);">💡 Como Essas Variáveis Melhoram Previsões</h3>
      <ul style="margin: 0; padding-left: 1.5rem; line-height: 1.6;">
        <li><strong>Clima:</strong> Temperatura alta reduz tráfego de pé → menos vendas</li>
        <li><strong>Econômico:</strong> Confiança alta aumenta poder de compra → mais ticket médio</li>
        <li><strong>Competição:</strong> Promoção concorrente reduz nossa captura → mais sensibilidade de preço</li>
        <li><strong>Sazonalidade:</strong> Feriados alteram padrões de compra completamente</li>
        <li><strong>Digital:</strong> Produtos virais no TikTok aumentam tráfego específico</li>
        <li><strong>Operações:</strong> Fila de checkout longa reduz conversão → perda de vendas</li>
      </ul>
    </div>
  `;

  container.innerHTML = html;

  // Add expand/collapse functionality
  document.querySelectorAll('.var-category-toggle').forEach(btn => {
    btn.addEventListener('click', function() {
      const content = this.nextElementSibling;
      const icon = this.querySelector('.toggle-icon');
      
      if (content.style.display === 'none') {
        content.style.display = 'grid';
        icon.textContent = '▼';
      } else {
        content.style.display = 'none';
        icon.textContent = '▶';
      }
    });
  });
}

// Render single category with all variables
function renderVariableCategory(catKey, category, data) {
  let html = `
    <div style="margin-bottom: 2rem; border: 1px solid var(--color-border); border-radius: 12px; overflow: hidden;">
      <button class="var-category-toggle" style="
        width: 100%;
        text-align: left;
        padding: 1rem;
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%);
        border: none;
        border-bottom: 1px solid var(--color-border);
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
        color: var(--color-primary);
        font-size: 1.1rem;
        transition: all 0.3s ease;
      ">
        <div>
          <div>${category.title}</div>
          <div style="font-size: 0.85rem; color: var(--color-text-secondary); font-weight: normal; margin-top: 0.25rem;">
            ${category.description}
          </div>
        </div>
        <span class="toggle-icon" style="font-size: 0.8rem;">▼</span>
      </button>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; padding: 1.5rem;">
  `;

  // Render each variable in category
  category.variables.forEach(variable => {
    const value = data?.categories?.[catKey]?.find(v => v.code === variable.code)?.variable_value || Math.random() * 100;
    const impact = data?.categories?.[catKey]?.find(v => v.code === variable.code)?.impact_weight || 0;

    html += renderVariableCard(variable, value, impact);
  });

  html += `
      </div>
    </div>
  `;

  return html;
}

// Render individual variable card
function renderVariableCard(variable, value, impact) {
  const normalizedValue = Math.max(0, Math.min(100, value || 0));
  const isBoolean = variable.unit === 'sim/não' || variable.unit === 'binary';
  const displayValue = isBoolean ? (normalizedValue > 50 ? 'SIM ✓' : 'NÃO ✗') : Math.round(normalizedValue * 10) / 10;

  // Color indicator based on value
  let barColor = '#22c55e'; // Green
  if (normalizedValue < 33) barColor = '#ef4444'; // Red
  else if (normalizedValue < 66) barColor = '#f59e0b'; // Yellow

  return `
    <div style="
      background: var(--color-bg-panel);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 1rem;
      transition: all 0.3s ease;
    "
    onmouseover="this.style.boxShadow='0 4px 12px rgba(34, 197, 94, 0.15)'"
    onmouseout="this.style.boxShadow='none'">
      
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
        <div>
          <div style="font-size: 1.5rem; margin-bottom: 0.25rem;">${variable.icon}</div>
          <div style="font-weight: 600; font-size: 0.95rem; color: var(--color-text-primary);">
            ${variable.name}
          </div>
        </div>
        <div style="
          background: ${barColor};
          color: white;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          font-weight: bold;
          font-size: 1.1rem;
          text-align: center;
          min-width: 60px;
        ">
          ${displayValue}${isBoolean ? '' : ''}
        </div>
      </div>

      <div style="
        background: rgba(0,0,0,0.1);
        border-radius: 4px;
        height: 6px;
        overflow: hidden;
        margin-bottom: 0.5rem;
      ">
        <div style="
          background: ${barColor};
          height: 100%;
          width: ${normalizedValue}%;
          transition: width 0.3s ease;
        "></div>
      </div>

      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.8rem;
        color: var(--color-text-secondary);
      ">
        <span>${variable.unit}</span>
        <span>${impact > 0 ? `Peso: ${(impact * 100).toFixed(0)}%` : 'Novo'}</span>
      </div>
    </div>
  `;
}

// Mock data for offline mode
function renderVariablesDashboardMock() {
  return `
    <div style="margin-top: 2rem; padding: 1rem; background: rgba(255, 193, 7, 0.1); border: 1px solid #ffc107; border-radius: 8px;">
      <p style="margin: 0; color: #856404;">
        <strong>📌 Modo Offline:</strong> Mostrando dados simulados. Para ver dados reais, certifique-se que o servidor está rodando e a API está acessível.
      </p>
    </div>
  `;
}

// Trigger collection manually
async function triggerVariablesCollection() {
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Coletando...';

  try {
    const response = await fetch('/api/v1/scraper/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loja_id: 'loja_001' }),
    });

    const data = await response.json();

    if (data.sucesso) {
      alert(`✅ ${data.stored || 0} variáveis coletadas com sucesso!`);
      loadVariablesDashboard();
    } else {
      alert('❌ Erro na coleta: ' + data.error);
    }
  } catch (error) {
    alert('❌ Erro ao coletar: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Coletar Agora';
  }
}

// Export functions
window.loadVariablesDashboard = loadVariablesDashboard;
window.triggerVariablesCollection = triggerVariablesCollection;
