import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate } from '../hooks/authHook'; // <--- Importamos nosso hook

// --- ADICIONAMOS ISSO PARA CORRIGIR O ERRO ---
// Define a "forma" do nosso payload de usuário
interface JwtUserPayload {
  sub: string;
  username: string;
  iat: number;
  exp: number;
}
// --- FIM DA ADIÇÃO ---

const prisma = new PrismaClient();

// (O Schema 'saveGameBodySchema' não é usado, podemos remover, mas vamos focar no erro)

export async function gameRoutes(fastify: FastifyInstance) {

  // --- Rota: GET /api/game/load ---
  fastify.get('/api/game/load', 
    {
      onRequest: [authenticate], // <--- Hook de autenticação
    },
    async (request, reply) => {
      try {
        // --- CORREÇÃO APLICADA AQUI ---
        const user = request.user as JwtUserPayload; // Forçamos o tipo
        const userId = user.sub; // Agora o TypeScript sabe que .sub existe
        // --- FIM DA CORREÇÃO ---

        const gameState = await prisma.gameState.findUnique({
          where: { userId: userId },
        });

        if (!gameState) {
          return reply.status(404).send({ message: 'Estado do jogo não encontrado.' });
        }

        return reply.status(200).send({
          ...gameState,
          currency: gameState.currency.toString(), // Converte BigInt para string
        });

      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ message: 'Erro ao carregar o jogo.' });
      }
    }
  );


  // --- Rota: PUT /api/game/save ---
  fastify.put('/api/game/save',
    {
      onRequest: [authenticate], // <--- Hook de autenticação
    },
    async (request, reply) => {
      try {
        // --- CORREÇÃO APLICADA AQUI ---
        const user = request.user as JwtUserPayload; // Forçamos o tipo
        const userId = user.sub; // Agora o TypeScript sabe que .sub existe
        // --- FIM DA CORREÇÃO ---

        // 1. Validar o corpo da requisição
        const bodySchema = z.object({
            currency: z.string(), // Recebemos a string do JSON
            upgrades: z.string().optional().default("{}"),
        });

        const parsedBody = bodySchema.safeParse(request.body);

        if (!parsedBody.success) {
            return reply.status(400).send({ message: "Dados de salvamento inválidos."});
        }
        
        const { currency, upgrades } = parsedBody.data;

        // 2. Atualizar o GameState
        const updatedGameState = await prisma.gameState.update({
          where: { userId: userId },
          data: {
            currency: BigInt(currency), // Convertemos a string de volta para BigInt
            upgrades: upgrades,
          },
        });

        return reply.status(200).send({
          message: 'Jogo salvo com sucesso!',
          currency: updatedGameState.currency.toString(), // Converte BigInt para string
        });

      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ message: 'Erro ao salvar o jogo.' });
      }
    }
  );

}