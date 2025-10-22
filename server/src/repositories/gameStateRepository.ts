import prisma from '../db/prisma';

export const gameStateRepository = {
  findByUserId: (userId: string) => {
    return prisma.gameState.findUnique({ where: { userId } });
  },

  updateByUserId: (userId: string, data: { currency?: bigint; upgrades?: string }) => {
    return prisma.gameState.update({
      where: { userId },
      data,
    });
  },
};

