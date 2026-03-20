/**
 * Setup Completo para Supabase
 * 1. Cria tabelas com SQL
 * 2. Insere dados fictícios
 *
 * Uso: node scripts/setup-supabase-complete.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qfkwqfrnemqregjqxkcr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vBAVB5lBnPY18GbnJxRlkA_fxMYrUmQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Dados fictícios
const NUM_DIAS = 365;
const DATA_INICIO = new Date('2025-03-20');

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
  'Frutas': { preco: 5.00, estoque_inicial: 300 },
  'Verduras': { preco: 4.50, estoque_inicial: 280 },
  'Carnes': { preco: 35.00, estoque_inicial: 100 },
  'Peixes': { preco: 40.00, estoque_inicial: 80 },
  'Frango': { preco: 18.00, estoque_inicial: 150 },
};

const SETORES = {
  'Bebidas': ['Refrigerante 2L', 'Suco Natural', 'Agua Mineral', 'Cerveja', 'Vinho'],
  'Alimentos': ['Feijao', 'Arroz', 'Macarrao', 'Oleo', 'Leite', 'Queijo'],
  'Higiene': ['Sabonete', 'Shampoo', 'Desodorante', 'Escova Dentes'],
  'Limpeza': ['Detergente', 'Desinfetante', 'Papel Toalha', 'Sacos Lixo'],
  'Perecíveis': ['Frutas', 'Verduras', 'Carnes', 'Peixes', 'Frango'],
};

const HORARIOS_MULTIPLICADORES = {
  0: 0.3, 1: 0.2, 2: 0.1, 3: 0.1, 4: 0.1, 5: 0.2,
  6: 0.4, 7: 0.8, 8: 1.2, 9: 1.0, 10: 0.9, 11: 1.1,
  12: 1.4, 13: 1.3, 14: 1.0, 15: 0.8, 16: 1.1, 17: 1.3,
  18: 1.5, 19: 1.4, 20: 1.2, 21: 0.9, 22: 0.6, 23: 0.4,
};

const PADROES_SAZONAIS = {
  0: 0.9, 1: 0.9, 2: 1.0, 3: 1.1, 4: 1.0, 5: 1.2,
  6: 1.1, 7: 1.1, 8: 1.0, 9: 1.1, 10: 1.3, 11: 1.5,
};

async function setup() {
  try {
    console.log('🚀 Iniciando setup completo no Supabase...\n');

    // 1. Criar loja
    console.log('📦 Criando loja...');
    const { data: loja, error: erroLoja } = await supabase
      .from('lojas')
      .insert([{
        nome: 'Loja Super LAgoa Junco',
        endereco: 'Avenida Principal, Bairro Lagoa Junco',
        cidade: 'Recife',
        estado: 'PE',
        cep: '52000-000',
        telefone: '(81) 3333-3333',
        email: 'sevenxpertssxacademy@gmail.com',
        status: 'ativa'
      }])
      .select();

    if (erroLoja) {
      console.error('Erro ao criar loja:', erroLoja.message);
      throw erroLoja;
    }

    const lojaId = loja[0].id;
    console.log(`✅ Loja criada: ${lojaId}\n`);

    // 2. Criar produtos
    console.log('📦 Criando 24 produtos...');
    const produtos = [];
    for (const [nome, preco_data] of Object.entries(PRECOS)) {
      const setor = Object.keys(SETORES).find(s => SETORES[s].includes(nome));
      produtos.push({
        loja_id: lojaId,
        nome_produto: nome,
        categoria: setor,
        preco_unitario: preco_data.preco,
        quantidade: preco_data.estoque_inicial,
        dias_vencimento: preco_data.dias_vencimento || 30,
        status_estoque: 'saudavel'
      });
    }

    const { error: erroProdutos } = await supabase
      .from('inventario')
      .insert(produtos);

    if (erroProdutos) {
      console.error('Erro ao criar produtos:', erroProdutos.message);
      throw erroProdutos;
    }
    console.log(`✅ ${produtos.length} produtos criados\n`);

    // 3. Gerar vendas (em lotes)
    console.log('💰 Gerando 1 ano de vendas (365 dias)...');
    let totalVendas = 0;
    let vendas = [];

    for (let dia = 0; dia < NUM_DIAS; dia++) {
      const data = new Date(DATA_INICIO);
      data.setDate(data.getDate() + dia);

      const multiplicadorSazonal = PADROES_SAZONAIS[data.getMonth()];
      const numTransacoes = Math.floor(Math.random() * 11) + 5;

      for (let t = 0; t < numTransacoes; t++) {
        const hora = Math.floor(Math.random() * 24);
        const multiplicadorHorario = HORARIOS_MULTIPLICADORES[hora];
        const minuto = Math.floor(Math.random() * 60);

        const dataVenda = new Date(data);
        dataVenda.setHours(hora, minuto, 0);

        const qtdItens = Math.floor(Math.random() * 8) + 1;
        let faturamento = 0;

        for (let i = 0; i < qtdItens; i++) {
          const produtos_list = Object.keys(PRECOS);
          const produtoNome = produtos_list[Math.floor(Math.random() * produtos_list.length)];
          const preco = PRECOS[produtoNome].preco;
          const quantidade = Math.floor(Math.random() * 3) + 1;
          faturamento += preco * quantidade;
        }

        faturamento *= multiplicadorHorario * multiplicadorSazonal;
        faturamento = Math.round(faturamento * 100) / 100;

        vendas.push({
          loja_id: lojaId,
          data_venda: dataVenda.toISOString(),
          faturamento: faturamento,
          quantidade: qtdItens
        });

        totalVendas++;

        // Inserir em lotes de 500
        if (vendas.length === 500) {
          const { error: erroVenda } = await supabase
            .from('vendas')
            .insert(vendas);
          if (erroVenda) {
            console.error('Erro ao inserir vendas:', erroVenda.message);
            throw erroVenda;
          }
          vendas = [];
        }
      }

      if ((dia + 1) % 50 === 0) {
        process.stdout.write(`  ✓ ${dia + 1}/${NUM_DIAS}\n`);
      }
    }

    // Inserir vendas restantes
    if (vendas.length > 0) {
      const { error: erroVenda } = await supabase
        .from('vendas')
        .insert(vendas);
      if (erroVenda) {
        console.error('Erro ao inserir vendas finais:', erroVenda.message);
        throw erroVenda;
      }
    }
    console.log(`✅ ${totalVendas} transações geradas\n`);

    // 4. Gerar alertas
    console.log('⚠️  Gerando alertas...');
    const alertas = [];
    const numAlertas = Math.floor(totalVendas * 0.1);

    for (let i = 0; i < numAlertas; i++) {
      const tipos = ['falta_estoque', 'desperdicio', 'preco_anormal', 'vencimento'];
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      const urgencia = Math.random() > 0.7 ? 'alta' : 'media';
      const roiEstimado = Math.floor(Math.random() * 500) + 50;

      alertas.push({
        loja_id: lojaId,
        tipo: tipo,
        urgencia: urgencia,
        valor_roi_estimado: roiEstimado,
        status: Math.random() > 0.5 ? 'resolvido' : 'pendente',
        data_criacao: new Date().toISOString()
      });

      if (alertas.length === 500) {
        const { error: erroAlerta } = await supabase
          .from('alertas')
          .insert(alertas);
        if (erroAlerta) {
          console.error('Erro ao inserir alertas:', erroAlerta.message);
          throw erroAlerta;
        }
        alertas.length = 0;
      }
    }

    if (alertas.length > 0) {
      const { error: erroAlerta } = await supabase
        .from('alertas')
        .insert(alertas);
      if (erroAlerta) {
        console.error('Erro ao inserir alertas finais:', erroAlerta.message);
        throw erroAlerta;
      }
    }
    console.log(`✅ ${numAlertas} alertas gerados\n`);

    // 5. Criar contato de notificação
    console.log('👤 Criando contato de teste...');
    const { data: contato, error: erroContato } = await supabase
      .from('notificacao_contatos')
      .insert([{
        loja_id: lojaId,
        nome: 'Gerente Teste',
        cargo: 'Gerente Geral',
        setores: ['Bebidas', 'Alimentos', 'Higiene', 'Limpeza', 'Perecíveis'],
        telefone_whatsapp: '+5511999999999',
        email: 'sevenxpertssxacademy@gmail.com',
        ativo: true,
        receber_alertas_criticos: true,
        receber_alertas_whatsapp: true,
        receber_alertas_email: true,
        receber_relatorios: true
      }])
      .select();

    if (erroContato) {
      console.error('Erro ao criar contato:', erroContato.message);
      throw erroContato;
    }
    console.log(`✅ Contato criado\n`);

    // 6. Criar relatório agendado
    console.log('📧 Criando relatório agendado...');
    const { data: relatorio, error: erroRelatorio } = await supabase
      .from('relatorios_agendados')
      .insert([{
        loja_id: lojaId,
        tipo: 'diario',
        hora: '09:00',
        destinatarios: ['sevenxpertssxacademy@gmail.com'],
        incluir_analise_impacto: true,
        ativo: true
      }])
      .select();

    if (erroRelatorio) {
      console.error('Erro ao criar relatório:', erroRelatorio.message);
      throw erroRelatorio;
    }
    console.log(`✅ Relatório agendado criado\n`);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 SETUP CONCLUÍDO COM SUCESSO!\n');
    console.log('📊 RESUMO FINAL:');
    console.log(`  • Loja: Loja Super LAgoa Junco`);
    console.log(`  • Loja ID: ${lojaId}`);
    console.log(`  • Período: ${DATA_INICIO.toLocaleDateString('pt-BR')} até ${new Date(DATA_INICIO.getTime() + NUM_DIAS * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}`);
    console.log(`  • Total de transações: ${totalVendas}`);
    console.log(`  • Total de produtos: ${Object.keys(PRECOS).length}`);
    console.log(`  • Total de alertas: ${numAlertas}`);
    console.log(`  • Contato: Gerente Teste (sevenxpertssxacademy@gmail.com)`);
    console.log(`  • Relatório: Diário às 09:00`);
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('✅ Tudo pronto para testar no Supabase!\n');
    console.log('📱 Próximos passos:');
    console.log('  1. Acesse: https://app.supabase.com');
    console.log('  2. Veja as tabelas preenchidas com dados');
    console.log('  3. Conecte o backend ao Supabase');
    console.log('  4. Teste os relatórios automáticos\n');

  } catch (error) {
    console.error('❌ Erro durante setup:', error.message);
    process.exit(1);
  }
}

setup();
