/**
 * Search System for Variables and Events
 * Pesquisa rápida de variáveis, eventos e métricas
 */

// Search configuration
const SEARCH_CONFIG = {
  minChars: 2,
  debounceDelay: 300,
  maxResults: 20,
  searchFields: {
    variables: ['name', 'code', 'description', 'category', 'unit'],
    events: ['name', 'date', 'type', 'location', 'description'],
  },
};

class SearchSystem {
  constructor(containerId, onSelectCallback) {
    this.containerId = containerId;
    this.onSelectCallback = onSelectCallback;
    this.searchIndex = [];
    this.results = [];
    this.selectedIndex = -1;
    this.debounceTimer = null;
    this.init();
  }

  init() {
    this.buildIndex();
    this.render();
    this.attachEventListeners();
  }

  /**
   * Build searchable index from variables
   */
  buildIndex() {
    this.searchIndex = [];

    // Index all variables
    Object.entries(VARIABLE_CATEGORIES).forEach(([catKey, category]) => {
      category.variables.forEach(variable => {
        this.searchIndex.push({
          type: 'variable',
          id: variable.code,
          name: variable.name,
          code: variable.code,
          icon: variable.icon,
          category: category.title,
          categoryKey: catKey,
          unit: variable.unit,
          description: variable.name,
          searchText: `${variable.code} ${variable.name} ${category.title}`.toLowerCase(),
        });
      });
    });

    // Index events (mock data)
    const events = this.getMockEvents();
    events.forEach(event => {
      this.searchIndex.push({
        type: 'event',
        id: event.id,
        name: event.name,
        icon: event.icon,
        date: event.date,
        type: event.type,
        location: event.location,
        description: event.description,
        searchText: `${event.name} ${event.type} ${event.date}`.toLowerCase(),
      });
    });
  }

  /**
   * Mock events data (in production, fetch from API)
   */
  getMockEvents() {
    return [
      {
        id: 'evt_001',
        name: 'Carnaval 2026',
        icon: '🎭',
        date: '2026-02-24',
        type: 'Festival',
        location: 'São Paulo',
        description: 'Maior festa de rua do Brasil',
      },
      {
        id: 'evt_002',
        name: 'Black Friday 2026',
        icon: '🛍️',
        date: '2026-11-27',
        type: 'Shopping',
        location: 'Brasil',
        description: 'Maior evento de compras do ano',
      },
      {
        id: 'evt_003',
        name: 'Natal 2026',
        icon: '🎄',
        date: '2026-12-25',
        type: 'Feriado',
        location: 'Brasil',
        description: 'Festividade cristã',
      },
      {
        id: 'evt_004',
        name: 'Copa do Mundo 2026',
        icon: '⚽',
        date: '2026-06-01',
        type: 'Esporte',
        location: 'USA/México/Canadá',
        description: 'Maior evento de futebol mundial',
      },
      {
        id: 'evt_005',
        name: 'Páscoa 2026',
        icon: '🐰',
        date: '2026-04-05',
        type: 'Feriado',
        location: 'Brasil',
        description: 'Festividade religiosa',
      },
      {
        id: 'evt_006',
        name: 'Festa Junina 2026',
        icon: '🔥',
        date: '2026-06-15',
        type: 'Festival',
        location: 'Brasil',
        description: 'Celebração das colheitas',
      },
    ];
  }

  /**
   * Render search box
   */
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const html = `
      <div style="position: relative; margin-bottom: 1.5rem;">
        <div style="
          display: flex;
          gap: 0.75rem;
          align-items: stretch;
        ">
          <div style="
            position: relative;
            flex: 1;
          ">
            <input
              type="text"
              id="search-input"
              placeholder="🔍 Pesquise variáveis, eventos... (ex: temperatura, Black Friday)"
              style="
                width: 100%;
                padding: 0.75rem 1rem;
                border: 2px solid var(--color-border);
                border-radius: 8px;
                font-size: 0.95rem;
                transition: all 0.3s ease;
              "
              autocomplete="off"
            />
            <div id="search-results-dropdown" style="
              position: absolute;
              top: 100%;
              left: 0;
              right: 0;
              background: var(--color-bg-panel);
              border: 1px solid var(--color-border);
              border-top: none;
              border-radius: 0 0 8px 8px;
              max-height: 400px;
              overflow-y: auto;
              display: none;
              margin-top: -2px;
              z-index: 1000;
              box-shadow: 0 8px 16px rgba(0,0,0,0.1);
            "></div>
          </div>

          <button id="search-filters-btn" style="
            padding: 0.75rem 1.5rem;
            background: rgba(34, 197, 94, 0.1);
            border: 2px solid var(--color-primary);
            color: var(--color-primary);
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
          "
          onmouseover="this.style.background='rgba(34, 197, 94, 0.2)'"
          onmouseout="this.style.background='rgba(34, 197, 94, 0.1)'">
            ⚙️ Filtros
          </button>
        </div>

        <!-- Advanced Filters Panel -->
        <div id="filters-panel" style="
          display: none;
          margin-top: 1rem;
          padding: 1.5rem;
          background: rgba(34, 197, 94, 0.05);
          border: 1px solid var(--color-primary);
          border-radius: 8px;
        ">
          ${this.renderFilterPanel()}
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Render filter panel
   */
  renderFilterPanel() {
    return `
      <div style="margin-bottom: 1rem;">
        <h4 style="margin: 0 0 1rem 0; color: var(--color-primary);">Filtros Avançados</h4>
      </div>

      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
      ">
        <!-- Por Tipo -->
        <div>
          <label style="
            display: block;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--color-primary);
            font-size: 0.9rem;
          ">Tipo</label>
          <select id="filter-type" style="
            width: 100%;
            padding: 0.5rem;
            border: 1px solid var(--color-border);
            border-radius: 6px;
            background: var(--color-bg-panel);
            color: var(--color-text-primary);
          ">
            <option value="">Todos</option>
            <option value="variable">📊 Variáveis</option>
            <option value="event">🎪 Eventos</option>
          </select>
        </div>

        <!-- Por Categoria -->
        <div>
          <label style="
            display: block;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--color-primary);
            font-size: 0.9rem;
          ">Categoria</label>
          <select id="filter-category" style="
            width: 100%;
            padding: 0.5rem;
            border: 1px solid var(--color-border);
            border-radius: 6px;
            background: var(--color-bg-panel);
            color: var(--color-text-primary);
          ">
            <option value="">Todas</option>
            <option value="traffic_footfall">🚶 Tráfego</option>
            <option value="weather_climate">🌤️ Clima</option>
            <option value="seasonal_events">🎊 Sazonalidade</option>
            <option value="economic">📊 Econômico</option>
            <option value="competitor">🏪 Competição</option>
            <option value="inventory">📦 Estoque</option>
            <option value="social">📱 Digital</option>
            <option value="operations">⚙️ Operações</option>
          </select>
        </div>

        <!-- Por Impacto -->
        <div>
          <label style="
            display: block;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--color-primary);
            font-size: 0.9rem;
          ">Impacto Mínimo</label>
          <input type="range" id="filter-impact" min="0" max="100" value="0" style="
            width: 100%;
          "/>
          <div style="
            font-size: 0.8rem;
            color: var(--color-text-secondary);
            margin-top: 0.25rem;
          ">
            <span id="impact-value">0</span>%
          </div>
        </div>

        <!-- Período -->
        <div>
          <label style="
            display: block;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--color-primary);
            font-size: 0.9rem;
          ">Período</label>
          <select id="filter-period" style="
            width: 100%;
            padding: 0.5rem;
            border: 1px solid var(--color-border);
            border-radius: 6px;
            background: var(--color-bg-panel);
            color: var(--color-text-primary);
          ">
            <option value="">Qualquer</option>
            <option value="daily">📅 Diário</option>
            <option value="weekly">📊 Semanal</option>
            <option value="monthly">📉 Mensal</option>
            <option value="annual">📊 Anual</option>
          </select>
        </div>

        <!-- Ordenar Por -->
        <div>
          <label style="
            display: block;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--color-primary);
            font-size: 0.9rem;
          ">Ordenar por</label>
          <select id="filter-sort" style="
            width: 100%;
            padding: 0.5rem;
            border: 1px solid var(--color-border);
            border-radius: 6px;
            background: var(--color-bg-panel);
            color: var(--color-text-primary);
          ">
            <option value="relevance">Relevância</option>
            <option value="name">Nome</option>
            <option value="impact">Impacto</option>
            <option value="recent">Recentes</option>
          </select>
        </div>
      </div>

      <div style="
        margin-top: 1.5rem;
        display: flex;
        gap: 0.75rem;
      ">
        <button id="apply-filters-btn" style="
          flex: 1;
          padding: 0.75rem 1.5rem;
          background: var(--color-primary);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        "
        onmouseover="this.style.opacity='0.8'"
        onmouseout="this.style.opacity='1'">
          ✅ Aplicar Filtros
        </button>
        <button id="clear-filters-btn" style="
          padding: 0.75rem 1.5rem;
          background: transparent;
          color: var(--color-primary);
          border: 1px solid var(--color-primary);
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        "
        onmouseover="this.style.background='rgba(34, 197, 94, 0.1)'"
        onmouseout="this.style.background='transparent'">
          🔄 Limpar
        </button>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const searchInput = document.getElementById('search-input');
    const filtersBtn = document.getElementById('search-filters-btn');
    const filterPanel = document.getElementById('filters-panel');
    const applyBtn = document.getElementById('apply-filters-btn');
    const clearBtn = document.getElementById('clear-filters-btn');
    const impactSlider = document.getElementById('filter-impact');
    const impactValue = document.getElementById('impact-value');

    // Search input
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.search(e.target.value);
      }, SEARCH_CONFIG.debounceDelay);
    });

    // Toggle filters panel
    filtersBtn?.addEventListener('click', () => {
      filterPanel.style.display = filterPanel.style.display === 'none' ? 'block' : 'none';
    });

    // Apply filters
    applyBtn?.addEventListener('click', () => {
      this.applyFilters();
    });

    // Clear filters
    clearBtn?.addEventListener('click', () => {
      document.getElementById('filter-type').value = '';
      document.getElementById('filter-category').value = '';
      document.getElementById('filter-period').value = '';
      document.getElementById('filter-sort').value = 'relevance';
      impactSlider.value = 0;
      impactValue.textContent = 0;
      this.applyFilters();
    });

    // Impact slider update
    impactSlider?.addEventListener('input', (e) => {
      impactValue.textContent = e.target.value;
    });

    // Keyboard navigation
    searchInput?.addEventListener('keydown', (e) => {
      const dropdown = document.getElementById('search-results-dropdown');
      const items = dropdown.querySelectorAll('.search-result-item');

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
          this.highlightResult();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
          this.highlightResult();
          break;
        case 'Enter':
          e.preventDefault();
          if (this.selectedIndex >= 0) {
            items[this.selectedIndex].click();
          }
          break;
        case 'Escape':
          dropdown.style.display = 'none';
          break;
      }
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      const searchContainer = document.getElementById(this.containerId);
      if (searchContainer && !searchContainer.contains(e.target)) {
        document.getElementById('search-results-dropdown').style.display = 'none';
      }
    });
  }

  /**
   * Search through index
   */
  search(query) {
    if (query.length < SEARCH_CONFIG.minChars) {
      document.getElementById('search-results-dropdown').style.display = 'none';
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results = this.searchIndex.filter(item =>
      item.searchText.includes(lowerQuery)
    ).slice(0, SEARCH_CONFIG.maxResults);

    this.results = results;
    this.selectedIndex = -1;
    this.renderResults(results, query);
  }

  /**
   * Render search results
   */
  renderResults(results, query) {
    const dropdown = document.getElementById('search-results-dropdown');

    if (results.length === 0) {
      dropdown.innerHTML = `
        <div style="
          padding: 1.5rem;
          text-align: center;
          color: var(--color-text-secondary);
        ">
          <p style="margin: 0;">Nenhum resultado encontrado para "<strong>${query}</strong>"</p>
          <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem;">
            Tente outra busca ou use os filtros avançados
          </p>
        </div>
      `;
    } else {
      let html = '';

      // Group by type
      const grouped = {};
      results.forEach(item => {
        if (!grouped[item.type]) {
          grouped[item.type] = [];
        }
        grouped[item.type].push(item);
      });

      // Render groups
      Object.entries(grouped).forEach(([type, items]) => {
        const typeLabel = type === 'variable' ? '📊 Variáveis' : '🎪 Eventos';

        html += `
          <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--color-border);">
            <div style="
              padding: 0.5rem 1rem;
              font-weight: 600;
              font-size: 0.85rem;
              color: var(--color-primary);
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">
              ${typeLabel}
            </div>
            ${items.map(item => this.renderResultItem(item)).join('')}
          </div>
        `;
      });

      dropdown.innerHTML = html;
    }

    dropdown.style.display = 'block';
  }

  /**
   * Render single result item
   */
  renderResultItem(item) {
    return `
      <div class="search-result-item" style="
        padding: 0.75rem 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
        border-left: 3px solid transparent;
      "
      onmouseover="this.style.background='rgba(34, 197, 94, 0.1)'; this.style.borderLeftColor='var(--color-primary)'"
      onmouseout="this.style.background='transparent'; this.style.borderLeftColor='transparent'"
      onclick="window.searchSystem.selectResult(${JSON.stringify(item).replace(/"/g, '&quot;')})">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.3rem;
        ">
          <div style="font-weight: 600; font-size: 0.95rem;">
            ${item.icon || '📌'} ${item.name}
          </div>
          ${item.type === 'variable' && item.searchText ? `
            <div style="
              font-size: 0.75rem;
              background: rgba(34, 197, 94, 0.2);
              color: var(--color-primary);
              padding: 0.25rem 0.5rem;
              border-radius: 3px;
            ">
              ${item.code}
            </div>
          ` : ''}
        </div>
        <div style="
          font-size: 0.85rem;
          color: var(--color-text-secondary);
        ">
          ${item.type === 'variable' ? `${item.category} • ${item.unit}` : `${item.type} • ${item.date}`}
        </div>
      </div>
    `;
  }

  /**
   * Highlight search result
   */
  highlightResult() {
    const items = document.querySelectorAll('.search-result-item');
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.style.background = 'rgba(34, 197, 94, 0.1)';
        item.style.borderLeftColor = 'var(--color-primary)';
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.style.background = 'transparent';
        item.style.borderLeftColor = 'transparent';
      }
    });
  }

  /**
   * Select search result
   */
  selectResult(item) {
    document.getElementById('search-input').value = item.name;
    document.getElementById('search-results-dropdown').style.display = 'none';

    if (this.onSelectCallback) {
      this.onSelectCallback(item);
    }

    // Show item details
    this.showItemDetails(item);
  }

  /**
   * Show detailed information about selected item
   */
  showItemDetails(item) {
    let html = `
      <div id="search-details" style="
        margin-top: 1.5rem;
        padding: 1.5rem;
        background: var(--color-bg-panel);
        border: 1px solid var(--color-border);
        border-radius: 8px;
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 1.5rem;
        ">
          <h3 style="margin: 0; font-size: 1.3rem;">
            ${item.icon || '📌'} ${item.name}
          </h3>
          <button onclick="document.getElementById('search-details').remove()" style="
            background: transparent;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--color-text-secondary);
          ">✕</button>
        </div>

        ${item.type === 'variable' ? `
          <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
          ">
            <div>
              <div style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 0.3rem;">Código</div>
              <div style="font-weight: 600; font-size: 1rem;">${item.code}</div>
            </div>
            <div>
              <div style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 0.3rem;">Categoria</div>
              <div style="font-weight: 600; font-size: 1rem;">${item.category}</div>
            </div>
            <div>
              <div style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 0.3rem;">Unidade</div>
              <div style="font-weight: 600; font-size: 1rem;">${item.unit}</div>
            </div>
          </div>

          <div style="
            padding: 1rem;
            background: rgba(34, 197, 94, 0.05);
            border-left: 3px solid var(--color-primary);
            border-radius: 4px;
          ">
            <strong>Descrição:</strong> ${item.description}
          </div>
        ` : `
          <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
          ">
            <div>
              <div style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 0.3rem;">Data</div>
              <div style="font-weight: 600; font-size: 1rem;">${new Date(item.date).toLocaleDateString('pt-BR')}</div>
            </div>
            <div>
              <div style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 0.3rem;">Tipo</div>
              <div style="font-weight: 600; font-size: 1rem;">${item.type}</div>
            </div>
            <div>
              <div style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 0.3rem;">Local</div>
              <div style="font-weight: 600; font-size: 1rem;">${item.location}</div>
            </div>
          </div>

          <div style="
            padding: 1rem;
            background: rgba(34, 197, 94, 0.05);
            border-left: 3px solid var(--color-primary);
            border-radius: 4px;
          ">
            <strong>Descrição:</strong> ${item.description}
          </div>
        `}
      </div>
    `;

    let detailsContainer = document.getElementById('search-details');
    if (detailsContainer) {
      detailsContainer.remove();
    }

    const container = document.getElementById(this.containerId);
    container.insertAdjacentHTML('afterend', html);
  }

  /**
   * Apply advanced filters
   */
  applyFilters() {
    const type = document.getElementById('filter-type').value;
    const category = document.getElementById('filter-category').value;
    const impact = parseInt(document.getElementById('filter-impact').value);
    const period = document.getElementById('filter-period').value;
    const sort = document.getElementById('filter-sort').value;

    let filtered = this.searchIndex;

    // Apply type filter
    if (type) {
      filtered = filtered.filter(item => item.type === type);
    }

    // Apply category filter
    if (category) {
      filtered = filtered.filter(item => item.categoryKey === category || item.type === 'event');
    }

    // Apply impact filter
    if (impact > 0) {
      filtered = filtered.filter(item => (item.impactWeight || 0) >= impact / 100);
    }

    // Apply sort
    switch (sort) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'impact':
        filtered.sort((a, b) => (b.impactWeight || 0) - (a.impactWeight || 0));
        break;
      case 'recent':
        filtered.sort((a, b) => (new Date(b.date) || 0) - (new Date(a.date) || 0));
        break;
      // relevance is default
    }

    this.results = filtered;
    this.renderResults(filtered.slice(0, SEARCH_CONFIG.maxResults), '');

    // Show results count
    alert(`Encontrados ${filtered.length} resultados`);
  }
}

// Export for global use
window.SearchSystem = SearchSystem;
