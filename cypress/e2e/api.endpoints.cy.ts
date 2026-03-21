/// <reference types="cypress" />

// Test data constants
const LOJA_ID = 1;
const CLIENTE_ID = 1;
const PRODUTO_ID = 5;
const API_BASE = 'http://localhost:3000/api/v1';

describe('Easy Market - API E2E Tests (25 Endpoints)', () => {
  
  // ============ PREVISÕES (10 testes) ============
  describe('Previsões - Predictive Analytics', () => {
    
    it('GET /predicoes/analise - Fetch complete predictions analysis', () => {
      cy.request('GET', `${API_BASE}/predicoes/analise?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body).to.have.property('data');
        expect(response.body.data).to.have.property('churn_score');
        expect(response.body.data.churn_score).to.be.within(0, 1);
        expect(response.body.data).to.have.property('brand_analysis');
        expect(response.body.data).to.have.property('purchase_forecast');
        expect(response.body.data).to.have.property('opportunities');
      });
    });

    it('GET /predicoes/churn - Fetch churn prediction score', () => {
      cy.request('GET', `${API_BASE}/predicoes/churn?cliente_id=${CLIENTE_ID}&loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('churn_score');
        expect(response.body.data).to.have.property('risk_level');
        expect(['baixo', 'medio', 'alto']).to.include(response.body.data.risk_level);
        expect(response.body.data).to.have.property('factors');
      });
    });

    it('GET /predicoes/marca - Fetch brand analysis', () => {
      cy.request('GET', `${API_BASE}/predicoes/marca?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.be.an('array');
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).to.have.property('marca');
          expect(response.body.data[0]).to.have.property('preference_score');
          expect(response.body.data[0].preference_score).to.be.within(0, 1);
        }
      });
    });

    it('GET /predicoes/proxima-compra - Fetch next purchase forecast', () => {
      cy.request('GET', `${API_BASE}/predicoes/proxima-compra?cliente_id=${CLIENTE_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('predicted_date');
        expect(response.body.data).to.have.property('confidence');
        expect(response.body.data.confidence).to.be.within(0, 1);
        expect(response.body.data).to.have.property('predicted_items');
      });
    });

    it('GET /predicoes/fidelidade - Fetch customer loyalty score', () => {
      cy.request('GET', `${API_BASE}/predicoes/fidelidade?cliente_id=${CLIENTE_ID}&loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('loyalty_score');
        expect(response.body.data.loyalty_score).to.be.within(0, 1);
        expect(response.body.data).to.have.property('customer_lifetime_value');
      });
    });

    it('GET /predicoes/oportunidades - Fetch sales opportunities', () => {
      cy.request('GET', `${API_BASE}/predicoes/oportunidades?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.be.an('array');
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).to.have.property('tipo');
          expect(response.body.data[0]).to.have.property('potencial');
        }
      });
    });

    it('GET /predicoes/variacoes - Fetch 50 behavioral variations', () => {
      cy.request('GET', `${API_BASE}/predicoes/variacoes?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.be.an('array');
        expect(response.body.data.length).to.be.at.least(50);
        const categories = response.body.data.map(v => v.categoria);
        expect(new Set(categories).size).to.equal(5); // 5 categories
      });
    });

    it('GET /predicoes/assertividade - Fetch assertion metrics', () => {
      cy.request('GET', `${API_BASE}/predicoes/assertividade?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('assertion_score');
        expect(response.body.data.assertion_score).to.be.within(0.9, 0.95);
      });
    });

    it('GET /predicoes/evolucao - Fetch churn evolution over time', () => {
      cy.request('GET', `${API_BASE}/predicoes/evolucao?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.be.an('array');
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).to.have.property('data');
          expect(response.body.data[0]).to.have.property('score');
        }
      });
    });

    it('GET /predicoes/recomendacoes - Fetch personalized recommendations', () => {
      cy.request('GET', `${API_BASE}/predicoes/recomendacoes?cliente_id=${CLIENTE_ID}&loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.be.an('array');
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).to.have.property('produto_id');
          expect(response.body.data[0]).to.have.property('relevancia');
        }
      });
    });
  });

  // ============ PERDAS (7 testes) ============
  describe('Perdas - Product Loss Tracking', () => {
    
    it('GET /perdas/taxa-perda - Fetch loss rate for products', () => {
      cy.request('GET', `${API_BASE}/perdas/taxa-perda?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('taxa_media');
        expect(response.body.data.taxa_media).to.be.within(0, 1);
        expect(response.body.data).to.have.property('produtos');
      });
    });

    it('GET /perdas/reducao - Fetch loss reduction recommendations', () => {
      cy.request('GET', `${API_BASE}/perdas/reducao?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.be.an('array');
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).to.have.property('recomendacao');
          expect(response.body.data[0]).to.have.property('impacto_potencial');
        }
      });
    });

    it('GET /perdas/produtos-alto-risco - Fetch high-loss products', () => {
      cy.request('GET', `${API_BASE}/perdas/produtos-alto-risco?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.be.an('array');
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).to.have.property('produto_id');
          expect(response.body.data[0]).to.have.property('taxa_perda');
          expect(response.body.data[0].taxa_perda).to.be.within(0, 1);
        }
      });
    });

    it('GET /perdas/tendencia - Fetch loss trend analysis', () => {
      cy.request('GET', `${API_BASE}/perdas/tendencia?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('tendencia');
        expect(['ascendente', 'descendente', 'estavel']).to.include(response.body.data.tendencia);
      });
    });

    it('GET /perdas/categoria - Fetch loss breakdown by category', () => {
      cy.request('GET', `${API_BASE}/perdas/categoria?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.be.an('array');
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).to.have.property('categoria');
          expect(response.body.data[0]).to.have.property('taxa_perda_categoria');
        }
      });
    });

    it('GET /perdas/sazonalidade - Fetch seasonal loss patterns', () => {
      cy.request('GET', `${API_BASE}/perdas/sazonalidade?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.be.an('array');
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).to.have.property('periodo');
          expect(response.body.data[0]).to.have.property('taxa_perda_periodo');
        }
      });
    });

    it('GET /perdas/impacto-financeiro - Fetch financial impact analysis', () => {
      cy.request('GET', `${API_BASE}/perdas/impacto-financeiro?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('valor_perdido_mensal');
        expect(response.body.data).to.have.property('valor_perdido_anual');
        expect(response.body.data).to.have.property('oportunidade_receita');
      });
    });
  });

  // ============ GONDOLAS (4 testes) ============
  describe('Gondolas - Shelf Optimization', () => {
    
    it('GET /gondolas/analise - Fetch complete gondola optimization analysis', () => {
      cy.request('GET', `${API_BASE}/gondolas/analise?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('produtos_altos_perdas');
        expect(response.body.data).to.have.property('padroes_vendas');
        expect(response.body.data).to.have.property('categoria_top');
      });
    });

    it('GET /gondolas/recomendacoes - Fetch gondola recommendations (5 types)', () => {
      cy.request('GET', `${API_BASE}/gondolas/recomendacoes?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.be.an('array');
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).to.have.property('tipo');
          const tipos = ['reposicionamento_urgente', 'otimizacao_semanal', 'otimizacao_horaria', 'expansao_categoria', 'reducao_perdas'];
          expect(tipos).to.include(response.body.data[0].tipo);
        }
      });
    });

    it('GET /gondolas/layout - Fetch optimized gondola layout suggestion', () => {
      cy.request('GET', `${API_BASE}/gondolas/layout?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('layout_otimizado');
        expect(response.body.data).to.have.property('posicionamento_produtos');
        expect(response.body.data.posicionamento_produtos).to.be.an('array');
      });
    });

    it('GET /gondolas/completo - Fetch complete gondola optimization data', () => {
      cy.request('GET', `${API_BASE}/gondolas/completo?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('analise');
        expect(response.body.data).to.have.property('recomendacoes');
        expect(response.body.data).to.have.property('layout');
      });
    });
  });

  // ============ COMPRAS (6 testes) ============
  describe('Compras - Purchase Optimization with EOQ', () => {
    
    it('GET /compras/quantidade-otima - Fetch optimal purchase quantity with EOQ', () => {
      cy.request('GET', `${API_BASE}/compras/quantidade-otima?loja_id=${LOJA_ID}&produto_id=${PRODUTO_ID}&gordura=0.15`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('quantidade_otima');
        expect(response.body.data.quantidade_otima).to.be.greaterThan(0);
        expect(response.body.data).to.have.property('taxa_seguranca');
        expect(response.body.data.taxa_seguranca).to.be.within(0.05, 0.30);
      });
    });

    it('GET /compras/analise-loja - Fetch purchase analysis for entire store', () => {
      cy.request('GET', `${API_BASE}/compras/analise-loja?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.be.an('array');
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).to.have.property('produto_id');
          expect(response.body.data[0]).to.have.property('quantidade_otima');
        }
      });
    });

    it('GET /compras/cenarios - Fetch safety stock scenarios (5%-30% gordura)', () => {
      cy.request('GET', `${API_BASE}/compras/cenarios?loja_id=${LOJA_ID}&produto_id=${PRODUTO_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.be.an('array');
        expect(response.body.data.length).to.equal(6); // 5%, 10%, 15%, 20%, 25%, 30%
        response.body.data.forEach((scenario) => {
          expect(scenario).to.have.property('gordura');
          expect(scenario.gordura).to.be.within(0.05, 0.30);
        });
      });
    });

    it('GET /compras/risco-falta - Fetch stockout risk identification', () => {
      cy.request('GET', `${API_BASE}/compras/risco-falta?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.be.an('array');
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).to.have.property('produto_id');
          expect(response.body.data[0]).to.have.property('risco_nivel');
        }
      });
    });

    it('GET /compras/gordura-por-categoria - Fetch safety stock by category', () => {
      cy.request('GET', `${API_BASE}/compras/gordura-por-categoria?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.be.an('array');
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).to.have.property('categoria');
          expect(response.body.data[0]).to.have.property('gordura_recomendada');
        }
      });
    });

    it('GET /compras/impacto-financeiro - Fetch financial impact of optimization', () => {
      cy.request('GET', `${API_BASE}/compras/impacto-financeiro?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('reducao_custo_estoque');
        expect(response.body.data).to.have.property('economia_mensal');
        expect(response.body.data).to.have.property('economia_anual');
      });
    });
  });

  // ============ CONFIGURAÇÃO DE SEGURANÇA (5 testes) ============
  describe('Configuração de Segurança - Security Rate Configuration', () => {
    
    it('GET /configuracao/loja/:id - Fetch store security configuration', () => {
      cy.request('GET', `${API_BASE}/configuracao/loja/${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('taxa_seguranca_padrao');
        expect(response.body.data.taxa_seguranca_padrao).to.be.within(0.05, 0.30);
      });
    });

    it('GET /configuracao/taxa-recomendada - Fetch recommended security rate', () => {
      cy.request('GET', `${API_BASE}/configuracao/taxa-recomendada?loja_id=${LOJA_ID}&politica=${'BALANCEADO'}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('taxa_recomendada');
        expect(response.body.data).to.have.property('politica');
      });
    });

    it('GET /configuracao/taxas-customizadas - Fetch custom rates per product', () => {
      cy.request('GET', `${API_BASE}/configuracao/taxas-customizadas?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.be.an('array');
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).to.have.property('produto_id');
          expect(response.body.data[0]).to.have.property('taxa_seguranca_customizada');
        }
      });
    });

    it('GET /configuracao/politica-risco - Fetch risk policy configuration', () => {
      cy.request('GET', `${API_BASE}/configuracao/politica-risco?loja_id=${LOJA_ID}`).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('politica_ativa');
        expect(['CONSERVADOR', 'BALANCEADO', 'AGRESSIVO']).to.include(response.body.data.politica_ativa);
      });
    });

    it('PUT /configuracao/taxa-padrao - Update store default security rate', () => {
      cy.request('PUT', `${API_BASE}/configuracao/taxa-padrao`, {
        loja_id: LOJA_ID,
        taxa_seguranca: 0.15
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('taxa_seguranca', 0.15);
      });
    });
  });

  // ============ INTEGRATION TESTS ============
  describe('Integration Tests - Full Workflow', () => {
    
    it('Complete workflow: Get churn + recommendations + gondola optimization', () => {
      // Step 1: Get churn prediction
      cy.request('GET', `${API_BASE}/predicoes/churn?cliente_id=${CLIENTE_ID}&loja_id=${LOJA_ID}`).then((churnRes) => {
        expect(churnRes.status).to.equal(200);
        expect(churnRes.body.data).to.have.property('churn_score');

        // Step 2: Get personalized recommendations
        cy.request('GET', `${API_BASE}/predicoes/recomendacoes?cliente_id=${CLIENTE_ID}&loja_id=${LOJA_ID}`).then((recRes) => {
          expect(recRes.status).to.equal(200);
          expect(recRes.body.data).to.be.an('array');

          // Step 3: Get gondola optimization to improve conversion
          cy.request('GET', `${API_BASE}/gondolas/recomendacoes?loja_id=${LOJA_ID}`).then((gondolaRes) => {
            expect(gondolaRes.status).to.equal(200);
            expect(gondolaRes.body.data).to.be.an('array');
          });
        });
      });
    });

    it('Purchase optimization workflow: Analyze + Get scenarios + Check risk', () => {
      // Step 1: Analyze purchases
      cy.request('GET', `${API_BASE}/compras/analise-loja?loja_id=${LOJA_ID}`).then((analysisRes) => {
        expect(analysisRes.status).to.equal(200);

        // Step 2: Get safety stock scenarios
        cy.request('GET', `${API_BASE}/compras/cenarios?loja_id=${LOJA_ID}&produto_id=${PRODUTO_ID}`).then((scenarioRes) => {
          expect(scenarioRes.status).to.equal(200);
          expect(scenarioRes.body.data).to.be.an('array');

          // Step 3: Check stockout risk
          cy.request('GET', `${API_BASE}/compras/risco-falta?loja_id=${LOJA_ID}`).then((riskRes) => {
            expect(riskRes.status).to.equal(200);
            expect(riskRes.body.data).to.be.an('array');
          });
        });
      });
    });

    it('Loss reduction workflow: Analyze + Get high-risk products + Get recommendations', () => {
      // Step 1: Get loss rate analysis
      cy.request('GET', `${API_BASE}/perdas/taxa-perda?loja_id=${LOJA_ID}`).then((lossRes) => {
        expect(lossRes.status).to.equal(200);
        expect(lossRes.body.data).to.have.property('taxa_media');

        // Step 2: Identify high-risk products
        cy.request('GET', `${API_BASE}/perdas/produtos-alto-risco?loja_id=${LOJA_ID}`).then((riskRes) => {
          expect(riskRes.status).to.equal(200);
          expect(riskRes.body.data).to.be.an('array');

          // Step 3: Get reduction recommendations
          cy.request('GET', `${API_BASE}/perdas/reducao?loja_id=${LOJA_ID}`).then((recRes) => {
            expect(recRes.status).to.equal(200);
            expect(recRes.body.data).to.be.an('array');
          });
        });
      });
    });
  });
});
