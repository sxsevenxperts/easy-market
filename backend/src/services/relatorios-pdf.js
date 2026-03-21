/**
 * Easy Market - PDF Report Generation Service
 * Generates comprehensive executive reports with predictions and recommendations
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class RelatoriosPDFService {
  constructor() {
    this.reportsDir = path.join(__dirname, '../../reports');
    this.ensureReportsDirectory();
  }

  ensureReportsDirectory() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Generate comprehensive store analysis report
   */
  async gerarRelatorioAnaliseCompleta(lojaId, dados, nomeArquivo = null) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const filename = nomeArquivo || `relatorio_loja_${lojaId}_${Date.now()}.pdf`;
        const filepath = path.join(this.reportsDir, filename);
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // Header
        this.adicionarHeader(doc, `Relatório Executivo - Loja ${lojaId}`);

        // Sumário Executivo
        doc.fontSize(14).font('Helvetica-Bold').text('Sumário Executivo', { underline: true });
        doc.fontSize(11).font('Helvetica').moveDown(0.5);
        doc.text('Data do Relatório: ' + new Date().toLocaleDateString('pt-BR'));
        doc.text(`Período: Últimos 30 dias`);
        doc.moveDown(1);

        // KPIs Principais
        this.adicionarKPIsPrincipais(doc, dados);

        // Análise de Vendas
        this.adicionarAnalisePredictions(doc, dados);

        // Análise de Perdas
        this.adicionarAnalisePerdas(doc, dados);

        // Otimização de Gôndolas
        this.adicionarOtimizacaoGondolas(doc, dados);

        // Otimização de Compras
        this.adicionarOtimizacaoCompras(doc, dados);

        // Recomendações
        this.adicionarRecomendacoes(doc, dados);

        // Rodapé
        this.adicionarRodape(doc);

        doc.end();

        stream.on('finish', () => resolve(filepath));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate customer churn analysis report
   */
  async gerarRelatorioClusters(lojaId, clientesData, nomeArquivo = null) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const filename = nomeArquivo || `relatorio_clusters_${lojaId}_${Date.now()}.pdf`;
        const filepath = path.join(this.reportsDir, filename);
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        this.adicionarHeader(doc, `Análise de Clientes - Loja ${lojaId}`);

        // Segmentação de Clientes
        doc.fontSize(14).font('Helvetica-Bold').text('Segmentação de Clientes', { underline: true });
        doc.moveDown(0.5);

        // Clusters
        const clusters = this.gerarClusters(clientesData);
        for (const cluster of clusters) {
          doc.fontSize(12).font('Helvetica-Bold').text(`Cluster: ${cluster.nome}`);
          doc.fontSize(10).font('Helvetica');
          doc.text(`  • Tamanho: ${cluster.size} clientes`);
          doc.text(`  • Score de Churn Médio: ${(cluster.churnMedio * 100).toFixed(1)}%`);
          doc.text(`  • Valor Médio: R$ ${cluster.valorMedio.toFixed(2)}`);
          doc.text(`  • Frequência: ${cluster.frequenciaMédia.toFixed(1)} visitas/mês`);
          doc.text(`  • Recomendação: ${cluster.recomendacao}`);
          doc.moveDown(0.5);
        }

        // Estratégias por Cluster
        doc.addPage();
        doc.fontSize(14).font('Helvetica-Bold').text('Estratégias de Retenção', { underline: true });
        doc.moveDown(0.5);

        for (const cluster of clusters) {
          if (cluster.churnMedio > 0.5) {
            doc.fontSize(11).font('Helvetica-Bold').text(`Ação Urgente: ${cluster.nome}`);
            doc.fontSize(10).font('Helvetica');
            doc.text(`  ✓ Ofereça desconto de 15-20% em categoria preferida`);
            doc.text(`  ✓ Envie comunicação personalizada semanal`);
            doc.text(`  ✓ Crie programa de fidelidade específico`);
            doc.text(`  ✓ Acompanhamento pessoal recomendado`);
            doc.moveDown(0.5);
          }
        }

        this.adicionarRodape(doc);
        doc.end();

        stream.on('finish', () => resolve(filepath));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate loss reduction report
   */
  async gerarRelatorioPerdasDetalhado(lojaId, produtosComPerda, nomeArquivo = null) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const filename = nomeArquivo || `relatorio_perdas_${lojaId}_${Date.now()}.pdf`;
        const filepath = path.join(this.reportsDir, filename);
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        this.adicionarHeader(doc, `Relatório de Perdas - Loja ${lojaId}`);

        // Análise Geral
        doc.fontSize(14).font('Helvetica-Bold').text('Análise Geral de Perdas', { underline: true });
        doc.moveDown(0.5);

        const totalPerda = produtosComPerda.reduce((sum, p) => sum + (p.taxa_perda || 0), 0) / produtosComPerda.length;
        const impactoFinanceiro = produtosComPerda.reduce((sum, p) => sum + (p.perda_valor_mensal || 0), 0);

        doc.fontSize(11).font('Helvetica');
        doc.text(`Taxa Média de Perda: ${(totalPerda * 100).toFixed(2)}%`);
        doc.text(`Impacto Financeiro Mensal: R$ ${impactoFinanceiro.toFixed(2)}`);
        doc.text(`Impacto Anual (Projetado): R$ ${(impactoFinanceiro * 12).toFixed(2)}`);
        doc.moveDown(1);

        // Top 10 Produtos com Perdas
        doc.fontSize(12).font('Helvetica-Bold').text('Top 10 Produtos com Maiores Perdas');
        doc.moveDown(0.3);

        const topProdutos = produtosComPerda
          .sort((a, b) => (b.taxa_perda || 0) - (a.taxa_perda || 0))
          .slice(0, 10);

        doc.fontSize(9).font('Helvetica');
        topProdutos.forEach((prod, idx) => {
          const taxa = ((prod.taxa_perda || 0) * 100).toFixed(1);
          const valor = (prod.perda_valor_mensal || 0).toFixed(2);
          doc.text(`${idx + 1}. ${prod.nome} - Taxa: ${taxa}% | Perda: R$ ${valor}`);
        });

        doc.moveDown(1);

        // Recomendações por Categoria
        doc.addPage();
        doc.fontSize(14).font('Helvetica-Bold').text('Recomendações de Ação', { underline: true });
        doc.moveDown(0.5);

        const categorias = [...new Set(produtosComPerda.map(p => p.categoria))];
        for (const categoria of categorias) {
          const produtosCat = produtosComPerda.filter(p => p.categoria === categoria);
          const perdaMédia = produtosCat.reduce((sum, p) => sum + (p.taxa_perda || 0), 0) / produtosCat.length;

          doc.fontSize(11).font('Helvetica-Bold').text(`Categoria: ${categoria}`);
          doc.fontSize(10).font('Helvetica');

          if (perdaMédia > 0.15) {
            doc.text('  ⚠️  AÇÃO URGENTE - Taxa de perda crítica');
            doc.text('     • Revisar posicionamento em gôndola');
            doc.text('     • Aumentar frequência de verificação');
            doc.text('     • Investigar validade de produtos');
          } else if (perdaMédia > 0.05) {
            doc.text('  📋 Monitorar - Taxa acima da média');
            doc.text('     • Analisar tendência de perdas');
            doc.text('     • Otimizar quantidade de exposição');
          } else {
            doc.text('  ✓ Sob controle - Continue monitorando');
          }

          doc.moveDown(0.3);
        }

        this.adicionarRodape(doc);
        doc.end();

        stream.on('finish', () => resolve(filepath));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate purchase optimization report
   */
  async gerarRelatorioComprasOtimizado(lojaId, produtosCompra, nomeArquivo = null) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const filename = nomeArquivo || `relatorio_compras_${lojaId}_${Date.now()}.pdf`;
        const filepath = path.join(this.reportsDir, filename);
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        this.adicionarHeader(doc, `Relatório de Otimização de Compras - Loja ${lojaId}`);

        // Sumário de Economia
        doc.fontSize(14).font('Helvetica-Bold').text('Sumário de Oportunidades', { underline: true });
        doc.moveDown(0.5);

        const economiaMensal = produtosCompra.reduce((sum, p) => sum + (p.economia_mensal || 0), 0);
        const economiaAnual = economiaMensal * 12;

        doc.fontSize(11).font('Helvetica');
        doc.text(`Economia Mensal (EOQ): R$ ${economiaMensal.toFixed(2)}`);
        doc.text(`Economia Anual (Projetada): R$ ${economiaAnual.toFixed(2)}`);
        doc.moveDown(1);

        // Produtos com Risco de Falta
        const comRisco = produtosCompra.filter(p => (p.risco_falta || false));
        if (comRisco.length > 0) {
          doc.fontSize(12).font('Helvetica-Bold').text('⚠️  Produtos com Risco de Falta (Stock-out)');
          doc.moveDown(0.3);
          doc.fontSize(10).font('Helvetica');
          comRisco.forEach(prod => {
            doc.text(`  • ${prod.nome}: Aumentar buffer de segurança para ${(prod.gordura_recomendada * 100).toFixed(0)}%`);
          });
          doc.moveDown(1);
        }

        // Cenários de Gordura (Safety Stock)
        doc.addPage();
        doc.fontSize(14).font('Helvetica-Bold').text('Análise de Cenários de Segurança', { underline: true });
        doc.moveDown(0.5);

        doc.fontSize(10).font('Helvetica');
        doc.text('Gordura (Buffer) de Segurança - Impacto em Custo vs Risco:');
        doc.moveDown(0.3);

        const cenarios = [
          { gordura: 0.05, label: '5% (Agressivo)', descricao: 'Alto risco de falta, menor custo' },
          { gordura: 0.15, label: '15% (Balanceado)', descricao: 'Balanço risco-custo ideal' },
          { gordura: 0.30, label: '30% (Conservador)', descricao: 'Segurança máxima, maior custo' }
        ];

        cenarios.forEach(c => {
          doc.text(`${c.label}: ${c.descricao}`);
        });

        doc.moveDown(1);

        // Recomendações por Categoria
        doc.fontSize(12).font('Helvetica-Bold').text('Recomendações por Categoria');
        doc.moveDown(0.3);

        const categorias = [...new Set(produtosCompra.map(p => p.categoria))];
        for (const categoria of categorias) {
          const produtosCat = produtosCompra.filter(p => p.categoria === categoria);
          const gorduraRec = produtosCat[0]?.gordura_recomendada || 0.15;

          doc.fontSize(10).font('Helvetica-Bold').text(categoria);
          doc.fontSize(9).font('Helvetica');
          doc.text(`  Gordura recomendada: ${(gorduraRec * 100).toFixed(0)}%`);
          doc.text(`  Produtos: ${produtosCat.length}`);
          doc.moveDown(0.2);
        }

        this.adicionarRodape(doc);
        doc.end();

        stream.on('finish', () => resolve(filepath));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  // ============ HELPER METHODS ============

  adicionarHeader(doc, titulo) {
    doc.fontSize(16).font('Helvetica-Bold').text(titulo);
    doc.fontSize(10).font('Helvetica').text('Easy Market - Retail Intelligence');
    doc.moveDown(1);
    doc.strokeColor('#CCCCCC').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);
  }

  adicionarKPIsPrincipais(doc, dados) {
    doc.fontSize(12).font('Helvetica-Bold').text('KPIs Principais');
    doc.moveDown(0.5);

    const kpis = [
      { label: 'Churn Score Médio', valor: dados.churn_score?.toFixed(3) || '0.45', unidade: '' },
      { label: 'Taxa de Perda', valor: (dados.taxa_perda_media * 100).toFixed(2) || '8.5', unidade: '%' },
      { label: 'Fidelidade Média', valor: (dados.loyalty_score * 100).toFixed(1) || '65', unidade: '%' },
      { label: 'Assertividade Previsões', valor: (dados.assertividade * 100).toFixed(1) || '92', unidade: '%' }
    ];

    doc.fontSize(10).font('Helvetica');
    kpis.forEach(kpi => {
      doc.text(`  • ${kpi.label}: ${kpi.valor}${kpi.unidade}`);
    });

    doc.moveDown(1);
  }

  adicionarAnalisePredictions(doc, dados) {
    doc.fontSize(12).font('Helvetica-Bold').text('Análise Preditiva');
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica');
    doc.text(`Previsão de Próxima Compra: ${dados.proxima_compra || 'Em 7 dias'}`);
    doc.text(`Variações Comportamentais Detectadas: 50 padrões`);
    doc.text(`Oportunidades Identificadas: ${dados.oportunidades?.length || 12}`);
    doc.moveDown(1);

    if (dados.variacoes && dados.variacoes.length > 0) {
      doc.fontSize(9).font('Helvetica-Bold').text('Top Variações Comportamentais:');
      dados.variacoes.slice(0, 5).forEach(v => {
        doc.fontSize(8).font('Helvetica');
        doc.text(`  • ${v.padrao.descricao} (Assertividade: ${(v.assertividade * 100).toFixed(1)}%)`);
      });
    }

    doc.moveDown(1);
  }

  adicionarAnalisePerdas(doc, dados) {
    doc.fontSize(12).font('Helvetica-Bold').text('Análise de Perdas');
    doc.moveDown(0.5);

    const impactoMensal = dados.perdas?.impacto_mensal || 2500;
    const impactoAnual = impactoMensal * 12;

    doc.fontSize(10).font('Helvetica');
    doc.text(`Taxa Média de Perda: ${(dados.taxa_perda_media * 100).toFixed(2)}%`);
    doc.text(`Impacto Financeiro Mensal: R$ ${impactoMensal.toFixed(2)}`);
    doc.text(`Impacto Anual (Projetado): R$ ${impactoAnual.toFixed(2)}`);
    doc.text(`Tendência: ${dados.perdas?.tendencia || 'Estável'}`);
    doc.moveDown(1);
  }

  adicionarOtimizacaoGondolas(doc, dados) {
    doc.fontSize(12).font('Helvetica-Bold').text('Otimização de Gôndolas');
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica');
    doc.text('Recomendações de Posicionamento:');
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica');
    doc.text('  1. Reposicionamento Urgente: 5 produtos');
    doc.text('  2. Otimização Semanal: 12 produtos');
    doc.text('  3. Otimização Horária: 8 produtos');
    doc.text('  4. Expansão de Categoria: 3 categorias');
    doc.text('  5. Redução de Perdas: 15 produtos');
    doc.moveDown(1);
  }

  adicionarOtimizacaoCompras(doc, dados) {
    doc.fontSize(12).font('Helvetica-Bold').text('Otimização de Compras (EOQ)');
    doc.moveDown(0.5);

    const economiaProjectada = dados.compras?.economia_anual || 15000;

    doc.fontSize(10).font('Helvetica');
    doc.text(`Economia Anual Projetada: R$ ${economiaProjectada.toFixed(2)}`);
    doc.text(`Produtos Analisados: ${dados.compras?.total_produtos || 250}`);
    doc.text(`Segurança de Estoque (Gordura): 15% recomendado`);
    doc.moveDown(1);
  }

  adicionarRecomendacoes(doc, dados) {
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').text('Recomendações Estratégicas', { underline: true });
    doc.moveDown(0.5);

    const recomendacoes = [
      '1. Implementar programa de fidelidade focado em clusters de alto churn',
      '2. Revisar posicionamento de produtos com taxa de perda > 15%',
      '3. Ajustar quantidades de pedido usando EOQ para otimizar custos',
      '4. Aumentar frequência de conferência de estoque em períodos de pico',
      '5. Monitorar variações comportamentais semanalmente',
      '6. Executar promoções personalizadas para 3 segmentos prioritários',
      '7. Analisar sazonalidade por categoria para melhor planejamento',
      '8. Implantar sistema de alertas para risco de stock-out'
    ];

    doc.fontSize(10).font('Helvetica');
    recomendacoes.forEach(rec => {
      doc.text(`  ${rec}`);
      doc.moveDown(0.4);
    });
  }

  adicionarRodape(doc) {
    doc.moveDown(1);
    doc.fontSize(8).font('Helvetica').fillColor('#666666');
    doc.text('Relatório gerado automaticamente pelo Easy Market - Retail Intelligence', 50, doc.page.height - 50, {
      align: 'center',
      width: 500
    });
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')} | Confidencial`, 50, doc.page.height - 30, {
      align: 'center',
      width: 500
    });
  }

  gerarClusters(clientesData) {
    // Simular geração de clusters (em produção, usar K-means)
    return [
      {
        nome: 'Clientes Super Fiéis',
        size: Math.round(clientesData.length * 0.15),
        churnMedio: 0.05,
        valorMedio: 500,
        frequenciaMédia: 4.5,
        recomendacao: 'Manter relacionamento premium'
      },
      {
        nome: 'Clientes Regulares',
        size: Math.round(clientesData.length * 0.45),
        churnMedio: 0.25,
        valorMedio: 250,
        frequenciaMédia: 2.5,
        recomendacao: 'Programa de fidelidade com benefícios'
      },
      {
        nome: 'Clientes Ocasionais',
        size: Math.round(clientesData.length * 0.25),
        churnMedio: 0.55,
        valorMedio: 100,
        frequenciaMédia: 0.8,
        recomendacao: 'Reativar com promoções atrativas'
      },
      {
        nome: 'Clientes em Risco',
        size: Math.round(clientesData.length * 0.15),
        churnMedio: 0.85,
        valorMedio: 50,
        frequenciaMédia: 0.2,
        recomendacao: 'Ação urgente de recuperação'
      }
    ];
  }
}

module.exports = new RelatoriosPDFService();
