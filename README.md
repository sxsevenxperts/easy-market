# Easy Market 🛒

**Retail Intelligence & Demand Forecasting for Small/Medium Supermarkets**

Transforme dados de vendas em decisões acionáveis. Reduza desperdício de perecíveis, otimize escalas de funcionários e antecipe demanda com IA.

## 🎯 O Problema

- Supermercados perdem **3-8% do faturamento** em desperdício de perecíveis
- Falta de visibilidade em picos de demanda por hora/dia/semana
- Escala de funcionários baseada em "achismo", não em dados
- Sem correção com fatores externos (clima, feriados, eventos)

## ✨ A Solução

Easy Market integra-se a seu PDV e balanças para:

1. **Monitorar vendas granulares** — por minuto, produto, categoria
2. **Prever demanda** — com base em histórico + clima + calendário + eventos esportivos
3. **Alertar antes que perca dinheiro** — vencimento + velocidade de saída = sugestão de promoção
4. **Otimizar escalas** — prevê picos, ajuda no dimensionamento de equipes

## 🚀 Stack Tecnológica

### Backend
- **Node.js + Fastify** — API de alta performance
- **TimescaleDB** — banco de séries temporais
- **Redis Streams** — fila de eventos
- **Python + Prophet** — motor de previsão de demanda

### Frontend
- **Next.js PWA** — mobile-first, offline-first
- **TailwindCSS** — UI responsiva

### Local (Loja)
- **Python + SQLite** — agente coletor roda em Raspberry Pi (~R$300)

### Integrações
- **PDVs**: Linx, Totvs, Nex
- **Balanças**: Toledo, Filizola
- **APIs externas**: Open-Meteo (clima), IBGE (feriados), API-Football (eventos esportivos)

## 📊 ROI

Para uma loja que fatura **R$500k/mês**:
- Desperdício típico: **R$15k-R$40k/mês**
- Redução alvo: **30%**
- **Economia**: **R$4.5k-R$12k/mês**
- **Payback**: < 2 meses ✅

## 📁 Estrutura do Projeto

```
easy-market/
├── backend/              # API Node.js + Fastify
│   ├── src/
│   │   ├── api/
│   │   ├── workers/
│   │   ├── database/
│   │   └── config/
│   └── package.json
├── frontend/             # Next.js PWA
│   ├── app/
│   ├── components/
│   └── package.json
├── local-agent/          # Coletor Python (roda na loja)
│   ├── collector.py
│   ├── offline_queue.py
│   └── requirements.txt
├── ml-engine/            # Motor de previsão (Python)
│   ├── predictor.py
│   ├── train.py
│   └── requirements.txt
├── migrations/           # SQL TimescaleDB
└── docs/
    ├── API.md
    ├── ARCHITECTURE.md
    └── DEPLOYMENT.md
```

## 🛠️ Quick Start

### MVP (3 meses)

**Sprint 1-2:** Integração com PDV + TimescaleDB  
**Sprint 3-4:** Dashboard + Motor de previsão básico  
**Sprint 5-6:** Alertas + Módulo desperdício zero  

## 💰 Modelo de Preços (Sugestão)

| Plano | Preço | Usuários | Lojas |
|---|---|---|---|
| **Starter** | R$497/mês | 3 | 1 |
| **Grow** | R$997/mês | 10 | 3 |
| **Pro** | R$1.997/mês | Ilimitado | Ilimitado |

## 📚 Documentação

- [Arquitetura de Dados](./docs/ARCHITECTURE.md) — fluxo completo
- [API Reference](./docs/API.md) — endpoints
- [Guia de Deployment](./docs/DEPLOYMENT.md) — produção

## 🤝 Contribuições

Este é um projeto em fase inicial. Contribuições são bem-vindas!

## 📄 Licença

MIT

---

**Foco inicial:** Nordeste brasileiro | **MVP:** Q2 2026
