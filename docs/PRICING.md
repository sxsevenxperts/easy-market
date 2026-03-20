# Easy Market — Estratégia de Precificação

## Análise de Mercado

### Problema do Cliente
- Supermercados perdem **3-8% do faturamento em desperdício** (perecíveis)
- Uma loja de **R$500k/mês** perde entre **R$15k a R$40k/mês**
- Falta de visibilidade em demanda → estoque mal dimensionado
- Folha de pagamento não otimizada (funcionários em horários ociosos)

### Oportunidade de Economia
| Métrica | Baixo | Médio | Alto |
|---|---|---|---|
| Redução de desperdício | 15% | 25% | 40% |
| Economia mensal (R$500k faturamento) | R$2.250 | R$3.750 | R$6.000 |
| Otimização de escala | R$1.000 | R$2.000 | R$3.000 |
| **Economia Total/Mês** | **R$3.250** | **R$5.750** | **R$9.000** |

---

## Modelo de Precificação

### Tier 1: Startup (R$497/mês)

**Para:** Pequenos supermercados ou lojas-pilotos

**Inclui:**
- 1 loja
- até 3 usuários
- Integração básica PDV (1 marca)
- Dashboard essencial
  - Matriz de calor (hora × dia)
  - Previsão de demanda (24h)
  - Alertas de vencimento
- Suporte via e-mail (resposta em 48h)
- Dados guardados por 30 dias
- **Payback:** ~7 dias (economia mínima R$3.250/mês)

**Ideal para:**
- Teste de conceito
- Supermercados < R$200k/mês de faturamento

---

### Tier 2: Growth (R$997/mês)

**Para:** Redes pequenas e médias

**Inclui:**
- até 3 lojas
- até 10 usuários
- Integração PDV (3 marcas: Linx, Totvs, Nex)
- Integração balança (Toledo, Filizola)
- Dashboard avançado
  - Comparativo entre lojas (benchmark)
  - Relatórios semanais automáticos (PDF)
  - Análise de margens por categoria
  - Previsão com fatores externos (clima, feriados)
- API para integrações customizadas
- Suporte via e-mail + Whatsapp (resposta em 24h)
- Dados guardados por 90 dias
- **Payback:** ~4 dias (economia média R$5.750/mês)

**Ideal para:**
- Redes com 2-3 lojas
- Supermercados R$200k-R$1M/mês de faturamento

---

### Tier 3: Pro (R$1.997/mês)

**Para:** Redes grandes e ambições de escala

**Inclui:**
- Lojas ilimitadas
- Usuários ilimitados
- Integração PDV customizada (todas as marcas via API)
- Integração balança customizada
- Dashboard premium
  - Análise preditiva (Prophet ML com confidence interval)
  - Sugestões automáticas de promoção (desconto recomendado)
  - Clustering de clientes (segmentação por comportamento)
  - ROI tracking (quanto economizou em desperdício)
  - White-label branding
- SLA de 99.5% uptime
- Suporte dedicado (Slack + call mensal)
- Dados guardados por 2 anos (histórico completo)
- Webhooks para automações
- Export de dados em formato aberto
- **Payback:** ~1 dia (economia alta R$9.000/mês)

**Ideal para:**
- Redes com 5+ lojas
- Operações complexas
- Supermercados R$1M+/mês de faturamento

---

## Modelo Financeiro

### Unit Economics (por loja/mês)

| Métrica | Startup | Growth | Pro |
|---|---|---|---|
| Receita bruta | R$497 | R$997 | R$1.997 |
| Custo de infra | -R$35 | -R$35 | -R$50 |
| Custo de processamento ML | -R$15 | -R$25 | -R$50 |
| Custo de suporte | -R$20 | -R$40 | -R$200 |
| **Margem bruta** | **R$427** | **R$897** | **R$1.697** |
| **Margem %** | **86%** | **90%** | **85%** |

### Projeção de Receita (Ano 1)

**Cenário 1: Conservador (30 clientes/mês)**

| Mês | Clientes | MRR | Churn | ARR |
|---|---|---|---|---|
| Mês 1 | 5 | R$2.485 | 0% | R$29.820 |
| Mês 3 | 15 | R$7.455 | 5% | R$89.460 |
| Mês 6 | 30 | R$14.910 | 10% | R$178.920 |
| Mês 12 | 45 | R$22.365 | 15% | R$268.380 |

**Cenário 2: Otimista (50 clientes/mês)**

| Mês | Clientes | MRR | Churn | ARR |
|---|---|---|---|---|
| Mês 1 | 8 | R$3.976 | 0% | R$47.712 |
| Mês 3 | 25 | R$12.425 | 5% | R$149.100 |
| Mês 6 | 50 | R$24.850 | 8% | R$298.200 |
| Mês 12 | 80 | R$39.760 | 12% | R$477.120 |

---

## Estratégia de Go-to-Market

### Phase 1: Acquisition (Mês 1-3)

**Canais:**
1. **Direct Sales** (Sérgio)
   - Abordagem: ROI garantido (35 dias de economia = custo anual de software)
   - Alvo: Donos/gerentes de supermercados no Nordeste
   - Meta: 5 clientes pilot (Tier 1)

2. **Content Marketing**
   - Blog: "Como reduzir desperdício de perecíveis em 30%"
   - LinkedIn posts (dados de desperdício na indústria)
   - Calculadora de ROI online

3. **Partnerships**
   - Distribuidores de balança (Toledo, Filizola)
   - Fornecedores de software PDV (Linx, Totvs)
   - Associações de supermercados (ABRAS)

### Phase 2: Growth (Mês 4-9)

**Métricas-alvo:**
- CAC (Customer Acquisition Cost): < R$1.000
- LTV (Lifetime Value): > R$15.000 (30+ meses)
- LTV/CAC Ratio: > 15x

**Tácticas:**
- Case studies de clientes com ROI documentado
- Referral program: +10% desconto para indicações
- Workshops gratuitos para supermercados (webinar)
- Demo grátis por 7 dias (Tier 1)

### Phase 3: Scale (Mês 10-12)

**Objetivos:**
- 45+ clientes ativos
- Churn < 12%/mês
- NPS > 50

---

## Desconto e Promoções

### Early Adopter Program (Mês 1-3)

```
Tier 1 (Startup):  -30% → R$348/mês
Tier 2 (Growth):   -25% → R$747/mês
Tier 3 (Pro):      -20% → R$1.598/mês

Condição: contrato anual com cláusula de case study
```

### Volume Discount (Redes)

```
Por 5 lojas: -10%
Por 10 lojas: -15%
Por 20+ lojas: -20% + SLA custom

Exemplo:
  5 lojas em Tier 2 = R$997 × 5 × 0.9 = R$4.485/mês
```

### Seasonal Promo

```
Janeiro-Fevereiro (pós-feriado):
  "Reduza desperdício em 2026"
  -15% para contratos de 12 meses

Agosto-Setembro (back-to-school + preparação para Natal):
  -10% para upgrade Tier 1 → Tier 2
```

---

## Modelo de Churn & Retention

### Churn Esperado (%) por Período
| Mês | Startup | Growth | Pro |
|---|---|---|---|
| Mês 1 | 0% | 0% | 0% |
| Mês 3 | 10% | 5% | 2% |
| Mês 6 | 20% | 10% | 5% |
| Mês 12 | 25% | 15% | 8% |

**Motivos principais:**
1. Falta de integração correta com PDV (40%)
2. Economia não tão visível nos primeiros 30 dias (30%)
3. Mudança de gerenciamento/dono (20%)
4. Migração para concorrente (10%)

### Estratégia de Retention

1. **Onboarding (Primeiros 7 dias)**
   - Calibração de dados
   - Treinamento do gerente
   - Check-in em 72h

2. **Value Realization (Dia 8-30)**
   - Relatório de economia estimada
   - Otimizações iniciais recomendadas
   - Suporte ativo

3. **Engagement (Mês 2-3)**
   - Relatório mensal de ROI
   - Webinar de best practices
   - Sugestões de aumento de escala (upgrade)

4. **Upsell Opportunity (Mês 6)**
   - Análise de performance
   - Proposta de upgrade (Tier 1 → Tier 2)
   - Adicionar mais lojas (volume discount)

---

## Comparação com Concorrentes

| Feature | Easy Market | Concorrente A | Concorrente B |
|---|---|---|---|
| Preço base | R$497 | R$1.200 | R$299 |
| Lojas (Tier 1) | 1 | 1 | 1 |
| Previsão de demanda | ✅ | ✅ | ❌ |
| Alertas perecíveis | ✅ | ❌ | ✅ |
| Integração PDV | ✅ | ✅ | ❌ |
| Integração balança | ✅ | ❌ | ✅ |
| Clima/eventos | ✅ | ❌ | ❌ |
| **ROI/mês** | **R$3k-9k** | **R$2k-5k** | **R$1k-3k** |
| **Payback** | **7 dias** | **30 dias** | **60+ dias** |

**Posicionamento:** Easy Market = ROI mais rápido, integração mais completa, suporte dedicado

---

## Revenue Waterfall (Ano 1)

```
Receita Bruta:       R$268.380
Churn & Refunds:    -R$40.260 (15%)
Receita Líquida:    R$228.120

Custos Fixos:
  - Infraestrutura:  -R$18.000
  - Desenvolvimento:  -R$60.000
  - Suporte:         -R$30.000
  - Marketing:       -R$20.000
  ──────────────────────────
  Total COGS:       -R$128.000

Margem Operacional: R$100.120 (44%)
```

---

## Próximos Passos

1. ✅ Validar preços com 5 clientes-alvo (entrevistas)
2. ⏳ Criar landing page com calculadora de ROI
3. ⏳ Preparar pitch para early adopters
4. ⏳ Definir política de refund (30 dias money-back guarantee)
5. ⏳ Integrar sistema de pagamento (Stripe)

---

**Revisão de Precificação:** A cada trimestre com base em:
- CAC real
- Churn rate
- Feedback de clientes
- Evolução de custos
