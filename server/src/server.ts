// server/src/server.ts

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authRoutes } from './routes/auth';
import jwt from '@fastify/jwt';
import { gameRoutes } from './routes/game';

// Inicializa o Fastify
const fastify = Fastify({
  logger: true, // Habilita logs para debug
});

// (PrismaClient foi removido daqui, pois agora está em auth.ts)

// Registra o CORS (para permitir que o front-end acesse)
fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  preflight: true,
  maxAge: 86400,
});

// <--- 2. Registre o plugin JWT
fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'seu-segredo-super-secreto-trocar-depois', 
  // IMPORTANTE: Mude isso para uma string longa e aleatória
  // Você pode colocar isso em seu .env depois, ex: process.env.JWT_SECRET
});

// --- NOSSAS ROTAS DE API ---

// Rota de "saúde" (para testar se o servidor está no ar)
fastify.get('/api/health', async (request, reply) => {
  return { status: 'ok', message: 'Servidor rodando!' };
});

// 2. Registre o plugin de rotas de autenticação
fastify.register(authRoutes);
fastify.register(gameRoutes);


/*
  A FAZER (em outros arquivos de rota):
  - Rota GET /api/game/load (para carregar o progresso do usuário logado)
  - Rota PUT /api/game/save (para salvar o progresso)
*/

// --- Iniciar o Servidor ---

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3333;
    await fastify.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
