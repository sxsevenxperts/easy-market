/**
 * Scales/Balances Integration Routes
 * Endpoints for managing electronic scales and weight verification
 */

const express = require('express');
const router = express.Router();
const { BalancasIntegrationService } = require('../integrations/balancas-integration');

/**
 * Initialize middleware
 */
let balancasService = null;

function initBalancasService(supabaseClient) {
    if (!balancasService) {
        balancasService = new BalancasIntegrationService(supabaseClient);
    }
    return balancasService;
}

/**
 * POST /integracao/balancas/conectar
 * Initialize a new scale connection
 */
router.post('/conectar', async (req, res) => {
    try {
        const { loja_id, tipo, porta, endereco, api_key, modelo } = req.body;

        if (!loja_id || !tipo || !porta) {
            return res.status(400).json({
                sucesso: false,
                erro: 'loja_id, tipo e porta são obrigatórios'
            });
        }

        const service = initBalancasService(req.supabase);

        const resultado = await service.inicializarConexaoBalanca(loja_id, {
            tipo,
            porta,
            endereco,
            apiKey: api_key,
            modelo
        });

        res.status(resultado.sucesso ? 200 : 400).json(resultado);

    } catch (erro) {
        console.error('Erro ao conectar balança:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * POST /integracao/balancas/ler-peso
 * Read weight from connected scale
 */
router.post('/ler-peso', async (req, res) => {
    try {
        const { connection_id } = req.body;

        if (!connection_id) {
            return res.status(400).json({
                sucesso: false,
                erro: 'connection_id é obrigatório'
            });
        }

        const service = initBalancasService(req.supabase);
        const resultado = await service.lerPesoBalanca(connection_id);

        res.json(resultado);

    } catch (erro) {
        console.error('Erro ao ler peso:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * POST /integracao/balancas/verificar-peso
 * Verify product weight against specification
 */
router.post('/verificar-peso', async (req, res) => {
    try {
        const { connection_id, produto_id, peso_esperado } = req.body;

        if (!connection_id || !produto_id || peso_esperado === undefined) {
            return res.status(400).json({
                sucesso: false,
                erro: 'connection_id, produto_id e peso_esperado são obrigatórios'
            });
        }

        const service = initBalancasService(req.supabase);
        const resultado = await service.verificarPesoProduto(
            connection_id,
            produto_id,
            parseFloat(peso_esperado)
        );

        res.json({
            sucesso: true,
            verificacao: resultado
        });

    } catch (erro) {
        console.error('Erro ao verificar peso:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * POST /integracao/balancas/monitorar
 * Start continuous monitoring of scale
 */
router.post('/monitorar', async (req, res) => {
    try {
        const { connection_id, intervalo } = req.body;

        if (!connection_id) {
            return res.status(400).json({
                sucesso: false,
                erro: 'connection_id é obrigatório'
            });
        }

        const service = initBalancasService(req.supabase);
        const resultado = await service.monitorarBalancaContinuo(
            connection_id,
            intervalo || 5000
        );

        res.json(resultado);

    } catch (erro) {
        console.error('Erro ao monitorar balança:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * POST /integracao/balancas/parar-monitoramento
 * Stop continuous monitoring of scale
 */
router.post('/parar-monitoramento', async (req, res) => {
    try {
        const { connection_id } = req.body;

        if (!connection_id) {
            return res.status(400).json({
                sucesso: false,
                erro: 'connection_id é obrigatório'
            });
        }

        const service = initBalancasService(req.supabase);
        const resultado = await service.pararMonitoramento(connection_id);

        res.json(resultado);

    } catch (erro) {
        console.error('Erro ao parar monitoramento:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * GET /integracao/balancas/historico
 * Get weight verification history
 */
router.get('/historico', async (req, res) => {
    try {
        const { loja_id, horas } = req.query;

        if (!loja_id) {
            return res.status(400).json({
                sucesso: false,
                erro: 'loja_id é obrigatório'
            });
        }

        const service = initBalancasService(req.supabase);
        const resultado = await service.obterHistoricoPesos(
            loja_id,
            parseInt(horas || 24)
        );

        res.json(resultado);

    } catch (erro) {
        console.error('Erro ao obter histórico:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * GET /integracao/balancas/status
 * Get status of all scale connections
 */
router.get('/status', async (req, res) => {
    try {
        const service = initBalancasService(req.supabase);
        const balancas = await service.obterStatusBalancas();

        res.json({
            sucesso: true,
            balancas,
            total: balancas.length,
            conectadas: balancas.filter(b => b.status === 'connected').length,
            monitorando: balancas.filter(b => b.monitorando).length
        });

    } catch (erro) {
        console.error('Erro ao obter status:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * POST /integracao/balancas/desconectar
 * Disconnect from scale
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

        const service = initBalancasService(req.supabase);
        const resultado = await service.encerrarConexaoBalanca(connection_id);

        res.json(resultado);

    } catch (erro) {
        console.error('Erro ao desconectar:', erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

/**
 * GET /integracao/balancas/health
 * Health check for scales service
 */
router.get('/health', (req, res) => {
    res.json({
        sucesso: true,
        servico: 'balancas-integration',
        status: 'online',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
