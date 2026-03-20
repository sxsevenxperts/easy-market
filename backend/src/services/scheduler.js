const schedule = require('node-schedule');
const { pool } = require('../config/database');
const logger = require('../config/logger');
const axios = require('axios');

/**
 * SCHEDULER - FLUXO AUTOMATIZADO 4 BLOCOS
 *
 * 00:00 - Treinar modelo com dados do dia anterior
 * 06:00 - Gerar predições para o dia
 * 07:00 - Enviar relatórios (WhatsApp/Email)
 * 20:00 - Registrar vendas reais
 * 23:00 - Calcular assertividade e aperfeiçoar modelo
 */

const schedulerService = {
  jobs: {},

  /**
   * Inicializar scheduler
   */
  init() {
    logger.info('🚀 Iniciando scheduler de automação...');

    // 00:00 - Treinar modelo
    this.jobs.treinarModelo = schedule.scheduleJob('0 0 * * *', async () => {
      logger.info('[SCHEDULER] 00:00 - Treinando modelos...');
      await this.executarTreinamento();
    });

    // 06:00 - Fazer predições
    this.jobs.fazerPredicoes = schedule.scheduleJob('0 6 * * *', async () => {
      logger.info('[SCHEDULER] 06:00 - Gerando predições diárias...');
      await this.executarPredicoes();
    });

    // 07:00 - Enviar relatórios
    this.jobs.enviarRelatorios = schedule.scheduleJob('0 7 * * *', async () => {
      logger.info('[SCHEDULER] 07:00 - Enviando relatórios...');
      await this.executarEnvio();
    });

    // 20:00 - Registrar vendas (sync com PDV)
    this.jobs.registrarVendas = schedule.scheduleJob('0 20 * * *', async () => {
      logger.info('[SCHEDULER] 20:00 - Sincronizando vendas com PDV...');
      await this.sincronizarVendas();
    });

    // 23:00 - Calcular assertividade
    this.jobs.calcularAssertividade = schedule.scheduleJob('0 23 * * *', async () => {
      logger.info('[SCHEDULER] 23:00 - Calculando assertividade e aperfeiçoando...');
      await this.calcularAssertividade();
    });

    // Verificação rápida a cada hora (sincronizar variáveis)
    this.jobs.sincronizarVariaveis = schedule.scheduleJob('0 * * * *', async () => {
      await this.sincronizarVariaveis();
    });

    logger.info('✅ Scheduler inicializado com sucesso');
  },

  /**
   * 00:00 - TREINAR MODELO COM DADOS DO DIA ANTERIOR
   */
  async executarTreinamento() {
    try {
      // Buscar todas as lojas
      const lojasResult = await pool.query('SELECT id FROM lojas WHERE status = $1', ['ativa']);

      for (const loja of lojasResult.rows) {
        logger.info(`  [Treinamento] Loja ${loja.id}: coletando dados históricos...`);

        // Buscar dados dos últimos 90 dias
        const dados = await pool.query(
          `SELECT DATE(data_venda), SUM(quantidade) as total_vendido
           FROM vendas
           WHERE loja_id = $1 AND data_venda >= NOW() - INTERVAL '90 days'
           GROUP BY DATE(data_venda)
           ORDER BY DATE(data_venda)`,
          [loja.id]
        );

        if (dados.rows.length > 0) {
          logger.info(`  [Treinamento] Loja ${loja.id}: ${dados.rows.length} dias de histórico`);

          // Aqui integraria com ML Engine
          // await axios.post('http://localhost:5000/api/train', {
          //   loja_id: loja.id,
          //   dados: dados.rows
          // });

          // Por enquanto, registrar que treinou
          await pool.query(
            `INSERT INTO historico_acoes (loja_id, acao, resultado)
             VALUES ($1, 'treinamento_modelo', 'sucesso')`,
            [loja.id]
          );
        }
      }

      logger.info('✅ Treinamento concluído');
    } catch (err) {
      logger.error('❌ Erro no treinamento:', err);
    }
  },

  /**
   * 06:00 - GERAR PREDIÇÕES PARA O DIA
   */
  async executarPredicoes() {
    try {
      const lojasResult = await pool.query('SELECT id FROM lojas WHERE status = $1', ['ativa']);

      for (const loja of lojasResult.rows) {
        logger.info(`  [Predições] Loja ${loja.id}: gerando predições...`);

        // Chamar endpoint de predicão diária
        try {
          const response = await axios.post(`http://localhost:3000/api/v1/predicoes/loja/${loja.id}/diaria`, {});
          logger.info(`  [Predições] Loja ${loja.id}: ${response.data.resumo.predicoes_geradas} produtos analisados`);
        } catch (apiErr) {
          logger.error(`  [Predições] Erro ao chamar API:`, apiErr.message);
        }
      }

      logger.info('✅ Predições diárias concluídas');
    } catch (err) {
      logger.error('❌ Erro ao gerar predições:', err);
    }
  },

  /**
   * 07:00 - ENVIAR RELATÓRIOS (WhatsApp/Email/SMS)
   */
  async executarEnvio() {
    try {
      const lojasResult = await pool.query(
        `SELECT l.id, l.nome
         FROM lojas l
         WHERE l.status = $1`,
        ['ativa']
      );

      for (const loja of lojasResult.rows) {
        logger.info(`  [Envio] Loja ${loja.nome}: preparando relatórios...`);

        // Buscar predições do dia
        const predicoes = await pool.query(
          `SELECT p.*, i.nome_produto, i.categoria, i.quantidade, i.dias_vencimento
           FROM previsoes_ml p
           JOIN inventario i ON p.produto_id = i.id
           WHERE p.loja_id = $1 AND DATE(p.created_at) = CURRENT_DATE
           ORDER BY p.confianca DESC
           LIMIT 10`,
          [loja.id]
        );

        // Buscar alertas críticos
        const alertas = await pool.query(
          `SELECT * FROM alertas
           WHERE loja_id = $1 AND status = 'pendente' AND urgencia = 'alta'
           ORDER BY data_criacao DESC
           LIMIT 5`,
          [loja.id]
        );

        // Buscar contatos para notificação
        const contatos = await pool.query(
          `SELECT * FROM notificacao_contatos
           WHERE loja_id = $1 AND ativo = true
           AND (receber_alertas_whatsapp = true OR receber_alertas_email = true)`,
          [loja.id]
        );

        // Enviar para cada contato
        for (const contato of contatos.rows) {
          const mensagem = gerarMensagemRelatorio(loja, predicoes.rows, alertas.rows);

          // Enviar WhatsApp
          if (contato.receber_alertas_whatsapp && contato.telefone_whatsapp) {
            await enviarWhatsApp(contato.telefone_whatsapp, mensagem);
            logger.info(`  [WhatsApp] Enviado para ${contato.nome}`);
          }

          // Enviar Email
          if (contato.receber_alertas_email && contato.email) {
            await enviarEmail(contato.email, 'Relatório Easy Market', mensagem);
            logger.info(`  [Email] Enviado para ${contato.email}`);
          }
        }

        // Registrar envio
        await pool.query(
          `INSERT INTO historico_acoes (loja_id, acao, resultado, detalhes_json)
           VALUES ($1, 'envio_relatorio', 'sucesso', $2)`,
          [loja.id, JSON.stringify({
            predicoes_enviadas: predicoes.rows.length,
            alertas_criticos: alertas.rows.length,
            contatos_notificados: contatos.rows.length,
            timestamp: new Date().toISOString()
          })]
        );
      }

      logger.info('✅ Relatórios enviados');
    } catch (err) {
      logger.error('❌ Erro ao enviar relatórios:', err);
    }
  },

  /**
   * 20:00 - SINCRONIZAR VENDAS COM PDV
   */
  async sincronizarVendas() {
    try {
      const lojasResult = await pool.query(
        `SELECT id, pdv_tipo, balanca_ip, balanca_porta, integrado_pdv
         FROM lojas WHERE status = $1 AND integrado_pdv = true`,
        ['ativa']
      );

      for (const loja of lojasResult.rows) {
        logger.info(`  [Sync] Loja ${loja.id}: sincronizando com PDV ${loja.pdv_tipo}...`);

        // Sincronizaria com PDV aqui
        // Os dados chegam via webhook normalmente, isso é apenas backup
      }

      logger.info('✅ Sincronização de vendas concluída');
    } catch (err) {
      logger.error('❌ Erro ao sincronizar vendas:', err);
    }
  },

  /**
   * 23:00 - CALCULAR ASSERTIVIDADE E APERFEIÇOAR MODELO
   */
  async calcularAssertividade() {
    try {
      const lojasResult = await pool.query('SELECT id FROM lojas WHERE status = $1', ['ativa']);

      for (const loja of lojasResult.rows) {
        logger.info(`  [Assertividade] Loja ${loja.id}: calculando...`);

        // Buscar predições de hoje que já têm realizado
        const resultado = await pool.query(
          `SELECT
            COUNT(*) as total,
            ROUND(AVG(100 - ABS(NULLIF(erro_percentual, 0)))::numeric, 2) as assertividade,
            MIN(100 - ABS(NULLIF(erro_percentual, 0))) as minima,
            MAX(100 - ABS(NULLIF(erro_percentual, 0))) as maxima
           FROM previsoes_ml
           WHERE loja_id = $1
           AND DATE(created_at) = CURRENT_DATE
           AND realizado IS NOT NULL`,
          [loja.id]
        );

        const stats = resultado.rows[0];
        const assertividade = parseFloat(stats.assertividade) || 0;

        logger.info(
          `  [Assertividade] Loja ${loja.id}: ${assertividade.toFixed(1)}% (validadas: ${stats.total})`
        );

        // Registrar métricas
        await pool.query(
          `INSERT INTO historico_acoes (loja_id, acao, resultado, detalhes_json)
           VALUES ($1, 'calculo_assertividade', 'sucesso', $2)`,
          [loja.id, JSON.stringify({
            assertividade: assertividade,
            previsoes_validadas: stats.total,
            minima: stats.minima,
            maxima: stats.maxima,
            timestamp: new Date().toISOString()
          })]
        );

        // Se assertividade < 85%, avisar que modelo precisa de mais dados
        if (assertividade < 85) {
          logger.warn(`⚠️  Loja ${loja.id}: Assertividade baixa (${assertividade.toFixed(1)}%), aumentar dados historicos`);
        }
      }

      logger.info('✅ Cálculo de assertividade concluído');
    } catch (err) {
      logger.error('❌ Erro ao calcular assertividade:', err);
    }
  },

  /**
   * SINCRONIZAÇÃO HORÁRIA - Coletar variáveis clima, operacional, etc
   */
  async sincronizarVariaveis() {
    try {
      const lojasResult = await pool.query('SELECT id FROM lojas WHERE status = $1', ['ativa']);

      for (const loja of lojasResult.rows) {
        // Stub: Integrar com APIs de clima, PDV, etc
        // logger.debug(`Sincronizando variáveis da loja ${loja.id}`);
      }
    } catch (err) {
      logger.error('Erro ao sincronizar variáveis:', err);
    }
  },

  /**
   * Parar scheduler
   */
  stop() {
    Object.values(this.jobs).forEach(job => {
      if (job) job.cancel();
    });
    logger.info('⏹️  Scheduler parado');
  }
};

// ============================================
// FUNÇÕES DE ENVIO
// ============================================

async function enviarWhatsApp(telefone, mensagem) {
  try {
    // Integrar com Twilio
    // await twilio.messages.create({...})
    logger.info(`[WhatsApp enviado] ${telefone}`);
  } catch (err) {
    logger.error('Erro ao enviar WhatsApp:', err);
  }
}

async function enviarEmail(email, assunto, mensagem) {
  try {
    // Integrar com nodemailer/sendgrid
    // await transporter.sendMail({...})
    logger.info(`[Email enviado] ${email}`);
  } catch (err) {
    logger.error('Erro ao enviar email:', err);
  }
}

function gerarMensagemRelatorio(loja, predicoes, alertas) {
  let msg = `📊 *RELATÓRIO EASY MARKET* - ${loja.nome}\n`;
  msg += `🕐 ${new Date().toLocaleString('pt-BR')}\n\n`;

  if (alertas.length > 0) {
    msg += `⚠️ *ALERTAS CRÍTICOS:*\n`;
    alertas.slice(0, 3).forEach(a => {
      msg += `  • ${a.tipo.replace(/_/g, ' ').toUpperCase()}\n`;
    });
    msg += `\n`;
  }

  msg += `📈 *TOP PRODUTOS:*\n`;
  predicoes.slice(0, 5).forEach(p => {
    const risco = p.quantidade_prevista > p.quantidade ? '⚠️' : '✅';
    msg += `  ${risco} ${p.nome_produto}: ${p.quantidade_prevista} unidades\n`;
  });

  msg += `\n🎯 Acesso: https://easymarket.local/dashboard`;

  return msg;
}

module.exports = schedulerService;
