// src/store/gameStore.ts
import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { api } from '@/lib/api';

// 1. Definimos a "forma" do estado do jogo
interface GameState {
  currency: bigint;
  upgrades: any; // Usamos 'any' por enquanto para o JSON
  ownerUserId: string | null;
  
  // Ação para carregar os dados do back-end
  loadGameState: (data: { currency: string; upgrades: string }) => void;
  
  // Ação para adicionar moeda (o clique)
  addCurrency: (amount: bigint) => void;
  
  // Ação para salvar o jogo
  saveGame: () => Promise<void>;

  // Define o dono atual desse estado (amarrar ao usuário logado)
  setOwnerUserId: (id: string | null) => void;

  // Reseta o estado do jogo (ao trocar de usuário)
  reset: () => void;
}

// 2. Criamos o store
export const useGameStore = create<GameState>((set, get) => ({
  // Estado inicial
  currency: BigInt(0),
  upgrades: {},
  ownerUserId: null,

  // Ação para carregar o jogo
  loadGameState: (data) => {
    set({
      currency: BigInt(data.currency),
      upgrades: JSON.parse(data.upgrades || "{}"),
    });
  },
  
  // Ação para adicionar moedas
  addCurrency: (amount) => {
    set((state) => ({
      currency: state.currency + amount,
    }));
  },

  // Salva o estado atual no back-end
  saveGame: async () => {
    const state = get();
    const auth = useAuthStore.getState();
    // Atribui dono se ainda não houver e usuário está presente
    if (auth.userId && !state.ownerUserId) {
      set({ ownerUserId: auth.userId });
    }
    // Só salva se o owner do estado for o usuário atual
    if (!auth.token || !auth.userId || get().ownerUserId !== auth.userId) return;
    await api.put('/api/game/save', {
      currency: state.currency.toString(),
      upgrades: JSON.stringify(state.upgrades || {}),
    });
  },

  setOwnerUserId: (id) => set({ ownerUserId: id }),

  reset: () => set({ currency: BigInt(0), upgrades: {} }),
}));
