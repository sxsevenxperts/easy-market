/**
 * Cross-Sell Routes
 * Endpoints para gerenciar recomendações de cross-sell por cliente
 */

const express = require('express');
const router = express.Router();
const { CrossSellEngineService } = require('../services/cross-sell-engine');

let crossSellService = null;

function initCrossSellService(supabaseClient) {
    if (!crossSellService) {
        crossSellService = new CrossSellEngineService(supabaseClient);
    }
    return crossSellService;
}

/**
 * POST /cross-sell/analisar-cliente
 * Analisar padrões de compra e detectar oportunidades de cross-sell
 */
router.post('/analisar-cliente', async (req, res) => {
    try {
        const { cliente_id, loja_id } = req.body;

        if (!cliente_id || !loja_id) {
            return res.status(400).json({
                sucesso: false,
                erro: 'cliente_id e loja_id são obrigatórios'
            });
        }

        const service = initCrossSellService(req.supabase);
        const resultado = await service.analisarPadroesClienteCrossSell(cliente_id, loja_id);

        res.status(resultado.sucesso ? 200 : 400).json(resultado);

    } catch (erro) {
        console.error('Erro ao analisar cliente:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * POST /cross-sell/parametrizar
 * Parametrizar configuração de cross-sell para cliente
 */
router.post('/parametrizar', async (req, res) => {
    try {
        const {
            cliente_id,
            loja_id,
            categoria_primaria,
            categorias_cross_sell,
            produtos_bloqueados,
            afinidade_minima,
            frequencia_recomendacao,
            valor_minimo_purchase,
            tipos_recomendacao
        } = req.body;

        if (!cliente_id || !loja_id || !categoria_primaria) {
            return res.status(400).json({
                sucesso: false,
                erro: 'cliente_id, loja_id e categoria_primaria são obrigatórios'
            });
        }

        const service = initCrossSellService(req.supabase);

        const resultado = await service.parametrizarCrossSellCliente(
            cliente_id,
            loja_id,
            {
                categoriaPrimaria: categoria_primaria,
                categoriasCrossSell: categorias_cross_sell || [],
                produtosBloqueados: produtos_bloqueados || [],
                afinidadeMinima: afinidade_minima || 0.5,
                frequenciaRecomendacao: frequencia_recomendacao || 30,
                valorMinimoPurchase: valor_minimo_purchase || 50,
                tiposRecomendacao: tipos_recomendacao || ['complementar', 'substituto', 'inovacao']
            }
        );

        res.status(resultado.sucesso ? 200 : 400).json(resultado);

    } catch (erro) {
        console.error('Erro ao parametrizar:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * GET /cross-sell/recomendacoes/:cliente_id
 * Obter recomendações de cross-sell para cliente
 */
router.get('/recomendacoes/:cliente_id', async (req, res) => {
    try {
        const { cliente_id } = req.params;
        const { loja_id } = req.query;

        if (!cliente_id || !loja_id) {
            return res.status(400).json({
                sucesso: false,
                erro: 'cliente_id e loja_id (query param) são obrigatórios'
            });
        }

        const service = initCrossSellService(req.supabase);
        const resultado = await service.obterRecomendacoesCrossSellCliente(
            cliente_id,
            loja_id
        );

        res.json(resultado);

    } catch (erro) {
        console.error('Erro ao obter recomendações:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * GET /cross-sell/afinidade
 * Calcular afinidade entre duas categorias
 */
router.get('/afinidade', async (req, res) => {
    try {
        const { categoria_principal, categoria_destino, loja_id } = req.query;

        if (!categoria_principal || !categoria_destino || !loja_id) {
            return res.status(400).json({
                sucesso: false,
                erro: 'categoria_principal, categoria_destino e loja_id são obrigatórios'
            });
        }

        const service = initCrossSellService(req.supabase);
        const resultado = await service.calcularAfinidadeEntreCategorias(
            categoria_principal,
            categoria_destino,
            loja_id
        );

        res.json({
            sucesso: true,
            categoriaPrincipal: categoria_principal,
            categoriaDestino: categoria_destino,
            ...resultado
        });

    } catch (erro) {
        console.error('Erro ao calcular afinidade:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * PUT /cross-sell/atualizar/:config_id
 * Atualizar configuração de cross-sell
 */
router.put('/atualizar/:config_id', async (req, res) => {
    try {
        const { config_id } = req.params;
        const parametros = req.body;

        const service = initCrossSellService(req.supabase);
        const resultado = await service.atualizarConfiguracao(config_id, parametros);

        res.status(resultado.sucesso ? 200 : 400).json(resultado);

    } catch (erro) {
        console.error('Erro ao atualizar configuração:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * POST /cross-sell/desativar/:config_id
 * Desativar configuração de cross-sell
 */
router.post('/desativar/:config_id', async (req, res) => {
    try {
        const { config_id } = req.params;

        const service = initCrossSellService(req.supabase);
        const resultado = await service.desativarConfiguracaoCrossSell(config_id);

        res.json(resultado);

    } catch (erro) {
        console.error('Erro ao desativar:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * GET /cross-sell/historico/:cliente_id
 * Obter histórico de recomendações de cliente
 */
router.get('/historico/:cliente_id', async (req, res) => {
    try {
        const { cliente_id } = req.params;
        const { loja_id, dias } = req.query;

        if (!cliente_id || !loja_id) {
            return res.status(400).json({
                sucesso: false,
                erro: 'cliente_id e loja_id (query param) são obrigatórios'
            });
        }

        const service = initCrossSellService(req.supabase);
        const resultado = await service.obterHistoricoRecomendacoes(
            cliente_id,
            loja_id,
            parseInt(dias || 30)
        );

        res.json(resultado);

    } catch (erro) {
        console.error('Erro ao obter histórico:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * GET /cross-sell/health
 * Health check para serviço de cross-sell
 */
router.get('/health', (req, res) => {
    res.json({
        sucesso: true,
        servico: 'cross-sell-engine',
        status: 'online',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
