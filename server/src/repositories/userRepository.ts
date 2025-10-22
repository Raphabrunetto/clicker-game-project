import prisma from '../db/prisma';

export interface CreateUserInput {
  email: string;
  username?: string | undefined;
  passwordHash: string;
}

export const userRepository = {
  findByEmail: (email: string) => {
    return prisma.user.findUnique({ where: { email } });
  },

  findById: (id: string) => {
    return prisma.user.findUnique({ where: { id } });
  },

  createWithInitialGameState: ({ email, username, passwordHash }: CreateUserInput) => {
    return prisma.user.create({
      data: {
        email,
        username: (username ?? email),
        password: passwordHash,
        gameState: {
          create: {
            currency: BigInt(0),
            upgrades: '{}',
          },
        },
      },
      include: {
        gameState: true,
      },
    });
  },
};
