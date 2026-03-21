/**
 * Serviço de Otimização Nutricional
 * Integra dados de composição nutricional (% gordura, calorias, proteína, etc)
 * com estratégias de posicionamento e promoção de gôndolas
 * 
 * Objetivos:
 * - Posicionar produtos baseado em perfil nutricional
 * - Identificar oportunidades de cross-sell entre itens complementares
 * - Sugerir posicionamento por público-alvo (health-conscious vs indulgence)
 * - Maximizar receita respeitando tendências de consumo
 */

const { pool } = require('../config/database');

class OtimizacaoNutricional {
  /**
   * Extrai perfil nutricional de todos os produtos da loja
   * com insights de vendas e posicionamento estratégico
   */
  static async extrairPerfilNutricional(lojaId) {
    try {
      const query = `
        SELECT 
          p.id as produto_id,
          p.nome,
          p.categoria,
          p.preco,
          COALESCE(p.percentual_gordura, 0) as percentual_gordura,
          COALESCE(p.percentual_proteina, 0) as percentual_proteina,
          COALESCE(p.percentual_carboidrato, 0) as percentual_carboidrato,
          COALESCE(p.calorias_por_100g, 0) as calorias_por_100g,
          COALESCE(p.sodio_mg_por_100g, 0) as sodio_mg_por_100g,
          COALESCE(p.acucar_por_100g, 0) as acucar_por_100g,
          
          -- Métricas de venda
          COUNT(DISTINCT v.id) as quantidade_vendas,
          COALESCE(SUM(v.quantidade), 0) as total_vendido,
          COALESCE(SUM(v.valor_total), 0) as receita_total,
          
          -- Métricas de perda
          COALESCE(pp.quantidade_perdida, 0) as quantidade_perdida,
          COALESCE(pp.valor_perdido, 0) as valor_perdido,
          
          -- Classificação de perfil nutricional
          CASE 
            WHEN p.percentual_gordura < 5 THEN 'MUITO_BAIXA_GORDURA'
            WHEN p.percentual_gordura < 15 THEN 'BAIXA_GORDURA'
            WHEN p.percentual_gordura < 25 THEN 'GORDURA_MODERADA'
            WHEN p.percentual_gordura < 35 THEN 'ALTA_GORDURA'
            ELSE 'MUITO_ALTA_GORDURA'
          END as categoria_gordura,
          
          CASE 
            WHEN p.percentual_proteina > 20 THEN 'ALTO_PROTEINA'
            WHEN p.percentual_proteina > 10 THEN 'PROTEINA_MODERADA'
            ELSE 'BAIXA_PROTEINA'
          END as categoria_proteina,
          
          CASE 
            WHEN p.calorias_por_100g < 100 THEN 'MUITO_BAIXA_CALORIA'
            WHEN p.calorias_por_100g < 200 THEN 'BAIXA_CALORIA'
            WHEN p.calorias_por_100g < 350 THEN 'CALORIA_MODERADA'
            ELSE 'ALTA_CALORIA'
          END as categoria_caloria
          
        FROM produtos p
        LEFT JOIN vendas v ON p.id = v.produto_id AND v.loja_id = $1
          AND v.data_venda >= NOW() - INTERVAL '30 days'
        LEFT JOIN perdas_produtos pp ON p.id = pp.produto_id AND pp.loja_id = $1
          AND pp.data_registro >= NOW() - INTERVAL '30 days'
        WHERE p.loja_id = $1
        GROUP BY p.id, p.nome, p.categoria, p.preco, p.percentual_gordura,
                 p.percentual_proteina, p.percentual_carboidrato, p.calorias_por_100g,
                 p.sodio_mg_por_100g, p.acucar_por_100g, pp.quantidade_perdida, pp.valor_perdido
        ORDER BY receita_total DESC
      `;

      const result = await pool.query(query, [lojaId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Erro ao extrair perfil nutricional: ${error.message}`);
    }
  }

  /**
   * Classifica produtos por perfil de consumidor e tendência de mercado
   * Identifica: Health-Conscious, Indulgence, Balanced, Kids/Family, Senior
   */
  static async classificarPorPerfilConsumidor(lojaId) {
    try {
      const produtos = await this.extrairPerfilNutricional(lojaId);

      const perfilConsumidor = {
        healthConscious: [],
        indulgence: [],
        balanced: [],
        kidsFamily: [],
        senior: [],
        organic: [],
        lowSodium: [],
        noSugar: []
      };

      produtos.forEach(p => {
        // Health-Conscious: baixa gordura + alta proteína
        if (p.percentual_gordura < 15 && p.percentual_proteina > 15) {
          perfilConsumidor.healthConscious.push({
            produto_id: p.produto_id,
            nome: p.nome,
            categoria: p.categoria,
            gordura: p.percentual_gordura,
            proteina: p.percentual_proteina,
            calorias: p.calorias_por_100g,
            score_saude: (p.percentual_proteina * 2 - p.percentual_gordura) / 3
          });
        }

        // Indulgence: alta gordura + alta caloria (prazer)
        if (p.percentual_gordura > 25 && p.calorias_por_100g > 300) {
          perfilConsumidor.indulgence.push({
            produto_id: p.produto_id,
            nome: p.nome,
            categoria: p.categoria,
            gordura: p.percentual_gordura,
            calorias: p.calorias_por_100g,
            score_indulgencia: (p.percentual_gordura + (p.calorias_por_100g / 400)) / 2
          });
        }

        // Balanced: perfil equilibrado
        if (p.percentual_gordura >= 15 && p.percentual_gordura <= 25 &&
            p.percentual_proteina >= 10 && p.percentual_proteina <= 20) {
          perfilConsumidor.balanced.push({
            produto_id: p.produto_id,
            nome: p.nome,
            categoria: p.categoria,
            gordura: p.percentual_gordura,
            proteina: p.percentual_proteina,
            carboidrato: p.percentual_carboidrato
          });
        }

        // Low Sodium: importante para hipertensos
        if (p.sodio_mg_por_100g < 200) {
          perfilConsumidor.lowSodium.push({
            produto_id: p.produto_id,
            nome: p.nome,
            sodio: p.sodio_mg_por_100g
          });
        }

        // No Sugar: importante para diabéticos
        if (p.acucar_por_100g < 5) {
          perfilConsumidor.noSugar.push({
            produto_id: p.produto_id,
            nome: p.nome,
            acucar: p.acucar_por_100g
          });
        }
      });

      return perfilConsumidor;
    } catch (error) {
      throw new Error(`Erro ao classificar por perfil consumidor: ${error.message}`);
    }
  }

  /**
   * Gera matriz de complementaridade nutricional
   * Identifica produtos que se complementam nutricionalmente
   * Ex: produto com alta gordura + produto com baixa gordura = combo saudável
   */
  static async gerarMatrizComplementaridade(lojaId) {
    try {
      const produtos = await this.extrairPerfilNutricional(lojaId);
      const complementaridade = [];

      // Analisar complementaridade entre produtos
      for (let i = 0; i < produtos.length; i++) {
        for (let j = i + 1; j < produtos.length; j++) {
          const p1 = produtos[i];
          const p2 = produtos[j];

          // Mesma categoria não faz cross-sell
          if (p1.categoria === p2.categoria) continue;

          // Score de complementaridade
          let score = 0;
          let razao = [];

          // Complementaridade por gordura (ex: produto gorduroso + baixo gordura)
          const difGordura = Math.abs(p1.percentual_gordura - p2.percentual_gordura);
          if (difGordura > 20) {
            score += 30;
            razao.push(`Gordura oposta: ${p1.percentual_gordura}% vs ${p2.percentual_gordura}%`);
          }

          // Complementaridade por proteína
          if ((p1.percentual_proteina > 15 && p2.percentual_proteina < 10) ||
              (p1.percentual_proteina < 10 && p2.percentual_proteina > 15)) {
            score += 25;
            razao.push(`Proteína complementar: ${p1.percentual_proteina}% vs ${p2.percentual_proteina}%`);
          }

          // Complementaridade por sódio (ex: alimento salgado + sem sal)
          const difSodio = Math.abs(p1.sodio_mg_por_100g - p2.sodio_mg_por_100g);
          if (difSodio > 300) {
            score += 20;
            razao.push(`Sódio oposto: ${p1.sodio_mg_por_100g}mg vs ${p2.sodio_mg_por_100g}mg`);
          }

          // Refeição balanceada (receita sugerida)
          if (p1.categoria === 'Proteína' && p2.categoria === 'Vegetais') {
            score += 25;
            razao.push('Combinação de refeição balanceada (proteína + vegetal)');
          }

          if (score > 40) {
            complementaridade.push({
              produto_1: {
                id: p1.produto_id,
                nome: p1.nome,
                categoria: p1.categoria,
                gordura: p1.percentual_gordura,
                receita: p1.receita_total
              },
              produto_2: {
                id: p2.produto_id,
                nome: p2.nome,
                categoria: p2.categoria,
                gordura: p2.percentual_gordura,
                receita: p2.receita_total
              },
              score_complementaridade: score,
              razoes: razao,
              estrategia: score > 60 ? 'COMBO_PREMIUM' : 'CROSS_SELL_FREQUENTE'
            });
          }
        }
      }

      return complementaridade.sort((a, b) => b.score_complementaridade - a.score_complementaridade);
    } catch (error) {
      throw new Error(`Erro ao gerar matriz de complementaridade: ${error.message}`);
    }
  }

  /**
   * Calcula posicionamento estratégico baseado em:
   * - Perfil nutricional
   * - Tendências de consumo
   * - Impacto no ticket médio
   * - Oportunidades de cross-sell
   */
  static async calcularPosicionamentoNutricional(lojaId) {
    try {
      const [produtos, perfilConsumidor, complementaridade] = await Promise.all([
        this.extrairPerfilNutricional(lojaId),
        this.classificarPorPerfilConsumidor(lojaId),
        this.gerarMatrizComplementaridade(lojaId)
      ]);

      const posicionamento = {
        secoes_por_perfil: {
          entrada_health_conscious: {
            localizacao: 'Lado direito entrada (visibilidade máxima)',
            produtos: perfilConsumidor.healthConscious.slice(0, 5),
            objetivo: 'Atrair consumidor consciente na entrada',
            impacto_esperado: 'Aumentar ticket em 8-12%',
            sinaliz acao: 'Bandeira SAUDÁVEL ou ECO'
          },
          
          entrada_indulgence: {
            localizacao: 'Lado esquerdo entrada (visibilidade máxima)',
            produtos: perfilConsumidor.indulgence.slice(0, 5),
            objetivo: 'Venda por impulso (prazer)',
            impacto_esperado: 'Aumentar impulse buys em 15-20%',
            sinalização: 'Bandeira Premium ou INDULGÊNCIA'
          },

          corredor_central_balanced: {
            localizacao: 'Corredor principal',
            produtos: perfilConsumidor.balanced,
            objetivo: 'Produtos mainstream para maioria consumidores',
            impacto_esperado: 'Aumentar volume',
            sinalização: 'Bandeira EQUILÍBRIO'
          },

          secao_senior: {
            localizacao: 'Altura facilmente acessível (1.2m a 1.6m)',
            produtos: perfilConsumidor.lowSodium,
            objetivo: 'Fácil acesso, produtos com baixo sódio',
            impacto_esperado: 'Fidelizar seniors',
            sinalização: 'Símbolos de facilidade + saúde'
          },

          secao_diabeticos: {
            localizacao: 'Próximo a bebidas e doces',
            produtos: perfilConsumidor.noSugar,
            objetivo: 'Opções sem açúcar',
            impacto_esperado: 'Captar público com restrição',
            sinalização: 'Bandeira SEM AÇÚCAR'
          }
        },

        combos_recomendados: complementaridade.filter(c => c.score_complementaridade > 60).slice(0, 10),

        estrategia_por_percentual_gordura: {
          muito_baixa_gordura: {
            localizacao: 'Prateleira dos olhos',
            motivo: 'Consumidores health-conscious buscam ativamente',
            markup_recomendado: '+15%',
            visibilidade: 'Alta'
          },
          baixa_gordura: {
            localizacao: 'Altura natural (entre olhos e cintura)',
            motivo: 'Gama mais vendida',
            markup_recomendado: '+10%',
            visibilidade: 'Alta'
          },
          gordura_moderada: {
            localizacao: 'Prateleira abaixo dos olhos',
            motivo: 'Mais fácil verificar se procurando',
            markup_recomendado: '+5%',
            visibilidade: 'Média'
          },
          alta_gordura: {
            localizacao: 'Prateleira baixa ou alto (menos alcance)',
            motivo: 'Impulse/curiosidade, não busca ativa',
            markup_recomendado: '+20%',
            visibilidade: 'Baixa (estratégia = menor venda, maior margem)'
          },
          muito_alta_gordura: {
            localizacao: 'Pré-checkout ou end-cap promo',
            motivo: 'Venda por impulso/hedge',
            markup_recomendado: '+25%',
            visibilidade: 'Very High (impulse)',
            estrategia: 'Promover apenas em promoções selecionadas'
          }
        },

        oportunidades_cross_sell: complementaridade.slice(0, 15).map(combo => ({
          combo: `${combo.produto_1.nome} + ${combo.produto_2.nome}`,
          posicionamento: `Alinhar na mesma seção / end-cap`,
          impacto_ticket: `+${Math.round((combo.score_complementaridade / 100) * 15)}%`,
          razoes_nuticionais: combo.razoes
        }))
      };

      return posicionamento;
    } catch (error) {
      throw new Error(`Erro ao calcular posicionamento nutricional: ${error.message}`);
    }
  }

  /**
   * Recomendações de ajuste de preço baseado em:
   * - Perfil nutricional
   * - Tendência de consumo (saúde vs indulgência)
   * - Elasticidade de preço por tipo nutricional
   */
  static async recomendarAjustesPrecoPorNutricao(lojaId) {
    try {
      const produtos = await this.extrairPerfilNutricional(lojaId);

      const recomendacoes = {
        aumentar_preco: [],
        reduzir_preco: [],
        promover: []
      };

      produtos.forEach(p => {
        // Health-conscious produtos podem suportar premium price
        if (p.percentual_gordura < 10 && p.percentual_proteina > 20) {
          recomendacoes.aumentar_preco.push({
            produto: p.nome,
            preco_atual: p.preco,
            preco_sugerido: (p.preco * 1.12).toFixed(2),
            justificativa: 'Premium health product - elasticidade preço baixa',
            impacto_estimado: '+8-12% margem'
          });
        }

        // Produtos muito altos em gordura com baixa venda
        if (p.percentual_gordura > 35 && p.total_vendido < 50) {
          recomendacoes.reduzir_preco.push({
            produto: p.nome,
            preco_atual: p.preco,
            preco_sugerido: (p.preco * 0.90).toFixed(2),
            justificativa: 'Promover movimento de estoque',
            impacto_estimado: '+40-50% volume'
          });
        }

        // Balanced products - promover em combo
        if (p.percentual_gordura >= 15 && p.percentual_gordura <= 25) {
          recomendacoes.promover.push({
            produto: p.nome,
            estrategia: 'Combo com health product (ex: -10% no combo)',
            impacto_ticket: '+15-20%'
          });
        }
      });

      return recomendacoes;
    } catch (error) {
      throw new Error(`Erro ao recomendar ajustes de preço: ${error.message}`);
    }
  }

  /**
   * Relatório completo de otimização nutricional
   * Consolida: perfil nutricional + complementaridade + posicionamento + preço
   */
  static async gerarRelatoriCompleto(lojaId) {
    try {
      const [
        perfilNutricional,
        perfilConsumidor,
        complementaridade,
        posicionamento,
        ajustesPreco
      ] = await Promise.all([
        this.extrairPerfilNutricional(lojaId),
        this.classificarPorPerfilConsumidor(lojaId),
        this.gerarMatrizComplementaridade(lojaId),
        this.calcularPosicionamentoNutricional(lojaId),
        this.recomendarAjustesPrecoPorNutricao(lojaId)
      ]);

      return {
        timestamp: new Date().toISOString(),
        lojaId,
        perfilNutricional: {
          total_produtos: perfilNutricional.length,
          categorias_gordura: {
            muito_baixa: perfilNutricional.filter(p => p.percentual_gordura < 5).length,
            baixa: perfilNutricional.filter(p => p.percentual_gordura >= 5 && p.percentual_gordura < 15).length,
            moderada: perfilNutricional.filter(p => p.percentual_gordura >= 15 && p.percentual_gordura < 25).length,
            alta: perfilNutricional.filter(p => p.percentual_gordura >= 25 && p.percentual_gordura < 35).length,
            muito_alta: perfilNutricional.filter(p => p.percentual_gordura >= 35).length
          }
        },
        perfilConsumidor,
        complementaridade: complementaridade.slice(0, 10),
        posicionamento,
        ajustesPreco,
        metricas_impacto: {
          receita_potencial_aumento: '+12-18%',
          ticket_medio_aumento: '+8-12%',
          volume_venda_aumento: '+5-8%',
          margem_aumento: '+10-15%'
        }
      };
    } catch (error) {
      throw new Error(`Erro ao gerar relatório completo: ${error.message}`);
    }
  }
}

module.exports = OtimizacaoNutricional;
