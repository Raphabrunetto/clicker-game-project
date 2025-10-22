// src/store/authStore.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Utilitário simples para decodificar JWT (apenas o payload)
function decodeJwt<T = any>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    // base64url -> base64 com padding
    let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = payload.length % 4;
    if (pad) payload += '='.repeat(4 - pad);
    const json = decodeURIComponent(
      atob(payload)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

// 1. Definimos a "forma" do nosso estado (só com o token)
interface AuthState {
  token: string | null;
  userId: string | null;
  username: string | null;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      token: null,
      userId: null,
      username: null,

      // Ação para fazer login (agora só recebe o token)
      setToken: (token: string) => {
        // Decodifica o token para obter sub/username
        const payload = decodeJwt<{ sub?: string; username?: string }>(token);
        set({
          token,
          userId: payload?.sub ?? null,
          username: payload?.username ?? null,
        });
      },

      // Ação para fazer logout
      logout: () => {
        set({ token: null, userId: null, username: null });
      },
    }),
    {
      name: 'clicker-game-auth', 
      storage: createJSONStorage(() => localStorage), 
      version: 2,
      migrate: (persisted, version) => {
        const state = (persisted as any) as AuthState;
        if (version < 2 && state?.token && !state?.userId) {
          const payload = decodeJwt<{ sub?: string; username?: string }>(state.token);
          return {
            ...state,
            userId: payload?.sub ?? null,
            username: payload?.username ?? null,
          } as AuthState;
        }
        return state as any;
      },
    }
  )
);
