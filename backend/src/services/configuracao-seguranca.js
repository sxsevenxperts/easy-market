/**
 * Configuração de Segurança e Taxas - Smart Market
 * Gerencia taxas de segurança para produtos e categorias
 */

const logger = require('../config/logger');

class ConfiguracaoSeguranca {
  constructor(pool, supabase) {
    this.pool = pool;
    this.supabase = supabase;
    this.cache = new Map();
  }

  /**
   * Get taxa de segurança padrão da loja
   */
  async getTaxaPadraoLoja(loja_id) {
    try {
      const { data } = await this.supabase
        .from('configuracao_seguranca')
        .select('taxa_padrao')
        .eq('loja_id', loja_id)
        .single();

      return data?.taxa_padrao || 0.03; // 3% padrão
    } catch (error) {
      logger.warn(`Erro ao obter taxa padrão para ${loja_id}:`, error.message);
      return 0.03;
    }
  }

  /**
   * Get taxa por categoria
   */
  async getTaxaCategoria(loja_id, categoria) {
    try {
      const { data } = await this.supabase
        .from('configuracao_seguranca_categoria')
        .select('taxa')
        .eq('loja_id', loja_id)
        .eq('categoria', categoria)
        .single();

      return data?.taxa || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get taxa customizada por produto
   */
  async getTaxaProduto(loja_id, produto_id) {
    try {
      const { data } = await this.supabase
        .from('configuracao_seguranca_produto')
        .select('taxa')
        .eq('loja_id', loja_id)
        .eq('produto_id', produto_id)
        .single();

      return data?.taxa || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Set taxa padrão da loja
   */
  async setTaxaPadrao(loja_id, taxa) {
    try {
      const { error } = await this.supabase
        .from('configuracao_seguranca')
        .upsert({
          loja_id,
          taxa_padrao: taxa,
          atualizado_em: new Date().toISOString(),
        });

      if (error) throw error;

      this.cache.delete(`taxa_padrao_${loja_id}`);
      logger.info(`Taxa padrão atualizada para ${loja_id}: ${taxa}`);

      return { sucesso: true, taxa };
    } catch (error) {
      logger.error(`Erro ao atualizar taxa padrão:`, error);
      throw error;
    }
  }

  /**
   * Set taxa por categoria
   */
  async setTaxaCategoria(loja_id, categoria, taxa) {
    try {
      const { error } = await this.supabase
        .from('configuracao_seguranca_categoria')
        .upsert({
          loja_id,
          categoria,
          taxa,
          atualizado_em: new Date().toISOString(),
        });

      if (error) throw error;

      logger.info(`Taxa de ${categoria} atualizada: ${taxa}`);
      return { sucesso: true, categoria, taxa };
    } catch (error) {
      logger.error(`Erro ao atualizar taxa de categoria:`, error);
      throw error;
    }
  }

  /**
   * Set taxa customizada por produto
   */
  async setTaxaProduto(loja_id, produto_id, taxa) {
    try {
      const { error } = await this.supabase
        .from('configuracao_seguranca_produto')
        .upsert({
          loja_id,
          produto_id,
          taxa,
          atualizado_em: new Date().toISOString(),
        });

      if (error) throw error;

      logger.info(`Taxa customizada definida para produto ${produto_id}: ${taxa}`);
      return { sucesso: true, produto_id, taxa };
    } catch (error) {
      logger.error(`Erro ao atualizar taxa do produto:`, error);
      throw error;
    }
  }

  /**
   * Obter configuração completa da loja
   */
  async obterConfiguracao(loja_id) {
    try {
      const [taxaPadrao, categorias, produtos] = await Promise.all([
        this.getTaxaPadraoLoja(loja_id),
        this.supabase.from('configuracao_seguranca_categoria').select('*').eq('loja_id', loja_id),
        this.supabase.from('configuracao_seguranca_produto').select('*').eq('loja_id', loja_id),
      ]);

      return {
        sucesso: true,
        taxa_padrao: taxaPadrao,
        categorias: categorias.data || [],
        produtos: produtos.data || [],
      };
    } catch (error) {
      logger.error('Erro ao obter configuração completa:', error);
      return {
        sucesso: false,
        erro: error.message,
      };
    }
  }

  /**
   * Calcular taxa efetiva para um produto
   */
  async calcularTaxaEfetiva(loja_id, produto_id, categoria) {
    try {
      // Verificar taxa customizada do produto
      const taxaProduto = await this.getTaxaProduto(loja_id, produto_id);
      if (taxaProduto) return taxaProduto;

      // Verificar taxa da categoria
      const taxaCategoria = await this.getTaxaCategoria(loja_id, categoria);
      if (taxaCategoria) return taxaCategoria;

      // Retornar taxa padrão
      return await this.getTaxaPadraoLoja(loja_id);
    } catch (error) {
      logger.error('Erro ao calcular taxa efetiva:', error);
      return 0.03; // Fallback
    }
  }
}

module.exports = ConfiguracaoSeguranca;
