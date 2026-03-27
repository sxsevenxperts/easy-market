const express = require('express');
const router = express.Router();

/**
 * GET /:loja_id - Get dashboard data for a store
 */
router.get('/:loja_id', async (req, res) => {
  try {
    const { loja_id } = req.params;
    const { periodo = 'hoje' } = req.query;

    const supabase = req.supabase;

    // Try to fetch real data from Supabase
    if (supabase) {
      try {
        const { data: vendas, error: vendError } = await supabase
          .from('vendas')
          .select('*')
          .eq('loja_id', loja_id)
          .limit(100);

        if (!vendError && vendas && vendas.length > 0) {
          const totalVendido = vendas.reduce((sum, v) => sum + (v.valor || 0), 0);
          const quantidade = vendas.length;

          return res.json({
            sucesso: true,
            loja_id,
            periodo,
            resumo: {
              faturamento: totalVendido,
              transacoes: quantidade,
              ticket_medio: totalVendido / quantidade,
              items_vendidos: vendas.reduce((sum, v) => sum + (v.quantidade || 1), 0)
            },
            alertas: [],
            predicoes: {
              vendas_amanha: Math.round(totalVendido * 1.05),
              margem_bruta_estimada: Math.round(totalVendido * 0.35)
            }
          });
        }
      } catch (e) {
        console.warn('[Dashboard] Supabase fetch failed:', e.message);
      }
    }

    // Return mock data if Supabase not available or no data
    res.json({
      sucesso: true,
      loja_id,
      periodo,
      resumo: {
        faturamento: 12500.50,
        transacoes: 145,
        ticket_medio: 86.21,
        items_vendidos: 287
      },
      alertas: [
        {
          id: 1,
          tipo: 'estoque_critico',
          titulo: 'Estoque crítico detectado',
          mensagem: '5 produtos com estoque baixo',
          urgencia: 'alta',
          roi_estimado: 2500
        }
      ],
      predicoes: {
        vendas_amanha: 13100,
        margem_bruta_estimada: 4375,
        churn_risco: 0.08,
        cross_sell_oportunidade: 1200
      },
      mock: true
    });
  } catch (error) {
    console.error('[Dashboard] Error:', error.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao recuperar dashboard'
    });
  }
});

module.exports = router;
