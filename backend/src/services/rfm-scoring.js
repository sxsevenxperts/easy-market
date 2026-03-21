'use strict';

class RFMScoringService {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;

    this.weights = {
      recencia:    0.30,
      frequencia:  0.25,
      monetario:   0.20,
      fidelidade:  0.15,
      engajamento: 0.10,
    };
  }

  // ─── Score helpers ────────────────────────────────────────────────────────

  _scoreRecencia(diasDesdeUltimaCompra) {
    if (diasDesdeUltimaCompra <= 7)  return 5;
    if (diasDesdeUltimaCompra <= 30) return 4;
    if (diasDesdeUltimaCompra <= 60) return 3;
    if (diasDesdeUltimaCompra <= 90) return 2;
    return 1;
  }

  _scoreFrequencia(comprasPorMes) {
    if (comprasPorMes >= 20) return 5;
    if (comprasPorMes >= 10) return 4;
    if (comprasPorMes >= 5)  return 3;
    if (comprasPorMes >= 2)  return 2;
    return 1;
  }

  _scoreMonetario(ticketMedio) {
    if (ticketMedio >= 500) return 5;
    if (ticketMedio >= 200) return 4;
    if (ticketMedio >= 100) return 3;
    if (ticketMedio >= 50)  return 2;
    return 1;
  }

  _scoreFidelidade(mesesComoCliente) {
    if (mesesComoCliente >= 24) return 5;
    if (mesesComoCliente >= 12) return 4;
    if (mesesComoCliente >= 6)  return 3;
    if (mesesComoCliente >= 3)  return 2;
    return 1;
  }

  _scoreEngajamento(categoriasDistintas) {
    if (categoriasDistintas >= 8) return 5;
    if (categoriasDistintas >= 5) return 4;
    if (categoriasDistintas >= 3) return 3;
    if (categoriasDistintas >= 2) return 2;
    return 1;
  }

  _calcularScoreFinal(r, f, m, fid, e) {
    const { recencia, frequencia, monetario, fidelidade, engajamento } = this.weights;
    return (r * recencia + f * frequencia + m * monetario + fid * fidelidade + e * engajamento) * 20;
  }

  _determinarSegmento(score, r, f) {
    if (score >= 85 && r === 5 && f === 5)          return 'Champions';
    if (score >= 70 && r >= 4 && f >= 4)             return 'Loyal Customers';
    if (score >= 60 && r >= 4 && f === 3)            return 'Potential Loyalists';
    if (score >= 50 && r === 5 && f === 1)           return 'New Customers';
    if (score >= 45 && r >= 4 && f <= 2)             return 'Promising';
    if (score >= 35 && r === 3 && f === 3)           return 'Need Attention';
    if (score >= 25 && r === 2 && f <= 3)            return 'About To Sleep';
    if (score >= 15 && r <= 2 && f >= 3)             return 'At Risk';
    if (score >= 10 && r === 1 && f >= 4)            return 'Cant Lose Them';
    return 'Lost';
  }


  // ─── Simulated data fallback ──────────────────────────────────────────────

  _gerarDadosSimulados(lojaId, clienteId = null) {
    const seed = (lojaId + (clienteId || '')).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const rand = (min, max, offset = 0) => {
      const x = Math.sin(seed + offset) * 10000;
      const frac = x - Math.floor(x);
      return Math.floor(frac * (max - min + 1)) + min;
    };

    const dias     = rand(1, 120, 1);
    const compras  = rand(1, 25, 2);
    const ticket   = rand(20, 600, 3);
    const meses    = rand(1, 36, 4);
    const cats     = rand(1, 10, 5);

    return { diasDesdeUltimaCompra: dias, comprasPorMes: compras,
             ticketMedio: ticket, mesesComoCliente: meses, categoriasDistintas: cats };
  }

  _montarScoreObjeto(clienteId, nome, dados) {
    const r   = this._scoreRecencia(dados.diasDesdeUltimaCompra);
    const f   = this._scoreFrequencia(dados.comprasPorMes);
    const m   = this._scoreMonetario(dados.ticketMedio);
    const fid = this._scoreFidelidade(dados.mesesComoCliente);
    const e   = this._scoreEngajamento(dados.categoriasDistintas);
    const score = parseFloat(this._calcularScoreFinal(r, f, m, fid, e).toFixed(2));
    const segmento = this._determinarSegmento(score, r, f);

    return {
      clienteId, nome, score, segmento,
      dimensoes: { recencia: r, frequencia: f, monetario: m, fidelidade: fid, engajamento: e },
      metricas: {
        diasDesdeUltimaCompra: dados.diasDesdeUltimaCompra,
        comprasPorMes: dados.comprasPorMes,
        ticketMedio: dados.ticketMedio,
        mesesComoCliente: dados.mesesComoCliente,
        categoriasDistintas: dados.categoriasDistintas,
      },
    };
  }


  // ─── Public methods ───────────────────────────────────────────────────────

  async calcularRFMCliente(lojaId, clienteId) {
    try {
      let dados = null;
      let nomeCliente = `Cliente ${clienteId}`;

      if (this.supabase) {
        const { data: pedidos } = await this.supabase
          .from('pedidos')
          .select('id, created_at, valor_total, items')
          .eq('loja_id', lojaId)
          .eq('cliente_id', clienteId)
          .order('created_at', { ascending: false });

        const { data: cliente } = await this.supabase
          .from('clientes')
          .select('id, nome, created_at')
          .eq('loja_id', lojaId)
          .eq('id', clienteId)
          .single();

        if (pedidos && pedidos.length > 0 && cliente) {
          nomeCliente = cliente.nome || nomeCliente;
          const agora = new Date();
          const ultima = new Date(pedidos[0].created_at);
          const primeiraCompra = new Date(cliente.created_at);
          const diasDesdeUltimaCompra = Math.floor((agora - ultima) / 86400000);
          const mesesComoCliente = Math.floor((agora - primeiraCompra) / (86400000 * 30));
          const comprasPorMes = mesesComoCliente > 0 ? pedidos.length / mesesComoCliente : pedidos.length;
          const ticketMedio = pedidos.reduce((s, p) => s + (p.valor_total || 0), 0) / pedidos.length;
          const todasCategorias = new Set(pedidos.flatMap(p => (p.items || []).map(i => i.categoria)).filter(Boolean));
          dados = { diasDesdeUltimaCompra, comprasPorMes, ticketMedio, mesesComoCliente, categoriasDistintas: todasCategorias.size };
        }
      }

      if (!dados) {
        dados = this._gerarDadosSimulados(lojaId, clienteId);
      }

      return this._montarScoreObjeto(clienteId, nomeCliente, dados);
    } catch (err) {
      const dados = this._gerarDadosSimulados(lojaId, clienteId);
      return this._montarScoreObjeto(clienteId, `Cliente ${clienteId}`, dados);
    }
  }


  async segmentarTodosClientes(lojaId) {
    try {
      let clientes = [];

      if (this.supabase) {
        const { data } = await this.supabase
          .from('clientes')
          .select('id, nome')
          .eq('loja_id', lojaId);
        if (data && data.length > 0) clientes = data;
      }

      if (clientes.length === 0) {
        // Simula entre 30 e 80 clientes para a loja
        const qtd = 30 + ((lojaId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 51);
        clientes = Array.from({ length: qtd }, (_, i) => ({
          id: `sim-${lojaId}-${i + 1}`,
          nome: `Cliente Simulado ${i + 1}`,
        }));
      }

      const scores = await Promise.all(
        clientes.map(c => this.calcularRFMCliente(lojaId, c.id))
      );

      const agrupado = {};
      for (const s of scores) {
        if (!agrupado[s.segmento]) agrupado[s.segmento] = [];
        agrupado[s.segmento].push(s);
      }

      return {
        total: scores.length,
        segmentos: agrupado,
        resumo: Object.entries(agrupado).map(([seg, lista]) => ({
          segmento: seg,
          quantidade: lista.length,
          scoreMediao: parseFloat((lista.reduce((a, c) => a + c.score, 0) / lista.length).toFixed(2)),
        })),
      };
    } catch (err) {
      return { total: 0, segmentos: {}, resumo: [], erro: err.message };
    }
  }

  async obterTopClientes(lojaId, limite = 10) {
    const { segmentos } = await this.segmentarTodosClientes(lojaId);
    const todos = Object.values(segmentos).flat();
    return todos.sort((a, b) => b.score - a.score).slice(0, limite);
  }

  async obterClientesRisco(lojaId) {
    const { segmentos } = await this.segmentarTodosClientes(lojaId);
    const segmentosRisco = ['At Risk', 'Cant Lose Them', 'About To Sleep', 'Lost'];
    return segmentosRisco.flatMap(seg => segmentos[seg] || []);
  }


  obterRecomendacoesPorSegmento(segmento) {
    const recomendacoes = {
      'Champions': {
        acoes: [
          'Ofereça acesso antecipado a novos produtos',
          'Crie programa de embaixadores da marca',
          'Envie presentes ou brindes exclusivos',
          'Solicite avaliações e depoimentos',
        ],
        canal: 'WhatsApp / E-mail personalizado',
        urgencia: 'baixa',
        desconto_sugerido: '5% como reconhecimento',
      },
      'Loyal Customers': {
        acoes: [
          'Programa de pontos e recompensas',
          'Desconto progressivo por fidelidade',
          'Convite para eventos exclusivos',
          'Cross-sell de produtos complementares',
        ],
        canal: 'E-mail + Push Notification',
        urgencia: 'baixa',
        desconto_sugerido: '10%',
      },
      'Potential Loyalists': {
        acoes: [
          'Oferta de membership/assinatura',
          'Cupom para próxima compra',
          'Recomendações personalizadas',
          'Programa de indicação',
        ],
        canal: 'E-mail + SMS',
        urgencia: 'media',
        desconto_sugerido: '15%',
      },
      'New Customers': {
        acoes: [
          'Sequência de onboarding por e-mail',
          'Desconto na segunda compra',
          'Guia de melhores produtos',
          'Suporte proativo pós-compra',
        ],
        canal: 'E-mail automatizado',
        urgencia: 'media',
        desconto_sugerido: '10% na segunda compra',
      },
      'Promising': {
        acoes: [
          'Campanha de reativação suave',
          'Mostrar novidades e lançamentos',
          'Oferta por tempo limitado',
        ],
        canal: 'E-mail / WhatsApp',
        urgencia: 'media',
        desconto_sugerido: '15%',
      },
      'Need Attention': {
        acoes: [
          'Oferta personalizada baseada no histórico',
          'Pesquisa de satisfação',
          'Cupom de reengajamento',
        ],
        canal: 'E-mail + Retargeting',
        urgencia: 'media-alta',
        desconto_sugerido: '20%',
      },
      'About To Sleep': {
        acoes: [
          'Campanha "Sentimos sua falta"',
          'Desconto agressivo por tempo limitado',
          'Mostrar produtos mais vendidos',
          'Contato humano via WhatsApp',
        ],
        canal: 'WhatsApp + E-mail',
        urgencia: 'alta',
        desconto_sugerido: '25%',
      },
      'At Risk': {
        acoes: [
          'Oferta de reativação urgente',
          'Entender motivo do abandono (pesquisa)',
          'Desconto significativo',
          'Contato direto do gerente de conta',
        ],
        canal: 'WhatsApp + Ligação',
        urgencia: 'alta',
        desconto_sugerido: '30%',
      },
      'Cant Lose Them': {
        acoes: [
          'Contato pessoal imediato',
          'Proposta exclusiva de retenção',
          'Investigar insatisfação',
          'Oferta irrecusável',
        ],
        canal: 'Ligação + WhatsApp personalizado',
        urgencia: 'critica',
        desconto_sugerido: '35% ou condição especial',
      },
      'Lost': {
        acoes: [
          'Campanha de win-back com oferta agressiva',
          'E-mail de "última chance"',
          'Pesquisa de motivo de saída',
          'Considerar remover da lista ativa se sem resposta',
        ],
        canal: 'E-mail',
        urgencia: 'baixa',
        desconto_sugerido: '40% ou frete grátis',
      },
    };

    return recomendacoes[segmento] || {
      acoes: ['Segmento não reconhecido — revisar dados do cliente'],
      canal: 'A definir',
      urgencia: 'indefinida',
      desconto_sugerido: 'N/A',
    };
  }
}

module.exports = RFMScoringService;
