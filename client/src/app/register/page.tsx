// src/app/register/page.tsx
'use client'; // <-- Essencial! Diz ao Next.js que é um Componente de Cliente

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Importa o hook de roteamento
import { api } from '@/lib/api'; // Nossa instância do Axios

// Importando componentes do Shadcn/UI
// (Vamos precisar instalá-los)
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter(); // Hook para redirecionar o usuário

  // Estados para os campos do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  // Estados para feedback
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Função chamada ao enviar o formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede o recarregamento da página
    setIsLoading(true);
    setError(null);

    try {
      // 1. Envia os dados para o back-end (limpa espaços no email)
      await api.post('/api/register', {
        email: email.trim(),
        password,
        username,
      });

      // 2. Se deu certo, redireciona para a página de login
      router.push('/login');

    } catch (err: any) {
      // 3. Se deu erro, mostra a mensagem
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Erro ao tentar registrar. Tente novamente.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card
        className="auth-card relative w-[420px] sm:w-[460px] overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
      >
        <CardHeader>
          <CardTitle>Criar Conta</CardTitle>
          <CardDescription>
            Comece sua jornada no Clicker Game.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="username">Usuário (opcional)</Label>
                <Input
                  id="username"
                  autoComplete="nickname"
                  placeholder="Seu nome no jogo"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Reserva espaço p/ feedback evitando 'jump' do layout */}
              <div className="min-h-[20px]">
                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
              </div>

            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? 'Registrando...' : 'Registrar'}
            </Button>
            <p className="text-sm text-muted-foreground">
              Já tem conta?{' '}
              <Link href="/login" className="text-primary underline">Entrar</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}   
