import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Hook do Fastify para verificar se o usuário está autenticado.
 * Isso roda antes de qualquer rota que o utilize.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    // O fastify-jwt adiciona o método .jwtVerify() ao request
    // Isso vai automaticamente ler o header "Authorization: Bearer [token]"
    // e verificar se o token é válido (assinado com nosso 'secret')
    await request.jwtVerify();
    
    // Se o código chegou aqui, o token é válido.
    // O payload do token (incluindo o 'sub' com o ID do usuário)
    // agora está disponível em 'request.user'

  } catch (err) {
    // Se .jwtVerify() falhar (token inválido, expirado ou não enviado),
    // ele joga um erro. Nós o capturamos e enviamos uma resposta 401.
    reply.status(401).send({
      message: 'Autenticação necessária.',
      error: 'Token inválido ou expirado.',
    });
  }
}