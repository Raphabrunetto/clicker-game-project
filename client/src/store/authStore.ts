// src/store/authStore.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// 1. Definimos a "forma" do nosso estado (só com o token)
interface AuthState {
  token: string | null;
  setToken: (token: string) => void; // <--- Mudou aqui
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Estado inicial
      token: null,

      // Ação para fazer login (agora só recebe o token)
      setToken: (token: string) => { // <--- Mudou aqui
        set({ token });
      },

      // Ação para fazer logout
      logout: () => {
        set({ token: null });
      },
    }),
    {
      name: 'clicker-game-auth', 
      storage: createJSONStorage(() => localStorage), 
    }
  )
);