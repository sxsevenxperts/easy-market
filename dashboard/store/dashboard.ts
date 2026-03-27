import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DashboardStore {
  loja_id: string;
  loja_name: string;
  user_name: string;
  api_key: string;
  theme: 'light' | 'dark';
  setLojaId: (id: string) => void;
  setLojaName: (name: string) => void;
  setUserName: (name: string) => void;
  setApiKey: (key: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  reset: () => void;
}

// Valores padrão — o persist middleware cuida da hidratação via localStorage
const initialState = {
  loja_id: 'loja_001',
  loja_name: 'Loja Principal',
  user_name: 'Usuário',
  api_key: '',
  theme: 'dark' as const,
};

export const useStore = create<DashboardStore>()(
  persist(
    (set) => ({
      ...initialState,
      setLojaId: (id: string) => set({ loja_id: id }),
      setLojaName: (name: string) => set({ loja_name: name }),
      setUserName: (name: string) => set({ user_name: name }),
      setApiKey: (key: string) => set({ api_key: key }),
      setTheme: (theme: 'light' | 'dark') => set({ theme }),
      reset: () =>
        set({
          loja_id: 'loja_001',
          loja_name: 'Loja Principal',
          user_name: 'Usuário',
          api_key: '',
          theme: 'dark',
        }),
    }),
    {
      name: 'dashboard-store',
    }
  )
);
