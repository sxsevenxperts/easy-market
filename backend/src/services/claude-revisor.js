const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../config/logger');

/**
 * CLAUDE COMO REVISOR DE PREDIÇÕES
 *
 * A IA local (Prophet + XGBoost) faz a predição matemática
 * Claude revisa e adiciona contexto humano/inteligente
 * Ensemble combina as duas para melhor assertividade
 */

class ClaudeRevisor {
  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.warn('⚠️  ANTHROPIC_API_KEY não configurada - Claude desativado');
      this.enabled = false;
      return;
    }

    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    this.enabled = true;
    logger.info('✅ Claude Revisor inicializado');
  }

  /**
   * Revisar uma predição com Claude
   */
  async revisar(predicao, contexto) {
    if (!this.enabled) {
      return this.resposta_padrao(predicao);
    }

    try {
      logger.info(`🤖 [Claude] Revisando: ${contexto.produto_nome}`);

      const prompt = `Você é um especialista em varejo e demanda de supermercados brasileiros.

🏪 DADOS DA PREDIÇÃO LOCAL:
- Produto: ${contexto.produto_nome}
- Categoria: ${contexto.categoria}
- Estoque atual: ${contexto.quantidade_estoque} unidades
- Predição IA Local: ${predicao.quantidade_prevista} unidades
- Confiança IA: ${predicao.confianca.toFixed(1)}%
- Intervalo: ${predicao.intervalo_min}-${predicao.intervalo_max}

📅 CONTEXTO DO DIA:
- Data: ${contexto.data}
- Dia: ${contexto.dia_semana}
- Temperatura: ${contexto.temperatura}°C
- Chuva: ${contexto.chuva ? '🌧️ Sim' : '☀️ Não'}
- Feriado: ${contexto.eh_feriado ? 'Sim' : 'Não'}
- Pós-salário: ${contexto.eh_poscalario ? 'Sim' : 'Não'}
- Promoção: ${contexto.promocao_ativa || 'Nenhuma'}

📊 HISTÓRICO:
- Vendas semana passada: ${contexto.vendas_semana_passada} un/dia
- Mesmo dia ano passado: ${contexto.padrão_anual || 'N/A'}

Sua tarefa:
1. A predição de ${predicao.quantidade_prevista} un faz sentido contextual?
2. Que ajuste você faria (se houver)?
3. Sua confiança (0-100%)?
4. Quais riscos você identifica?
5. Quais oportunidades?

Responda APENAS em JSON válido (sem markdown):
{
  "valida": true,
  "analise_resumida": "máx 100 caracteres",
  "ajuste_recomendado": 450,
  "confianca_claude": 95,
  "risco_falta": true,
  "risco_desperdicio": false,
  "alertas": ["Alerta 1", "Alerta 2"],
  "oportunidades": ["Oportunidade 1"],
  "recomendacoes": ["Rec 1", "Rec 2"]
}`;

      const message = await client.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 800,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      });

      const resposta_texto = message.content[0].text;

      // Extrair JSON
      const json_match = resposta_texto.match(/\{[\s\S]*\}/);
      if (!json_match) {
        logger.warn('[Claude] Resposta não contém JSON válido');
        return this.resposta_padrao(predicao);
      }

      const analise = JSON.parse(json_match[0]);

      logger.info(`✅ [Claude] Análise: ${analise.analise_resumida}`);
      logger.info(`   Confiança: ${analise.confianca_claude}% | Ajuste: ${analise.ajuste_recomendado}`);

      return analise;

    } catch (err) {
      logger.error('❌ [Claude] Erro:', err.message);
      return this.resposta_padrao(predicao);
    }
  }

  /**
   * Resposta padrão se Claude falhar
   */
  resposta_padrao(predicao) {
    return {
      valida: true,
      analise_resumida: "Predição dentro do intervalo esperado",
      ajuste_recomendado: predicao.quantidade_prevista,
      confianca_claude: predicao.confianca,
      risco_falta: false,
      risco_desperdicio: false,
      alertas: [],
      oportunidades: [],
      recomendacoes: [],
      fonte: "fallback"
    };
  }

  /**
   * ENSEMBLE: Combinar predição local + Claude
   * Resultado final = Média ponderada
   */
  fazer_ensemble(predicao_local, analise_claude) {

    const diferenca = Math.abs(
      analise_claude.ajuste_recomendado - predicao_local.quantidade_prevista
    );
    const percent_diferenca = (diferenca / predicao_local.quantidade_prevista) * 100;

    // Confiança final = Média ponderada
    // Claude tem 60% de peso (mais contextual)
    // IA Local tem 40% de peso (mais precisa matematicamente)
    const confianca_final = (
      (predicao_local.confianca * 0.4) +
      (analise_claude.confianca_claude * 0.6)
    );

    // Quantidade final
    let quantidade_final = predicao_local.quantidade_prevista;

    // Se discordância > 5%, fazer média ponderada
    if (percent_diferenca > 5) {
      quantidade_final = Math.round(
        (predicao_local.quantidade_prevista * 0.4) +
        (analise_claude.ajuste_recomendado * 0.6)
      );

      logger.info(`⚖️  [Ensemble] Discordância: ${percent_diferenca.toFixed(1)}%`);
      logger.info(`   Ajuste: ${predicao_local.quantidade_prevista} → ${quantidade_final}`);
    }

    return {
      quantidade_prevista: quantidade_final,
      confianca_final: parseFloat(confianca_final.toFixed(1)),
      intervalo_min: Math.round(quantidade_final * 0.85),
      intervalo_max: Math.round(quantidade_final * 1.15),
      metodo: "ensemble_local_claude",
      detalhes: {
        predicao_local: predicao_local.quantidade_prevista,
        confianca_local: predicao_local.confianca,
        ajuste_claude: analise_claude.ajuste_recomendado,
        confianca_claude: analise_claude.confianca_claude,
        diferenca_percentual: percent_diferenca.toFixed(1),
        peso_local: "40%",
        peso_claude: "60%"
      },
      validacao: {
        alertas: analise_claude.alertas,
        oportunidades: analise_claude.oportunidades,
        recomendacoes: analise_claude.recomendacoes
      }
    };
  }
}

module.exports = new ClaudeRevisor();
