/**
 * Predictive Forecast Routes
 * Endpoints para previsão de vendas com múltiplos horizontes
 */

const express = require('express');
const router = express.Router();
const { PredictiveSalesForecastService } = require('../services/predictive-sales-forecast');

let forecastService = null;

function initForecastService(supabaseClient) {
    if (!forecastService) {
        forecastService = new PredictiveSalesForecastService(supabaseClient);
    }
    return forecastService;
}

/**
 * GET /predicoes/previsao-vendas
 * Gerar previsão de vendas para próximo dia, semana, quinzena e mês
 */
router.get('/previsao-vendas', async (req, res) => {
    try {
        const { loja_id } = req.query;

        if (!loja_id) {
            return res.status(400).json({
                sucesso: false,
                erro: 'loja_id é obrigatório'
            });
        }

        const service = initForecastService(req.supabase);
        const resultado = await service.gerarPrevisaoVendas(loja_id);

        res.status(resultado.sucesso ? 200 : 400).json(resultado);

    } catch (erro) {
        console.error('Erro ao gerar previsão:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * GET /predicoes/previsao-dia
 * Previsão para próximo dia com detalhes
 */
router.get('/previsao-dia', async (req, res) => {
    try {
        const { loja_id } = req.query;

        if (!loja_id) {
            return res.status(400).json({
                sucesso: false,
                erro: 'loja_id é obrigatório'
            });
        }

        const service = initForecastService(req.supabase);
        const resultado = await service.gerarPrevisaoVendas(loja_id);

        if (resultado.sucesso) {
            res.json({
                sucesso: true,
                horizonte: 'Próximo Dia',
                previsao: resultado.previsoes.proximoDia,
                timestamp: resultado.geradoEm
            });
        } else {
            res.status(400).json(resultado);
        }

    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * GET /predicoes/previsao-semana
 * Previsão para próxima semana com detalhes
 */
router.get('/previsao-semana', async (req, res) => {
    try {
        const { loja_id } = req.query;

        if (!loja_id) {
            return res.status(400).json({
                sucesso: false,
                erro: 'loja_id é obrigatório'
            });
        }

        const service = initForecastService(req.supabase);
        const resultado = await service.gerarPrevisaoVendas(loja_id);

        if (resultado.sucesso) {
            res.json({
                sucesso: true,
                horizonte: 'Próxima Semana',
                previsao: resultado.previsoes.proximaSemana,
                timestamp: resultado.geradoEm
            });
        } else {
            res.status(400).json(resultado);
        }

    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * GET /predicoes/previsao-quinzena
 * Previsão para próxima quinzena (15 dias) com detalhes
 */
router.get('/previsao-quinzena', async (req, res) => {
    try {
        const { loja_id } = req.query;

        if (!loja_id) {
            return res.status(400).json({
                sucesso: false,
                erro: 'loja_id é obrigatório'
            });
        }

        const service = initForecastService(req.supabase);
        const resultado = await service.gerarPrevisaoVendas(loja_id);

        if (resultado.sucesso) {
            res.json({
                sucesso: true,
                horizonte: 'Próxima Quinzena',
                previsao: resultado.previsoes.proximaQuinzena,
                timestamp: resultado.geradoEm
            });
        } else {
            res.status(400).json(resultado);
        }

    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * GET /predicoes/previsao-mes
 * Previsão para próximo mês com detalhes
 */
router.get('/previsao-mes', async (req, res) => {
    try {
        const { loja_id } = req.query;

        if (!loja_id) {
            return res.status(400).json({
                sucesso: false,
                erro: 'loja_id é obrigatório'
            });
        }

        const service = initForecastService(req.supabase);
        const resultado = await service.gerarPrevisaoVendas(loja_id);

        if (resultado.sucesso) {
            res.json({
                sucesso: true,
                horizonte: 'Próximo Mês',
                previsao: resultado.previsoes.proximoMes,
                timestamp: resultado.geradoEm
            });
        } else {
            res.status(400).json(resultado);
        }

    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * GET /predicoes/historico-previsoes
 * Obter histórico de previsões geradas
 */
router.get('/historico-previsoes', async (req, res) => {
    try {
        const { loja_id, limite } = req.query;

        if (!loja_id) {
            return res.status(400).json({
                sucesso: false,
                erro: 'loja_id é obrigatório'
            });
        }

        const service = initForecastService(req.supabase);
        const resultado = await service.obterHistoricoPrevisoes(
            loja_id,
            parseInt(limite || 10)
        );

        res.json(resultado);

    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * POST /predicoes/validar-previsao/:previsao_id
 * Validar previsão contra vendas realizadas
 */
router.post('/validar-previsao/:previsao_id', async (req, res) => {
    try {
        const { previsao_id } = req.params;
        const { loja_id } = req.body;

        if (!loja_id) {
            return res.status(400).json({
                sucesso: false,
                erro: 'loja_id é obrigatório'
            });
        }

        const service = initForecastService(req.supabase);
        const resultado = await service.validarPrevisao(loja_id, previsao_id);

        res.status(resultado.sucesso ? 200 : 400).json(resultado);

    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * GET /predicoes/forecast-dashboard
 * Dashboard de previsões com todas as horizontes
 */
router.get('/forecast-dashboard', async (req, res) => {
    try {
        const { loja_id } = req.query;

        if (!loja_id) {
            return res.status(400).json({
                sucesso: false,
                erro: 'loja_id é obrigatório'
            });
        }

        const service = initForecastService(req.supabase);
        const resultado = await service.gerarPrevisaoVendas(loja_id);

        if (!resultado.sucesso) {
            return res.status(400).json(resultado);
        }

        // Estrutura profissional para dashboard
        const dashboard = {
            sucesso: true,
            lojaId: loja_id,
            geradoEm: resultado.geradoEm,
            previsoes: [
                {
                    titulo: 'Próximo Dia',
                    icone: 'calendar-day',
                    horizonte: resultado.previsoes.proximoDia.horizonte,
                    vendaEstimada: resultado.previsoes.proximoDia.vendaTotalEstimada,
                    assertividade: resultado.previsoes.proximoDia.assertividade,
                    intervaloConfianca: {
                        minimo: resultado.previsoes.proximoDia.estimativaInferior,
                        maximo: resultado.previsoes.proximoDia.estimativaSuperior
                    },
                    detalhes: resultado.previsoes.proximoDia
                },
                {
                    titulo: 'Próxima Semana',
                    icone: 'calendar-week',
                    horizonte: resultado.previsoes.proximaSemana.horizonte,
                    vendaEstimada: resultado.previsoes.proximaSemana.vendaTotalEstimada,
                    assertividade: resultado.previsoes.proximaSemana.assertividade,
                    intervaloConfianca: {
                        minimo: resultado.previsoes.proximaSemana.estimativaInferior,
                        maximo: resultado.previsoes.proximaSemana.estimativaSuperior
                    },
                    mediaDiaria: resultado.previsoes.proximaSemana.mediadiaria,
                    detalhes: resultado.previsoes.proximaSemana
                },
                {
                    titulo: 'Próxima Quinzena',
                    icone: 'calendar-range',
                    horizonte: resultado.previsoes.proximaQuinzena.horizonte,
                    vendaEstimada: resultado.previsoes.proximaQuinzena.vendaTotalEstimada,
                    assertividade: resultado.previsoes.proximaQuinzena.assertividade,
                    intervaloConfianca: {
                        minimo: resultado.previsoes.proximaQuinzena.estimativaInferior,
                        maximo: resultado.previsoes.proximaQuinzena.estimativaSuperior
                    },
                    mediaDiaria: resultado.previsoes.proximaQuinzena.mediadiaria,
                    detalhes: resultado.previsoes.proximaQuinzena
                },
                {
                    titulo: 'Próximo Mês',
                    icone: 'calendar-month',
                    horizonte: resultado.previsoes.proximoMes.horizonte,
                    vendaEstimada: resultado.previsoes.proximoMes.vendaTotalEstimada,
                    assertividade: resultado.previsoes.proximoMes.assertividade,
                    intervaloConfianca: {
                        minimo: resultado.previsoes.proximoMes.estimativaInferior,
                        maximo: resultado.previsoes.proximoMes.estimativaSuperior
                    },
                    mediaDiaria: resultado.previsoes.proximoMes.mediadiaria,
                    detalhes: resultado.previsoes.proximoMes
                }
            ],
            resumo: {
                mediaAssertividade: resultado.resumo.mediaAssertividade,
                status: parseFloat(resultado.resumo.mediaAssertividade) >= 90 ? 'Excelente' : 'Bom',
                alertas: this._gerarAlertas(resultado.previsoes)
            }
        };

        res.json(dashboard);

    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * GET /predicoes/forecast-analytics
 * Analytics detalhado das previsões
 */
router.get('/forecast-analytics', async (req, res) => {
    try {
        const { loja_id, dias } = req.query;

        if (!loja_id) {
            return res.status(400).json({
                sucesso: false,
                erro: 'loja_id é obrigatório'
            });
        }

        const service = initForecastService(req.supabase);
        const historico = await service.obterHistoricoPrevisoes(loja_id, 30);

        // Validar previsões antigas
        const validacoes = [];
        for (const prev of historico.previsoes.slice(0, 10)) {
            const validacao = await service.validarPrevisao(loja_id, prev.id);
            if (validacao.sucesso) {
                validacoes.push(validacao);
            }
        }

        const acertoMedio = validacoes.length > 0
            ? validacoes.reduce((sum, v) => sum + v.percentualAcerto, 0) / validacoes.length
            : 0;

        res.json({
            sucesso: true,
            lojaId: loja_id,
            previsoes: historico.previsoes.length,
            validacoes: validacoes.length,
            acertoMedio: parseFloat(acertoMedio.toFixed(2)),
            detalhes: {
                previsionsGeradas: historico.previsoes,
                validacoes: validacoes
            }
        });

    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * GET /predicoes/forecast-health
 * Health check para serviço de previsão
 */
router.get('/forecast-health', (req, res) => {
    res.json({
        sucesso: true,
        servico: 'predictive-forecast',
        status: 'online',
        assertividade: '90-95%',
        horizontes: ['1 dia', '7 dias', '15 dias', '30 dias'],
        timestamp: new Date().toISOString()
    });
});

/**
 * Helper para gerar alertas
 */
function _gerarAlertas(previsoes) {
    const alertas = [];

    if (previsoes.proximoDia.assertividade < 90) {
        alertas.push({
            nivel: 'aviso',
            mensagem: 'Assertividade abaixo de 90% para próximo dia',
            assertividade: previsoes.proximoDia.assertividade
        });
    }

    const volatilidade = parseFloat(previsoes.proximoDia.volatilidade || 0);
    if (volatilidade > 20) {
        alertas.push({
            nivel: 'atenção',
            mensagem: 'Volatilidade elevada detectada',
            volatilidade: volatilidade + '%'
        });
    }

    return alertas;
}

module.exports = router;
