// src/app/page.tsx
'use client';

import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { SoundVariant, useGameStore } from '@/store/gameStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import StageHUD from '@/components/theme/StageHUD';
import OrbField from '@/components/theme/OrbField';
import { getNextStage, getStageForCurrency } from '@/components/theme/progression';
import { ArrowRight, Coins, Music2, Sparkles, Zap } from 'lucide-react';

type SoundVariantMeta = {
  key: SoundVariant;
  name: string;
  tagline: string;
  description: string;
};

const SOUND_VARIANTS: SoundVariantMeta[] = [
  {
    key: 'classic',
    name: 'Classic Pulse',
    tagline: 'O clique padrao, brilhante e rapido.',
    description: 'Ataque sintetico com duas camadas leves. Equilibrado para uso continuo.',
  },
  {
    key: 'retro',
    name: 'Retro Chip',
    tagline: 'Notas 8-bit para vibes de arcade.',
    description: 'Ondas quadradas em harmonia curta. Ideal para quem curte nostalgia digital.',
  },
  {
    key: 'laser',
    name: 'Neon Laser',
    tagline: 'Explosao futurista para o late game.',
    description: 'Rampa serrilhada energizada com cauda cristalina. Brilha em stages altos.',
  },
];

export default function GamePage() {
  const router = useRouter();

  const token = useAuthStore((state) => state.token);
  const {
    currency,
    loadGameState,
    addCurrency,
    saveGame,
    setOwnerUserId,
    reset,
    getClickPower,
    getUpgradeCost,
    getSoundPackCost,
    buyUpgrade,
    buySoundPack,
    upgrades,
  } = useGameStore();
  const { userId } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchGameData = async () => {
      try {
        setIsReady(false);
        setOwnerUserId(userId ?? null);
        reset();
        const response = await api.get('/api/game/load');
        loadGameState(response.data);
      } catch (error) {
        console.error('Falha ao carregar o jogo', error);
      } finally {
        setIsLoading(false);
        setIsReady(true);
      }
    };

    fetchGameData();
  }, [token, userId, router, loadGameState, setOwnerUserId, reset]);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!token || !isReady) return;

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

    intervalRef.current = setInterval(() => {
      saveGame().catch(() => {});
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      saveGame().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isReady]);

  useEffect(() => {
    if (!token || !isReady) return;

    const handler = () => {
      try {
        const state = useGameStore.getState();
        const body = JSON.stringify({
          currency: state.currency.toString(),
          upgrades: JSON.stringify(state.upgrades || {}),
        });
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}/api/game/save`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body,
          keepalive: true,
        }).catch(() => {});
      } catch {}
    };

    const onVis = () => {
      if (document.hidden) handler();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('beforeunload', handler);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('beforeunload', handler);
    };
  }, [token, isReady]);

  const burstId = useRef(0);
  const [buttonPopped, setButtonPopped] = useState(false);
  const [bursts, setBursts] = useState<{ id: number; dx: number; text: string }[]>([]);

  const handleClick = () => {
    const sfx = getSfxOnce();
    addCurrency(getClickPower());
    setButtonPopped(true);
    setTimeout(() => setButtonPopped(false), 160);

    const id = ++burstId.current;
    const dx = Math.round((Math.random() - 0.5) * 60);
    setBursts((prev) => [...prev, { id, dx, text: `+${getClickPower().toString()}` }]);
    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id));
    }, 800);

    sfx.click();
    saveGame().catch(() => {});
  };

  const clickPower = getClickPower();
  const cmLevel = upgrades?.clickMultiplier ?? 0;
  const cmCost = getUpgradeCost('clickMultiplier');
  const canBuyCm = currency >= cmCost;
  const currencyNumber = Number(currency);

  const soundLevel = upgrades?.soundPack ?? 0;
  const currentSoundMeta =
    SOUND_VARIANTS[Math.min(soundLevel, SOUND_VARIANTS.length - 1)];
  const nextSoundMeta = SOUND_VARIANTS[soundLevel + 1];
  const soundCost = getSoundPackCost();
  const isSoundMaxed = !nextSoundMeta;
  const canBuySound = Boolean(nextSoundMeta) && currency >= soundCost;

  useEffect(() => {
    setClickVariant(currentSoundMeta.key);
  }, [currentSoundMeta.key]);

  const stage = useMemo(
    () => getStageForCurrency(currencyNumber),
    [currencyNumber]
  );
  const nextStage = useMemo(() => getNextStage(stage), [stage]);
  const stageProgress = useMemo(() => {
    if (!nextStage) return 1;
    const range = nextStage.threshold - stage.threshold;
    if (range <= 0) return 1;
    const value = (currencyNumber - stage.threshold) / range;
    return Math.min(1, Math.max(0, value));
  }, [currencyNumber, nextStage, stage.threshold]);
  const currencyDisplay = useMemo(
    () => currencyNumber.toLocaleString('pt-BR'),
    [currencyNumber]
  );
  const nextStageTarget = useMemo(
    () => (nextStage ? nextStage.threshold.toLocaleString('pt-BR') : null),
    [nextStage]
  );

  const [cardPulse, setCardPulse] = useState(false);
  const [cardShake, setCardShake] = useState(false);
  const [confetti, setConfetti] = useState<
    { id: number; dx: number; dy: number; rot: number; color: string }[]
  >([]);
  const prevCanBuyRef = useRef(false);
  useEffect(() => {
    const was = prevCanBuyRef.current;
    if (!was && canBuyCm) {
      setCardPulse(true);
      setTimeout(() => setCardPulse(false), 1200);
    }
    prevCanBuyRef.current = canBuyCm;
  }, [canBuyCm]);

  const [soundCardPulse, setSoundCardPulse] = useState(false);
  const [soundCardShake, setSoundCardShake] = useState(false);
  const prevCanBuySoundRef = useRef(false);
  useEffect(() => {
    const was = prevCanBuySoundRef.current;
    if (!was && canBuySound) {
      setSoundCardPulse(true);
      setTimeout(() => setSoundCardPulse(false), 1200);
    }
    prevCanBuySoundRef.current = canBuySound;
  }, [canBuySound]);

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

  const handleSoundPreview = () => {
    const sfx = getSfxOnce();
    sfx.resume().catch(() => {});
    sfx.click();
  };

  const handleSoundPurchase = () => {
    if (isSoundMaxed) return;
    const sfx = getSfxOnce();
    if (!canBuySound) {
      setSoundCardShake(true);
      setTimeout(() => setSoundCardShake(false), 700);
      sfx.error();
      return;
    }
    const targetVariant = nextSoundMeta?.key ?? currentSoundMeta.key;
    if (buySoundPack()) {
      saveGame().catch(() => {});
      setSoundCardPulse(true);
      setTimeout(() => setSoundCardPulse(false), 1200);
      setClickVariant(targetVariant);
      sfx.purchase();
      setTimeout(() => {
        sfx.click();
      }, 80);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Carregando jogo...</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <OrbField />
      <StageHUD />
      <div className="relative z-10 flex w-full max-w-5xl flex-col gap-8">
        <Card className="glass-panel border-white/5 bg-white/5">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-white">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="glow">Stage {stage.name}</Badge>
                  {nextStage && (
                    <Badge variant="subtle" className="bg-white/10 text-white/70">
                      Proximo: {nextStage.name}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-4xl font-semibold tracking-tight text-white drop-shadow-md sm:text-5xl">
                  {currencyDisplay}
                  <span className="ml-2 text-base font-normal text-white/70">
                    moedas coletadas
                  </span>
                </CardTitle>
              </div>
              <div className="flex flex-col items-end gap-1 text-right text-white/80">
                <span className="text-xs uppercase tracking-wide text-white/60">
                  Valor por clique
                </span>
                <span className="flex items-center gap-1 text-2xl font-semibold text-emerald-300 drop-shadow">
                  <Zap className="h-4 w-4 text-emerald-200" />
                  +{clickPower.toString()}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <Progress value={stageProgress * 100} className="h-3" />
            <div className="flex flex-col gap-2 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                {stage.name}
              </span>
              <span className="flex items-center gap-1">
                {nextStage
                  ? `${currencyDisplay} / ${nextStageTarget} moedas`
                  : `${currencyDisplay} / Maximo`}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 text-white sm:grid-cols-3">
          <div className="stat-card">
            <div className="flex items-center justify-between text-sm font-medium uppercase tracking-wide text-white/70">
              <span className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-sky-300" />
                Reservas
              </span>
              <Badge variant="subtle" className="bg-white/10 text-white/70">
                Tempo real
              </Badge>
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-white">
              {currencyDisplay}
            </div>
            <p className="mt-2 text-xs text-white/60">
              Clique para acumular ainda mais rapido.
            </p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between text-sm font-medium uppercase tracking-wide text-white/70">
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-300" />
                Power
              </span>
              <Badge variant="subtle" className="bg-emerald-500/20 text-emerald-200">
                +{clickPower.toString()} por clique
              </Badge>
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-emerald-200 drop-shadow">
              +{clickPower.toString()}
            </div>
            <p className="mt-2 text-xs text-white/60">
              Multiplique seus ganhos investindo nos upgrades abaixo.
            </p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between text-sm font-medium uppercase tracking-wide text-white/70">
              <span className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-indigo-300" />
                Proximo objetivo
              </span>
              <Badge variant="subtle" className="bg-indigo-500/20 text-indigo-200">
                {nextStage ? nextStage.name : 'Concluido'}
              </Badge>
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-white">
              {nextStage ? nextStageTarget : 'Voce dominou!'}
            </div>
            <p className="mt-2 text-xs text-white/60">
              Falta pouco para o proximo stage, continue clicando!
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center">
            <div
              className={cn(
                'click-halo transition-all duration-200',
                buttonPopped && 'is-active'
              )}
            >
              <span className="click-halo__ring" />
              <Button
                onClick={handleClick}
                className={cn(
                  'relative inline-flex min-w-[8rem] transform items-center gap-2 rounded-full bg-gradient-to-br from-emerald-500 via-sky-500 to-indigo-500 px-8 py-6 text-lg font-semibold text-white shadow-[0_18px_40px_rgba(59,130,246,0.45)] transition-all duration-150 hover:scale-105 hover:shadow-[0_22px_50px_rgba(59,130,246,0.55)] focus-visible:outline-none active:scale-95',
                  buttonPopped && 'anim-pop'
                )}
                size="lg"
              >
                <Zap className="h-5 w-5" />
                Clicar!
              </Button>
            </div>
            <div className="pointer-events-none absolute inset-0 overflow-visible">
              {bursts.map((b) => (
                <span
                  key={b.id}
                  className="absolute anim-float-up select-none text-emerald-400 font-semibold drop-shadow"
                  style={{ left: `calc(50% + ${b.dx}px)`, bottom: '-8px' }}
                >
                  {b.text}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-2 text-xs uppercase tracking-wide text-white/60">
            Cada clique salva automaticamente o seu progresso.
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card
            className={cn(
              'glass-panel relative overflow-visible border-white/10 bg-white/5',
              cardPulse && 'anim-pop anim-glow',
              cardShake && 'anim-shake'
            )}
          >
            <CardHeader className="flex flex-col gap-3 text-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-2xl font-semibold text-white">
                  Multiplicador de Cliques
                </CardTitle>
                <Badge
                  variant={canBuyCm ? 'glow' : 'subtle'}
                  className="text-xs uppercase tracking-wide"
                >
                  Nivel {cmLevel}
                </Badge>
              </div>
              <p className="text-sm text-white/70">
                Cada compra aumenta o valor por clique em +1, acumulando infinitamente.
              </p>
            </CardHeader>
            <div className="pointer-events-none absolute inset-0 overflow-visible">
              {confetti.map((p) => {
                const style: CSSProperties & {
                  '--dx': string;
                  '--dy': string;
                  '--rot': string;
                } = {
                  left: '50%',
                  top: '40%',
                  background: p.color,
                  '--dx': `${p.dx}px`,
                  '--dy': `${p.dy}px`,
                  '--rot': `${p.rot}deg`,
                };
                return <span key={p.id} className="confetti-piece" style={style} />;
              })}
            </div>
            <CardContent className="space-y-4">
              <Separator className="opacity-40" />
              <div className="space-y-3 text-sm text-white/80">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-white/60">
                    <Zap className="h-4 w-4 text-emerald-300" />
                    Valor atual por clique
                  </span>
                  <span className="font-semibold text-emerald-200 drop-shadow">
                    +{clickPower.toString()}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-white/60">
                    <Coins className="h-4 w-4 text-sky-300" />
                    Proximo custo
                  </span>
                  <span className="font-semibold text-white">
                    {cmCost.toString()}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Badge
                variant="outline"
                className="border-white/20 bg-white/5 text-xs uppercase tracking-wide text-white/80"
              >
                Upgrade permanente
              </Badge>
              <Button
                onClick={() => {
                  const sfx = getSfxOnce();
                  if (!canBuyCm) {
                    setCardShake(true);
                    setTimeout(() => setCardShake(false), 700);
                    sfx.error();
                    return;
                  }
                  if (buyUpgrade('clickMultiplier')) {
                    saveGame().catch(() => {});
                    launchConfetti();
                    sfx.purchase();
                  }
                }}
                className={cn(
                  'min-w-[8rem] bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 text-white shadow-[0_12px_30px_rgba(59,130,246,0.35)] hover:shadow-[0_16px_40px_rgba(59,130,246,0.45)]',
                  !canBuyCm && 'opacity-60'
                )}
                title={!canBuyCm ? 'Moedas insuficientes' : undefined}
              >
                Comprar
              </Button>
            </CardFooter>
          </Card>

          <Card
            className={cn(
              'glass-panel relative overflow-visible border-white/10 bg-white/5',
              soundCardPulse && 'anim-pop anim-glow',
              soundCardShake && 'anim-shake'
            )}
          >
            <CardHeader className="flex flex-col gap-3 text-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-2xl font-semibold text-white">
                  Timbres do Clique
                </CardTitle>
                <Badge
                  variant={canBuySound ? 'glow' : 'subtle'}
                  className="text-xs uppercase tracking-wide"
                >
                  {currentSoundMeta.name}
                </Badge>
              </div>
              <p className="text-sm text-white/70">
                Altere o som do clique conforme avanca. Cada upgrade desbloqueia um timbre unico.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator className="opacity-40" />
              <div className="space-y-3 text-sm text-white/80">
                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/10 px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sky-200 shadow-inner">
                    <Music2 className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">
                      {currentSoundMeta.tagline}
                    </span>
                    <span className="text-xs text-white/60">
                      {currentSoundMeta.description}
                    </span>
                  </div>
                </div>
                {nextSoundMeta ? (
                  <div className="flex flex-col gap-1 rounded-lg border border-white/10 bg-emerald-500/10 px-4 py-3 text-xs text-white/70">
                    <span className="font-semibold text-white">
                      Proxima troca: {nextSoundMeta.name}
                    </span>
                    <span>{nextSoundMeta.tagline}</span>
                    <span>
                      Custo: {soundCost.toString()} moedas
                    </span>
                  </div>
                ) : (
                  <div className="rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-xs text-white/70">
                    Todos os timbres foram desbloqueados. Escolha o que mais combina com o seu stage.
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Badge
                variant="outline"
                className="border-white/20 bg-white/5 text-xs uppercase tracking-wide text-white/80"
              >
                Biblioteca sonora
              </Badge>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <Button
                  variant="secondary"
                  onClick={handleSoundPreview}
                  className="bg-white/10 text-white hover:bg-white/20"
                >
                  Testar som
                </Button>
                <Button
                  onClick={handleSoundPurchase}
                  className={cn(
                    'min-w-[8rem] bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 text-white shadow-[0_12px_30px_rgba(129,140,248,0.35)] hover:shadow-[0_16px_40px_rgba(129,140,248,0.45)]',
                    !canBuySound && 'opacity-60'
                  )}
                  disabled={isSoundMaxed}
                  title={
                    isSoundMaxed
                      ? 'Todos os timbres desbloqueados'
                      : !canBuySound
                        ? 'Moedas insuficientes'
                        : undefined
                  }
                >
                  {isSoundMaxed ? 'Completo' : 'Trocar som'}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { getSfx, setClickVariant } from '@/lib/sfx';
function getSfxOnce() {
  return getSfx();
}
