/**
 * POS (PDV - Ponto de Venda) Integration Module
 * 
 * Lightweight integration for Point-of-Sale systems
 * No external dependencies - uses only Node.js built-ins and existing backend services
 * 
 * Supports multiple POS systems via standard HTTP/REST API
 * Handles transaction sync, real-time updates, and error recovery
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');
const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * PDVIntegrationService - Main POS integration handler
 */
class PDVIntegrationService extends EventEmitter {
    constructor(supabaseClient, config = {}) {
        super();
        this.supabase = supabaseClient;
        this.config = {
            maxRetries: config.maxRetries || 3,
            retryDelay: config.retryDelay || 1000,
            syncInterval: config.syncInterval || 60000,
            batchSize: config.batchSize || 100,
            ...config
        };
        this.activeConnections = new Map();
        this.syncQueue = [];
        this.isRunning = false;
    }

    /**
     * Initialize POS connection
     */
    async inicializarConexaoPDV(lojaId, pdvConfig) {
        try {
            const connectionId = crypto.randomUUID();
            
            const connection = {
                id: connectionId,
                lojaId,
                tipo: pdvConfig.tipo,
                endpoint: pdvConfig.endpoint,
                apiKey: pdvConfig.apiKey,
                status: 'connecting',
                ultimaSync: null,
                erros: 0,
                transacoesPendentes: 0,
                conectadoEm: new Date()
            };

            const conectado = await this._validarConexao(connection);
            
            if (!conectado) {
                throw new Error(`Falha ao conectar com POS ${pdvConfig.tipo}`);
            }

            connection.status = 'connected';
            this.activeConnections.set(connectionId, connection);

            await this.supabase
                .from('pdv_connections')
                .insert({
                    loja_id: lojaId,
                    connection_id: connectionId,
                    tipo_pdv: pdvConfig.tipo,
                    endpoint: pdvConfig.endpoint,
                    status: 'active',
                    criado_em: new Date().toISOString()
                });

            this.emit('pdv:connected', { connectionId, lojaId });
            return { sucesso: true, connectionId, status: 'connected' };

        } catch (erro) {
            this.emit('pdv:error', { erro: erro.message });
            return { sucesso: false, erro: erro.message };
        }
    }

    /**
     * Sincronizar transações do POS
     */
    async sincronizarTransacoesPDV(connectionId, opcoes = {}) {
        const connection = this.activeConnections.get(connectionId);
        if (!connection) {
            throw new Error(`Conexão POS não encontrada: ${connectionId}`);
        }

        try {
            const transacoes = await this._recuperarTransacoes(connection, opcoes);
            
            if (!transacoes || transacoes.length === 0) {
                connection.ultimaSync = new Date();
                return { sucesso: true, transacoesSincronizadas: 0 };
            }

            const transacoesProcessadas = await Promise.all(
                transacoes.map(tx => this._processarTransacaoPDV(connection.lojaId, tx))
            );

            const { error } = await this.supabase
                .from('pdv_transactions')
                .insert(transacoesProcessadas);

            if (error) throw error;

            await this._atualizarMetricasLoja(connection.lojaId, transacoesProcessadas);

            connection.ultimaSync = new Date();
            connection.transacoesPendentes = 0;
            connection.erros = 0;

            this.emit('pdv:sync-success', { 
                connectionId, 
                quantidadeTransacoes: transacoesProcessadas.length 
            });

            return { 
                sucesso: true, 
                transacoesSincronizadas: transacoesProcessadas.length 
            };

        } catch (erro) {
            connection.erros++;
            this.emit('pdv:sync-error', { connectionId, erro: erro.message });
            
            throw {
                sucesso: false,
                erro: erro.message,
                tentarNovamente: connection.erros < this.config.maxRetries
            };
        }
    }

    /**
     * Obter recomendações de reabastecimento em tempo real
     */
    async obterRecomendacoesRealtime(lojaId, produtoIds = []) {
        try {
            const recomendacoes = [];

            const ids = produtoIds.length > 0 ? produtoIds : 
                await this._buscarTodosProdutos(lojaId);

            for (const produtoId of ids) {
                const recomendacao = await this._calcularRecomendacao(lojaId, produtoId);
                if (recomendacao.necessarioReabastecer) {
                    recomendacoes.push(recomendacao);
                }
            }

            return {
                sucesso: true,
                lojaId,
                recomendacoes,
                dataCalculo: new Date().toISOString()
            };

        } catch (erro) {
            return { sucesso: false, erro: erro.message };
        }
    }

    /**
     * Enviar recomendação para o POS
     */
    async enviarRecomendacaoPOS(connectionId, recomendacao) {
        const connection = this.activeConnections.get(connectionId);
        if (!connection) {
            throw new Error(`Conexão POS não encontrada: ${connectionId}`);
        }

        try {
            const payload = {
                id_recomendacao: crypto.randomUUID(),
                id_produto: recomendacao.produtoId,
                quantidade_sugerida: recomendacao.quantidadeSugerida,
                prioridade: recomendacao.prioridade,
                motivo: recomendacao.motivo,
                timestamp: new Date().toISOString()
            };

            const enviado = await this._enviarAoPOS(connection, payload);

            if (enviado) {
                await this.supabase
                    .from('pdv_recommendations_sent')
                    .insert({
                        connection_id: connectionId,
                        recomendacao_id: payload.id_recomendacao,
                        enviado_em: new Date().toISOString(),
                        sucesso: true
                    });

                this.emit('pdv:recommendation-sent', { connectionId, recomendacao: payload });
                return { sucesso: true, recomendacaoId: payload.id_recomendacao };
            }

        } catch (erro) {
            this.emit('pdv:send-error', { connectionId, erro: erro.message });
            throw erro;
        }
    }

    async _validarConexao(connection) {
        let tentativa = 0;
        
        while (tentativa < this.config.maxRetries) {
            try {
                if (connection.tipo === 'rest') {
                    return await this._validarConexaoREST(connection);
                } else if (connection.tipo === 'tcp') {
                    return await this._validarConexaoTCP(connection);
                }
                return false;
            } catch (erro) {
                tentativa++;
                if (tentativa < this.config.maxRetries) {
                    await this._delay(this.config.retryDelay);
                }
            }
        }
        return false;
    }

    async _validarConexaoREST(connection) {
        return new Promise((resolve) => {
            const url = `${connection.endpoint}/health`;
            const protocol = url.startsWith('https') ? https : http;
            
            const req = protocol.get(url, { timeout: 5000 }, (res) => {
                resolve(res.statusCode >= 200 && res.statusCode < 300);
            });
            
            req.on('error', () => resolve(false));
            req.on('timeout', () => { req.destroy(); resolve(false); });
        });
    }

    async _validarConexaoTCP(connection) {
        return new Promise((resolve) => {
            const { Socket } = require('net');
            const socket = new Socket();
            const [host, port] = connection.endpoint.split(':');
            
            socket.setTimeout(5000);
            socket.connect(parseInt(port), host, () => {
                socket.destroy();
                resolve(true);
            });
            
            socket.on('error', () => resolve(false));
            socket.on('timeout', () => { socket.destroy(); resolve(false); });
        });
    }

    async _recuperarTransacoes(connection, opcoes) {
        if (connection.tipo === 'rest') {
            return await this._recuperarTransacoesREST(connection, opcoes);
        }
        return [];
    }

    async _recuperarTransacoesREST(connection, opcoes) {
        return new Promise((resolve, reject) => {
            const url = new URL(`${connection.endpoint}/transactions`);
            url.searchParams.append('since', opcoes.desde || new Date(Date.now() - 3600000).toISOString());
            url.searchParams.append('limit', opcoes.limite || this.config.batchSize);
            
            const headers = {
                'Authorization': `Bearer ${connection.apiKey}`,
                'Accept': 'application/json'
            };
            
            const protocol = url.protocol === 'https:' ? https : http;
            
            const req = protocol.get(url, { headers, timeout: 10000 }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve([]);
                    }
                });
            });
            
            req.on('error', () => resolve([]));
            req.on('timeout', () => { req.destroy(); resolve([]); });
        });
    }

    async _processarTransacaoPDV(lojaId, transacao) {
        return {
            loja_id: lojaId,
            pdv_transaction_id: transacao.id,
            tipo: transacao.tipo || 'venda',
            total: parseFloat(transacao.total),
            itens_quantidade: transacao.items?.length || 0,
            itens: JSON.stringify(transacao.items || []),
            metodo_pagamento: transacao.paymentMethod,
            desconto: parseFloat(transacao.discount || 0),
            operador_id: transacao.operatorId,
            processado_em: new Date().toISOString(),
            timestamp_pdv: transacao.timestamp
        };
    }

    async _atualizarMetricasLoja(lojaId, transacoes) {
        const totalVendas = transacoes.reduce((sum, tx) => sum + tx.total, 0);
        const quantidadeItens = transacoes.reduce((sum, tx) => sum + tx.itens_quantidade, 0);

        await this.supabase
            .from('loja_metrics')
            .update({
                vendas_dia: totalVendas,
                transacoes_dia: transacoes.length,
                itens_vendidos: quantidadeItens,
                atualizado_em: new Date().toISOString()
            })
            .eq('loja_id', lojaId);
    }

    async _buscarTodosProdutos(lojaId) {
        const { data } = await this.supabase
            .from('produtos')
            .select('id')
            .eq('loja_id', lojaId);
        
        return data?.map(p => p.id) || [];
    }

    async _calcularRecomendacao(lojaId, produtoId) {
        const { data: produto } = await this.supabase
            .from('produtos')
            .select('*')
            .eq('id', produtoId)
            .single();

        if (!produto) {
            return { necessarioReabastecer: false };
        }

        const vendiasDia = await this._buscarVendasDia(lojaId, produtoId);
        const estoqueAtual = produto.estoque_atual || 0;
        const estoqueMinimo = produto.estoque_minimo || 0;
        
        const quantidadeSugerida = Math.ceil(
            (vendiasDia * 7) - estoqueAtual
        );

        return {
            necessarioReabastecer: estoqueAtual < estoqueMinimo,
            produtoId,
            quantidadeSugerida: Math.max(quantidadeSugerida, 0),
            estoqueAtual,
            estoqueMinimo,
            prioridade: estoqueAtual < (estoqueMinimo * 0.5) ? 'alta' : 'media',
            motivo: estoqueAtual < estoqueMinimo ? 'Estoque abaixo do mínimo' : 'Reabastecimento preventivo'
        };
    }

    async _buscarVendasDia(lojaId, produtoId) {
        const { data } = await this.supabase
            .from('pdv_transactions')
            .select('itens')
            .eq('loja_id', lojaId)
            .gte('processado_em', new Date(Date.now() - 86400000).toISOString());

        if (!data) return 0;

        let totalVendas = 0;
        for (const tx of data) {
            try {
                const itens = typeof tx.itens === 'string' ? JSON.parse(tx.itens) : tx.itens;
                const item = itens?.find(i => i.produtoId === produtoId);
                if (item) totalVendas += item.quantidade || 0;
            } catch (e) {
                // Skip parse errors
            }
        }
        return totalVendas;
    }

    async _enviarAoPOS(connection, payload) {
        if (connection.tipo === 'rest') {
            return await this._enviarViREST(connection, payload);
        }
        return false;
    }

    async _enviarViREST(connection, payload) {
        return new Promise((resolve) => {
            const protocol = connection.endpoint.startsWith('https') ? https : http;
            const url = new URL(`${connection.endpoint}/recommendations`);
            const data = JSON.stringify(payload);
            
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length,
                    'Authorization': `Bearer ${connection.apiKey}`
                },
                timeout: 5000
            };
            
            const req = protocol.request(options, (res) => {
                resolve(res.statusCode === 200 || res.statusCode === 201);
            });
            
            req.on('error', () => resolve(false));
            req.on('timeout', () => { req.destroy(); resolve(false); });
            req.write(data);
            req.end();
        });
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async obterStatusConexoes() {
        const conexoes = [];
        for (const [id, conn] of this.activeConnections) {
            conexoes.push({
                id,
                lojaId: conn.lojaId,
                tipo: conn.tipo,
                status: conn.status,
                ultimaSync: conn.ultimaSync,
                erros: conn.erros,
                conectadoEm: conn.conectadoEm
            });
        }
        return conexoes;
    }

    async encerrarConexaoPDV(connectionId) {
        this.activeConnections.delete(connectionId);
        
        await this.supabase
            .from('pdv_connections')
            .update({ status: 'disconnected', desconectado_em: new Date().toISOString() })
            .eq('connection_id', connectionId);

        return { sucesso: true };
    }
}

module.exports = { PDVIntegrationService };
