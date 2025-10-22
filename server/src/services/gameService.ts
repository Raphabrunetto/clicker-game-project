import { gameStateRepository } from '../repositories/gameStateRepository';

export const gameService = {
  load: async (userId: string) => {
    const state = await gameStateRepository.findByUserId(userId);
    if (!state) return { ok: false as const };
    return { ok: true as const, state };
  },

  save: async (
    userId: string,
    data: { currency: bigint; upgrades?: string }
  ) => {
    const updated = await gameStateRepository.updateByUserId(userId, data);
    return { ok: true as const, state: updated };
  },
};

