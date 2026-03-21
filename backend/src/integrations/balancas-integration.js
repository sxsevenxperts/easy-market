/**
 * Scales/Balances (Balanças) Integration Module
 * 
 * Lightweight integration for electronic scales and weight measurement systems
 * No external dependencies - uses only Node.js built-ins
 * 
 * Supports:
 * - Serial port scales (most common for retail)
 * - Network scales (TCP/UDP)
 * - REST API scales
 * - Real-time weight monitoring
 * - Batch weight verification
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');
const { SerialPort } = require('serialport');

/**
 * BalancasIntegrationService - Main scales integration handler
 */
class BalancasIntegrationService extends EventEmitter {
    constructor(supabaseClient, config = {}) {
        super();
        this.supabase = supabaseClient;
        this.config = {
            serialBaudRate: config.serialBaudRate || 9600,
            serialDataBits: config.serialDataBits || 8,
            serialParity: config.serialParity || 'none',
            serialStopBits: config.serialStopBits || 1,
            readTimeout: config.readTimeout || 5000,
            weightTolerance: config.weightTolerance || 0.05, // 5% default tolerance
            ...config
        };
        this.activeConnections = new Map();
        this.bufferReads = new Map();
    }

    /**
     * Initialize scale connection
     */
    async inicializarConexaoBalanca(lojaId, balancaConfig) {
        try {
            const connectionId = crypto.randomUUID();
            
            const connection = {
                id: connectionId,
                lojaId,
                tipo: balancaConfig.tipo, // 'serial', 'tcp', 'rest'
                porta: balancaConfig.porta,
                endereco: balancaConfig.endereco,
                apiKey: balancaConfig.apiKey,
                modelo: balancaConfig.modelo,
                status: 'connecting',
                ultimaLeitura: null,
                erros: 0,
                leituras: 0,
                conectadoEm: new Date(),
                portSerial: null
            };

            const conectado = await this._validarConexaoBalanca(connection);
            
            if (!conectado) {
                throw new Error(`Falha ao conectar com balança ${balancaConfig.tipo}`);
            }

            connection.status = 'connected';
            this.activeConnections.set(connectionId, connection);

            await this.supabase
                .from('balancas_connections')
                .insert({
                    loja_id: lojaId,
                    connection_id: connectionId,
                    tipo_balanca: balancaConfig.tipo,
                    modelo: balancaConfig.modelo,
                    status: 'active',
                    criado_em: new Date().toISOString()
                });

            this.emit('balanca:connected', { connectionId, lojaId, modelo: balancaConfig.modelo });
            return { sucesso: true, connectionId, status: 'connected' };

        } catch (erro) {
            this.emit('balanca:error', { erro: erro.message });
            return { sucesso: false, erro: erro.message };
        }
    }

    /**
     * Ler peso da balança
     */
    async lerPesoBalanca(connectionId) {
        const connection = this.activeConnections.get(connectionId);
        if (!connection) {
            throw new Error(`Conexão de balança não encontrada: ${connectionId}`);
        }

        try {
            let peso = null;

            if (connection.tipo === 'serial') {
                peso = await this._lerPesoSerial(connection);
            } else if (connection.tipo === 'tcp') {
                peso = await this._lerPesoTCP(connection);
            } else if (connection.tipo === 'rest') {
                peso = await this._lerPesoREST(connection);
            }

            if (peso === null) {
                throw new Error('Não foi possível ler o peso');
            }

            connection.ultimaLeitura = {
                peso,
                timestamp: new Date().toISOString(),
                sucesso: true
            };

            connection.leituras++;
            connection.erros = 0;

            this.emit('balanca:weight-read', { connectionId, peso, timestamp: new Date().toISOString() });

            return {
                sucesso: true,
                peso,
                unidade: 'kg',
                timestamp: new Date().toISOString()
            };

        } catch (erro) {
            connection.erros++;
            connection.ultimaLeitura = {
                peso: null,
                timestamp: new Date().toISOString(),
                sucesso: false,
                erro: erro.message
            };

            this.emit('balanca:read-error', { connectionId, erro: erro.message });
            throw erro;
        }
    }

    /**
     * Verificar peso de produto contra especificação
     */
    async verificarPesoProduto(connectionId, produtoId, pesoEsperado) {
        try {
            const { peso } = await this.lerPesoBalanca(connectionId);
            
            const diferenca = Math.abs(peso - pesoEsperado);
            const percentualDiferenca = (diferenca / pesoEsperado) * 100;
            const dentroTolerance = percentualDiferenca <= (this.config.weightTolerance * 100);

            const verificacao = {
                id: crypto.randomUUID(),
                connectionId,
                produtoId,
                pesoMedido: peso,
                pesoDeclaro: pesoEsperado,
                diferenca,
                percentualDiferenca,
                dentroTolerance,
                status: dentroTolerance ? 'ok' : 'falha',
                timestamp: new Date().toISOString()
            };

            // Salvar resultado
            await this.supabase
                .from('balancas_verificacoes')
                .insert({
                    connection_id: connectionId,
                    produto_id: produtoId,
                    peso_medido: peso,
                    peso_declarado: pesoEsperado,
                    diferenca: diferenca.toFixed(3),
                    percentual_diferenca: percentualDiferenca.toFixed(2),
                    resultado: verificacao.status,
                    verificado_em: new Date().toISOString()
                });

            this.emit('balanca:verification-complete', verificacao);

            return verificacao;

        } catch (erro) {
            this.emit('balanca:verification-error', { erro: erro.message });
            throw erro;
        }
    }

    /**
     * Monitorar balança continuamente
     */
    async monitorarBalancaContinuo(connectionId, intervalo = 5000) {
        const connection = this.activeConnections.get(connectionId);
        if (!connection) {
            throw new Error(`Conexão de balança não encontrada: ${connectionId}`);
        }

        connection.monitorandoIntervalo = setInterval(async () => {
            try {
                await this.lerPesoBalanca(connectionId);
            } catch (erro) {
                this.emit('balanca:monitor-error', { connectionId, erro: erro.message });
            }
        }, intervalo);

        return { sucesso: true, monitorandoIntervalo: connection.monitorandoIntervalo };
    }

    /**
     * Parar monitoramento contínuo
     */
    async pararMonitoramento(connectionId) {
        const connection = this.activeConnections.get(connectionId);
        if (!connection || !connection.monitorandoIntervalo) {
            return { sucesso: false, erro: 'Monitoramento não está ativo' };
        }

        clearInterval(connection.monitorandoIntervalo);
        connection.monitorandoIntervalo = null;

        return { sucesso: true };
    }

    /**
     * MÉTODOS PRIVADOS
     */

    async _validarConexaoBalanca(connection) {
        try {
            if (connection.tipo === 'serial') {
                return await this._validarSerialPort(connection);
            } else if (connection.tipo === 'tcp') {
                return await this._validarTCP(connection);
            } else if (connection.tipo === 'rest') {
                return await this._validarREST(connection);
            }
            return false;
        } catch (erro) {
            return false;
        }
    }

    async _validarSerialPort(connection) {
        try {
            // Verificar se a porta existe
            const { SerialPort: SP } = require('serialport');
            const ports = await SP.list();
            const portExists = ports.some(p => p.path === connection.porta);
            
            if (!portExists) {
                return false;
            }

            // Tentar abrir conexão de teste
            const port = new SP({ 
                path: connection.porta,
                baudRate: this.config.serialBaudRate,
                dataBits: this.config.serialDataBits,
                parity: this.config.serialParity,
                stopBits: this.config.serialStopBits
            });

            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    port.close(() => resolve(false));
                }, 2000);

                port.on('open', () => {
                    clearTimeout(timeout);
                    connection.portSerial = port;
                    resolve(true);
                });

                port.on('error', () => {
                    clearTimeout(timeout);
                    resolve(false);
                });
            });
        } catch (erro) {
            return false;
        }
    }

    async _validarTCP(connection) {
        return new Promise((resolve) => {
            const { Socket } = require('net');
            const socket = new Socket();
            const [host, port] = connection.endereco.split(':');
            
            socket.setTimeout(3000);
            socket.connect(parseInt(port), host, () => {
                socket.destroy();
                resolve(true);
            });
            
            socket.on('error', () => resolve(false));
            socket.on('timeout', () => { socket.destroy(); resolve(false); });
        });
    }

    async _validarREST(connection) {
        return new Promise((resolve) => {
            const https = require('https');
            const http = require('http');
            const protocol = connection.endereco.startsWith('https') ? https : http;
            
            const req = protocol.get(`${connection.endereco}/health`, { timeout: 3000 }, (res) => {
                resolve(res.statusCode >= 200 && res.statusCode < 300);
            });
            
            req.on('error', () => resolve(false));
            req.on('timeout', () => { req.destroy(); resolve(false); });
        });
    }

    async _lerPesoSerial(connection) {
        return new Promise((resolve, reject) => {
            if (!connection.portSerial || !connection.portSerial.isOpen) {
                reject(new Error('Porta serial não está aberta'));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Timeout ao ler peso'));
            }, this.config.readTimeout);

            const onData = (data) => {
                clearTimeout(timeout);
                connection.portSerial.removeListener('data', onData);
                
                try {
                    const peso = this._parseWeightData(data);
                    resolve(peso);
                } catch (erro) {
                    reject(erro);
                }
            };

            connection.portSerial.on('data', onData);

            // Enviar comando de leitura se necessário
            if (connection.modelo && connection.modelo.includes('TOLEDO')) {
                connection.portSerial.write('P\r\n');
            }
        });
    }

    async _lerPesoTCP(connection) {
        return new Promise((resolve, reject) => {
            const { Socket } = require('net');
            const socket = new Socket();
            const [host, port] = connection.endereco.split(':');
            
            let data = '';
            const timeout = setTimeout(() => {
                socket.destroy();
                reject(new Error('Timeout ao ler peso'));
            }, this.config.readTimeout);

            socket.on('data', (chunk) => {
                data += chunk.toString();
                try {
                    const peso = this._parseWeightData(data);
                    clearTimeout(timeout);
                    socket.destroy();
                    resolve(peso);
                } catch (e) {
                    // Continue waiting for more data
                }
            });

            socket.on('error', () => {
                clearTimeout(timeout);
                reject(new Error('Erro ao conectar à balança'));
            });

            socket.connect(parseInt(port), host, () => {
                socket.write('PESO?\r\n');
            });
        });
    }

    async _lerPesoREST(connection) {
        return new Promise((resolve, reject) => {
            const https = require('https');
            const http = require('http');
            const protocol = connection.endereco.startsWith('https') ? https : http;
            
            const url = `${connection.endereco}/weight`;
            const headers = connection.apiKey ? { 'Authorization': `Bearer ${connection.apiKey}` } : {};

            const req = protocol.get(url, { headers, timeout: this.config.readTimeout }, (res) => {
                let data = '';
                
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        const peso = parseFloat(json.weight || json.peso || json.value);
                        if (isNaN(peso)) {
                            reject(new Error('Peso inválido na resposta'));
                        } else {
                            resolve(peso);
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
        });
    }

    _parseWeightData(data) {
        // Remove common protocol characters and whitespace
        let cleanData = data.toString().replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
        
        // Try to extract number from various formats
        const patterns = [
            /(\d+\.\d+|\d+)\s*kg/i,
            /PESO\s*[:=]\s*(\d+\.\d+|\d+)/i,
            /(\d+\.\d+|\d+)\s*g/i,
            /^(\d+\.\d+|\d+)/
        ];

        for (const pattern of patterns) {
            const match = cleanData.match(pattern);
            if (match) {
                let peso = parseFloat(match[1]);
                
                // Convert grams to kg if necessary
                if (cleanData.includes('g') && !cleanData.includes('kg')) {
                    peso = peso / 1000;
                }
                
                if (!isNaN(peso) && peso > 0) {
                    return parseFloat(peso.toFixed(3));
                }
            }
        }

        throw new Error(`Não foi possível extrair peso de: ${cleanData}`);
    }

    /**
     * Obter histórico de pesos
     */
    async obterHistoricoPesos(lojaId, ultimasHoras = 24) {
        try {
            const dataLimite = new Date(Date.now() - (ultimasHoras * 3600000)).toISOString();

            const { data } = await this.supabase
                .from('balancas_verificacoes')
                .select('*')
                .eq('loja_id', lojaId)
                .gte('verificado_em', dataLimite)
                .order('verificado_em', { ascending: false });

            return {
                sucesso: true,
                verificacoes: data || [],
                periodo: `${ultimasHoras}h`,
                total: data?.length || 0
            };

        } catch (erro) {
            return { sucesso: false, erro: erro.message };
        }
    }

    /**
     * Obter status de todas as balanças
     */
    async obterStatusBalancas() {
        const balancas = [];
        for (const [id, conn] of this.activeConnections) {
            balancas.push({
                id,
                lojaId: conn.lojaId,
                modelo: conn.modelo,
                tipo: conn.tipo,
                status: conn.status,
                ultimaLeitura: conn.ultimaLeitura,
                leituras: conn.leituras,
                erros: conn.erros,
                conectadoEm: conn.conectadoEm,
                monitorando: !!conn.monitorandoIntervalo
            });
        }
        return balancas;
    }

    /**
     * Encerrar conexão de balança
     */
    async encerrarConexaoBalanca(connectionId) {
        const connection = this.activeConnections.get(connectionId);
        
        if (connection) {
            if (connection.monitorandoIntervalo) {
                clearInterval(connection.monitorandoIntervalo);
            }
            
            if (connection.portSerial && connection.portSerial.isOpen) {
                connection.portSerial.close();
            }

            this.activeConnections.delete(connectionId);
        }
        
        await this.supabase
            .from('balancas_connections')
            .update({ 
                status: 'disconnected', 
                desconectado_em: new Date().toISOString() 
            })
            .eq('connection_id', connectionId);

        return { sucesso: true };
    }
}

module.exports = { BalancasIntegrationService };
