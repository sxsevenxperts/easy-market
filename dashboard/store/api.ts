/**
 * API Integration Store (Zustand)
 * Centraliza todas as chamadas aos 25 endpoints do backend.
 * Usa a instância axios canônica de lib/api.ts (com interceptor 401 → /login).
 */

import { create } from 'zustand';
import { apiClient } from '@/lib/api';

// ─── Tipos de retorno ────────────────────────────────────────────────────────

export interface PredictionAnalysis {
  cliente_id: string;
  segmento: string;
  probabilidade_compra: number;
  produtos_recomendados: string[];
}

export interface ChurnScore {
  cliente_id: string;
  score: number;
  risco: 'alto' | 'medio' | 'baixo';
}

export interface LossData {
  taxa: number;
  valor_estimado: number;
  periodo: string;
}

export interface GondolaData {
  posicoes: Array<{
    id: string;
    produto_id: string;
    corredor: number;
    prateleira: string;
    status: string;
  }>;
}

export interface SecurityConfig {
  taxa_padrao: number;
  produtos_customizados: Array<{ produto_id: string; taxa: number }>;
}

// ─── Interface do Store ──────────────────────────────────────────────────────

interface ApiStore {
  // loadingCount ao invés de boolean — evita race condition com múltiplas requests
  loadingCount: number;
  error: string | null;

  // Predicoes
  fetchPredictionsAnalysis: (lojaId: string, clienteId: string) => Promise<PredictionAnalysis>;
  fetchChurnScore: (lojaId: string, clienteId: string) => Promise<ChurnScore>;
  fetchBrandAnalysis: (lojaId: string, clienteId: string) => Promise<unknown>;
  fetchOpportunities: (lojaId: string, clienteId: string) => Promise<unknown>;

  // Perdas
  fetchLossRate: (lojaId: string) => Promise<LossData>;
  fetchLossReduction: (lojaId: string) => Promise<LossData>;
  fetchProductsHighLoss: (lojaId: string) => Promise<unknown>;

  // Otimizacao Gondolas
  fetchGondolaAnalysis: (lojaId: string) => Promise<GondolaData>;
  fetchGondolaRecommendations: (lojaId: string) => Promise<unknown>;
  fetchGondolaLayout: (lojaId: string) => Promise<GondolaData>;
  fetchGondolaComplete: (lojaId: string) => Promise<GondolaData>;

  // Otimizacao Nutricional
  fetchNutritionalProfile: (lojaId: string) => Promise<unknown>;
  fetchNutritionalClassification: (lojaId: string) => Promise<unknown>;
  fetchComplementarityMatrix: (lojaId: string) => Promise<unknown>;

  // Otimizacao Compras
  fetchOptimalQuantity: (lojaId: string, produtoId: string, gordura?: number) => Promise<unknown>;
  fetchPurchaseAnalysis: (lojaId: string) => Promise<unknown>;
  fetchPurchaseScenarios: (lojaId: string, produtoId: string) => Promise<unknown>;
  fetchStockoutRisk: (lojaId: string) => Promise<unknown>;

  // Configuracao Seguranca
  fetchSecurityConfig: (lojaId: string) => Promise<SecurityConfig>;
  updateSecurityConfig: (lojaId: string, taxa: number) => Promise<SecurityConfig>;
  setProductSecurityRate: (lojaId: string, produtoId: string, taxa: number, obs?: string) => Promise<unknown>;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function makeRequest<T>(
  set: (partial: Partial<ApiStore>) => void,
  get: () => ApiStore,
  fn: () => Promise<T>
): Promise<T> {
  set({ loadingCount: get().loadingCount + 1, error: null });
  return fn()
    .catch((error: Error) => {
      set({ error: error.message });
      throw error;
    })
    .finally(() => {
      set({ loadingCount: get().loadingCount - 1 });
    });
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useApiStore = create<ApiStore>((set, get) => ({
  loadingCount: 0,
  error: null,

  // PREDICOES
  fetchPredictionsAnalysis: (lojaId, clienteId) =>
    makeRequest(set, get, () =>
      apiClient.get(`/predicoes/cliente/${clienteId}?loja_id=${lojaId}`).then((r) => r.data)
    ),

  fetchChurnScore: (lojaId, clienteId) =>
    makeRequest(set, get, () =>
      apiClient.get(`/predicoes/churn/${clienteId}?loja_id=${lojaId}`).then((r) => r.data)
    ),

  fetchBrandAnalysis: (lojaId, clienteId) =>
    makeRequest(set, get, () =>
      apiClient.get(`/predicoes/marca/${clienteId}?loja_id=${lojaId}`).then((r) => r.data)
    ),

  fetchOpportunities: (lojaId, clienteId) =>
    makeRequest(set, get, () =>
      apiClient.get(`/predicoes/oportunidades/${clienteId}?loja_id=${lojaId}`).then((r) => r.data)
    ),

  // PERDAS
  fetchLossRate: (lojaId) =>
    makeRequest(set, get, () =>
      apiClient.get(`/perdas/taxa-atual/${lojaId}`).then((r) => r.data)
    ),

  fetchLossReduction: (lojaId) =>
    makeRequest(set, get, () =>
      apiClient.get(`/perdas/reducao/${lojaId}`).then((r) => r.data)
    ),

  fetchProductsHighLoss: (lojaId) =>
    makeRequest(set, get, () =>
      apiClient.get(`/perdas/produtos-maior-perda/${lojaId}`).then((r) => r.data)
    ),

  // GONDOLAS
  fetchGondolaAnalysis: (lojaId) =>
    makeRequest(set, get, () =>
      apiClient.get(`/otimizacao-gondolas/analise/${lojaId}`).then((r) => r.data)
    ),

  fetchGondolaRecommendations: (lojaId) =>
    makeRequest(set, get, () =>
      apiClient.get(`/otimizacao-gondolas/recomendacoes/${lojaId}`).then((r) => r.data)
    ),

  fetchGondolaLayout: (lojaId) =>
    makeRequest(set, get, () =>
      apiClient.get(`/otimizacao-gondolas/layout/${lojaId}`).then((r) => r.data)
    ),

  fetchGondolaComplete: (lojaId) =>
    makeRequest(set, get, () =>
      apiClient.get(`/otimizacao-gondolas/completo/${lojaId}`).then((r) => r.data)
    ),

  // NUTRICIONAL
  fetchNutritionalProfile: (lojaId) =>
    makeRequest(set, get, () =>
      apiClient.get(`/otimizacao-nutricional/perfil/${lojaId}`).then((r) => r.data)
    ),

  fetchNutritionalClassification: (lojaId) =>
    makeRequest(set, get, () =>
      apiClient.get(`/otimizacao-nutricional/classificacao/${lojaId}`).then((r) => r.data)
    ),

  fetchComplementarityMatrix: (lojaId) =>
    makeRequest(set, get, () =>
      apiClient.get(`/otimizacao-nutricional/complementaridade/${lojaId}`).then((r) => r.data)
    ),

  // COMPRAS
  fetchOptimalQuantity: (lojaId, produtoId, gordura = 0.15) =>
    makeRequest(set, get, () =>
      apiClient
        .get(`/otimizacao-compras/quantidade-otima/${lojaId}/${produtoId}?gordura=${gordura}`)
        .then((r) => r.data)
    ),

  fetchPurchaseAnalysis: (lojaId) =>
    makeRequest(set, get, () =>
      apiClient.get(`/otimizacao-compras/analise-loja/${lojaId}`).then((r) => r.data)
    ),

  fetchPurchaseScenarios: (lojaId, produtoId) =>
    makeRequest(set, get, () =>
      apiClient.get(`/otimizacao-compras/cenarios/${lojaId}/${produtoId}`).then((r) => r.data)
    ),

  fetchStockoutRisk: (lojaId) =>
    makeRequest(set, get, () =>
      apiClient.get(`/otimizacao-compras/risco-falta/${lojaId}`).then((r) => r.data)
    ),

  // CONFIGURACAO
  fetchSecurityConfig: (lojaId) =>
    makeRequest(set, get, () =>
      apiClient.get(`/configuracao-seguranca/loja/${lojaId}`).then((r) => r.data)
    ),

  updateSecurityConfig: (lojaId, taxa) =>
    makeRequest(set, get, () =>
      apiClient
        .put(`/configuracao-seguranca/loja/${lojaId}/taxa-padrao`, { taxa_padrao: taxa })
        .then((r) => r.data)
    ),

  setProductSecurityRate: (lojaId, produtoId, taxa, obs = '') =>
    makeRequest(set, get, () =>
      apiClient
        .put(`/configuracao-seguranca/loja/${lojaId}/produto/${produtoId}/taxa-customizada`, {
          taxa,
          observacoes: obs,
        })
        .then((r) => r.data)
    ),
}));

// Selector conveniente para verificar se há alguma request em andamento
export const selectIsLoading = (state: ApiStore) => state.loadingCount > 0;
