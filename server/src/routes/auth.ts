// server/src/routes/auth.ts

import { FastifyInstance } from 'fastify';
import { authenticate } from '../hooks/authHook';
import { authController } from '../controllers/authController';

export async function authRoutes(fastify: FastifyInstance) {
  // Rota: POST /api/register
  fastify.post('/api/register', authController.register);

  // Rota: POST /api/login
  fastify.post('/api/login', authController.login);

  // Rota: GET /api/me (retorna info basica do token)
  fastify.get('/api/me', { onRequest: [authenticate] }, async (request) => {
    const user = request.user as { sub?: string; username?: string };
    return {
      sub: user?.sub,
      username: user?.username,
    };
  });

} // <--- A FUNÇÃO 'authRoutes' TERMINA AQUI
