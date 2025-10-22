// src/app/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function GamePage() {
  const router = useRouter();

  // 1. Pegamos os estados dos nossos stores
  const token = useAuthStore((state) => state.token);
  const { currency, loadGameState, addCurrency, saveGame, setOwnerUserId, reset } = useGameStore();
  const { userId } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  // 2. Efeito de Proteção e Carregamento
  useEffect(() => {
    // Se não houver token (checou o localStorage e não achou)
    if (!token) {
      router.push('/login'); // Expulsa o usuário
      return;
    }

    // Se tem token, reseta e carrega do servidor para o usuário atual
    const fetchGameData = async () => {
      try {
        setIsReady(false);
        setOwnerUserId(userId ?? null);
        reset();
        // Graças ao Interceptor do Axios, o token já está no header
        const response = await api.get('/api/game/load');
        loadGameState(response.data);
        
      } catch (error) {
        console.error('Falha ao carregar o jogo', error);
        // (Aqui poderíamos deslogar o usuário se o token for inválido)
      } finally {
        setIsLoading(false);
        setIsReady(true);
      }
    };

    fetchGameData();
  }, [token, userId, router, loadGameState, setOwnerUserId, reset]);

  // 2.1 Auto-save: salva após pequenas pausas e periodicamente
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!token || !isReady) return; // Não salva se não estiver autenticado/sem estado pronto

    // Debounce: salva ~0.4s após a última alteração de currency
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveGame().catch(() => {});
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, token, isReady]);

  useEffect(() => {
    if (!token || !isReady) return;
    // Intervalo de segurança: salva a cada 5s
    intervalRef.current = setInterval(() => {
      saveGame().catch(() => {});
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Salva uma última vez ao desmontar
      saveGame().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isReady]);

  // 2.2 Salva ao ocultar a aba/fechar (keepalive)
  useEffect(() => {
    if (!token || !isReady) return;

    const handler = () => {
      try {
        const body = JSON.stringify({
          currency: useGameStore.getState().currency.toString(),
          upgrades: JSON.stringify(useGameStore.getState().upgrades || {}),
        });
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}/api/game/save`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body,
          keepalive: true,
        }).catch(() => {});
      } catch {}
    };

    const onVis = () => { if (document.hidden) handler(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('beforeunload', handler);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('beforeunload', handler);
    };
  }, [token, isReady]);

  // 3. Função de Clique
  const handleClick = () => {
    // Adiciona 1 (BigInt) à moeda
    addCurrency(BigInt(1));
    // Salva imediatamente para não perder em recarregamento rápido
    saveGame().catch(() => {});
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
