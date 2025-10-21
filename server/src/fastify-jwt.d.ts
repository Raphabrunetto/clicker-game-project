// server/src/fastify-jwt.d.ts
import '@fastify/jwt';

declare module '@fastify/jwt' {
  /**
   * Esta interface define o que vem de volta em `request.user`
   * após uma verificação bem-sucedida (request.jwtVerify())
   */
  interface FastifyJWT {
    user: {
      /** O ID do usuário (subject) */
      sub: string;
      /** O nome de usuário */
      username: string;
      /** A data de emissão (iat) e expiração (exp) são adicionadas automaticamente */
      iat: number;
      exp: number;
    };
  }
}