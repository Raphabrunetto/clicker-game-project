// client/src/app/layout.tsx

import type { Metadata } from 'next'
// 1. Importa a fonte 'Inter'
import { Inter } from 'next/font/google' 
import './globals.css'
import ThemeProgression from '@/components/theme/ThemeProgression'
import SfxProvider from '@/components/theme/SfxProvider'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

// 2. Inicializa a fonte na constante 'inter'
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Clicker Game',
  description: 'Nosso jogo clicker!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br" suppressHydrationWarning> 
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider defaultTheme="dark">
          <SfxProvider />
          {/* Applies visual stage classes based on currency */}
          <ThemeProgression />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
