const { pool } = require('../config/database');
const logger = require('../config/logger');
const Joi = require('joi');
const axios = require('axios');

// Validation schema for PDV integration setup
const integrappSchema = Joi.object({
  loja_id: Joi.string().required(),
  pdv_tipo: Joi.string().valid('linx', 'totvs', 'nex', 'custom_api').required(),
  pdv_api_key: Joi.string().required(),
  pdv_host: Joi.string().required(), // IP ou domínio
  pdv_porta: Joi.number().integer().default(8080)
});

const vendaPDVSchema = Joi.object({
  loja_id: Joi.string().required(),
  transacao_id: Joi.string().required(),
  data_hora: Joi.date().required(),
  itens: Joi.array().items(
    Joi.object({
      sku: Joi.string().required(),
      codigo_balanca: Joi.string(),
      nome_produto: Joi.string(),
      categoria: Joi.string(),
      quantidade: Joi.number().required(),
      preco_unitario: Joi.number().required(),
      valor_total: Joi.number(),
      desconto_percentual: Joi.number().default(0)
    })
  ).required(),
  valor_total: Joi.number().required(),
  forma_pagamento: Joi.string(),
  operador: Joi.string()
});

async function routes(fastify, options) {

  // POST /api/v1/integracao-pdv/configurar - Setup PDV integration
  fastify.post('/configurar', async (request, reply) => {
    try {
      const { error, value } = integrappSchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          error: 'validation_error',
          details: error.details
        });
      }

      const { loja_id, pdv_tipo, pdv_api_key, pdv_host, pdv_porta } = value;

      // Verify loja exists
      const lojaResult = await pool.query('SELECT * FROM lojas WHERE loja_id = $1', [loja_id]);
      if (lojaResult.rows.length === 0) {
        return reply.code(404).send({ error: 'loja_not_found' });
      }

      // Test connection to PDV
      let connectionTest = false;
      try {
        switch(pdv_tipo) {
          case 'linx':
            // Linx API test
            connectionTest = await testLinxConnection(pdv_host, pdv_porta, pdv_api_key);
            break;
          case 'totvs':
            // Totvs API test
            connectionTest = await testTotvsConnection(pdv_host, pdv_porto, pdv_api_key);
            break;
          case 'nex':
            // Nex API test
            connectionTest = await testNexConnection(pdv_host, pdv_porto, pdv_api_key);
            break;
          case 'custom_api':
            // Custom API test - just verify endpoint is reachable
            connectionTest = await testCustomConnection(pdv_host, pdv_porto);
            break;
        }
      } catch (testErr) {
        logger.warn('PDV connection test failed:', testErr.message);
        // Continue anyway, configuration is saved
      }

      // Update loja with PDV integration info
      const updateResult = await pool.query(
        `UPDATE lojas
         SET integrado_pdv = TRUE,
             pdv_tipo = $1,
             pdv_api_key = $2,
             balanca_ip = $3,
             balanca_porta = $4,
             updated_at = NOW()
         WHERE loja_id = $5
         RETURNING *`,
        [pdv_tipo, pdv_api_key, pdv_host, pdv_porta, loja_id]
      );

      logger.info(`PDV integration configured for ${loja_id}: ${pdv_tipo}`);

      return reply.code(201).send({
        loja_id,
        pdv_tipo,
        pdv_host,
        pdv_porta,
        connection_test: connectionTest,
        status: connectionTest ? 'conectado' : 'configurado_nao_testado'
      });

    } catch (err) {
      logger.error('Error configuring PDV integration:', err);
      return reply.code(500).send({
        error: 'internal_server_error',
        message: err.message
      });
    }
  });

  // POST /api/v1/integracao-pdv/venda - Receive sales from PDV
  fastify.post('/venda', async (request, reply) => {
    try {
      const { error, value } = vendaPDVSchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          error: 'validation_error',
          details: error.details
        });
      }

      const {
        loja_id,
        transacao_id,
        data_hora,
        itens,
        valor_total,
        forma_pagamento,
        operador
      } = value;

      // Verify loja exists and is integrated
      const lojaResult = await pool.query('SELECT * FROM lojas WHERE loja_id = $1', [loja_id]);
      if (lojaResult.rows.length === 0) {
        return reply.code(404).send({ error: 'loja_not_found' });
      }

      if (!lojaResult.rows[0].integrado_pdv) {
        return reply.code(400).send({ error: 'loja_not_integrated_with_pdv' });
      }

      // Insert each sale item
      const insertedIds = [];
      for (const item of itens) {
        const saleResult = await pool.query(
          `INSERT INTO vendas (
            time, loja_id, sku, categoria, nome_produto,
            quantidade, preco_unitario, preco_total, desconto_percentual
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id`,
          [
            new Date(data_hora),
            loja_id,
            item.sku,
            item.categoria || 'sem_categoria',
            item.nome_produto,
            item.quantidade,
            item.preco_unitario,
            item.valor_total || (item.quantidade * item.preco_unitario),
            item.desconto_percentual
          ]
        );
        insertedIds.push(saleResult.rows[0].id);

        // Update product stock if balança code is provided
        if (item.codigo_balanca) {
          await pool.query(
            `UPDATE produtos
             SET estoque_atual = estoque_atual - $1
             WHERE loja_id = $2 AND sku = $3`,
            [item.quantidade, loja_id, item.sku]
          );
        }
      }

      // Log transaction in historico_acoes
      await pool.query(
        `INSERT INTO historico_acoes (
          loja_id, usuario_id, acao, detalhes_json, resultado
        ) VALUES ($1, $2, 'transacao_pdv', $3, 'sucesso')`,
        [
          loja_id,
          operador || 'sistema',
          JSON.stringify({
            transacao_id,
            data_hora,
            total_itens: itens.length,
            valor_total,
            forma_pagamento,
            sales_ids: insertedIds
          })
        ]
      );

      logger.info(`PDV transaction processed: ${loja_id}/${transacao_id}`);

      return reply.code(201).send({
        transacao_id,
        loja_id,
        status: 'processada',
        itens_inseridos: insertedIds.length,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      logger.error('Error processing PDV sale:', err);
      return reply.code(500).send({
        error: 'internal_server_error',
        message: err.message
      });
    }
  });

  // POST /api/v1/integracao-pdv/:loja_id/sincronizar-inventario - Pull inventory from PDV
  fastify.post('/:loja_id/sincronizar-inventario', async (request, reply) => {
    try {
      const { loja_id } = request.params;

      // Get loja with PDV config
      const lojaResult = await pool.query('SELECT * FROM lojas WHERE loja_id = $1', [loja_id]);
      if (lojaResult.rows.length === 0) {
        return reply.code(404).send({ error: 'loja_not_found' });
      }

      const loja = lojaResult.rows[0];
      if (!loja.integrado_pdv) {
        return reply.code(400).send({ error: 'loja_not_integrated_with_pdv' });
      }

      let inventario = [];

      // Fetch inventory based on PDV type
      try {
        switch(loja.pdv_tipo) {
          case 'linx':
            inventario = await fetchLinxInventory(loja.balanca_ip, loja.balanca_porta, loja.pdv_api_key);
            break;
          case 'totvs':
            inventario = await fetchTotvsInventory(loja.balanca_ip, loja.balanca_porta, loja.pdv_api_key);
            break;
          case 'nex':
            inventario = await fetchNexInventory(loja.balanca_ip, loja.balanca_porta, loja.pdv_api_key);
            break;
          case 'custom_api':
            inventario = await fetchCustomInventory(loja.balanca_ip, loja.balanca_porta);
            break;
        }
      } catch (fetchErr) {
        logger.error('Error fetching inventory from PDV:', fetchErr);
        return reply.code(500).send({
          error: 'pdv_fetch_error',
          message: fetchErr.message
        });
      }

      // Upsert products into database
      let produtosInseridos = 0;
      let produtosAtualizados = 0;

      for (const produto of inventario) {
        const result = await pool.query(
          `INSERT INTO produtos (
            sku, loja_id, nome, categoria, subcategoria,
            preco_custo, preco_venda, estoque_atual,
            estoque_minimo, estoque_maximo, eh_perecivel, data_vencimento
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (sku, loja_id) DO UPDATE SET
            nome = $3,
            categoria = $4,
            subcategoria = $5,
            preco_venda = $7,
            estoque_atual = $8,
            data_vencimento = $12,
            updated_at = NOW()
          RETURNING xmax`,
          [
            produto.sku || produto.codigo_produto,
            loja_id,
            produto.nome || produto.descricao,
            produto.categoria || 'sem_categoria',
            produto.subcategoria || null,
            produto.preco_custo || 0,
            produto.preco_venda || produto.preco || 0,
            produto.quantidade || produto.estoque_atual || 0,
            produto.estoque_minimo || 5,
            produto.estoque_maximo || 100,
            produto.eh_perecivel || false,
            produto.data_vencimento || null
          ]
        );

        if (result.rows[0].xmax === 0) {
          produtosInseridos++;
        } else {
          produtosAtualizados++;
        }
      }

      // Log sync operation
      await pool.query(
        `INSERT INTO historico_acoes (
          loja_id, acao, detalhes_json, resultado
        ) VALUES ($1, 'sincronizacao_inventario_pdv', $2, 'sucesso')`,
        [
          loja_id,
          JSON.stringify({
            pdv_tipo: loja.pdv_tipo,
            data_sincronizacao: new Date().toISOString(),
            produtos_inseridos: produtosInseridos,
            produtos_atualizados: produtosAtualizados,
            total_produtos: inventario.length
          })
        ]
      );

      logger.info(`Inventory synced for ${loja_id}: ${produtosInseridos} new, ${produtosAtualizados} updated`);

      return reply.code(200).send({
        loja_id,
        pdv_tipo: loja.pdv_tipo,
        status: 'sincronizado',
        resumo: {
          total_produtos: inventario.length,
          produtos_inseridos: produtosInseridos,
          produtos_atualizados: produtosAtualizados
        },
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      logger.error('Error syncing inventory:', err);
      return reply.code(500).send({
        error: 'internal_server_error',
        message: err.message
      });
    }
  });

  // GET /api/v1/integracao-pdv/:loja_id/status - Check PDV connection status
  fastify.get('/:loja_id/status', async (request, reply) => {
    try {
      const { loja_id } = request.params;

      const result = await pool.query(
        'SELECT loja_id, integrado_pdv, pdv_tipo, pdv_api_key, balanca_ip, balanca_porta FROM lojas WHERE loja_id = $1',
        [loja_id]
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'loja_not_found' });
      }

      const loja = result.rows[0];

      let connectionStatus = 'nao_integrado';
      if (loja.integrado_pdv) {
        try {
          switch(loja.pdv_tipo) {
            case 'linx':
              connectionStatus = await testLinxConnection(loja.balanca_ip, loja.balanca_porta, loja.pdv_api_key) ? 'conectado' : 'desconectado';
              break;
            case 'totvs':
              connectionStatus = await testTotvsConnection(loja.balanca_ip, loja.balanca_porta, loja.pdv_api_key) ? 'conectado' : 'desconectado';
              break;
            case 'nex':
              connectionStatus = await testNexConnection(loja.balanca_ip, loja.balanca_porta, loja.pdv_api_key) ? 'conectado' : 'desconectado';
              break;
            default:
              connectionStatus = 'configurado';
          }
        } catch (testErr) {
          connectionStatus = 'erro_conexao';
        }
      }

      return reply.send({
        loja_id,
        integrado: loja.integrado_pdv,
        pdv_tipo: loja.pdv_tipo,
        status: connectionStatus,
        última_sincronização: new Date().toISOString()
      });

    } catch (err) {
      logger.error('Error checking PDV status:', err);
      return reply.code(500).send({
        error: 'internal_server_error'
      });
    }
  });

}

// PDV Connection Tests
async function testLinxConnection(host, port, apiKey) {
  try {
    const response = await axios.get(`http://${host}:${port}/api/test`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 5000
    });
    return response.status === 200;
  } catch (err) {
    return false;
  }
}

async function testTotvsConnection(host, port, apiKey) {
  try {
    const response = await axios.get(`http://${host}:${port}/api/status`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 5000
    });
    return response.status === 200;
  } catch (err) {
    return false;
  }
}

async function testNexConnection(host, port, apiKey) {
  try {
    const response = await axios.get(`http://${host}:${port}/api/health`, {
      headers: { 'X-API-Key': apiKey },
      timeout: 5000
    });
    return response.status === 200;
  } catch (err) {
    return false;
  }
}

async function testCustomConnection(host, port) {
  try {
    const response = await axios.get(`http://${host}:${port}/health`, {
      timeout: 5000
    });
    return response.status === 200;
  } catch (err) {
    return false;
  }
}

// Inventory Fetching Functions
async function fetchLinxInventory(host, port, apiKey) {
  try {
    const response = await axios.get(`http://${host}:${port}/api/inventario`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 30000
    });
    // Transform Linx response to standard format
    return response.data.produtos.map(p => ({
      sku: p.codigo_produto,
      nome: p.descricao_produto,
      categoria: p.categoria,
      preco_custo: p.preco_custo,
      preco_venda: p.preco_venda,
      quantidade: p.quantidade_estoque,
      estoque_minimo: p.estoque_minimo || 5,
      estoque_maximo: p.estoque_maximo || 100,
      eh_perecivel: p.eh_perecivel || false,
      data_vencimento: p.data_validade || null
    }));
  } catch (err) {
    throw new Error(`Linx inventory fetch failed: ${err.message}`);
  }
}

async function fetchTotvsInventory(host, port, apiKey) {
  try {
    const response = await axios.get(`http://${host}:${port}/api/estoque`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 30000
    });
    // Transform Totvs response to standard format
    return response.data.itens.map(p => ({
      sku: p.codigo,
      nome: p.nome,
      categoria: p.classe,
      preco_custo: p.precocusto,
      preco_venda: p.precovenda,
      quantidade: p.quantidade,
      estoque_minimo: p.estoque_minimo || 5,
      estoque_maximo: p.estoque_maximo || 100,
      eh_perecivel: p.controlado_validade || false,
      data_vencimento: p.data_vencimento || null
    }));
  } catch (err) {
    throw new Error(`Totvs inventory fetch failed: ${err.message}`);
  }
}

async function fetchNexInventory(host, port, apiKey) {
  try {
    const response = await axios.get(`http://${host}:${port}/api/v1/inventory`, {
      headers: { 'X-API-Key': apiKey },
      timeout: 30000
    });
    // Transform Nex response to standard format
    return response.data.data.map(p => ({
      sku: p.produto_codigo,
      nome: p.produto_nome,
      categoria: p.categoria_nome,
      preco_custo: p.custo,
      preco_venda: p.preco,
      quantidade: p.saldo,
      estoque_minimo: p.estoque_minimo || 5,
      estoque_maximo: p.estoque_maximo || 100,
      eh_perecivel: p.validade_controla || false,
      data_vencimento: p.validade_proxima || null
    }));
  } catch (err) {
    throw new Error(`Nex inventory fetch failed: ${err.message}`);
  }
}

async function fetchCustomInventory(host, port) {
  try {
    const response = await axios.get(`http://${host}:${port}/api/inventario`, {
      timeout: 30000
    });
    // Assume custom API returns standardized format
    return response.data.produtos || response.data;
  } catch (err) {
    throw new Error(`Custom API inventory fetch failed: ${err.message}`);
  }
}

module.exports = routes;
