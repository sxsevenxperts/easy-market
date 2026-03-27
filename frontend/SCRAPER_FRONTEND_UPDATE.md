# Frontend Update Guide for Store Flow Variables Dashboard

## Step 1: Add Navigation Link

In `frontend/index.html`, find the navbar section and add this new nav item:

```html
<!-- Add after the "Clima" nav item (around line with data-section="clima") -->
<button class="nav-button" data-section="variaveis-fluxo" onclick="loadSection('variaveis-fluxo')">
  📊 Variáveis IA
</button>
```

**Location**: Look for the horizontal navbar with items like "Dashboard", "Previsão IA", "Estoque", etc.

---

## Step 2: Add Section Container

In `frontend/index.html`, add this section container after other main sections:

```html
<!-- Variables Flow Monitoring Section -->
<div id="section-variaveis-fluxo" class="main-section" style="display: none;">
  <div class="section-header">
    <h1>📊 Monitoramento de Variáveis de Fluxo</h1>
    <button onclick="triggerVariablesCollection()" class="btn-primary" style="margin-left: auto;">
      🔄 Coletar Agora
    </button>
  </div>
  <div id="variaveis-content"></div>
</div>
```

**Location**: Add at the end of the main content area, before the footer.

---

## Step 3: Add Script Import

Add this to the `<head>` or before `</body>` tag in `frontend/index.html`:

```html
<script src="js/scraper-dashboard.js"></script>
```

---

## Step 4: Update App.js

In `frontend/js/app.js`, add this to the `loadSection()` function's switch statement:

```javascript
case 'variaveis-fluxo':
  document.getElementById('section-variaveis-fluxo').style.display = 'block';
  previousSection = lastSection;
  loadVariablesDashboard();
  break;
```

Also add to the section hiding loop:

```javascript
document.getElementById('section-variaveis-fluxo').style.display = 'none';
```

---

## Step 5: Add CSS Styling (Optional)

Add to `frontend/css/style.css` if you want custom styling:

```css
/* Variables Dashboard Styling */
.var-category-toggle {
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
}

.var-category-toggle:hover {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.1) 100%);
}

.spinner {
  border: 4px solid rgba(34, 197, 94, 0.1);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-box {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  border-radius: 8px;
  padding: 1.5rem;
  color: #7f1d1d;
  margin: 1rem 0;
}
```

---

## Step 6: Test the Integration

1. Save all files
2. Refresh the frontend
3. Look for the new "📊 Variáveis IA" button in the navbar
4. Click it to view the dashboard
5. Click "🔄 Coletar Agora" to manually trigger collection

---

## Quick Reference: What Gets Added

### In HTML (navbar):
- 1 new navigation button: "📊 Variáveis IA"

### In HTML (content):
- 1 new section container for the dashboard

### In JavaScript (app.js):
- 1 case statement in `loadSection()` function
- 1 hide statement in the section hiding loop

### In JavaScript (new file):
- `js/scraper-dashboard.js` - Complete dashboard with 50 variables

### In CSS (optional):
- Styling for `.var-category-toggle`, `.spinner`, `.error-box`

---

## Dashboard Features

Once integrated, the dashboard provides:

✅ **50 Variables Displayed** across 8 categories
✅ **Real-time Values** from API or mock data  
✅ **Visual Indicators** with color-coded bars (Red/Yellow/Green)
✅ **Impact Weights** showing variable importance for AI
✅ **Manual Collection** with "Coletar Agora" button
✅ **Auto-refresh** every 60 minutes (when scheduler is running)
✅ **Responsive Design** that works on mobile and desktop
✅ **Fallback Support** with mock data when API is unavailable

---

## Variable Categories Displayed

1. **🚶 Tráfego & Fluxo** (6 vars) - Customer traffic patterns
2. **🌤️ Clima & Meteorologia** (6 vars) - Weather conditions
3. **🎊 Sazonalidade & Eventos** (7 vars) - Seasonal patterns
4. **📊 Indicadores Econômicos** (7 vars) - Macro economic data
5. **🏪 Competição & Mercado** (5 vars) - Market competition
6. **📦 Produtos & Estoque** (7 vars) - Inventory status
7. **📱 Redes Sociais & Digital** (6 vars) - Social media trends
8. **⚙️ Operações & Staff** (4 vars) - Store operations
9. **🌍 Dados Externos** (2 vars) - External factors

---

## API Endpoints Used

The dashboard calls these endpoints:

- `GET /api/v1/scraper/summary/:loja_id` - Get latest variables
- `POST /api/v1/scraper/collect` - Manual collection trigger
- `GET /api/v1/scraper/variables/:loja_id` - Historical data

---

## Notes

- All variables are normalized to 0-100 scale for easy comparison
- Color coding: 0-33 = Red (Bad), 33-66 = Yellow (Neutral), 66-100 = Green (Good)
- Impact weights show which variables are most important for predictions
- Dashboard works offline with mock data
- Scheduler runs in background collecting data every 60 minutes

---

## Next: Integration with Predictive AI

After frontend is integrated:

1. Calculate variable importance via MAPE (accuracy testing)
2. Weight predictions by top 10 most impactful variables
3. Show correlation analysis between variables and sales
4. Create alerts when critical variables exceed thresholds
5. Build "what-if" scenarios adjusting individual variables

Example prediction adjustment:
```javascript
// Base forecast: 1000 units
// WEATHER_TEMPERATURE is 90 (very hot) = -15% customer traffic
// COMPETITOR_PROMOTION is running = -10% sales
// Consumer confidence is high = +5% ticket size

finalForecast = 1000 * (1 - 0.15) * (1 - 0.10) * (1 + 0.05) = 770 units
```
