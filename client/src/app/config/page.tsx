// client/src/app/config/page.tsx

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import OrbField from '@/components/theme/OrbField';
import { ModeToggle } from '@/components/theme/ModeToggle';
import { Badge } from '@/components/ui/badge';

export default function ConfigPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <OrbField />
      <div className="relative z-10 w-full max-w-3xl">
        <Card className="glass-panel border-white/10 bg-white/5 text-white">
          <CardHeader className="gap-4">
            <div>
              <CardTitle className="text-3xl font-semibold">Configuracoes</CardTitle>
              <CardDescription className="text-white/70">
                Ajuste a experiencia visual do jogo e deixe a interface do seu jeito.
              </CardDescription>
            </div>
            <CardAction>
              <ModeToggle />
            </CardAction>
          </CardHeader>
          <Separator className="opacity-40" />
          <CardContent className="space-y-6 pt-6">
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="glow">Tema</Badge>
                <span className="text-sm uppercase tracking-wide text-white/60">
                  Aparencia global
                </span>
              </div>
              <p className="text-sm text-white/70">
                Use o seletor no canto superior direito para alternar entre os temas disponiveis: claro,
                escuro ou seguir o padrao do sistema operacional. A escolha e aplicada automaticamente em
                todo o jogo - inclusive nos componentes animados e nas cores das tiers.
              </p>
            </section>
            <Separator className="opacity-10" />
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="subtle" className="bg-white/10 text-white/70">
                  Dica
                </Badge>
                <span className="text-sm uppercase tracking-wide text-white/60">
                  Som + tema
                </span>
              </div>
              <p className="text-sm text-white/70">
                Combine este ajuste com os novos timbres de clique para criar uma experiencia que combina
                com o stage atual. O modo escuro realca os efeitos neon enquanto o tema claro destaca os
                detalhes metalicos dos estagios iniciais.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
