/**
 * Cross-Sell Engine Service
 * 
 * Identifica oportunidades de cross-sell por cliente
 * Parametriza recomendações baseado em histórico e perfil
 * Calcula afinidade entre categorias e produtos
 */

const crypto = require('crypto');

/**
 * CrossSellEngineService - Engine de cross-sell inteligente
 */
class CrossSellEngineService {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }

    /**
     * Analisar compras de cliente e detectar padrões de cross-sell
     */
    async analisarPadroesClienteCrossSell(clienteId, lojaId) {
        try {
            // Buscar histórico completo de compras do cliente
            const { data: compras } = await this.supabase
                .from('pdv_transactions')
                .select('itens, total, processado_em')
                .eq('loja_id', lojaId)
                .eq('cliente_id', clienteId)
                .order('processado_em', { ascending: false });

            if (!compras || compras.length === 0) {
                return { sucesso: false, erro: 'Sem histórico de compras' };
            }

            // Processar compras para extrair padrões
            const categorias = new Set();
            const produtos = new Map();
            const frequencia = new Map();
            let totalCompras = 0;
            let totalGasto = 0;
            let diasAdesao = 0;

            for (const compra of compras) {
                try {
                    const itens = typeof compra.itens === 'string' 
                        ? JSON.parse(compra.itens) 
                        : compra.itens;

                    if (!itens || itens.length === 0) continue;

                    totalCompras++;
                    totalGasto += parseFloat(compra.total || 0);

                    for (const item of itens) {
                        const categoria = item.categoria || 'sem_categoria';
                        const produtoId = item.produtoId;
                        const nome = item.nome;

                        categorias.add(categoria);

                        if (!produtos.has(produtoId)) {
                            produtos.set(produtoId, {
                                id: produtoId,
                                nome,
                                categoria,
                                quantidade: 0,
                                valor: 0,
                                frequencia: 0
                            });
                        }

                        const prod = produtos.get(produtoId);
                        prod.quantidade += item.quantidade || 1;
                        prod.valor += parseFloat(item.preco || 0) * (item.quantidade || 1);
                        prod.frequencia++;

                        // Rastrear frequência por categoria
                        const key = categoria;
                        frequencia.set(key, (frequencia.get(key) || 0) + 1);
                    }
                } catch (e) {
                    // Skip invalid items
                }
            }

            // Calcular dias de adesão
            const dataUltima = new Date(compras[0].processado_em);
            const dataPrimeira = new Date(compras[compras.length - 1].processado_em);
            diasAdesao = Math.ceil((dataUltima - dataPrimeira) / (1000 * 60 * 60 * 24));

            // Identificar categorias primárias vs secundárias
            const categoriasOrdenadas = Array.from(frequencia.entries())
                .sort((a, b) => b[1] - a[1]);

            const categoriaPrimaria = categoriasOrdenadas[0]?.[0];
            const categoriasSecundarias = categoriasOrdenadas.slice(1).map(c => c[0]);

            // Calcular oportunidades de cross-sell
            const oportunidades = this._calcularOportunidadesCrossSell(
                categoriaPrimaria,
                categoriasSecundarias,
                produtos,
                frequencia
            );

            return {
                sucesso: true,
                clienteId,
                lojaId,
                analise: {
                    totalCompras,
                    totalGasto: totalGasto.toFixed(2),
                    diasAdesao,
                    ticketMedio: (totalGasto / totalCompras).toFixed(2),
                    categoriasPrincipais: Array.from(categorias),
                    categoriaPrimaria,
                    categoriasSecundarias,
                    produtosComprados: Array.from(produtos.values()),
                    frequenciaPorCategoria: Object.fromEntries(frequencia)
                },
                oportunidades,
                timestamp: new Date().toISOString()
            };

        } catch (erro) {
            return { sucesso: false, erro: erro.message };
        }
    }

    /**
     * Parametrizar cross-sell para cliente específico
     */
    async parametrizarCrossSellCliente(clienteId, lojaId, parametros) {
        try {
            const configId = crypto.randomUUID();

            const configuracao = {
                id: configId,
                cliente_id: clienteId,
                loja_id: lojaId,
                categoria_primaria: parametros.categoriaPrimaria,
                categorias_cross_sell: parametros.categoriasCrossSell || [],
                productos_bloqueados: parametros.produtosBloqueados || [],
                afinidade_minima: parametros.afinidadeMinima || 0.5,
                frequencia_recomendacao: parametros.frequenciaRecomendacao || 30, // dias
                valor_minimo_purchase: parametros.valorMinimoPurchase || 50,
                tipos_recomendacao: parametros.tiposRecomendacao || [
                    'complementar',
                    'substituto',
                    'inovacao'
                ],
                ativo: true,
                criado_em: new Date().toISOString(),
                atualizado_em: new Date().toISOString()
            };

            // Salvar configuração no Supabase
            const { error } = await this.supabase
                .from('cross_sell_config')
                .insert(configuracao);

            if (error) throw error;

            return {
                sucesso: true,
                configId,
                configuracao
            };

        } catch (erro) {
            return { sucesso: false, erro: erro.message };
        }
    }

    /**
     * Obter recomendações de cross-sell para cliente
     */
    async obterRecomendacoesCrossSellCliente(clienteId, lojaId) {
        try {
            // Buscar configuração do cliente
            const { data: config } = await this.supabase
                .from('cross_sell_config')
                .select('*')
                .eq('cliente_id', clienteId)
                .eq('loja_id', lojaId)
                .eq('ativo', true)
                .single();

            if (!config) {
                return {
                    sucesso: false,
                    erro: 'Nenhuma configuração de cross-sell para este cliente'
                };
            }

            // Buscar última compra para validar frequência
            const { data: ultimaCompra } = await this.supabase
                .from('pdv_transactions')
                .select('processado_em')
                .eq('cliente_id', clienteId)
                .eq('loja_id', lojaId)
                .order('processado_em', { ascending: false })
                .limit(1)
                .single();

            if (ultimaCompra) {
                const diasDesdeUltimaCompra = Math.floor(
                    (Date.now() - new Date(ultimaCompra.processado_em)) / (1000 * 60 * 60 * 24)
                );

                if (diasDesdeUltimaCompra < config.frequencia_recomendacao) {
                    return {
                        sucesso: true,
                        recomendacoes: [],
                        motivo: `Cliente recomendado há ${diasDesdeUltimaCompra} dias. Frequência mínima: ${config.frequencia_recomendacao} dias`
                    };
                }
            }

            // Buscar produtos nas categorias de cross-sell
            const recomendacoes = await this._buscarProdutosCrossSell(
                config,
                clienteId,
                lojaId
            );

            // Rankear recomendações por relevância
            const recomendacoesRankeadas = recomendacoes.sort((a, b) => 
                b.scoreRelevancia - a.scoreRelevancia
            ).slice(0, 10); // Top 10

            // Salvar recomendações no histórico
            for (const rec of recomendacoesRankeadas) {
                await this.supabase
                    .from('cross_sell_recomendacoes')
                    .insert({
                        cliente_id: clienteId,
                        loja_id: lojaId,
                        produto_id: rec.id,
                        categoria_origem: config.categoria_primaria,
                        categoria_destino: rec.categoria,
                        tipo_recomendacao: rec.tipoRecomendacao,
                        afinidade: rec.afinidade,
                        score_relevancia: rec.scoreRelevancia,
                        recomendado_em: new Date().toISOString()
                    });
            }

            return {
                sucesso: true,
                clienteId,
                recomendacoes: recomendacoesRankeadas,
                total: recomendacoesRankeadas.length,
                timestamp: new Date().toISOString()
            };

        } catch (erro) {
            return { sucesso: false, erro: erro.message };
        }
    }

    /**
     * Calcular afinidade entre categorias
     */
    async calcularAfinidadeEntreCategorias(categoriaPrincipal, categoriaDestino, lojaId) {
        try {
            // Buscar todas as transações com ambas as categorias
            const { data: transacoes } = await this.supabase
                .from('pdv_transactions')
                .select('itens')
                .eq('loja_id', lojaId);

            if (!transacoes || transacoes.length === 0) {
                return { afinidade: 0, confianca: 0 };
            }

            let transacoesComAmbas = 0;
            let transacoesComPrincipal = 0;

            for (const tx of transacoes) {
                try {
                    const itens = typeof tx.itens === 'string' 
                        ? JSON.parse(tx.itens) 
                        : tx.itens;

                    if (!itens) continue;

                    const temPrincipal = itens.some(i => i.categoria === categoriaPrincipal);
                    const temDestino = itens.some(i => i.categoria === categoriaDestino);

                    if (temPrincipal) {
                        transacoesComPrincipal++;
                        if (temDestino) {
                            transacoesComAmbas++;
                        }
                    }
                } catch (e) {
                    // Skip
                }
            }

            const afinidade = transacoesComPrincipal > 0 
                ? transacoesComAmbas / transacoesComPrincipal 
                : 0;

            const confianca = transacoesComAmbas;

            return {
                afinidade: parseFloat(afinidade.toFixed(3)),
                confianca,
                transacoesComAmbas,
                transacoesComPrincipal
            };

        } catch (erro) {
            return { afinidade: 0, confianca: 0, erro: erro.message };
        }
    }

    /**
     * MÉTODOS PRIVADOS
     */

    _calcularOportunidadesCrossSell(categoriaPrimaria, categoriasSecundarias, produtos, frequencia) {
        const oportunidades = [];

        // Categorias que poderiam ser cross-sell
        const categoriasDisponiveis = [
            'bebidas',
            'alimentos',
            'higiene',
            'limpeza',
            'conveniencia',
            'congelados',
            'perecaveis',
            'nao-perecaveis',
            'utilidades',
            'eletronicos'
        ];

        for (const categoria of categoriasDisponiveis) {
            if (categoria === categoriaPrimaria || categoriasSecundarias.includes(categoria)) {
                continue; // Já compra nesta categoria
            }

            // Calcular potencial de cross-sell
            const frequenciaPrimaria = frequencia.get(categoriaPrimaria) || 0;
            const frequenciaDestino = frequencia.get(categoria) || 1;

            const afinidade = frequenciaDestino / (frequenciaPrimaria + frequenciaDestino);
            const potencial = frequenciaPrimaria * afinidade;

            if (potencial > 0) {
                oportunidades.push({
                    categoria,
                    afinidade: parseFloat(afinidade.toFixed(3)),
                    potencial: parseFloat(potencial.toFixed(2)),
                    tipo: this._classificarTipoCrossSell(
                        categoriaPrimaria,
                        categoria
                    )
                });
            }
        }

        return oportunidades.sort((a, b) => b.potencial - a.potencial);
    }

    _classificarTipoCrossSell(categoriaPrimaria, categoriaDestino) {
        // Matriz de tipos de cross-sell
        const matriz = {
            'alimentos|bebidas': 'complementar',
            'bebidas|alimentos': 'complementar',
            'higiene|limpeza': 'complementar',
            'limpeza|higiene': 'complementar',
            'congelados|perecaveis': 'complementar',
            'perecaveis|congelados': 'complementar',
            'nao-perecaveis|utilidades': 'complementar',
            'utilidades|nao-perecaveis': 'complementar'
        };

        const chave = `${categoriaPrimaria}|${categoriaDestino}`;
        return matriz[chave] || 'inovacao';
    }

    async _buscarProdutosCrossSell(config, clienteId, lojaId) {
        const recomendacoes = [];

        for (const categoria of config.categorias_cross_sell) {
            // Buscar produtos na categoria
            const { data: produtos } = await this.supabase
                .from('produtos')
                .select('id, nome, categoria, preco, estoque_atual')
                .eq('loja_id', lojaId)
                .eq('categoria', categoria)
                .gt('estoque_atual', 0)
                .limit(20);

            if (!produtos) continue;

            for (const produto of produtos) {
                // Pular se está bloqueado
                if (config.productos_bloqueados?.includes(produto.id)) {
                    continue;
                }

                // Buscar se cliente já comprou este produto
                const { data: jaComprou } = await this.supabase
                    .from('pdv_transactions')
                    .select('id', { count: 'exact' })
                    .eq('cliente_id', clienteId)
                    .eq('loja_id', lojaId);

                const compradoAntes = jaComprou && jaComprou.length > 0;

                // Calcular score de relevância
                const scoreRelevancia = this._calcularScoreRelevancia({
                    preco: produto.preco,
                    compradoAntes,
                    tipoRecomendacao: 'complementar',
                    afinidade: config.afinidade_minima
                });

                if (scoreRelevancia >= config.afinidade_minima) {
                    recomendacoes.push({
                        id: produto.id,
                        nome: produto.nome,
                        categoria: produto.categoria,
                        preco: produto.preco,
                        estoqueAtual: produto.estoque_atual,
                        scoreRelevancia,
                        afinidade: config.afinidade_minima,
                        tipoRecomendacao: 'complementar',
                        compradoAntes
                    });
                }
            }
        }

        return recomendacoes;
    }

    _calcularScoreRelevancia(opcoes) {
        let score = opcoes.afinidade || 0.5;

        // Boost se nunca comprou
        if (!opcoes.compradoAntes) {
            score *= 1.2;
        }

        // Ajustar por preço
        if (opcoes.preco < 50) {
            score *= 0.8; // Produtos baratos menos relevantes
        } else if (opcoes.preco > 200) {
            score *= 1.2; // Produtos caros mais relevantes
        }

        return Math.min(score, 1.0);
    }

    /**
     * Atualizar configuração de cross-sell
     */
    async atualizarConfiguracao(configId, parametros) {
        try {
            const { error } = await this.supabase
                .from('cross_sell_config')
                .update({
                    ...parametros,
                    atualizado_em: new Date().toISOString()
                })
                .eq('id', configId);

            if (error) throw error;

            return { sucesso: true, configId };

        } catch (erro) {
            return { sucesso: false, erro: erro.message };
        }
    }

    /**
     * Desativar configuração
     */
    async desativarConfiguracaoCrossSell(configId) {
        try {
            const { error } = await this.supabase
                .from('cross_sell_config')
                .update({ ativo: false })
                .eq('id', configId);

            if (error) throw error;

            return { sucesso: true };

        } catch (erro) {
            return { sucesso: false, erro: erro.message };
        }
    }

    /**
     * Obter histórico de recomendações de cliente
     */
    async obterHistoricoRecomendacoes(clienteId, lojaId, dias = 30) {
        try {
            const dataLimite = new Date(Date.now() - (dias * 24 * 60 * 60 * 1000)).toISOString();

            const { data } = await this.supabase
                .from('cross_sell_recomendacoes')
                .select('*')
                .eq('cliente_id', clienteId)
                .eq('loja_id', lojaId)
                .gte('recomendado_em', dataLimite)
                .order('recomendado_em', { ascending: false });

            return {
                sucesso: true,
                recomendacoes: data || [],
                total: data?.length || 0,
                periodo: `${dias} dias`
            };

        } catch (erro) {
            return { sucesso: false, erro: erro.message };
        }
    }
}

module.exports = { CrossSellEngineService };
