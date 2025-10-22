import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { gameService } from '../services/gameService';

interface JwtUserPayload {
  sub: string;
  username: string;
  iat: number;
  exp: number;
}

const saveBodySchema = z.object({
  currency: z.string(),
  upgrades: z.string().optional().default('{}'),
});

export const gameController = {
  load: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as JwtUserPayload;
    const userId = user.sub;

    const result = await gameService.load(userId);
    if (!result.ok) return reply.status(404).send({ message: 'Estado do jogo não encontrado.' });

    const state = result.state;
    return reply.status(200).send({
      ...state,
      currency: state.currency.toString(),
    });
  },

  save: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as JwtUserPayload;
    const userId = user.sub;

    const parsed = saveBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: 'Dados de salvamento inválidos.' });
    }

    const { currency, upgrades } = parsed.data;
    const result = await gameService.save(userId, {
      currency: BigInt(currency),
      upgrades,
    });

    return reply.status(200).send({
      message: 'Jogo salvo com sucesso!',
      currency: result.state.currency.toString(),
    });
  },
};

