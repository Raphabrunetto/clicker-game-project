import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { authService } from '../services/authService';

const registerBodySchema = z.object({
  email: z.string().email({ message: 'Formato de e-mail inválido.' }),
  password: z.string().min(6, { message: 'A senha deve ter no mínimo 6 caracteres.' }),
  username: z.string().optional(),
});

const loginBodySchema = z.object({
  email: z.string().email({ message: 'E-mail inválido.' }),
  password: z.string().min(1, { message: 'Senha é obrigatória.' }),
});

export const authController = {
  register: async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = registerBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: 'Dados inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { email, password, username } = parsed.data;
    const result = await authService.register({ email, password, username });

    if (!result.ok) {
      if (result.reason === 'EMAIL_IN_USE') {
        return reply.status(409).send({ message: 'Este e-mail já está em uso.' });
      }
      return reply.status(500).send({ message: 'Falha ao registrar usuário.' });
    }

    const user = result.user;
    return reply.status(201).send({
      message: 'Usuário criado com sucesso!',
      userId: user.id,
      email: user.email,
      gameStateId: user.gameState?.id,
    });
  },

  login: async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = loginBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: 'Dados inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { email, password } = parsed.data;
    const result = await authService.validateCredentials({ email, password });
    if (!result.ok) {
      return reply.status(401).send({ message: 'E-mail ou senha incorretos.' });
    }

    const user = result.user;
    const token = await reply.jwtSign(
      {
        username: user.username,
      },
      {
        sign: {
          sub: user.id,
          expiresIn: '7d',
        },
      }
    );

    return reply.status(200).send({
      message: 'Login bem-sucedido!',
      token,
    });
  },
};
