// src/app/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function GamePage() {
  const router = useRouter();

  // 1. Pegamos os estados dos nossos stores
  const token = useAuthStore((state) => state.token);
  const { currency, loadGameState, addCurrency, saveGame, setOwnerUserId, reset, getClickPower, getUpgradeCost, buyUpgrade, upgrades } = useGameStore();
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
  const burstId = useRef(0);
  const [buttonPopped, setButtonPopped] = useState(false);
  const [bursts, setBursts] = useState<{ id: number; dx: number; text: string }[]>([]);

  const handleClick = () => {
    // Adiciona o valor do clique de acordo com os upgrades
    addCurrency(getClickPower());
    // Pop visual no botão
    setButtonPopped(true);
    setTimeout(() => setButtonPopped(false), 160);
    // Floating +valor
    const id = ++burstId.current;
    const dx = Math.round((Math.random() - 0.5) * 60); // leve variação horizontal
    setBursts((prev) => [...prev, { id, dx, text: `+${getClickPower().toString()}` }]);
    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id));
    }, 800);
    // Salva imediatamente para não perder em recarregamento rápido
    saveGame().catch(() => {});
  };

  // 4. Cálculos e feedback do Card (chamados sempre antes de qualquer retorno)
  const clickPower = getClickPower();
  const cmLevel = upgrades?.clickMultiplier ?? 0;
  const cmCost = getUpgradeCost('clickMultiplier');
  const canBuyCm = currency >= cmCost;

  // Efeito de destaque no card quando a compra fica disponível
  const [cardPulse, setCardPulse] = useState(false);
  // Efeito de "balanço" no card (compra e tentativa sem fundos)
  const [cardShake, setCardShake] = useState(false);
  // Confetti ao comprar com sucesso
  const [confetti, setConfetti] = useState<{
    id: number;
    dx: number;
    dy: number;
    rot: number;
    color: string;
  }[]>([]);
  const prevCanBuyRef = useRef<boolean>(false);
  useEffect(() => {
    const was = prevCanBuyRef.current;
    if (!was && canBuyCm) {
      setCardPulse(true);
      setTimeout(() => setCardPulse(false), 1200);
    }
    prevCanBuyRef.current = canBuyCm;
  }, [canBuyCm]);

  const launchConfetti = () => {
    const colors = ['#22c55e', '#06b6d4', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7'];
    const pieces = Array.from({ length: 14 }).map((_, i) => ({
      id: Date.now() + i,
      dx: Math.round((Math.random() - 0.5) * 220),
      dy: -Math.round(80 + Math.random() * 140),
      rot: Math.round(180 + Math.random() * 360),
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 1000);
  };

  // 5. Renderização (após chamar todos os hooks)
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Carregando jogo...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-5xl font-bold">Moedas: {currency.toString()}</h1>
        <p className="text-sm opacity-80">Valor por clique: {clickPower.toString()}</p>
      </div>

      <div className="relative">
        <Button 
          onClick={handleClick}
          className={cn("transform transition-transform duration-100 active:scale-90", buttonPopped && 'anim-pop')}
          size="lg"
        >
          CLICAR!
        </Button>
        <div className="pointer-events-none absolute inset-0 overflow-visible">
          {bursts.map((b) => (
            <span
              key={b.id}
              className="absolute anim-float-up select-none text-emerald-500 font-semibold drop-shadow"
              style={{ left: `calc(50% + ${b.dx}px)`, bottom: '-8px' }}
            >
              {b.text}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className={cn('relative overflow-visible', cardPulse && 'anim-pop anim-glow', cardShake && 'anim-shake')}>
          <CardHeader>
            <CardTitle>Multiplicador de Cliques</CardTitle>
          </CardHeader>
          <div className="pointer-events-none absolute inset-0 overflow-visible">
            {confetti.map((p) => (
              <span
                key={p.id}
                className="confetti-piece"
                style={{
                  left: '50%',
                  top: '40%',
                  background: p.color,
                  // custom props
                  ['--dx' as any]: `${p.dx}px`,
                  ['--dy' as any]: `${p.dy}px`,
                  ['--rot' as any]: `${p.rot}deg`,
                }}
              />
            ))}
          </div>
          <CardContent>
            <p className="text-sm opacity-80">
              Cada compra aumenta seu valor por clique em +1.
            </p>
            <p className="mt-2 text-sm">
              Nível atual: <span className="font-semibold">{cmLevel}</span>
            </p>
            <p className="text-sm">
              Próximo custo: <span className="font-semibold">{cmCost.toString()}</span>
            </p>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => {
                if (!canBuyCm) {
                  // Sem fundos: balança o card
                  setCardShake(true);
                  setTimeout(() => setCardShake(false), 700);
                  return;
                }
                if (buyUpgrade('clickMultiplier')) {
                  // salva logo após a compra
                  saveGame().catch(() => {});
                  // Compra com sucesso: confetti!
                  launchConfetti();
                }
              }}
              className={cn(!canBuyCm && 'opacity-60')}
              title={!canBuyCm ? 'Moedas insuficientes' : undefined}
            >
              Comprar
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
