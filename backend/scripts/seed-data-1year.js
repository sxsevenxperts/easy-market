/**
 * Gerador de dados fictícios para 1 ano de operação
 * Simula padrões realistas de uma loja de supermercado
 *
 * Uso: node seed-data-1year.js
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Configurações
const NUM_DIAS = 365;
const DATA_INICIO = new Date('2025-03-20');
const LOJA_ID = uuidv4();

// Setores e produtos
const SETORES = {
  'Bebidas': ['Refrigerante 2L', 'Suco Natural', 'Agua Mineral', 'Cerveja', 'Vinho'],
  'Alimentos': ['Feijao', 'Arroz', 'Macarrao', 'Oleo', 'Leite', 'Queijo'],
  'Higiene': ['Sabonete', 'Shampoo', 'Desodorante', 'Escova Dentes'],
  'Limpeza': ['Detergente', 'Desinfetante', 'Papel Toalha', 'Sacos Lixo'],
  'Perecíveis': ['Frutas', 'Verduras', 'Carnes', 'Peixes', 'Frango'],
};

// Horários de pico (multiplicador de vendas)
const HORARIOS_MULTIPLICADORES = {
  0: 0.3,   // 00:00 - madrugada
  1: 0.2,
  2: 0.1,
  3: 0.1,
  4: 0.1,
  5: 0.2,
  6: 0.4,   // 06:00 - começam as compras
  7: 0.8,
  8: 1.2,   // 08:00 - pico manhã
  9: 1.0,
  10: 0.9,
  11: 1.1,
  12: 1.4,  // 12:00 - almoço
  13: 1.3,
  14: 1.0,
  15: 0.8,
  16: 1.1,  // 16:00 - café
  17: 1.3,
  18: 1.5,  // 18:00 - saída do trabalho
  19: 1.4,
  20: 1.2,  // 20:00 - compras noturnas
  21: 0.9,
  22: 0.6,
  23: 0.4,
};

// Padrões sazonais (multiplicador mensal)
const PADROES_SAZONAIS = {
  0: 0.9,   // Janeiro - pós-festas
  1: 0.9,   // Fevereiro - carnaval
  2: 1.0,   // Março
  3: 1.1,   // Abril - páscoa
  4: 1.0,   // Maio
  5: 1.2,   // Junho - festa junina
  6: 1.1,   // Julho - férias
  7: 1.1,   // Agosto
  8: 1.0,   // Setembro
  9: 1.1,   // Outubro
  10: 1.3,  // Novembro - black friday
  11: 1.5,  // Dezembro - natal
};

// Preços por produto
const PRECOS = {
  'Refrigerante 2L': { preco: 5.50, estoque_inicial: 200 },
  'Suco Natural': { preco: 8.00, estoque_inicial: 150 },
  'Agua Mineral': { preco: 2.50, estoque_inicial: 300 },
  'Cerveja': { preco: 4.00, estoque_inicial: 180 },
  'Vinho': { preco: 25.00, estoque_inicial: 80 },
  'Feijao': { preco: 6.50, estoque_inicial: 300 },
  'Arroz': { preco: 4.50, estoque_inicial: 350 },
  'Macarrao': { preco: 2.50, estoque_inicial: 200 },
  'Oleo': { preco: 8.00, estoque_inicial: 150 },
  'Leite': { preco: 4.80, estoque_inicial: 250 },
  'Queijo': { preco: 18.00, estoque_inicial: 100 },
  'Sabonete': { preco: 3.50, estoque_inicial: 200 },
  'Shampoo': { preco: 12.00, estoque_inicial: 120 },
  'Desodorante': { preco: 8.50, estoque_inicial: 150 },
  'Escova Dentes': { preco: 5.50, estoque_inicial: 180 },
  'Detergente': { preco: 3.00, estoque_inicial: 250 },
  'Desinfetante': { preco: 4.50, estoque_inicial: 200 },
  'Papel Toalha': { preco: 7.50, estoque_inicial: 200 },
  'Sacos Lixo': { preco: 12.00, estoque_inicial: 120 },
  'Frutas': { preco: 5.00, estoque_inicial: 300, dias_vencimento: 7 },
  'Verduras': { preco: 4.50, estoque_inicial: 280, dias_vencimento: 5 },
  'Carnes': { preco: 35.00, estoque_inicial: 100, dias_vencimento: 3 },
  'Peixes': { preco: 40.00, estoque_inicial: 80, dias_vencimento: 2 },
  'Frango': { preco: 18.00, estoque_inicial: 150, dias_vencimento: 3 },
};

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🌱 Iniciando geração de dados fictícios para 1 ano...');

    // 1. Criar loja
    console.log('📦 Criando loja...');
    await client.query(
      `INSERT INTO lojas (id, nome, endereco, cidade, estado, cep, telefone, email, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT DO NOTHING`,
      [
        LOJA_ID,
        'Supermercado Teste Easy Market',
        'Rua das Flores, 123',
        'Recife',
        'PE',
        '50000-000',
        '(81) 3333-3333',
        'loja@easymarket.test',
        'ativa'
      ]
    );

    // 2. Criar produtos
    console.log('📦 Criando produtos...');
    const produtoIds = {};
    for (const [nome, preco_data] of Object.entries(PRECOS)) {
      const id = uuidv4();
      produtoIds[nome] = id;
      await client.query(
        `INSERT INTO inventario (id, loja_id, nome_produto, categoria, preco_unitario, quantidade, dias_vencimento, status_estoque)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        [
          id,
          LOJA_ID,
          nome,
          Object.keys(SETORES).find(setor => SETORES[setor].includes(nome)),
          preco_data.preco,
          preco_data.estoque_inicial,
          preco_data.dias_vencimento || 30,
          'saudavel'
        ]
      );
    }

    // 3. Gerar vendas para cada dia do ano
    console.log('💰 Gerando dados de vendas...');
    let totalVendas = 0;

    for (let dia = 0; dia < NUM_DIAS; dia++) {
      const data = new Date(DATA_INICIO);
      data.setDate(data.getDate() + dia);

      // Padrão sazonal
      const multiplicadorSazonal = PADROES_SAZONAIS[data.getMonth()];

      // Gerar 5-15 transações por dia
      const numTransacoes = Math.floor(Math.random() * 11) + 5;

      for (let t = 0; t < numTransacoes; t++) {
        // Hora aleatória do dia
        const hora = Math.floor(Math.random() * 24);
        const multiplicadorHorario = HORARIOS_MULTIPLICADORES[hora];
        const minuto = Math.floor(Math.random() * 60);

        data.setHours(hora, minuto, 0);

        // Quantidade de itens por transação (1-8)
        const qtdItens = Math.floor(Math.random() * 8) + 1;
        let faturamento = 0;

        for (let i = 0; i < qtdItens; i++) {
          // Produto aleatório
          const produtos = Object.keys(PRECOS);
          const produtoNome = produtos[Math.floor(Math.random() * produtos.length)];
          const preco = PRECOS[produtoNome].preco;
          const quantidade = Math.floor(Math.random() * 3) + 1;

          faturamento += preco * quantidade;
        }

        // Aplicar multiplicadores
        faturamento *= multiplicadorHorario * multiplicadorSazonal;
        faturamento = Math.round(faturamento * 100) / 100;

        // Inserir venda
        await client.query(
          `INSERT INTO vendas (id, loja_id, data_venda, faturamento, quantidade)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            uuidv4(),
            LOJA_ID,
            data,
            faturamento,
            qtdItens
          ]
        );

        totalVendas++;
      }

      if ((dia + 1) % 50 === 0) {
        console.log(`  ✓ ${dia + 1}/${NUM_DIAS} dias processados`);
      }
    }

    // 4. Gerar alertas (10% das transações)
    console.log('⚠️  Gerando alertas...');
    const result = await client.query(
      `SELECT id FROM vendas WHERE loja_id = $1 ORDER BY data_venda DESC LIMIT ${Math.floor(totalVendas * 0.1)}`,
      [LOJA_ID]
    );

    for (const row of result.rows) {
      const tipos = ['falta_estoque', 'desperdicio', 'preco_anormal', 'vencimento'];
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      const urgencia = Math.random() > 0.7 ? 'alta' : 'media';
      const roiEstimado = Math.floor(Math.random() * 500) + 50;

      await client.query(
        `INSERT INTO alertas (id, loja_id, tipo, urgencia, valor_roi_estimado, status, data_criacao)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          uuidv4(),
          LOJA_ID,
          tipo,
          urgencia,
          roiEstimado,
          Math.random() > 0.5 ? 'resolvido' : 'pendente',
          new Date()
        ]
      );
    }

    console.log('✅ Dados fictícios gerados com sucesso!');
    console.log(`
📊 Resumo:
  • Loja ID: ${LOJA_ID}
  • Período: ${DATA_INICIO.toLocaleDateString('pt-BR')} até ${new Date(DATA_INICIO.getTime() + NUM_DIAS * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
  • Total de vendas: ${totalVendas}
  • Total de produtos: ${Object.keys(PRECOS).length}
  • Total de alertas: ~${Math.floor(totalVendas * 0.1)}

Para testar os relatórios agendados, crie uma agenda com:
  POST /api/v1/relatorios-agendados
  {
    "loja_id": "${LOJA_ID}",
    "tipo": "diario",
    "hora": "09:00",
    "destinatarios": ["seu@email.com"],
    "incluir_analise_impacto": true
  }
    `);
  } catch (error) {
    console.error('❌ Erro ao gerar dados:', error);
  } finally {
    await client.end();
  }
}

seed();
