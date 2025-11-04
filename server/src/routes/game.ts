import { FastifyInstance } from 'fastify';
import { authenticate } from '../hooks/authHook'; // <--- Importamos nosso hook
import { gameController } from '../controllers/gameController';

// --- ADICIONAMOS ISSO PARA CORRIGIR O ERRO ---
// Define a "forma" do nosso payload de usuário
interface JwtUserPayload {
  sub: string;
  username: string;
  iat: number;
  exp: number;
}

export async function gameRoutes(fastify: FastifyInstance) {

  // --- Rota: GET /api/game/load ---
  fastify.get('/api/game/load', { onRequest: [authenticate] }, gameController.load);


  // --- Rota: PUT /api/game/save ---
  fastify.put('/api/game/save', { onRequest: [authenticate] }, gameController.save);

}
