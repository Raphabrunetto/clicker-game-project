// src/store/gameStore.ts
import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { api } from '@/lib/api';

export type SoundVariant =
  | 'classic'
  | 'retro'
  | 'laser'
  | 'nebula'
  | 'pulse'
  | 'crystal'
  | 'nova'
  | 'quantum'
  | 'aurora'
  | 'glitch'
  | 'zenith'
  | 'stardust'
  | 'miau';

type Upgrades = {
  clickMultiplier?: number;
  soundPack?: number;
  selectedSound?: SoundVariant;
};

const SOUND_PACK_COSTS = [
  BigInt(120),
  BigInt(260),
  BigInt(520),
  BigInt(900),
  BigInt(1400),
  BigInt(2100),
  BigInt(3000),
  BigInt(4200),
  BigInt(5800),
  BigInt(7800),
  BigInt(10200),
  BigInt(13000),
];
const SOUND_VARIANTS: SoundVariant[] = [
  'classic',
  'retro',
  'laser',
  'nebula',
  'pulse',
  'crystal',
  'nova',
  'quantum',
  'aurora',
  'glitch',
  'zenith',
  'stardust',
  'miau',
];

interface GameState {
  currency: bigint;
  upgrades: Upgrades;
  ownerUserId: string | null;

  loadGameState: (data: { currency: string; upgrades: string }) => void;
  addCurrency: (amount: bigint) => void;

  getClickPower: () => bigint;
  getUpgradeCost: (key: 'clickMultiplier') => bigint;
  getSoundPackCost: () => bigint;

  buyUpgrade: (key: 'clickMultiplier') => boolean;
  buySoundPack: () => boolean;

  getSoundVariant: () => SoundVariant;
  getUnlockedSoundVariants: () => SoundVariant[];
  setSoundVariant: (variant: SoundVariant) => boolean;

  saveGame: () => Promise<void>;
  setOwnerUserId: (id: string | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currency: BigInt(0),
  upgrades: {},
  ownerUserId: null,

  loadGameState: (data) => {
    let upgrades: Upgrades = {};
    try {
      upgrades = JSON.parse(data.upgrades || '{}') ?? {};
    } catch {
      upgrades = {};
    }
    const rawLevel =
      typeof upgrades.soundPack === 'number' && Number.isFinite(upgrades.soundPack)
        ? upgrades.soundPack
        : 0;
    const soundPack = Math.max(0, Math.min(rawLevel, SOUND_VARIANTS.length - 1));
    const unlocked = SOUND_VARIANTS.slice(0, soundPack + 1);
    const selected =
      typeof upgrades.selectedSound === 'string' && unlocked.includes(upgrades.selectedSound)
        ? upgrades.selectedSound
        : unlocked[unlocked.length - 1];

    set({
      currency: BigInt(data.currency),
      upgrades: { ...upgrades, soundPack, selectedSound: selected },
    });
  },

  addCurrency: (amount) => {
    set((state) => ({
      currency: state.currency + amount,
    }));
  },

  getClickPower: () => {
    const level = get().upgrades.clickMultiplier ?? 0;
    const power = 1 + level;
    return BigInt(power);
  },

  getUpgradeCost: (key) => {
    if (key === 'clickMultiplier') {
      const level = get().upgrades.clickMultiplier ?? 0;
      const nextIndex = level + 1;
      return BigInt(5 * nextIndex);
    }
    return BigInt(0);
  },

  getSoundPackCost: () => {
    const level = get().upgrades.soundPack ?? 0;
    if (level >= SOUND_PACK_COSTS.length) return BigInt(0);
    return SOUND_PACK_COSTS[level];
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

  buySoundPack: () => {
    const cost = get().getSoundPackCost();
    if (cost <= BigInt(0)) return false;
    const { currency, upgrades } = get();
    if (currency < cost) return false;
    const currentLevel = Math.max(0, upgrades.soundPack ?? 0);
    const nextLevel = Math.min(currentLevel + 1, SOUND_VARIANTS.length - 1);
    if (nextLevel === currentLevel) return false;
    const previouslyEquipped =
      upgrades.selectedSound ??
      SOUND_VARIANTS[Math.min(currentLevel, SOUND_VARIANTS.length - 1)];
    const nextVariant = SOUND_VARIANTS[nextLevel];
    const shouldAutoEquip =
      !upgrades.selectedSound ||
      upgrades.selectedSound === SOUND_VARIANTS[Math.min(currentLevel, SOUND_VARIANTS.length - 1)];

    set({
      currency: currency - cost,
      upgrades: {
        ...upgrades,
        soundPack: nextLevel,
        selectedSound: shouldAutoEquip ? nextVariant : previouslyEquipped,
      },
    });
    return true;
  },

  getSoundVariant: () => {
    const level = get().upgrades.soundPack ?? 0;
    const idx = Math.min(level, SOUND_VARIANTS.length - 1);
    const unlocked = SOUND_VARIANTS.slice(0, idx + 1);
    const selected = get().upgrades.selectedSound;
    if (selected && unlocked.includes(selected)) {
      return selected;
    }
    return SOUND_VARIANTS[idx];
  },

  getUnlockedSoundVariants: () => {
    const level = Math.max(0, get().upgrades.soundPack ?? 0);
    return SOUND_VARIANTS.slice(0, Math.min(level + 1, SOUND_VARIANTS.length));
  },

  setSoundVariant: (variant) => {
    const unlocked = get().getUnlockedSoundVariants();
    if (!unlocked.includes(variant)) return false;
    const { upgrades } = get();
    if (upgrades.selectedSound === variant) return true;
    set({
      upgrades: { ...upgrades, selectedSound: variant },
    });
    return true;
  },

  saveGame: async () => {
    const state = get();
    const auth = useAuthStore.getState();
    if (auth.userId && !state.ownerUserId) {
      set({ ownerUserId: auth.userId });
    }
    if (!auth.token || !auth.userId || get().ownerUserId !== auth.userId) return;
    await api.put('/api/game/save', {
      currency: state.currency.toString(),
      upgrades: JSON.stringify(state.upgrades || {}),
    });
  },

  setOwnerUserId: (id) => set({ ownerUserId: id }),

  reset: () => set({ currency: BigInt(0), upgrades: {} }),
}));
