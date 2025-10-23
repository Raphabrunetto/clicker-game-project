// src/store/gameStore.ts
import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { api } from '@/lib/api';

// 1. Definimos a "forma" do estado do jogo
type Upgrades = {
  // Nível do upgrade de multiplicador de cliques
  clickMultiplier?: number; // default 0
};

interface GameState {
  currency: bigint;
  upgrades: Upgrades; // JSON-serializável
  ownerUserId: string | null;

  // Carrega os dados do back-end
  loadGameState: (data: { currency: string; upgrades: string }) => void;

  // Moeda (cliques somados)
  addCurrency: (amount: bigint) => void;

  // Valor por clique, derivado dos upgrades
  getClickPower: () => bigint;

  // Cálculo do custo do próximo nível do upgrade
  getUpgradeCost: (key: 'clickMultiplier') => bigint;

  // Compra de upgrade (desconta moeda e incrementa nível)
  buyUpgrade: (key: 'clickMultiplier') => boolean;

  // Salvar jogo no back-end
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

  // Valor por clique: 1 base + 1 por nível
  getClickPower: () => {
    const level = get().upgrades.clickMultiplier ?? 0;
    const power = 1 + level; // 1 -> 2 -> 3 -> ...
    return BigInt(power);
  },

  // Custo do próximo nível do upgrade
  // Estratégia simples e clara: custo linear 5, 10, 15, 20...
  getUpgradeCost: (key) => {
    if (key === 'clickMultiplier') {
      const level = get().upgrades.clickMultiplier ?? 0; // nível ATUAL
      const nextIndex = level + 1; // 1º nível custa 5, 2º 10...
      return BigInt(5 * nextIndex);
    }
    return BigInt(0);
  },

  buyUpgrade: (key) => {
    if (key !== 'clickMultiplier') return false;
    const cost = get().getUpgradeCost('clickMultiplier');
    const { currency, upgrades } = get();
    if (currency < cost) return false;
    const currentLevel = upgrades.clickMultiplier ?? 0;
    const nextLevel = currentLevel + 1;

    set({
      currency: currency - cost,
      upgrades: { ...upgrades, clickMultiplier: nextLevel },
    });
    return true;
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
