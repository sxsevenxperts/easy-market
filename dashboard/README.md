# Easy Market Dashboard 📊

Interface web moderna para monitoramento em tempo real, previsões e gestão de inventário.

## 🎯 Features

- **Dashboard Principal**: KPIs, gráficos de vendas, alertas críticos
- **Gestão de Estoque**: Inventário com Sell-In/Sell-Out rates
- **Previsões**: Gráficos de previsão vs vendas reais
- **Alertas**: Sistema de notificações críticas
- **Relatórios**: Análise multi-período
- **PWA**: Instalável como app no celular
- **Responsivo**: Mobile-first design
- **Dark Mode**: Interface otimizada para uso prolongado

## 🛠️ Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State Management**: Zustand
- **HTTP Client**: Axios
- **PWA**: next-pwa

## 📦 Instalação

```bash
cd dashboard
npm install
```

## 🚀 Desenvolvimento

```bash
npm run dev
```

Acesse em `http://localhost:3000`

## 🏗️ Build & Deploy

```bash
npm run build
npm start
```

## 📁 Estrutura

```
dashboard/
├── app/                    # Páginas e layouts (Next.js App Router)
│   ├── page.tsx          # Dashboard principal
│   ├── estoque/          # Página de gestão de estoque
│   ├── previsoes/        # Página de previsões
│   ├── alertas/          # Página de alertas
│   ├── relatorios/       # Página de relatórios
│   ├── layout.tsx        # Layout raiz com Sidebar/Header
│   └── globals.css       # Estilos globais
├── components/           # Componentes reutilizáveis
│   ├── layout/          # Sidebar, Header
│   ├── charts/          # Recharts wrappers
│   ├── DashboardCard.tsx
│   ├── AlertsPanel.tsx
│   ├── InventoryStatus.tsx
│   └── ...
├── hooks/               # React hooks customizados
├── lib/                 # Utilitários
│   └── api.ts          # Cliente HTTP Axios
├── store/              # Zustand stores
│   └── dashboard.ts    # Store global
├── types/              # TypeScript types
└── public/             # Assets estáticos
    ├── manifest.json   # PWA manifest
    └── icons/          # App icons
```

## 🔌 Integração com API

O dashboard conecta com o backend Easy Market:

```
API Base: http://localhost:3000/api/v1
```

### Endpoints Utilizados

```
GET    /dashboard/:loja_id          - Dashboard data
GET    /inventario/:loja_id         - Inventory summary
GET    /inventario/:loja_id/produtos - Product list
GET    /alertas/:loja_id/criticos   - Critical alerts
GET    /relatorios/:loja_id/vendas  - Sales reports
GET    /previsoes/:loja_id/:category - Predictions
```

## 📊 Páginas

### Dashboard (/)
- KPIs: Faturamento, Transações, Itens Vendidos, Ticket Médio
- Gráfico de Vendas (últimos 7 dias)
- Alertas Críticos
- Previsões 24h
- Status de Estoque
- Categorias Mais Vendidas

### Estoque (/estoque)
- Lista completa de produtos com:
  - Estoque atual vs mínimo/máximo
  - **Sell-In Rate** (entrada/dia)
  - **Sell-Out Rate** (saída/dia)
  - Status (Normal, Crítico, Excesso, Sem Estoque)
  - Preço de venda
- Filtros por status e busca por SKU/nome
- Indicadores de rotação

### Previsões (/previsoes)
- Previsão vs Real (24h, 7d, 30d)
- Confiança de previsão
- Análise de acurácia (MAPE, RMSE)
- Modelos utilizados (Prophet, XGBoost, Ensemble)

### Alertas (/alertas)
- Alertas abertos/resolvidos
- Filtro por tipo (Desperdício, Estoque, Preço)
- Filtro por urgência (Alta, Média, Baixa)
- ROI estimado de cada alerta

### Relatórios (/relatorios)
- Vendas: Diário, Semanal, Mensal, 90 dias, 6 meses, 1 ano
- Categoria: Análise específica com trends
- Horários: Picos de venda
- Desperdício: Análise de perdas
- Comparativo: Semana vs semana, Mês vs mês

## 🎨 Design

### Cores
- Primary (Background): #0f172a
- Secondary (Cards): #1e293b
- Accent (Primary CTA): #3b82f6
- Success: #10b981
- Warning: #f59e0b
- Danger: #ef4444
- Info: #06b6d4

### Responsividade
- Mobile: 320px+
- Tablet: 768px+
- Desktop: 1024px+

### Acessibilidade
- ARIA labels em elementos interativos
- Contraste de cores WCAG AA+
- Navegação por teclado
- Suporte a leitores de tela

## 🔐 Autenticação

O dashboard utiliza JWT tokens salvos em localStorage:

```typescript
// Requisição com token
const token = localStorage.getItem('token');
// Enviado automaticamente via interceptor do Axios
```

## 📱 PWA (Progressive Web App)

O dashboard é instalável como app nativo:

1. Clique no ícone de "Instalar" no navegador
2. Ou acesse: Menu > "Instalar Easy Market"
3. Funciona offline com cache de 5 minutos

## 🧪 Testes (Futura Implementação)

```bash
npm run test
npm run test:coverage
```

## 📈 Performance

- **Lighthouse Score**: 90+
- **Core Web Vitals**: Green
- **Cache**: Redis de 30 min para dados estáticos
- **Code Splitting**: Automático por rota

## 🚀 Deployment

### Vercel (Recomendado)

```bash
vercel deploy
```

### Docker

```bash
docker build -t easy-market-dashboard .
docker run -p 3000:3000 easy-market-dashboard
```

### Railway

```bash
railway link
railway deploy
```

## 📝 Variáveis de Ambiente

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_APP_NAME=Easy Market
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
```

## 🐛 Troubleshooting

### "API Connection Error"
- Verificar se backend está rodando em `http://localhost:3000`
- Verificar `NEXT_PUBLIC_API_URL` no `.env.local`

### "Blank Page"
- Limpar cache do navegador
- Restart do servidor: `npm run dev`

### "Charts not showing"
- Recharts requer viewport com altura definida
- Verificar console para erros de React

## 📞 Suporte

Para bugs ou features, abra uma issue no GitHub.

## 📄 Licença

MIT
