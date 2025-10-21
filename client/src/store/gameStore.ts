// src/store/gameStore.ts
import { create } from 'zustand';

// 1. Definimos a "forma" do estado do jogo
interface GameState {
  currency: bigint;
  upgrades: any; // Usamos 'any' por enquanto para o JSON
  
  // Ação para carregar os dados do back-end
  loadGameState: (data: { currency: string; upgrades: string }) => void;
  
  // Ação para adicionar moeda (o clique)
  addCurrency: (amount: bigint) => void;
  
  // Ação para salvar o jogo (a implementar)
  // saveGame: () => Promise<void>;
}

// 2. Criamos o store
export const useGameStore = create<GameState>((set) => ({
  // Estado inicial
  currency: BigInt(0),
  upgrades: {},

  // Ação para carregar o jogo
  loadGameState: (data) => {
    set({
      currency: BigInt(data.currency), // Convertemos a string de volta para BigInt
      upgrades: JSON.parse(data.upgrades || "{}"), // Convertemos a string de volta para JSON
    });
  },
  
  // Ação para adicionar moedas
  addCurrency: (amount) => {
    set((state) => ({
      currency: state.currency + amount,
    }));
  },

}));