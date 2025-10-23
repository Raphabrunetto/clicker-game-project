Clicker Game — Front/Back (MongoDB)

- Front-end: Next.js (pasta `client`)
- Back-end: Fastify + Prisma (MongoDB) (pasta `server`)
- Conexão: MongoDB (Atlas recomendado). Sem Docker por padrão.

Como rodar localmente

- Banco: crie um cluster no MongoDB Atlas e copie a connection string.
- Server:
  - Copie `server/.env.example` para `server/.env` e ajuste `DATABASE_URL`, `JWT_SECRET` e `CORS_ORIGIN`.
  - Instale deps: `cd server && npm i`.
  - Gere Prisma e aplique schema: `npx prisma generate && npx prisma db push`.
  - Rode: `npm run dev` (porta padrão `3333`).
- Client:
  - Copie `client/.env.local.example` para `client/.env.local` e ajuste `NEXT_PUBLIC_API_URL` (ex.: `http://localhost:3333`).
  - Instale deps: `cd client && npm i`.
  - Rode: `npm run dev` (porta padrão `3000`).

Arquitetura do back-end

- Rotas (`server/src/routes`): definem endpoints e middlewares.
- Controllers (`server/src/controllers`): validam payloads e orquestram respostas HTTP.
- Services (`server/src/services`): regras de negócio.
- Repositories (`server/src/repositories`): acesso ao banco (Prisma -> MongoDB).
- DB (`server/src/db/prisma.ts`): instancia única do PrismaClient.
- Hooks (`server/src/hooks`): autenticação JWT.

Endpoints principais

- `POST /api/register`: cria usuário + estado inicial do jogo.
- `POST /api/login`: autentica e retorna JWT.
- `GET /api/game/load`: carrega o save do usuário autenticado.
- `PUT /api/game/save`: salva progresso (currency/upgrades) do usuário autenticado.

Deploy sugerido

- Front-end (client): Vercel ou Netlify.
- Back-end (server): Render, Railway, Fly.io ou servidor Node.
- Banco: MongoDB Atlas.
- Ajustes:
  - `client` → defina `NEXT_PUBLIC_API_URL` para a URL pública do back-end.
  - `server` → defina `JWT_SECRET`, `DATABASE_URL` (Atlas) e `CORS_ORIGIN` com a URL do front.

