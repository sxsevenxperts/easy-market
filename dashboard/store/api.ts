/**
 * API Integration Store (Zustand)
 * Centraliza todas as chamadas aos 25 endpoints do backend
 */

import axios from 'axios';
import { create } from 'zustand';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Instância axios com auth token
const apiClient = axios.create({ baseURL: API_URL });
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers = config.headers ?? {};
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

interface ApiStore {
  // Predicoes
  fetchPredictionsAnalysis: (lojaId: number, clienteId: number) => Promise<any>;
  fetchChurnScore: (lojaId: number, clienteId: number) => Promise<any>;
  fetchBrandAnalysis: (lojaId: number, clienteId: number) => Promise<any>;
  fetchOpportunities: (lojaId: number, clienteId: number) => Promise<any>;
  
  // Perdas
  fetchLossRate: (lojaId: number) => Promise<any>;
  fetchLossReduction: (lojaId: number) => Promise<any>;
  fetchProductsHighLoss: (lojaId: number) => Promise<any>;
  
  // Otimizacao Gondolas
  fetchGondolaAnalysis: (lojaId: number) => Promise<any>;
  fetchGondolaRecommendations: (lojaId: number) => Promise<any>;
  fetchGondolaLayout: (lojaId: number) => Promise<any>;
  fetchGondolaComplete: (lojaId: number) => Promise<any>;
  
  // Otimizacao Nutricional
  fetchNutritionalProfile: (lojaId: number) => Promise<any>;
  fetchNutritionalClassification: (lojaId: number) => Promise<any>;
  fetchComplementarityMatrix: (lojaId: number) => Promise<any>;
  
  // Otimizacao Compras
  fetchOptimalQuantity: (lojaId: number, produtoId: number, gordura?: number) => Promise<any>;
  fetchPurchaseAnalysis: (lojaId: number) => Promise<any>;
  fetchPurchaseScenarios: (lojaId: number, produtoId: number) => Promise<any>;
  fetchStockoutRisk: (lojaId: number) => Promise<any>;
  
  // Configuracao Seguranca
  fetchSecurityConfig: (lojaId: number) => Promise<any>;
  updateSecurityConfig: (lojaId: number, taxa: number) => Promise<any>;
  setProductSecurityRate: (lojaId: number, produtoId: number, taxa: number, obs?: string) => Promise<any>;
  
  // Utility
  isLoading: boolean;
  error: string | null;
}

export const useApiStore = create<ApiStore>((set) => ({
  isLoading: false,
  error: null,

  // PREDICOES
  fetchPredictionsAnalysis: async (lojaId, clienteId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get(`${API_URL}/predicoes/cliente/${clienteId}?loja_id=${lojaId}`);
      return res.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchChurnScore: async (lojaId, clienteId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get(`${API_URL}/predicoes/churn/${clienteId}?loja_id=${lojaId}`);
      return res.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchBrandAnalysis: async (lojaId, clienteId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get(`${API_URL}/predicoes/marca/${clienteId}?loja_id=${lojaId}`);
      return res.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchOpportunities: async (lojaId, clienteId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get(`${API_URL}/predicoes/oportunidades/${clienteId}?loja_id=${lojaId}`);
      return res.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // PERDAS
  fetchLossRate: async (lojaId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get(`${API_URL}/perdas/taxa-atual/${lojaId}`);
      return res.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLossReduction: async (lojaId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get(`${API_URL}/perdas/reducao/${lojaId}`);
      return res.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProductsHighLoss: async (lojaId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get(`${API_URL}/perdas/produtos-maior-perda/${lojaId}`);
      return res.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // GONDOLAS
  fetchGondolaAnalysis: async (lojaId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get(`${API_URL}/otimizacao-gondolas/analise/${lojaId}`);
      return res.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchGondolaRecommendations: async (lojaId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get(`${API_URL}/otimizacao-gondolas/recomendacoes/${lojaId}`);
      return res.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchGondolaLayout: async (lojaId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get(`${API_URL}/otimizacao-gondolas/layout/${lojaId}`);
      return res.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchGondolaComplete: async (lojaId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get(`${API_URL}/otimizacao-gondolas/completo/${lojaId}`);
      return res.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // NUTRICIONAL
  fetchNutritionalProfile: async (lojaId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get(`${API_URL}/otimizacao-nutricional/perfil/${lojaId}`);
      return res.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchNutritionalClassification: async (lojaId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get(`${API_URL}/otimizacao-nutricional/classificacao/${lojaId}`);
      return res.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchComplementarityMatrix: async (lojaId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get(`${API_URL}/otimizacao-nutricional/complementaridade/${lojaId}`);
      return res.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // COMPRAS
  fetchOptimalQuantity: async (lojaId, produtoId, gordura = 0.15) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get(`${API_URL}/otimizacao-compras/quantidade-otima/${lojaId}/${produtoId}?gordura=${gordura}`);
      return res.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPurchaseAnalysis: async (lojaId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get(`${API_URL}/otimizacao-compras/analise-loja/${lojaId}`);
      return res.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPurchaseScenarios: async (lojaId, produtoId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get(`${API_URL}/otimizacao-compras/cenarios/${lojaId}/${produtoId}`);
      return res.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStockoutRisk: async (lojaId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get(`${API_URL}/otimizacao-compras/risco-falta/${lojaId}`);
      return res.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // CONFIGURACAO
  fetchSecurityConfig: async (lojaId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get(`${API_URL}/configuracao-seguranca/loja/${lojaId}`);
      return res.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateSecurityConfig: async (lojaId, taxa) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.put(`${API_URL}/configuracao-seguranca/loja/${lojaId}/taxa-padrao`, {
        taxa_padrao: taxa
      });
      return res.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setProductSecurityRate: async (lojaId, produtoId, taxa, obs = '') => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.put(
        `${API_URL}/configuracao-seguranca/loja/${lojaId}/produto/${produtoId}/taxa-customizada`,
        { taxa, observacoes: obs }
      );
      return res.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
