// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function GamePage() {
  const router = useRouter();

  // 1. Pegamos os estados dos nossos stores
  const token = useAuthStore((state) => state.token);
  const { currency, loadGameState, addCurrency } = useGameStore();

  const [isLoading, setIsLoading] = useState(true);

  // 2. Efeito de Proteção e Carregamento
  useEffect(() => {
    // Se não houver token (checou o localStorage e não achou)
    if (!token) {
      router.push('/login'); // Expulsa o usuário
      return;
    }

    // Se tem token, vamos carregar o jogo
    const fetchGameData = async () => {
      try {
        // Graças ao Interceptor do Axios, o token já está no header
        const response = await api.get('/api/game/load');
        
        // Carrega os dados no store do jogo
        loadGameState(response.data);
        
      } catch (error) {
        console.error('Falha ao carregar o jogo', error);
        // (Aqui poderíamos deslogar o usuário se o token for inválido)
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameData();
  }, [token, router, loadGameState]);

  // 3. Função de Clique
  const handleClick = () => {
    // Adiciona 1 (BigInt) à moeda
    addCurrency(BigInt(1)); 
  };

  // 4. Renderização
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Carregando jogo...</p>
      </div>
    );
  }

  // Se não estiver carregando e o usuário estiver logado:
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8">
      <h1 className="text-5xl font-bold">
        Moedas: {currency.toString()}
      </h1>
      
      <Button 
        onClick={handleClick}
        className="transform transition-transform duration-100 active:scale-90"
        size="lg"
      >
        CLICAR!
      </Button>
    </div>
  );
}