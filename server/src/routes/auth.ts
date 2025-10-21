// server/src/routes/auth.ts

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { authenticate } from '../hooks/authHook';

// Inicializamos o Prisma fora para poder usar em todas as rotas
const prisma = new PrismaClient();

// Criamos um schema de validação para o corpo (body) da requisição
const registerBodySchema = z.object({
  email: z.string().email({ message: 'Formato de e-mail inválido.' }),
  password: z.string().min(6, { message: 'A senha deve ter no mínimo 6 caracteres.' }),
  username: z.string().optional(),
});

// Schema de Login
const loginBodySchema = z.object({
  email: z.string().email({ message: 'E-mail inválido.' }),
  password: z.string().min(1, { message: 'Senha é obrigatória.' }),
});

export async function authRoutes(fastify: FastifyInstance) {

  // Rota: POST /api/register
  fastify.post('/api/register', async (request, reply) => {
    try {
      // 1. Validar os dados que chegaram
      const parsedBody = registerBodySchema.safeParse(request.body);

      if (!parsedBody.success) {
        // Se a validação falhar, retorna um erro 400 (Bad Request)
        return reply.status(400).send({
          message: 'Dados inválidos.',
          errors: parsedBody.error.flatten().fieldErrors,
        });
      }

      const { email, password, username } = parsedBody.data;

      // 2. Verificar se o e-mail já está em uso
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return reply.status(409).send({ message: 'Este e-mail já está em uso.' }); // 409 = Conflito
      }

      // 3. Criptografar a senha
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 4. Criar o usuário E o estado de jogo inicial
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          username: username || email,
          gameState: {
            create: {
              currency: BigInt(0),
              upgrades: "{}",
            },
          },
        },
        include: {
          gameState: true,
        },
      });

      // 5. Retornar sucesso
      return reply.status(201).send({
        message: 'Usuário criado com sucesso!',
        userId: newUser.id,
        email: newUser.email,
        gameStateId: newUser.gameState?.id,
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Erro interno do servidor.' });
    }
  });

  // --- O CÓDIGO DE LOGIN FOI MOVIDO PARA CÁ ---
  // Rota: POST /api/login
  fastify.post('/api/login', async (request, reply) => {
    try {
      // 1. Validar os dados
      const parsedBody = loginBodySchema.safeParse(request.body);
      if (!parsedBody.success) {
        return reply.status(400).send({
          message: 'Dados inválidos.',
          errors: parsedBody.error.flatten().fieldErrors,
        });
      }

      const { email, password } = parsedBody.data;

      // 2. Encontrar o usuário no banco
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Usamos 401 (Unauthorized) aqui também por segurança, para não vazar se o e-mail existe
        return reply.status(401).send({ message: 'E-mail ou senha incorretos.' });
      }

      // 3. Comparar a senha enviada com o hash salvo no banco
      const isPasswordCorrect = await bcrypt.compare(password, user.password);

      if (!isPasswordCorrect) {
        return reply.status(401).send({ message: 'E-mail ou senha incorretos.' }); // 401 Unauthorized
      }

      // 4. Gerar o Token JWT
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

      // 5. Retornar o token para o cliente
      return reply.status(200).send({
        message: 'Login bem-sucedido!',
        token,
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Erro interno do servidor.' });
    }
  });
  // --- FIM DO BLOCO DE LOGIN ---

  // Rota: GET /api/me (retorna info basica do token)
  fastify.get('/api/me', { onRequest: [authenticate] }, async (request) => {
    const user = request.user as { sub?: string; username?: string };
    return {
      sub: user?.sub,
      username: user?.username,
    };
  });

} // <--- A FUNÇÃO 'authRoutes' TERMINA AQUI
