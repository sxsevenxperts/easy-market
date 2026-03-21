/**
 * POS Integration Routes
 * Endpoints for managing POS system connections and syncing transactions
 */

const express = require('express');
const router = express.Router();
const { PDVIntegrationService } = require('../integrations/pdv-integration');

/**
 * Initialize middleware
 */
let pdvService = null;

function initPDVService(supabaseClient) {
    if (!pdvService) {
        pdvService = new PDVIntegrationService(supabaseClient);
    }
    return pdvService;
}

/**
 * POST /integracao/pdv/conectar
 * Initialize a new POS connection
 */
router.post('/conectar', async (req, res) => {
    try {
        const { loja_id, tipo, endpoint, api_key } = req.body;

        if (!loja_id || !tipo || !endpoint) {
            return res.status(400).json({
                sucesso: false,
                erro: 'loja_id, tipo e endpoint são obrigatórios'
            });
        }

        const service = initPDVService(req.supabase);

        const resultado = await service.inicializarConexaoPDV(loja_id, {
            tipo,
            endpoint,
            apiKey: api_key
        });

        res.status(resultado.sucesso ? 200 : 400).json(resultado);

    } catch (erro) {
        console.error('Erro ao conectar POS:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * POST /integracao/pdv/sincronizar
 * Sync transactions from connected POS
 */
router.post('/sincronizar', async (req, res) => {
    try {
        const { connection_id, desde, limite } = req.body;

        if (!connection_id) {
            return res.status(400).json({
                sucesso: false,
                erro: 'connection_id é obrigatório'
            });
        }

        const service = initPDVService(req.supabase);

        const resultado = await service.sincronizarTransacoesPDV(connection_id, {
            desde,
            limite
        });

        res.json(resultado);

    } catch (erro) {
        console.error('Erro ao sincronizar POS:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * GET /integracao/pdv/recomendacoes-realtime
 * Get real-time replenishment recommendations for POS display
 */
router.get('/recomendacoes-realtime', async (req, res) => {
    try {
        const { loja_id, produto_ids } = req.query;

        if (!loja_id) {
            return res.status(400).json({
                sucesso: false,
                erro: 'loja_id é obrigatório'
            });
        }

        const service = initPDVService(req.supabase);

        const produtoIds = produto_ids ? 
            (typeof produto_ids === 'string' ? [produto_ids] : produto_ids) : 
            [];

        const resultado = await service.obterRecomendacoesRealtime(loja_id, produtoIds);

        res.json(resultado);

    } catch (erro) {
        console.error('Erro ao obter recomendações:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * POST /integracao/pdv/enviar-recomendacao
 * Send a recommendation to POS display
 */
router.post('/enviar-recomendacao', async (req, res) => {
    try {
        const { connection_id, produto_id, quantidade_sugerida, prioridade, motivo } = req.body;

        if (!connection_id || !produto_id) {
            return res.status(400).json({
                sucesso: false,
                erro: 'connection_id e produto_id são obrigatórios'
            });
        }

        const service = initPDVService(req.supabase);

        const resultado = await service.enviarRecomendacaoPOS(connection_id, {
            produtoId: produto_id,
            quantidadeSugerida: quantidade_sugerida || 0,
            prioridade: prioridade || 'media',
            motivo: motivo || 'Reabastecimento necessário'
        });

        res.json(resultado);

    } catch (erro) {
        console.error('Erro ao enviar recomendação:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * GET /integracao/pdv/status
 * Get status of all POS connections
 */
router.get('/status', async (req, res) => {
    try {
        const service = initPDVService(req.supabase);
        const conexoes = await service.obterStatusConexoes();

        res.json({
            sucesso: true,
            conexoes,
            total: conexoes.length,
            conectadas: conexoes.filter(c => c.status === 'connected').length
        });

    } catch (erro) {
        console.error('Erro ao obter status:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * POST /integracao/pdv/desconectar
 * Disconnect from POS
 */
router.post('/desconectar', async (req, res) => {
    try {
        const { connection_id } = req.body;

        if (!connection_id) {
            return res.status(400).json({
                sucesso: false,
                erro: 'connection_id é obrigatório'
            });
        }

        const service = initPDVService(req.supabase);
        const resultado = await service.encerrarConexaoPDV(connection_id);

        res.json(resultado);

    } catch (erro) {
        console.error('Erro ao desconectar:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * GET /integracao/pdv/health
 * Health check for POS service
 */
router.get('/health', (req, res) => {
    res.json({
        sucesso: true,
        servico: 'pdv-integration',
        status: 'online',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
